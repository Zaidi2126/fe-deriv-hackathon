import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getEmergingPatterns, type EmergingPattern } from '../api/client';

const DAYS_OPTIONS = [7, 14, 30] as const;

export function EmergingPatternsPage() {
  const [days, setDays] = useState(7);
  const [patterns, setPatterns] = useState<EmergingPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatterns = useCallback(async () => {
    setLoading(true);
    setError(null);
    getEmergingPatterns(days)
      .then((res) => setPatterns(res.patterns ?? []))
      .catch((err) => setError(err?.message ?? 'Failed to load patterns'))
      .finally(() => setLoading(false));
  }, [days]);

  useEffect(() => {
    fetchPatterns();
  }, [fetchPatterns]);

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-blue-600 hover:underline text-sm">← Dashboard</Link>
            <h1 className="text-xl font-semibold text-gray-900">Emerging patterns</h1>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-900"
            >
              {DAYS_OPTIONS.map((d) => (
                <option key={d} value={d}>{d} days</option>
              ))}
            </select>
            <button
              type="button"
              onClick={fetchPatterns}
              disabled={loading}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
            {error}
          </div>
        )}

        {loading && <p className="text-gray-500">Loading…</p>}

        {!loading && patterns.length === 0 && !error && (
          <div className="rounded border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
            No emerging patterns in the last {days} days.
          </div>
        )}

        {!loading && patterns.length > 0 && (
          <div className="space-y-4">
            {patterns.map((p, i) => (
              <div
                key={i}
                className="rounded border border-gray-200 bg-white p-4"
              >
                <p className="text-sm font-semibold text-gray-800">
                  {p.signal_combo}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {p.case_count} cases
                  {p.transaction_ids?.length != null && p.transaction_ids.length > 0 && (
                    <span> · {p.transaction_ids.length} transaction(s)</span>
                  )}
                </p>
                <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                  {p.description}
                </p>
                {(p.account_ids?.length ?? 0) > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-600 mb-1">Accounts</p>
                    <div className="flex flex-wrap gap-2">
                      {(p.account_ids ?? []).map((id) => (
                        <Link
                          key={id}
                          to={`/fraud-network/${encodeURIComponent(id)}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {id}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {(p.transaction_ids?.length ?? 0) > 0 && (() => {
                  const tids = p.transaction_ids ?? [];
                  return (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                      {tids.length} transaction ID(s)
                    </summary>
                    <ul className="mt-1 text-xs text-gray-600 font-mono list-none space-y-0.5">
                      {tids.slice(0, 5).map((tid) => (
                        <li key={tid}>{tid}</li>
                      ))}
                      {tids.length > 5 && (
                        <li className="text-gray-400">+{tids.length - 5} more</li>
                      )}
                    </ul>
                  </details>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
