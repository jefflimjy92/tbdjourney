import React, { useState, useEffect, useMemo } from 'react';
import { 
  Filter, 
  MapPin, 
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  User,
  MoreHorizontal,
  Plus,
  Clock,
  Columns,
  X,
  Save as SaveIcon,
  Trash2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Upload,
  FileBarChart,
  MessageSquareText,
  Check,
  Ban,
  ArrowLeft,
  Phone,
  Users
} from 'lucide-react';
import clsx from 'clsx';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  addDays,
  subWeeks,
  addWeeks,
  parseISO,
  getHours,
  getMinutes,
  getWeek,
  isSameWeek
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { ConsultationFeedbackForm } from '@/app/components/ConsultationFeedbackForm';
import { RequestDetailView } from '@/app/components/RequestDetailView';
import { toast } from 'sonner';
import { useRef } from 'react';
import { useJourneyStore } from '@/app/journey/JourneyContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import {
  buildJourneyScheduleItems,
  formatMeetingContractAmount,
  formatShortAddress,
  type MeetingScheduleItem,
  type MeetingScheduleStatus,
} from '@/app/meeting/meetingOpsShared';

// --- Mock Data Generator ---

const STAFF_LIST = [
  { id: 'all', name: '전체 보기', team: 'all' },
  { id: 'm1', name: '박미팅', team: '1팀', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'm2', name: '최미팅', team: '2팀', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'm3', name: '김상담', team: '3팀', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'm4', name: '이팀장', team: '4팀', color: 'bg-amber-100 text-amber-700 border-amber-200' },
];

const TEAM_LIST = [
  { id: 'all', name: '전체 팀' },
  ...Array.from(
    new Map(
      STAFF_LIST.slice(1).map((staff) => [staff.team, { id: staff.team, name: staff.team }]),
    ).values(),
  ),
];

const getDbTypeClassName = (dbType: string) =>
  dbType === '3년 환급'
    ? 'bg-violet-50 text-violet-700 border-violet-100'
    : 'bg-sky-50 text-sky-700 border-sky-100';

const getCompactDbTypeLabel = (dbType: string) => {
  if (dbType === '3년 환급') return '3년';
  if (dbType === '간편 청구') return '간편';
  return dbType;
};

const getDenseDbTypeLabel = (dbType: string) => dbType.replace(/\s+/g, '');

const getMeetingStatusCardClassName = (status: MeetingScheduleStatus) => {
  if (status === 'contract-completed') return 'border-emerald-200 bg-emerald-50/80 text-emerald-900';
  if (status === 'followup') return 'border-indigo-200 bg-indigo-50/80 text-indigo-900';
  if (status === 'cancelled') return 'border-rose-200 bg-rose-50/70 text-rose-900';
  if (status === 'impossible' || status === 'noshow') return 'border-orange-200 bg-orange-50/80 text-orange-900';
  if (status === 'pending-assignment') return 'border-amber-200 bg-amber-50/80 text-amber-900';
  return 'border-blue-200 bg-blue-50/70 text-blue-900';
};

const getMeetingStatusBadgeClassName = (status: MeetingScheduleStatus) => {
  if (status === 'contract-completed') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (status === 'followup') return 'bg-indigo-100 text-indigo-700 border-indigo-200';
  if (status === 'cancelled') return 'bg-rose-100 text-rose-700 border-rose-200';
  if (status === 'impossible' || status === 'noshow') return 'bg-orange-100 text-orange-700 border-orange-200';
  if (status === 'pending-assignment') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-blue-100 text-blue-700 border-blue-200';
};

const getMeetingStatusDotClassName = (status: MeetingScheduleStatus) => {
  if (status === 'contract-completed') return 'bg-emerald-500';
  if (status === 'followup') return 'bg-indigo-500';
  if (status === 'cancelled') return 'bg-rose-500';
  if (status === 'impossible' || status === 'noshow') return 'bg-orange-500';
  if (status === 'pending-assignment') return 'bg-amber-500';
  return 'bg-blue-500';
};

const getMeetingStatusLabel = (meeting: Pick<MeetingScheduleItem, 'status' | 'statusLabel'>) => {
  if (meeting.statusLabel) return meeting.statusLabel;
  if (meeting.status === 'contract-completed') return '계약완료';
  if (meeting.status === 'followup') return '후속 진행';
  if (meeting.status === 'cancelled') return '취소';
  if (meeting.status === 'impossible') return '불가';
  if (meeting.status === 'noshow') return '노쇼';
  if (meeting.status === 'pending-assignment') return '배정중';
  return '미팅 확정';
};

const getContractSummaryLabel = (meeting: Pick<MeetingScheduleItem, 'contractCount' | 'contractAmountText'>) => {
  if (!meeting.contractCount) return '';
  return `${meeting.contractCount}건 · ${meeting.contractAmountText || '0원'}`;
};

const getMockMeetingOutcome = (offset: number) => {
  if (offset >= 0) {
    const isPendingAssignment = Math.random() > 0.94;
    return {
      status: (isPendingAssignment ? 'pending-assignment' : 'scheduled') as MeetingScheduleStatus,
      statusLabel: isPendingAssignment ? '배정중' : '미팅 확정',
      contractCount: 0,
      contractAmountText: '',
    };
  }

  const rand = Math.random();
  if (rand > 0.9) return { status: 'cancelled' as MeetingScheduleStatus, statusLabel: '취소', contractCount: 0, contractAmountText: '' };
  if (rand > 0.82) return { status: 'noshow' as MeetingScheduleStatus, statusLabel: '노쇼', contractCount: 0, contractAmountText: '' };
  if (rand > 0.74) return { status: 'impossible' as MeetingScheduleStatus, statusLabel: '현장불가', contractCount: 0, contractAmountText: '' };
  if (rand > 0.44) {
    const contractCount = Math.random() > 0.55 ? 2 : 1;
    const contractAmount = contractCount === 2 ? 320000 : 128000;
    return {
      status: 'contract-completed' as MeetingScheduleStatus,
      statusLabel: '계약완료',
      contractCount,
      contractAmountText: formatMeetingContractAmount(contractAmount),
      contractAmount,
    };
  }
  return {
    status: 'followup' as MeetingScheduleStatus,
    statusLabel: Math.random() > 0.5 ? '후속 진행' : '2차 미팅 예정',
    contractCount: 0,
    contractAmountText: '',
  };
};

const generateMockMeetings = () => {
  const meetings: MeetingScheduleItem[] = [];
  const baseDate = new Date(); // 오늘
  const currentMonthStart = startOfMonth(baseDate);
  const dbTypes = ['3년 환급'];
  const meetingTypes = ['방문 미팅', '보장 분석 미팅', '후속 상담', '청구 컨설팅'];
  const locations = [
    '서울 강남구 역삼동', '서울 서초구 반포동', '경기 성남시 분당구', 
    '서울 마포구 공덕동', '인천 연수구 송도동', '경기 수원시 영통구', 
    '서울 송파구 잠실동', '서울 종로구 혜화동', '경기 용인시 수지구'
  ];
  
  // Create approx meetings around current date
  for (let i = -60; i <= 60; i++) {
     const date = addDays(baseDate, i);
     const isCurrentMonthDate = isSameMonth(date, currentMonthStart);
     const count = isCurrentMonthDate
       ? Math.floor(Math.random() * 28) + 100
       : Math.floor(Math.random() * 10) + 12;
     
     for (let j = 0; j < count; j++) {
        const hour = 9 + Math.floor(Math.random() * 9); // 09:00 ~ 17:00
        const min = Math.random() > 0.5 ? '00' : '30';
        
        // Random staff (excluding 'all')
        const staff = STAFF_LIST.slice(1)[Math.floor(Math.random() * (STAFF_LIST.length - 1))];
        
        const outcome = getMockMeetingOutcome(i);

        meetings.push({
           id: `M-${format(date, 'yyyyMMdd')}-${j}`,
           customerId: `C-${Math.floor(1000 + Math.random() * 9000)}`,
           customer: `고객${Math.floor(Math.random() * 1000)}`,
           birthDate: `${Math.floor(Math.random() * 30) + 70}-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`, // Mock birthdate
           type: meetingTypes[Math.floor(Math.random() * meetingTypes.length)],
           dbType: dbTypes[Math.floor(Math.random() * dbTypes.length)],
           date: format(date, 'yyyy-MM-dd'),
           time: `${hour}:${min}`,
           location: locations[Math.floor(Math.random() * locations.length)],
           status: outcome.status,
           statusLabel: outcome.statusLabel,
           team: staff.team,
           staff: staff.name,
           phone: `010-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
           source: 'generated',
           contractCount: outcome.contractCount,
           contractAmount: outcome.contractAmount,
           contractAmountText: outcome.contractAmountText,
           regionLevel1: '미분류',
           regionLevel2: '미분류',
        });
     }
  }

  // Add Fixed Item: 이영희
  meetings.push({
    id: 'E-2026-101',
    customerId: 'C-1024',
    customer: '이영희',
    birthDate: '921103-2******',
    type: '방문 미팅',
    dbType: '3년 환급',
    date: '2026-01-20', // Fixed date
    time: '14:00',
    location: '경기 성남시 분당구 판교역로 123',
    status: 'scheduled',
    statusLabel: '미팅 확정',
    team: '2팀',
    staff: '최미팅',
    phone: '010-9876-5432',
    source: 'generated',
    regionLevel1: '경기',
    regionLevel2: '성남시 분당구',
  });

  // Add Fixed Item: 박지성
  meetings.push({
    id: 'E-2026-102',
    customerId: 'C-1026',
    customer: '박지성',
    birthDate: '810225-1******',
    type: '방문 미팅',
    dbType: '3년 환급',
    date: '2026-01-21',
    time: '11:00',
    location: '서울 송파구 올림픽로 300',
    status: 'scheduled',
    statusLabel: '미팅 확정',
    team: '1팀',
    staff: '박미팅',
    phone: '010-5555-4444',
    source: 'generated',
    regionLevel1: '서울',
    regionLevel2: '송파구',
  });

  return meetings.sort((a, b) => {
     if (a.date !== b.date) return a.date.localeCompare(b.date);
     return a.time.localeCompare(b.time);
  });
};

const MEETINGS_DATA = generateMockMeetings();

// --- Helper Functions ---
const getWeeksInMonth = (date: Date) => {
   const start = startOfMonth(date);
   const end = endOfMonth(date);
   const weeks = [];
   let current = startOfWeek(start, { locale: ko });
   
   while (current <= end || isSameWeek(current, end, { locale: ko })) {
      weeks.push(current);
      current = addWeeks(current, 1);
   }
   return weeks;
};

const getWeekKey = (date: Date) => `${format(date, 'yyyy')}-W${String(getWeek(date, { locale: ko })).padStart(2, '0')}`;

// --- Main Component ---

interface MeetingScheduleProps {
   onNavigate?: (path: string) => void;
}

export function MeetingSchedule({ onNavigate }: MeetingScheduleProps) {
  const { journeys } = useJourneyStore();
  const currentWeek = getWeekKey(new Date());
  const [calendarGrouping, setCalendarGrouping] = useState<'staff' | 'time'>('staff');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [weeklyBaseDate, setWeeklyBaseDate] = useState(() => startOfWeek(new Date(), { locale: ko }));
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [selectedDateDetail, setSelectedDateDetail] = useState<Date | null>(null); // For sidebar details (date)
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null); // For detail view (meeting)
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const allMeetings = useMemo(() => (
    [...MEETINGS_DATA, ...buildJourneyScheduleItems(journeys)].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    })
  ), [journeys]);
  const stats = useMemo(() => ({
    total: allMeetings.length,
    contractCompleted: allMeetings.filter((meeting) => meeting.status === 'contract-completed').length,
    scheduled: allMeetings.filter((meeting) => meeting.status === 'scheduled').length,
    followup: allMeetings.filter((meeting) => meeting.status === 'followup').length,
    pending: allMeetings.filter((meeting) => meeting.status === 'pending-assignment').length,
    cancelled: allMeetings.filter((meeting) => meeting.status === 'cancelled').length,
    impossible: allMeetings.filter((meeting) => meeting.status === 'impossible' || meeting.status === 'noshow').length,
  }), [allMeetings]);

  useEffect(() => {
    if (selectedStaff === 'all' || selectedTeam === 'all') return;

    const activeStaff = STAFF_LIST.find((staff) => staff.id === selectedStaff);
    if (!activeStaff || activeStaff.team !== selectedTeam) {
      setSelectedStaff('all');
    }
  }, [selectedStaff, selectedTeam]);

  // If a meeting is selected, show the detail view
  if (selectedMeeting) {
    return <MeetingScheduleDetail meeting={selectedMeeting} onBack={() => setSelectedMeeting(null)} />;
  }

  // Filter Data
  const filteredMeetings = allMeetings.filter(m => {
    if (selectedTeam !== 'all' && m.team !== selectedTeam) return false;
    if (selectedStaff !== 'all' && m.staff !== STAFF_LIST.find(s => s.id === selectedStaff)?.name) return false;
    if (selectedWeek && getWeekKey(parseISO(m.date)) !== selectedWeek) return false;
    if (statusFilter === 'contract-completed' && m.status !== 'contract-completed') return false;
    if (statusFilter === 'scheduled' && m.status !== 'scheduled') return false;
    if (statusFilter === 'followup' && m.status !== 'followup') return false;
    if (statusFilter === 'pending-assignment' && m.status !== 'pending-assignment') return false;
    if (statusFilter === 'cancelled' && m.status !== 'cancelled') return false;
    if (statusFilter === 'impossible' && !['impossible', 'noshow'].includes(m.status)) return false;
    return true;
  });
  const visibleStaffOptions = STAFF_LIST.filter((staff) => (
    staff.id === 'all' || selectedTeam === 'all' || staff.team === selectedTeam
  ));
  const weekOptions = useMemo(
    () => getWeeksInMonth(currentDate).map((weekStart, index) => ({
      key: getWeekKey(weekStart),
      label: `${index + 1}주차`,
    })),
    [currentDate]
  );
  const staffGroupedMeetings = useMemo(() => {
    const grouped = new Map<string, MeetingScheduleItem[]>();

    filteredMeetings.forEach((meeting) => {
      const key = meeting.staff;
      const existing = grouped.get(key) || [];
      existing.push(meeting);
      grouped.set(key, existing);
    });

    return Array.from(grouped.entries())
      .map(([staffName, meetings]) => ({
        staffName,
        meetings: meetings.sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          return a.time.localeCompare(b.time);
        }),
      }))
      .sort((a, b) => a.staffName.localeCompare(b.staffName, 'ko'));
  }, [filteredMeetings]);

  const handlePrev = () => {
      const nextDate = subMonths(currentDate, 1);
      setCurrentDate(nextDate);
      setSelectedWeek(getWeekKey(nextDate));
  };

  const handleNext = () => {
      const nextDate = addMonths(currentDate, 1);
      setCurrentDate(nextDate);
      setSelectedWeek(getWeekKey(nextDate));
  };

  const getTitle = () => {
     return format(currentDate, 'yyyy년 M월');
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1e293b]">미팅 스케줄 관리</h1>
            <p className="text-slate-500 text-sm mt-1">담당자별 방문 일정을 배정하고 캘린더로 관리합니다.</p>
          </div>
          <button className="flex items-center gap-2 bg-[#1e293b] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm">
            <Plus size={16} /> 일정 추가
          </button>
        </div>
      </div>

      {/* Stats & Controls */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10">
        <div className="flex items-center gap-2">
           <div className="flex gap-2">
              <StatChip label="전체" value={stats.total} color="bg-slate-100 text-slate-600" active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
              <StatChip label="계약완료" value={stats.contractCompleted} color="bg-emerald-100 text-emerald-700" active={statusFilter === 'contract-completed'} onClick={() => setStatusFilter('contract-completed')} />
              <StatChip label="확정" value={stats.scheduled} color="bg-blue-100 text-blue-700" active={statusFilter === 'scheduled'} onClick={() => setStatusFilter('scheduled')} />
              <StatChip label="후속" value={stats.followup} color="bg-indigo-100 text-indigo-700" active={statusFilter === 'followup'} onClick={() => setStatusFilter('followup')} />
              <StatChip label="배정중" value={stats.pending} color="bg-amber-100 text-amber-700" active={statusFilter === 'pending-assignment'} onClick={() => setStatusFilter('pending-assignment')} />
              <StatChip label="취소" value={stats.cancelled} color="bg-rose-100 text-rose-700" active={statusFilter === 'cancelled'} onClick={() => setStatusFilter('cancelled')} />
              <StatChip label="불가" value={stats.impossible} color="bg-orange-100 text-orange-700" active={statusFilter === 'impossible'} onClick={() => setStatusFilter('impossible')} />
           </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded border border-slate-200">
              <Users size={14} className="text-slate-400" />
              <select
                 value={selectedTeam}
                 onChange={(e) => setSelectedTeam(e.target.value)}
                 className="bg-transparent text-sm text-slate-700 font-bold outline-none cursor-pointer min-w-[90px]"
              >
                 {TEAM_LIST.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                 ))}
              </select>
           </div>

           <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded border border-slate-200">
              <User size={14} className="text-slate-400" />
              <select 
                 value={selectedStaff}
                 onChange={(e) => setSelectedStaff(e.target.value)}
                 className="bg-transparent text-sm text-slate-700 font-bold outline-none cursor-pointer min-w-[80px]"
              >
                 {visibleStaffOptions.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                 ))}
              </select>
           </div>
           
           <div className="h-6 w-px bg-slate-200" />

           <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded border border-slate-200">
              <CalendarIcon size={13} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-600 mr-1">주간 캘린더</span>
              <div className="flex items-center gap-1 bg-slate-100 rounded p-0.5">
                <button
                  onClick={() => setCalendarGrouping('staff')}
                  className={clsx(
                    "px-2.5 py-1 text-[10px] font-bold rounded transition-colors",
                    calendarGrouping === 'staff' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
                  )}
                >
                  직원별
                </button>
                <button
                  onClick={() => setCalendarGrouping('time')}
                  className={clsx(
                    "px-2.5 py-1 text-[10px] font-bold rounded transition-colors",
                    calendarGrouping === 'time' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
                  )}
                >
                  시간순
                </button>
              </div>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm relative">
         {/* Calendar/List Section */}
         <div className="flex flex-col relative transition-all duration-300">
            <WeeklyCalendarView
               weeklyBaseDate={weeklyBaseDate}
               allMeetings={allMeetings}
               selectedTeam={selectedTeam}
               selectedStaff={selectedStaff}
               statusFilter={statusFilter}
               onPrevWeek={() => setWeeklyBaseDate(d => subWeeks(d, 1))}
               onNextWeek={() => setWeeklyBaseDate(d => addWeeks(d, 1))}
               onSelectMeeting={setSelectedMeeting}
               currentDate={currentDate}
               onPrevMonth={handlePrev}
               onNextMonth={handleNext}
               weekOptions={weekOptions}
               selectedWeek={selectedWeek}
               calendarGrouping={calendarGrouping}
               onSelectWeek={(key: string) => {
                 setSelectedWeek(key);
                 const idx = weekOptions.findIndex(w => w.key === key);
                 if (idx !== -1) {
                   const weeks = getWeeksInMonth(currentDate);
                   if (weeks[idx]) setWeeklyBaseDate(startOfWeek(weeks[idx], { weekStartsOn: 0 }));
                 }
               }}
            />
         </div>

         {/* Right Side Detail Panel (Date Details) */}
         {selectedDateDetail && (
            <div className="absolute inset-0 z-50 flex justify-end">
               <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" onClick={() => setSelectedDateDetail(null)} />
               <div className="relative w-[350px] bg-white h-full shadow-xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                     <div>
                        <h2 className="text-lg font-bold text-slate-800">
                           {format(selectedDateDetail, 'M월 d일 (E)', { locale: ko })}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">상세 일정 목록</p>
                     </div>
                     <button 
                        onClick={() => setSelectedDateDetail(null)}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                     >
                        <X size={20} />
                     </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                     <div className="flex flex-col gap-2">
                        {(() => {
                           const dayMeetings = filteredMeetings.filter(m => isSameDay(new Date(m.date), selectedDateDetail));
                           if (dayMeetings.length === 0) {
                              return <div className="text-center py-20 text-slate-400">예정된 일정이 없습니다.</div>
                           }
                           return dayMeetings.map(meeting => (
                              <div 
                                 key={meeting.id}
                                 onClick={() => {
                                    if (onNavigate) onNavigate(`customers:${meeting.customerId}`);
                                    setSelectedDateDetail(null);
                                 }}
                                 className={clsx(
                                    "p-2.5 rounded-lg border shadow-sm cursor-pointer hover:scale-[1.02] transition-all bg-white group",
                                    getMeetingStatusCardClassName(meeting.status),
                                    meeting.status === 'cancelled' && "opacity-75"
                                 )}
                              >
                                 <div className="flex justify-between items-center mb-1.5">
                                    <span className="font-bold text-slate-800 text-sm">{meeting.time === '미정' ? '시간 미정' : meeting.time}</span>
                                    <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full font-bold border", getMeetingStatusBadgeClassName(meeting.status))}>
                                       {getMeetingStatusLabel(meeting)}
                                    </span>
                                 </div>
                                 <div className="font-bold text-[#1e293b] text-sm mb-0.5">{meeting.customer}</div>
                                 <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-1.5">
                                    <MapPin size={10} />
                                    <span className="truncate">{formatShortAddress(meeting.location)}</span>
                                 </div>
                                 {meeting.contractCount ? (
                                    <div className="mb-1.5 rounded-md bg-white/70 px-2 py-1 text-[11px] font-bold text-emerald-700">
                                       계약 {getContractSummaryLabel(meeting)}
                                    </div>
                                 ) : null}
                                 <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100 mt-1.5">
                                    <div className={clsx(
                                       "size-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white",
                                       getMeetingStatusDotClassName(meeting.status)
                                    )}>
                                       {meeting.staff[0]}
                                    </div>
                                    <span className="text-xs text-slate-600 font-medium">{meeting.staff}</span>
                                    <span className="text-[10px] text-slate-400">{meeting.team}</span>
                                    <span className={clsx("ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold border", getDbTypeClassName(meeting.dbType))}>
                                       {meeting.dbType}
                                    </span>
                                 </div>
                              </div>
                           ));
                        })()}
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
    </div>
  );
}

// --- Sub Components ---

function StatChip({ label, value, color, active = false, onClick }: { label: string, value: number, color: string, active?: boolean, onClick?: () => void }) {
   return (
      <button
         type="button"
         onClick={onClick}
         className={clsx("flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition", color, active && 'ring-2 ring-offset-1 ring-slate-300')}
      >
         <span>{label}</span>
         <span className="bg-white/50 px-1.5 rounded text-current">{value}</span>
      </button>
   );
}

function MeetingStaffGroupedList({
  meetingsByStaff,
  onSelectMeeting,
}: {
  meetingsByStaff: Array<{ staffName: string; meetings: MeetingScheduleItem[] }>;
  onSelectMeeting: (meeting: MeetingScheduleItem) => void;
}) {
  if (!meetingsByStaff.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        표시할 미팅 일정이 없습니다.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-20">
      <div className="space-y-5">
        {meetingsByStaff.map((group) => (
          <section key={group.staffName} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">{group.staffName}</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {group.meetings.length}건
              </span>
            </div>
            <div className="space-y-3">
              {group.meetings.map((meeting) => (
                <button
                  key={meeting.id}
                  type="button"
                  onClick={() => onSelectMeeting(meeting)}
                  className="flex w-full items-start justify-between rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:bg-slate-50"
                >
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {meeting.time} · {meeting.customer}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {meeting.date} · {formatShortAddress(meeting.location)}
                    </div>
                  </div>
                  <span className={clsx("rounded-full border px-2 py-1 text-[10px] font-bold", getMeetingStatusBadgeClassName(meeting.status))}>
                    {getMeetingStatusLabel(meeting)}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

// Merged Calendar Component
function MeetingCalendar({ 
   currentDate, 
   meetings, 
   onNavigate, 
   selectedWeek,
   onSelectDate,
   onSelectMeeting
}: { 
   currentDate: Date, 
   meetings: MeetingScheduleItem[], 
   onNavigate?: (path: string) => void,
   selectedWeek: number | null,
   onSelectDate: (date: Date) => void,
   onSelectMeeting: (meeting: MeetingScheduleItem) => void
}) {
   const monthStart = startOfMonth(currentDate);
   const monthEnd = endOfMonth(monthStart);
   const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

   let calendarDays;
   if (selectedWeek !== null) {
      const weeks = getWeeksInMonth(currentDate);
      const targetWeekStart = weeks[selectedWeek];
      const targetWeekEnd = endOfWeek(targetWeekStart, { locale: ko });
      calendarDays = eachDayOfInterval({ start: targetWeekStart, end: targetWeekEnd });
   } else {
      const startDate = startOfWeek(monthStart, { locale: ko });
      const endDate = endOfWeek(monthEnd, { locale: ko });
      calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
   }

   const isWeeklyView = selectedWeek !== null;

   return (
      <div className="flex flex-col h-full pt-14">
         {/* Week Header */}
         <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 flex-none">
            {weekDays.map((day, i) => (
               <div key={day} className={clsx("py-2 text-center text-xs font-bold text-slate-500", i === 0 && "text-rose-500", i === 6 && "text-blue-500")}>
                  {day}
               </div>
            ))}
         </div>
         
         {/* Days Grid - Scrollable Container */}
         <div className="flex-1 overflow-y-auto custom-scrollbar">
             <div className={clsx(
                "grid grid-cols-7",
                isWeeklyView ? "min-h-full" : "auto-rows-fr" 
             )}>
                {calendarDays.map((day, idx) => {
                   const dayMeetings = meetings.filter(m => isSameDay(new Date(m.date), day));
                   const isCurrentMonth = isSameMonth(day, monthStart);
                   const isTodayDate = isToday(day);
                   const visibleMeetings = isWeeklyView ? dayMeetings.slice(0, 10) : dayMeetings.slice(0, 6);
                   const hiddenMeetingCount = dayMeetings.length - visibleMeetings.length;

                   return (
                      <div 
                         key={day.toString()} 
                         onClick={(e) => {
                            // Only trigger date selection if clicking empty space or header
                            if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.date-header')) {
                               onSelectDate(day);
                            }
                         }}
                         className={clsx(
                            "border-b border-r border-slate-100 flex flex-col relative group transition-colors hover:bg-slate-50 cursor-pointer",
                            !isCurrentMonth && "bg-slate-50/50 text-slate-300",
                            isWeeklyView ? "min-h-[600px]" : "min-h-[260px]"
                         )}
                      >
                         {/* Day Header */}
                         <div className={clsx(
                            "flex items-center justify-between p-2 date-header rounded hover:bg-black/5 transition-colors mx-1 mt-1",
                            isWeeklyView && "border-b border-slate-50 mb-2"
                         )}>
                            <div className="flex items-center gap-1">
                               <span className={clsx(
                                  "text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full",
                                  isTodayDate ? "bg-rose-500 text-white" : (isCurrentMonth ? "text-slate-700" : "text-slate-400")
                               )}>
                                  {format(day, 'd')}
                               </span>
                               {isTodayDate && <span className="text-[10px] font-bold text-rose-500">Today</span>}
                            </div>
                            <span className={clsx(
                               "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                               dayMeetings.length > 0 ? "bg-slate-100 text-slate-500" : "text-transparent"
                            )}>
                               {dayMeetings.length}건
                            </span>
                         </div>

                         {/* Content Area */}
                         <div className={clsx(
                            "flex-1 flex flex-col gap-0.5 px-1 pb-1",
                            hiddenMeetingCount > 0 && "overflow-hidden"
                         )}>
                            {visibleMeetings.map(meeting => (
                               <div 
                                  key={meeting.id}
                                  onClick={(e) => {
                                     e.stopPropagation(); // Prevent opening date details
                                     onSelectMeeting(meeting);
                                  }}
                                  className={clsx(
                                     "rounded border cursor-pointer transition-all hover:scale-[1.01] shadow-sm",
                                     getMeetingStatusCardClassName(meeting.status),
                                     meeting.status === 'cancelled' && "opacity-75",
                                     isWeeklyView ? "px-2 py-1.5" : "px-1.5 py-1"
                                  )}
                               >
                                  {isWeeklyView ? (
                                     <div className="flex items-start gap-2">
                                        <div className="w-11 shrink-0 text-[11px] font-bold leading-none text-slate-900">
                                           {meeting.time === '미정' ? '배정중' : meeting.time}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                           <div className="flex items-center gap-1">
                                              <span className={clsx(
                                                 "shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold leading-none",
                                                 getMeetingStatusBadgeClassName(meeting.status),
                                              )}>
                                                 {getMeetingStatusLabel(meeting)}
                                              </span>
                                              <span className="font-bold text-slate-900">{getDenseDbTypeLabel(meeting.dbType)}</span>
                                              <span className="truncate font-semibold text-slate-800">{meeting.customer}</span>
                                              <span className="shrink-0 text-[10px] text-slate-500 border-l border-current/10 pl-1.5">{meeting.staff}</span>
                                           </div>
                                           <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                                              <MapPin size={10} />
                                              <span className="truncate">{formatShortAddress(meeting.location)}</span>
                                           </div>
                                           {meeting.contractCount ? (
                                              <div className="mt-1 text-[10px] font-bold text-emerald-700">
                                                 계약 {getContractSummaryLabel(meeting)}
                                              </div>
                                           ) : null}
                                        </div>
                                     </div>
                                  ) : (
                                     <div className="min-w-0 text-[10px] leading-tight">
                                        <div className="flex items-center gap-1 text-[10px] font-medium">
                                           <span className="shrink-0 font-bold">{meeting.time === '미정' ? '배정' : meeting.time}</span>
                                           <span className={clsx(
                                              "shrink-0 rounded border px-1 py-0.5 text-[8px] font-bold leading-none",
                                              getMeetingStatusBadgeClassName(meeting.status),
                                           )}>
                                              {getMeetingStatusLabel(meeting)}
                                           </span>
                                           <span className="shrink-0 font-bold text-violet-700">{getDenseDbTypeLabel(meeting.dbType)}</span>
                                           <span className="truncate text-slate-800">{meeting.customer}</span>
                                           <span className="shrink-0 border-l border-current/20 pl-1 text-[9px] text-slate-500">{meeting.staff}</span>
                                        </div>
                                        <div className="mt-0.5 flex items-center gap-1 text-[9px] text-slate-500">
                                           <MapPin size={8} />
                                           <span className="truncate">{formatShortAddress(meeting.location)}</span>
                                        </div>
                                        {meeting.contractCount ? (
                                           <div className="mt-0.5 text-[9px] font-bold text-emerald-700">
                                              {getContractSummaryLabel(meeting)}
                                           </div>
                                        ) : null}
                                     </div>
                                  )}
                               </div>
                            ))}
                            {hiddenMeetingCount > 0 ? (
                               <button
                                  type="button"
                                  onClick={(event) => {
                                     event.stopPropagation();
                                     onSelectDate(day);
                                  }}
                                  className="mt-1 rounded-md border border-dashed border-slate-200 bg-white px-2 py-1 text-left text-[10px] font-bold text-slate-500 hover:border-slate-300 hover:text-slate-700"
                               >
                                  +{hiddenMeetingCount}건 더보기
                               </button>
                            ) : null}
                         </div>
                      </div>
                   );
                })}
             </div>
         </div>
      </div>
   );
}

function MeetingList({ meetings, onNavigate, onSelectMeeting }: { meetings: MeetingScheduleItem[], onNavigate?: (path: string) => void, onSelectMeeting: (meeting: MeetingScheduleItem) => void }) {
   if (meetings.length === 0) {
      return (
         <div className="flex h-full items-center justify-center pt-14 text-sm text-slate-400">
            해당 기간에 예정된 미팅이 없습니다.
         </div>
      );
   }

   // Group meetings by date for timeline display
   const grouped = new Map<string, MeetingScheduleItem[]>();
   for (const m of meetings) {
      const existing = grouped.get(m.date) || [];
      existing.push(m);
      grouped.set(m.date, existing);
   }
   const sortedDates = Array.from(grouped.keys()).sort();

   return (
      <div className="flex-1 overflow-auto pt-14 px-6 py-20">
         <div className="space-y-6">
            {sortedDates.map((date) => {
               const dayMeetings = grouped.get(date)!;
               const parsedDate = parseISO(date);
               return (
                  <section key={date}>
                     {/* Date header */}
                     <div className="flex items-center gap-3 mb-3">
                        <div className={clsx(
                           "text-xs font-bold px-2.5 py-1 rounded-full border",
                           isToday(parsedDate)
                              ? "bg-rose-500 text-white border-rose-500"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                        )}>
                           {format(parsedDate, 'M월 d일 (E)', { locale: ko })}
                        </div>
                        <span className="text-xs text-slate-400 font-medium">{dayMeetings.length}건</span>
                        <div className="flex-1 h-px bg-slate-100" />
                     </div>

                     {/* Meeting cards */}
                     <div className="space-y-2">
                        {dayMeetings.map((item) => (
                           <button
                              key={item.id}
                              type="button"
                              onClick={() => onSelectMeeting(item)}
                              className={clsx(
                                 "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition hover:scale-[1.005] shadow-sm",
                                 getMeetingStatusCardClassName(item.status),
                                 item.status === 'cancelled' && "opacity-75"
                              )}
                           >
                              {/* Time */}
                              <div className="w-14 shrink-0 text-sm font-bold text-slate-800 tabular-nums">
                                 {item.time === '미정' ? '배정중' : item.time}
                              </div>

                              {/* Divider dot */}
                              <div className={clsx("size-2 shrink-0 rounded-full", getMeetingStatusDotClassName(item.status))} />

                              {/* Customer + region + status */}
                              <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                                 <span className="font-bold text-slate-900">{item.customer}</span>
                                 <span className="text-xs text-slate-500 flex items-center gap-0.5">
                                    <MapPin size={11} className="text-slate-400" />
                                    {formatShortAddress(item.location)}
                                 </span>
                                 <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-full border font-bold", getMeetingStatusBadgeClassName(item.status))}>
                                    {getMeetingStatusLabel(item)}
                                 </span>
                                 {item.contractCount ? (
                                    <span className="text-[10px] font-bold text-emerald-700">
                                       계약 {getContractSummaryLabel(item)}
                                    </span>
                                 ) : null}
                              </div>

                              {/* Staff */}
                              <div className="shrink-0 flex items-center gap-1.5">
                                 <div className={clsx(
                                    "size-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                                    STAFF_LIST.find(s => s.name === item.staff)?.color || "bg-slate-100 text-slate-600"
                                 )}>
                                    {item.staff[0]}
                                 </div>
                                 <span className="text-xs text-slate-600 font-medium">{item.staff}</span>
                              </div>

                              {/* Actions */}
                              <DropdownMenu>
                                 <DropdownMenuTrigger asChild>
                                    <div
                                       role="button"
                                       className="p-1 hover:bg-black/5 rounded text-slate-400 hover:text-slate-600 shrink-0"
                                       onClick={(e) => e.stopPropagation()}
                                    >
                                       <MoreHorizontal size={16} />
                                    </div>
                                 </DropdownMenuTrigger>
                                 <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuItem onClick={() => { if (onNavigate) onNavigate(`case-detail:${item.requestId}`); }}>
                                       케이스 상세 보기
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { toast('일정 변경은 준비 중입니다'); }}>
                                       일정 변경
                                    </DropdownMenuItem>
                                 </DropdownMenuContent>
                              </DropdownMenu>
                           </button>
                        ))}
                     </div>
                  </section>
               );
            })}
         </div>
      </div>
   );
}

// --- Weekly Calendar View ---

const KO_DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const DAY_HEADER_BG = ['bg-red-50', 'bg-slate-50', 'bg-slate-50', 'bg-slate-50', 'bg-slate-50', 'bg-slate-50', 'bg-blue-50'];
const DAY_HEADER_TEXT = ['text-red-500', 'text-slate-800', 'text-slate-800', 'text-slate-800', 'text-slate-800', 'text-slate-800', 'text-blue-500'];

function groupBy<T>(arr: T[], fn: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const key = fn(item);
    (acc[key] ??= []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

function getMeetingEntryColor(status: MeetingScheduleStatus): string {
  if (status === 'cancelled') return 'text-red-500';
  if (status === 'contract-completed') return 'text-emerald-600';
  if (status === 'followup') return 'text-indigo-600';
  return 'text-slate-600';
}

function WeeklyCalendarView({
  weeklyBaseDate,
  allMeetings,
  selectedTeam,
  selectedStaff,
  statusFilter,
  onPrevWeek,
  onNextWeek,
  onSelectMeeting,
  currentDate,
  onPrevMonth,
  onNextMonth,
  weekOptions,
  selectedWeek,
  onSelectWeek,
  calendarGrouping,
}: {
  weeklyBaseDate: Date;
  allMeetings: MeetingScheduleItem[];
  selectedTeam: string;
  selectedStaff: string;
  statusFilter: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onSelectMeeting: (meeting: MeetingScheduleItem) => void;
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  weekOptions: Array<{ key: string; label: string }>;
  selectedWeek: string;
  onSelectWeek: (key: string) => void;
  calendarGrouping: 'staff' | 'time';
}) {
  // Build 7-day array starting Sunday
  const weekStart = startOfWeek(weeklyBaseDate, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Filter meetings for this week with all active filters
  const weekMeetings = allMeetings.filter((m) => {
    const d = parseISO(m.date);
    if (d < days[0] || d > days[6]) return false;
    if (selectedTeam !== 'all' && m.team !== selectedTeam) return false;
    if (selectedStaff !== 'all' && m.staff !== STAFF_LIST.find((s) => s.id === selectedStaff)?.name) return false;
    if (statusFilter === 'contract-completed' && m.status !== 'contract-completed') return false;
    if (statusFilter === 'scheduled' && m.status !== 'scheduled') return false;
    if (statusFilter === 'followup' && m.status !== 'followup') return false;
    if (statusFilter === 'pending-assignment' && m.status !== 'pending-assignment') return false;
    if (statusFilter === 'cancelled' && m.status !== 'cancelled') return false;
    if (statusFilter === 'impossible' && !['impossible', 'noshow'].includes(m.status)) return false;
    return true;
  });

  const totalCount = weekMeetings.length;

  return (
    <div className="flex flex-col">
      {/* Top: month nav + week tabs */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 bg-slate-50 shrink-0 flex-wrap">
        {/* Month nav */}
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevMonth}
            className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-sm font-bold text-slate-700 min-w-[90px] text-center">
            {format(currentDate, 'yyyy년 M월')}
          </span>
          <button
            onClick={onNextMonth}
            className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="h-5 w-px bg-slate-200" />

        {/* Week tabs */}
        <div className="flex gap-1">
          {weekOptions.map((week) => (
            <button
              key={week.key}
              onClick={() => onSelectWeek(week.key)}
              className={clsx(
                'px-2.5 py-1 text-xs font-bold rounded border transition-all',
                selectedWeek === week.key
                  ? 'bg-[#1e293b] text-white border-[#1e293b]'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
              )}
            >
              {week.label}
            </button>
          ))}
          <span className="ml-2 text-xs text-slate-400 self-center">전체 {totalCount}건</span>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={onPrevWeek}
            className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs text-slate-500">
            {format(days[0], 'M/d')} - {format(days[6], 'M/d')}
          </span>
          <button
            onClick={onNextWeek}
            className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* 7-column grid */}
      <div className="grid grid-cols-7 border-t border-slate-200">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayOfWeek = day.getDay(); // 0=Sun, 6=Sat
          const dayMeetings = weekMeetings.filter((m) => m.date === key);
          const isTodayDate = isToday(day);

          // Group by staff, sorted alphabetically
          const byStaff = groupBy(dayMeetings, (m) => m.staff);
          const staffEntries = Object.entries(byStaff).sort(([a], [b]) =>
            a.localeCompare(b, 'ko')
          );

          return (
            <div
              key={key}
              className="flex flex-col border-r border-slate-200 last:border-r-0"
            >
              {/* Column header */}
              <div
                className={clsx(
                  'shrink-0 px-2 py-1.5 border-b border-slate-200 text-center',
                  isTodayDate ? 'bg-blue-100' : DAY_HEADER_BG[dayOfWeek]
                )}
              >
                <div className={clsx('text-xs font-bold', isTodayDate ? 'text-blue-700' : DAY_HEADER_TEXT[dayOfWeek])}>
                  {KO_DAY_LABELS[dayOfWeek]}
                </div>
                <div className="text-sm font-bold text-slate-700 mt-0.5">
                  {format(day, 'd')}
                  <span className="text-[10px] text-slate-400 font-normal ml-1">
                    ({dayMeetings.length}건)
                  </span>
                </div>
              </div>

              {/* Content — grouped by staff or sorted by time */}
              <div className="p-1.5 space-y-1.5">
                {dayMeetings.length === 0 ? (
                  <p className="text-[10px] text-slate-300 text-center py-4 select-none">일정 없음</p>
                ) : calendarGrouping === 'staff' ? (
                  staffEntries.map(([staff, staffMeetings]) => (
                    <div key={staff}>
                      <p className="text-[10px] font-bold text-slate-800 bg-slate-100 px-1 py-0.5 rounded mb-0.5">
                        {staff} ({staffMeetings.length}건)
                      </p>
                      <div className="space-y-0.5">
                        {[...staffMeetings]
                          .sort((a, b) => a.time.localeCompare(b.time))
                          .map((m, i) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => onSelectMeeting(m)}
                              className={clsx(
                                'w-full text-left text-[10px] leading-tight pl-1 py-0.5 rounded hover:bg-slate-50 transition-colors',
                                getMeetingEntryColor(m.status),
                                m.status === 'cancelled' && 'line-through opacity-60'
                              )}
                            >
                              {i + 1}) {m.dbType} / {m.customer} / {formatShortAddress(m.location)} / {m.time} / {staff}
                            </button>
                          ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="space-y-0.5">
                    {[...dayMeetings]
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((m, i) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => onSelectMeeting(m)}
                          className={clsx(
                            'w-full text-left text-[10px] leading-tight pl-1 py-0.5 rounded hover:bg-slate-50 transition-colors',
                            getMeetingEntryColor(m.status),
                            m.status === 'cancelled' && 'line-through opacity-60'
                          )}
                        >
                          {i + 1}) {m.type || '3년환급'} / {m.customer} / {formatShortAddress(m.location)} / {m.time} / {m.staff}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Detail View Component
function MeetingScheduleDetail({ meeting, onBack }: { meeting: any, onBack: () => void }) {
   const [resultStatus, setResultStatus] = useState(''); // success, fail, hold
   const [contractAmount, setContractAmount] = useState('');
   const [note, setNote] = useState('');
   const [isContractModalOpen, setIsContractModalOpen] = useState(false);
   const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);

   const handleScrollToScript = () => {
      const element = document.getElementById('consultation-script-section');
      if (element) {
         element.scrollIntoView({ behavior: 'smooth', block: 'start' });
         toast.info('스크립트 작성 영역으로 이동했습니다.');
      }
   };

   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         setUploadedFileName(file.name);
         toast.success('보상분석 파일��� 업로드되었습니다.');
      }
   };

   // Define the Action Panel Content
   const ActionPanel = (
      <>
         <div className="p-4 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
            <h2 className="font-bold text-[#1e293b] flex items-center gap-2 text-sm">
               <CheckCircle2 size={16} className="text-[#0f766e]" /> 미팅 액션
            </h2>
         </div>
         
         <div className="p-4 space-y-8 pb-20">
            {/* Step 1: Preparation */}
            <div>
               <label className="text-xs font-bold text-slate-500 mb-2 block uppercase flex items-center gap-1">
                  <span className="bg-slate-200 text-slate-600 size-4 rounded-full flex items-center justify-center text-[10px]">1</span>
                  미팅 사전 준비
               </label>
               <div className="space-y-3">
                  {/* Analysis File Upload */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                     <div className="flex items-center gap-2 mb-2">
                        <FileBarChart size={16} className="text-blue-600" />
                        <span className="text-xs font-bold text-slate-700">보상분석</span>
                     </div>
                     
                     <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        onChange={handleFileUpload}
                     />
                     
                     {uploadedFileName ? (
                        <div className="flex items-center justify-between bg-white border border-blue-100 p-2 rounded text-xs text-blue-600">
                           <span className="truncate max-w-[150px]">{uploadedFileName}</span>
                           <button 
                              onClick={() => setUploadedFileName(null)}
                              className="text-slate-400 hover:text-rose-500"
                           >
                              <Ban size={14} />
                           </button>
                        </div>
                     ) : (
                        <button 
                           onClick={() => fileInputRef.current?.click()}
                           className="w-full py-2 bg-white border border-dashed border-slate-300 rounded text-xs text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
                        >
                           <Upload size={14} /> 파일 업로드
                        </button>
                     )}
                  </div>

                  {/* Script Prep Link */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                     <div className="flex items-center gap-2 mb-2">
                        <MessageSquareText size={16} className="text-emerald-600" />
                        <span className="text-xs font-bold text-slate-700">스크립트 준비</span>
                     </div>
                     <button 
                        onClick={handleScrollToScript}
                        className="w-full py-2 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                     >
                        상담원 피드백 관리로 이동
                     </button>
                  </div>
               </div>
            </div>

            {/* Step 2: Result */}
            <div>
               <label className="text-xs font-bold text-slate-500 mb-2 block uppercase flex items-center gap-1">
                  <span className="bg-slate-200 text-slate-600 size-4 rounded-full flex items-center justify-center text-[10px]">2</span>
                  미팅 결과 입력
               </label>
               <div className="grid grid-cols-3 gap-2">
                  <button
                     onClick={() => setResultStatus('success')}
                     className={clsx(
                        "flex flex-col items-center justify-center p-3 rounded-lg border transition-all gap-1",
                        resultStatus === 'success' ? "bg-emerald-600 text-white border-emerald-600 shadow-md" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                     )}
                  >
                     <Check size={18} />
                     <span className="text-xs font-bold">성공</span>
                  </button>
                  <button
                     onClick={() => setResultStatus('hold')}
                     className={clsx(
                        "flex flex-col items-center justify-center p-3 rounded-lg border transition-all gap-1",
                        resultStatus === 'hold' ? "bg-amber-500 text-white border-amber-500 shadow-md" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                     )}
                  >
                     <Clock size={18} />
                     <span className="text-xs font-bold">보류</span>
                  </button>
                  <button
                     onClick={() => setResultStatus('fail')}
                     className={clsx(
                        "flex flex-col items-center justify-center p-3 rounded-lg border transition-all gap-1",
                        resultStatus === 'fail' ? "bg-rose-600 text-white border-rose-600 shadow-md" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                     )}
                  >
                     <Ban size={18} />
                     <span className="text-xs font-bold">실패</span>
                  </button>
               </div>

               {/* Result Details */}
               {resultStatus === 'success' && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                     <button 
                        onClick={() => setIsContractModalOpen(true)}
                        className="w-full py-3 bg-white border border-dashed border-emerald-500 text-emerald-600 rounded-lg text-sm font-bold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                     >
                        <Plus size={16} /> 상세 계약 정보 등록
                     </button>
                  </div>
               )}
            </div>

            {/* Step 3: Memo */}
            <div>
               <label className="text-xs font-bold text-slate-500 mb-2 block uppercase flex items-center gap-1">
                  <span className="bg-slate-200 text-slate-600 size-4 rounded-full flex items-center justify-center text-[10px]">3</span>
                  담당자 메모
               </label>
               <textarea 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-xs min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="미팅 후 특이사항이나 고객 요청사항을 기록하세요..."
               />
            </div>

            {/* Save Button */}
            <button 
               className="w-full py-3 bg-[#0f766e] text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-md flex items-center justify-center gap-2"
               onClick={() => {
                  toast.success('미팅 결과가 저장되었습니다!');
                  onBack();
               }}
            >
               <SaveIcon size={16} /> 미팅 결과 저장
            </button>
         </div>
      </>
   );

   return (
      <>
         <RequestDetailView
            actionPanel={ActionPanel}
            data={meeting}
            title={`${meeting.customer} 고객 미팅 결과 입력`}
            onBack={onBack}
            badge={{
               label: meeting.dbType,
               colorClass: "bg-emerald-50 text-emerald-600"
            }}
         />
         {isContractModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
               <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4">
                  <div className="p-6">
                     <h3 className="text-xl font-bold text-[#1e293b] mb-4">계약 정보 등록</h3>
                     <p className="text-sm text-slate-500">상세 계약 정보를 입력하세요.</p>
                     <div className="mt-4 flex gap-2 justify-end">
                        <button 
                           onClick={() => setIsContractModalOpen(false)}
                           className="px-4 py-2 bg-slate-100 text-slate-700 rounded font-bold hover:bg-slate-200"
                        >
                           취소
                        </button>
                        <button 
                           onClick={() => {
                              setIsContractModalOpen(false);
                              toast.success('계약 정보가 등록되었습니다.');
                           }}
                           className="px-4 py-2 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700"
                        >
                           등록
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </>
   );
}
