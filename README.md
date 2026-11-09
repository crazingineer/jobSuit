# jobSuite (Windows Native AI Job Automation & Career-Ops Desktop App)

> **Zero Command-Prompt UX**: A lightweight, modern Windows desktop application that automates job discovery, structured evaluation (Blocks A–H), grounded CV/Cover Letter tailoring (<500ms PDF generation), daily profile boosting (Naukri 9 AM Refresh), and 1-click ATS application submissions across **LinkedIn**, **Naukri.com**, **Workday**, **Greenhouse**, **Lever**, and **Ashby**.

---

## 1. Quick Launch (No Command Prompt Needed!)

Simply double-click either launcher script in the project root:

- **`Launch-jobSuite-AppWindow.bat`** *(Recommended)*: Launches jobSuite in a dedicated, borderless Windows native app window with Mica/Acrylic dark styling (no browser address bar, feels identical to a native desktop app).
- **`Launch-jobSuite.bat`**: Launches the local SQLite/Playwright engine and opens the interface in your default browser.

Both scripts automatically start the local backend engine on `http://127.0.0.1:4173` and the React desktop interface on `http://localhost:5173`.

---

## 2. Core Functional Modules

### 🏛️ Module A: Personal Fact Vault & Master CV
- **Indian Recruitment Fields**: Current CTC (LPA INR), Expected CTC, CTC Negotiable toggle, Official Notice Period (Days), Last Working Day (LWD), and Notice Buyout Available toggle.
- **Global Recruitment Fields**: Work authorization countries, relocation willingness, visa sponsorship requirements, EEO disclosures, and behavioural Q&A snippets.
- **Master CV JSON Schema**: Modular work experience with impact bullets, skills taxonomy, certifications, projects, and education.
- **Master Resume ATS Compiler**: Compiles your master resume to `data/cv_tailored/Master_Resume.pdf` via Playwright in **~380ms** with in-app PDF preview.

### ⚡ Module B: Naukri.com Daily Profile Booster ("The 9 AM Refresh")
- Triggers daily at 08:55 AM IST (+/- 15 minutes random jitter) to beat portal ranking algorithms.
- **Automation Flow**: Connects to your persistent Chrome session via Chrome DevTools Protocol (CDP), re-uploads the designated Master Resume PDF to refresh the "Profile Last Updated" timestamp, and micro-edits the headline (e.g. toggling a trailing period `.`) to trigger Naukri's recruiter search bump.
- **1-Click Control**: Run on-demand from the UI or arm the Windows Task Scheduler hook with 1 click directly inside the Settings or Command Center view.

### 🧭 Module C: Multi-Portal Discovery & `career-ops` Evaluator
- **Multi-Portal Scrapers**: LinkedIn Easy Apply, Naukri Freshness filter, and direct ATS boards (Greenhouse, Lever, Ashby, Workday).
- **career-ops Evaluation (Blocks A through H)**:
  - **Block A**: Role Summary & Authorization fit.
  - **Block B**: Two-pass requirement matching (`explicit` vs `inferred` evidence gating).
  - **Block C**: Strategic positioning and targeted archetype classification.
  - **Block D**: Compensation and seniority calibration.
  - **Block E**: Grounded bullet personalization diffs (strictly anchored to Master CV).
  - **Block F**: Anticipated recruiter interview questions.
  - **Block G**: 22-signal Ghost-Job and legitimacy detector (Flags evergreen spam, agency dumps, and stale roles).
  - **Block H**: Draft ATS form answers.
  - **1.0 to 5.0 Holistic Score**: Jobs scoring $\ge 4.0$ are automatically qualified and queued for tailoring.

### 📄 Module D: Hallucination-Free CV & Cover Letter Generator
- **Strict Grounding Rule**: Zero hallucinated skills, metrics, or employers. The engine only selects, highlights, and rephrases verified facts from your Master CV JSON.
- **Ultra-Fast PDF Compilation**: Compiles both a tailored ATS resume and a high-impact cover letter to PDF in **under 450ms**.
- **In-App PDF Viewer**: View the rendered PDF directly inside the job drawer or toggle to view side-by-side bullet diffs vs your master resume.

### 🤖 Module E: 3-Layer Auto-Applier & ATS Form Engine
- **Co-Pilot Mode**: The engine fills every question (CTC, notice period, work history, dynamic forms), uploads your tailored PDF resume, and pauses at the final review step for your 1-click confirmation.
- **Auto-Pilot Mode**: Executes end-to-end unattended submission with rate-limiting safety guards.
- **Portal Adapters**:
  - **LinkedIn Easy Apply**: Handles multi-step modals, custom questions, and document injection.
  - **Naukri Apply**: Handles 1-click apply and Naukri's internal chatbot/drawer questionnaire.
  - **Workday**: Handles `data-automation-id` selectors, work history blocks, and EEO dropdowns.
  - **Greenhouse / Lever / Ashby**: Standard form population and PDF file injection.
- **LLM DOM Fallback & SQLite Selector Cache**: Extracts unmapped questions, resolves them against the Personal Fact Vault using an LLM, and caches the selector mapping in SQLite.

---

## 3. Beautiful In-App Multi-Step Progress Stepper

Whenever an operation is triggered in the UI (Discovery Scan, Naukri Booster, Re-Evaluating a JD, Compiling a PDF, or Applying to a Job):

1. **Animated Progress Modal**: Displays active multi-stage checkmarks (`Attaching Browser Session` → `Navigating` → `Injecting Vault` → `Uploading PDF` → `Review Checkpoint`).
2. **Live Streaming Log Terminal**: Shows real-time browser actions, CDP logs, and safety checks.
3. **Interactive Co-Pilot Checkpoint**: When running in Co-Pilot mode, the stepper pauses at the final submission stage, presents an alert card, and lets you inspect and confirm submission with a single button.

---

## 4. UI Architecture & Views

| View | Capabilities |
| :--- | :--- |
| **Command Center** | Live Naukri booster status, 1-click "Run Discovery Scan", 1-click "Boost Profile Now", 1-click "Launch Chrome CDP", funnel metrics, and recent activity logs. |
| **Job Pipeline** | Kanban & Table views across 6 stages (`Discovered` → `Evaluated` → `Tailored` → `Queued` → `Applied` → `Interview`). Clicking any card opens the detailed side-drawer. |
| **Evaluation Drawer** | Full `career-ops` Blocks A–H report, Block G legitimacy badge, interactive in-app PDF document viewer, bullet diff cards, and 1-click Co-Pilot applier. |
| **Master Vault & Studio** | Visual editor for Indian & Global recruitment fields (CTC, notice period, EEO), work experience impact bullets, and live in-app Master ATS PDF preview. |
| **Automation Rules** | Daily application limits, human delay sliders (8–25s), company & keyword blacklists, and platform Co-Pilot toggles. |
| **Settings & BYOK** | LLM API keys (Gemini, Claude, OpenAI, Ollama), 1-click Chrome CDP launcher, and 1-click Windows Task Scheduler arming. |

---

## 5. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Lucide Icons.
- **Desktop Framework**: Windows Native App Mode (Edge/Chromium WebView2) + Tauri v2 ready (`src-tauri/`).
- **Automation & Scraping Engine**: Playwright with `playwright-extra` + `puppeteer-extra-plugin-stealth` connecting via Chrome DevTools Protocol (CDP) to persistent profiles (`--remote-debugging-port=9222`).
- **Database**: Local SQLite (`data/jobsuite.db`) via `better-sqlite3` in WAL mode.
- **PDF Compilation**: Headless Chromium print-to-PDF from clean semantic ATS HTML/CSS templates (<500ms).
