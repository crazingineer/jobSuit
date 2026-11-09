import React from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Send, 
  Sparkles, 
  RefreshCw, 
  Terminal, 
  ChevronRight,
  ShieldCheck,
  FileCheck
} from 'lucide-react';

export interface ProgressStep {
  title: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  detail?: string;
}

export interface OperationState {
  isOpen: boolean;
  title: string;
  subtitle: string;
  icon: 'discovery' | 'booster' | 'evaluator' | 'tailor' | 'apply' | 'system';
  currentStepIndex: number;
  steps: ProgressStep[];
  logs: string[];
  isComplete: boolean;
  hasError: boolean;
  errorMessage?: string;
  actionRequired?: {
    type: 'co_pilot_confirm';
    label: string;
    onConfirm: () => void;
  };
}

interface OperationProgressModalProps {
  state: OperationState;
  onClose: () => void;
}

export const OperationProgressModal: React.FC<OperationProgressModalProps> = ({ state, onClose }) => {
  if (!state.isOpen) return null;

  const progressPercent = Math.min(
    100,
    Math.round(((state.currentStepIndex + (state.isComplete ? 1 : 0)) / Math.max(1, state.steps.length)) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl glass-panel border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] bg-[#0c0d16]/95">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-purple-950/20 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              {state.isComplete ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-in zoom-in" />
              ) : state.hasError ? (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {state.title}
                <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full ${
                  state.isComplete ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  state.hasError ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                  'bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse'
                }`}>
                  {state.isComplete ? 'Finished' : state.hasError ? 'Attention Needed' : 'Running'}
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">{state.subtitle}</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full bg-white/[0.04] h-1.5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Step Sequence */}
          <div className="space-y-2.5">
            {state.steps.map((step, idx) => {
              const isActive = idx === state.currentStepIndex && !state.isComplete && !state.hasError;
              const isPast = idx < state.currentStepIndex || state.isComplete;
              const isFailed = idx === state.currentStepIndex && state.hasError;

              return (
                <div 
                  key={idx}
                  className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                    isActive 
                      ? 'bg-purple-600/10 border-purple-500/30 shadow-md shadow-purple-900/20' 
                      : isPast 
                      ? 'bg-white/[0.02] border-white/[0.04]' 
                      : isFailed
                      ? 'bg-rose-950/20 border-rose-900/40'
                      : 'opacity-40 border-transparent'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isActive ? (
                      <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                    ) : isFailed ? (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-zinc-600 flex items-center justify-center text-[10px] text-zinc-500">
                        {idx + 1}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-0.5">
                    <div className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
                      <span>{step.title}</span>
                      {isActive && <span className="text-[10px] font-mono text-purple-400">Processing...</span>}
                    </div>
                    {step.detail && (
                      <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">
                        {step.detail}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Co-Pilot Interactive Checkpoint Gate */}
          {state.actionRequired && state.actionRequired.type === 'co_pilot_confirm' && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-500/30 space-y-3 animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Co-Pilot Verification Checkpoint
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                All application fields, CTC numbers, and the tailored ATS resume have been injected into the portal. The bot is paused at the final submit step for your review.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white"
                >
                  Keep Draft
                </button>
                <button
                  onClick={() => state.actionRequired?.onConfirm()}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{state.actionRequired.label}</span>
                </button>
              </div>
            </div>
          )}

          {/* Live Engine Stream Log Drawer */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-purple-400" />
                Live Engine Stream
              </span>
              <span>{state.logs.length} events logged</span>
            </div>
            <div className="h-32 p-3 rounded-xl bg-black/60 border border-white/[0.06] overflow-y-auto font-mono text-[11px] space-y-1 text-zinc-400">
              {state.logs.map((log, lIdx) => (
                <div key={lIdx} className="leading-relaxed">
                  <span className="text-zinc-600">&gt;</span> {log}
                </div>
              ))}
              {state.logs.length === 0 && (
                <div className="text-zinc-600 italic">Awaiting execution output...</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-white/[0.01] flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 font-mono">
            jobSuite Native Desktop Runtime • Zero Command Prompt Needed
          </span>

          <div className="flex items-center gap-2">
            {state.isComplete && (
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-xs font-semibold text-white transition-colors"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
