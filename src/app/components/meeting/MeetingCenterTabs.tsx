import React from 'react';
import { Users, Shield, FileText, CheckCircle2, FileCheck } from 'lucide-react';
import clsx from 'clsx';
import { CustomerBasicInfoTab } from './CustomerBasicInfoTab';
import { InsuranceAnalysisTab } from './InsuranceAnalysisTab';
import { SalesScriptTab } from './SalesScriptTab';

export type CenterTab = 'customer' | 'insurance' | 'script' | 'meetingComplete' | 'contractRegistration';

interface MeetingCenterTabsProps {
  item: any;
  customer: any;
  activeTab: CenterTab;
  onTabChange: (tab: CenterTab) => void;
  renderProfileSummary: () => React.ReactNode;
  renderContractInfo: () => React.ReactNode;
  renderCustomerInput: () => React.ReactNode;
  renderHealthCheck?: () => React.ReactNode;
  renderConsultationChecklist: () => React.ReactNode;
  renderMeetingCompleteTab?: () => React.ReactNode;
  renderContractRegistrationTab?: () => React.ReactNode;
}

const TABS = [
  { id: 'customer' as CenterTab, label: '고객 기본 정보', icon: <Users size={14} /> },
  { id: 'insurance' as CenterTab, label: '보험 분석', icon: <Shield size={14} /> },
  { id: 'script' as CenterTab, label: '영업 스크립트', icon: <FileText size={14} /> },
  { id: 'meetingComplete' as CenterTab, label: '미팅 완료', icon: <CheckCircle2 size={14} /> },
  { id: 'contractRegistration' as CenterTab, label: '계약 등록', icon: <FileCheck size={14} /> },
] as const;

export function MeetingCenterTabs({
  item,
  customer,
  activeTab,
  onTabChange,
  renderProfileSummary,
  renderContractInfo,
  renderCustomerInput,
  renderHealthCheck,
  renderConsultationChecklist,
  renderMeetingCompleteTab,
  renderContractRegistrationTab,
}: MeetingCenterTabsProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-200 shrink-0 rounded-t-xl">
        <div className="flex overflow-x-auto custom-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                'shrink-0 min-w-[132px] py-3.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors px-3',
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50',
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pt-6">
        <div className="space-y-6">
          {activeTab === 'customer' && (
            <div id="tab-customer">
              <CustomerBasicInfoTab
                item={item}
                customerProfileProps={{}}
                contractInfoProps={{}}
                customerInputProps={{}}
                renderProfileSummary={renderProfileSummary}
                renderContractInfo={renderContractInfo}
                renderCustomerInput={renderCustomerInput}
                renderHealthCheck={renderHealthCheck}
                renderConsultationChecklist={renderConsultationChecklist}
              />
            </div>
          )}

          {activeTab === 'insurance' && (
            <div id="tab-insurance">
              <InsuranceAnalysisTab />
            </div>
          )}

          {activeTab === 'script' && (
            <div id="tab-script">
              <SalesScriptTab />
            </div>
          )}

          {activeTab === 'meetingComplete' &&
            (renderMeetingCompleteTab ? (
              <div id="tab-meeting-complete">{renderMeetingCompleteTab()}</div>
            ) : (
              <div id="tab-meeting-complete" className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                미팅 완료 탭 컨텐츠가 아직 연결되지 않았습니다.
              </div>
            ))}

          {activeTab === 'contractRegistration' &&
            (renderContractRegistrationTab ? (
              <div id="tab-contract-registration">{renderContractRegistrationTab()}</div>
            ) : (
              <div id="tab-contract-registration" className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                계약 등록 탭 컨텐츠가 아직 연결되지 않았습니다.
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
