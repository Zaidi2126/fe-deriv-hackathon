import { useEffect, useState, useCallback, Fragment } from 'react';
import {
  getPayoutHistory,
  type PayoutHistoryItem,
  type GetPayoutHistoryParams,
} from '../api/client';

const DAYS_OPTIONS = [1, 7, 14, 30] as const;
const DECISION_FILTER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'approve', label: 'Approve' },
  { value: 'review', label: 'Review' },
  { value: 'block', label: 'Block' },
] as const;

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString();
  } catch {
    return iso;
  }
}

function DecisionBadge({ decision }: { decision: string }) {
  const d = decision?.toLowerCase() ?? '';
  const styles =
    d === 'approve'
      ? 'bg-green-100 text-green-800 border-green-300'
      : d === 'review'
        ? 'bg-amber-100 text-amber-800 border-amber-300'
        : 'bg-red-100 text-red-800 border-red-300';
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${styles}`}
    >
      {decision ? decision.charAt(0).toUpperCase() + decision.slice(1) : '—'}
    </span>
  );
}

const EMPTY_MSG =
  'No history yet. Run a few decisions or seed demo data.';

export function PayoutHistory() {
  const [decisionFilter, setDecisionFilter] = useState<string>('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [days, setDays] = useState<number>(7);
  const [items, setItems] = useState<PayoutHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params: GetPayoutHistoryParams = {
      days,
      limit: 100,
    };
    if (decisionFilter) params.decision = decisionFilter as 'approve' | 'review' | 'block';
    if (userIdFilter.trim()) params.user_id = userIdFilter.trim();
    try {
      const data = await getPayoutHistory(params);
      setItems(Array.isArray(data) ? data : []);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load payout history'
      );
    } finally {
      setLoading(false);
    }
  }, [days, decisionFilter, userIdFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const rowId = (item: PayoutHistoryItem, index: number) =>
    `${item.created_at}-${item.user_id}-${index}`;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Payout History</h2>

      <div className="flex flex-wrap items-end gap-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Decision</span>
          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
            className="mt-1 block w-28 rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
          >
            {DECISION_FILTER_OPTIONS.map(({ value, label }) => (
              <option key={value || 'all'} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">user_id</span>
          <input
            type="text"
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            placeholder="Optional"
            className="mt-1 block w-40 rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Days</span>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="mt-1 block w-20 rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
          >
            {DAYS_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={fetchHistory}
          disabled={loading}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
        {lastRefreshed && (
          <span className="text-sm text-gray-500">
            Last refreshed: {lastRefreshed.toLocaleString()}
          </span>
        )}
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded border border-gray-200">
        {items.length === 0 && !loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            {EMPTY_MSG}
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-2 font-medium text-gray-700 whitespace-nowrap">
                  created_at
                </th>
                <th className="text-left px-4 py-2 font-medium text-gray-700 whitespace-nowrap">
                  user_id
                </th>
                <th className="text-right px-4 py-2 font-medium text-gray-700 whitespace-nowrap">
                  amount
                </th>
                <th className="text-left px-4 py-2 font-medium text-gray-700 whitespace-nowrap">
                  decision
                </th>
                <th className="text-right px-4 py-2 font-medium text-gray-700 whitespace-nowrap">
                  risk_score
                </th>
                <th className="text-right px-4 py-2 font-medium text-gray-700 whitespace-nowrap">
                  confidence
                </th>
                <th className="text-right px-4 py-2 font-medium text-gray-700 whitespace-nowrap">
                  regret_level
                </th>
                <th className="text-left px-4 py-2 font-medium text-gray-700 whitespace-nowrap">
                  human_final_decision
                </th>
                <th className="text-left px-4 py-2 font-medium text-gray-700 whitespace-nowrap">
                  human_overrode
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const id = rowId(item, index);
                const isExpanded = expandedId === id;
                return (
                  <Fragment key={id}>
                    <tr
                      key={id}
                      onClick={() =>
                        setExpandedId(isExpanded ? null : id)
                      }
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-4 py-2 text-gray-900 whitespace-nowrap">
                        {formatDateTime(item.created_at)}
                      </td>
                      <td className="px-4 py-2 text-gray-900">
                        {item.user_id}
                      </td>
                      <td className="px-4 py-2 text-gray-900 text-right">
                        {item.amount} {item.currency}
                      </td>
                      <td className="px-4 py-2">
                        <DecisionBadge decision={item.decision} />
                      </td>
                      <td className="px-4 py-2 text-gray-900 text-right">
                        {item.risk_score}
                      </td>
                      <td className="px-4 py-2 text-gray-900 text-right">
                        {item.confidence_score}
                      </td>
                      <td className="px-4 py-2 text-gray-900 text-right">
                        {item.regret_level}
                      </td>
                      <td className="px-4 py-2">
                        {item.human_final_decision != null ? (
                          <DecisionBadge decision={item.human_final_decision} />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            item.human_overrode
                              ? 'text-amber-700 font-medium'
                              : 'text-gray-500'
                          }
                        >
                          {item.human_overrode ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={9} className="px-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-gray-700 mb-1">
                                Triggered signals
                              </p>
                              <ul className="list-disc list-inside text-gray-800">
                                {(item.triggered_signals ?? []).length === 0 ? (
                                  <li className="text-gray-500">—</li>
                                ) : (
                                  (item.triggered_signals ?? []).map((s, i) => (
                                    <li key={i}>{s}</li>
                                  ))
                                )}
                              </ul>
                            </div>
                            <div>
                              <p className="font-medium text-gray-700 mb-1">
                                Reasons
                              </p>
                              <ul className="list-disc list-inside text-gray-800">
                                {(item.reasons ?? []).length === 0 ? (
                                  <li className="text-gray-500">—</li>
                                ) : (
                                  (item.reasons ?? []).map((r, i) => (
                                    <li key={i}>{r}</li>
                                  ))
                                )}
                              </ul>
                            </div>
                            <div>
                              <p className="font-medium text-gray-700 mb-1">
                                Counterfactuals
                              </p>
                              <ul className="list-disc list-inside text-gray-800">
                                {(item.counterfactuals ?? []).length === 0 ? (
                                  <li className="text-gray-500">—</li>
                                ) : (
                                  (item.counterfactuals ?? []).map((c, i) => (
                                    <li key={i}>{c}</li>
                                  ))
                                )}
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
