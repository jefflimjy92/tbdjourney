import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createInitialJourneys } from '@/app/journey/mockJourneys';
import { computeJourney, canAdvanceStep, shouldSkipStep, getPhaseTransitionMessage } from '@/app/journey/rules';
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

export function JourneyProvider({ children }: { children: React.ReactNode }) {
  const [journeys, setJourneys] = useState<Record<string, RequestJourney>>(() => {
    const initial = createInitialJourneys().map(withComputed);
    return Object.fromEntries(initial.map((journey) => [journey.requestId, journey]));
  });

  const patchJourney = useCallback((requestId: string, updater: (journey: RequestJourney) => RequestJourney) => {
    setJourneys((current) => {
      const target = current[requestId];
      if (!target) return current;
      const next = withComputed(updater(target));
      return { ...current, [requestId]: next };
    });
  }, []);

  const getJourney = useCallback((requestId: string) => journeys[requestId], [journeys]);

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
