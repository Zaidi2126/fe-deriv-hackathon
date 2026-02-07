import axios from 'axios';

const baseURL =
  typeof import.meta.env.VITE_API_BASE_URL === 'string' &&
  import.meta.env.VITE_API_BASE_URL.trim() !== ''
    ? import.meta.env.VITE_API_BASE_URL.trim().replace(/\/$/, '')
    : 'http://127.0.0.1:8000';

export const apiClient = axios.create({
  baseURL,
  timeout: 10000,
});

export async function checkHealth(): Promise<{ ok: boolean }> {
  await apiClient.get('/health');
  return { ok: true };
}

// --- Payout decision ---

export interface PayoutDecisionRequest {
  user_id: string;
  amount: number;
  currency: string;
  payment_method_id: string;
  payment_method_age_days: number;
  country: string;
  ip_address: string;
  vpn_detected: boolean;
  total_trades: number;
  total_trade_volume: number;
  expected_country?: string;
  withdrawals_last_1h?: number;
  withdrawals_last_24h?: number;
  deposits_last_1h?: number;
  /** Card declines for this user/card in last 24h */
  card_decline_count_24h?: number;
  /** Failed logins for this user in last 24h */
  failed_login_count_24h?: number;
  /** Device/fingerprint id; same device_id for 3+ users adds device shared risk */
  device_id?: string;
}

export interface ConfidenceAndRegretIndex {
  confidence_band?: string;
  recommended_next_step?: string;
  action_rationale?: string;
}

export interface PayoutDecisionResponse {
  decision: 'approve' | 'review' | 'block';
  risk_score: number;
  confidence_score: number;
  regret_level: number;
  triggered_signals: string[];
  reasons: string[];
  counterfactuals: string[];
  confidence_and_regret_index: ConfidenceAndRegretIndex;
}

export async function createPayoutDecision(
  payload: PayoutDecisionRequest
): Promise<PayoutDecisionResponse> {
  const { data } = await apiClient.post<PayoutDecisionResponse>(
    '/api/payouts/decision',
    payload
  );
  return data;
}

// --- Risk trajectory ---

export interface RiskTrajectoryPoint {
  ts: string;
  risk_score: number;
  decision: string;
}

export interface RiskTrajectoryResponse {
  user_id: string;
  window_days: number;
  points: RiskTrajectoryPoint[];
  trend: 'rising' | 'falling' | 'flat';
  momentum: number;
  summary: string;
}

export async function getRiskTrajectory(
  userId: string,
  days: number
): Promise<RiskTrajectoryResponse> {
  const { data } = await apiClient.get<RiskTrajectoryResponse>(
    `/api/users/${encodeURIComponent(userId)}/risk-trajectory`,
    { params: { days } }
  );
  return data;
}

// --- Fraud readiness ---

export type FraudReadinessScenario =
  | 'no_trade_fraud'
  | 'short_trade_abuse'
  | 'new_payment_method_risk'
  | 'velocity_abuse'
  | 'geo_vpn_anomaly';

export interface FraudReadinessRequest {
  user_id: string;
  amount: number;
  currency: string;
  payment_method_id: string;
  payment_method_age_days: number;
  country: string;
  ip_address: string;
  vpn_detected: boolean;
  total_trades: number;
  total_trade_volume: number;
  expected_country?: string;
  withdrawals_last_1h?: number;
  withdrawals_last_24h?: number;
  deposits_last_1h?: number;
  card_decline_count_24h?: number;
  failed_login_count_24h?: number;
  device_id?: string;
  scenarios?: FraudReadinessScenario[];
}

export interface FraudReadinessResult {
  simulated_pattern: string;
  simulated_risk_score: number;
  readiness_level: 'low' | 'medium' | 'high';
  decision: 'approve' | 'review' | 'block';
  triggered_signals: string[];
  reasons: string[];
}

export interface FraudReadinessResponse {
  base_user_id: string;
  results: FraudReadinessResult[];
}

export async function simulateFraudReadiness(
  payload: FraudReadinessRequest
): Promise<FraudReadinessResponse> {
  const { data } = await apiClient.post<FraudReadinessResponse>(
    '/api/fraud-readiness/simulate',
    payload
  );
  return data;
}

// --- Metrics ---

export interface DailyMetric {
  date: string;
  total_requests: number;
  auto_approved: number;
  auto_blocked: number;
  sent_to_review: number;
  accuracy_percent: number;
  false_positive_rate: number;
  false_negative_rate: number;
}

export interface CalibrationStat {
  date: string;
  reviewed_count: number;
  correct_count: number;
  incorrect_count: number;
  accuracy_percent: number;
  avg_confidence_correct: number;
  avg_confidence_incorrect: number;
  overconfidence_rate: number;
  underconfidence_rate: number;
}

export async function getDailyMetrics(): Promise<DailyMetric[]> {
  const { data } = await apiClient.get<DailyMetric[]>('/api/metrics/daily');
  return data;
}

export async function getCalibrationMetrics(): Promise<CalibrationStat[]> {
  const { data } = await apiClient.get<CalibrationStat[]>(
    '/api/metrics/calibration'
  );
  return data;
}

// --- Payout history ---

export interface PayoutHistoryItem {
  risk_decision_id?: string;
  created_at: string;
  user_id: string;
  amount: number;
  currency: string;
  decision: 'approve' | 'review' | 'block';
  risk_score: number;
  confidence_score: number;
  regret_level: number;
  human_final_decision?: 'approve' | 'review' | 'block' | null;
  human_overrode?: boolean;
  human_note?: string | null;
  triggered_signals?: string[];
  reasons?: string[];
  counterfactuals?: string[];
}

export interface GetPayoutHistoryParams {
  limit?: number;
  decision?: 'approve' | 'review' | 'block';
  user_id?: string;
  days?: number;
}

export async function getPayoutHistory(
  params: GetPayoutHistoryParams = {}
): Promise<PayoutHistoryItem[]> {
  const { data } = await apiClient.get<PayoutHistoryItem[]>(
    '/api/payouts/history',
    { params }
  );
  return data;
}

// --- Send daily summary (Slack) ---

export async function sendDailySummary(
  slackWebhookUrl: string
): Promise<void> {
  await apiClient.post('/api/reports/send-daily-summary', {
    slack_webhook_url: slackWebhookUrl.trim(),
  });
}

// --- Review explanation (decision = "review") ---

export interface ReviewExplanationResponse {
  risk_decision_id: string;
  explanation: string;
}

export async function getReviewExplanation(
  riskDecisionId: string
): Promise<ReviewExplanationResponse> {
  const { data } = await apiClient.get<ReviewExplanationResponse>(
    `/api/decisions/${encodeURIComponent(riskDecisionId)}/review-explanation`
  );
  return data;
}

// --- Resolve review (decision = "review" → human chooses approve/block) ---

export async function submitResolveReview(
  riskDecisionId: string,
  finalDecision: 'approve' | 'block',
  note?: string
): Promise<void> {
  await apiClient.post('/api/reviews', {
    risk_decision_id: riskDecisionId,
    action: 'resolve',
    final_decision: finalDecision,
    ...(note != null && note.trim() !== '' && { note: note.trim() }),
  });
}

// --- Human review accept / conflict (decision = approve/block) ---

export interface SubmitReviewAccept {
  risk_decision_id: string;
  reviewer_id: string;
  action: 'accept';
}

export interface SubmitReviewConflict {
  risk_decision_id: string;
  reviewer_id: string;
  action: 'conflict';
  final_decision: 'approve' | 'block';
  note: string;
}

export type SubmitReviewPayload = SubmitReviewAccept | SubmitReviewConflict;

export async function submitReview(
  payload: SubmitReviewPayload
): Promise<void> {
  await apiClient.post('/api/reviews', payload);
}

// --- Admin: signal weights ---

export type WeightsMap = Record<string, number>;

export interface AdminWeightsResponse {
  weights: WeightsMap;
  pending_suggestion?: WeightsMap | null;
  system_score?: number;
}

/** Backend may return weights as "weights" or "signal_weights". */
export async function getAdminWeights(): Promise<AdminWeightsResponse> {
  const { data } = await apiClient.get<AdminWeightsResponse & { signal_weights?: WeightsMap }>(
    '/api/admin/weights'
  );
  const weights = data.weights ?? data.signal_weights ?? {};
  return {
    weights,
    pending_suggestion: data.pending_suggestion ?? undefined,
    system_score: data.system_score ?? undefined,
  };
}

/** PATCH body uses "signal_weights" key. */
export async function patchAdminWeights(payload: {
  signal_weights?: WeightsMap;
}): Promise<AdminWeightsResponse> {
  const { data } = await apiClient.patch<AdminWeightsResponse & { signal_weights?: WeightsMap }>(
    '/api/admin/weights',
    payload
  );
  const weights = data.weights ?? data.signal_weights ?? {};
  return {
    weights,
    pending_suggestion: data.pending_suggestion ?? undefined,
    system_score: data.system_score ?? undefined,
  };
}

// --- Admin: conflicted decisions ---

export interface ConflictedDecision {
  human_review_id: string;
  created_at?: string;
  reviewed_at?: string;
  risk_decision_id?: string;
  payout_request_id?: string;
  reviewer_id?: string;
  user_id?: string;
  system_decision: string;
  human_decision: string;
  human_note?: string | null;
  system_explanation?: string | null;
  risk_score: number;
  triggered_signals?: string[];
  reasons?: string[];
  amount?: number;
  currency?: string;
  payout_summary?: string;
  approved_for_learning?: boolean;
}

/** Backend returns { conflicted_decisions: ConflictedDecision[] }. */
export async function getConflictedDecisions(): Promise<ConflictedDecision[]> {
  const { data } = await apiClient.get<{ conflicted_decisions?: ConflictedDecision[] } | ConflictedDecision[]>(
    '/api/admin/conflicted-decisions'
  );
  if (Array.isArray(data)) return data;
  return data?.conflicted_decisions ?? [];
}

export interface ApproveForLearningResponse {
  suggested_weights?: WeightsMap;
}

export async function approveConflictedDecision(
  humanReviewId: string
): Promise<ApproveForLearningResponse> {
  const { data } = await apiClient.post<ApproveForLearningResponse>(
    `/api/admin/conflicted-decisions/${encodeURIComponent(humanReviewId)}/approve`
  );
  return data;
}

// --- Fraud network ---

export interface FraudNetworkNode {
  user_id: string;
  label?: string;
}

export interface FraudNetworkEdge {
  from: string;
  to: string;
  link_type: 'payment_method' | 'ip_address' | 'device_id';
}

export interface FraudNetworkResponse {
  nodes: FraudNetworkNode[];
  edges: FraudNetworkEdge[];
  summary: string;
}

export async function getFraudNetwork(
  userId: string,
  summary = true
): Promise<FraudNetworkResponse> {
  const { data } = await apiClient.get<FraudNetworkResponse>(
    '/api/fraud-network',
    { params: { user_id: userId, summary: summary ? 1 : 0 } }
  );
  return data;
}

// --- Exposure ---

export interface ExposureResponse {
  total_exposure: number;
  currency: string;
  user_count: number;
  explanation: string;
}

export async function getExposure(
  userIds: string[],
  days = 30
): Promise<ExposureResponse> {
  const { data } = await apiClient.get<ExposureResponse>('/api/exposure', {
    params: { user_ids: userIds.join(','), days },
  });
  return data;
}

// --- Bulk incident ---

export interface BulkActionResponse {
  flagged_count?: number;
  drafted_client_message?: string;
}

export async function postBulkIncident(payload: {
  user_ids: string[];
  action: string;
  reason: string;
}): Promise<BulkActionResponse> {
  const { data } = await apiClient.post<BulkActionResponse>(
    '/api/incidents/bulk-action',
    payload
  );
  return data;
}

// --- NL Query ---

export interface QueryResponse {
  interpreted_filters?: Record<string, unknown>;
  results: { user_id: string }[];
  count: number;
  message?: string;
}

export async function postQuery(question: string): Promise<QueryResponse> {
  const { data } = await apiClient.post<QueryResponse>('/api/query', {
    question,
  });
  return data;
}

// --- Emerging patterns ---

export interface EmergingPattern {
  signal_combo: string;
  case_count: number;
  description: string;
  transaction_ids?: string[];
  account_ids?: string[];
}

export interface EmergingPatternsResponse {
  patterns: EmergingPattern[];
  days: number;
}

export async function getEmergingPatterns(
  days = 7
): Promise<EmergingPatternsResponse> {
  const { data } = await apiClient.get<EmergingPatternsResponse>(
    '/api/patterns/emerging',
    { params: { days } }
  );
  return data;
}
