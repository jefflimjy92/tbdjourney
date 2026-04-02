import { addDays, endOfWeek, format, parseISO, startOfWeek } from 'date-fns';
import type {
  AssignmentDemand,
  MeetingAssignmentItem,
  MeetingAssignmentStatus,
  MeetingDraft,
  MeetingStaffLoad,
  RequestJourney,
} from '@/app/journey/types';

export interface StaffMember {
  id: string;
  name: string;
  team: string;
  color: string;
}

export type MeetingScheduleStatus =
  | 'scheduled'
  | 'followup'
  | 'contract-completed'
  | 'cancelled'
  | 'impossible'
  | 'noshow'
  | 'pending-assignment';

export interface MeetingScheduleItem {
  id: string;
  requestId?: string;
  customerId: string;
  customer: string;
  birthDate?: string;
  type: string;
  dbType: string;
  date: string;
  time: string;
  location: string;
  status: MeetingScheduleStatus;
  statusCode?: string;
  statusLabel?: string;
  team: string;
  staff: string;
  phone: string;
  source: 'generated' | 'journey';
  assignmentStatus?: MeetingAssignmentStatus;
  meetingConfirmed?: boolean;
  contractCount?: number;
  contractAmount?: number;
  contractAmountText?: string;
  regionLevel1: string;
  regionLevel2: string;
}

export const STAFF_LIST: StaffMember[] = [
  { id: 'all', name: '전체 보기', team: 'all', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { id: 'm1', name: '박미팅', team: '1팀', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'm2', name: '최미팅', team: '2팀', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'm3', name: '김상담', team: '3팀', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'm4', name: '이팀장', team: '4팀', color: 'bg-amber-100 text-amber-700 border-amber-200' },
];

export const TEAM_LIST = [
  { id: 'all', name: '전체 팀' },
  ...STAFF_LIST.slice(1).map((staff) => ({ id: staff.team, name: staff.team })),
];

export const TEAM_REGION_CONFIG: Record<string, string[]> = {
  '1팀': ['서울 강남구', '서울 서초구', '서울 송파구'],
  '2팀': ['경기 성남시 분당구', '경기 용인시 수지구', '경기 수원시 영통구'],
  '3팀': ['인천 연수구', '경기 안양시 동안구', '경기 광명시'],
  '4팀': ['경기 평택시', '경기 화성시', '경기 남양주시', '경기 양주시'],
};

const BASE_LOCATIONS = [
  '서울 강남구 역삼동',
  '서울 서초구 반포동',
  '서울 송파구 잠실동',
  '경기 성남시 분당구 수내동',
  '경기 용인시 수지구 풍덕천동',
  '경기 수원시 영통구 영통동',
  '인천 연수구 송도동',
  '경기 안양시 동안구 비산동',
  '경기 광명시 광명동',
  '경기 평택시 평택동',
  '경기 화성시 봉담읍',
  '경기 남양주시 오남읍',
];

function normalizeRegionLabel(token: string) {
  if (!token) return '';
  return token
    .replace('특별시', '')
    .replace('광역시', '')
    .replace('특별자치시', '')
    .replace('특별자치도', '')
    .replace('경기도', '경기')
    .replace('서울시', '서울')
    .replace('인천시', '인천');
}

function cleanToken(token: string) {
  return token.replace(/[(),]/g, '').trim();
}

export function parseAddressRegion(address: string) {
  const tokens = address.split(/\s+/).map(cleanToken).filter(Boolean);
  const regionLevel1 = normalizeRegionLabel(tokens[0] || '미분류') || '미분류';

  let regionLevel2 = '미분류';
  if (tokens[1]) {
    const second = cleanToken(tokens[1]);
    const third = cleanToken(tokens[2] || '');
    if (/(시|군)$/.test(second) && third && /구$/.test(third)) {
      regionLevel2 = `${second} ${third}`;
    } else {
      regionLevel2 = second;
    }
  }

  return {
    regionLevel1,
    regionLevel2,
    regionKey: regionLevel2 === '미분류' ? regionLevel1 : `${regionLevel1} ${regionLevel2}`,
  };
}

export function formatShortAddress(address: string) {
  if (!address) return '주소 미입력';
  const { regionKey } = parseAddressRegion(address);
  return regionKey === '미분류' ? address : regionKey;
}

function inferAssignmentDemand(regionLevel1: string, regionLevel2: string, assignedTeam: string, targetDate: string): AssignmentDemand {
  const regionKey = `${regionLevel1} ${regionLevel2}`.trim();
  const resolvedTeam = assignedTeam || Object.entries(TEAM_REGION_CONFIG).find(([, regions]) => regions.includes(regionKey))?.[0] || '미지정';
  const neededCount = resolvedTeam === '미지정' ? 1 : resolvedTeam === '1팀' ? 4 : resolvedTeam === '2팀' ? 3 : 2;
  return {
    team: resolvedTeam,
    targetDate: targetDate || format(new Date(), 'yyyy-MM-dd'),
    neededCount,
    cutoffAt: targetDate ? `${targetDate} 18:00` : `${format(new Date(), 'yyyy-MM-dd')} 18:00`,
  };
}

export function getJourneyDbType(journeyType: RequestJourney['journeyType']) {
  if (journeyType === 'refund') return '3년 환급';
  if (journeyType === 'simple') return '간편 청구';
  if (journeyType === 'intro') return '소개 DB';
  return '가족 DB';
}

function parseDueDateLabel(nextDueAt: string) {
  if (!nextDueAt || nextDueAt === '-') {
    return { date: '', time: '미정' };
  }

  const [date, time] = nextDueAt.split(' ');
  return { date, time: time || '미정' };
}

function resolveMeetingAddress(draft: MeetingDraft) {
  return draft.meetingLocation || draft.followupLocation || '주소 미입력';
}

function parsePremiumAmount(value?: string) {
  const numeric = Number((value || '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

export function formatMeetingContractAmount(amount: number) {
  if (!amount) return '0원';
  if (amount < 100000) return `${amount.toLocaleString()}원`;

  const wanAmount = amount / 10000;
  const text = Number.isInteger(wanAmount) ? wanAmount.toFixed(0) : wanAmount.toFixed(1);
  return `${text}만원`;
}

function buildContractSummary(draft: MeetingDraft) {
  const contractCount = draft.contractData.length || draft.contractDataCount || 0;
  const contractAmount = draft.contractData.reduce((sum, item) => sum + parsePremiumAmount(item.premium), 0);
  return {
    contractCount,
    contractAmount,
    contractAmountText: contractCount > 0 ? formatMeetingContractAmount(contractAmount) : '',
  };
}

function resolveMeetingStatus(
  detailCode: string,
  fallbackLabel: string,
  meetingConfirmed: boolean,
  assignmentStatus?: MeetingAssignmentStatus,
) {
  if (!meetingConfirmed) {
    return {
      status: 'pending-assignment' as MeetingScheduleStatus,
      statusCode: detailCode || 'pending-assignment',
      statusLabel: assignmentStatus === 'confirmed' ? '배정완료' : '배정중',
    };
  }

  switch (detailCode) {
    case 'contract-completed':
      return { status: 'contract-completed' as MeetingScheduleStatus, statusCode: detailCode, statusLabel: '계약완료' };
    case 'followup-2nd-meeting':
      return { status: 'followup' as MeetingScheduleStatus, statusCode: detailCode, statusLabel: '2차 미팅 예정' };
    case 'prospect':
      return { status: 'followup' as MeetingScheduleStatus, statusCode: detailCode, statusLabel: '후속 진행' };
    case 'pre-meeting-cancel':
      return { status: 'cancelled' as MeetingScheduleStatus, statusCode: detailCode, statusLabel: '취소' };
    case 'final-absent':
      return { status: 'noshow' as MeetingScheduleStatus, statusCode: detailCode, statusLabel: '노쇼' };
    case 'post-meeting-impossible':
      return { status: 'impossible' as MeetingScheduleStatus, statusCode: detailCode, statusLabel: '현장불가' };
    case 'contract-failed':
      return { status: 'impossible' as MeetingScheduleStatus, statusCode: detailCode, statusLabel: '계약불가' };
    case 'pre-meeting-impossible':
      return { status: 'impossible' as MeetingScheduleStatus, statusCode: detailCode, statusLabel: '심사거절' };
    case 'intake-confirmed':
      return { status: 'scheduled' as MeetingScheduleStatus, statusCode: detailCode, statusLabel: '접수 확인' };
    case 'absent':
      return { status: 'noshow' as MeetingScheduleStatus, statusCode: detailCode, statusLabel: '결석' };
    case 'standby':
      return { status: 'scheduled' as MeetingScheduleStatus, statusCode: detailCode, statusLabel: '대기' };
    case 'second-meeting':
      return { status: 'followup' as MeetingScheduleStatus, statusCode: detailCode, statusLabel: '2차 미팅' };
    case 'feedback-done':
      return { status: 'followup' as MeetingScheduleStatus, statusCode: detailCode, statusLabel: '피드백 완료' };
    case 'contract-delay':
      return { status: 'followup' as MeetingScheduleStatus, statusCode: detailCode, statusLabel: '계약 지연' };
    case 'withdrawn':
      return { status: 'impossible' as MeetingScheduleStatus, statusCode: detailCode, statusLabel: '철회' };
    case 'meeting-confirmed':
      return { status: 'scheduled' as MeetingScheduleStatus, statusCode: detailCode, statusLabel: '미팅 확정' };
    default:
      return {
        status: 'scheduled' as MeetingScheduleStatus,
        statusCode: detailCode || 'scheduled',
        statusLabel: fallbackLabel || '미팅 확정',
      };
  }
}

function sortMeetings(items: MeetingScheduleItem[]) {
  return [...items].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });
}

function buildGeneratedMeetings() {
  const meetings: MeetingScheduleItem[] = [];
  const baseDate = new Date();

  for (let offset = -20; offset <= 25; offset += 1) {
    const date = addDays(baseDate, offset);
    const count = Math.floor(Math.random() * 6) + 2;

    for (let index = 0; index < count; index += 1) {
      const hour = 9 + Math.floor(Math.random() * 9);
      const minute = Math.random() > 0.5 ? '00' : '30';
      const staff = STAFF_LIST.slice(1)[Math.floor(Math.random() * (STAFF_LIST.length - 1))];
      const location = BASE_LOCATIONS[Math.floor(Math.random() * BASE_LOCATIONS.length)];
      const { regionLevel1, regionLevel2 } = parseAddressRegion(location);

      let status: MeetingScheduleItem['status'] = 'scheduled';
      let statusLabel = '미팅 확정';
      let contractCount = 0;
      let contractAmount = 0;
      let contractAmountText = '';
      if (offset < 0) {
        const rand = Math.random();
        if (rand > 0.92) {
          status = 'cancelled';
          statusLabel = '취소';
        } else if (rand > 0.84) {
          status = 'noshow';
          statusLabel = '노쇼';
        } else if (rand > 0.75) {
          status = 'impossible';
          statusLabel = '현장불가';
        } else if (rand > 0.48) {
          status = 'contract-completed';
          statusLabel = '계약완료';
          contractCount = Math.random() > 0.6 ? 2 : 1;
          contractAmount = contractCount === 2 ? 320000 : 128000;
          contractAmountText = formatMeetingContractAmount(contractAmount);
        } else {
          status = 'followup';
          statusLabel = Math.random() > 0.5 ? '후속 진행' : '2차 미팅 예정';
        }
      }

      meetings.push({
        id: `M-${format(date, 'yyyyMMdd')}-${index}`,
        customerId: `C-${Math.floor(1000 + Math.random() * 9000)}`,
        customer: `고객${Math.floor(Math.random() * 1000)}`,
        birthDate: `${Math.floor(Math.random() * 30) + 70}-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`,
        type: '방문 미팅',
        dbType: '3년 환급',
        date: format(date, 'yyyy-MM-dd'),
        time: `${hour}:${minute}`,
        location,
        status,
        statusCode: status,
        statusLabel,
        team: staff.team,
        staff: staff.name,
        phone: `010-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        source: 'generated',
        contractCount,
        contractAmount,
        contractAmountText,
        regionLevel1,
        regionLevel2,
      });
    }
  }

  return sortMeetings(meetings);
}

export const BASE_MEETING_SCHEDULE = buildGeneratedMeetings();

export function buildMeetingAssignmentItems(journeys: Record<string, RequestJourney>): MeetingAssignmentItem[] {
  return Object.values(journeys)
    .filter((journey) => (
      journey.journeyType === 'refund'
      && journey.currentStageStatus.stageId !== 'closed'
      && !journey.meetingDraft.meetingConfirmed
      && resolveMeetingAddress(journey.meetingDraft) !== '주소 미입력'
    ))
    .map((journey) => {
      const draft = journey.meetingDraft;
      const rawAddress = resolveMeetingAddress(draft);
      const fallbackRegion = parseAddressRegion(rawAddress);
      const due = parseDueDateLabel(journey.nextDueAt);

      return {
        requestId: journey.requestId,
        customerName: journey.customerName,
        dbType: getJourneyDbType(journey.journeyType),
        rawAddress,
        regionLevel1: draft.regionLevel1 || fallbackRegion.regionLevel1,
        regionLevel2: draft.regionLevel2 || fallbackRegion.regionLevel2,
        preferredDate: due.date,
        preferredTime: draft.meetingTime ? draft.meetingTime.split(' ')[1] || draft.meetingTime : journey.consultationDraft.bestTime || due.time,
        assignedTeam: draft.assignedTeam,
        assignedStaff: draft.assignedStaff,
        assignmentStatus: draft.assignmentStatus || 'unassigned',
        assignmentDemand: inferAssignmentDemand(
          draft.regionLevel1 || fallbackRegion.regionLevel1,
          draft.regionLevel2 || fallbackRegion.regionLevel2,
          draft.assignedTeam,
          due.date,
        ),
        assignmentSource: draft.assignmentSource || 'manual',
        meetingConfirmed: draft.meetingConfirmed,
        owner: journey.owner,
        notificationState: draft.notificationState || journey.notificationState || 'pending',
        excludeState: draft.excludeState || journey.excludeState || 'active',
        excludeReason: draft.excludeReason || journey.excludeReason || '',
        statusLabel: draft.meetingConfirmed ? '배정완료' : draft.assignmentStatus === 'assigned' ? '배정중' : '미확정',
      };
    })
    .sort((a, b) => {
      if (a.assignmentStatus !== b.assignmentStatus) {
        if (a.assignmentStatus === 'unassigned') return -1;
        if (b.assignmentStatus === 'unassigned') return 1;
      }
      if (a.preferredDate !== b.preferredDate) return a.preferredDate.localeCompare(b.preferredDate);
      return a.customerName.localeCompare(b.customerName);
    });
}

export function buildJourneyScheduleItems(journeys: Record<string, RequestJourney>) {
  const items = Object.values(journeys)
    .filter((journey) => {
      const draft = journey.meetingDraft;
      return journey.journeyType === 'refund' && (draft.meetingConfirmed || draft.assignmentStatus === 'assigned' || draft.assignmentStatus === 'confirmed');
    })
    .map<MeetingScheduleItem>((journey) => {
      const draft = journey.meetingDraft;
      const rawAddress = resolveMeetingAddress(draft);
      const fallbackRegion = parseAddressRegion(rawAddress);
      const due = parseDueDateLabel(draft.meetingTime || journey.nextDueAt);
      const staff = draft.assignedStaff || journey.owner;
      const team = draft.assignedTeam || STAFF_LIST.find((item) => item.name === staff)?.team || '미배정';
      const detailCode = draft.selectedDetail || journey.currentStageStatus.statusCode;
      const statusMeta = resolveMeetingStatus(detailCode, journey.currentStageStatus.statusLabel, draft.meetingConfirmed, draft.assignmentStatus);
      const contractSummary = buildContractSummary(draft);

      return {
        id: `J-${journey.requestId}`,
        requestId: journey.requestId,
        customerId: journey.requestId,
        customer: journey.customerName,
        type: '배정 미확정',
        dbType: getJourneyDbType(journey.journeyType),
        date: due.date || format(new Date(), 'yyyy-MM-dd'),
        time: due.time || '미정',
        location: rawAddress,
        status: statusMeta.status,
        statusCode: statusMeta.statusCode,
        statusLabel: statusMeta.statusLabel,
        team,
        staff,
        phone: '-',
        source: 'journey',
        assignmentStatus: draft.assignmentStatus,
        meetingConfirmed: draft.meetingConfirmed,
        contractCount: contractSummary.contractCount,
        contractAmount: contractSummary.contractAmount,
        contractAmountText: contractSummary.contractAmountText,
        regionLevel1: draft.regionLevel1 || fallbackRegion.regionLevel1,
        regionLevel2: draft.regionLevel2 || fallbackRegion.regionLevel2,
      };
    });

  return sortMeetings(items);
}

export function buildMeetingStaffLoads(
  item: MeetingAssignmentItem,
  meetings: MeetingScheduleItem[],
): MeetingStaffLoad[] {
  const selectedRegionKey = `${item.regionLevel1} ${item.regionLevel2}`.trim();
  const currentDate = new Date();
  const today = format(currentDate, 'yyyy-MM-dd');
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);

  return STAFF_LIST.slice(1)
    .map<MeetingStaffLoad>((staff) => {
      const todayMeetings = meetings.filter((meeting) => (
        meeting.staff === staff.name
        && meeting.date === today
        && meeting.status !== 'cancelled'
      )).length;

      const weekMeetings = meetings.filter((meeting) => {
        if (meeting.staff !== staff.name || meeting.status === 'cancelled') return false;
        const meetingDate = parseISO(meeting.date);
        return meetingDate >= weekStart && meetingDate <= weekEnd;
      }).length;

      const teamRegions = TEAM_REGION_CONFIG[staff.team] || [];
      const exactMatch = teamRegions.includes(selectedRegionKey);
      const broadMatch = teamRegions.some((region) => region.startsWith(item.regionLevel1));
      const regionMatches = exactMatch ? 2 : broadMatch ? 1 : 0;
      const nextAvailableSlot = todayMeetings <= 1 ? '오늘 오후' : weekMeetings <= 5 ? '내일 오전' : '이번 주 후반';

      return {
        staffId: staff.id,
        staffName: staff.name,
        team: staff.team,
        regionMatches,
        scheduledCountToday: todayMeetings,
        scheduledCountWeek: weekMeetings,
        nextAvailableSlot,
      };
    })
    .sort((a, b) => {
      if (a.regionMatches !== b.regionMatches) return b.regionMatches - a.regionMatches;
      if (a.scheduledCountToday !== b.scheduledCountToday) return a.scheduledCountToday - b.scheduledCountToday;
      return a.scheduledCountWeek - b.scheduledCountWeek;
    });
}
