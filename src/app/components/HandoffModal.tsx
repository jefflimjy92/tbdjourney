import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/app/components/ui/button';
import { Checkbox } from '@/app/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';

interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
}

interface HandoffModalProps {
  requestId: string;
  handoffType: 'call-to-sales' | 'sales-to-claims';
  onConfirm: (acknowledged: boolean) => void;
  onCancel: () => void;
}

const CALL_TO_SALES_CHECKLIST: ChecklistItem[] = [
  { id: 'health-check', label: '건강 체크리스트 완료', required: true },
  { id: 'consultation-note', label: '상담 내용 (1/2차) 입력 완료', required: true },
  { id: 'customer-trait', label: '고객 성향/주의사항 메모 작성', required: false },
  { id: 'meeting-fit', label: '미팅 적합 판정 확인', required: true },
];

const SALES_TO_CLAIMS_CHECKLIST: ChecklistItem[] = [
  { id: 'contract-info', label: '계약 정보 저장 완료 (보험사/보험료/가입일)', required: true },
  { id: 'insurance-policy-request', label: '보험증권: 고객이 보험사에 팩스 요청 완료', required: true },
  { id: 'payment-history-request', label: '지급내역서: 고객이 보험사에 팩스 요청 완료', required: true },
  { id: 'consent-form', label: '수급 동의서 + 위임장 서명 완료', required: true },
  { id: 'agreement', label: '약정서 확인', required: true },
  { id: 'refund-notice', label: '고객 환급 안내 완료', required: false },
];

const HANDOFF_TITLE_MAP: Record<HandoffModalProps['handoffType'], string> = {
  'call-to-sales': '콜팀 → 영업팀 인계',
  'sales-to-claims': '영업팀 → 청구팀 인계',
};

export function HandoffModal({
  requestId,
  handoffType,
  onConfirm,
  onCancel,
}: HandoffModalProps) {
  const checklist = handoffType === 'call-to-sales'
    ? CALL_TO_SALES_CHECKLIST
    : SALES_TO_CLAIMS_CHECKLIST;

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    setCheckedItems({});
    setShowWarning(false);
  }, [handoffType, requestId]);

  const hasMissingRequired = checklist.some((item) => item.required && !checkedItems[item.id]);

  const handleCheckedChange = (itemId: string, checked: boolean | 'indeterminate') => {
    setCheckedItems((current) => ({
      ...current,
      [itemId]: checked === true,
    }));
    if (showWarning) {
      setShowWarning(false);
    }
  };

  const handleConfirm = () => {
    if (hasMissingRequired) {
      setShowWarning(true);
      return;
    }

    onConfirm(true);
  };

  const handleForceConfirm = () => {
    toast.warning('미충족 인계가 기록됩니다.');
    onConfirm(false);
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-0">
        <DialogHeader className="border-b border-slate-100 px-6 py-5">
          <DialogTitle className="text-left text-xl font-semibold text-slate-900">
            {HANDOFF_TITLE_MAP[handoffType]}
          </DialogTitle>
          <div className="mt-2 text-sm text-slate-500">접수ID: {requestId}</div>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            인계 전 필수 항목을 확인해 주세요. 필수 항목이 남아 있으면 미충족 인계로 기록됩니다.
          </div>

          <div className="space-y-3">
            {checklist.map((item) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-colors hover:bg-slate-50"
              >
                <Checkbox
                  checked={checkedItems[item.id] === true}
                  onCheckedChange={(checked) => handleCheckedChange(item.id, checked)}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">{item.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        item.required
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.required ? '필수' : '선택'}
                    </span>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {showWarning && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
              <div className="space-y-3">
                <p className="font-medium">필수 항목이 미완료입니다. 그래도 인계하시겠습니까?</p>
                <Button type="button" variant="outline" onClick={handleForceConfirm}>
                  그래도 인계
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-slate-100 px-6 py-4 sm:justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button type="button" onClick={handleConfirm}>
            인계 완료
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
