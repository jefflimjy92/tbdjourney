/**
 * VocManagement.tsx - CS / VOC 관리
 * 고객의 소리(VOC) 접수, 처리, 분석
 */
import React from 'react';
import {
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Search,
  Filter,
  BarChart3,
} from 'lucide-react';
import clsx from 'clsx';

type VocCategory = 'complaint' | 'inquiry' | 'suggestion' | 'compliment';
type VocPriority = 'high' | 'medium' | 'low';
type VocStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

interface VocRecord {
  id: string;
  requestId: string | null;
  customerName: string;
  category: VocCategory;
  priority: VocPriority;
  subject: string;
  receivedDate: string;
  assignee: string;
  status: VocStatus;
  resolvedDate: string | null;
  resolutionDays: number | null;
}

const MOCK_VOCS: VocRecord[] = [
  {
    id: 'VOC-001',
    requestId: 'R-2026-003',
    customerName: '이미영',
    category: 'complaint',
    priority: 'high',
    subject: '지급 지연 관련 불만',
    receivedDate: '2026-03-25',
    assignee: 'CS팀 박지현',
    status: 'in_progress',
    resolvedDate: null,
    resolutionDays: null,
  },
  {
    id: 'VOC-002',
    requestId: 'R-2026-001',
    customerName: '김영수',
    category: 'inquiry',
    priority: 'medium',
    subject: '추가 청구 가능 여부 문의',
    receivedDate: '2026-03-26',
    assignee: 'CS팀 김현우',
    status: 'resolved',
    resolvedDate: '2026-03-27',
    resolutionDays: 1,
  },
  {
    id: 'VOC-003',
    requestId: null,
    customerName: '신예은',
    category: 'suggestion',
    priority: 'low',
    subject: '앱 UX 개선 제안',
    receivedDate: '2026-03-27',
    assignee: 'CS팀 박지현',
    status: 'open',
    resolvedDate: null,
    resolutionDays: null,
  },
  {
    id: 'VOC-004',
    requestId: 'R-2026-004',
    customerName: '정민수',
    category: 'compliment',
    priority: 'low',
    subject: '친절한 상담 감사 인사',
    receivedDate: '2026-03-28',
    assignee: 'CS팀 김현우',
    status: 'closed',
    resolvedDate: '2026-03-28',
    resolutionDays: 0,
  },
  {
    id: 'VOC-005',
    requestId: 'R-2026-005',
    customerName: '박진호',
    category: 'complaint',
    priority: 'high',
    subject: '보험금 차감 사유 설명 요청',
    receivedDate: '2026-03-29',
    assignee: 'CS팀 박지현',
    status: 'open',
    resolvedDate: null,
    resolutionDays: null,
  },
];

const CATEGORY_CONFIG: Record<VocCategory, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  complaint: { label: '불만', color: 'text-red-700', bg: 'bg-red-50', icon: ThumbsDown },
  inquiry: { label: '문의', color: 'text-blue-700', bg: 'bg-blue-50', icon: MessageSquare },
  suggestion: { label: '제안', color: 'text-purple-700', bg: 'bg-purple-50', icon: BarChart3 },
  compliment: { label: '칭찬', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: ThumbsUp },
};

const STATUS_CONFIG: Record<VocStatus, { label: string; color: string; bg: string }> = {
  open: { label: '접수', color: 'text-red-700', bg: 'bg-red-50' },
  in_progress: { label: '처리 중', color: 'text-amber-700', bg: 'bg-amber-50' },
  resolved: { label: '해결', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  closed: { label: '종결', color: 'text-gray-700', bg: 'bg-gray-100' },
};

const PRIORITY_CONFIG: Record<VocPriority, { label: string; color: string }> = {
  high: { label: '긴급', color: 'text-red-600' },
  medium: { label: '보통', color: 'text-amber-600' },
  low: { label: '낮음', color: 'text-gray-500' },
};

export function VocManagement() {
  const [statusFilter, setStatusFilter] = React.useState<VocStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  const filtered = MOCK_VOCS.filter((v) => {
    if (statusFilter !== 'all' && v.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        v.customerName.includes(q) ||
        v.subject.includes(q) ||
        (v.requestId?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  const stats = {
    total: MOCK_VOCS.length,
    open: MOCK_VOCS.filter((v) => v.status === 'open' || v.status === 'in_progress').length,
    resolved: MOCK_VOCS.filter((v) => v.status === 'resolved' || v.status === 'closed').length,
    avgDays:
      MOCK_VOCS.filter((v) => v.resolutionDays != null).reduce(
        (sum, v) => sum + (v.resolutionDays ?? 0),
        0
      ) / (MOCK_VOCS.filter((v) => v.resolutionDays != null).length || 1),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">CS / VOC 관리</h1>
        <p className="mt-1 text-sm text-gray-500">
          고객의 소리 접수, 처리 현황, 분석
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '전체 VOC', value: stats.total, icon: MessageSquare, color: 'text-gray-600' },
          { label: '미처리', value: stats.open, icon: AlertCircle, color: 'text-red-600' },
          { label: '처리 완료', value: stats.resolved, icon: CheckCircle, color: 'text-emerald-600' },
          { label: '평균 처리일', value: `${stats.avgDays.toFixed(1)}일`, icon: Clock, color: 'text-blue-600' },
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
            placeholder="고객명, 제목, 요청번호 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-gray-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white p-1">
          <Filter className="ml-2 h-4 w-4 text-gray-400" />
          {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((s) => (
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
              {['ID', '고객명', '요청번호', '분류', '우선순위', '제목', '접수일', '담당자', '상태', '처리일수'].map(
                (h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((v) => {
              const catCfg = CATEGORY_CONFIG[v.category];
              const CatIcon = catCfg.icon;
              const stCfg = STATUS_CONFIG[v.status];
              const priCfg = PRIORITY_CONFIG[v.priority];
              return (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{v.id}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{v.customerName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{v.requestId || '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium', catCfg.bg, catCfg.color)}>
                      <CatIcon className="h-3 w-3" />
                      {catCfg.label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={clsx('text-xs font-medium', priCfg.color)}>{priCfg.label}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">{v.subject}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{v.receivedDate}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{v.assignee}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={clsx('rounded-full px-2 py-1 text-xs font-medium', stCfg.bg, stCfg.color)}>
                      {stCfg.label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {v.resolutionDays != null ? `${v.resolutionDays}일` : '-'}
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
