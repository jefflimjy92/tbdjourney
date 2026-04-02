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
} from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { Button } from '@/app/components/ui/button';
import { ListPeriodControls } from '@/app/components/ListPeriodControls';
import {
  filterRowsByPeriod,
  getDefaultCustomPeriodRange,
  getPerformancePeriodRange,
  getRowsDateBounds,
  type PerformancePeriodPreset,
} from '@/app/issuance/performancePeriodUtils';

// Mock Data
type DbCategory = 'possible' | 'compensation' | 'referral' | 'intro';

const DB_CATEGORY_LABEL: Record<DbCategory, string> = {
  possible: '가능DB',
  compensation: '보상DB',
  referral: '소개DB',
  intro: '인트로DB',
};

const DB_CATEGORY_STYLE: Record<DbCategory, string> = {
  possible: 'bg-blue-50 text-blue-700 border-blue-200',
  compensation: 'bg-amber-50 text-amber-700 border-amber-200',
  referral: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  intro: 'bg-violet-50 text-violet-700 border-violet-200',
};

function getDisplayDbType(category: DbCategory): { label: string; className: string } {
  if (category === 'referral') return { label: '소개 DB', className: 'border-green-200 bg-green-50 text-green-700' };
  return { label: '일반 DB', className: 'border-blue-200 bg-blue-50 text-blue-700' };
}

type DbFilterKey = '일반DB' | '소개DB' | '미배정';

const DB_FILTER_TABS: { key: DbFilterKey; label: string }[] = [
  { key: '일반DB', label: '일반 DB' },
  { key: '소개DB', label: '소개 DB' },
  { key: '미배정', label: '미배정' },
];

const MOCK_ASSIGNEES = [
  { name: '박담당', currentCount: 22 },
  { name: '김담당', currentCount: 28 },
  { name: '이담당', currentCount: 15 },
  { name: '최담당', currentCount: 31 },
  { name: '문담당', currentCount: 19 },
];

const MOCK_CALL_MEMBERS = [
  { id: 'cm1', name: '김상담', currentCount: 5 },
  { id: 'cm2', name: '이상담', currentCount: 3 },
  { id: 'cm3', name: '박상담', currentCount: 4 },
];

// ── 배정 유형 ──
type AssignmentType = 'scheduled' | 'adhoc' | 'urgent';
const ASSIGNMENT_TYPE_CONFIG: Record<AssignmentType, { label: string; icon: React.ElementType; color: string }> = {
  scheduled: { label: '정기', icon: Clock, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  adhoc: { label: '수시', icon: RefreshCw, color: 'text-slate-600 bg-slate-50 border-slate-200' },
  urgent: { label: '긴급', icon: Zap, color: 'text-rose-600 bg-rose-50 border-rose-200' },
};

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
  // 가능DB 추가
  { id: 'L-2026-013', date: '2026-03-25 10:05', channel: '인스타그램 광고 #7', name: '노지현', age: 32, region: '서울 은평', marketing_consent: true, terms_consent: true, status: '신규(New)', owner: '-', next_action: '배정', dbCategory: 'possible' as DbCategory },
  { id: 'L-2026-014', date: '2026-03-24 14:30', channel: '유튜브 광고', name: '권도훈', age: 41, region: '대구 수성', marketing_consent: true, terms_consent: true, status: '배정됨', owner: '박담당', next_action: '전화', dbCategory: 'possible' as DbCategory },
  { id: 'L-2026-015', date: '2026-03-22 11:20', channel: '구글 검색', name: '임채원', age: 28, region: '서울 강서', marketing_consent: false, terms_consent: true, status: '부적격', owner: '시스템', next_action: '-', dbCategory: 'possible' as DbCategory },
  { id: 'L-2026-016', date: '2026-03-20 09:45', channel: '네이버 블로그', name: '황지영', age: 35, region: '경기 안양', marketing_consent: true, terms_consent: true, status: '연락완료', owner: '이담당', next_action: '팔로업', dbCategory: 'possible' as DbCategory },
  { id: 'L-2026-017', date: '2026-03-18 16:00', channel: '카카오 채널', name: '신현우', age: 43, region: '부산 해운대', marketing_consent: true, terms_consent: true, status: '배정됨', owner: '최담당', next_action: '상담', dbCategory: 'possible' as DbCategory },
  // 보상DB 추가
  { id: 'L-2026-018', date: '2026-03-26 09:15', channel: '카카오 채널', name: '백승호', age: 52, region: '서울 노원', marketing_consent: true, terms_consent: true, status: '신규(New)', owner: '-', next_action: '배정', dbCategory: 'compensation' as DbCategory },
  { id: 'L-2026-019', date: '2026-03-23 13:40', channel: '구글 검색', name: '유정아', age: 47, region: '인천 부평', marketing_consent: true, terms_consent: true, status: '배정됨', owner: '문담당', next_action: '전화', dbCategory: 'compensation' as DbCategory },
  { id: 'L-2026-020', date: '2026-03-19 10:30', channel: '네이버 블로그', name: '장민철', age: 55, region: '경기 성남', marketing_consent: true, terms_consent: true, status: '연락완료', owner: '이담당', next_action: '미팅', dbCategory: 'compensation' as DbCategory },
  { id: 'L-2026-021', date: '2026-03-15 15:20', channel: '유튜브 광고', name: '송혜교', age: 39, region: '서울 송파', marketing_consent: true, terms_consent: true, status: '배정됨', owner: '박담당', next_action: '팔로업', dbCategory: 'compensation' as DbCategory },
  { id: 'L-2026-022', date: '2026-03-10 11:00', channel: '인스타그램 광고 #5', name: '오정현', age: 48, region: '대전 서구', marketing_consent: false, terms_consent: true, status: '부적격', owner: '시스템', next_action: '-', dbCategory: 'compensation' as DbCategory },
  // 소개DB 추가
  { id: 'L-2026-023', date: '2026-03-27 10:00', channel: '지인 소개', name: '전세훈', age: 36, region: '서울 강동', marketing_consent: true, terms_consent: true, status: '신규(New)', owner: '-', next_action: '배정', dbCategory: 'referral' as DbCategory },
  { id: 'L-2026-024', date: '2026-03-24 14:10', channel: '지인 소개', name: '김미란', age: 44, region: '경기 용인', marketing_consent: true, terms_consent: true, status: '배정됨', owner: '김담당', next_action: '상담', dbCategory: 'referral' as DbCategory },
  { id: 'L-2026-025', date: '2026-03-21 09:50', channel: '지인 소개', name: '이상훈', age: 31, region: '서울 마포', marketing_consent: true, terms_consent: true, status: '연락완료', owner: '최담당', next_action: '미팅', dbCategory: 'referral' as DbCategory },
  { id: 'L-2026-026', date: '2026-03-17 16:30', channel: '지인 소개', name: '박소연', age: 27, region: '인천 연수', marketing_consent: true, terms_consent: true, status: '배정됨', owner: '문담당', next_action: '팔로업', dbCategory: 'referral' as DbCategory },
  { id: 'L-2026-027', date: '2026-03-13 11:45', channel: '지인 소개', name: '조현민', age: 50, region: '부산 남구', marketing_consent: true, terms_consent: true, status: '연락완료', owner: '이담당', next_action: '재접촉', dbCategory: 'referral' as DbCategory },
  // 인트로DB
  { id: 'L-2026-028', date: '2026-03-28 09:00', channel: '세미나/이벤트', name: '강태양', age: 38, region: '서울 중구', marketing_consent: true, terms_consent: true, status: '신규(New)', owner: '-', next_action: '배정', dbCategory: 'intro' as DbCategory },
  { id: 'L-2026-029', date: '2026-03-26 15:00', channel: '세미나/이벤트', name: '윤민준', age: 45, region: '경기 수원', marketing_consent: true, terms_consent: true, status: '배정됨', owner: '박담당', next_action: '전화', dbCategory: 'intro' as DbCategory },
  { id: 'L-2026-030', date: '2026-03-22 10:20', channel: '제휴사 연계', name: '한나라', age: 33, region: '서울 서초', marketing_consent: true, terms_consent: true, status: '연락완료', owner: '김담당', next_action: '상담', dbCategory: 'intro' as DbCategory },
  { id: 'L-2026-031', date: '2026-03-18 14:00', channel: '제휴사 연계', name: '정재원', age: 42, region: '대구 달서', marketing_consent: true, terms_consent: true, status: '배정됨', owner: '이담당', next_action: '팔로업', dbCategory: 'intro' as DbCategory },
  { id: 'L-2026-032', date: '2026-03-14 11:30', channel: '세미나/이벤트', name: '류수빈', age: 29, region: '서울 강남', marketing_consent: false, terms_consent: true, status: '부적격', owner: '시스템', next_action: '-', dbCategory: 'intro' as DbCategory },
  { id: 'L-2026-033', date: '2026-03-10 09:30', channel: '제휴사 연계', name: '방준혁', age: 55, region: '경기 화성', marketing_consent: true, terms_consent: true, status: '연락완료', owner: '최담당', next_action: '미팅', dbCategory: 'intro' as DbCategory },
];

export function Leads() {
  const [leadsData, setLeadsData] = useState(LEADS);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const defaultCustomPeriodRange = useMemo(() => getDefaultCustomPeriodRange(), []);
  const [periodPreset, setPeriodPreset] = useState<PerformancePeriodPreset>('all');
  const [customPeriodStartDate, setCustomPeriodStartDate] = useState(defaultCustomPeriodRange.startDate);
  const [customPeriodEndDate, setCustomPeriodEndDate] = useState(defaultCustomPeriodRange.endDate);
  const [dbFilter, setDbFilter] = useState<DbFilterKey>('일반DB');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [showDistributionPreview, setShowDistributionPreview] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchAssignee, setBatchAssignee] = useState('');
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('scheduled');
  const [urgentReason, setUrgentReason] = useState('');
  const allRange = useMemo(
    () => getRowsDateBounds(leadsData, (lead) => lead.date, defaultCustomPeriodRange),
    [defaultCustomPeriodRange, leadsData]
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
    () => filterRowsByPeriod(leadsData, periodRange, (lead) => lead.date),
    [leadsData, periodRange]
  );

  const filteredLeads = useMemo(() => {
    if (dbFilter === '소개DB') return periodFiltered.filter(l => l.dbCategory === 'referral');
    if (dbFilter === '미배정') return periodFiltered.filter(l => l.owner === '-' || l.owner === '');
    // 일반DB: possible, compensation, intro
    return periodFiltered.filter(l => l.dbCategory !== 'referral');
  }, [dbFilter, periodFiltered]);

  const dbCounts = useMemo(() => ({
    '일반DB': periodFiltered.filter(l => l.dbCategory !== 'referral').length,
    '소개DB': periodFiltered.filter(l => l.dbCategory === 'referral').length,
    '미배정': periodFiltered.filter(l => l.owner === '-' || l.owner === '').length,
  }), [periodFiltered]);

  const isReferralTab = dbFilter === '소개DB';

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

  const toggleSelectMode = () => {
    if (selectMode) {
      setSelectMode(false);
      setSelectedIds(new Set());
      setSelectedMemberIds(new Set());
      setShowDistributionPreview(false);
      setShowBatchModal(false);
      setBatchAssignee('');
      return;
    }

    setSelectMode(true);
  };

  const toggleMemberSelect = (id: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectedLeadRows = useMemo(
    () => Array.from(selectedIds).map((id) => leadsData.find((lead) => lead.id === id)).filter(Boolean) as typeof LEADS,
    [leadsData, selectedIds]
  );

  const selectedCallMembers = useMemo(
    () => MOCK_CALL_MEMBERS.filter((member) => selectedMemberIds.has(member.id)),
    [selectedMemberIds]
  );

  const distributionPreview = useMemo(() => {
    if (selectedLeadRows.length === 0 || selectedCallMembers.length === 0) return [];

    const perPerson = Math.floor(selectedLeadRows.length / selectedCallMembers.length);
    const remainder = selectedLeadRows.length % selectedCallMembers.length;
    let startIndex = 0;

    return selectedCallMembers.map((member, index) => {
      const assignedCount = perPerson + (index < remainder ? 1 : 0);
      const assignedLeads = selectedLeadRows.slice(startIndex, startIndex + assignedCount);
      startIndex += assignedCount;

      return {
        memberId: member.id,
        memberName: member.name,
        assignedCount,
        leadIds: assignedLeads.map((lead) => lead.id),
      };
    });
  }, [selectedCallMembers, selectedLeadRows]);

  const handlePreviewDistribution = () => {
    if (selectedLeadRows.length === 0 || selectedCallMembers.length === 0) {
      toast.error('접수건과 콜팀원을 먼저 선택해주세요.');
      return;
    }

    setShowDistributionPreview(true);
  };

  const handleConfirmDistribution = () => {
    if (distributionPreview.length === 0) {
      toast.error('배분 미리보기를 먼저 확인해주세요.');
      return;
    }

    const ownerMap = new Map<string, string>();
    distributionPreview.forEach((row) => {
      row.leadIds.forEach((leadId) => ownerMap.set(leadId, row.memberName));
    });

    setLeadsData((current) => current.map((lead) => (
      ownerMap.has(lead.id)
        ? { ...lead, owner: ownerMap.get(lead.id)!, status: '배정됨', next_action: '전화' }
        : lead
    )));
    setSelectMode(false);
    setSelectedIds(new Set());
    setSelectedMemberIds(new Set());
    setShowDistributionPreview(false);
    toast.success('균등 배분이 완료되었습니다.');
  };

  const handleReferralHandoff = () => {
    toast.success('소개DB: 소개자 동일 영업직원에게 미팅 인계됨');
  };

  const handleDrawerPrimaryAction = () => {
    if (!selectedLead) return;

    if (selectedLead.dbCategory === 'referral') {
      handleReferralHandoff();
      setSelectedLead(null);
      return;
    }

    toast.success('상담원 배정 준비가 완료되었습니다.');
  };

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
          {isReferralTab ? (
            <Button variant="outline" onClick={handleReferralHandoff}>
              미팅 인계
            </Button>
          ) : (
            <Button variant="outline" onClick={toggleSelectMode}>
              {selectMode ? '선택 취소' : '상담원 배정'}
            </Button>
          )}
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-600 hover:bg-slate-50 cursor-pointer">
            <Filter size={16} /> 필터
          </div>
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
        {DB_FILTER_TABS.map(tab => {
          const count = dbCounts[tab.key];
          const isUnassigned = tab.key === '미배정';
          return (
            <button
              key={tab.key}
              onClick={() => {
                setDbFilter(tab.key);
                setSelectedIds(new Set());
                setSelectedMemberIds(new Set());
                setShowDistributionPreview(false);
                setShowBatchModal(false);
                setBatchAssignee('');
                if (tab.key === '소개DB') {
                  setSelectMode(false);
                }
              }}
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
                isUnassigned && count > 0
                  ? dbFilter === tab.key ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-600'
                  : dbFilter === tab.key ? 'bg-[#1e293b] text-white' : 'bg-slate-100 text-slate-400'
              )}>
                {isUnassigned ? `${count}건` : count}
              </span>
            </button>
          );
        })}
      </div>

      {selectMode && !isReferralTab && (
        <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-[#1e293b]">균등 배분 모드</div>
              <div className="mt-1 text-xs text-slate-500">{selectedIds.size}건 선택됨</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handlePreviewDistribution}>
                배분 미리보기
              </Button>
              <Button onClick={handleConfirmDistribution} disabled={distributionPreview.length === 0}>
                배분 확정
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-bold text-slate-600 mb-3">콜팀원 선택</div>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                {MOCK_CALL_MEMBERS.map((member) => {
                  const selected = selectedMemberIds.has(member.id);
                  return (
                    <button
                      key={member.id}
                      onClick={() => toggleMemberSelect(member.id)}
                      className={clsx(
                        'px-3 py-1.5 rounded-full text-xs font-bold border transition-colors',
                        selected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                      )}
                    >
                      {member.name}
                      <span className={clsx('ml-1.5', selected ? 'text-blue-200' : 'text-slate-400')}>
                        {member.currentCount}건
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-bold text-slate-600 mb-3">배분 미리보기</div>
              {showDistributionPreview && distributionPreview.length > 0 ? (
                <div className="overflow-auto max-h-64 rounded-lg border border-slate-200">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-500 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">배정자</th>
                        <th className="px-3 py-2 text-left font-medium">접수ID</th>
                        <th className="px-3 py-2 text-left font-medium">고객명</th>
                        <th className="px-3 py-2 text-left font-medium">DB유형</th>
                        <th className="px-3 py-2 text-left font-medium">지역</th>
                        <th className="px-3 py-2 text-left font-medium">접수일</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {distributionPreview.map((row) =>
                        row.leadIds.map((leadId, idx) => {
                          const lead = leadsData.find(l => l.id === leadId);
                          if (!lead) return null;
                          return (
                            <tr key={leadId}>
                              <td className="px-3 py-2 font-medium text-slate-700">
                                {idx === 0 ? (
                                  <span className="inline-flex items-center gap-1">
                                    {row.memberName}
                                    <span className="text-slate-400">({row.assignedCount}건)</span>
                                  </span>
                                ) : null}
                              </td>
                              <td className="px-3 py-2 font-mono text-slate-500">{lead.id}</td>
                              <td className="px-3 py-2 font-medium text-slate-700">{lead.name}</td>
                              <td className="px-3 py-2">
                                <span className={clsx("px-1.5 py-0.5 rounded text-[10px] font-bold border", getDisplayDbType(lead.dbCategory).className)}>
                                  {getDisplayDbType(lead.dbCategory).label}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-slate-600">{lead.region}</td>
                              <td className="px-3 py-2 text-slate-500">{lead.date.slice(0, 10)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-400">
                  접수건과 팀원을 선택한 뒤 배분 미리보기를 실행하세요.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* List Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 sticky top-0">
            <tr>
              {selectMode && (
                <th className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredLeads.length && filteredLeads.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300"
                  />
                </th>
              )}
              <th className="px-6 py-3 font-medium">신청ID / 일시</th>
              <th className="px-6 py-3 font-medium">유입 채널</th>
              <th className="px-6 py-3 font-medium">고객명</th>
              <th className="px-6 py-3 font-medium">DB유형</th>
              <th className="px-6 py-3 font-medium">나이</th>
              <th className="px-6 py-3 font-medium">신청 지역</th>
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
                {selectMode && (
                  <td className="px-3 py-4" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded border-slate-300"
                    />
                  </td>
                )}
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
                  <span className={clsx("inline-flex px-2 py-0.5 rounded text-xs font-bold border", getDisplayDbType(item.dbCategory).className)}>
                    {getDisplayDbType(item.dbCategory).label}
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
                   <div className="flex flex-col gap-0.5">
                      <span className={clsx("flex items-center gap-1 text-[10px] font-medium", item.marketing_consent ? "text-green-700" : "text-slate-400")}>
                        <span className={clsx("size-1.5 rounded-full shrink-0", item.marketing_consent ? "bg-green-500" : "bg-slate-300")} />
                        마케
                      </span>
                      <span className={clsx("flex items-center gap-1 text-[10px] font-medium", item.terms_consent ? "text-green-700" : "text-slate-400")}>
                        <span className={clsx("size-1.5 rounded-full shrink-0", item.terms_consent ? "bg-green-500" : "bg-slate-300")} />
                        개인
                      </span>
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
                     onClick={handleDrawerPrimaryAction}
                     className="px-6 py-2 bg-[#0f766e] text-white rounded-lg text-sm font-medium hover:bg-[#0d6b63] shadow-sm flex items-center gap-2 transition-colors"
                  >
                     {selectedLead.dbCategory === 'referral' ? '미팅 인계' : '상담원 배정'} <ArrowRight size={16} />
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
