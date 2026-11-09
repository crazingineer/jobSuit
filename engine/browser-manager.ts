import { chromium as chromiumExtra } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { BrowserContext, Page, chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

// Attach stealth evasions
chromiumExtra.use(stealthPlugin());

export interface BrowserManagerConfig {
  userDataDir?: string;
  cdpEndpoint?: string; // e.g. "http://127.0.0.1:9222"
  headless?: boolean;
}

export class BrowserManager {
  private context: BrowserContext | null = null;
  private isCdp: boolean = false;

  public async humanDelay(minMs: number = 800, maxMs: number = 2500): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  public async humanType(page: Page, selector: string, text: string): Promise<void> {
    await page.click(selector);
    await this.humanDelay(200, 400);

    for (const char of text) {
      await page.keyboard.type(char, { delay: Math.floor(Math.random() * 80) + 40 });
      if (Math.random() < 0.08) {
        await this.humanDelay(150, 350);
      }
    }
  }

  /**
   * Connects via CDP or falls back to an accessible persistent profile directory
   */
  public async getContext(config?: BrowserManagerConfig): Promise<BrowserContext> {
    if (this.context) {
      return this.context;
    }

    const cdpUrl = config?.cdpEndpoint || process.env.CDP_ENDPOINT || 'http://127.0.0.1:9222';

    // 1. First Attempt: Connect via Chrome DevTools Protocol (CDP) to running Chrome
    try {
      console.log(`[BrowserManager] Checking CDP endpoint at: ${cdpUrl}`);
      const browser = await chromium.connectOverCDP(cdpUrl, { timeout: 2500 });
      const contexts = browser.contexts();
      this.context = contexts.length > 0 ? contexts[0] : await browser.newContext();
      this.isCdp = true;
      console.log('[BrowserManager] Connected to active Chrome/Edge instance via CDP!');
      return this.context;
    } catch {
      console.log('[BrowserManager] CDP endpoint not active on port 9222.');
    }

    // 2. Second Attempt: User's custom or default profile
    const dedicatedDir = path.resolve(process.cwd(), 'data', 'browser_profile');
    if (!fs.existsSync(dedicatedDir)) {
      fs.mkdirSync(dedicatedDir, { recursive: true });
    }

    const targetDir = config?.userDataDir || dedicatedDir;
    console.log(`[BrowserManager] Launching isolated persistent profile at: ${targetDir}`);

    try {
      this.context = await (chromiumExtra as any).launchPersistentContext(targetDir, {
        headless: config?.headless ?? false,
        args: [
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-blink-features=AutomationControlled'
        ],
        viewport: { width: 1440, height: 900 }
      });
      this.isCdp = false;
      return this.context!;
    } catch (err: any) {
      if (targetDir !== dedicatedDir) {
        console.warn(`[BrowserManager] Profile locked at ${targetDir}. Falling back to dedicated jobSuite profile...`);
        this.context = await (chromiumExtra as any).launchPersistentContext(dedicatedDir, {
          headless: config?.headless ?? false,
          args: ['--disable-blink-features=AutomationControlled'],
          viewport: { width: 1440, height: 900 }
        });
        this.isCdp = false;
        return this.context!;
      }
      throw err;
    }
  }

  public async testSessionStatus(config?: BrowserManagerConfig): Promise<{
    connected: boolean;
    isCdp: boolean;
    linkedinLogged: boolean;
    naukriLogged: boolean;
    message: string;
  }> {
    try {
      const context = await this.getContext(config);
      const cookies = await context.cookies(['https://www.linkedin.com', 'https://www.naukri.com']);

      const hasLinkedInSession = cookies.some(c => c.name === 'li_at' || c.name === 'JSESSIONID');
      const hasNaukriSession = cookies.some(c => c.name === 'naukri_auth' || c.name === 'AUTH_TOKEN' || c.name === 'c_cookie');

      return {
        connected: true,
        isCdp: this.isCdp,
        linkedinLogged: hasLinkedInSession,
        naukriLogged: hasNaukriSession,
        message: `Browser attached (${this.isCdp ? 'CDP Port 9222' : 'Dedicated Profile'}). Sessions: LinkedIn [${hasLinkedInSession ? 'Logged In' : 'Need Login'}], Naukri [${hasNaukriSession ? 'Logged In' : 'Need Login'}]`
      };
    } catch (err: any) {
      return {
        connected: false,
        isCdp: false,
        linkedinLogged: false,
        naukriLogged: false,
        message: `Failed to attach browser: ${err.message}`
      };
    }
  }

  public async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
  }
}

export const browserManager = new BrowserManager();
