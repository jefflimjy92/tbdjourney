import React, { useState } from 'react';
import {
  Bell,
  Search,
  User,
} from 'lucide-react';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { Requests } from './pages/Requests';
import { Consultation } from './pages/Consultation';
import { MeetingSchedule } from './pages/MeetingSchedule';
import { MeetingExecution } from './pages/MeetingExecution';
import { ContractList } from './pages/ContractList';
import { Claims } from './pages/Claims';
import { IssuanceMaster } from './pages/IssuanceMaster';
import { IssuanceStaff } from './pages/IssuanceStaff';
import { DropOffLogs } from './pages/DropOffLogs';
import { Documents } from './pages/Documents';
import { SystemSettings } from './pages/Settings';
import { Leads } from './pages/Leads';
import { Handoff } from './pages/Handoff';
import { DailyReport } from './pages/DailyReport';
import { FirstTM } from './pages/tm/FirstTM';
import { SecondTM } from './pages/tm/SecondTM';
import { TMChecklist } from './pages/tm/TMChecklist';
import { PreAnalysis } from './pages/meeting/PreAnalysis';
import { MeetingOnSite } from './pages/meeting/MeetingOnSite';
import { ContractClose } from './pages/meeting/ContractClose';
import { ClaimReceipt } from './pages/claims/ClaimReceipt';
import { UnpaidAnalysis } from './pages/claims/UnpaidAnalysis';
import { DocIssuance } from './pages/claims/DocIssuance';
import { FinalAnalysis } from './pages/claims/FinalAnalysis';
import { PaymentConfirm } from './pages/payment/PaymentConfirm';
import { Aftercare } from './pages/payment/Aftercare';
import { ReferralManagement } from './pages/growth/ReferralManagement';
import { VocManagement } from './pages/cs/VocManagement';
import { ComplianceDashboard } from './pages/compliance/ComplianceDashboard';
import { AdminOperations } from './pages/admin';
import { SimpleClaimWorkflow } from './pages/simpleClaims/SimpleClaimWorkflow';
import { Toaster } from 'sonner';
import { JourneyProvider } from '@/app/journey/JourneyContext';
import { IssuanceProvider } from '@/app/issuance/IssuanceContext';
import { RoleProvider, useRole } from '@/app/auth/RoleContext';
import { Sidebar } from '@/app/navigation/Sidebar';
import type { NavItem } from '@/app/navigation/navConfig';

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
  const { roleLabel } = useRole();

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
      if (path === 'consultation') setActiveTab('consultation');
      else if (path === 'consultation-v2') setActiveTab('consultation');
      else if (path === 'meeting-all') setActiveTab('meeting-all');
      else if (path === 'claims-all') setActiveTab('claims-all');
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
      case 'requests': return '접수 현황 (전체)';
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
              {renderContent()}
            </div>
          </div>
        </main>
        <Toaster richColors position="top-right" />
      </div>
  );
}
