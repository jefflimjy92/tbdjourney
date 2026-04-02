import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  createInitialJourneys,
  DEFAULT_CONSULTATION_DRAFT,
  DEFAULT_MEETING_DRAFT,
} from '@/app/journey/mockJourneys';
import { computeJourney, canAdvanceStep, shouldSkipStep, getPhaseTransitionMessage } from '@/app/journey/rules';
import { CUSTOMER_MASTER_DERIVED_MOCK } from '@/app/mockData/generated/customerMasterDerived.app';
import type {
  AuditEvent,
  ConsultationDraft,
  DbCategoryV2,
  IntegrationTask,
  JourneyStep,
  MeetingDraft,
  RequestJourney,
  StageStatus,
  VerificationState,
} from '@/app/journey/types';
import { STEP_TO_PHASE } from '@/app/journey/phaseConfig';

type RequestRowSeed = (typeof CUSTOMER_MASTER_DERIVED_MOCK.requestRows)[number];
type CustomerSeed = (typeof CUSTOMER_MASTER_DERIVED_MOCK.customers)[number];
type MeetingSeed = (typeof CUSTOMER_MASTER_DERIVED_MOCK.meetingExecutionQueue)[number];

const customerByName = new Map<string, CustomerSeed>(
  CUSTOMER_MASTER_DERIVED_MOCK.customers.map((customer) => [customer.name, customer]),
);

const meetingByRequestId = new Map<string, MeetingSeed>(
  CUSTOMER_MASTER_DERIVED_MOCK.meetingExecutionQueue.map((meeting) => [meeting.requestId, meeting]),
);

interface JourneyContextValue {
  journeys: Record<string, RequestJourney>;
  getJourney: (requestId: string) => RequestJourney | undefined;
  patchJourney: (requestId: string, updater: (journey: RequestJourney) => RequestJourney) => void;
  ensureJourney: (journey: RequestJourney) => void;
  saveConsultationDraft: (requestId: string, draft: ConsultationDraft, actor?: string) => void;
  applyConsultationStatus: (requestId: string, draft: ConsultationDraft, stageStatus: StageStatus, nextAction?: string, actor?: string) => void;
  saveMeetingDraft: (requestId: string, draft: MeetingDraft, actor?: string) => void;
  assignMeetingStaff: (requestId: string, patch: Partial<MeetingDraft>, actor?: string) => void;
  applyMeetingStatus: (requestId: string, draft: MeetingDraft, stageStatus: StageStatus, nextAction?: string, actor?: string) => void;
  updateDocumentRequirement: (requestId: string, docCode: string, verificationState: VerificationState, actor?: string) => void;
  updateIntegrationTask: (requestId: string, taskCode: string, patch: Partial<IntegrationTask>, actor?: string) => void;
  appendAudit: (requestId: string, event: AuditEvent) => void;
  advanceStep: (requestId: string, actor?: string) => { success: boolean; reason?: string };
  setDbCategory: (requestId: string, category: DbCategoryV2, actor?: string) => void;
  goToStep: (requestId: string, step: JourneyStep, actor?: string) => void;
}

const JourneyContext = createContext<JourneyContextValue | null>(null);

function withComputed(journey: RequestJourney): RequestJourney {
  const computed = computeJourney(journey);
  return {
    ...journey,
    missingRequirements: computed.missingRequirements,
    nextAction: computed.nextAction,
  };
}

function buildAudit(type: AuditEvent['type'], actor: string, message: string, tone: AuditEvent['tone'] = 'default'): AuditEvent {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    actor,
    message,
    tone,
    at: new Date().toISOString().slice(0, 16).replace('T', ' '),
  };
}

function mapJourneyType(type: string): RequestJourney['journeyType'] {
  if (type.includes('간편')) return 'simple';
  if (type.includes('소개')) return 'intro';
  if (type.includes('가족')) return 'family';
  return 'refund';
}

function mapJourneyStage(stage: string, status: string): RequestJourney['stage'] {
  if (stage === '종결' || stage === '종료' || status.includes('완료') || status.includes('취소') || status.includes('노쇼')) {
    return 'closed';
  }
  if (stage === '청구') return 'claims';
  if (stage === '미팅') return 'meeting';
  if (stage === '상담') return 'consultation';
  return 'request';
}

function mapJourneyPhase(stage: string, status: string): RequestJourney['phase'] {
  if (stage === '종결' || stage === '종료' || status.includes('완료') || status.includes('취소') || status.includes('노쇼')) {
    return 'growth';
  }
  if (stage === '청구') {
    return status.includes('지급') ? 'payment' : 'claims';
  }
  if (stage === '미팅') return 'meeting';
  if (stage === '상담') return 'tm';
  return 'inquiry';
}

function mapJourneyStep(journeyType: RequestJourney['journeyType'], phase: RequestJourney['phase']): JourneyStep {
  if (journeyType === 'simple') {
    switch (phase) {
      case 'meeting':
        return 'Q5_customer_confirm';
      case 'claims':
        return 'Q6_insurer_submit';
      case 'payment':
        return 'Q7_payment_tracking';
      case 'growth':
        return 'Q8_gap_detection';
      case 'tm':
        return 'Q3_first_claim_call';
      default:
        return 'Q2_identity_verify';
    }
  }

  if (journeyType === 'intro') {
    switch (phase) {
      case 'meeting':
        return 'R5_meeting_execution';
      case 'claims':
        return 'R7_claim_receipt';
      case 'payment':
        return 'R11_payment_confirm';
      case 'growth':
        return 'R13_referral_create';
      default:
        return 'R3_refund_apply';
    }
  }

  switch (phase) {
    case 'meeting':
      return 'S8_meeting_execution';
    case 'claims':
      return 'S10_claim_receipt';
    case 'payment':
      return 'S14_payment_confirm';
    case 'growth':
      return 'S16_referral_push';
    case 'tm':
      return 'S5_first_tm';
    case 'classification':
      return 'S4_screening';
    case 'inquiry':
      return 'S3_refund_apply';
    default:
      return 'S1_inflow';
  }
}

function buildFallbackJourneyFromRequestRow(request: RequestRowSeed): RequestJourney {
  const journeyType = mapJourneyType(request.type);
  const stage = mapJourneyStage(request.stage, request.status);
  const phase = mapJourneyPhase(request.stage, request.status);
  const step = mapJourneyStep(journeyType, phase);
  const enteredAt = `${request.date} 09:00`;
  const customer = customerByName.get(request.customer);
  const meeting = meetingByRequestId.get(request.id);
  const owner = meeting?.manager || request.manager || customer?.manager || '미배정';

  return {
    requestId: request.id,
    customerName: request.customer,
    customerPhone: meeting?.phone || customer?.phone || '-',
    journeyType,
    owner,
    stage,
    status: request.status,
    slaLabel: '데이터 기준선 정합화 필요',
    nextDueAt: enteredAt,
    nextAction: '상세 입력 데이터가 없어 request 기반 fallback journey로 표시 중',
    notificationState: 'pending',
    currentStageStatus: {
      stageId: stage,
      statusCode: request.status,
      statusLabel: request.status,
      enteredAt,
      enteredBy: owner,
    },
    missingRequirements: [],
    documentRequirements: [],
    integrationTasks: [],
    auditTrail: [
      buildAudit('note', 'System', 'request 기반 fallback journey를 생성했습니다.', 'warning'),
    ],
    consultationDraft: { ...DEFAULT_CONSULTATION_DRAFT },
    meetingDraft: {
      ...DEFAULT_MEETING_DRAFT,
      assignedStaff: owner !== '미배정' ? owner : '',
      assignedTeam: request.team ?? '',
      meetingLocation: meeting?.location || customer?.address || '',
      meetingConfirmed: request.status.includes('확정'),
    },
    phase,
    step,
    dbCategoryV2: journeyType === 'intro' ? 'referral' : 'possible',
    stepHistory: [],
  };
}

function buildFallbackJourney(requestId: string): RequestJourney | undefined {
  const request = CUSTOMER_MASTER_DERIVED_MOCK.requestRows.find((row) => row.id === requestId);
  return request ? buildFallbackJourneyFromRequestRow(request) : undefined;
}

export function JourneyProvider({ children }: { children: React.ReactNode }) {
  const [journeys, setJourneys] = useState<Record<string, RequestJourney>>(() => {
    const initial = createInitialJourneys().map(withComputed);
    return Object.fromEntries(initial.map((journey) => [journey.requestId, journey]));
  });

  const patchJourney = useCallback((requestId: string, updater: (journey: RequestJourney) => RequestJourney) => {
    setJourneys((current) => {
      const target = current[requestId] ?? buildFallbackJourney(requestId);
      if (!target) return current;
      const next = withComputed(updater(target));
      return { ...current, [requestId]: next };
    });
  }, []);

  const getJourney = useCallback((requestId: string) => {
    const journey = journeys[requestId];
    if (journey) return journey;
    const fallbackJourney = buildFallbackJourney(requestId);
    return fallbackJourney ? withComputed(fallbackJourney) : undefined;
  }, [journeys]);

  const ensureJourney = useCallback((journey: RequestJourney) => {
    setJourneys((current) => {
      if (current[journey.requestId]) {
        return current;
      }

      return { ...current, [journey.requestId]: withComputed(journey) };
    });
  }, []);

  const saveConsultationDraft = useCallback((requestId: string, draft: ConsultationDraft, actor = '상담팀') => {
    patchJourney(requestId, (journey) => ({
      ...journey,
      consultationDraft: draft,
      auditTrail: [buildAudit('draft_saved', actor, '상담 드래프트를 저장했습니다.'), ...journey.auditTrail].slice(0, 20),
    }));
  }, [patchJourney]);

  const applyConsultationStatus = useCallback((requestId: string, draft: ConsultationDraft, stageStatus: StageStatus, nextAction?: string, actor = '상담팀') => {
    patchJourney(requestId, (journey) => ({
      ...journey,
      consultationDraft: draft,
      stage: stageStatus.stageId,
      status: stageStatus.statusLabel,
      currentStageStatus: stageStatus,
      nextAction: nextAction || journey.nextAction,
      owner: stageStatus.enteredBy || journey.owner,
      auditTrail: [buildAudit('status_changed', actor, `상담 상태를 '${stageStatus.statusLabel}'로 반영했습니다.`, 'success'), ...journey.auditTrail].slice(0, 20),
    }));
  }, [patchJourney]);

  const saveMeetingDraft = useCallback((requestId: string, draft: MeetingDraft, actor = '미팅팀') => {
    patchJourney(requestId, (journey) => ({
      ...journey,
      meetingDraft: draft,
      auditTrail: [buildAudit('draft_saved', actor, '미팅 드래프트를 저장했습니다.'), ...journey.auditTrail].slice(0, 20),
    }));
  }, [patchJourney]);

  const assignMeetingStaff = useCallback((requestId: string, patch: Partial<MeetingDraft>, actor = '이관관리') => {
    patchJourney(requestId, (journey) => {
      const nextDraft = { ...journey.meetingDraft, ...patch };
      const assignedStaff = nextDraft.assignedStaff || journey.owner;
      const isConfirmed = nextDraft.meetingConfirmed || nextDraft.assignmentStatus === 'confirmed';

      return {
        ...journey,
        owner: assignedStaff,
        status: isConfirmed
          ? '미팅 확정'
          : nextDraft.assignmentStatus === 'assigned'
            ? '미팅 배정중'
            : journey.status,
        nextAction: isConfirmed
          ? '시간/장소 확정 내용을 기준으로 미팅 스케줄을 확인'
          : nextDraft.assignmentStatus === 'assigned'
            ? `${assignedStaff} 일정 확정 및 고객 재안내 필요`
            : journey.nextAction,
        meetingDraft: nextDraft,
        auditTrail: [buildAudit('handoff', actor, `${nextDraft.assignedTeam || '-'} ${assignedStaff}에게 미팅 배정을 등록했습니다.`, 'success'), ...journey.auditTrail].slice(0, 20),
      };
    });
  }, [patchJourney]);

  const applyMeetingStatus = useCallback((requestId: string, draft: MeetingDraft, stageStatus: StageStatus, nextAction?: string, actor = '미팅팀') => {
    patchJourney(requestId, (journey) => ({
      ...journey,
      meetingDraft: draft,
      stage: stageStatus.stageId,
      status: stageStatus.statusLabel,
      currentStageStatus: stageStatus,
      nextAction: nextAction || journey.nextAction,
      owner: stageStatus.enteredBy || journey.owner,
      auditTrail: [buildAudit('status_changed', actor, `미팅 상태를 '${stageStatus.statusLabel}'로 반영했습니다.`, 'success'), ...journey.auditTrail].slice(0, 20),
    }));
  }, [patchJourney]);

  const updateDocumentRequirement = useCallback((requestId: string, docCode: string, verificationState: VerificationState, actor = '문서관리') => {
    patchJourney(requestId, (journey) => ({
      ...journey,
      documentRequirements: journey.documentRequirements.map((doc) => doc.docCode === docCode ? {
        ...doc,
        verificationState,
        reviewedBy: verificationState === 'verified' || verificationState === 'waived' ? actor : doc.reviewedBy,
        reviewedAt: verificationState === 'verified' || verificationState === 'waived' ? new Date().toISOString().slice(0, 16).replace('T', ' ') : doc.reviewedAt,
      } : doc),
      auditTrail: [buildAudit('document_updated', actor, `${docCode} 문서 상태를 '${verificationState}'로 변경했습니다.`), ...journey.auditTrail].slice(0, 20),
    }));
  }, [patchJourney]);

  const updateIntegrationTask = useCallback((requestId: string, taskCode: string, patch: Partial<IntegrationTask>, actor = '시스템') => {
    patchJourney(requestId, (journey) => ({
      ...journey,
      integrationTasks: journey.integrationTasks.map((task) => task.taskCode === taskCode ? { ...task, ...patch } : task),
      auditTrail: [buildAudit('integration_updated', actor, `${taskCode} 연동 상태를 갱신했습니다.`), ...journey.auditTrail].slice(0, 20),
    }));
  }, [patchJourney]);

  const appendAudit = useCallback((requestId: string, event: AuditEvent) => {
    patchJourney(requestId, (journey) => ({
      ...journey,
      auditTrail: [event, ...journey.auditTrail].slice(0, 20),
    }));
  }, [patchJourney]);

  const advanceStep = useCallback((requestId: string, actor = '시스템') => {
    const journey = journeys[requestId];
    if (!journey) return { success: false, reason: 'Journey를 찾을 수 없습니다.' };

    const result = canAdvanceStep(journey);
    if (!result.allowed || !result.nextStep) {
      return { success: false, reason: result.reason };
    }

    const nextStep = result.nextStep;
    // 보상DB 스텝 스킵 처리는 getNextStep에서 이미 반영됨
    const message = getPhaseTransitionMessage(journey.step, nextStep);

    patchJourney(requestId, (j) => ({
      ...j,
      step: nextStep,
      phase: STEP_TO_PHASE[nextStep],
      stepHistory: [
        ...j.stepHistory,
        { step: j.step, enteredAt: j.stepHistory[j.stepHistory.length - 1]?.enteredAt || '', exitedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') },
      ],
      auditTrail: [buildAudit('status_changed', actor, message, 'success'), ...j.auditTrail].slice(0, 20),
    }));
    return { success: true };
  }, [journeys, patchJourney]);

  const setDbCategory = useCallback((requestId: string, category: DbCategoryV2, actor = '배정팀') => {
    patchJourney(requestId, (journey) => ({
      ...journey,
      dbCategoryV2: category,
      auditTrail: [buildAudit('status_changed', actor, `DB 분류를 '${category}'로 변경했습니다.`), ...journey.auditTrail].slice(0, 20),
    }));
  }, [patchJourney]);

  const goToStep = useCallback((requestId: string, step: JourneyStep, actor = '시스템') => {
    patchJourney(requestId, (journey) => ({
      ...journey,
      step,
      phase: STEP_TO_PHASE[step],
      stepHistory: [
        ...journey.stepHistory,
        { step: journey.step, enteredAt: journey.stepHistory[journey.stepHistory.length - 1]?.enteredAt || '', exitedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') },
      ],
      auditTrail: [buildAudit('status_changed', actor, `스텝을 '${step}'으로 이동했습니다.`), ...journey.auditTrail].slice(0, 20),
    }));
  }, [patchJourney]);

  const value = useMemo(() => ({
    journeys,
    getJourney,
    patchJourney,
    ensureJourney,
    saveConsultationDraft,
    applyConsultationStatus,
    saveMeetingDraft,
    assignMeetingStaff,
    applyMeetingStatus,
    updateDocumentRequirement,
    updateIntegrationTask,
    appendAudit,
    advanceStep,
    setDbCategory,
    goToStep,
  }), [journeys, getJourney, patchJourney, ensureJourney, saveConsultationDraft, applyConsultationStatus, saveMeetingDraft, assignMeetingStaff, applyMeetingStatus, updateDocumentRequirement, updateIntegrationTask, appendAudit, advanceStep, setDbCategory, goToStep]);

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourneyStore() {
  const context = useContext(JourneyContext);
  if (!context) throw new Error('JourneyProvider is missing');
  return context;
}

export function useJourney(requestId?: string | null) {
  const store = useJourneyStore();
  const journey = requestId ? store.getJourney(requestId) : undefined;
  return { ...store, journey };
}
