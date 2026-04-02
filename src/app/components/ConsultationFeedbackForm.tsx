import React, { useState, useMemo, useEffect } from 'react';
import { FileText, Save, X, ChevronDown, ChevronUp, Check } from 'lucide-react';
import clsx from 'clsx';
import { toast } from "sonner";

interface ConsultationFeedbackFormProps {
  meeting: any;
  onClose?: () => void;
  isEmbedded?: boolean;
}

// Helper to calculate initial state based on meeting data
const calculateInitialValues = (meeting: any) => {
   if (!meeting) return {
      past_disease: { isActive: false, text: '' },
      traffic_accident: { isActive: false, text: '' },
      fracture_sequela: { isActive: false, text: '' },
      surgery: { isActive: false, text: '' },
      duty_violation: { isActive: false, text: '' },
      first_explanation: { isActive: false, text: '' },
      denial_reason: { isActive: false, text: '' },
      expensive_reason: { isActive: false, text: '' },
      comparison: { isActive: false, text: '' },
      memo: { isActive: true, text: '' }
   };

   const pastDiseaseText = [
      { label: '5년 이내 3대질환', value: meeting.consultation?.criticalDisease || meeting.analysis?.criticalIllness },
      { label: '시술/수술 이력', value: meeting.analysis?.surgeryHistory },
      { label: '3개월 내 병력', value: meeting.consultation?.medicalHistory || meeting.analysis?.recentMedical },
      { label: '가족력', value: meeting.analysis?.familyHistory }
   ]
   .filter(item => item.value && item.value !== '없음' && item.value !== false)
   .map(item => `[${item.label}] ${item.value}`)
   .join('\n\n');

   return {
      // Section 1
      past_disease: { isActive: true, text: pastDiseaseText },
      
      // Section 2
      traffic_accident: { isActive: false, text: '' },
      fracture_sequela: { isActive: false, text: '' },
      surgery: { isActive: false, text: '' },
      duty_violation: { isActive: false, text: '' },
      
      // Section 3
      first_explanation: { isActive: false, text: '' },
      denial_reason: { isActive: false, text: '' },
      expensive_reason: { isActive: false, text: '' },
      comparison: { isActive: false, text: '' },
      
      // Section 4
      memo: { isActive: true, text: '' }
   };
};

type FeedbackValues = ReturnType<typeof calculateInitialValues>;
type FeedbackKey = keyof FeedbackValues;

export function ConsultationFeedbackForm({ meeting, onClose, isEmbedded = false }: ConsultationFeedbackFormProps) {
  const Container = isEmbedded ? 'div' : 'div';
  const containerClass = isEmbedded ? 'bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden' : 'flex flex-col h-full overflow-hidden';

  // State Management
  // We use a function in useState to initialize only once
  const [initialValues, setInitialValues] = useState<FeedbackValues>(() => calculateInitialValues(meeting));
  const [values, setValues] = useState(initialValues);

  // Check for unsaved changes
  const isDirty = useMemo(() => {
     return JSON.stringify(values) !== JSON.stringify(initialValues);
  }, [values, initialValues]);

  // Handlers
  const handleChange = (key: FeedbackKey, text: string) => {
     setValues(prev => ({ ...prev, [key]: { ...prev[key], text } }));
  };

  const handleToggle = (key: FeedbackKey) => {
     setValues(prev => ({ ...prev, [key]: { ...prev[key], isActive: !prev[key].isActive } }));
  };

  const handleSave = () => {
     // Here you would typically make an API call
     setInitialValues(values); // Reset dirty state
     toast.success("저장되었습니다.");
  };

  // Prevent browser close/refresh if dirty
  useEffect(() => {
     const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (isDirty) {
           e.preventDefault();
           e.returnValue = '';
        }
     };

     if (isDirty) {
        window.addEventListener('beforeunload', handleBeforeUnload);
     }
     
     return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
     };
  }, [isDirty]);

  // Intercept Close
  const handleClose = () => {
     if (!onClose) return;

     if (isDirty) {
        if (window.confirm("변경사항이 저장되지 않았습니다. 정말 나가시겠습니까?")) {
           onClose();
        }
     } else {
        onClose();
     }
  };

  return (
    <Container className={containerClass}>
       {/* Form Header */}
       <div className={clsx(
          "flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50 flex-none",
          isEmbedded && "rounded-t-xl"
       )}>
          <div className="flex items-center gap-2">
             <FileText size={18} className="text-[#1e293b]" />
             <h3 className="font-bold text-[#1e293b]">상담원 피드백 관리 | <span className="text-slate-500">더바디-m</span></h3>
          </div>
          <div className="flex items-center gap-2">
             <button 
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] text-white rounded text-xs font-bold hover:bg-slate-800 transition-colors"
             >
                <Save size={14} /> 저장
             </button>
             {onClose && (
                <button onClick={handleClose} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-600 rounded text-xs font-bold hover:bg-slate-50 transition-colors">
                   <X size={14} /> 닫기
                </button>
             )}
          </div>
       </div>

       {/* Form Content */}
       <div className={clsx(
          "bg-slate-50/30",
          !isEmbedded && "flex-1 overflow-y-auto p-6",
          isEmbedded && "p-0"
       )}>
          <div className={clsx(
             "bg-white border-slate-200 overflow-hidden",
             !isEmbedded && "max-w-5xl mx-auto border shadow-sm rounded-lg",
             isEmbedded && "border-0 shadow-none"
          )}>
             {/* Basic Info (Optional per context, keeping it minimal) */}
             {!isEmbedded && meeting && (
               <div className="grid grid-cols-1 md:grid-cols-3 border-b border-slate-200">
                  <div className="md:col-span-2 p-6">
                     <div className="grid grid-cols-[100px_1fr] gap-y-4 items-center">
                        <label className="text-sm font-bold text-slate-600">고객이름</label>
                        <div className="text-sm font-medium text-[#1e293b]">{meeting.customer || '이름 없음'}</div>
                        
                        <label className="text-sm font-bold text-slate-600">생년월일</label>
                        <div className="text-sm font-medium text-[#1e293b]">{meeting.birthDate || meeting.birth || '정보 없음'}</div>
                        
                        <label className="text-sm font-bold text-slate-600">미팅일자</label>
                        <div className="text-sm font-medium text-[#1e293b]">{meeting.date || ''} {meeting.time || ''}</div>
                     </div>
                  </div>
                  <div className="p-4 bg-blue-50/50 border-l border-slate-200">
                     <div className="border border-blue-200 rounded-lg bg-white p-3 h-full shadow-sm">
                        <div className="text-xs font-bold text-blue-700 mb-2 border-b border-blue-100 pb-1 text-center">기본설명정보</div>
                        <ul className="text-[11px] space-y-1 text-slate-600">
                           <li className="flex justify-between"><span>자동차사고부상 :</span> <span className="font-bold">30만원</span></li>
                           <li className="flex justify-between"><span>골절진단비 :</span> <span className="font-bold">50만원</span></li>
                           <li className="flex justify-between"><span>깁스치료비 :</span> <span className="font-bold">30만원</span></li>
                           <li className="flex justify-between"><span>상해수술비 :</span> <span className="font-bold">100만원</span></li>
                           <li className="flex justify-between"><span>5대골절진단비 :</span> <span className="font-bold">100만원</span></li>
                        </ul>
                     </div>
                  </div>
               </div>
             )}

             {/* Feedback Sections */}
             <div className="p-6 space-y-8">
                
                {/* Section 1: Past Disease */}
                <div>
                   <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <span className="size-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs">1</span>
                      과거 주요 병명
                   </h4>
                   <FeedbackItem 
                      label="과거주요 병명 상세" 
                      placeholder="병명 및 상세 내용을 입력하세요."
                      isActive={values.past_disease.isActive}
                      text={values.past_disease.text}
                      onToggle={() => handleToggle('past_disease')}
                      onChange={(txt) => handleChange('past_disease', txt)}
                   />
                </div>

                {/* Section 2: Important Points */}
                <div>
                   <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                         <span className="size-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs">2</span>
                         2단계 중요 포인트 피드백
                      </h4>
                      <span className="text-xs text-slate-400">필요한 항목만 활성화하여 작성하세요</span>
                   </div>
                   <div className="grid grid-cols-1 gap-3">
                      <FeedbackItem 
                         label="1. 교통사고" 
                         placeholder="교통사고 관련 피드백 입력"
                         isActive={values.traffic_accident.isActive}
                         text={values.traffic_accident.text}
                         onToggle={() => handleToggle('traffic_accident')}
                         onChange={(txt) => handleChange('traffic_accident', txt)}
                      />
                      <FeedbackItem 
                         label="2. 골절 후유장해" 
                         placeholder="골절 및 후유장해 관련 내용 입력" 
                         isActive={values.fracture_sequela.isActive}
                         text={values.fracture_sequela.text}
                         onToggle={() => handleToggle('fracture_sequela')}
                         onChange={(txt) => handleChange('fracture_sequela', txt)}
                      />
                      <FeedbackItem 
                         label="3. 입원수술" 
                         placeholder="입원 및 수술 이력 관련 코멘트" 
                         isActive={values.surgery.isActive}
                         text={values.surgery.text}
                         onToggle={() => handleToggle('surgery')}
                         onChange={(txt) => handleChange('surgery', txt)}
                      />
                      <FeedbackItem 
                         label="4. 고지의무 위반" 
                         placeholder="고지의무 위반 사항 체크 및 내용" 
                         isActive={values.duty_violation.isActive}
                         text={values.duty_violation.text}
                         onToggle={() => handleToggle('duty_violation')}
                         onChange={(txt) => handleChange('duty_violation', txt)}
                      />
                   </div>
                </div>

                {/* Section 3: Insurance Review */}
                <div>
                   <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                         <span className="size-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs">3</span>
                         보험 열람 후 피드백
                      </h4>
                      <span className="text-xs text-slate-400">필요한 항목만 활성화하여 작성하세요</span>
                   </div>
                   <div className="grid grid-cols-1 gap-3">
                      <FeedbackItem 
                         label="1. 최초 설명" 
                         placeholder="최초 설명 내용 기록" 
                         isActive={values.first_explanation.isActive}
                         text={values.first_explanation.text}
                         onToggle={() => handleToggle('first_explanation')}
                         onChange={(txt) => handleChange('first_explanation', txt)}
                      />
                      <FeedbackItem 
                         label="2. 안나오는 이유 설명" 
                         placeholder="부지급 사유 등 설명 내용" 
                         isActive={values.denial_reason.isActive}
                         text={values.denial_reason.text}
                         onToggle={() => handleToggle('denial_reason')}
                         onChange={(txt) => handleChange('denial_reason', txt)}
                      />
                      <FeedbackItem 
                         label="3. 비싼 이유" 
                         placeholder="보험료 관련 상세 설명" 
                         isActive={values.expensive_reason.isActive}
                         text={values.expensive_reason.text}
                         onToggle={() => handleToggle('expensive_reason')}
                         onChange={(txt) => handleChange('expensive_reason', txt)}
                      />
                      <FeedbackItem 
                         label="4. 비교분석" 
                         placeholder="타사 상품 비교 분석 내용" 
                         isActive={values.comparison.isActive}
                         text={values.comparison.text}
                         onToggle={() => handleToggle('comparison')}
                         onChange={(txt) => handleChange('comparison', txt)}
                      />
                   </div>
                </div>

                {/* Section 4: Additional Feedback */}
                <div>
                   <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                         <span className="size-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs">4</span>
                         추가 피드백 (기타 메모)
                      </h4>
                      <span className="text-xs text-slate-400">자유롭게 작성하세요</span>
                   </div>
                   <div className="grid grid-cols-1 gap-3">
                      <FeedbackItem 
                         label="기타 메모" 
                         placeholder="상담 중 특이사항이나 추가로 기록할 내용을 자유롭게 작성하세요." 
                         isActive={values.memo.isActive}
                         text={values.memo.text}
                         onToggle={() => handleToggle('memo')}
                         onChange={(txt) => handleChange('memo', txt)}
                      />
                   </div>
                </div>

             </div>
          </div>
          
          {/* Footer Padding */}
          {!isEmbedded && <div className="h-10" />}
       </div>
    </Container>
  );
}

// Controlled Component
function FeedbackItem({ 
   label, 
   placeholder, 
   isActive,
   text,
   onToggle,
   onChange,
   isDeletable = false,
}: { 
   label: string, 
   placeholder: string, 
   isActive: boolean,
   text: string,
   onToggle: () => void,
   onChange: (text: string) => void,
   isDeletable?: boolean,
}) {
   return (
      <div className={clsx(
         "border rounded-lg transition-all duration-200 overflow-hidden group",
         isActive ? "border-slate-300 bg-white shadow-sm ring-1 ring-slate-200" : "border-slate-200 bg-slate-50/50"
      )}>
         {/* Header / Toggle Area */}
         <div 
            onClick={onToggle}
            className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
         >
            <div className="flex items-center gap-3">
               <SimpleToggle checked={isActive} />
               <span className={clsx(
                  "text-sm font-bold transition-colors",
                  isActive ? "text-slate-800" : "text-slate-500"
               )}>
                  {label}
               </span>
            </div>
            
            <div className="flex items-center gap-3">
               {!isActive && text.length > 0 && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                     <FileText size={12} /> 작성됨
                  </span>
               )}

               {isActive ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </div>
         </div>

         {/* Content Area */}
         {isActive && (
            <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-200">
               <textarea 
                  value={text}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full min-h-[100px] p-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none bg-slate-50 focus:bg-white"
                  placeholder={placeholder}
                  autoFocus
               />
            </div>
         )}
      </div>
   );
}

function SimpleToggle({ checked }: { checked: boolean }) {
   return (
      <div className={clsx(
         "w-9 h-5 rounded-full relative transition-colors duration-200 ease-in-out",
         checked ? "bg-blue-600" : "bg-slate-300"
      )}>
         <div className={clsx(
            "absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out flex items-center justify-center",
            checked ? "left-[calc(100%-16px)]" : "left-1"
         )}>
            {checked && <Check size={8} className="text-blue-600" strokeWidth={4} />}
         </div>
      </div>
   );
}
