import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { checkHealth } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { DecisionSimulator } from '../components/DecisionSimulator';
import { RiskTrajectory } from '../components/RiskTrajectory';
import { FraudReadiness } from '../components/FraudReadiness';
import { Metrics } from '../components/Metrics';
import { PayoutHistory } from '../components/PayoutHistory';
import { Admin } from '../components/Admin';

type TabId = 'simulator' | 'trajectory' | 'readiness' | 'metrics' | 'history' | 'admin';

const TABS: { id: TabId; label: string }[] = [
  { id: 'simulator', label: 'Decision Simulator' },
  { id: 'trajectory', label: 'Risk Trajectory' },
  { id: 'readiness', label: 'Fraud Readiness' },
  { id: 'metrics', label: 'Metrics' },
  { id: 'history', label: 'Payout History' },
  { id: 'admin', label: 'Admin' },
];

function DemoModePanel() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 bg-gray-50">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
      >
        Demo Mode
        <span className="text-gray-500">{open ? '▼' : '▶'}</span>
      </button>
      {open && (
        <div className="px-6 pb-4 space-y-4 text-sm">
          <div>
            <p className="font-medium text-gray-700 mb-1">Step 1 (Backend)</p>
            <pre className="bg-gray-800 text-gray-100 rounded p-3 overflow-x-auto text-xs font-mono">
{`python manage.py migrate
python manage.py seed_demo_data --days 3 --per_day 50 --reviews 0.2
python manage.py runserver`}
            </pre>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-1">Step 2 (Frontend)</p>
            <pre className="bg-gray-800 text-gray-100 rounded p-3 overflow-x-auto text-xs font-mono">
{`npm install
npm run dev`}
            </pre>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-1">Step 3 (Open)</p>
            <p className="text-gray-600">
              Frontend: <a href="http://localhost:5173" target="_blank" rel="noreferrer" className="text-blue-600 underline">http://localhost:5173</a>
              <br />
              Backend: <a href="http://127.0.0.1:8000/health" target="_blank" rel="noreferrer" className="text-blue-600 underline">http://127.0.0.1:8000/health</a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

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
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {connected !== null && <StatusBadge connected={connected} />}
          <span className="text-gray-400">|</span>
          <Link to="/query" className="text-sm text-blue-600 hover:underline">Ask a question</Link>
          <Link to="/patterns/emerging" className="text-sm text-blue-600 hover:underline">Emerging patterns</Link>
          <Link to="/incidents/bulk" className="text-sm text-blue-600 hover:underline">Bulk flag</Link>
        </div>
      </header>

      <DemoModePanel />

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
        {activeTab === 'history' && <PayoutHistory />}
        {activeTab === 'admin' && <Admin />}
      </main>
    </div>
  );
}
