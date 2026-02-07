import { useState } from 'react';
import axios from 'axios';
import {
  createPayoutDecision,
  type PayoutDecisionRequest,
  type PayoutDecisionResponse,
} from '../api/client';

const defaultPayload: PayoutDecisionRequest = {
  user_id: 'demo_user_1',
  amount: 150.5,
  currency: 'USD',
  payment_method_id: 'pm_1',
  payment_method_age_days: 10,
  country: 'US',
  expected_country: 'US',
  ip_address: '192.168.1.10',
  vpn_detected: false,
  total_trades: 5,
  total_trade_volume: 500,
  withdrawals_last_1h: 0,
  withdrawals_last_24h: 2,
  deposits_last_1h: 0,
};

const QUICK_FILL_PRESETS: { label: string; payload: PayoutDecisionRequest }[] = [
  {
    label: 'Clean Approve',
    payload: {
      ...defaultPayload,
      vpn_detected: false,
      expected_country: 'US',
      country: 'US',
      withdrawals_last_1h: 0,
      total_trades: 10,
      total_trade_volume: 1000,
      payment_method_age_days: 30,
    },
  },
  {
    label: 'No Trade Fraud',
    payload: {
      ...defaultPayload,
      total_trades: 0,
      total_trade_volume: 0,
      payment_method_age_days: 0,
    },
  },
  {
    label: 'Velocity Abuse',
    payload: {
      ...defaultPayload,
      withdrawals_last_1h: 5,
      withdrawals_last_24h: 10,
    },
  },
  {
    label: 'Geo VPN Anomaly',
    payload: {
      ...defaultPayload,
      vpn_detected: true,
      expected_country: 'US',
      country: 'AE',
    },
  },
];

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
      className={`inline-block rounded border px-4 py-2 text-2xl font-semibold ${styles}`}
    >
      {decision.charAt(0).toUpperCase() + decision.slice(1)}
    </span>
  );
}

export function DecisionSimulator() {
  const [payload, setPayload] = useState<PayoutDecisionRequest>(defaultPayload);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PayoutDecisionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const update = <K extends keyof PayoutDecisionRequest>(
    key: K,
    value: PayoutDecisionRequest[K]
  ) => {
    setResult(null);
    setError(null);
    setValidationErrors([]);
    setPayload((p) => ({ ...p, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setValidationErrors([]);
    setResult(null);
    try {
      const data = await createPayoutDecision(payload);
      setResult(data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 400) {
          const data = err.response.data;
          if (typeof data === 'object' && data !== null) {
            if (Array.isArray((data as { detail?: unknown }).detail)) {
              setValidationErrors(
                (data as { detail: string[] }).detail.map(String)
              );
            } else if (typeof (data as { detail?: string }).detail === 'string') {
              setValidationErrors([(data as { detail: string }).detail]);
            } else if (typeof data === 'object' && 'message' in data) {
              setValidationErrors([String((data as { message: string }).message)]);
            } else {
              setValidationErrors([JSON.stringify(data)]);
            }
          } else {
            setValidationErrors([String(data)]);
          }
        } else {
          setError(
            err.response?.data?.detail
              ? String(err.response.data.detail)
              : err.message || 'Request failed'
          );
        }
      } else {
        setError(err instanceof Error ? err.message : 'Request failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const idx = result?.confidence_and_regret_index;

  const applyPreset = (preset: PayoutDecisionRequest) => {
    setResult(null);
    setError(null);
    setValidationErrors([]);
    setPayload(preset);
  };

  return (
    <div className="border-t border-gray-200 px-6 py-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Decision Simulator
      </h2>
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Quick Fill Buttons</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_FILL_PRESETS.map(({ label, payload: p }) => (
            <button
              key={label}
              type="button"
              onClick={() => applyPreset(p)}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8">
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
            <label className="sm:col-span-2 flex items-center gap-2 pt-6">
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

          {/* Advanced */}
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

          <button
            type="submit"
            disabled={loading}
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting…' : 'Get decision'}
          </button>
        </div>

        {/* Right: result panel */}
        <div className="flex-1 min-w-0">
          {(error || validationErrors.length > 0) && (
            <div className="mb-4 rounded border border-red-200 bg-red-50 p-4 text-red-800">
              {error && <p className="font-medium">{error}</p>}
              {validationErrors.length > 0 && (
                <ul className="mt-2 list-disc list-inside">
                  {validationErrors.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {result && (
            <div className="rounded border border-gray-200 bg-gray-50 p-6 space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <DecisionBadge decision={result.decision} />
                <div className="flex flex-wrap gap-6 text-lg">
                  <span>
                    <strong className="text-gray-600">Risk score:</strong>{' '}
                    {result.risk_score}
                  </span>
                  <span>
                    <strong className="text-gray-600">Confidence:</strong>{' '}
                    {result.confidence_score}
                  </span>
                  <span>
                    <strong className="text-gray-600">Regret level:</strong>{' '}
                    {result.regret_level}
                  </span>
                </div>
              </div>

              {result.triggered_signals.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Triggered signals
                  </h3>
                  <ul className="list-disc list-inside text-gray-800">
                    {result.triggered_signals.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </section>
              )}

              {result.reasons.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Reasons
                  </h3>
                  <ul className="list-disc list-inside text-gray-800">
                    {result.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </section>
              )}

              {result.counterfactuals.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Counterfactuals
                  </h3>
                  <ul className="list-disc list-inside text-gray-800">
                    {result.counterfactuals.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </section>
              )}

              {idx && (
                <div className="rounded border border-gray-300 bg-white p-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">
                    Confidence and Regret Index
                  </h3>
                  <dl className="space-y-2 text-sm">
                    {idx.confidence_band != null && (
                      <div>
                        <dt className="font-medium text-gray-600">
                          confidence_band
                        </dt>
                        <dd className="text-gray-900">{idx.confidence_band}</dd>
                      </div>
                    )}
                    {idx.recommended_next_step != null && (
                      <div>
                        <dt className="font-medium text-gray-600">
                          recommended_next_step
                        </dt>
                        <dd className="text-gray-900">
                          {idx.recommended_next_step}
                        </dd>
                      </div>
                    )}
                    {idx.action_rationale != null && (
                      <div>
                        <dt className="font-medium text-gray-600">
                          action_rationale
                        </dt>
                        <dd className="text-gray-900">{idx.action_rationale}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </div>
          )}

          {!result && !error && validationErrors.length === 0 && (
            <p className="text-sm text-gray-500">
              Submit the form to see the decision result.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
