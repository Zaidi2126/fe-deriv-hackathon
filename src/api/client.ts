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
