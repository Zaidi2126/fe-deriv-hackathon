import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { postBulkIncident } from '../api/client';

const MAX_USER_IDS = 500;

export function BulkIncidentPage() {
  const [searchParams] = useSearchParams();
  const prefill = searchParams.get('user_ids') ?? '';
  const [userIdsInput, setUserIdsInput] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ flagged_count: number; drafted_client_message?: string } | null>(null);

  useEffect(() => {
    if (prefill) setUserIdsInput(prefill.replace(/,/g, ', '));
  }, [prefill]);

  const parseUserIds = (raw: string): string[] => {
    return raw
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ids = parseUserIds(userIdsInput);
    if (ids.length === 0) {
      setError('Enter at least one user ID.');
      return;
    }
    if (ids.length > MAX_USER_IDS) {
      setError(`Maximum ${MAX_USER_IDS} user IDs.`);
      return;
    }
    if (!reason.trim()) {
      setError('Reason is required.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    postBulkIncident({ user_ids: ids, action: 'flag', reason: reason.trim() })
      .then((res) => setResult({ flagged_count: res.flagged_count ?? ids.length, drafted_client_message: res.drafted_client_message }))
      .catch((err) => setError(err?.response?.data?.detail ?? err?.message ?? 'Request failed'))
      .finally(() => setLoading(false));
  };

  const copyMessage = () => {
    if (result?.drafted_client_message) {
      navigator.clipboard.writeText(result.drafted_client_message);
    }
  };

  const idsCount = parseUserIds(userIdsInput).length;

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-blue-600 hover:underline text-sm">← Dashboard</Link>
          <h1 className="text-xl font-semibold text-gray-900">Bulk flag accounts</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">User IDs</span>
            <textarea
              value={userIdsInput}
              onChange={(e) => setUserIdsInput(e.target.value)}
              placeholder="One per line or comma-separated (max 500)"
              rows={6}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
            />
            <p className="mt-1 text-xs text-gray-500">{idsCount} user(s)</p>
            {idsCount > MAX_USER_IDS && (
              <p className="mt-1 text-xs text-amber-600">Maximum {MAX_USER_IDS} user IDs.</p>
            )}
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Reason (required)</span>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Fraud ring detected, Card testing"
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
            />
          </label>
          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? 'Submitting…' : 'Flag accounts'}
          </button>
        </form>

        {result && (
          <div className="rounded border border-gray-200 bg-gray-50 p-4 space-y-3">
            <p className="text-sm font-medium text-gray-800">{result.flagged_count} accounts flagged</p>
            {result.drafted_client_message && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Use this message for client emails</p>
                <div className="rounded border border-gray-200 bg-white p-3 text-sm text-gray-800 whitespace-pre-wrap relative">
                  {result.drafted_client_message}
                  <button
                    type="button"
                    onClick={copyMessage}
                    className="absolute top-2 right-2 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
