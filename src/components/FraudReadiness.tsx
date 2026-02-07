import { useState } from 'react';
import {
  simulateFraudReadiness,
  type FraudReadinessRequest,
  type FraudReadinessResponse,
  type FraudReadinessScenario,
} from '../api/client';

const SCENARIOS: { id: FraudReadinessScenario; label: string }[] = [
  { id: 'no_trade_fraud', label: 'no_trade_fraud' },
  { id: 'short_trade_abuse', label: 'short_trade_abuse' },
  { id: 'new_payment_method_risk', label: 'new_payment_method_risk' },
  { id: 'velocity_abuse', label: 'velocity_abuse' },
  { id: 'geo_vpn_anomaly', label: 'geo_vpn_anomaly' },
];

const defaultPayload: FraudReadinessRequest = {
  user_id: 'sim_user',
  amount: 200,
  currency: 'USD',
  payment_method_id: 'pm_1',
  payment_method_age_days: 5,
  country: 'US',
  expected_country: 'US',
  ip_address: '10.0.0.1',
  vpn_detected: false,
  total_trades: 10,
  total_trade_volume: 1000,
  withdrawals_last_1h: 0,
  withdrawals_last_24h: 2,
  deposits_last_1h: 0,
};

function DecisionBadge({ decision }: { decision: string }) {
  const d = decision.toLowerCase();
  const styles =
    d === 'approve'
      ? 'bg-green-100 text-green-800 border-green-300'
      : d === 'review'
        ? 'bg-amber-100 text-amber-800 border-amber-300'
        : 'bg-red-100 text-red-800 border-red-300';
  return (
    <span
      className={`inline-block rounded border px-2 py-1 text-sm font-medium ${styles}`}
    >
      {decision.charAt(0).toUpperCase() + decision.slice(1)}
    </span>
  );
}

function ReadinessBadge({ level }: { level: string }) {
  const l = level.toLowerCase();
  const styles =
    l === 'high'
      ? 'bg-red-100 text-red-800 border-red-300'
      : l === 'medium'
        ? 'bg-amber-100 text-amber-800 border-amber-300'
        : 'bg-green-100 text-green-800 border-green-300';
  return (
    <span
      className={`inline-block rounded border px-2 py-1 text-sm font-medium ${styles}`}
    >
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

export function FraudReadiness() {
  const [payload, setPayload] = useState<FraudReadinessRequest>(defaultPayload);
  const [selectedScenarios, setSelectedScenarios] = useState<Set<FraudReadinessScenario>>(
    new Set(SCENARIOS.map((s) => s.id))
  );
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FraudReadinessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleScenario = (id: FraudReadinessScenario) => {
    setResult(null);
    setError(null);
    setSelectedScenarios((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const update = <K extends keyof FraudReadinessRequest>(
    key: K,
    value: FraudReadinessRequest[K]
  ) => {
    setResult(null);
    setError(null);
    setPayload((p) => ({ ...p, [key]: value }));
  };

  const runSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    const scenarios = selectedScenarios.size === SCENARIOS.length
      ? undefined
      : Array.from(selectedScenarios);
    try {
      const data = await simulateFraudReadiness({ ...payload, scenarios });
      setResult(data);
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Simulation failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Fraud Readiness</h2>
      <form onSubmit={runSimulation} className="flex flex-col lg:flex-row gap-8">
        {/* Left: form */}
        <div className="flex-1 max-w-md space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">user_id</span>
              <input
                type="text"
                value={payload.user_id}
                onChange={(e) => update('user_id', e.target.value)}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">amount</span>
              <input
                type="number"
                step="any"
                value={payload.amount}
                onChange={(e) => update('amount', Number(e.target.value))}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">currency</span>
              <input
                type="text"
                value={payload.currency}
                onChange={(e) => update('currency', e.target.value)}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                payment_method_id
              </span>
              <input
                type="text"
                value={payload.payment_method_id}
                onChange={(e) => update('payment_method_id', e.target.value)}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                payment_method_age_days
              </span>
              <input
                type="number"
                min={0}
                value={payload.payment_method_age_days}
                onChange={(e) =>
                  update('payment_method_age_days', Number(e.target.value))
                }
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">country</span>
              <input
                type="text"
                value={payload.country}
                onChange={(e) => update('country', e.target.value)}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                expected_country
              </span>
              <input
                type="text"
                value={payload.expected_country ?? ''}
                onChange={(e) =>
                  update('expected_country', e.target.value || undefined)
                }
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">ip_address</span>
              <input
                type="text"
                value={payload.ip_address}
                onChange={(e) => update('ip_address', e.target.value)}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
              />
            </label>
            <label className="sm:col-span-2 flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                checked={payload.vpn_detected}
                onChange={(e) => update('vpn_detected', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">
                vpn_detected
              </span>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                total_trades
              </span>
              <input
                type="number"
                min={0}
                value={payload.total_trades}
                onChange={(e) =>
                  update('total_trades', Number(e.target.value))
                }
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                total_trade_volume
              </span>
              <input
                type="number"
                min={0}
                step="any"
                value={payload.total_trade_volume}
                onChange={(e) =>
                  update('total_trade_volume', Number(e.target.value))
                }
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
              />
            </label>
          </div>

          <div className="border border-gray-200 rounded">
            <button
              type="button"
              onClick={() => setAdvancedOpen((o) => !o)}
              className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100"
            >
              Advanced
              <span className="text-gray-500">{advancedOpen ? '▼' : '▶'}</span>
            </button>
            {advancedOpen && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-200">
                <label className="block">
                  <span className="text-sm font-medium text-gray-600">
                    withdrawals_last_1h
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={payload.withdrawals_last_1h ?? ''}
                    onChange={(e) =>
                      update(
                        'withdrawals_last_1h',
                        e.target.value === ''
                          ? undefined
                          : Number(e.target.value)
                      )
                    }
                    className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-600">
                    withdrawals_last_24h
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={payload.withdrawals_last_24h ?? ''}
                    onChange={(e) =>
                      update(
                        'withdrawals_last_24h',
                        e.target.value === ''
                          ? undefined
                          : Number(e.target.value)
                      )
                    }
                    className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-600">
                    deposits_last_1h
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={payload.deposits_last_1h ?? ''}
                    onChange={(e) =>
                      update(
                        'deposits_last_1h',
                        e.target.value === ''
                          ? undefined
                          : Number(e.target.value)
                      )
                    }
                    className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
                  />
                </label>
              </div>
            )}
          </div>

          <div className="border border-gray-200 rounded p-4">
            <span className="text-sm font-medium text-gray-700 block mb-3">
              Scenarios
            </span>
            <div className="space-y-2">
              {SCENARIOS.map(({ id, label }) => (
                <label key={id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedScenarios.has(id)}
                    onChange={() => toggleScenario(id)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-800">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || selectedScenarios.size === 0}
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Running…' : 'Run simulation'}
          </button>
        </div>

        {/* Right: results */}
        <div className="flex-1 min-w-0">
          {error && (
            <div className="mb-4 rounded border border-red-200 bg-red-50 p-4 text-red-800">
              {error}
            </div>
          )}

          {result && !error && (
            <div className="space-y-4">
              {result.results.map((r, i) => (
                <div
                  key={i}
                  className="rounded border border-gray-200 bg-gray-50 p-5"
                >
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="text-base font-semibold text-gray-900">
                      {r.simulated_pattern}
                    </span>
                    <ReadinessBadge level={r.readiness_level} />
                    <DecisionBadge decision={r.decision} />
                    <span className="text-sm text-gray-600">
                      Risk score: <strong>{r.simulated_risk_score}</strong>
                    </span>
                  </div>
                  {r.triggered_signals.length > 0 && (
                    <div className="mb-2">
                      <span className="text-xs font-medium text-gray-600">
                        Triggered signals
                      </span>
                      <ul className="list-disc list-inside text-sm text-gray-800 mt-1">
                        {r.triggered_signals.map((s, j) => (
                          <li key={j}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {r.reasons.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">
                        Reasons
                      </span>
                      <ul className="list-disc list-inside text-sm text-gray-800 mt-1">
                        {r.reasons.map((reason, j) => (
                          <li key={j}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!result && !error && (
            <p className="text-sm text-gray-500">
              Configure base inputs and scenarios, then run simulation.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
