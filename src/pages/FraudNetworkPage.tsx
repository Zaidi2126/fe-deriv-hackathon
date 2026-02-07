import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFraudNetwork, getExposure, type FraudNetworkEdge } from '../api/client';
import { FraudNetworkGraph } from '../components/FraudNetworkGraph';

const DAYS_OPTIONS = [7, 30, 90] as const;

export function FraudNetworkPage() {
  const { userId } = useParams<{ userId: string }>();
  const [nodes, setNodes] = useState<{ user_id: string; label?: string }[]>([]);
  const [edges, setEdges] = useState<FraudNetworkEdge[]>([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exposureLoading, setExposureLoading] = useState(false);
  const [exposure, setExposure] = useState<{ total_exposure: number; currency: string; user_count: number; explanation: string } | null>(null);
  const [exposureError, setExposureError] = useState<string | null>(null);
  const [exposureDays, setExposureDays] = useState(30);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    getFraudNetwork(userId, true)
      .then((res) => {
        setNodes(res.nodes ?? []);
        setEdges(res.edges ?? []);
        setSummary(res.summary ?? '');
      })
      .catch((err) => setError(err?.message ?? 'Failed to load fraud network'))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleCalculateExposure = () => {
    const ids = nodes.map((n) => n.user_id);
    if (ids.length === 0) {
      setExposureError('No users in network.');
      return;
    }
    setExposureLoading(true);
    setExposureError(null);
    setExposure(null);
    getExposure(ids, exposureDays)
      .then(setExposure)
      .catch((err) => setExposureError(err?.message ?? 'Failed to calculate exposure'))
      .finally(() => setExposureLoading(false));
  };

  const userIdsParam = nodes.length > 0 ? nodes.map((n) => n.user_id).join(',') : '';
  const bulkUrl = userIdsParam ? `/incidents/bulk?user_ids=${encodeURIComponent(userIdsParam)}` : '/incidents/bulk';

  if (!userId) {
    return (
      <div className="min-h-screen bg-white p-6">
        <p className="text-gray-600">Missing user ID.</p>
        <Link to="/" className="text-blue-600 underline mt-2 inline-block">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-blue-600 hover:underline text-sm">← Dashboard</Link>
          <h1 className="text-xl font-semibold text-gray-900">Fraud network</h1>
          <span className="text-gray-500 text-sm">user: {userId}</span>
        </div>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
            {error}
          </div>
        )}

        {loading && <p className="text-gray-500">Loading…</p>}

        {!loading && !error && (
          <>
            {summary && (
              <div className="rounded border border-gray-200 bg-gray-50 p-4">
                <h2 className="text-sm font-semibold text-gray-800 mb-2">Summary</h2>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{summary}</p>
              </div>
            )}

            {nodes.length <= 1 && edges.length === 0 ? (
              <div className="rounded border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
                No linked accounts found.
              </div>
            ) : (
              <FraudNetworkGraph nodes={nodes} edges={edges} width={600} height={400} />
            )}

            <div className="rounded border border-gray-200 p-4 space-y-4">
              <h2 className="text-sm font-semibold text-gray-800">Exposure</h2>
              <div className="flex flex-wrap items-end gap-3">
                <label className="block">
                  <span className="text-xs text-gray-600">Days</span>
                  <select
                    value={exposureDays}
                    onChange={(e) => setExposureDays(Number(e.target.value))}
                    className="mt-1 block rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
                  >
                    {DAYS_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={handleCalculateExposure}
                  disabled={exposureLoading || nodes.length === 0}
                  className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {exposureLoading ? 'Calculating…' : 'Calculate exposure'}
                </button>
              </div>
              {exposureError && (
                <p className="text-sm text-red-600">{exposureError}</p>
              )}
              {exposure && (
                <div className="rounded bg-gray-50 p-3">
                  <p className="text-lg font-semibold text-gray-900">
                    {exposure.currency} {exposure.total_exposure.toLocaleString(undefined, { minimumFractionDigits: 2 })} at risk
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{exposure.user_count} users · {exposure.explanation}</p>
                </div>
              )}
            </div>

            {nodes.length > 0 && (
              <div>
                <Link
                  to={bulkUrl}
                  className="rounded border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
                >
                  Flag all in network
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
