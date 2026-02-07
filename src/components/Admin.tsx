import { useEffect, useState, useCallback } from 'react';
import {
  getAdminWeights,
  patchAdminWeights,
  getConflictedDecisions,
  approveConflictedDecision,
  type WeightsMap,
  type AdminWeightsResponse,
  type ConflictedDecision,
} from '../api/client';

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

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString();
  } catch {
    return iso;
  }
}

const EMPTY_CONFLICTED_MSG = 'No conflicted decisions.';

export function Admin() {
  const [weightsData, setWeightsData] = useState<AdminWeightsResponse | null>(
    null
  );
  const [weightsLoading, setWeightsLoading] = useState(false);
  const [weightsError, setWeightsError] = useState<string | null>(null);
  const [weightsEdit, setWeightsEdit] = useState<WeightsMap | null>(null);
  const [conflicted, setConflicted] = useState<ConflictedDecision[]>([]);
  const [conflictedLoading, setConflictedLoading] = useState(false);
  const [conflictedError, setConflictedError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [suggestedWeightsModal, setSuggestedWeightsModal] = useState<WeightsMap | null>(null);
  const [detailsPopupRow, setDetailsPopupRow] = useState<ConflictedDecision | null>(null);
  const [patchLoading, setPatchLoading] = useState(false);

  const truncate = (s: string | undefined | null, max: number) =>
    s && s.length > max ? `${s.slice(0, max)}…` : s ?? '—';

  const fetchWeights = useCallback(async () => {
    setWeightsLoading(true);
    setWeightsError(null);
    try {
      const data = await getAdminWeights();
      setWeightsData(data);
      setWeightsEdit(null);
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err
        ? (err as { response: { status: number } }).response
        : null;
      setWeightsError(
        res?.status === 404
          ? 'Weights endpoint not found.'
          : 'Failed to load signal weights.'
      );
    } finally {
      setWeightsLoading(false);
    }
  }, []);

  const fetchConflicted = useCallback(async () => {
    setConflictedLoading(true);
    setConflictedError(null);
    try {
      const data = await getConflictedDecisions();
      setConflicted(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err
        ? (err as { response: { status: number } }).response
        : null;
      setConflictedError(
        res?.status === 404
          ? 'Conflicted decisions endpoint not found.'
          : 'Failed to load conflicted decisions.'
      );
    } finally {
      setConflictedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeights();
    fetchConflicted();
  }, [fetchWeights, fetchConflicted]);

  const applySuggestion = async () => {
    if (!weightsData?.pending_suggestion) return;
    setPatchLoading(true);
    setWeightsError(null);
    try {
      const data = await patchAdminWeights({
        signal_weights: weightsData.pending_suggestion,
      });
      setWeightsData(data);
    } catch (err: unknown) {
      setWeightsError('Failed to apply suggestion.');
    } finally {
      setPatchLoading(false);
    }
  };

  const dismissSuggestion = () => {
    if (!weightsData) return;
    setWeightsData({ ...weightsData, pending_suggestion: undefined });
  };

  const saveManualWeights = async () => {
    if (!weightsEdit || !weightsData) return;
    setPatchLoading(true);
    setWeightsError(null);
    try {
      const data = await patchAdminWeights({ signal_weights: weightsEdit });
      setWeightsData(data);
      setWeightsEdit(null);
    } catch (err: unknown) {
      setWeightsError('Failed to save weights.');
    } finally {
      setPatchLoading(false);
    }
  };

  const handleApproveForLearning = async (humanReviewId: string) => {
    setApprovingId(humanReviewId);
    setApproveError(null);
    try {
      const res = await approveConflictedDecision(humanReviewId);
      setConflicted((prev) =>
        prev.map((r) =>
          r.human_review_id === humanReviewId
            ? { ...r, approved_for_learning: true }
            : r
        )
      );
      if (res.suggested_weights && Object.keys(res.suggested_weights).length > 0) {
        setSuggestedWeightsModal(res.suggested_weights);
      } else {
        await fetchWeights();
      }
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err
        ? (err as { response: { status: number } }).response
        : null;
      if (res?.status === 400) {
        setApproveError('Invalid request (e.g. already approved).');
      } else if (res?.status === 404) {
        setApproveError('Review not found.');
      } else {
        setApproveError('Failed to approve for learning.');
      }
    } finally {
      setApprovingId(null);
    }
  };

  const applySuggestedWeightsFromModal = async () => {
    if (!suggestedWeightsModal) return;
    setPatchLoading(true);
    setWeightsError(null);
    try {
      await patchAdminWeights({ signal_weights: suggestedWeightsModal });
      setSuggestedWeightsModal(null);
      await fetchWeights();
    } catch {
      setWeightsError('Failed to apply suggested weights.');
    } finally {
      setPatchLoading(false);
    }
  };

  const signalNames =
    weightsData?.weights && Object.keys(weightsData.weights).length > 0
      ? Object.keys(weightsData.weights).sort()
      : weightsData?.pending_suggestion
        ? Object.keys(weightsData.pending_suggestion).sort()
        : [];

  const displayWeights = weightsEdit ?? weightsData?.weights ?? {};
  const hasEdit =
    weightsEdit &&
    signalNames.some(
      (name) => (weightsEdit[name] ?? 0) !== (weightsData?.weights?.[name] ?? 0)
    );

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-gray-900">Admin</h2>

      {/* Block 1: Signal weights */}
      <section className="rounded border border-gray-200 bg-white">
        <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 px-4 py-3 bg-gray-50">
          Signal weights
        </h3>
        <div className="p-4">
          {weightsLoading && (
            <p className="text-sm text-gray-500">Loading weights…</p>
          )}
          {weightsError && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800 mb-3">
              {weightsError}
            </div>
          )}
          {!weightsLoading && weightsData && (
            <div className="space-y-4">
              {weightsData.system_score != null && (
                <p className="text-sm text-gray-700">
                  <strong>System score:</strong> {weightsData.system_score}
                </p>
              )}
              {weightsData.pending_suggestion &&
                Object.keys(weightsData.pending_suggestion).length > 0 && (
                  <div className="rounded border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm font-medium text-amber-800 mb-2">
                      Pending weight suggestion
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={applySuggestion}
                        disabled={patchLoading}
                        className="rounded bg-amber-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                      >
                        Apply suggestion
                      </button>
                      <button
                        type="button"
                        onClick={dismissSuggestion}
                        className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {signalNames.map((name) => (
                  <label key={name} className="block">
                    <span className="text-sm font-medium text-gray-700">
                      {name}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={displayWeights[name] ?? 0}
                      onChange={(e) => {
                        const v = Math.min(
                          100,
                          Math.max(0, Number(e.target.value) || 0)
                        );
                        setWeightsEdit((prev) => ({
                          ...(prev ?? weightsData?.weights ?? {}),
                          [name]: v,
                        }));
                      }}
                      className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                  </label>
                ))}
              </div>
              {signalNames.length > 0 && (
                <div className="flex gap-2">
                  {hasEdit && (
                    <button
                      type="button"
                      onClick={saveManualWeights}
                      disabled={patchLoading}
                      className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      Save
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={fetchWeights}
                    disabled={weightsLoading}
                    className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Refresh weights
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Block 2: Conflicted decisions */}
      <section className="rounded border border-gray-200 bg-white">
        <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 px-4 py-3 bg-gray-50 flex items-center justify-between">
          <span>Conflicted decisions</span>
          <button
            type="button"
            onClick={fetchConflicted}
            disabled={conflictedLoading}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Refresh
          </button>
        </h3>
        <div className="p-4">
          {conflictedLoading && (
            <p className="text-sm text-gray-500">Loading conflicted decisions…</p>
          )}
          {conflictedError && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800 mb-3">
              {conflictedError}
            </div>
          )}
          {approveError && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800 mb-3">
              {approveError}
            </div>
          )}
          {!conflictedLoading && conflicted.length === 0 && !conflictedError && (
            <p className="text-sm text-gray-500">{EMPTY_CONFLICTED_MSG}</p>
          )}
          {!conflictedLoading && conflicted.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-3 py-2 font-medium text-gray-700 whitespace-nowrap">
                      When
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-gray-700 whitespace-nowrap">
                      Who
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-gray-700 whitespace-nowrap">
                      System / Human
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-gray-700 whitespace-nowrap">
                      Human note
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-gray-700 whitespace-nowrap">
                      Details
                    </th>
                    <th className="text-right px-3 py-2 font-medium text-gray-700 whitespace-nowrap">
                      Risk
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-gray-700 whitespace-nowrap">
                      Signals
                    </th>
                    <th className="text-right px-3 py-2 font-medium text-gray-700 whitespace-nowrap">
                      Payout
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-gray-700 whitespace-nowrap">
                      Approved for learning
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-gray-700 whitespace-nowrap">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {conflicted.map((row) => (
                    <tr
                      key={row.human_review_id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="px-3 py-2 text-gray-900 whitespace-nowrap">
                        {formatDateTime(row.created_at ?? row.reviewed_at ?? '')}
                      </td>
                      <td className="px-3 py-2 text-gray-900 max-w-[140px]">
                        <span className="block truncate" title={row.user_id ?? row.payout_summary ?? undefined}>
                          {truncate(row.user_id ?? row.payout_summary ?? undefined, 35)}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="flex flex-wrap gap-1 items-center">
                          <DecisionBadge decision={row.system_decision} />
                          <span className="text-gray-400">→</span>
                          <DecisionBadge decision={row.human_decision} />
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-800 max-w-[120px]">
                        <span className="block truncate" title={row.human_note ?? undefined}>
                          {truncate(row.human_note ?? undefined, 25)}
                        </span>
                      </td>
                      <td className="px-3 py-2 max-w-[100px]">
                        <button
                          type="button"
                          onClick={() => setDetailsPopupRow(row)}
                          className="text-blue-600 hover:underline text-xs font-medium"
                        >
                          View details
                        </button>
                      </td>
                      <td className="px-3 py-2 text-gray-900 text-right">
                        {row.risk_score}
                      </td>
                      <td className="px-3 py-2 text-gray-800 max-w-[120px]">
                        <span className="block truncate" title={(row.triggered_signals ?? []).join(', ')}>
                          {truncate((row.triggered_signals ?? []).join(', '), 20) || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-900 max-w-[100px]">
                        <span className="block truncate text-right" title={row.payout_summary ?? undefined}>
                          {row.amount != null && row.currency != null
                            ? `${row.amount} ${row.currency}`
                            : truncate(row.payout_summary, 18)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {row.approved_for_learning ? (
                          <span className="text-green-700 font-medium">Yes</span>
                        ) : (
                          <span className="text-gray-500">No</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {!row.approved_for_learning && (
                          <button
                            type="button"
                            onClick={() =>
                              handleApproveForLearning(row.human_review_id)
                            }
                            disabled={approvingId === row.human_review_id}
                            className="rounded bg-gray-900 px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
                          >
                            {approvingId === row.human_review_id
                              ? '…'
                              : 'Approve for learning'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Modal: Conflicted decision details (AI explanation, note, payout, etc.) */}
      {detailsPopupRow && (
        <div
          className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="details-modal-title"
        >
          <div className="rounded border border-gray-200 bg-white p-6 max-w-xl w-full shadow-lg max-h-[90vh] overflow-y-auto">
            <h4 id="details-modal-title" className="text-sm font-semibold text-gray-900 mb-4">
              Conflicted decision details
            </h4>
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap gap-2 items-center">
                <DecisionBadge decision={detailsPopupRow.system_decision} />
                <span className="text-gray-400">→</span>
                <DecisionBadge decision={detailsPopupRow.human_decision} />
                <span className="text-gray-500">
                  {formatDateTime(detailsPopupRow.created_at ?? detailsPopupRow.reviewed_at ?? '')}
                </span>
              </div>
              {detailsPopupRow.payout_summary && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">Payout summary</p>
                  <p className="text-gray-800 whitespace-pre-wrap break-words">{detailsPopupRow.payout_summary}</p>
                </div>
              )}
              {detailsPopupRow.user_id && !detailsPopupRow.payout_summary && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">Who</p>
                  <p className="text-gray-800">{detailsPopupRow.user_id}</p>
                </div>
              )}
              <div>
                <p className="font-medium text-gray-700 mb-1">Risk score</p>
                <p className="text-gray-800">{detailsPopupRow.risk_score}</p>
              </div>
              {(detailsPopupRow.triggered_signals ?? []).length > 0 && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">Triggered signals</p>
                  <p className="text-gray-800">{(detailsPopupRow.triggered_signals ?? []).join(', ')}</p>
                </div>
              )}
              {detailsPopupRow.human_note && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">Human note</p>
                  <p className="text-gray-800 whitespace-pre-wrap">{detailsPopupRow.human_note}</p>
                </div>
              )}
              {detailsPopupRow.system_explanation && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">AI explanation</p>
                  <p className="text-gray-800 whitespace-pre-wrap">{detailsPopupRow.system_explanation}</p>
                </div>
              )}
              {(detailsPopupRow.reasons ?? []).length > 0 && (
                <div>
                  <p className="font-medium text-gray-700 mb-1">Reasons</p>
                  <ul className="list-disc list-inside text-gray-800">
                    {(detailsPopupRow.reasons ?? []).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              {!detailsPopupRow.approved_for_learning && (
                <button
                  type="button"
                  onClick={() => {
                    handleApproveForLearning(detailsPopupRow.human_review_id);
                    setDetailsPopupRow(null);
                  }}
                  disabled={approvingId === detailsPopupRow.human_review_id}
                  className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {approvingId === detailsPopupRow.human_review_id ? '…' : 'Approve for learning'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setDetailsPopupRow(null)}
                className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Apply suggested weights */}
      {suggestedWeightsModal && (
        <div
          className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="rounded border border-gray-200 bg-white p-6 max-w-md w-full shadow-lg">
            <h4 id="modal-title" className="text-sm font-semibold text-gray-900 mb-3">
              Suggested weights from approval
            </h4>
            <div className="space-y-2 mb-4 text-sm text-gray-800">
              {Object.entries(suggestedWeightsModal).map(([name, val]) => (
                <div key={name} className="flex justify-between">
                  <span>{name}</span>
                  <span>{val}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={applySuggestedWeightsFromModal}
                disabled={patchLoading}
                className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {patchLoading ? 'Applying…' : 'Apply these weights'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSuggestedWeightsModal(null);
                  fetchWeights();
                }}
                className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
