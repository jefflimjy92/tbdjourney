import { AlertCircle, Check, CheckCircle2, Clock, MessageSquare, Phone } from 'lucide-react';
import clsx from 'clsx';

export interface StepStageSelectorProps {
  currentStep?: string;
  selectedStatus?: string;
  selectedReason?: string;
  onStepChange?: (step: string) => void;
  onStatusChange?: (status: string) => void;
  onCancelNotPossible?: (step: '1st' | '2nd') => void;
  onReasonChange?: (reason: string) => void;
}

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
    ],
  },
  {
    id: 'step2',
    label: '1차 상담',
    icon: <Phone size={16} />,
    color: 'indigo',
    options: [
      { id: '1st-cancel', label: '1차 상담 후 취소' },
      { id: '1st-absent', label: '1차 상담 후 부재' },
      { id: '1st-complete', label: '1차 상담 완료' },
    ],
  },
  {
    id: 'step3',
    label: '2차 상담',
    icon: <MessageSquare size={16} />,
    color: 'purple',
    options: [
      { id: '2nd-cancel', label: '2차 상담 후 취소' },
      { id: '2nd-absent', label: '2차 상담 후 부재' },
      { id: '2nd-complete', label: '2차 상담 완료' },
    ],
  },
  {
    id: 'step4',
    label: '성공/종결',
    icon: <Check size={16} />,
    color: 'emerald',
    options: [
      { id: 'meeting-handover', label: '미팅 인계 완료', isGoal: true },
      { id: 'cancel', label: '취소' },
      { id: 'impossible', label: '불가' },
    ],
  },
] as const;

const REASON_OPTIONS: Record<string, Array<{ id: string; label: string }>> = {
  impossible: [
    { id: 'no-response', label: '연락 두절' },
    { id: 'not-interested', label: '관심 없음' },
    { id: 'vendor', label: '업자' },
    { id: 'already-handled', label: '이미 처리됨' },
    { id: 'wrong-contact', label: '잘못된 연락처' },
    { id: 'no-insurance', label: '보험 미가입' },
    { id: 'payment-default', label: '미납/실효' },
    { id: 'unsupported-region', label: '불가 지역' },
    { id: 'non-self-contractor', label: '계약자 다름' },
    { id: 'designer-relative', label: '설계사 친인척' },
    { id: 'exception-disease', label: '보험사 예외질환' },
    { id: 'planner-relative', label: '설계사 친인척 관계' },
    { id: 'critical-active', label: '중대질환 미완치' },
    { id: 'age-over-70', label: '70세 이상' },
    { id: 'long-hospitalization', label: '14일 초과 입원' },
    { id: 'other', label: '기타' },
  ],
  cancel: [
    { id: 'customer-cancel', label: '고객 취소 요청' },
    { id: 'no-time', label: '시간 없음' },
    { id: 'not-interested', label: '관심 없음' },
    { id: 'price-issue', label: '수수료 부담' },
    { id: 'competitor', label: '타사 선택' },
    { id: 'family-oppose', label: '가족/지인 반대' },
    { id: 'meeting-refuse', label: '미팅 자체 거부' },
    { id: 'ai-recording-refuse', label: 'AI 통화요약 거부' },
    { id: 'low-refund', label: '환수금액 20만원 이하' },
    { id: 'other', label: '기타' },
  ],
  '1st-cancel': [
    { id: 'customer-cancel', label: '고객 취소 요청' },
    { id: 'no-time', label: '시간 없음' },
    { id: 'reconsider', label: '재고려 필요' },
    { id: 'meeting-refuse', label: '미팅 자체 거부' },
    { id: 'ai-recording-refuse', label: 'AI 통화요약 거부' },
    { id: 'low-refund', label: '환수금액 20만원 이하' },
    { id: 'other', label: '기타' },
  ],
  '2nd-cancel': [
    { id: 'customer-cancel', label: '고객 취소 요청' },
    { id: 'price-issue', label: '수수료 10% 거부' },
    { id: 'competitor', label: '타사 선택' },
    { id: 'suspicion-unresolved', label: '의심 해소 실패' },
    { id: 'meeting-refuse', label: '미팅 자체 거부' },
    { id: 'family-oppose', label: '가족/지인 반대' },
    { id: 'other', label: '기타' },
  ],
  'rural-waiting': [
    { id: 'distance', label: '원거리 방문 불가' },
    { id: 'schedule-later', label: '추후 일정 조율' },
    { id: 'other', label: '기타' },
  ],
  'long-hospitalization': [
    { id: 'still-admitted', label: '현재 입원 중' },
    { id: 'post-discharge', label: '퇴원 후 관리' },
    { id: 'other', label: '기타' },
  ],
};

const STEP_ORDER: string[] = STEP_STAGES.map((stage) => stage.id);

function getStepTheme(color: (typeof STEP_STAGES)[number]['color'], selected: boolean) {
  if (!selected) {
    return 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600';
  }

  if (color === 'blue') return 'bg-blue-600 text-white border-blue-600 shadow-sm';
  if (color === 'indigo') return 'bg-indigo-600 text-white border-indigo-600 shadow-sm';
  if (color === 'purple') return 'bg-purple-600 text-white border-purple-600 shadow-sm';
  return 'bg-emerald-600 text-white border-emerald-600 shadow-sm';
}

function getStatusTheme(currentStep: string, selected: boolean) {
  if (!selected) {
    return 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50';
  }

  if (currentStep === 'step1') return 'bg-blue-600 text-white border-blue-600';
  if (currentStep === 'step2') return 'bg-indigo-600 text-white border-indigo-600';
  if (currentStep === 'step3') return 'bg-purple-600 text-white border-purple-600';
  return 'bg-emerald-600 text-white border-emerald-600';
}

function getStepCompletion(currentStep: string, selectedStatus: string, selectedReason: string, stageId: string): 'complete' | 'partial' | 'empty' {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const stageIndex = STEP_ORDER.indexOf(stageId);

  if (currentIndex === -1 || stageIndex > currentIndex) {
    return 'empty';
  }

  if (stageIndex < currentIndex) {
    return 'complete';
  }

  if (!selectedStatus) {
    return 'partial';
  }

  const needsReason = Boolean(REASON_OPTIONS[selectedStatus]);
  if (needsReason && !selectedReason) {
    return 'partial';
  }

  return 'complete';
}

export function StepStageSelector({
  currentStep = '',
  selectedStatus = '',
  selectedReason = '',
  onStepChange = () => {},
  onStatusChange = () => {},
  onCancelNotPossible,
  onReasonChange = () => {},
}: StepStageSelectorProps) {
  const currentStage = STEP_STAGES.find((stage) => stage.id === currentStep);

  const handleStepClick = (stepId: string) => {
    if (stepId === currentStep) return;
    onStepChange(stepId);
    onStatusChange('');
    onReasonChange('');
  };

  const handleStatusClick = (statusId: string) => {
    onStatusChange(statusId);
    if (statusId === '1st-cancel') onCancelNotPossible?.('1st');
    if (statusId === '2nd-cancel') onCancelNotPossible?.('2nd');
    onReasonChange('');
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold text-[#62748e] tracking-[0.06px] uppercase">STEP 1. 상담 단계 선택</p>

      {currentStep && selectedStatus ? (
        <div
          className={clsx(
            'px-3 py-2 rounded border flex items-center justify-between transition-all',
            currentStep === 'step1' && 'bg-blue-50 border-blue-200 text-blue-700',
            currentStep === 'step2' && 'bg-indigo-50 border-indigo-200 text-indigo-700',
            currentStep === 'step3' && 'bg-purple-50 border-purple-200 text-purple-700',
            currentStep === 'step4' && 'bg-emerald-50 border-emerald-200 text-emerald-700',
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold opacity-70">현재 상태</span>
            <div className="h-3 w-px bg-current opacity-20" />
            <div className="flex items-center gap-1.5 font-bold text-xs">
              {currentStep === 'step1' && <Clock size={14} />}
              {currentStep === 'step2' && <Phone size={14} />}
              {currentStep === 'step3' && <MessageSquare size={14} />}
              {currentStep === 'step4' && <Check size={14} />}
              <span>
                {currentStage?.options.find((option) => option.id === selectedStatus)?.label}
                {selectedReason && ` · ${REASON_OPTIONS[selectedStatus]?.find((reason) => reason.id === selectedReason)?.label}`}
              </span>
            </div>
          </div>
          <div className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-white/50 border-current opacity-80">
            {currentStage?.label}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center gap-2">
          <AlertCircle size={14} className="text-slate-400 shrink-0" />
          <p className="text-[10px] text-slate-500 font-medium">상담 상태를 아래에서 선택해주세요</p>
        </div>
      )}

      <div className="flex items-center gap-1">
        {STEP_STAGES.map((stage, index) => {
          const completion = getStepCompletion(currentStep, selectedStatus, selectedReason, stage.id);

          return (
            <div key={stage.id} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => handleStepClick(stage.id)}
                className={clsx(
                  'w-full py-2 px-1.5 rounded-lg border transition-all flex flex-col items-center gap-0.5 relative',
                  getStepTheme(stage.color, currentStep === stage.id),
                )}
              >
                {completion !== 'empty' && currentStep !== stage.id && (
                  <div
                    className={clsx(
                      'absolute -top-1 -right-1 size-3 rounded-full flex items-center justify-center',
                      completion === 'complete' ? 'bg-emerald-500' : 'bg-amber-400',
                    )}
                  >
                    {completion === 'complete' ? (
                      <CheckCircle2 size={8} className="text-white" />
                    ) : (
                      <div className="size-1.5 bg-white rounded-full" />
                    )}
                  </div>
                )}
                <div className="flex items-center gap-1">{stage.icon}</div>
                <span className="text-[9px] font-bold text-center leading-tight">{stage.label}</span>
              </button>
              {index < STEP_STAGES.length - 1 && <div className="w-2 h-0.5 bg-slate-200 mx-0.5" />}
            </div>
          );
        })}
      </div>

      {currentStep ? (
        <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700">{currentStage?.label}</p>
            {selectedStatus && currentStage?.options.find((option) => option.id === selectedStatus && 'isGoal' in option && option.isGoal) && (
              <span className="text-xs font-bold text-yellow-600">* 목표 단계</span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {currentStage?.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleStatusClick(option.id)}
                className={clsx(
                  'py-2 px-3 text-xs font-medium rounded-md border transition-all text-left flex items-center justify-between group',
                  getStatusTheme(currentStep, selectedStatus === option.id),
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={clsx(
                      'w-1.5 h-1.5 rounded-full transition-all',
                      selectedStatus === option.id ? 'bg-white' : 'bg-slate-300 group-hover:bg-slate-400',
                    )}
                  />
                  {option.label}
                </span>
                {selectedStatus === option.id && <Check size={11} className="text-current shrink-0" />}
              </button>
            ))}
          </div>

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
                    type="button"
                    onClick={() => onReasonChange(reason.id)}
                    className={clsx(
                      'py-1.5 px-2 text-[10px] font-bold rounded border transition-all text-left',
                      selectedReason === reason.id
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100',
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
