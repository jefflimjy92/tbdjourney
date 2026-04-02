/**
 * PaymentConfirm.tsx - 지급 확인
 * Phase 7 Step S14: 보험금 지급 확인, 고객 안내
 */
import React from 'react';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Search,
  Filter,
  Download,
} from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';

// --- Mock Data ---
const PAYMENT_STATS = {
  total: 156,
  confirmed: 132,
  pending: 18,
  delayed: 6,
  totalAmount: '2,847,350,000',
};

type PaymentStatus = 'confirmed' | 'pending' | 'delayed';

interface PaymentRecord {
  id: string;
  requestId: string;
  customerName: string;
  insuranceCompany: string;
  claimType: string;
  claimAmount: string;
  paymentAmount: string;
  submittedDate: string;
  expectedDate: string;
  confirmedDate: string | null;
  status: PaymentStatus;
  notifiedCustomer: boolean;
}

const MOCK_PAYMENTS: PaymentRecord[] = [
  {
    id: 'PAY-001',
    requestId: 'R-2026-001',
    customerName: '김영수',
    insuranceCompany: '삼성화재',
    claimType: '실손보험',
    claimAmount: '3,250,000',
    paymentAmount: '2,890,000',
    submittedDate: '2026-03-15',
    expectedDate: '2026-03-25',
    confirmedDate: '2026-03-23',
    status: 'confirmed',
    notifiedCustomer: true,
  },
  {
    id: 'PAY-002',
    requestId: 'R-2026-003',
    customerName: '이미영',
    insuranceCompany: 'DB손해보험',
    claimType: '암보험',
    claimAmount: '15,000,000',
    paymentAmount: '15,000,000',
    submittedDate: '2026-03-18',
    expectedDate: '2026-03-28',
    confirmedDate: null,
    status: 'pending',
    notifiedCustomer: false,
  },
  {
    id: 'PAY-003',
    requestId: 'R-2026-005',
    customerName: '박진호',
    insuranceCompany: '한화손해보험',
    claimType: '상해보험',
    claimAmount: '8,500,000',
    paymentAmount: '7,200,000',
    submittedDate: '2026-03-10',
    expectedDate: '2026-03-20',
    confirmedDate: null,
    status: 'delayed',
    notifiedCustomer: false,
  },
  {
    id: 'PAY-004',
    requestId: 'R-2026-007',
    customerName: '최수진',
    insuranceCompany: '현대해상',
    claimType: '실손보험',
    claimAmount: '1,200,000',
    paymentAmount: '1,050,000',
    submittedDate: '2026-03-20',
    expectedDate: '2026-03-30',
    confirmedDate: '2026-03-28',
    status: 'confirmed',
    notifiedCustomer: true,
  },
  {
    id: 'PAY-005',
    requestId: 'R-2026-009',
    customerName: '정하늘',
    insuranceCompany: 'KB손해보험',
    claimType: '3년환급',
    claimAmount: '45,000,000',
    paymentAmount: '42,500,000',
    submittedDate: '2026-03-22',
    expectedDate: '2026-04-01',
    confirmedDate: null,
    status: 'pending',
    notifiedCustomer: false,
  },
  {
    id: 'PAY-006',
    requestId: 'R-2026-011',
    customerName: '이준서',
    insuranceCompany: '메리츠화재',
    claimType: '상해보험',
    claimAmount: '5,600,000',
    paymentAmount: '5,100,000',
    submittedDate: '2026-03-25',
    expectedDate: '2026-04-04',
    confirmedDate: '2026-04-02',
    status: 'confirmed',
    notifiedCustomer: true,
  },
  {
    id: 'PAY-007',
    requestId: 'R-2026-013',
    customerName: '강미선',
    insuranceCompany: '삼성화재',
    claimType: '실손보험',
    claimAmount: '2,100,000',
    paymentAmount: '1,870,000',
    submittedDate: '2026-03-12',
    expectedDate: '2026-03-22',
    confirmedDate: null,
    status: 'delayed',
    notifiedCustomer: false,
  },
  {
    id: 'PAY-008',
    requestId: 'R-2026-015',
    customerName: '김영희',
    insuranceCompany: '현대해상',
    claimType: '암보험',
    claimAmount: '20,000,000',
    paymentAmount: '20,000,000',
    submittedDate: '2026-03-28',
    expectedDate: '2026-04-07',
    confirmedDate: null,
    status: 'pending',
    notifiedCustomer: false,
  },
  {
    id: 'PAY-009',
    requestId: 'R-2026-017',
    customerName: '윤도형',
    insuranceCompany: 'DB손해보험',
    claimType: '3년환급',
    claimAmount: '32,000,000',
    paymentAmount: '29,800,000',
    submittedDate: '2026-03-05',
    expectedDate: '2026-03-15',
    confirmedDate: '2026-03-13',
    status: 'confirmed',
    notifiedCustomer: true,
  },
  {
    id: 'PAY-010',
    requestId: 'R-2026-019',
    customerName: '홍선미',
    insuranceCompany: 'NH농협생명',
    claimType: '종신보험 해약환급',
    claimAmount: '8,900,000',
    paymentAmount: '8,200,000',
    submittedDate: '2026-03-30',
    expectedDate: '2026-04-09',
    confirmedDate: null,
    status: 'pending',
    notifiedCustomer: false,
  },
  {
    id: 'PAY-011',
    requestId: 'R-2026-021',
    customerName: '조재원',
    insuranceCompany: '교보생명',
    claimType: '실손보험',
    claimAmount: '680,000',
    paymentAmount: '612,000',
    submittedDate: '2026-03-18',
    expectedDate: '2026-03-28',
    confirmedDate: '2026-03-27',
    status: 'confirmed',
    notifiedCustomer: true,
  },
  {
    id: 'PAY-012',
    requestId: 'R-2026-023',
    customerName: '배수아',
    insuranceCompany: 'KB손해보험',
    claimType: '상해보험',
    claimAmount: '4,200,000',
    paymentAmount: '3,780,000',
    submittedDate: '2026-03-08',
    expectedDate: '2026-03-18',
    confirmedDate: null,
    status: 'delayed',
    notifiedCustomer: false,
  },
];

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  confirmed: { label: '지급 확인', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle },
  pending: { label: '지급 대기', color: 'text-amber-700', bg: 'bg-amber-50', icon: Clock },
  delayed: { label: '지급 지연', color: 'text-red-700', bg: 'bg-red-50', icon: AlertTriangle },
};

export function PaymentConfirm() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<PaymentStatus | 'all'>('all');

  const filtered = MOCK_PAYMENTS.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.customerName.includes(q) ||
        p.requestId.toLowerCase().includes(q) ||
        p.insuranceCompany.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">지급 확인</h1>
          <p className="mt-1 text-sm text-gray-500">
            S14 · 보험금 지급 상태 확인 및 고객 안내
          </p>
        </div>
        <button
          type="button"
          onClick={() => toast('엑셀 다운로드는 준비 중입니다')}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          엑셀 다운로드
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '전체 건수', value: PAYMENT_STATS.total, icon: DollarSign, color: 'text-gray-600' },
          { label: '지급 확인', value: PAYMENT_STATS.confirmed, icon: CheckCircle, color: 'text-emerald-600' },
          { label: '지급 대기', value: PAYMENT_STATS.pending, icon: Clock, color: 'text-amber-600' },
          { label: '지급 지연', value: PAYMENT_STATS.delayed, icon: AlertTriangle, color: 'text-red-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <stat.icon className={clsx('h-5 w-5', stat.color)} />
              <span className="text-sm text-gray-500">{stat.label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="고객명, 요청번호, 보험사 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-gray-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white p-1">
          <Filter className="ml-2 h-4 w-4 text-gray-400" />
          {(['all', 'confirmed', 'pending', 'delayed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={clsx(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                statusFilter === s
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {s === 'all' ? '전체' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['요청번호', '고객명', '보험사', '청구유형', '청구금액', '지급금액', '제출일', '지급예정일', '상태', '고객안내'].map(
                (h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((p) => {
              const cfg = STATUS_CONFIG[p.status];
              const Icon = cfg.icon;
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    {p.requestId}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{p.customerName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{p.insuranceCompany}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{p.claimType}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">₩{p.claimAmount}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">₩{p.paymentAmount}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{p.submittedDate}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{p.expectedDate}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium', cfg.bg, cfg.color)}>
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {p.notifiedCustomer ? (
                      <span className="text-xs text-emerald-600">안내 완료</span>
                    ) : (
                      <button className="rounded bg-gray-900 px-2 py-1 text-xs text-white hover:bg-gray-700">
                        안내하기
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
