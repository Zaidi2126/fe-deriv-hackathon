import { useEffect, useState, useCallback } from 'react';
import {
  getDailyMetrics,
  getCalibrationMetrics,
  type DailyMetric,
  type CalibrationStat,
} from '../api/client';

const ROWS_LIMIT = 14;

function pct(value: number): string {
  return typeof value === 'number' && !Number.isNaN(value)
    ? value.toFixed(1)
    : '—';
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString();
  } catch {
    return dateStr;
  }
}

const EMPTY_MSG = 'No metrics yet. Run seed_demo_data on backend.';

export function Metrics() {
  const [daily, setDaily] = useState<DailyMetric[]>([]);
  const [calibration, setCalibration] = useState<CalibrationStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dailyRes, calRes] = await Promise.all([
        getDailyMetrics(),
        getCalibrationMetrics(),
      ]);
      setDaily(Array.isArray(dailyRes) ? dailyRes : []);
      setCalibration(Array.isArray(calRes) ? calRes : []);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to load metrics'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const dailyRows = daily.slice(0, ROWS_LIMIT);
  const calibrationRows = calibration.slice(0, ROWS_LIMIT);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Metrics</h2>
        <div className="flex items-center gap-4">
          {lastRefreshed && (
            <span className="text-sm text-gray-500">
              Last refreshed: {lastRefreshed.toLocaleString()}
            </span>
          )}
          <button
            type="button"
            onClick={fetchAll}
            disabled={loading}
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Refresh metrics'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      {/* Section A: Daily Metrics */}
      <section>
        <h3 className="text-sm font-semibold text-gray-800 mb-2">
          Daily Metrics
        </h3>
        <div className="overflow-x-auto rounded border border-gray-200">
          {dailyRows.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              {EMPTY_MSG}
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-2 font-medium text-gray-700 whitespace-nowrap">
                    date
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-700 whitespace-nowrap">
                    total_requests
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-700 whitespace-nowrap">
                    auto_approved
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-700 whitespace-nowrap">
                    auto_blocked
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-700 whitespace-nowrap">
                    sent_to_review
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-700 whitespace-nowrap">
                    accuracy_percent
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-700 whitespace-nowrap">
                    false_positive_rate
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-700 whitespace-nowrap">
                    false_negative_rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {dailyRows.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-2 text-gray-900 whitespace-nowrap">
                      {formatDate(row.date)}
                    </td>
                    <td className="px-4 py-2 text-gray-900 text-right">
                      {row.total_requests}
                    </td>
                    <td className="px-4 py-2 text-gray-900 text-right">
                      {row.auto_approved}
                    </td>
                    <td className="px-4 py-2 text-gray-900 text-right">
                      {row.auto_blocked}
                    </td>
                    <td className="px-4 py-2 text-gray-900 text-right">
                      {row.sent_to_review}
                    </td>
                    <td className="px-4 py-2 text-gray-900 text-right">
                      {pct(row.accuracy_percent)}%
                    </td>
                    <td className="px-4 py-2 text-gray-900 text-right">
                      {pct(row.false_positive_rate)}%
                    </td>
                    <td className="px-4 py-2 text-gray-900 text-right">
                      {pct(row.false_negative_rate)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Section B: Calibration Stats */}
      <section>
        <h3 className="text-sm font-semibold text-gray-800 mb-2">
          Calibration Stats
        </h3>
        <div className="overflow-x-auto rounded border border-gray-200">
          {calibrationRows.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              {EMPTY_MSG}
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-2 font-medium text-gray-700 whitespace-nowrap">
                    date
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-700 whitespace-nowrap">
                    reviewed_count
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-700 whitespace-nowrap">
                    accuracy_percent
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-700 whitespace-nowrap">
                    avg_confidence_correct
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-700 whitespace-nowrap">
                    avg_confidence_incorrect
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-700 whitespace-nowrap">
                    overconfidence_rate
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-700 whitespace-nowrap">
                    underconfidence_rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {calibrationRows.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-2 text-gray-900 whitespace-nowrap">
                      {formatDate(row.date)}
                    </td>
                    <td className="px-4 py-2 text-gray-900 text-right">
                      {row.reviewed_count}
                    </td>
                    <td className="px-4 py-2 text-gray-900 text-right">
                      {pct(row.accuracy_percent)}%
                    </td>
                    <td className="px-4 py-2 text-gray-900 text-right">
                      {typeof row.avg_confidence_correct === 'number'
                        ? row.avg_confidence_correct.toFixed(2)
                        : '—'}
                    </td>
                    <td className="px-4 py-2 text-gray-900 text-right">
                      {typeof row.avg_confidence_incorrect === 'number'
                        ? row.avg_confidence_incorrect.toFixed(2)
                        : '—'}
                    </td>
                    <td className="px-4 py-2 text-gray-900 text-right">
                      {pct(row.overconfidence_rate)}%
                    </td>
                    <td className="px-4 py-2 text-gray-900 text-right">
                      {pct(row.underconfidence_rate)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
