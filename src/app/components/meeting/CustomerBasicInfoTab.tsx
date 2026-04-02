import React from 'react';
import { Clock, MapPin } from 'lucide-react';

interface CustomerBasicInfoTabProps {
  item: any;
  customerProfileProps: any;
  contractInfoProps: any;
  customerInputProps: any;
  renderProfileSummary: () => React.ReactNode;
  renderContractInfo: () => React.ReactNode;
  renderCustomerInput: () => React.ReactNode;
  renderHealthCheck?: () => React.ReactNode;
  renderConsultationChecklist: () => React.ReactNode;
}

export function CustomerBasicInfoTab({
  item,
  renderProfileSummary,
  renderContractInfo,
  renderCustomerInput,
  renderHealthCheck,
  renderConsultationChecklist,
}: CustomerBasicInfoTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <MapPin size={20} />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">미팅 장소</div>
              <div className="font-bold text-slate-700 text-sm">{item.location || '미확인'}</div>
            </div>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Clock size={20} />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">미팅 시간</div>
              <div className="font-bold text-slate-700 text-sm">{item.date || '미확인'}</div>
            </div>
          </div>
        </div>
        <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded transition-colors">
          수정하기
        </button>
      </div>

      {renderProfileSummary()}
      {renderConsultationChecklist()}
      {renderHealthCheck && renderHealthCheck()}
      {renderCustomerInput()}
      {renderContractInfo()}
    </div>
  );
}
