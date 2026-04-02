import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight, CheckSquare, Square } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface UnassignedCase {
  id: string;
  customer: string;
  region: string;
  type: '미팅인계' | '소개';
  dbCategory: '일반DB' | '소개DB';
  memo: string;
  handoffTime: string;
  preferredDate: string; // e.g., '2026-04-03'
}

interface StaffSchedule {
  [date: string]: number; // meetings already scheduled on that date
}

interface SalesStaff {
  id: string;
  name: string;
  team: string; // '1팀' | '2팀' | '3팀'
  region: string;
  activeCount: number;
  confirmedCount: number;
  schedule: StaffSchedule;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_UNASSIGNED_CASES: UnassignedCase[] = [
  { id: 'REQ-001', customer: '홍길동', region: '서울 강남구', type: '미팅인계', dbCategory: '일반DB', memo: '목요일 오후 선호, 배우자 동석 가능성 있음', handoffTime: '2026-04-01 14:30', preferredDate: '2026-04-03' },
  { id: 'REQ-002', customer: '김철수', region: '서울 강남구', type: '소개', dbCategory: '소개DB', memo: '소개자와 동일 지역 담당자 우선 연결 요청', handoffTime: '2026-04-01 15:10', preferredDate: '2026-04-03' },
  { id: 'REQ-003', customer: '이영희', region: '서울 강남구', type: '미팅인계', dbCategory: '일반DB', memo: '2회 부재 이후 콜백 예정, 오전 선호', handoffTime: '2026-04-01 16:45', preferredDate: '2026-04-04' },
  { id: 'REQ-004', customer: '박수진', region: '서울 마포구', type: '미팅인계', dbCategory: '일반DB', memo: '주말 미팅 가능, 강북 지역 선호', handoffTime: '2026-04-01 17:00', preferredDate: '2026-04-05' },
  { id: 'REQ-005', customer: '최민수', region: '서울 마포구', type: '소개', dbCategory: '소개DB', memo: '지인 소개 건, 신속 처리 요청', handoffTime: '2026-04-01 17:20', preferredDate: '2026-04-03' },
  { id: 'REQ-006', customer: '윤서하', region: '경기 평택시', type: '미팅인계', dbCategory: '일반DB', memo: '평일 오전만 가능, 방문 상담 희망', handoffTime: '2026-04-01 18:00', preferredDate: '2026-04-04' },
  { id: 'REQ-007', customer: '정민준', region: '경기 수원시', type: '미팅인계', dbCategory: '일반DB', memo: '온라인 미팅 선호, 화상 연결 필요', handoffTime: '2026-04-01 18:30', preferredDate: '2026-04-03' },
  { id: 'REQ-008', customer: '강지연', region: '경기 수원시', type: '소개', dbCategory: '소개DB', memo: '가족 대상 단체 상품 문의', handoffTime: '2026-04-01 19:00', preferredDate: '2026-04-05' },
  { id: 'REQ-009', customer: '임태호', region: '서울 송파구', type: '미팅인계', dbCategory: '일반DB', memo: '고가 상품 관심, VIP 응대 요청', handoffTime: '2026-04-02 09:10', preferredDate: '2026-04-04' },
  { id: 'REQ-010', customer: '오나리', region: '서울 송파구', type: '소개', dbCategory: '소개DB', memo: '소개자 만족도 높음, 빠른 배정 요청', handoffTime: '2026-04-02 09:40', preferredDate: '2026-04-03' },
  { id: 'REQ-011', customer: '신동현', region: '충남 천안시', type: '미팅인계', dbCategory: '일반DB', memo: '천안 KTX 인근 미팅 가능', handoffTime: '2026-04-02 10:00', preferredDate: '2026-04-04' },
  { id: 'REQ-012', customer: '배소라', region: '충남 천안시', type: '소개', dbCategory: '소개DB', memo: '충청 권역 담당자 배정 요청', handoffTime: '2026-04-02 10:20', preferredDate: '2026-04-05' },
  { id: 'REQ-013', customer: '조민혁', region: '충남 천안시', type: '미팅인계', dbCategory: '일반DB', memo: '오후 2시 이후만 가능', handoffTime: '2026-04-02 10:45', preferredDate: '2026-04-03' },
  { id: 'REQ-014', customer: '한지수', region: '경북 포항시', type: '미팅인계', dbCategory: '일반DB', memo: '포항 현지 방문 상담 희망', handoffTime: '2026-04-02 11:00', preferredDate: '2026-04-04' },
  { id: 'REQ-015', customer: '류성훈', region: '경북 포항시', type: '소개', dbCategory: '소개DB', memo: '지인 추천, 연락처 확인 완료', handoffTime: '2026-04-02 11:20', preferredDate: '2026-04-05' },
  { id: 'REQ-016', customer: '노지영', region: '전남 여수시', type: '미팅인계', dbCategory: '일반DB', memo: '여수 현지 담당자 선호, 주말 가능', handoffTime: '2026-04-02 11:40', preferredDate: '2026-04-05' },
  { id: 'REQ-017', customer: '안성빈', region: '강원 원주시', type: '미팅인계', dbCategory: '일반DB', memo: '원주 혁신도시 인근 미팅 선호', handoffTime: '2026-04-02 12:00', preferredDate: '2026-04-04' },
  { id: 'REQ-018', customer: '황미연', region: '강원 원주시', type: '소개', dbCategory: '소개DB', memo: '강원 지역 소개 건, 방문 요청', handoffTime: '2026-04-02 12:20', preferredDate: '2026-04-03' },
];

const SALES_STAFF: SalesStaff[] = [
  { id: 'staff-1', name: '박미팅', team: '1팀', region: '서울/경기', activeCount: 3, confirmedCount: 1, schedule: { '2026-04-03': 3, '2026-04-04': 2, '2026-04-05': 1 } },
  { id: 'staff-2', name: '김성일', team: '1팀', region: '경기 남부', activeCount: 4, confirmedCount: 2, schedule: { '2026-04-03': 2, '2026-04-04': 3, '2026-04-05': 2 } },
  { id: 'staff-3', name: '이영업', team: '2팀', region: '충청/경상', activeCount: 1, confirmedCount: 1, schedule: { '2026-04-03': 1, '2026-04-04': 2, '2026-04-05': 3 } },
  { id: 'staff-4', name: '최상담', team: '2팀', region: '전라/강원', activeCount: 2, confirmedCount: 1, schedule: { '2026-04-03': 2, '2026-04-04': 1, '2026-04-05': 2 } },
  { id: 'staff-5', name: '정보상', team: '3팀', region: '서울/경기', activeCount: 5, confirmedCount: 3, schedule: { '2026-04-03': 4, '2026-04-04': 3, '2026-04-05': 2 } },
  { id: 'staff-6', name: '한도윤', team: '3팀', region: '서울 강남', activeCount: 2, confirmedCount: 1, schedule: { '2026-04-03': 1, '2026-04-04': 2, '2026-04-05': 1 } },
];

const REGION_TABS = ['전체', '서울', '경기', '충청', '경상', '전라', '강원', '제주'];
const TEAM_FILTER_OPTIONS = ['전체', '1팀', '2팀', '3팀'];

const METRO_PREFIXES = ['서울', '경기', '인천'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGroupKey(region: string) {
  const parts = region.split(' ');
  return parts.slice(0, 2).join(' ');
}

function isMetro(region: string) {
  return METRO_PREFIXES.some((p) => region.startsWith(p));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface CaseGroupCardProps {
  groupKey: string;
  cases: UnassignedCase[];
  selectedCases: Set<string>;
  onToggleCase: (id: string) => void;
  onToggleGroup: (ids: string[]) => void;
}

function CaseGroupCard({ groupKey, cases, selectedCases, onToggleCase, onToggleGroup }: CaseGroupCardProps) {
  const [open, setOpen] = useState(true);
  const allSelected = cases.every((c) => selectedCases.has(c.id));
  const someSelected = cases.some((c) => selectedCases.has(c.id));

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Group header */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-slate-50 cursor-pointer select-none"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <button
            className="text-slate-400 hover:text-slate-600"
            onClick={(e) => {
              e.stopPropagation();
              onToggleGroup(cases.map((c) => c.id));
            }}
          >
            {allSelected ? (
              <CheckSquare size={15} className="text-blue-600" />
            ) : someSelected ? (
              <CheckSquare size={15} className="text-blue-300" />
            ) : (
              <Square size={15} />
            )}
          </button>
          <span className="text-xs font-semibold text-slate-700">{groupKey}</span>
          <span className="text-[10px] bg-slate-200 text-slate-600 rounded-full px-1.5 py-0.5 font-bold">
            {cases.length}건
          </span>
        </div>
        {open ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
      </div>

      {/* Case rows */}
      {open && (
        <div className="divide-y divide-slate-100">
          {cases.map((c) => (
            <div
              key={c.id}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors',
                selectedCases.has(c.id) && 'bg-blue-50'
              )}
              onClick={() => onToggleCase(c.id)}
            >
              <div className="shrink-0">
                {selectedCases.has(c.id) ? (
                  <CheckSquare size={14} className="text-blue-600" />
                ) : (
                  <Square size={14} className="text-slate-300" />
                )}
              </div>
              <span className="text-sm font-semibold text-slate-900 w-14 shrink-0">{c.customer}</span>
              <span
                className={clsx(
                  'rounded-full border px-1.5 py-0.5 text-[10px] font-bold shrink-0',
                  c.type === '미팅인계'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-purple-50 text-purple-700 border-purple-200'
                )}
              >
                {c.type}
              </span>
              <span
                className={clsx(
                  'rounded-full border px-1.5 py-0.5 text-[10px] font-bold shrink-0',
                  c.dbCategory === '일반DB'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-orange-50 text-orange-700 border-orange-200'
                )}
              >
                {c.dbCategory}
              </span>
              <span className="text-[11px] text-slate-400 truncate flex-1">{c.memo}</span>
              <span className="text-[10px] text-blue-500 shrink-0">희망 {c.preferredDate.slice(5)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface StaffCardProps {
  staff: SalesStaff;
  selected: boolean;
  onClick: () => void;
  selectedPreferredDates: string[]; // unique preferredDates from selected cases
}

function StaffCard({ staff, selected, onClick, selectedPreferredDates }: StaffCardProps) {
  const total = staff.activeCount + staff.confirmedCount;
  // Only show schedule rows for dates that appear in selected cases' preferredDates
  const relevantSchedule = selectedPreferredDates
    .filter((d) => staff.schedule[d] !== undefined)
    .map((d) => ({ date: d, count: staff.schedule[d] }));

  return (
    <div
      className={clsx(
        'border rounded-lg p-3 cursor-pointer transition-all',
        selected
          ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-slate-900">{staff.name}</span>
          <span className="text-[10px] text-slate-400 bg-slate-100 rounded-full px-1.5 py-0.5">{staff.team}</span>
          <span className="text-[10px] text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">{staff.region}</span>
        </div>
        <span
          className={clsx(
            'text-xs font-bold rounded-full px-2 py-0.5',
            total >= 6
              ? 'bg-red-50 text-red-600 border border-red-200'
              : total >= 4
              ? 'bg-yellow-50 text-yellow-600 border border-yellow-200'
              : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
          )}
        >
          {total}건
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-slate-500">
        <span>진행중 <strong className="text-slate-700">{staff.activeCount}</strong></span>
        <span className="text-slate-300">/</span>
        <span>미팅확정 <strong className="text-slate-700">{staff.confirmedCount}</strong></span>
      </div>
      {relevantSchedule.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {relevantSchedule.map(({ date, count }) => (
            <span key={date} className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
              {date.slice(5)} {count}건
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface HandoffProps {
  onNavigate?: (path: string) => void;
}

export function Handoff({ onNavigate: _onNavigate }: HandoffProps) {
  const [regionFilter, setRegionFilter] = useState('전체');
  const [teamFilter, setTeamFilter] = useState('전체');
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [cases, setCases] = useState<UnassignedCase[]>(MOCK_UNASSIGNED_CASES);
  const [staffList, setStaffList] = useState<SalesStaff[]>(SALES_STAFF);

  // Filter cases by region tab
  const filteredCases = useMemo(() => {
    if (regionFilter === '전체') return cases;
    return cases.filter((c) => c.region.startsWith(regionFilter));
  }, [cases, regionFilter]);

  // Group filtered cases by 시/군/구
  const groupedCases = useMemo(() => {
    const map = new Map<string, UnassignedCase[]>();
    for (const c of filteredCases) {
      const key = getGroupKey(c.region);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return map;
  }, [filteredCases]);

  // Unique preferredDates from currently selected cases
  const selectedPreferredDates = useMemo(() => {
    const dates = new Set<string>();
    for (const c of cases) {
      if (selectedCases.has(c.id)) dates.add(c.preferredDate);
    }
    return Array.from(dates).sort();
  }, [cases, selectedCases]);

  // Filter staff by team tab
  const filteredStaff = useMemo(() => {
    if (teamFilter === '전체') return staffList;
    return staffList.filter((s) => s.team === teamFilter);
  }, [staffList, teamFilter]);

  // Provincial cases summary (non-metro)
  const provincialSummary = useMemo(() => {
    const nonMetro = cases.filter((c) => !isMetro(c.region));
    const map = new Map<string, number>();
    for (const c of nonMetro) {
      const key = getGroupKey(c.region);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return { entries: Array.from(map.entries()), total: nonMetro.length };
  }, [cases]);

  // Toggle single case
  const toggleCase = (id: string) => {
    setSelectedCases((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Toggle all cases in a group
  const toggleGroup = (ids: string[]) => {
    setSelectedCases((prev) => {
      const next = new Set(prev);
      const allSelected = ids.every((id) => next.has(id));
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Bulk assign
  const handleAssign = () => {
    if (selectedCases.size === 0) {
      toast.error('배정할 케이스를 선택해주세요.');
      return;
    }
    if (!selectedStaff) {
      toast.error('배정할 담당자를 선택해주세요.');
      return;
    }
    const staff = staffList.find((s) => s.id === selectedStaff);
    if (!staff) return;

    const count = selectedCases.size;
    setCases((prev) => prev.filter((c) => !selectedCases.has(c.id)));
    setStaffList((prev) =>
      prev.map((s) =>
        s.id === selectedStaff ? { ...s, activeCount: s.activeCount + count } : s
      )
    );
    setSelectedCases(new Set());
    setSelectedStaff(null);
    toast.success(`${staff.name}에게 ${count}건이 배정되었습니다.`);
  };

  const selectedStaffObj = staffList.find((s) => s.id === selectedStaff);

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
        <div>
          <h2 className="font-bold text-[#1e293b]">미팅 배정 관리</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            콜팀에서 넘어온 미팅 인계 건과 소개 건을 영업팀원에게 배정합니다.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 border border-slate-200">
          {cases.length}건 대기
        </span>
      </div>

      {/* Region Filter Tabs */}
      <div className="px-6 py-2 border-b border-slate-200 bg-white flex gap-1 shrink-0 overflow-x-auto">
        {REGION_TABS.map((tab) => (
          <button
            key={tab}
            className={clsx(
              'px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors',
              regionFilter === tab
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
            onClick={() => setRegionFilter(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content: Two-panel layout */}
      <div className="flex flex-1 overflow-hidden gap-4 p-4 pb-0">
        {/* Left Panel: Unassigned Cases */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <span className="text-sm font-bold text-slate-700">
              미배정 케이스
              <span className="ml-1.5 text-xs text-slate-400 font-normal">({filteredCases.length}건)</span>
            </span>
            {selectedCases.size > 0 && (
              <button
                className="text-xs text-blue-600 hover:underline"
                onClick={() => setSelectedCases(new Set())}
              >
                선택 해제
              </button>
            )}
          </div>

          {/* Case Groups */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredCases.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <p className="text-sm">해당 지역의 미배정 케이스가 없습니다.</p>
              </div>
            ) : (
              Array.from(groupedCases.entries()).map(([groupKey, groupCases]) => (
                <CaseGroupCard
                  key={groupKey}
                  groupKey={groupKey}
                  cases={groupCases}
                  selectedCases={selectedCases}
                  onToggleCase={toggleCase}
                  onToggleGroup={toggleGroup}
                />
              ))
            )}

            {/* Provincial Summary — shown only when tab is 전체 */}
            {regionFilter === '전체' && provincialSummary.total > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2">
                <p className="text-xs font-bold text-amber-700 mb-1.5">지방건 요약</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {provincialSummary.entries.map(([key, count]) => (
                    <span key={key} className="text-[11px] text-amber-800">
                      {key} <span className="font-bold">({count}건)</span>
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-amber-600 mt-1.5">
                  총 {provincialSummary.total}건 · 2인 이상 배치 시 효율적
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Sales Staff */}
        <div className="flex flex-col w-72 shrink-0 overflow-hidden">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <span className="text-sm font-bold text-slate-700">영업팀 직원 현황</span>
            <span className="text-[10px] text-slate-400">{filteredStaff.length}명</span>
          </div>
          {/* Team filter tabs */}
          <div className="flex gap-1 mb-3 shrink-0">
            {TEAM_FILTER_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => setTeamFilter(t)}
                className={clsx(
                  'px-2.5 py-1 text-[10px] font-bold rounded',
                  teamFilter === t
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredStaff.map((staff) => (
              <StaffCard
                key={staff.id}
                staff={staff}
                selected={selectedStaff === staff.id}
                onClick={() =>
                  setSelectedStaff((prev) => (prev === staff.id ? null : staff.id))
                }
                selectedPreferredDates={selectedPreferredDates}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center gap-4 shrink-0 mt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">선택된</span>
          <span
            className={clsx(
              'font-bold text-sm',
              selectedCases.size > 0 ? 'text-blue-600' : 'text-slate-400'
            )}
          >
            {selectedCases.size}건
          </span>
          <span className="text-sm text-slate-500">을</span>
        </div>

        {/* Staff selector (click on right panel cards is primary; this is a fallback label) */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">담당자</span>
          <span
            className={clsx(
              'px-3 py-1 rounded-lg text-sm font-semibold border',
              selectedStaff
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            )}
          >
            {selectedStaffObj ? selectedStaffObj.name : '— 우측에서 선택 —'}
          </span>
          <span className="text-sm text-slate-500">에게 배정</span>
        </div>

        <div className="ml-auto">
          <button
            className={clsx(
              'px-5 py-2 rounded-lg text-sm font-bold transition-colors',
              selectedCases.size > 0 && selectedStaff
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            )}
            onClick={handleAssign}
            disabled={selectedCases.size === 0 || !selectedStaff}
          >
            일괄 배정
          </button>
        </div>
      </div>
    </div>
  );
}
