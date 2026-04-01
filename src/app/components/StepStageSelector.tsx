import { useState, useEffect } from 'react';
import { Clock, Phone, MessageSquare, Check, CheckCircle2, AlertCircle, ShieldAlert, Lock, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

// ======== Types ========
export interface ValidationState {
   // Step 1→2 진입 조건 (1차 상담)
   identityVerified: boolean;       // 본인 확인 완료
   addressVerified: boolean;        // 거주지 확인
   accountVerified: boolean;        // 환급계좌 확인

   // Step 2→3 진입 조건 (2차 상담)
   insuranceChecked: boolean;       // 보험 가입 현황 확인됨
   premiumEntered: boolean;         // 월납 총액 입력됨
   paymentStatusChecked: boolean;   // 미납/실효 확인됨
   contractorChecked: boolean;      // 계약자/납입인 확인됨

   // Step 3→4 진입 조건 (성공/종결)
   designerRelationChecked: boolean; // 설계사 관계 확인됨
   healthCheckCompleted: boolean;    // 건강체크 항목 모두 완료
   exceptionDiseaseChecked: boolean; // 보험사 예외질환 체크

   // Step 4 - 미팅 인계 조건
   refundAmountEntered: boolean;     // 환급 예상금액 입력
   feeNotified: boolean;            // 수수료 10% 안내 완료
   meetingScheduleConfirmed: boolean; // 미팅 일시·장소 확정
   recordingAttached: boolean;       // 녹취파일 첨부
   simpyeongwonAttached: boolean;    // 심평원 진료이력 첨부

   // 자동 불가 판정 조건
   noInsurance: boolean;            // 보험 미가입
   paymentDefaulted: boolean;       // 미납 중 또는 실효됨
   designerRelative: boolean;       // 설계사 친인척 관계
   criticalDiseaseActive: boolean;  // 중대질환 미완치
   ageOver70: boolean;              // 70세 이상
}

export interface StepStageSelectorProps {
   currentStep?: string;
   selectedStatus?: string;
   selectedReason?: string;
   onStepChange?: (step: string) => void;
   onStatusChange?: (status: string) => void;
   onCancelNotPossible?: (step: '1st' | '2nd') => void;
   onReasonChange?: (reason: string) => void;
   validationState?: ValidationState;
   autoBlockReasons?: string[];      // 자동 불가 판정 사유 목록
   onValidateTransition?: (targetStep: string) => Array<{ field?: string; message?: string; section?: string }>;
   validationErrors?: Array<{ field?: string; message?: string; section?: string }>;
}

// ======== Constants ========
const STEP_STAGES = [
   { 
      id: 'step1', 
      label: '접수', 
      icon: <Clock size={16} />, 
      color: 'blue',
      options: [
         { id: 'waiting', label: '대기' },
         { id: 'absent', label: '부재' },
         { id: 'management', label: '관리' },
         { id: 'rural-waiting', label: '지방 대기' },
      ]
   },
   { 
      id: 'step2', 
      label: '1차 상담', 
      icon: <Phone size={16} />, 
      color: 'indigo',
      options: [
         { id: '1st-cancel', label: '1차 상담 후 취소' },
         { id: '1st-absent', label: '1차 상담 후 부재' },
         { id: '1st-complete', label: '1차 상담 완료' }
      ]
   },
   { 
      id: 'step3', 
      label: '2차 상담', 
      icon: <MessageSquare size={16} />, 
      color: 'purple',
      options: [
         { id: '2nd-cancel', label: '2차 상담 후 취소' },
         { id: '2nd-absent', label: '2차 상담 후 부재' },
         { id: '2nd-complete', label: '2차 상담 완료' }
      ]
   },
   { 
      id: 'step4', 
      label: '성공/종결', 
      icon: <Check size={16} />, 
      color: 'emerald',
      options: [
         { id: 'meeting-handover', label: '미팅 인계 완료', isGoal: true },
         { id: 'cancel', label: '취소' },
         { id: 'impossible', label: '불가' }
      ]
   }
];

const REASON_OPTIONS: Record<string, Array<{ id: string; label: string }>> = {
   'impossible': [
      { id: 'no-response', label: '연락 두절' },
      { id: 'not-interested', label: '관심 없음' },
      { id: 'vendor', label: '업자' },
      { id: 'already-handled', label: '이미 처리됨' },
      { id: 'wrong-contact', label: '잘못된 연락처' },
      { id: 'no-insurance', label: '보험 미가입' },
      { id: 'payment-default', label: '미납/실효' },
      { id: 'designer-relative', label: '설계사 친인척' },
      { id: 'exception-disease', label: '보험사 예외질환' },
      { id: 'planner-relative', label: '설계사 친인척 관계' },
      { id: 'critical-active', label: '중대질환 미완치' },
      { id: 'age-over-70', label: '70세 이상' },
      { id: 'long-hospitalization', label: '14일 초과 입원' },
      { id: 'other', label: '기타' }
   ],
   'cancel': [
      { id: 'customer-cancel', label: '고객 취소 요청' },
      { id: 'no-time', label: '시간 없음' },
      { id: 'not-interested', label: '관심 없음' },
      { id: 'price-issue', label: '수수료 부담' },
      { id: 'competitor', label: '타사 선택' },
      { id: 'family-oppose', label: '가족/지인 반대' },
      { id: 'meeting-refuse', label: '미팅 자체 거부' },
      { id: 'ai-recording-refuse', label: 'AI 통화요약 거부' },
      { id: 'low-refund', label: '환수금액 20만원 이하' },
      { id: 'other', label: '기타' }
   ],
   '1st-cancel': [
      { id: 'customer-cancel', label: '고객 취소 요청' },
      { id: 'no-time', label: '시간 없음' },
      { id: 'reconsider', label: '재고려 필요' },
      { id: 'meeting-refuse', label: '미팅 자체 거부' },
      { id: 'ai-recording-refuse', label: 'AI 통화요약 거부' },
      { id: 'low-refund', label: '환수금액 20만원 이하' },
      { id: 'other', label: '기타' }
   ],
   '2nd-cancel': [
      { id: 'customer-cancel', label: '고객 취소 요청' },
      { id: 'price-issue', label: '수수료 10% 거부' },
      { id: 'competitor', label: '타사 선택' },
      { id: 'suspicion-unresolved', label: '의심 해소 실패' },
      { id: 'meeting-refuse', label: '미팅 자체 거부' },
      { id: 'family-oppose', label: '가족/지인 반대' },
      { id: 'other', label: '기타' }
   ],
   'rural-waiting': [
      { id: 'distance', label: '원거리 방문 불가' },
      { id: 'schedule-later', label: '추후 일정 조율' },
      { id: 'other', label: '기타' }
   ],
   'long-hospitalization': [
      { id: 'still-admitted', label: '현재 입원 중' },
      { id: 'post-discharge', label: '퇴원 후 관리' },
      { id: 'other', label: '기타' }
   ]
};

// ======== Validation Logic ========
interface ValidationResult {
   canProceed: boolean;
   missingItems: string[];
}

function getStepValidation(targetStep: string, validationState: ValidationState): ValidationResult {
   const missing: string[] = [];

   if (targetStep === 'step2') {
      // 거주지 확인 조건 제거 — 1차 상담 진입 무조건 허용
   }
   
   if (targetStep === 'step3') {
      // step2 requirements first
      if (!validationState.addressVerified) missing.push('거주지 확인');
      // step3 entry requirements
      if (!validationState.insuranceChecked) missing.push('보험 가입 현황');
      if (!validationState.premiumEntered) missing.push('월납 총액');
      if (!validationState.paymentStatusChecked) missing.push('미납/실효 여부');
      if (!validationState.contractorChecked) missing.push('계약자/납입인');
   }
   
   // step4는 검증 없음 — 취소/불가는 어느 단계에서든 접근 가능
   // "미팅 인계 완료"만 별도 getHandoverValidation에서 검증

   return { canProceed: missing.length === 0, missingItems: missing };
}

function getHandoverValidation(validationState: ValidationState): ValidationResult {
   const missing: string[] = [];
   if (!validationState.refundAmountEntered) missing.push('환급 예상금액');
   if (!validationState.feeNotified) missing.push('수수료 10% 안내');
   if (!validationState.meetingScheduleConfirmed) missing.push('미팅 일시·장소');
   if (!validationState.recordingAttached) missing.push('녹취파일 첨부');
   if (!validationState.simpyeongwonAttached) missing.push('심평원 진료이력');
   return { canProceed: missing.length === 0, missingItems: missing };
}

// ======== Component ========
export function StepStageSelector({
   currentStep = '',
   selectedStatus = '',
   selectedReason = '',
   onStepChange = () => {},
   onStatusChange = () => {},
   onCancelNotPossible,
   onReasonChange = () => {},
   validationState,
   autoBlockReasons = [],
   onValidateTransition,
   validationErrors = []
}: StepStageSelectorProps) {
   const [validationError, setValidationError] = useState<string[] | null>(null);
   const [showAutoBlock, setShowAutoBlock] = useState(false);
   const safeValidationState: ValidationState = validationState || {
      identityVerified: false,
      addressVerified: false,
      accountVerified: false,
      insuranceChecked: false,
      premiumEntered: false,
      paymentStatusChecked: false,
      contractorChecked: false,
      designerRelationChecked: false,
      healthCheckCompleted: false,
      exceptionDiseaseChecked: false,
      refundAmountEntered: false,
      feeNotified: false,
      meetingScheduleConfirmed: false,
      recordingAttached: false,
      simpyeongwonAttached: false,
      noInsurance: false,
      paymentDefaulted: false,
      designerRelative: false,
      criticalDiseaseActive: false,
      ageOver70: false,
   };

   // Show auto-block alert whenever conditions are detected
   useEffect(() => {
      if (autoBlockReasons.length > 0) {
         setShowAutoBlock(true);
      } else {
         setShowAutoBlock(false);
      }
   }, [autoBlockReasons]);

   const handleStepClick = (stepId: string) => {
      if (stepId === currentStep) return;
      
      // step4(성공/종결)는 항상 접근 허용 — 취소/불가는 어느 단계에서든 접근 가능
      // "미팅 인계 완료"만 handleStatusClick에서 별도 검증
      if (stepId === 'step4') {
         setValidationError(null);
         onStepChange(stepId);
         onStatusChange('');
         onReasonChange('');
         return;
      }
      
      // Forward transition validation (step2, step3만)
      const stepOrder = ['step1', 'step2', 'step3', 'step4'];
      const currentIdx = stepOrder.indexOf(currentStep);
      const targetIdx = stepOrder.indexOf(stepId);
      
      if (targetIdx > currentIdx) {
         if (onValidateTransition) {
            const externalErrors = onValidateTransition(stepId) || [];
            if (externalErrors.length > 0) {
               setValidationError(externalErrors.map((error) => error.field || error.message || error.section || '필수 항목'));
               setTimeout(() => setValidationError(null), 5000);
               return;
            }
         } else {
            const result = getStepValidation(stepId, safeValidationState);
            if (!result.canProceed) {
               setValidationError(result.missingItems);
               setTimeout(() => setValidationError(null), 5000);
               return;
            }
         }
      }
      
      setValidationError(null);
      onStepChange(stepId);
      onStatusChange('');
      onReasonChange('');
   };

   const handleStatusClick = (statusId: string) => {
      // 미팅 인계 선택 시 추가 검증
      if (statusId === 'meeting-handover') {
         const result = getHandoverValidation(safeValidationState);
         if (!result.canProceed) {
            setValidationError(result.missingItems);
            setTimeout(() => setValidationError(null), 5000);
            return;
         }
      }
      
      setValidationError(null);
      onStatusChange(statusId);
      if (statusId === '1st-cancel') {
         onCancelNotPossible?.('1st');
      }
      if (statusId === '2nd-cancel') {
         onCancelNotPossible?.('2nd');
      }
      onReasonChange('');
   };

   const handleReasonClick = (reasonId: string) => {
      onReasonChange(reasonId);
   };

   // Compute step completion indicators
   const getStepCompletion = (stepId: string): 'complete' | 'partial' | 'empty' => {
      if (stepId === 'step1') {
         const v = safeValidationState;
         if (v.identityVerified && v.addressVerified && v.accountVerified) return 'complete';
         if (v.identityVerified || v.addressVerified || v.accountVerified) return 'partial';
         return 'empty';
      }
      if (stepId === 'step2') {
         const v = safeValidationState;
         if (v.insuranceChecked && v.premiumEntered && v.paymentStatusChecked && v.contractorChecked) return 'complete';
         if (v.insuranceChecked || v.premiumEntered) return 'partial';
         return 'empty';
      }
      if (stepId === 'step3') {
         const v = safeValidationState;
         if (v.designerRelationChecked && v.healthCheckCompleted) return 'complete';
         if (v.designerRelationChecked || v.healthCheckCompleted) return 'partial';
         return 'empty';
      }
      if (stepId === 'step4') {
         const v = safeValidationState;
         if (v.refundAmountEntered && v.feeNotified && v.meetingScheduleConfirmed && v.recordingAttached && v.simpyeongwonAttached) return 'complete';
         if (v.refundAmountEntered || v.feeNotified) return 'partial';
         return 'empty';
      }
      return 'empty';
   };

   return (
      <div className="space-y-3">
         <p className="text-[11px] font-bold text-[#62748e] tracking-[0.06px] uppercase">STEP 1. 상담 단계 선택</p>
         
         {/* 자동 불가 판정 경고 */}
         {showAutoBlock && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 space-y-2">
               <div className="flex items-center gap-2">
                  <ShieldAlert size={16} className="text-rose-600 shrink-0" />
                  <p className="text-xs font-bold text-rose-700">자동 판정: 진행 불가 사유 감지</p>
               </div>
               <div className="space-y-1">
                  {autoBlockReasons.map((reason, i) => (
                     <div key={i} className="flex items-center gap-2 text-[11px] text-rose-600 font-medium">
                        <AlertTriangle size={10} className="shrink-0" />
                        <span>{reason}</span>
                     </div>
                  ))}
               </div>
               <p className="text-[10px] text-rose-500 mt-1">
                  * 위 사유에 해당하는 경우 상담 진행이 제한됩니다. 관리자에게 확인 후 처리해주세요.
               </p>
            </div>
         )}

         {/* 검증 오류 경고 */}
         {(validationError || validationErrors.length > 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 animate-in fade-in slide-in-from-top-1 duration-300">
               <div className="flex items-center gap-2 mb-1.5">
                  <Lock size={14} className="text-amber-600 shrink-0" />
                  <p className="text-xs font-bold text-amber-700">필수 입력 항목이 누락되었습니다</p>
               </div>
               <div className="grid grid-cols-2 gap-1">
                  {(validationError || validationErrors.map((error) => error.field || error.message || error.section || '필수 항목')).map((item, i) => (
                     <div key={i} className="flex items-center gap-1.5 text-[10px] text-amber-600 font-bold bg-amber-100/50 rounded px-2 py-1">
                        <AlertCircle size={10} className="shrink-0" />
                        {item}
                     </div>
                  ))}
               </div>
            </div>
         )}
         
         {/* 현재 상태 요약 */}
         {currentStep && selectedStatus ? (
            <div className={clsx(
               "px-3 py-2 rounded border flex items-center justify-between transition-all",
               currentStep === 'step1' && "bg-blue-50 border-blue-200 text-blue-700",
               currentStep === 'step2' && "bg-indigo-50 border-indigo-200 text-indigo-700",
               currentStep === 'step3' && "bg-purple-50 border-purple-200 text-purple-700",
               currentStep === 'step4' && "bg-emerald-50 border-emerald-200 text-emerald-700"
            )}>
               <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold opacity-70">현재 상태</span>
                  <div className="h-3 w-px bg-current opacity-20"></div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                     {currentStep === 'step1' && <Clock size={14} />}
                     {currentStep === 'step2' && <Phone size={14} />}
                     {currentStep === 'step3' && <MessageSquare size={14} />}
                     {currentStep === 'step4' && <Check size={14} />}
                     <span>
                        {STEP_STAGES.find(s => s.id === currentStep)?.options.find(o => o.id === selectedStatus)?.label}
                        {selectedReason && ` · ${REASON_OPTIONS[selectedStatus]?.find(r => r.id === selectedReason)?.label}`}
                     </span>
                  </div>
               </div>
               <div className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-white/50 border-current opacity-80">
                  {STEP_STAGES.find(s => s.id === currentStep)?.label}
               </div>
            </div>
         ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center gap-2">
               <AlertCircle size={14} className="text-slate-400 shrink-0" />
               <p className="text-[10px] text-slate-500 font-medium">상담 상태를 아래에서 선택해주세요</p>
            </div>
         )}
         
         {/* 4단계 스텝 인디케이터 */}
         <div className="flex items-center gap-1">
            {STEP_STAGES.map((stage, index) => {
               const completion = getStepCompletion(stage.id);
               return (
                  <div key={stage.id} className="flex items-center flex-1">
                     <button
                        onClick={() => handleStepClick(stage.id)}
                        className={clsx(
                           "w-full py-2 px-1.5 rounded-lg border transition-all flex flex-col items-center gap-0.5 relative",
                           currentStep === stage.id 
                              ? clsx(
                                 stage.color === 'blue' && "bg-blue-600 text-white border-blue-600 shadow-sm",
                                 stage.color === 'indigo' && "bg-indigo-600 text-white border-indigo-600 shadow-sm",
                                 stage.color === 'purple' && "bg-purple-600 text-white border-purple-600 shadow-sm",
                                 stage.color === 'emerald' && "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                              ) 
                              : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600"
                        )}
                     >
                        {/* Completion indicator */}
                        {completion !== 'empty' && currentStep !== stage.id && (
                           <div className={clsx(
                              "absolute -top-1 -right-1 size-3 rounded-full flex items-center justify-center",
                              completion === 'complete' ? "bg-emerald-500" : "bg-amber-400"
                           )}>
                              {completion === 'complete' ? (
                                 <CheckCircle2 size={8} className="text-white" />
                              ) : (
                                 <div className="size-1.5 bg-white rounded-full" />
                              )}
                           </div>
                        )}
                        <div className="flex items-center gap-1">
                           {stage.icon}
                        </div>
                        <span className="text-[9px] font-bold text-center leading-tight">
                           {stage.label}
                        </span>
                     </button>
                     
                     {index < STEP_STAGES.length - 1 && (
                        <div className="w-2 h-0.5 bg-slate-200 mx-0.5" />
                     )}
                  </div>
               );
            })}
         </div>
         
         {/* 선택한 단계의 옵션 표시 */}
         {currentStep ? (
            <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5">
               <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700">
                     {STEP_STAGES.find(s => s.id === currentStep)?.label}
                  </p>
                  {selectedStatus && STEP_STAGES.find(s => s.id === currentStep)?.options.find(o => o.id === selectedStatus && (o as any).isGoal) && (
                     <span className="text-xs font-bold text-yellow-600">* 목표 단계</span>
                  )}
               </div>
               
               <div className="grid grid-cols-1 gap-1.5">
                  {STEP_STAGES.find(s => s.id === currentStep)?.options.map((option) => {
                     // 미팅 인계 시 잠금 표시
                     const isHandoverLocked = option.id === 'meeting-handover' && !getHandoverValidation(safeValidationState).canProceed;
                     
                     return (
                        <button
                           key={option.id}
                           onClick={() => handleStatusClick(option.id)}
                           className={clsx(
                              "py-2 px-3 text-xs font-medium rounded-md border transition-all text-left flex items-center justify-between group",
                              selectedStatus === option.id
                                 ? clsx(
                                    currentStep === 'step1' && "bg-blue-600 text-white border-blue-600",
                                    currentStep === 'step2' && "bg-indigo-600 text-white border-indigo-600",
                                    currentStep === 'step3' && "bg-purple-600 text-white border-purple-600",
                                    currentStep === 'step4' && "bg-emerald-600 text-white border-emerald-600"
                                 )
                                 : isHandoverLocked
                                    ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                           )}
                        >
                           <span className="flex items-center gap-2">
                              {isHandoverLocked ? (
                                 <Lock size={12} className="text-slate-300" />
                              ) : (
                                 <span className={clsx(
                                    "w-1.5 h-1.5 rounded-full transition-all",
                                    selectedStatus === option.id ? "bg-white" : "bg-slate-300 group-hover:bg-slate-400"
                                 )} />
                              )}
                              {option.label}
                              {isHandoverLocked && (
                                 <span className="text-[9px] text-slate-400 ml-1">(필수 항목 미완료)</span>
                              )}
                           </span>
                           {(option as any).isGoal && <span className="text-yellow-400">*</span>}
                        </button>
                     );
                  })}
               </div>
               
               {/* 사유 선택 영역 - 필수 */}
               {selectedStatus && REASON_OPTIONS[selectedStatus] && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                     <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                           <AlertCircle size={12} />
                           사유를 선택해주세요 (필수)
                        </p>
                        {!selectedReason && (
                           <span className="text-[9px] text-rose-500 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              미선택
                           </span>
                        )}
                     </div>
                     <div className="grid grid-cols-2 gap-1.5">
                        {REASON_OPTIONS[selectedStatus].map((reason) => (
                           <button
                              key={reason.id}
                              onClick={() => handleReasonClick(reason.id)}
                              className={clsx(
                                 "py-1.5 px-2 text-[10px] font-bold rounded border transition-all text-left",
                                 selectedReason === reason.id
                                    ? "bg-amber-600 text-white border-amber-600"
                                    : "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
                              )}
                           >
                              {reason.label}
                           </button>
                        ))}
                     </div>
                  </div>
               )}
            </div>
         ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg h-24 flex flex-col items-center justify-center gap-1">
               <Clock size={20} className="text-slate-300" />
               <p className="text-xs text-slate-400 font-medium">상담 단계를 선택해주세요</p>
            </div>
         )}
      </div>
   );
}
