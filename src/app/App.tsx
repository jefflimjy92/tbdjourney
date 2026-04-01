import React, { Suspense, lazy, useEffect, useState } from 'react';
import {
  Bell,
  Search,
  User,
} from 'lucide-react';
import { Toaster } from 'sonner';
import { JourneyProvider } from '@/app/journey/JourneyContext';
import { IssuanceProvider } from '@/app/issuance/IssuanceContext';
import { RoleProvider, useRole } from '@/app/auth/RoleContext';
import { Sidebar } from '@/app/navigation/Sidebar';
import { Handoff } from './pages/Handoff';
import type { NavItem } from '@/app/navigation/navConfig';
import type { TeamRole } from '@/app/journey/types';

function lazyNamed<T extends Record<string, React.ComponentType<any>>, K extends keyof T>(
  loader: () => Promise<T>,
  key: K,
) {
  return lazy(async () => {
    const module = await loader();
    return { default: module[key] };
  });
}

const Dashboard = lazyNamed(() => import('./pages/Dashboard'), 'Dashboard');
const Customers = lazyNamed(() => import('./pages/Customers'), 'Customers');
const Requests = lazyNamed(() => import('./pages/Requests'), 'Requests');
const CaseDetailPage = lazyNamed(() => import('./pages/CaseDetailPage'), 'CaseDetailPage');
const Consultation = lazyNamed(() => import('./pages/Consultation'), 'Consultation');
const MeetingSchedule = lazyNamed(() => import('./pages/MeetingSchedule'), 'MeetingSchedule');
const MeetingExecution = lazyNamed(() => import('./pages/MeetingExecution'), 'MeetingExecution');
const ContractList = lazyNamed(() => import('./pages/ContractList'), 'ContractList');
const Claims = lazyNamed(() => import('./pages/Claims'), 'Claims');
const IssuanceMaster = lazyNamed(() => import('./pages/IssuanceMaster'), 'IssuanceMaster');
const IssuanceStaff = lazyNamed(() => import('./pages/IssuanceStaff'), 'IssuanceStaff');
const DropOffLogs = lazyNamed(() => import('./pages/DropOffLogs'), 'DropOffLogs');
const Documents = lazyNamed(() => import('./pages/Documents'), 'Documents');
const SystemSettings = lazyNamed(() => import('./pages/Settings'), 'SystemSettings');
const Leads = lazyNamed(() => import('./pages/Leads'), 'Leads');
const DailyReport = lazyNamed(() => import('./pages/DailyReport'), 'DailyReport');
const FirstTM = lazyNamed(() => import('./pages/tm/FirstTM'), 'FirstTM');
const SecondTM = lazyNamed(() => import('./pages/tm/SecondTM'), 'SecondTM');
const TMChecklist = lazyNamed(() => import('./pages/tm/TMChecklist'), 'TMChecklist');
const PreAnalysis = lazyNamed(() => import('./pages/meeting/PreAnalysis'), 'PreAnalysis');
const MeetingOnSite = lazyNamed(() => import('./pages/meeting/MeetingOnSite'), 'MeetingOnSite');
const ContractClose = lazyNamed(() => import('./pages/meeting/ContractClose'), 'ContractClose');
const ClaimReceipt = lazyNamed(() => import('./pages/claims/ClaimReceipt'), 'ClaimReceipt');
const UnpaidAnalysis = lazyNamed(() => import('./pages/claims/UnpaidAnalysis'), 'UnpaidAnalysis');
const DocIssuance = lazyNamed(() => import('./pages/claims/DocIssuance'), 'DocIssuance');
const FinalAnalysis = lazyNamed(() => import('./pages/claims/FinalAnalysis'), 'FinalAnalysis');
const PaymentConfirm = lazyNamed(() => import('./pages/payment/PaymentConfirm'), 'PaymentConfirm');
const Aftercare = lazyNamed(() => import('./pages/payment/Aftercare'), 'Aftercare');
const ReferralManagement = lazyNamed(() => import('./pages/growth/ReferralManagement'), 'ReferralManagement');
const VocManagement = lazyNamed(() => import('./pages/cs/VocManagement'), 'VocManagement');
const ComplianceDashboard = lazyNamed(() => import('./pages/compliance/ComplianceDashboard'), 'ComplianceDashboard');
const AdminOperations = lazyNamed(() => import('./pages/admin'), 'AdminOperations');
const SimpleClaimWorkflow = lazyNamed(() => import('./pages/simpleClaims/SimpleClaimWorkflow'), 'SimpleClaimWorkflow');

const DEBUG_ROLE_SET = new Set<TeamRole>([
  'call_member',
  'call_lead',
  'sales_member',
  'sales_lead',
  'claims_member',
  'claims_lead',
  'cs',
  'compliance',
  'admin',
]);

const DEBUG_TAB_SET = new Set<NavItem>([
  'dashboard',
  'customers',
  'leads',
  'requests',
  'case-detail',
  'consultation',
  'tm-first',
  'tm-second',
  'tm-checklist',
  'handoff',
  'meeting-schedule',
  'meeting-all',
  'meeting-refund',
  'meeting-simple',
  'meeting-pre-analysis',
  'meeting-on-site',
  'meeting-contract-close',
  'contracts',
  'claims-all',
  'claims-refund',
  'claims-simple',
  'claims-issuance',
  'claims-receipt',
  'claims-unpaid',
  'claims-doc-issuance',
  'claims-final',
  'issuance-master',
  'issuance-manager',
  'issuance-staff',
  'payment-confirm',
  'aftercare',
  'referral-management',
  'simple-claims',
  'voc',
  'compliance',
  'admin-operations',
  'dropoff',
  'daily-report',
  'documents',
  'settings',
]);

export default function App() {
  return (
    <JourneyProvider>
      <IssuanceProvider>
        <RoleProvider>
          <AppShell />
        </RoleProvider>
      </IssuanceProvider>
    </JourneyProvider>
  );
}

function AppShell() {
  const [activeTab, setActiveTab] = useState<NavItem>('requests');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [targetRequestId, setTargetRequestId] = useState<string | null>(null);
  const [initialSection, setInitialSection] = useState<'call' | 'sales' | 'claims'>('call');
  const { roleLabel, setRole } = useRole();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const debugTab = params.get('tab');
    const debugRole = params.get('role');
    const debugRequestId = params.get('requestId');
    const debugSection = params.get('section');

    if (debugRole && DEBUG_ROLE_SET.has(debugRole as TeamRole)) {
      setRole(debugRole as TeamRole);
    }

    if (debugSection === 'call' || debugSection === 'sales' || debugSection === 'claims') {
      setInitialSection(debugSection);
    }

    if (debugRequestId) {
      setTargetRequestId(debugRequestId);
    }

    if (debugTab && DEBUG_TAB_SET.has(debugTab as NavItem)) {
      setActiveTab(debugTab as NavItem);
    }
  }, [setRole]);

  const goToTab = (tab: NavItem) => {
    setSelectedCustomerId(null);
    setTargetRequestId(null);
    setActiveTab(tab);
  };

  // Enhanced navigation handler that supports customer ID and Request ID linkage
  const handleNavigate = (target: string) => {
    // 1. Customer Deep Link: "customers:ID"
    if (target.startsWith('customers:')) {
      const customerId = target.split(':')[1];
      setSelectedCustomerId(customerId);
      setTargetRequestId(null);
      setActiveTab('customers');
    } 
    // 2. Request Deep Link (for Team Processing): "consultation:REQ_ID"
    else if (target.includes(':')) {
      const [path, id] = target.split(':');
      setTargetRequestId(id);
      setSelectedCustomerId(null);
      
      // Map path to tab
      if (path === 'consultation') {
        setInitialSection('call');
        setActiveTab('case-detail');
      }
      else if (path === 'consultation-v2') {
        setInitialSection('call');
        setActiveTab('case-detail');
      }
      else if (path === 'meeting-all') {
        setInitialSection('sales');
        setActiveTab('case-detail');
      }
      else if (path === 'claims-all') {
        setInitialSection('claims');
        setActiveTab('case-detail');
      }
      else if (path === 'case-detail') setActiveTab('case-detail');
      else setActiveTab(path as NavItem);
    }
    // 3. Simple Navigation
    else {
      setSelectedCustomerId(null);
      setTargetRequestId(null);
      // Fallback mapping
      if (target === 'consultation') setActiveTab('consultation');
      else if (target === 'consultation-v2') setActiveTab('consultation');
      else if (target === 'meeting-execution') setActiveTab('meeting-all');
      else if (target === 'claims') setActiveTab('claims-all');
      else setActiveTab(target as NavItem);
    }
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'customers': return <Customers initialCustomerId={selectedCustomerId} onNavigate={handleNavigate} />;
      case 'leads': return <Leads />;
      case 'requests': return <Requests onNavigate={handleNavigate} />;
      case 'case-detail':
        return (
          <CaseDetailPage
            requestId={targetRequestId ?? ''}
            initialSection={initialSection}
            onNavigate={handleNavigate}
          />
        );
      
      case 'consultation': return <Consultation initialRequestId={targetRequestId} />; // 전체 (type undefined)
      case 'tm-first': return <FirstTM initialRequestId={targetRequestId} />;
      case 'tm-second': return <SecondTM initialRequestId={targetRequestId} />;
      case 'tm-checklist': return <TMChecklist initialRequestId={targetRequestId} />;
      case 'handoff': return <Handoff onNavigate={handleNavigate} />;
      
      case 'meeting-schedule': return <MeetingSchedule onNavigate={handleNavigate} />;
      
      // Meeting Execution
      case 'meeting-all': return <MeetingExecution onNavigate={handleNavigate} initialRequestId={targetRequestId} />;
      case 'meeting-pre-analysis': return <PreAnalysis onNavigate={handleNavigate} initialRequestId={targetRequestId} />;
      case 'meeting-on-site': return <MeetingOnSite onNavigate={handleNavigate} initialRequestId={targetRequestId} />;
      case 'meeting-contract-close': return <ContractClose onNavigate={handleNavigate} initialRequestId={targetRequestId} />;
      
      case 'contracts': return <ContractList />;
      
      // Claims
      case 'claims-all': return <Claims initialRequestId={targetRequestId} onNavigate={handleNavigate} />;
      case 'claims-receipt': return <ClaimReceipt initialRequestId={targetRequestId} onNavigate={handleNavigate} />;
      case 'claims-unpaid': return <UnpaidAnalysis initialRequestId={targetRequestId} onNavigate={handleNavigate} />;
      case 'claims-doc-issuance': return <DocIssuance initialRequestId={targetRequestId} onNavigate={handleNavigate} />;
      case 'claims-final': return <FinalAnalysis initialRequestId={targetRequestId} onNavigate={handleNavigate} />;
      case 'claims-issuance': return <IssuanceMaster initialClaimId={targetRequestId} onNavigate={handleNavigate} />;
      case 'issuance-master': return <IssuanceMaster initialClaimId={targetRequestId} onNavigate={handleNavigate} />;
      case 'issuance-manager': return <IssuanceMaster initialClaimId={targetRequestId} onNavigate={handleNavigate} />;
      case 'issuance-staff': return <IssuanceStaff initialStaffId={targetRequestId} onNavigate={handleNavigate} />;
      
      // Phase 7: 지급/사후
      case 'payment-confirm': return <PaymentConfirm />;
      case 'aftercare': return <Aftercare />;

      // Phase 8: Growth Loop
      case 'referral-management': return <ReferralManagement />;

      // 간편청구
      case 'simple-claims': return <SimpleClaimWorkflow />;

      // CS / VOC / 준법
      case 'voc': return <VocManagement />;
      case 'compliance': return <ComplianceDashboard />;
      case 'admin-operations': return <AdminOperations />;

      case 'dropoff': return <DropOffLogs />;
      case 'daily-report': return <DailyReport />;
      case 'documents': return <Documents />;
      case 'settings': return <SystemSettings />;
      default: return <Dashboard />;
    }
  };

  // Helper to get header title
  const getHeaderTitle = () => {
    switch(activeTab) {
      case 'dashboard': return '데이터 건전성 대시보드';
      case 'customers': return '고객 관리 ';
      case 'leads': return 'DB 배정 관리 (신청 유입)';
      case 'requests': return '처리 현황';
      case 'case-detail': return '케이스 상세';
      case 'consultation': return '상담 리스트 (전체)';
      case 'tm-first': return '1차 TM (S5)';
      case 'tm-second': return '2차 TM (S6)';
      case 'tm-checklist': return 'TM 체크리스트';
      case 'handoff': return '이관(Handoff) 관리';
      case 'meeting-schedule': return '미팅 스케줄 관리';
      case 'meeting-all': return '미팅 리스트 (전체)';
      case 'meeting-pre-analysis': return '사전 분석 (S7)';
      case 'meeting-on-site': return '미팅 실행 (S8)';
      case 'meeting-contract-close': return '계약 체결 (S9)';
      case 'contracts': return '계약 체결 및 관리';
      case 'claims-all': return '청구 리스트 (전체)';
      case 'claims-receipt': return '청구 접수 (S10)';
      case 'claims-unpaid': return '미지급금 분석 (S11)';
      case 'claims-doc-issuance': return '서류 발급 (S12)';
      case 'claims-final': return '최종 분석 (S13)';
      case 'claims-issuance': return '서류 발급 대행 - 전체 리스트';
      case 'issuance-master': return '서류 발급 대행 - 전체 리스트';
      case 'issuance-manager': return '서류 발급 대행 - 전체 리스트';
      case 'issuance-staff': return '서류 발급 대행 - 직원별 리스트';
      case 'payment-confirm': return '지급 확인 (S14)';
      case 'aftercare': return '사후 관리 (S15)';
      case 'referral-management': return '소개 / Growth Loop (S16-S17)';
      case 'simple-claims': return '간편청구 워크플로우 (Q1-Q9)';
      case 'voc': return 'CS / VOC 관리';
      case 'compliance': return '준법 / 개인정보 대시보드';
      case 'admin-operations': return '관리업무 운영';
      case 'dropoff': return '이탈 사유 분석 (Read-only)';
      case 'daily-report': return '일일 보고서';
      case 'documents': return '서류 및 동의서 관리';
      case 'settings': return '시스템 설정';
      default: return '';
    }
  };

  const loadingFallback = (
    <div className="flex h-full min-h-[480px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
      <div className="space-y-3 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#0f766e]" />
        <div className="text-sm font-medium text-slate-600">화면 불러오는 중...</div>
      </div>
    </div>
  );

  return (
      <div className="flex h-screen w-full bg-[#F6F7F9] font-sans text-slate-900 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          isSidebarOpen={isSidebarOpen}
          onTabChange={goToTab}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Header */}
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10">
            <div className="flex items-center text-slate-500 text-sm">
              <span className="font-bold text-[#1e293b] text-lg">
                {getHeaderTitle()}
              </span>
              <span className="mx-3 text-slate-300">|</span>
              <span className="text-slate-500 font-medium">Ops System #1 (Request Centric)</span>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="접수ID, 고객명, 연락처 검색..."
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:bg-white transition-all"
                />
              </div>

              <button className="relative p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors group">
                <Bell size={20} className="group-hover:text-[#0f766e]" />
                <span className="absolute top-2 right-2 size-2 bg-amber-500 rounded-full border-2 border-white"></span>
              </button>

              <div className="h-8 w-px bg-slate-200"></div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-bold text-[#1e293b]">김실무 매니저</div>
                  <div className="text-xs text-white bg-[#0f766e] px-1.5 py-0.5 rounded inline-block font-medium mt-0.5">{roleLabel}</div>
                </div>
                <div className="size-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200 cursor-pointer hover:bg-slate-200">
                  <User size={18} />
                </div>
              </div>
            </div>
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-auto bg-[#F6F7F9] relative">
            <div className="p-8 min-w-[1000px] h-full">
              <Suspense fallback={loadingFallback}>
                {renderContent()}
              </Suspense>
            </div>
          </div>
        </main>
        <Toaster richColors position="top-right" />
      </div>
  );
}
