import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  Plus,
  Upload,
  FileBarChart,
  MessageSquareText,
  Check,
  Ban,
  Save,
  History,
  ArrowLeft,
  Calendar,
  Smartphone,
  Link,
  User,
  FileX,
  XCircle,
  PlayCircle,
  HelpCircle,
  AlertCircle,
  Trophy,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Briefcase,
  MapPin,
  Mic,
  MicOff,
  Phone,
  ClipboardCheck,
  Users,
  FileCheck,
  Shield,
  AlertOctagon,
  Search,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import clsx from 'clsx';
import { format, subDays } from 'date-fns';
import { ContractRegistrationModal } from '@/app/components/ContractRegistrationModal';
import { toast } from 'sonner';
import { TransitionGuardModal } from '@/app/components/journey/TransitionGuardModal';
import { useRole } from '@/app/auth/RoleContext';
import { useJourney, useJourneyStore } from '@/app/journey/JourneyContext';
import { DEFAULT_CONSULTATION_DRAFT, DEFAULT_MEETING_DRAFT } from '@/app/journey/mockJourneys';
import { computeJourney, getEffectiveBlocking, sortRequirementAlerts, isPostMeetingComplete } from '@/app/journey/rules';
import type { DbCategory, MeetingDraft, MeetingReferralContact, MeetingStepNumber, RequestJourney, RequirementAlert, StageStatus } from '@/app/journey/types';

// Components from Consultation for consistency
import { CustomerProfileSummary } from '@/app/components/CustomerProfileSummary';
import { CustomerInputSection } from '@/app/components/CustomerInputSection';
import LiveRecordSection from '@/imports/Container-168-10370';
import { ConsultationFeedbackForm } from '@/app/components/ConsultationFeedbackForm';
import { RefundAndMeetingInfo } from '@/app/components/RefundAndMeetingInfo';
import { FileAttachmentSection, FileAttachment } from '@/app/components/FileAttachmentSection';
import { ContractInfoSection, ContractData } from '@/app/components/ContractInfoSection';
import { MeetingCenterTabs, type CenterTab } from '@/app/components/meeting/MeetingCenterTabs';
import { MOCK_DATA, getCustomerDetail } from '@/app/mockData';
import { ListPeriodControls } from '@/app/components/ListPeriodControls';
import {
  EmployeeStepMatrixOverview,
  EmployeeStepOwnerDetail,
  type EmployeeStepMatrixItem,
  type EmployeeStepOwnerDetailColumn,
} from '@/app/components/operations/EmployeeStepMatrixOverview';
import {
  filterRowsByPeriod,
  getDefaultCustomPeriodRange,
  getPerformancePeriodRange,
  getRowsDateBounds,
  type PerformancePeriodPreset,
} from '@/app/issuance/performancePeriodUtils';

// --- Lifecycle Data Structure ---

type StatusGroup = 'PENDING' | 'NEGOTIATING' | 'WON' | 'LOST';

interface StatusOption {
  value: string;
  label: string;
  desc?: string;
  requiresSubReason?: boolean;
}

const MEETING_LIFECYCLE: Record<StatusGroup, {
  label: string;
  color: string;
  activeColor: string;
  icon: React.ReactNode;
  options: StatusOption[]
}> = {
  PENDING: {
    label: '미팅 전',
    color: 'hover:bg-slate-50 text-slate-600',
    activeColor: 'bg-slate-100 text-slate-800 border-slate-300 ring-1 ring-slate-300',
    icon: <Clock size={16} />,
    options: [
      { value: 'meeting-confirmed', label: '미팅 확정', desc: '스케줄 조율 완료' },
    ]
  },
  NEGOTIATING: {
    label: '미팅 후',
    color: 'hover:bg-amber-50 text-amber-600',
    activeColor: 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-300',
    icon: <Briefcase size={16} />,
    options: [
      { value: 'followup-in-progress', label: '후속 진행', desc: '보완, 재접촉, 추가 검토 진행' },
      { value: 'insurance-re-review', label: '보험 재심사', desc: '보험사 재심사 또는 추가 심사 서류 대응' },
    ]
  },
  WON: {
    label: '계약 완료',
    color: 'hover:bg-emerald-50 text-emerald-600',
    activeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-300',
    icon: <Trophy size={16} />,
    options: [
      { value: 'contract-completed', label: '계약완료', desc: '계약 체결 성공' },
    ]
  },
  LOST: {
    label: '종료/이탈',
    color: 'hover:bg-rose-50 text-rose-600',
    activeColor: 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-300',
    icon: <XCircle size={16} />,
    options: [
      { value: 'contract-failed', label: '계약실패', desc: '상담은 진행했으나 계약으로 연결되지 않음', requiresSubReason: true },
      { value: 'on-site-impossible', label: '현장불가', desc: '현장에서 진행 불가 사유 확인', requiresSubReason: true },
      { value: 'meeting-cancelled', label: '미팅취소', desc: '고객 취소 또는 일정 철회', requiresSubReason: true },
      { value: 'no-show', label: '노쇼 (No-Show)', desc: '연락 두절/현장 부재' },
      { value: 'uw-rejected', label: '인수 불가', desc: '보험사 거절 (UW 실패)', requiresSubReason: true },
      { value: 'withdrawn', label: '청약 철회/해지', desc: '품질보증 해지 등', requiresSubReason: true },
    ]
  }
};

// --- Sub Reason Options ---
const SUB_REASON_OPTIONS: Record<string, string[]> = {
  'contract-failed': ['조건 미합의', '보험료 부담', '경쟁사 선택', '결정 지연 후 이탈', '기타'],
  'on-site-impossible': ['서류 미비', '결정권자 부재', '현장 상황 변경', '고객 컨디션 이슈', '기타'],
  'meeting-cancelled': ['고객 일정 변경', '고객 거부', '가족 반대', '연락 두절', '기타'],
  'withdrawn': ['단순 변심', '가족 반대', '타사 조건 비교 후 이탈', '경제적 부담', '기타'],
  'uw-rejected': ['심사 거절 (병력)', '부담보 거절', '한도 초과', '신용정보 문제', '기타']
};

const FOLLOWUP_SUB_OPTIONS = [
  '2차 미팅 예정',
  '서류 보완 대기',
  '고객 재연락 예정',
  '내부 검토 중',
  '장기 보류',
] as const;

const MEETING_STATUS_LABELS: Record<string, string> = {
  'meeting-confirmed': '미팅 확정',
  'followup-in-progress': '후속 진행',
  'insurance-re-review': '보험 재심사',
  'followup-2nd-meeting': '2차 미팅',
  'contract-completed': '계약완료',
  'contract-failed': '계약실패',
  'on-site-impossible': '현장불가',
  'meeting-cancelled': '미팅취소',
  'no-show': '노쇼',
  'uw-rejected': '인수 불가',
  'withdrawn': '청약 철회/해지',
};


type MeetingStepUiStatus = 'available' | 'done' | 'attention';
type MeetingSectionId = 'preCall' | 'analysis' | 'script' | 'esign' | 'meetingComplete' | 'claimHandoff' | 'status';

interface MeetingStepStateModel {
  step: MeetingStepNumber;
  title: string;
  sectionId: MeetingSectionId;
  status: MeetingStepUiStatus;
  missingRequiredCount: number;
  missingItems: string[];
  unlockHint?: string;
}

const STEP_SECTION_MAP: Record<MeetingStepNumber, MeetingSectionId> = {
  1: 'preCall',
  2: 'analysis',
  3: 'script',
  4: 'esign',
  5: 'meetingComplete',
  6: 'claimHandoff',
};

const SECTION_STEP_MAP: Record<MeetingSectionId, MeetingStepNumber> = {
  preCall: 1,
  analysis: 2,
  script: 3,
  esign: 4,
  meetingComplete: 5,
  claimHandoff: 6,
  status: 5,
};

const STEP_TITLE_MAP: Record<MeetingStepNumber, string> = {
  1: '미팅 확정',
  2: '보험 분석',
  3: '스크립트 작성',
  4: '전자서명',
  5: '미팅 완료',
  6: '청구 인계',
};

const SECTION_TAB_MAP: Record<Exclude<MeetingSectionId, 'status'>, CenterTab> = {
  preCall: 'customer',
  analysis: 'insurance',
  script: 'script',
  esign: 'meetingComplete',
  meetingComplete: 'meetingComplete',
  claimHandoff: 'meetingComplete',
};

const SECTION_ANCHOR_ID_MAP: Record<MeetingSectionId, string> = {
  preCall: 'tab-customer',
  analysis: 'tab-insurance',
  script: 'tab-script',
  esign: 'tab-meeting-complete',
  meetingComplete: 'tab-meeting-complete',
  claimHandoff: 'step-claim-handoff',
  status: 'tab-status',
};

function resolveMeetingSection(alert: RequirementAlert): MeetingSectionId {
  if (alert.id === 'meeting-precall') return 'preCall';
  if (alert.id === 'meeting-analysis' || alert.id === 'integration-hira') return 'analysis';
  if (alert.id === 'meeting-script' || alert.id === 'integration-script') return 'script';
  if (alert.id === 'meeting-esign' || alert.id === 'meeting-glosign' || alert.id.startsWith('integration-glo')) {
    return 'esign';
  }
  if (
    alert.id === 'meeting-complete' ||
    alert.id.startsWith('meeting-noshow') ||
    alert.id.startsWith('meeting-close') ||
    alert.id.startsWith('meeting-withdraw') ||
    alert.id === 'meeting-uw-alt' ||
    alert.id.startsWith('meeting-post') ||
    alert.id === 'meeting-cx-min' ||
    alert.id === 'meeting-referral' ||
    alert.id === 'meeting-close-action' ||
    alert.id.startsWith('meeting-contract') ||
    alert.id.startsWith('meeting-delay') ||
    alert.id.startsWith('meeting-claim') ||
    alert.id === 'meeting-sales-pack' ||
    alert.id.startsWith('doc-') ||
    alert.kind === 'document' ||
    alert.id.startsWith('integration-easy') ||
    alert.id.startsWith('integration-claim')
  ) {
    return alert.id.startsWith('meeting-claim') ? 'claimHandoff' : 'meetingComplete';
  }
  if (
    alert.id.startsWith('meeting-followup') ||
    alert.id.startsWith('meeting-insurance-re-review') ||
    alert.id.startsWith('meeting-cancel') ||
    alert.id.startsWith('meeting-uw-reason') ||
    alert.id.startsWith('consult-') ||
    alert.id.startsWith('handoff-')
  ) {
    return 'status';
  }
  return 'status';
}

function normalizeLegacyMeetingStatus(status?: string): string {
  const statusMap: Record<string, string> = {
    '미팅확정': 'meeting-confirmed',
    '미팅 확정': 'meeting-confirmed',
    '유선 확인 완료': 'meeting-confirmed',
    '사전 분석 완료': 'meeting-confirmed',
    '후속 진행': 'followup-in-progress',
    '보험 재심사': 'insurance-re-review',
    '2차 미팅': 'followup-in-progress',
    '계약연기': 'followup-in-progress',
    '청구 인계': 'followup-in-progress',
    '계약완료': 'contract-completed',
    '계약실패': 'contract-failed',
    '계약실패(역량부족)': 'contract-failed',
    '현장불가': 'on-site-impossible',
    '미팅취소': 'meeting-cancelled',
    '노쇼': 'no-show',
    '인수 불가': 'uw-rejected',
    '청약 철회': 'withdrawn',
    '청약 철회/해지': 'withdrawn',
  };
  return status ? statusMap[status] || status : '';
}

function hasValue(value?: string | null) {
  return !!value && value.trim().length > 0;
}

function createEmptyReferralContact(): MeetingReferralContact {
  return {
    id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    phone: '',
    relationship: '',
  };
}

function isReferralContactFilled(contact: MeetingReferralContact) {
  return hasValue(contact.name) || hasValue(contact.phone) || hasValue(contact.relationship);
}

function getReferralContactCount(contacts: MeetingReferralContact[]) {
  return contacts.filter(isReferralContactFilled).length;
}

function toSelectableMeetingStatus(status?: string) {
  const normalized = normalizeLegacyMeetingStatus(status);
  return normalized && normalized in MEETING_STATUS_LABELS ? normalized : '';
}

function isFinalMeetingResultSelected(status?: string) {
  return hasValue(status) && status !== 'meeting-confirmed';
}

function formatMeetingRegion(location?: string) {
  if (!location) {
    return '-';
  }

  return location.split(' ').slice(0, 2).join(' ');
}

const MEETING_STEPS = [
  { key: 'step0', label: 'STEP 0', shortLabel: '사전준비' },
  { key: 'step1', label: 'STEP 1', shortLabel: '미팅확정' },
  { key: 'step2', label: 'STEP 2', shortLabel: '미팅완료 (1차/2차)' },
  { key: 'step3', label: 'STEP 3', shortLabel: '계약' },
  { key: 'step4', label: 'STEP 4', shortLabel: '청구팀 인계' },
] as const;

type MeetingStepKey = (typeof MEETING_STEPS)[number]['key'];
type MeetingDecisionMarker = 'absence' | 'success' | 'fail';

const MEETING_DETAIL_STEPS = [
  { key: 'step0', label: 'STEP 1', shortLabel: '사전준비' },
  { key: 'step1', label: 'STEP 2', shortLabel: '미팅확정' },
  { key: 'step2', label: 'STEP 3', shortLabel: '미팅완료 (1차/2차)' },
] as const;

interface MeetingStepMeta {
  employeeStepKey: MeetingStepKey;
  stageLabel: string;
  decisionStepKey?: MeetingStepKey;
  decisionLabel?: string;
  decisionMarker?: MeetingDecisionMarker;
  terminalReason?: string;
  stepDates: Partial<Record<MeetingStepKey, string>>;
}

interface MeetingStaffDetailMatrixItem extends EmployeeStepMatrixItem<any> {
  dbTypeLabel: string;
  meetingDateTimeLabel: string;
  meetingLocationLabel: string;
  contractResultLabel: string;
  preparationItems: Array<{ label: string; active: boolean }>;
  integrationBadges: Array<{ label: string; active: boolean }>;
  referralCount: number;
}

function buildMeetingStepDatesForKeys<StepKey extends string>(
  dateLabel: string,
  allSteps: readonly { key: StepKey }[],
  reachedKeys: StepKey[]
) {
  const matched = dateLabel.match(/\d{4}-\d{2}-\d{2}/);
  if (!matched) {
    return {} as Partial<Record<StepKey, string>>;
  }

  const baseDate = new Date(`${matched[0]}T00:00:00`);
  if (Number.isNaN(baseDate.getTime())) {
    return {} as Partial<Record<StepKey, string>>;
  }

  const orderedReachedKeys = allSteps.map((step) => step.key).filter((stepKey) =>
    reachedKeys.includes(stepKey)
  );
  if (!orderedReachedKeys.length) {
    return {} as Partial<Record<StepKey, string>>;
  }

  return orderedReachedKeys.reduce((acc, stepKey, index) => {
    acc[stepKey] = format(subDays(baseDate, orderedReachedKeys.length - 1 - index), 'MM.dd');
    return acc;
  }, {} as Partial<Record<StepKey, string>>);
}

function buildMeetingStepDates(dateLabel: string, reachedKeys: MeetingStepKey[]) {
  return buildMeetingStepDatesForKeys(dateLabel, MEETING_STEPS, reachedKeys);
}

function resolveMeetingStatusCode(status?: string) {
  if (!status) {
    return '';
  }

  return normalizeLegacyMeetingStatus(status);
}

function getMeetingStepMeta(status: string, date: string, summary?: string): MeetingStepMeta {
  switch (status) {
    case '가망 고객':
      return { employeeStepKey: 'step0', stageLabel: '사전준비', stepDates: buildMeetingStepDates(date, ['step0']) };
    case '미팅 확정':
      return { employeeStepKey: 'step1', stageLabel: '미팅확정', stepDates: buildMeetingStepDates(date, ['step0', 'step1']) };
    case '미팅 완료':
    case '후속 진행':
    case '보험 재심사':
    case '2차 미팅':
      return { employeeStepKey: 'step2', stageLabel: '미팅완료', stepDates: buildMeetingStepDates(date, ['step0', 'step1', 'step2']) };
    case '계약완료':
      return {
        employeeStepKey: 'step3',
        stageLabel: '계약',
        decisionStepKey: 'step2',
        decisionLabel: '계약완료',
        decisionMarker: 'success',
        stepDates: buildMeetingStepDates(date, ['step0', 'step1', 'step2', 'step3']),
      };
    case '현장불가':
      return {
        employeeStepKey: 'step2',
        stageLabel: '미팅완료',
        decisionStepKey: 'step2',
        decisionLabel: '현장불가',
        decisionMarker: 'fail',
        terminalReason: summary,
        stepDates: buildMeetingStepDates(date, ['step0', 'step1', 'step2']),
      };
    case '미팅취소':
      return {
        employeeStepKey: 'step1',
        stageLabel: '미팅확정',
        decisionStepKey: 'step1',
        decisionLabel: '취소',
        decisionMarker: 'fail',
        terminalReason: summary,
        stepDates: buildMeetingStepDates(date, ['step0', 'step1']),
      };
    case '노쇼':
      return {
        employeeStepKey: 'step2',
        stageLabel: '미팅완료',
        decisionStepKey: 'step2',
        decisionLabel: '노쇼',
        decisionMarker: 'fail',
        terminalReason: summary,
        stepDates: buildMeetingStepDates(date, ['step0', 'step1', 'step2']),
      };
    case '인수 불가':
      return {
        employeeStepKey: 'step2',
        stageLabel: '미팅완료',
        decisionStepKey: 'step2',
        decisionLabel: '불가',
        decisionMarker: 'fail',
        terminalReason: summary,
        stepDates: buildMeetingStepDates(date, ['step0', 'step1', 'step2']),
      };
    case '청약 철회':
    case '청약 철회/해지':
    case '계약실패':
      return {
        employeeStepKey: 'step2',
        stageLabel: '미팅완료',
        decisionStepKey: 'step2',
        decisionLabel: '계약실패',
        decisionMarker: 'fail',
        terminalReason: summary,
        stepDates: buildMeetingStepDates(date, ['step0', 'step1', 'step2']),
      };
    default:
      return { employeeStepKey: 'step0', stageLabel: status, stepDates: buildMeetingStepDates(date, ['step0']) };
  }
}

function getMeetingDetailStepMeta(status: string, date: string, summary?: string): MeetingStepMeta {
  switch (status) {
    case '가망 고객':
      return {
        employeeStepKey: 'step0',
        stageLabel: '사전준비',
        stepDates: buildMeetingStepDatesForKeys(date, MEETING_DETAIL_STEPS, ['step0']),
      };
    case 'meeting-confirmed':
    case '미팅 확정':
      return {
        employeeStepKey: 'step1',
        stageLabel: '미팅확정',
        stepDates: buildMeetingStepDatesForKeys(date, MEETING_DETAIL_STEPS, ['step0', 'step1']),
      };
    case '미팅 완료':
    case 'followup-in-progress':
    case 'insurance-re-review':
    case 'followup-2nd-meeting':
    case '후속 진행':
    case '보험 재심사':
    case '2차 미팅':
    case 'contract-completed':
    case '계약완료':
      return {
        employeeStepKey: 'step2',
        stageLabel: '미팅완료',
        stepDates: buildMeetingStepDatesForKeys(date, MEETING_DETAIL_STEPS, ['step0', 'step1', 'step2']),
      };
    case 'meeting-cancelled':
    case '미팅취소':
      return {
        employeeStepKey: 'step1',
        stageLabel: '미팅확정',
        decisionStepKey: 'step1',
        decisionLabel: '취소',
        decisionMarker: 'fail',
        terminalReason: summary,
        stepDates: buildMeetingStepDatesForKeys(date, MEETING_DETAIL_STEPS, ['step0', 'step1']),
      };
    case 'no-show':
    case '노쇼':
      return {
        employeeStepKey: 'step2',
        stageLabel: '미팅완료',
        decisionStepKey: 'step2',
        decisionLabel: '노쇼',
        decisionMarker: 'fail',
        terminalReason: summary,
        stepDates: buildMeetingStepDatesForKeys(date, MEETING_DETAIL_STEPS, ['step0', 'step1', 'step2']),
      };
    case 'on-site-impossible':
    case '현장불가':
      return {
        employeeStepKey: 'step2',
        stageLabel: '미팅완료',
        decisionStepKey: 'step2',
        decisionLabel: '현장불가',
        decisionMarker: 'fail',
        terminalReason: summary,
        stepDates: buildMeetingStepDatesForKeys(date, MEETING_DETAIL_STEPS, ['step0', 'step1', 'step2']),
      };
    case 'uw-rejected':
    case '인수 불가':
      return {
        employeeStepKey: 'step2',
        stageLabel: '미팅완료',
        decisionStepKey: 'step2',
        decisionLabel: '인수 불가',
        decisionMarker: 'fail',
        terminalReason: summary,
        stepDates: buildMeetingStepDatesForKeys(date, MEETING_DETAIL_STEPS, ['step0', 'step1', 'step2']),
      };
    case 'withdrawn':
    case '청약 철회':
    case '청약 철회/해지':
      return {
        employeeStepKey: 'step2',
        stageLabel: '미팅완료',
        decisionStepKey: 'step2',
        decisionLabel: '철회',
        decisionMarker: 'fail',
        terminalReason: summary,
        stepDates: buildMeetingStepDatesForKeys(date, MEETING_DETAIL_STEPS, ['step0', 'step1', 'step2']),
      };
    case 'contract-failed':
    case '계약실패':
      return {
        employeeStepKey: 'step2',
        stageLabel: '미팅완료',
        decisionStepKey: 'step2',
        decisionLabel: '계약실패',
        decisionMarker: 'fail',
        terminalReason: summary,
        stepDates: buildMeetingStepDatesForKeys(date, MEETING_DETAIL_STEPS, ['step0', 'step1', 'step2']),
      };
    default:
      return {
        employeeStepKey: 'step0',
        stageLabel: status,
        stepDates: buildMeetingStepDatesForKeys(date, MEETING_DETAIL_STEPS, ['step0']),
      };
  }
}

const CLAIM_HANDOFF_LABELS = ['3종 서류', '증권', '지급내역서'] as const;
const INTEGRATION_LABELS = ['회원가입', '앱 설치', '홈택스', '심평원', '건보', 'C4U'] as const;

function toDeterministicSeed(input: string) {
  return Array.from(input).reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);
}

function formatMatrixDateTimeLabel(value?: string) {
  if (!value) {
    return '-';
  }

  return value.replace('T', ' ').slice(0, 16);
}

function isMeetingDraftUntouched(draft?: MeetingDraft) {
  if (!draft) {
    return true;
  }

  return (
    !hasValue(draft.selectedDetail) &&
    !hasValue(draft.postMeetingNote) &&
    !draft.claimTransferRequested &&
    !hasValue(draft.claimTransferReason) &&
    draft.contractData.length === 0 &&
    !draft.postThreeDocSubmitted &&
    !draft.onSitePolicyCollected &&
    !draft.onSitePaymentStatementCollected &&
    !draft.memberSignupCompleted &&
    !draft.onSiteAppLinked &&
    !draft.hometaxLinked &&
    !draft.hiraLinked &&
    !draft.nhisLinked &&
    !draft.c4uLinked &&
    draft.referralCount === 0 &&
    draft.referralContacts.length === 0 &&
    !draft.referralAsked &&
    !draft.onSiteReferralPrompted
  );
}

function getContractResultSummary(contractData: MeetingDraft['contractData'] = []) {
  if (!contractData.length) {
    return {
      label: '-',
      count: 0,
      premiumText: '0',
      latestLabel: '-',
    };
  }

  const totalPremiumWon = contractData.reduce((sum, contract) => {
    const parsedPremium = Number.parseInt(contract.premium.replace(/,/g, ''), 10);
    return Number.isNaN(parsedPremium) ? sum : sum + parsedPremium;
  }, 0);
  const totalPremiumManwon = totalPremiumWon / 10000;
  const formattedPremium = Number.isInteger(totalPremiumManwon)
    ? totalPremiumManwon.toLocaleString('ko-KR')
    : totalPremiumManwon.toLocaleString('ko-KR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });

  return {
    label: `${contractData.length}건 / ${formattedPremium}만원`,
    count: contractData.length,
    premiumText: formattedPremium,
    latestLabel: `${contractData[contractData.length - 1].insurer} · ${contractData[contractData.length - 1].productName}`,
  };
}

function formatContractResultLabel(draft?: MeetingDraft) {
  return getContractResultSummary(draft?.contractData).label;
}

function resolveMeetingDetailStatus(item: any, draft?: MeetingDraft) {
  const draftStatus = resolveMeetingStatusCode(draft?.selectedDetail);
  if (draftStatus) {
    return draftStatus;
  }

  return resolveMeetingStatusCode(item.status);
}

function formatFallbackContractResultLabel(item: any) {
  const statusCode = resolveMeetingStatusCode(item.status);
  if (statusCode !== 'contract-completed') {
    return '-';
  }

  const seed = toDeterministicSeed(item.requestId || item.id || item.customer || '');
  const count = seed % 3 === 0 ? 2 : 1;
  const amount = count === 2
    ? 28 + (seed % 18)
    : item.category === 'refund'
      ? 18 + (seed % 10)
      : 12 + (seed % 8);

  return `${count}건 / ${amount.toLocaleString('ko-KR')}만원`;
}

function buildClaimHandoffItems(
  item: any,
  draft?: MeetingDraft
) {
  const statusCode = resolveMeetingStatusCode(item.status);
  const fallbackAllActive = item.category === 'refund' && statusCode === 'contract-completed';
  const useFallback = isMeetingDraftUntouched(draft);

  return [
    { label: '3종 서류', active: useFallback ? fallbackAllActive : draft?.postThreeDocSubmitted ?? fallbackAllActive },
    { label: '증권', active: useFallback ? fallbackAllActive : draft?.onSitePolicyCollected ?? fallbackAllActive },
    { label: '지급내역서', active: useFallback ? fallbackAllActive : draft?.onSitePaymentStatementCollected ?? fallbackAllActive },
  ];
}

function buildIntegrationItems(
  item: any,
  draft?: MeetingDraft,
  hasJourney?: boolean
) {
  const statusCode = resolveMeetingStatusCode(item.status);
  const seed = toDeterministicSeed(item.requestId || item.id || item.customer || '');
  const progressed = ['contract-completed', 'followup-in-progress', 'insurance-re-review'].includes(statusCode) || item.status === '미팅 완료';
  const useFallback = isMeetingDraftUntouched(draft);
  const signedUp = useFallback ? (hasJourney || statusCode !== '' || item.status !== '가망 고객') : draft?.memberSignupCompleted ?? (hasJourney || statusCode !== '' || item.status !== '가망 고객');
  const appInstalled = useFallback ? (progressed || seed % 3 === 0) : draft?.onSiteAppLinked ?? (progressed || seed % 3 === 0);
  const hometaxLinked = useFallback ? (progressed || seed % 2 === 0) : draft?.hometaxLinked ?? draft?.onSiteInstitutionLinked ?? (progressed || seed % 2 === 0);
  const hiraLinked = useFallback ? (hasJourney || statusCode !== '가망 고객') : draft?.hiraLinked ?? (hasJourney || statusCode !== '가망 고객');
  const nhisLinked = useFallback ? (progressed || seed % 4 === 0) : draft?.nhisLinked ?? draft?.onSiteInstitutionLinked ?? (progressed || seed % 4 === 0);
  const c4uLinked = useFallback ? (progressed || seed % 5 === 0) : draft?.c4uLinked ?? draft?.claimAgreementRequested ?? (progressed || seed % 5 === 0);

  return [
    { label: '회원가입', active: signedUp },
    { label: '앱 설치', active: appInstalled },
    { label: '홈택스', active: hometaxLinked },
    { label: '심평원', active: hiraLinked },
    { label: '건보', active: nhisLinked },
    { label: 'C4U', active: c4uLinked },
  ];
}

function buildReferralCount(item: any, draft?: MeetingDraft) {
  if (draft && !isMeetingDraftUntouched(draft)) {
    if (draft.referralContacts.length > 0) {
      return getReferralContactCount(draft.referralContacts);
    }

    if (typeof draft.referralCount === 'number') {
      return draft.referralCount;
    }

    return [
      draft.preMeetingReferralPushSent,
      draft.onSiteReferralPrompted,
      draft.referralAsked,
    ].filter(Boolean).length;
  }

  const statusCode = resolveMeetingStatusCode(item.status);
  const seed = toDeterministicSeed(`${item.requestId || item.id || ''}-referral`);

  if (statusCode === 'contract-completed') {
    return 1 + (seed % 3);
  }

  if (statusCode === 'followup-in-progress' || item.status === '미팅 완료') {
    return 1;
  }

  return 0;
}

const MEETING_DETAIL_COLUMNS: EmployeeStepOwnerDetailColumn<any>[] = [
  {
    key: 'dbType',
    header: 'DB 유형',
    cellClassName: 'min-w-[120px]',
    render: (item) => {
      const detailItem = item as MeetingStaffDetailMatrixItem;
      return (
        <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
          {detailItem.dbTypeLabel}
        </span>
      );
    },
  },
  {
    key: 'meetingSchedule',
    header: '미팅 장소/시간',
    cellClassName: 'min-w-[220px]',
    render: (item) => {
      const detailItem = item as MeetingStaffDetailMatrixItem;
      return (
        <div>
          <div className="font-medium text-slate-700">{detailItem.meetingLocationLabel}</div>
          <div className="mt-1 text-xs text-slate-500">{detailItem.meetingDateTimeLabel}</div>
        </div>
      );
    },
  },
  {
    key: 'preparation',
    header: '사전 준비 항목',
    placement: 'after_steps',
    cellClassName: 'min-w-[180px]',
    render: (item) => {
      const detailItem = item as MeetingStaffDetailMatrixItem;
      return (
        <div className="space-y-1.5">
          {detailItem.preparationItems.map((prep) => (
            <div key={prep.label} className="flex items-center gap-2 text-xs">
              <span
                className={clsx(
                  'inline-flex h-4 w-4 items-center justify-center rounded-full',
                  prep.active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'
                )}
              >
                <CheckCircle2 size={12} />
              </span>
              <span className={clsx(prep.active ? 'font-semibold text-slate-700' : 'text-slate-400')}>
                {prep.label}
              </span>
            </div>
          ))}
        </div>
      );
    },
  },
  {
    key: 'integrationStatus',
    header: '연동 현황',
    placement: 'after_steps',
    cellClassName: 'min-w-[220px]',
    render: (item) => {
      const detailItem = item as MeetingStaffDetailMatrixItem;
      return (
        <div className="flex flex-wrap gap-2 text-[11px]">
          {detailItem.integrationBadges.map((integration) => (
            <span
              key={integration.label}
              className={clsx(
                'rounded-full border px-2 py-1 font-semibold transition-colors',
                integration.active
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-slate-50 text-slate-400'
              )}
            >
              {integration.label}
            </span>
          ))}
        </div>
      );
    },
  },
  {
    key: 'contractResult',
    header: '계약 현황',
    placement: 'after_steps',
    cellClassName: 'min-w-[140px]',
    render: (item) => {
      const detailItem = item as MeetingStaffDetailMatrixItem;
      return <div className="text-xs font-semibold text-slate-700">{detailItem.contractResultLabel}</div>;
    },
  },
];

// --- Mock Data ---

const LEGACY_EXECUTION_QUEUE = [
  {
     id: 'E-2026-101',
     requestId: 'R-2026-001',
     customerId: 'C-1024',
     customer: '이영희',
     type: '3년 환급',
     category: 'refund',
     date: '2026-01-20 14:00',
     status: '가망 고객',
     statusGroup: 'NEGOTIATING',
     location: '경기 성남시 분당구 판교역로 123',
     manager: '최미팅',
     phone: '010-9876-5432',
     birth: '921103-2******',
     gender: '여',
     address: '경기 성남시 분당구 판교역로 123',
     consultationSummary: '1차 상담 시 긍정적, 실손/종합 모두 보유. 남편 동석 가능성 있음.',
     consultation: {
        criticalDisease: '고혈압 (2023년 진단, 약 복용 중)',
        medicalHistory: '감기몸살 (2025.12, 3일 입원)'
     },
     analysis: {
        surgeryHistory: '제왕절개 수술 (2020년)',
        familyHistory: '어머니 당뇨'
     }
  },
  {
     id: 'E-2026-102',
     requestId: 'R-2026-002',
     customerId: 'C-1026',
     customer: '박지성',
     type: '간편 청구',
     category: 'simple',
     date: '2026-03-10 11:00',
     status: '미팅 확정',
     statusGroup: 'PENDING',
     location: '서울 송파구 올림픽로 300',
     manager: '박미팅',
     phone: '010-5555-4444',
     birth: '810225-1******',
     gender: '남',
     address: '서울 송파구 올림픽로 300',
     consultationSummary: '환급 예상액 200만원 안내됨. 자료 준비 완료.'
  },
  {
     id: 'E-2026-103',
     requestId: 'R-2026-005',
     customerId: 'C-1028',
     customer: '윤서연',
     type: '3년 환급',
     category: 'refund',
     date: '2026-03-11 16:00',
     status: '가망 고객',
     statusGroup: 'NEGOTIATING',
     location: '서울 마포구 월드컵북로 221',
     manager: '문상담',
     phone: '010-4421-1882',
     birth: '950411-2******',
     gender: '여',
     address: '서울 마포구 월드컵북로 221',
     consultationSummary: '가족 동석 가능, 환급+전환 제안 검토 중'
  },
  {
     id: 'E-2026-104',
     requestId: 'R-2026-006',
     customerId: 'C-1029',
     customer: '조민호',
     type: '3년 환급',
     category: 'refund',
     date: '2026-03-07 11:00',
     status: '미팅 확정',
     statusGroup: 'PENDING',
     location: '경기 수원시 영통구 센트럴타운로 42',
     manager: '김상담',
     phone: '010-2291-7708',
     birth: '870320-1******',
     gender: '남',
     address: '경기 수원시 영통구 센트럴타운로 42',
     consultationSummary: '보장 분석 결과 전달 후 미팅 확정'
  },
  {
     id: 'E-2026-105',
     requestId: 'R-2026-007',
     customerId: 'C-1030',
     customer: '한수진',
     type: '간편 청구',
     category: 'simple',
     date: '2026-03-03 15:00',
     status: '계약완료',
     statusGroup: 'WON',
     location: '인천 연수구 센트럴로 123',
     manager: '박미팅',
     phone: '010-7741-6250',
     birth: '930728-2******',
     gender: '여',
     address: '인천 연수구 센트럴로 123',
     consultationSummary: '간편 청구 후 추가 보장 전환 완료'
  },
  {
     id: 'E-2026-106',
     requestId: 'R-2026-008',
     customerId: 'C-1031',
     customer: '오태윤',
     type: '간편 청구',
     category: 'simple',
     date: '2026-02-26 10:30',
     status: '미팅취소',
     statusGroup: 'LOST',
     location: '대전 유성구 대학로 77',
     manager: '이팀장',
     phone: '010-8188-2234',
     birth: '840915-1******',
     gender: '남',
     address: '대전 유성구 대학로 77',
     consultationSummary: '고객 일정 변경으로 취소'
  },
  {
     id: 'E-2026-107',
     requestId: 'R-2026-009',
     customerId: 'C-1032',
     customer: '서지민',
     type: '3년 환급',
     category: 'refund',
     date: '2026-02-19 13:00',
     status: '2차 미팅',
     statusGroup: 'NEGOTIATING',
     location: '서울 종로구 세종대로 99',
     manager: '최미팅',
     phone: '010-6055-1187',
     birth: '910904-2******',
     gender: '여',
     address: '서울 종로구 세종대로 99',
     consultationSummary: '가족 검토 후 2차 미팅 예정'
  },
  {
     id: 'E-2026-108',
     requestId: 'R-2026-010',
     customerId: 'C-1033',
     customer: '임도현',
     type: '3년 환급',
     category: 'refund',
     date: '2026-02-12 09:30',
     status: '가망 고객',
     statusGroup: 'NEGOTIATING',
     location: '서울 서초구 반포대로 201',
     manager: '문상담',
     phone: '010-9012-4752',
     birth: '890112-1******',
     gender: '남',
     address: '서울 서초구 반포대로 201',
     consultationSummary: '보장 조정안 제안 검토 중'
  },
  {
     id: 'E-2026-109',
     requestId: 'R-2026-011',
     customerId: 'C-1034',
     customer: '문가은',
     type: '간편 청구',
     category: 'simple',
     date: '2026-01-28 09:30',
     status: '후속 진행',
     statusGroup: 'NEGOTIATING',
     location: '서울 중랑구 면목로 55',
     manager: '김상담',
     phone: '010-3365-7120',
     birth: '970617-2******',
     gender: '여',
     address: '서울 중랑구 면목로 55',
     consultationSummary: '판매 없이 후속 처리 및 청구 인계 검토'
  },
  {
     id: 'E-2026-110',
     requestId: 'R-2026-012',
     customerId: 'C-1035',
     customer: '최하늘',
     type: '3년 환급',
     category: 'refund',
     date: '2025-12-22 17:00',
     status: '계약완료',
     statusGroup: 'WON',
     location: '서울 도봉구 도봉로 401',
     manager: '박미팅',
     phone: '010-6622-1993',
     birth: '920202-2******',
     gender: '여',
     address: '서울 도봉구 도봉로 401',
     consultationSummary: '환급 후 종합보험 계약까지 완료'
  },
  {
     id: 'E-2026-111',
     requestId: 'R-2026-013',
     customerId: 'C-1036',
     customer: '박서윤',
     type: '간편 청구',
     category: 'simple',
     date: '2026-03-12 18:30',
     status: '미팅 확정',
     statusGroup: 'PENDING',
     location: '서울 강서구 공항대로 188',
     manager: '김상담',
     phone: '010-4551-7234',
     birth: '910115-2******',
     gender: '여',
     address: '서울 강서구 공항대로 188',
     consultationSummary: '청구 서류 사전 안내 완료, 저녁 시간 미팅 확정'
  },
  {
     id: 'E-2026-112',
     requestId: 'R-2026-014',
     customerId: 'C-1037',
     customer: '장우진',
     type: '3년 환급',
     category: 'refund',
     date: '2026-03-09 13:30',
     status: '계약완료',
     statusGroup: 'WON',
     location: '경기 고양시 일산동구 중앙로 1215',
     manager: '최미팅',
     phone: '010-7812-4435',
     birth: '860903-1******',
     gender: '남',
     address: '경기 고양시 일산동구 중앙로 1215',
     consultationSummary: '환급 분석 후 계약 전환 완료'
  },
  {
     id: 'E-2026-113',
     requestId: 'R-2026-015',
     customerId: 'C-1038',
     customer: '서민지',
     type: '3년 환급',
     category: 'refund',
     date: '2026-03-06 10:00',
     status: '가망 고객',
     statusGroup: 'NEGOTIATING',
     location: '서울 성동구 왕십리로 303',
     manager: '문상담',
     phone: '010-9124-1055',
     birth: '940728-2******',
     gender: '여',
     address: '서울 성동구 왕십리로 303',
     consultationSummary: '가족 동석 조율 중, 2차 설명 예정'
  },
  {
     id: 'E-2026-114',
     requestId: 'R-2026-016',
     customerId: 'C-1039',
     customer: '한동현',
     type: '간편 청구',
     category: 'simple',
     date: '2026-03-01 15:20',
     status: '후속 진행',
     statusGroup: 'NEGOTIATING',
     location: '인천 남동구 논현로 88',
     manager: '박미팅',
     phone: '010-3004-8271',
     birth: '820514-1******',
     gender: '남',
     address: '인천 남동구 논현로 88',
     consultationSummary: '판매 없이 후속 처리 진행'
  },
  {
     id: 'E-2026-115',
     requestId: 'R-2026-017',
     customerId: 'C-1040',
     customer: '유나경',
     type: '3년 환급',
     category: 'refund',
     date: '2026-02-24 11:40',
     status: '미팅취소',
     statusGroup: 'LOST',
     location: '서울 영등포구 여의대로 25',
     manager: '김상담',
     phone: '010-6741-2288',
     birth: '970212-2******',
     gender: '여',
     address: '서울 영등포구 여의대로 25',
     consultationSummary: '고객 일정 변경으로 차주 재조율 요청'
  },
  {
     id: 'E-2026-116',
     requestId: 'R-2026-018',
     customerId: 'C-1041',
     customer: '오승민',
     type: '간편 청구',
     category: 'simple',
     date: '2026-02-18 14:20',
     status: '계약완료',
     statusGroup: 'WON',
     location: '부산 해운대구 해운대로 620',
     manager: '최미팅',
     phone: '010-2287-3341',
     birth: '880822-1******',
     gender: '남',
     address: '부산 해운대구 해운대로 620',
     consultationSummary: '청구 대행 후 추가 상품 제안 수락'
  },
  {
     id: 'E-2026-117',
     requestId: 'R-2026-019',
     customerId: 'C-1042',
     customer: '임수연',
     type: '3년 환급',
     category: 'refund',
     date: '2026-02-09 09:10',
     status: '2차 미팅',
     statusGroup: 'NEGOTIATING',
     location: '서울 서대문구 통일로 165',
     manager: '문상담',
     phone: '010-5449-6672',
     birth: '930426-2******',
     gender: '여',
     address: '서울 서대문구 통일로 165',
     consultationSummary: '추가 자료 준비 후 2차 미팅 예정'
  },
  {
     id: 'E-2026-118',
     requestId: 'R-2026-020',
     customerId: 'C-1043',
     customer: '조현우',
     type: '간편 청구',
     category: 'simple',
     date: '2026-01-31 16:10',
     status: '가망 고객',
     statusGroup: 'NEGOTIATING',
     location: '서울 강동구 천호대로 1010',
     manager: '박미팅',
     phone: '010-1105-9902',
     birth: '900907-1******',
     gender: '남',
     address: '서울 강동구 천호대로 1010',
     consultationSummary: '청구 범위 확인 후 후속 콜 예정'
  },
  {
     id: 'E-2026-119',
     requestId: 'R-2026-021',
     customerId: 'C-1044',
     customer: '김도윤',
     type: '3년 환급',
     category: 'refund',
     date: '2026-01-11 12:00',
     status: '미팅 확정',
     statusGroup: 'PENDING',
     location: '대구 수성구 동대구로 95',
     manager: '최미팅',
     phone: '010-7811-2480',
     birth: '850404-1******',
     gender: '남',
     address: '대구 수성구 동대구로 95',
     consultationSummary: '환급 가능성 높음, 점심 미팅 확정'
  },
  {
     id: 'E-2026-120',
     requestId: 'R-2026-022',
     customerId: 'C-1045',
     customer: '최유리',
     type: '간편 청구',
     category: 'simple',
     date: '2025-11-27 17:40',
     status: '계약완료',
     statusGroup: 'WON',
     location: '서울 종로구 종로 91',
     manager: '김상담',
     phone: '010-6614-5008',
     birth: '960930-2******',
     gender: '여',
     address: '서울 종로구 종로 91',
     consultationSummary: '간편 청구 완료 후 후속 계약 성사'
  },
  {
     id: 'E-2026-121',
     requestId: 'R-2026-023',
     customerId: 'C-1042',
     customer: '임수연',
     type: '3년 환급',
     category: 'refund',
     date: '2026-03-04 14:10',
     status: '인수 불가',
     statusGroup: 'LOST',
     location: '서울 서대문구 통일로 165',
     manager: '문상담',
     phone: '010-5449-6672',
     birth: '930426-2******',
     gender: '여',
     address: '서울 서대문구 통일로 165',
     consultationSummary: '미팅 후 고지 병력 이슈로 인수 불가 판단'
  },
  {
     id: 'E-2026-122',
     requestId: 'R-2026-024',
     customerId: 'C-1037',
     customer: '장우진',
     type: '3년 환급',
     category: 'refund',
     date: '2026-02-21 18:20',
     status: '노쇼',
     statusGroup: 'LOST',
     location: '경기 고양시 일산동구 중앙로 1215',
     manager: '최미팅',
     phone: '010-7812-4435',
     birth: '860903-1******',
     gender: '남',
     address: '경기 고양시 일산동구 중앙로 1215',
     consultationSummary: '확정된 미팅 일정에 고객 미방문, 연락 두절'
  },
  {
     id: 'E-2026-123',
     requestId: 'R-2026-025',
     customerId: 'C-1040',
     customer: '유나경',
     type: '간편 청구',
     category: 'simple',
     date: '2026-02-15 11:30',
     status: '청약 철회/해지',
     statusGroup: 'LOST',
     location: '서울 영등포구 여의대로 25',
     manager: '김상담',
     phone: '010-6741-2288',
     birth: '970212-2******',
     gender: '여',
     address: '서울 영등포구 여의대로 25',
     consultationSummary: '미팅 후 조건 검토 끝에 청약 철회 요청'
  }
];

const EXECUTION_QUEUE = MOCK_DATA.meetingExecutionQueue;

// --- Main Component ---

export interface MeetingExecutionProps {
  onNavigate: (tab: string) => void;
  type?: 'refund' | 'simple';
  initialRequestId?: string | null;
  /** 미팅 단계 필터: 'pre_analysis' | 'on_site' | 'contract_close' */
  meetingStageFilter?: 'pre_analysis' | 'on_site' | 'contract_close';
}

export function MeetingExecution({ onNavigate, type, initialRequestId, meetingStageFilter }: MeetingExecutionProps) {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedStaffOwner, setSelectedStaffOwner] = useState<string | null>(null);
  const defaultCustomPeriodRange = useMemo(() => getDefaultCustomPeriodRange(), []);
  const [periodPreset, setPeriodPreset] = useState<PerformancePeriodPreset>('all');
  const [customPeriodStartDate, setCustomPeriodStartDate] = useState(defaultCustomPeriodRange.startDate);
  const [customPeriodEndDate, setCustomPeriodEndDate] = useState(defaultCustomPeriodRange.endDate);
  const [activeTab, setActiveTab] = useState<'list' | 'staff'>('list');
  const { journeys } = useJourneyStore();
  const { currentRole } = useRole();
  const currentOwnerName = currentRole === 'sales_member' ? '박미팅' : '';

  useEffect(() => {
    if (initialRequestId) {
       const item = EXECUTION_QUEUE.find(i => i.requestId === initialRequestId || i.id === initialRequestId);
       if (item) {
          setSelectedItem(item);
       }
    }
  }, [initialRequestId]);

  // Filter Data
  const filteredData = EXECUTION_QUEUE.filter(item => {
     if (item.category === 'simple' || item.type === '간편 청구') return false;
     if (!type) return true;
     return item.category === type;
  });

  const periodRange = useMemo(
    () =>
      getPerformancePeriodRange(
        periodPreset,
        customPeriodStartDate,
        customPeriodEndDate,
        new Date(),
        getRowsDateBounds(filteredData, (item) => item.date, defaultCustomPeriodRange)
      ),
    [customPeriodEndDate, customPeriodStartDate, defaultCustomPeriodRange, filteredData, periodPreset]
  );

  const displayData = useMemo(
    () => filterRowsByPeriod(filteredData, periodRange, (item) => item.date),
    [filteredData, periodRange]
  );

  const staffItems = useMemo<EmployeeStepMatrixItem<any>[]>(
    () =>
      displayData.map((item) => {
        const stepMeta = getMeetingStepMeta(item.status, item.date, item.consultationSummary || item.location);

        return {
          id: item.id,
          customerName: item.customer,
          ownerName: item.manager,
          typeLabel: item.type,
          dateLabel: item.date,
          stageLabel: stepMeta.stageLabel,
          summaryLabel: item.consultationSummary || item.location,
          regionLabel: formatMeetingRegion(item.location),
          completed: stepMeta.employeeStepKey === 'step3' || stepMeta.employeeStepKey === 'step4',
          employeeStepKey: stepMeta.employeeStepKey,
          decisionStepKey: stepMeta.decisionStepKey,
          decisionLabel: stepMeta.decisionLabel,
          decisionMarker: stepMeta.decisionMarker,
          stepDates: stepMeta.stepDates,
          terminalReason: stepMeta.terminalReason,
          original: item,
        };
      }),
    [displayData]
  );

  const staffDetailItems = useMemo<MeetingStaffDetailMatrixItem[]>(
    () =>
      displayData.map((item) => {
        const journey = journeys[item.requestId];
        const draft = journey?.meetingDraft;
        const detailStatus = resolveMeetingDetailStatus(item, draft) || item.status;
        const meetingDateSource = draft?.meetingTime || item.date;
        const meetingLocationSource = draft?.meetingLocation || item.location;
        const stepMeta = getMeetingDetailStepMeta(
          detailStatus,
          meetingDateSource,
          item.consultationSummary || meetingLocationSource
        );
        const contractResultLabel = !isMeetingDraftUntouched(draft) && formatContractResultLabel(draft) !== '-'
          ? formatContractResultLabel(draft)
          : formatFallbackContractResultLabel(item);
        const preparationItems = [
          {
            label: '건강체크 완료',
            active: Boolean(draft?.hiraLinked || draft?.nhisLinked || draft?.hiraSummary),
          },
          {
            label: '보장분석 완료',
            active: Boolean(draft?.analysisFileUploaded || draft?.coverageSummary || draft?.designRequested),
          },
        ];
        const integrationBadges = [
          { label: '심평원', active: Boolean(draft?.hiraLinked) },
          { label: '홈택스', active: Boolean(draft?.hometaxLinked) },
          { label: '건보', active: Boolean(draft?.nhisLinked) },
        ];
        const referralCount = buildReferralCount(item, draft);

        return {
          id: item.id,
          customerName: item.customer,
          ownerName: item.manager,
          typeLabel: item.type,
          dateLabel: meetingDateSource,
          stageLabel: stepMeta.stageLabel,
          summaryLabel: item.consultationSummary || item.location,
          regionLabel: formatMeetingRegion(meetingLocationSource),
          completed:
            item.statusGroup === 'WON' ||
            draft?.selectedGroup === 'WON' ||
            contractResultLabel !== '-' ||
            Boolean(draft?.claimTransferRequested),
          employeeStepKey: stepMeta.employeeStepKey,
          decisionStepKey: stepMeta.decisionStepKey,
          decisionLabel: stepMeta.decisionLabel,
          decisionMarker: stepMeta.decisionMarker,
          stepDates: stepMeta.stepDates,
          terminalReason: stepMeta.terminalReason,
          dbTypeLabel: item.type,
          meetingDateTimeLabel: formatMatrixDateTimeLabel(meetingDateSource),
          meetingLocationLabel: meetingLocationSource || '-',
          contractResultLabel,
          preparationItems,
          integrationBadges,
          referralCount,
          original: item,
        };
      }),
    [displayData, journeys]
  );

  const visibleStaffItems = useMemo(
    () => currentRole === 'sales_member'
      ? staffItems.filter((item) => item.ownerName === currentOwnerName)
      : staffItems,
    [currentOwnerName, currentRole, staffItems]
  );

  useEffect(() => {
    if (activeTab !== 'staff') {
      setSelectedStaffOwner(null);
      return;
    }

    if (selectedStaffOwner && !visibleStaffItems.some((item) => item.ownerName === selectedStaffOwner)) {
      setSelectedStaffOwner(null);
    }
  }, [activeTab, selectedStaffOwner, visibleStaffItems]);

  const title = type === 'refund' ? '3년 환급 미팅 리스트'
              : type === 'simple' ? '간편 청구 관리 리스트'
              : '미팅 리스트 (전체)';

  const description = type === 'refund' ? '환급 분석 후 잡힌 세일즈 미팅'
                    : type === 'simple' ? '기존 고객 관리 및 추가 제안 미팅'
                    : '담당자에게 배정된 3년 환급 및 간편 청구 미팅 전체';

  if (selectedItem) {
    return <MeetingExecutionDetail item={selectedItem} onBack={() => setSelectedItem(null)} onNavigate={onNavigate} type={type} />;
  }

  if (selectedStaffOwner) {
    return (
      <MeetingExecutionStaffDetailPage
        ownerName={selectedStaffOwner}
        items={staffDetailItems}
        steps={MEETING_DETAIL_STEPS}
        detailColumns={MEETING_DETAIL_COLUMNS}
        title={title}
        description={description}
        onBack={() => setSelectedStaffOwner(null)}
        onSelectItem={setSelectedItem}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="font-bold text-[#1e293b]">{title}</h2>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
        <ListPeriodControls
          preset={periodPreset}
          range={periodRange}
          onPresetChange={setPeriodPreset}
          onStartDateChange={setCustomPeriodStartDate}
          onEndDateChange={setCustomPeriodEndDate}
        />
      </div>

      <div className="border-b border-slate-200 bg-white px-6 py-3">
        <div className="inline-flex rounded-full bg-slate-100 p-1">
          {[
            { key: 'list', label: '건별 목록' },
            { key: 'staff', label: '직원 현황' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as 'list' | 'staff')}
              className={clsx(
                'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                activeTab === tab.key ? 'bg-white text-[#1e293b] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === 'staff' ? (
          <div className="p-6">
            <EmployeeStepMatrixOverview
              items={visibleStaffItems}
              steps={MEETING_STEPS}
              emptyMessage="기간 내 확인할 미팅 담당자 데이터가 없습니다."
              onSelectOwner={setSelectedStaffOwner}
            />
          </div>
        ) : displayData.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Calendar size={48} className="mb-4 opacity-20" />
              <p>해당하는 미팅 일정이 없습니다.</p>
           </div>
        ) : (
           <table className="w-full text-sm text-left">
             <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 sticky top-0">
               <tr>
                 <th className="px-6 py-3 font-medium">배정 ID</th>
                 <th className="px-6 py-3 font-medium">고객명</th>
                 <th className="px-6 py-3 font-medium">유형</th>
                 <th className="px-6 py-3 font-medium">일시</th>
                 <th className="px-6 py-3 font-medium">장소</th>
                 <th className="px-6 py-3 font-medium">담당자</th>
                 <th className="px-6 py-3 font-medium">상태</th>
                 <th className="px-6 py-3 font-medium text-right">처리</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {displayData.map((item) => (
                 <tr
                   key={item.id}
                   className="hover:bg-slate-50 transition-colors cursor-pointer group"
                   onClick={() => setSelectedItem(item)}
                 >
                   <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">{item.id}</td>
                   <td className="px-6 py-4 font-bold text-[#1e293b]">{item.customer}</td>
                   <td className="px-6 py-4">
                      <span className={clsx(
                         "px-2 py-0.5 rounded text-[10px] font-bold border",
                         item.category === 'refund' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                         "bg-emerald-50 text-emerald-700 border-emerald-100"
                      )}>
                         {item.type}
                      </span>
                   </td>
                   <td className="px-6 py-4 text-slate-600">{item.date}</td>
                   <td className="px-6 py-4 text-slate-600 text-xs truncate max-w-[150px]">{item.location}</td>
                   <td className="px-6 py-4">{item.manager}</td>
                   <td className="px-6 py-4">
                     <span className={clsx(
                        "inline-flex px-2 py-0.5 rounded border text-xs font-bold items-center gap-1",
                        item.statusGroup === 'WON' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                        item.statusGroup === 'LOST' ? "bg-rose-50 text-rose-700 border-rose-100" :
                        item.statusGroup === 'PENDING' ? "bg-slate-50 text-slate-600 border-slate-100" :
                        "bg-blue-50 text-blue-700 border-blue-100"
                     )}>
                       {item.status}
                     </span>
                   </td>
                   <td className="px-6 py-4 text-right">
                     <button
                        onClick={(e) => {
                           e.stopPropagation();
                           setSelectedItem(item);
                        }}
                        className="text-white bg-[#1e293b] px-3 py-1.5 rounded text-xs hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
                     >
                        결과 입력
                     </button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        )}
      </div>
    </div>
  );
}

function MeetingExecutionStaffDetailPage({
  ownerName,
  items,
  steps,
  detailColumns,
  title,
  description,
  onBack,
  onSelectItem,
}: {
  ownerName: string;
  items: EmployeeStepMatrixItem<any>[];
  steps: readonly { key: string; label: string; shortLabel: string }[];
  detailColumns?: EmployeeStepOwnerDetailColumn<any>[];
  title: string;
  description: string;
  onBack: () => void;
  onSelectItem: (item: any) => void;
}) {
  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="font-bold text-[#1e293b]">{title}</h2>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          직원 현황으로
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <EmployeeStepOwnerDetail
          ownerName={ownerName}
          items={items}
          steps={steps as any}
          detailColumns={detailColumns}
          stageColumnLabel="미팅 단계"
          summaryColumnLabel="미팅 메모"
          dateColumnLabel="일시"
          emptyMessage="기간 내 확인할 미팅 담당자 데이터가 없습니다."
          onSelectItem={onSelectItem}
        />
      </div>
    </div>
  );
}

function MeetingExecutionDetail({ item, onBack, onNavigate, type }: { item: any, onBack: () => void, onNavigate: (tab: string) => void, type?: 'refund' | 'simple' }) {
   // Refs for scrolling to top
   const centerPanelRef = useRef<HTMLDivElement>(null);
   const leftPanelRef = useRef<HTMLDivElement>(null);
   const { journey, ensureJourney, saveMeetingDraft, applyMeetingStatus, updateIntegrationTask, appendAudit } = useJourney(item.requestId);

   // Meeting Action State (Lifecycle)
   const [selectedGroup, setSelectedGroup] = useState<StatusGroup>('PENDING');
   const [selectedDetail, setSelectedDetail] = useState<string>('');
   const [selectedSubDetail, setSelectedSubDetail] = useState<string>('');
   const [contractData, setContractData] = useState<ContractData[]>([]);
   const [editingContractIndex, setEditingContractIndex] = useState<number | null>(null);
   const [guardModalOpen, setGuardModalOpen] = useState(false);
   const [contractCompletedPromptOpen, setContractCompletedPromptOpen] = useState(false);
   const [guardItems, setGuardItems] = useState<RequirementAlert[]>([]);
   const [guardIndex, setGuardIndex] = useState(0);
   const [missingModalOpen, setMissingModalOpen] = useState(false);
   const [highlightSection, setHighlightSection] = useState<string | null>(null);
   const [expandedStep, setExpandedStep] = useState<MeetingStepNumber | null>(1);
   const [statusSectionOpen, setStatusSectionOpen] = useState(false);

   const [isContractModalOpen, setIsContractModalOpen] = useState(false);
   const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);
   const esignAutoCompleteTimerRef = useRef<number | null>(null);
   const [centerTab, setCenterTab] = useState<CenterTab>('customer');
   const preCallRef = useRef<HTMLDivElement>(null);
   const analysisRef = useRef<HTMLDivElement>(null);
   const scriptRef = useRef<HTMLDivElement>(null);
   const esignRef = useRef<HTMLDivElement>(null);
   const meetingCompleteRef = useRef<HTMLDivElement>(null);
   const claimHandoffRef = useRef<HTMLDivElement>(null);
   const statusRef = useRef<HTMLDivElement>(null);
   const [companionInput, setCompanionInput] = useState('');
   const [addressDetail, setAddressDetail] = useState('');

   // 카카오 주소 검색 (다음 우편번호 서비스)
   const openAddressSearch = useCallback(() => {
      const script = document.createElement('script');
      script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      script.onload = () => {
         new (window as any).daum.Postcode({
            oncomplete: (data: any) => {
               const addr = data.roadAddress || data.jibunAddress;
               updateMeetingWorkflow('meetingLocation', addr);
               setAddressDetail('');
            },
         }).open();
      };
      // 이미 로드되었다면 바로 실행
      if ((window as any).daum?.Postcode) {
         new (window as any).daum.Postcode({
            oncomplete: (data: any) => {
               const addr = data.roadAddress || data.jibunAddress;
               updateMeetingWorkflow('meetingLocation', addr);
               setAddressDetail('');
            },
         }).open();
      } else {
         document.head.appendChild(script);
      }
   }, []);

   // Step 1: 유선콜 확인
   const [preCallDone, setPreCallDone] = useState(false);
   const [preCallNote, setPreCallNote] = useState('');
   const [meetingWorkflow, setMeetingWorkflow] = useState({
      meetingTime: '',
      meetingLocation: '',
      meetingConfirmed: false,
      companions: [] as string[],
      authCodeReceived: false,
      insuranceSystemRegistered: false,
      statusInputDone: false,
      dbCategory: '' as DbCategory,
      meetingCallFormDone: false,
      designRequested: false,
      preMeetingDocReminderDone: false,
      preMeetingStrategyDone: false,
      preMeetingTomorrowNoticeSent: false,
      preMeetingReferralPushSent: false,
      preMeetingCancellationNoticeSent: false,
      onSiteEasyPaperDone: false,
      onSiteAppLinked: false,
      onSitePolicyCollected: false,
      onSitePaymentStatementCollected: false,
      onSiteInstitutionLinked: false,
      onSiteClaimAgreementDone: false,
      onSiteReferralPrompted: false,
      preCallScheduledAt: '',
      preCallLocationConfirmed: false,
      companionGuideDone: false,
      analysisAgenda: '',
      scriptReady: false,
      hiraSummary: '',
      attendeeConfirmed: false,
      meetingPurposeChecked: false,
      coverageSummary: '',
      customerUnderstandingNote: '',
      designReviewNote: '',
      redesignAction: '',
      contractExpectedPaymentDate: '',
      contractOwner: '',
      claimHandoffMemo: '',
      claimTransferRequested: false,
      claimTransferReason: '',
      claimTransferAt: '',
      followupDate: '',
      followupLocation: '',
      followupPurpose: '',
      arrivalChecked: false,
      callAttemptLog: '',
      alternativeProposal: '',
      withdrawalAt: '',
      postMeetingNote: '',
      referralAsked: false,
   });

   // Step 3: 미팅 시작
   const [meetingStarted, setMeetingStarted] = useState(false);
   const [recordingStarted, setRecordingStarted] = useState(false);
   const [ssnVerified, setSsnVerified] = useState(false);

   // Step 5: 보완 설계
   const [designReviewStatus, setDesignReviewStatus] = useState<'pending' | 'reviewing' | 'approved' | 'rejected'>('pending');

   // Step 6: 외부시스템 연동 상태
   const [integrationStates, setIntegrationStates] = useState({
      gloSignRequested: false,
      gloSignSigned: false,
      easyPaperRequested: false,
      claimAgreementRequested: false,
   });

   const [meetingAdminState, setMeetingAdminState] = useState({
      threeDocSubmitted: false,
      memberSignupCompleted: false,
      hometaxLinked: false,
      hiraLinked: false,
      nhisLinked: false,
      c4uLinked: false,
      referralCount: 0,
   });
   const [referralContacts, setReferralContacts] = useState<MeetingReferralContact[]>([]);

   const buildFallbackJourney = useCallback((): RequestJourney => ({
      requestId: item.requestId,
      customerName: item.customer,
      journeyType: item.category === 'refund' ? 'refund' : 'simple',
      owner: item.manager,
      stage: 'meeting',
      status: item.status,
      slaLabel: '-',
      nextDueAt: item.date,
      nextAction: '미팅 정보를 입력하세요.',
      currentStageStatus: {
         stageId: 'meeting',
         statusCode: resolveMeetingStatusCode(item.status) || 'meeting-confirmed',
         statusLabel: item.status,
         enteredAt: item.date,
         enteredBy: item.manager,
      },
      missingRequirements: [],
      documentRequirements: [],
      integrationTasks: [],
      auditTrail: [],
      consultationDraft: { ...DEFAULT_CONSULTATION_DRAFT },
      meetingDraft: {
         ...DEFAULT_MEETING_DRAFT,
         meetingTime: item.date || '',
         meetingLocation: item.location || '',
      },
   }), [item.category, item.customer, item.date, item.location, item.manager, item.requestId, item.status]);

   const ensureCurrentJourney = useCallback(() => {
      if (!journey) {
         ensureJourney(buildFallbackJourney());
      }
   }, [buildFallbackJourney, ensureJourney, journey]);

   useEffect(() => {
      ensureCurrentJourney();
   }, [ensureCurrentJourney]);

   useEffect(() => {
      if (centerPanelRef.current) centerPanelRef.current.scrollTop = 0;
      if (leftPanelRef.current) leftPanelRef.current.scrollTop = 0;
      setEditingContractIndex(null);
      if (esignAutoCompleteTimerRef.current) {
         window.clearTimeout(esignAutoCompleteTimerRef.current);
         esignAutoCompleteTimerRef.current = null;
      }
   }, [item.id]);

   useEffect(() => {
      return () => {
         if (esignAutoCompleteTimerRef.current) {
            window.clearTimeout(esignAutoCompleteTimerRef.current);
         }
      };
   }, []);

   useEffect(() => {
      let mappedGroup = item.statusGroup;
      if (mappedGroup === 'SCHEDULED') mappedGroup = 'PENDING';

      const legacyDetail = toSelectableMeetingStatus(item.status);
      const legacySubDetail =
         item.status === '2차 미팅'
            ? '2차 미팅 예정'
            : '';
      const isLegacyClaimTransfer = item.status === '청구 인계';
      const draft = journey?.meetingDraft;
      const resolvedGroup = (draft?.selectedGroup as StatusGroup) || (mappedGroup as StatusGroup) || 'PENDING';
      const claimHandoffItems = buildClaimHandoffItems(item, draft);
      const integrationItems = buildIntegrationItems(item, draft, Boolean(journey));

      setSelectedGroup(resolvedGroup);
      setSelectedDetail(toSelectableMeetingStatus(draft?.selectedDetail) || legacyDetail || '');
      setSelectedSubDetail(draft?.selectedSubDetail || legacySubDetail || '');
      setPreCallDone(!!draft?.preCallDone);
      setPreCallNote(draft?.preCallNote || '');
      setContractData(draft?.contractData || []);
      setMeetingWorkflow({
         meetingTime: draft?.meetingTime || draft?.preCallScheduledAt || item.date || '',
         meetingLocation: draft?.meetingLocation || item.location || '',
         meetingConfirmed: !!draft?.meetingConfirmed,
         companions: draft?.companions || [],
         authCodeReceived: !!draft?.authCodeReceived,
         insuranceSystemRegistered: !!draft?.insuranceSystemRegistered,
         statusInputDone: !!draft?.statusInputDone,
         dbCategory: draft?.dbCategory || '',
         meetingCallFormDone: !!draft?.meetingCallFormDone,
         designRequested: !!draft?.designRequested,
         preMeetingDocReminderDone: !!draft?.preMeetingDocReminderDone,
         preMeetingStrategyDone: !!draft?.preMeetingStrategyDone,
         preMeetingTomorrowNoticeSent: !!draft?.preMeetingTomorrowNoticeSent,
         preMeetingReferralPushSent: !!draft?.preMeetingReferralPushSent,
         preMeetingCancellationNoticeSent: !!draft?.preMeetingCancellationNoticeSent,
         onSiteEasyPaperDone: !!draft?.onSiteEasyPaperDone,
         onSiteAppLinked: !!draft?.onSiteAppLinked,
         onSitePolicyCollected: !!draft?.onSitePolicyCollected,
         onSitePaymentStatementCollected: !!draft?.onSitePaymentStatementCollected,
         onSiteInstitutionLinked: !!draft?.onSiteInstitutionLinked,
         onSiteClaimAgreementDone: !!draft?.onSiteClaimAgreementDone,
         onSiteReferralPrompted: !!draft?.onSiteReferralPrompted,
         preCallScheduledAt: draft?.preCallScheduledAt || item.date || '',
         preCallLocationConfirmed: !!draft?.preCallLocationConfirmed,
         companionGuideDone: !!draft?.companionGuideDone,
         analysisAgenda: draft?.analysisAgenda || '',
         scriptReady: !!draft?.scriptReady,
         hiraSummary: draft?.hiraSummary || '',
         attendeeConfirmed: !!draft?.attendeeConfirmed,
         meetingPurposeChecked: !!draft?.meetingPurposeChecked,
         coverageSummary: draft?.coverageSummary || '',
         customerUnderstandingNote: draft?.customerUnderstandingNote || '',
         designReviewNote: draft?.designReviewNote || '',
         redesignAction: draft?.redesignAction || '',
         contractExpectedPaymentDate: draft?.contractExpectedPaymentDate || '',
         contractOwner: draft?.contractOwner || item.manager || '',
         claimHandoffMemo: draft?.claimHandoffMemo || '',
         claimTransferRequested: draft?.claimTransferRequested ?? isLegacyClaimTransfer,
         claimTransferReason: draft?.claimTransferReason || (isLegacyClaimTransfer ? '기존 청구 인계 상태에서 전환' : ''),
         claimTransferAt: draft?.claimTransferAt || (isLegacyClaimTransfer ? new Date().toISOString().slice(0, 16).replace('T', ' ') : ''),
         followupDate: draft?.followupDate || '',
         followupLocation: draft?.followupLocation || '',
         followupPurpose: draft?.followupPurpose || '',
         arrivalChecked: !!draft?.arrivalChecked,
         callAttemptLog: draft?.callAttemptLog || '',
         alternativeProposal: draft?.alternativeProposal || '',
         withdrawalAt: draft?.withdrawalAt || '',
         postMeetingNote: draft?.postMeetingNote || '',
         referralAsked: !!draft?.referralAsked,
      });
      setUploadedFileName(draft?.analysisFileUploaded ? uploadedFileName || 'meeting-analysis.pdf' : null);
      setMeetingStarted(!!draft?.meetingStarted);
      setRecordingStarted(!!draft?.recordingStarted);
      setSsnVerified(!!draft?.ssnVerified);
      setDesignReviewStatus(draft?.designReviewStatus || 'pending');
      setIntegrationStates({
         gloSignRequested: !!draft?.gloSignRequested,
         gloSignSigned: !!draft?.gloSignSigned,
         easyPaperRequested: !!draft?.easyPaperRequested,
         claimAgreementRequested: !!draft?.claimAgreementRequested,
      });
      setMeetingAdminState({
         threeDocSubmitted: claimHandoffItems.find((entry) => entry.label === '3종 서류')?.active ?? false,
         memberSignupCompleted: integrationItems.find((entry) => entry.label === '회원가입')?.active ?? false,
         hometaxLinked: integrationItems.find((entry) => entry.label === '홈택스')?.active ?? false,
         hiraLinked: integrationItems.find((entry) => entry.label === '심평원')?.active ?? false,
         nhisLinked: integrationItems.find((entry) => entry.label === '건보')?.active ?? false,
         c4uLinked: integrationItems.find((entry) => entry.label === 'C4U')?.active ?? false,
         referralCount: buildReferralCount(item, draft),
      });
      setReferralContacts(draft?.referralContacts || []);
      setCenterTab('customer');
      setCompanionInput('');
   }, [item.date, item.location, item.manager, item.status, item.statusGroup, journey]);

   const updateMeetingWorkflow = useCallback(
      <K extends keyof typeof meetingWorkflow>(key: K, value: (typeof meetingWorkflow)[K]) => {
         setMeetingWorkflow((current) => ({ ...current, [key]: value }));
      },
      [],
   );

   const updateMeetingAdminState = useCallback(
      <K extends keyof typeof meetingAdminState>(key: K, value: (typeof meetingAdminState)[K]) => {
         setMeetingAdminState((current) => ({ ...current, [key]: value }));
      },
      [],
   );

   const syncReferralCount = useCallback((contacts: MeetingReferralContact[]) => {
      setMeetingAdminState((current) => ({
         ...current,
         referralCount: getReferralContactCount(contacts),
      }));
   }, []);

   const handleAddReferralContact = useCallback(() => {
      setReferralContacts((current) => {
         const next = [...current, createEmptyReferralContact()];
         syncReferralCount(next);
         return next;
      });
      updateMeetingWorkflow('referralAsked', true);
      updateMeetingWorkflow('onSiteReferralPrompted', true);
   }, [syncReferralCount, updateMeetingWorkflow]);

   const handleReferralContactChange = useCallback(
      (id: string, key: keyof Omit<MeetingReferralContact, 'id'>, value: string) => {
         setReferralContacts((current) => {
            const next = current.map((contact) =>
               contact.id === id ? { ...contact, [key]: value } : contact,
            );
            syncReferralCount(next);
            return next;
         });
      },
      [syncReferralCount],
   );

   const handleDeleteReferralContact = useCallback(
      (id: string) => {
         setReferralContacts((current) => {
            const next = current.filter((contact) => contact.id !== id);
            syncReferralCount(next);
            return next;
         });
      },
      [syncReferralCount],
   );

   const getMeetingDraft = useCallback((): MeetingDraft => ({
      selectedGroup,
      selectedDetail,
      selectedSubDetail,
      meetingTime: meetingWorkflow.meetingTime,
      meetingLocation: meetingWorkflow.meetingLocation,
      meetingConfirmed: meetingWorkflow.meetingConfirmed,
      companions: meetingWorkflow.companions,
      authCodeReceived: meetingWorkflow.authCodeReceived,
      insuranceSystemRegistered: meetingWorkflow.insuranceSystemRegistered,
      statusInputDone: meetingWorkflow.statusInputDone,
      dbCategory: meetingWorkflow.dbCategory,
      meetingCallFormDone: meetingWorkflow.meetingCallFormDone,
      designRequested: meetingWorkflow.designRequested,
      preMeetingDocReminderDone: meetingWorkflow.preMeetingDocReminderDone,
      preMeetingStrategyDone: meetingWorkflow.preMeetingStrategyDone,
      preMeetingTomorrowNoticeSent: meetingWorkflow.preMeetingTomorrowNoticeSent,
      preMeetingReferralPushSent: meetingWorkflow.preMeetingReferralPushSent,
      preMeetingCancellationNoticeSent: meetingWorkflow.preMeetingCancellationNoticeSent,
      onSiteEasyPaperDone: meetingWorkflow.onSiteEasyPaperDone,
      onSiteAppLinked: meetingWorkflow.onSiteAppLinked,
      onSitePolicyCollected: meetingWorkflow.onSitePolicyCollected,
      onSitePaymentStatementCollected: meetingWorkflow.onSitePaymentStatementCollected,
      onSiteInstitutionLinked: meetingAdminState.hometaxLinked || meetingAdminState.nhisLinked,
      onSiteClaimAgreementDone: meetingWorkflow.onSiteClaimAgreementDone,
      onSiteReferralPrompted: meetingWorkflow.onSiteReferralPrompted,
      preCallDone,
      preCallNote,
      preCallScheduledAt: meetingWorkflow.meetingTime,
      preCallLocationConfirmed: hasValue(meetingWorkflow.meetingLocation),
      companionGuideDone: meetingWorkflow.companions.length > 0,
      analysisFileUploaded: !!uploadedFileName,
      analysisAgenda: meetingWorkflow.analysisAgenda,
      scriptReady: meetingWorkflow.scriptReady,
      hiraSummary: meetingWorkflow.hiraSummary,
      meetingStarted,
      recordingStarted,
      ssnVerified,
      attendeeConfirmed: meetingWorkflow.attendeeConfirmed,
      meetingPurposeChecked: meetingWorkflow.meetingPurposeChecked,
      coverageSummary: meetingWorkflow.coverageSummary,
      customerUnderstandingNote: meetingWorkflow.customerUnderstandingNote,
      designReviewStatus,
      designReviewNote: meetingWorkflow.designReviewNote,
      redesignAction: meetingWorkflow.redesignAction,
      contractData,
      contractDataCount: contractData.length,
      contractExpectedPaymentDate: meetingWorkflow.contractExpectedPaymentDate,
      contractOwner: meetingWorkflow.contractOwner,
      claimHandoffMemo: meetingWorkflow.claimHandoffMemo,
      claimTransferRequested: meetingWorkflow.claimTransferRequested,
      claimTransferReason: meetingWorkflow.claimTransferReason,
      claimTransferAt: meetingWorkflow.claimTransferAt,
      followupDate: meetingWorkflow.followupDate,
      followupLocation: meetingWorkflow.followupLocation,
      followupPurpose: meetingWorkflow.followupPurpose,
      arrivalChecked: meetingWorkflow.arrivalChecked,
      callAttemptLog: meetingWorkflow.callAttemptLog,
      alternativeProposal: meetingWorkflow.alternativeProposal,
      withdrawalAt: meetingWorkflow.withdrawalAt,
      postMeetingNote: meetingWorkflow.postMeetingNote,
      referralAsked: meetingWorkflow.referralAsked,
      memberSignupCompleted: meetingAdminState.memberSignupCompleted,
      hometaxLinked: meetingAdminState.hometaxLinked,
      hiraLinked: meetingAdminState.hiraLinked,
      nhisLinked: meetingAdminState.nhisLinked,
      c4uLinked: meetingAdminState.c4uLinked,
      referralCount: getReferralContactCount(referralContacts),
      referralContacts,
      cxActionsCount: [
         meetingAdminState.memberSignupCompleted,
         meetingWorkflow.onSiteAppLinked,
         meetingAdminState.hometaxLinked,
         meetingAdminState.hiraLinked,
         meetingAdminState.nhisLinked,
         meetingAdminState.c4uLinked,
         meetingAdminState.threeDocSubmitted,
         meetingWorkflow.onSitePolicyCollected,
         meetingWorkflow.onSitePaymentStatementCollected,
         meetingWorkflow.onSiteReferralPrompted,
         getReferralContactCount(referralContacts) > 0,
      ].filter(Boolean).length,
      gloSignRequested: integrationStates.gloSignRequested,
      gloSignSigned: integrationStates.gloSignSigned,
      easyPaperRequested: integrationStates.easyPaperRequested,
      claimAgreementRequested: meetingAdminState.c4uLinked,
      postResultReported: hasValue(meetingWorkflow.postMeetingNote),
      postStatusChanged: isFinalMeetingResultSelected(selectedDetail),
      postContractInfoSaved: contractData.length > 0,
      postThreeDocSubmitted: meetingAdminState.threeDocSubmitted,
   }), [
      contractData,
      designReviewStatus,
      integrationStates,
      meetingAdminState,
      meetingStarted,
      meetingWorkflow,
      preCallDone,
      preCallNote,
      referralContacts,
      recordingStarted,
      selectedDetail,
      selectedGroup,
      selectedSubDetail,
      ssnVerified,
      uploadedFileName,
   ]);

   const getJourneyComputation = useCallback(() => {
      if (!journey) return { missingRequirements: [], nextAction: '요청건을 불러오지 못했습니다.' };
      return computeJourney({
         ...journey,
         meetingDraft: getMeetingDraft(),
      });
   }, [getMeetingDraft, journey]);

   const getMeetingGuardState = useCallback(() => {
      const draft = getMeetingDraft();
      const journeyPreview = getJourneyComputation();
      const orderedItems = sortRequirementAlerts(journeyPreview.missingRequirements);
      return getEffectiveBlocking({
         items: orderedItems,
         screen: 'meeting',
         targetStatus: draft.selectedDetail,
      });
   }, [getJourneyComputation, getMeetingDraft]);

   const syncMeetingIntegrations = useCallback((draft: MeetingDraft) => {
      const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
      updateIntegrationTask(item.requestId, 'script-review', {
         state: draft.recordingStarted && draft.scriptReady ? 'verified' : draft.recordingStarted || draft.scriptReady ? 'received' : 'requested',
         reviewedBy: draft.recordingStarted && draft.scriptReady ? '미팅팀' : undefined,
         verifiedAt: draft.recordingStarted && draft.scriptReady ? now : undefined,
      }, '미팅팀');

      const sharedDocs = journey?.documentRequirements || [];
      const gloDocs = sharedDocs.filter((doc) => doc.source === 'gloSign');
      const easyDocs = sharedDocs.filter((doc) => doc.source === 'easyPaper');
      const allVerified = (states: string[]) => states.length > 0 && states.every((state) => state === 'verified' || state === 'waived');
      const someProgress = (states: string[]) => states.some((state) => state === 'sent' || state === 'received' || state === 'verified' || state === 'waived');

      if (gloDocs.length > 0) {
         const states = gloDocs.map((doc) => doc.verificationState);
         updateIntegrationTask(item.requestId, 'glo-sign-sync', {
            state: allVerified(states) ? 'verified' : someProgress(states) ? 'received' : 'requested',
            verifiedAt: allVerified(states) ? now : undefined,
         }, '문서허브');
      }

      if (easyDocs.length > 0) {
         const states = easyDocs.map((doc) => doc.verificationState);
         updateIntegrationTask(item.requestId, 'easy-paper-sync', {
            state: allVerified(states) ? 'verified' : someProgress(states) ? 'received' : 'requested',
            verifiedAt: allVerified(states) ? now : undefined,
         }, '문서허브');
      }

      updateIntegrationTask(item.requestId, 'claim-handoff', {
         state: draft.claimTransferRequested ? 'verified' : hasValue(draft.claimTransferReason) ? 'received' : 'idle',
         verifiedAt: draft.claimTransferRequested ? (draft.claimTransferAt || now) : undefined,
      }, '미팅팀');
   }, [item.requestId, journey?.documentRequirements, updateIntegrationTask]);

   const persistMeetingDraft = useCallback((draft: MeetingDraft) => {
      ensureCurrentJourney();
      saveMeetingDraft(item.requestId, draft, '미팅팀');
      syncMeetingIntegrations(draft);
   }, [ensureCurrentJourney, item.requestId, saveMeetingDraft, syncMeetingIntegrations]);

   const buildMeetingStageStatus = useCallback((draft: MeetingDraft): StageStatus => {
      const closedStatuses = new Set([
         'contract-completed',
         'contract-failed',
         'on-site-impossible',
         'meeting-cancelled',
         'no-show',
         'uw-rejected',
         'withdrawn',
      ]);
      const stageId = closedStatuses.has(draft.selectedDetail) ? 'closed' : 'meeting';

      return {
         stageId,
         statusCode: draft.selectedDetail || 'meeting-confirmed',
         statusLabel: MEETING_STATUS_LABELS[draft.selectedDetail] || '미팅 진행',
         enteredAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
         enteredBy: '미팅팀',
      };
   }, []);

   const handleMeetingDraftSave = useCallback(() => {
      const draft = getMeetingDraft();
      persistMeetingDraft(draft);
      toast.success('미팅 드래프트를 저장했습니다.');
   }, [getMeetingDraft, persistMeetingDraft]);

   const handleClaimTransferStart = useCallback(() => {
      const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const baseDraft = getMeetingDraft();
      const nextDraft: MeetingDraft = {
         ...baseDraft,
         claimTransferRequested: true,
         claimTransferReason: baseDraft.claimTransferReason.trim(),
         claimTransferAt: baseDraft.claimTransferAt || timestamp,
      };

      persistMeetingDraft(nextDraft);
      appendAudit(item.requestId, {
         id: `claim-${Date.now()}`,
         type: 'claim',
         actor: '미팅팀',
         message: nextDraft.claimTransferReason
            ? `청구 인계를 시작했습니다. 사유: ${nextDraft.claimTransferReason}`
            : '청구 인계를 시작했습니다.',
         tone: 'success',
         at: timestamp,
      });
      toast.success('청구 인계를 시작했습니다.');
   }, [appendAudit, getMeetingDraft, item.requestId, persistMeetingDraft]);

   const handleApplyMeetingStatus = useCallback(() => {
      const draft = getMeetingDraft();
      if (!isFinalMeetingResultSelected(draft.selectedDetail)) {
         toast.error('최종 결과 상태를 선택해야 합니다.');
         return;
      }

      const guard = getMeetingGuardState();
      if (guard.effectiveBlockingItems.length > 0) {
         setGuardItems(guard.effectiveBlockingItems);
         setGuardIndex(0);
         setGuardModalOpen(true);
         toast.error('필수 항목 누락으로 상태 변경을 진행할 수 없습니다.');
         return;
      }

      const journeyPreview = getJourneyComputation();
      const stageStatus = buildMeetingStageStatus(draft);
      ensureCurrentJourney();
      applyMeetingStatus(item.requestId, draft, stageStatus, journeyPreview.nextAction, '미팅팀');
      syncMeetingIntegrations(draft);
      setGuardModalOpen(false);
      toast.success(`미팅 상태를 '${stageStatus.statusLabel}'로 반영했습니다.`);
   }, [applyMeetingStatus, buildMeetingStageStatus, ensureCurrentJourney, getJourneyComputation, getMeetingDraft, getMeetingGuardState, item.requestId, syncMeetingIntegrations]);

   const meetingGuardSummary = useMemo(() => getMeetingGuardState(), [getMeetingGuardState]);
   const contractResultSummary = useMemo(() => getContractResultSummary(contractData), [contractData]);
   const isContractSectionEnabled = selectedDetail === 'contract-completed';
   const claimHandoffItems = useMemo(
      () => [
        { label: CLAIM_HANDOFF_LABELS[0], active: meetingAdminState.threeDocSubmitted },
         { label: CLAIM_HANDOFF_LABELS[1], active: meetingWorkflow.onSitePolicyCollected },
         { label: CLAIM_HANDOFF_LABELS[2], active: meetingWorkflow.onSitePaymentStatementCollected },
      ],
      [
         meetingAdminState.threeDocSubmitted,
         meetingWorkflow.onSitePaymentStatementCollected,
         meetingWorkflow.onSitePolicyCollected,
      ],
   );
   const integrationItems = useMemo(
      () => [
         { label: INTEGRATION_LABELS[0], active: meetingAdminState.memberSignupCompleted },
         { label: INTEGRATION_LABELS[1], active: meetingWorkflow.onSiteAppLinked },
         { label: INTEGRATION_LABELS[2], active: meetingAdminState.hometaxLinked },
         { label: INTEGRATION_LABELS[3], active: meetingAdminState.hiraLinked },
         { label: INTEGRATION_LABELS[4], active: meetingAdminState.nhisLinked },
         { label: INTEGRATION_LABELS[5], active: meetingAdminState.c4uLinked },
      ],
      [
         meetingAdminState.c4uLinked,
         meetingAdminState.hiraLinked,
         meetingAdminState.hometaxLinked,
         meetingAdminState.memberSignupCompleted,
         meetingAdminState.nhisLinked,
         meetingWorkflow.onSiteAppLinked,
      ],
   );
   const claimDocumentDoneCount = useMemo(
      () => claimHandoffItems.filter((item) => item.active).length,
      [claimHandoffItems],
   );
   const referralContactCount = useMemo(
      () => getReferralContactCount(referralContacts),
      [referralContacts],
   );
   const meetingCompleteSections = useMemo(
      () => [
         {
            key: 'report',
            label: '결과 보고',
            done: hasValue(meetingWorkflow.postMeetingNote),
            value: hasValue(meetingWorkflow.postMeetingNote) ? '요약 작성 완료' : '메모 필요',
         },
         {
           key: 'status',
            label: '최종 상태',
            done: isFinalMeetingResultSelected(selectedDetail),
            value: isFinalMeetingResultSelected(selectedDetail)
               ? `${MEETING_STATUS_LABELS[selectedDetail] || selectedDetail} 선택`
               : '최종 상태 선택 필요',
         },
         {
            key: 'contract',
            label: '계약 반영',
            done: !isContractSectionEnabled || contractData.length > 0,
            value:
               isContractSectionEnabled
                  ? contractResultSummary.label
                  : '대상 아님',
         },
         {
            key: 'claim',
            label: '청구 서류',
            done: !meetingWorkflow.claimTransferRequested || claimDocumentDoneCount === claimHandoffItems.length,
            value: meetingWorkflow.claimTransferRequested
               ? `${claimDocumentDoneCount}/${claimHandoffItems.length} 완료`
               : `${claimDocumentDoneCount}/${claimHandoffItems.length} 완료`,
         },
      ],
      [
         claimDocumentDoneCount,
         claimHandoffItems.length,
         contractData.length,
         contractResultSummary.label,
         isContractSectionEnabled,
         meetingWorkflow.claimTransferRequested,
         meetingWorkflow.postMeetingNote,
         selectedDetail,
      ],
   );

   const baseStepMissingByStep = useMemo<Record<MeetingStepNumber, string[]>>(
      () => ({
         1: [
            !hasValue(meetingWorkflow.meetingTime) ? '시간 입력' : '',
            !hasValue(meetingWorkflow.meetingLocation) ? '장소 입력' : '',
            !meetingWorkflow.meetingConfirmed ? '확정 여부 체크' : '',
         ].filter(Boolean),
         2: [
            !uploadedFileName ? '보험 분석 파일 업로드' : '',
         ].filter(Boolean),
         3: [
            !meetingWorkflow.scriptReady ? '스크립트 작성 완료 체크' : '',
         ].filter(Boolean),
         4: [
            !(integrationStates.gloSignRequested || integrationStates.gloSignSigned) ? '전자서명 발송 또는 서명완료' : '',
         ].filter(Boolean),
         5: [
            !hasValue(meetingWorkflow.postMeetingNote) ? '결과 메모 입력' : '',
            !isFinalMeetingResultSelected(selectedDetail) ? '최종 결과 상태 선택' : '',
            selectedDetail === 'contract-completed' && contractData.length === 0 ? '계약 정보 등록' : '',
            meetingWorkflow.claimTransferRequested && !meetingAdminState.threeDocSubmitted ? '3종 서류 확인' : '',
            meetingWorkflow.claimTransferRequested && !meetingWorkflow.onSitePolicyCollected ? '증권 확인' : '',
            meetingWorkflow.claimTransferRequested && !meetingWorkflow.onSitePaymentStatementCollected ? '지급내역서 확인' : '',
         ].filter(Boolean),
         6: [],
      }),
      [
         contractData.length,
         integrationStates.gloSignRequested,
         meetingAdminState.threeDocSubmitted,
         meetingWorkflow,
         selectedDetail,
         uploadedFileName,
      ],
   );

   const guardStepMissingByStep = useMemo<Record<MeetingStepNumber, string[]>>(() => {
      const base: Record<MeetingStepNumber, string[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
      meetingGuardSummary.effectiveBlockingItems.forEach((item) => {
         const section = resolveMeetingSection(item);
         const step = SECTION_STEP_MAP[section];
         const text = item.label || item.message;
         if (text) base[step].push(text);
      });
      return base;
   }, [meetingGuardSummary.effectiveBlockingItems]);

   const stepMissingByStep = useMemo<Record<MeetingStepNumber, string[]>>(() => {
      const steps = [1, 2, 3, 4, 5, 6] as MeetingStepNumber[];
      const merged = {} as Record<MeetingStepNumber, string[]>;
      steps.forEach((step) => {
         merged[step] = [...new Set([...(baseStepMissingByStep[step] || []), ...(guardStepMissingByStep[step] || [])])];
      });
      return merged;
   }, [baseStepMissingByStep, guardStepMissingByStep]);

   const getStepState = useCallback(
      (step: MeetingStepNumber): MeetingStepStateModel => {
         const ownMissingItems = stepMissingByStep[step] || [];
         if (step === 6) {
            return {
               step,
               title: STEP_TITLE_MAP[step],
               sectionId: STEP_SECTION_MAP[step],
               status: meetingWorkflow.claimTransferRequested ? 'done' : 'available',
               missingRequiredCount: 0,
               missingItems: [],
            };
         }

         return {
            step,
            title: STEP_TITLE_MAP[step],
            sectionId: STEP_SECTION_MAP[step],
            status: ownMissingItems.length === 0 ? 'done' : 'available',
            missingRequiredCount: ownMissingItems.length,
            missingItems: ownMissingItems,
         };
      },
      [stepMissingByStep],
   );

   const stepStates = useMemo<MeetingStepStateModel[]>(() => {
      const steps = [1, 2, 3, 4, 5, 6] as MeetingStepNumber[];
      const states = steps.map((step) => getStepState(step));

      const firstActionableIndex = states.findIndex((item) => item.status === 'available' && item.missingRequiredCount > 0);
      if (firstActionableIndex >= 0) {
         states[firstActionableIndex] = { ...states[firstActionableIndex], status: 'attention' };
      }
      return states;
   }, [getStepState]);

   const stepStateMap = useMemo(() => {
      return stepStates.reduce<Record<MeetingStepNumber, MeetingStepStateModel>>((acc, item) => {
         acc[item.step] = item;
         return acc;
      }, {} as Record<MeetingStepNumber, MeetingStepStateModel>);
   }, [stepStates]);

   const completedStepCount = stepStates.filter((item) => item.status === 'done').length;
   const panelMissingCount = stepStates.reduce((count, item) => count + (item.status === 'done' ? 0 : item.missingRequiredCount), 0);
   const panelMissingItems = useMemo(
      () =>
         stepStates.flatMap((state) =>
            state.missingItems.map((message) => ({
               step: state.step,
               title: state.title,
               message,
            })),
         ),
      [stepStates],
   );

   const handleContractSubmit = (data: ContractData) => {
      const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const editingContract = editingContractIndex !== null ? contractData[editingContractIndex] : undefined;
      const normalizedContractData: ContractData = {
         ...data,
         id: data.id || editingContract?.id || `contract-${Date.now()}`,
         entryMethod: data.entryMethod || 'manual',
         sourceCarrier: data.sourceCarrier || data.insurer,
         sourceFormat: data.sourceFormat || (data.entryMethod === 'pasted' ? 'generic' : 'manual'),
         parseStatus: data.parseStatus || (data.entryMethod === 'pasted' ? 'partial' : 'manual'),
         parseWarnings: data.parseWarnings || [],
         registeredAt: data.registeredAt || editingContract?.registeredAt || timestamp,
      };
      const nextContractData =
         editingContractIndex !== null
            ? contractData.map((contract, index) => (index === editingContractIndex ? normalizedContractData : contract))
            : [...contractData, normalizedContractData];
      const shouldMarkContractCompleted = selectedGroup !== 'WON' || selectedDetail !== 'contract-completed';

      setContractData(nextContractData);

      if (shouldMarkContractCompleted) {
         setSelectedGroup('WON');
         setSelectedDetail('contract-completed');
      }

      persistMeetingDraft({
         ...getMeetingDraft(),
         selectedGroup: shouldMarkContractCompleted ? 'WON' : selectedGroup,
         selectedDetail: shouldMarkContractCompleted ? 'contract-completed' : selectedDetail,
         contractData: nextContractData,
         contractDataCount: nextContractData.length,
      });

      if (shouldMarkContractCompleted) {
         toast.success(
            <div className="flex flex-col gap-1">
               <span className="font-bold">계약 정보가 등록되었습니다!</span>
               <span className="text-xs opacity-90">미팅 상태가 '계약 완료(청약 완료)'로 자동 변경되었습니다.</span>
            </div>,
            { duration: 4000 }
         );
      }
   };

   const handleEditContract = (contract: ContractData, index: number) => {
      setEditingContractIndex(index);
      setIsContractModalOpen(true);
   };

   const handleDeleteContract = (index: number) => {
      const nextContractData = contractData.filter((_, i) => i !== index);
      setContractData(nextContractData);
      persistMeetingDraft({
         ...getMeetingDraft(),
         contractData: nextContractData,
         contractDataCount: nextContractData.length,
      });
      toast.info('계약 정보가 삭제되었습니다.');
   };

   const handleAddContract = () => {
      setEditingContractIndex(null);
      setIsContractModalOpen(true);
   };

   const requiresSubReason = selectedGroup && selectedDetail
      ? MEETING_LIFECYCLE[selectedGroup]?.options.find(o => o.value === selectedDetail)?.requiresSubReason
      : false;

   const subReasons = requiresSubReason ? SUB_REASON_OPTIONS[selectedDetail] || [] : [];
   const showFollowupSubtypeSelector = selectedDetail === 'followup-in-progress';

   // Mock Data State for Consultation Info
   const [insuranceType] = useState('실손+종합');
   const [monthlyPremium] = useState('25');
   const [paymentStatus] = useState('정상');
   const [contractor] = useState('본인/본인');
   const [joinPath] = useState('관계 없음');
   const [trafficAccident] = useState('없음');
   const [surgery] = useState('있음');
   const [surgeryOptions] = useState<string[]>([]);
   const [surgeryDetail] = useState('2023년 5월 내시경 검사 중 위 용종 제거 시술');
   const [criticalDisease] = useState('없음');
   const [criticalOptions] = useState<string[]>([]);
   const [criticalDiseaseDetail] = useState('');
   const [medication] = useState('없음');
   const [companion] = useState('없음');
   const [insuranceStatus] = useState('있음');
   const [disposition] = useState<string>('중립');
   const [trustLevel] = useState<string>('보통');
   const [bestTime] = useState<string>('무관');
   const [decisionMaker, setDecisionMaker] = useState<string>('본인');
   const [traitNote] = useState<string>('상담 시 목소리가 작으시고, 꼼꼼하게 질문하시는 편입니다.');
   const [attachments] = useState<FileAttachment[]>([
      { id: '1', name: '가족관계증명서.pdf', size: 1024 * 450, type: 'application/pdf', progress: 100, status: 'completed' },
      { id: '2', name: '보험증권_메리츠.jpg', size: 1024 * 2500, type: 'image/jpeg', progress: 100, status: 'completed' }
   ]);

   const customer = MOCK_DATA.customers.find(c => c.id === item.customerId);

   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         setUploadedFileName(file.name);
         toast.success('보상분석 파일이 업로드되었습니다.');
      }
   };

   const scrollToGuardSection = useCallback((ref: React.RefObject<HTMLDivElement>, sectionId: string) => {
      if (!ref.current) return;
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      ref.current.setAttribute('tabindex', '-1');
      ref.current.focus({ preventScroll: true });
      setHighlightSection(sectionId);
      setTimeout(() => setHighlightSection(null), 2000);
   }, []);

   const openMeetingSection = useCallback((sectionId: MeetingSectionId) => {
      if (sectionId === 'status') {
         scrollToGuardSection(statusRef, sectionId);
         return;
      }
      if (sectionId === 'claimHandoff') {
         scrollToGuardSection(claimHandoffRef, sectionId);
         return;
      }

      setCenterTab(SECTION_TAB_MAP[sectionId]);
      const anchorId = SECTION_ANCHOR_ID_MAP[sectionId];
      window.setTimeout(() => {
         const el = document.getElementById(anchorId);
         if (!el) return;
         el.scrollIntoView({ behavior: 'smooth', block: 'start' });
         setHighlightSection(sectionId);
         window.setTimeout(() => setHighlightSection(null), 2000);
      }, 80);
   }, [scrollToGuardSection]);

   const jumpToMeetingGuardItem = useCallback((index: number) => {
      if (!guardItems.length) return;
      const safeIndex = Math.min(Math.max(index, 0), guardItems.length - 1);
      const targetAlert = guardItems[safeIndex];
      setGuardIndex(safeIndex);
      const sectionId = resolveMeetingSection(targetAlert);
      openMeetingSection(sectionId);
      toast.error('필수 항목을 완료해야 상태를 반영할 수 있습니다.');
   }, [guardItems, openMeetingSection]);

   const handleGuardPrev = useCallback(() => {
      if (!guardItems.length) return;
      const nextIndex = (guardIndex - 1 + guardItems.length) % guardItems.length;
      jumpToMeetingGuardItem(nextIndex);
   }, [guardIndex, guardItems, jumpToMeetingGuardItem]);

   const handleGuardNext = useCallback(() => {
      if (!guardItems.length) return;
      const nextIndex = (guardIndex + 1) % guardItems.length;
      jumpToMeetingGuardItem(nextIndex);
   }, [guardIndex, guardItems, jumpToMeetingGuardItem]);

   const history = journey?.auditTrail.length
      ? journey.auditTrail.slice(0, 6).map((event) => ({
           date: event.at,
           title: event.actor,
           desc: event.message,
        }))
      : [
           { date: '2026-01-20 13:00', title: '출발 확인', desc: '고객에게 출발 문자 발송함' },
           { date: '2026-01-16 14:00', title: '미팅 배정', desc: '2차 상담 완료 후 배정 (담당자: 최미팅)' },
           { date: '2026-01-16 10:20', title: '1차 상담', desc: '통화 완료' },
        ];

   const StepItem = ({ step, title, icon, iconColor, children }: {
      step: MeetingStepNumber;
      title: string;
      icon: React.ReactNode;
      iconColor: string;
      children: React.ReactNode;
   }) => {
      const stepState = stepStateMap[step];
      const isDone = stepState.status === 'done';
      const isOpen = expandedStep === step;

      return (
         <div className={clsx(
            "bg-white rounded-lg border overflow-hidden transition-all",
            isOpen ? "border-slate-300 shadow-sm" : "border-slate-200"
         )}>
            <button
               type="button"
               onClick={() => setExpandedStep(isOpen ? null : step)}
               className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
               <div className="flex min-w-0 items-center gap-2">
                  <div className={clsx(
                     "size-6 rounded-full flex items-center justify-center border transition-colors shrink-0",
                     isDone
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "bg-white text-slate-300 border-slate-300",
                  )}>
                     {isDone ? <Check size={11} /> : <div className="size-2 rounded-full bg-slate-300" />}
                  </div>
                  <div className={clsx("shrink-0", iconColor)}>{icon}</div>
                  <span className="text-[12px] font-bold truncate text-slate-800">{title}</span>
               </div>
               <div className="flex items-center gap-1.5 shrink-0">
                  {isOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
               </div>
            </button>
            {isOpen && (
               <div className="px-3 pb-3 border-t border-slate-100 pt-2">{children}</div>
            )}
         </div>
      );
   };

   const renderStatusSection = () => (
      <div
         id="tab-status"
         ref={statusRef}
         className={clsx(
            "rounded-lg border bg-white overflow-hidden transition-all",
            highlightSection === 'status' ? "ring-2 ring-rose-400 ring-offset-2 ring-offset-white border-slate-300" : "border-slate-200"
         )}
      >
         <button
            type="button"
            onClick={() => setStatusSectionOpen(!statusSectionOpen)}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors"
         >
            <div className="flex items-center gap-2 min-w-0">
               <label className="text-[10px] font-bold text-slate-400 uppercase shrink-0">상태</label>
               <div className="flex items-center gap-1.5 min-w-0">
                  {selectedGroup && (
                     <span className={clsx(
                        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold border",
                        MEETING_LIFECYCLE[selectedGroup].activeColor
                     )}>
                        {React.cloneElement(MEETING_LIFECYCLE[selectedGroup].icon as React.ReactElement, { size: 10 })}
                        {MEETING_LIFECYCLE[selectedGroup].label}
                     </span>
                  )}
                  {selectedDetail && (
                     <span className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 truncate">
                        {MEETING_STATUS_LABELS[selectedDetail] || selectedDetail}
                     </span>
                  )}
                  {selectedDetail === 'followup-in-progress' && selectedSubDetail && (
                     <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 truncate">
                        {selectedSubDetail}
                     </span>
                  )}
               </div>
            </div>
            {statusSectionOpen ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
         </button>

         {statusSectionOpen && (
            <div className="px-3 pb-3 pt-1 border-t border-slate-100 space-y-2">
               <div className="grid grid-cols-4 gap-1">
                  {(['PENDING', 'NEGOTIATING', 'WON', 'LOST'] as StatusGroup[]).map((group) => {
                     const isSelected = selectedGroup === group;
                     const data = MEETING_LIFECYCLE[group];
                     return (
                        <button
                           key={group}
                           onClick={() => {
                              setSelectedGroup(group);
                              setSelectedDetail('');
                              setSelectedSubDetail('');
                           }}
                           className={clsx(
                              "h-7 flex items-center justify-center gap-1 px-1 rounded border transition-all text-[10px] font-bold",
                              isSelected
                                 ? data.activeColor + " shadow-sm"
                                 : "bg-white border-slate-200 " + data.color
                           )}
                        >
                           {React.cloneElement(data.icon as React.ReactElement, { size: 10 })}
                           <span className="truncate">{data.label}</span>
                        </button>
                     );
                  })}
               </div>

               {selectedGroup && (
                  <div className="space-y-1">
                     {MEETING_LIFECYCLE[selectedGroup].options.map((option) => (
                        <button
                           key={option.value}
                           onClick={() => {
                              setSelectedDetail(option.value);
                              setSelectedSubDetail('');
                              if (option.value === 'contract-completed') {
                                 setContractCompletedPromptOpen(true);
                              }
                           }}
                           className={clsx(
                              "w-full text-left px-2 py-1.5 text-[11px] rounded border transition-all flex items-center justify-between",
                              selectedDetail === option.value
                                 ? "bg-white border-blue-500 text-blue-700 font-bold ring-1 ring-blue-500"
                                 : "bg-slate-50 border-slate-200 text-slate-600 hover:border-blue-300"
                           )}
                        >
                           <span className="truncate">{option.label}</span>
                           {selectedDetail === option.value && <Check size={11} className="text-blue-600 shrink-0" />}
                        </button>
                     ))}
                  </div>
               )}

               {requiresSubReason && (
                  <div className="pt-1 border-t border-slate-200">
                     <div className="text-[9px] font-bold text-slate-500 mb-1">추가 사유 (필수)</div>
                     <div className="flex flex-wrap gap-1">
                        {subReasons.map((reason) => (
                           <button
                              key={reason}
                              onClick={() => setSelectedSubDetail(reason)}
                              className={clsx(
                                 "px-1.5 py-0.5 rounded text-[10px] border transition-all font-medium",
                                 selectedSubDetail === reason
                                    ? "bg-slate-700 text-white border-slate-700"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                              )}
                           >
                              {reason}
                           </button>
                        ))}
                     </div>
                  </div>
               )}

               {showFollowupSubtypeSelector && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                     <div>
                        <div className="text-[9px] font-bold text-slate-500 mb-1">후속 유형 (필수)</div>
                        <div className="flex flex-wrap gap-1">
                           {FOLLOWUP_SUB_OPTIONS.map((option) => (
                              <button
                                 key={option}
                                 type="button"
                                 onClick={() => setSelectedSubDetail(option)}
                                 className={clsx(
                                    "px-2 py-1 rounded text-[10px] border transition-all font-medium",
                                    selectedSubDetail === option
                                       ? "bg-amber-500 text-white border-amber-500"
                                       : "bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:border-amber-300"
                                 )}
                              >
                                 {option}
                              </button>
                           ))}
                        </div>
                     </div>

                     {selectedSubDetail === '2차 미팅 예정' && (
                        <div className="rounded-lg border border-slate-200 p-2.5 space-y-2">
                           <p className="text-[10px] font-bold text-slate-600">2차 미팅 일정</p>
                           <input
                              type="datetime-local"
                              className="h-9 w-full text-[11px] px-2.5 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                              value={meetingWorkflow.followupDate}
                              onChange={(e) => updateMeetingWorkflow('followupDate', e.target.value)}
                           />
                           <input
                              placeholder="2차 미팅 장소"
                              className="h-9 w-full text-[11px] px-2.5 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                              value={meetingWorkflow.followupLocation}
                              onChange={(e) => updateMeetingWorkflow('followupLocation', e.target.value)}
                           />
                           <input
                              placeholder="2차 미팅 목적"
                              className="h-9 w-full text-[11px] px-2.5 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                              value={meetingWorkflow.followupPurpose}
                              onChange={(e) => updateMeetingWorkflow('followupPurpose', e.target.value)}
                           />
                        </div>
                     )}

                     {(selectedSubDetail === '서류 보완 대기' || selectedSubDetail === '고객 재연락 예정' || selectedSubDetail === '내부 검토 중' || selectedSubDetail === '장기 보류') && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-2.5 space-y-2">
                           <p className="text-[10px] font-bold text-amber-800">{selectedSubDetail} 메모</p>
                           {selectedSubDetail === '고객 재연락 예정' && (
                              <input
                                 type="datetime-local"
                                 className="h-9 w-full text-[11px] px-2.5 border border-amber-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                                 value={meetingWorkflow.followupDate}
                                 onChange={(e) => updateMeetingWorkflow('followupDate', e.target.value)}
                              />
                           )}
                           <textarea
                              placeholder="후속 진행 내용을 남겨주세요."
                              className="w-full min-h-[76px] text-[11px] px-2.5 py-2 border border-amber-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-amber-400 placeholder:text-slate-300 resize-none"
                              value={meetingWorkflow.postMeetingNote}
                              onChange={(e) => updateMeetingWorkflow('postMeetingNote', e.target.value)}
                           />
                        </div>
                     )}
                  </div>
               )}

               {selectedDetail === 'insurance-re-review' && (
                  <div className="pt-2 border-t border-slate-200">
                     <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-2.5 space-y-2">
                        <p className="text-[10px] font-bold text-sky-800">보험 재심사 메모</p>
                        <textarea
                           placeholder="재심사 사유, 요청 서류, 보험사 확인 포인트..."
                           className="w-full min-h-[76px] text-[11px] px-2.5 py-2 border border-sky-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-sky-400 placeholder:text-slate-300 resize-none"
                           value={meetingWorkflow.designReviewNote}
                           onChange={(e) => updateMeetingWorkflow('designReviewNote', e.target.value)}
                        />
                     </div>
                  </div>
               )}

            </div>
         )}
      </div>
   );

   return (
      <div className="flex h-full min-h-0 flex-col bg-[#F6F7F9] overflow-hidden -m-4">
         {/* Header */}
         <div className="bg-white border-b border-slate-200 shrink-0 z-10">
            <div className="px-6 py-4 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                     <ArrowLeft size={20} />
                  </button>
                  <div>
                     <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{item.id}</span>
                        <span className="text-xs font-bold text-[#0f766e]">방문 미팅</span>
                        <span className="text-xs text-slate-400">|</span>
                        <span className="text-xs font-medium text-slate-500">담당자</span>
                        <span className="text-xs font-bold text-slate-700">{item.manager}</span>
                     </div>
                     <h1 className="text-xl font-bold text-[#1e293b]">
                        {item.customer} 고객 미팅 결과 입력
                        {type === 'simple' && <span className="text-sm font-normal text-slate-500 ml-2">(간편 청구)</span>}
                     </h1>
                  </div>
               </div>

               <div className="flex items-center gap-2">
                  <RefundAndMeetingInfo />
               </div>
            </div>
         </div>

         {/* 3-Column Layout */}
         <div className="flex min-h-0 flex-1 flex-col lg:flex-row overflow-hidden">

            {/* ━━━ LEFT PANEL: 미팅 5단계 프로세스 ━━━ */}
            <div ref={leftPanelRef} className="relative flex min-h-0 w-full shrink-0 flex-col bg-white border-b border-slate-200 lg:w-auto lg:min-w-[312px] lg:flex-[1.35] lg:border-r lg:border-b-0">
               <div className="sticky top-0 z-10 shrink-0 border-b border-slate-100 bg-slate-50 px-3 py-2.5">
                  <div className="flex items-center justify-between">
                     <h2 className="font-bold text-[#1e293b] flex items-center gap-1.5 text-[12px]">
                        <ClipboardCheck size={14} className="text-[#0f766e]" /> 미팅 프로세스
                     </h2>
                     <div className="flex items-center gap-2">
                        {panelMissingCount > 0 && (
                           <button
                              type="button"
                              onClick={() => setMissingModalOpen(true)}
                              className="text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded px-1.5 py-0.5 hover:bg-rose-100 transition-colors"
                           >
                              누락 {panelMissingCount}
                           </button>
                        )}
                        <span className="text-[10px] font-bold text-slate-400">{completedStepCount}/6</span>
                     </div>
                  </div>
                  <div className="mt-1.5 h-1 bg-slate-200 rounded-full overflow-hidden">
                     <div
                        className="h-full bg-[#0f766e] rounded-full transition-all duration-500"
                        style={{ width: `${(completedStepCount / 6) * 100}%` }}
                     />
                  </div>
               </div>

               <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-3 pb-24">
                  {renderStatusSection()}
                  <div className="mt-3 space-y-2">
                     <StepItem step={1} title="미팅 확정" icon={<Calendar size={14} />} iconColor="text-indigo-600">
                        <div className="space-y-2">
                           {/* 일시 */}
                           <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">일시</span>
                              <input
                                 type="datetime-local"
                                 className="h-8 w-full text-[12px] px-2.5 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                                 value={meetingWorkflow.meetingTime}
                                 onChange={(e) => updateMeetingWorkflow('meetingTime', e.target.value)}
                              />
                           </div>

                           {/* 장소 — 카카오 주소 검색 */}
                           <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">장소</span>
                              {meetingWorkflow.meetingLocation ? (
                                 <div className="rounded border border-blue-200 bg-blue-50 px-2.5 py-2">
                                    <div className="flex items-start justify-between gap-1">
                                       <div className="min-w-0">
                                          <div className="flex items-center gap-1 mb-0.5">
                                             <MapPin size={11} className="text-blue-600 shrink-0" />
                                             <span className="text-[11px] font-bold text-blue-800 truncate">{meetingWorkflow.meetingLocation}</span>
                                          </div>
                                          {addressDetail && (
                                             <span className="text-[10px] text-blue-600 ml-3.5">{addressDetail}</span>
                                          )}
                                       </div>
                                       <div className="flex items-center gap-1 shrink-0 mt-0.5">
                                          <button
                                             type="button"
                                             onClick={openAddressSearch}
                                             className="h-6 rounded border border-blue-200 bg-white px-1.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-100"
                                          >
                                             재검색
                                          </button>
                                          <button
                                             type="button"
                                             onClick={() => { updateMeetingWorkflow('meetingLocation', ''); setAddressDetail(''); }}
                                             className="text-blue-400 hover:text-rose-500"
                                          >
                                             <XCircle size={12} />
                                          </button>
                                       </div>
                                    </div>
                                    <input
                                       className="mt-1.5 h-7 w-full text-[11px] px-2 border border-blue-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder:text-slate-300"
                                       placeholder="상세 주소 (층, 호수 등)"
                                       value={addressDetail}
                                       onChange={(e) => setAddressDetail(e.target.value)}
                                    />
                                 </div>
                              ) : (
                                 <button
                                    type="button"
                                    onClick={openAddressSearch}
                                    className="h-9 w-full rounded border border-dashed border-slate-300 bg-white text-[11px] text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
                                 >
                                    <Search size={12} /> 주소 검색
                                 </button>
                              )}
                           </div>

                           {/* 확정 여부 — 토글 카드 */}
                           <button
                              type="button"
                              disabled={!hasValue(meetingWorkflow.meetingTime)}
                              onClick={() => updateMeetingWorkflow('meetingConfirmed', !meetingWorkflow.meetingConfirmed)}
                              className={clsx(
                                 "w-full rounded-lg border px-3 py-2.5 flex items-center justify-between transition-all",
                                 !hasValue(meetingWorkflow.meetingTime) && "cursor-not-allowed border-slate-200 bg-slate-50 opacity-50",
                                 hasValue(meetingWorkflow.meetingTime) && meetingWorkflow.meetingConfirmed && "border-emerald-300 bg-emerald-50 shadow-sm",
                                 hasValue(meetingWorkflow.meetingTime) && !meetingWorkflow.meetingConfirmed && "border-amber-200 bg-amber-50/50 hover:bg-amber-50",
                              )}
                           >
                              <div className="flex items-center gap-2">
                                 {meetingWorkflow.meetingConfirmed ? (
                                    <div className="size-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                       <Check size={11} className="text-white" />
                                    </div>
                                 ) : (
                                    <div className="size-5 rounded-full border-2 border-amber-300 bg-white" />
                                 )}
                                 <span className={clsx(
                                    "text-[12px] font-bold",
                                    meetingWorkflow.meetingConfirmed ? "text-emerald-700" : "text-amber-700"
                                 )}>
                                    {meetingWorkflow.meetingConfirmed ? '미팅 확정됨' : '미팅 미확정'}
                                 </span>
                              </div>
                              {meetingWorkflow.meetingConfirmed ? (
                                 <ToggleRight size={22} className="text-emerald-500" />
                              ) : (
                                 <ToggleLeft size={22} className="text-amber-400" />
                              )}
                           </button>

                           {/* 동석자 */}
                           <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">동석자</span>
                              <div className="flex items-center gap-1.5">
                                 <input
                                    value={companionInput}
                                    onChange={(e) => setCompanionInput(e.target.value)}
                                    placeholder="이름 입력 후 추가"
                                    className="h-8 flex-1 text-[11px] px-2.5 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder:text-slate-300"
                                    onKeyDown={(e) => {
                                       if (e.key === 'Enter') {
                                          const value = companionInput.trim();
                                          if (!value || meetingWorkflow.companions.includes(value)) return;
                                          updateMeetingWorkflow('companions', [...meetingWorkflow.companions, value]);
                                          setCompanionInput('');
                                       }
                                    }}
                                 />
                                 <button
                                    type="button"
                                    onClick={() => {
                                       const value = companionInput.trim();
                                       if (!value || meetingWorkflow.companions.includes(value)) return;
                                       updateMeetingWorkflow('companions', [...meetingWorkflow.companions, value]);
                                       setCompanionInput('');
                                    }}
                                    className="h-8 px-2.5 rounded border border-blue-300 bg-blue-50 text-[11px] font-bold text-blue-700 hover:bg-blue-100"
                                 >
                                    추가
                                 </button>
                              </div>
                              {meetingWorkflow.companions.length > 0 && (
                                 <div className="flex flex-wrap gap-1">
                                    {meetingWorkflow.companions.map((name) => (
                                       <button
                                          key={name}
                                          type="button"
                                          onClick={() =>
                                             updateMeetingWorkflow('companions', meetingWorkflow.companions.filter((itemName) => itemName !== name))
                                          }
                                          className="inline-flex items-center gap-0.5 rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[10px] text-slate-700"
                                       >
                                          {name}
                                          <XCircle size={10} className="text-slate-400" />
                                       </button>
                                    ))}
                                 </div>
                              )}
                           </div>
                        </div>
                     </StepItem>

                     <StepItem step={2} title="보험 분석" icon={<Shield size={14} />} iconColor="text-blue-600">
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                        {uploadedFileName ? (
                           <div className="space-y-1.5">
                              <div className="flex items-center justify-between rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] text-emerald-700">
                                 <div className="flex items-center gap-1.5 min-w-0">
                                    <Check size={12} className="text-emerald-500 shrink-0" />
                                    <span className="truncate font-medium">{uploadedFileName}</span>
                                 </div>
                                 <button type="button" onClick={() => setUploadedFileName(null)} className="text-slate-400 hover:text-rose-500 shrink-0">
                                    <XCircle size={12} />
                                 </button>
                              </div>
                              <button
                                 type="button"
                                 onClick={() => setCenterTab('insurance')}
                                 className="h-8 w-full rounded border border-blue-300 bg-blue-50 text-[11px] font-bold text-blue-700 hover:bg-blue-100"
                              >
                                 탭으로 이동
                              </button>
                           </div>
                        ) : (
                           <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="h-9 w-full rounded border border-dashed border-slate-300 bg-white text-[11px] text-slate-600 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 flex items-center justify-center gap-1.5"
                           >
                              <Upload size={12} /> 파일 업로드
                           </button>
                        )}
                     </StepItem>

                     <StepItem step={3} title="스크립트 작성" icon={<MessageSquareText size={14} />} iconColor="text-violet-600">
                        <div className="flex items-center gap-1.5">
                           <button
                              type="button"
                              onClick={() => setCenterTab('script')}
                              className="h-8 flex-1 rounded border border-slate-300 bg-white text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                           >
                              탭으로 이동
                           </button>
                           <button
                              type="button"
                              onClick={() => updateMeetingWorkflow('scriptReady', !meetingWorkflow.scriptReady)}
                              className={clsx(
                                 "h-8 px-3 rounded border text-[11px] font-bold transition-colors flex items-center gap-1",
                                 meetingWorkflow.scriptReady
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                              )}
                           >
                              {meetingWorkflow.scriptReady ? <Check size={11} /> : null}
                              {meetingWorkflow.scriptReady ? '완료' : '미완료'}
                           </button>
                        </div>
                     </StepItem>

                     <StepItem step={4} title="전자서명" icon={<FileCheck size={14} />} iconColor="text-emerald-600">
                        <div className="space-y-2">
                           <button
                              type="button"
                              onClick={() => {
                                 if (integrationStates.gloSignSigned) {
                                    return;
                                 }

                                 setIntegrationStates((prev) => ({ ...prev, gloSignRequested: true, gloSignSigned: false }));
                                 if (!integrationStates.gloSignRequested) {
                                    toast.success('글로싸인 전자서명을 발송했습니다.');
                                 }

                                 if (esignAutoCompleteTimerRef.current) {
                                    window.clearTimeout(esignAutoCompleteTimerRef.current);
                                 }

                                 esignAutoCompleteTimerRef.current = window.setTimeout(() => {
                                    setIntegrationStates((prev) => ({ ...prev, gloSignRequested: true, gloSignSigned: true }));
                                    toast.success('전자서명 완료가 자동 반영되었습니다.');
                                 }, 2200);
                              }}
                              disabled={integrationStates.gloSignSigned}
                              className={clsx(
                                 "h-8 w-full rounded border text-[11px] font-bold transition-colors",
                                 integrationStates.gloSignSigned
                                    ? "cursor-not-allowed border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : integrationStates.gloSignRequested
                                       ? "border-blue-300 bg-blue-50 text-blue-700"
                                       : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                              )}
                           >
                              {integrationStates.gloSignSigned
                                 ? '서명 완료'
                                 : integrationStates.gloSignRequested
                                    ? '발송됨'
                                    : '발송하기'}
                           </button>
                           <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[10px] text-slate-500">
                              {integrationStates.gloSignSigned
                                 ? '전자서명 완료가 반영되었습니다.'
                                 : integrationStates.gloSignRequested
                                    ? '서명 완료 시 상태가 자동으로 바뀝니다.'
                                    : '전자서명을 먼저 발송해주세요.'}
                           </div>
                        </div>
                     </StepItem>

                     <StepItem step={5} title="미팅 완료" icon={<CheckCircle2 size={14} />} iconColor="text-emerald-600">
                        {(() => {
                           const doneCount = meetingCompleteSections.filter((section) => section.done).length;
                           const totalCount = meetingCompleteSections.length;
                           const pct = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;
                           const allDone = doneCount === totalCount;
                           return (
                              <div className="space-y-2">
                                 <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                                    <div className="flex items-center justify-between mb-1">
                                       <span className="text-[10px] font-bold text-slate-500">후처리 진행</span>
                                       <span className={clsx(
                                          "text-[10px] font-bold",
                                          allDone ? "text-emerald-600" : "text-slate-500"
                                       )}>
                                          {doneCount}/{totalCount}
                                       </span>
                                    </div>
                                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                       <div
                                          className={clsx(
                                             "h-full rounded-full transition-all duration-500",
                                             allDone ? "bg-emerald-500" : "bg-blue-500"
                                          )}
                                          style={{ width: `${pct}%` }}
                                       />
                                    </div>
                                 </div>
                                 <div className="space-y-1">
                                    {meetingCompleteSections.map((section) => (
                                       <div key={section.key} className="flex items-center justify-between rounded-md bg-white px-2 py-1 text-[10px] text-slate-600">
                                          <span>{section.label}</span>
                                          <span className={clsx("font-bold", section.done ? "text-emerald-600" : "text-slate-400")}>
                                             {section.value}
                                          </span>
                                       </div>
                                    ))}
                                    <div className="flex items-center justify-between rounded-md bg-white px-2 py-1 text-[10px] text-slate-600">
                                       <span>연동/소개</span>
                                       <span className="font-bold text-slate-700">
                                          {integrationItems.filter((item) => item.active).length}/{integrationItems.length} · {Math.max(referralContactCount, meetingAdminState.referralCount)}명
                                       </span>
                                    </div>
                                 </div>
                                 <button
                                    type="button"
                                    onClick={() => setCenterTab('meetingComplete')}
                                    className={clsx(
                                       "h-8 w-full rounded border text-[11px] font-bold transition-colors",
                                       allDone
                                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                    )}
                                 >
                                    {allDone ? '✓ 후처리 완료' : '후처리 입력하기 →'}
                                 </button>
                              </div>
                           );
                        })()}
                     </StepItem>

                     <StepItem step={6} title="청구 인계" icon={<Briefcase size={14} />} iconColor="text-sky-600">
                        <div id="step-claim-handoff" ref={claimHandoffRef} className="space-y-2">
                           <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                              <div className="flex items-center justify-between gap-2">
                                 <div>
                                    <p className="text-[11px] font-bold text-slate-700">청구 프로세스 시작</p>
                                    <p className="mt-0.5 text-[10px] text-slate-500">미팅 완료 후 청구팀으로 넘길 메모와 시점을 남깁니다.</p>
                                 </div>
                                 {meetingWorkflow.claimTransferRequested && (
                                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                       인계 완료
                                    </span>
                                 )}
                              </div>
                           </div>
                           <textarea
                              placeholder="청구 인계 사유 또는 전달 메모..."
                              className="w-full min-h-[80px] text-[12px] px-3 py-2 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-sky-400 placeholder:text-slate-300 resize-none"
                              value={meetingWorkflow.claimTransferReason}
                              onChange={(e) => updateMeetingWorkflow('claimTransferReason', e.target.value)}
                           />
                           <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] text-slate-500">
                                 {meetingWorkflow.claimTransferAt
                                    ? `최근 인계 시각: ${meetingWorkflow.claimTransferAt}`
                                    : '아직 청구 인계 이력이 없습니다.'}
                              </span>
                              <button
                                 type="button"
                                 onClick={handleClaimTransferStart}
                                 className="h-8 rounded border border-sky-300 bg-sky-50 px-3 text-[11px] font-bold text-sky-700 hover:bg-sky-100"
                              >
                                 청구 인계 시작
                              </button>
                           </div>
                        </div>
                     </StepItem>
                  </div>
               </div>

               <div className="sticky bottom-0 z-10 border-t border-slate-200 bg-white/95 px-3 py-2 backdrop-blur-sm">
                  {(meetingGuardSummary.effectiveBlockingItems.length > 0 || meetingGuardSummary.warningItems.length > 0) && (
                     <div className="mb-1.5 flex items-center justify-end gap-1.5">
                        {meetingGuardSummary.effectiveBlockingItems.length > 0 && (
                           <button
                              onClick={() => jumpToMeetingGuardItem(0)}
                              className="inline-flex items-center gap-0.5 rounded-full border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-700"
                           >
                              <AlertOctagon size={10} /> 차단 {meetingGuardSummary.effectiveBlockingItems.length}
                           </button>
                        )}
                        {meetingGuardSummary.warningItems.length > 0 && (
                           <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                              <AlertCircle size={10} /> 경고 {meetingGuardSummary.warningItems.length}
                           </span>
                        )}
                     </div>
                  )}

                  <div className="grid grid-cols-2 gap-1.5">
                     <button
                        onClick={handleMeetingDraftSave}
                        className="w-full h-9 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center gap-1.5 text-[12px]"
                     >
                        <Save size={14} /> 임시 저장
                     </button>
                     <button
                        onClick={handleApplyMeetingStatus}
                        disabled={meetingGuardSummary.effectiveBlockingItems.length > 0 || !isFinalMeetingResultSelected(selectedDetail)}
                        className={clsx(
                           "w-full h-9 rounded-lg font-bold transition-colors shadow-lg flex items-center justify-center gap-1.5 text-[12px]",
                           meetingGuardSummary.effectiveBlockingItems.length > 0 || !isFinalMeetingResultSelected(selectedDetail)
                              ? "bg-slate-300 text-white cursor-not-allowed"
                              : "bg-[#1e293b] text-white hover:bg-slate-800",
                        )}
                     >
                        <Save size={14} /> 상태 반영
                     </button>
                  </div>
               </div>
            </div>

            {/* ━━━ CENTER PANEL: Workspace (3-Tab Layout) ━━━ */}
            <div ref={centerPanelRef} className="min-h-0 flex-1 bg-[#F6F7F9] px-5 pb-6 overflow-hidden lg:flex-[7] lg:px-6 flex flex-col">
               <MeetingCenterTabs
                  item={item}
                  customer={customer}
                  activeTab={centerTab}
                  onTabChange={setCenterTab}
                  consultationCheckData={{
                     disposition,
                     trustLevel,
                     bestTime,
                     decisionMaker,
                     traitNote,
                     companion,
                     insuranceType,
                     monthlyPremium,
                     paymentStatus,
                     contractor,
                     joinPath: insuranceStatus === '있음' ? joinPath : '-',
                     trafficAccident,
                     surgery: surgery === '있음' && surgeryOptions.length > 0 ? surgeryOptions.join(', ') : surgery,
                     criticalDisease,
                     medication,
                  }}
                  renderProfileSummary={() => (
                     <CustomerProfileSummary
                        customerName={item.customer}
                        ssn="921103-2******"
                        address={customer?.address || "경기도 화성시 동탄대로 550"}
                        threeMonthHistory="2023년 12월 15일 - 급성 위염으로 인한 내과 외래 진료. 2024년 1월 8일 - 알레르기성 비염 증상으로 이비인후과 진료."
                        contractor={contractor}
                        criticalDisease={criticalDisease}
                        criticalOptions={criticalOptions}
                        criticalDetail={criticalDiseaseDetail}
                        designerRelation={joinPath}
                        insuranceType={insuranceType}
                        monthlyPremium={monthlyPremium}
                        insuranceStatus={insuranceStatus}
                        refundAmount="200"
                        familyConnectionCount={3}
                        surgery={surgery}
                        surgeryOptions={surgeryOptions}
                        surgeryDetail={surgeryDetail}
                        decisionMaker={decisionMaker}
                        onDecisionMakerChange={setDecisionMaker}
                     />
                  )}
                  renderContractInfo={() => (
                     <ContractInfoSection
                        data={contractData}
                        onEdit={handleEditContract}
                        onDelete={handleDeleteContract}
                        onCreate={handleAddContract}
                     />
                  )}
                  renderCustomerInput={() => (
                     <CustomerInputSection
                        customer={{
                           name: customer?.name || item.customer,
                           phone: customer?.phone || '',
                           birth: customer?.birth || '',
                           address: customer?.address || '',
                           job: customer?.occupation
                        }}
                        consultation={{
                           monthlyPremium: monthlyPremium,
                           insuranceType: insuranceStatus === '있음' ? insuranceType : '미가입',
                           utmSource: 'UTM없음'
                        }}
                     />
                  )}
                  renderMeetingCompleteTab={() => (
                     <div
                        id="tab-meeting-complete"
                        ref={meetingCompleteRef}
                        className={clsx(
                           "rounded-xl border bg-white p-5 space-y-4 transition-all",
                           highlightSection === 'meetingComplete' && "ring-2 ring-rose-400 ring-offset-2 ring-offset-[#F6F7F9] border-slate-300",
                           highlightSection !== 'meetingComplete' && "border-slate-200",
                        )}
                     >
                        <div className="flex items-center justify-between">
                           <div>
                              <h3 className="text-sm font-bold text-slate-800">미팅 완료</h3>
                              <p className="mt-1 text-[12px] text-slate-500">결과 보고, 계약 반영, 청구 서류, 외부 연동, 소개 현황을 한 화면에서 정리합니다.</p>
                           </div>
                           <span className={clsx(
                              "rounded-full px-2 py-0.5 text-[11px] font-bold",
                              meetingCompleteSections.every((section) => section.done)
                                 ? "bg-emerald-100 text-emerald-700"
                                 : "bg-slate-100 text-slate-500"
                           )}>
                              {meetingCompleteSections.filter((section) => section.done).length}/{meetingCompleteSections.length}
                           </span>
                        </div>

                        <div className="space-y-4">
                           <div className="rounded-xl border border-slate-200 bg-white p-4">
                              <div className="flex items-start justify-between gap-3">
                                 <div>
                                    <p className="text-[12px] font-bold text-slate-800">미팅 메모</p>
                                    <p className="mt-1 text-[11px] text-slate-500">필요할 때만 최종 메모를 남기면 됩니다.</p>
                                 </div>
                                 <span
                                    className={clsx(
                                       "rounded-full px-2 py-0.5 text-[10px] font-bold",
                                       hasValue(meetingWorkflow.postMeetingNote)
                                          ? "bg-emerald-100 text-emerald-700"
                                          : "bg-slate-100 text-slate-500",
                                    )}
                                 >
                                    {hasValue(meetingWorkflow.postMeetingNote) ? '메모 작성됨' : '선택 입력'}
                                 </span>
                              </div>
                              <textarea
                                 placeholder="미팅 결과 요약 / 특이사항 / 다음 액션 메모..."
                                 className="mt-3 min-h-[96px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-400 resize-none"
                                 value={meetingWorkflow.postMeetingNote}
                                 onChange={(e) => updateMeetingWorkflow('postMeetingNote', e.target.value)}
                              />
                           </div>

                           <div className="grid auto-rows-fr gap-4 xl:grid-cols-2">
                              <div
                                 className={clsx(
                                    "flex h-full flex-col rounded-xl border p-4",
                                    isContractSectionEnabled
                                       ? "border-slate-200 bg-white"
                                       : "border-slate-200 bg-slate-50/80",
                                 )}
                              >
                                 <div className="flex items-start justify-between gap-3">
                                    <div>
                                       <p className={clsx("text-[12px] font-bold", isContractSectionEnabled ? "text-slate-800" : "text-slate-500")}>계약 현황</p>
                                       <p className={clsx("mt-1 text-[11px]", isContractSectionEnabled ? "text-slate-500" : "text-slate-400")}>
                                          {isContractSectionEnabled
                                             ? '등록된 계약 정보는 상세 표의 `계약 현황`과 동일하게 집계됩니다.'
                                             : '계약완료 상태를 선택하면 계약 현황과 계약 등록이 열립니다.'}
                                       </p>
                                    </div>
                                    <span
                                       className={clsx(
                                          "rounded-full px-2 py-0.5 text-[10px] font-bold",
                                          isContractSectionEnabled
                                             ? contractData.length > 0
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-slate-100 text-slate-500"
                                             : "bg-slate-200 text-slate-500",
                                       )}
                                    >
                                       {isContractSectionEnabled
                                          ? contractData.length > 0
                                             ? contractResultSummary.label
                                             : '계약 미등록'
                                          : '비활성'}
                                    </span>
                                 </div>
                                 {isContractSectionEnabled ? (
                                    <>
                                       <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                          <div className="rounded-lg bg-slate-50 px-3 py-3">
                                             <p className="text-[11px] font-semibold text-slate-500">등록 건수</p>
                                             <p className="mt-1 text-lg font-bold text-slate-800">{contractResultSummary.count}건</p>
                                          </div>
                                          <div className="rounded-lg bg-slate-50 px-3 py-3">
                                             <p className="text-[11px] font-semibold text-slate-500">합산 보험료</p>
                                             <p className="mt-1 text-lg font-bold text-slate-800">{contractResultSummary.premiumText}만원</p>
                                          </div>
                                          <div className="rounded-lg bg-slate-50 px-3 py-3">
                                             <p className="text-[11px] font-semibold text-slate-500">최근 등록 계약</p>
                                             <p className="mt-1 truncate text-sm font-bold text-slate-800" title={contractResultSummary.latestLabel}>
                                                {contractResultSummary.latestLabel}
                                             </p>
                                          </div>
                                       </div>
                                       <div className="mt-3 flex flex-1 items-end">
                                          <div className="flex w-full items-center justify-between gap-3 rounded-lg border border-dashed border-slate-200 px-3 py-2">
                                             <div className="text-[11px] text-slate-500">계약완료 상태라면 아래에서 계약 정보를 꼭 등록해주세요.</div>
                                             <button
                                                type="button"
                                                onClick={() => setCenterTab('contractRegistration')}
                                                className="h-8 shrink-0 rounded border border-emerald-300 bg-emerald-50 px-3 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
                                             >
                                                계약 등록/확인
                                             </button>
                                          </div>
                                       </div>
                                    </>
                                 ) : (
                                    <div className="mt-4 flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-center text-[12px] text-slate-400">
                                       계약완료로 상태를 바꾸면 이 영역이 활성화됩니다.
                                    </div>
                                 )}
                              </div>

                              <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4">
                                 <div className="flex items-start justify-between gap-3">
                                    <div>
                                       <p className="text-[12px] font-bold text-slate-800">청구 인계</p>
                                       <p className="mt-1 text-[11px] text-slate-500">청구팀에 넘길 서류 확보 상태와 인계 시점을 함께 관리합니다.</p>
                                    </div>
                                    <span
                                       className={clsx(
                                          "rounded-full px-2 py-0.5 text-[10px] font-bold",
                                          meetingWorkflow.claimTransferRequested
                                             ? "bg-sky-100 text-sky-700"
                                             : "bg-slate-100 text-slate-500",
                                       )}
                                    >
                                       {claimDocumentDoneCount}/{claimHandoffItems.length} 완료
                                    </span>
                                 </div>
                                 <p className="mt-1 text-[11px] text-slate-400">
                                    {meetingWorkflow.claimTransferRequested ? '인계 진행 중' : '인계 전'}
                                 </p>
                                 <div className="mt-3 space-y-2">
                                    {claimHandoffItems.map((doc) => (
                                       <button
                                          key={doc.label}
                                          type="button"
                                          onClick={() => {
                                             if (doc.label === '3종 서류') {
                                                updateMeetingAdminState('threeDocSubmitted', !meetingAdminState.threeDocSubmitted);
                                                return;
                                             }
                                             if (doc.label === '증권') {
                                                updateMeetingWorkflow('onSitePolicyCollected', !meetingWorkflow.onSitePolicyCollected);
                                                return;
                                             }
                                             updateMeetingWorkflow('onSitePaymentStatementCollected', !meetingWorkflow.onSitePaymentStatementCollected);
                                          }}
                                          className={clsx(
                                             "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors",
                                             doc.active
                                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                                          )}
                                       >
                                          <div className="flex items-center gap-2">
                                             <span
                                                className={clsx(
                                                   "inline-block h-2.5 w-2.5 rounded-full",
                                                   doc.active ? "bg-emerald-500" : "bg-slate-300",
                                                )}
                                             />
                                             <span className="text-[13px] font-semibold">{doc.label}</span>
                                          </div>
                                          <span className="text-[11px] font-bold">{doc.active ? '확인 완료' : '확인 필요'}</span>
                                       </button>
                                    ))}
                                 </div>
                                 <textarea
                                    placeholder="청구 인계 사유 또는 전달 메모..."
                                    className="mt-3 min-h-[84px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-400 resize-none"
                                    value={meetingWorkflow.claimTransferReason}
                                    onChange={(e) => updateMeetingWorkflow('claimTransferReason', e.target.value)}
                                 />
                                 <div className="mt-3 flex items-center justify-between gap-2">
                                    <span className="text-[11px] text-slate-500">
                                       {meetingWorkflow.claimTransferAt
                                          ? `최근 인계 시각: ${meetingWorkflow.claimTransferAt}`
                                          : `청구 서류 ${claimDocumentDoneCount}/${claimHandoffItems.length} 완료`}
                                    </span>
                                    <button
                                       type="button"
                                       onClick={handleClaimTransferStart}
                                       className="h-8 rounded border border-sky-300 bg-sky-50 px-3 text-[11px] font-bold text-sky-700 hover:bg-sky-100"
                                    >
                                       청구 인계 시작
                                    </button>
                                 </div>
                              </div>

                              <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4">
                                 <div className="flex items-start justify-between gap-3">
                                    <div>
                                       <p className="text-[12px] font-bold text-slate-800">연동 현황</p>
                                       <p className="mt-1 text-[11px] text-slate-500">어드민에서 확인할 수 있는 회원/기관 연동 여부를 바로 반영합니다.</p>
                                    </div>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                       {integrationItems.filter((entry) => entry.active).length}/{integrationItems.length} 완료
                                    </span>
                                 </div>
                                 <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                    {integrationItems.map((integration) => (
                                       <button
                                          key={integration.label}
                                          type="button"
                                          onClick={() => {
                                             switch (integration.label) {
                                                case '회원가입':
                                                   updateMeetingAdminState('memberSignupCompleted', !meetingAdminState.memberSignupCompleted);
                                                   break;
                                                case '앱 설치':
                                                   updateMeetingWorkflow('onSiteAppLinked', !meetingWorkflow.onSiteAppLinked);
                                                   break;
                                                case '홈택스':
                                                   updateMeetingAdminState('hometaxLinked', !meetingAdminState.hometaxLinked);
                                                   break;
                                                case '심평원':
                                                   updateMeetingAdminState('hiraLinked', !meetingAdminState.hiraLinked);
                                                   break;
                                                case '건보':
                                                   updateMeetingAdminState('nhisLinked', !meetingAdminState.nhisLinked);
                                                   break;
                                                case 'C4U':
                                                   updateMeetingAdminState('c4uLinked', !meetingAdminState.c4uLinked);
                                                   break;
                                             }
                                          }}
                                          className={clsx(
                                             "rounded-lg border px-3 py-3 text-left transition-colors",
                                             integration.active
                                                ? "border-slate-900 bg-slate-900 text-white"
                                                : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-white",
                                          )}
                                       >
                                          <p className="text-[13px] font-bold">{integration.label}</p>
                                          <p className={clsx("mt-1 text-[11px]", integration.active ? "text-slate-200" : "text-slate-400")}>
                                             {integration.active ? '연동 확인 완료' : '아직 미확인'}
                                          </p>
                                       </button>
                                    ))}
                                 </div>
                              </div>

                              <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4">
                                 <div className="flex items-start justify-between gap-3">
                                    <div>
                                       <p className="text-[12px] font-bold text-slate-800">소개 현황</p>
                                       <p className="mt-1 text-[11px] text-slate-500">소개 요청 여부와 함께 이름, 연락처, 관계를 남길 수 있습니다.</p>
                                    </div>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                       {Math.max(referralContactCount, meetingAdminState.referralCount)}명
                                    </span>
                                 </div>
                                 <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <ToggleMiniCard
                                       label={meetingWorkflow.onSiteReferralPrompted ? '소개 요청 완료' : '소개 요청 체크'}
                                       active={meetingWorkflow.onSiteReferralPrompted}
                                       onClick={() => updateMeetingWorkflow('onSiteReferralPrompted', !meetingWorkflow.onSiteReferralPrompted)}
                                    />
                                    <ToggleMiniCard
                                       label={meetingWorkflow.referralAsked ? '소개 의사 확인' : '소개 의사 미확인'}
                                       active={meetingWorkflow.referralAsked}
                                       onClick={() => updateMeetingWorkflow('referralAsked', !meetingWorkflow.referralAsked)}
                                    />
                                    <button
                                       type="button"
                                       onClick={handleAddReferralContact}
                                       className="h-10 rounded border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-600 hover:bg-slate-50"
                                    >
                                       소개자 추가
                                    </button>
                                 </div>
                                 <div className="mt-3 rounded-lg bg-slate-50 px-3 py-3">
                                    <div className="flex items-center justify-between">
                                       <div>
                                          <p className="text-[11px] font-semibold text-slate-500">소개 인원</p>
                                          <p className="mt-1 text-lg font-bold text-slate-800">{Math.max(referralContactCount, meetingAdminState.referralCount)}명</p>
                                       </div>
                                       <p className="text-[11px] text-slate-400">입력된 소개자 기준으로 집계</p>
                                    </div>
                                 </div>
                                 <div className="mt-3 space-y-2">
                                    {referralContacts.length > 0 ? (
                                       referralContacts.map((contact, index) => (
                                          <div key={contact.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                             <div className="mb-2 flex items-center justify-between">
                                                <p className="text-[11px] font-bold text-slate-500">소개자 {index + 1}</p>
                                                <button
                                                   type="button"
                                                   onClick={() => handleDeleteReferralContact(contact.id)}
                                                   className="text-[11px] font-bold text-rose-500 hover:text-rose-600"
                                                >
                                                   삭제
                                                </button>
                                             </div>
                                             <div className="grid gap-2">
                                                <input
                                                   placeholder="이름"
                                                   className="h-10 rounded border border-slate-200 bg-white px-3 text-[12px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                                   value={contact.name}
                                                   onChange={(e) => handleReferralContactChange(contact.id, 'name', e.target.value)}
                                                />
                                                <input
                                                   placeholder="연락처"
                                                   className="h-10 rounded border border-slate-200 bg-white px-3 text-[12px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                                   value={contact.phone}
                                                   onChange={(e) => handleReferralContactChange(contact.id, 'phone', e.target.value)}
                                                />
                                                <input
                                                   placeholder="관계"
                                                   className="h-10 rounded border border-slate-200 bg-white px-3 text-[12px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                                   value={contact.relationship}
                                                   onChange={(e) => handleReferralContactChange(contact.id, 'relationship', e.target.value)}
                                                />
                                             </div>
                                          </div>
                                       ))
                                    ) : (
                                       <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-[12px] text-slate-400">
                                          소개자가 생기면 `소개자 추가`로 이름, 연락처, 관계를 남겨주세요.
                                       </div>
                                    )}
                                 </div>
                              </div>
                        </div>

                        {selectedDetail === 'no-show' && (
                           <div className="space-y-3 rounded-lg border border-slate-200 p-3">
                              <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                                 <p className="text-[12px] font-bold text-slate-600">후속 일정</p>
                                 <input
                                    type="datetime-local"
                                    className="h-11 w-full text-[13px] px-3 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                                    value={meetingWorkflow.followupDate}
                                    onChange={(e) => updateMeetingWorkflow('followupDate', e.target.value)}
                                 />
                                 <input
                                    placeholder="후속 장소"
                                    className="h-11 w-full text-[13px] px-3 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                                    value={meetingWorkflow.followupLocation}
                                    onChange={(e) => updateMeetingWorkflow('followupLocation', e.target.value)}
                                 />
                                 <input
                                    placeholder="후속 목적"
                                    className="h-11 w-full text-[13px] px-3 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                                    value={meetingWorkflow.followupPurpose}
                                    onChange={(e) => updateMeetingWorkflow('followupPurpose', e.target.value)}
                                 />
                              </div>

                           </div>
                        )}

                        {(selectedDetail === 'meeting-cancelled' || selectedDetail === 'no-show' || selectedDetail === 'withdrawn') && (
                           <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                              {selectedDetail === 'no-show' && (
                                 <ToggleMiniCard
                                    label="현장 도착 확인"
                                    active={meetingWorkflow.arrivalChecked}
                                    onClick={() => updateMeetingWorkflow('arrivalChecked', !meetingWorkflow.arrivalChecked)}
                                 />
                              )}
                              <textarea
                                 placeholder="연락 시도 로그 / 취소 채널 기록..."
                                 className="w-full min-h-[84px] text-[13px] px-3 py-2 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-purple-400 placeholder:text-slate-300 resize-none"
                                 value={meetingWorkflow.callAttemptLog}
                                 onChange={(e) => updateMeetingWorkflow('callAttemptLog', e.target.value)}
                              />
                           </div>
                        )}

                        {selectedDetail === 'uw-rejected' && (
                           <textarea
                              placeholder="대체 제안 / 대안 상품 안내..."
                              className="w-full min-h-[84px] text-[13px] px-3 py-2 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-purple-400 placeholder:text-slate-300 resize-none"
                              value={meetingWorkflow.alternativeProposal}
                              onChange={(e) => updateMeetingWorkflow('alternativeProposal', e.target.value)}
                           />
                        )}

                        {(selectedDetail === 'contract-failed' || selectedDetail === 'on-site-impossible') && (
                           <div className="space-y-2 rounded-lg border border-rose-200 bg-rose-50/40 p-3">
                              <p className="text-[12px] font-bold text-rose-800">
                                 {selectedDetail === 'contract-failed' ? '계약실패 정리' : '현장불가 정리'}
                              </p>
                              <p className="text-[11px] text-rose-700">
                                 {selectedSubDetail
                                    ? `선택 사유: ${selectedSubDetail}`
                                    : '사유를 먼저 선택해두면 상태 반영 전에 다시 확인하기 쉬워집니다.'}
                              </p>
                              <textarea
                                 placeholder={selectedDetail === 'contract-failed' ? '실패 배경, 고객 반응, 재접촉 가능성...' : '현장 상황, 진행 불가 원인, 후속 조치...'}
                                 className="w-full min-h-[84px] text-[13px] px-3 py-2 border border-rose-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-slate-300 resize-none"
                                 value={meetingWorkflow.postMeetingNote}
                                 onChange={(e) => updateMeetingWorkflow('postMeetingNote', e.target.value)}
                              />
                           </div>
                        )}

                        {selectedDetail === 'withdrawn' && (
                           <input
                              type="datetime-local"
                              className="h-11 w-full text-[13px] px-3 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                              value={meetingWorkflow.withdrawalAt}
                              onChange={(e) => updateMeetingWorkflow('withdrawalAt', e.target.value)}
                           />
                        )}

                     </div>
                  </div>
                  )}
                  renderContractRegistrationTab={() => (
                     <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                        <div className="flex items-center justify-between">
                           <h3 className="text-sm font-bold text-slate-800">계약 등록</h3>
                           <button
                              onClick={handleAddContract}
                              disabled={!isContractSectionEnabled}
                              className={clsx(
                                 "h-8 px-3 rounded border text-[12px] font-bold transition-colors",
                                 isContractSectionEnabled
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                    : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed",
                              )}
                           >
                              복붙 등록
                           </button>
                        </div>
                        {isContractSectionEnabled ? (
                           <div className="space-y-4">
                              <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                                 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                       <p className="text-sm font-bold text-slate-800">복붙 등록 안내</p>
                                       <p className="mt-1 text-xs text-slate-500">
                                          삼성화재, KB손해보험 계약 상세 텍스트를 그대로 붙여넣고 검수 후 저장하는 단건 등록 방식을 우선 적용했습니다.
                                       </p>
                                    </div>
                                    <button
                                       onClick={handleAddContract}
                                       className="h-9 shrink-0 rounded-lg border border-emerald-300 bg-emerald-50 px-4 text-[12px] font-bold text-emerald-700 hover:bg-emerald-100"
                                    >
                                       복붙 등록 시작
                                    </button>
                                 </div>
                              </div>
                              <ContractInfoSection
                                 data={contractData}
                                 onEdit={handleEditContract}
                                 onDelete={handleDeleteContract}
                                 onCreate={handleAddContract}
                              />
                           </div>
                        ) : (
                           <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                              <p className="text-sm font-bold text-slate-600">계약완료 상태에서만 계약 등록이 가능합니다.</p>
                              <p className="mt-2 text-xs text-slate-400">미팅 결과를 `계약완료`로 선택하면 이 탭이 활성화됩니다.</p>
                           </div>
                        )}
                     </div>
                  )}
               />
            </div>

            {/* ━━━ RIGHT PANEL: History & Memo ━━━ */}
            <div className="hidden min-h-0 w-full shrink-0 flex-col bg-white border-t border-slate-200 lg:flex lg:w-auto lg:min-w-[288px] lg:flex-[1.35] lg:border-l lg:border-t-0">
               <div className="sticky top-0 z-10 shrink-0 border-b border-slate-100 bg-slate-50 p-4">
                  <h2 className="font-bold text-[#1e293b] flex items-center gap-2 text-sm">
                     <History size={16} className="text-slate-500" /> 이력 및 메모
                  </h2>
               </div>

               <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
                  <div className="space-y-6">
                     {/* Timeline */}
                     <div>
                        <div className="text-xs font-bold text-slate-500 mb-3 uppercase flex items-center gap-1">
                           <Clock size={12} /> Recent History
                        </div>
                        <div className="relative pl-3 border-l border-slate-200 space-y-4">
                           {history.map((h, i) => (
                              <div key={i} className="relative">
                                 <div className="absolute -left-[17px] top-1 size-2 rounded-full bg-slate-300 border-2 border-white ring-1 ring-slate-100"></div>
                                 <div className="bg-slate-50 p-2.5 rounded border border-slate-100 hover:border-blue-200 transition-colors">
                                    <div className="flex justify-between items-center mb-1">
                                       <span className="text-[11px] font-bold text-[#1e293b]">{h.title}</span>
                                       <span className="text-[10px] text-slate-400 font-mono">{h.date.split(' ')[1]}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-snug">{h.desc}</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* Memo */}
                     <div className="pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                              <MessageSquareText size={12} /> Internal Note
                           </span>
                        </div>
                        <textarea
                           className="w-full h-32 p-3 text-xs bg-amber-50 border border-amber-100 rounded resize-none focus:outline-none focus:border-amber-300 transition-colors placeholder:text-amber-300 text-slate-700"
                           placeholder="미팅 관련 특이사항이나 메모를 입력하세요..."
                           value={meetingWorkflow.postMeetingNote}
                           onChange={(e) => updateMeetingWorkflow('postMeetingNote', e.target.value)}
                        />
                        <button
                           onClick={handleMeetingDraftSave}
                           className="w-full mt-2 py-2 bg-white border border-slate-200 text-slate-600 rounded text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm"
                        >
                           메모 저장
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Modals */}
         <ContractRegistrationModal
            isOpen={isContractModalOpen}
            onClose={() => setIsContractModalOpen(false)}
            onSubmit={handleContractSubmit}
            prefilledData={{
               customerName: customer?.name || item.customer,
               customerPhone: customer?.phone || '',
               meetingDate: item.date,
               consultantName: item.manager,
            }}
            initialData={editingContractIndex !== null ? contractData[editingContractIndex] : undefined}
         />
         <TransitionGuardModal
            open={guardModalOpen}
            items={guardItems}
            currentIndex={guardIndex}
            onPrev={handleGuardPrev}
            onNext={handleGuardNext}
            onJump={jumpToMeetingGuardItem}
            onClose={() => setGuardModalOpen(false)}
         />
         {contractCompletedPromptOpen && (
            <div className="fixed inset-0 z-[68] flex items-center justify-center p-4">
               <button
                  type="button"
                  className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm"
                  onClick={() => setContractCompletedPromptOpen(false)}
               />
               <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                  <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                     <h3 className="text-sm font-bold text-slate-800">계약 등록 이동</h3>
                     <p className="mt-0.5 text-[12px] text-slate-600">계약 등록을 하시겠습니까?</p>
                  </div>
                  <div className="flex items-center justify-end gap-2 px-4 py-3">
                     <button
                        type="button"
                        onClick={() => setContractCompletedPromptOpen(false)}
                        className="h-9 px-3 rounded border border-slate-300 bg-white text-[12px] font-bold text-slate-700 hover:bg-slate-50"
                     >
                        아니오
                     </button>
                     <button
                        type="button"
                        onClick={() => {
                           setContractCompletedPromptOpen(false);
                           setCenterTab('contractRegistration');
                        }}
                        className="h-9 px-3 rounded border border-emerald-300 bg-emerald-50 text-[12px] font-bold text-emerald-700 hover:bg-emerald-100"
                     >
                        예, 이동
                     </button>
                  </div>
               </div>
            </div>
         )}
         {missingModalOpen && (
            <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
               <button
                  type="button"
                  className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm"
                  onClick={() => setMissingModalOpen(false)}
               />
               <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                     <div>
                        <h3 className="text-sm font-bold text-slate-800">누락 항목 {panelMissingCount}개</h3>
                        <p className="mt-0.5 text-[11px] text-slate-500">각 항목을 누르면 해당 영역으로 이동합니다.</p>
                     </div>
                     <button
                        type="button"
                        onClick={() => setMissingModalOpen(false)}
                        className="rounded-full p-1.5 text-slate-400 hover:bg-white hover:text-slate-600"
                     >
                        <XCircle size={16} />
                     </button>
                  </div>

                  <div className="max-h-[360px] overflow-y-auto p-3">
                     {panelMissingItems.length === 0 ? (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-semibold text-emerald-700">
                           현재 누락 항목이 없습니다.
                        </div>
                     ) : (
                        <div className="space-y-1.5">
                           {panelMissingItems.map((item, index) => (
                              <button
                                 key={`${item.step}-${item.message}-${index}`}
                                 type="button"
                                 onClick={() => {
                                    const state = stepStateMap[item.step];
                                    if (state) {
                                       openMeetingSection(state.sectionId);
                                    }
                                    setMissingModalOpen(false);
                                 }}
                                 className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left hover:bg-slate-50"
                              >
                                 <p className="text-[11px] font-bold text-slate-700">{item.step}단계 · {item.title}</p>
                                 <p className="mt-0.5 text-[11px] text-slate-600">{item.message}</p>
                              </button>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}

function StepStatusButton({
   onClick,
   active,
   activeLabel,
   inactiveLabel,
   tone,
   disabled = false,
}: {
   onClick: () => void;
   active: boolean;
   activeLabel: string;
   inactiveLabel: string;
   tone: 'blue' | 'emerald' | 'rose';
   disabled?: boolean;
}) {
   const toneClass = tone === 'blue'
      ? "bg-blue-50 text-blue-600 border-blue-200"
      : tone === 'emerald'
         ? "bg-emerald-50 text-emerald-600 border-emerald-200"
         : "bg-rose-50 text-rose-600 border-rose-200";

   const inactiveToneClass = tone === 'blue'
      ? "hover:bg-blue-50 hover:text-blue-500 hover:border-blue-200"
      : tone === 'emerald'
         ? "hover:bg-emerald-50 hover:text-emerald-500 hover:border-emerald-200"
         : "hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200";

   return (
      <button
         onClick={onClick}
         disabled={disabled}
         className={clsx(
            "h-8 min-w-[72px] px-2 rounded text-[11px] font-bold border transition-colors",
            disabled && "cursor-not-allowed opacity-50",
            active
               ? toneClass
               : `bg-slate-50 text-slate-400 border-slate-200 ${inactiveToneClass}`
         )}
      >
         {active ? activeLabel : inactiveLabel}
      </button>
   );
}

function ToggleMiniCard({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
   return (
      <button
         onClick={onClick}
         className={clsx(
            "h-10 px-2.5 rounded border text-[12px] font-bold transition-colors text-left",
            active
               ? "bg-blue-50 text-blue-700 border-blue-200"
               : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
         )}
      >
         {label}
      </button>
   );
}
