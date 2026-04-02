import {
  validateFactCheck,
  validateStep3ToStep4,
  type ConsultationFormData,
} from '@/app/utils/consultationValidation';
import type {
  ConsultationDraft,
  DocumentPackCode,
  IntegrationTask,
  JourneyComputation,
  JourneyPhase,
  JourneyStep,
  MeetingDraft,
  MeetingStepNumber,
  RequirementAlert,
  RequirementRule,
  RequestJourney,
  DbCategoryV2,
  TeamRole,
  VerificationState,
} from '@/app/journey/types';
import {
  STEP_TO_PHASE,
  getNextStep,
  getStepSequence,
  getStepLabel,
  COMPENSATION_SKIP_STEPS,
  isStepVisibleToRole,
} from './phaseConfig';

export const DOCUMENT_PACK_LABELS: Record<DocumentPackCode, string> = {
  base_consent_pack: '기본 동의 Pack',
  refund_claim_pack: '환급/청구 Pack',
  sales_contract_pack: '계약/판매 Pack',
  family_pack: '가족/타인명의 Pack',
  referral_pack: '소개 Pack',
};

export const JOURNEY_RULES: RequirementRule[] = [
  {
    id: 'consultation.base-consent',
    appliesTo: { stage: ['consultation', 'meeting', 'handoff', 'claims'] },
    severity: 'block',
    kind: 'document',
    predicate: 'base_consent_pack 문서가 verified 또는 waived 여야 한다.',
    errorMessage: '기본 동의 Pack이 완료되어야 다음 단계로 진행할 수 있습니다.',
  },
  {
    id: 'meeting.contract-pack',
    appliesTo: { stage: ['meeting', 'handoff'] },
    severity: 'block',
    kind: 'document',
    predicate: '계약 결과인 경우 sales_contract_pack 문서가 모두 verified 또는 waived 여야 한다.',
    errorMessage: '계약 문서 Pack이 완료되어야 계약 완료를 반영할 수 있습니다.',
  },
];

const terminalConsultationStatuses = new Set(['cancel', 'impossible', '1st-cancel']);
const consultationHandoffStatuses = new Set(['meeting-handover']);
const meetingDocumentResultStatuses = new Set(['contract-completed']);
const meetingFollowupStatuses = new Set(['followup-2nd-meeting']);
const meetingClosedStatuses = new Set(['contract-failed', 'post-meeting-impossible', 'pre-meeting-cancel', 'pre-meeting-impossible', 'final-absent', 'withdrawn']);

function createAlert(
  id: string,
  label: string,
  message: string,
  severity: RequirementAlert['severity'],
  kind: RequirementAlert['kind'],
  screen: RequirementAlert['screen'],
  statusContext?: string,
): RequirementAlert {
  return { id, label, message, severity, kind, screen, statusContext };
}

function isFilled(value?: string | null): boolean {
  return !!value && value.trim().length > 0;
}

function toConsultationFormData(draft: ConsultationDraft): ConsultationFormData {
  return {
    currentStep: draft.currentStep,
    selectedStatus: draft.selectedStatus,
    selectedReason: draft.selectedReason,
    insuranceStatus: draft.insuranceStatus,
    insuranceType: draft.insuranceType,
    monthlyPremium: draft.monthlyPremium,
    paymentStatus: draft.paymentStatus,
    contractor: draft.contractor,
    joinPath: draft.joinPath,
    trafficAccident: draft.trafficAccident,
    trafficAccidentDetail: draft.trafficAccidentDetail,
    surgery: draft.surgery,
    surgeryOptions: draft.surgeryOptions,
    surgeryDetail: draft.surgeryDetail,
    criticalDisease: draft.criticalDisease,
    criticalOptions: draft.criticalOptions,
    criticalDetail: draft.criticalDetail,
    medication: draft.medication,
    medicationDetail: draft.medicationDetail,
    companion: draft.companion,
    disposition: draft.disposition,
    trustLevel: draft.trustLevel,
    decisionMaker: draft.decisionMaker,
  };
}

function docStateOk(state: VerificationState): boolean {
  return state === 'verified' || state === 'waived';
}

export function isPackRequired(journey: RequestJourney, pack: DocumentPackCode): boolean {
  const consultation = journey.consultationDraft;
  const meeting = journey.meetingDraft;

  if (pack === 'base_consent_pack') return journey.stage !== 'closed';
  if (pack === 'refund_claim_pack') {
    return journey.journeyType === 'refund' || journey.journeyType === 'family' || journey.stage === 'claims';
  }
  if (pack === 'sales_contract_pack') {
    return journey.journeyType === 'simple' || journey.journeyType === 'intro' || meetingDocumentResultStatuses.has(meeting.selectedDetail);
  }
  if (pack === 'family_pack') {
    return consultation.companion === '있음' || consultation.contractor.includes('가족') || journey.journeyType === 'family';
  }
  if (pack === 'referral_pack') {
    return journey.journeyType === 'intro' || isFilled(consultation.referralName);
  }
  return false;
}

export function getRequiredDocuments(journey: RequestJourney) {
  return journey.documentRequirements.filter((doc) => isPackRequired(journey, doc.pack));
}

export function getDocumentProgress(journey: RequestJourney) {
  const requiredDocs = getRequiredDocuments(journey);
  const verifiedCount = requiredDocs.filter((doc) => docStateOk(doc.verificationState)).length;
  return {
    total: requiredDocs.length,
    verifiedCount,
    percent: requiredDocs.length === 0 ? 100 : Math.round((verifiedCount / requiredDocs.length) * 100),
  };
}

export function getIntegrationProgress(tasks: IntegrationTask[]) {
  const actionable = tasks.filter((task) => task.state !== 'idle');
  const done = actionable.filter((task) => task.state === 'verified').length;
  return {
    total: actionable.length,
    verifiedCount: done,
    failedCount: actionable.filter((task) => task.state === 'failed').length,
  };
}

const warnEscalationStatuses = new Set([
  'meeting-handover',
  'contract-completed',
  'withdrawn',
]);

function getAlertPriority(alert: RequirementAlert): number {
  if (alert.kind === 'document' || alert.kind === 'integration') return 0;
  if (alert.kind === 'field' || alert.kind === 'schedule') return 1;
  if (alert.kind === 'note') return 2;
  return 3;
}

export function sortRequirementAlerts(items: RequirementAlert[]) {
  return [...items].sort((a, b) => {
    const severityOrder = a.severity === b.severity ? 0 : a.severity === 'block' ? -1 : 1;
    if (severityOrder !== 0) return severityOrder;
    const priorityOrder = getAlertPriority(a) - getAlertPriority(b);
    if (priorityOrder !== 0) return priorityOrder;
    return a.label.localeCompare(b.label, 'ko');
  });
}

interface EffectiveBlockingInput {
  items: RequirementAlert[];
  screen: 'consultation' | 'meeting';
  targetStatus?: string;
}

interface EffectiveBlockingResult {
  blockingItems: RequirementAlert[];
  warningItems: RequirementAlert[];
  effectiveBlockingItems: RequirementAlert[];
  escalatedWarning: boolean;
}

export function getEffectiveBlocking({ items, screen, targetStatus }: EffectiveBlockingInput): EffectiveBlockingResult {
  const scoped = items.filter((item) => {
    if (!item.screen) return true;
    if (item.screen === 'documents') return true;
    if (item.kind === 'integration') return true;
    return item.screen === screen;
  });

  const ordered = sortRequirementAlerts(scoped);
  const blockingItems = ordered.filter((item) => item.severity === 'block');
  const warningItems = ordered.filter((item) => item.severity === 'warn');
  const escalatedWarning = !!targetStatus && warnEscalationStatuses.has(targetStatus);
  const effectiveBlockingItems = escalatedWarning
    ? sortRequirementAlerts([...blockingItems, ...warningItems])
    : blockingItems;

  return {
    blockingItems,
    warningItems,
    effectiveBlockingItems,
    escalatedWarning,
  };
}

function collectDocumentAlerts(journey: RequestJourney, alerts: RequirementAlert[]) {
  getRequiredDocuments(journey).forEach((doc) => {
    if (!docStateOk(doc.verificationState)) {
      alerts.push(
        createAlert(
          `doc-${doc.docCode}`,
          doc.label,
          `${DOCUMENT_PACK_LABELS[doc.pack]}: ${doc.label} 상태가 ${doc.verificationState}입니다.`,
          'block',
          'document',
          'documents',
          doc.pack,
        ),
      );
    }
  });
}

function collectIntegrationAlerts(journey: RequestJourney, alerts: RequirementAlert[]) {
  const scriptTask = journey.integrationTasks.find((task) => task.provider === 'script');
  if ((journey.consultationDraft.scriptExecuted || journey.meetingDraft.recordingStarted) && (!scriptTask || scriptTask.state === 'failed')) {
    alerts.push(createAlert('integration-script', '스크립트 QA', '스크립트 QA 상태를 다시 확인해주세요.', 'warn', 'integration', 'consultation'));
  }
}

function collectConsultationAlerts(journey: RequestJourney, alerts: RequirementAlert[]) {
  const draft = journey.consultationDraft;
  const status = draft.selectedStatus || journey.currentStageStatus.statusCode;

  if (!status) {
    alerts.push(createAlert('consult-status', '상담 상태', '상담 상태를 선택해야 합니다.', 'block', 'field', 'consultation'));
    return;
  }

  if (status === 'rural-waiting') {
    if (!isFilled(draft.selectedReason)) alerts.push(createAlert('consult-rural-reason', '지방 대기 사유', '지방 대기는 구체 사유가 필요합니다.', 'block', 'field', 'consultation', status));
  }

  if (status === '1st-complete') {
    validateFactCheck(toConsultationFormData(draft)).errors.forEach((error) => {
      alerts.push(createAlert(`consult-${error.field}`, error.field, error.message, 'block', 'field', 'consultation', status));
    });
    if (!isFilled(draft.customerReaction)) alerts.push(createAlert('consult-reaction', '고객 반응 요약', '1차 상담 완료 전 고객 반응 요약이 필요합니다.', 'block', 'note', 'consultation', status));
    if (!isFilled(draft.customerSummary)) alerts.push(createAlert('consult-summary', '상담 요약', '1차 상담 완료 전 상담 요약이 필요합니다.', 'block', 'note', 'consultation', status));
  }

  if (status === '1st-cancel') {
    if (!isFilled(draft.selectedReason)) alerts.push(createAlert('consult-cancel-reason', '취소 사유', '1차 상담 취소는 사유 선택이 필요합니다.', 'block', 'field', 'consultation', status));
    if (!isFilled(draft.customerSummary)) alerts.push(createAlert('consult-cancel-summary', '고객 원문 메모', '취소 시 고객 원문 메모가 필요합니다.', 'block', 'note', 'consultation', status));
    if (!isFilled(draft.reentryEligible)) alerts.push(createAlert('consult-reentry', '재유입 가능 여부', '취소 시 재유입 가능 여부를 기록해야 합니다.', 'block', 'field', 'consultation', status));
  }

  if (status === '2nd-complete') {
    validateStep3ToStep4(toConsultationFormData(draft)).errors.forEach((error) => {
      alerts.push(createAlert(`consult-second-${error.field}`, error.field, error.message, 'block', 'field', 'consultation', status));
    });
    if (!isFilled(draft.objectionSummary)) alerts.push(createAlert('consult-objection', '주요 objection', '2차 상담 완료 전 objection 요약이 필요합니다.', 'block', 'note', 'consultation', status));
    if (!isFilled(draft.meetingFit)) alerts.push(createAlert('consult-meeting-fit', '미팅 적합도', '2차 상담 완료 전 미팅 적합도를 기록해야 합니다.', 'block', 'field', 'consultation', status));
    if (!isFilled(draft.handoffNote)) alerts.push(createAlert('consult-handoff-note', '미팅 전달 메모', '2차 상담 완료 전 미팅 전달 메모가 필요합니다.', 'block', 'note', 'consultation', status));
  }

  if (status === '2nd-exception') {
    if (!isFilled(draft.selectedReason)) alerts.push(createAlert('consult-exception-reason', '예외 사유', '예외 상태는 사유가 필요합니다.', 'block', 'field', 'consultation', status));
    if (!isFilled(draft.cautionNote)) alerts.push(createAlert('consult-exception-proof', '근거 메모', '예외 상태는 근거 메모가 필요합니다.', 'block', 'note', 'consultation', status));
    if (!isFilled(draft.handoffNote)) alerts.push(createAlert('consult-exception-branch', '후속 분기', '예외 상태는 후속 분기가 필요합니다.', 'block', 'field', 'consultation', status));
  }

  if (consultationHandoffStatuses.has(status)) {
    if (!isFilled(draft.customerSummary)) alerts.push(createAlert('handoff-summary', '상담 요약', '미팅 인계 전 상담 요약이 필요합니다.', 'block', 'note', 'consultation', status));
    if (!isFilled(draft.customerReaction)) alerts.push(createAlert('handoff-reaction', '고객 반응', '미팅 인계 전 고객 반응이 필요합니다.', 'block', 'note', 'consultation', status));
    if (!isFilled(draft.decisionMaker)) alerts.push(createAlert('handoff-decision', '결정권자', '미팅 인계 전 결정권자를 확인해야 합니다.', 'block', 'field', 'consultation', status));
    if (!isFilled(draft.bestTime)) alerts.push(createAlert('handoff-time', '미팅 선호 시간대', '미팅 인계 전 선호 시간대가 필요합니다.', 'block', 'schedule', 'consultation', status));
    if (!isFilled(draft.handoffNote)) alerts.push(createAlert('handoff-note', '주의사항', '미팅 인계 전 주의사항과 전달 메모가 필요합니다.', 'block', 'note', 'consultation', status));
    if (!isFilled(draft.callRecordLink) && !draft.transcriptAttached) alerts.push(createAlert('handoff-record', '통화 기록', '미팅 인계 전 통화 기록/전사를 남기면 품질 점검에 유리합니다.', 'warn', 'note', 'consultation', status));
    if (journey.journeyType === 'refund') {
      if (!isFilled(draft.claimOpportunityNote)) alerts.push(createAlert('handoff-claim-point', '청구 가능 포인트', '환급 유형은 청구 가능 포인트 정리가 필요합니다.', 'block', 'note', 'consultation', status));
      if (!isFilled(draft.needMedicalDocs)) alerts.push(createAlert('handoff-medical-docs', '의료기록 필요 예상', '환급 유형은 의료기록 필요 여부를 판단해야 합니다.', 'block', 'field', 'consultation', status));
    }
    if (journey.journeyType === 'simple') {
      if (!isFilled(draft.existingContractGoal)) alerts.push(createAlert('handoff-contract-goal', '기존 계약 목적', '간편 청구 유형은 기존 계약 목적 기록이 필요합니다.', 'block', 'note', 'consultation', status));
      if (!isFilled(draft.simpleHandlingMode)) alerts.push(createAlert('handoff-simple-mode', '처리 방식', '간편 청구 유형은 처리 방식을 지정해야 합니다.', 'block', 'field', 'consultation', status));
      if (!isFilled(draft.designNeed)) alerts.push(createAlert('handoff-design-need', '추가 설계 필요성', '간편 청구 유형은 추가 설계 필요성이 필요합니다.', 'block', 'field', 'consultation', status));
    }
    if (journey.journeyType === 'intro') {
      if (!isFilled(draft.referralName)) alerts.push(createAlert('handoff-referral-name', '추천인', '소개 DB는 추천인 정보가 필요합니다.', 'block', 'field', 'consultation', status));
      if (!isFilled(draft.referralRelationship)) alerts.push(createAlert('handoff-referral-rel', '추천인 관계', '소개 DB는 추천인 관계가 필요합니다.', 'block', 'field', 'consultation', status));
      if (!draft.referralBenefitExplained) alerts.push(createAlert('handoff-referral-benefit', '소개 혜택 안내', '소개 혜택 안내 여부를 기록해야 합니다.', 'block', 'field', 'consultation', status));
    }
  }

  if (terminalConsultationStatuses.has(status) || status === 'cancel' || status === 'impossible') {
    if (!isFilled(draft.selectedReason)) alerts.push(createAlert('consult-terminal-reason', '취소/불가 사유', '종결 상태는 사유 선택이 필요합니다.', 'block', 'field', 'consultation', status));
    if (!isFilled(draft.customerSummary)) alerts.push(createAlert('consult-terminal-summary', '상세 메모', '종결 상태는 상세 메모가 필요합니다.', 'block', 'note', 'consultation', status));
    if (!isFilled(draft.callRecordLink) && !draft.transcriptAttached) alerts.push(createAlert('consult-terminal-proof', '녹취/근거', '종결 상태는 녹취/근거를 남기면 분쟁 대응에 유리합니다.', 'warn', 'note', 'consultation', status));
    if (!isFilled(draft.reentryEligible)) alerts.push(createAlert('consult-terminal-reentry', '재진입 여부', '종결 상태는 재진입 여부 기록이 필요합니다.', 'block', 'field', 'consultation', status));
  }
}

// ━━━ 미팅 5단계 Step Gate ━━━

export function isStepComplete(step: MeetingStepNumber, draft: MeetingDraft): boolean {
  switch (step) {
    case 1:
      return isFilled(draft.meetingTime) && draft.meetingConfirmed;
    case 2:
      return draft.analysisFileUploaded;
    case 3:
      return draft.scriptReady;
    case 4:
      return draft.gloSignRequested || draft.gloSignSigned;
    case 5:
      return isPostMeetingComplete(draft);
    case 6:
      return draft.claimTransferRequested;
    default:
      return false;
  }
}

export function canAccessStep(step: MeetingStepNumber, draft: MeetingDraft): boolean {
  void step;
  void draft;
  return true;
}

export function getStepGateMessage(step: MeetingStepNumber): string {
  const messages: Record<MeetingStepNumber, string> = {
    1: '',
    2: '',
    3: '',
    4: '',
    5: '',
    6: '',
  };
  return messages[step];
}

// ━━━ 미팅 후 업무 완료 체크 ━━━

export function isPostMeetingComplete(draft: MeetingDraft): boolean {
  const hasResultSummary = isFilled(draft.postMeetingNote);
  const hasSelectedStatus = isFilled(draft.selectedDetail) && draft.selectedDetail !== 'meeting-confirmed';
  const contractReady = draft.selectedDetail !== 'contract-completed' || draft.contractData.length > 0;
  const claimDocumentsReady =
    !draft.claimTransferRequested ||
    (draft.policyDocStatus === 'received' && draft.paymentDocStatus === 'received');

  return hasResultSummary && hasSelectedStatus && contractReady && claimDocumentsReady;
}

function collectMeetingAlerts(journey: RequestJourney, alerts: RequirementAlert[]) {
  const draft = journey.meetingDraft;
  const detail = draft.selectedDetail || journey.currentStageStatus.statusCode;

  // ━━━ 5단계 필수값 검증 ━━━
  if (!isStepComplete(1, draft)) {
    alerts.push(createAlert('meeting-precall', '유선콜 확인', '시간/장소 입력과 확정 체크를 완료해야 합니다.', 'block', 'schedule', 'meeting'));
  }

  if (!isStepComplete(2, draft)) {
    alerts.push(createAlert('meeting-analysis', '보험 분석', '보험 분석 파일 업로드가 필요합니다.', 'block', 'field', 'meeting'));
  }

  if (!isStepComplete(3, draft)) {
    alerts.push(createAlert('meeting-script', '스크립트 작성', '스크립트 작성 완료 체크가 필요합니다.', 'block', 'field', 'meeting'));
  }

  if (!isStepComplete(4, draft)) {
    alerts.push(createAlert('meeting-esign', '전자서명', '글로싸인 전자서명 발송 또는 서명완료 처리가 필요합니다.', 'block', 'integration', 'meeting'));
  }

  if (!isStepComplete(5, draft)) {
    alerts.push(createAlert('meeting-complete', '미팅 완료', '미팅 완료 탭에서 결과 메모와 계약/청구 정리를 확인해야 합니다.', 'block', 'field', 'meeting'));
  }

  // ━━━ 상태별 필수값 ━━━
  const followupSubtype = draft.selectedSubDetail;

  if (meetingFollowupStatuses.has(detail) || (detail === 'prospect' && followupSubtype === '2차 미팅 예정')) {
    if (!isFilled(draft.followupDate)) alerts.push(createAlert('meeting-followup-date', '다음 미팅 일시', '2차 미팅은 다음 일정이 필요합니다.', 'block', 'schedule', 'meeting', detail));
    if (!isFilled(draft.followupLocation)) alerts.push(createAlert('meeting-followup-location', '다음 미팅 장소', '2차 미팅은 장소가 필요합니다.', 'block', 'schedule', 'meeting', detail));
    if (!isFilled(draft.followupPurpose)) alerts.push(createAlert('meeting-followup-purpose', '다음 미팅 목적', '2차 미팅은 목적이 필요합니다.', 'block', 'note', 'meeting', detail));
  }

  if (detail === 'prospect') {
    if (!isFilled(draft.selectedSubDetail)) alerts.push(createAlert('meeting-followup-type', '후속 유형', '후속 진행은 아래 후속 유형 1개를 선택해야 합니다.', 'block', 'field', 'meeting', detail));
    if (['서류 보완 대기', '내부 검토 중', '장기 보류'].includes(draft.selectedSubDetail) && !isFilled(draft.postMeetingNote)) {
      alerts.push(createAlert('meeting-followup-note', '후속 진행 메모', '선택한 후속 진행 항목에 대한 메모가 필요합니다.', 'block', 'note', 'meeting', detail));
    }
    if (draft.selectedSubDetail === '고객 재연락 예정') {
      if (!isFilled(draft.followupDate)) alerts.push(createAlert('meeting-followup-recontact-date', '재연락 일시', '고객 재연락 예정은 재연락 일시가 필요합니다.', 'block', 'schedule', 'meeting', detail));
      if (!isFilled(draft.postMeetingNote)) alerts.push(createAlert('meeting-followup-recontact-note', '재연락 메모', '고객 재연락 예정은 메모가 필요합니다.', 'block', 'note', 'meeting', detail));
    }
  }

  if (detail === 'contract-failed') {
    if (!isFilled(draft.selectedSubDetail)) alerts.push(createAlert('meeting-contract-failed-reason', '계약실패 사유', '계약실패는 사유가 필요합니다.', 'block', 'field', 'meeting', detail));
  }

  if (detail === 'post-meeting-impossible') {
    if (!isFilled(draft.selectedSubDetail)) alerts.push(createAlert('meeting-onsite-impossible-reason', '현장불가 사유', '현장불가는 사유가 필요합니다.', 'block', 'field', 'meeting', detail));
  }

  if (detail === 'pre-meeting-cancel') {
    if (!isFilled(draft.selectedSubDetail)) alerts.push(createAlert('meeting-cancel-reason', '취소 사유', '미팅 취소는 사유가 필요합니다.', 'block', 'field', 'meeting', detail));
    if (!isFilled(draft.callAttemptLog)) alerts.push(createAlert('meeting-cancel-channel', '취소 채널/로그', '미팅 취소는 고객 접촉 로그가 필요합니다.', 'block', 'note', 'meeting', detail));
    if (!isFilled(draft.postMeetingNote)) alerts.push(createAlert('meeting-cancel-recontact', '재접촉 여부', '미팅 취소는 재접촉 여부 기록이 필요합니다.', 'block', 'note', 'meeting', detail));
  }

  if (detail === 'final-absent') {
    if (!draft.arrivalChecked) alerts.push(createAlert('meeting-noshow-arrival', '도착 확인', '노쇼는 현장 도착 확인 기록이 필요합니다.', 'block', 'field', 'meeting', detail));
    if (!isFilled(draft.callAttemptLog)) alerts.push(createAlert('meeting-noshow-log', '연락 시도 로그', '노쇼는 연락 시도 로그가 필요합니다.', 'block', 'note', 'meeting', detail));
    if (!isFilled(draft.followupDate) && !isFilled(draft.postMeetingNote)) alerts.push(createAlert('meeting-noshow-next', '후속 일정 여부', '노쇼는 후속 일정 또는 종료 메모가 필요합니다.', 'block', 'schedule', 'meeting', detail));
  }

  if (detail === 'pre-meeting-impossible') {
    if (!isFilled(draft.selectedSubDetail)) alerts.push(createAlert('meeting-uw-reason', '심사 거절 사유', 'UW 거절은 사유가 필요합니다.', 'block', 'field', 'meeting', detail));
    if (!isFilled(draft.designReviewNote)) alerts.push(createAlert('meeting-uw-proof', '거절 근거', 'UW 거절은 근거 메모가 필요합니다.', 'block', 'note', 'meeting', detail));
    if (!isFilled(draft.alternativeProposal)) alerts.push(createAlert('meeting-uw-alt', '대체 제안', 'UW 거절은 대체 제안 여부를 기록해야 합니다.', 'block', 'note', 'meeting', detail));
  }

  if (detail === 'withdrawn') {
    if (!isFilled(draft.selectedSubDetail)) alerts.push(createAlert('meeting-withdraw-reason', '철회 사유', '철회/해지는 사유가 필요합니다.', 'block', 'field', 'meeting', detail));
    if (!isFilled(draft.withdrawalAt)) alerts.push(createAlert('meeting-withdraw-time', '철회 시점', '철회/해지는 시점 기록이 필요합니다.', 'block', 'schedule', 'meeting', detail));
  }

  if (meetingClosedStatuses.has(detail) && !isFilled(draft.postMeetingNote)) {
    alerts.push(createAlert('meeting-close-note', '종료 메모', '종료/이탈 상태는 최종 메모가 필요합니다.', 'block', 'note', 'meeting', detail));
  }
}

export function computeJourney(journey: RequestJourney): JourneyComputation {
  const alerts: RequirementAlert[] = [];
  collectDocumentAlerts(journey, alerts);
  collectIntegrationAlerts(journey, alerts);
  if (['consultation', 'meeting', 'handoff', 'claims'].includes(journey.stage)) {
    collectConsultationAlerts(journey, alerts);
  }
  if (['meeting', 'handoff', 'claims', 'closed'].includes(journey.stage) || journey.currentStageStatus.stageId === 'meeting' || isFilled(journey.meetingDraft.selectedDetail)) {
    collectMeetingAlerts(journey, alerts);
  }

  const unique = alerts.filter((alert, index) => alerts.findIndex((item) => item.id === alert.id) === index);
  const block = unique.find((item) => item.severity === 'block');

  return {
    missingRequirements: unique,
    nextAction: block ? block.message : journey.nextAction,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 8-Phase Step Transition Rules
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface StepTransitionResult {
  allowed: boolean;
  reason?: string;
  nextStep: JourneyStep | null;
}

/** 스텝 전환 가능 여부 검증 */
export function canAdvanceStep(journey: RequestJourney): StepTransitionResult {
  const { step, dbCategoryV2 } = journey;
  const journeyType = journey.journeyType === 'family' ? 'refund' : journey.journeyType as 'refund' | 'intro' | 'simple';
  const next = getNextStep(step, journeyType, dbCategoryV2);

  if (!next) {
    return { allowed: false, reason: '마지막 단계입니다.', nextStep: null };
  }

  // 블로킹 요건 확인
  const computation = computeJourney(journey);
  const blocks = computation.missingRequirements.filter(a => a.severity === 'block');
  if (blocks.length > 0) {
    return {
      allowed: false,
      reason: `미완료 필수 항목 ${blocks.length}개: ${blocks[0].message}`,
      nextStep: next,
    };
  }

  return { allowed: true, nextStep: next };
}

/** DB유형별 스텝 스킵 여부 */
export function shouldSkipStep(step: JourneyStep, dbCategory: DbCategoryV2): boolean {
  if (dbCategory === 'compensation') {
    return (COMPENSATION_SKIP_STEPS as readonly JourneyStep[]).includes(step);
  }
  return false;
}

/** 보상DB 전용 규칙: 주말 미팅 허용 */
export function isWeekendMeetingAllowed(dbCategory: DbCategoryV2): boolean {
  return dbCategory === 'compensation';
}

/** 보상DB 전용 규칙: 보험가입 제안 비활성화 */
export function isInsuranceSalesDisabled(dbCategory: DbCategoryV2): boolean {
  return dbCategory === 'compensation';
}

/** 소개DB 전용 규칙: same-owner 유지 확인 */
export function requiresSameOwner(dbCategory: DbCategoryV2): boolean {
  return dbCategory === 'referral';
}

/** Same-owner 배정 검증: 소개건에서 원래 담당자와 다른 사람에게 배정 시 경고 */
export function validateSameOwnerAssignment(
  dbCategory: DbCategoryV2,
  originalOwnerId: string | null,
  newOwnerId: string,
): { valid: boolean; warning?: string } {
  if (!requiresSameOwner(dbCategory)) return { valid: true };
  if (!originalOwnerId) return { valid: true }; // 최초 배정
  if (originalOwnerId === newOwnerId) return { valid: true };
  return {
    valid: false,
    warning: `소개 고객은 원래 담당자(${originalOwnerId})에게 배정되어야 합니다. Same-owner 규칙 위반.`,
  };
}

/** 역할 기반 스텝 필터링 */
export function getVisibleStepsForRole(
  journeyType: 'refund' | 'intro' | 'simple',
  role: TeamRole,
  dbCategory?: DbCategoryV2,
): JourneyStep[] {
  const allSteps = getStepSequence(journeyType, dbCategory);
  return allSteps.filter(step => isStepVisibleToRole(step, role));
}

// ── DB 자동분류 엔진 ──────────────────────────────────────────
export function autoClassifyDb(params: {
  hasPreExistingCondition: boolean;
  referralCode: string | null;
}): DbCategoryV2 {
  if (params.referralCode) return 'referral';
  if (params.hasPreExistingCondition) return 'compensation';
  return 'possible';
}

// ── Same-owner 자동배정 ──────────────────────────────────────
export function resolveSameOwnerAssignment(
  referrerId: string | null,
  ownerMap: Record<string, string>,
): { assignedOwner: string | null; method: 'same_owner' | 'manual' } {
  if (!referrerId) return { assignedOwner: null, method: 'manual' };
  const owner = ownerMap[referrerId];
  return owner
    ? { assignedOwner: owner, method: 'same_owner' }
    : { assignedOwner: null, method: 'manual' };
}

/** Phase 전환 시 audit 메시지 생성 */
export function getPhaseTransitionMessage(
  fromStep: JourneyStep,
  toStep: JourneyStep,
): string {
  const fromPhase = STEP_TO_PHASE[fromStep];
  const toPhase = STEP_TO_PHASE[toStep];
  const fromLabel = getStepLabel(fromStep);
  const toLabel = getStepLabel(toStep);

  if (fromPhase !== toPhase) {
    return `페이즈 전환: ${fromLabel} → ${toLabel}`;
  }
  return `스텝 진행: ${fromLabel} → ${toLabel}`;
}
