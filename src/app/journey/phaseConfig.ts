/**
 * phaseConfig.ts
 * 8-Phase Journey 모델의 페이즈→스텝→팀→KPI→개인정보 매핑
 * Notion "고객 여정별 업무 흐름도" 기반
 */
import type {
  JourneyPhase,
  JourneyStep,
  RefundStep,
  ReferralStep,
  SimpleClaimStep,
  TeamRole,
  PhaseStepMeta,
  DbCategoryV2,
  StageKPI,
  PersonalDataEntry,
} from './types';

// ─── Phase 정의 ───

export interface PhaseDefinition {
  phase: JourneyPhase;
  label: string;
  description: string;
  order: number;
}

export const PHASE_DEFINITIONS: PhaseDefinition[] = [
  { phase: 'inflow',         label: '유입',       description: '앱 설치/광고/소개 유입',        order: 1 },
  { phase: 'inquiry',        label: '조회/신청',   description: '건강보험 조회 및 환급/청구 신청', order: 2 },
  { phase: 'classification', label: '선별/배정',   description: 'DB 분류 및 상담팀 배정',         order: 3 },
  { phase: 'tm',             label: '상담/TM',    description: '1차·2차 텔레마케팅 상담',        order: 4 },
  { phase: 'meeting',        label: '미팅/계약',   description: '사전분석, 대면미팅, 계약체결',    order: 5 },
  { phase: 'claims',         label: '청구/분석',   description: '청구접수, 미지급분석, 서류발급',   order: 6 },
  { phase: 'payment',        label: '지급/사후',   description: '지급확인 및 사후관리/정산',       order: 7 },
  { phase: 'growth',         label: 'Growth Loop', description: '소개 푸시 및 재유입 유도',       order: 8 },
];

// ─── 3년환급 스텝 시퀀스 (S1-S17) ───

export const REFUND_STEP_SEQUENCE: RefundStep[] = [
  'S1_inflow',
  'S3_refund_apply',
  'S4_screening',
  'S5_first_tm',
  'S6_second_tm',
  'S7_pre_analysis',
  'S8_meeting_execution',
  'S9_contract_close',
  'S10_claim_receipt',
  'S11_unpaid_analysis',
  'S12_doc_issuance',
  'S13_final_analysis',
  'S14_payment_confirm',
  'S15_aftercare',
  'S16_referral_push',
  'S17_reentry',
];

// ─── 소개 스텝 시퀀스 (R1-R14) ───

export const REFERRAL_STEP_SEQUENCE: ReferralStep[] = [
  'R1_referral_inflow',
  'R3_refund_apply',
  'R4_pre_analysis',        // Same-owner 배정, 선별/TM 스킵
  'R5_meeting_execution',
  'R6_contract_close',
  'R7_claim_receipt',
  'R8_unpaid_analysis',
  'R9_doc_issuance',
  'R10_final_analysis',
  'R11_payment_confirm',
  'R12_aftercare',           // 사후관리 및 정산
  'R13_referral_create',     // 소개 생성/가족 연동
  'R14_reentry',             // 소개 재유입/성장 루프
];

// ─── 간편청구 스텝 시퀀스 (Q1-Q9) ───

export const SIMPLE_CLAIM_STEP_SEQUENCE: SimpleClaimStep[] = [
  'Q1_intake_start',         // 접수 시작
  'Q2_identity_verify',      // 초기 분기/본인확인
  'Q3_first_claim_call',     // 1차 청구콜/서류 확보
  'Q4_precision_analysis',   // 1차 정밀 분석 (교차대조)
  'Q5_customer_confirm',     // 고객 안내/청구 확정
  'Q6_insurer_submit',       // 보험사 접수
  'Q7_payment_tracking',     // 지급 추적/결과 안내
  'Q8_gap_detection',        // 보장 공백 탐지
  'Q9_retention_growth',     // 리텐션/가족/소개 확장
];

// ─── Step → Phase 매핑 ───

export const STEP_TO_PHASE: Record<JourneyStep, JourneyPhase> = {
  // 3년환급
  S1_inflow: 'inflow',
  S3_refund_apply: 'inquiry',
  S4_screening: 'classification',
  S5_first_tm: 'tm',
  S6_second_tm: 'tm',
  S7_pre_analysis: 'meeting',
  S8_meeting_execution: 'meeting',
  S9_contract_close: 'meeting',
  S10_claim_receipt: 'claims',
  S11_unpaid_analysis: 'claims',
  S12_doc_issuance: 'claims',
  S13_final_analysis: 'claims',
  S14_payment_confirm: 'payment',
  S15_aftercare: 'payment',
  S16_referral_push: 'growth',
  S17_reentry: 'growth',
  // 소개 (선별/TM 스킵, Same-owner 자동배정)
  R1_referral_inflow: 'inflow',
  R3_refund_apply: 'inquiry',
  R4_pre_analysis: 'meeting',          // 사전분석 (선별/TM 스킵 → 바로 미팅준비)
  R5_meeting_execution: 'meeting',
  R6_contract_close: 'meeting',
  R7_claim_receipt: 'claims',
  R8_unpaid_analysis: 'claims',
  R9_doc_issuance: 'claims',
  R10_final_analysis: 'claims',
  R11_payment_confirm: 'payment',
  R12_aftercare: 'payment',
  R13_referral_create: 'growth',
  R14_reentry: 'growth',
  // 간편청구 (청구콜 중심, 보장공백탐지 포함)
  Q1_intake_start: 'inflow',
  Q2_identity_verify: 'inquiry',
  Q3_first_claim_call: 'claims',       // 1차 청구콜 → 청구 단계
  Q4_precision_analysis: 'claims',
  Q5_customer_confirm: 'claims',
  Q6_insurer_submit: 'claims',
  Q7_payment_tracking: 'payment',
  Q8_gap_detection: 'growth',          // 보장공백탐지 → 성장
  Q9_retention_growth: 'growth',
};

// ─── Step → 주 담당팀 매핑 ───

export const STEP_PRIMARY_TEAM: Record<JourneyStep, TeamRole> = {
  // 3년환급
  S1_inflow: 'admin',
  S3_refund_apply: 'call_lead',      // Fix: 환급신청은 콜리드 관리
  S4_screening: 'call_lead',
  S5_first_tm: 'call_member',
  S6_second_tm: 'call_member',
  S7_pre_analysis: 'sales_member',
  S8_meeting_execution: 'sales_member',
  S9_contract_close: 'sales_member',
  S10_claim_receipt: 'claims_member',
  S11_unpaid_analysis: 'claims_member',
  S12_doc_issuance: 'claims_member',
  S13_final_analysis: 'claims_lead',
  S14_payment_confirm: 'claims_member',
  S15_aftercare: 'claims_member',   // Fix: 사후관리는 청구팀 담당
  S16_referral_push: 'cs',
  S17_reentry: 'admin',
  // 소개 (Same-owner: 원래 담당자 유지)
  R1_referral_inflow: 'admin',
  R3_refund_apply: 'call_lead',
  R4_pre_analysis: 'sales_member',     // Same-owner 자동배정
  R5_meeting_execution: 'sales_member',
  R6_contract_close: 'sales_member',
  R7_claim_receipt: 'claims_member',
  R8_unpaid_analysis: 'claims_member',
  R9_doc_issuance: 'claims_member',
  R10_final_analysis: 'claims_lead',
  R11_payment_confirm: 'claims_member',
  R12_aftercare: 'claims_member',
  R13_referral_create: 'cs',
  R14_reentry: 'admin',
  // 간편청구 (청구콜 중심)
  Q1_intake_start: 'admin',
  Q2_identity_verify: 'call_lead',        // Fix: 본인확인/초기분기는 콜리드 관리
  Q3_first_claim_call: 'claims_member',  // 1차 청구콜
  Q4_precision_analysis: 'claims_member',
  Q5_customer_confirm: 'claims_member',
  Q6_insurer_submit: 'claims_member',
  Q7_payment_tracking: 'claims_lead',
  Q8_gap_detection: 'cs',               // 보장공백 → CS 분석
  Q9_retention_growth: 'cs',
};

// ─── Step 라벨 ───

export const STEP_LABELS: Record<JourneyStep, string> = {
  // 3년환급
  S1_inflow: '유입',
  S3_refund_apply: '환급 신청',
  S4_screening: '선별/배정',
  S5_first_tm: '1차 TM',
  S6_second_tm: '2차 TM',
  S7_pre_analysis: '사전분석',
  S8_meeting_execution: '미팅 실행',
  S9_contract_close: '계약 체결',
  S10_claim_receipt: '청구 접수',
  S11_unpaid_analysis: '미지급금 분석',
  S12_doc_issuance: '서류 발급',
  S13_final_analysis: '최종 분석',
  S14_payment_confirm: '지급 확인',
  S15_aftercare: '사후관리',
  S16_referral_push: '소개 푸시',
  S17_reentry: '재유입',
  // 소개
  R1_referral_inflow: '소개 유입',
  R3_refund_apply: '환급 신청',
  R4_pre_analysis: '사전분석 (자동배정)',
  R5_meeting_execution: '미팅 진행',
  R6_contract_close: '계약 체결/서류 인계',
  R7_claim_receipt: '청구 접수',
  R8_unpaid_analysis: '미지급 분석',
  R9_doc_issuance: '서류 발급표',
  R10_final_analysis: '최종 분석',
  R11_payment_confirm: '지급 확인',
  R12_aftercare: '사후관리 및 정산',
  R13_referral_create: '소개 생성/가족 연동',
  R14_reentry: '소개 재유입',
  // 간편청구
  Q1_intake_start: '접수 시작',
  Q2_identity_verify: '본인확인/초기분기',
  Q3_first_claim_call: '1차 청구콜',
  Q4_precision_analysis: '정밀 분석',
  Q5_customer_confirm: '고객 안내/청구 확정',
  Q6_insurer_submit: '보험사 접수',
  Q7_payment_tracking: '지급 추적',
  Q8_gap_detection: '보장 공백 탐지',
  Q9_retention_growth: '리텐션/성장',
};

// ─── DB유형별 스텝 시퀀스 분기 ───

/** 보상DB: S7(사전분석) 스킵, 보험가입 제안 없음, 주말미팅 가능 */
export const COMPENSATION_SKIP_STEPS: RefundStep[] = ['S7_pre_analysis'];

/** 소개DB: same-owner 유지, R1-R14 플로우 사용 */
export function getStepSequence(
  journeyType: 'refund' | 'intro' | 'simple',
  dbCategory?: DbCategoryV2,
): JourneyStep[] {
  if (journeyType === 'simple') return [...SIMPLE_CLAIM_STEP_SEQUENCE];
  if (journeyType === 'intro') return [...REFERRAL_STEP_SEQUENCE];

  // 3년환급 - 보상DB면 S7 스킵
  if (dbCategory === 'compensation') {
    return REFUND_STEP_SEQUENCE.filter(s => !COMPENSATION_SKIP_STEPS.includes(s));
  }
  return [...REFUND_STEP_SEQUENCE];
}

// ─── 역할별 가시 스텝 ───

/** 각 역할이 볼 수 있는 Phase 목록 */
export const ROLE_VISIBLE_PHASES: Record<TeamRole, JourneyPhase[]> = {
  call_member:   ['classification', 'tm'],
  call_lead:     ['classification', 'tm'],
  sales_member:  ['meeting'],
  sales_lead:    ['meeting'],
  claims_member: ['claims', 'payment'],
  claims_lead:   ['claims', 'payment'],
  cs:            ['payment', 'growth'],
  compliance:    ['inflow', 'inquiry', 'classification', 'tm', 'meeting', 'claims', 'payment', 'growth'],
  admin:         ['inflow', 'inquiry', 'classification', 'tm', 'meeting', 'claims', 'payment', 'growth'],
};

// ─── KPI 정의 (Notion 기반) ───

export const STEP_KPIS: StageKPI[] = [
  // Phase 1: 유입
  { stepCode: 'S1_inflow', name: '일일 유입수', metric: 'daily_inflow_count', target: '500', unit: '건', team: ['admin'] },
  { stepCode: 'S1_inflow', name: 'CPA', metric: 'cost_per_acquisition', target: '15000', unit: '원', team: ['admin'] },
  { stepCode: 'S1_inflow', name: 'ROAS', metric: 'return_on_ad_spend', target: '300', unit: '%', team: ['admin'] },
  // Phase 2: 신청
  { stepCode: 'S3_refund_apply', name: '조회→신청 전환율', metric: 'lookup_to_apply_rate', target: '60', unit: '%', team: ['call_lead'] },
  { stepCode: 'S3_refund_apply', name: '신청 이탈률', metric: 'apply_dropout_rate', target: '20', unit: '%', team: ['call_lead'] },
  // Phase 3: 선별/배정
  { stepCode: 'S4_screening', name: '분류 정확도', metric: 'classification_accuracy', target: '95', unit: '%', team: ['call_lead'] },
  { stepCode: 'S4_screening', name: '배정 리드타임', metric: 'assignment_lead_time', target: '30', unit: '분', team: ['call_lead'] },
  { stepCode: 'S4_screening', name: '인당 배정 건수', metric: 'per_person_assignment', target: '25', unit: '건', team: ['call_lead'] },
  // Phase 4: TM
  { stepCode: 'S5_first_tm', name: '1차 통화 연결률', metric: 'first_call_connect_rate', target: '70', unit: '%', team: ['call_member'] },
  { stepCode: 'S5_first_tm', name: '평균 통화 시간', metric: 'avg_call_duration', target: '5', unit: 'min', team: ['call_member'] },
  { stepCode: 'S6_second_tm', name: '미팅 전환율', metric: 'meeting_conversion_rate', target: '40', unit: '%', team: ['call_member'] },
  { stepCode: 'S6_second_tm', name: '일 콜 수', metric: 'daily_call_count', target: '80', unit: '건', team: ['call_member'] },
  // Phase 5: 미팅
  { stepCode: 'S8_meeting_execution', name: '미팅 완료율', metric: 'meeting_completion_rate', target: '85', unit: '%', team: ['sales_member'] },
  { stepCode: 'S9_contract_close', name: '계약 체결률', metric: 'contract_close_rate', target: '60', unit: '%', team: ['sales_member'] },
  { stepCode: 'S9_contract_close', name: '건당 보험료', metric: 'premium_per_contract', target: '15', unit: '만원', team: ['sales_member'] },
  // Phase 6: 청구
  { stepCode: 'S10_claim_receipt', name: '청구 접수 건수', metric: 'claim_receipt_count', target: '50', unit: '건/일', team: ['claims_member'] },
  { stepCode: 'S11_unpaid_analysis', name: '미지급금 발굴율', metric: 'unpaid_discovery_rate', target: '30', unit: '%', team: ['claims_member'] },
  { stepCode: 'S13_final_analysis', name: '최종분석 정확도', metric: 'final_analysis_accuracy', target: '95', unit: '%', team: ['claims_lead'] },
  // Phase 7: 지급
  { stepCode: 'S14_payment_confirm', name: '평균 지급 소요일', metric: 'avg_payment_days', target: '14', unit: '일', team: ['claims_member'] },
  { stepCode: 'S15_aftercare', name: '고객 만족도', metric: 'customer_satisfaction', target: '4.5', unit: '/5', team: ['claims_member'] },
  // Phase 8: Growth
  { stepCode: 'S16_referral_push', name: '소개 전환율', metric: 'referral_conversion_rate', target: '15', unit: '%', team: ['cs'] },

  // ─── 소개(R) KPIs ───
  { stepCode: 'R1_referral_inflow', name: '소개 유입 건수', metric: 'referral_inflow_count', target: '20', unit: '건/주', team: ['admin'] },
  { stepCode: 'R4_pre_analysis', name: 'Same-owner 자동배정률', metric: 'same_owner_assign_rate', target: '95', unit: '%', team: ['sales_member'] },
  { stepCode: 'R5_meeting_execution', name: '소개 미팅 전환율', metric: 'referral_meeting_rate', target: '60', unit: '%', team: ['sales_member'] },
  { stepCode: 'R6_contract_close', name: '소개 계약 체결률', metric: 'referral_contract_rate', target: '50', unit: '%', team: ['sales_member'] },
  { stepCode: 'R11_payment_confirm', name: '소개건 평균 지급일', metric: 'referral_avg_payment_days', target: '10', unit: '일', team: ['claims_member'] },
  { stepCode: 'R12_aftercare', name: '소개 정산 완료율', metric: 'referral_settlement_rate', target: '90', unit: '%', team: ['claims_member'] },
  { stepCode: 'R13_referral_create', name: '2차 소개 생성률', metric: 'secondary_referral_rate', target: '20', unit: '%', team: ['cs'] },
  { stepCode: 'R14_reentry', name: '소개 재유입률', metric: 'referral_reentry_rate', target: '10', unit: '%', team: ['admin'] },

  // ─── 간편청구(Q) KPIs ───
  { stepCode: 'Q1_intake_start', name: '일 접수 건수', metric: 'daily_intake_count', target: '30', unit: '건', team: ['admin'] },
  { stepCode: 'Q2_identity_verify', name: '본인확인 완료율', metric: 'identity_verify_rate', target: '95', unit: '%', team: ['call_member'] },
  { stepCode: 'Q3_first_claim_call', name: '1차 청구콜 연결률', metric: 'first_claim_call_rate', target: '80', unit: '%', team: ['claims_member'] },
  { stepCode: 'Q3_first_claim_call', name: '서류 확보율', metric: 'doc_collection_rate', target: '80', unit: '%', team: ['claims_member'] },
  { stepCode: 'Q4_precision_analysis', name: '교차대조 정확도', metric: 'cross_check_accuracy', target: '90', unit: '%', team: ['claims_member'] },
  { stepCode: 'Q5_customer_confirm', name: '고객 확정률', metric: 'customer_confirm_rate', target: '85', unit: '%', team: ['claims_member'] },
  { stepCode: 'Q6_insurer_submit', name: '보험사 접수 TAT', metric: 'insurer_submit_tat', target: '2', unit: '일', team: ['claims_member'] },
  { stepCode: 'Q7_payment_tracking', name: '지급 추적 완료율', metric: 'payment_tracking_rate', target: '90', unit: '%', team: ['claims_lead'] },
  { stepCode: 'Q8_gap_detection', name: '보장공백 탐지율', metric: 'gap_detection_rate', target: '25', unit: '%', team: ['cs'] },
  { stepCode: 'Q9_retention_growth', name: '리텐션 전환율', metric: 'retention_conversion_rate', target: '15', unit: '%', team: ['cs'] },
];

// ─── 헬퍼 함수 ───

export function getPhaseForStep(step: JourneyStep): JourneyPhase {
  return STEP_TO_PHASE[step];
}

export function getPhaseDefinition(phase: JourneyPhase): PhaseDefinition {
  return PHASE_DEFINITIONS.find(p => p.phase === phase)!;
}

export function getStepLabel(step: JourneyStep): string {
  return STEP_LABELS[step];
}

export function getKpisForStep(step: JourneyStep): StageKPI[] {
  return STEP_KPIS.filter(k => k.stepCode === step);
}

export function isStepVisibleToRole(step: JourneyStep, role: TeamRole): boolean {
  const phase = STEP_TO_PHASE[step];
  return ROLE_VISIBLE_PHASES[role].includes(phase);
}

/** 현재 스텝의 다음 스텝 반환 (시퀀스 끝이면 null) */
export function getNextStep(
  currentStep: JourneyStep,
  journeyType: 'refund' | 'intro' | 'simple',
  dbCategory?: DbCategoryV2,
): JourneyStep | null {
  const seq = getStepSequence(journeyType, dbCategory);
  const idx = seq.indexOf(currentStep);
  if (idx === -1 || idx === seq.length - 1) return null;
  return seq[idx + 1];
}

/** 현재 스텝의 진행률 (0-100) */
export function getStepProgress(
  currentStep: JourneyStep,
  journeyType: 'refund' | 'intro' | 'simple',
  dbCategory?: DbCategoryV2,
): number {
  const seq = getStepSequence(journeyType, dbCategory);
  const idx = seq.indexOf(currentStep);
  if (idx === -1) return 0;
  return Math.round(((idx + 1) / seq.length) * 100);
}
