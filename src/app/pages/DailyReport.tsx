import React, { useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Users,
  Phone,
  ArrowRightLeft,
  XCircle,
  Clock,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Send,
  AlertCircle,
  AlertTriangle,
  PhoneOff,
  UserCheck,
  Briefcase,
  FileWarning,
  ClipboardCheck,
  Star,
  Building2,
  MessageSquare,
  CheckCircle,
} from 'lucide-react';
import clsx from 'clsx';

// --- Mock Data ---

const TODAY = '2026-03-07';

// 팀원별 성과 데이터
const TEAM_MEMBERS = [
  { 
    id: 'M1', name: '김상담', role: '팀원',
    allocated: 25, used: 22, remaining: 3,
    firstTM: 18, secondTM: 12, thirdTM: 8,
    handoff: 6, cancel: 3, absent: 4, managing: 2,
    handoffRate: 75.0,
  },
  { 
    id: 'M2', name: '이원이', role: '팀원',
    allocated: 20, used: 18, remaining: 2,
    firstTM: 15, secondTM: 10, thirdTM: 7,
    handoff: 5, cancel: 2, absent: 3, managing: 1,
    handoffRate: 71.4,
  },
  { 
    id: 'M3', name: '박하준', role: '팀원',
    allocated: 22, used: 20, remaining: 2,
    firstTM: 16, secondTM: 9, thirdTM: 6,
    handoff: 4, cancel: 4, absent: 5, managing: 3,
    handoffRate: 66.7,
  },
  { 
    id: 'M4', name: '최주원', role: '수습',
    allocated: 15, used: 12, remaining: 3,
    firstTM: 10, secondTM: 5, thirdTM: 3,
    handoff: 2, cancel: 2, absent: 4, managing: 2,
    handoffRate: 66.7,
  },
];

// 취소 사유별 집계
const CANCEL_REASONS = [
  { reason: '수수료 부담', count: 5, trend: 'up' as const },
  { reason: '단순 변심/무응답', count: 3, trend: 'same' as const },
  { reason: '가족/지인 반대', count: 2, trend: 'down' as const },
  { reason: '기존 설계사 관계', count: 2, trend: 'up' as const },
  { reason: '시간 부족', count: 1, trend: 'same' as const },
];

// 인계 완료 목록
const HANDOFF_LIST = [
  { id: 'H-001', customer: '이영희', type: '3년 환급', manager: '김상담', salesManager: '박영업', meetingDate: '2026-03-09 14:00', location: '서울 강남', estimatedRefund: '2,500,000', status: '확정' },
  { id: 'H-002', customer: '김철수', type: '3년 환급', manager: '이원이', salesManager: '최영업', meetingDate: '2026-03-09 16:00', location: '경기 수원', estimatedRefund: '1,800,000', status: '확정' },
  { id: 'H-003', customer: '박지성', type: '간편 청구', manager: '김상담', salesManager: '박영업', meetingDate: '2026-03-10 10:00', location: '서울 송파', estimatedRefund: '950,000', status: '조율중' },
  { id: 'H-004', customer: '홍길동', type: '3년 환급', manager: '박하준', salesManager: '김영업', meetingDate: '2026-03-10 14:00', location: '부산 해운대', estimatedRefund: '3,200,000', status: '확정' },
];

// 부재건 현황
const ABSENT_STATUS = [
  { id: 'A-001', customer: '최수빈', phone: '010-2323-2342', manager: '김상담', absentCount: 3, lastAttempt: '2026-03-07 11:30', alimtalkSent: true, note: '오후 통화 요청' },
  { id: 'A-002', customer: '오지윤', phone: '010-9191-8923', manager: '박하준', absentCount: 5, lastAttempt: '2026-03-07 10:15', alimtalkSent: true, note: '' },
  { id: 'A-003', customer: '신도윤', phone: '010-2985-9522', manager: '최주원', absentCount: 2, lastAttempt: '2026-03-07 09:45', alimtalkSent: false, note: '내일 재시도' },
  { id: 'A-004', customer: '윤하린', phone: '010-2349-2134', manager: '이원이', absentCount: 4, lastAttempt: '2026-03-06 17:30', alimtalkSent: true, note: '콜백 대기' },
];

// 관리 필요 고객
const MANAGING_CUSTOMERS = [
  { id: 'MG-001', customer: '장진숙', manager: '김상담', reason: '가족 상의 후 재연락 요청', requestedTime: '2026-03-10 오전', status: '대기' },
  { id: 'MG-002', customer: '김민준', manager: '박하준', reason: '지방 거주 - 방문 일정 조율 필요', requestedTime: '미정', status: '조율중' },
  { id: 'MG-003', customer: '이서현', manager: '최주원', reason: '보험증권 확인 후 재상담 희망', requestedTime: '2026-03-08 오후', status: '대기' },
];

export function DailyReport() {
  const [reportDate, setReportDate] = useState(TODAY);
  const [reportType, setReportType] = useState<'mid' | 'final'>('final');
  const [activeSection, setActiveSection] = useState<'overview' | 'handoff' | 'cancel' | 'absent' | 'manage' | 'script_feedback' | 'probation' | 'tier' | 'sales_report' | 'quality'>('overview');

  // KPI Summary
  const totalAllocated = TEAM_MEMBERS.reduce((sum, m) => sum + m.allocated, 0);
  const totalUsed = TEAM_MEMBERS.reduce((sum, m) => sum + m.used, 0);
  const totalRemaining = TEAM_MEMBERS.reduce((sum, m) => sum + m.remaining, 0);
  const totalHandoff = TEAM_MEMBERS.reduce((sum, m) => sum + m.handoff, 0);
  const totalCancel = TEAM_MEMBERS.reduce((sum, m) => sum + m.cancel, 0);
  const totalAbsent = TEAM_MEMBERS.reduce((sum, m) => sum + m.absent, 0);
  const totalManaging = TEAM_MEMBERS.reduce((sum, m) => sum + m.managing, 0);
  const usageRate = ((totalUsed / totalAllocated) * 100).toFixed(1);

  const KPI_CARDS = [
    { label: '총 배정 DB', value: totalAllocated, sub: `소진 ${totalUsed} / 잔여 ${totalRemaining}`, icon: Users, accent: 'text-slate-600', bg: 'bg-slate-50' },
    { label: 'DB 소진율', value: `${usageRate}%`, sub: `${totalUsed}건 소진`, icon: TrendingUp, accent: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: '영업팀 인계', value: `${totalHandoff}건`, sub: `인계율 ${((totalHandoff / totalUsed) * 100).toFixed(1)}%`, icon: ArrowRightLeft, accent: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '취소/불가', value: `${totalCancel}건`, sub: `부재 ${totalAbsent}건`, icon: XCircle, accent: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const sections = [
    { id: 'overview' as const, label: '종합 현황', icon: BarChart3 },
    { id: 'handoff' as const, label: `인계건 (${HANDOFF_LIST.length})`, icon: ArrowRightLeft },
    { id: 'cancel' as const, label: `취소 분석 (${totalCancel})`, icon: XCircle },
    { id: 'absent' as const, label: `부재 관리 (${ABSENT_STATUS.length})`, icon: PhoneOff },
    { id: 'manage' as const, label: `관리 고객 (${MANAGING_CUSTOMERS.length})`, icon: UserCheck },
    { id: 'script_feedback' as const, label: '스크립트 피드백', icon: FileWarning },
    { id: 'probation' as const, label: '수습 평가', icon: ClipboardCheck },
    { id: 'tier' as const, label: '티어 관리', icon: Star },
    { id: 'sales_report' as const, label: '영업팀 마감', icon: Building2 },
    { id: 'quality' as const, label: '품질 피드백', icon: MessageSquare },
  ];

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="font-bold text-[#1e293b] flex items-center gap-2">
                <BarChart3 size={20} />
                일일 마감 보고
              </h2>
              <p className="text-xs text-slate-500 mt-1">상담팀 일일 성과 및 현황 리포트</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Report Type Toggle */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setReportType('mid')}
                className={clsx(
                  "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                  reportType === 'mid' ? "bg-white text-[#1e293b] shadow-sm" : "text-slate-500"
                )}
              >
                <Clock size={12} className="inline mr-1" />
                13:00 중간
              </button>
              <button
                onClick={() => setReportType('final')}
                className={clsx(
                  "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                  reportType === 'final' ? "bg-white text-[#1e293b] shadow-sm" : "text-slate-500"
                )}
              >
                <CheckCircle2 size={12} className="inline mr-1" />
                18:30 마감
              </button>
            </div>

            {/* Date Selector */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5">
              <button className="p-1 hover:bg-slate-100 rounded"><ChevronLeft size={14} /></button>
              <div className="flex items-center gap-1.5 px-2">
                <Calendar size={14} className="text-slate-400" />
                <span className="text-sm font-bold text-[#1e293b]">{reportDate}</span>
              </div>
              <button className="p-1 hover:bg-slate-100 rounded"><ChevronRight size={14} /></button>
            </div>

            {/* Actions */}
            <button className="flex items-center gap-1.5 px-3 py-2 bg-[#1e293b] text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors">
              <Send size={14} />
              보고서 전송
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">
              <Download size={14} />
              엑셀
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3">
        {KPI_CARDS.map((kpi, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{kpi.label}</p>
                <p className={clsx("text-2xl font-bold mt-1", kpi.accent)}>{kpi.value}</p>
                <p className="text-[11px] text-slate-400 mt-1">{kpi.sub}</p>
              </div>
              <div className={clsx("p-2 rounded-lg", kpi.bg)}>
                <kpi.icon size={18} className={kpi.accent} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={clsx(
              "flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold transition-all",
              activeSection === section.id
                ? "bg-[#1e293b] text-white"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            )}
          >
            <section.icon size={14} />
            {section.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeSection === 'overview' && <OverviewSection members={TEAM_MEMBERS} reportType={reportType} />}
        {activeSection === 'handoff' && <HandoffSection data={HANDOFF_LIST} />}
        {activeSection === 'cancel' && <CancelSection data={CANCEL_REASONS} />}
        {activeSection === 'absent' && <AbsentSection data={ABSENT_STATUS} />}
        {activeSection === 'manage' && <ManageSection data={MANAGING_CUSTOMERS} />}
        {activeSection === 'script_feedback' && <ScriptFeedbackSection />}
        {activeSection === 'probation' && <ProbationSection />}
        {activeSection === 'tier' && <TierManagementSection />}
        {activeSection === 'sales_report' && <SalesReportSection />}
        {activeSection === 'quality' && <QualityFeedbackSection />}
      </div>
    </div>
  );
}

// --- Sub-sections ---

function OverviewSection({ members, reportType }: { members: typeof TEAM_MEMBERS, reportType: 'mid' | 'final' }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-[#1e293b] text-sm">
            {reportType === 'mid' ? '📊 중간 보고 (13:00)' : '📊 마감 보고 (18:30)'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {reportType === 'mid' 
              ? '담당자별 2차 상담 완료건 현황' 
              : '당일 인계건, 취소건, 부재건, 관리건 종합'}
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          대표님 보고용
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium">담당자</th>
              <th className="px-4 py-3 text-center font-medium">배정 DB</th>
              <th className="px-4 py-3 text-center font-medium">소진</th>
              <th className="px-4 py-3 text-center font-medium">잔여</th>
              <th className="px-4 py-3 text-center font-medium border-l border-slate-200">1차 TM</th>
              <th className="px-4 py-3 text-center font-medium">2차 TM</th>
              <th className="px-4 py-3 text-center font-medium">3차 TM</th>
              <th className="px-4 py-3 text-center font-medium border-l border-slate-200">인계</th>
              <th className="px-4 py-3 text-center font-medium">취소</th>
              <th className="px-4 py-3 text-center font-medium">부재</th>
              <th className="px-4 py-3 text-center font-medium">관리</th>
              <th className="px-4 py-3 text-center font-medium border-l border-slate-200">인계율</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                      {m.name[0]}
                    </div>
                    <div>
                      <span className="font-bold text-[#1e293b]">{m.name}</span>
                      {m.role === '수습' && (
                        <span className="ml-1.5 text-[9px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded font-bold">수습</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-bold text-slate-700">{m.allocated}</td>
                <td className="px-4 py-3 text-center font-bold text-blue-600">{m.used}</td>
                <td className="px-4 py-3 text-center">
                  <span className={clsx(
                    "text-xs font-bold px-1.5 py-0.5 rounded",
                    m.remaining <= 2 ? "bg-rose-50 text-rose-600" : "text-slate-500"
                  )}>
                    {m.remaining}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-medium text-slate-600 border-l border-slate-100">{m.firstTM}</td>
                <td className="px-4 py-3 text-center font-medium text-slate-600">{m.secondTM}</td>
                <td className="px-4 py-3 text-center font-medium text-slate-600">{m.thirdTM}</td>
                <td className="px-4 py-3 text-center border-l border-slate-100">
                  <span className="font-bold text-emerald-600">{m.handoff}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={clsx("font-bold", m.cancel > 3 ? "text-rose-600" : "text-slate-500")}>{m.cancel}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={clsx("font-bold", m.absent > 4 ? "text-amber-600" : "text-slate-500")}>{m.absent}</span>
                </td>
                <td className="px-4 py-3 text-center text-slate-500 font-medium">{m.managing}</td>
                <td className="px-4 py-3 text-center border-l border-slate-100">
                  <span className={clsx(
                    "font-bold text-xs px-2 py-0.5 rounded",
                    m.handoffRate >= 70 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  )}>
                    {m.handoffRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          {/* Footer Totals */}
          <tfoot className="bg-slate-50 border-t-2 border-slate-200">
            <tr className="font-bold text-sm">
              <td className="px-4 py-3 text-[#1e293b]">합계</td>
              <td className="px-4 py-3 text-center">{members.reduce((s, m) => s + m.allocated, 0)}</td>
              <td className="px-4 py-3 text-center text-blue-600">{members.reduce((s, m) => s + m.used, 0)}</td>
              <td className="px-4 py-3 text-center">{members.reduce((s, m) => s + m.remaining, 0)}</td>
              <td className="px-4 py-3 text-center border-l border-slate-200">{members.reduce((s, m) => s + m.firstTM, 0)}</td>
              <td className="px-4 py-3 text-center">{members.reduce((s, m) => s + m.secondTM, 0)}</td>
              <td className="px-4 py-3 text-center">{members.reduce((s, m) => s + m.thirdTM, 0)}</td>
              <td className="px-4 py-3 text-center text-emerald-600 border-l border-slate-200">{members.reduce((s, m) => s + m.handoff, 0)}</td>
              <td className="px-4 py-3 text-center text-rose-600">{members.reduce((s, m) => s + m.cancel, 0)}</td>
              <td className="px-4 py-3 text-center text-amber-600">{members.reduce((s, m) => s + m.absent, 0)}</td>
              <td className="px-4 py-3 text-center">{members.reduce((s, m) => s + m.managing, 0)}</td>
              <td className="px-4 py-3 text-center border-l border-slate-200">
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs">
                  {((members.reduce((s, m) => s + m.handoff, 0) / members.reduce((s, m) => s + m.used, 0)) * 100).toFixed(1)}%
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 광고업체 전달 정보 */}
      <div className="px-6 py-4 border-t border-slate-200 bg-amber-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-amber-600" />
            <span className="text-xs font-bold text-amber-800">광고업체 전달 정보</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-600">당일 DB 소진량: <span className="font-bold text-[#1e293b]">{members.reduce((s, m) => s + m.used, 0)}건</span></span>
            <span className="text-slate-600">잔여 DB: <span className="font-bold text-rose-600">{members.reduce((s, m) => s + m.remaining, 0)}건</span></span>
            <span className="text-slate-600">익일 배정 예정: <span className="font-bold text-blue-600">80건</span></span>
            <button className="px-3 py-1.5 bg-amber-600 text-white rounded text-xs font-bold hover:bg-amber-700 transition-colors">
              광고업체 전달
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HandoffSection({ data }: { data: typeof HANDOFF_LIST }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-bold text-[#1e293b] text-sm">영업팀 인계 목록</h3>
        <p className="text-xs text-slate-500 mt-0.5">미팅 스케줄 확정 및 영업팀 배정 현황</p>
      </div>
      <table className="w-full text-sm">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-left font-medium">인계 ID</th>
            <th className="px-4 py-3 text-left font-medium">고객명</th>
            <th className="px-4 py-3 text-left font-medium">유형</th>
            <th className="px-4 py-3 text-left font-medium">상담 담당</th>
            <th className="px-4 py-3 text-left font-medium">영업 담당</th>
            <th className="px-4 py-3 text-left font-medium">미팅 일시</th>
            <th className="px-4 py-3 text-left font-medium">지역</th>
            <th className="px-4 py-3 text-right font-medium">예상 환급액</th>
            <th className="px-4 py-3 text-center font-medium">상태</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500">{item.id}</td>
              <td className="px-4 py-3 font-bold text-[#1e293b]">{item.customer}</td>
              <td className="px-4 py-3">
                <span className={clsx(
                  "px-2 py-0.5 rounded text-[10px] font-bold border",
                  item.type === '3년 환급' ? "bg-indigo-50 text-indigo-700 border-indigo-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                )}>
                  {item.type}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600">{item.manager}</td>
              <td className="px-4 py-3 font-bold text-blue-600">{item.salesManager}</td>
              <td className="px-4 py-3 text-slate-600 text-xs">{item.meetingDate}</td>
              <td className="px-4 py-3 text-slate-500 text-xs">{item.location}</td>
              <td className="px-4 py-3 text-right font-bold text-[#1e293b]">₩{item.estimatedRefund}</td>
              <td className="px-4 py-3 text-center">
                <span className={clsx(
                  "px-2 py-0.5 rounded text-[10px] font-bold",
                  item.status === '확정' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                )}>
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CancelSection({ data }: { data: typeof CANCEL_REASONS }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 사유별 분석 */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-[#1e293b] text-sm">취소 사유 분석</h3>
          <p className="text-xs text-slate-500 mt-0.5">사유별 증감 추이 및 피드백 포인트</p>
        </div>
        <div className="p-4 space-y-3">
          {data.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#1e293b]">{item.reason}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">{item.count}건</span>
                    <span className={clsx(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded",
                      item.trend === 'up' ? "bg-rose-50 text-rose-600" :
                      item.trend === 'down' ? "bg-emerald-50 text-emerald-600" :
                      "bg-slate-50 text-slate-500"
                    )}>
                      {item.trend === 'up' ? '↑ 증가' : item.trend === 'down' ? '↓ 감소' : '→ 유지'}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-[#1e293b] h-2 rounded-full transition-all"
                    style={{ width: `${(item.count / total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 원인 규명 & 코칭 포인트 */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-[#1e293b] text-sm">코칭 포인트</h3>
          <p className="text-xs text-slate-500 mt-0.5">관리자 5단계: 취소 원인 규명 및 개선책</p>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs font-bold text-amber-800 mb-1">수수료 부담 증가 추세</p>
            <p className="text-[11px] text-amber-700">→ 환급 완료시 후불 수수료 10% 안내 시점 및 방법 재검토 필요. 서비스 가치 설명 강화 스크립트 보완 권장.</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-bold text-blue-800 mb-1">기존 설계사 관계 건 증가</p>
            <p className="text-[11px] text-blue-700">→ 2차 TM시 설계사 관계 확인 체크포인트 강화. 친인척 관계일 경우 조기 분류하여 불필요한 상담 진행 방지.</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-xs font-bold text-slate-700 mb-1">최주원 (수습) 개선 필요</p>
            <p className="text-[11px] text-slate-600">→ 인계율 66.7%로 팀 평균 대비 저조. 2차 TM 스크립트 임의 간소화 여부 확인 및 1:1 코칭 진행 권장.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AbsentSection({ data }: { data: typeof ABSENT_STATUS }) {
  const [warnThreshold, setWarnThreshold] = useState(3);
  const [escalateThreshold, setEscalateThreshold] = useState(5);

  const warnCount = data.filter(d => d.absentCount >= warnThreshold && d.absentCount < escalateThreshold).length;
  const escalateCount = data.filter(d => d.absentCount >= escalateThreshold).length;

  return (
    <div className="space-y-4">
      {/* Threshold Config */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-sm text-[#1e293b]">부재 임계값 설정</h4>
          <div className="flex gap-3 text-xs">
            <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded border border-amber-200 font-bold">
              주의: {warnCount}건
            </span>
            <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded border border-rose-200 font-bold">
              에스컬레이션: {escalateCount}건
            </span>
          </div>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">주의 임계값:</span>
            <select
              value={warnThreshold}
              onChange={e => setWarnThreshold(Number(e.target.value))}
              className="px-2 py-1 border border-slate-300 rounded text-xs font-bold"
            >
              {[2, 3, 4, 5].map(n => <option key={n} value={n}>{n}회</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">에스컬레이션 임계값:</span>
            <select
              value={escalateThreshold}
              onChange={e => setEscalateThreshold(Number(e.target.value))}
              className="px-2 py-1 border border-slate-300 rounded text-xs font-bold"
            >
              {[3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n}회</option>)}
            </select>
          </label>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <AlertTriangle size={10} />
            에스컬레이션 도달 시 팀리드에게 자동 알림
          </div>
        </div>
      </div>

      {/* Escalation Alerts */}
      {escalateCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle size={16} className="text-rose-500 mt-0.5 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-rose-700">에스컬레이션 알림:</span>{' '}
            <span className="text-rose-600">
              {data.filter(d => d.absentCount >= escalateThreshold).map(d => `${d.customer}(${d.absentCount}회)`).join(', ')}
              — 팀리드 확인 필요
            </span>
          </div>
        </div>
      )}

    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-[#1e293b] text-sm">부재건 관리 현황</h3>
          <p className="text-xs text-slate-500 mt-0.5">부재 알림톡 발송 여부 및 재컨택 관리</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] text-white rounded text-xs font-bold hover:bg-slate-800 transition-colors">
          <Send size={12} />
          일괄 알림톡 발송
        </button>
      </div>
      <table className="w-full text-sm">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-left font-medium">고객명</th>
            <th className="px-4 py-3 text-left font-medium">연락처</th>
            <th className="px-4 py-3 text-left font-medium">담당자</th>
            <th className="px-4 py-3 text-center font-medium">부재 횟수</th>
            <th className="px-4 py-3 text-left font-medium">마지막 시도</th>
            <th className="px-4 py-3 text-center font-medium">알림톡</th>
            <th className="px-4 py-3 text-left font-medium">메모</th>
            <th className="px-4 py-3 text-center font-medium">액션</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 font-bold text-[#1e293b]">{item.customer}</td>
              <td className="px-4 py-3 text-slate-600 font-mono text-xs">{item.phone}</td>
              <td className="px-4 py-3 text-slate-600">{item.manager}</td>
              <td className="px-4 py-3 text-center">
                <span className={clsx(
                  "font-bold text-xs px-2 py-0.5 rounded",
                  item.absentCount >= escalateThreshold ? "bg-rose-50 text-rose-600" :
                  item.absentCount >= warnThreshold ? "bg-amber-50 text-amber-600" :
                  "bg-slate-50 text-slate-600"
                )}>
                  {item.absentCount}회
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">{item.lastAttempt}</td>
              <td className="px-4 py-3 text-center">
                {item.alimtalkSent ? (
                  <span className="text-emerald-600 text-xs font-bold">발송완료</span>
                ) : (
                  <span className="text-slate-400 text-xs">미발송</span>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">{item.note || '-'}</td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <button className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold hover:bg-blue-100 transition-colors">
                    <Phone size={10} className="inline mr-0.5" />재시도
                  </button>
                  {!item.alimtalkSent && (
                    <button className="px-2 py-1 bg-amber-50 text-amber-600 rounded text-[10px] font-bold hover:bg-amber-100 transition-colors">
                      알림톡
                    </button>
                  )}
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

function ManageSection({ data }: { data: typeof MANAGING_CUSTOMERS }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-bold text-[#1e293b] text-sm">관리 필요 고객</h3>
        <p className="text-xs text-slate-500 mt-0.5">전화 요청 시간 및 기타 요청사항 관리</p>
      </div>
      <table className="w-full text-sm">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-left font-medium">고객명</th>
            <th className="px-4 py-3 text-left font-medium">담당자</th>
            <th className="px-4 py-3 text-left font-medium">사유</th>
            <th className="px-4 py-3 text-left font-medium">요청 시간</th>
            <th className="px-4 py-3 text-center font-medium">상태</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 font-bold text-[#1e293b]">{item.customer}</td>
              <td className="px-4 py-3 text-slate-600">{item.manager}</td>
              <td className="px-4 py-3 text-slate-600 text-xs">{item.reason}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{item.requestedTime}</td>
              <td className="px-4 py-3 text-center">
                <span className={clsx(
                  "px-2 py-0.5 rounded text-[10px] font-bold",
                  item.status === '대기' ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                )}>
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Sprint 3: 일일업무 5건 ──

function ScriptFeedbackSection() {
  const FEEDBACKS = [
    { id: 'SF-01', staff: '김상담', date: '2026-03-31 14:20', violation: '수수료 미안내', severity: 'critical' as const, script: 'S5 1차TM #8', action: '즉시 재교육', resolved: false },
    { id: 'SF-02', staff: '최주원', date: '2026-03-31 11:40', violation: '개인정보 동의 누락', severity: 'critical' as const, script: 'S5 1차TM #9', action: '시말서 + 재교육', resolved: false },
    { id: 'SF-03', staff: '이원이', date: '2026-03-31 16:05', violation: '예상환급액 과장 안내', severity: 'warning' as const, script: 'S5 1차TM #5', action: '구두 주의', resolved: true },
    { id: 'SF-04', staff: '박하준', date: '2026-03-30 10:30', violation: '타사 비교 부적절 표현', severity: 'warning' as const, script: 'S6 2차TM #3', action: '구두 주의', resolved: true },
  ];
  const SEV = {
    critical: { label: '중대', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    warning: { label: '경고', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-bold text-[#1e293b] text-sm flex items-center gap-2"><FileWarning size={16} className="text-rose-500" /> 스크립트 기준위반 피드백</h3>
        <p className="text-xs text-slate-500 mt-0.5">금일 감지된 스크립트 위반 사항 및 조치 현황</p>
      </div>
      <div className="p-4 space-y-2">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-rose-50 rounded-lg p-3 text-center">
            <p className="text-[10px] text-rose-600">중대 위반</p>
            <p className="text-xl font-bold text-rose-700">{FEEDBACKS.filter(f => f.severity === 'critical').length}</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <p className="text-[10px] text-amber-600">경고</p>
            <p className="text-xl font-bold text-amber-700">{FEEDBACKS.filter(f => f.severity === 'warning').length}</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3 text-center">
            <p className="text-[10px] text-emerald-600">조치 완료</p>
            <p className="text-xl font-bold text-emerald-700">{FEEDBACKS.filter(f => f.resolved).length}/{FEEDBACKS.length}</p>
          </div>
        </div>
        {FEEDBACKS.map(fb => {
          const sev = SEV[fb.severity];
          return (
            <div key={fb.id} className={clsx('rounded-lg border p-3 space-y-1.5', sev.border, fb.resolved ? 'opacity-60' : '')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">{fb.staff}</span>
                  <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-bold', sev.bg, sev.text)}>{sev.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">{fb.date}</span>
                  {fb.resolved
                    ? <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5"><CheckCircle size={10} /> 완료</span>
                    : <button className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-white rounded hover:bg-slate-700">조치</button>}
                </div>
              </div>
              <p className="text-xs text-slate-700"><span className="font-medium">위반:</span> {fb.violation}</p>
              <div className="flex items-center gap-4 text-[10px] text-slate-500">
                <span>스크립트: {fb.script}</span>
                <span>조치: <span className="font-medium text-slate-700">{fb.action}</span></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProbationSection() {
  const TRAINEES = [
    { name: '최주원', startDate: '2026-02-15', endDate: '2026-05-15', daysLeft: 45, scores: { call: 65, script: 58, manner: 72, knowledge: 60 }, overall: 64, mentor: '김상담' },
    { name: '신입사', startDate: '2026-03-01', endDate: '2026-06-01', daysLeft: 62, scores: { call: 55, script: 50, manner: 68, knowledge: 52 }, overall: 56, mentor: '이원이' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-bold text-[#1e293b] text-sm flex items-center gap-2"><ClipboardCheck size={16} className="text-amber-500" /> 수습 평가표 관리</h3>
        <p className="text-xs text-slate-500 mt-0.5">수습 직원 역량 평가 및 진행 현황</p>
      </div>
      <div className="p-4 space-y-4">
        {TRAINEES.map(t => (
          <div key={t.name} className="rounded-lg border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">{t.name}</span>
                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">수습</span>
              </div>
              <div className="text-[10px] text-slate-500">{t.startDate} ~ {t.endDate} (잔여 {t.daysLeft}일) · 멘토: {t.mentor}</div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {([['콜 역량', t.scores.call], ['스크립트', t.scores.script], ['응대 태도', t.scores.manner], ['상품 지식', t.scores.knowledge]] as const).map(([label, score]) => (
                <div key={label} className="text-center">
                  <p className="text-[10px] text-slate-500">{label}</p>
                  <p className={clsx('text-lg font-bold', score >= 70 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-rose-600')}>{score}</p>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                    <div className={clsx('h-1.5 rounded-full', score >= 70 ? 'bg-emerald-400' : score >= 60 ? 'bg-amber-400' : 'bg-rose-400')} style={{ width: `${score}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">종합:</span>
                <span className={clsx('text-sm font-bold', t.overall >= 70 ? 'text-emerald-600' : t.overall >= 60 ? 'text-amber-600' : 'text-rose-600')}>{t.overall}점</span>
                <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-bold',
                  t.overall >= 70 ? 'bg-emerald-50 text-emerald-700' : t.overall >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                )}>{t.overall >= 70 ? '정규 전환 가능' : t.overall >= 60 ? '보완 필요' : '집중 관리'}</span>
              </div>
              <button className="px-3 py-1 text-[10px] font-bold bg-slate-800 text-white rounded hover:bg-slate-700">평가 기록</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TierManagementSection() {
  const TIERS = [
    { tier: 1, label: 'Tier 1 (신입)', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', members: ['최주원', '신입사'], desc: '매 건 동행, 매일 피드백', req: '계약 3건 이상 달성 시 승급' },
    { tier: 2, label: 'Tier 2 (성장)', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', members: ['이원이', '박하준'], desc: '주 1회 동행, 주간 피드백', req: '월 계약 5건 + QA 75점 시 승급' },
    { tier: 3, label: 'Tier 3 (독립)', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', members: ['김상담'], desc: '월 1회 점검, 자율 운영', req: '멘토 역할 수행' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-bold text-[#1e293b] text-sm flex items-center gap-2"><Star size={16} className="text-amber-500" /> 티어 분류 관리</h3>
        <p className="text-xs text-slate-500 mt-0.5">영업팀원 역량 기반 3단계 티어 분류 및 코칭 기준</p>
      </div>
      <div className="p-4 space-y-3">
        {TIERS.map(t => (
          <div key={t.tier} className={clsx('rounded-lg border p-4', t.border, t.bg + '/30')}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={clsx('text-sm font-bold', t.color)}>{t.label}</span>
                <span className="text-[10px] text-slate-500">· {t.desc}</span>
              </div>
              <span className="text-xs text-slate-500">{t.members.length}명</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              {t.members.map(name => (
                <span key={name} className={clsx('px-2 py-1 rounded text-xs font-medium border', t.bg, t.color, t.border)}>{name}</span>
              ))}
              <button className="px-2 py-1 rounded text-[10px] font-bold border border-dashed border-slate-300 text-slate-400 hover:text-slate-600">+ 배정</button>
            </div>
            <p className="text-[10px] text-slate-500">승급 기준: {t.req}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SalesReportSection() {
  const SALES = [
    { name: '박영업', meetings: 4, contracts: 2, premium: 3200000, reviews: 3, tier: 3, coached: true },
    { name: '김영업', meetings: 3, contracts: 1, premium: 1800000, reviews: 2, tier: 2, coached: true },
    { name: '이영업', meetings: 5, contracts: 3, premium: 4500000, reviews: 4, tier: 3, coached: false },
    { name: '최영업', meetings: 2, contracts: 0, premium: 0, reviews: 1, tier: 1, coached: false },
  ];
  const totalM = SALES.reduce((s, d) => s + d.meetings, 0);
  const totalC = SALES.reduce((s, d) => s + d.contracts, 0);
  const totalP = SALES.reduce((s, d) => s + d.premium, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-bold text-[#1e293b] text-sm flex items-center gap-2"><Building2 size={16} className="text-blue-500" /> 영업팀 마감 보고</h3>
        <p className="text-xs text-slate-500 mt-0.5">영업팀 일일 미팅/계약/설계 현황 (18:30 마감)</p>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-[10px] text-blue-600">총 미팅</p>
            <p className="text-xl font-bold text-blue-700">{totalM}건</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3 text-center">
            <p className="text-[10px] text-emerald-600">계약 체결</p>
            <p className="text-xl font-bold text-emerald-700">{totalC}건</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <p className="text-[10px] text-slate-500">체결률</p>
            <p className="text-xl font-bold text-slate-700">{totalM > 0 ? Math.round((totalC / totalM) * 100) : 0}%</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <p className="text-[10px] text-amber-600">총 보험료</p>
            <p className="text-xl font-bold text-amber-700">₩{(totalP / 10000).toFixed(0)}만</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-slate-500">팀원</th>
                <th className="px-3 py-2 text-center font-medium text-slate-500">티어</th>
                <th className="px-3 py-2 text-center font-medium text-slate-500">미팅</th>
                <th className="px-3 py-2 text-center font-medium text-slate-500">계약</th>
                <th className="px-3 py-2 text-right font-medium text-slate-500">보험료</th>
                <th className="px-3 py-2 text-center font-medium text-slate-500">설계리뷰</th>
                <th className="px-3 py-2 text-center font-medium text-slate-500">코칭</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SALES.map((s, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-bold text-slate-700">{s.name}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-bold',
                      s.tier === 3 ? 'bg-emerald-50 text-emerald-700' : s.tier === 2 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                    )}>T{s.tier}</span>
                  </td>
                  <td className="px-3 py-2 text-center font-medium text-slate-700">{s.meetings}</td>
                  <td className="px-3 py-2 text-center font-bold text-emerald-600">{s.contracts}</td>
                  <td className="px-3 py-2 text-right font-medium text-slate-700">₩{s.premium > 0 ? s.premium.toLocaleString() : '0'}</td>
                  <td className="px-3 py-2 text-center text-slate-600">{s.reviews}</td>
                  <td className="px-3 py-2 text-center">
                    {s.coached ? <CheckCircle size={14} className="text-emerald-500 mx-auto" /> : <Clock size={14} className="text-amber-500 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function QualityFeedbackSection() {
  const FEEDBACKS = [
    { id: 'QF-01', staff: '김상담', category: '스크립트 준수', score: 92, feedback: '스크립트 전 항목 완벽 수행. 고객 반응에 따른 유연한 대응 우수.', type: 'positive' as const },
    { id: 'QF-02', staff: '이원이', category: '응대 태도', score: 78, feedback: '전반적 양호하나 통화 종료 시 감사 인사 누락 빈번.', type: 'improvement' as const },
    { id: 'QF-03', staff: '최주원', category: '상품 설명', score: 55, feedback: '보험 용어 설명 시 고객 혼란 유발. 쉬운 표현 교육 필요.', type: 'concern' as const },
    { id: 'QF-04', staff: '박하준', category: '클로징', score: 70, feedback: '미팅 전환 유도 시 너무 직접적. 자연스러운 전환 화법 연습 권장.', type: 'improvement' as const },
  ];
  const TYPE_CFG = {
    positive: { label: '우수', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    improvement: { label: '보완', bg: 'bg-amber-50', text: 'text-amber-700' },
    concern: { label: '주의', bg: 'bg-rose-50', text: 'text-rose-700' },
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-bold text-[#1e293b] text-sm flex items-center gap-2"><MessageSquare size={16} className="text-violet-500" /> 품질 모니터링 피드백</h3>
        <p className="text-xs text-slate-500 mt-0.5">팀장 실시간 상담 모니터링 결과 및 개인별 피드백</p>
      </div>
      <div className="p-4 space-y-2">
        {FEEDBACKS.map(fb => {
          const cfg = TYPE_CFG[fb.type];
          return (
            <div key={fb.id} className={clsx('rounded-lg border p-3 space-y-1.5', fb.type === 'concern' ? 'border-rose-200' : 'border-slate-200')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">{fb.staff}</span>
                  <span className="text-[10px] text-slate-400">· {fb.category}</span>
                  <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-bold', cfg.bg, cfg.text)}>{cfg.label}</span>
                </div>
                <span className={clsx('text-sm font-bold', fb.score >= 80 ? 'text-emerald-600' : fb.score >= 60 ? 'text-amber-600' : 'text-rose-600')}>{fb.score}점</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{fb.feedback}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
