import React, { useState, useEffect } from 'react';
import { Terminal, X, Maximize2, Minimize2, Trash2, CheckCircle2, AlertCircle, Play } from 'lucide-react';

interface TerminalLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  module: string;
  message: string;
}

interface TerminalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TerminalDrawer: React.FC<TerminalDrawerProps> = ({ isOpen, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [logs, setLogs] = useState<TerminalLog[]>([
    {
      id: '1',
      timestamp: '18:42:10',
      level: 'info',
      module: 'CDP-Manager',
      message: 'Connecting to Chrome DevTools Protocol at ws://127.0.0.1:9222/devtools/browser'
    },
    {
      id: '2',
      timestamp: '18:42:12',
      level: 'success',
      module: 'CDP-Manager',
      message: 'Persistent Chrome profile attached. Active cookies: LinkedIn (Valid), Naukri (Valid)'
    },
    {
      id: '3',
      timestamp: '18:42:15',
      level: 'info',
      module: 'Booster',
      message: 'Naukri 9 AM Refresher scheduled at 08:55 AM IST (+/- 15m jitter)'
    },
    {
      id: '4',
      timestamp: '18:42:25',
      level: 'info',
      module: 'Database',
      message: 'SQLite database connection verified. WAL mode active at data/jobsuite.db'
    },
    {
      id: '5',
      timestamp: '18:43:02',
      level: 'success',
      module: 'career-ops',
      message: 'A-H Evaluation engine ready. 22 Block G legitimacy signals loaded.'
    }
  ]);

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 border-t border-purple-500/20 bg-[#0c0d14]/95 backdrop-blur-xl shadow-2xl flex flex-col ${
        isExpanded ? 'h-[70vh]' : 'h-72'
      }`}
    >
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Playwright CDP
          </div>
          <span className="text-xs text-zinc-400 font-mono">Chromium v128 • Port 9222</span>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => setLogs([])}
            className="p-1.5 rounded hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Log Output */}
      <div className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-1.5 selection:bg-purple-900/50">
        {logs.map((log) => {
          let levelColor = 'text-zinc-300';
          let levelBg = 'bg-zinc-800/50 text-zinc-400';
          if (log.level === 'success') {
            levelColor = 'text-emerald-300';
            levelBg = 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30';
          } else if (log.level === 'warn') {
            levelColor = 'text-amber-300';
            levelBg = 'bg-amber-950/40 text-amber-400 border border-amber-800/30';
          } else if (log.level === 'error') {
            levelColor = 'text-rose-300';
            levelBg = 'bg-rose-950/40 text-rose-400 border border-rose-800/30';
          }

          return (
            <div key={log.id} className="flex items-start gap-2.5 py-0.5 hover:bg-white/[0.02] px-1 rounded">
              <span className="text-zinc-500 shrink-0">{log.timestamp}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] shrink-0 font-semibold uppercase ${levelBg}`}>
                {log.module}
              </span>
              <span className={`flex-1 break-all ${levelColor}`}>{log.message}</span>
            </div>
          );
        })}
      </div>

      {/* Bottom Command Bar */}
      <div className="px-3 py-2 border-t border-white/5 bg-black/40 flex items-center gap-2 text-xs font-mono text-zinc-400">
        <Play className="w-3 h-3 text-purple-400" />
        <span className="text-zinc-500">jobSuite-cdp&gt;</span>
        <input 
          type="text" 
          placeholder="Type automation command or press 'Test Profile'..."
          className="flex-1 bg-transparent border-none outline-none text-zinc-200 placeholder:text-zinc-600 text-xs"
        />
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400">Windows Task Scheduler active</span>
      </div>
    </div>
  );
};
