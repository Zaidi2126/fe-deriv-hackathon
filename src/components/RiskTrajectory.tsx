import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getRiskTrajectory, type RiskTrajectoryResponse } from '../api/client';

const DAYS_OPTIONS = [7, 14, 30] as const;

function formatTs(ts: string): string {
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    const now = new Date();
    const sameDay =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    return sameDay
      ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
  } catch {
    return ts;
  }
}

export function RiskTrajectory() {
  const [userId, setUserId] = useState('demo_user_0_0');
  const [days, setDays] = useState<number>(7);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RiskTrajectoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await getRiskTrajectory(userId, days);
      setData(res);
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load trajectory'
      );
    } finally {
      setLoading(false);
    }
  };

  const chartData =
    data?.points.map((p) => ({
      ...p,
      tsLabel: formatTs(p.ts),
    })) ?? [];
  const last10 = (data?.points ?? []).slice(-10).reverse();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">user_id</span>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="mt-1 block w-56 rounded border border-gray-300 px-3 py-2 text-gray-900"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">days</span>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="mt-1 block w-24 rounded border border-gray-300 px-3 py-2 text-gray-900"
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
          onClick={load}
          disabled={loading}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Load trajectory'}
        </button>
        <Link
          to={`/fraud-network/${encodeURIComponent(userId)}`}
          className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          View fraud network
        </Link>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      {data && !error && (
        <>
          <div className="rounded border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Summary
            </h3>
            <div className="flex flex-wrap gap-6 text-sm">
              <span>
                <strong className="text-gray-600">Trend:</strong>{' '}
                <span className="capitalize">{data.trend}</span>
              </span>
              <span>
                <strong className="text-gray-600">Momentum:</strong>{' '}
                {data.momentum}
              </span>
              {data.summary && (
                <span className="w-full mt-2 text-gray-800">
                  {data.summary}
                </span>
              )}
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="rounded border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
              No history yet
            </div>
          ) : (
            <div className="rounded border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Risk score over time
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="tsLabel"
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                    />
                    <YAxis
                      dataKey="risk_score"
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                    />
                    <Tooltip
                      formatter={(value: number | undefined) => [
                        value ?? '—',
                        'Risk score',
                      ]}
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.ts
                          ? formatTs(payload[0].payload.ts)
                          : ''
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="risk_score"
                      stroke="#374151"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="risk_score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="rounded border border-gray-200 overflow-hidden">
            <h3 className="text-sm font-semibold text-gray-700 px-4 py-2 border-b border-gray-200 bg-gray-50">
              Last 10 points
            </h3>
            {last10.length === 0 ? (
              <p className="p-4 text-gray-500 text-sm">No history yet</p>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-2 font-medium text-gray-700">
                      ts
                    </th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">
                      risk_score
                    </th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">
                      decision
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {last10.map((p, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="px-4 py-2 text-gray-900">
                        {formatTs(p.ts)}
                      </td>
                      <td className="px-4 py-2 text-gray-900">
                        {p.risk_score}
                      </td>
                      <td className="px-4 py-2 text-gray-900">{p.decision}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {!data && !error && !loading && (
        <p className="text-sm text-gray-500">
          Enter a user_id and click Load trajectory to see risk history.
        </p>
      )}
    </div>
  );
}
