/**
 * Aftercare.tsx - 사후 관리 / 정산
 * Phase 7 Step S15: 사후관리, 수수료 정산, 고객 만족도 확인
 */
import React from 'react';
import {
  HeartHandshake,
  Calculator,
  Star,
  Phone,
  Clock,
  CheckCircle,
  Search,
  Filter,
} from 'lucide-react';
import clsx from 'clsx';

type AftercareStatus = 'scheduled' | 'in_progress' | 'completed';
type SatisfactionLevel = 'excellent' | 'good' | 'neutral' | 'poor';

interface AftercareRecord {
  id: string;
  requestId: string;
  customerName: string;
  paymentDate: string;
  paymentAmount: string;
  commissionRate: string;
  commissionAmount: string;
  commissionSettled: boolean;
  followUpDate: string;
  status: AftercareStatus;
  satisfaction: SatisfactionLevel | null;
  notes: string;
}

const MOCK_AFTERCARE: AftercareRecord[] = [
  {
    id: 'AC-001',
    requestId: 'R-2026-001',
    customerName: '김영수',
    paymentDate: '2026-03-23',
    paymentAmount: '2,890,000',
    commissionRate: '15%',
    commissionAmount: '433,500',
    commissionSettled: true,
    followUpDate: '2026-04-06',
    status: 'completed',
    satisfaction: 'excellent',
    notes: '매우 만족, 지인 소개 의향 있음',
  },
  {
    id: 'AC-002',
    requestId: 'R-2026-004',
    customerName: '정민수',
    paymentDate: '2026-03-20',
    paymentAmount: '5,600,000',
    commissionRate: '12%',
    commissionAmount: '672,000',
    commissionSettled: true,
    followUpDate: '2026-04-03',
    status: 'in_progress',
    satisfaction: 'good',
    notes: '추가 보험 상품 문의 예정',
  },
  {
    id: 'AC-003',
    requestId: 'R-2026-006',
    customerName: '한소희',
    paymentDate: '2026-03-25',
    paymentAmount: '12,300,000',
    commissionRate: '18%',
    commissionAmount: '2,214,000',
    commissionSettled: false,
    followUpDate: '2026-04-08',
    status: 'scheduled',
    satisfaction: null,
    notes: '',
  },
  {
    id: 'AC-004',
    requestId: 'R-2026-008',
    customerName: '오세훈',
    paymentDate: '2026-03-18',
    paymentAmount: '1,050,000',
    commissionRate: '15%',
    commissionAmount: '157,500',
    commissionSettled: true,
    followUpDate: '2026-04-01',
    status: 'completed',
    satisfaction: 'neutral',
    notes: '지급 지연에 대한 불만',
  },
];

const STATUS_CONFIG: Record<AftercareStatus, { label: string; color: string; bg: string }> = {
  scheduled: { label: '예정', color: 'text-blue-700', bg: 'bg-blue-50' },
  in_progress: { label: '진행 중', color: 'text-amber-700', bg: 'bg-amber-50' },
  completed: { label: '완료', color: 'text-emerald-700', bg: 'bg-emerald-50' },
};

const SATISFACTION_CONFIG: Record<SatisfactionLevel, { label: string; stars: number; color: string }> = {
  excellent: { label: '매우 만족', stars: 5, color: 'text-emerald-500' },
  good: { label: '만족', stars: 4, color: 'text-blue-500' },
  neutral: { label: '보통', stars: 3, color: 'text-amber-500' },
  poor: { label: '불만', stars: 2, color: 'text-red-500' },
};

export function Aftercare() {
  const [statusFilter, setStatusFilter] = React.useState<AftercareStatus | 'all'>('all');

  const filtered = MOCK_AFTERCARE.filter(
    (r) => statusFilter === 'all' || r.status === statusFilter
  );

  const totalCommission = MOCK_AFTERCARE.reduce(
    (sum, r) => sum + parseInt(r.commissionAmount.replace(/,/g, '')),
    0
  );
  const settledCommission = MOCK_AFTERCARE.filter((r) => r.commissionSettled).reduce(
    (sum, r) => sum + parseInt(r.commissionAmount.replace(/,/g, '')),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">사후 관리</h1>
        <p className="mt-1 text-sm text-gray-500">
          S15 · 사후관리, 수수료 정산, 고객 만족도 확인
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: '팔로업 예정',
            value: MOCK_AFTERCARE.filter((r) => r.status === 'scheduled').length,
            icon: Clock,
            color: 'text-blue-600',
          },
          {
            label: '정산 완료율',
            value: `${Math.round((settledCommission / totalCommission) * 100)}%`,
            icon: Calculator,
            color: 'text-emerald-600',
          },
          {
            label: '총 수수료',
            value: `₩${totalCommission.toLocaleString()}`,
            icon: HeartHandshake,
            color: 'text-gray-600',
          },
          {
            label: '평균 만족도',
            value: '4.0 / 5.0',
            icon: Star,
            color: 'text-amber-500',
          },
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

      {/* Filter */}
      <div className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white p-1 w-fit">
        <Filter className="ml-2 h-4 w-4 text-gray-400" />
        {(['all', 'scheduled', 'in_progress', 'completed'] as const).map((s) => (
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

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['요청번호', '고객명', '지급일', '지급금액', '수수료', '정산', '팔로업일', '상태', '만족도', '비고'].map(
                (h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((r) => {
              const cfg = STATUS_CONFIG[r.status];
              const satCfg = r.satisfaction ? SATISFACTION_CONFIG[r.satisfaction] : null;
              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    {r.requestId}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{r.customerName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{r.paymentDate}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">₩{r.paymentAmount}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    ₩{r.commissionAmount} ({r.commissionRate})
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {r.commissionSettled ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-500" />
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{r.followUpDate}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={clsx('rounded-full px-2 py-1 text-xs font-medium', cfg.bg, cfg.color)}>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {satCfg ? (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: satCfg.stars }).map((_, i) => (
                          <Star key={i} className={clsx('h-3 w-3 fill-current', satCfg.color)} />
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">{r.notes || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
