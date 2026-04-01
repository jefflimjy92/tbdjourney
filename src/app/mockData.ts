import { addDays, format, subDays } from 'date-fns';
import { CUSTOMER_MASTER_DERIVED_MOCK } from '@/app/mockGenerators/customerMasterDerived';

type HiraPreFillData = {
  fetchedAt: string;
  trafficAccident: '있음' | '없음';
  trafficAccidentDetail: string;
  surgery: '있음' | '없음';
  surgeryOptions: string[];
  criticalDisease: '있음' | '없음';
  criticalOptions: string[];
  medication: '있음' | '없음';
  medicationDetail: string;
  hasLongHospitalization: boolean;
  longHospitalizationDetail: string;
  hasRecentMedical: boolean;
  recentMedicalDetail: string;
};

const NOW = new Date('2026-03-13T09:00:00+09:00');

const SURGERY_OPTIONS = ['용종 제거', '관절 시술', '골절 수술', '백내장 수술', '내시경 시술'];
const CRITICAL_OPTIONS = ['고혈압', '당뇨', '고지혈증', '갑상선 결절', '위염', '협심증 의심'];
const MEDICATIONS = ['혈압약 복용', '위장약 복용', '갑상선 약 복용', '영양제 복용 중'];

function toSeed(input: string) {
  return Array.from(input).reduce((seed, char, index) => seed + char.charCodeAt(0) * (index + 17), 0);
}

function mulberry32(seed: number) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickOne<T>(rng: () => number, values: T[]) {
  return values[Math.floor(rng() * values.length)];
}

function compactRegion(address?: string) {
  if (!address) {
    return '미확인';
  }
  return address.split(' ').slice(0, 2).join(' ');
}

function buildHiraRecord(customerId: string, birth: string): HiraPreFillData {
  const rng = mulberry32(toSeed(customerId));
  const trafficAccident = rng() > 0.86 ? '있음' : '없음';
  const surgery = rng() > 0.62 ? '있음' : '없음';
  const criticalDisease = rng() > 0.71 ? '있음' : '없음';
  const medication = rng() > 0.64 ? '있음' : '없음';
  const hasLongHospitalization = rng() > 0.84;
  const hasRecentMedical = rng() > 0.57;

  const surgeryOptions =
    surgery === '있음'
      ? Array.from(new Set([pickOne(rng, SURGERY_OPTIONS), ...(rng() > 0.72 ? [pickOne(rng, SURGERY_OPTIONS)] : [])]))
      : [];
  const criticalOptions =
    criticalDisease === '있음'
      ? Array.from(
          new Set([pickOne(rng, CRITICAL_OPTIONS), ...(rng() > 0.7 ? [pickOne(rng, CRITICAL_OPTIONS)] : [])]),
        )
      : [];

  return {
    fetchedAt: format(subDays(NOW, Math.floor(rng() * 21)), 'yyyy.MM.dd HH:mm'),
    trafficAccident,
    trafficAccidentDetail:
      trafficAccident === '있음' ? `${2022 + Math.floor(rng() * 4)}년 교통사고 통원 치료 이력` : '',
    surgery,
    surgeryOptions,
    criticalDisease,
    criticalOptions,
    medication,
    medicationDetail: medication === '있음' ? pickOne(rng, MEDICATIONS) : '',
    hasLongHospitalization,
    longHospitalizationDetail: hasLongHospitalization
      ? `${birth.slice(0, 2)}년생 기준 최근 3년 내 14일 이상 입원 이력 확인`
      : '',
    hasRecentMedical,
    recentMedicalDetail: hasRecentMedical ? '최근 6개월 내 외래 진료 이력이 반복적으로 확인됩니다.' : '',
  };
}

const hiraRecords = CUSTOMER_MASTER_DERIVED_MOCK.customers.map((customer) => ({
  customerId: customer.id,
  ...buildHiraRecord(customer.id, customer.birth),
}));

function buildAnalysis(customerId: string) {
  const rng = mulberry32(toSeed(`${customerId}-analysis`));
  const linkedRequest = CUSTOMER_MASTER_DERIVED_MOCK.requests.find((request) => request.customerId === customerId);
  const linkedClaim = CUSTOMER_MASTER_DERIVED_MOCK.claimsQueue.find((claim) => claim.requestId === linkedRequest?.id);
  const linkedMeeting = CUSTOMER_MASTER_DERIVED_MOCK.meetingExecutionQueue.find(
    (meeting) => meeting.requestId === linkedRequest?.id,
  );

  return {
    refundAmount: (40 + Math.floor(rng() * 260)) * 10000,
    dispute: rng() > 0.88,
    insuranceType: linkedRequest?.type === '간편 청구' ? '실손' : pickOne(rng, ['실손+종합', '종합', '실손']),
    decisionMaker: pickOne(rng, ['본인', '배우자', '부모', '가족 공동']),
    plannerRelation: pickOne(rng, ['모름', '지인', '가족', '직장동료', '기존고객 소개']),
    familyCount: 1 + Math.floor(rng() * 4),
    maritalStatus: pickOne(rng, ['미혼', '기혼', '기타']),
    recentMedical: rng() > 0.58,
    criticalIllness: rng() > 0.8,
    familyHistory: pickOne(rng, ['없음', '고혈압(부)', '당뇨(모)', '암 가족력', '심혈관계 가족력']),
    cancellationHistory: pickOne(rng, ['없음', '1회 (단순변심)', '1회 (보험료 부담)', '2회 이상']),
    surgeryHistory: pickOne(rng, ['없음', '1회 - 용종 제거', '1회 - 백내장 수술', '2회 - 관절 시술']),
    legalService: rng() > 0.92,
    contractMatch: pickOne(rng, ['동일', '상이', '미확인']),
    premium: (2 + Math.floor(rng() * 16)) * 10000,
    contractStatus: linkedClaim?.status || linkedMeeting?.status || '정상',
    lastContact: linkedMeeting?.date?.slice(0, 10) || linkedClaim?.date || linkedRequest?.date || format(NOW, 'yyyy-MM-dd'),
    source: pickOne(rng, ['인스타그램', '구글검색', '네이버블로그', '지인소개', '환급금조회']),
    notes: pickOne(rng, [
      '환급금 안내에 적극적입니다.',
      '가족과 상의 후 진행 여부 결정 예정입니다.',
      '보장 분석 결과를 꼼꼼히 확인하는 편입니다.',
      '간편 청구 우선 처리 희망합니다.',
    ]),
  };
}

const customersWithMeta = CUSTOMER_MASTER_DERIVED_MOCK.customers.map((customer) => ({
  ...customer,
  idNumber: customer.birth,
  grade: customer.status === '완료' || customer.status === '청구중' ? 'VIP' : 'GENERAL',
  gradeScore: customer.status === '완료' ? 92 : customer.status === '청구중' ? 84 : 71,
  region: compactRegion(customer.address),
  marketingConsent: '동의함',
  consentDate: CUSTOMER_MASTER_DERIVED_MOCK.requests.find((request) => request.customerId === customer.id)?.date || format(NOW, 'yyyy-MM-dd'),
  dbSource: buildAnalysis(customer.id).source,
  analysis: buildAnalysis(customer.id),
}));

type RequestFlowStage = '접수' | '상담' | '미팅' | '청구' | '종결';
type RequestFlowStep = 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8' | 'S9';

type RequestFlowScenario = {
  currentStep: RequestFlowStep;
  stage: RequestFlowStage;
  status: string;
  team: string;
};

type BaseRequestRow = (typeof CUSTOMER_MASTER_DERIVED_MOCK.requestRows)[number];

const REQUEST_FLOW_SCENARIOS: Record<RequestFlowStage, RequestFlowScenario[]> = {
  접수: [
    { currentStep: 'S2', stage: '접수', status: '조회 중', team: '접수팀' },
    { currentStep: 'S2', stage: '접수', status: '신청 완료', team: '접수팀' },
    { currentStep: 'S2', stage: '접수', status: '배정 대기', team: '접수팀' },
  ],
  상담: [
    { currentStep: 'S3', stage: '상담', status: '상담 진행', team: '상담팀' },
    { currentStep: 'S3', stage: '상담', status: '1차 상담 완료', team: '상담팀' },
    { currentStep: 'S4', stage: '상담', status: '보완 요청', team: '상담팀' },
    { currentStep: 'S4', stage: '상담', status: '2차 상담 예정', team: '상담팀' },
  ],
  미팅: [
    { currentStep: 'S5', stage: '미팅', status: '가망 고객', team: '미팅팀' },
    { currentStep: 'S5', stage: '미팅', status: '미팅 확정', team: '미팅팀' },
    { currentStep: 'S6', stage: '미팅', status: '미팅 진행', team: '미팅팀' },
    { currentStep: 'S6', stage: '미팅', status: '후속 진행', team: '미팅팀' },
    { currentStep: 'S7', stage: '미팅', status: '미팅 완료', team: '미팅팀' },
    { currentStep: 'S7', stage: '미팅', status: '노쇼', team: '미팅팀' },
  ],
  청구: [
    { currentStep: 'S7', stage: '청구', status: '서류 보완', team: '청구팀' },
    { currentStep: 'S7', stage: '청구', status: '보험사 접수', team: '청구팀' },
    { currentStep: 'S8', stage: '청구', status: '지급 대기', team: '청구팀' },
    { currentStep: 'S8', stage: '청구', status: '심사중', team: '청구팀' },
  ],
  종결: [
    { currentStep: 'S9', stage: '종결', status: '지급 완료', team: 'CS팀' },
    { currentStep: 'S9', stage: '종결', status: '완료', team: 'CS팀' },
    { currentStep: 'S9', stage: '종결', status: '계약실패', team: 'CS팀' },
    { currentStep: 'S9', stage: '종결', status: '미팅취소', team: 'CS팀' },
    { currentStep: 'S9', stage: '종결', status: '현장불가', team: 'CS팀' },
  ],
};

function toDateOnly(dateText?: string) {
  if (!dateText) {
    return NOW;
  }

  const parsed = new Date(`${dateText}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? NOW : parsed;
}

function resolveRequestStageGroup(row: BaseRequestRow, rng: () => number): RequestFlowStage {
  const weights: RequestFlowStage[] = row.type === '간편 청구'
    ? ['접수', '상담', '미팅', '청구', '청구', '청구', '종결', '종결']
    : ['접수', '상담', '상담', '미팅', '미팅', '청구', '종결'];

  const stageText = `${row.stage} ${row.status}`;
  if (stageText.includes('보완')) {
    weights.push('상담', '청구');
  }
  if (stageText.includes('미팅') || stageText.includes('계약')) {
    weights.push('미팅');
  }
  if (stageText.includes('청구') || stageText.includes('접수')) {
    weights.push('청구');
  }
  if (stageText.includes('완료') || stageText.includes('종료')) {
    weights.push('종결');
  }
  if (stageText.includes('실패') || stageText.includes('취소') || stageText.includes('노쇼') || stageText.includes('불가')) {
    weights.push('종결', '종결');
  }

  return pickOne(rng, weights);
}

function buildRequestRows() {
  return CUSTOMER_MASTER_DERIVED_MOCK.requestRows.map((row) => {
    const rng = mulberry32(toSeed(`${row.id}:${row.type}:${row.stage}:${row.status}:${row.manager}`));
    const stageGroup = resolveRequestStageGroup(row, rng);
    const scenario = pickOne(rng, REQUEST_FLOW_SCENARIOS[stageGroup]);
    const sourceDate = toDateOnly(row.date || format(NOW, 'yyyy-MM-dd'));
    const dayJitter = Math.floor(rng() * 19) - 9;

    return {
      ...row,
      date: format(addDays(sourceDate, dayJitter), 'yyyy-MM-dd'),
      stage: scenario.stage,
      status: scenario.status,
      team: scenario.team,
      currentStep: scenario.currentStep,
    };
  });
}

const requestRowsWithFlow = buildRequestRows();

export const MOCK_DATA = {
  customers: customersWithMeta,
  requests: CUSTOMER_MASTER_DERIVED_MOCK.requests,
  consultations: CUSTOMER_MASTER_DERIVED_MOCK.consultations,
  meetings: CUSTOMER_MASTER_DERIVED_MOCK.meetings,
  meetingExecutionQueue: CUSTOMER_MASTER_DERIVED_MOCK.meetingExecutionQueue,
  claimsQueue: CUSTOMER_MASTER_DERIVED_MOCK.claimsQueue,
  requestRows: requestRowsWithFlow,
  hiraRecords,
};

export function getHiraPreFill(customerId: string) {
  return hiraRecords.find((record) => record.customerId === customerId) ?? null;
}

export function getCustomerDetail(customerId: string) {
  const customer = customersWithMeta.find((item) => item.id === customerId);
  if (!customer) {
    return null;
  }

  const requests = CUSTOMER_MASTER_DERIVED_MOCK.requests.filter((request) => request.customerId === customerId);
  const requestIds = new Set(requests.map((request) => request.id));
  const consultations = CUSTOMER_MASTER_DERIVED_MOCK.consultations.filter((item) => item.customerId === customerId);
  const meetings = CUSTOMER_MASTER_DERIVED_MOCK.meetingExecutionQueue.filter((item) => item.customerId === customerId);
  const claims = CUSTOMER_MASTER_DERIVED_MOCK.claimsQueue.filter((item) => requestIds.has(item.requestId));
  const hiraPreFill = getHiraPreFill(customerId);

  return {
    customer,
    requests,
    consultations,
    meetings,
    claims,
    hiraPreFill,
    analysis: customer.analysis,
    history: [
      ...consultations.map((item) => ({ type: '상담', at: item.date, summary: item.content })),
      ...meetings.map((item) => ({ type: '미팅', at: item.date, summary: item.consultationSummary })),
      ...claims.map((item) => ({ type: '청구', at: item.date, summary: item.status })),
    ].sort((a, b) => b.at.localeCompare(a.at)),
  };
}
