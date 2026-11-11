import React, { useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Terminal,
  X,
  Sparkles,
  Rocket,
  Send,
  Search,
  AlertTriangle,
  Monitor
} from 'lucide-react';
import { InlineLiveBrowser, LiveSessionData } from './InlineLiveBrowser';

export interface OperationStep {
  title: string;
  status: 'pending' | 'active' | 'done' | 'error';
  detail?: string;
}

export interface VisualBrowserField {
  id: string;
  somTag: string;
  label: string;
  selector: string;
  value: string;
  type: 'text' | 'file' | 'select' | 'textarea';
  stepTrigger: number;
  cursorX: number;
  cursorY: number;
}

export interface VisualBrowserConfig {
  mode: 'booster_dry_run' | 'booster_live' | 'copilot_apply' | 'autopilot_apply' | 'discovery_scan';
  url: string;
  portalName: string;
  companyName?: string;
  roleTitle?: string;
  location?: string;
  region?: 'CA' | 'IN';
  jobId?: string;
  fields: VisualBrowserField[];
}

export interface OperationState {
  isOpen: boolean;
  title: string;
  subtitle: string;
  icon: 'booster' | 'discovery' | 'apply';
  currentStepIndex: number;
  steps: OperationStep[];
  logs: string[];
  isComplete: boolean;
  hasError: boolean;
  visualBrowser?: VisualBrowserConfig;
  actionRequired?: {
    type: 'co_pilot_confirm';
    label: string;
    onConfirm: (editedFields?: Record<string, string>) => void;
  };
}

interface OperationProgressModalProps {
  state: OperationState;
  onClose: () => void;
}

export const OperationProgressModal: React.FC<OperationProgressModalProps> = ({ state, onClose }) => {
  const [liveSession, setLiveSession] = useState<LiveSessionData | null>(null);

  if (!state.isOpen) return null;

  const getHeaderIcon = () => {
    switch (state.icon) {
      case 'booster':
        return <Rocket className="w-5 h-5 text-amber-500" />;
      case 'discovery':
        return <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'apply':
        return <Send className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  const vb = state.visualBrowser;
  const combinedLogs = liveSession?.logs && liveSession.logs.length > 0 ? liveSession.logs : state.logs;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-6xl rounded-2xl bg-white dark:bg-[#0e121e] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#131826] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
              {getHeaderIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  {state.title}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  · {vb?.region === 'CA' ? '🇨🇦 Canada (+1 289-890-3999)' : '🇮🇳 India (+91 7276085461)'}
                </span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono inline-flex items-center gap-1 font-medium">
                  · <Monitor className="w-3.5 h-3.5" /> Real Inline Chromium
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
                {state.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close live browser modal"
            className="h-8 w-8 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
            title="Close window"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main 2-Column Body: Left = Real Inline Chromium Browser Stream (7 cols), Right = Pipeline Stages & Telemetry (5 cols) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          {/* Left Column: Real Inline Headless Chromium Browser Window */}
          <div className="lg:col-span-7 p-4 sm:p-5 bg-slate-50/70 dark:bg-[#090c14] flex flex-col justify-center">
            {vb ? (
              <InlineLiveBrowser
                mode={vb.mode}
                url={vb.url}
                portalName={vb.portalName}
                companyName={vb.companyName}
                roleTitle={vb.roleTitle}
                location={vb.location}
                region={vb.region}
                jobId={vb.jobId}
                fields={vb.fields}
                onSessionUpdate={(sess) => setLiveSession(sess)}
                onSubmitted={(edited) => {
                  state.actionRequired?.onConfirm(edited);
                }}
              />
            ) : (
              <div className="p-12 text-center text-xs font-mono text-slate-500 dark:text-slate-400">
                Initializing live Chromium viewport...
              </div>
            )}
          </div>

          {/* Right Column: Step Progress, Live Console & Co-Pilot Submit Gate */}
          <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between space-y-4 bg-white dark:bg-[#0e121e]">
            <div className="space-y-4">
              {/* Step Checklist */}
              <div>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
                  Playwright Chromium Execution Stages
                </div>
                <div className="space-y-2">
                  {state.steps.map((step, index) => {
                    let stepStatus: 'pending' | 'active' | 'done' | 'error' = 'pending';
                    if (state.hasError && index === state.currentStepIndex) {
                      stepStatus = 'error';
                    } else if (
                      state.isComplete ||
                      liveSession?.status === 'completed' ||
                      index < state.currentStepIndex
                    ) {
                      stepStatus = 'done';
                    } else if (index === state.currentStepIndex) {
                      stepStatus = 'active';
                    }

                    return (
                      <div
                        key={index}
                        className={`p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                          stepStatus === 'active'
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-500/40 text-slate-900 dark:text-white'
                            : stepStatus === 'done'
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/15 border-emerald-200 dark:border-emerald-500/25 text-slate-800 dark:text-slate-200'
                              : stepStatus === 'error'
                                ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200'
                                : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-500'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {stepStatus === 'done' && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          )}
                          {stepStatus === 'active' && (
                            <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
                          )}
                          {stepStatus === 'error' && (
                            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          )}
                          {stepStatus === 'pending' && (
                            <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] font-mono">
                              {index + 1}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold">{step.title}</div>
                          {step.detail && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 leading-snug">
                              {step.detail}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Co-Pilot Interactive Confirmation Gate */}
              {state.actionRequired && (
                <div className="p-3.5 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/35 border border-indigo-200 dark:border-indigo-500/40 space-y-2.5">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      Co-Pilot Review Gate — Ready to Submit
                    </div>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                      All form inputs in the live Chromium browser on the left have been populated with your{' '}
                      <strong>
                        {vb?.region === 'CA'
                          ? 'Canadian (+1 289-890-3999 & Work Permit)'
                          : 'Indian (+91 7276085461)'}
                      </strong>{' '}
                      profile and tailored Jake&apos;s Resume PDF. You can click directly in the live browser window or edit inputs below before submitting.
                    </p>
                  </div>
                  <button
                    onClick={() => state.actionRequired?.onConfirm()}
                    className="w-full h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{state.actionRequired.label}</span>
                  </button>
                </div>
              )}

              {/* Live Execution Trace */}
              <div className="rounded-xl bg-slate-900 dark:bg-black/70 border border-slate-800 overflow-hidden">
                <div className="px-3 py-1.5 bg-slate-800/70 border-b border-slate-700/70 flex items-center justify-between text-[10px] font-mono text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3 h-3 text-indigo-400" />
                    Playwright Chromium &amp; SQLite Telemetry
                  </span>
                  <span className="tabular-nums">
                    {state.isComplete || liveSession?.status === 'completed' ? 'COMPLETE' : 'LIVE STREAM'}
                  </span>
                </div>
                <div className="p-3 max-h-36 overflow-y-auto font-mono text-[10.5px] space-y-1 text-slate-300">
                  {combinedLogs.map((log, i) => (
                    <div key={i} className="leading-relaxed">
                      <span
                        className={
                          log.includes('SUCCESS') || log.includes('Submitted')
                            ? 'text-emerald-400 font-semibold'
                            : log.includes('ERROR')
                              ? 'text-rose-400'
                              : 'text-slate-300'
                        }
                      >
                        {log}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                {state.isComplete || liveSession?.status === 'completed' ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Synced with Local SQLite Database
                  </span>
                ) : state.actionRequired ? (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    Awaiting Co-Pilot confirmation
                  </span>
                ) : (
                  <span>Streaming live Chromium viewport...</span>
                )}
              </div>

              <button
                onClick={onClose}
                className="h-8 px-4 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                {state.isComplete || liveSession?.status === 'completed' ? 'Done' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
