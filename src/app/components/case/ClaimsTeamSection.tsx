import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import { useJourney } from '@/app/journey/JourneyContext';

export interface ClaimsTeamSectionProps {
  requestId: string;
  isEditable: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  isClaimsLead: boolean;
}

const STEP_ITEMS = [
  { id: 0, label: 'STEP 0', title: '접수 확인' },
  { id: 1, label: 'STEP 1', title: '고객 프로필' },
  { id: 2, label: 'STEP 2', title: '데이터 통합' },
  { id: 3, label: 'STEP 3', title: '지급내역서' },
  { id: 4, label: 'STEP 4', title: '미지급 분석' },
  { id: 5, label: 'STEP 5', title: '서류 발급' },
  { id: 6, label: 'STEP 6', title: '서류 OCR' },
  { id: 7, label: 'STEP 7', title: '최종 확정' },
] as const;

const MOCK_CLAIMS_MEMBERS = [
  { id: 'cm1', name: '김청구' },
  { id: 'cm2', name: '이청구' },
  { id: 'cm3', name: '박청구' },
];

const DATA_INTEGRATION_STATUSES = [
  { label: '심평원', status: '완료' as const },
  { label: '홈택스', status: '연동중' as const },
  { label: '건강보험', status: '미연동' as const },
];

export function ClaimsTeamSection({
  requestId,
  isEditable,
  isExpanded,
  onToggle,
  isClaimsLead,
}: ClaimsTeamSectionProps) {
  const { journey } = useJourney(requestId);
  const [selectedStep, setSelectedStep] = useState<(typeof STEP_ITEMS)[number]['id']>(0);
  const [assignedMember, setAssignedMember] = useState('미배정');
  const [salesHandoffMemo] = useState('계약 정보와 보험사 요청 서류 안내까지 완료했습니다. 추가 보완은 없습니다.');
  const [insuranceCompany, setInsuranceCompany] = useState('삼성화재');
  const [insuranceType, setInsuranceType] = useState('실손보험');
  const [policyStartDate, setPolicyStartDate] = useState('2022-09-14');
  const [expectedClaimAmount] = useState('1,280,000원');

  const currentStep = useMemo(
    () => STEP_ITEMS.find((step) => step.id === selectedStep) ?? STEP_ITEMS[0],
    [selectedStep],
  );

  const renderStepContent = () => {
    if (currentStep.id === 0) {
      return (
        <div className="space-y-4">
          <StepField label="영업팀 인계 메모">
            <ReadOnlyBlock value={salesHandoffMemo} />
          </StepField>

          <StepField label="담당자 배정">
            {isClaimsLead ? (
              isEditable ? (
                <Select
                  value={assignedMember === '미배정' ? undefined : assignedMember}
                  onValueChange={(val) => {
                    setAssignedMember(val);
                    toast.success(`${val}에게 배정되었습니다.`);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="담당자 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_CLAIMS_MEMBERS.map((member) => (
                      <SelectItem key={member.id} value={member.name}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <ReadOnlyBlock value={assignedMember} />
              )
            ) : (
              <ReadOnlyBlock value={assignedMember} />
            )}
          </StepField>
        </div>
      );
    }

    if (currentStep.id === 1) {
      return (
        <div className="space-y-4">
          <EditableField
            isEditable={isEditable}
            label="보험사"
            value={insuranceCompany}
            onChange={setInsuranceCompany}
          />
          <EditableField
            isEditable={isEditable}
            label="보험 종류"
            value={insuranceType}
            onChange={setInsuranceType}
          />
          <EditableField
            isEditable={isEditable}
            label="가입일"
            value={policyStartDate}
            onChange={setPolicyStartDate}
            type="date"
          />
          <StepField label="설계사 정보">
            <ReadOnlyBlock value={journey?.owner ?? '-'} />
          </StepField>
        </div>
      );
    }

    if (currentStep.id === 2) {
      return (
        <div className="space-y-4">
          <StepField label="연동 현황">
            <div className="flex flex-wrap gap-2">
              {DATA_INTEGRATION_STATUSES.map((item) => (
                <Badge
                  key={item.label}
                  variant="outline"
                  className={
                    item.status === '완료'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : item.status === '연동중'
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                  }
                >
                  {item.label} · {item.status}
                </Badge>
              ))}
            </div>
          </StepField>
          <StepField label="예상 청구액">
            <ReadOnlyBlock value={expectedClaimAmount} />
          </StepField>
        </div>
      );
    }

    return (
      <StepPlaceholder
        title={currentStep.title}
        description={`${currentStep.title} 단계 UI는 다음 구현 단계에서 상세화됩니다.`}
      />
    );
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Claims Team</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">청구팀 섹션</div>
        </div>
        {isExpanded ? <ChevronUp className="size-5 text-slate-400" /> : <ChevronDown className="size-5 text-slate-400" />}
      </button>

      {isExpanded && (
        <div className="grid gap-5 border-t border-slate-100 px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            {STEP_ITEMS.map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setSelectedStep(step.id)}
                className={`w-full rounded-xl px-3 py-3 text-left transition-colors ${
                  selectedStep === step.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-semibold uppercase tracking-wide opacity-70">{step.label}</div>
                <div className="mt-1 text-sm font-medium">{step.title}</div>
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{currentStep.label}</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{currentStep.title}</div>
              </div>
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                requestId: {requestId}
              </Badge>
            </div>

            {renderStepContent()}

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedStep((current) => Math.max(0, current - 1) as (typeof STEP_ITEMS)[number]['id'])}
                disabled={selectedStep === 0}
              >
                이전 STEP
              </Button>
              <Button
                type="button"
                onClick={() => setSelectedStep((current) => Math.min(7, current + 1) as (typeof STEP_ITEMS)[number]['id'])}
                disabled={selectedStep === 7}
              >
                다음 STEP
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function StepField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-slate-700">{label}</div>
      {children}
    </div>
  );
}

function ReadOnlyBlock({ value }: { value: string }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{value || '-'}</div>;
}

function EditableField({
  isEditable,
  label,
  value,
  onChange,
  type = 'text',
}: {
  isEditable: boolean;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'date';
}) {
  return (
    <StepField label={label}>
      {isEditable ? (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none ring-0"
        />
      ) : (
        <ReadOnlyBlock value={value} />
      )}
    </StepField>
  );
}

function StepPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
      <div className="text-sm font-semibold text-slate-700">{title}</div>
      <div className="mt-2 text-sm text-slate-500">상태: 차기 범위에서 연결 예정</div>
      <Textarea readOnly value={description} className="mt-4 min-h-24 bg-white" />
    </div>
  );
}
