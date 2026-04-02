import React, { useMemo, useState } from 'react';
import { 
  Search, 
  Filter, 
  UserPlus, 
  MoreHorizontal, 
  ShieldCheck, 
  User, 
  Users, 
  ArrowRight,
  Gift,
  Link,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Crown,
  Share2,
  Eye,
  Edit,
  Mail,
  Smartphone,
  Hash,
  Megaphone,
  UserCheck
} from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { CustomerDetail } from '@/app/pages/CustomerDetail';

import { IntroductionRegisterModal } from '@/app/components/IntroductionRegisterModal';
import { ListPeriodControls } from '@/app/components/ListPeriodControls';
import {
  filterRowsByPeriod,
  getDefaultCustomPeriodRange,
  getPerformancePeriodRange,
  getRowsDateBounds,
  type PerformancePeriodRange,
  type PerformancePeriodPreset,
} from '@/app/issuance/performancePeriodUtils';

// --- Types & Mock Data ---

type MemberGrade = 'GENERAL' | 'VIP';

interface Member {
  id: string; // USER_ID (Long number string)
  name: string;
  phone: string;
  email: string;
  grade: MemberGrade;
  designerCode: string | null; // 설계사 코드
  manager: string | null; // 담당 설계사 (보상파트너)
  refundCount: number; // 3년 청구 건수
  integrations: {
    hometax: boolean;
    hira: boolean; // 심평원
    nhis: boolean; // 건보
    credit4u: boolean;
  };
  activity: {
    family: number;
    claim: number;
    inquiry: number;
  };
  joinedAt: string; // YYYY.MM.DD
  
  // Inflow Data
  inflow: {
    type: 'UTM' | 'INTRODUCTION' | 'ORGANIC';
    source?: string;
    campaign?: string;
    introducer?: string;
    relation?: string;
  };
  
  // Legacy fields (kept for compatibility if needed elsewhere)
  referrer: string | null;
  referralCount: number;
  lastLogin: string;
}

interface ReferralPending {
  id: string;
  targetName: string; // 피소개자 (가입 예정)
  targetPhone: string;
  referrerName: string; // 소개자 (기존 고객)
  referrerId: string;
  assignedManager: string; // 자동 배정될 담당자
  registeredAt: string;
  status: 'PENDING' | 'MATCHED'; // 대기중 | 가입매칭완료
}

const MOCK_MEMBERS: Member[] = [
  { 
    id: '4706181030', name: '임준영', phone: '010-9275-5449', email: 'joonyounglim@kakao.com',
    grade: 'VIP', designerCode: 'XU3L53', manager: '김동현', 
    refundCount: 2,
    integrations: { hometax: true, hira: true, nhis: true, credit4u: true },
    activity: { family: 1, claim: 3, inquiry: 0 },
    joinedAt: '2026.01.20', 
    inflow: { type: 'UTM', source: 'facebook', campaign: 'cpc_retargeting_v2' },
    referrer: null, referralCount: 0, lastLogin: '2026-01-25 10:30' 
  },
  { 
    id: '2955846618', name: '인슈고객테스트', phone: '010-8616-0445', email: 'kazuya023@kakao.com',
    grade: 'GENERAL', designerCode: '9N5C6K', manager: '보험설계사TEST', 
    refundCount: 0,
    integrations: { hometax: false, hira: false, nhis: false, credit4u: false }, 
    activity: { family: 0, claim: 5, inquiry: 1 },
    joinedAt: '2024.03.23', 
    inflow: { type: 'INTRODUCTION', introducer: '박지성', relation: '지인' },
    referrer: null, referralCount: 0, lastLogin: '2026-01-24 14:20' 
  },
  { 
    id: '5844219033', name: '김철수', phone: '010-1234-5678', email: 'chulsoo.kim@gmail.com',
    grade: 'VIP', designerCode: 'D-PARK', manager: '박미팅', 
    refundCount: 5,
    integrations: { hometax: true, hira: true, nhis: false, credit4u: true },
    activity: { family: 2, claim: 12, inquiry: 3 },
    joinedAt: '2023.11.05', 
    inflow: { type: 'ORGANIC' },
    referrer: null, referralCount: 12, lastLogin: '2026-01-25 09:00' 
  },
  { 
    id: '1102938475', name: '최유리', phone: '010-3333-7777', email: 'yuri.choi@naver.com',
    grade: 'GENERAL', designerCode: null, manager: null, 
    refundCount: 0,
    integrations: { hometax: true, hira: false, nhis: true, credit4u: false },
    activity: { family: 0, claim: 0, inquiry: 1 },
    joinedAt: '2026.01.24', 
    inflow: { type: 'UTM', source: 'naver_blog', campaign: 'content_marketing_Jan' },
    referrer: '이영희', referralCount: 0, lastLogin: '2026-01-24 11:00' 
  },
  { 
    id: '9988776655', name: '정민우', phone: '010-9999-8888', email: 'minwoo.jung@daum.net',
    grade: 'VIP', designerCode: 'D-CHOI', manager: '최미팅', 
    refundCount: 1,
    integrations: { hometax: true, hira: true, nhis: true, credit4u: true },
    activity: { family: 1, claim: 1, inquiry: 0 },
    joinedAt: '2026.01.10', 
    inflow: { type: 'INTRODUCTION', introducer: '이영희', relation: '가족' },
    referrer: '이영희', referralCount: 1, lastLogin: '2026-01-23 16:45' 
  },
  { 
    id: '2039485771', name: '윤서연', phone: '010-4421-1882', email: 'seoyeon.yoon@gmail.com',
    grade: 'GENERAL', designerCode: 'SEOUL-07', manager: '문상담',
    refundCount: 2,
    integrations: { hometax: true, hira: true, nhis: false, credit4u: true },
    activity: { family: 0, claim: 2, inquiry: 1 },
    joinedAt: '2026.03.11',
    inflow: { type: 'UTM', source: 'instagram', campaign: 'march_refund' },
    referrer: null, referralCount: 0, lastLogin: '2026-03-12 09:10'
  },
  {
    id: '6028113490', name: '조민호', phone: '010-2291-7708', email: 'minho.jo@naver.com',
    grade: 'VIP', designerCode: 'GYEONGGI-02', manager: '김상담',
    refundCount: 4,
    integrations: { hometax: true, hira: true, nhis: true, credit4u: true },
    activity: { family: 1, claim: 4, inquiry: 0 },
    joinedAt: '2026.03.05',
    inflow: { type: 'ORGANIC' },
    referrer: null, referralCount: 0, lastLogin: '2026-03-11 20:15'
  },
  {
    id: '7311590048', name: '한수진', phone: '010-7741-6250', email: 'sujin.han@daum.net',
    grade: 'GENERAL', designerCode: 'ICN-01', manager: '박미팅',
    refundCount: 1,
    integrations: { hometax: true, hira: false, nhis: true, credit4u: false },
    activity: { family: 0, claim: 1, inquiry: 2 },
    joinedAt: '2026.02.27',
    inflow: { type: 'INTRODUCTION', introducer: '임준영', relation: '직장동료' },
    referrer: '임준영', referralCount: 0, lastLogin: '2026-03-10 13:20'
  },
  {
    id: '4410372859', name: '오태윤', phone: '010-8188-2234', email: 'taeyoon.oh@gmail.com',
    grade: 'GENERAL', designerCode: null, manager: '이팀장',
    refundCount: 0,
    integrations: { hometax: false, hira: false, nhis: false, credit4u: false },
    activity: { family: 0, claim: 0, inquiry: 3 },
    joinedAt: '2026.02.14',
    inflow: { type: 'UTM', source: 'google', campaign: 'simple_claims_brand' },
    referrer: null, referralCount: 0, lastLogin: '2026-02-20 10:05'
  },
  {
    id: '1882097741', name: '서지민', phone: '010-6055-1187', email: 'jimin.seo@kakao.com',
    grade: 'VIP', designerCode: 'SEOUL-12', manager: '최미팅',
    refundCount: 6,
    integrations: { hometax: true, hira: true, nhis: true, credit4u: true },
    activity: { family: 3, claim: 9, inquiry: 1 },
    joinedAt: '2026.01.29',
    inflow: { type: 'INTRODUCTION', introducer: '정민우', relation: '친척' },
    referrer: '정민우', referralCount: 2, lastLogin: '2026-03-08 18:30'
  },
  {
    id: '5058271940', name: '임도현', phone: '010-9012-4752', email: 'dohyun.lim@gmail.com',
    grade: 'VIP', designerCode: 'SEOUL-09', manager: '문상담',
    refundCount: 3,
    integrations: { hometax: true, hira: true, nhis: false, credit4u: true },
    activity: { family: 1, claim: 5, inquiry: 1 },
    joinedAt: '2026.01.12',
    inflow: { type: 'ORGANIC' },
    referrer: null, referralCount: 0, lastLogin: '2026-03-07 08:40'
  },
  {
    id: '2746109358', name: '문가은', phone: '010-3365-7120', email: 'gaeun.moon@naver.com',
    grade: 'GENERAL', designerCode: 'SEOUL-13', manager: '김상담',
    refundCount: 2,
    integrations: { hometax: true, hira: false, nhis: true, credit4u: false },
    activity: { family: 0, claim: 2, inquiry: 0 },
    joinedAt: '2025.12.19',
    inflow: { type: 'UTM', source: 'naver_blog', campaign: 'winter_content' },
    referrer: null, referralCount: 0, lastLogin: '2026-02-28 21:00'
  },
  {
    id: '8871034421', name: '최하늘', phone: '010-6622-1993', email: 'haneul.choi@gmail.com',
    grade: 'VIP', designerCode: 'SEOUL-04', manager: '박미팅',
    refundCount: 7,
    integrations: { hometax: true, hira: true, nhis: true, credit4u: true },
    activity: { family: 2, claim: 11, inquiry: 0 },
    joinedAt: '2025.10.07',
    inflow: { type: 'UTM', source: 'facebook', campaign: 'vip_claims_retention' },
    referrer: null, referralCount: 4, lastLogin: '2026-03-12 07:50'
  },
];

const MOCK_REFERRALS: ReferralPending[] = [
  {
    id: 'R-001', targetName: '강호동', targetPhone: '010-7777-1111',
    referrerName: '임준영', referrerId: '4706181030', assignedManager: '김동현',
    registeredAt: '2026-01-24', status: 'PENDING'
  },
  {
    id: 'R-002', targetName: '유재석', targetPhone: '010-8888-2222',
    referrerName: '김철수', referrerId: '5844219033', assignedManager: '박미팅',
    registeredAt: '2026-01-23', status: 'MATCHED'
  },
  {
    id: 'R-003', targetName: '윤도경', targetPhone: '010-2211-6644',
    referrerName: '윤서연', referrerId: '2039485771', assignedManager: '문상담',
    registeredAt: '2026-03-10', status: 'PENDING'
  },
  {
    id: 'R-004', targetName: '한도윤', targetPhone: '010-9912-3400',
    referrerName: '조민호', referrerId: '6028113490', assignedManager: '김상담',
    registeredAt: '2026-03-03', status: 'MATCHED'
  },
  {
    id: 'R-005', targetName: '오지은', targetPhone: '010-4722-1001',
    referrerName: '한수진', referrerId: '7311590048', assignedManager: '박미팅',
    registeredAt: '2026-02-25', status: 'PENDING'
  },
  {
    id: 'R-006', targetName: '임유나', targetPhone: '010-6401-2231',
    referrerName: '서지민', referrerId: '1882097741', assignedManager: '최미팅',
    registeredAt: '2026-02-13', status: 'MATCHED'
  },
  {
    id: 'R-007', targetName: '최우람', targetPhone: '010-8812-9923',
    referrerName: '최하늘', referrerId: '8871034421', assignedManager: '박미팅',
    registeredAt: '2025-12-21', status: 'PENDING'
  }
];

// --- Components ---

export function Customers({ initialCustomerId, onNavigate }: { initialCustomerId?: string | null, onNavigate?: (path: string) => void }) {
  const [activeTab, setActiveTab] = useState<'members' | 'referrals'>('members');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isIntroModalOpen, setIsIntroModalOpen] = useState(false);
  const defaultCustomPeriodRange = useMemo(() => getDefaultCustomPeriodRange(), []);
  const [periodPreset, setPeriodPreset] = useState<PerformancePeriodPreset>('all');
  const [customPeriodStartDate, setCustomPeriodStartDate] = useState(defaultCustomPeriodRange.startDate);
  const [customPeriodEndDate, setCustomPeriodEndDate] = useState(defaultCustomPeriodRange.endDate);
  const allRange = useMemo(
    () =>
      activeTab === 'members'
        ? getRowsDateBounds(MOCK_MEMBERS, (member) => member.joinedAt, defaultCustomPeriodRange)
        : getRowsDateBounds(MOCK_REFERRALS, (item) => item.registeredAt, defaultCustomPeriodRange),
    [activeTab, defaultCustomPeriodRange]
  );

  const periodRange = useMemo(
    () => getPerformancePeriodRange(periodPreset, customPeriodStartDate, customPeriodEndDate, new Date(), allRange),
    [allRange, customPeriodEndDate, customPeriodStartDate, periodPreset]
  );

  // If a member is selected, show the detail view
  if (selectedMember) {
    return (
      <div className="h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <CustomerDetail 
          lead={{
            name: selectedMember.name,
            phone: selectedMember.phone,
            manager: selectedMember.manager || '미배정',
          }} 
          onBack={() => setSelectedMember(null)} 
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Modal */}
      <IntroductionRegisterModal 
        isOpen={isIntroModalOpen} 
        onClose={() => setIsIntroModalOpen(false)} 
      />

      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-[#1e293b] tracking-tight">회원 및 소개 관리</h2>
            <p className="text-xs text-slate-400 mt-1 font-light">전체 회원 데이터 및 소개 네트워크 현황</p>
          </div>
          <div className="flex gap-2">
             {activeTab === 'referrals' && (
                <button 
                  onClick={() => setIsIntroModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#1e293b] text-white text-xs font-medium rounded hover:bg-slate-800 transition-colors"
                >
                   <UserPlus size={14} /> 소개 DB 등록
                </button>
             )}
          </div>
        </div>

        {/* Tab Navigation & Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-6 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('members')}
              className={clsx(
                "pb-2 text-sm font-medium transition-colors relative",
                activeTab === 'members' 
                  ? "text-[#1e293b] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#1e293b]" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              전체 회원 목록
              <span className="ml-1.5 text-xs text-slate-400 font-normal">{MOCK_MEMBERS.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('referrals')}
              className={clsx(
                "pb-2 text-sm font-medium transition-colors relative",
                activeTab === 'referrals' 
                  ? "text-[#1e293b] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#1e293b]" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              소개/대기 관리
              <span className="ml-1.5 text-xs text-slate-400 font-normal">{MOCK_REFERRALS.length}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 w-full">
            <div className="relative flex-1 min-w-[240px] sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="검색어 입력..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border-none rounded text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200 transition-all"
              />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors">
              <Filter size={14} /> 필터
            </button>
            <ListPeriodControls
              preset={periodPreset}
              range={periodRange}
              onPresetChange={setPeriodPreset}
              onStartDateChange={setCustomPeriodStartDate}
              onEndDateChange={setCustomPeriodEndDate}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-white p-6">
        {activeTab === 'members' ? (
           <MembersTable
             searchTerm={searchTerm}
             onMemberClick={setSelectedMember}
             periodRange={periodRange}
           />
        ) : (
           <ReferralsTable searchTerm={searchTerm} periodRange={periodRange} />
        )}
      </div>
    </div>
  );
}

// --- Tab 1: Members Table ---

function MembersTable({
  searchTerm,
  onMemberClick,
  periodRange,
}: {
  searchTerm: string;
  onMemberClick: (member: Member) => void;
  periodRange: PerformancePeriodRange;
}) {
   const [filterGrade, setFilterGrade] = useState<'ALL' | 'VIP' | 'GENERAL'>('ALL');

   const filteredMembers = filterRowsByPeriod(MOCK_MEMBERS, periodRange, (member) => member.joinedAt).filter(m => {
      // 1. Search Filter
      const matchesSearch = 
         m.name.includes(searchTerm) || 
         m.phone.includes(searchTerm) || 
         m.email.includes(searchTerm) ||
         (m.manager && m.manager.includes(searchTerm)) ||
         (m.inflow.source && m.inflow.source.includes(searchTerm)) ||
         (m.inflow.introducer && m.inflow.introducer.includes(searchTerm));
      
      // 2. Grade Filter
      const matchesGrade = filterGrade === 'ALL' || m.grade === filterGrade;

      return matchesSearch && matchesGrade;
   });

   // Counts for tabs
   const countAll = MOCK_MEMBERS.length;
   const countVip = MOCK_MEMBERS.filter(m => m.grade === 'VIP').length;
   const countGeneral = MOCK_MEMBERS.filter(m => m.grade === 'GENERAL').length;

   return (
      <div className="space-y-6">
         {/* Minimal Filter Tabs */}
         <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-lg w-fit">
            <button
               onClick={() => setFilterGrade('ALL')}
               className={clsx(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  filterGrade === 'ALL'
                     ? "bg-white text-[#1e293b] shadow-sm"
                     : "text-slate-400 hover:text-slate-600"
               )}
            >
               전체 {countAll}
            </button>
            <button
               onClick={() => setFilterGrade('VIP')}
               className={clsx(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  filterGrade === 'VIP'
                     ? "bg-white text-[#1e293b] shadow-sm"
                     : "text-slate-400 hover:text-slate-600"
               )}
            >
               VIP {countVip}
            </button>
            <button
               onClick={() => setFilterGrade('GENERAL')}
               className={clsx(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  filterGrade === 'GENERAL'
                     ? "bg-white text-[#1e293b] shadow-sm"
                     : "text-slate-400 hover:text-slate-600"
               )}
            >
               일반 {countGeneral}
            </button>
         </div>

         {/* Minimal Table */}
         <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[1000px]">
               <thead>
                  <tr className="border-b border-slate-100">
                     <th className="px-4 py-3 font-medium text-slate-400 w-24">이름</th>
                     <th className="px-4 py-3 font-medium text-slate-400 w-32">전화번호</th>
                     <th className="px-4 py-3 font-medium text-slate-400 w-32">보상파트너</th>
                     <th className="px-4 py-3 font-medium text-slate-400 w-36">유입 구분</th>
                     <th className="px-4 py-3 font-medium text-slate-400 w-48">연동현황</th>
                     <th className="px-4 py-3 font-medium text-slate-400 w-32">활동현황</th>
                     <th className="px-4 py-3 font-medium text-slate-400 w-24">가입일</th>
                     <th className="px-4 py-3 font-medium text-slate-400 text-right w-24">관리</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {filteredMembers.map((member) => (
                     <tr 
                        key={member.id} 
                        className="group hover:bg-slate-50/50 transition-colors"
                        onClick={() => onMemberClick(member)}
                     >
                        <td className="px-4 py-4 whitespace-nowrap">
                           <div className="font-bold text-[#1e293b]">{member.name}</div>
                        </td>
                        <td className="px-4 py-4 text-slate-600 whitespace-nowrap">{member.phone}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                           {member.manager ? (
                              <div>
                                 <div className="font-medium text-[#1e293b]">{member.manager}</div>
                                 <div className="text-slate-300 text-[10px] uppercase font-mono">{member.designerCode}</div>
                              </div>
                           ) : (
                              <span className="text-slate-300">-</span>
                           )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                           {member.inflow.type === 'UTM' ? (
                              <div className="flex flex-col">
                                 <div className="flex items-center gap-1.5">
                                    <Megaphone size={12} className="text-blue-500" />
                                    <span className="font-bold text-slate-700">{member.inflow.source}</span>
                                 </div>
                                 <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{member.inflow.campaign}</span>
                              </div>
                           ) : member.inflow.type === 'INTRODUCTION' ? (
                              <div className="flex flex-col">
                                 <div className="flex items-center gap-1.5">
                                    <UserCheck size={12} className="text-emerald-500" />
                                    <span className="font-bold text-slate-700">{member.inflow.introducer}</span>
                                 </div>
                                 <span className="text-[10px] text-slate-400">관계: {member.inflow.relation}</span>
                              </div>
                           ) : (
                              <span className="text-slate-400 text-[11px]">직접 방문 (Organic)</span>
                           )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                           <div className="flex items-center gap-3 text-[11px]">
                              <span className={clsx("font-medium transition-colors", member.integrations.hometax ? "text-[#1e293b]" : "text-slate-200 decoration-slate-200 line-through")}>홈택스</span>
                              <span className={clsx("font-medium transition-colors", member.integrations.hira ? "text-[#1e293b]" : "text-slate-200 decoration-slate-200 line-through")}>심평원</span>
                              <span className={clsx("font-medium transition-colors", member.integrations.nhis ? "text-[#1e293b]" : "text-slate-200 decoration-slate-200 line-through")}>건보</span>
                              <span className={clsx("font-medium transition-colors", member.integrations.credit4u ? "text-[#1e293b]" : "text-slate-200 decoration-slate-200 line-through")}>C4U</span>
                           </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                           <div className="flex items-center gap-2">
                              {member.activity.family > 0 && (
                                 <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">가족 {member.activity.family}</span>
                              )}
                              {member.activity.claim > 0 && (
                                 <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">청구 {member.activity.claim}</span>
                              )}
                              {member.activity.inquiry > 0 && (
                                 <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">문의 {member.activity.inquiry}</span>
                              )}
                              {member.activity.family === 0 && member.activity.claim === 0 && member.activity.inquiry === 0 && (
                                 <span className="text-slate-300 text-[10px]">-</span>
                              )}
                           </div>
                        </td>
                        <td className="px-4 py-4 text-slate-500 whitespace-nowrap">{member.joinedAt}</td>
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                           <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                 className="size-7 rounded border border-slate-200 text-slate-400 hover:text-[#1e293b] hover:border-[#1e293b] flex items-center justify-center transition-all bg-white"
                                 title="상세보기"
                                 onClick={(e) => { e.stopPropagation(); onMemberClick(member); }}
                              >
                                 <Eye size={14} />
                              </button>
                              <button 
                                 className="size-7 rounded border border-slate-200 text-slate-400 hover:text-[#1e293b] hover:border-[#1e293b] flex items-center justify-center transition-all bg-white"
                                 title="수정하기"
                                 onClick={(e) => { e.stopPropagation(); onMemberClick(member); }}
                              >
                                 <Edit size={14} />
                              </button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   );
}

// --- Tab 2: Referrals Table ---

function ReferralsTable({
  searchTerm,
  periodRange,
}: {
  searchTerm: string;
  periodRange: PerformancePeriodRange;
}) {
   const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'MATCHED'>('ALL');

   const filteredReferrals = filterRowsByPeriod(MOCK_REFERRALS, periodRange, (item) => item.registeredAt).filter(r => {
      // 1. Search Filter
      const matchesSearch = r.targetName.includes(searchTerm) || r.referrerName.includes(searchTerm);
      
      // 2. Status Filter
      const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;

      return matchesSearch && matchesStatus;
   });

   // Counts
   const countAll = MOCK_REFERRALS.length;
   const countPending = MOCK_REFERRALS.filter(r => r.status === 'PENDING').length;
   const countMatched = MOCK_REFERRALS.filter(r => r.status === 'MATCHED').length;

   return (
      <div className="space-y-6">
         {/* Info Box - Minimal */}
         <div className="bg-slate-50 p-4 rounded-lg flex items-start gap-3">
            <div className="p-1 bg-white rounded shadow-sm text-slate-800">
               <AlertCircle size={14} />
            </div>
            <div>
               <h3 className="text-sm font-bold text-[#1e293b]">자동 배정 시스템</h3>
               <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  기존 고객이 지인을 등록하면, 가입 시 담당자가 <span className="text-[#1e293b] font-medium underline decoration-slate-300">자동으로 매칭</span>됩니다.
               </p>
            </div>
         </div>

         {/* Minimal Filter Tabs */}
         <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-lg w-fit">
            <button
               onClick={() => setFilterStatus('ALL')}
               className={clsx(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  filterStatus === 'ALL'
                     ? "bg-white text-[#1e293b] shadow-sm"
                     : "text-slate-400 hover:text-slate-600"
               )}
            >
               전체 {countAll}
            </button>
            <button
               onClick={() => setFilterStatus('PENDING')}
               className={clsx(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  filterStatus === 'PENDING'
                     ? "bg-white text-[#1e293b] shadow-sm"
                     : "text-slate-400 hover:text-slate-600"
               )}
            >
               가입 대기 {countPending}
            </button>
            <button
               onClick={() => setFilterStatus('MATCHED')}
               className={clsx(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  filterStatus === 'MATCHED'
                     ? "bg-white text-[#1e293b] shadow-sm"
                     : "text-slate-400 hover:text-slate-600"
               )}
            >
               매칭 완료 {countMatched}
            </button>
         </div>

         {/* Table */}
         <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[800px]">
               <thead>
                  <tr className="border-b border-slate-100">
                     <th className="px-4 py-3 font-medium text-slate-400 w-32">등록일</th>
                     <th className="px-4 py-3 font-medium text-slate-400">피소개자</th>
                     <th className="px-4 py-3 font-medium text-slate-400">소개자</th>
                     <th className="px-4 py-3 font-medium text-slate-400">배정 담당자</th>
                     <th className="px-4 py-3 font-medium text-slate-400">상태</th>
                     <th className="px-4 py-3 font-medium text-slate-400 text-right">관리</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {filteredReferrals.map((item) => (
                     <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-4 py-4 text-slate-500 font-mono whitespace-nowrap">{item.registeredAt}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                           <div className="font-bold text-[#1e293b] flex items-center gap-2">
                              {item.targetName}
                           </div>
                           <div className="text-slate-400 mt-0.5 flex items-center gap-1 font-light">
                              {item.targetPhone}
                           </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                           <div className="font-medium text-[#1e293b]">
                              {item.referrerName}
                           </div>
                           <div className="text-slate-300 text-[10px] mt-0.5 font-mono">
                              {item.referrerId}
                           </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                           <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2 py-1 rounded w-fit text-[11px] border border-slate-100">
                              <ShieldCheck size={12} className="text-slate-400" />
                              <span className="font-medium">{item.assignedManager}</span>
                           </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                           {item.status === 'PENDING' ? (
                              <span className="text-slate-400 font-medium text-[11px]">
                                 가입 대기중
                              </span>
                           ) : (
                              <span className="text-[#1e293b] font-bold text-[11px] flex items-center gap-1">
                                 <CheckCircle2 size={12} /> 매칭 완료
                              </span>
                           )}
                        </td>
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                           <button className="text-slate-300 hover:text-[#1e293b] p-1.5 rounded hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal size={16} />
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
