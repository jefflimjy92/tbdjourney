import React, { useState, useEffect, useMemo } from 'react';
import { 
  Filter, 
  Save, 
  FileText, 
  DollarSign, 
  ArrowLeft, 
  CheckCircle2, 
  Search,
  ArrowRightLeft,
  Calendar,
  Building,
  Activity,
  CreditCard,
  User,
  Upload,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BarChart3,
  HelpCircle,
  PenLine,
  Trash2,
  Share,
  DownloadCloud,
  Printer,
  AlertCircle
} from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useIssuanceOperations } from '@/app/issuance/IssuanceContext';

// Standard Components
import { UnclaimedAnalysisView } from '@/app/components/claims/UnclaimedAnalysisView';
import { CustomerProfileSummary } from '@/app/components/CustomerProfileSummary';
import { CustomerInputSection } from '@/app/components/CustomerInputSection';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import LiveRecordSection from '@/imports/Container-168-10370';
import { ContractInfoSection, ContractData } from '@/app/components/ContractInfoSection';
import { FileAttachment } from '@/app/components/FileAttachmentSection';
import { ListPeriodControls } from '@/app/components/ListPeriodControls';
import { MOCK_DATA } from '@/app/mockData';
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

const CLAIM_PROCESS_STEPS = [
  { key: 'step0', label: 'STEP 0', shortLabel: '접수' },
  { key: 'step1', label: 'STEP 1', shortLabel: '프로필' },
  { key: 'step2', label: 'STEP 2', shortLabel: '보험' },
  { key: 'step3', label: 'STEP 3', shortLabel: '환급' },
  { key: 'step4', label: 'STEP 4', shortLabel: '지급' },
  { key: 'step5', label: 'STEP 5', shortLabel: '분석' },
  { key: 'step6', label: 'STEP 6', shortLabel: '서류' },
  { key: 'step7', label: 'STEP 7', shortLabel: '최종' },
] as const;

function getClaimJourneyStage(status: string) {
  switch (status) {
    case '접수완료':
      return '청구 접수';
    case '상담완료':
      return '상담 완료';
    case '분석중':
      return '환급 분석';
    case '서류확정':
      return '서류 확정';
    case '운영전송대기':
      return '운영 전송 대기';
    case '운영진행중':
      return '서류 발급 운영';
    case '보완요청':
      return '보완 진행';
    case '지급심사':
      return '지급 심사';
    case '지급완료':
    case '완료':
      return '청구 완료';
    default:
      return status;
  }
}

function getClaimCurrentStepIndex(status: string) {
  switch (status) {
    case '접수완료':
      return 0;
    case '상담완료':
      return 1;
    case '분석중':
      return 3;
    case '서류확정':
      return 5;
    case '운영전송대기':
    case '운영진행중':
    case '보완요청':
      return 6;
    case '지급심사':
    case '지급완료':
    case '완료':
      return 7;
    default:
      return 0;
  }
}

function formatClaimRegion(address?: string) {
  if (!address) {
    return '-';
  }

  return address.split(' ').slice(0, 2).join(' ');
}

// Mock Data for Claims Queue
const LEGACY_CLAIMS_QUEUE = [
  { 
    id: 'CLM-2024-001', 
    requestId: 'R-2026-001',
    customer: '이영희', 
    type: '3년 환급', 
    category: 'refund',
    date: '2026-03-12', 
    status: '분석중', 
    insurance: '삼성화재', 
    phone: '010-9876-5432',
    birth: '921103-2******'
  },
  { 
    id: 'CLM-2024-004', 
    requestId: 'R-2026-004',
    customer: '최지우', 
    type: '3년 환급', 
    category: 'refund',
    date: '2026-03-10', 
    status: '서류확정', 
    insurance: '메리츠화재', 
    phone: '010-6654-2211',
    birth: '940415-2******'
  },
  { 
    id: 'CLM-2024-005', 
    requestId: 'R-2026-005',
    customer: '정수빈', 
    type: '3년 환급', 
    category: 'refund',
    date: '2026-03-08', 
    status: '운영전송대기', 
    insurance: '삼성화재', 
    phone: '010-7123-9090',
    birth: '960822-2******'
  },
  { 
    id: 'CLM-2024-006', 
    requestId: 'R-2026-006',
    customer: '한지민', 
    type: '3년 환급', 
    category: 'refund',
    date: '2026-03-05', 
    status: '운영진행중', 
    insurance: 'DB손해보험', 
    phone: '010-2208-4120',
    birth: '890213-2******'
  },
  { 
    id: 'CLM-2024-007', 
    requestId: 'R-2026-007',
    customer: '윤도현', 
    type: '3년 환급', 
    category: 'refund',
    date: '2026-03-02', 
    status: '완료', 
    insurance: '현대해상', 
    phone: '010-1933-7710',
    birth: '910307-1******'
  },
  { 
    id: 'CLM-2024-002', 
    requestId: 'R-2026-002',
    customer: '김철수', 
    type: '간편 청구', 
    category: 'simple',
    date: '2026-02-27', 
    status: '지급심사', 
    insurance: '메리츠화재', 
    phone: '010-1234-5678', 
    birth: '900505-1******'
  },
  { 
    id: 'CLM-2024-003', 
    requestId: 'R-2026-003',
    customer: '박민수', 
    type: '간편 청구', 
    category: 'simple',
    date: '2026-02-21', 
    status: '지급완료', 
    insurance: '현대해상', 
    phone: '010-1111-2222', 
    birth: '880808-1******'
  },
  {
    id: 'CLM-2024-008',
    requestId: 'R-2026-008',
    customer: '윤서연',
    type: '3년 환급',
    category: 'refund',
    date: '2026-02-15',
    status: '상담완료',
    insurance: '삼성화재',
    phone: '010-4421-1882',
    birth: '950411-2******'
  },
  {
    id: 'CLM-2024-009',
    requestId: 'R-2026-009',
    customer: '조민호',
    type: '3년 환급',
    category: 'refund',
    date: '2026-02-11',
    status: '운영진행중',
    insurance: 'KB손해보험',
    phone: '010-2291-7708',
    birth: '870320-1******'
  },
  {
    id: 'CLM-2024-010',
    requestId: 'R-2026-010',
    customer: '한수진',
    type: '간편 청구',
    category: 'simple',
    date: '2026-01-27',
    status: '지급심사',
    insurance: '현대해상',
    phone: '010-7741-6250',
    birth: '930728-2******'
  },
  {
    id: 'CLM-2024-011',
    requestId: 'R-2026-011',
    customer: '오태윤',
    type: '간편 청구',
    category: 'simple',
    date: '2026-01-18',
    status: '보완요청',
    insurance: 'DB손해보험',
    phone: '010-8188-2234',
    birth: '840915-1******'
  },
  {
    id: 'CLM-2024-012',
    requestId: 'R-2026-012',
    customer: '서지민',
    type: '3년 환급',
    category: 'refund',
    date: '2025-12-20',
    status: '완료',
    insurance: '메리츠화재',
    phone: '010-6055-1187',
    birth: '910904-2******'
  },
  {
    id: 'CLM-2024-013',
    requestId: 'R-2026-013',
    customer: '박서윤',
    type: '간편 청구',
    category: 'simple',
    date: '2026-03-12',
    status: '접수완료',
    insurance: '현대해상',
    phone: '010-4551-7234',
    birth: '910115-2******'
  },
  {
    id: 'CLM-2024-014',
    requestId: 'R-2026-014',
    customer: '장우진',
    type: '3년 환급',
    category: 'refund',
    date: '2026-03-09',
    status: '분석중',
    insurance: '삼성화재',
    phone: '010-7812-4435',
    birth: '860903-1******'
  },
  {
    id: 'CLM-2024-015',
    requestId: 'R-2026-015',
    customer: '서민지',
    type: '3년 환급',
    category: 'refund',
    date: '2026-03-06',
    status: '서류확정',
    insurance: 'DB손해보험',
    phone: '010-9124-1055',
    birth: '940728-2******'
  },
  {
    id: 'CLM-2024-016',
    requestId: 'R-2026-016',
    customer: '한동현',
    type: '간편 청구',
    category: 'simple',
    date: '2026-03-01',
    status: '지급심사',
    insurance: '메리츠화재',
    phone: '010-3004-8271',
    birth: '820514-1******'
  },
  {
    id: 'CLM-2024-017',
    requestId: 'R-2026-017',
    customer: '유나경',
    type: '3년 환급',
    category: 'refund',
    date: '2026-02-24',
    status: '상담완료',
    insurance: 'KB손해보험',
    phone: '010-6741-2288',
    birth: '970212-2******'
  },
  {
    id: 'CLM-2024-018',
    requestId: 'R-2026-018',
    customer: '오승민',
    type: '간편 청구',
    category: 'simple',
    date: '2026-02-18',
    status: '보완요청',
    insurance: '현대해상',
    phone: '010-2287-3341',
    birth: '880822-1******'
  },
  {
    id: 'CLM-2024-019',
    requestId: 'R-2026-019',
    customer: '임수연',
    type: '3년 환급',
    category: 'refund',
    date: '2026-02-09',
    status: '운영전송대기',
    insurance: '삼성화재',
    phone: '010-5449-6672',
    birth: '930426-2******'
  },
  {
    id: 'CLM-2024-020',
    requestId: 'R-2026-020',
    customer: '조현우',
    type: '간편 청구',
    category: 'simple',
    date: '2026-01-31',
    status: '지급완료',
    insurance: 'DB손해보험',
    phone: '010-1105-9902',
    birth: '900907-1******'
  },
  {
    id: 'CLM-2024-021',
    requestId: 'R-2026-021',
    customer: '김도윤',
    type: '3년 환급',
    category: 'refund',
    date: '2026-01-11',
    status: '분석중',
    insurance: '현대해상',
    phone: '010-7811-2480',
    birth: '850404-1******'
  },
  {
    id: 'CLM-2024-022',
    requestId: 'R-2026-022',
    customer: '최유리',
    type: '간편 청구',
    category: 'simple',
    date: '2025-11-27',
    status: '완료',
    insurance: '메리츠화재',
    phone: '010-6614-5008',
    birth: '960930-2******'
  }
];

const CLAIMS_QUEUE = MOCK_DATA.claimsQueue;

// Initial Mock Data for Doc Issuance
const INITIAL_DOC_LIST = [
  {
    id: 1,
    source: 'auto', // 'auto' | 'manual'
    date: '2024.10.17',
    hospital: '이사랑치과의원',
    location: '서울특별시 중구 청구로 70 신진빌딩 2층',
    insurer: '메리츠화재',
    docs: [
        { name: '진료비 영수증(일자별)', status: 'uploaded', file: 'receipt_01.jpg' },
        { name: '진료비 세부내역서(일자별)', status: 'uploaded', file: 'detail_01.jpg' },
        { name: '진료확인서 (질병코드 포함)', status: 'pending', file: null }
    ],
    status: 'partial', // 'pending' | 'partial' | 'completed'
    fileName: null
  },
  {
    id: 2,
    source: 'auto',
    date: '2024.10.02',
    hospital: '신당청구역마취통증의학과의원',
    location: '서울 중구 다산로 185 신흥빌딩 3층 302호',
    insurer: '메리츠화재',
    docs: [
        { name: '진료비 영수증(일자별)', status: 'pending', file: null },
        { name: '진료비 세부내역서(일자별)', status: 'pending', file: null },
        { name: '진료확인서 (질병코드 포함)', status: 'pending', file: null }
    ],
    status: 'pending',
    fileName: null
  },
  {
    id: 3,
    source: 'auto',
    date: '2024.06.14',
    hospital: '더드림산부인과의원',
    location: '서울 중구 다산로36길 11',
    insurer: '메리츠화재',
    docs: [
        { name: '진료비 영수증(일자별)', status: 'pending', file: null },
        { name: '진료비 세부내역서(일자별)', status: 'pending', file: null },
        { name: '진료확인서 (질병코드 포함)', status: 'pending', file: null }
    ],
    status: 'pending',
    fileName: null
  },
  {
    id: 4,
    source: 'manual',
    date: '2023.01.30',
    hospital: '국립중앙의료원 (응급의학과)',
    location: '서울특별시 중구 을지로 245 국립중앙의료원',
    insurer: '메리츠화재',
    docs: [
        { name: '진료비 영수증(일자별)', status: 'uploaded', file: 'receipt_04.jpg' },
        { name: '진료비 세부내역서(일자별)', status: 'uploaded', file: 'detail_04.jpg' },
        { name: '진료확인서 (질병코드 포함)', status: 'uploaded', file: 'confirmation_04.jpg' },
        { name: '응급실 기록지', status: 'uploaded', file: 'er_record.pdf' }
    ],
    status: 'completed',
    fileName: '국립중앙의료원_통합.zip'
  }
];

// Mock Data for Medical Records (HIRA) vs Insurance History
const MEDICAL_RECORDS = [
  { 
    id: 1, 
    date: '2025.12.10', 
    hospital: '연세세브란스병원', 
    diagnosis: '급성 위궤양 (K25)', 
    cost: 158000, 
    matched: true, 
    payout: { insurer: '삼성화재', date: '2025.12.24', amount: 120000 } 
  },
  { 
    id: 2, 
    date: '2025.11.15', 
    hospital: '튼튼정형외과', 
    diagnosis: '발목 염좌 및 긴장 (S93)', 
    cost: 85000, 
    matched: false, 
    payout: null 
  },
];

// Provided Insurance Data
const INSURANCE_MOCK_DATA = {
   summary: {
      total: 22,
      valid: 7,
      self: 5,
      other: 2,
      invalid: 15,
      lapsed: 0
   },
   fixedContracts: [
      { holder: '임준영', name: '운전자보험', period: '03 년', premium: '287,240 원', status: '정상', start: '2025.07.11', end: '2028.07.11' },
      { holder: '삼*****', name: '삼성 5대재해골절보장보험(2404)(무배당)', period: '00 년', premium: '1,800 원', status: '정상', start: '2025.01.08', end: '2028.01.08' },
      { holder: '임준영', name: '참좋은라이더+보험2204_TM', period: '15 년', premium: '18,800 원', status: '정상', start: '2022.04.29', end: '2037.04.29' },
      { holder: '임준영', name: '무배당 삼성화재 다이렉트 치아보험(2101.6)(자동갱신형)', period: '10 년', premium: '18,597 원', status: '정상', start: '2022.03.22', end: '2032.03.22' },
      { holder: '임준영', name: '무배당굿앤굿어린이스타종합보험(Hi2110)2종(해지환급금미지급형Ⅰ)', period: '20 년', premium: '130,240 원', status: '정상', start: '2021.11.19', end: '2092.11.19' },
      { holder: '전*자', name: '(무)수호천사 실속하나로암보험(순수보장형-실속형)', period: '30 년', premium: '10,800 원', status: '정상', start: '2021.11.04', end: '2051.11.04' },
      { holder: '임준영', name: '무배당삼성화재 통합보험NEW수퍼플러스(1404)라이프+', period: '20 년', premium: '41,756 원', status: '정상', start: '2014.07.04', end: '2092.07.04' },
   ],
   indemnityContracts: [
      { 
         name: '애니카다이렉트_개인용', 
         status: '정상', 
         insurer: '삼성화재해상보험', 
         policyNo: '125Z4*****', 
         start: '2025.12.29', 
         end: '2026.10.17',
         details: [
            { name: '무보험차에 의한 상해 영업용 외', amount: '200,000,000 원', status: '정상', start: '2025.12.29', end: '2026.10.17' },
            { name: '다른자동차 운전', amount: '1,000 원', status: '정상', start: '2025.12.29', end: '2026.10.17' }
         ]
      },
      { 
         name: '애니카다이렉트_개인용', 
         status: '정상', 
         insurer: '삼성화재해상보험', 
         policyNo: '125V2*****', 
         start: '2025.10.17', 
         end: '2026.10.17',
         details: [
            { name: '무보험차에 의한 상해 영업용 외', amount: '700,000,000 원', status: '정상', start: '2025.10.17', end: '2026.10.17' },
            { name: '다른자동차 운전', amount: '1,000 원', status: '정상', start: '2025.10.17', end: '2026.10.17' },
            { name: '다른자동차 손해', amount: '23,130,000 원', status: '정상', start: '2025.10.17', end: '2026.10.17' }
         ]
      },
      { 
         name: '운전자보험', 
         status: '정상', 
         insurer: '카카오페이손해보험', 
         policyNo: 'FA202*****', 
         start: '2025.07.11', 
         end: '2028.07.11',
         details: [
            { name: '자전거사고 벌금담보', amount: '20,000,000 원', status: '정상', start: '2025.07.11', end: '2028.07.11' },
            { name: '교통사고 벌금(대물)', amount: '5,000,000 원', status: '정상', start: '2025.07.11', end: '2028.07.11' },
            { name: '교통사고 벌금(스쿨존 추가보장)', amount: '30,000,000 원', status: '정상', start: '2025.07.11', end: '2028.07.11' },
            { name: '교통사고처리지원금(중상해포함)', amount: '200,000,000 원', status: '정상', start: '2025.07.11', end: '2028.07.11' },
            { name: '자전거사고 교통사고처리지원금', amount: '30,000,000 원', status: '정상', start: '2025.07.11', end: '2028.07.11' },
            { name: '교통사고 처리지원금(6주미만 진단)', amount: '10,000,000 원', status: '정상', start: '2025.07.11', end: '2028.07.11' },
            { name: '자동차사고 변호사선임비용', amount: '50,000,000 원', status: '정상', start: '2025.07.11', end: '2028.07.11' }
         ]
      }
   ],
   payoutHistory: [
      { name: '무배당삼성화재 통합보험NEW수퍼플러스(1404)라이프+', policyNo: '51409819780000', insurer: '삼성화재해상보험', accidentDate: '2025-05-20', totalAmount: '176,100', details: [
         { date: '2025-06-12', type: '인보험', reason: '질병통원의료비(실손)', result: '지급', amount: '176,100' }
      ]},
      { name: '무배당삼성화재 통합보험NEW수퍼플러스(1404)라이프+', policyNo: '51409819780000', insurer: '삼성화재해상보험', accidentDate: '2024-12-23', totalAmount: '65,210', details: [
         { date: '2024-12-23', type: '인보험', reason: '질병통원의료비(실손)', result: '지급', amount: '65,210' }
      ]},
   ],
   analysisFixed: [
      { name: '상해사망', userVal: '130,000', avgVal: '120,874', status: 'avg', msg: '🙂 평균', diff: '+7.55%' },
      { name: '특정상해수술', userVal: '100', avgVal: '4,388', status: 'bad', msg: '😢 매우 부족', diff: '-97.72%' },
      { name: '질병입원일당', userVal: '20', avgVal: '27', status: 'bad', msg: '😢 매우 부족', diff: '-25.93%' },
      { name: '상해입원일당', userVal: '30', avgVal: '27', status: 'good', msg: '😊 양호', diff: '+11.11%' },
      { name: '골절진단', userVal: '800', avgVal: '380', status: 'good', msg: '😃 매우 양호', diff: '+110.53%' },
      { name: '화상진단', userVal: '100', avgVal: '372', status: 'bad', msg: '😢 매우 부족', diff: '-73.12%' },
      { name: '급성심근경색진단', userVal: '15,000', avgVal: '21,884', status: 'bad', msg: '😢 매우 부족', diff: '-31.46%' },
      { name: '암진단', userVal: '40,000', avgVal: '34,508', status: 'good', msg: '😊 양호', diff: '+15.92%' },
      { name: '특정질병수술', userVal: '5,000', avgVal: '10,773', status: 'bad', msg: '😢 매우 부족', diff: '-53.59%' },
      { name: '암입원일당', userVal: '0', avgVal: '98', status: 'bad', msg: '😢 매우 부족', diff: '-100%' },
   ],
   analysisMajor: [
      { name: '질병통원(처방조제)', rate: 80, joined: true, category: '실손의료비' },
      { name: '상해입원', rate: 81, joined: true, category: '실손의료비' },
      { name: '상해통원(외래)', rate: 81, joined: true, category: '실손의료비' },
      { name: '상해통원(처방조제)', rate: 80, joined: true, category: '실손의료비' },
      { name: '질병입원', rate: 81, joined: true, category: '실손의료비' },
      { name: '질병통원(외래)', rate: 81, joined: true, category: '실손의료비' },
      { name: '자동차사고 변호사선임비용', rate: 56, joined: true, category: '기타실손' },
      { name: '교통사고벌금(대인)', rate: 55, joined: false, category: '기타실손' },
      { name: '가족생활배상책임담보', rate: 50, joined: true, category: '기타실손' },
      { name: '교통사고 벌금(대물)', rate: 49, joined: true, category: '기타실손' },
      { name: '(자동차보험)무보험차에 의한 상해 영업용 외', rate: 48, joined: false, category: '기타실손' },
      { name: '(자동차보험)다른자동차 운전', rate: 47, joined: false, category: '기타실손' },
   ]
};

export interface ClaimsProps {
  type?: 'refund' | 'simple';
  initialRequestId?: string | null;
  onNavigate?: (path: string) => void;
  /** 청구 단계 필터 */
  claimsStageFilter?: 'receipt' | 'unpaid_analysis' | 'doc_issuance' | 'final_analysis';
}

export function Claims({ type, initialRequestId, onNavigate, claimsStageFilter }: ClaimsProps) {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedStaffOwner, setSelectedStaffOwner] = useState<string | null>(null);

  useEffect(() => {
    if (initialRequestId) {
       // Find by requestId or id
       const item = CLAIMS_QUEUE.find(i => i.requestId === initialRequestId || i.id === initialRequestId);
       if (item) {
          setSelectedItem(item);
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
     return <ClaimDetail item={selectedItem} onBack={handleBack} type={type} onNavigate={onNavigate} />;
  }

  if (selectedStaffOwner) {
    return (
      <ClaimStaffDetailPage
        ownerName={selectedStaffOwner}
        type={type}
        onBack={() => setSelectedStaffOwner(null)}
        onSelect={handleSelect}
      />
    );
  }

  return <ClaimList onSelect={handleSelect} onSelectStaffOwner={setSelectedStaffOwner} type={type} />;
}

function ClaimList({
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
  const [activeTab, setActiveTab] = useState<'list' | 'staff'>('list');
  const [selectedClaimIds, setSelectedClaimIds] = useState<Set<string>>(new Set());
  const [showClaimAssignModal, setShowClaimAssignModal] = useState(false);
  const [claimAssignee, setClaimAssignee] = useState('');

  const CLAIMS_ASSIGNEES = [
    { name: '강청구', currentCount: 18 },
    { name: '윤청구', currentCount: 22 },
    { name: '한청구', currentCount: 15 },
    { name: '서청구', currentCount: 25 },
  ];

  const toggleClaimSelect = (id: string) => {
    setSelectedClaimIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleClaimBatchAssign = () => {
    if (!claimAssignee) return;
    setShowClaimAssignModal(false);
    setSelectedClaimIds(new Set());
    setClaimAssignee('');
  };

  const customerMetaMap = useMemo(
    () =>
      new Map(
        MOCK_DATA.customers.map((customer) => [
          customer.name,
          { manager: customer.manager, address: customer.address },
        ])
      ),
    []
  );

  const filteredData = useMemo(
    () =>
      CLAIMS_QUEUE.map((item) => {
        const customerMeta = customerMetaMap.get(item.customer);
        return {
          ...item,
          manager: customerMeta?.manager || '미배정',
          customerAddress: customerMeta?.address || '',
        };
      }).filter((item) => {
        if (!type) return true;
        return item.category === type;
      }),
    [customerMetaMap, type]
  );

  const title = type === 'refund' ? '3년 환급 심사 (Refund Analysis)' 
              : type === 'simple' ? '간편 청구 접수 (Simple Claims)' 
              : '청구 처리 관리 (Claims Operations)';
  
  const description = type === 'refund' ? '미청구 보험금 분석 및 자동 분개' 
                    : type === 'simple' ? '단순 보험금 청구 대행 및 지급 심사' 
                    : '전체 청구 및 심사 워크스페이스';

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
        const currentStepIndex = getClaimCurrentStepIndex(item.status);
        const employeeStepKey = CLAIM_PROCESS_STEPS[currentStepIndex]?.key;

        return {
          id: item.id,
          customerName: item.customer,
          ownerName: item.manager || '미배정',
          typeLabel: `${item.insurance} · ${item.type}`,
          dateLabel: item.date,
          stageLabel: getClaimJourneyStage(item.status),
          summaryLabel: item.status,
          regionLabel: formatClaimRegion(item.customerAddress),
          completed: item.status === '지급완료' || item.status === '완료',
          employeeStepKey,
          original: item,
        };
      }),
    [displayData]
  );

  useEffect(() => {
    if (activeTab !== 'staff') {
      return;
    }
  }, [activeTab]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
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
           <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-600 hover:bg-slate-50 cursor-pointer shadow-sm">
            <Filter size={16} /> 필터
          </div>
          {selectedClaimIds.size > 0 && (
            <button
              onClick={() => setShowClaimAssignModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 shadow-sm"
            >
              <User size={16} /> 팀원 배정 ({selectedClaimIds.size}건)
            </button>
          )}
        </div>
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

      {/* List Table */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'staff' ? (
          <div className="p-6">
            <EmployeeStepMatrixOverview
              items={staffItems}
              steps={CLAIM_PROCESS_STEPS}
              emptyMessage="기간 내 확인할 청구 담당자 데이터가 없습니다."
              onSelectOwner={onSelectStaffOwner}
            />
          </div>
        ) : displayData.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <FileText size={48} className="mb-4 opacity-20" />
              <p>해당하는 청구 접수 내역이 없습니다.</p>
           </div>
        ) : (
           <table className="w-full text-sm text-left">
             <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 sticky top-0">
               <tr>
                 <th className="px-3 py-3 w-10">
                   <input
                     type="checkbox"
                     checked={selectedClaimIds.size === displayData.length && displayData.length > 0}
                     onChange={() => {
                       if (selectedClaimIds.size === displayData.length) setSelectedClaimIds(new Set());
                       else setSelectedClaimIds(new Set(displayData.map(d => d.id)));
                     }}
                     className="rounded border-slate-300"
                   />
                 </th>
                 <th className="px-6 py-3 font-medium">청구 ID</th>
                 <th className="px-6 py-3 font-medium">고객명</th>
                 <th className="px-6 py-3 font-medium">유형</th>
                 <th className="px-6 py-3 font-medium">접수일</th>
                 <th className="px-6 py-3 font-medium">담당자</th>
                 <th className="px-6 py-3 font-medium">상태</th>
                 <th className="px-6 py-3 font-medium text-right">Action</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {displayData.map((item) => (
                 <tr
                   key={item.id}
                   className={clsx("hover:bg-slate-50 transition-colors cursor-pointer group", selectedClaimIds.has(item.id) && "bg-blue-50/50")}
                   onClick={() => onSelect(item)}
                 >
                   <td className="px-3 py-4" onClick={e => e.stopPropagation()}>
                     <input
                       type="checkbox"
                       checked={selectedClaimIds.has(item.id)}
                       onChange={() => toggleClaimSelect(item.id)}
                       className="rounded border-slate-300"
                     />
                   </td>
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
                   <td className="px-6 py-4 text-slate-600">{item.manager}</td>
                   <td className="px-6 py-4">
                     <span className={clsx(
                       "inline-flex px-2 py-0.5 rounded text-xs font-bold border",
                       item.status === '분석중' ? "bg-amber-50 text-amber-700 border-amber-100" :
                       "bg-blue-50 text-blue-700 border-blue-100"
                     )}>
                       {item.status}
                     </span>
                   </td>
                   <td className="px-6 py-4 text-right">
                     <button className="text-white bg-[#1e293b] px-3 py-1.5 rounded text-xs hover:bg-slate-800 transition-colors shadow-sm opacity-0 group-hover:opacity-100">
                       관리
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

function ClaimStaffDetailPage({
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

  const customerMetaMap = useMemo(
    () =>
      new Map(
        MOCK_DATA.customers.map((customer) => [
          customer.name,
          { manager: customer.manager, address: customer.address },
        ])
      ),
    []
  );

  const filteredData = useMemo(
    () =>
      CLAIMS_QUEUE.map((item) => {
        const customerMeta = customerMetaMap.get(item.customer);
        return {
          ...item,
          manager: customerMeta?.manager || '미배정',
          customerAddress: customerMeta?.address || '',
        };
      }).filter((item) => {
        if (!type) return true;
        return item.category === type;
      }),
    [customerMetaMap, type]
  );

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
        const currentStepIndex = getClaimCurrentStepIndex(item.status);
        const employeeStepKey = CLAIM_PROCESS_STEPS[currentStepIndex]?.key;

        return {
          id: item.id,
          customerName: item.customer,
          ownerName: item.manager || '미배정',
          typeLabel: `${item.insurance} · ${item.type}`,
          dateLabel: item.date,
          stageLabel: getClaimJourneyStage(item.status),
          summaryLabel: item.status,
          regionLabel: formatClaimRegion(item.customerAddress),
          completed: item.status === '지급완료' || item.status === '완료',
          employeeStepKey,
          original: item,
        };
      }),
    [displayData]
  );

  const title = type === 'refund' ? '3년 환급 심사 (Refund Analysis)' : type === 'simple' ? '간편 청구 접수 (Simple Claims)' : '청구 처리 관리 (Claims Operations)';
  const description = type === 'refund' ? '미청구 보험금 분석 및 자동 분개' : type === 'simple' ? '단순 보험금 청구 대행 및 지급 심사' : '전체 청구 및 심사 워크스페이스';

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
          steps={CLAIM_PROCESS_STEPS}
          stageColumnLabel="청구 단계"
          summaryColumnLabel="현재 상태"
          dateColumnLabel="접수일"
          emptyMessage="기간 내 확인할 청구 담당자 데이터가 없습니다."
          onSelectItem={onSelect}
        />
      </div>

      {/* Claims Batch Assignment Modal */}
      {showClaimAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setShowClaimAssignModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-[#1e293b]">청구DB 팀원 배정</h3>
                <p className="text-xs text-slate-500 mt-1">{selectedClaimIds.size}건 선택됨</p>
              </div>
              <button onClick={() => setShowClaimAssignModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-600">청구 담당자 선택</label>
              <select
                value={claimAssignee}
                onChange={e => setClaimAssignee(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              >
                <option value="">담당자를 선택하세요</option>
                {CLAIMS_ASSIGNEES.map(a => (
                  <option key={a.name} value={a.name}>
                    {a.name} (현재 {a.currentCount}건)
                  </option>
                ))}
              </select>
              {claimAssignee && (() => {
                const assignee = CLAIMS_ASSIGNEES.find(a => a.name === claimAssignee);
                const newTotal = (assignee?.currentCount || 0) + selectedClaimIds.size;
                return (
                  <div className={clsx(
                    "px-3 py-2 rounded text-xs border",
                    newTotal > 30 ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-slate-50 border-slate-200 text-slate-600"
                  )}>
                    <span className="font-bold">{claimAssignee}</span>: 현재 {assignee?.currentCount}건 + {selectedClaimIds.size}건 = <span className="font-bold">{newTotal}건</span>
                    {newTotal > 30 && <span className="ml-2 font-bold text-rose-600">상한 초과!</span>}
                  </div>
                );
              })()}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowClaimAssignModal(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded hover:bg-slate-50">취소</button>
              <button
                onClick={handleClaimBatchAssign}
                disabled={!claimAssignee}
                className="px-4 py-2 text-sm text-white bg-[#1e293b] rounded hover:bg-slate-800 disabled:opacity-40"
              >
                배정 확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClaimDetail({
  item,
  onBack,
  type,
  onNavigate,
}: {
  item: any,
  onBack: () => void,
  type?: 'refund' | 'simple',
  onNavigate?: (path: string) => void
}) {
  // --- Left Panel State ---
  const [docsCheck, setDocsCheck] = useState({
     poa: true,    // 위임장
     consent: true, // 동의서
     idCopy: false  // 신분증 사본
  });
  
  const [processStatus, setProcessStatus] = useState<'ready' | 'faxed' | 'review' | 'paid'>('ready');
  
  const [settlement, setSettlement] = useState({
     expected: '130000',
     actual: '',
     reason: ''
  });

  // --- Center Panel State ---
  // Default tab based on type
  const [activeTab, setActiveTab] = useState<'profile' | 'insurance' | 'refund' | 'payout' | 'analysis' | 'docs' | 'final'>(
     type === 'refund' ? 'refund' : 'profile'
  );
  
  const [insuranceSubTab, setInsuranceSubTab] = useState<'contracts' | 'history' | 'analysis'>('contracts');
  const [expandedIndemnityIndex, setExpandedIndemnityIndex] = useState<number | null>(null);
  const [showDocsGuide, setShowDocsGuide] = useState(false);
  const [showTripPrintModal, setShowTripPrintModal] = useState(false);
  const [selectedTripPrintIds, setSelectedTripPrintIds] = useState<string[]>([]);

  const {
    getClaimIssuanceRows,
    addManualRequest,
    deleteLocation,
    sendToOps,
    printTripDocuments,
  } = useIssuanceOperations();

  const issuanceRequests = useMemo(
    () => getClaimIssuanceRows(item.requestId),
    [getClaimIssuanceRows, item.requestId]
  );

  // --- Contract Management State ---
  const [contractData, setContractData] = useState<ContractData[]>([]);
  const [editingContractIndex, setEditingContractIndex] = useState<number | null>(null);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);

  // --- Profile Data State (Mimicking Consultation/Meeting Execution) ---
  const [insuranceType] = useState('실손+종합');
  const [monthlyPremium] = useState('25');
  const [paymentStatus] = useState('정상');
  const [contractor] = useState('본인/본인');
  const [joinPath] = useState('관계 없음');
  const [trafficAccident] = useState('없음');
  const [surgery] = useState('있음');
  const [surgeryOptions] = useState<string[]>(['수술·시술']);
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
      { id: '2', name: '보험증권_메리츠.jpg', size: 1024 * 2500, type: 'image/jpeg', progress: 100, status: 'completed' },
      { id: '3', name: '건강검진결과서.pdf', size: 1024 * 5100, type: 'application/pdf', progress: 100, status: 'completed' }
  ]);

  // Request #2 & #3: Claim Items & Comparison (Unified)
  const [claimItems, setClaimItems] = useState([
     { id: 1, insurer: item.insurance || '삼성화재', coverage: '실손의료비', claimed: '130000', actual: '', status: '청구중' }
  ]);
  
  // Calculate Totals
  const totalClaimed = claimItems.reduce((sum, i) => sum + parseInt(String(i.claimed).replace(/,/g, '') || '0'), 0);
  const totalActual = claimItems.reduce((sum, i) => sum + parseInt(String(i.actual).replace(/,/g, '') || '0'), 0);
  const totalDiff = totalActual - totalClaimed;
  const serviceFee = totalActual > 0 ? Math.floor(totalActual * 0.15) : 0; // 15% fee
  
  // Unclaimed Summary
  const unclaimedItems = MEDICAL_RECORDS.filter(r => !r.matched);
  const totalUnclaimedCost = unclaimedItems.reduce((acc, curr) => acc + curr.cost, 0);
  const estimatedPayout = Math.floor(totalUnclaimedCost * 0.7); // Assume 70% coverage

  // Contract Handlers
  const handleContractSubmit = (data: any) => {
    if (editingContractIndex !== null) {
       setContractData(prev => {
          const next = [...prev];
          next[editingContractIndex] = data;
          return next;
       });
    } else {
       setContractData(prev => [...prev, data]);
    }
    toast.success('계약 정보가 저장되었습니다.');
  };

  const handleEditContract = (contract: ContractData, index: number) => {
     setEditingContractIndex(index);
     setIsContractModalOpen(true);
  };
  
  const handleDeleteContract = (index: number) => {
     setContractData(prev => prev.filter((_, i) => i !== index));
     toast.info('계약 정보가 삭제되었습니다.');
  };

  const handleAddContract = () => {
     setEditingContractIndex(null);
     setIsContractModalOpen(true);
  };

  // Issuance Handlers
  const handleSendIssuance = () => {
     if (issuanceRequests.length === 0) {
        toast.error('전송할 서류 발급 요청이 없습니다.');
        return;
     }

     sendToOps(issuanceRequests.map((request) => request.id));
     toast.success('발급 운영 워크스페이스로 요청을 전송했습니다.', {
        description: `총 ${issuanceRequests.length}건의 요청이 운영 화면에 반영되었습니다.`,
     });
     onNavigate?.(`issuance-master:${item.requestId}`);
  };

  const incompleteRequests = useMemo(
    () => issuanceRequests.filter((request) => request.opsStatus !== '최종완료'),
    [issuanceRequests]
  );

  useEffect(() => {
    if (showTripPrintModal) {
      setSelectedTripPrintIds(incompleteRequests.map((request) => request.id));
    }
  }, [incompleteRequests, showTripPrintModal]);

  const handleOpenTripPrintModal = () => {
      if (incompleteRequests.length === 0) {
        toast.info('미완료 장소가 없습니다.');
        return;
      }

      setShowTripPrintModal(true);
  };

  const handlePrintTripDocs = () => {
      if (selectedTripPrintIds.length === 0) {
        toast.error('출력할 병원 또는 약국을 선택해주세요.');
        return;
      }

      const nextPack = printTripDocuments(selectedTripPrintIds, item.customer);
      if (!nextPack) return;
      toast.success('미완료 장소 기준 3종 서류를 일괄 출력용으로 생성했습니다.', {
        description: nextPack.generatedFiles.map((file) => file.name).join(', '),
      });
      setShowTripPrintModal(false);
  };

  const handleDeleteIssuance = (id: string) => {
      deleteLocation(id);
      toast.info('항목이 삭제되었습니다.');
  };

  const handleManualAdd = () => {
      addManualRequest(item.requestId, item.customer);
      toast.success('수기 내역이 추가되었습니다.');
  };

  const handleSingleDownload = (fileName: string) => {
      toast.success(`'${fileName}' 다운로드를 시작합니다.`);
  };

  return (
    <div className="flex flex-col h-full bg-[#F1F5F9] overflow-hidden -m-4">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shrink-0 z-10 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
             <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-mono font-bold">{item.id}</span>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{item.insurance}</span>
             </div>
             <h1 className="text-lg font-bold text-[#1e293b] mt-0.5">
               {item.customer} 미청구 분석 및 심사
               {type === 'simple' && <span className="text-sm font-normal text-slate-500 ml-2">(간편 청구)</span>}
             </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
           {/* Data Linkage Status Badges */}
           <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 mr-1">데이터 연동</span>
              {[
                 { label: '보험', active: true },
                 { label: '건보', active: true },
                 { label: '홈택스', active: false },
                 { label: '지급내역', active: true }
              ].map((status, idx) => (
                 <div key={idx} className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1">
                        <div className={clsx("size-1.5 rounded-full", status.active ? "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]" : "bg-slate-300")} />
                        <span className={clsx("text-[10px] font-bold", status.active ? "text-slate-700" : "text-slate-400")}>{status.label}</span>
                    </div>
                    {idx < 3 && <div className="w-px h-2 bg-slate-300 mx-0.5" />}
                 </div>
              ))}
           </div>

           <div className="text-right pr-4 border-r border-slate-200">
              <div className="text-[10px] uppercase text-slate-400 font-bold">총 예상 청구액</div>
              <div className="text-lg font-bold text-blue-600">{estimatedPayout.toLocaleString()}원</div>
           </div>
           <button className="px-4 py-2 bg-[#1e293b] text-white text-sm font-bold rounded shadow hover:bg-slate-800 transition-colors flex items-center gap-2">
              <Save size={16} /> 작업 저장
           </button>
        </div>
      </div>

      {/* Main Layout: 1.5 : 7 : 1.5 (Standard "The Bada" Ratio) */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-auto lg:overflow-hidden">
        
        {/* === Left Panel: Claim Action (1.5) === */}
        <div className="w-full lg:flex-[1.5] lg:w-auto lg:min-w-[320px] bg-white lg:border-r border-b lg:border-b-0 border-slate-200 flex flex-col z-10">
           <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-bold text-[#1e293b] text-sm flex items-center gap-2">
                 <CheckCircle2 size={16} className="text-blue-600" /> 청구 및 정산 처리
              </h2>
           </div>

           <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
              
              {/* Section 1: Docs Checklist */}
              <div className="space-y-3">
                 <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">1. 필수 서류 확인</label>
                 <div className="bg-slate-50 rounded-lg border border-slate-200 p-1">
                    {[
                       { id: 'poa', label: '손해사정 위임장' },
                       { id: 'consent', label: '개인정보 동의서' },
                       { id: 'idCopy', label: '신분증 사본' }
                    ].map(doc => {
                       const isChecked = docsCheck[doc.id as keyof typeof docsCheck];
                       return (
                       <div key={doc.id} className="flex items-center justify-between p-2.5 hover:bg-slate-100 rounded transition-colors group">
                          <div className="flex items-center gap-3">
                             <div 
                                onClick={() => setDocsCheck(prev => ({...prev, [doc.id]: !prev[doc.id as keyof typeof docsCheck]}))}
                                className={clsx(
                                   "size-4 rounded border flex items-center justify-center cursor-pointer transition-colors",
                                   isChecked 
                                      ? "bg-blue-600 border-blue-600" 
                                      : "bg-white border-slate-300"
                                )}
                             >
                                {isChecked && <CheckCircle2 size={12} className="text-white" />}
                             </div>
                             <div>
                                <span className={clsx("text-xs font-medium block", isChecked ? "text-slate-800" : "text-slate-500")}>
                                    {doc.label}
                                </span>
                                {isChecked && (
                                   <span className="text-[10px] text-blue-600 flex items-center gap-1 mt-0.5">
                                      <FileText size={10} /> {doc.label}_스캔본.pdf
                                   </span>
                                )}
                             </div>
                          </div>
                          
                          <div className="flex items-center">
                              <input 
                                 type="file" 
                                 id={`upload-${doc.id}`} 
                                 className="hidden" 
                                 onChange={(e) => {
                                    if(e.target.files?.[0]) {
                                       setDocsCheck(prev => ({...prev, [doc.id]: true}));
                                       toast.success(`${doc.label} 업로드 완료`);
                                    }
                                 }}
                              />
                              <label 
                                 htmlFor={`upload-${doc.id}`}
                                 className="text-slate-300 hover:text-blue-600 cursor-pointer p-1 rounded hover:bg-white transition-colors"
                              >
                                 <Upload size={14} />
                              </label>
                          </div>
                       </div>
                       );
                    })}
                 </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-100" />

              {/* Section 2: Claim Items & Settlement (Unified) */}
              <div className="space-y-3">
                 <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">2. 청구 정산 관리</label>
                    <button 
                       onClick={() => setClaimItems([...claimItems, { id: Date.now(), insurer: '', coverage: '', claimed: '', actual: '', status: '청구중' }])}
                       className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded font-bold transition-colors"
                    >
                       + 항목 추가
                    </button>
                 </div>
                 
                 <div className="space-y-2">
                    {claimItems.map((cItem, idx) => {
                       const claimed = parseInt(String(cItem.claimed).replace(/,/g, '') || '0');
                       const actual = parseInt(String(cItem.actual).replace(/,/g, '') || '0');
                       const diff = actual - claimed;
                       
                       return (
                       <div key={cItem.id} className="bg-slate-50 border border-slate-200 rounded p-2.5 text-xs space-y-3 relative group hover:bg-white hover:shadow-sm transition-all">
                           {claimItems.length > 1 && (
                              <button 
                                 onClick={() => setClaimItems(prev => prev.filter(p => p.id !== cItem.id))}
                                 className="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition-colors"
                              >
                                 <Trash2 size={12} />
                              </button>
                           )}
                           
                           {/* Row 1: Basic Info & Status */}
                           <div className="grid grid-cols-2 gap-2 pr-4">
                              <div>
                                 <label className="text-[10px] text-slate-400 font-bold block mb-0.5">보험사</label>
                                 <input 
                                    className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-slate-700 font-medium focus:border-blue-500 outline-none"
                                    value={cItem.insurer}
                                    onChange={(e) => setClaimItems(prev => prev.map(p => p.id === cItem.id ? { ...p, insurer: e.target.value } : p))}
                                    placeholder="보험사명"
                                 />
                              </div>
                              <div>
                                 <label className="text-[10px] text-slate-400 font-bold block mb-0.5">상태</label>
                                 <select
                                    className={clsx(
                                       "w-full border rounded px-1.5 py-1 font-bold outline-none appearance-none bg-white",
                                       cItem.status === '청구중' ? "text-blue-600 border-blue-200" :
                                       cItem.status === '지급' ? "text-emerald-600 border-emerald-200" :
                                       cItem.status === '부지급' ? "text-red-500 border-red-200" :
                                       "text-slate-600 border-slate-300"
                                    )}
                                    value={cItem.status}
                                    onChange={(e) => setClaimItems(prev => prev.map(p => p.id === cItem.id ? { ...p, status: e.target.value } : p))}
                                 >
                                    <option value="청구중">청구 중</option>
                                    <option value="지급">지급 완료</option>
                                    <option value="부지급">부지급</option>
                                    <option value="일부지급">일부 지급</option>
                                 </select>
                              </div>
                           </div>

                           <div className="grid grid-cols-2 gap-2 pr-4">
                              <div className="col-span-2">
                                 <label className="text-[10px] text-slate-400 font-bold block mb-0.5">담보명</label>
                                 <input 
                                    className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-slate-700 font-medium focus:border-blue-500 outline-none"
                                    value={cItem.coverage}
                                    onChange={(e) => setClaimItems(prev => prev.map(p => p.id === cItem.id ? { ...p, coverage: e.target.value } : p))}
                                    placeholder="청구 담보명"
                                 />
                              </div>
                           </div>

                           {/* Row 2: Amounts Comparison */}
                           <div className="bg-slate-100/50 rounded p-2 border border-slate-200 grid grid-cols-2 gap-x-3 gap-y-2">
                              <div>
                                 <label className="text-[10px] text-slate-400 font-bold block mb-0.5">청구금액</label>
                                 <input 
                                    className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-slate-700 font-bold text-right focus:border-blue-500 outline-none"
                                    value={cItem.claimed}
                                    onChange={(e) => setClaimItems(prev => prev.map(p => p.id === cItem.id ? { ...p, claimed: e.target.value } : p))}
                                    placeholder="0"
                                 />
                              </div>
                              <div>
                                 <label className="text-[10px] text-blue-600 font-bold block mb-0.5">실지급액</label>
                                 <input 
                                    className="w-full bg-white border border-blue-200 rounded px-1.5 py-1 text-slate-700 font-bold text-right focus:border-blue-500 outline-none"
                                    value={cItem.actual}
                                    onChange={(e) => setClaimItems(prev => prev.map(p => p.id === cItem.id ? { ...p, actual: e.target.value } : p))}
                                    placeholder="0"
                                 />
                              </div>
                              
                              {/* Item Diff */}
                              {(cItem.actual !== '' || cItem.status === '지급' || cItem.status === '일부지급') && (
                                 <div className="col-span-2 pt-1 border-t border-slate-200 flex justify-between items-center">
                                    <span className="text-[10px] text-slate-400">차액 (지급 - 청구)</span>
                                    <span className={clsx("text-xs font-bold", diff >= 0 ? "text-emerald-600" : "text-red-500")}>
                                       {diff > 0 ? '+' : ''}{diff.toLocaleString()}원
                                    </span>
                                 </div>
                              )}
                           </div>
                       </div>
                       );
                    })}
                    
                    {/* Total Summary */}
                    <div className="mt-4 bg-blue-50/50 rounded-lg p-3 border border-blue-100 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                           <span className="text-slate-600">총 청구금액</span>
                           <span className="font-bold">{totalClaimed.toLocaleString()}원</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                           <span className="text-blue-600 font-bold">총 실지급액</span>
                           <span className="font-bold text-blue-700">{totalActual.toLocaleString()}원</span>
                        </div>
                        
                        <div className="h-px bg-blue-100 my-1" />
                        
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] text-slate-500 font-bold">총 차액</span>
                           <span className={clsx("text-sm font-bold", totalDiff >= 0 ? "text-emerald-600" : "text-red-500")}>
                              {totalDiff > 0 ? '+' : ''}{totalDiff.toLocaleString()}원
                           </span>
                        </div>

                        {serviceFee > 0 && (
                           <div className="pt-2 mt-2 border-t border-blue-100/50 flex justify-between items-center">
                              <span className="text-[10px] text-slate-500 font-bold">수수료 (15%)</span>
                              <span className="text-xs font-bold text-slate-700">{serviceFee.toLocaleString()}원</span>
                           </div>
                        )}
                    </div>
                 </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Action Button */}
              <div className="pt-4">
                 <button className="w-full py-3 bg-[#1e293b] text-white rounded-lg text-sm font-bold shadow-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} /> 정산 완료 처리
                 </button>
              </div>

           </div>
        </div>

        {/* === Center Panel: Workspace (7) === */}
        <div className="flex-1 lg:flex-[7] bg-[#F1F5F9] flex flex-col overflow-hidden">
           
           {/* Tab Navigation */}
           <div className="bg-white border-b border-slate-200 px-2 flex items-center">
              {[
                 { id: 'profile', label: '고객 프로필', icon: User },
                 { id: 'insurance', label: '보험 조회', icon: Building },
                 { id: 'refund', label: '3년 환급', icon: Calendar },
                 { id: 'payout', label: '지급내역', icon: CreditCard },
                 { id: 'analysis', label: '미지급 분석', icon: AlertCircle },
                 { id: 'docs', label: '서류 발급', icon: FileText },
                 { id: 'final', label: '최종 분석', icon: Activity }
              ].map(tab => (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={clsx(
                       "px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors shrink-0",
                       activeTab === tab.id 
                          ? "border-blue-600 text-blue-700 bg-blue-50/50" 
                          : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    )}
                 >
                    <tab.icon size={16} /> {tab.label}
                 </button>
              ))}
           </div>

           {/* Workspace Content */}
           <div className={clsx(
              "flex-1 flex flex-col", 
              activeTab === 'refund' ? "overflow-hidden p-0" : "overflow-y-auto p-4 custom-scrollbar"
           )}>
              
              {activeTab === 'analysis' && (
                 <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <Activity size={48} className="mb-4 opacity-50" />
                    <p className="font-medium">심화 분석 리포트 생성 중...</p>
                 </div>
              )}

              {activeTab === 'profile' && (
                 <div className="space-y-6">
                    {/* Customer Profile Summary */}
                    <CustomerProfileSummary 
                       customerName={item.customer}
                       ssn={item.birth || "921103-2******"}
                       address={item.address || "서울시 강남구 테헤란로 456"}
                       threeMonthHistory="2023년 12월 15일 - 급성 위염으로 인한 내과 외래 진료. 2024년 1월 8일 - 알레르기성 비염 증상으로 이비인후과 진료."
                       contractor={contractor}
                       criticalDisease={criticalDisease}
                       criticalOptions={criticalOptions}
                       criticalDetail={criticalDiseaseDetail}
                       designerRelation={joinPath}
                       insuranceType={insuranceType}
                       monthlyPremium={monthlyPremium}
                       insuranceStatus={insuranceStatus}
                       refundAmount={estimatedPayout.toString()}
                       familyConnectionCount={3}
                       surgery={surgery}
                       surgeryOptions={surgeryOptions}
                       surgeryDetail={surgeryDetail}
                       decisionMaker={decisionMaker}
                       onDecisionMakerChange={setDecisionMaker}
                    />

                    {/* Contract Information Section */}
                    <ContractInfoSection 
                       data={contractData} 
                       onEdit={handleEditContract}
                       onDelete={handleDeleteContract}
                       onCreate={handleAddContract}
                    />

                    {/* Customer Input Section */}
                    <CustomerInputSection 
                       customer={{
                          name: item.customer,
                          phone: item.phone || "010-9876-5432",
                          birth: item.birth || "921103-2******",
                          address: item.address || "주소 미입력",
                          job: "직장인"
                       }}
                       consultation={{
                          monthlyPremium: monthlyPremium,
                          insuranceType: insuranceType,
                          utmSource: "기존고객"
                       }}
                    />

                    {/* Live Record Section (Consultation Team Check) */}
                    <div className="relative">
                       <div className="absolute top-0 right-0 p-2 z-10">
                          <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded border border-slate-200">
                             상담팀 확인사항 (Read Only)
                          </span>
                       </div>
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
                          onCardClick={() => toast.info('상담팀 확인사항은 수정할 수 없습니다.')}
                          disposition={disposition}
                          trustLevel={trustLevel}
                          bestTime={bestTime}
                          decisionMaker={decisionMaker}
                          traitNote={traitNote}
                          attachments={attachments}
                       />
                    </div>
                 </div>
              )}
              
              {activeTab === 'insurance' && (
                 <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-6 gap-3">
                       <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm col-span-2">
                          <div className="text-[10px] text-slate-500 font-bold mb-1">전체 보험 계약</div>
                          <div className="text-2xl font-bold text-[#1e293b]">{INSURANCE_MOCK_DATA.summary.total} <span className="text-sm text-slate-400 font-normal">건</span></div>
                       </div>
                       <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 shadow-sm col-span-1">
                          <div className="text-[10px] text-emerald-600 font-bold mb-1">유효 계약</div>
                          <div className="text-2xl font-bold text-emerald-700">{INSURANCE_MOCK_DATA.summary.valid} <span className="text-sm text-emerald-500/70 font-normal">건</span></div>
                       </div>
                       <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 shadow-sm col-span-1">
                          <div className="text-[10px] text-blue-600 font-bold mb-1">직접 체결</div>
                          <div className="text-2xl font-bold text-blue-700">{INSURANCE_MOCK_DATA.summary.self} <span className="text-sm text-blue-500/70 font-normal">건</span></div>
                       </div>
                       <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm col-span-1">
                          <div className="text-[10px] text-slate-500 font-bold mb-1">타인 체결</div>
                          <div className="text-2xl font-bold text-slate-700">{INSURANCE_MOCK_DATA.summary.other} <span className="text-sm text-slate-400 font-normal">건</span></div>
                       </div>
                       <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 shadow-sm col-span-1">
                          <div className="text-[10px] text-amber-600 font-bold mb-1">유효하지 않음</div>
                          <div className="text-2xl font-bold text-amber-700">{INSURANCE_MOCK_DATA.summary.invalid} <span className="text-sm text-amber-500/70 font-normal">건</span></div>
                       </div>
                    </div>

                    {/* Sub Navigation */}
                    <div className="flex border-b border-slate-200">
                       <button
                          onClick={() => setInsuranceSubTab('contracts')}
                          className={clsx(
                             "px-4 py-2 text-sm font-bold border-b-2 transition-colors",
                             insuranceSubTab === 'contracts' ? "border-[#1e293b] text-[#1e293b]" : "border-transparent text-slate-400 hover:text-slate-600"
                          )}
                       >
                          계약 현황 (Contracts)
                       </button>
                       <button
                          onClick={() => setInsuranceSubTab('history')}
                          className={clsx(
                             "px-4 py-2 text-sm font-bold border-b-2 transition-colors",
                             insuranceSubTab === 'history' ? "border-[#1e293b] text-[#1e293b]" : "border-transparent text-slate-400 hover:text-slate-600"
                          )}
                       >
                          지급 내역 (Payout History)
                       </button>
                       <button
                          onClick={() => setInsuranceSubTab('analysis')}
                          className={clsx(
                             "px-4 py-2 text-sm font-bold border-b-2 transition-colors",
                             insuranceSubTab === 'analysis' ? "border-[#1e293b] text-[#1e293b]" : "border-transparent text-slate-400 hover:text-slate-600"
                          )}
                       >
                          보장 분석 (Analysis)
                       </button>
                    </div>

                    {/* Sub Content: Contracts */}
                    {insuranceSubTab === 'contracts' && (
                       <div className="space-y-6">
                          {/* Fixed Contracts */}
                          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                             <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                                <ShieldCheck size={16} className="text-slate-500" />
                                <h3 className="text-xs font-bold text-slate-700 uppercase">정액형 보장 정보</h3>
                             </div>
                             <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                   <thead className="bg-white text-slate-500 border-b border-slate-100">
                                      <tr>
                                         <th className="px-4 py-2 font-medium">계약자</th>
                                         <th className="px-4 py-2 font-medium">상품명</th>
                                         <th className="px-4 py-2 font-medium">기간</th>
                                         <th className="px-4 py-2 font-medium">납입금액</th>
                                         <th className="px-4 py-2 font-medium">상태</th>
                                         <th className="px-4 py-2 font-medium">기간(시작~종료)</th>
                                      </tr>
                                   </thead>
                                   <tbody className="divide-y divide-slate-50">
                                      {INSURANCE_MOCK_DATA.fixedContracts.map((c, i) => (
                                         <tr key={i} className="hover:bg-slate-50">
                                            <td className="px-4 py-2.5 text-slate-600">{c.holder}</td>
                                            <td className="px-4 py-2.5 font-bold text-[#1e293b]">{c.name}</td>
                                            <td className="px-4 py-2.5 text-slate-600">{c.period}</td>
                                            <td className="px-4 py-2.5 text-slate-600 font-mono">{c.premium}</td>
                                            <td className="px-4 py-2.5">
                                               <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-100">
                                                  {c.status}
                                               </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-slate-500 text-[10px] font-mono">
                                               {c.start} ~ {c.end}
                                            </td>
                                         </tr>
                                      ))}
                                   </tbody>
                                </table>
                             </div>
                          </div>

                          {/* Indemnity Contracts */}
                          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                             <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                                <Activity size={16} className="text-slate-500" />
                                <h3 className="text-xs font-bold text-slate-700 uppercase">실손형 보장 정보</h3>
                             </div>
                             <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                   <thead className="bg-white text-slate-500 border-b border-slate-100">
                                      <tr>
                                         <th className="w-10"></th>
                                         <th className="px-4 py-2 font-medium">보험사</th>
                                         <th className="px-4 py-2 font-medium">상품명</th>
                                         <th className="px-4 py-2 font-medium">증권번호</th>
                                         <th className="px-4 py-2 font-medium">상태</th>
                                         <th className="px-4 py-2 font-medium">보장기간</th>
                                      </tr>
                                   </thead>
                                   <tbody className="divide-y divide-slate-50">
                                      {INSURANCE_MOCK_DATA.indemnityContracts.map((c, i) => (
                                         <IndemnityRow key={i} contract={c} expanded={expandedIndemnityIndex === i} onExpand={() => setExpandedIndemnityIndex(expandedIndemnityIndex === i ? null : i)} />
                                      ))}
                                   </tbody>
                                </table>
                             </div>
                          </div>
                       </div>
                    )}

                    {/* Sub Content: History */}
                    {insuranceSubTab === 'history' && (
                       <div className="space-y-4">
                          {INSURANCE_MOCK_DATA.payoutHistory.map((history, i) => (
                             <div key={i} className="bg-white border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors shadow-sm group">
                                <div className="flex justify-between items-start mb-3">
                                   <div>
                                      <div className="flex items-center gap-2 mb-1">
                                         <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded font-bold">{history.insurer}</span>
                                         <span className="text-xs text-slate-400 font-mono">#{history.policyNo}</span>
                                      </div>
                                      <h3 className="font-bold text-sm text-[#1e293b]">{history.name}</h3>
                                   </div>
                                   <div className="text-right">
                                      <div className="text-[10px] text-slate-400 mb-0.5">원사고일: {history.accidentDate}</div>
                                      <div className="font-bold text-blue-600 text-lg">{history.totalAmount}원</div>
                                   </div>
                                </div>
                                
                                <div className="bg-slate-50 rounded p-2 space-y-2">
                                   {history.details.map((detail, idx) => (
                                      <div key={idx} className="flex items-center justify-between text-xs p-1.5 bg-white border border-slate-200 rounded shadow-sm">
                                         <div className="flex items-center gap-3">
                                            <span className="text-slate-500 font-mono text-[10px]">{detail.date}</span>
                                            <span className="font-bold text-slate-700">{detail.reason}</span>
                                            <span className="bg-slate-100 text-slate-500 px-1 rounded text-[10px]">{detail.type}</span>
                                         </div>
                                         <div className="flex items-center gap-2">
                                            <span className="text-emerald-600 font-bold text-[10px]">{detail.result}</span>
                                            <span className="font-bold">{detail.amount}원</span>
                                         </div>
                                      </div>
                                   ))}
                                </div>
                             </div>
                          ))}
                       </div>
                    )}

                    {/* Sub Content: Analysis */}
                    {insuranceSubTab === 'analysis' && (
                       <div className="space-y-6">
                          {/* 1. Fixed Coverage Analysis */}
                          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                             <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                                <h3 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
                                   <BarChart3 size={16} className="text-purple-500" /> 
                                   30대 남성 평균 대비 보장 현황 (정액형)
                                </h3>
                             </div>
                             <table className="w-full text-xs text-left">
                                <thead className="bg-white text-slate-500 border-b border-slate-100">
                                   <tr>
                                      <th className="px-4 py-2 font-medium">보장 명칭</th>
                                      <th className="px-4 py-2 font-medium">내 가입금액</th>
                                      <th className="px-4 py-2 font-medium">평균 가입금액</th>
                                      <th className="px-4 py-2 font-medium">상태</th>
                                      <th className="px-4 py-2 font-medium text-right">대비</th>
                                   </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                   {INSURANCE_MOCK_DATA.analysisFixed.map((item, i) => (
                                      <tr key={i} className="hover:bg-slate-50">
                                         <td className="px-4 py-2.5 font-bold text-slate-700">{item.name}</td>
                                         <td className="px-4 py-2.5 text-[#1e293b] font-mono">{item.userVal}</td>
                                         <td className="px-4 py-2.5 text-slate-500 font-mono">{item.avgVal}</td>
                                         <td className="px-4 py-2.5">
                                            <span className={clsx(
                                               "px-2 py-0.5 rounded text-[10px] font-bold border",
                                               item.status === 'good' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                               item.status === 'avg' ? "bg-blue-50 text-blue-700 border-blue-100" :
                                               "bg-rose-50 text-rose-700 border-rose-100"
                                            )}>
                                               {item.msg}
                                            </span>
                                         </td>
                                         <td className={clsx("px-4 py-2.5 text-right font-mono font-bold", item.status === 'bad' ? 'text-rose-500' : 'text-slate-400')}>
                                            {item.diff}
                                         </td>
                                      </tr>
                                   ))}
                                </tbody>
                             </table>
                          </div>

                          {/* 2. Major Coverage Analysis */}
                          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                             <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                                <h3 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
                                   <ShieldCheck size={16} className="text-blue-500" /> 
                                   주요 필수 보장 가입 여부
                                </h3>
                             </div>
                             <table className="w-full text-xs text-left">
                                <thead className="bg-white text-slate-500 border-b border-slate-100">
                                   <tr>
                                      <th className="px-4 py-2 font-medium">보장 명칭</th>
                                      <th className="px-4 py-2 font-medium">구분</th>
                                      <th className="px-4 py-2 font-medium">30대 가입률</th>
                                      <th className="px-4 py-2 font-medium">가입 여부</th>
                                   </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                   {INSURANCE_MOCK_DATA.analysisMajor.map((item, i) => (
                                      <tr key={i} className="hover:bg-slate-50">
                                         <td className="px-4 py-2.5 font-bold text-slate-700">{item.name}</td>
                                         <td className="px-4 py-2.5 text-slate-500">{item.category}</td>
                                         <td className="px-4 py-2.5 text-slate-500 font-mono">
                                             <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                   <div className="h-full bg-blue-300 rounded-full" style={{ width: `${item.rate}%` }}></div>
                                                </div>
                                                {item.rate}%
                                             </div>
                                         </td>
                                         <td className="px-4 py-2.5">
                                            {item.joined ? (
                                               <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                                  <CheckCircle2 size={12} /> 😊 가입
                                               </span>
                                            ) : (
                                               <span className="flex items-center gap-1 text-rose-500 font-bold">
                                                  <AlertTriangle size={12} /> 😢 미가입
                                               </span>
                                            )}
                                         </td>
                                      </tr>
                                   ))}
                                </tbody>
                             </table>
                          </div>
                       </div>
                    )}
                 </div>
              )}

              {activeTab === 'refund' && (
                 <UnclaimedAnalysisView />
              )}

              {activeTab === 'payout' && (
                 <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <CreditCard size={48} className="mb-4 opacity-50" />
                    <p className="font-medium">보험사 지급 상세 내역 조회 서비스 준비중</p>
                 </div>
              )}

              {activeTab === 'docs' && (
                 <div className="flex flex-col h-full overflow-hidden relative">
                    {/* Table List (Full Height) */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                            <div className="flex items-center gap-3">
                                <div>
                                <h3 className="font-bold text-[#1e293b] flex items-center gap-2">
                                    <FileText size={18} className="text-blue-600"/>
                                    서류 발급 요청 목록
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    확정된 기관별 요청건을 발급 운영으로 전송하고, 미완료 장소 기준 3종 서류를 개인화 출력합니다.
                                </p>
                                </div>
                                <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                                    <button 
                                        onClick={() => setShowDocsGuide(true)}
                                        className="p-1.5 rounded-md text-slate-500 hover:bg-white hover:shadow-sm hover:text-blue-600 transition-all"
                                        title="서류 발급 가이드 보기"
                                    >
                                        <HelpCircle size={16} />
                                    </button>
                                </div>
                                <button 
                                    onClick={handleManualAdd}
                                    className="text-[11px] bg-transparent border border-dashed border-slate-300 px-2.5 py-1.5 rounded flex items-center gap-1.5 font-bold text-slate-500 hover:bg-white hover:text-slate-700 hover:border-slate-400 transition-all"
                                >
                                    <PenLine size={12} /> 수기 내역 추가
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <button 
                                    onClick={handleOpenTripPrintModal}
                                    className="text-xs bg-white border border-slate-300 px-3 py-2 rounded flex items-center gap-1.5 font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all"
                                >
                                    <Printer size={14} /> 미완료 장소 3종 출력
                                </button>
                                <button 
                                    onClick={handleSendIssuance}
                                    className="text-xs bg-[#1e293b] text-white px-3 py-2 rounded flex items-center gap-1.5 font-bold hover:bg-slate-800 shadow-sm transition-all"
                                >
                                    <Share size={14} /> 요청 전송
                                </button>
                            </div>
                        </div>
                        
                        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1 flex flex-col">
                            <div className="overflow-auto flex-1">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-3 py-3 text-center w-14 border-r border-slate-200">출처</th>
                                            <th className="px-3 py-3 w-24 border-r border-slate-200">내원날짜</th>
                                            <th className="px-3 py-3 w-40 border-r border-slate-200">병·의원&약국</th>
                                            <th className="px-3 py-3 border-r border-slate-200">위 치</th>
                                            <th className="px-3 py-3 w-24 text-center border-r border-slate-200">
                                              보험사
                                              <div className="text-[9px] font-medium text-slate-400 mt-0.5">실손 자동반영</div>
                                            </th>
                                            <th className="px-3 py-3 w-20 text-center border-r border-slate-200">상태</th>
                                            <th className="px-3 py-3 w-24 text-center border-r border-slate-200">운영 상태</th>
                                            <th className="px-3 py-3 w-28 text-center border-r border-slate-200">배정 수행자</th>
                                            <th className="px-3 py-3 w-80 border-r border-slate-200">발급서류 (개별 파일)</th>
                                            <th className="px-3 py-3 w-32 text-center">전체 결과</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {issuanceRequests.map((doc) => (
                                            <tr key={doc.id} className="hover:bg-slate-50 group">
                                                <td className="px-3 py-3 text-center border-r border-slate-200 bg-slate-50/30">
                                                    {doc.source === 'auto' ? (
                                                        <div className="flex flex-col items-center gap-1" title="자동 생성됨">
                                                            <Activity size={14} className="text-blue-500" />
                                                            <span className="text-[9px] text-blue-400 font-bold">Auto</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-1" title="수기 입력됨">
                                                            <User size={14} className="text-amber-500" />
                                                            <span className="text-[9px] text-amber-500 font-bold">Manual</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 font-mono text-slate-600 border-r border-slate-200 align-top">
                                                    {doc.date}
                                                </td>
                                                <td className="px-3 py-3 font-bold text-[#1e293b] border-r border-slate-200 align-top">
                                                    {doc.hospital}
                                                    {doc.source === 'manual' && (
                                                        <button 
                                                            onClick={() => handleDeleteIssuance(doc.id)}
                                                            className="ml-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 inline-block align-middle"
                                                            title="삭제"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 text-slate-500 border-r border-slate-200 align-top truncate max-w-[150px]" title={doc.location}>
                                                    {doc.location}
                                                </td>
                                                <td className="px-3 py-3 text-center border-r border-slate-200 align-top">
                                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200">
                                                        {doc.insurer}
                                                    </span>
                                                    <div className="text-[9px] text-slate-400 mt-1">고객 실손 기준</div>
                                                </td>
                                                <td className="px-3 py-3 text-center border-r border-slate-200 align-top">
                                                    <span className={clsx(
                                                      "px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex",
                                                      doc.requestStatus === '요청전송완료'
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                        : doc.requestStatus === '전송대기'
                                                          ? "bg-blue-50 text-blue-700 border-blue-100"
                                                          : "bg-amber-50 text-amber-700 border-amber-100"
                                                    )}>
                                                      {doc.requestStatus}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-center border-r border-slate-200 align-top">
                                                    <span className={clsx(
                                                      "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                                      doc.opsStatus === '최종완료' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                      doc.opsStatus === '예외검토필요' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                      doc.opsStatus === '업로드중' ? "bg-blue-50 text-blue-700 border-blue-100" :
                                                      doc.opsStatus === '방문준비' || doc.opsStatus === '직원배정' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                                                      "bg-slate-100 text-slate-600 border-slate-200"
                                                    )}>
                                                      {doc.opsStatus}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-center border-r border-slate-200 align-top">
                                                    <div className="text-[11px] font-bold text-slate-700">
                                                      {doc.assignedStaffName ?? '미배정'}
                                                    </div>
                                                    {doc.assignedStaffPhone && (
                                                      <div className="text-[10px] text-slate-400 mt-1">
                                                        {doc.assignedStaffPhone}
                                                      </div>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 border-r border-slate-200 align-top">
                                                    <div className="space-y-1">
                                                        {doc.docs.map((d, i: number) => {
                                                            const expectedCount = d.expectedCount ?? 1;
                                                            const confirmedCount = d.confirmedCount ?? (d.status === 'confirmed' ? expectedCount : 0);
                                                            const isConfirmed = d.status === 'confirmed';
                                                            const isException = (d.ocrResult?.confidence ?? 100) < 80;
                                                            const hasProgress = d.status === 'uploaded' || d.status === 'ocr_done' || isConfirmed;
                                                            return (
                                                            <div key={i} className="flex items-center gap-1.5">
                                                                {isConfirmed ? (
                                                                    <div className="size-3 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                                                        <CheckCircle2 size={8} className="text-emerald-600" />
                                                                    </div>
                                                                ) : isException ? (
                                                                    <div className="size-3 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                                                        <AlertTriangle size={8} className="text-amber-600" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="size-3 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                                                        <div className="size-1 bg-slate-300 rounded-full" />
                                                                    </div>
                                                                )}
                                                                <span className={clsx(
                                                                  "text-[11px]",
                                                                  isConfirmed ? "text-emerald-700 font-medium" :
                                                                  isException ? "text-amber-700 font-medium" :
                                                                  hasProgress ? "text-blue-700 font-medium" : "text-slate-400"
                                                                )}>
                                                                    {d.name} {expectedCount > 1 ? `(${confirmedCount}/${expectedCount})` : ''}
                                                                </span>
                                                                {d.uploadedFile && (
                                                                    <button onClick={() => handleSingleDownload(d.uploadedFile)} className="text-slate-300 hover:text-blue-500 transition-colors">
                                                                        <DownloadCloud size={10} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-center align-top">
                                                    {doc.status === 'completed' ? (
                                                        <button onClick={() => handleSingleDownload(doc.fileName || '')} className="text-emerald-600 font-bold text-xs flex items-center justify-center gap-1 hover:underline">
                                                            <CheckCircle2 size={12} /> 발급 완료
                                                        </button>
                                                    ) : doc.status === 'partial' ? (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="text-amber-500 font-bold text-xs">일부 완료</span>
                                                            <button 
                                                                onClick={() => onNavigate?.(`issuance-master:${doc.claimId}`)} 
                                                                className="text-[9px] bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 px-1.5 py-0.5 rounded border border-slate-200 transition-colors"
                                                            >
                                                                운영 화면에서 이어서 처리
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="text-slate-400 text-xs">대기중</span>
                                                            <button 
                                                                onClick={() => onNavigate?.(`issuance-master:${doc.claimId}`)} 
                                                                className="text-[9px] bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 px-1.5 py-0.5 rounded border border-slate-200 transition-colors"
                                                            >
                                                                운영 화면 보기
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                 </div>
              )}

              {activeTab === 'final' && (
                 <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <Activity size={48} className="mb-4 opacity-50" />
                    <p className="font-medium">최종 분석 리포트 생성 중...</p>
                 </div>
              )}

              <Dialog open={showTripPrintModal} onOpenChange={setShowTripPrintModal}>
                 <DialogContent className="sm:max-w-[640px]">
                    <DialogHeader>
                       <DialogTitle>미완료 장소 3종 출력</DialogTitle>
                       <DialogDescription>
                          3종 서류를 생성할 병원 또는 약국을 선택하세요. 진료기록위임장과 동의서는 선택한 기관 기준으로 개인화됩니다.
                       </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 max-h-[420px] overflow-y-auto">
                       <div className="flex items-center justify-between text-xs">
                          <button
                             type="button"
                             onClick={() => setSelectedTripPrintIds(incompleteRequests.map((request) => request.id))}
                             className="text-blue-600 font-bold hover:underline"
                          >
                             전체 선택
                          </button>
                          <button
                             type="button"
                             onClick={() => setSelectedTripPrintIds([])}
                             className="text-slate-500 font-bold hover:underline"
                          >
                             전체 해제
                          </button>
                       </div>

                       {incompleteRequests.map((request) => {
                         const checked = selectedTripPrintIds.includes(request.id);
                         return (
                           <label
                             key={request.id}
                             className={clsx(
                               'flex items-start gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors',
                               checked ? 'border-blue-200 bg-blue-50/60' : 'border-slate-200 bg-white hover:bg-slate-50'
                             )}
                           >
                             <input
                               type="checkbox"
                               checked={checked}
                               onChange={() =>
                                 setSelectedTripPrintIds((prev) =>
                                   checked ? prev.filter((id) => id !== request.id) : [...prev, request.id]
                                 )
                               }
                               className="mt-0.5 size-4 rounded border-slate-300"
                             />
                             <div className="min-w-0 flex-1">
                               <div className="flex items-center gap-2 flex-wrap">
                                 <span className="font-bold text-[#1e293b]">{request.hospital}</span>
                                 <span className="text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 rounded-full px-2 py-0.5">
                                   {request.date}
                                 </span>
                               </div>
                               <div className="text-xs text-slate-500 mt-1">{request.location}</div>
                               <div className="text-[11px] text-slate-400 mt-1">
                                 필요 3종 서류: 신분증 사본 / 진료기록위임장 / 동의서
                               </div>
                             </div>
                           </label>
                         );
                       })}
                    </div>

                    <DialogFooter>
                       <button
                          type="button"
                          onClick={() => setShowTripPrintModal(false)}
                          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50"
                       >
                          취소
                       </button>
                       <button
                          type="button"
                          onClick={handlePrintTripDocs}
                          className="px-3 py-2 rounded-lg bg-[#1e293b] text-white text-sm font-bold hover:bg-slate-800"
                       >
                          선택한 장소 출력
                       </button>
                    </DialogFooter>
                 </DialogContent>
              </Dialog>

           </div>
        </div>

        {/* Right Panel: Memo & History */}
        <div className="w-full lg:flex-[1.5] lg:w-auto lg:min-w-[280px] bg-white lg:border-l border-t lg:border-t-0 border-slate-200 overflow-y-auto shrink-0 flex flex-col hidden lg:flex custom-scrollbar">
           <div className="p-4 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
              <h2 className="font-bold text-[#1e293b] flex items-center gap-2 text-sm">
                 <FileText size={16} className="text-slate-500" /> 청구 메모 및 이력
              </h2>
           </div>
           
           <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-6">
                 {/* Settlement Status */}
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-xs font-bold text-slate-500">정산 진행 상태</span>
                       <span className={clsx(
                          "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                          processStatus === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                       )}>
                          {processStatus === 'ready' ? '준비중' : processStatus}
                       </span>
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between text-xs">
                          <span className="text-slate-500">예상 지급액</span>
                          <span className="font-mono font-bold text-slate-700">{estimatedPayout.toLocaleString()}원</span>
                       </div>
                       <div className="flex justify-between text-xs">
                          <span className="text-slate-500">실제 지급액</span>
                          <span className="font-mono font-bold text-blue-600">
                             {totalActual > 0 ? totalActual.toLocaleString() + '원' : '-'}
                          </span>
                       </div>
                       {totalDiff !== 0 && totalActual > 0 && (
                          <div className="flex justify-between text-xs pt-2 border-t border-slate-200">
                             <span className="text-slate-500">차액 (Variance)</span>
                             <span className={clsx("font-mono font-bold", totalDiff > 0 ? "text-emerald-600" : "text-rose-500")}>
                                {totalDiff > 0 ? '+' : ''}{totalDiff.toLocaleString()}원
                             </span>
                          </div>
                       )}
                    </div>
                 </div>

                 {/* Memo */}
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">업무 메모</label>
                    <textarea 
                       className="w-full h-32 p-3 text-xs bg-white border border-slate-200 rounded resize-none focus:outline-none focus:border-blue-500 transition-colors"
                       placeholder="청구 진행 관련 특이사항이나 메모를 입력하세요..."
                       value={settlement.reason}
                       onChange={(e) => setSettlement(prev => ({ ...prev, reason: e.target.value }))}
                    />
                    <button className="w-full py-2 bg-[#1e293b] text-white text-xs font-bold rounded hover:bg-slate-800 transition-colors shadow-sm">
                       메모 저장
                    </button>
                 </div>

                 {/* History Timeline */}
                 <div className="pt-4 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-500 mb-3 block">처리 이력</label>
                    <div className="relative pl-3 border-l border-slate-200 space-y-4">
                       {[
                          { title: '청구 접수', date: '2026.01.23 10:00', desc: '간편 청구 접수됨' },
                          { title: '서류 확인', date: '2026.01.23 14:20', desc: '필수 서류 3종 확인 완료' },
                          { title: '분석 시작', date: '2026.01.24 09:15', desc: '담당자 배정 및 분석 시작' }
                       ].map((h, i) => (
                          <div key={i} className="relative">
                             <div className="absolute -left-[17px] top-1 size-2 rounded-full bg-slate-300 border-2 border-white ring-1 ring-slate-100"></div>
                             <div className="text-xs">
                                <div className="flex justify-between mb-0.5">
                                   <span className="font-bold text-slate-700">{h.title}</span>
                                   <span className="text-[10px] text-slate-400 font-mono">{h.date}</span>
                                </div>
                                <p className="text-slate-500 leading-snug">{h.desc}</p>
                             </div>
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

// Separate component to handle row expansion properly (fixes React.Fragment key warnings)
function IndemnityRow({ contract, expanded, onExpand }: { contract: any, expanded: boolean, onExpand: () => void }) {
  return (
    <>
      <tr 
         className={clsx("hover:bg-slate-50 cursor-pointer", expanded ? "bg-slate-50" : "")}
         onClick={onExpand}
      >
         <td className="px-2 text-center text-slate-400">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
         </td>
         <td className="px-4 py-2.5 text-slate-600">{contract.insurer}</td>
         <td className="px-4 py-2.5 font-bold text-[#1e293b]">{contract.name}</td>
         <td className="px-4 py-2.5 text-slate-600 font-mono text-[10px]">{contract.policyNo}</td>
         <td className="px-4 py-2.5">
            <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-100">
               {contract.status}
            </span>
         </td>
         <td className="px-4 py-2.5 text-slate-500 text-[10px] font-mono">
            {contract.start} ~ {contract.end}
         </td>
      </tr>
      {/* Details Expansion */}
      {expanded && (
         <tr>
            <td colSpan={6} className="bg-slate-50/50 p-3 border-b border-slate-100 shadow-inner">
               <div className="ml-8 border border-slate-200 rounded-lg bg-white overflow-hidden">
                  <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-600 flex items-center gap-1.5">
                     <FileText size={12} /> 상세 가입 답보 내역
                  </div>
                  <table className="w-full text-xs">
                     <thead>
                        <tr className="border-b border-slate-100 text-slate-500">
                           <th className="px-3 py-2 font-medium text-left">보장명</th>
                           <th className="px-3 py-2 font-medium text-right">보장금액</th>
                           <th className="px-3 py-2 font-medium text-center">상태</th>
                           <th className="px-3 py-2 font-medium text-center">보장기간</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {contract.details?.map((detail: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                             <td className="px-3 py-2 text-slate-700 font-medium">{detail.name}</td>
                             <td className="px-3 py-2 text-right font-mono text-[#1e293b]">{detail.amount}</td>
                             <td className="px-3 py-2 text-center">
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">
                                   {detail.status}
                                </span>
                             </td>
                             <td className="px-3 py-2 text-center font-mono text-slate-500 text-[10px]">
                                {detail.start} ~ {detail.end}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
               </div>
            </td>
         </tr>
      )}
    </>
  );
}
