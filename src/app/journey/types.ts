export type JourneyType = 'refund' | 'simple' | 'intro' | 'family';
export type JourneyStage = 'request' | 'consultation' | 'meeting' | 'handoff' | 'claims' | 'closed';
export type RequirementSeverity = 'block' | 'warn';
export type RequirementKind = 'field' | 'document' | 'integration' | 'schedule' | 'note';
export type VerificationState = 'missing' | 'sent' | 'received' | 'verified' | 'waived';
export type DocumentSource = 'gloSign' | 'easyPaper' | 'upload' | 'generated' | 'manual';
export type IntegrationProvider = 'hira' | 'gloSign' | 'easyPaper' | 'script' | 'kakao' | 'claims';
export type IntegrationState = 'idle' | 'requested' | 'sent' | 'received' | 'verified' | 'failed';
export type DocumentPackCode = 'base_consent_pack' | 'refund_claim_pack' | 'sales_contract_pack' | 'family_pack' | 'referral_pack';
export type DbCategory = '' | 'possible' | 'compensation' | 'intro' | 'companion';
export type AssignmentSource = 'manual' | 'scheduled_auto' | 'urgent_auto';
export type NotificationState = 'pending' | 'sent' | 'failed' | 'verified';
export type ExcludeState = 'active' | 'excluded';

// ─── 8-Phase Journey 모델 (Notion 업무 흐름도 기반) ───

/** 8개 메인 페이즈 */
export type JourneyPhase =
  | 'inflow'          // Phase 1: 유입
  | 'inquiry'         // Phase 2: 조회/신청
  | 'classification'  // Phase 3: 선별/배정
  | 'tm'              // Phase 4: 상담/TM
  | 'meeting'         // Phase 5: 미팅/계약
  | 'claims'          // Phase 6: 청구/분석
  | 'payment'         // Phase 7: 지급/사후
  | 'growth';         // Phase 8: Growth Loop

/** 3년환급 세부 스텝 (S1-S17) */
export type RefundStep =
  | 'S1_inflow'                // 유입 (앱설치, 광고유입)
  | 'S2_hira_lookup'           // 건강보험 조회
  | 'S3_refund_apply'          // 환급 신청
  | 'S4_screening'             // 선별/배정
  | 'S5_first_tm'              // 1차 TM (초기상담)
  | 'S6_second_tm'             // 2차 TM (심화상담)
  | 'S7_pre_analysis'          // 사전분석
  | 'S8_meeting_execution'     // 미팅 실행
  | 'S9_contract_close'        // 계약 체결
  | 'S10_claim_receipt'        // 청구 접수
  | 'S11_unpaid_analysis'      // 미지급금 분석
  | 'S12_doc_issuance'         // 서류 발급
  | 'S13_final_analysis'       // 최종 분석/제출
  | 'S14_payment_confirm'      // 지급 확인
  | 'S15_aftercare'            // 사후관리/정산
  | 'S16_referral_push'        // 소개 푸시
  | 'S17_reentry';             // 재유입 유도

/** 소개 세부 스텝 (R1-R14) — Notion 기준: 선별/TM 스킵, Same-owner 배정 */
export type ReferralStep =
  | 'R1_referral_inflow'       // 소개 유입 (추천코드/링크)
  | 'R2_hira_lookup'           // 건강보험 조회
  | 'R3_refund_apply'          // 환급 신청
  | 'R4_pre_analysis'          // 사전분석 (Same-owner 자동배정, 선별/TM 스킵)
  | 'R5_meeting_execution'     // 미팅 진행
  | 'R6_contract_close'        // 계약 체결/서류 인계
  | 'R7_claim_receipt'         // 청구 접수
  | 'R8_unpaid_analysis'       // 미지급 분석
  | 'R9_doc_issuance'          // 서류 발급표
  | 'R10_final_analysis'       // 최종 분석
  | 'R11_payment_confirm'      // 지급 확인
  | 'R12_aftercare'            // 사후관리 및 정산
  | 'R13_referral_create'      // 소개 생성/가족 연동
  | 'R14_reentry';             // 소개 재유입/성장 루프

/** 간편청구 세부 스텝 (Q1-Q9) — Notion 기준: 청구콜 중심, 보장공백탐지 포함 */
export type SimpleClaimStep =
  | 'Q1_intake_start'          // 접수 시작
  | 'Q2_identity_verify'       // 초기 분기/본인확인
  | 'Q3_first_claim_call'      // 1차 청구콜/서류 확보
  | 'Q4_precision_analysis'    // 1차 정밀 분석 (교차대조)
  | 'Q5_customer_confirm'      // 고객 안내/청구 확정
  | 'Q6_insurer_submit'        // 보험사 접수
  | 'Q7_payment_tracking'      // 지급 추적/결과 안내
  | 'Q8_gap_detection'         // 보장 공백 탐지
  | 'Q9_retention_growth';     // 리텐션/가족/소개 확장

/** 모든 Journey Step의 유니온 */
export type JourneyStep = RefundStep | ReferralStep | SimpleClaimStep;

/** 팀 역할 */
export type TeamRole =
  | 'call_member'      // 상담팀원 (콜팀원)
  | 'call_lead'        // 상담팀장
  | 'sales_member'     // 영업팀원
  | 'sales_lead'       // 영업팀장
  | 'claims_member'    // 청구팀원
  | 'claims_lead'      // 청구팀장
  | 'cs'               // CS팀
  | 'compliance'       // 준법감시팀
  | 'admin';           // 인사/총무/관리자

/** DB 분류 (프로세스 분기 기준) */
export type DbCategoryV2 = 'possible' | 'compensation' | 'referral';

/** 단계별 KPI 정의 */
export interface StageKPI {
  stepCode: JourneyStep;
  name: string;
  metric: string;
  target: string;
  unit: string;
  team: TeamRole[];
}

/** 개인정보 수집 항목 */
export type PersonalDataSensitivity = 1 | 2 | 3 | 4 | 5;

export interface PersonalDataEntry {
  fieldName: string;
  description: string;
  sensitivity: PersonalDataSensitivity;
  collectedAt: JourneyStep[];
  collectionMethod: 'app_input' | 'api_lookup' | 'document_scan' | 'manual_entry' | 'integration';
  retentionDays: number;
  legalBasis: string;
}

/** Phase ↔ Step 매핑 메타데이터 */
export interface PhaseStepMeta {
  phase: JourneyPhase;
  step: JourneyStep;
  label: string;
  description: string;
  primaryTeam: TeamRole;
  supportTeams: TeamRole[];
  kpis: StageKPI[];
  personalData: PersonalDataEntry[];
  /** 보상DB에서 이 스텝을 건너뛸 수 있는지 */
  skippableForCompensation: boolean;
  /** 간편청구에서 이 스텝이 적용되는지 */
  applicableToSimple: boolean;
}

export interface RequirementAlert {
  id: string;
  label: string;
  message: string;
  severity: RequirementSeverity;
  kind: RequirementKind;
  screen?: 'requests' | 'consultation' | 'meeting' | 'documents' | 'handoff' | 'claims';
  statusContext?: string;
}

export interface RequirementRule {
  id: string;
  appliesTo: {
    stage?: JourneyStage[];
    status?: string[];
    journeyType?: JourneyType[];
  };
  severity: RequirementSeverity;
  kind: RequirementKind;
  predicate: string;
  errorMessage: string;
}

export interface DocumentRequirement {
  docCode: string;
  label: string;
  pack: DocumentPackCode;
  source: DocumentSource;
  requiredWhen: string;
  verificationState: VerificationState;
  note?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface IntegrationTask {
  taskCode: string;
  label: string;
  provider: IntegrationProvider;
  state: IntegrationState;
  externalId?: string;
  requestedAt?: string;
  verifiedAt?: string;
  reviewedBy?: string;
  lastError?: string;
}

export interface AuditEvent {
  id: string;
  type: 'draft_saved' | 'status_changed' | 'document_updated' | 'integration_updated' | 'override' | 'handoff' | 'claim' | 'note';
  message: string;
  actor: string;
  at: string;
  tone?: 'default' | 'success' | 'warning';
}

export interface StageStatus {
  stageId: JourneyStage;
  statusCode: string;
  statusLabel: string;
  enteredAt: string;
  enteredBy: string;
  exitBlocked?: boolean;
  overrideReason?: string;
  overrideApprovedBy?: string;
}

export interface ConsultationDraft {
  currentStep: string;
  selectedStatus: string;
  selectedReason: string;
  insuranceStatus: string;
  insuranceType: string;
  monthlyPremium: string;
  paymentStatus: string;
  contractor: string;
  joinPath: string;
  trafficAccident: string;
  trafficAccidentDetail: string;
  surgery: string;
  surgeryOptions: string[];
  surgeryDetail: string;
  criticalDisease: string;
  criticalOptions: string[];
  criticalDetail: string;
  medication: string;
  medicationDetail: string;
  companion: string;
  disposition: string;
  trustLevel: string;
  decisionMaker: string;
  bestTime: string;
  traitNote: string;
  contactAttempts: string;
  lastContactChannel: string;
  lastContactAt: string;
  nextRetryAt: string;
  holdReason: string;
  holdUntil: string;
  holdOwner: string;
  scriptExecuted: boolean;
  scriptQaChecked: boolean;
  customerReaction: string;
  customerSummary: string;
  objectionSummary: string;
  meetingFit: string;
  handoffNote: string;
  cautionNote: string;
  callRecordLink: string;
  transcriptAttached: boolean;
  reentryEligible: string;
  hiraReviewedBy: string;
  hiraReviewedAt: string;
  needMedicalDocs: string;
  claimOpportunityNote: string;
  simpleHandlingMode: string;
  existingContractGoal: string;
  designNeed: string;
  referralName: string;
  referralRelationship: string;
  referralBenefitExplained: boolean;
  healthChecklist?: {
    noRecentTreatment: boolean;
    noRecentInjury: boolean;
    noMedChange: boolean;
    criticalCured5yr: boolean;
  };
}

export interface MeetingContractSnapshot {
  id?: string;
  insurer: string;
  contractType: string;
  productType: string;
  productName: string;
  policyNumber: string;
  contractor: string;
  insuredPerson: string;
  paymentCycle: string;
  premium: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'pending';
  memo?: string;
  entryMethod?: 'manual' | 'pasted';
  sourceCarrier?: string;
  sourceFormat?: 'samsung_contract_detail' | 'kb_contract_detail' | 'generic' | 'manual';
  rawPasteText?: string;
  parseStatus?: 'parsed' | 'partial' | 'manual';
  parseWarnings?: string[];
  registeredAt?: string;
  contractStatusLabel?: string;
  paymentMethod?: string;
  paymentWithdrawDay?: string;
  paymentAccountHolder?: string;
  paymentBankName?: string;
  paymentAccountNumber?: string;
  paymentCardCompany?: string;
  paymentCardNumber?: string;
  paymentCardHolder?: string;
  paymentNote?: string;
  contractorPhone?: string;
  insuredPhone?: string;
  contractorAddress?: string;
  insuredAddress?: string;
}

export interface MeetingReferralContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export type MeetingAssignmentStatus = 'unassigned' | 'assigned' | 'confirmed';

export interface AssignmentDemand {
  team: string;
  targetDate: string;
  neededCount: number;
  cutoffAt: string;
}

export interface MeetingAssignmentItem {
  requestId: string;
  customerName: string;
  dbType: string;
  rawAddress: string;
  regionLevel1: string;
  regionLevel2: string;
  preferredDate: string;
  preferredTime: string;
  assignedTeam: string;
  assignedStaff: string;
  assignmentStatus: MeetingAssignmentStatus;
  assignmentDemand?: AssignmentDemand;
  assignmentSource?: AssignmentSource;
  meetingConfirmed: boolean;
  owner: string;
  notificationState?: NotificationState;
  excludeState?: ExcludeState;
  excludeReason?: string;
  statusLabel: string;
}

export interface MeetingStaffLoad {
  staffId: string;
  staffName: string;
  team: string;
  regionMatches: number;
  scheduledCountToday: number;
  scheduledCountWeek: number;
  nextAvailableSlot: string;
}

export interface MeetingDraft {
  selectedGroup: string;
  selectedDetail: string;
  selectedSubDetail: string;
  meetingTime: string;
  meetingLocation: string;
  meetingConfirmed: boolean;
  companions: string[];
  authCodeReceived: boolean;
  insuranceSystemRegistered: boolean;
  statusInputDone: boolean;
  dbCategory: DbCategory;
  meetingCallFormDone: boolean;
  designRequested: boolean;
  preMeetingDocReminderDone: boolean;
  preMeetingStrategyDone: boolean;
  preMeetingTomorrowNoticeSent: boolean;
  preMeetingReferralPushSent: boolean;
  preMeetingCancellationNoticeSent: boolean;
  onSiteEasyPaperDone: boolean;
  onSiteAppLinked: boolean;
  onSitePolicyCollected: boolean;
  onSitePaymentStatementCollected: boolean;
  onSiteInstitutionLinked: boolean;
  onSiteClaimAgreementDone: boolean;
  onSiteReferralPrompted: boolean;
  preCallDone: boolean;
  preCallNote: string;
  preCallScheduledAt: string;
  preCallLocationConfirmed: boolean;
  companionGuideDone: boolean;
  analysisFileUploaded: boolean;
  analysisAgenda: string;
  scriptReady: boolean;
  hiraSummary: string;
  meetingStarted: boolean;
  recordingStarted: boolean;
  ssnVerified: boolean;
  attendeeConfirmed: boolean;
  meetingPurposeChecked: boolean;
  coverageSummary: string;
  customerUnderstandingNote: string;
  designReviewStatus: 'pending' | 'reviewing' | 'approved' | 'rejected';
  designReviewNote: string;
  redesignAction: string;
  contractData: MeetingContractSnapshot[];
  contractDataCount: number;
  contractExpectedPaymentDate: string;
  contractOwner: string;
  claimHandoffMemo: string;
  claimTransferRequested: boolean;
  claimTransferReason: string;
  claimTransferAt: string;
  followupDate: string;
  followupLocation: string;
  followupPurpose: string;
  arrivalChecked: boolean;
  callAttemptLog: string;
  alternativeProposal: string;
  withdrawalAt: string;
  postMeetingNote: string;
  referralAsked: boolean;
  memberSignupCompleted: boolean;
  hometaxLinked: boolean;
  hiraLinked: boolean;
  nhisLinked: boolean;
  c4uLinked: boolean;
  referralCount: number;
  referralContacts: MeetingReferralContact[];
  cxActionsCount: number;
  assignmentStatus: MeetingAssignmentStatus;
  assignmentSource?: AssignmentSource;
  assignedTeam: string;
  assignedStaff: string;
  regionLevel1: string;
  regionLevel2: string;
  notificationState?: NotificationState;
  excludeState?: ExcludeState;
  excludeReason?: string;
  customerErrorReportedAt?: string;
  customerErrorReportedBy?: string;
  // --- 외부시스템 연동 상태 ---
  gloSignRequested: boolean;
  gloSignSigned: boolean;
  easyPaperRequested: boolean;
  claimAgreementRequested: boolean;
  // --- 미팅 후 업무 체크 ---
  postResultReported: boolean;
  postStatusChanged: boolean;
  postContractInfoSaved: boolean;
  postThreeDocSubmitted: boolean;
}

/** 미팅 5단계 완료 조건 - Step Gate에서 사용 */
export type MeetingStepNumber = 1 | 2 | 3 | 4 | 5 | 6;

export interface RequestJourney {
  requestId: string;
  customerName: string;
  journeyType: JourneyType;
  owner: string;
  stage: JourneyStage;
  status: string;
  slaLabel: string;
  nextDueAt: string;
  nextAction: string;
  currentStageStatus: StageStatus;
  missingRequirements: RequirementAlert[];
  documentRequirements: DocumentRequirement[];
  integrationTasks: IntegrationTask[];
  auditTrail: AuditEvent[];
  excludeState?: ExcludeState;
  excludeReason?: string;
  customerErrorReportedAt?: string;
  customerErrorReportedBy?: string;
  notificationState?: NotificationState;
  consultationDraft: ConsultationDraft;
  meetingDraft: MeetingDraft;
  // ─── 8-Phase 확장 필드 ───
  phase: JourneyPhase;
  step: JourneyStep;
  dbCategoryV2: DbCategoryV2;
  stepHistory: { step: JourneyStep; enteredAt: string; exitedAt?: string }[];
}

export interface JourneyComputation {
  missingRequirements: RequirementAlert[];
  nextAction: string;
}
