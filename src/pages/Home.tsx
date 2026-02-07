import { useEffect, useState } from 'react';
import { checkHealth } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { DecisionSimulator } from '../components/DecisionSimulator';
import { RiskTrajectory } from '../components/RiskTrajectory';
import { FraudReadiness } from '../components/FraudReadiness';
import { Metrics } from '../components/Metrics';

type TabId = 'simulator' | 'trajectory' | 'readiness' | 'metrics';

const TABS: { id: TabId; label: string }[] = [
  { id: 'simulator', label: 'Decision Simulator' },
  { id: 'trajectory', label: 'Risk Trajectory' },
  { id: 'readiness', label: 'Fraud Readiness' },
  { id: 'metrics', label: 'Metrics' },
];

export function Home() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('simulator');

  useEffect(() => {
    checkHealth()
      .then(({ ok }) => setConnected(ok))
      .catch(() => setConnected(false));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-6">
        <h1 className="text-xl font-semibold text-gray-900">
          AI Payments Approval & Fraud Intelligence
        </h1>
        <p className="mt-1 text-sm text-gray-500">Live Risk Engine Demo</p>
        <div className="mt-4">
          {connected !== null && <StatusBadge connected={connected} />}
        </div>
      </header>

      <div className="border-b border-gray-200 px-6">
        <nav className="flex gap-1" role="tablist">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
              className={
                activeTab === id
                  ? 'border-b-2 border-gray-900 px-4 py-3 text-sm font-medium text-gray-900'
                  : 'border-b-2 border-transparent px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700'
              }
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <main className="px-6 py-6">
        {activeTab === 'simulator' && <DecisionSimulator />}
        {activeTab === 'trajectory' && <RiskTrajectory />}
        {activeTab === 'readiness' && <FraudReadiness />}
        {activeTab === 'metrics' && <Metrics />}
      </main>
    </div>
  );
}
