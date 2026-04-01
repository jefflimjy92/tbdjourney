/**
 * ComplianceDashboard.tsx
 * Sprint 4: 준법감시 8건 + 개인정보 요약
 */
import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle,
  ClipboardCheck,
  Clock,
  Database,
  Eye,
  FileWarning,
  GraduationCap,
  Lock,
  Megaphone,
  PhoneCall,
  Scale,
  Shield,
} from 'lucide-react';
import {
  REFUND_STEP_SEQUENCE,
  SIMPLE_CLAIM_STEP_SEQUENCE,
  STEP_LABELS,
} from '@/app/journey/phaseConfig';

type ComplianceSection =
  | 'legal_review'
  | 'marketing_review'
  | 'recording_qa'
  | 'complaints'
  | 'training'
  | 'vendor_check'
  | 'chinese_wall'
  | 'internal_control';

type ReviewStatus = 'unreviewed' | 'reviewing' | 'approved' | 'rejected';
type MarketingMaterialType = '배너' | '영상' | '블로그' | 'SNS';
type ViolationType = '허위' | '과장' | '오인유발' | '해당없음';
type HappyCallStatus = '미실시' | '완료' | '불만';
type QaViolation = '없음' | '수수료미안내' | '동의누락' | '과장안내';
type ComplaintType = '고객불만' | '원수사민원' | '금감원민원';
type ComplaintStatus = '접수' | '조사중' | '조치완료' | '종결';
type VendorResult = '양호' | '보완' | '부적합';
type WallStatus = '정상' | '경고' | '위반';
type ControlCategory = '개인정보' | '금융거래' | '마케팅' | '업무위탁';
type ControlStatus = '시행중' | '개정중' | '폐지';
type Sensitivity = 'high' | 'medium' | 'low';
type RetentionStatus = 'active' | 'expiring_soon' | 'expired';

interface ComplianceKpi {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  accent: string;
  bg: string;
}

interface SectionSummary {
  id: ComplianceSection;
  label: string;
  icon: React.ElementType;
  progress: number;
  note: string;
}

interface LegalReviewRow {
  stepCode: string;
  stepName: string;
  status: ReviewStatus;
  reviewer: string;
  reviewedAt: string;
}

interface MarketingReviewRow {
  id: string;
  materialType: MarketingMaterialType;
  title: string;
  status: ReviewStatus;
  violationType: ViolationType;
  reviewer: string;
  reviewedAt: string;
}

interface RecordingQaRow {
  id: string;
  counselor: string;
  customer: string;
  calledAt: string;
  qaScore: number;
  violation: QaViolation;
  happyCallStatus: HappyCallStatus;
}

interface ComplaintRow {
  id: string;
  type: ComplaintType;
  receivedAt: string;
  owner: string;
  status: ComplaintStatus;
  discipline: boolean;
}

interface TrainingRow {
  id: string;
  title: string;
  audience: string;
  scheduledAt: string;
  completionRate: number;
  missingCount: number;
}

interface VendorCheckRow {
  id: string;
  vendor: string;
  scope: string;
  contractPeriod: string;
  lastCheckedAt: string;
  result: VendorResult;
  nextCheckAt: string;
}

interface ChineseWallRow {
  id: string;
  department: string;
  accessLevel: string;
  violationCount: number;
  history: string;
  status: WallStatus;
}

interface InternalControlRow {
  id: string;
  name: string;
  category: ControlCategory;
  revisedAt: string;
  status: ControlStatus;
  owner: string;
}

interface PrivacySummaryItem {
  phase: string;
  step: string;
  dataType: string;
  sensitivity: Sensitivity;
  retentionStatus: RetentionStatus;
  recordCount: number;
  note: string;
}

const REVIEW_STATUS_CONFIG: Record<ReviewStatus, { label: string; color: string; bg: string }> = {
  unreviewed: { label: '미검토', color: 'text-gray-700', bg: 'bg-gray-100' },
  reviewing: { label: '검토중', color: 'text-blue-700', bg: 'bg-blue-50' },
  approved: { label: '승인', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  rejected: { label: '반려', color: 'text-rose-700', bg: 'bg-rose-50' },
};

const COMPLAINT_STATUS_CONFIG: Record<ComplaintStatus, { color: string; bg: string }> = {
  접수: { color: 'text-gray-700', bg: 'bg-gray-100' },
  조사중: { color: 'text-blue-700', bg: 'bg-blue-50' },
  조치완료: { color: 'text-emerald-700', bg: 'bg-emerald-50' },
  종결: { color: 'text-slate-700', bg: 'bg-slate-100' },
};

const VENDOR_RESULT_CONFIG: Record<VendorResult, { color: string; bg: string }> = {
  양호: { color: 'text-emerald-700', bg: 'bg-emerald-50' },
  보완: { color: 'text-amber-700', bg: 'bg-amber-50' },
  부적합: { color: 'text-rose-700', bg: 'bg-rose-50' },
};

const WALL_STATUS_CONFIG: Record<WallStatus, { color: string; bg: string }> = {
  정상: { color: 'text-emerald-700', bg: 'bg-emerald-50' },
  경고: { color: 'text-amber-700', bg: 'bg-amber-50' },
  위반: { color: 'text-rose-700', bg: 'bg-rose-50' },
};

const CONTROL_STATUS_CONFIG: Record<ControlStatus, { color: string; bg: string }> = {
  시행중: { color: 'text-emerald-700', bg: 'bg-emerald-50' },
  개정중: { color: 'text-blue-700', bg: 'bg-blue-50' },
  폐지: { color: 'text-gray-700', bg: 'bg-gray-100' },
};

const SENSITIVITY_CONFIG: Record<Sensitivity, { label: string; color: string; bg: string }> = {
  high: { label: '고민감', color: 'text-rose-700', bg: 'bg-rose-50' },
  medium: { label: '중간민감', color: 'text-amber-700', bg: 'bg-amber-50' },
  low: { label: '일반', color: 'text-emerald-700', bg: 'bg-emerald-50' },
};

const RETENTION_CONFIG: Record<RetentionStatus, { label: string; color: string; bg: string }> = {
  active: { label: '정상', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  expiring_soon: { label: '만료 임박', color: 'text-amber-700', bg: 'bg-amber-50' },
  expired: { label: '만료', color: 'text-rose-700', bg: 'bg-rose-50' },
};

const LEGAL_REVIEW_ROWS: LegalReviewRow[] = [...REFUND_STEP_SEQUENCE, ...SIMPLE_CLAIM_STEP_SEQUENCE].map(
  (step, index) => {
    const statusCycle: ReviewStatus[] = ['approved', 'reviewing', 'unreviewed', 'approved', 'rejected'];
    const reviewers = ['김준법', '박감시', '이심의', '최운영'];
    const stepCode = step.split('_')[0];
    const status = statusCycle[index % statusCycle.length];
    return {
      stepCode,
      stepName: STEP_LABELS[step],
      status,
      reviewer: status === 'unreviewed' ? '-' : reviewers[index % reviewers.length],
      reviewedAt: status === 'unreviewed' ? '-' : `2026-03-${String(10 + (index % 20)).padStart(2, '0')}`,
    };
  },
);

const MARKETING_REVIEW_ROWS: MarketingReviewRow[] = [
  { id: 'MK-101', materialType: '배너', title: '3년 환급 리드 배너 A', status: 'approved', violationType: '해당없음', reviewer: '김준법', reviewedAt: '2026-04-01' },
  { id: 'MK-102', materialType: '영상', title: '간편청구 숏폼 15초', status: 'reviewing', violationType: '과장', reviewer: '박감시', reviewedAt: '2026-04-01' },
  { id: 'MK-103', materialType: '블로그', title: '보험금 청구 가이드', status: 'approved', violationType: '해당없음', reviewer: '이심의', reviewedAt: '2026-03-31' },
  { id: 'MK-104', materialType: 'SNS', title: '소개 이벤트 카드뉴스', status: 'rejected', violationType: '오인유발', reviewer: '김준법', reviewedAt: '2026-03-31' },
  { id: 'MK-105', materialType: '배너', title: '재유입 리텐션 배너', status: 'reviewing', violationType: '허위', reviewer: '최운영', reviewedAt: '2026-04-02' },
  { id: 'MK-106', materialType: 'SNS', title: '고객 후기 이미지', status: 'approved', violationType: '해당없음', reviewer: '박감시', reviewedAt: '2026-03-29' },
];

const RECORDING_QA_ROWS: RecordingQaRow[] = [
  { id: 'CALL-501', counselor: '김상담', customer: '이영희', calledAt: '2026-04-01 10:20', qaScore: 92, violation: '없음', happyCallStatus: '완료' },
  { id: 'CALL-500', counselor: '이원이', customer: '정민수', calledAt: '2026-04-01 09:45', qaScore: 81, violation: '없음', happyCallStatus: '완료' },
  { id: 'CALL-499', counselor: '박하준', customer: '한지민', calledAt: '2026-03-31 18:10', qaScore: 76, violation: '과장안내', happyCallStatus: '미실시' },
  { id: 'CALL-498', counselor: '최주원', customer: '김도윤', calledAt: '2026-03-31 16:22', qaScore: 64, violation: '수수료미안내', happyCallStatus: '불만' },
  { id: 'CALL-497', counselor: '김상담', customer: '박소민', calledAt: '2026-03-31 15:11', qaScore: 58, violation: '동의누락', happyCallStatus: '완료' },
  { id: 'CALL-496', counselor: '이원이', customer: '윤하린', calledAt: '2026-03-31 14:03', qaScore: 88, violation: '없음', happyCallStatus: '완료' },
  { id: 'CALL-495', counselor: '박하준', customer: '최수빈', calledAt: '2026-03-31 11:54', qaScore: 73, violation: '과장안내', happyCallStatus: '미실시' },
];

const COMPLAINT_ROWS: ComplaintRow[] = [
  { id: 'VOC-301', type: '고객불만', receivedAt: '2026-04-01', owner: '정혜린', status: '접수', discipline: false },
  { id: 'VOC-300', type: '원수사민원', receivedAt: '2026-03-31', owner: '김준법', status: '조사중', discipline: true },
  { id: 'VOC-299', type: '금감원민원', receivedAt: '2026-03-30', owner: '박감시', status: '조사중', discipline: true },
  { id: 'VOC-298', type: '고객불만', receivedAt: '2026-03-29', owner: '이심의', status: '조치완료', discipline: false },
  { id: 'VOC-297', type: '원수사민원', receivedAt: '2026-03-28', owner: '최운영', status: '종결', discipline: false },
];

const TRAINING_ROWS: TrainingRow[] = [
  { id: 'TRN-41', title: '신입 준법교육', audience: '신규 입사자', scheduledAt: '2026-04-05 09:00', completionRate: 72, missingCount: 5 },
  { id: 'TRN-40', title: '월간 정기교육', audience: '상담/영업 전체', scheduledAt: '2026-04-08 18:00', completionRate: 94, missingCount: 2 },
  { id: 'TRN-39', title: '개인정보 특별교육', audience: '청구/총무', scheduledAt: '2026-03-29 17:30', completionRate: 100, missingCount: 0 },
  { id: 'TRN-38', title: '마케팅 심의 리마인드', audience: '마케팅/CS', scheduledAt: '2026-03-22 08:30', completionRate: 83, missingCount: 3 },
];

const VENDOR_CHECK_ROWS: VendorCheckRow[] = [
  { id: 'VN-01', vendor: '투에이치', scope: '서류 발급 대행', contractPeriod: '2026-01-01 ~ 2026-12-31', lastCheckedAt: '2026-03-28', result: '보완', nextCheckAt: '2026-04-11' },
  { id: 'VN-02', vendor: '콜 협력사 A', scope: '해피콜 아웃바운드', contractPeriod: '2025-11-01 ~ 2026-10-31', lastCheckedAt: '2026-03-25', result: '양호', nextCheckAt: '2026-04-25' },
  { id: 'VN-03', vendor: '전자서명 대행', scope: '동의서 전자수집', contractPeriod: '2026-02-01 ~ 2027-01-31', lastCheckedAt: '2026-03-30', result: '부적합', nextCheckAt: '2026-04-06' },
];

const CHINESE_WALL_ROWS: ChineseWallRow[] = [
  { id: 'CW-01', department: '상담팀', accessLevel: 'L2', violationCount: 0, history: '최근 30일 위반 없음', status: '정상' },
  { id: 'CW-02', department: '영업팀', accessLevel: 'L2', violationCount: 1, history: '고객 파일 외부 공유 시도 1건', status: '경고' },
  { id: 'CW-03', department: '청구팀', accessLevel: 'L3', violationCount: 0, history: '민감정보 접근 승인 정상', status: '정상' },
  { id: 'CW-04', department: '마케팅팀', accessLevel: 'L1', violationCount: 2, history: '광고소재 검토 전 고객정보 열람 2건', status: '위반' },
  { id: 'CW-05', department: '외주관리', accessLevel: 'L1', violationCount: 1, history: '위탁사 자료 반출 사전승인 누락', status: '경고' },
];

const INTERNAL_CONTROL_ROWS: InternalControlRow[] = [
  { id: 'CTL-201', name: '개인정보 보관/파기 기준', category: '개인정보', revisedAt: '2026-03-15', status: '시행중', owner: '준법감시팀' },
  { id: 'CTL-202', name: '카드 수납 수기결제 통제', category: '금융거래', revisedAt: '2026-03-21', status: '개정중', owner: '관리팀' },
  { id: 'CTL-203', name: '광고 심의 승인번호 관리', category: '마케팅', revisedAt: '2026-03-30', status: '시행중', owner: '마케팅팀' },
  { id: 'CTL-204', name: '위탁업체 접근권한 회수', category: '업무위탁', revisedAt: '2026-03-27', status: '시행중', owner: '보안담당' },
  { id: 'CTL-205', name: '녹취 QA 샘플링 정책', category: '개인정보', revisedAt: '2026-03-18', status: '개정중', owner: '상담팀장' },
  { id: 'CTL-206', name: '민원 및 징계 프로토콜', category: '업무위탁', revisedAt: '2026-02-11', status: '폐지', owner: '준법감시팀' },
  { id: 'CTL-207', name: '대고객 홍보문구 승인 절차', category: '마케팅', revisedAt: '2026-03-31', status: '시행중', owner: '준법감시팀' },
];

const PRIVACY_SUMMARY: PrivacySummaryItem[] = [
  { phase: '조회/신청', step: 'S2-S3', dataType: '주민등록번호, 보험증권', sensitivity: 'high', retentionStatus: 'active', recordCount: 980, note: '조회 후 즉시 파기 정책 점검 중' },
  { phase: '상담/TM', step: 'S5-S6', dataType: '통화 녹음, 상담 이력', sensitivity: 'medium', retentionStatus: 'expiring_soon', recordCount: 2450, note: '6개월 만료 대상 320건' },
  { phase: '청구/분석', step: 'S10-S13', dataType: '의료기록, 진단서', sensitivity: 'high', retentionStatus: 'active', recordCount: 380, note: '청구 완료 후 3년 보관' },
  { phase: '지급/사후', step: 'S14-S15', dataType: '지급 내역, 만족도', sensitivity: 'low', retentionStatus: 'expired', recordCount: 156, note: '만료 데이터 삭제 증적 필요' },
];

function StatusBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span className={clsx('rounded-full px-2 py-1 text-xs font-medium', color, bg)}>{label}</span>;
}

function SectionShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h3 className="text-sm font-bold text-[#1e293b]">{title}</h3>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
      <div className="p-0">{children}</div>
    </div>
  );
}

function LegalReviewSection() {
  return (
    <SectionShell
      title="단계별 법률검토 추적"
      description="S1~S17 + Q1~Q9 각 단계별 검토 상태를 추적합니다."
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {['스텝코드', '스텝명', '검토상태', '검토자', '검토일'].map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {LEGAL_REVIEW_ROWS.map((row) => (
              <tr key={row.stepCode} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-[#1e293b]">{row.stepCode}</td>
                <td className="px-4 py-3 text-slate-600">{row.stepName}</td>
                <td className="px-4 py-3">
                  <StatusBadge {...REVIEW_STATUS_CONFIG[row.status]} />
                </td>
                <td className="px-4 py-3 text-slate-600">{row.reviewer}</td>
                <td className="px-4 py-3 text-slate-500">{row.reviewedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionShell>
  );
}

function MarketingReviewSection() {
  return (
    <SectionShell
      title="마케팅 소재 준법 심의"
      description="허위/과장/오인유발 여부를 중심으로 소재별 심의 상태를 관리합니다."
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {['소재ID', '소재유형', '제목', '심의상태', '위반유형', '심의자', '심의일'].map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MARKETING_REVIEW_ROWS.map((row) => (
              <tr key={row.id} className={clsx('hover:bg-slate-50', row.violationType !== '해당없음' && 'bg-rose-50/40')}>
                <td className="px-4 py-3 font-medium text-[#1e293b]">{row.id}</td>
                <td className="px-4 py-3 text-slate-600">{row.materialType}</td>
                <td className="px-4 py-3 text-slate-600">{row.title}</td>
                <td className="px-4 py-3">
                  <StatusBadge {...REVIEW_STATUS_CONFIG[row.status]} />
                </td>
                <td className="px-4 py-3">
                  <span className={clsx(
                    'rounded-full px-2 py-1 text-xs font-medium',
                    row.violationType === '해당없음' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
                  )}>
                    {row.violationType}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{row.reviewer}</td>
                <td className="px-4 py-3 text-slate-500">{row.reviewedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionShell>
  );
}

function RecordingQaSection() {
  return (
    <SectionShell
      title="녹취 QA / 해피콜"
      description="상담 콜 녹취 QA와 해피콜 상태를 함께 모니터링합니다."
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {['콜ID', '상담원', '고객명', '콜일시', 'QA점수', '위반항목', '해피콜상태'].map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {RECORDING_QA_ROWS.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-[#1e293b]">{row.id}</td>
                <td className="px-4 py-3 text-slate-600">{row.counselor}</td>
                <td className="px-4 py-3 text-slate-600">{row.customer}</td>
                <td className="px-4 py-3 text-slate-500">{row.calledAt}</td>
                <td className="px-4 py-3">
                  <span className={clsx(
                    'font-bold',
                    row.qaScore >= 80 ? 'text-emerald-600' : row.qaScore >= 60 ? 'text-amber-600' : 'text-rose-600',
                  )}>
                    {row.qaScore}점
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={clsx(
                    'rounded-full px-2 py-1 text-xs font-medium',
                    row.violation === '없음' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
                  )}>
                    {row.violation}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={clsx(
                    'rounded-full px-2 py-1 text-xs font-medium',
                    row.happyCallStatus === '완료'
                      ? 'bg-emerald-50 text-emerald-700'
                      : row.happyCallStatus === '불만'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-gray-100 text-gray-700',
                  )}>
                    {row.happyCallStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionShell>
  );
}

function ComplaintSection() {
  return (
    <SectionShell
      title="민원 예방 / 징계"
      description="민원 접수와 후속 조사 상태, 징계 여부를 함께 추적합니다."
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {['민원ID', '유형', '접수일', '담당자', '상태', '징계여부'].map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {COMPLAINT_ROWS.map((row) => (
              <tr key={row.id} className={clsx('hover:bg-slate-50', row.type === '금감원민원' && 'bg-rose-50/40')}>
                <td className="px-4 py-3 font-medium text-[#1e293b]">{row.id}</td>
                <td className="px-4 py-3">
                  <span className={clsx(
                    'rounded-full px-2 py-1 text-xs font-medium',
                    row.type === '금감원민원' ? 'bg-rose-50 text-rose-700' : row.type === '원수사민원' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-700',
                  )}>
                    {row.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{row.receivedAt}</td>
                <td className="px-4 py-3 text-slate-600">{row.owner}</td>
                <td className="px-4 py-3">
                  <StatusBadge label={row.status} {...COMPLAINT_STATUS_CONFIG[row.status]} />
                </td>
                <td className="px-4 py-3">
                  <span className={clsx(
                    'rounded-full px-2 py-1 text-xs font-medium',
                    row.discipline ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700',
                  )}>
                    {row.discipline ? '징계 검토' : '해당없음'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionShell>
  );
}

function TrainingSection() {
  return (
    <SectionShell
      title="준법교육 운영"
      description="교육 일정, 이수율, 미이수자 수를 함께 확인합니다."
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {['교육명', '대상', '일시', '이수율', '미이수자 수'].map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {TRAINING_ROWS.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-[#1e293b]">{row.title}</td>
                <td className="px-4 py-3 text-slate-600">{row.audience}</td>
                <td className="px-4 py-3 text-slate-500">{row.scheduledAt}</td>
                <td className="px-4 py-3 min-w-[180px]">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={clsx(
                          'h-full rounded-full',
                          row.completionRate >= 90
                            ? 'bg-emerald-500'
                            : row.completionRate >= 80
                              ? 'bg-amber-500'
                              : 'bg-rose-500',
                        )}
                        style={{ width: `${row.completionRate}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-xs font-bold text-slate-600">{row.completionRate}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={clsx(
                    'rounded-full px-2 py-1 text-xs font-medium',
                    row.missingCount === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
                  )}>
                    {row.missingCount}명
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionShell>
  );
}

function VendorCheckSection() {
  return (
    <SectionShell
      title="위탁업체 점검"
      description="위탁업체별 점검 결과와 다음 점검 일정을 확인합니다."
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {['업체명', '위탁업무', '계약기간', '최근점검일', '점검결과', '다음점검일'].map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {VENDOR_CHECK_ROWS.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-[#1e293b]">{row.vendor}</td>
                <td className="px-4 py-3 text-slate-600">{row.scope}</td>
                <td className="px-4 py-3 text-slate-500">{row.contractPeriod}</td>
                <td className="px-4 py-3 text-slate-500">{row.lastCheckedAt}</td>
                <td className="px-4 py-3">
                  <StatusBadge label={row.result} {...VENDOR_RESULT_CONFIG[row.result]} />
                </td>
                <td className="px-4 py-3 text-slate-500">{row.nextCheckAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionShell>
  );
}

function ChineseWallSection() {
  return (
    <SectionShell
      title="Chinese Wall 모니터링"
      description="부서별 접근권한과 정보교류차단 위반 이력을 모니터링합니다."
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {['부서', '접근권한등급', '최근위반건수', '위반이력', '차단상태'].map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {CHINESE_WALL_ROWS.map((row) => (
              <tr key={row.id} className={clsx('hover:bg-slate-50', row.violationCount > 0 && row.status !== '정상' && 'bg-amber-50/30')}>
                <td className="px-4 py-3 font-medium text-[#1e293b]">{row.department}</td>
                <td className="px-4 py-3 text-slate-600">{row.accessLevel}</td>
                <td className="px-4 py-3">
                  <span className={clsx(
                    'font-bold',
                    row.violationCount === 0 ? 'text-emerald-600' : row.violationCount === 1 ? 'text-amber-600' : 'text-rose-600',
                  )}>
                    {row.violationCount}건
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{row.history}</td>
                <td className="px-4 py-3">
                  <StatusBadge label={row.status} {...WALL_STATUS_CONFIG[row.status]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionShell>
  );
}

function InternalControlSection() {
  return (
    <SectionShell
      title="내부통제 기준 관리"
      description="카테고리별 내부통제 기준, 개정 상태, 담당부서를 관리합니다."
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {['기준ID', '기준명', '카테고리', '최종개정일', '시행상태', '담당부서'].map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {INTERNAL_CONTROL_ROWS.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-[#1e293b]">{row.id}</td>
                <td className="px-4 py-3 text-slate-600">{row.name}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    {row.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{row.revisedAt}</td>
                <td className="px-4 py-3">
                  <StatusBadge label={row.status} {...CONTROL_STATUS_CONFIG[row.status]} />
                </td>
                <td className="px-4 py-3 text-slate-600">{row.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionShell>
  );
}

function PrivacySummarySection() {
  const highCount = PRIVACY_SUMMARY.filter((item) => item.sensitivity === 'high')
    .reduce((sum, item) => sum + item.recordCount, 0);
  const mediumCount = PRIVACY_SUMMARY.filter((item) => item.sensitivity === 'medium')
    .reduce((sum, item) => sum + item.recordCount, 0);
  const lowCount = PRIVACY_SUMMARY.filter((item) => item.sensitivity === 'low')
    .reduce((sum, item) => sum + item.recordCount, 0);
  const flaggedItems = PRIVACY_SUMMARY.filter((item) => item.retentionStatus !== 'active');

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#1e293b]">개인정보 요약</h3>
            <p className="mt-1 text-xs text-slate-500">기존 개인정보 인벤토리는 요약 카드와 보관 주의 리스트로 유지합니다.</p>
          </div>
          <Database className="h-5 w-5 text-slate-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {[
          { label: '고민감 데이터', value: `${highCount.toLocaleString()}건`, config: SENSITIVITY_CONFIG.high },
          { label: '중간민감 데이터', value: `${mediumCount.toLocaleString()}건`, config: SENSITIVITY_CONFIG.medium },
          { label: '일반 데이터', value: `${lowCount.toLocaleString()}건`, config: SENSITIVITY_CONFIG.low },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className={clsx('rounded-full px-2 py-1 text-xs font-medium', card.config.bg, card.config.color)}>
                {card.config.label}
              </span>
              <span className="text-xs text-slate-500">{card.label}</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-[#1e293b]">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h3 className="text-sm font-bold text-[#1e293b]">보관 만료 임박 / 만료 항목</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {flaggedItems.map((item) => (
            <div key={item.step} className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-[#1e293b]">
                  {item.phase} · {item.step} · {item.dataType}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.recordCount.toLocaleString()}건 · {item.note}
                </p>
              </div>
              <StatusBadge
                label={RETENTION_CONFIG[item.retentionStatus].label}
                color={RETENTION_CONFIG[item.retentionStatus].color}
                bg={RETENTION_CONFIG[item.retentionStatus].bg}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ComplianceDashboard() {
  const [activeSection, setActiveSection] = useState<ComplianceSection>('legal_review');

  const sectionSummaries = useMemo<SectionSummary[]>(
    () => [
      { id: 'legal_review', label: '법률검토', icon: Scale, progress: 78, note: '26개 스텝 기준' },
      { id: 'marketing_review', label: '마케팅심의', icon: Megaphone, progress: 66, note: '위반소재 3건' },
      { id: 'recording_qa', label: '녹취 QA', icon: PhoneCall, progress: 74, note: '낮은 점수 2건' },
      { id: 'complaints', label: '민원/징계', icon: AlertTriangle, progress: 71, note: '금감원민원 1건' },
      { id: 'training', label: '준법교육', icon: GraduationCap, progress: 87, note: '미이수 10명' },
      { id: 'vendor_check', label: '위탁업체', icon: Building2, progress: 69, note: '부적합 1건' },
      { id: 'chinese_wall', label: 'Chinese Wall', icon: Lock, progress: 73, note: '위반 1부서' },
      { id: 'internal_control', label: '내부통제', icon: ClipboardCheck, progress: 80, note: '개정중 2건' },
    ],
    [],
  );

  const kpis: ComplianceKpi[] = useMemo(() => {
    const attentionCount =
      LEGAL_REVIEW_ROWS.filter((row) => row.status !== 'approved').length +
      MARKETING_REVIEW_ROWS.filter((row) => row.violationType !== '해당없음').length +
      COMPLAINT_ROWS.filter((row) => row.type === '금감원민원').length;
    const monthlyCompletion = Math.round(
      sectionSummaries.reduce((sum, section) => sum + section.progress, 0) / sectionSummaries.length,
    );
    const immediateCheckCount =
      COMPLAINT_ROWS.filter((row) => row.type === '금감원민원').length +
      CHINESE_WALL_ROWS.filter((row) => row.status === '위반').length +
      VENDOR_CHECK_ROWS.filter((row) => row.result === '부적합').length;

    return [
      { label: '준법 모듈', value: 8, sub: '그룹 1 전체', icon: Shield, accent: 'text-slate-600', bg: 'bg-slate-50' },
      { label: '주의 항목', value: `${attentionCount}건`, sub: '승인 외 + 위반 포함', icon: AlertTriangle, accent: 'text-amber-600', bg: 'bg-amber-50' },
      { label: '이번 달 완료율', value: `${monthlyCompletion}%`, sub: '모듈 평균 진행률', icon: CheckCircle, accent: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: '즉시 확인 필요', value: `${immediateCheckCount}건`, sub: '금감원/위반/부적합', icon: FileWarning, accent: 'text-rose-600', bg: 'bg-rose-50' },
    ];
  }, [sectionSummaries]);

  const sections = [
    { id: 'legal_review' as const, label: '법률검토', icon: Scale },
    { id: 'marketing_review' as const, label: '마케팅심의', icon: Megaphone },
    { id: 'recording_qa' as const, label: '녹취 QA', icon: PhoneCall },
    { id: 'complaints' as const, label: '민원/징계', icon: AlertTriangle },
    { id: 'training' as const, label: '준법교육', icon: GraduationCap },
    { id: 'vendor_check' as const, label: '위탁업체', icon: Building2 },
    { id: 'chinese_wall' as const, label: 'Chinese Wall', icon: Lock },
    { id: 'internal_control' as const, label: '내부통제', icon: ClipboardCheck },
  ];

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-[#1e293b]">
              <BarChart3 size={20} />
              준법 / 개인정보 대시보드
            </h2>
            <p className="mt-1 text-xs text-slate-500">Sprint 4 그룹 1 준법감시 8건과 개인정보 보관 현황</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-2 text-xs text-slate-500">
            DailyReport 탭 패턴 적용
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{kpi.label}</p>
                <p className={clsx('mt-1 text-2xl font-bold', kpi.accent)}>{kpi.value}</p>
                <p className="mt-1 text-[11px] text-slate-400">{kpi.sub}</p>
              </div>
              <div className={clsx('rounded-lg p-2', kpi.bg)}>
                <kpi.icon size={18} className={kpi.accent} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
        {sectionSummaries.map((section) => (
          <div key={section.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-slate-50 p-2">
                  <section.icon size={16} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1e293b]">{section.label}</p>
                  <p className="text-[10px] text-slate-400">{section.note}</p>
                </div>
              </div>
              <span className="text-sm font-bold text-slate-700">{section.progress}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-[#1e293b]" style={{ width: `${section.progress}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={clsx(
              'flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-bold transition-all',
              activeSection === section.id
                ? 'bg-[#1e293b] text-white'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
            )}
          >
            <section.icon size={14} />
            {section.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto space-y-4">
        {activeSection === 'legal_review' && <LegalReviewSection />}
        {activeSection === 'marketing_review' && <MarketingReviewSection />}
        {activeSection === 'recording_qa' && <RecordingQaSection />}
        {activeSection === 'complaints' && <ComplaintSection />}
        {activeSection === 'training' && <TrainingSection />}
        {activeSection === 'vendor_check' && <VendorCheckSection />}
        {activeSection === 'chinese_wall' && <ChineseWallSection />}
        {activeSection === 'internal_control' && <InternalControlSection />}
        <PrivacySummarySection />
      </div>
    </div>
  );
}
