import React, { useState } from 'react';
import clsx from 'clsx';
import {
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  Briefcase,
  CheckCircle,
  ClipboardCheck,
  Clock,
  CreditCard,
  FileText,
  Lock,
  Shield,
  Users,
} from 'lucide-react';

type AdminSection =
  | 'appointment'
  | 'endorsement'
  | 'payment'
  | 'new_contract'
  | 'transfer'
  | 'privacy';

type AppointmentStatus = 'appointed' | 'terminated' | 'pending';
type RegistrationStatus = 'registered' | 'pending' | 'rejected';
type DocumentStatus = 'complete' | 'missing';
type WorkflowStatus = 'received' | 'in_progress' | 'completed' | 'rejected';
type PaymentStatus = 'normal' | 'late' | 'unpaid';
type ContractStatus = 'received' | 'under_review' | 'approved' | 'rejected';
type TransferStatus = 'waiting' | 'in_progress' | 'completed';
type PrivacyStatus = 'active' | 'expiring' | 'missing';

interface AppointmentRecord {
  id: string;
  name: string;
  licenseNo: string;
  appointedAt: string;
  terminatedAt: string | null;
  status: AppointmentStatus;
  registrationStatus: RegistrationStatus;
  documentStatus: DocumentStatus;
}

interface EndorsementRecord {
  id: string;
  customer: string;
  insurer: string;
  requestType: '담보변경' | '결제변경' | '계약자변경' | '수익자변경';
  requestedAt: string;
  status: WorkflowStatus;
  processor: string;
}

interface PaymentRecord {
  id: string;
  customer: string;
  insurer: string;
  product: string;
  cycle: '월납' | '분기납';
  premium: string;
  method: '카드' | '계좌이체' | '수기';
  status: PaymentStatus;
  nextDueDate: string;
}

interface NewContractRecord {
  id: string;
  customer: string;
  insurer: string;
  product: string;
  premium: string;
  receivedAt: string;
  paymentStatus: '미수납' | '수납완료' | '반송';
  contractStatus: ContractStatus;
}

interface TransferRecord {
  id: string;
  formerOwner: string;
  customer: string;
  insurer: string;
  product: string;
  nextOwner: string;
  status: TransferStatus;
  transferredAt: string;
}

interface PrivacyDocumentRecord {
  id: string;
  customer: string;
  docType: '개인정보수집동의' | '제3자제공동의' | '마케팅동의' | '민감정보동의';
  collectedAt: string;
  status: PrivacyStatus;
  expiresAt: string;
}

const APPOINTMENT_STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; bg: string }> = {
  appointed: { label: '위촉', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  terminated: { label: '해촉', color: 'text-rose-700', bg: 'bg-rose-50' },
  pending: { label: '대기', color: 'text-slate-700', bg: 'bg-slate-100' },
};

const REGISTRATION_STATUS_CONFIG: Record<RegistrationStatus, { label: string; color: string; bg: string }> = {
  registered: { label: '협회등록완료', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  pending: { label: '등록대기', color: 'text-blue-700', bg: 'bg-blue-50' },
  rejected: { label: '반려', color: 'text-rose-700', bg: 'bg-rose-50' },
};

const DOCUMENT_STATUS_CONFIG: Record<DocumentStatus, { label: string; color: string; bg: string }> = {
  complete: { label: '징구완료', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  missing: { label: '미비', color: 'text-amber-700', bg: 'bg-amber-50' },
};

const WORKFLOW_STATUS_CONFIG: Record<WorkflowStatus, { label: string; color: string; bg: string }> = {
  received: { label: '접수', color: 'text-slate-700', bg: 'bg-slate-100' },
  in_progress: { label: '처리중', color: 'text-blue-700', bg: 'bg-blue-50' },
  completed: { label: '완료', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  rejected: { label: '반려', color: 'text-rose-700', bg: 'bg-rose-50' },
};

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  normal: { label: '정상', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  late: { label: '연체', color: 'text-amber-700', bg: 'bg-amber-50' },
  unpaid: { label: '미납', color: 'text-rose-700', bg: 'bg-rose-50' },
};

const CONTRACT_STATUS_CONFIG: Record<ContractStatus, { label: string; color: string; bg: string }> = {
  received: { label: '접수', color: 'text-slate-700', bg: 'bg-slate-100' },
  under_review: { label: '심사중', color: 'text-blue-700', bg: 'bg-blue-50' },
  approved: { label: '승인', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  rejected: { label: '거절', color: 'text-rose-700', bg: 'bg-rose-50' },
};

const TRANSFER_STATUS_CONFIG: Record<TransferStatus, { label: string; color: string; bg: string }> = {
  waiting: { label: '대기', color: 'text-slate-700', bg: 'bg-slate-100' },
  in_progress: { label: '진행중', color: 'text-blue-700', bg: 'bg-blue-50' },
  completed: { label: '완료', color: 'text-emerald-700', bg: 'bg-emerald-50' },
};

const PRIVACY_STATUS_CONFIG: Record<PrivacyStatus, { label: string; color: string; bg: string }> = {
  active: { label: '보관중', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  expiring: { label: '만료 임박', color: 'text-amber-700', bg: 'bg-amber-50' },
  missing: { label: '미징구', color: 'text-rose-700', bg: 'bg-rose-50' },
};

const APPOINTMENTS: AppointmentRecord[] = [
  { id: 'AG-001', name: '김설계', licenseNo: 'A-29013', appointedAt: '2026-02-01', terminatedAt: null, status: 'appointed', registrationStatus: 'registered', documentStatus: 'complete' },
  { id: 'AG-002', name: '박상담', licenseNo: 'A-29044', appointedAt: '2026-02-15', terminatedAt: null, status: 'pending', registrationStatus: 'pending', documentStatus: 'missing' },
  { id: 'AG-003', name: '이영업', licenseNo: 'A-28120', appointedAt: '2025-11-03', terminatedAt: '2026-03-28', status: 'terminated', registrationStatus: 'registered', documentStatus: 'complete' },
  { id: 'AG-004', name: '정미나', licenseNo: 'A-29200', appointedAt: '2026-03-10', terminatedAt: null, status: 'appointed', registrationStatus: 'registered', documentStatus: 'complete' },
  { id: 'AG-005', name: '최도윤', licenseNo: 'A-29117', appointedAt: '2026-03-18', terminatedAt: null, status: 'pending', registrationStatus: 'pending', documentStatus: 'missing' },
  { id: 'AG-006', name: '한소율', licenseNo: 'A-27588', appointedAt: '2025-08-20', terminatedAt: '2026-03-31', status: 'terminated', registrationStatus: 'registered', documentStatus: 'complete' },
];

const ENDORSEMENTS: EndorsementRecord[] = [
  { id: 'EN-104', customer: '김민지', insurer: '삼성화재', requestType: '담보변경', requestedAt: '2026-04-01', status: 'in_progress', processor: '관리1' },
  { id: 'EN-103', customer: '정승우', insurer: 'KB손보', requestType: '결제변경', requestedAt: '2026-03-31', status: 'completed', processor: '관리2' },
  { id: 'EN-102', customer: '이수빈', insurer: '메리츠화재', requestType: '계약자변경', requestedAt: '2026-03-30', status: 'received', processor: '관리1' },
  { id: 'EN-101', customer: '박시온', insurer: '현대해상', requestType: '수익자변경', requestedAt: '2026-03-28', status: 'rejected', processor: '관리3' },
  { id: 'EN-100', customer: '최유진', insurer: 'DB손보', requestType: '결제변경', requestedAt: '2026-03-27', status: 'completed', processor: '관리2' },
];

const PAYMENTS: PaymentRecord[] = [
  { id: 'PM-08', customer: '윤서준', insurer: '삼성화재', product: '실손플랜', cycle: '월납', premium: '58,000', method: '카드', status: 'normal', nextDueDate: '2026-04-14' },
  { id: 'PM-07', customer: '장하린', insurer: '한화손보', product: '건강플랜', cycle: '월납', premium: '82,000', method: '수기', status: 'late', nextDueDate: '2026-04-02' },
  { id: 'PM-06', customer: '김도연', insurer: '현대해상', product: '종합플랜', cycle: '분기납', premium: '210,000', method: '계좌이체', status: 'normal', nextDueDate: '2026-05-01' },
  { id: 'PM-05', customer: '이윤호', insurer: 'KB손보', product: '상해플랜', cycle: '월납', premium: '49,000', method: '수기', status: 'unpaid', nextDueDate: '2026-03-29' },
  { id: 'PM-04', customer: '최소연', insurer: 'DB손보', product: '간편플랜', cycle: '월납', premium: '65,000', method: '카드', status: 'late', nextDueDate: '2026-04-04' },
  { id: 'PM-03', customer: '강민우', insurer: '메리츠화재', product: '암플랜', cycle: '월납', premium: '91,000', method: '계좌이체', status: 'normal', nextDueDate: '2026-04-09' },
];

const NEW_CONTRACTS: NewContractRecord[] = [
  { id: 'NC-501', customer: '한지수', insurer: '삼성화재', product: '실손플랜', premium: '72,000', receivedAt: '2026-04-01', paymentStatus: '수납완료', contractStatus: 'approved' },
  { id: 'NC-500', customer: '김민서', insurer: '한화손보', product: '건강플랜', premium: '81,000', receivedAt: '2026-03-31', paymentStatus: '미수납', contractStatus: 'under_review' },
  { id: 'NC-499', customer: '정하준', insurer: '메리츠화재', product: '종합플랜', premium: '95,000', receivedAt: '2026-03-31', paymentStatus: '수납완료', contractStatus: 'approved' },
  { id: 'NC-498', customer: '윤가은', insurer: 'KB손보', product: '상해플랜', premium: '43,000', receivedAt: '2026-03-29', paymentStatus: '반송', contractStatus: 'rejected' },
  { id: 'NC-497', customer: '박은호', insurer: 'DB손보', product: '간편플랜', premium: '67,000', receivedAt: '2026-03-28', paymentStatus: '수납완료', contractStatus: 'under_review' },
];

const TRANSFERS: TransferRecord[] = [
  { id: 'TR-31', formerOwner: '이영업', customer: '김세훈', insurer: '삼성화재', product: '실손플랜', nextOwner: '박영업', status: 'completed', transferredAt: '2026-03-31' },
  { id: 'TR-30', formerOwner: '한소율', customer: '최다인', insurer: '한화손보', product: '건강플랜', nextOwner: '정영업', status: 'in_progress', transferredAt: '2026-04-01' },
  { id: 'TR-29', formerOwner: '한소율', customer: '이도현', insurer: '메리츠화재', product: '종합플랜', nextOwner: '배정대기', status: 'waiting', transferredAt: '-' },
  { id: 'TR-28', formerOwner: '이영업', customer: '박소민', insurer: 'KB손보', product: '상해플랜', nextOwner: '김영업', status: 'completed', transferredAt: '2026-03-30' },
];

const PRIVACY_DOCS: PrivacyDocumentRecord[] = [
  { id: 'PR-77', customer: '김민지', docType: '개인정보수집동의', collectedAt: '2026-03-01', status: 'active', expiresAt: '2027-03-01' },
  { id: 'PR-76', customer: '이수빈', docType: '제3자제공동의', collectedAt: '2026-03-10', status: 'expiring', expiresAt: '2026-04-15' },
  { id: 'PR-75', customer: '정승우', docType: '민감정보동의', collectedAt: '2026-03-11', status: 'active', expiresAt: '2027-03-11' },
  { id: 'PR-74', customer: '최유진', docType: '마케팅동의', collectedAt: '-', status: 'missing', expiresAt: '-' },
  { id: 'PR-73', customer: '장하린', docType: '개인정보수집동의', collectedAt: '2025-04-15', status: 'expiring', expiresAt: '2026-04-14' },
  { id: 'PR-72', customer: '윤서준', docType: '제3자제공동의', collectedAt: '2026-02-19', status: 'active', expiresAt: '2027-02-19' },
];

function StatusPill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span className={clsx('rounded-full px-2 py-1 text-xs font-medium', color, bg)}>{label}</span>;
}

export function AdminOperations() {
  const [activeSection, setActiveSection] = useState<AdminSection>('appointment');

  const stats = {
    appointments: APPOINTMENTS.filter((record) => record.status === 'appointed').length,
    pendingOps:
      ENDORSEMENTS.filter((record) => record.status === 'received' || record.status === 'in_progress').length +
      TRANSFERS.filter((record) => record.status !== 'completed').length,
    overduePayments: PAYMENTS.filter((record) => record.status === 'late' || record.status === 'unpaid').length,
    privacyRisks: PRIVACY_DOCS.filter((record) => record.status !== 'active').length,
  };

  const sections = [
    { id: 'appointment' as const, label: `위촉/해촉 (${APPOINTMENTS.length})`, icon: Users },
    { id: 'endorsement' as const, label: `배서 처리 (${ENDORSEMENTS.length})`, icon: FileText },
    { id: 'payment' as const, label: `수기결제/수납 (${PAYMENTS.length})`, icon: CreditCard },
    { id: 'new_contract' as const, label: `신계약 수납 (${NEW_CONTRACTS.length})`, icon: Briefcase },
    { id: 'transfer' as const, label: `계약 이관 (${TRANSFERS.length})`, icon: ArrowRightLeft },
    { id: 'privacy' as const, label: `개인정보 문서 (${PRIVACY_DOCS.length})`, icon: Shield },
  ];

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-[#1e293b]">
              <BarChart3 size={20} />
              관리업무 운영
            </h2>
            <p className="mt-1 text-xs text-slate-500">위촉/해촉, 배서, 수납, 이관, 개인정보 문서 운영 현황</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-2 text-xs text-slate-500">
            관리자 전용 Mock 운영 화면
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: '활성 설계사', value: `${stats.appointments}명`, sub: '위촉 상태 기준', icon: Users, accent: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: '처리 대기', value: `${stats.pendingOps}건`, sub: '배서 + 계약 이관', icon: Clock, accent: 'text-blue-600', bg: 'bg-blue-50' },
          { label: '수납 리스크', value: `${stats.overduePayments}건`, sub: '연체/미납 포함', icon: AlertTriangle, accent: 'text-rose-600', bg: 'bg-rose-50' },
          { label: '개인정보 리스크', value: `${stats.privacyRisks}건`, sub: '만료 임박/미징구', icon: Lock, accent: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{card.label}</p>
                <p className={clsx('mt-1 text-2xl font-bold', card.accent)}>{card.value}</p>
                <p className="mt-1 text-[11px] text-slate-400">{card.sub}</p>
              </div>
              <div className={clsx('rounded-lg p-2', card.bg)}>
                <card.icon size={18} className={card.accent} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
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

      <div className="flex-1 overflow-auto">
        {activeSection === 'appointment' && <AppointmentSection />}
        {activeSection === 'endorsement' && <EndorsementSection />}
        {activeSection === 'payment' && <PaymentSection />}
        {activeSection === 'new_contract' && <NewContractSection />}
        {activeSection === 'transfer' && <TransferSection />}
        {activeSection === 'privacy' && <PrivacySection />}
      </div>
    </div>
  );
}

function AppointmentSection() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h3 className="text-sm font-bold text-[#1e293b]">위촉 / 해촉 관리</h3>
        <p className="mt-1 text-xs text-slate-500">협회 등록 상태와 필수서류 징구 여부를 함께 관리합니다.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {['성명', '등록번호', '위촉일', '해촉일', '상태', '협회등록', '필수서류', '메모'].map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {APPOINTMENTS.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-[#1e293b]">{record.name}</td>
                <td className="px-4 py-3 text-slate-600">{record.licenseNo}</td>
                <td className="px-4 py-3 text-slate-600">{record.appointedAt}</td>
                <td className="px-4 py-3 text-slate-600">{record.terminatedAt || '-'}</td>
                <td className="px-4 py-3">
                  <StatusPill {...APPOINTMENT_STATUS_CONFIG[record.status]} />
                </td>
                <td className="px-4 py-3">
                  <StatusPill {...REGISTRATION_STATUS_CONFIG[record.registrationStatus]} />
                </td>
                <td className="px-4 py-3">
                  <StatusPill {...DOCUMENT_STATUS_CONFIG[record.documentStatus]} />
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {record.status === 'terminated' ? '계약 이관 대상 확인 필요' : '정상 운영'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EndorsementSection() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h3 className="text-sm font-bold text-[#1e293b]">계약 보전(배서) 처리</h3>
        <p className="mt-1 text-xs text-slate-500">담보/결제/계약자/수익자 변경 요청 처리 현황</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {['요청ID', '고객명', '보험사', '변경유형', '요청일', '처리상태', '처리자'].map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ENDORSEMENTS.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-[#1e293b]">{record.id}</td>
                <td className="px-4 py-3 text-slate-600">{record.customer}</td>
                <td className="px-4 py-3 text-slate-600">{record.insurer}</td>
                <td className="px-4 py-3 text-slate-600">{record.requestType}</td>
                <td className="px-4 py-3 text-slate-600">{record.requestedAt}</td>
                <td className="px-4 py-3">
                  <StatusPill {...WORKFLOW_STATUS_CONFIG[record.status]} />
                </td>
                <td className="px-4 py-3 text-slate-600">{record.processor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentSection() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h3 className="text-sm font-bold text-[#1e293b]">보험료 계속분 수기결제 / 수납</h3>
        <p className="mt-1 text-xs text-slate-500">연체/미납 건을 우선 노출합니다.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {['고객명', '보험사', '상품명', '납입주기', '보험료', '결제방법', '납입상태', '다음납입일'].map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {PAYMENTS.map((record) => (
              <tr key={record.id} className={clsx('hover:bg-slate-50', record.status !== 'normal' && 'bg-rose-50/40')}>
                <td className="px-4 py-3 font-medium text-[#1e293b]">{record.customer}</td>
                <td className="px-4 py-3 text-slate-600">{record.insurer}</td>
                <td className="px-4 py-3 text-slate-600">{record.product}</td>
                <td className="px-4 py-3 text-slate-600">{record.cycle}</td>
                <td className="px-4 py-3 text-slate-600">{record.premium}</td>
                <td className="px-4 py-3 text-slate-600">{record.method}</td>
                <td className="px-4 py-3">
                  <StatusPill {...PAYMENT_STATUS_CONFIG[record.status]} />
                </td>
                <td className="px-4 py-3 text-slate-600">{record.nextDueDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NewContractSection() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h3 className="text-sm font-bold text-[#1e293b]">신계약 수납 / 청약접수 반영</h3>
        <p className="mt-1 text-xs text-slate-500">수납 상태와 청약 심사 상태를 함께 추적합니다.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {['청약번호', '고객명', '보험사', '상품명', '보험료', '접수일', '수납상태', '청약상태'].map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {NEW_CONTRACTS.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-[#1e293b]">{record.id}</td>
                <td className="px-4 py-3 text-slate-600">{record.customer}</td>
                <td className="px-4 py-3 text-slate-600">{record.insurer}</td>
                <td className="px-4 py-3 text-slate-600">{record.product}</td>
                <td className="px-4 py-3 text-slate-600">{record.premium}</td>
                <td className="px-4 py-3 text-slate-600">{record.receivedAt}</td>
                <td className="px-4 py-3">
                  <StatusPill
                    label={record.paymentStatus}
                    color={
                      record.paymentStatus === '수납완료'
                        ? 'text-emerald-700'
                        : record.paymentStatus === '반송'
                          ? 'text-rose-700'
                          : 'text-amber-700'
                    }
                    bg={
                      record.paymentStatus === '수납완료'
                        ? 'bg-emerald-50'
                        : record.paymentStatus === '반송'
                          ? 'bg-rose-50'
                          : 'bg-amber-50'
                    }
                  />
                </td>
                <td className="px-4 py-3">
                  <StatusPill {...CONTRACT_STATUS_CONFIG[record.contractStatus]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TransferSection() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h3 className="text-sm font-bold text-[#1e293b]">해촉자 계약 이관 처리</h3>
        <p className="mt-1 text-xs text-slate-500">해촉 설계사 계약의 후속 담당 배정을 추적합니다.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {['해촉 설계사', '고객명', '보험사', '상품명', '이관 대상자', '이관상태', '이관일'].map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {TRANSFERS.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-[#1e293b]">{record.formerOwner}</td>
                <td className="px-4 py-3 text-slate-600">{record.customer}</td>
                <td className="px-4 py-3 text-slate-600">{record.insurer}</td>
                <td className="px-4 py-3 text-slate-600">{record.product}</td>
                <td className="px-4 py-3 text-slate-600">{record.nextOwner}</td>
                <td className="px-4 py-3">
                  <StatusPill {...TRANSFER_STATUS_CONFIG[record.status]} />
                </td>
                <td className="px-4 py-3 text-slate-600">{record.transferredAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PrivacySection() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h3 className="text-sm font-bold text-[#1e293b]">개인정보 문서 징구 / 보관</h3>
        <p className="mt-1 text-xs text-slate-500">만료 임박과 미징구 문서를 우선 관리합니다.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {['고객명', '문서유형', '징구일', '보관상태', '만료일'].map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {PRIVACY_DOCS.map((record) => (
              <tr key={record.id} className={clsx('hover:bg-slate-50', record.status !== 'active' && 'bg-amber-50/30')}>
                <td className="px-4 py-3 font-medium text-[#1e293b]">{record.customer}</td>
                <td className="px-4 py-3 text-slate-600">{record.docType}</td>
                <td className="px-4 py-3 text-slate-600">{record.collectedAt}</td>
                <td className="px-4 py-3">
                  <StatusPill {...PRIVACY_STATUS_CONFIG[record.status]} />
                </td>
                <td className="px-4 py-3 text-slate-600">{record.expiresAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
