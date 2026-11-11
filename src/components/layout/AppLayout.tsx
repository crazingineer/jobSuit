import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Kanban,
  Database,
  Sliders,
  Settings,
  Monitor,
  ShieldCheck,
  Briefcase,
  Sun,
  Moon,
  FileText
} from 'lucide-react';
import { clientApi, INITIAL_JOBS } from '@/lib/api';

interface AppLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ activeTab, setActiveTab, children }) => {
  const [totalJobsCount, setTotalJobsCount] = useState<number>(INITIAL_JOBS.length);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('jobsuite_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('jobsuite_theme', theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    async function loadCount() {
      try {
        const jobs = await clientApi.getJobs();
        if (jobs && jobs.length > 0) {
          setTotalJobsCount(jobs.length);
        }
      } catch {
        // keep initial count
      }
    }
    loadCount();
  }, [activeTab]);

  const workspaceNav = [
    { id: 'dashboard', label: 'Hiring Overview', icon: LayoutDashboard },
    { id: 'pipeline', label: 'Job Pipeline Board', icon: Kanban, count: totalJobsCount },
    { id: 'agent', label: 'Live Browser Studio', icon: Monitor },
    { id: 'vault', label: "Vault & Jake's CV", icon: Database }
  ];

  const configNav = [
    { id: 'rules', label: 'Automation Rules', icon: Sliders },
    { id: 'settings', label: 'System Config', icon: Settings }
  ];

  const allItems = [...workspaceNav, ...configNav];
  const currentLabel = allItems.find((n) => n.id === activeTab)?.label || 'Hiring Overview';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f6f7fb] dark:bg-[#0b0e17] text-slate-900 dark:text-slate-100 transition-colors duration-150">
      {/* Left Navigation Sidebar — Creliq AI Recruitment SaaS Layout */}
      <aside className="w-64 flex flex-col justify-between border-r border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0f131f] p-4 select-none shrink-0">
        <div className="space-y-6">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-3 px-2 pt-1">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs shrink-0">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-base tracking-tight text-slate-900 dark:text-white truncate">
                jobSuite
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                AI Recruitment &amp; Career-Ops
              </div>
            </div>
          </div>

          {/* Primary Navigation Groups */}
          <div className="space-y-5">
            <div className="space-y-1">
              <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                Main Menu
              </div>
              <nav className="space-y-1" aria-label="Workspace navigation">
                {workspaceNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full h-10 flex items-center justify-between px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.count !== undefined && (
                        <span
                          className={`text-[11px] font-mono tabular-nums ${
                            isActive ? 'text-indigo-100 font-bold' : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-1">
              <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                Preferences
              </div>
              <nav className="space-y-1" aria-label="Configuration navigation">
                {configNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full h-10 flex items-center justify-between px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom Candidate Profile Summary */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#141928] border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white">Shubham Yadav</span>
            <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
              PL-600
            </span>
          </div>
          <div className="space-y-1 text-[11px] font-mono text-slate-600 dark:text-slate-300 tabular-nums">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 dark:text-slate-500">🇮🇳 India</span>
              <span>+91 7276085461</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 dark:text-slate-500">🇨🇦 Canada</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+1 289-890-3999</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">IN Citizen · CA Work Permit</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar Contract: Breadcrumb on Left, Theme Switcher & Primary Action on Right */}
        <header className="h-14 border-b border-slate-200 dark:border-slate-800/90 bg-white/95 dark:bg-[#0f131f]/95 backdrop-blur-md px-6 flex items-center justify-between gap-8 shrink-0">
          <div className="flex items-center gap-2 text-xs whitespace-nowrap shrink-0">
            <span className="text-slate-400 dark:text-slate-500 font-medium">Workspace</span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="font-bold text-slate-900 dark:text-white">{currentLabel}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Light / Dark Theme Switcher */}
            <div
              className="h-9 inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-xs"
              role="group"
              aria-label="Theme mode switcher"
            >
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`h-7 px-2.5 rounded-lg inline-flex items-center gap-1.5 font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  theme === 'light'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`h-7 px-2.5 rounded-lg inline-flex items-center gap-1.5 font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  theme === 'dark'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dark</span>
              </button>
            </div>

            <button
              onClick={() => setActiveTab('vault')}
              className="h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Preview Resume</span>
            </button>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
