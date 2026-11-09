import { Page } from 'playwright';
import { db } from '../db';
import { PersonalVault } from '../../src/types/vault';

export interface UnmappedField {
  label: string;
  fieldType: 'text' | 'textarea' | 'radio' | 'select' | 'checkbox' | 'number';
  options?: string[];
  selector: string;
}

export class LlmDomFallback {
  /**
   * Resolves unmapped application questions against the Personal Fact Vault
   * and caches the selector in SQLite dom_selector_cache for self-healing reuse.
   */
  public async resolveAndFillField(
    page: Page,
    domain: string,
    field: UnmappedField,
    vault: PersonalVault,
    blockHAnswers?: Record<string, string>
  ): Promise<boolean> {
    const labelLower = field.label.toLowerCase();

    // 1. Check cache first
    const cached = db.prepare(`
      SELECT selector_path FROM dom_selector_cache 
      WHERE domain = ? AND field_signature = ?
    `).get(domain, field.label.trim()) as any;

    if (cached) {
      console.log(`[DOM Cache Hit] ${domain} :: "${field.label}" -> ${cached.selector_path}`);
    }

    // 2. Deterministic resolution against Personal Vault & Block H
    let answerValue: string | boolean | number | null = null;

    // Notice Period
    if (labelLower.includes('notice') || labelLower.includes('joining period') || labelLower.includes('how soon')) {
      if (field.options && field.options.length > 0) {
        // Find closest matching option (e.g. "60 days" or "1 to 2 months")
        answerValue = field.options.find(opt => 
          opt.includes(`${vault.noticePeriodDays}`) || 
          opt.toLowerCase().includes('2 months') || 
          opt.toLowerCase().includes('60')
        ) || field.options[0];
      } else {
        answerValue = `${vault.noticePeriodDays} days (buyout negotiable)`;
      }
    }
    // Current CTC
    else if (labelLower.includes('current ctc') || labelLower.includes('current salary') || labelLower.includes('present ctc')) {
      answerValue = `${vault.currentCtcLakhs} LPA`;
    }
    // Expected CTC
    else if (labelLower.includes('expected ctc') || labelLower.includes('expected salary') || labelLower.includes('salary expectation')) {
      answerValue = `${vault.expectedCtcLakhs} LPA (negotiable)`;
    }
    // Total Experience
    else if (labelLower.includes('years of experience') || labelLower.includes('total experience') || labelLower.includes('how many years')) {
      answerValue = '6';
    }
    // Work Authorization / Visa
    else if (labelLower.includes('sponsorship') || labelLower.includes('require visa') || labelLower.includes('authorized to work')) {
      if (labelLower.includes('require') || labelLower.includes('need')) {
        answerValue = vault.needsSponsorship ? 'Yes' : 'No';
      } else {
        answerValue = 'Yes';
      }
    }
    // Relocation
    else if (labelLower.includes('relocate') || labelLower.includes('willing to move')) {
      answerValue = vault.relocationWilling ? 'Yes' : 'No';
    }
    // Preferred Location
    else if (labelLower.includes('preferred location') || labelLower.includes('city')) {
      answerValue = vault.preferredLocations[0] || 'Bengaluru';
    }
    // Why work here / Open-ended
    else if (labelLower.includes('why') || labelLower.includes('interest') || labelLower.includes('cover letter')) {
      answerValue = blockHAnswers?.why_apply || vault.qaSnippets.why_change || 'Excited to apply my AI and distributed systems experience to your team.';
    }
    // Fallback Q&A
    else {
      answerValue = 'Yes';
    }

    console.log(`[DOM Fallback] Field: "${field.label}" [${field.fieldType}] -> Filling: "${answerValue}"`);

    // 3. Fill the field in the DOM
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

      // 4. Cache resolved selector in SQLite
      db.prepare(`
        INSERT OR REPLACE INTO dom_selector_cache (
          domain, field_signature, selector_path, confidence, last_used_at
        ) VALUES (
          ?, ?, ?, 1.0, datetime('now')
        )
      `).run(domain, field.label.trim(), field.selector);

      return true;
    } catch (fillErr: any) {
      console.warn(`[DOM Fill Error] Could not fill ${field.label}: ${fillErr.message}`);
      return false;
    }
  }
}

export const llmDomFallback = new LlmDomFallback();
