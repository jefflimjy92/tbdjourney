import React, { useMemo, useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  ChevronRight,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Megaphone,
  User,
  MapPin,
  Calendar,
  ArrowRight,
  Clock,
  Zap,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';
import { ListPeriodControls } from '@/app/components/ListPeriodControls';
import {
  filterRowsByPeriod,
  getDefaultCustomPeriodRange,
  getPerformancePeriodRange,
  getRowsDateBounds,
  type PerformancePeriodPreset,
} from '@/app/issuance/performancePeriodUtils';

// Mock Data
type DbCategory = 'possible' | 'compensation' | 'referral';

const DB_CATEGORY_LABEL: Record<DbCategory, string> = {
  possible: '가능DB',
  compensation: '보상DB',
  referral: '소개DB',
};

const DB_CATEGORY_STYLE: Record<DbCategory, string> = {
  possible: 'bg-blue-50 text-blue-700 border-blue-200',
  compensation: 'bg-amber-50 text-amber-700 border-amber-200',
  referral: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const DB_FILTER_TABS = [
  { key: 'all' as const, label: '전체' },
  { key: 'possible' as const, label: '가능DB' },
  { key: 'compensation' as const, label: '보상DB' },
  { key: 'referral' as const, label: '소개DB' },
];

const MOCK_ASSIGNEES = [
  { name: '박담당', currentCount: 22 },
  { name: '김담당', currentCount: 28 },
  { name: '이담당', currentCount: 15 },
  { name: '최담당', currentCount: 31 },
  { name: '문담당', currentCount: 19 },
];

// ── 배정 유형 ──
type AssignmentType = 'scheduled' | 'adhoc' | 'urgent';
const ASSIGNMENT_TYPE_CONFIG: Record<AssignmentType, { label: string; icon: React.ElementType; color: string }> = {
  scheduled: { label: '정기', icon: Clock, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  adhoc: { label: '수시', icon: RefreshCw, color: 'text-slate-600 bg-slate-50 border-slate-200' },
  urgent: { label: '긴급', icon: Zap, color: 'text-rose-600 bg-rose-50 border-rose-200' },
};

const SCHEDULE_SLOTS = [
  { time: '10:00', label: '1차 (10:00)' },
  { time: '13:00', label: '2차 (13:00)' },
  { time: '15:00', label: '3차 (15:00)' },
];

const MAX_PER_PERSON = 30;

const LEADS = [
  { id: 'L-2026-001', date: '2026-03-12 09:30', channel: '인스타그램 광고 #4', name: '김지우', age: 29, region: '서울 강남', marketing_consent: true, terms_consent: true, status: '신규(New)', owner: '-', next_action: '배정', dbCategory: 'possible' as DbCategory },
  { id: 'L-2026-002', date: '2026-03-11 10:15', channel: '구글 검색', name: '이민수', age: 45, region: '경기 수원', marketing_consent: true, terms_consent: true, status: '배정됨', owner: '박담당', next_action: '전화', dbCategory: 'compensation' as DbCategory },
  { id: 'L-2026-003', date: '2026-03-09 11:00', channel: '틱톡', name: '최아라', age: 24, region: '부산', marketing_consent: false, terms_consent: true, status: '부적격', owner: '시스템', next_action: '-', dbCategory: 'possible' as DbCategory },
  { id: 'L-2026-004', date: '2026-03-07 16:45', channel: '지인 소개', name: '박준호', age: 33, region: '인천', marketing_consent: true, terms_consent: true, status: '연락완료', owner: '김담당', next_action: '팔로업', dbCategory: 'referral' as DbCategory },
  { id: 'L-2026-005', date: '2026-03-03 13:20', channel: '네이버 블로그', name: '윤서연', age: 31, region: '서울 마포', marketing_consent: true, terms_consent: true, status: '신규(New)', owner: '-', next_action: '배정', dbCategory: 'possible' as DbCategory },
  { id: 'L-2026-006', date: '2026-02-28 09:10', channel: '카카오 채널', name: '오태윤', age: 41, region: '대전 유성', marketing_consent: true, terms_consent: true, status: '배정됨', owner: '이담당', next_action: '전화', dbCategory: 'compensation' as DbCategory },
  { id: 'L-2026-007', date: '2026-02-22 15:00', channel: '구글 검색', name: '한수진', age: 36, region: '인천 연수', marketing_consent: true, terms_consent: true, status: '연락완료', owner: '박담당', next_action: '팔로업', dbCategory: 'possible' as DbCategory },
  { id: 'L-2026-008', date: '2026-02-16 14:40', channel: '지인 소개', name: '서지민', age: 34, region: '서울 종로', marketing_consent: true, terms_consent: true, status: '배정됨', owner: '김담당', next_action: '상담', dbCategory: 'referral' as DbCategory },
  { id: 'L-2026-009', date: '2026-02-11 10:50', channel: '유튜브 광고', name: '임도현', age: 38, region: '서울 서초', marketing_consent: false, terms_consent: true, status: '부적격', owner: '시스템', next_action: '-', dbCategory: 'possible' as DbCategory },
  { id: 'L-2026-010', date: '2026-01-26 17:05', channel: '페이스북 리타겟팅', name: '문가은', age: 27, region: '서울 중랑', marketing_consent: true, terms_consent: true, status: '연락완료', owner: '문담당', next_action: '미팅', dbCategory: 'possible' as DbCategory },
  { id: 'L-2026-011', date: '2026-01-14 08:55', channel: '구글 검색', name: '최하늘', age: 33, region: '서울 도봉', marketing_consent: true, terms_consent: true, status: '배정됨', owner: '최담당', next_action: '전화', dbCategory: 'compensation' as DbCategory },
  { id: 'L-2026-012', date: '2025-12-20 12:10', channel: '네이버 카페', name: '조민호', age: 39, region: '경기 화성', marketing_consent: true, terms_consent: true, status: '연락완료', owner: '김담당', next_action: '재접촉', dbCategory: 'possible' as DbCategory },
];

export function Leads() {
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const defaultCustomPeriodRange = useMemo(() => getDefaultCustomPeriodRange(), []);
  const [periodPreset, setPeriodPreset] = useState<PerformancePeriodPreset>('this_month');
  const [customPeriodStartDate, setCustomPeriodStartDate] = useState(defaultCustomPeriodRange.startDate);
  const [customPeriodEndDate, setCustomPeriodEndDate] = useState(defaultCustomPeriodRange.endDate);
  const [dbFilter, setDbFilter] = useState<'all' | DbCategory>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchAssignee, setBatchAssignee] = useState('');
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('scheduled');
  const [scheduleSlot, setScheduleSlot] = useState(SCHEDULE_SLOTS[0].time);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showClassifyConfirm, setShowClassifyConfirm] = useState(false);
  const [urgentReason, setUrgentReason] = useState('');
  const allRange = useMemo(
    () => getRowsDateBounds(LEADS, (lead) => lead.date, defaultCustomPeriodRange),
    [defaultCustomPeriodRange]
  );

  // Drawer state
  const [memo, setMemo] = useState('');
  const [regionScore, setRegionScore] = useState(85);

  const handleOpenDrawer = (lead: any) => {
    setSelectedLead(lead);
    setMemo('');
  };

  const periodRange = useMemo(
    () => getPerformancePeriodRange(periodPreset, customPeriodStartDate, customPeriodEndDate, new Date(), allRange),
    [allRange, customPeriodEndDate, customPeriodStartDate, periodPreset]
  );

  const periodFiltered = useMemo(
    () => filterRowsByPeriod(LEADS, periodRange, (lead) => lead.date),
    [periodRange]
  );

  const filteredLeads = useMemo(
    () => dbFilter === 'all' ? periodFiltered : periodFiltered.filter(l => l.dbCategory === dbFilter),
    [dbFilter, periodFiltered]
  );

  const dbCounts = useMemo(() => ({
    all: periodFiltered.length,
    possible: periodFiltered.filter(l => l.dbCategory === 'possible').length,
    compensation: periodFiltered.filter(l => l.dbCategory === 'compensation').length,
    referral: periodFiltered.filter(l => l.dbCategory === 'referral').length,
  }), [periodFiltered]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const handleBatchAssign = () => {
    if (!batchAssignee) return;
    const assignee = MOCK_ASSIGNEES.find(a => a.name === batchAssignee);
    const newTotal = (assignee?.currentCount || 0) + selectedIds.size;
    if (newTotal > MAX_PER_PERSON) {
      alert(`경고: ${batchAssignee}님의 배정 건수가 ${newTotal}건으로 상한(${MAX_PER_PERSON}건)을 초과합니다.`);
    }
    setShowBatchModal(false);
    setSelectedIds(new Set());
    setBatchAssignee('');
    setUrgentReason('');
  };

  // 자동 분류: 기왕증 → 보상DB, 소개코드 → 소개DB, 나머지 → 가능DB
  const handleAutoClassify = () => {
    // Mock: 실제로는 심평원 데이터 기반 분류
    setShowClassifyConfirm(false);
    alert('자동 분류 완료: 가능DB 7건, 보상DB 3건, 소개DB 2건 (mock)');
  };

  // 정기 배정: 선택 시간대에 균등 배분 미리보기
  const scheduledPreview = useMemo(() => {
    const unassigned = periodFiltered.filter(l => l.owner === '-');
    const assignees = MOCK_ASSIGNEES.filter(a => a.currentCount < MAX_PER_PERSON);
    if (assignees.length === 0) return [];
    const perPerson = Math.floor(unassigned.length / assignees.length);
    const remainder = unassigned.length % assignees.length;
    return assignees.map((a, i) => ({
      name: a.name,
      currentCount: a.currentCount,
      newCount: perPerson + (i < remainder ? 1 : 0),
      total: a.currentCount + perPerson + (i < remainder ? 1 : 0),
      overLimit: a.currentCount + perPerson + (i < remainder ? 1 : 0) > MAX_PER_PERSON,
    }));
  }, [periodFiltered]);

  const unassignedCount = periodFiltered.filter(l => l.owner === '-').length;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="font-bold text-[#1e293b]">신청(DB) 유입 관리</h2>
          <p className="text-xs text-slate-500 mt-1">인바운드 신청 내역 및 담당자 배정</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <ListPeriodControls
            preset={periodPreset}
            range={periodRange}
            onPresetChange={setPeriodPreset}
            onStartDateChange={setCustomPeriodStartDate}
            onEndDateChange={setCustomPeriodEndDate}
          />
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-600 hover:bg-slate-50 cursor-pointer">
            <Filter size={16} /> 필터
          </div>
          <button
            onClick={() => setShowClassifyConfirm(true)}
            className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded text-sm font-medium hover:bg-amber-100"
          >
            <RefreshCw size={16} /> 자동 분류
          </button>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-sm font-medium hover:bg-emerald-100"
          >
            <Clock size={16} /> 정기 배정 ({unassignedCount}건 미배정)
          </button>
          {selectedIds.size > 0 && (
            <button
              onClick={() => setShowBatchModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
            >
              <ArrowRight size={16} /> 일괄 배정 ({selectedIds.size}건)
            </button>
          )}
          <button className="flex items-center gap-2 px-3 py-2 bg-[#1e293b] text-white rounded text-sm hover:bg-slate-800">
            <Plus size={16} /> 수기 등록
          </button>
        </div>
      </div>

      {/* DB Type Filter Tabs */}
      <div className="px-6 pt-3 pb-0 border-b border-slate-200 bg-white flex gap-1">
        {DB_FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setDbFilter(tab.key); setSelectedIds(new Set()); }}
            className={clsx(
              'px-4 py-2 text-xs font-bold rounded-t border-b-2 transition-colors',
              dbFilter === tab.key
                ? 'text-[#1e293b] border-[#1e293b] bg-slate-50'
                : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'
            )}
          >
            {tab.label}
            <span className={clsx(
              'ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]',
              dbFilter === tab.key ? 'bg-[#1e293b] text-white' : 'bg-slate-100 text-slate-400'
            )}>
              {dbCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* List Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 sticky top-0">
            <tr>
              <th className="px-3 py-3 w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredLeads.length && filteredLeads.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300"
                />
              </th>
              <th className="px-6 py-3 font-medium">신청ID / 일시</th>
              <th className="px-6 py-3 font-medium">유입 채널</th>
              <th className="px-6 py-3 font-medium">고객명</th>
              <th className="px-6 py-3 font-medium">DB유형</th>
              <th className="px-6 py-3 font-medium">나이</th>
              <th className="px-6 py-3 font-medium">지역(추정)</th>
              <th className="px-6 py-3 font-medium">동의여부</th>
              <th className="px-6 py-3 font-medium">상태</th>
              <th className="px-6 py-3 font-medium">담당자</th>
              <th className="px-6 py-3 font-medium text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLeads.map((item) => (
              <tr
                key={item.id}
                className={clsx("hover:bg-slate-50 transition-colors cursor-pointer", selectedIds.has(item.id) && "bg-blue-50/50")}
                onClick={() => handleOpenDrawer(item)}
              >
                <td className="px-3 py-4" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="rounded border-slate-300"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="font-mono text-xs font-medium text-slate-600">{item.id}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{item.date}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs border border-slate-200">
                    <Megaphone size={10} /> {item.channel}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-[#1e293b]">{item.name}</td>
                <td className="px-6 py-4">
                  <span className={clsx("inline-flex px-2 py-0.5 rounded text-xs font-bold border", DB_CATEGORY_STYLE[item.dbCategory])}>
                    {DB_CATEGORY_LABEL[item.dbCategory]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={clsx(
                    "text-xs font-medium px-1.5 py-0.5 rounded",
                    item.age >= 27 ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"
                  )}>
                    {item.age}세
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{item.region}</td>
                <td className="px-6 py-4">
                   <div className="flex gap-1">
                      <span className={clsx("size-2 rounded-full", item.marketing_consent ? "bg-green-500" : "bg-slate-300")} title="마케팅 동의"></span>
                      <span className={clsx("size-2 rounded-full", item.terms_consent ? "bg-green-500" : "bg-slate-300")} title="약관 동의"></span>
                   </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-6 py-4 text-slate-600">{item.owner}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-[#1e293b]">
                    <ChevronRight size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Batch Assignment Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setShowBatchModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-[#1e293b]">일괄 배정</h3>
                <p className="text-xs text-slate-500 mt-1">{selectedIds.size}건 선택됨</p>
              </div>
              <button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              {/* 배정 유형 선택 */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">배정 유형</label>
                <div className="flex gap-2">
                  {(Object.entries(ASSIGNMENT_TYPE_CONFIG) as [AssignmentType, typeof ASSIGNMENT_TYPE_CONFIG[AssignmentType]][]).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => setAssignmentType(key)}
                        className={clsx(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-bold transition-colors',
                          assignmentType === key ? cfg.color : 'text-slate-400 bg-white border-slate-200'
                        )}
                      >
                        <Icon size={12} /> {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {assignmentType === 'urgent' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">긴급 사유 <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={urgentReason}
                    onChange={e => setUrgentReason(e.target.value)}
                    placeholder="긴급 배정 사유를 입력하세요"
                    className="w-full px-3 py-2 border border-rose-300 rounded text-sm focus:ring-2 focus:ring-rose-200"
                  />
                </div>
              )}
              <label className="block text-xs font-bold text-slate-600">담당자 선택</label>
              <select
                value={batchAssignee}
                onChange={e => setBatchAssignee(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              >
                <option value="">담당자를 선택하세요</option>
                {MOCK_ASSIGNEES.map(a => (
                  <option key={a.name} value={a.name}>
                    {a.name} (현재 {a.currentCount}건)
                  </option>
                ))}
              </select>
              {batchAssignee && (() => {
                const assignee = MOCK_ASSIGNEES.find(a => a.name === batchAssignee);
                const newTotal = (assignee?.currentCount || 0) + selectedIds.size;
                return (
                  <div className={clsx(
                    "px-3 py-2 rounded text-xs border",
                    newTotal > 30 ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-slate-50 border-slate-200 text-slate-600"
                  )}>
                    <span className="font-bold">{batchAssignee}</span>: 현재 {assignee?.currentCount}건 + {selectedIds.size}건 = <span className="font-bold">{newTotal}건</span>
                    {newTotal > 30 && <span className="ml-2 font-bold text-rose-600">상한 초과!</span>}
                  </div>
                );
              })()}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowBatchModal(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded hover:bg-slate-50">
                취소
              </button>
              <button
                onClick={handleBatchAssign}
                disabled={!batchAssignee}
                className="px-4 py-2 text-sm text-white bg-[#1e293b] rounded hover:bg-slate-800 disabled:opacity-40"
              >
                배정 확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Classify Confirm Modal */}
      {showClassifyConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setShowClassifyConfirm(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <RefreshCw size={18} className="text-amber-600" />
                <h3 className="font-bold text-[#1e293b]">DB 자동 분류</h3>
              </div>
              <button onClick={() => setShowClassifyConfirm(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-3 mb-6">
              <p className="text-sm text-slate-600">미분류 DB를 규칙 기반으로 자동 분류합니다.</p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 소개코드 보유 → <span className="font-bold text-emerald-700">소개DB</span></div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /> 기왕증(심평원) 확인 → <span className="font-bold text-amber-700">보상DB</span></div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500" /> 나머지 → <span className="font-bold text-blue-700">가능DB</span></div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>이미 분류된 건은 변경되지 않습니다. 신규(New) 상태만 대상입니다.</span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowClassifyConfirm(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded hover:bg-slate-50">취소</button>
              <button onClick={handleAutoClassify} className="px-4 py-2 text-sm text-white bg-amber-600 rounded hover:bg-amber-700 font-medium">자동 분류 실행</button>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Assignment Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setShowScheduleModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-emerald-600" />
                <div>
                  <h3 className="font-bold text-[#1e293b]">정기 배정</h3>
                  <p className="text-xs text-slate-500 mt-0.5">미배정 {unassignedCount}건을 균등 배분합니다</p>
                </div>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            {/* Time Slot Selection */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-600 mb-2">배정 시간대</label>
              <div className="flex gap-2">
                {SCHEDULE_SLOTS.map(slot => (
                  <button
                    key={slot.time}
                    onClick={() => setScheduleSlot(slot.time)}
                    className={clsx(
                      'flex-1 px-3 py-2 rounded border text-sm font-medium transition-colors',
                      scheduleSlot === slot.time
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Table */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-600 mb-2">배분 미리보기 (인당 상한 {MAX_PER_PERSON}건)</label>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">담당자</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">현재</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">추가</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">합계</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {scheduledPreview.map(row => (
                      <tr key={row.name} className={clsx(row.overLimit && 'bg-rose-50')}>
                        <td className="px-3 py-2 font-medium text-slate-700">{row.name}</td>
                        <td className="px-3 py-2 text-right text-slate-500">{row.currentCount}</td>
                        <td className="px-3 py-2 text-right text-emerald-600 font-bold">+{row.newCount}</td>
                        <td className="px-3 py-2 text-right">
                          <span className={clsx('font-bold', row.overLimit ? 'text-rose-600' : 'text-slate-700')}>
                            {row.total}
                            {row.overLimit && <AlertTriangle size={12} className="inline ml-1 text-rose-500" />}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {scheduledPreview.some(r => r.overLimit) && (
                <p className="text-xs text-rose-600 mt-2 flex items-center gap-1">
                  <AlertTriangle size={12} /> 상한 초과 담당자가 있습니다. 배정 건수를 확인하세요.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowScheduleModal(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded hover:bg-slate-50">취소</button>
              <button
                onClick={() => { setShowScheduleModal(false); alert(`${scheduleSlot} 정기 배정 실행 완료 (mock)`); }}
                className="px-4 py-2 text-sm text-white bg-emerald-600 rounded hover:bg-emerald-700 font-medium"
              >
                배정 실행
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedLead(null)}
          />
          <div className="relative w-full max-w-lg bg-white shadow-2xl h-full flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
            
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-start bg-white z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                   <StatusBadge status={selectedLead.status} />
                   <span className="text-xs font-mono text-slate-500">{selectedLead.id}</span>
                </div>
                <h2 className="text-xl font-bold text-[#1e293b]">{selectedLead.name} 고객님</h2>
              </div>
              <button 
                onClick={() => setSelectedLead(null)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-[#1e293b]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              
              {/* Automated Checks */}
              {selectedLead.age < 27 && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-rose-800">
                   <AlertCircle size={18} className="shrink-0 mt-0.5" />
                   <div>
                      <h4 className="font-bold text-sm">부적격 경고 (나이 미달)</h4>
                      <p className="text-xs mt-1">고객 연령이 27세 미만입니다. 배정 전 관리자 승인이 필요합니다.</p>
                   </div>
                </div>
              )}

              {/* Basic Info Card */}
              <section className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4">
                 <h3 className="text-sm font-bold text-[#1e293b] flex items-center gap-2">
                    <User size={16} /> 고객 프로필
                 </h3>
                 <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                       <label className="text-xs text-slate-500 block">나이</label>
                       <div className="font-medium">{selectedLead.age}세</div>
                    </div>
                    <div>
                       <label className="text-xs text-slate-500 block">연락처</label>
                       <div className="font-medium text-slate-900">010-****-**** <span className="text-xs text-slate-400">(마스킹됨)</span></div>
                    </div>
                    <div>
                       <label className="text-xs text-slate-500 block">지역 (추정)</label>
                       <div className="font-medium flex items-center gap-2">
                          {selectedLead.region}
                          <span className={clsx("text-[10px] px-1.5 py-0.5 rounded", regionScore > 80 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
                             정확도 {regionScore}%
                          </span>
                       </div>
                    </div>
                    <div>
                       <label className="text-xs text-slate-500 block">유입 채널</label>
                       <div className="font-medium">{selectedLead.channel}</div>
                    </div>
                 </div>
              </section>

              {/* Consent Status */}
              <section className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                 <h3 className="text-sm font-bold text-[#1e293b] flex items-center gap-2 mb-3">
                    <CheckCircle2 size={16} /> 동의 현황
                 </h3>
                 <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded border border-slate-100 bg-slate-50">
                       <span className="text-sm text-slate-600">마케팅 활용 동의</span>
                       {selectedLead.marketing_consent 
                         ? <span className="text-xs font-bold text-green-600 flex items-center gap-1"><CheckCircle2 size={12}/> 동의함</span>
                         : <span className="text-xs font-bold text-slate-400">미동의</span>
                       }
                    </div>
                    <div className="flex items-center justify-between p-2 rounded border border-slate-100 bg-slate-50">
                       <span className="text-sm text-slate-600">서비스 이용 약관</span>
                       {selectedLead.terms_consent 
                         ? <span className="text-xs font-bold text-green-600 flex items-center gap-1"><CheckCircle2 size={12}/> 동의함</span>
                         : <span className="text-xs font-bold text-rose-500">누락됨</span>
                       }
                    </div>
                 </div>
              </section>

              {/* Memo */}
              <section>
                 <h3 className="text-sm font-bold text-[#1e293b] mb-2">담당자 메모</h3>
                 <textarea 
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="배정 전 특이사항이나 내부 메모를 입력하세요..."
                    className="w-full h-24 p-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e] resize-none"
                 />
              </section>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-white flex justify-between gap-3 items-center">
               <button className="text-slate-500 text-xs hover:underline">
                  전체 이력 보기
               </button>
               <div className="flex gap-2">
                  <button 
                     className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                     반려 / 보류
                  </button>
                  <button 
                     className="px-6 py-2 bg-[#0f766e] text-white rounded-lg text-sm font-medium hover:bg-[#0d6b63] shadow-sm flex items-center gap-2 transition-colors"
                  >
                     상담 배정하기 <ArrowRight size={16} />
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    '신규(New)': 'bg-blue-50 text-blue-700 border-blue-200',
    '배정됨': 'bg-purple-50 text-purple-700 border-purple-200',
    '연락완료': 'bg-amber-50 text-amber-700 border-amber-200',
    '부적격': 'bg-rose-50 text-rose-700 border-rose-200',
  };
  
  return (
    <span className={clsx("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border", styles[status as keyof typeof styles] || styles['신규(New)'])}>
      {status}
    </span>
  );
}
