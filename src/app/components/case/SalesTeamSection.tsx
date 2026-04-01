import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Textarea } from '@/app/components/ui/textarea';
import { useJourney } from '@/app/journey/JourneyContext';

export interface SalesTeamSectionProps {
  requestId: string;
  isEditable: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onHandoff: () => void;
}

const FIELD_WRAPPER_CLASS = 'rounded-2xl border border-slate-200 bg-white p-4';
const INPUT_CLASS = 'flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none ring-0';

export function SalesTeamSection({
  requestId,
  isEditable,
  isExpanded,
  onToggle,
  onHandoff,
}: SalesTeamSectionProps) {
  const { journey } = useJourney(requestId);

  const [analysisNote, setAnalysisNote] = useState('보장 누락 항목과 전환 가능성이 높은 특약을 정리했습니다.');
  const [strategyNote, setStrategyNote] = useState('배우자 동반 설명이 중요하므로 가족 동석을 유도하는 전략으로 준비합니다.');
  const [meetingDate, setMeetingDate] = useState('2026-04-03');
  const [onSiteChecklist, setOnSiteChecklist] = useState({
    identityChecked: true,
    applicationSigned: false,
    questionsHandled: true,
  });
  const [meetingRecord, setMeetingRecord] = useState('현장 상담 시 기존 보험 유지 사유와 추가 보장 니즈를 상세하게 기록합니다.');
  const [insuranceCompany, setInsuranceCompany] = useState('삼성화재');
  const [monthlyPremium, setMonthlyPremium] = useState('78000');
  const [contractDate, setContractDate] = useState('2026-04-05');
  const [eSignStatus, setESignStatus] = useState<'미완료' | '진행중' | '완료'>('진행중');

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Sales Team</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">영업팀 섹션</div>
        </div>
        {isExpanded ? <ChevronUp className="size-5 text-slate-400" /> : <ChevronDown className="size-5 text-slate-400" />}
      </button>

      {isExpanded && (
        <div className="space-y-5 border-t border-slate-100 px-5 py-5">
          <SectionCard title="사전 분석">
            <EditableField
              isEditable={isEditable}
              label="보장 분석 메모"
              value={analysisNote}
              onChange={setAnalysisNote}
              multiline
            />
            <EditableField
              isEditable={isEditable}
              label="미팅 전략 메모"
              value={strategyNote}
              onChange={setStrategyNote}
              multiline
            />
            <EditableField
              isEditable={isEditable}
              label="미팅 예정일"
              value={meetingDate}
              onChange={setMeetingDate}
              type="date"
            />
          </SectionCard>

          <SectionCard title="미팅 실행">
            <div className="space-y-2">
              <FieldLabel>현장 체크리스트</FieldLabel>
              {isEditable ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <ChecklistRow
                    label="고객 신분증 확인"
                    checked={onSiteChecklist.identityChecked}
                    onCheckedChange={(checked) => setOnSiteChecklist((current) => ({ ...current, identityChecked: checked }))}
                  />
                  <ChecklistRow
                    label="청약서 서명 완료"
                    checked={onSiteChecklist.applicationSigned}
                    onCheckedChange={(checked) => setOnSiteChecklist((current) => ({ ...current, applicationSigned: checked }))}
                  />
                  <ChecklistRow
                    label="고객 질문 응대 완료"
                    checked={onSiteChecklist.questionsHandled}
                    onCheckedChange={(checked) => setOnSiteChecklist((current) => ({ ...current, questionsHandled: checked }))}
                  />
                </div>
              ) : (
                <ReadOnlyBlock
                  value={[
                    onSiteChecklist.identityChecked && '고객 신분증 확인',
                    onSiteChecklist.applicationSigned && '청약서 서명 완료',
                    onSiteChecklist.questionsHandled && '고객 질문 응대 완료',
                  ].filter(Boolean).join(', ') || '-'}
                />
              )}
            </div>

            <EditableField
              isEditable={isEditable}
              label="미팅 기록"
              value={meetingRecord}
              onChange={setMeetingRecord}
              multiline
            />
          </SectionCard>

          <SectionCard title="계약 체결">
            <EditableField
              isEditable={isEditable}
              label="보험사명"
              value={insuranceCompany}
              onChange={setInsuranceCompany}
            />
            <EditableField
              isEditable={isEditable}
              label="월 보험료 (원)"
              value={monthlyPremium}
              onChange={setMonthlyPremium}
              type="number"
            />
            <EditableField
              isEditable={isEditable}
              label="가입일"
              value={contractDate}
              onChange={setContractDate}
              type="date"
            />

            <div className="space-y-2">
              <FieldLabel>전자서명 상태</FieldLabel>
              {isEditable ? (
                <select
                  value={eSignStatus}
                  onChange={(event) => setESignStatus(event.target.value as typeof eSignStatus)}
                  className={INPUT_CLASS}
                >
                  <option value="미완료">미완료</option>
                  <option value="진행중">진행중</option>
                  <option value="완료">완료</option>
                </select>
              ) : (
                <ReadOnlyBlock value={eSignStatus} />
              )}
            </div>

            <div className="space-y-2">
              <FieldLabel>설계사 정보</FieldLabel>
              <ReadOnlyBlock value={journey?.owner ?? '-'} />
            </div>
          </SectionCard>

          {isEditable && (
            <Button onClick={onHandoff} className="w-full">
              청구팀에 인계하기 →
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={FIELD_WRAPPER_CLASS}>
      <div className="mb-4 text-base font-semibold text-slate-900">{title}</div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function ChecklistRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 py-1.5 text-sm text-slate-700">
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} />
      <span>{label}</span>
    </label>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-medium text-slate-700">{children}</div>;
}

function ReadOnlyBlock({ value }: { value: string }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{value || '-'}</div>;
}

function EditableField({
  isEditable,
  label,
  value,
  onChange,
  multiline = false,
  type = 'text',
}: {
  isEditable: boolean;
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  type?: 'text' | 'number' | 'date';
}) {
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      {isEditable ? (
        multiline ? (
          <Textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-24" />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={INPUT_CLASS}
          />
        )
      ) : (
        <ReadOnlyBlock value={type === 'number' && value ? `${value}원` : value} />
      )}
    </div>
  );
}
