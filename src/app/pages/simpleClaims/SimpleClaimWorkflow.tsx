import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import { ArrowLeft, Download, FileText, Save } from 'lucide-react';
import { toast } from 'sonner';

type SimpleClaimStatus = '접수' | '처리중' | '보험사접수' | '지급대기' | '완료' | '반려';

interface SimpleClaimRecord {
  amount: number;
  bankName: string;
  claimDate: string;
  claimType: '본인' | '자녀' | '배우자' | '부모';
  hospital: string;
  id: string;
  insuranceCompany: string;
  insurerReceiptDate: string;
  insurerReceiptNumber: string;
  injurySummary: string;
  method: '직접' | '대행';
  partnerNote: string;
  patientName: string;
  phone: string;
  relation: '본인' | '자녀' | '배우자' | '부모';
  status: SimpleClaimStatus;
  visitType: '외래' | '입원';
  accountNumber: string;
  documents: string[];
}

const MOCK_SIMPLE_CLAIMS: SimpleClaimRecord[] = [
  {
    id: 'SC-001',
    claimDate: '2026-03-28 14:30',
    patientName: '김지우',
    hospital: '강남세브란스',
    claimType: '본인',
    method: '대행',
    status: '처리중',
    insuranceCompany: '삼성화재',
    phone: '010-1234-5678',
    relation: '본인',
    visitType: '외래',
    amount: 350000,
    injurySummary: '발목 염좌로 외래 치료 진행. 영수증과 처방전 확보 완료.',
    bankName: '국민은행',
    accountNumber: '123-456-789012',
    insurerReceiptNumber: 'SX-20260328-001',
    insurerReceiptDate: '2026-03-28',
    partnerNote: '추가 보완 서류 없이 바로 보험사 접수 예정',
    documents: ['진료비 영수증.pdf', '처방전.jpg', '통장사본.pdf'],
  },
  {
    id: 'SC-002',
    claimDate: '2026-03-27 10:15',
    patientName: '이민수(자녀)',
    hospital: '서울아산병원',
    claimType: '자녀',
    method: '직접',
    status: '보험사접수',
    insuranceCompany: 'DB손해보험',
    phone: '010-2345-6789',
    relation: '자녀',
    visitType: '입원',
    amount: 1200000,
    injurySummary: '장염 입원 치료. 입퇴원확인서와 진단서 접수됨.',
    bankName: '신한은행',
    accountNumber: '110-220-330044',
    insurerReceiptNumber: 'DB-20260327-118',
    insurerReceiptDate: '2026-03-27',
    partnerNote: '보험사 보완 요청 가능성 있어 입퇴원확인서 재점검 필요',
    documents: ['입퇴원확인서.pdf', '진단서.pdf', '가족관계증명서.pdf'],
  },
  {
    id: 'SC-003',
    claimDate: '2026-03-25 09:00',
    patientName: '박영희',
    hospital: '분당서울대병원',
    claimType: '본인',
    method: '대행',
    status: '완료',
    insuranceCompany: '한화생명',
    phone: '010-3456-7890',
    relation: '본인',
    visitType: '외래',
    amount: 180000,
    injurySummary: '두통 검사 후 외래 진료. 접수 후 지급 완료.',
    bankName: '하나은행',
    accountNumber: '998-877-665544',
    insurerReceiptNumber: 'HW-20260325-022',
    insurerReceiptDate: '2026-03-25',
    partnerNote: '지급 완료 후 고객 안내 종료',
    documents: ['영수증.pdf', '진료기록부.pdf'],
  },
  {
    id: 'SC-004',
    claimDate: '2026-03-24 16:45',
    patientName: '최아라',
    hospital: '세브란스',
    claimType: '배우자',
    method: '대행',
    status: '접수',
    insuranceCompany: '교보생명',
    phone: '010-4567-8901',
    relation: '배우자',
    visitType: '외래',
    amount: 520000,
    injurySummary: '손목 통증 및 물리치료 내역. 카드 영수증 보완 필요.',
    bankName: '우리은행',
    accountNumber: '203-445-550011',
    insurerReceiptNumber: '',
    insurerReceiptDate: '',
    partnerNote: '통원 확인서 추가 수령 예정',
    documents: ['진료비세부내역서.pdf', '배우자 위임장.pdf'],
  },
  {
    id: 'SC-005',
    claimDate: '2026-03-22 11:30',
    patientName: '윤서연',
    hospital: '고려대안암병원',
    claimType: '본인',
    method: '직접',
    status: '반려',
    insuranceCompany: '메리츠화재',
    phone: '010-5678-9012',
    relation: '본인',
    visitType: '입원',
    amount: 2800000,
    injurySummary: '수술 입원 건. 진단명 코드 불일치로 반려됨.',
    bankName: '농협은행',
    accountNumber: '777-888-999000',
    insurerReceiptNumber: 'MR-20260322-904',
    insurerReceiptDate: '2026-03-22',
    partnerNote: '진단서 재발급 후 재청구 검토',
    documents: ['진단서.pdf', '입원확인서.pdf', '통장사본.pdf'],
  },
];

const STATUS_FILTERS: Array<'all' | SimpleClaimStatus> = ['all', '접수', '처리중', '완료', '반려'];
const STATUS_OPTIONS: SimpleClaimStatus[] = ['접수', '처리중', '보험사접수', '지급대기', '완료', '반려'];

function getStatusBadgeClass(status: SimpleClaimStatus) {
  if (status === '완료') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === '반려') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (status === '보험사접수') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (status === '지급대기') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (status === '처리중') return 'border-violet-200 bg-violet-50 text-violet-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

export function SimpleClaimWorkflow() {
  const [claims, setClaims] = useState(MOCK_SIMPLE_CLAIMS);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | SimpleClaimStatus>('all');

  const selectedClaim = useMemo(
    () => claims.find((claim) => claim.id === selectedClaimId) || null,
    [claims, selectedClaimId]
  );

  const filteredClaims = useMemo(
    () => claims.filter((claim) => statusFilter === 'all' || claim.status === statusFilter),
    [claims, statusFilter]
  );

  const updateSelectedClaim = (field: keyof SimpleClaimRecord, value: string | number) => {
    if (!selectedClaim) return;

    setClaims((current) => current.map((claim) => (
      claim.id === selectedClaim.id ? { ...claim, [field]: value } : claim
    )));
  };

  const handleSave = () => {
    if (!selectedClaim) return;
    toast.success(`${selectedClaim.id} 청구 건이 저장되었습니다.`);
  };

  if (selectedClaim) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSelectedClaimId(null)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            목록으로
          </button>
          <span className={clsx('rounded-full border px-3 py-1 text-xs font-bold', getStatusBadgeClass(selectedClaim.status))}>
            {selectedClaim.status}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900">청구 정보</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <InfoField label="청구번호" value={selectedClaim.id} />
                <InfoField label="청구일시" value={selectedClaim.claimDate} />
                <InfoField label="청구유형" value={selectedClaim.claimType} />
                <InfoField label="청구방식" value={selectedClaim.method} />
                <InfoField label="현재상태" value={selectedClaim.status} />
                <InfoField label="청구금액" value={`${selectedClaim.amount.toLocaleString()}원`} />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900">대상자 정보</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <InfoField label="이름" value={selectedClaim.patientName} />
                <InfoField label="연락처" value={selectedClaim.phone} />
                <InfoField label="관계" value={selectedClaim.relation} />
                <InfoField label="보험사" value={selectedClaim.insuranceCompany} />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900">병원 정보</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <InfoField label="병원명" value={selectedClaim.hospital} />
                <InfoField label="내원 유형" value={selectedClaim.visitType} />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900">부상/질병 정보</h2>
              <textarea
                value={selectedClaim.injurySummary}
                onChange={(event) => updateSelectedClaim('injurySummary', event.target.value)}
                className="mt-4 min-h-[120px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400"
              />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900">계좌 정보</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <InfoField label="은행명" value={selectedClaim.bankName} />
                <InfoField label="계좌번호" value={selectedClaim.accountNumber} />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900">제출 서류</h2>
              <div className="mt-4 space-y-3">
                {selectedClaim.documents.map((document) => (
                  <div key={document} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <FileText size={16} />
                      {document}
                    </div>
                    <button type="button" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <Download size={14} />
                      다운로드
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900">보험 현황</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <InfoField label="계약 정보" value={`${selectedClaim.insuranceCompany} 실손 계약 유지`} />
                <InfoField label="실손 정보" value="실손 특약 확인 완료" />
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900">실무 처리</h2>
              <div className="mt-4 space-y-4">
                <FormField label="상태 변경">
                  <select
                    value={selectedClaim.status}
                    onChange={(event) => updateSelectedClaim('status', event.target.value as SimpleClaimStatus)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-400"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="보험사 배정">
                  <select
                    value={selectedClaim.insuranceCompany}
                    onChange={(event) => updateSelectedClaim('insuranceCompany', event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-400"
                  >
                    {['삼성화재', 'DB손해보험', '한화생명', '교보생명', '메리츠화재'].map((company) => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="보험사 접수번호">
                  <input
                    value={selectedClaim.insurerReceiptNumber}
                    onChange={(event) => updateSelectedClaim('insurerReceiptNumber', event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-400"
                  />
                </FormField>

                <FormField label="보험사 접수일">
                  <input
                    type="date"
                    value={selectedClaim.insurerReceiptDate}
                    onChange={(event) => updateSelectedClaim('insurerReceiptDate', event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-400"
                  />
                </FormField>

                <FormField label="보상파트너 메모">
                  <textarea
                    value={selectedClaim.partnerNote}
                    onChange={(event) => updateSelectedClaim('partnerNote', event.target.value)}
                    className="min-h-[140px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-400"
                  />
                </FormField>

                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Save size={16} />
                  저장
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">간편청구 워크플로우</h1>
        <p className="mt-1 text-sm text-slate-500">간편청구 건을 리스트와 상세 패널로 처리합니다.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setStatusFilter(filter)}
            className={clsx(
              'rounded-lg px-3 py-2 text-sm font-medium transition',
              statusFilter === filter ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            {filter === 'all' ? '전체' : filter}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
            <tr>
              {['청구번호', '청구일시', '대상자', '병원', '유형', '방식', '상태', '상세보기'].map((header) => (
                <th key={header} className="px-4 py-3">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredClaims.map((claim) => (
              <tr key={claim.id} className="hover:bg-slate-50">
                <td className="px-4 py-4 font-semibold text-slate-900">{claim.id}</td>
                <td className="px-4 py-4 text-slate-600">{claim.claimDate}</td>
                <td className="px-4 py-4 text-slate-700">{claim.patientName}</td>
                <td className="px-4 py-4 text-slate-700">{claim.hospital}</td>
                <td className="px-4 py-4 text-slate-700">{claim.claimType}</td>
                <td className="px-4 py-4 text-slate-700">{claim.method}</td>
                <td className="px-4 py-4">
                  <span className={clsx('rounded-full border px-2.5 py-1 text-xs font-semibold', getStatusBadgeClass(claim.status))}>
                    {claim.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <button
                    type="button"
                    onClick={() => setSelectedClaimId(claim.id)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    상세보기
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

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-bold text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="text-sm text-slate-700">{value}</div>
    </div>
  );
}
