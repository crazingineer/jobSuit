import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  BookUser, 
  Sliders, 
  Settings, 
  Terminal, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  Search,
  ExternalLink,
  Flame,
  Radio
} from 'lucide-react';
import { TerminalDrawer } from './TerminalDrawer';

interface AppLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ activeTab, setActiveTab, children }) => {
  const [terminalOpen, setTerminalOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard, shortcut: '1' },
    { id: 'pipeline', label: 'Job Pipeline', icon: Layers, shortcut: '2', badge: '5' },
    { id: 'vault', label: 'Master Vault & CV', icon: BookUser, shortcut: '3' },
    { id: 'rules', label: 'Automation & Safety', icon: Sliders, shortcut: '4' },
    { id: 'settings', label: 'Settings & BYOK', icon: Settings, shortcut: '5' },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090a0f] text-zinc-100 select-none">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/[0.08] bg-[#0c0d14]/90 backdrop-blur-xl flex flex-col justify-between z-20">
        <div>
          {/* Logo & App Title */}
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-purple-600/30">
                <div className="w-full h-full bg-[#090a0f] rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-purple-400" />
                </div>
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
                  jobSuite
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    v2.0
                  </span>
                </h1>
                <p className="text-[11px] text-zinc-400">Windows Native Career-Ops</p>
              </div>
            </div>
          </div>

          {/* Quick Platform Status */}
          <div className="px-3 pt-3">
            <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  Naukri 9 AM Refresher
                </span>
                <span className="text-[11px] font-mono font-medium text-emerald-400">Armed</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                <span>Next: 08:55 AM IST</span>
                <span className="text-purple-400">+12m jitter</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30 shadow-sm shadow-purple-500/10'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/30 text-purple-200">
                        {item.badge}
                      </span>
                    )}
                    <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/40 text-zinc-400 border border-white/[0.06]">
                      {item.shortcut}
                    </kbd>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/[0.06] space-y-2">
          {/* Terminal / Live CDP Toggle */}
          <button
            onClick={() => setTerminalOpen(!terminalOpen)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-colors ${
              terminalOpen
                ? 'bg-purple-950/40 text-purple-300 border border-purple-800/40'
                : 'bg-white/[0.03] text-zinc-400 hover:text-zinc-200 border border-white/[0.05]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              <span>Live CDP Logs</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </button>

          {/* System Health */}
          <div className="flex items-center justify-between px-1 text-[11px] font-mono text-zinc-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
              CDP: Chrome
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              SQLite WAL
            </span>
          </div>
        </div>
      </aside>

      {/* Main View Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#090a0f]">
        {/* Top Control Bar */}
        <header className="h-12 border-b border-white/[0.08] bg-[#0c0d14]/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-zinc-400">Workspace:</span>
            <span className="text-xs px-2 py-0.5 rounded bg-white/[0.04] text-zinc-300 font-mono border border-white/[0.06]">
              b:\JobSuite\data
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Filter Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search jobs, companies, skills..."
                className="w-64 pl-8 pr-3 py-1 rounded-md bg-white/[0.03] border border-white/[0.08] text-xs text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>

            {/* Live Status indicator */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs">
              <Flame className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>Score Gate: &gt;= 4.0 Auto-Queue</span>
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          {children}
        </div>
      </main>

      {/* Live Playwright CDP Terminal Drawer */}
      <TerminalDrawer isOpen={terminalOpen} onClose={() => setTerminalOpen(false)} />
    </div>
  );
};
