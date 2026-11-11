import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { CommandCenter } from '@/components/dashboard/CommandCenter';
import { JobPipeline } from '@/components/pipeline/JobPipeline';
import { MasterVaultStudio } from '@/components/vault/MasterVaultStudio';
import { AiFormAgentCenter } from '@/components/agent/AiFormAgentCenter';
import { AutomationRules } from '@/components/rules/AutomationRules';
import { SettingsView } from '@/components/settings/SettingsView';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Keyboard shortcut navigation (1, 2, 3, 4, 5, 6)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.key === '1') setActiveTab('dashboard');
      if (e.key === '2') setActiveTab('pipeline');
      if (e.key === '3') setActiveTab('vault');
      if (e.key === '4') setActiveTab('agent');
      if (e.key === '5') setActiveTab('rules');
      if (e.key === '6') setActiveTab('settings');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && (
        <CommandCenter
          onNavigate={setActiveTab}
          onNavigateToPipeline={() => setActiveTab('pipeline')}
        />
      )}
      {activeTab === 'pipeline' && <JobPipeline />}
      {activeTab === 'vault' && <MasterVaultStudio />}
      {activeTab === 'agent' && <AiFormAgentCenter />}
      {activeTab === 'rules' && <AutomationRules />}
      {activeTab === 'settings' && <SettingsView />}
    </AppLayout>
  );
}

export default App;
