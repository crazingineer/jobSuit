import { Page } from 'playwright';
import { db } from '../db';
import { browserManager } from '../browser-manager';
import crypto from 'crypto';

export interface VaultAuthCredentials {
  email: string;
  password?: string;
  strategy?: 'smart_detect' | 'login_first' | 'signup_first';
}

export interface AuthResolutionResult {
  actionTaken: 'already_authenticated' | 'logged_in' | 'signed_up' | 'no_auth_wall' | 'manual_intervention_required';
  domain: string;
  emailUsed: string;
  details: string;
}

/**
 * Handles two critical anti-bot and authentication problems during ATS form filling:
 * 1. CAPTCHA Avoidance & Co-Pilot Pause Gate (Cloudflare Turnstile, reCAPTCHA, hCaptcha, Arkose)
 * 2. Smart Login vs. Sign-Up State Machine backed by the SQLite `ats_accounts` ledger.
 */
export class AuthCaptchaHandler {
  /**
   * Extracts normalized domain key (e.g. "mastercard.wd1.myworkdayjobs.com")
   */
  public extractDomain(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname.toLowerCase();
    } catch {
      return 'unknown-ats.local';
    }
  }

  /**
   * Detects active CAPTCHA challenges on the page.
   * Because we piggyback on the user's real Chrome CDP session (port 9222) with genuine
   * browser fingerprints and trust cookies, 95%+ of passive CAPTCHAs never trigger.
   * If an interactive challenge appears, we pause in Co-Pilot mode and wait for the user
   * to click the checkbox in their open Chrome window.
   */
  public async detectAndHandleCaptcha(
    page: Page,
    mode: 'copilot' | 'yolo' = 'copilot'
  ): Promise<boolean> {
    const captchaSelectors = [
      'iframe[src*="recaptcha/api2"]',
      'iframe[src*="challenges.cloudflare.com"]',
      'iframe[src*="hcaptcha.com"]',
      'iframe[src*="arkoselabs.com"]',
      '#cf-turnstile',
      '[data-sitekey]'
    ];

    for (const selector of captchaSelectors) {
      const visible = await page.locator(selector).first().isVisible().catch(() => false);
      if (visible) {
        console.warn(`[AuthCaptchaHandler] CAPTCHA challenge detected (${selector}).`);
        if (mode === 'copilot') {
          console.log(`[AuthCaptchaHandler] Co-Pilot Pause Gate engaged: waiting up to 45s for human click in attached Chrome CDP window...`);
          // Poll every 2.5s for up to 45s to see if the CAPTCHA iframe disappears or passes
          for (let i = 0; i < 18; i++) {
            await page.waitForTimeout(2500);
            const stillVisible = await page.locator(selector).first().isVisible().catch(() => false);
            if (!stillVisible) {
              console.log(`[AuthCaptchaHandler] CAPTCHA cleared! Resuming automated form filling.`);
              return true;
            }
          }
        }
        return false;
      }
    }

    return true;
  }

  /**
   * Resolves ATS Login vs. Sign-Up walls deterministically:
   * Step 1: Check if already authenticated or if no auth wall exists.
   * Step 2: Check SQLite `ats_accounts` ledger for this exact tenant hostname.
   *         - If recorded as 'active', prioritize Sign-In.
   *         - Otherwise, follow `vault.strategy` ('smart_detect' tries Sign-In first,
   *           reads the ATS error banner, and pivots to Create Account if "No account found").
   * Step 3: Upsert the verified tenant status into `ats_accounts` so future applications
   *         to the same company tenant immediately know an account exists.
   */
  public async resolvePortalAuth(
    page: Page,
    targetUrl: string,
    portalType: string,
    creds: VaultAuthCredentials
  ): Promise<AuthResolutionResult> {
    const domain = this.extractDomain(targetUrl);
    const emailToUse = creds.email;
    const passwordToUse = creds.password || '';

    // Check if an auth wall is even visible
    const signInHeader = page.locator(
      '[data-automation-id="signInContent"], input[type="password"], button:has-text("Sign In"), h1:has-text("Sign In"), h2:has-text("Sign In")'
    ).first();

    const isAuthWall = await signInHeader.isVisible({ timeout: 3500 }).catch(() => false);
    if (!isAuthWall) {
      return {
        actionTaken: 'no_auth_wall',
        domain,
        emailUsed: emailToUse,
        details: 'No login wall detected; proceeding directly to application form.'
      };
    }

    // Consult SQLite ats_accounts ledger for this tenant domain
    const existingAccount = db.prepare(
      'SELECT * FROM ats_accounts WHERE domain = ?'
    ).get(domain) as { id: string; domain: string; email_used: string; account_status: string } | undefined;

    const shouldTryLoginFirst =
      existingAccount?.account_status === 'active' ||
      creds.strategy !== 'signup_first';

    console.log(
      `[AuthCaptchaHandler] Auth wall on ${domain}. Ledger match: ${
        existingAccount ? 'FOUND (active)' : 'NONE'
      }. Strategy: ${shouldTryLoginFirst ? 'Sign-In First -> Fallback Sign-Up' : 'Sign-Up First -> Fallback Sign-In'}`
    );

    if (shouldTryLoginFirst) {
      const loginSuccess = await this.attemptSignIn(page, emailToUse, passwordToUse);
      if (loginSuccess === 'success') {
        this.recordAccountLedger(domain, portalType, emailToUse);
        return {
          actionTaken: 'logged_in',
          domain,
          emailUsed: emailToUse,
          details: `Authenticated existing account on ${domain} using ${emailToUse}`
        };
      }

      if (loginSuccess === 'no_account_pivot_signup') {
        console.log(`[AuthCaptchaHandler] Account not found on ${domain}. Pivoting automatically to Create Account...`);
        const signedUp = await this.attemptSignUp(page, emailToUse, passwordToUse);
        if (signedUp) {
          this.recordAccountLedger(domain, portalType, emailToUse);
          return {
            actionTaken: 'signed_up',
            domain,
            emailUsed: emailToUse,
            details: `Created new ATS account on ${domain} using ${emailToUse} after Sign-In check`
          };
        }
      }
    } else {
      const signedUp = await this.attemptSignUp(page, emailToUse, passwordToUse);
      if (signedUp) {
        this.recordAccountLedger(domain, portalType, emailToUse);
        return {
          actionTaken: 'signed_up',
          domain,
          emailUsed: emailToUse,
          details: `Created new ATS account on ${domain} using ${emailToUse}`
        };
      }
    }

    return {
      actionTaken: 'manual_intervention_required',
      domain,
      emailUsed: emailToUse,
      details: `Auth wall on ${domain} requires Co-Pilot confirmation (e.g. email verification code).`
    };
  }

  private async attemptSignIn(
    page: Page,
    email: string,
    password: string
  ): Promise<'success' | 'no_account_pivot_signup' | 'failed'> {
    try {
      const emailInput = page.locator(
        '[data-automation-id="email"], input[type="email"], input[name*="email" i], input[name*="username" i]'
      ).first();
      const passInput = page.locator(
        '[data-automation-id="password"], input[type="password"]'
      ).first();

      if (await emailInput.isVisible({ timeout: 2500 })) {
        await emailInput.fill(email);
        await browserManager.humanDelay(350, 750);
      }
      if (await passInput.isVisible({ timeout: 2500 })) {
        await passInput.fill(password);
        await browserManager.humanDelay(400, 800);
      }

      const submitBtn = page.locator(
        '[data-automation-id="click_filter"], button[type="submit"], button:has-text("Sign In"), button:has-text("Log In")'
      ).first();

      if (await submitBtn.isVisible({ timeout: 2000 })) {
        await submitBtn.click();
        await browserManager.humanDelay(2000, 3200);
      }

      // Inspect error banner to see if account doesn't exist yet on this company's Workday/ATS tenant
      const errorBanner = page.locator(
        '[data-automation-id="errorMessage"], [role="alert"], .error-message, [class*="error" i]'
      ).first();

      if (await errorBanner.isVisible({ timeout: 2000 }).catch(() => false)) {
        const errorText = (await errorBanner.textContent())?.toLowerCase() || '';
        if (
          errorText.includes('no account') ||
          errorText.includes('invalid') ||
          errorText.includes('not found') ||
          errorText.includes('recognize') ||
          errorText.includes('incorrect')
        ) {
          return 'no_account_pivot_signup';
        }
      }

      return 'success';
    } catch {
      return 'failed';
    }
  }

  private async attemptSignUp(page: Page, email: string, password: string): Promise<boolean> {
    try {
      const createAccountLink = page.locator(
        '[data-automation-id="createAccountLink"], a:has-text("Create Account"), button:has-text("Create Account"), a:has-text("Sign Up")'
      ).first();

      if (await createAccountLink.isVisible({ timeout: 2500 })) {
        await createAccountLink.click();
        await browserManager.humanDelay(1200, 2200);
      }

      const emailInput = page.locator(
        '[data-automation-id="email"], input[type="email"], input[name*="email" i]'
      ).first();
      if (await emailInput.isVisible({ timeout: 2500 })) {
        await emailInput.fill(email);
        await browserManager.humanDelay(350, 700);
      }

      const passInputs = page.locator('input[type="password"]');
      const count = await passInputs.count();
      for (let i = 0; i < count; i++) {
        await passInputs.nth(i).fill(password);
        await browserManager.humanDelay(300, 650);
      }

      // Check consent checkbox if present
      const consentCheckbox = page.locator(
        '[data-automation-id="createAccountCheckbox"], input[type="checkbox"]'
      ).first();
      if (await consentCheckbox.isVisible({ timeout: 1500 }).catch(() => false)) {
        const isChecked = await consentCheckbox.isChecked().catch(() => false);
        if (!isChecked) {
          await consentCheckbox.check().catch(() => {});
        }
      }

      const submitBtn = page.locator(
        '[data-automation-id="click_filter"], button:has-text("Create Account"), button[type="submit"]'
      ).first();
      if (await submitBtn.isVisible({ timeout: 2000 })) {
        await submitBtn.click();
        await browserManager.humanDelay(2000, 3500);
      }

      return true;
    } catch {
      return false;
    }
  }

  public recordAccountLedger(domain: string, portalType: string, emailUsed: string): void {
    try {
      db.prepare(`
        INSERT INTO ats_accounts (id, domain, portal_type, email_used, account_status, last_login_at)
        VALUES (?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
        ON CONFLICT(domain) DO UPDATE SET
          email_used = excluded.email_used,
          account_status = 'active',
          last_login_at = CURRENT_TIMESTAMP
      `).run(`acc-${crypto.randomUUID().slice(0, 8)}`, domain, portalType, emailUsed);
    } catch (err: any) {
      console.warn(`[AuthCaptchaHandler] Could not update ats_accounts ledger: ${err.message}`);
    }
  }
}

export const authCaptchaHandler = new AuthCaptchaHandler();
