import { Page } from 'playwright';
import { db } from '../db';
import { PersonalVault } from '../../src/types/vault';
import {
  SomDomElement,
  AiDomActionDecision,
  planDomFormActions,
  getHpAm0238TxHardwareConfig
} from '../../src/utils/ai-agent-engine';

export interface UnmappedField {
  label: string;
  fieldType: 'text' | 'textarea' | 'radio' | 'select' | 'checkbox' | 'number';
  options?: string[];
  selector: string;
}

export class LlmDomFallback {
  /**
   * 1. PERCEIVE (browser-use / Skyvern style Set-of-Mark DOM Indexer)
   * Injects `data-jobsuite-som-id="1..N"` attributes onto all visible interactive
   * form controls and buttons on the page and returns a compact SomDomElement[] tree
   * that fits inside the 16K Q8_0 KV cache on the HP OMEN 16-am0238TX RTX 5060 (8GB VRAM).
   */
  public async extractInteractiveSomTree(page: Page): Promise<SomDomElement[]> {
    try {
      const elements = await page.evaluate(() => {
        const interactiveSelector =
          'input:not([type="hidden"]), textarea, select, button, [role="button"], [role="combobox"], [role="radio"], [role="checkbox"]';
        const nodes = Array.from(document.querySelectorAll(interactiveSelector));
        const somList: any[] = [];
        let somCounter = 1;

        for (const el of nodes) {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;

          const somId = somCounter++;
          el.setAttribute('data-jobsuite-som-id', String(somId));

          const rawTag = el.tagName.toLowerCase();
          const inputType = (el as HTMLInputElement).type?.toLowerCase() || rawTag;
          const id = el.id ? `#${el.id}` : '';
          const nameAttr = el.getAttribute('name') || '';

          let labelText =
            el.getAttribute('aria-label') ||
            el.getAttribute('placeholder') ||
            '';

          if (!labelText && el.id) {
            const explicitLabel = document.querySelector(`label[for="${el.id}"]`);
            if (explicitLabel) labelText = explicitLabel.textContent?.trim() || '';
          }
          if (!labelText) {
            const parentLabel = el.closest('label, .form-group, [data-automation-id]');
            if (parentLabel) {
              labelText = parentLabel.textContent?.replace(/\s+/g, ' ').trim().slice(0, 100) || '';
            }
          }
          if (!labelText && (rawTag === 'button' || el.getAttribute('role') === 'button')) {
            labelText = el.textContent?.replace(/\s+/g, ' ').trim() || 'Button';
          }

          let options: string[] | undefined;
          if (rawTag === 'select') {
            options = Array.from((el as HTMLSelectElement).options)
              .map((o) => o.text.trim())
              .filter(Boolean);
          }

          const mappedTag: SomDomElement['tag'] =
            inputType === 'file'
              ? 'file'
              : inputType === 'checkbox'
              ? 'checkbox'
              : inputType === 'radio'
              ? 'radio'
              : rawTag === 'select'
              ? 'select'
              : rawTag === 'textarea'
              ? 'textarea'
              : rawTag === 'button' || inputType === 'submit'
              ? 'button'
              : 'input';

          somList.push({
            somId,
            tag: mappedTag,
            inputType,
            label: labelText || nameAttr || `Field #${somId}`,
            placeholder: el.getAttribute('placeholder') || undefined,
            options,
            required: el.hasAttribute('required') || el.getAttribute('aria-required') === 'true',
            currentValue: (el as HTMLInputElement).value || '',
            selector: id || `[data-jobsuite-som-id="${somId}"]`,
            boundingBox: {
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              w: Math.round(rect.width),
              h: Math.round(rect.height)
            }
          });
        }
        return somList;
      });
      return elements;
    } catch (err: any) {
      console.warn(`[Set-of-Mark Extractor] Could not index live page DOM: ${err.message}`);
      return [];
    }
  }

  /**
   * 2. REASON (Local Ollama JSON Action Planner tuned for HP OMEN 16-am0238TX)
   * Calls Local Ollama (`qwen2.5:7b-instruct-q4_K_M` with 16K Q8_0 KV Cache and 14 CPU threads)
   * to decide where to click, what to fill, which option to select, and when to pause for Co-Pilot.
   * Falls back to deterministic Set-of-Mark reasoning when Ollama is offline.
   */
  public async decideActionsWithLocalLlm(
    elements: SomDomElement[],
    vault: PersonalVault,
    companyName: string = 'Target Company',
    tailoredPdfPath: string = 'data/cv_tailored/Master_Resume.pdf'
  ): Promise<{
    engineUsed: string;
    latencyMs: number;
    decisions: AiDomActionDecision[];
  }> {
    const startTime = Date.now();
    const hw = getHpAm0238TxHardwareConfig();
    const ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
    const modelName = hw.recommendedModels[0]?.ollamaTag || 'qwen2.5:7b-instruct-q4_K_M';

    const systemPrompt = `You are an autonomous browser form-filling AI agent (inspired by browser-use and Skyvern) running locally on an ${hw.deviceName} (${hw.gpu}).
You receive a Set-of-Mark (SoM) indexed DOM tree [somId: 1..N] and the candidate's Personal Vault.
For each element, output a JSON object with a "decisions" array specifying:
- somId (number)
- targetLabel (string)
- selector (string)
- action ("fill" | "select" | "click" | "upload" | "check" | "radio" | "wait_human")
- valueToEnter (string)
- confidence (number between 0.0 and 1.0)
- sourceAnchor (string)
- reasoning (concise explanation of why this action and value were chosen)
CRITICAL SAFETY RULE: Never auto-click a final "Submit Application" button in Co-Pilot mode — output action: "wait_human" for final submit buttons.`;

    const userPayload = JSON.stringify({
      companyName,
      tailoredPdfPath,
      candidateVault: {
        fullName: vault.fullName,
        email: vault.email,
        phone: vault.phone,
        location: vault.location,
        linkedinUrl: vault.linkedinUrl,
        githubUrl: vault.githubUrl,
        currentCtcLakhs: vault.currentCtcLakhs,
        expectedCtcLakhs: vault.expectedCtcLakhs,
        noticePeriodDays: vault.noticePeriodDays,
        buyoutAvailable: vault.buyoutAvailable,
        needsSponsorship: vault.needsSponsorship,
        relocationWilling: vault.relocationWilling,
        preferredLocations: vault.preferredLocations,
        qaSnippets: vault.qaSnippets
      },
      somElements: elements
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(`${ollamaHost}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: modelName,
          stream: false,
          format: 'json',
          options: {
            num_ctx: hw.ollamaModelfileParams.num_ctx,
            num_gpu: hw.ollamaModelfileParams.num_gpu,
            num_thread: hw.ollamaModelfileParams.num_thread,
            temperature: hw.ollamaModelfileParams.temperature
          },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPayload }
          ]
        })
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = (await response.json()) as any;
        const parsed = JSON.parse(data?.message?.content || '{}');
        if (Array.isArray(parsed.decisions) && parsed.decisions.length > 0) {
          return {
            engineUsed: `Ollama Local GPU (${modelName} on RTX 5060 8GB GDDR7)`,
            latencyMs: Date.now() - startTime,
            decisions: parsed.decisions
          };
        }
      }
    } catch {
      // Ollama daemon is offline or unreachable in cloud preview; use deterministic SoM planner
    }

    const fallbackDecisions = planDomFormActions(elements, vault, tailoredPdfPath, companyName);
    return {
      engineUsed: `Set-of-Mark AI Action Planner (Tuned for ${modelName} • HP AM0238TX Profile)`,
      latencyMs: Math.max(14, Date.now() - startTime),
      decisions: fallbackDecisions
    };
  }

  /**
   * 3. ACT & VERIFY (Executes the AI-planned Set-of-Mark decisions on a live Playwright Page)
   */
  public async executeAiActionPlan(
    page: Page,
    domain: string,
    decisions: AiDomActionDecision[]
  ): Promise<{ executedCount: number; pausedForHuman: boolean }> {
    let executedCount = 0;
    let pausedForHuman = false;

    for (const d of decisions) {
      if (d.action === 'wait_human') {
        console.log(`[AI DOM Agent] Pausing at SoM #${d.somId} (${d.targetLabel}): ${d.reasoning}`);
        pausedForHuman = true;
        break;
      }

      try {
        const handle =
          (await page.$(`[data-jobsuite-som-id="${d.somId}"]`)) ||
          (await page.$(d.selector));

        if (!handle) continue;

        if (d.action === 'fill') {
          await handle.fill(d.valueToEnter);
          executedCount++;
        } else if (d.action === 'select') {
          await handle.selectOption({ label: d.valueToEnter }).catch(async () => {
            await handle.selectOption({ index: 1 });
          });
          executedCount++;
        } else if (d.action === 'upload') {
          await handle.setInputFiles(d.valueToEnter);
          executedCount++;
        } else if (d.action === 'check' || d.action === 'radio' || d.action === 'click') {
          await handle.click();
          executedCount++;
        }

        db.prepare(`
          INSERT OR REPLACE INTO dom_selector_cache (
            domain, field_signature, selector_path, confidence, last_used_at
          ) VALUES (?, ?, ?, ?, datetime('now'))
        `).run(domain, d.targetLabel.trim(), d.selector, d.confidence);
      } catch (err: any) {
        console.warn(`[AI DOM Agent] Failed action ${d.action} on SoM #${d.somId}: ${err.message}`);
      }
    }

    return { executedCount, pausedForHuman };
  }

  /**
   * Resolves single unmapped application questions against the Personal Fact Vault
   * and caches the selector in SQLite dom_selector_cache for self-healing reuse.
   */
  public async resolveAndFillField(
    page: Page,
    domain: string,
    field: UnmappedField,
    vault: PersonalVault,
    blockHAnswers?: Record<string, string>
  ): Promise<boolean> {
    const somElement: SomDomElement = {
      somId: 1,
      tag:
        field.fieldType === 'select'
          ? 'select'
          : field.fieldType === 'textarea'
          ? 'textarea'
          : field.fieldType === 'checkbox'
          ? 'checkbox'
          : field.fieldType === 'radio'
          ? 'radio'
          : 'input',
      inputType: field.fieldType,
      label: field.label,
      options: field.options,
      required: true,
      selector: field.selector
    };

    const { decisions } = await this.decideActionsWithLocalLlm([somElement], vault);
    const decision = decisions[0];
    if (!decision) return false;

    const answerValue =
      blockHAnswers?.why_apply && field.label.toLowerCase().includes('why')
        ? blockHAnswers.why_apply
        : decision.valueToEnter;

    console.log(
      `[AI DOM Agent] Field: "${field.label}" [${field.fieldType}] -> Action: ${decision.action} ("${answerValue}")`
    );

    try {
      if (field.fieldType === 'text' || field.fieldType === 'textarea' || field.fieldType === 'number') {
        const input = await page.$(field.selector);
        if (input) {
          await input.fill(String(answerValue));
        }
      } else if (field.fieldType === 'select') {
        const select = await page.$(field.selector);
        if (select) {
          await select.selectOption({ label: String(answerValue) }).catch(async () => {
            await select.selectOption({ index: 1 });
          });
        }
      } else if (field.fieldType === 'radio') {
        const radio = await page.$(`input[type="radio"]:near(:text("${answerValue}"))`);
        if (radio) {
          await radio.click();
        }
      } else if (field.fieldType === 'checkbox') {
        const checkbox = await page.$(field.selector);
        if (checkbox) {
          await checkbox.check();
        }
      }

      db.prepare(`
        INSERT OR REPLACE INTO dom_selector_cache (
          domain, field_signature, selector_path, confidence, last_used_at
        ) VALUES (
          ?, ?, ?, ?, datetime('now')
        )
      `).run(domain, field.label.trim(), field.selector, decision.confidence);

      return true;
    } catch (fillErr: any) {
      console.warn(`[DOM Fill Error] Could not fill ${field.label}: ${fillErr.message}`);
      return false;
    }
  }
}

export const llmDomFallback = new LlmDomFallback();
