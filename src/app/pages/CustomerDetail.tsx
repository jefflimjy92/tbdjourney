import React, { useState } from 'react';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  FileText,
  MessageSquare,
  Send,
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Users,
  Activity,
  DollarSign,
  Heart,
  Scale,
  UserCheck,
  Clock,
  Download,
  Upload,
  Trash2,
  PlayCircle,
  CheckSquare,
  X,
  ShieldCheck,
  DownloadCloud,
  UserPlus
} from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { InsuranceMainView } from "@/app/components/InsuranceMainView";

// Mock customer data
const CUSTOMER_DATA = {
  id: 'C001',
  customerNo: 'C-20251230-0001', // 고객번호
  dbNo: 'DB-REF-20251230-0001', // DB번호 (환급금조회 루트)
  dbSource: '환급금조회', // DB 유입 경로
  name: '장진숙',
  gender: '여',
  idNumber: '890703-2******',
  age: 36,
  phone: '010-1234-5678',
  grade: 'VIP',
  gradeScore: 92,
  manager: '김더바다',
  region: '서울 마포구',
  marketingConsent: '동의함',
  consentDate: '2025.12.30',
  
  // Analysis data (17 points)
  analysis: {
    refundAmount: 1500000,
    dispute: false,
    insuranceType: '종합+실손',
    decisionMaker: '본인',
    plannerRelation: '모름',
    familyCount: 2,
    maritalStatus: '미혼',
    recentMedical: true,
    criticalIllness: false,
    familyHistory: '고혈압(부)',
    cancellationHistory: '1회 (단순변심)',
    surgeryHistory: '1회 - 창상봉합��',
    legalService: false,
    contractMatch: '동일',
    premium: 55000,
    contractStatus: '정상',
    lastContact: '2025-12-30',
    source: '틱톡',
    notes: '적극적 상담 희망'
  }
};

// 통합 이력 데이터 (All Activity History)
const ALL_HISTORY_DATA = [
  { 
    id: 'H-001', 
    consultNo: 'CS-C20251230-0001-03',
    date: '2025-12-30 10:00', 
    type: '상담완료', 
    category: 'consultation',
    user: '김상담', 
    detail: '환급금 1,500,000원 안내 완료. 미팅 희망',
    status: '완료'
  },
  { 
    id: 'H-002', 
    consultNo: null,
    date: '2025-12-30 09:45', 
    type: '알림톡발송', 
    category: 'message',
    user: 'System', 
    detail: '상담 예정 안내 발송',
    status: '발송완료'
  },
  { 
    id: 'H-003', 
    consultNo: null,
    date: '2025-12-29 16:00', 
    type: '상태변경', 
    category: 'status',
    user: '김상담', 
    detail: '가망 → 유효 고객으로 변경',
    status: '완료'
  },
  { 
    id: 'H-004', 
    consultNo: 'CS-C20251230-0001-02',
    date: '2025-12-29 14:30', 
    type: '상담완료', 
    category: 'consultation',
    user: '이상담', 
    detail: '첫 연락, 상담 가능 시간 확인',
    status: '완료'
  },
  { 
    id: 'H-005', 
    consultNo: null,
    date: '2025-12-29 14:15', 
    type: '문자발송', 
    category: 'message',
    user: 'System', 
    detail: '첫 연락 문자 발송',
    status: '발송완료'
  },
  { 
    id: 'H-006', 
    consultNo: null,
    date: '2025-12-29 14:00', 
    type: '메모등록', 
    category: 'memo',
    user: '김상담', 
    detail: '통화 시도 - 부재중, 재시도 예정',
    status: '등록'
  },
  { 
    id: 'H-007', 
    consultNo: 'CS-C20251230-0001-01',
    date: '2025-12-28 11:00', 
    type: '상담시도', 
    category: 'consultation',
    user: '박상담', 
    detail: '부재중 - 재시도 필요',
    status: '보류'
  },
  { 
    id: 'H-008', 
    consultNo: null,
    date: '2025-12-28 10:30', 
    type: 'DB유입', 
    category: 'system',
    user: 'System', 
    detail: 'DB-REF-20251230-0001 환급금조회 유입',
    status: '등록'
  }
];

// DB별 상담 이력 데이터
const DB_CONSULTATION_HISTORY = [
  {
    dbNo: 'DB-REF-20251230-0001',
    dbSource: '환급금조회',
    dbDate: '2025-12-28 10:30',
    dbStatus: '미팅전환',
    consultations: [
      {
        consultNo: 'CS-C20251230-0001-01',
        date: '2025-12-28 11:00',
        consultant: '박상담',
        type: '전화상담',
        content: '부재중 - 재시도 필요',
        status: '보류',
        nextAction: '재통화 예정'
      },
      {
        consultNo: 'CS-C20251230-0001-02',
        date: '2025-12-29 14:30',
        consultant: '이상담',
        type: '전화상담',
        content: '첫 연락, 상담 가능 시간 확인. 환급금에 관심 있음',
        status: '완료',
        nextAction: '환급금 안내 예정'
      },
      {
        consultNo: 'CS-C20251230-0001-03',
        date: '2025-12-30 10:00',
        consultant: '김상담',
        type: '전화상담',
        content: '환급금 1,500,000원 안내 완료. 대면 미팅 희망함. 1월 3일 오후 2시 약속',
        status: '완료',
        nextAction: '미팅팀 배정 완료'
      }
    ]
  },
  {
    dbNo: 'DB-CLAIM-20251215-0012',
    dbSource: '간편청구',
    dbDate: '2025-12-15 09:20',
    dbStatus: '상담중',
    consultations: [
      {
        consultNo: 'CS-C20251230-0001-04',
        date: '2025-12-15 14:00',
        consultant: '최상담',
        type: '전화상담',
        content: '간편청구 안내, 서류 보완 필요',
        status: '완료',
        nextAction: '서류 대기중'
      },
      {
        consultNo: 'CS-C20251230-0001-05',
        date: '2025-12-20 11:30',
        consultant: '최상담',
        type: '전화상담',
        content: '서류 접수 완료, 청구 진행중 안내',
        status: '완료',
        nextAction: '보험사 검토 대기'
      }
    ]
  }
];

// 통합 상담 이력 (Flatten)
const ALL_CONSULTATIONS = [
  {
    consultNo: 'CS-C20251230-0001-05',
    dbNo: 'DB-CLAIM-20251215-0012',
    dbSource: '간편청구',
    date: '2025-12-20 11:30',
    consultant: '최상담',
    type: '전화상담',
    content: '서류 접수 완료, 청구 진행중 안내',
    detail: '고객이 제출한 서류 검토 완료. 보험사에 청구 접수하였으며, 심사 기간은 약 7-10일 소요 예정. 결과 확인 후 고객에게 재연락 예정.',
    status: '완료',
    nextAction: '보험사 검토 대기'
  },
  {
    consultNo: 'CS-C20251230-0001-04',
    dbNo: 'DB-CLAIM-20251215-0012',
    dbSource: '간편청구',
    date: '2025-12-15 14:00',
    consultant: '최상담',
    type: '전화상담',
    content: '간편청구 안내, 서류 보완 필요',
    detail: '고객에게 간편청구 프로세스 안내. 필요 서류: 진단서, 영수증 원본, 통장사본. 서류 보완하여 재제출 요청. 고객 적극적 협조 의사 있음.',
    status: '완료',
    nextAction: '서류 대기중'
  },
  {
    consultNo: 'CS-C20251230-0001-03',
    dbNo: 'DB-REF-20251230-0001',
    dbSource: '환급금조회',
    date: '2025-12-30 10:00',
    consultant: '김상담',
    type: '전화상담',
    content: '환급금 1,500,000원 안내 완료. 대면 미팅 희망함. 1월 3일 오후 2시 약속',
    detail: '고객에게 환급 가능 ���액 1,500,000원 안내 완료. 중복보험 정리 및 보장 분석을 위한 대면 미팅 희망. 1월 3일(금) 오후 2시 스타벅스 강남점에서 미팅 약속. 미팅팀에 배정 완료.',
    status: '완료',
    nextAction: '미팅팀 배정 완료'
  },
  {
    consultNo: 'CS-C20251230-0001-02',
    dbNo: 'DB-REF-20251230-0001',
    dbSource: '환급금조회',
    date: '2025-12-29 14:30',
    consultant: '이상담',
    type: '전화상담',
    content: '첫 연락, 상담 가능 시간 확인. 환급금에 관심 있음',
    detail: '고객에게 첫 연락 시도. 환급금 조회 결과에 대해 안내 예정임을 설명. 고객은 환급금에 관심이 많으며, 상세 상담을 원함. 다음 통화에서 구체적인 금액과 절차 안내 예정.',
    status: '완료',
    nextAction: '환급금 안내 예정'
  },
  {
    consultNo: 'CS-C20251230-0001-01',
    dbNo: 'DB-REF-20251230-0001',
    dbSource: '환급금조회',
    date: '2025-12-28 11:00',
    consultant: '박상담',
    type: '전화상담',
    content: '부재중 - 재시도 필요',
    detail: '첫 번째 통화 시도. 고객 부재중으로 연결 안됨. 음성사서함에 메시지 남김. 내일 오전 중 재시도 예정.',
    status: '보류',
    nextAction: '재통화 예정'
  }
];

const HISTORY_DATA = [
  { id: 1, date: '2025-12-30 10:00', type: '상담완료', user: '김상담', detail: '환급금 안내 완료' },
  { id: 2, date: '2025-12-29 14:30', type: 'DB 유입', user: 'System', detail: '틱톡 광고' },
  { id: 3, date: '2025-12-28 16:20', type: '문자발송', user: '이마케팅', detail: '첫 연락 문자' }
];

const CONTRACT_DATA = [
  { 
    id: 1, 
    company: '현대해상', 
    product: '무배당 실손보험', 
    policyNo: '2024-1234-5678',
    status: '정상',
    premium: 55000,
    contractDate: '2023-03-15'
  },
  { 
    id: 2, 
    company: '삼성생명', 
    product: '종합건강보험', 
    policyNo: '2023-9876-5432',
    status: '정상',
    premium: 120000,
    contractDate: '2022-11-20'
  },
  { 
    id: 3, 
    company: 'KB손해보험', 
    product: '자동차보험', 
    policyNo: '2024-1111-2222',
    status: '만기예정',
    premium: 85000,
    contractDate: '2024-01-10'
  }
];

const CONSULTATION_DATA = [
  { id: 1, date: '2025-12-30 10:00', consultant: '김상담', type: '전화상담', content: '환급금 1,500,000원 안내 완료. 미팅 희망', status: '완료' },
  { id: 2, date: '2025-12-29 14:30', consultant: '이상담', type: '문자상담', content: '첫 연락, 상담 가능 시간 확인', status: '완료' },
  { id: 3, date: '2025-12-28 11:00', consultant: '박상담', type: '전화상담', content: '부재중 - 재시도 필요', status: '보류' }
];

// Profile Checklist - 18 essential customer data points
const PROFILE_CHECKLIST = [
  { label: '나이', key: 'age' },
  { label: '성별', key: 'gender' },
  { label: '지역', key: 'region' },
  { label: '3개월 내 병력', key: 'history_3m' },
  { label: '계약자 피보험자 상이', key: 'diff_contractor' },
  { label: '5년 이내 3대질환 병력', key: 'history_5y_critical' },
  { label: '설계사 관계', key: 'planner_rel' },
  { label: '보험가입금액', key: 'insurance_amount' },
  { label: '보험가입 종류', key: 'type' },
  { label: '환급 가능 금액', key: 'refundEstimate' },
  { label: '보험분쟁 유무', key: 'dispute' },
  { label: '결정권자 여부', key: 'decision_maker' },
  { label: '가족 연동 수', key: 'family_count' },
  { label: '가족력', key: 'family_history' },
  { label: '혼인여부', key: 'marriage' },
  { label: '보험 해지이력', key: 'cancel_history' },
  { label: '수술 이력', key: 'surgery_history' },
  { label: '법률 서비스 경험 유무', key: 'legal_exp' },
];

// Family Data (Mock)
const FAMILY_DATA = [
  {
    id: 'F-001',
    relation: '배우자',
    name: '김철수',
    age: 38,
    phone: '010-9876-****',
    appInstalled: true,
    isJoined: true,
    insuranceLinked: true,
    healthInsuranceLinked: true,
    hometaxLinked: false,
    insuranceCount: 3,
    managedCount: 1,
    refundStatus: '조회완료',
    refundAmount: 450000,
    lastLogin: '2025.12.28'
  },
  {
    id: 'F-002',
    relation: '자녀',
    name: '김미소',
    age: 8,
    phone: '010-****-****',
    appInstalled: false,
    isJoined: false,
    insuranceLinked: false,
    healthInsuranceLinked: false,
    hometaxLinked: false,
    insuranceCount: 1,
    managedCount: 0,
    refundStatus: '미조회',
    refundAmount: 0,
    lastLogin: '-'
  }
];

// Who introduced this customer (Mock)
const INTRODUCER_DATA = {
  name: '박지성',
  phone: '010-7777-8888',
  relation: '지인',
  manager: '김상담',
  joinDate: '2024-05-20'
};

// Introduction History Data (Mock)
const INTRODUCTION_DATA = [
  {
    id: 'I-001',
    name: '최민수',
    phone: '010-3333-****',
    relation: '직장동료',
    manager: '김상담',
    introDate: '2026-01-10',
    joinDate: null // 미가입
  },
  {
    id: 'I-002',
    name: '강하나',
    phone: '010-4444-****',
    relation: '지인',
    manager: '김상담',
    introDate: '2025-12-28',
    joinDate: '2026-01-05'
  }
];

interface CustomerDetailProps {
  lead?: any;
  onBack?: () => void;
}

export function CustomerDetail({ lead, onBack }: CustomerDetailProps) {
  const [activeTab, setActiveTab] = useState('접수이력');
  const [memo, setMemo] = useState('');
  const [selectedConsultation, setSelectedConsultation] = useState<any>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [isCredit4ULinked, setIsCredit4ULinked] = useState(true);

  // Use lead data if provided, otherwise use default CUSTOMER_DATA
  const customerData = lead ? {
    ...CUSTOMER_DATA,
    name: lead.name,
    phone: lead.phone,
    manager: lead.manager,
  } : CUSTOMER_DATA;

  // Mock Requests for this customer
  const CUSTOMER_REQUESTS = [
    { id: 'R-2026-001', type: '3년 환급', customer: customerData.name, date: '2026-01-19', stage: '상담', status: '진행 중', team: '상담팀', manager: '김상담' },
    { id: 'R-2025-088', type: '간편 청구', customer: customerData.name, date: '2025-12-15', stage: '청구', status: '완료', team: '청구팀', manager: '최청구' },
  ];

  const tabs = ['접수이력', '계약현황', '보험 내역', '가족연동', '소개내역', '첨부파일'];

  // Tab counts
  const tabCounts: { [key: string]: number | string } = {
    '접수이력': CUSTOMER_REQUESTS.length,
    '계약현황': CONTRACT_DATA.length,
    '보험 내역': isCredit4ULinked ? '연동' : '미연동',
    '가족연동': FAMILY_DATA.length,
    '소개내역': INTRODUCTION_DATA.length,
    '첨부파일': 3
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-y-auto">
      
      {/* Top Header Bar - 기본 정보 (Sticky) */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" onClick={onBack}>
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
              <h1 className="text-xl font-bold text-slate-800 flex items-baseline gap-2">
                {customerData.name} 상세 페이지
                <span className="text-sm font-normal text-slate-400 font-mono">{customerData.customerNo}</span>
              </h1>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowAnalysisModal(true)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 flex items-center gap-1"
              >
                <Activity size={16} /> 분석 리포트
              </button>
              <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
                <Download size={16} className="inline mr-1" /> 내보내기
              </button>
              <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700">
                <Save size={16} className="inline mr-1" /> 저장
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section (Scrollable) */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-6 py-4">
          {/* Customer Basic Info Grid */}
          <div className="bg-slate-50/80 rounded-xl p-5 border border-slate-200">
            <div className="grid grid-cols-4 gap-y-5 gap-x-2 text-sm">
              <InfoField 
                label="고객등급" 
                value={
                  <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded text-xs font-bold shadow-sm">
                    ⭐ {customerData.grade}
                  </span>
                } 
              />
              <InfoField label="고객명" value={<span className="font-bold text-slate-800 text-base">{customerData.name}</span>} />
              <InfoField label="휴대폰" value={<span className="font-mono text-slate-700 font-medium">{customerData.phone}</span>} />
              <InfoField label="주민번호" value={<span className="font-mono text-slate-500">{customerData.idNumber}</span>} />
              
              <InfoField label="나이" value={<span className="text-slate-700">만 {customerData.age}세</span>} />
              <InfoField label="성별" value={<span className="text-slate-700">{customerData.gender || '미상'}</span>} />
              <InfoField label="지역" value={<span className="text-slate-700">{customerData.region}</span>} />
              <InfoField label="담당자" value={<span className="font-bold text-slate-700">{customerData.manager}</span>} />

              <InfoField 
                label="유입경로 (UTM)" 
                value={
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-white shadow-sm">
                      {customerData.analysis.source}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate max-w-[80px]" title={customerData.dbSource}>
                      {customerData.dbSource}
                    </span>
                  </div>
                } 
              />
              <InfoField label="등록일" value={<span className="font-mono text-slate-500">{customerData.consentDate}</span>} />
              <InfoField label="최근방문" value={<span className="font-mono text-slate-600">{customerData.analysis.lastContact}</span>} />
              <InfoField 
                label="마케팅동의" 
                value={
                  <span className={clsx("text-xs font-bold px-2 py-0.5 rounded border", customerData.marketingConsent === '동의함' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-100 text-slate-500 border-slate-200")}>
                    {customerData.marketingConsent}
                  </span>
                } 
              />

              <InfoField label="앱 설치" value={<span className="text-slate-400 text-xs flex items-center gap-1">미설치</span>} />
              <InfoField 
                label="건강보험" 
                value={
                  <div className="flex flex-col justify-center">
                    <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                      <CheckCircle2 size={12}/> 연동완료
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono ml-4">2025.12.30</span>
                  </div>
                } 
              />
              <InfoField label="홈택스" value={<span className="text-slate-400 text-xs flex items-center gap-1">미연동</span>} />
              <InfoField label="크레딧포유" value={
                isCredit4ULinked ? (
                  <div className="flex flex-col justify-center">
                    <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                      <CheckCircle2 size={12}/> 연동완료
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono ml-4">2025.12.30</span>
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs flex items-center gap-1">미연동</span>
                )
              } />
            </div>
          </div>

          {/* Customer Profile Summary - 18 Essential Data Points */}
          <div className="mt-4 border-t border-slate-200 pt-4">
            <label className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-3">
              <CheckSquare size={14} className="text-slate-400"/> 고객 프로필 요약 (18개 핵심 데이터)
            </label>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-y-3 gap-x-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
              {PROFILE_CHECKLIST.map((item, idx) => {
                // Map profile checklist keys to customer data
                const valueMap: any = {
                  'age': customerData.age,
                  'gender': customerData.gender,
                  'region': customerData.region,
                  'history_3m': customerData.analysis.recentMedical ? '있음' : '없음',
                  'diff_contractor': customerData.analysis.contractMatch,
                  'history_5y_critical': customerData.analysis.criticalIllness ? '있음' : '없음',
                  'planner_rel': customerData.analysis.plannerRelation,
                  'insurance_amount': customerData.analysis.premium ? `${customerData.analysis.premium.toLocaleString()}원` : undefined,
                  'type': customerData.analysis.insuranceType,
                  'refundEstimate': customerData.analysis.refundAmount ? (customerData.analysis.refundAmount / 10000).toFixed(0) : undefined,
                  'dispute': customerData.analysis.dispute ? '있음' : '없음',
                  'decision_maker': customerData.analysis.decisionMaker,
                  'family_count': customerData.analysis.familyCount,
                  'family_history': customerData.analysis.familyHistory,
                  'marriage': customerData.analysis.maritalStatus,
                  'cancel_history': customerData.analysis.cancellationHistory,
                  'surgery_history': customerData.analysis.surgeryHistory,
                  'legal_exp': customerData.analysis.legalService ? '있음' : '없음',
                };
                const value = valueMap[item.key];
                
                return (
                  <div key={idx} className="flex flex-col border-l-2 border-slate-300 pl-2">
                    <span className="text-[10px] text-slate-400 mb-0.5 truncate leading-none" title={item.label}>
                      {item.label}
                    </span>
                    <span className="text-xs font-bold text-slate-700 truncate min-h-[1rem]">
                      {value || '-'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section - Removed */}
      <div className="hidden">
        
        {/* Left 2/3 - Analysis & Grade - Hidden by default now, moved to Modal */}
        {/* <div className="flex-1 p-6"> ... </div> */}

        {/* Right 1/3 - Operations Panel (Sticky) -> Expanded to take more space since Analysis is gone */}
        <div className="w-96 border-l border-slate-200 bg-white flex flex-col shrink-0 flex-1">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-800 text-white">
            <h3 className="font-bold flex items-center gap-2">
              <MessageSquare size={18} />
              메모 및 이력 관리
            </h3>
          </div>

          <div className="flex-1 p-6 space-y-6">
            
            {/* Memo Input */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">상담 메모 등록</label>
              <textarea 
                className="w-full h-32 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                placeholder="메모를 입력하세요..."
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => toast.success('저장되었습니다')}
                className="flex items-center justify-center gap-2 bg-slate-800 text-white py-2.5 rounded-lg hover:bg-slate-900 text-sm font-medium transition-colors"
              >
                <Save size={16} /> 저장
              </button>
              <button
                type="button"
                onClick={() => toast('문자 발송은 준비 중입니다')}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
              >
                <Send size={16} /> 문자 발송
              </button>
              <button
                type="button"
                onClick={() => toast('미팅팀 배정은 준비 중입니다')}
                className="flex items-center justify-center gap-2 bg-teal-600 text-white py-2.5 rounded-lg hover:bg-teal-700 text-sm font-medium transition-colors shadow-md"
              >
                <Users size={16} /> 미팅팀 배정 (Handoff)
              </button>
            </div>

            {/* Recent History */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-600">통합 이력 (All Activities)</h4>
                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{ALL_HISTORY_DATA.length}건</span>
              </div>
              <div className="space-y-2">
                {ALL_HISTORY_DATA.map((item) => (
                  <div key={item.id} className={clsx(
                    "border rounded-lg p-3 hover:bg-slate-50 transition-colors",
                    item.category === 'consultation' ? "border-teal-200 bg-teal-50/30" :
                    item.category === 'message' ? "border-blue-200 bg-blue-50/30" :
                    item.category === 'status' ? "border-purple-200 bg-purple-50/30" :
                    item.category === 'memo' ? "border-amber-200 bg-amber-50/30" :
                    "border-slate-200"
                  )}>
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          "text-xs font-bold",
                          item.category === 'consultation' ? "text-teal-700" :
                          item.category === 'message' ? "text-blue-700" :
                          item.category === 'status' ? "text-purple-700" :
                          item.category === 'memo' ? "text-amber-700" :
                          "text-slate-800"
                        )}>{item.type}</span>
                        {item.consultNo && (
                          <span className="text-xs bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-teal-600">
                            {item.consultNo}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">{item.user}</span>
                    </div>
                    <div className="text-xs text-slate-600 mb-1">{item.detail}</div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={10} />
                        {item.date}
                      </div>
                      <span className={clsx(
                        "text-xs px-1.5 py-0.5 rounded font-medium",
                        item.status === '완료' || item.status === '발송���료' ? "bg-green-100 text-green-700" :
                        item.status === '보류' ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Bottom Section - Tabbed Content */}
      <div className="bg-white border-t border-slate-200 shadow-lg">
        
        {/* Tabs Navigation */}
        <div className="flex border-b border-slate-200 px-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              <span>{tab}</span>
              <span className={clsx(
                "ml-2 text-xs font-bold",
                activeTab === tab ? "text-teal-600" : "text-slate-400",
                tab === '보험 내역' && (tabCounts[tab] === '연동' ? "text-emerald-600" : "text-slate-400")
              )}>
                {tabCounts[tab]}
              </span>
              {tab === '보상환급관리' && (
                <span className="ml-1.5 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">New</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          
          {/* 접수이력 Table (Replaces DB이력) */}
          {activeTab === '접수이력' && (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
               <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
                <h4 className="font-bold text-slate-700">고객 접수 현황 ({CUSTOMER_REQUESTS.length}건)</h4>
                <button className="px-3 py-1.5 bg-[#1e293b] text-white rounded text-xs font-medium hover:bg-slate-800 flex items-center gap-1">
                  <PlayCircle size={14} /> 신규 접수 등록
                </button>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 font-medium">접수 ID</th>
                    <th className="px-6 py-3 font-medium">접수 유형</th>
                    <th className="px-6 py-3 font-medium">고객명</th>
                    <th className="px-6 py-3 font-medium">접수일</th>
                    <th className="px-6 py-3 font-medium">현재 단계</th>
                    <th className="px-6 py-3 font-medium">담당팀</th>
                    <th className="px-6 py-3 font-medium">상태</th>
                    <th className="px-6 py-3 font-medium text-right">상세</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {CUSTOMER_REQUESTS.map((req) => (
                    <tr 
                      key={req.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
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
                      <td className="px-6 py-4 text-slate-600">{req.team}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 hover:text-[#1e293b] group-hover:translate-x-1 transition-transform p-1 rounded hover:bg-slate-100">
                          <ArrowLeft size={16} className="rotate-180" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === '계약현황' && (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600">No.</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600">보험사</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600">상품명</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600">증권번호</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600">계약상태</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600">보험료</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600">계약일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {CONTRACT_DATA.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-600">{item.id}</td>
                      <td className="px-4 py-3 text-slate-800 font-bold">{item.company}</td>
                      <td className="px-4 py-3 text-slate-700">{item.product}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">{item.policyNo}</td>
                      <td className="px-4 py-3">
                        <span className={clsx(
                          "px-2 py-1 rounded text-xs font-medium",
                          item.status === '정상' ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                        )}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-800 font-bold">{item.premium.toLocaleString()}원</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{item.contractDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === '보상환급관리' && (
            <div className="bg-slate-50 p-12 text-center rounded-lg border border-dashed border-slate-300">
              <DollarSign className="mx-auto text-slate-300 mb-3" size={48} />
              <p className="text-slate-500 text-sm font-medium mb-1">보상/환급 데이터 준비중</p>
              <p className="text-slate-400 text-xs">이번 배치에서는 고객 기본정보와 보험 내역을 우선 정리하고, 보상/환급 관리는 차기 범위에서 연결합니다.</p>
            </div>
          )}

          {activeTab === '보험 내역' && (
            <InsuranceMainView />
          )}

          {activeTab === '가족연동' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 border border-slate-200 rounded-lg">
                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <Users size={18} className="text-teal-600" />
                    연동된 가족 목록
                    <span className="text-sm font-normal text-slate-500 ml-1">총 {FAMILY_DATA.length}명</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">가족으로 연동되면 보험 보장 분석을 통합적으로 관리할 수 있습니다.</p>
                </div>
                <button className="flex items-center gap-1.5 px-4 py-2 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg text-sm font-bold hover:bg-teal-100 transition-colors">
                  <Users size={16} /> 가족 초대하기
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FAMILY_DATA.map((member: any) => (
                  <div key={member.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all relative overflow-hidden group">
                    
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-lg">
                          {member.relation === '배우자' ? '👩‍❤️‍👨' : member.relation === '자녀' ? '👶' : '👤'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-slate-900">{member.name}</span>
                            <span className="text-[11px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-center">{member.relation}</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">만 {member.age}세 · {member.phone}</div>
                        </div>
                      </div>
                      <button className="text-slate-300 hover:text-slate-600 transition-colors">
                        <ArrowLeft size={16} className="rotate-180" />
                      </button>
                    </div>

                    <div className="bg-slate-50/50 rounded-lg p-4 mb-4 grid grid-cols-3 gap-y-4 gap-x-2">
                        {/* 1. 가입 여부 */}
                        <div className="flex flex-col items-center text-center">
                          <span className="text-[10px] text-slate-400 mb-1">서비스 가입</span>
                          {member.isJoined ? (
                            <div className="flex items-center gap-1 text-slate-900">
                                <CheckCircle2 size={12} className="text-slate-900" />
                                <span className="text-xs font-medium">가입</span>
                            </div>
                          ) : (
                            <span className="text-xs font-normal text-slate-300">미가입</span>
                          )}
                        </div>

                        {/* 2. 앱 설치 */}
                        <div className="flex flex-col items-center text-center">
                          <span className="text-[10px] text-slate-400 mb-1">앱 설치</span>
                          {member.appInstalled ? (
                             <div className="flex items-center gap-1 text-slate-900">
                                <CheckCircle2 size={12} className="text-slate-900" />
                                <span className="text-xs font-medium">설치</span>
                            </div>
                          ) : (
                            <span className="text-xs font-normal text-slate-300">미설치</span>
                          )}
                        </div>

                         {/* 3. 3년 환급 */}
                         <div className="flex flex-col items-center text-center">
                          <span className="text-[10px] text-slate-400 mb-1">3년 환급</span>
                          {member.refundStatus === '조회완료' ? (
                            <div className="flex items-center gap-1 text-slate-900">
                                <CheckCircle2 size={12} className="text-slate-900" />
                                <span className="text-xs font-medium">조회</span>
                            </div>
                          ) : (
                            <span className="text-xs font-normal text-slate-300">{member.refundStatus}</span>
                          )}
                        </div>

                        <div className="col-span-3 h-px bg-slate-100" />

                        {/* 4. 보험 연동 */}
                        <div className="flex flex-col items-center text-center">
                          <span className="text-[10px] text-slate-400 mb-1">내보험다보여</span>
                          {member.insuranceLinked ? (
                             <div className="flex items-center gap-1 text-slate-900">
                                <CheckCircle2 size={12} className="text-slate-900" />
                                <span className="text-xs font-medium">연동</span>
                             </div>
                          ) : (
                             <span className="text-xs font-normal text-slate-300">미연동</span>
                          )}
                        </div>

                        {/* 5. 건강보험 */}
                        <div className="flex flex-col items-center text-center">
                          <span className="text-[10px] text-slate-400 mb-1">건강보험공단</span>
                          {member.healthInsuranceLinked ? (
                             <div className="flex items-center gap-1 text-slate-900">
                                <CheckCircle2 size={12} className="text-slate-900" />
                                <span className="text-xs font-medium">연동</span>
                             </div>
                          ) : (
                             <span className="text-xs font-normal text-slate-300">미연동</span>
                          )}
                        </div>

                        {/* 6. 홈택스 */}
                        <div className="flex flex-col items-center text-center">
                          <span className="text-[10px] text-slate-400 mb-1">국세청 홈택스</span>
                          {member.hometaxLinked ? (
                             <div className="flex items-center gap-1 text-slate-900">
                                <CheckCircle2 size={12} className="text-slate-900" />
                                <span className="text-xs font-medium">연동</span>
                             </div>
                          ) : (
                             <span className="text-xs font-normal text-slate-300">미연동</span>
                          )}
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 grid grid-cols-2 divide-x divide-slate-100">
                      <div className="pr-4">
                        <div className="text-xs text-slate-400 mb-1">총 보험 수</div>
                        <div className="text-base font-bold text-slate-900 flex items-baseline">
                          {member.insuranceCount}
                          <span className="text-xs font-normal text-slate-400 ml-0.5">건</span>
                          <span className="text-[11px] font-normal text-slate-500 ml-1.5">(더바다 {member.managedCount})</span>
                        </div>
                      </div>
                      <div className="pl-4">
                        <div className="text-xs text-slate-400 mb-1">예상 환급금</div>
                        <div className={clsx("text-base font-bold", member.refundAmount > 0 ? "text-slate-900" : "text-slate-300")}>
                          {member.refundAmount > 0 ? member.refundAmount.toLocaleString() : '0'}
                          <span className="text-xs font-normal text-slate-400 ml-0.5">원</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Add Family Placeholder Card - Minimal */}
                <button className="border border-dashed border-slate-300 rounded-xl p-5 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all group h-full min-h-[220px]">
                  <div className="size-10 rounded-full bg-slate-50 border border-slate-200 group-hover:bg-white group-hover:border-slate-300 flex items-center justify-center transition-all">
                    <Users size={20} className="text-slate-400 group-hover:text-slate-600" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-sm text-slate-600">가족 구성원 추가</div>
                    <div className="text-xs mt-1 text-slate-400">미성년 자녀 등록 및 가족 초대</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeTab === '소개내역' && (
             <div className="space-y-6">
               {/* 1. Introducer Section - Simple Card */}
               <div className="bg-white border border-slate-200 rounded-lg p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-full bg-slate-50 flex items-center justify-center text-lg text-slate-400 border border-slate-100">
                      <User size={20} />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-0.5">나를 소개해준 사람</div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-800">{INTRODUCER_DATA.name}</span>
                        <span className="text-xs text-slate-500 border-l border-slate-200 pl-2">{INTRODUCER_DATA.relation}</span>
                        <span className="text-xs text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-medium">{INTRODUCER_DATA.manager}</span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-1">{INTRODUCER_DATA.phone}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400 mb-0.5">가입일</div>
                    <div className="text-sm font-medium text-slate-700 font-mono">{INTRODUCER_DATA.joinDate}</div>
                  </div>
               </div>

               {/* 2. Referrals Section - Minimal Table */}
               <div>
                 <div className="flex items-center justify-between mb-3 px-1">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    내가 소개한 고객
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-xs font-normal">{INTRODUCTION_DATA.length}</span>
                  </h4>
                  <button className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors">
                    <UserPlus size={14} /> 소개 등록
                  </button>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-400 border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-3 font-normal pl-6">이름</th>
                        <th className="px-5 py-3 font-normal">연락처</th>
                        <th className="px-5 py-3 font-normal">관계</th>
                        <th className="px-5 py-3 font-normal">담당자</th>
                        <th className="px-5 py-3 font-normal">소개일</th>
                        <th className="px-5 py-3 font-normal text-right pr-6">상태/가입일</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {INTRODUCTION_DATA.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3 font-bold text-slate-700 pl-6">{item.name}</td>
                          <td className="px-5 py-3 font-mono text-slate-500 text-xs">{item.phone}</td>
                          <td className="px-5 py-3 text-slate-500 text-xs">{item.relation}</td>
                          <td className="px-5 py-3 text-slate-600 text-xs font-medium">{item.manager}</td>
                          <td className="px-5 py-3 font-mono text-slate-400 text-xs">{item.introDate}</td>
                          <td className="px-5 py-3 text-right pr-6">
                            {item.joinDate ? (
                               <span className="font-mono text-blue-600 font-medium text-xs">{item.joinDate}</span>
                            ) : (
                              <span className="text-[10px] text-slate-300">미가입</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === '첨부파일' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">총 3개 파일</span>
                <button className="text-xs flex items-center gap-1 text-slate-600 bg-white border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50">
                  <Upload size={14} /> 파일 추가
                </button>
              </div>
              
              <div className="space-y-2">
                <FileItem name="상담녹취_장진숙_20251230.mp3" type="audio" size="2.3 MB" source="3년환급 상담" />
                <FileItem name="보험증권_현대해상.pdf" type="pdf" size="1.1 MB" source="고객 앱 업로드" />
                <FileItem name="간편청구_진단서.pdf" type="pdf" size="0.8 MB" source="간편 청구" />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Memo & History Management - Moved to Bottom */}
      <div className="bg-white border-t border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={18} className="text-slate-800" />
          <h3 className="font-bold text-slate-800">메모 및 이력 관리</h3>
        </div>

        <div className="flex gap-6">
          {/* Memo Input */}
          <div className="w-1/3 space-y-3">
            <label className="block text-xs font-bold text-slate-600">상담 메모 등록</label>
            <textarea 
              className="w-full h-32 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              placeholder="메모를 입력하세요..."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
            
            <div className="grid grid-cols-3 gap-2">
              <button className="flex items-center justify-center gap-2 bg-slate-800 text-white py-2.5 rounded-lg hover:bg-slate-900 text-sm font-medium transition-colors">
                <Save size={16} /> 저장
              </button>
              <button className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
                <Send size={16} /> 문자 발송
              </button>
              <button className="flex items-center justify-center gap-2 bg-teal-600 text-white py-2.5 rounded-lg hover:bg-teal-700 text-sm font-medium transition-colors shadow-md">
                <Users size={16} /> Handoff
              </button>
            </div>
          </div>

          {/* Recent History */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-600">통합 이력 (All Activities)</h4>
              <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{ALL_HISTORY_DATA.length}건</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {ALL_HISTORY_DATA.map((item) => (
                <div key={item.id} className={clsx(
                  "border rounded-lg p-3 hover:bg-slate-50 transition-colors",
                  item.category === 'consultation' ? "border-teal-200 bg-teal-50/30" :
                  item.category === 'message' ? "border-blue-200 bg-blue-50/30" :
                  item.category === 'status' ? "border-purple-200 bg-purple-50/30" :
                  item.category === 'memo' ? "border-amber-200 bg-amber-50/30" :
                  "border-slate-200"
                )}>
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        "text-xs font-bold",
                        item.category === 'consultation' ? "text-teal-700" :
                        item.category === 'message' ? "text-blue-700" :
                        item.category === 'status' ? "text-purple-700" :
                        item.category === 'memo' ? "text-amber-700" :
                        "text-slate-800"
                      )}>{item.type}</span>
                      {item.consultNo && (
                        <span className="text-xs bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-teal-600">
                          {item.consultNo}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{item.user}</span>
                  </div>
                  <div className="text-xs text-slate-600 mb-1">{item.detail}</div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={10} />
                      {item.date}
                    </div>
                    <span className={clsx(
                      "text-xs px-1.5 py-0.5 rounded font-medium",
                      item.status === '완료' || item.status === '발송완료' ? "bg-green-100 text-green-700" :
                      item.status === '보류' ? "bg-amber-100 text-amber-700" :
                      "bg-slate-100 text-slate-600"
                    )}>
                      {item.status}
                    </span>
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

/* --- Helper Components --- */

function InfoField({ label, value }: { label: string, value: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-slate-500 mb-1">{label}</span>
      <div className="font-medium text-slate-800">{value}</div>
    </div>
  );
}

function AnalysisItem({ label, value, highlight }: { label: string, value: string, highlight?: 'high' | 'positive' | 'warning' | 'normal' }) {
  const getHighlightStyle = () => {
    switch (highlight) {
      case 'high':
        return 'bg-gradient-to-r from-amber-50 to-orange-50 border-orange-200 text-orange-700 font-bold';
      case 'positive':
        return 'bg-green-50 border-green-200 text-green-700 font-medium';
      case 'warning':
        return 'bg-red-50 border-red-200 text-red-700 font-medium';
      default:
        return 'bg-white border-slate-200 text-slate-700';
    }
  };

  return (
    <div className={clsx(
      "border rounded-lg p-3 text-sm",
      getHighlightStyle()
    )}>
      <div className="text-xs opacity-70 mb-1">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function FileItem({ name, type, size, source }: { name: string, type: 'pdf' | 'audio', size: string, source?: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors group">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className={clsx(
          "p-2 rounded",
          type === 'pdf' ? "bg-red-100 text-red-600" : "bg-purple-100 text-purple-600"
        )}>
          {type === 'pdf' ? <FileText size={16} /> : <PlayCircle size={16} />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-slate-800 font-medium truncate">{name}</div>
            {source && (
              <span className="text-[10px] bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                {source}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500">{size}</div>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-2 hover:bg-white rounded text-slate-600">
          <Download size={14} />
        </button>
        <button className="p-2 hover:bg-white rounded text-red-500">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function DetailField({ label, value, mono, badge, badgeColor }: { label: string, value: string, mono?: boolean, badge?: boolean, badgeColor?: 'blue' | 'purple' }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-slate-500 mb-1">{label}</span>
      <div className="font-medium text-slate-800">
        {mono ? (
          <span className="font-mono text-xs text-blue-600 font-medium">{value}</span>
        ) : badge ? (
          <span className={clsx(
            "bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs",
            badgeColor === 'blue' ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
          )}>
            {value}
          </span>
        ) : (
          value
        )}
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
