import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  RefreshCw,
  ExternalLink,
  Loader2,
  MousePointerClick,
  ArrowUp,
  ArrowDown,
  Send,
  CheckCircle2,
  SlidersHorizontal,
  Keyboard
} from 'lucide-react';

export interface InlineBrowserField {
  id: string;
  somTag: string;
  label: string;
  selector: string;
  value: string;
  type: 'text' | 'file' | 'select' | 'textarea';
  stepTrigger?: number;
}

export interface LiveSessionData {
  sessionId: string;
  mode: string;
  url: string;
  pageTitle: string;
  channelType?: 'direct_ats' | 'linkedin_external_ats' | 'linkedin_easy_apply' | 'booster' | 'discovery';
  status: 'starting' | 'running' | 'awaiting_copilot' | 'completed' | 'error';
  stepIndex: number;
  totalSteps: number;
  currentAction: string;
  cursorX: number;
  cursorY: number;
  scrollY: number;
  frameBase64: string | null;
  frameTimestamp: number;
  logs: string[];
  fields: InlineBrowserField[];
}

interface InlineLiveBrowserProps {
  mode:
    | 'booster_dry_run'
    | 'booster_live'
    | 'copilot_apply'
    | 'autopilot_apply'
    | 'discovery_scan'
    | 'interactive_agent';
  url: string;
  portal?: string;
  easyApply?: boolean;
  externalApplyUrl?: string;
  atsProvider?: string;
  portalName?: string;
  companyName?: string;
  roleTitle?: string;
  location?: string;
  region?: 'CA' | 'IN';
  jobId?: string;
  fields?: InlineBrowserField[];
  onSessionUpdate?: (session: LiveSessionData) => void;
  onSubmitted?: (editedFields: Record<string, string>) => void;
  compact?: boolean;
}

export const InlineLiveBrowser: React.FC<InlineLiveBrowserProps> = ({
  mode,
  url,
  portal,
  easyApply,
  externalApplyUrl,
  atsProvider,
  portalName,
  companyName,
  roleTitle,
  location,
  region,
  jobId,
  fields = [],
  onSessionUpdate,
  onSubmitted,
  compact = false
}) => {
  const [session, setSession] = useState<LiveSessionData | null>(null);
  const [addressInput, setAddressInput] = useState<string>(url);
  const [keyboardInput, setKeyboardInput] = useState<string>('');
  const [isStarting, setIsStarting] = useState<boolean>(true);
  const [isInteracting, setIsInteracting] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showQuickEdit, setShowQuickEdit] = useState<boolean>(false);
  const [fieldEdits, setFieldEdits] = useState<Record<string, string>>({});
  const imgRef = useRef<HTMLImageElement | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const discoveredFields = session?.fields && session.fields.length > 0 ? session.fields : fields;

  useEffect(() => {
    const map: Record<string, string> = {};
    discoveredFields.forEach((f) => {
      map[f.id] = f.value;
    });
    setFieldEdits((prev) => ({ ...map, ...prev }));
  }, [session?.fields?.length, url, roleTitle]);

  const startNewLiveSession = async (overrideUrl?: string) => {
    setIsStarting(true);
    try {
      const res = await fetch('/api/browser/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          url: overrideUrl || url,
          portal,
          easyApply,
          externalApplyUrl,
          atsProvider,
          portalName,
          companyName,
          roleTitle,
          location,
          region,
          jobId
        })
      });
      const data = await res.json();
      if (data?.session) {
        sessionIdRef.current = data.session.sessionId;
        setSession(data.session);
        setAddressInput(data.session.url || overrideUrl || url);
        onSessionUpdate?.(data.session);
      }
    } catch {
      // ignore
    } finally {
      setIsStarting(false);
    }
  };

  useEffect(() => {
    startNewLiveSession();
    return () => {
      sessionIdRef.current = null;
    };
  }, [mode, url, roleTitle, companyName, easyApply, externalApplyUrl]);

  useEffect(() => {
    const sid = session?.sessionId;
    if (!sid) return;

    let active = true;
    const pollInterval = setInterval(async () => {
      if (!active) return;
      try {
        const res = await fetch(`/api/browser/session/${sid}/state`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.session && active) {
          setSession(data.session);
          if (data.session.url) {
            setAddressInput((prev) =>
              document.activeElement?.getAttribute('aria-label') === 'Chromium live URL address bar'
                ? prev
                : data.session.url
            );
          }
          onSessionUpdate?.(data.session);
        }
      } catch {
        // ignore transient network errors
      }
    }, 280);

    return () => {
      active = false;
      clearInterval(pollInterval);
    };
  }, [session?.sessionId]);

  const sendBrowserInteraction = async (payload: Record<string, any>) => {
    if (!session?.sessionId) return;
    setIsInteracting(true);
    try {
      const res = await fetch(`/api/browser/session/${session.sessionId}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data?.session) {
        setSession(data.session);
        onSessionUpdate?.(data.session);
      }
    } catch {
      // ignore
    } finally {
      setIsInteracting(false);
    }
  };

  const handleViewportClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current || !session?.sessionId) return;
    const rect = imgRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    const chromiumX = Math.max(0, Math.min(1280, Math.round(relX * 1280)));
    const chromiumY = Math.max(0, Math.min(760, Math.round(relY * 760)));

    sendBrowserInteraction({ type: 'click', x: chromiumX, y: chromiumY });
  };

  const handleViewportKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!session?.sessionId) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (['Enter', 'Backspace', 'Tab', 'Escape', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      sendBrowserInteraction({ type: 'press', key: e.key });
    } else if (e.key.length === 1) {
      e.preventDefault();
      sendBrowserInteraction({ type: 'type', text: e.key });
    }
  };

  const handleNavigateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressInput.trim()) return;
    sendBrowserInteraction({ type: 'goto', url: addressInput.trim() });
  };

  const handleSendKeyboardText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyboardInput) return;
    sendBrowserInteraction({ type: 'type', text: keyboardInput });
    setKeyboardInput('');
  };

  const handleFieldLiveChange = (fieldId: string, newValue: string) => {
    setFieldEdits((prev) => ({ ...prev, [fieldId]: newValue }));
    sendBrowserInteraction({ type: 'fill_field', fieldId, value: newValue });
  };

  const handleConfirmSubmitInChromium = async () => {
    if (!session?.sessionId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/browser/session/${session.sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          editedFields: fieldEdits
        })
      });
      const data = await res.json();
      if (data?.session) {
        setSession(data.session);
        onSessionUpdate?.(data.session);
      }
      onSubmitted?.(fieldEdits);
    } finally {
      setIsSubmitting(false);
    }
  };

  const channelPill =
    session?.channelType === 'linkedin_external_ats'
      ? 'External Employer ATS ↗ (Not Easy Apply)'
      : session?.channelType === 'linkedin_easy_apply'
        ? 'LinkedIn Onsite Easy Apply ⚡'
        : session?.channelType === 'direct_ats'
          ? 'Direct Native ATS Form'
          : 'Chromium 1280×760 Live';

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f131f] overflow-hidden shadow-lg flex flex-col">
      {/* Real Chromium Browser Chrome / Address Bar */}
      <div className="px-3 py-2 bg-slate-100 dark:bg-[#161b2a] border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        </div>

        <button
          type="button"
          onClick={() => startNewLiveSession(addressInput)}
          className="h-7 w-7 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 cursor-pointer"
          title="Replay live Chromium automation pass"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isStarting || isInteracting ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`}
          />
        </button>

        {/* Live Interactive URL Bar */}
        <form onSubmit={handleNavigateSubmit} className="flex-1 min-w-[200px] flex items-center">
          <div className="w-full h-7 px-2.5 rounded-md bg-white dark:bg-[#0b0e17] border border-slate-200 dark:border-slate-700/80 flex items-center gap-2 text-xs font-mono">
            <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              aria-label="Chromium live URL address bar"
              className="flex-1 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none text-[11px] truncate"
            />
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold shrink-0 hidden md:inline">
              {channelPill}
            </span>
          </div>
        </form>

        {/* Live Scroll & Field Sync Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => sendBrowserInteraction({ type: 'wheel', deltaY: -280 })}
            className="h-7 px-2 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-mono inline-flex items-center gap-1 cursor-pointer"
            title="Scroll Up in Chromium"
          >
            <ArrowUp className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => sendBrowserInteraction({ type: 'wheel', deltaY: 280 })}
            className="h-7 px-2 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-mono inline-flex items-center gap-1 cursor-pointer"
            title="Scroll Down in Chromium"
          >
            <ArrowDown className="w-3 h-3" />
          </button>

          {discoveredFields.filter((f) => f.type !== 'file').length > 0 && (
            <button
              type="button"
              onClick={() => setShowQuickEdit(!showQuickEdit)}
              className={`h-7 px-2.5 rounded-md border text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer transition-colors ${
                showQuickEdit
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Edit Webpage Inputs ({discoveredFields.length})</span>
            </button>
          )}

          <a
            href={addressInput}
            target="_blank"
            rel="noreferrer"
            className="h-7 px-2 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 text-[11px] font-mono inline-flex items-center gap-1 shrink-0"
            title="Open URL in external browser tab"
          >
            <span>Open</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Live Status Strip */}
      <div className="px-3.5 py-1.5 bg-slate-50 dark:bg-[#121726] border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 text-[11px] font-mono">
        <div className="flex items-center gap-2 truncate text-slate-700 dark:text-slate-300">
          {session?.status === 'running' || session?.status === 'starting' ? (
            <Loader2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          )}
          <span className="truncate font-medium">
            {session?.currentAction || 'Attaching to Headless Chromium viewport...'}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-slate-500 dark:text-slate-400">
          <span className="tabular-nums">
            Cursor: ({session?.cursorX ?? 640}, {session?.cursorY ?? 360})
          </span>
          <span className="hidden sm:inline text-indigo-600 dark:text-indigo-400 font-semibold">
            Click &amp; type directly in browser
          </span>
        </div>
      </div>

      {/* Real Headless Chromium Bitmap Stream Viewport (Supports Click, Wheel & Direct Keyboard Passthrough!) */}
      <div
        tabIndex={0}
        onClick={handleViewportClick}
        onKeyDown={handleViewportKeyDown}
        onWheel={(e) => {
          sendBrowserInteraction({ type: 'wheel', deltaY: e.deltaY > 0 ? 200 : -200 });
        }}
        className={`relative w-full bg-slate-900 flex items-center justify-center overflow-hidden cursor-crosshair select-none focus:outline-2 focus:outline-indigo-500 ${
          compact ? 'min-h-[340px] max-h-[460px]' : 'min-h-[420px] max-h-[560px]'
        }`}
        title="Click any control in Headless Chromium to focus it, then type on your keyboard or use the Type bar below"
      >
        {session?.frameBase64 ? (
          <img
            ref={imgRef}
            src={session.frameBase64}
            alt="Live Headless Chromium Viewport Stream"
            className="w-full h-auto object-contain block"
          />
        ) : (
          <div className="py-20 text-center space-y-2.5">
            <Loader2 className="w-7 h-7 text-indigo-400 animate-spin mx-auto" />
            <div className="text-xs font-mono text-slate-200">
              Starting Real Headless Chromium Instance &amp; Streaming Live Webpage...
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Navigating to {url}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Keyboard Passthrough & Co-Pilot Action Bar */}
      <div className="px-3.5 py-2 bg-slate-100/90 dark:bg-[#141928] border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <form onSubmit={handleSendKeyboardText} className="flex-1 flex items-center gap-2">
          <Keyboard className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
          <input
            type="text"
            value={keyboardInput}
            onChange={(e) => setKeyboardInput(e.target.value)}
            placeholder="Click any input in the browser above, then type text here to send keystrokes..."
            aria-label="Type text into focused Chromium input"
            className="flex-1 h-7 px-2.5 rounded-md bg-white dark:bg-[#0b0e17] border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="h-7 px-2.5 rounded-md bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-semibold cursor-pointer shrink-0"
          >
            Send Keys
          </button>
          <button
            type="button"
            onClick={() => sendBrowserInteraction({ type: 'press', key: 'Enter' })}
            className="h-7 px-2.5 rounded-md bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-mono cursor-pointer shrink-0"
          >
            ↵ Enter
          </button>
        </form>

        {session?.status === 'awaiting_copilot' && (
          <button
            type="button"
            onClick={handleConfirmSubmitInChromium}
            disabled={isSubmitting}
            className="h-8 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {isSubmitting
                ? 'Submitting...'
                : discoveredFields.length > 0
                  ? 'Submit Real Webpage Form'
                  : 'Mark Applied After External Submit'}
            </span>
          </button>
        )}
      </div>

      {/* Live Discovered Webpage DOM Inputs Editor (Only shows real HTML inputs actually discovered on the webpage!) */}
      {showQuickEdit && discoveredFields.filter((f) => f.type !== 'file').length > 0 && (
        <div className="p-3.5 bg-slate-50 dark:bg-[#131826] border-t border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <MousePointerClick className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Discovered Native Webpage Inputs (Edits update the live webpage above immediately)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {discoveredFields
              .filter((f) => f.type !== 'file')
              .map((f) => (
                <div key={f.id} className="space-y-1">
                  <label className="text-[10.5px] font-mono text-slate-600 dark:text-slate-400 block truncate">
                    {f.somTag} {f.label}
                  </label>
                  <input
                    type="text"
                    value={fieldEdits[f.id] ?? f.value}
                    onChange={(e) => handleFieldLiveChange(f.id, e.target.value)}
                    className="w-full h-8 px-2.5 rounded-md bg-white dark:bg-[#0b0e17] border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
