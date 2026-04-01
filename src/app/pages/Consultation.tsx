import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Filter, 
  Save, 
  CheckCircle2, 
  ArrowLeft,
  FileText,
  MessageCircle,
  MessageSquare,
  ChevronRight,
  HelpCircle,
  AlertTriangle,
  Users,
  ListTodo,
  Globe,
  CalendarDays,
  MapPin,
  DollarSign,
  ClipboardCheck,
  Mic,
  FileSearch,
  Bell,
} from 'lucide-react';
import clsx from 'clsx';
import { format, subDays } from 'date-fns';
import { detectCriticalCondition, evaluateCutRules } from '@/app/journey/rules';
import { MOCK_DATA, getHiraPreFill } from '@/app/mockData';
import { RefundAndMeetingInfo } from '@/app/components/RefundAndMeetingInfo';
import { CustomerInputSection } from '@/app/components/CustomerInputSection';
import { HealthCheckSection } from '@/app/components/HealthCheckSection';
import { CustomerProfileSummary } from '@/app/components/CustomerProfileSummary';
import { StepStageSelector, ValidationState } from '@/app/components/StepStageSelector';
import { FileAttachmentSection, FileAttachment } from '@/app/components/FileAttachmentSection';
import LiveRecordSection from '@/imports/Container-168-10370';
import { CustomerDetailPanel } from '@/app/components/CustomerDetailPanel';
import { ListPeriodControls } from '@/app/components/ListPeriodControls';
import {
  EmployeeStepMatrixOverview,
  EmployeeStepOwnerDetail,
  type EmployeeStepMatrixItem,
} from '@/app/components/operations/EmployeeStepMatrixOverview';
import {
  filterRowsByPeriod,
  getDefaultCustomPeriodRange,
  getPerformancePeriodRange,
  getRowsDateBounds,
  type PerformancePeriodPreset,
} from '@/app/issuance/performancePeriodUtils';

export interface ConsultationProps {
  type?: 'refund' | 'simple'; // 3년 환급 | 간편 청구
  initialRequestId?: string | null;
  /** TM 단계 필터: 'first' = 1차TM만, 'second' = 2차TM만, 'checklist' = 인계 체크리스트만 */
  tmStageFilter?: 'first' | 'second' | 'checklist';
}

// Helper to normalize type
const normalizeType = (rawType: string): '3년 환급' | '간편 청구' => {
   if (rawType.includes('환급') || rawType.includes('분석') || rawType.includes('정밀')) {
      return '3년 환급';
   }
   return '간편 청구';
};

function formatConsultationRegion(address?: string) {
  if (!address) {
    return '-';
  }

  return address.split(' ').slice(0, 2).join(' ');
}

const CONSULTATION_STEPS = [
  { key: 'step0', label: 'STEP 0', shortLabel: '배정대기' },
  { key: 'step1', label: 'STEP 1', shortLabel: '1차콜' },
  { key: 'step2', label: 'STEP 2', shortLabel: '2차콜' },
  { key: 'step3', label: 'STEP 3', shortLabel: '미팅인계' },
] as const;

type ConsultationStepKey = (typeof CONSULTATION_STEPS)[number]['key'];

interface ConsultationStepMeta {
  employeeStepKey: ConsultationStepKey;
  stageLabel: string;
  decisionStepKey?: ConsultationStepKey;
  decisionLabel?: string;
  decisionMarker?: 'absence' | 'success' | 'fail';
  terminalReason?: string;
  stepDates: Partial<Record<ConsultationStepKey, string>>;
}

function buildConsultationStepDates(dateLabel: string, reachedKeys: ConsultationStepKey[]) {
  const matched = dateLabel.match(/\d{4}-\d{2}-\d{2}/);
  if (!matched) {
    return {} as Partial<Record<ConsultationStepKey, string>>;
  }

  const baseDate = new Date(`${matched[0]}T00:00:00`);
  if (Number.isNaN(baseDate.getTime())) {
    return {} as Partial<Record<ConsultationStepKey, string>>;
  }

  const orderedReachedKeys = CONSULTATION_STEPS.map((step) => step.key).filter((stepKey) =>
    reachedKeys.includes(stepKey)
  );
  if (!orderedReachedKeys.length) {
    return {} as Partial<Record<ConsultationStepKey, string>>;
  }

  return orderedReachedKeys.reduce((acc, stepKey, index) => {
    acc[stepKey] = format(subDays(baseDate, orderedReachedKeys.length - 1 - index), 'MM.dd');
    return acc;
  }, {} as Partial<Record<ConsultationStepKey, string>>);
}

function inferConsultationDecisionStep(content: string) {
  return /2차|재통화|재콜|재연락|다시 연락|후 재시도|추가 보장|가족과 상의|배우자와 상의/.test(content)
    ? 'step2'
    : ('step1' as ConsultationStepKey);
}

function getConsultationStepMeta(item: { date: string; status: string; result: string; content: string }): ConsultationStepMeta {
  if (item.status === '대기') {
    return {
      employeeStepKey: 'step0',
      stageLabel: '배정대기',
      stepDates: buildConsultationStepDates(item.date, ['step0']),
    };
  }

  if (item.result === '부재') {
    const decisionStepKey = inferConsultationDecisionStep(item.content);
    return {
      employeeStepKey: decisionStepKey,
      stageLabel: CONSULTATION_STEPS.find((step) => step.key === decisionStepKey)?.shortLabel ?? '콜 진행',
      decisionStepKey,
      decisionLabel: '부재',
      decisionMarker: 'absence',
      stepDates: buildConsultationStepDates(
        item.date,
        decisionStepKey === 'step2' ? ['step0', 'step1', 'step2'] : ['step0', 'step1']
      ),
    };
  }

  if (item.status === '취소' || /취소/.test(item.content)) {
    const decisionStepKey = inferConsultationDecisionStep(item.content);
    return {
      employeeStepKey: decisionStepKey,
      stageLabel: CONSULTATION_STEPS.find((step) => step.key === decisionStepKey)?.shortLabel ?? '상담 진행',
      decisionStepKey,
      decisionLabel: '취소',
      decisionMarker: 'fail',
      terminalReason: item.content,
      stepDates: buildConsultationStepDates(
        item.date,
        decisionStepKey === 'step2' ? ['step0', 'step1', 'step2', 'step3'] : ['step0', 'step1', 'step3']
      ),
    };
  }

  if (item.result === '실패' || /불가/.test(item.content)) {
    const decisionStepKey = inferConsultationDecisionStep(item.content);
    return {
      employeeStepKey: decisionStepKey,
      stageLabel: CONSULTATION_STEPS.find((step) => step.key === decisionStepKey)?.shortLabel ?? '상담 진행',
      decisionStepKey,
      decisionLabel: '불가',
      decisionMarker: 'fail',
      terminalReason: item.content,
      stepDates: buildConsultationStepDates(
        item.date,
        decisionStepKey === 'step2' ? ['step0', 'step1', 'step2', 'step3'] : ['step0', 'step1', 'step3']
      ),
    };
  }

  if (item.status === '완료') {
    const decisionStepKey = inferConsultationDecisionStep(item.content);
    return {
      employeeStepKey: 'step3',
      stageLabel: '미팅인계',
      decisionStepKey,
      decisionLabel: '미팅인계완료',
      decisionMarker: 'success',
      stepDates: buildConsultationStepDates(
        item.date,
        decisionStepKey === 'step2' ? ['step0', 'step1', 'step2', 'step3'] : ['step0', 'step1', 'step3']
      ),
    };
  }

  if (item.status === '진행중' && item.result === '보류') {
    return {
      employeeStepKey: 'step2',
      stageLabel: '2차콜',
      stepDates: buildConsultationStepDates(item.date, ['step0', 'step1', 'step2']),
    };
  }

  const activeStepKey = inferConsultationDecisionStep(item.content);
  return {
    employeeStepKey: activeStepKey,
    stageLabel: activeStepKey === 'step2' ? '2차콜' : '1차콜',
    stepDates: buildConsultationStepDates(item.date, activeStepKey === 'step2' ? ['step0', 'step1', 'step2'] : ['step0', 'step1']),
  };
}

export function Consultation({ type, initialRequestId, tmStageFilter }: ConsultationProps) {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedStaffOwner, setSelectedStaffOwner] = useState<string | null>(null);

  useEffect(() => {
    if (initialRequestId) {
      // Find item by requestId
      const item = MOCK_DATA?.consultations?.find(c => c.requestId === initialRequestId);
      if (item) {
        // Hydrate item with customer info (logic copied from list)
        const customer = MOCK_DATA?.customers?.find(cust => cust.id === item.customerId);
        const request = MOCK_DATA?.requests?.find(r => r.id === item.requestId);
        const rawType = request?.type || '간편 청구';
        const normalizedType = normalizeType(rawType);
        
        const hydratedItem = {
           ...item,
           customerName: customer?.name || 'Unknown',
           customerAddr: customer?.address || '',
           displayType: normalizedType
        };
        
        setSelectedItem(hydratedItem);
        setView('detail');
      }
    }
  }, [initialRequestId]);

  const handleSelect = (item: any) => {
    setSelectedItem(item);
    setView('detail');
  };

  const handleBack = () => {
    setSelectedItem(null);
    setView('list');
  };

  if (view === 'detail' && selectedItem) {
     return <ConsultationDetail item={selectedItem} onBack={handleBack} type={type} />;
  }

  if (selectedStaffOwner) {
    return (
      <ConsultationStaffDetailPage
        ownerName={selectedStaffOwner}
        type={type}
        onBack={() => setSelectedStaffOwner(null)}
        onSelect={handleSelect}
      />
    );
  }

  return <ConsultationList onSelect={handleSelect} onSelectStaffOwner={setSelectedStaffOwner} type={type} />;
}

function ConsultationList({
  onSelect,
  onSelectStaffOwner,
  type,
}: {
  onSelect: (item: any) => void;
  onSelectStaffOwner: (ownerName: string | null) => void;
  type?: 'refund' | 'simple';
}) {
  const defaultCustomPeriodRange = useMemo(() => getDefaultCustomPeriodRange(), []);
  const [periodPreset, setPeriodPreset] = useState<PerformancePeriodPreset>('this_month');
  const [customPeriodStartDate, setCustomPeriodStartDate] = useState(defaultCustomPeriodRange.startDate);
  const [customPeriodEndDate, setCustomPeriodEndDate] = useState(defaultCustomPeriodRange.endDate);
  const [activeTab, setActiveTab] = useState<'list' | 'staff' | 'quality'>('list');
  const consultations = MOCK_DATA?.consultations || [];
  const customers = MOCK_DATA?.customers || [];
  const requests = MOCK_DATA?.requests || [];

  const data = consultations.map(c => {
    const customer = customers.find(cust => cust.id === c.customerId);
    const request = requests.find(r => r.id === c.requestId);
    const rawType = request?.type || '간편 청구';
    const normalizedType = normalizeType(rawType);

    return {
       ...c,
       customerName: customer?.name || 'Unknown',
       customerAddr: customer?.address || '',
       displayType: normalizedType // '3년 환급' or '간편 청구'
    };
  }).filter(item => {
    if (!type) return true;
    if (type === 'refund') return item.displayType === '3년 환급';
    if (type === 'simple') return item.displayType === '간편 청구';
    return true;
  });

  const title = type === 'refund' ? '3년 환급 상담 리스트' 
              : type === 'simple' ? '간편 청구 상담 리스트' 
              : '상담 리스트 (전체)';
  
  const description = type === 'refund' ? '미지급금 분석 및 환급 유도 상담' 
                    : type === 'simple' ? '기존 고객 보험금 청구 대행 및 유지 관리' 
                    : '3년 환급 및 간편 청구 전체 상담 대기열';

  const periodRange = useMemo(
    () =>
      getPerformancePeriodRange(
        periodPreset,
        customPeriodStartDate,
        customPeriodEndDate,
        new Date(),
        getRowsDateBounds(data, (item) => item.date, defaultCustomPeriodRange)
      ),
    [customPeriodEndDate, customPeriodStartDate, data, defaultCustomPeriodRange, periodPreset]
  );

  const filteredByPeriod = useMemo(
    () => filterRowsByPeriod(data, periodRange, (item) => item.date),
    [data, periodRange]
  );

  const staffItems = useMemo<EmployeeStepMatrixItem<any>[]>(
    () =>
      filteredByPeriod.map((item) => {
        const stepMeta = getConsultationStepMeta(item);

        return {
          id: item.id,
          customerName: item.customerName,
          ownerName: item.manager,
          typeLabel: item.displayType,
          dateLabel: item.date,
          stageLabel: stepMeta.stageLabel,
          summaryLabel: item.content,
          regionLabel: formatConsultationRegion(item.customerAddr),
          completed: stepMeta.employeeStepKey === 'step3',
          employeeStepKey: stepMeta.employeeStepKey,
          decisionStepKey: stepMeta.decisionStepKey,
          decisionLabel: stepMeta.decisionLabel,
          decisionMarker: stepMeta.decisionMarker,
          stepDates: stepMeta.stepDates,
          terminalReason: stepMeta.terminalReason,
          original: item,
        };
      }),
    [filteredByPeriod]
  );

  useEffect(() => {
    if (activeTab !== 'staff') {
      return;
    }
  }, [activeTab]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="font-bold text-[#1e293b]">{title}</h2>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
           <ListPeriodControls
             preset={periodPreset}
             range={periodRange}
             onPresetChange={setPeriodPreset}
             onStartDateChange={setCustomPeriodStartDate}
             onEndDateChange={setCustomPeriodEndDate}
           />
           <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-600 hover:bg-slate-50 cursor-pointer">
            <Filter size={16} /> 필터
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white px-6 py-3">
        <div className="inline-flex rounded-full bg-slate-100 p-1">
          {[
            { key: 'list', label: '건별 목록' },
            { key: 'staff', label: '직원 현황' },
            { key: 'quality', label: '품질 모니터링' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as 'list' | 'staff' | 'quality')}
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
        {activeTab === 'quality' ? (
          <QualityMonitoringPanel data={filteredByPeriod} />
        ) : activeTab === 'staff' ? (
          <div className="p-6">
            <EmployeeStepMatrixOverview
              items={staffItems}
              steps={CONSULTATION_STEPS}
              emptyMessage="기간 내 확인할 상담 담당자 데이터가 없습니다."
              onSelectOwner={onSelectStaffOwner}
            />
          </div>
        ) : filteredByPeriod.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <ListTodo size={48} className="mb-4 opacity-20" />
              <p>해당하는 상담 내역이 없습니다.</p>
           </div>
        ) : (
           <table className="w-full text-sm text-left">
             <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 sticky top-0">
               <tr>
                 <th className="px-6 py-3 font-medium">접수 ID</th>
                 <th className="px-6 py-3 font-medium">고객명 / 지역</th>
                 <th className="px-6 py-3 font-medium">유형</th>
                 <th className="px-6 py-3 font-medium">배정일</th>
                 <th className="px-6 py-3 font-medium">상태</th>
                 <th className="px-6 py-3 font-medium">최근 이력</th>
                 <th className="px-6 py-3 font-medium text-right">처리</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {filteredByPeriod.map((item) => (
                 <tr 
                   key={item.id} 
                   className="hover:bg-slate-50 transition-colors cursor-pointer group"
                   onClick={() => onSelect(item)}
                 >
                   <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">{item.requestId}</td>
                   <td className="px-6 py-4">
                     <div className="font-bold text-[#1e293b]">
                        {item.customerName}
                        <span className="text-xs font-normal text-slate-400 ml-1">
                           / {item.customerAddr.split(' ').slice(0, 2).join(' ')}
                        </span>
                     </div>
                   </td>
                   <td className="px-6 py-4">
                      <span className={clsx(
                         "px-2 py-0.5 rounded text-[10px] font-bold border",
                         item.displayType === '3년 환급' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                         "bg-emerald-50 text-emerald-700 border-emerald-100"
                      )}>
                         {item.displayType}
                      </span>
                   </td>
                   <td className="px-6 py-4 text-slate-600">{item.date}</td>
                   <td className="px-6 py-4">
                     <span className={clsx(
                        "inline-flex px-2 py-0.5 rounded border text-xs font-bold",
                        item.result === '거절' ? "bg-rose-50 text-rose-700 border-rose-100" :
                        item.status === '완료' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                        "bg-blue-50 text-blue-700 border-blue-100"
                     )}>
                       {item.status === '완료' ? item.result : item.status}
                     </span>
                   </td>
                   <td className="px-6 py-4 text-slate-500 text-xs truncate max-w-[200px]">{item.content}</td>
                   <td className="px-6 py-4 text-right">
                     <button className="text-white bg-[#1e293b] px-3 py-1.5 rounded text-xs hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100">
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

function ConsultationStaffDetailPage({
  ownerName,
  type,
  onBack,
  onSelect,
}: {
  ownerName: string;
  type?: 'refund' | 'simple';
  onBack: () => void;
  onSelect: (item: any) => void;
}) {
  const defaultCustomPeriodRange = useMemo(() => getDefaultCustomPeriodRange(), []);
  const [periodPreset, setPeriodPreset] = useState<PerformancePeriodPreset>('this_month');
  const [customPeriodStartDate, setCustomPeriodStartDate] = useState(defaultCustomPeriodRange.startDate);
  const [customPeriodEndDate, setCustomPeriodEndDate] = useState(defaultCustomPeriodRange.endDate);
  const consultations = MOCK_DATA?.consultations || [];
  const customers = MOCK_DATA?.customers || [];
  const requests = MOCK_DATA?.requests || [];

  const data = consultations
    .map((c) => {
      const customer = customers.find((cust) => cust.id === c.customerId);
      const request = requests.find((r) => r.id === c.requestId);
      const rawType = request?.type || '간편 청구';
      const normalizedType = normalizeType(rawType);

      return {
        ...c,
        customerName: customer?.name || 'Unknown',
        customerAddr: customer?.address || '',
        displayType: normalizedType,
      };
    })
    .filter((item) => {
      if (!type) return true;
      if (type === 'refund') return item.displayType === '3년 환급';
      if (type === 'simple') return item.displayType === '간편 청구';
      return true;
    });

  const periodRange = useMemo(
    () =>
      getPerformancePeriodRange(
        periodPreset,
        customPeriodStartDate,
        customPeriodEndDate,
        new Date(),
        getRowsDateBounds(data, (item) => item.date, defaultCustomPeriodRange)
      ),
    [customPeriodEndDate, customPeriodStartDate, data, defaultCustomPeriodRange, periodPreset]
  );

  const filteredByPeriod = useMemo(
    () => filterRowsByPeriod(data, periodRange, (item) => item.date),
    [data, periodRange]
  );

  const staffItems = useMemo<EmployeeStepMatrixItem<any>[]>(
    () =>
      filteredByPeriod.map((item) => {
        const stepMeta = getConsultationStepMeta(item);

        return {
          id: item.id,
          customerName: item.customerName,
          ownerName: item.manager,
          typeLabel: item.displayType,
          dateLabel: item.date,
          stageLabel: stepMeta.stageLabel,
          summaryLabel: item.content,
          regionLabel: formatConsultationRegion(item.customerAddr),
          completed: stepMeta.employeeStepKey === 'step3',
          employeeStepKey: stepMeta.employeeStepKey,
          decisionStepKey: stepMeta.decisionStepKey,
          decisionLabel: stepMeta.decisionLabel,
          decisionMarker: stepMeta.decisionMarker,
          stepDates: stepMeta.stepDates,
          terminalReason: stepMeta.terminalReason,
          original: item,
        };
      }),
    [filteredByPeriod]
  );

  const title = type === 'refund' ? '3년 환급 상담 리스트' : type === 'simple' ? '간편 청구 상담 리스트' : '상담 리스트 (전체)';
  const description = type === 'refund' ? '미지급금 분석 및 환급 유도 상담' : type === 'simple' ? '기존 고객 보험금 청구 대행 및 유지 관리' : '3년 환급 및 간편 청구 전체 상담 대기열';

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="font-bold text-[#1e293b]">{title}</h2>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <ListPeriodControls
            preset={periodPreset}
            range={periodRange}
            onPresetChange={setPeriodPreset}
            onStartDateChange={setCustomPeriodStartDate}
            onEndDateChange={setCustomPeriodEndDate}
          />
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            직원 현황으로
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <EmployeeStepOwnerDetail
          ownerName={ownerName}
          items={staffItems}
          steps={CONSULTATION_STEPS}
          stageColumnLabel="상담 단계"
          summaryColumnLabel="상담 메모"
          dateColumnLabel="배정일"
          emptyMessage="기간 내 확인할 상담 담당자 데이터가 없습니다."
          onSelectItem={onSelect}
        />
      </div>
    </div>
  );
}

// --- Layout Components & Data ---

function ConsultationDetail({ item, onBack, type }: { item: any, onBack: () => void, type?: 'refund' | 'simple' }) {
   // Form State
   const [activeTab, setActiveTab] = useState('script1');
   const [showHelp, setShowHelp] = useState(false);
   const [showAlert, setShowAlert] = useState(false);
   const [highlightSection, setHighlightSection] = useState<string | null>(null);
   const [centerTab, setCenterTab] = useState<'customer' | 'checklist' | 'script'>('customer');
   
   // Fact Check State
   const [insuranceType, setInsuranceType] = useState('실손+종합');
   const [monthlyPremium, setMonthlyPremium] = useState('25');
   const [paymentStatus, setPaymentStatus] = useState('정상');
   const [contractor, setContractor] = useState('본인/본인');
   const [joinPath, setJoinPath] = useState('관계 없음');
   
   const [trafficAccident, setTrafficAccident] = useState('없음');
   const [trafficAccidentDetail, setTrafficAccidentDetail] = useState('');
   const [surgery, setSurgery] = useState('있음');
   const [surgeryOptions, setSurgeryOptions] = useState<string[]>([]);
   const [surgeryDetail, setSurgeryDetail] = useState('2023년 5월 내시경 검사 중 위 용종 제거 시술, 2022년 7월 백내장 수술 (우안), 2021년 3월 치핵 제거 수술');
   const [criticalDisease, setCriticalDisease] = useState('없음');
   const [criticalOptions, setCriticalOptions] = useState<string[]>([]);
   const [criticalDiseaseDetail, setCriticalDiseaseDetail] = useState('');
   const [medication, setMedication] = useState('없음');
   const [medicationDetail, setMedicationDetail] = useState('');
   const [companion, setCompanion] = useState('없음');
   const [companionDetail, setCompanionDetail] = useState('');
   const [companions, setCompanions] = useState<Array<{ name: string; relationship: string; phone: string }>>([
      { name: '', relationship: '관계 선택', phone: '' }
   ]);
   const [insuranceStatus, setInsuranceStatus] = useState('있음');
   
   // Step Stage State (controlled)
   const [currentStep, setCurrentStep] = useState<string>('step1');
   const [selectedStatus, setSelectedStatus] = useState<string>('waiting');
   const [selectedReason, setSelectedReason] = useState<string>('');
   
   // 미팅 예약 (3차 TM) 필수 항목
   const [refundEstimate, setRefundEstimate] = useState('');
   const [feeNotified, setFeeNotified] = useState(false);
   const [meetingDate, setMeetingDate] = useState('');
   const [meetingTime, setMeetingTime] = useState('');
   const [meetingLocation, setMeetingLocation] = useState('');
   
   // 인계 체크리스트
   const [recording1stAttached, setRecording1stAttached] = useState(false);
   const [recording2ndAttached, setRecording2ndAttached] = useState(false);
   const [simpyeongwonAttached, setSimpyeongwonAttached] = useState(false);
   const [handoffMemo, setHandoffMemo] = useState('');
   const [absentAlimtalkSent, setAbsentAlimtalkSent] = useState(false);
   
   const [disposition, setDisposition] = useState<string>('중립');
   const [trustLevel, setTrustLevel] = useState<string>('보통');
   const [bestTime, setBestTime] = useState<string>('무관');
   const [decisionMaker, setDecisionMaker] = useState<string>('본인');
   const [traitNote, setTraitNote] = useState<string>('상담 시 목소리가 작으시고, 꼼꼼하게 질문하시는 편입니다.');
   const [attachments, setAttachments] = useState<FileAttachment[]>([
      { id: '1', name: '가족관계증명서.pdf', size: 1024 * 450, type: 'application/pdf', progress: 100, status: 'completed' },
      { id: '2', name: '보험증권_메리츠.jpg', size: 1024 * 2500, type: 'image/jpeg', progress: 100, status: 'completed' },
      { id: '3', name: '건강검진결과서.pdf', size: 1024 * 5100, type: 'application/pdf', progress: 100, status: 'completed' }
   ]);
   
   const customer = MOCK_DATA.customers.find(c => c.id === item.customerId);
   const hiraPreFill = getHiraPreFill(item.customerId);
   
   // ======== Validation State Computation ========
   const validationState: ValidationState = useMemo(() => ({
      // Step 1→2 (1차 상담 기본 확인)
      identityVerified: true,    // 본인 확인 (기본값: 완료)
      addressVerified: true,     // 거주지 확인 (기본값: 완료)
      accountVerified: true,     // 환급계좌 확인 (기본값: 완료)
      // Step 2→3
      insuranceChecked: insuranceStatus === '있음' || insuranceStatus === '없음',
      premiumEntered: insuranceStatus === '없음' || (insuranceStatus === '있음' && monthlyPremium !== ''),
      paymentStatusChecked: insuranceStatus === '없음' || paymentStatus !== '',
      contractorChecked: insuranceStatus === '없음' || contractor !== '',
      // Step 3→4
      designerRelationChecked: insuranceStatus === '없음' || joinPath !== '',
      healthCheckCompleted: trafficAccident !== '' && surgery !== '' && criticalDisease !== '' && medication !== '',
      exceptionDiseaseChecked: true, // 2차 상담에서 체크
      // Step 4 - 미팅 인계
      refundAmountEntered: refundEstimate !== '',
      feeNotified,
      meetingScheduleConfirmed: meetingDate !== '' && meetingTime !== '' && meetingLocation !== '',
      recordingAttached: recording1stAttached || recording2ndAttached,
      simpyeongwonAttached,
      // 자동 불가 판정
      noInsurance: insuranceStatus === '없음',
      paymentDefaulted: paymentStatus === '미납 중' || paymentStatus === '실효됨',
      designerRelative: joinPath === '가족' || joinPath === '지인',
      criticalDiseaseActive: criticalDisease === '있음' && criticalOptions.length > 0,
      ageOver70: false, // 나이 정보 연동 필요
   }), [
      insuranceStatus, monthlyPremium, paymentStatus, contractor,
      joinPath, trafficAccident, surgery, criticalDisease, criticalOptions, medication,
      refundEstimate, feeNotified, meetingDate, meetingTime, meetingLocation,
      recording1stAttached, recording2ndAttached, simpyeongwonAttached,
   ]);
   
   // 자동 불가 사유 계산
   const autoBlockReasons: string[] = useMemo(() => {
      const reasons: string[] = [];
      if (validationState.noInsurance && insuranceStatus === '없음') {
         reasons.push('보험 미가입 → 서비스 제공 불가');
      }
      if (validationState.paymentDefaulted) {
         reasons.push(`보험 ${paymentStatus} → 보험금 지급 불가`);
      }
      if (validationState.designerRelative) {
         reasons.push(`기존 설계사와 ${joinPath} 관계 → 보상담당자 지정 불가`);
      }
      return reasons;
   }, [validationState, insuranceStatus, paymentStatus, joinPath]);

   // A-6: 중대질환 자동 감지 (criticalOptions + criticalDiseaseDetail 기반)
   const criticalDetection = useMemo(() => {
      const allText = [...criticalOptions, criticalDiseaseDetail].join(' ');
      if (!allText.trim()) return null;
      return detectCriticalCondition(allText);
   }, [criticalOptions, criticalDiseaseDetail]);

   // Cut-rule 자동 평가 (부재횟수, 거절, 중대질환, 무응답 기간)
   const cutRuleResult = useMemo(() => {
      // Mock: 실제로는 서버에서 contactAttempts, lastContactAt 가져옴
      const mockContactAttempts = selectedStatus === 'absent' ? 5 : (selectedStatus === 'waiting' ? 0 : 2);
      const isRefusal = ['cancel', 'impossible', '1st-cancel', '2nd-cancel'].includes(selectedStatus);
      return evaluateCutRules({
        contactAttempts: mockContactAttempts,
        explicitRefusal: isRefusal,
        isCritical: criticalDetection?.isCritical ?? false,
        daysSinceLastContact: 0,
      });
   }, [selectedStatus, criticalDetection]);

   // Refs for scrolling to sections
   const insuranceRef = useRef<HTMLDivElement>(null);
   const trafficAccidentRef = useRef<HTMLDivElement>(null);
   const surgeryRef = useRef<HTMLDivElement>(null);
   const criticalDiseaseRef = useRef<HTMLDivElement>(null);
   const medicationRef = useRef<HTMLDivElement>(null);
   const designerRelationRef = useRef<HTMLDivElement>(null);
   const companionRef = useRef<HTMLDivElement>(null);
   const traitsRef = useRef<HTMLDivElement>(null);
   
   // Scroll to section function
   const scrollToSection = (ref: React.RefObject<HTMLDivElement>, sectionId: string) => {
      if (ref.current) {
         ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
         setHighlightSection(sectionId);
         setTimeout(() => setHighlightSection(null), 2000);
      }
   };
   
   // Handle card click from LiveRecordSection
   const handleCardClick = (sectionId: string) => {
      const refMap: { [key: string]: React.RefObject<HTMLDivElement> } = {
         'insuranceType': insuranceRef,
         'monthlyPremium': insuranceRef,
         'paymentStatus': insuranceRef,
         'contractor': insuranceRef,
         'joinPath': designerRelationRef,
         'trafficAccident': trafficAccidentRef,
         'surgery': surgeryRef,
         'criticalDisease': criticalDiseaseRef,
         'medication': medicationRef,
         'companion': companionRef,
         'disposition': traitsRef,
         'trustLevel': traitsRef,
         'bestTime': traitsRef,
         'decisionMaker': traitsRef,
         'traitNote': traitsRef
      };
      
      const highlightMap: { [key: string]: string } = {
         'insuranceType': 'insurance',
         'monthlyPremium': 'insurance',
         'paymentStatus': 'insurance',
         'contractor': 'insurance',
         'joinPath': 'designerRelation',
         'trafficAccident': 'trafficAccident',
         'surgery': 'surgery',
         'criticalDisease': 'criticalDisease',
         'medication': 'medication',
         'companion': 'companion',
         'disposition': 'traits',
         'trustLevel': 'traits',
         'bestTime': 'traits',
         'decisionMaker': 'traits',
         'traitNote': 'traits'
      };
      
      const ref = refMap[sectionId];
      const highlight = highlightMap[sectionId];
      
      if (ref) {
         scrollToSection(ref, highlight);
      }
   };

   return (
      <div className="flex flex-col h-full bg-[#F6F7F9] overflow-hidden -m-4">
         {/* Header */}
         <div className="bg-white border-b border-slate-200 shrink-0 z-10">
            <div className="px-6 py-4 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                     <ArrowLeft size={20} />
                  </button>
                  <div>
                     <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{item.requestId}</span>
                        <span className="text-xs font-bold text-[#0f766e]">{item.displayType}</span>
                     </div>
                     <h1 className="text-xl font-bold text-[#1e293b]">
                        {item.customerName} 고객 상담 처리 
                     </h1>
                  </div>
               </div>
               <RefundAndMeetingInfo />
            </div>
         </div>

         {/* 3-Column Layout: 1.5 : 7 : 1.5 */}
         <div className="flex flex-col lg:flex-row flex-1 overflow-auto lg:overflow-hidden">
            
            {/* Left Panel: Input Form */}
            <div className="w-full lg:flex-[1.5] lg:w-auto lg:min-w-[320px] bg-white lg:border-r border-b lg:border-b-0 border-slate-200 overflow-y-auto shrink-0 flex flex-col custom-scrollbar relative">
               <div className="p-4 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
                  <h2 className="font-bold text-[#1e293b] flex items-center gap-2 text-sm">
                     <CheckCircle2 size={16} className="text-[#0f766e]" /> 상담 결과 입력
                  </h2>
               </div>
               
               <div className="p-4 space-y-8 pb-24">
                  {/* Step 1 - 4단계 프로세스 */}
                  <StepStageSelector
                     currentStep={currentStep}
                     selectedStatus={selectedStatus}
                     selectedReason={selectedReason}
                     onStepChange={setCurrentStep}
                     onStatusChange={setSelectedStatus}
                     onReasonChange={setSelectedReason}
                     validationState={validationState}
                     autoBlockReasons={autoBlockReasons}
                  />

                  {/* A-6: 중대질환 자동 감지 배너 */}
                  {criticalDetection?.isCritical && (
                     <div className="bg-rose-50 border border-rose-300 rounded-lg px-4 py-3 flex items-start gap-3">
                        <AlertTriangle size={18} className="text-rose-500 mt-0.5 shrink-0" />
                        <div>
                           <p className="text-xs font-bold text-rose-700">중대질환 감지됨</p>
                           <p className="text-[11px] text-rose-600 mt-0.5">
                              감지 키워드: <span className="font-bold">{criticalDetection.matchedKeywords.join(', ')}</span>
                              — 팀리드 확인 및 별도 프로세스 필요
                           </p>
                        </div>
                     </div>
                  )}

                  {/* Cut-rule 자동 판정 배너 */}
                  {cutRuleResult.shouldCut && (
                     <div className="bg-orange-50 border border-orange-300 rounded-lg px-4 py-3 flex items-start gap-3">
                        <AlertTriangle size={18} className="text-orange-600 mt-0.5 shrink-0" />
                        <div className="flex-1">
                           <p className="text-xs font-bold text-orange-800">Cut-rule 해당 — 진행중단 권고</p>
                           <p className="text-[11px] text-orange-700 mt-0.5">
                              사유: <span className="font-bold">{cutRuleResult.reason}</span>
                              — 이탈 처리 또는 팀장 판단이 필요합니다.
                           </p>
                           <div className="flex gap-2 mt-2">
                              <button className="px-2.5 py-1 text-[11px] font-bold bg-orange-600 text-white rounded hover:bg-orange-700">
                                 이탈 처리
                              </button>
                              <button className="px-2.5 py-1 text-[11px] font-bold text-orange-700 bg-white border border-orange-300 rounded hover:bg-orange-50">
                                 팀장 검토 요청
                              </button>
                           </div>
                        </div>
                     </div>
                  )}

                  {/* Divider */}
                  <div className="bg-[#f1f5f9] h-px" />

                  {/* Step 2 */}
                  <div className="space-y-2">
                     <p className="text-[11px] font-bold text-[#62748e] tracking-[0.06px] uppercase">STEP 2. 필수 확인 (FACT CHECK)</p>
                     
                     {/* Insurance Info */}
                     <div 
                        ref={insuranceRef}
                        className={clsx(
                           "bg-[#f8fafc] border border-[#e2e8f0] rounded p-3 space-y-4 transition-all duration-500",
                           highlightSection === 'insurance' && "ring-2 ring-blue-400 bg-blue-50/30"
                        )}
                     >
                        <div className="border-b border-[#e2e8f0] pb-2">
                           <p className="text-xs font-bold text-[#314158]">보험 정보 확인</p>
                        </div>
                        
                        <div className="space-y-1.5">
                           <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-[#314158]">1. 보험 가입 현황</p>
                              <div className="bg-[#f1f5f9] rounded flex p-0.5">
                                 <button
                                    onClick={() => {
                                        setInsuranceStatus('없음');
                                        setInsuranceType('없음');
                                     }}
                                    className={clsx(
                                       "px-2 py-1 rounded text-[10px] transition-all tracking-wide",
                                       insuranceStatus === '없음'
                                          ? "bg-white text-[#62748e] font-bold shadow-sm"
                                          : "text-[#90a1b9] font-medium"
                                    )}
                                 >
                                    없음
                                 </button>
                                 <button
                                    onClick={() => setInsuranceStatus('있음')}
                                    className={clsx(
                                       "px-2 py-1 rounded text-[10px] font-bold transition-all tracking-wide shadow-sm",
                                       insuranceStatus === '있음'
                                          ? "bg-[#155dfc] text-white"
                                          : "text-[#90a1b9] font-medium"
                                    )}
                                 >
                                    있음
                                 </button>
                              </div>
                           </div>
                           {insuranceStatus === '있음' && (
                               <div className="grid grid-cols-3 gap-1">
                                  {['실손+종합', '실손', '종합'].map(type => (
                                     <button 
                                        key={type}
                                        onClick={() => setInsuranceType(type)}
                                        className={clsx(
                                           "py-1.5 text-xs font-bold rounded border transition-colors",
                                           insuranceType === type 
                                              ? "bg-[#155dfc] text-white border-[#155dfc] shadow-sm" 
                                              : "bg-white text-[#62748e] border-[#e2e8f0]"
                                        )}
                                     >
                                        {type}
                                     </button>
                                  ))}
                               </div>
                           )}
                        </div>

                        <div className="flex items-center justify-between px-1">
                           <p className="text-xs font-medium text-[#62748e]">월납 총액</p>
                           <div className="flex items-center gap-1">
                              {insuranceStatus === '있음' ? (
                                 <>
                                    <input 
                                       type="text" 
                                       className="w-20 text-right p-1 text-xs border border-[#cad5e2] rounded bg-white"
                                       placeholder="금액"
                                       value={monthlyPremium}
                                       onChange={e => setMonthlyPremium(e.target.value)}
                                    />
                                    <span className="text-xs text-[#62748e]">만원</span>
                                 </>
                              ) : (
                                 <span className="text-xs text-[#90a1b9]">선택 안함</span>
                              )}
                           </div>
                        </div>

                        <div className="flex items-center justify-between px-1">
                           <p className="text-xs text-[#45556c]">2. 미납/실효 여부</p>
                           {insuranceStatus === '있음' ? (
                              <select 
                                 value={paymentStatus}
                                 onChange={e => setPaymentStatus(e.target.value)}
                                 className="p-1.5 text-xs border border-[#e2e8f0] rounded bg-white w-28"
                              >
                                 <option>정상</option>
                                 <option>미납 중</option>
                                 <option>실효됨</option>
                              </select>
                           ) : (
                              <span className="text-xs text-[#90a1b9]">선택 안함</span>
                           )}
                        </div>

                        <div className="flex items-center justify-between px-1">
                           <p className="text-xs text-[#45556c]">3. 계약자/납입인</p>
                           {insuranceStatus === '있음' ? (
                              <select 
                                 value={contractor}
                                 onChange={e => setContractor(e.target.value)}
                                 className="p-1.5 text-xs border border-[#e2e8f0] rounded bg-white w-28"
                              >
                                 <option>본인/본인</option>
                                 <option>가족/본인</option>
                                 <option>본인/가족</option>
                                 <option>타인</option>
                              </select>
                           ) : (
                              <span className="text-xs text-[#90a1b9]">선택 안함</span>
                           )}
                        </div>

                        <div 
                           ref={designerRelationRef}
                           className={clsx(
                              "flex items-center justify-between px-1 transition-all duration-500 rounded",
                              highlightSection === 'designerRelation' && "ring-2 ring-blue-400 bg-blue-50/30 p-2"
                           )}
                        >
                           <p className="text-xs text-[#45556c]">4. 기존 설계사 관계</p>
                           {insuranceStatus === '있음' ? (
                              <select 
                                 value={joinPath}
                                 onChange={e => setJoinPath(e.target.value)}
                                 className="p-1.5 text-xs border border-[#e2e8f0] rounded bg-white w-28"
                              >
                                 <option>관계 없음</option>
                                 <option>가족</option>
                                 <option>지인</option>
                              </select>
                           ) : (
                              <span className="text-xs text-[#90a1b9]">선택 안함</span>
                           )}
                        </div>
                     </div>

                     {/* Health Info */}
                     <HealthCheckSection
                        trafficAccident={trafficAccident}
                        setTrafficAccident={setTrafficAccident}
                        trafficAccidentDetail={trafficAccidentDetail}
                        setTrafficAccidentDetail={setTrafficAccidentDetail}
                        surgery={surgery}
                        setSurgery={setSurgery}
                        surgeryOptions={surgeryOptions}
                        setSurgeryOptions={setSurgeryOptions}
                        surgeryDetail={surgeryDetail}
                        setSurgeryDetail={setSurgeryDetail}
                        criticalDisease={criticalDisease}
                        setCriticalDisease={setCriticalDisease}
                        criticalOptions={criticalOptions}
                        setCriticalOptions={setCriticalOptions}
                        criticalDetail={criticalDiseaseDetail}
                        setCriticalDetail={setCriticalDiseaseDetail}
                        medication={medication}
                        setMedication={setMedication}
                        medicationDetail={medicationDetail}
                        setMedicationDetail={setMedicationDetail}
                        trafficAccidentRef={trafficAccidentRef}
                        surgeryRef={surgeryRef}
                        criticalDiseaseRef={criticalDiseaseRef}
                        medicationRef={medicationRef}
                        highlightSection={highlightSection}
                        hiraPreFill={hiraPreFill}
                     />

                     {/* Item 9: 동반신청고객 */}
                     <div 
                        ref={companionRef}
                        className={clsx(
                           "bg-[#f8fafc] border border-[#e2e8f0] rounded p-2.5 mt-2 transition-all duration-500",
                           highlightSection === 'companion' && "ring-2 ring-blue-400 bg-blue-50/30"
                        )}
                     >
                        <div className="bg-white border border-[#f1f5f9] rounded p-2 space-y-2">
                           <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-[#45556c]">9. 동반신청고객</p>
                              <div className="bg-[#f1f5f9] rounded flex p-0.5">
                                 <button
                                    onClick={() => {
                                       setCompanion('없음');
                                       setCompanions([{ name: '', relationship: '관계 선택', phone: '' }]);
                                    }}
                                    className={clsx(
                                       "px-2 py-1 rounded text-[10px] transition-all tracking-wide",
                                       companion === '없음'
                                          ? "bg-white text-[#62748e] font-bold shadow-sm"
                                          : "text-[#90a1b9] font-medium"
                                    )}
                                 >
                                    없음
                                 </button>
                                 <button
                                    onClick={() => setCompanion('있음')}
                                    className={clsx(
                                       "px-2 py-1 rounded text-[10px] font-bold transition-all tracking-wide shadow-sm",
                                       companion === '있음'
                                          ? "bg-[#155dfc] text-white"
                                          : "text-[#90a1b9] font-medium"
                                    )}
                                 >
                                    있음
                                 </button>
                              </div>
                           </div>
                           {companion === '있음' && (
                              <div className="space-y-2">
                                 {companions.map((comp, idx) => (
                                    <div key={idx} className="bg-[#f8fafc] border border-[#f1f5f9] rounded p-2 space-y-3">
                                       <p className="text-[10px] font-bold text-[#90a1b9] tracking-wide">동반인 {idx + 1}</p>
                                       
                                       <div className="grid grid-cols-2 gap-2">
                                          <input
                                             type="text"
                                             className="w-full p-1.5 bg-white border border-[#bedbff] rounded text-xs placeholder:text-slate-400"
                                             placeholder="이름"
                                             value={comp.name}
                                             onChange={(e) => {
                                                const newCompanions = [...companions];
                                                newCompanions[idx].name = e.target.value;
                                                setCompanions(newCompanions);
                                             }}
                                          />
                                          <select
                                             value={comp.relationship}
                                             onChange={(e) => {
                                                const newCompanions = [...companions];
                                                newCompanions[idx].relationship = e.target.value;
                                                setCompanions(newCompanions);
                                             }}
                                             className="w-full p-1.5 bg-white border border-[#bedbff] rounded text-xs"
                                          >
                                             <option>관계 선택</option>
                                             <option>배우자</option>
                                             <option>자녀</option>
                                             <option>부모</option>
                                             <option>형제/자매</option>
                                             <option>기타</option>
                                          </select>
                                       </div>
                                       
                                       <input
                                          type="text"
                                          className="w-full p-1.5 bg-white border border-[#bedbff] rounded text-xs placeholder:text-slate-400"
                                          placeholder="연락처"
                                          value={comp.phone}
                                          onChange={(e) => {
                                             const newCompanions = [...companions];
                                             newCompanions[idx].phone = e.target.value;
                                             setCompanions(newCompanions);
                                          }}
                                       />
                                    </div>
                                 ))}
                                 
                                 <button
                                    onClick={() => setCompanions([...companions, { name: '', relationship: '관계 선택', phone: '' }])}
                                    className="w-full py-2 bg-[#f8fafc] border border-[#cad5e2] rounded text-xs font-bold text-[#62748e] hover:bg-slate-100 transition-colors"
                                 >
                                    + 동반인 추가
                                 </button>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Customer Traits Section */}
                  <div
                     ref={traitsRef}
                     className={clsx(
                        "space-y-3 rounded-lg transition-all",
                        highlightSection === 'traits' && "ring-2 ring-blue-400 bg-blue-50/30 p-2"
                     )}
                  >
                     <p className="text-[11px] font-bold text-[#62748e] tracking-[0.06px] uppercase flex items-center gap-2">
                        <Users size={12} /> 고객 특이사항 (Traits)
                     </p>
                     
                     <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3">
                        {/* 1. Disposition */}
                        <div className="flex items-center gap-3">
                           <span className="text-xs font-bold text-slate-500 w-16 shrink-0">성향</span>
                           <div className="flex-1 grid grid-cols-3 gap-1">
                              {['긍정', '중립', '부정'].map((type) => (
                                 <button
                                    key={type}
                                    onClick={() => setDisposition(type)}
                                    className={clsx(
                                       "py-1.5 text-[11px] font-bold rounded border transition-all",
                                       disposition === type
                                          ? type === '긍정' ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                          : type === '부정' ? "bg-rose-100 text-rose-700 border-rose-200"
                                          : "bg-slate-200 text-slate-700 border-slate-300"
                                          : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                                    )}
                                 >
                                    {type}적
                                 </button>
                              ))}
                           </div>
                        </div>

                        {/* 2. Trust Level */}
                        <div className="flex items-center gap-3">
                           <span className="text-xs font-bold text-slate-500 w-16 shrink-0">신뢰도</span>
                           <div className="flex-1 grid grid-cols-3 gap-1">
                              {['형성', '보통', '의심'].map((level) => (
                                 <button
                                    key={level}
                                    onClick={() => setTrustLevel(level)}
                                    className={clsx(
                                       "py-1.5 text-[11px] font-bold rounded border transition-all",
                                       trustLevel === level
                                          ? level === '형성' ? "bg-blue-100 text-blue-700 border-blue-200"
                                          : level === '의심' ? "bg-orange-100 text-orange-700 border-orange-200"
                                          : "bg-slate-200 text-slate-700 border-slate-300"
                                          : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                                    )}
                                 >
                                    {level}
                                 </button>
                              ))}
                           </div>
                        </div>

                        {/* 3. Best Time */}
                        <div className="flex flex-col gap-2">
                           <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-500 w-16 shrink-0">선호 시간</span>
                              <div className="flex-1 grid grid-cols-2 gap-1">
                                 <button
                                    onClick={() => setBestTime('무관')}
                                    className={clsx(
                                       "py-1.5 text-[11px] font-bold rounded border transition-all",
                                       bestTime === '무관'
                                          ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                                          : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                                    )}
                                 >
                                    무관
                                 </button>
                                 <button
                                    onClick={() => {
                                       if (bestTime === '무관') setBestTime('');
                                    }}
                                    className={clsx(
                                       "py-1.5 text-[11px] font-bold rounded border transition-all",
                                       bestTime !== '무관'
                                          ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                                          : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
                                    )}
                                 >
                                    있음
                                 </button>
                              </div>
                           </div>
                           {bestTime !== '무관' && (
                              <div className="flex items-center gap-3">
                                 <span className="w-16 shrink-0"></span>
                                 <input
                                    type="text"
                                    value={bestTime}
                                    onChange={(e) => setBestTime(e.target.value)}
                                    placeholder="예: 평일 오후 2시 이후"
                                    className="flex-1 px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-blue-500 text-slate-700 bg-white"
                                    autoFocus
                                 />
                              </div>
                           )}
                        </div>

                        {/* 4. Decision Maker */}
                        <div className="flex items-center gap-3">
                           <span className="text-xs font-bold text-slate-500 w-16 shrink-0">결정 권한</span>
                           <div className="flex-1">
                              <select
                                 value={decisionMaker}
                                 onChange={(e) => setDecisionMaker(e.target.value)}
                                 className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-blue-500 text-slate-700 bg-white"
                              >
                                 <option value="본인">본인</option>
                                 <option value="배우자">배우자</option>
                                 <option value="부모">부모</option>
                                 <option value="자녀">자녀</option>
                                 <option value="기타">기타</option>
                              </select>
                           </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-200">
                           <textarea
                              value={traitNote}
                              onChange={(e) => setTraitNote(e.target.value)}
                              placeholder="고객 성향 및 특이사항 관련 메모를 입력하세요."
                              className="w-full p-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-blue-500 text-slate-700 bg-white resize-none placeholder:text-slate-400"
                              rows={3}
                           />
                        </div>
                     </div>
                  </div>

                  {/* Divider */}
                  <div className="bg-[#f1f5f9] h-px" />

                  {/* File Attachment */}
                  <FileAttachmentSection initialFiles={attachments} onFilesChange={setAttachments} />

                  {/* Divider */}
                  <div className="bg-[#f1f5f9] h-px" />

                  {/* STEP 3: 미팅 예약 (3차 TM) */}
                  <div className="space-y-3">
                     <p className="text-[11px] font-bold text-[#62748e] tracking-[0.06px] uppercase flex items-center gap-1.5">
                        <CalendarDays size={12} /> STEP 3. 미팅 예약 (3차 TM)
                     </p>
                     
                     <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded p-3 space-y-3">
                        {/* 환급 예상금액 */}
                        <div className="space-y-1.5">
                           <div className="flex items-center gap-1.5">
                              <DollarSign size={12} className="text-emerald-600" />
                              <p className="text-xs font-bold text-[#314158]">환급 예상금액</p>
                              <span className="text-[9px] text-rose-500 font-bold">필수</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <input 
                                 type="text" 
                                 className={clsx(
                                    "flex-1 p-2 text-xs border rounded bg-white",
                                    refundEstimate ? "border-emerald-300" : "border-rose-300"
                                 )}
                                 placeholder="예상 금액 입력"
                                 value={refundEstimate}
                                 onChange={e => setRefundEstimate(e.target.value)}
                              />
                              <span className="text-xs text-[#62748e] font-bold">만원</span>
                           </div>
                           <p className="text-[10px] text-slate-400 px-1">* 기지급 보험금 고려하여 차이가 날 수 있음을 안내</p>
                        </div>

                        {/* 수수료 안내 */}
                        <label className={clsx(
                           "flex items-center gap-2 px-3 py-2.5 rounded border cursor-pointer transition-all",
                           feeNotified ? "bg-emerald-50 border-emerald-200" : "bg-white border-rose-200"
                        )}>
                           <input
                              type="checkbox"
                              checked={feeNotified}
                              onChange={(e) => setFeeNotified(e.target.checked)}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                           />
                           <span className={clsx("text-xs font-bold", feeNotified ? "text-emerald-700" : "text-slate-600")}>
                              수수료 10% 안내 완료
                           </span>
                           {feeNotified && <CheckCircle2 size={12} className="text-emerald-500 ml-auto" />}
                           {!feeNotified && <span className="text-[9px] text-rose-500 font-bold ml-auto">필수</span>}
                        </label>

                        {/* 미팅 일시/장소 */}
                        <div className="space-y-2">
                           <div className="flex items-center gap-1.5">
                              <MapPin size={12} className="text-blue-600" />
                              <p className="text-xs font-bold text-[#314158]">미팅 일시 / 장소</p>
                              <span className="text-[9px] text-rose-500 font-bold">필수</span>
                           </div>
                           <div className="grid grid-cols-2 gap-2">
                              <input 
                                 type="date" 
                                 className={clsx(
                                    "p-2 text-xs border rounded bg-white",
                                    meetingDate ? "border-blue-300" : "border-rose-300"
                                 )}
                                 value={meetingDate}
                                 onChange={e => setMeetingDate(e.target.value)}
                              />
                              <input 
                                 type="time" 
                                 className={clsx(
                                    "p-2 text-xs border rounded bg-white",
                                    meetingTime ? "border-blue-300" : "border-rose-300"
                                 )}
                                 value={meetingTime}
                                 onChange={e => setMeetingTime(e.target.value)}
                              />
                           </div>
                           <input 
                              type="text" 
                              className={clsx(
                                 "w-full p-2 text-xs border rounded bg-white",
                                 meetingLocation ? "border-blue-300" : "border-rose-300"
                              )}
                              placeholder="미팅 장소 (예: 고객 자택, 카페 등)"
                              value={meetingLocation}
                              onChange={e => setMeetingLocation(e.target.value)}
                           />
                        </div>
                     </div>
                  </div>

                  {/* Divider */}
                  <div className="bg-[#f1f5f9] h-px" />

                  {/* STEP 4: 인계 체크리스트 (5단계) */}
                  <div className="space-y-3">
                     <p className="text-[11px] font-bold text-[#62748e] tracking-[0.06px] uppercase flex items-center gap-1.5">
                        <ClipboardCheck size={12} /> STEP 4. 인계 체크리스트
                     </p>
                     
                     <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded p-3 space-y-2">
                        {[
                           { id: 'rec1', label: '1차 녹취파일 첨부', icon: <Mic size={12} className="text-indigo-500" />, checked: recording1stAttached, onChange: setRecording1stAttached },
                           { id: 'rec2', label: '2차 녹취파일 첨부', icon: <Mic size={12} className="text-purple-500" />, checked: recording2ndAttached, onChange: setRecording2ndAttached },
                           { id: 'simp', label: '심평원 진료이력 첨부', icon: <FileSearch size={12} className="text-blue-500" />, checked: simpyeongwonAttached, onChange: setSimpyeongwonAttached },
                        ].map((checkItem) => (
                           <label key={checkItem.id} className={clsx(
                              "flex items-center gap-2 px-3 py-2.5 rounded border cursor-pointer transition-all",
                              checkItem.checked 
                                 ? "bg-emerald-50 border-emerald-200" 
                                 : "bg-white border-slate-200 hover:border-slate-300"
                           )}>
                              <input
                                 type="checkbox"
                                 checked={checkItem.checked}
                                 onChange={(e) => checkItem.onChange(e.target.checked)}
                                 className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              {checkItem.icon}
                              <span className={clsx(
                                 "text-xs font-medium flex-1",
                                 checkItem.checked ? "text-emerald-700" : "text-slate-600"
                              )}>
                                 {checkItem.label}
                              </span>
                              {checkItem.checked && <CheckCircle2 size={12} className="text-emerald-500" />}
                              {!checkItem.checked && <span className="text-[9px] text-rose-500 font-bold">필수</span>}
                           </label>
                        ))}
                        
                        {/* 부재건 알림톡 발송 */}
                        <div className="border-t border-slate-200 pt-2 mt-2">
                           <label className={clsx(
                              "flex items-center gap-2 px-3 py-2.5 rounded border cursor-pointer transition-all",
                              absentAlimtalkSent 
                                 ? "bg-blue-50 border-blue-200" 
                                 : "bg-white border-slate-200 hover:border-slate-300"
                           )}>
                              <input
                                 type="checkbox"
                                 checked={absentAlimtalkSent}
                                 onChange={(e) => setAbsentAlimtalkSent(e.target.checked)}
                                 className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <Bell size={12} className="text-blue-500" />
                              <span className={clsx(
                                 "text-xs font-medium flex-1",
                                 absentAlimtalkSent ? "text-blue-700" : "text-slate-600"
                              )}>
                                 부재건 알림톡 발송 완료
                              </span>
                              {absentAlimtalkSent && <CheckCircle2 size={12} className="text-blue-500" />}
                           </label>
                           <p className="text-[10px] text-slate-400 px-3 mt-1">* 부재 상태 변경 시 자동 발송 (수동 확인)</p>
                        </div>

                        {/* 인계 메모 */}
                        <div className="border-t border-slate-200 pt-2 mt-2">
                           <p className="text-[10px] font-bold text-slate-500 mb-1.5 px-1">인계 메모 (영업팀 전달사항)</p>
                           <textarea 
                              className="w-full h-20 p-2 text-xs bg-white border border-slate-200 rounded resize-none focus:outline-none focus:border-blue-500 transition-colors"
                              placeholder="영업팀에게 전달할 특이사항, 고객 성향, 주의사항 등을 입력하세요..."
                              value={handoffMemo}
                              onChange={(e) => setHandoffMemo(e.target.value)}
                           />
                        </div>
                     </div>
                  </div>
               </div>

               {/* Floating Save Button with Validation */}
               <div className="sticky bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur border-t border-slate-100 z-20 space-y-2">
                  {(() => {
                     const issues: string[] = [];
                     if (!currentStep) issues.push('상담 단계 미선택');
                     if (!selectedStatus) issues.push('상태값 미선택');
                     if (['cancel', 'impossible', '1st-cancel', '2nd-cancel', '2nd-exception', '2nd-planner-relation'].includes(selectedStatus) && !selectedReason) {
                        issues.push('사유 미선택 (필수)');
                     }
                     const canSave = issues.length === 0;
                     return (
                        <>
                           {issues.length > 0 && (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                 <div className="flex items-center gap-1.5 mb-1">
                                    <AlertTriangle size={12} className="text-amber-600 shrink-0" />
                                    <span className="text-[10px] font-bold text-amber-700">저장 전 필수 항목 {issues.length}건 미완료</span>
                                 </div>
                                 <div className="flex flex-wrap gap-1">
                                    {issues.map((issue, i) => (
                                       <span key={i} className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">{issue}</span>
                                    ))}
                                 </div>
                              </div>
                           )}
                           <button 
                              disabled={!canSave}
                              className={clsx(
                                 "w-full py-3 rounded-lg font-bold transition-colors shadow-lg flex items-center justify-center gap-2",
                                 canSave 
                                    ? "bg-[#0f766e] text-white hover:bg-[#0d6b64] cursor-pointer"
                                    : "bg-slate-300 text-slate-500 cursor-not-allowed"
                              )}
                           >
                              <Save size={16} /> {canSave ? '저장하기' : '필수 항목을 입력해주세요'}
                           </button>
                        </>
                     );
                  })()}
               </div>
            </div>

            {/* Center Panel: Main Content */}
            <div className="flex-1 lg:flex-[7] bg-[#F6F7F9] overflow-hidden flex flex-col">
               {/* 중앙 탭 헤더 */}
               <div className="bg-white border-b border-slate-200 shrink-0">
                  <div className="flex">
                     {([
                        { id: 'customer', label: '고객 정보', icon: <Users size={14} /> },
                        { id: 'checklist', label: '상담팀 확인사항', icon: <ListTodo size={14} /> },
                        { id: 'script', label: '스크립트', icon: <MessageCircle size={14} /> },
                     ] as const).map((tab) => (
                        <button
                           key={tab.id}
                           onClick={() => setCenterTab(tab.id)}
                           className={clsx(
                              "flex-1 py-3.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors",
                              centerTab === tab.id
                                 ? "border-[#0f766e] text-[#0f766e] bg-emerald-50/40"
                                 : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                           )}
                        >
                           {tab.icon}
                           {tab.label}
                        </button>
                     ))}
                  </div>
               </div>

               {/* 탭 콘텐츠 */}
               <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pt-6 pb-6">
                  <div className="space-y-6">

                  {/* ── 탭 1: 고객 정보 ── */}
                  {centerTab === 'customer' && (
                     <>
                        <CustomerDetailPanel
                           customerName={item.customerName}
                           customerId={item.customerId}
                           customer={customer}
                           insuranceType={insuranceType}
                           monthlyPremium={monthlyPremium}
                           insuranceStatus={insuranceStatus}
                           contractor={contractor}
                           joinPath={joinPath}
                           criticalDisease={criticalDisease}
                           criticalOptions={criticalOptions}
                           surgery={surgery}
                           surgeryDetail={surgeryDetail}
                           decisionMaker={decisionMaker}
                           refundEstimate={refundEstimate}
                        />
                     </>
                  )}

                  {/* Old customer tab content (disabled) */}
                  {false && (
                     <>
                        <CustomerProfileSummary 
                           customerName={item.customerName}
                           ssn="921103-2******"
                           address={customer?.address || "경기도 화성시 동탄대로 550"}
                           threeMonthHistory="2023년 12월 15일 - 급성 위염으로 인한 내과 외래 진료 및 약물 처방 (오메프라졸, 모티리움). 2024년 1월 8일 - 알레르기성 비염 증상으로 이비인후과 진료 및 항히스타민제 처방. 2024년 2월 3일 - 허리 통증으로 정형외과 방문, X-ray 촬영 및 물리치료 3회 실시"
                           contractor={contractor}
                           criticalDisease={criticalDisease}
                           criticalOptions={criticalOptions}
                           criticalDetail={criticalDiseaseDetail}
                           designerRelation={joinPath}
                           insuranceType={insuranceType}
                           monthlyPremium={monthlyPremium}
                           insuranceStatus={insuranceStatus}
                           refundAmount="150"
                           familyConnectionCount={3}
                           surgery={surgery}
                           surgeryOptions={surgeryOptions}
                           surgeryDetail={surgeryDetail}
                           decisionMaker={decisionMaker}
                           onDecisionMakerChange={setDecisionMaker}
                        />
                        <CustomerInputSection 
                           customer={{
                              name: customer?.name || item.customerName,
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
                     </>
                  )}

                  {/* ── 탭 2: 상담팀 확인사항 ── */}
                  {centerTab === 'checklist' && (
                     <LiveRecordSection 
                        insuranceType={insuranceType}
                        monthlyPremium={monthlyPremium ? `${monthlyPremium}만원` : ''}
                        paymentStatus={paymentStatus}
                        contractor={contractor}
                        joinPath={insuranceStatus === '있음' ? joinPath : '-'}
                        trafficAccident={trafficAccident}
                        surgery={surgery === '있음' && surgeryOptions.length > 0 ? surgeryOptions.join(', ') : surgery}
                        surgeryDetail={surgeryDetail}
                        criticalDisease={criticalDisease}
                        medication={medication}
                        companion={companion}
                        onCardClick={handleCardClick}
                        disposition={disposition}
                        trustLevel={trustLevel}
                        bestTime={bestTime}
                        decisionMaker={decisionMaker}
                        traitNote={traitNote}
                        attachments={attachments}
                     />
                  )}

                  {/* ── 탭 3: 스크립트 ── */}
                  {centerTab === 'script' && (<div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                     <div className="flex border-b border-slate-200">
                        <button 
                           onClick={() => setActiveTab('script1')}
                           className={clsx(
                              "flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors",
                              activeTab === 'script1' ? "border-blue-600 text-blue-600 bg-blue-50/50" : "border-transparent text-slate-500 hover:bg-slate-50"
                           )}
                        >
                           <MessageCircle size={14} /> 1차 상담 스크립트 (초기)
                        </button>
                        <button 
                           onClick={() => setActiveTab('script2')}
                           className={clsx(
                              "flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors",
                              activeTab === 'script2' ? "border-blue-600 text-blue-600 bg-blue-50/50" : "border-transparent text-slate-500 hover:bg-slate-50"
                           )}
                        >
                           <FileText size={14} /> 2차 상담 스크립트 (심화)
                        </button>
                        <div className="flex items-center gap-2 px-4 border-l border-slate-200 text-slate-400">
                           <button
                              onClick={() => setShowHelp(!showHelp)}
                              className="hover:text-blue-600 transition-colors"
                              title="도움말"
                           >
                              <HelpCircle size={14} />
                           </button>
                           <button
                              onClick={() => setShowAlert(!showAlert)}
                              className="hover:text-amber-600 transition-colors"
                              title="주의사항"
                           >
                              <AlertTriangle size={14} />
                           </button>
                        </div>
                     </div>

                     {/* Help Alert */}
                     {showHelp && (
                        <div className="bg-blue-50 border-b border-blue-100 p-4">
                           <div className="flex items-start gap-2">
                              <HelpCircle size={16} className="text-blue-600 mt-0.5 shrink-0" />
                              <div>
                                 <div className="font-bold text-sm text-blue-900 mb-1">스크립트 활용 가이드</div>
                                 <div className="text-xs text-blue-700 space-y-1">
                                    <p>• 1차 스크립트: 초기 상담 시 고객 신뢰 구축 및 기본 정보 확인</p>
                                    <p>• 2차 스크립트: 심화 상담을 위한 니즈 파악 및 서비스 설명</p>
                                    <p>• 고객 상황에 맞춰 유연하게 응대하되 필수 확인 사항은 반드시 체크</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}

                     {/* Alert Warning */}
                     {showAlert && (
                        <div className="bg-amber-50 border-b border-amber-100 p-4">
                           <div className="flex items-start gap-2">
                              <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                              <div>
                                 <div className="font-bold text-sm text-amber-900 mb-1">주의사항</div>
                                 <div className="text-xs text-amber-700 space-y-1">
                                    <p>• 강원도 일부 지역(철원, 화천, 춘천, 원주, 횡성 제외) 서비스 불가</p>
                                    <p>• 실손보험 미가입 고객은 서비스 제공 어려움</p>
                                    <p>• 개인정보 처리 시 반드시 본인 확인 절차 진행</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}

                     <div className="p-6 space-y-6">
                        {activeTab === 'script1' && (
                           <>
                              {/* Quote Box */}
                              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 text-[#1e293b] font-bold text-sm shadow-sm">
                                 <span className="text-blue-600 underline decoration-blue-300 decoration-2 underline-offset-2">{customer?.name || item.customerName}</span>님 맞으실까요? 안녕하세요. 보험금 환급 관련하여 신청 남겨주셔서 더바다 보상팀 <span className="text-blue-600 underline decoration-blue-300 decoration-2 underline-offset-2">조힘찬</span> 매니저입니다.
                              </div>

                              {/* Main Script Text */}
                              <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
                                 <p>환급절차 관련해서 몇 가지 안내차 연락드렸는데요~</p>
                                 <p>잠시 통화 가능하실까요~?</p>
                                 <p className="text-slate-400 text-xs">(고객 응답 후)</p>
                                 
                                 <div className="border-t border-slate-200 pt-4 mt-4"></div>
                                 
                                 <p>네 감사합니다~!</p>
                                 
                                 <p className="font-bold text-blue-600">[신뢰주기]</p>
                                 <p>우선 본인 확인차 고객님께서 남겨주신 정보 먼저 확인 도움드리겠습니다.</p>
                                 <p>
                                    현재 거주 중이신 지역이 <span className="font-bold text-blue-600 underline decoration-blue-200 decoration-2 underline-offset-2">{customer?.address?.split(' ')[1] || '경기도 화성시'}</span>으로 남겨주셨는데 맞으시구요?
                                 </p>
                                 <p className="text-rose-500 text-xs font-bold bg-rose-50 inline-block px-2 py-1 rounded">
                                    * 강원도는 철원 화천 춘천 원주 횡성 외 불가능
                                 </p>
                                 <p>환급 원하시는 계좌는 <span className="font-bold text-[#1e293b]">새마을금고</span> 맞으시죠?</p>
                                 
                                 <div className="border-t border-slate-200 pt-4 mt-4"></div>
                                 
                                 <p>네, 확인 감사합니다!</p>
                                 <p>
                                    우선 <span className="text-blue-600 font-bold underline decoration-blue-200 decoration-2 underline-offset-2">{customer?.name || item.customerName}</span>님 보험금 환급 관련해서 업무절차좀 간략하게 설명드릴건데요~!
                                 </p>
                                 <p>
                                    보험사들의 계약사항이나 특약사항을 전부 알고 계신게 아니기 때문에 몰라서 청구하지 못한 보험금들이 굉장히 많지 않습니까?
                                 </p>
                              </div>

                              {/* Needs Box */}
                              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                 <p className="text-xs text-slate-600 leading-relaxed">
                                    그래서 저희 더바다에서는 회하신 병원비를 제외하고도 약재비, 입원, 수술, 질병, 상해 이력 등으로 보험사에 미청구한 보험금을 전부 찾으실 수 있게 도와드리고 있구요~!
                                 </p>
                                 <p className="text-xs text-slate-600 leading-relaxed mt-2">
                                    그러다보니 보험이 없으신 경우에는 서비스 제공이 어려운데 실손보험은 가입 되어 계시죠~?
                                 </p>
                              </div>
                              
                              <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
                                 <p>네 답변 감사합니다~!</p>
                                 
                                 <div className="flex items-start justify-between gap-2 bg-blue-50/30 p-3 rounded-lg border border-blue-200">
                                    <p className="flex-1">
                                       종합보험도 있으시면 진단비나 수술비 같은 것들을 추가로 확인해드릴 수 있는데 종합보험도 가입되어 계신가요?
                                    </p>
                                    <button
                                       onClick={() => scrollToSection(insuranceRef, 'insurance')}
                                       className="shrink-0 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors font-bold flex items-center gap-1"
                                    >
                                       입력 <ChevronRight size={14} />
                                    </button>
                                 </div>
                                 <p className="text-slate-500 text-xs">(흔히들 가입하는 암보험 같은걸 종합보험이라고 하거든요~!)</p>
                                 
                                 <p>네 답변 감사합니다~!</p>
                                 
                                 <p>
                                    보험료 미납이 있으시면 청구를 해드려도 보���사에서 지급이 불가해서 여쭤보는건데 미납중이거나 실효된 보험은 없으시구요~?
                                 </p>
                                 
                                 <div className="border-t border-slate-200 pt-4 mt-4"></div>
                                 
                                 <p className="font-bold text-blue-600">[절차 안내]</p>
                                 <p>
                                    우선적으로 절차에 대해 먼저 안내를 해드리면 환급을 받기 위해선 아시겠지만 기존에 다니셨던 병원들을 각각 직접 내방하셔서, 진료기록과 필요한 서류를 발급하셔서 보험사별로 제출해주셔야 되잖아요?
                                 </p>
                                 <p>
                                    이런 업무를 저희가 대신해서 도와드릴 예정이구요~! 저희가 대신 처리를 하기 위해서 보험사측에 보상관련 담당자를 저희로 지정해서 청구해드리는 업무를 도와드릴건데요.
                                 </p>
                                 <div className="flex items-start justify-between gap-2 bg-blue-50/30 p-3 rounded-lg border border-blue-200">
                                    <p className="flex-1">
                                       간혹가다가 가족분이 보험설계사이시거나 본인이 설계사인 경우에는 저희가 보상관련 담당자로 지정하기가 어렵거든요, 혹시 가족분이 설계사이시거나 본인이 설계사는 아니시죠?
                                    </p>
                                    <button
                                       onClick={() => scrollToSection(designerRelationRef, 'designerRelation')}
                                       className="shrink-0 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors font-bold flex items-center gap-1"
                                    >
                                       입력 <ChevronRight size={14} />
                                    </button>
                                 </div>
                                 
                                 <p>네 답변 감사합니다.</p>
                                 
                                 <div className="flex items-start justify-between gap-2 bg-blue-50/30 p-3 rounded-lg border border-blue-200">
                                    <p className="flex-1">
                                       <span className="text-blue-600 font-bold underline decoration-blue-200 decoration-2 underline-offset-2">{customer?.name || item.customerName}</span>님의 병원비만 확인했을 때 <span className="font-bold text-emerald-600">약 120만원</span>으로 확인되시는데 저희 더바다홈페이지 조회 하신 금액이랑 일치 하신가요??
                                    </p>
                                    <button
                                       onClick={() => scrollToSection(insuranceRef, 'insurance')}
                                       className="shrink-0 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors font-bold flex items-center gap-1"
                                    >
                                       <Globe size={14} /> 청구내역
                                    </button>
                                 </div>
                                 
                                 <p>네 확인감사합니다.</p>
                                 
                                 <div className="border-t border-slate-200 pt-4 mt-4"></div>
                                 
                                 <p className="font-bold text-blue-600">[추가 보험금 확인]</p>
                                 <p>
                                    방금 설명드렸듯 추가로 받을 수 있는 보험금이 있으신지 확인을 위해 간단하게 몇가지만 여쭈어 보겠습니다.
                                 </p>
                                 
                                 <div className="flex items-start justify-between gap-2 bg-blue-50/30 p-3 rounded-lg border border-blue-200">
                                    <p className="flex-1">
                                       <span className="font-bold">운전자보험</span>이 가입되어 계시면 교통사고만 나셔도 자기부상치료비로 몇십만원씩은 무조건 나와서 여쭤보는건데 3년 이내 교통사고로 병원 방문하신적 있으신가요?
                                    </p>
                                    <button
                                       onClick={() => scrollToSection(trafficAccidentRef, 'trafficAccident')}
                                       className="shrink-0 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors font-bold flex items-center gap-1"
                                    >
                                       입력 <ChevronRight size={14} />
                                    </button>
                                 </div>
                                 <p className="text-slate-500 text-xs">- 있을 경우 이부분도 같이 확인 해드릴게요~!</p>
                                 
                                 <div className="flex items-start justify-between gap-2 bg-blue-50/30 p-3 rounded-lg border border-blue-200">
                                    <p className="flex-1">
                                       <span className="font-bold">종합보험</span>에서 수술비나 진단비 내용 좀 체크해드리려고 하는데 3년 이내에 건강검진 하시면서 <span className="font-bold">용종제거</span> 하시거나 수술 시술 하신적 있으신가요?
                                    </p>
                                    <button
                                       onClick={() => scrollToSection(surgeryRef, 'surgery')}
                                       className="shrink-0 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors font-bold flex items-center gap-1"
                                    >
                                       입력 <ChevronRight size={14} />
                                    </button>
                                 </div>
                                 <p className="text-slate-500 text-xs">
                                    - 용종 제거가 있을 경우 보통 용종 제거하시면 종합보험에서 적게는 60만원 많게는 100만원도 넘게 나오시거든요 이렇게 못받으셨으면 이것도 확인좀 해드릴게요~!
                                 </p>
                                 
                                 <div className="flex items-start justify-between gap-2 bg-blue-50/30 p-3 rounded-lg border border-blue-200">
                                    <p className="flex-1">
                                       <span className="font-bold">골절경험</span>이 있으시면 어떤 치료를 하셨던 상관없이 종합보험에서 골절진단비라고 해서 몇십만원씩 나오는 내용이 있는데 골절 경험 있으신가요~?
                                    </p>
                                    <button
                                       onClick={() => scrollToSection(surgeryRef, 'surgery')}
                                       className="shrink-0 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors font-bold flex items-center gap-1"
                                    >
                                       입력 <ChevronRight size={14} />
                                    </button>
                                 </div>
                                 <p className="text-slate-500 text-xs">- 있을 경우 이부분도 같이 확인 해드릴게요~!</p>
                              </div>
                           </>
                        )}
                        {activeTab === 'script2' && (
                           <>
                              {/* 2차 상담 스크립트: 보험내용/건강상태/병력 체크 */}
                              <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-100 text-[#1e293b] font-bold text-sm shadow-sm">
                                 <span className="text-purple-600 underline decoration-purple-300 decoration-2 underline-offset-2">{customer?.name || item.customerName}</span>님, 안녕하세요! 지난번 통화 이어서 몇 가지 추가 확인 도움드리겠습니다.
                              </div>

                              <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
                                 <p className="font-bold text-purple-600">[보험 정보 상세 확인]</p>
                                 
                                 <div className="flex items-start justify-between gap-2 bg-purple-50/30 p-3 rounded-lg border border-purple-200">
                                    <p className="flex-1">
                                       현재 납부하고 계신 <span className="font-bold">월 보험료</span>가 얼마 정도 되시는지 확인 가능하실까요? 
                                       종합보험 가입 여부를 확인하기 위해 여쭤보는 건데요, 보통 <span className="font-bold text-purple-600">월 7만원 이상</span>이시면 종합보험이 포함되어 있을 가능성이 높습니다.
                                    </p>
                                    <button
                                       onClick={() => scrollToSection(insuranceRef, 'insurance')}
                                       className="shrink-0 px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors font-bold flex items-center gap-1"
                                    >
                                       입력 <ChevronRight size={14} />
                                    </button>
                                 </div>
                                 
                                 <p>보험료 <span className="font-bold">미납</span>이 있으시면 청구를 해드려도 보험사에서 지급이 불가해서 확인드리는데, 현재 미납 중이거나 실효된 보험은 없으시죠?</p>
                                 
                                 <p>그리고 보험 <span className="font-bold">계약자와 보험료 납입자</span>가 동일하신지 확인 부탁드립니다.</p>

                                 <div className="border-t border-slate-200 pt-4 mt-4"></div>

                                 <p className="font-bold text-purple-600">[건강상태 및 병력 확인]</p>
                                 <p>
                                    지금부터는 정확한 환급금 산정을 위해 건강상태를 확인해드리겠습니다. 
                                    간단한 질문 몇 가지만 답변 부탁드려요.
                                 </p>

                                 <div className="flex items-start justify-between gap-2 bg-purple-50/30 p-3 rounded-lg border border-purple-200">
                                    <p className="flex-1">
                                       최근 3개월 이내에 <span className="font-bold">병원 치료</span>나 <span className="font-bold">수술</span>을 받으신 적이 있으신가요?
                                       현재 상해로 치료 받고 계신 내역이 있으신지도 확인 부탁드립니다.
                                    </p>
                                    <button
                                       onClick={() => scrollToSection(surgeryRef, 'surgery')}
                                       className="shrink-0 px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors font-bold flex items-center gap-1"
                                    >
                                       입력 <ChevronRight size={14} />
                                    </button>
                                 </div>

                                 <div className="flex items-start justify-between gap-2 bg-purple-50/30 p-3 rounded-lg border border-purple-200">
                                    <p className="flex-1">
                                       <span className="font-bold">약 복용</span> 관련해서도 확인드리는데요, 현재 복용 중이신 약이 있으시다면 
                                       최근에 <span className="font-bold">용량이나 종류가 변경</span>된 부분이 있으신가요?
                                    </p>
                                    <button
                                       onClick={() => scrollToSection(medicationRef, 'medication')}
                                       className="shrink-0 px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors font-bold flex items-center gap-1"
                                    >
                                       입력 <ChevronRight size={14} />
                                    </button>
                                 </div>

                                 <div className="flex items-start justify-between gap-2 bg-rose-50/50 p-3 rounded-lg border border-rose-200">
                                    <div className="flex-1">
                                       <p className="font-bold text-rose-600 text-xs mb-1">[중대질환 확인 - 주의]</p>
                                       <p>
                                          혹시 <span className="font-bold text-rose-600">암, 뇌혈관질환, 심장질환, 신장, 간, 폐질환</span> 등 
                                          중대질환 관련하여 치료를 받으셨거나 현재 치료 중이신 부분이 있으신가요?
                                       </p>
                                       <p className="text-xs text-rose-500 mt-1">
                                          * 완치 후 5년 경과 & 현재 악화소견 없으면 진행 가능
                                       </p>
                                    </div>
                                    <button
                                       onClick={() => scrollToSection(criticalDiseaseRef, 'criticalDisease')}
                                       className="shrink-0 px-2 py-1 bg-rose-600 text-white text-xs rounded hover:bg-rose-700 transition-colors font-bold flex items-center gap-1"
                                    >
                                       입력 <ChevronRight size={14} />
                                    </button>
                                 </div>

                                 <div className="border-t border-slate-200 pt-4 mt-4"></div>

                                 <p className="font-bold text-purple-600">[설계사 관계 및 보험사 예외질환]</p>
                                 
                                 <div className="flex items-start justify-between gap-2 bg-purple-50/30 p-3 rounded-lg border border-purple-200">
                                    <p className="flex-1">
                                       기존 보험 설계사분과 <span className="font-bold">친인척 관계</span>이시거나 본인이 설계사는 아니시죠?
                                       <br />
                                       <span className="text-xs text-slate-500">* 친인척 관계인 경우 보상담당자 지정이 어려워 진행 불가</span>
                                    </p>
                                    <button
                                       onClick={() => scrollToSection(designerRelationRef, 'designerRelation')}
                                       className="shrink-0 px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors font-bold flex items-center gap-1"
                                    >
                                       입력 <ChevronRight size={14} />
                                    </button>
                                 </div>

                                 <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                                    <p className="text-xs font-bold text-amber-800 mb-1">보험사(삼성화재) 예외질환 체크</p>
                                    <p className="text-xs text-amber-700">
                                       현재 삼성화재 기준 특정 질환의 경우 청구가 제한될 수 있습니다. 
                                       해당 여부를 확인 후 최종 진행 여부를 결정합니다.
                                    </p>
                                 </div>

                                 <div className="border-t border-slate-200 pt-4 mt-4"></div>

                                 {/* 진행 가능 시 후킹 멘트 */}
                                 <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                                    <p className="font-bold text-emerald-700 text-xs mb-2">[진행 가능 시 - 후킹 멘트]</p>
                                    <p className="text-xs text-emerald-700">
                                       심평원 진료 이력을 확인해보니 2~3가지 치료 이력이 확인되는데요, 
                                       정확히 무슨 진료를 받으셨는지 기억이 안 나실 수도 있는데 이런 경우 
                                       <span className="font-bold">보험금 청구 누락 가능성</span>이 있습니다.
                                    </p>
                                    <p className="text-xs text-emerald-600 mt-2">
                                       용종 제거, 골절, 교통사고 등 추가 보상 가능 항목이 있으시면 함께 확인해드리겠습니다!
                                    </p>
                                 </div>

                                 {/* 진행 불가 시 안내 멘트 */}
                                 <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <p className="font-bold text-slate-600 text-xs mb-2">[진행 불가 시 - 표준 안내 멘트]</p>
                                    <p className="text-xs text-slate-600">
                                       확인 결과 현재 고객님의 경우 미청구 보험금이 부존재하는 것으로 확인되어 
                                       금번 서비스 진행이 어려운 점 양해 부탁드립니다.
                                    </p>
                                    <p className="text-[10px] text-rose-500 mt-2 font-bold">
                                       * 불가 시 반드시 상태값을 변경하고 사유를 선택해주세요
                                    </p>
                                 </div>

                                 {/* 동반신청 안내 */}
                                 <div className="flex items-start justify-between gap-2 bg-blue-50/30 p-3 rounded-lg border border-blue-200">
                                    <p className="flex-1">
                                       혹시 가족분이나 지인분 중에 <span className="font-bold">3년 환급금 서비스를 함께 신청</span>하실 분이 계시면 
                                       이름과 연락처를 남겨주시면 함께 안내해드리겠습니다.
                                    </p>
                                    <button
                                       onClick={() => scrollToSection(companionRef, 'companion')}
                                       className="shrink-0 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors font-bold flex items-center gap-1"
                                    >
                                       입력 <ChevronRight size={14} />
                                    </button>
                                 </div>
                              </div>
                           </>
                        )}
                     </div>
                  </div>
                  )}
                  </div>
               </div>
            </div>

            {/* Right Panel: Memo & History */}
            <div className="w-full lg:flex-[1.5] lg:w-auto lg:min-w-[280px] bg-white lg:border-l border-t lg:border-t-0 border-slate-200 overflow-y-auto shrink-0 flex flex-col hidden lg:flex custom-scrollbar">
               <div className="p-4 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
                  <h2 className="font-bold text-[#1e293b] flex items-center gap-2 text-sm">
                     <MessageSquare size={16} className="text-slate-500" /> 메모 및 이력
                  </h2>
               </div>
               
               <div className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500">상담 메모</label>
                        <textarea 
                           className="w-full h-32 p-3 text-xs bg-slate-50 border border-slate-200 rounded resize-none focus:outline-none focus:border-blue-500 transition-colors"
                           placeholder="상담 내용을 입력하세요..."
                        />
                        <button className="w-full py-2 bg-[#1e293b] text-white text-xs font-bold rounded hover:bg-slate-800 transition-colors">
                           메모 저장
                        </button>
                     </div>
                     
                     <div className="border-t border-slate-100 my-4 pt-4">
                        <label className="text-xs font-bold text-slate-500 mb-2 block">최근 이력</label>
                        <div className="space-y-3">
                           {[1, 2, 3].map((_, i) => (
                              <div key={i} className="bg-slate-50 p-3 rounded border border-slate-100 text-xs">
                                 <div className="flex justify-between text-slate-400 mb-1">
                                    <span>2026.01.2{5-i}</span>
                                    <span>시스템</span>
                                 </div>
                                 <p className="text-slate-600">
                                    {i === 0 ? '상담 상태가 [진행중]으로 변경되었습니다.' : 
                                     i === 1 ? 'DB가 접수되었습니다. (경로: 인스타그램)' : 
                                     '알림톡이 발송되었습니다.'}
                                 </p>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

/** D-1: 상담 품질 모니터링 패널 */
function QualityMonitoringPanel({ data }: { data: any[] }) {
  // Mock quality metrics derived from consultation data
  const totalConsultations = data.length;
  const completedCount = data.filter(d => d.status === '완료' || d.status === '인계완료').length;
  const avgDuration = 12.4; // mock: minutes
  const scriptComplianceRate = 87; // mock: %
  const customerSatisfaction = 4.2; // mock: /5
  const firstCallResolveRate = 72; // mock: %

  const qualityByStaff = [
    { name: '김상담', calls: 45, avgDuration: 11.2, scriptCompliance: 92, satisfaction: 4.5, handoffRate: 68 },
    { name: '이상담', calls: 38, avgDuration: 14.1, scriptCompliance: 85, satisfaction: 4.0, handoffRate: 55 },
    { name: '박상담', calls: 42, avgDuration: 10.8, scriptCompliance: 88, satisfaction: 4.3, handoffRate: 72 },
    { name: '최상담', calls: 35, avgDuration: 15.3, scriptCompliance: 78, satisfaction: 3.8, handoffRate: 48 },
  ];

  const scriptCheckItems = [
    { item: '인사 및 본인확인', compliance: 95 },
    { item: '서비스 설명 (3년환급)', compliance: 88 },
    { item: '건강보험 조회 안내', compliance: 92 },
    { item: '환급 예상액 안내', compliance: 85 },
    { item: '미팅 일정 제안', compliance: 78 },
    { item: '중대질환 확인', compliance: 82 },
    { item: '마무리 멘트', compliance: 90 },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: '총 상담', value: `${totalConsultations}건`, color: 'text-[#1e293b]' },
          { label: '완료', value: `${completedCount}건`, color: 'text-emerald-600' },
          { label: '평균 통화시간', value: `${avgDuration}분`, color: 'text-blue-600' },
          { label: '스크립트 준수율', value: `${scriptComplianceRate}%`, color: scriptComplianceRate >= 85 ? 'text-emerald-600' : 'text-amber-600' },
          { label: '고객 만족도', value: `${customerSatisfaction}/5`, color: 'text-[#1e293b]' },
          { label: '1차 콜 해결률', value: `${firstCallResolveRate}%`, color: 'text-blue-600' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-center">
            <div className="text-[10px] text-slate-400 font-medium uppercase">{kpi.label}</div>
            <div className={clsx("text-xl font-bold mt-1", kpi.color)}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff Quality Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <h4 className="font-bold text-sm text-[#1e293b]">직원별 품질 지표</h4>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left font-medium">담당자</th>
                <th className="px-3 py-2 text-center font-medium">콜 수</th>
                <th className="px-3 py-2 text-center font-medium">평균시간</th>
                <th className="px-3 py-2 text-center font-medium">스크립트</th>
                <th className="px-3 py-2 text-center font-medium">만족도</th>
                <th className="px-3 py-2 text-center font-medium">인계율</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {qualityByStaff.map((staff, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-bold text-[#1e293b]">{staff.name}</td>
                  <td className="px-3 py-2.5 text-center">{staff.calls}</td>
                  <td className="px-3 py-2.5 text-center">{staff.avgDuration}분</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={clsx("font-bold", staff.scriptCompliance >= 85 ? "text-emerald-600" : "text-amber-600")}>
                      {staff.scriptCompliance}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">{staff.satisfaction}</td>
                  <td className="px-3 py-2.5 text-center font-bold">{staff.handoffRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Script Compliance Breakdown */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <h4 className="font-bold text-sm text-[#1e293b]">스크립트 항목별 준수율</h4>
          </div>
          <div className="p-4 space-y-3">
            {scriptCheckItems.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-600">{item.item}</span>
                  <span className={clsx("font-bold", item.compliance >= 85 ? "text-emerald-600" : item.compliance >= 75 ? "text-amber-600" : "text-rose-600")}>
                    {item.compliance}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={clsx("h-full rounded-full transition-all", item.compliance >= 85 ? "bg-emerald-500" : item.compliance >= 75 ? "bg-amber-400" : "bg-rose-500")}
                    style={{ width: `${item.compliance}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
