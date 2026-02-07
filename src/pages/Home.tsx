import { useEffect, useState } from 'react';
import { checkHealth } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { DecisionSimulator } from '../components/DecisionSimulator';

export function Home() {
  const [connected, setConnected] = useState<boolean | null>(null);

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
      <DecisionSimulator />
    </div>
  );
}
