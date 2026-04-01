import React, { useMemo, useState } from 'react';
import { 
  Filter, 
  Plus, 
  ChevronRight, 
  ArrowLeft,
  Clock,
  User,
  Phone,
  Calendar,
  MessageSquare,
  FileText,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react';
import clsx from 'clsx';
import { JourneyHeader } from '@/app/components/journey/JourneyHeader';
import { JourneyRequirementPanel } from '@/app/components/journey/JourneyRequirementPanel';
import { useJourneyStore } from '@/app/journey/JourneyContext';
import { MOCK_DATA } from '@/app/mockData';
import { ListPeriodControls } from '@/app/components/ListPeriodControls';
import {
  filterRowsByPeriod,
  getDefaultCustomPeriodRange,
  getPerformancePeriodRange,
  getRowsDateBounds,
  type PerformancePeriodPreset,
} from '@/app/issuance/performancePeriodUtils';

const REQUESTS = MOCK_DATA.requestRows;

// Mock Process Data
const PROCESS_STEPS = [
  { id: 'reception', label: '접수', status: 'completed', date: '2026.01.19 09:00', manager: 'System' },
  { id: 'consultation', label: '상담', status: 'completed', date: '2026.01.19 14:00', manager: '김상담' },
  { id: 'meeting', label: '미팅', status: 'completed', date: '2026.01.21 14:00', manager: '박미팅' },
  { id: 'claim', label: '청구', status: 'processing', date: '-', manager: '최청구' },
  { id: 'complete', label: '종결', status: 'pending', date: '-', manager: '-' },
];

// Mock Activity Data
const ACTIVITIES = [
  { id: 1, type: 'reception', title: '신규 접수 (인스타그램)', desc: '광고 캠페인 A를 통해 유입됨', date: '2026.01.19 09:00', actor: 'System' },
  { id: 2, type: 'consultation', title: '1차 상담 완료', desc: '환급 예상액 안내 완료 (약 150만원). 미팅 희망함.', date: '2026.01.19 10:30', actor: '김상담' },
  { id: 3, type: 'assignment', title: '미팅팀 배정', desc: '담당자: 박미팅 매니저', date: '2026.01.19 14:00', actor: 'System' },
  { id: 4, type: 'meeting', title: '미팅 일정 확정', desc: '2026.01.21 14:00 / 강남역 스타벅스', date: '2026.01.20 09:15', actor: '박미팅' },
];

const stageLabelMap = {
  request: '접수',
  consultation: '상담',
  meeting: '미팅',
  handoff: '이관',
  claims: '청구',
  closed: '종결',
} as const;

export function Requests({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const { journeys } = useJourneyStore();
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const requestRows = useMemo(() => (
    REQUESTS.map((request) => {
      const journey = journeys[request.id];
      return {
        ...request,
        customer: journey?.customerName || request.customer,
        stage: journey ? stageLabelMap[journey.stage] : request.stage,
        status: journey?.status || request.status,
        manager: journey?.owner || request.manager,
        team: journey?.stage === 'meeting' ? '미팅팀' : journey?.stage === 'claims' ? '청구팀' : journey?.stage === 'handoff' ? '이관팀' : request.team,
      };
    })
  ), [journeys]);

  const handleSelect = (id: string) => {
    setSelectedRequestId(id);
    setView('detail');
  };

  const handleBack = () => {
    setSelectedRequestId(null);
    setView('list');
  };

  if (view === 'detail' && selectedRequestId) {
    const request = requestRows.find(r => r.id === selectedRequestId) || requestRows[0];
    return <RequestDetail request={request} onBack={handleBack} onNavigate={onNavigate} />;
  }

  return <RequestList onSelect={handleSelect} requests={requestRows} />;
}

const STEP_TABS = [
  { key: 'all', label: '전체' },
  { key: 'S2', label: '조회 중 (S2)' },
  { key: 'S3', label: '신청 완료 (S3)' },
  { key: 'S4', label: '배정 대기 (S4)' },
] as const;

type StepTabKey = typeof STEP_TABS[number]['key'];

/** Mock: 각 접수건에 currentStep 매핑 */
function assignMockStep(req: typeof REQUESTS[number], idx: number): typeof REQUESTS[number] & { currentStep: string } {
  const steps = ['S2', 'S3', 'S4', 'S5', 'S3', 'S2', 'S4', 'S3'];
  return { ...req, currentStep: steps[idx % steps.length] };
}

function RequestList({ onSelect, requests }: { onSelect: (id: string) => void; requests: typeof REQUESTS }) {
  const defaultCustomPeriodRange = useMemo(() => getDefaultCustomPeriodRange(), []);
  const [periodPreset, setPeriodPreset] = useState<PerformancePeriodPreset>('this_month');
  const [customPeriodStartDate, setCustomPeriodStartDate] = useState(defaultCustomPeriodRange.startDate);
  const [customPeriodEndDate, setCustomPeriodEndDate] = useState(defaultCustomPeriodRange.endDate);
  const [activeTab, setActiveTab] = useState<StepTabKey>('all');
  const allRange = useMemo(
    () => getRowsDateBounds(requests, (request) => request.date, defaultCustomPeriodRange),
    [defaultCustomPeriodRange, requests]
  );

  const periodRange = useMemo(
    () => getPerformancePeriodRange(periodPreset, customPeriodStartDate, customPeriodEndDate, new Date(), allRange),
    [allRange, customPeriodEndDate, customPeriodStartDate, periodPreset]
  );

  const periodFiltered = useMemo(
    () => filterRowsByPeriod(requests, periodRange, (request) => request.date),
    [periodRange, requests]
  );

  const requestsWithStep = useMemo(
    () => periodFiltered.map((req, idx) => assignMockStep(req, idx)),
    [periodFiltered]
  );

  const stepCounts = useMemo(() => ({
    all: requestsWithStep.length,
    S2: requestsWithStep.filter(r => r.currentStep === 'S2').length,
    S3: requestsWithStep.filter(r => r.currentStep === 'S3').length,
    S4: requestsWithStep.filter(r => r.currentStep === 'S4').length,
  }), [requestsWithStep]);

  const filteredRequests = useMemo(
    () => activeTab === 'all' ? requestsWithStep : requestsWithStep.filter(r => r.currentStep === activeTab),
    [activeTab, requestsWithStep]
  );

  // Summary metrics (mock)
  const lookupRate = 85;   // 조회 완료율
  const conversionRate = 62; // 조회→신청 전환율
  const dropoutRate = 18;    // 신청 이탈률

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
        <div>
          <h2 className="font-bold text-[#1e293b]">접수 현황 (All Requests)</h2>
          <p className="text-xs text-slate-500 mt-1">전체 접수건의 진행 단계 및 타임라인 조회</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <ListPeriodControls
            preset={periodPreset}
            range={periodRange}
            onPresetChange={setPeriodPreset}
            onStartDateChange={setCustomPeriodStartDate}
            onEndDateChange={setCustomPeriodEndDate}
          />
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors shadow-sm">
            <Filter size={16} /> 필터
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-[#1e293b] text-white rounded text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm">
            <Plus size={16} /> 신규 접수
          </button>
        </div>
      </div>

      {/* Summary Cards (S2-S3 Metrics) */}
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded border border-slate-200 shadow-sm">
            <CheckCircle2 size={14} className="text-blue-500" />
            <span className="text-xs text-slate-500">조회 완료율</span>
            <span className="text-sm font-bold text-[#1e293b]">{lookupRate}%</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded border border-slate-200 shadow-sm">
            <ArrowLeft size={14} className="text-emerald-500 rotate-180" />
            <span className="text-xs text-slate-500">조회→신청 전환율</span>
            <span className="text-sm font-bold text-emerald-700">{conversionRate}%</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded border border-slate-200 shadow-sm">
            <AlertCircle size={14} className="text-rose-400" />
            <span className="text-xs text-slate-500">신청 이탈률</span>
            <span className="text-sm font-bold text-rose-600">{dropoutRate}%</span>
          </div>
        </div>
      </div>

      {/* Step Filter Tabs */}
      <div className="px-6 pt-3 pb-0 border-b border-slate-200 bg-white flex gap-1">
        {STEP_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'px-4 py-2 text-xs font-bold rounded-t border-b-2 transition-colors',
              activeTab === tab.key
                ? 'text-[#1e293b] border-[#1e293b] bg-slate-50'
                : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'
            )}
          >
            {tab.label}
            <span className={clsx(
              'ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]',
              activeTab === tab.key ? 'bg-[#1e293b] text-white' : 'bg-slate-100 text-slate-400'
            )}>
              {stepCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* List Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-200 sticky top-0">
            <tr>
              <th className="px-6 py-3 font-medium">접수 ID</th>
              <th className="px-6 py-3 font-medium">접수 유형</th>
              <th className="px-6 py-3 font-medium">고객명</th>
              <th className="px-6 py-3 font-medium">접수일</th>
              <th className="px-6 py-3 font-medium">현재 단계</th>
              <th className="px-6 py-3 font-medium">스텝</th>
              <th className="px-6 py-3 font-medium">담당팀</th>
              <th className="px-6 py-3 font-medium">상태</th>
              <th className="px-6 py-3 font-medium text-right">상세</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRequests.map((req) => (
              <tr 
                key={req.id} 
                className="hover:bg-slate-50 transition-colors cursor-pointer group"
                onClick={() => onSelect(req.id)}
              >
                <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">{req.id}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex px-2 py-0.5 rounded bg-white border border-slate-200 text-xs font-bold text-slate-600 shadow-sm">
                    {req.type}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-[#1e293b]">{req.customer}</td>
                <td className="px-6 py-4 text-slate-600 font-mono text-xs">{req.date}</td>
                <td className="px-6 py-4">
                  <span className={clsx("font-bold text-xs", 
                    req.stage === '상담' ? "text-blue-600" :
                    req.stage === '미팅' ? "text-purple-600" :
                    req.stage === '청구' ? "text-[#0f766e]" : "text-slate-400"
                  )}>
                    {req.stage}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-xs font-mono font-bold text-slate-500">
                    {(req as any).currentStep || '-'}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{req.team}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={req.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-[#1e293b] group-hover:translate-x-1 transition-transform p-1 rounded hover:bg-slate-100">
                    <ChevronRight size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RequestDetail({ request, onBack, onNavigate }: { request: any, onBack: () => void, onNavigate?: (path: string) => void }) {
  return (
    <div className="flex flex-col h-full bg-[#F9FAFB] overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <span className="text-xs font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{request.id}</span>
               <StatusBadge status={request.status} />
            </div>
            <h1 className="text-xl font-bold text-[#1e293b] tracking-tight">{request.customer} 고객 접수 처리 현황</h1>
          </div>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2 shadow-sm">
              <User size={16} /> 고객 상세 정보
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <JourneyHeader requestId={request.id} />
          <JourneyRequirementPanel requestId={request.id} screen="requests" title="요청건 통합 게이트" />
          
          {/* 1. Process Progress Bar */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 mb-6 flex items-center gap-2 uppercase tracking-wide">
              <Clock size={14} /> 전체 진행 단계
            </h3>
            <div className="relative flex items-center justify-between px-4">
              {/* Connection Line */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-slate-200 -z-10 mx-10"></div>
              
              {PROCESS_STEPS.map((step, idx) => {
                const isCompleted = step.status === 'completed';
                const isProcessing = step.status === 'processing';
                const isPending = step.status === 'pending';
                
                return (
                  <div key={step.id} className="flex flex-col items-center gap-3 bg-white px-2">
                    <div className={clsx(
                      "size-8 rounded-full flex items-center justify-center transition-all z-10",
                      isCompleted ? "bg-slate-800 text-white shadow-md" :
                      isProcessing ? "bg-white border-2 border-blue-500 text-blue-600 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]" :
                      "bg-white border border-slate-200 text-slate-300"
                    )}>
                      {isCompleted ? <CheckCircle2 size={16} /> : 
                       isProcessing ? <div className="size-2.5 bg-blue-500 rounded-full animate-pulse" /> :
                       <div className="size-2 bg-slate-200 rounded-full" />
                      }
                    </div>
                    <div className="text-center">
                      <div className={clsx("text-xs font-bold mb-0.5", isPending ? "text-slate-400" : "text-[#1e293b]")}>{step.label}</div>
                      {step.date !== '-' && <div className="text-[10px] text-slate-400 font-mono">{step.date.split(' ')[0]}</div>}
                      {step.manager !== '-' && <div className="text-[10px] text-slate-500 font-medium">{step.manager}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Team Activity Cards (Grid Layout) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Consultation Team Card */}
            <TeamCard 
              title="상담팀 (Consultation)" 
              status={request.status === '이탈(상담)' ? '이탈' : '완료'} 
              manager="김상담" 
              startDate="2026.01.19"
              endDate="2026.01.19"
              icon={<MessageSquare size={16} />}
              onViewDetail={() => onNavigate?.('consultation:' + request.id)}
              reason={request.status === '이탈(상담)' ? "고객 단순 변심으로 인한 중단 요청" : undefined}
              highlightCompletion={request.status !== '이탈(상담)'} // 미팅 인계 완료 강조
            >
              <div className="space-y-4">
                {/* Checkpoints */}
                <div className="space-y-3">
                  <CheckpointItem label="필수 체크 사항 확인" current={9} total={9} />
                  <CheckpointItem label="고객 성향 체크" current={4} total={4} />
                  <CheckpointItem label="파일 업로드" current={3} total={3} />
                </div>

                {/* Handoff Status */}
                {request.status !== '이탈(상담)' && (
                  <div className="mt-2 bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 size={16} className="fill-emerald-100 text-emerald-600" />
                    <span className="text-xs font-bold">미팅 인계 완료</span>
                  </div>
                )}
              </div>
            </TeamCard>

            {/* Meeting Team Card */}
            <TeamCard 
              title="미팅팀 (Meeting)" 
              status="완료" 
              manager="박미팅" 
              startDate="2026.01.21"
              endDate="2026.01.21"
              icon={<Briefcase size={16} />}
              onViewDetail={() => onNavigate?.('meeting-all:' + request.id)}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs bg-blue-50/30 p-2 rounded border border-blue-100/50">
                  <Calendar size={14} className="text-blue-500" />
                  <span className="font-bold text-slate-700">2026.01.21 (수) 14:00</span>
                  <div className="h-3 w-px bg-slate-200 mx-1"></div>
                  <span className="text-slate-600 truncate font-medium">강남역 스타벅스</span>
                </div>

                {/* Contract Signed Section */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                   <div className="flex items-center gap-2 mb-2">
                     <FileText size={14} className="text-slate-500" />
                     <span className="text-xs font-bold text-slate-700">체결 계약 정보</span>
                     <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold ml-auto">체결완료</span>
                   </div>
                   <div className="space-y-1.5">
                     <div className="flex justify-between text-xs">
                       <span className="text-slate-500">보험사</span>
                       <span className="font-medium text-slate-800">삼성화재</span>
                     </div>
                     <div className="flex justify-between text-xs">
                       <span className="text-slate-500">상품명</span>
                       <span className="font-medium text-slate-800 truncate max-w-[140px]">무배당 삼성화재 다이렉트 실손의료비보험</span>
                     </div>
                     <div className="flex justify-between text-xs">
                       <span className="text-slate-500">월 보험료</span>
                       <span className="font-bold text-[#1e293b]">120,000원</span>
                     </div>
                   </div>
                </div>

                {/* CX Checklist */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">고객 경험 (CX) 체크리스트</h4>
                  <div className="space-y-2">
                    {[
                      { label: '앱 설치 안내', checked: true },
                      { label: '신용점수 연동', checked: true },
                      { label: '건강검진 연동', checked: true },
                      { label: '홈택스 연동', checked: false },
                      { label: '가족 초대 발송', checked: true },
                      { label: '가족 연결 완료', checked: false },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className={clsx("flex items-center gap-2", item.checked ? "text-slate-700 font-medium" : "text-slate-400")}>
                          <div className={clsx(
                            "size-3.5 rounded flex items-center justify-center border",
                            item.checked ? "bg-blue-500 border-blue-500 text-white" : "bg-white border-slate-300"
                          )}>
                            {item.checked && <CheckCircle2 size={10} />}
                          </div>
                          {item.label}
                        </span>
                        {item.checked && <span className="text-[10px] text-blue-600 font-bold">완료</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TeamCard>

            {/* Claims Team Card */}
            <TeamCard 
              title="청구팀 (Claims)" 
              status="대기" 
              manager="-" 
              startDate="-"
              endDate="-"
              icon={<FileText size={16} />}
              onViewDetail={() => onNavigate?.('claims-all:' + request.id)}
            >
              <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                <div className="size-10 rounded-full bg-slate-50 flex items-center justify-center mb-2">
                  <AlertCircle size={20} className="opacity-30" />
                </div>
                <span className="text-xs font-medium opacity-60">미팅 완료 후 활성화됩니다.</span>
              </div>
            </TeamCard>

          </div>

          {/* 3. Integrated Activity Timeline */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 mb-6 flex items-center gap-2 uppercase tracking-wide">
              <MoreHorizontal size={14} /> 통합 활동 로그
            </h3>
            <div className="relative pl-4 space-y-8 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
              {ACTIVITIES.map((activity) => (
                <div key={activity.id} className="relative pl-10 group">
                  <div className="absolute left-[15px] top-2 size-2 rounded-full bg-white border-2 border-slate-300 group-hover:border-blue-500 transition-colors z-10 ring-4 ring-white"></div>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                    <div>
                      <div className="font-bold text-sm text-slate-800">{activity.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{activity.desc}</div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="text-[10px] font-mono text-slate-400">{activity.date}</div>
                      <div className="text-[10px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                        {activity.actor}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function TeamCard({ 
  title, 
  status, 
  manager, 
  startDate,
  endDate, 
  icon, 
  onViewDetail,
  children,
  reason,
  highlightCompletion
}: { 
  title: string, 
  status: string, 
  manager: string, 
  startDate: string,
  endDate: string, 
  icon: React.ReactNode, 
  onViewDetail?: () => void,
  children: React.ReactNode,
  reason?: string,
  highlightCompletion?: boolean
}) {
  return (
    <div className={clsx(
      "bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow group",
      highlightCompletion ? "border-emerald-200 shadow-emerald-50 ring-1 ring-emerald-100" : "border-slate-200"
    )}>
      <div className="px-5 py-4 border-b border-slate-50 flex justify-between items-center bg-white">
        <div className="flex items-center gap-3">
          <div className={clsx("p-2 rounded-lg", highlightCompletion ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-500")}>
            {icon}
          </div>
          <div>
            <div className="font-bold text-sm text-[#1e293b]">{title}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
              {status === '완료' ? 'Completed' : status === '대기' ? 'Pending' : status === '이탈' ? 'Dropped' : 'Processing'}
            </div>
          </div>
        </div>
        <span className={clsx(
          "text-[10px] font-bold px-2 py-0.5 rounded border",
          status === '완료' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
          status === '대기' ? "bg-slate-50 text-slate-400 border-slate-100" :
          status === '이탈' ? "bg-red-50 text-red-600 border-red-100" :
          "bg-white text-slate-700 border-slate-300"
        )}>
          {status}
        </span>
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        {/* Manager Info */}
        <div className="grid grid-cols-3 gap-2 text-xs mb-5 pb-4 border-b border-slate-50 border-dashed">
          <div>
            <div className="text-[10px] text-slate-400 mb-1 font-bold">담당자</div>
            <div className="font-bold text-slate-700 truncate" title={manager}>{manager}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 mb-1 font-bold">배정일자</div>
            <div className="font-mono text-slate-600 font-medium truncate" title={startDate}>{startDate}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 mb-1 font-bold">종료일자</div>
            <div className="font-mono text-slate-600 font-medium truncate" title={endDate}>{endDate}</div>
          </div>
        </div>

        {/* Reason for Drop/Cancel */}
        {reason && (
          <div className="mb-4 bg-red-50 border border-red-100 rounded-lg p-3 text-xs">
            <div className="font-bold text-red-700 mb-1 flex items-center gap-1">
              <AlertCircle size={12} /> 중단 사유
            </div>
            <div className="text-red-600">{reason}</div>
          </div>
        )}

        <div className="flex-1">
          {children}
        </div>
      </div>
      
      <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100">
        <button 
          onClick={onViewDetail}
          className="text-xs font-bold text-slate-500 hover:text-[#1e293b] flex items-center justify-between w-full transition-colors"
        >
          <span>상세 업무 보기</span>
          <ChevronRight size={14} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>
      </div>
    </div>
  );
}

function CheckpointItem({ label, current, total }: { label: string, current: number, total: number }) {
  const percentage = Math.round((current / total) * 100);
  const isComplete = current === total;

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className={clsx("text-xs font-medium", isComplete ? "text-slate-700" : "text-slate-500")}>
          {label}
        </span>
        <span className={clsx("text-[10px] font-bold", isComplete ? "text-emerald-600" : "text-slate-400")}>
          {current}/{total}
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={clsx("h-full rounded-full transition-all duration-500", isComplete ? "bg-emerald-500" : "bg-blue-500")} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    '진행 중': 'bg-blue-50 text-blue-700 border-blue-200',
    '완료': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    '보완 요청': 'bg-amber-50 text-amber-700 border-amber-200',
    '이탈(상담)': 'bg-slate-50 text-slate-500 border-slate-200',
    '접수': 'bg-slate-50 text-slate-600 border-slate-200'
  };
  
  return (
    <span className={clsx("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border shadow-sm", styles[status as keyof typeof styles] || styles['접수'])}>
      {status}
    </span>
  );
}
