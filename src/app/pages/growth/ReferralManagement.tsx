/**
 * ReferralManagement.tsx - 소개/Growth Loop
 * Phase 8 Steps S16-S17 + R1-R14: 소개 고객 관리, Same-owner 배정, Growth Loop
 */
import React from 'react';
import {
  Users,
  UserPlus,
  TrendingUp,
  Gift,
  ArrowRight,
  Filter,
  Link2,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Heart,
  DollarSign,
  RotateCcw,
  Share2,
  Repeat,
} from 'lucide-react';
import clsx from 'clsx';

type ReferralStatus = 'pending' | 'contacted' | 'converted' | 'declined';
type ReferralRelation = 'spouse' | 'sibling' | 'parent' | 'child' | 'colleague' | 'friend' | 'other';
type ReentrySource = '소개' | '직접' | '광고';
type ReentryAssignmentStatus = 'auto_assigned' | 'manual_required' | 'pending';

const RELATION_LABELS: Record<ReferralRelation, string> = {
  spouse: '배우자', sibling: '형제/자매', parent: '부모', child: '자녀',
  colleague: '직장동료', friend: '지인', other: '기타',
};

interface ReferralRecord {
  id: string;
  referrerName: string;
  referrerRequestId: string;
  referrerOwner: string;
  referredName: string;
  referredPhone: string;
  referralDate: string;
  relation: ReferralRelation;
  status: ReferralStatus;
  newRequestId: string | null;
  assignedOwner: string | null;
  sameOwnerApplied: boolean;
  rewardGiven: boolean;
  notes: string;
  currentStep: string;
}

interface ReentryRecord {
  id: string;
  customerName: string;
  previousJourneyId: string;
  previousCompletedAt: string;
  reentryDate: string;
  source: ReentrySource;
  currentStep: string;
  assignmentStatus: ReentryAssignmentStatus;
  assignedOwner: string;
  note: string;
}

const MOCK_REFERRALS: ReferralRecord[] = [
  {
    id: 'REF-001',
    referrerName: '김영수',
    referrerRequestId: 'R-2026-001',
    referrerOwner: '박영업',
    referredName: '김영희',
    referredPhone: '010-****-5678',
    referralDate: '2026-03-25',
    relation: 'sibling',
    status: 'converted',
    newRequestId: 'R-2026-015',
    assignedOwner: '박영업',
    sameOwnerApplied: true,
    rewardGiven: true,
    notes: '형제 관계, 동일 보험사',
    currentStep: 'R8',
  },
  {
    id: 'REF-002',
    referrerName: '정민수',
    referrerRequestId: 'R-2026-004',
    referrerOwner: '김영업',
    referredName: '정은지',
    referredPhone: '010-****-9012',
    referralDate: '2026-03-27',
    relation: 'spouse',
    status: 'contacted',
    newRequestId: null,
    assignedOwner: '김영업',
    sameOwnerApplied: true,
    rewardGiven: false,
    notes: '배우자, 다음 주 상담 예정',
    currentStep: 'R4',
  },
  {
    id: 'REF-003',
    referrerName: '한소희',
    referrerRequestId: 'R-2026-006',
    referrerOwner: '이영업',
    referredName: '한지민',
    referredPhone: '010-****-3456',
    referralDate: '2026-03-28',
    relation: 'colleague',
    status: 'pending',
    newRequestId: null,
    assignedOwner: null,
    sameOwnerApplied: false,
    rewardGiven: false,
    notes: '직장 동료',
    currentStep: 'R1',
  },
  {
    id: 'REF-004',
    referrerName: '김영수',
    referrerRequestId: 'R-2026-001',
    referrerOwner: '박영업',
    referredName: '이정훈',
    referredPhone: '010-****-7890',
    referralDate: '2026-03-29',
    relation: 'friend',
    status: 'declined',
    newRequestId: null,
    assignedOwner: '박영업',
    sameOwnerApplied: true,
    rewardGiven: false,
    notes: '관심 없음으로 종료',
    currentStep: '-',
  },
  {
    id: 'REF-005',
    referrerName: '오세훈',
    referrerRequestId: 'R-2026-008',
    referrerOwner: '최영업',
    referredName: '오민석',
    referredPhone: '010-****-2345',
    referralDate: '2026-03-30',
    relation: 'parent',
    status: 'pending',
    newRequestId: null,
    assignedOwner: null,
    sameOwnerApplied: false,
    rewardGiven: false,
    notes: '가족, 3년환급 문의',
    currentStep: 'R1',
  },
];

const STATUS_CONFIG: Record<ReferralStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '대기', color: 'text-gray-700', bg: 'bg-gray-100' },
  contacted: { label: '연락 완료', color: 'text-blue-700', bg: 'bg-blue-50' },
  converted: { label: '전환 완료', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  declined: { label: '거절', color: 'text-red-700', bg: 'bg-red-50' },
};

const REENTRY_STATUS_CONFIG: Record<
  ReentryAssignmentStatus,
  { label: string; color: string; bg: string }
> = {
  auto_assigned: { label: '자동배정완료', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  manual_required: { label: '수동배정필요', color: 'text-rose-700', bg: 'bg-rose-50' },
  pending: { label: '배정대기', color: 'text-amber-700', bg: 'bg-amber-50' },
};

const MOCK_REENTRIES: ReentryRecord[] = [
  {
    id: 'RE-001',
    customerName: '김영희',
    previousJourneyId: 'R-2026-015',
    previousCompletedAt: '2026-03-19',
    reentryDate: '2026-03-31',
    source: '소개',
    currentStep: 'S4',
    assignmentStatus: 'auto_assigned',
    assignedOwner: '박영업',
    note: '기존 담당자에게 자동 연결, 상담 슬롯 확보 완료',
  },
  {
    id: 'RE-002',
    customerName: '정은지',
    previousJourneyId: 'R-2025-402',
    previousCompletedAt: '2025-12-12',
    reentryDate: '2026-04-01',
    source: '광고',
    currentStep: 'S4',
    assignmentStatus: 'manual_required',
    assignedOwner: '-',
    note: '이전 담당자 퇴사로 수동 재배정 필요',
  },
  {
    id: 'RE-003',
    customerName: '오민석',
    previousJourneyId: 'R-2026-044',
    previousCompletedAt: '2026-02-27',
    reentryDate: '2026-04-01',
    source: '직접',
    currentStep: 'R14',
    assignmentStatus: 'pending',
    assignedOwner: '최영업',
    note: '재유입 확인 후 S4 자동배정 대기',
  },
];

export function ReferralManagement() {
  const [statusFilter, setStatusFilter] = React.useState<ReferralStatus | 'all'>('all');
  const [activeTab, setActiveTab] = React.useState<'referrals' | 'journey' | 'family' | 'reentry'>('referrals');

  const filtered = MOCK_REFERRALS.filter(
    (r) => statusFilter === 'all' || r.status === statusFilter
  );

  const stats = {
    total: MOCK_REFERRALS.length,
    converted: MOCK_REFERRALS.filter((r) => r.status === 'converted').length,
    conversionRate: Math.round(
      (MOCK_REFERRALS.filter((r) => r.status === 'converted').length / MOCK_REFERRALS.length) * 100
    ),
    rewardsGiven: MOCK_REFERRALS.filter((r) => r.rewardGiven).length,
    sameOwnerRate: Math.round(
      (MOCK_REFERRALS.filter((r) => r.sameOwnerApplied).length / MOCK_REFERRALS.length) * 100
    ),
    pendingAssignment: MOCK_REFERRALS.filter((r) => !r.assignedOwner && r.status !== 'declined').length,
    reentries: MOCK_REENTRIES.length,
    autoAssigned: MOCK_REENTRIES.filter((r) => r.assignmentStatus === 'auto_assigned').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">소개 / Growth Loop</h1>
        <p className="mt-1 text-sm text-gray-500">
          R1-R14 · 소개 여정, Same-owner 배정, 가족 연동, Growth Loop
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        {[
          { label: '총 소개', value: stats.total, icon: Users, color: 'text-gray-600' },
          { label: '전환 완료', value: stats.converted, icon: UserPlus, color: 'text-emerald-600' },
          { label: '전환율', value: `${stats.conversionRate}%`, icon: TrendingUp, color: 'text-blue-600' },
          { label: 'Same-owner율', value: `${stats.sameOwnerRate}%`, icon: UserCheck, color: 'text-purple-600' },
          { label: '재유입', value: stats.reentries, icon: Repeat, color: 'text-violet-600' },
          { label: 'S4 자동배정', value: stats.autoAssigned, icon: RotateCcw, color: 'text-amber-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="flex items-center gap-1.5">
              <stat.icon className={clsx('h-4 w-4', stat.color)} />
              <span className="text-xs text-gray-500">{stat.label}</span>
            </div>
            <p className="mt-1 text-xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {([
          { key: 'referrals' as const, label: '소개 관리', icon: Users },
          { key: 'journey' as const, label: 'R 여정 현황', icon: ArrowRight },
          { key: 'family' as const, label: '가족 연동', icon: Heart },
          { key: 'reentry' as const, label: '재유입', icon: Repeat },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab.key
                ? 'text-gray-900 border-gray-900'
                : 'text-gray-400 border-transparent hover:text-gray-600'
            )}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: 소개 관리 */}
      {activeTab === 'referrals' && (
        <>
          {/* Growth Loop Diagram */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Growth Loop 흐름</h2>
            <div className="flex items-center justify-center gap-4 text-sm">
              {['고객 환급 완료', '만족도 확인', '소개 요청', '신규 고객 유입', '상담 진행'].map(
                (step, i, arr) => (
                  <React.Fragment key={step}>
                    <div className="rounded-lg bg-gray-50 px-4 py-2 text-center font-medium text-gray-700 border border-gray-200">
                      {step}
                    </div>
                    {i < arr.length - 1 && <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                  </React.Fragment>
                )
              )}
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white p-1 w-fit">
            <Filter className="ml-2 h-4 w-4 text-gray-400" />
            {(['all', 'pending', 'contacted', 'converted', 'declined'] as const).map((s) => (
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
                  {['소개인', '피소개인', '관계', '소개일', 'Same-owner', '담당자', '상태', '현재 스텝', '리워드'].map(
                    (h) => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((r) => {
                  const cfg = STATUS_CONFIG[r.status];
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-3 py-3">
                        <div className="text-sm font-medium text-gray-900">{r.referrerName}</div>
                        <div className="text-[10px] text-gray-400">{r.referrerRequestId}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <div className="text-sm text-gray-700">{r.referredName}</div>
                        <div className="text-[10px] text-gray-400">{r.referredPhone}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <span className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">{RELATION_LABELS[r.relation]}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-500">{r.referralDate}</td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {r.sameOwnerApplied ? (
                          <span className="flex items-center gap-1 text-xs text-purple-600 font-medium">
                            <Link2 className="h-3 w-3" /> 적용됨
                          </span>
                        ) : r.status === 'declined' ? (
                          <span className="text-xs text-gray-400">-</span>
                        ) : (
                          <button className="text-xs text-blue-600 hover:underline font-medium">배정</button>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600">
                        {r.assignedOwner || <span className="text-rose-500 font-bold">미배정</span>}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <span className={clsx('rounded-full px-2 py-1 text-xs font-medium', cfg.bg, cfg.color)}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs font-medium text-gray-600">
                        {r.currentStep !== '-' ? r.currentStep : '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {r.rewardGiven ? (
                          <Gift className="h-4 w-4 text-amber-500" />
                        ) : r.status === 'converted' ? (
                          <button className="rounded bg-amber-500 px-2 py-1 text-xs text-white hover:bg-amber-600">
                            지급
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Tab: R 여정 현황 */}
      {activeTab === 'journey' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">R 여정 흐름 (S4 선별/TM 스킵)</h2>
            <div className="flex items-center justify-between text-xs">
              {['R1 유입', 'R2 조회', 'R3 신청', 'R4 사전분석', 'R5 미팅', 'R6~R10 청구', 'R11 지급', 'R12 사후', 'R13 소개생성', 'R14 재유입'].map(
                (step, i, arr) => (
                  <React.Fragment key={step}>
                    <div className={clsx(
                      'rounded-lg px-2 py-1.5 text-center font-medium border',
                      step.includes('R4') ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                    )}>
                      {step}
                      {step.includes('R4') && <div className="text-[9px] text-purple-500 mt-0.5">Same-owner</div>}
                    </div>
                    {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-gray-300 flex-shrink-0" />}
                  </React.Fragment>
                )
              )}
            </div>
            <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-gray-300 line-through" /> S4 선별/배정 스킵</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-gray-300 line-through" /> S5-S6 TM 스킵</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-purple-200" /> Same-owner 자동배정</span>
              <span className="flex items-center gap-1"><RotateCcw className="h-3 w-3 text-violet-400" /> R14 재유입 시 S4 자동배정</span>
            </div>
          </div>

          {/* R Journey Records */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {['피소개인', '소개인', '관계', '현재 스텝', '담당자(Same-owner)', '상태', '소개일'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {MOCK_REFERRALS.filter(r => r.status !== 'declined').map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-medium text-gray-900">{r.referredName}</td>
                    <td className="px-3 py-2.5 text-gray-500">{r.referrerName}</td>
                    <td className="px-3 py-2.5"><span className="bg-gray-100 px-1.5 py-0.5 rounded">{RELATION_LABELS[r.relation]}</span></td>
                    <td className="px-3 py-2.5">
                      <span className="font-bold text-blue-600">{r.currentStep}</span>
                      {r.currentStep === 'R4' && <span className="ml-1 text-[9px] text-purple-500 bg-purple-50 px-1 rounded">사전분석</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {r.assignedOwner ? (
                        <span className="flex items-center gap-1">
                          {r.assignedOwner}
                          {r.sameOwnerApplied && <Link2 className="h-3 w-3 text-purple-500" />}
                        </span>
                      ) : (
                        <span className="text-rose-500 font-bold">미배정</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={clsx('rounded-full px-2 py-0.5 font-medium', STATUS_CONFIG[r.status].bg, STATUS_CONFIG[r.status].color)}>
                        {STATUS_CONFIG[r.status].label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-400">{r.referralDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: 재유입 */}
      {activeTab === 'reentry' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">R14 재유입 → S4 자동배정</h2>
                <p className="mt-1 text-xs text-gray-500">
                  완료된 여정 고객이 다시 유입되면 이전 여정과 연결해 S4 선별/배정 단계로 바로 복귀시킵니다.
                </p>
              </div>
              <div className="rounded-lg bg-violet-50 px-3 py-2 text-xs font-medium text-violet-700">
                이전 여정 연결 + 기존 담당자 우선 배정
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
              {[
                { label: '재유입 고객', value: `${MOCK_REENTRIES.length}건`, tone: 'text-gray-900' },
                {
                  label: '자동배정완료',
                  value: `${MOCK_REENTRIES.filter((r) => r.assignmentStatus === 'auto_assigned').length}건`,
                  tone: 'text-emerald-600',
                },
                {
                  label: '수동배정필요',
                  value: `${MOCK_REENTRIES.filter((r) => r.assignmentStatus === 'manual_required').length}건`,
                  tone: 'text-rose-600',
                },
                { label: '이전 여정 연결률', value: '100%', tone: 'text-violet-600' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-xs text-gray-500">{item.label}</div>
                  <div className={clsx('mt-2 text-2xl font-bold', item.tone)}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">재유입 고객 추적</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {['고객명', '이전여정ID', '이전완료일', '재유입일', '재유입경로', '현재스텝', '배정상태', '담당자'].map((header) => (
                      <th key={header} className="px-3 py-2.5 text-left font-medium text-gray-500">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {MOCK_REENTRIES.map((reentry) => {
                    const cfg = REENTRY_STATUS_CONFIG[reentry.assignmentStatus];
                    return (
                      <tr key={reentry.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 font-medium text-gray-900">{reentry.customerName}</td>
                        <td className="px-3 py-2.5 text-gray-500">{reentry.previousJourneyId}</td>
                        <td className="px-3 py-2.5 text-gray-500">{reentry.previousCompletedAt}</td>
                        <td className="px-3 py-2.5 text-gray-500">{reentry.reentryDate}</td>
                        <td className="px-3 py-2.5">
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">{reentry.source}</span>
                        </td>
                        <td className="px-3 py-2.5 font-bold text-violet-600">{reentry.currentStep}</td>
                        <td className="px-3 py-2.5">
                          <span className={clsx('rounded-full px-2 py-1 font-medium', cfg.bg, cfg.color)}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-gray-600">{reentry.assignedOwner}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">S4 자동배정 액션</h3>
              <span className="text-[10px] text-gray-400">R14 재유입 패널 확장</span>
            </div>

            <div className="mt-4 space-y-3">
              {MOCK_REENTRIES.map((reentry) => {
                const cfg = REENTRY_STATUS_CONFIG[reentry.assignmentStatus];
                return (
                  <div key={`${reentry.id}-action`} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{reentry.customerName}</span>
                          <span className={clsx('rounded-full px-2 py-1 text-[10px] font-medium', cfg.bg, cfg.color)}>
                            {cfg.label}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          이전 여정 {reentry.previousJourneyId} 완료 후 {reentry.source} 경로로 재유입
                        </p>
                        <p className="mt-1 text-xs text-gray-600">{reentry.note}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {reentry.assignmentStatus === 'auto_assigned' && (
                          <button className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">
                            S4 자동배정 완료
                          </button>
                        )}
                        {reentry.assignmentStatus === 'manual_required' && (
                          <button className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700">
                            수동 검토 필요
                          </button>
                        )}
                        {reentry.assignmentStatus === 'pending' && (
                          <button className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-700">
                            S4 자동배정 실행
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: 가족 연동 */}
      {activeTab === 'family' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">가족 그룹 (소개 체인)</h2>
            <div className="space-y-4">
              {/* Family Group 1 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="h-4 w-4 text-rose-500" />
                  <span className="text-sm font-bold text-gray-800">김영수 가족</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">3명</span>
                </div>
                <div className="flex items-center gap-3">
                  {[
                    { name: '김영수', role: '원본 고객', step: 'S15', status: '완료' },
                    { name: '김영희', role: '형제 (소개)', step: 'R8', status: '진행중' },
                    { name: '이정훈', role: '지인 (소개)', step: '-', status: '거절' },
                  ].map((member, i, arr) => (
                    <React.Fragment key={member.name}>
                      <div className={clsx(
                        'flex-1 rounded-lg border p-3 text-center',
                        member.status === '완료' ? 'border-emerald-200 bg-emerald-50/50' :
                        member.status === '거절' ? 'border-gray-200 bg-gray-50 opacity-50' :
                        'border-blue-200 bg-blue-50/50'
                      )}>
                        <p className="text-xs font-bold text-gray-800">{member.name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{member.role}</p>
                        <p className="text-[10px] font-medium mt-1">{member.step !== '-' ? member.step : '종료'}</p>
                      </div>
                      {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-gray-300 flex-shrink-0" />}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Family Group 2 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="h-4 w-4 text-rose-500" />
                  <span className="text-sm font-bold text-gray-800">오세훈 가족</span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">2명</span>
                </div>
                <div className="flex items-center gap-3">
                  {[
                    { name: '오세훈', role: '원본 고객', step: 'S14', status: '진행중' },
                    { name: '오민석', role: '부모 (소개)', step: 'R1', status: '대기' },
                  ].map((member, i, arr) => (
                    <React.Fragment key={member.name}>
                      <div className={clsx(
                        'flex-1 rounded-lg border p-3 text-center',
                        member.status === '대기' ? 'border-gray-200 bg-gray-50' : 'border-blue-200 bg-blue-50/50'
                      )}>
                        <p className="text-xs font-bold text-gray-800">{member.name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{member.role}</p>
                        <p className="text-[10px] font-medium mt-1">{member.step}</p>
                      </div>
                      {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-gray-300 flex-shrink-0" />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Family KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500">가족 연동률</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">40%</p>
              <p className="text-[10px] text-gray-400 mt-1">2/5 소개건 가족관계</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500">CAC 절감 효과</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">₩45,000</p>
              <p className="text-[10px] text-gray-400 mt-1">소개 유입 vs 광고 유입 비교</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500">LTV 기여도</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">1.8x</p>
              <p className="text-[10px] text-gray-400 mt-1">소개 고객 평균 계약 가치</p>
            </div>
          </div>

          {/* R12/R13: 48시간 내 요청 완료율 추적 */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                R13. 48시간 내 요청 완료율
              </h3>
              <span className="text-[10px] text-gray-400">최근 30일 기준</span>
            </div>

            {/* 전체 완료율 */}
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" strokeWidth="3"
                    strokeDasharray="100" strokeDashoffset={100 - 72} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-amber-600">72%</span>
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">48h 내 완료</span>
                  <span className="font-bold text-emerald-600">18건</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">48h 초과</span>
                  <span className="font-bold text-rose-600">7건</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">진행 중 (기한 내)</span>
                  <span className="font-bold text-blue-600">3건</span>
                </div>
              </div>
            </div>

            {/* 개별 건 추적 */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-gray-500">최근 미완료 건</p>
              {[
                { referral: '정민수→정은지', elapsed: '12h', remaining: '36h', status: 'on_track' as const },
                { referral: '강지원→강미래', elapsed: '38h', remaining: '10h', status: 'warning' as const },
                { referral: '박서준→박채원', elapsed: '52h', remaining: '-4h', status: 'overdue' as const },
              ].map((item, i) => {
                const statusCfg = {
                  on_track: { label: '정상', bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-400' },
                  warning: { label: '주의', bg: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-400' },
                  overdue: { label: '초과', bg: 'bg-rose-50', text: 'text-rose-700', bar: 'bg-rose-400' },
                }[item.status];
                const pct = Math.min(100, (parseInt(item.elapsed) / 48) * 100);
                return (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-gray-100">
                    <span className="text-[10px] font-medium text-gray-700 w-28 truncate">{item.referral}</span>
                    <div className="flex-1">
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className={clsx('h-1.5 rounded-full', statusCfg.bar)} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-[9px] text-gray-500 w-8 text-right">{item.elapsed}</span>
                    <span className={clsx('px-1.5 py-0.5 rounded text-[9px] font-bold', statusCfg.bg, statusCfg.text)}>
                      {statusCfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* R12: 소개 수수료 정산 */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              R12. 소개 수수료 정산
            </h3>

            {/* 정산 요약 */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-emerald-50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-emerald-600">정산 완료</p>
                <p className="text-lg font-bold text-emerald-700">3건</p>
                <p className="text-[10px] text-emerald-500">₩450,000</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-amber-600">정산 대기</p>
                <p className="text-lg font-bold text-amber-700">2건</p>
                <p className="text-[10px] text-amber-500">₩280,000</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-blue-600">이번 달 총액</p>
                <p className="text-lg font-bold text-blue-700">₩730K</p>
                <p className="text-[10px] text-blue-500">5건 합산</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-gray-500">평균 건당 수수료</p>
                <p className="text-lg font-bold text-gray-700">₩146K</p>
                <p className="text-[10px] text-gray-400">전월 대비 +12%</p>
              </div>
            </div>

            {/* 정산 내역 */}
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">소개인</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">피소개인</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">계약 보험료</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">수수료(10%)</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-500">정산 상태</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-500">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { referrer: '김영수', referred: '김영희', premium: '1,800,000', commission: '180,000', status: 'completed' as const, paidAt: '2026-03-28' },
                    { referrer: '김영수', referred: '이정훈', premium: '1,200,000', commission: '120,000', status: 'completed' as const, paidAt: '2026-03-25' },
                    { referrer: '오세훈', referred: '오민석', premium: '1,500,000', commission: '150,000', status: 'completed' as const, paidAt: '2026-03-20' },
                    { referrer: '정민수', referred: '정은지', premium: '1,600,000', commission: '160,000', status: 'pending' as const, paidAt: null },
                    { referrer: '한소희', referred: '한지민', premium: '1,200,000', commission: '120,000', status: 'pending' as const, paidAt: null },
                  ].map((row, i) => {
                    const stCfg = row.status === 'completed'
                      ? { label: '완료', bg: 'bg-emerald-50', text: 'text-emerald-700' }
                      : { label: '대기', bg: 'bg-amber-50', text: 'text-amber-700' };
                    return (
                      <tr key={i}>
                        <td className="px-3 py-2 font-medium text-gray-700">{row.referrer}</td>
                        <td className="px-3 py-2 text-gray-600">{row.referred}</td>
                        <td className="px-3 py-2 text-right text-gray-600">₩{row.premium}</td>
                        <td className="px-3 py-2 text-right font-bold text-gray-900">₩{row.commission}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-bold', stCfg.bg, stCfg.text)}>
                            {stCfg.label}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {row.status === 'pending' ? (
                            <button className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700">
                              정산 처리
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-400">{row.paidAt}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* R13: 2차 소개 추적 */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Share2 className="h-4 w-4 text-violet-500" />
              R13. 2차 소개 추적 (피추천인 → 재소개)
            </h3>

            <p className="text-[10px] text-gray-500">
              전환 완료된 피추천인이 다시 새로운 고객을 소개한 건을 추적합니다.
            </p>

            {/* 2차 소개 체인 시각화 */}
            <div className="space-y-3">
              {[
                {
                  chain: [
                    { name: '김영수', role: '원 소개인', step: 'S15', status: 'completed' },
                    { name: '김영희', role: '1차 피소개인', step: 'R8', status: 'in_progress' },
                    { name: '김서윤', role: '2차 피소개인', step: 'R1', status: 'pending' },
                  ],
                  date: '2026-03-30',
                  depth: 2,
                },
                {
                  chain: [
                    { name: '오세훈', role: '원 소개인', step: 'S14', status: 'in_progress' },
                    { name: '오민석', role: '1차 피소개인', step: 'R4', status: 'in_progress' },
                  ],
                  date: '2026-03-29',
                  depth: 1,
                  potential: true,
                },
              ].map((item, i) => (
                <div key={i} className="rounded-lg border border-violet-200 bg-violet-50/30 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-violet-700">
                      {item.depth}차 소개 체인
                    </span>
                    <span className="text-[10px] text-gray-400">{item.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.chain.map((person, j, arr) => {
                      const statusColor = person.status === 'completed' ? 'border-emerald-300 bg-emerald-50'
                        : person.status === 'in_progress' ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-300 bg-gray-50';
                      return (
                        <React.Fragment key={person.name}>
                          <div className={clsx('flex-1 rounded-lg border p-2 text-center', statusColor)}>
                            <p className="text-xs font-bold text-gray-800">{person.name}</p>
                            <p className="text-[9px] text-gray-500">{person.role}</p>
                            <p className="text-[9px] font-medium text-gray-600 mt-0.5">{person.step}</p>
                          </div>
                          {j < arr.length - 1 && <ArrowRight className="h-3 w-3 text-violet-400 flex-shrink-0" />}
                        </React.Fragment>
                      );
                    })}
                    {item.potential && (
                      <>
                        <ArrowRight className="h-3 w-3 text-gray-300 flex-shrink-0" />
                        <div className="flex-1 rounded-lg border-2 border-dashed border-violet-300 p-2 text-center">
                          <p className="text-[10px] text-violet-500 font-medium">2차 소개 가능</p>
                          <button className="mt-1 px-2 py-0.5 text-[9px] font-bold bg-violet-600 text-white rounded hover:bg-violet-700">
                            소개 요청
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 2차 소개 KPI */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-gray-200 p-3 text-center">
                <p className="text-[10px] text-gray-500">2차 소개 생성률</p>
                <p className="text-lg font-bold text-violet-600">20%</p>
                <p className="text-[10px] text-gray-400">1/5 전환자 재소개</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 text-center">
                <p className="text-[10px] text-gray-500">최대 소개 깊이</p>
                <p className="text-lg font-bold text-violet-600">2차</p>
                <p className="text-[10px] text-gray-400">김영수 체인</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 text-center">
                <p className="text-[10px] text-gray-500">소개 네트워크 크기</p>
                <p className="text-lg font-bold text-gray-700">12명</p>
                <p className="text-[10px] text-gray-400">5개 체인</p>
              </div>
            </div>
          </div>

          {/* R14: 재유입 → R1 루프 연결 */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Repeat className="h-4 w-4 text-teal-500" />
              R14. 재유입 → R1 루프 연결
            </h3>

            {/* 루프 시각화 */}
            <div className="rounded-lg bg-teal-50/50 border border-teal-200 p-4">
              <div className="flex items-center justify-center gap-3 text-xs flex-wrap">
                {[
                  { label: 'R11 지급완료', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
                  { label: 'R12 사후관리', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                  { label: 'R13 소개생성', color: 'bg-violet-100 text-violet-700 border-violet-200' },
                  { label: 'R14 재유입', color: 'bg-teal-100 text-teal-700 border-teal-200' },
                  { label: 'R1 소개유입', color: 'bg-amber-100 text-amber-700 border-amber-200' },
                ].map((step, i, arr) => (
                  <React.Fragment key={step.label}>
                    <div className={clsx('rounded-lg px-3 py-2 font-medium border', step.color)}>
                      {step.label}
                    </div>
                    {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-teal-400 flex-shrink-0" />}
                  </React.Fragment>
                ))}
                <RotateCcw className="h-4 w-4 text-teal-500 ml-1" />
              </div>
              <p className="text-[10px] text-teal-600 text-center mt-2 font-medium">
                Growth Loop: 지급 완료 → 사후관리 → 소개 생성 → 재유입 → 새로운 소개 여정 시작
              </p>
            </div>

            {/* 재유입 현황 */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600">재유입 대상 고객</p>
              {[
                { name: '김영희', originalRef: '김영수', completedAt: '2026-03-15', reentryStatus: 'reentered' as const, newJourneyId: 'R-2026-020', daysToReentry: 10 },
                { name: '정은지', originalRef: '정민수', completedAt: '2026-03-20', reentryStatus: 'eligible' as const, newJourneyId: null, daysToReentry: null },
                { name: '한지민', originalRef: '한소희', completedAt: '2026-03-28', reentryStatus: 'too_early' as const, newJourneyId: null, daysToReentry: null },
              ].map((customer, i) => {
                const statusMap = {
                  reentered: { label: '재유입 완료', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle },
                  eligible: { label: '재유입 가능', bg: 'bg-blue-50', text: 'text-blue-700', icon: ArrowRight },
                  too_early: { label: '대기 (30일 미만)', bg: 'bg-gray-100', text: 'text-gray-600', icon: Clock },
                }[customer.reentryStatus];
                const StatusIcon = statusMap.icon;
                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-xs font-bold text-gray-700">{customer.name}</p>
                        <p className="text-[10px] text-gray-500">소개인: {customer.originalRef} · 완료: {customer.completedAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={clsx('px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1', statusMap.bg, statusMap.text)}>
                        <StatusIcon className="h-3 w-3" /> {statusMap.label}
                      </span>
                      {customer.reentryStatus === 'eligible' && (
                        <button className="px-2 py-1 text-[10px] font-bold bg-teal-600 text-white rounded hover:bg-teal-700 flex items-center gap-1">
                          <RotateCcw className="h-3 w-3" /> R1 전환
                        </button>
                      )}
                      {customer.reentryStatus === 'reentered' && customer.newJourneyId && (
                        <span className="text-[10px] text-emerald-600 font-medium">{customer.newJourneyId} (D+{customer.daysToReentry})</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 재유입 KPI */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-gray-200 p-3 text-center">
                <p className="text-[10px] text-gray-500">재유입률</p>
                <p className="text-lg font-bold text-teal-600">33%</p>
                <p className="text-[10px] text-gray-400">1/3 완료 고객 재유입</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 text-center">
                <p className="text-[10px] text-gray-500">평균 재유입 소요일</p>
                <p className="text-lg font-bold text-teal-600">10일</p>
                <p className="text-[10px] text-gray-400">지급 완료 후</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 text-center">
                <p className="text-[10px] text-gray-500">루프 완성률</p>
                <p className="text-lg font-bold text-teal-600">20%</p>
                <p className="text-[10px] text-gray-400">R14→R1 전환 성공</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
