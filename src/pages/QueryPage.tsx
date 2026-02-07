import { useState } from 'react';
import { Link } from 'react-router-dom';
import { postQuery } from '../api/client';

export function QueryPage() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interpretedFilters, setInterpretedFilters] = useState<Record<string, unknown> | null>(null);
  const [results, setResults] = useState<{ user_id: string }[]>([]);
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setInterpretedFilters(null);
    setResults([]);
    setCount(0);
    setMessage(null);
    postQuery(question.trim())
      .then((res) => {
        setInterpretedFilters(res.interpreted_filters ?? null);
        setResults(res.results ?? []);
        setCount(res.count ?? 0);
        setMessage(res.message ?? null);
      })
      .catch((err) => setError(err?.response?.data?.detail ?? err?.message ?? 'Request failed'))
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-blue-600 hover:underline text-sm">← Dashboard</Link>
          <h1 className="text-xl font-semibold text-gray-900">Ask a question</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Natural language search</span>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Show me accounts that deposited but traded minimally"
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? 'Searching…' : 'Run query'}
          </button>
        </form>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {interpretedFilters != null && Object.keys(interpretedFilters).length > 0 && (
          <div className="rounded border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-600 mb-2">Interpreted as</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(interpretedFilters).map(([k, v]) => (
                <span
                  key={k}
                  className="inline-flex rounded bg-white border border-gray-200 px-2 py-1 text-xs text-gray-800"
                >
                  {k}: {String(v)}
                </span>
              ))}
            </div>
          </div>
        )}

        {message && results.length === 0 && (
          <p className="text-sm text-amber-700">{message} Try rephrasing.</p>
        )}

        {results.length > 0 && (
          <div className="rounded border border-gray-200">
            <p className="px-3 py-2 text-sm font-medium text-gray-700 border-b border-gray-200">
              {count} account(s)
            </p>
            <ul className="divide-y divide-gray-100">
              {results.map((r) => (
                <li key={r.user_id} className="px-3 py-2 text-sm">
                  <Link to={`/fraud-network/${encodeURIComponent(r.user_id)}`} className="text-blue-600 hover:underline">
                    {r.user_id}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
