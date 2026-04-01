import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/app/components/ui/accordion';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Textarea } from '@/app/components/ui/textarea';
import { useJourney } from '@/app/journey/JourneyContext';

interface CallTeamSectionProps {
  requestId: string;
  isEditable: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onHandoff: () => void;
}

const HEALTH_CHECK_ITEMS = [
  { id: 'condition', label: '기저질환 확인' },
  { id: 'surgery', label: '최근 수술/입원 여부 확인' },
  { id: 'medication', label: '복용 중 약 여부 확인' },
] as const;

const DB_CATEGORY_LABELS: Record<string, string> = {
  possible: '가능 DB',
  compensation: '보상 DB',
  referral: '소개 DB',
  intro: '소개 DB',
  companion: '가족 DB',
};

export function CallTeamSection({
  requestId,
  isEditable,
  isExpanded,
  onToggle,
  onHandoff,
}: CallTeamSectionProps) {
  const { journey } = useJourney(requestId);
  const journeyLike = journey as (typeof journey & { dbCategory?: string }) | undefined;

  const [intakeChannel] = useState('앱 유입');
  const [healthChecklist, setHealthChecklist] = useState<Record<string, boolean>>({
    condition: true,
    surgery: false,
    medication: true,
  });
  const [insuranceSummary, setInsuranceSummary] = useState('실손/정액보험 가입 여부와 주요 특약을 확인했습니다.');
  const [initialReaction, setInitialReaction] = useState('관심 높음');
  const [deepConsultationNote, setDeepConsultationNote] = useState('보장 공백과 기존 청구 이력을 중심으로 심화 상담을 진행했습니다.');
  const [meetingFit, setMeetingFit] = useState<'적합' | '보류' | '부적합'>('적합');
  const [customerMemo, setCustomerMemo] = useState('결정 전 가족 상의가 필요하며, 저녁 시간대 연락 선호.');

  const dbCategory =
    (journeyLike?.dbCategory && DB_CATEGORY_LABELS[journeyLike.dbCategory]) ||
    (journey?.dbCategoryV2 && DB_CATEGORY_LABELS[journey.dbCategoryV2]) ||
    '미분류';

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Call Team</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">콜팀 섹션</div>
        </div>
        {isExpanded ? <ChevronUp className="size-5 text-slate-400" /> : <ChevronDown className="size-5 text-slate-400" />}
      </button>

      {isExpanded && (
        <div className="border-t border-slate-100 px-5 py-5">
          <Accordion type="multiple" defaultValue={['intake', 'first', 'second']} className="space-y-3">
            <AccordionItem value="intake" className="rounded-2xl border border-slate-200 px-4">
              <AccordionTrigger className="py-4 text-base font-semibold text-slate-900 hover:no-underline">
                접수 정보
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-5">
                <ReadOnlyRow label="DB 분류 결과" value={<Badge variant="outline">{dbCategory}</Badge>} />
                <ReadOnlyRow label="접수 채널" value={intakeChannel} />
                <ReadOnlyRow label="배정 정보" value={journey?.owner ?? '-'} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="first" className="rounded-2xl border border-slate-200 px-4">
              <AccordionTrigger className="py-4 text-base font-semibold text-slate-900 hover:no-underline">
                1차 상담
              </AccordionTrigger>
              <AccordionContent className="space-y-5 pb-5">
                <div className="space-y-3">
                  <FieldLabel>건강 체크리스트</FieldLabel>
                  {isEditable ? (
                    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      {HEALTH_CHECK_ITEMS.map((item) => (
                        <label key={item.id} className="flex items-center gap-3 text-sm text-slate-700">
                          <Checkbox
                            checked={healthChecklist[item.id] === true}
                            onCheckedChange={(checked) => {
                              setHealthChecklist((current) => ({ ...current, [item.id]: checked === true }));
                            }}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <ReadOnlyBlock value={HEALTH_CHECK_ITEMS.filter((item) => healthChecklist[item.id]).map((item) => item.label).join(', ') || '-'} />
                  )}
                </div>

                <EditableField
                  isEditable={isEditable}
                  label="보험 현황 입력"
                  value={insuranceSummary}
                  onChange={setInsuranceSummary}
                  multiline
                />

                <div className="space-y-2">
                  <FieldLabel>초기 고객 반응</FieldLabel>
                  {isEditable ? (
                    <select
                      value={initialReaction}
                      onChange={(event) => setInitialReaction(event.target.value)}
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none ring-0"
                    >
                      <option value="관심 높음">관심 높음</option>
                      <option value="추가 확인 필요">추가 확인 필요</option>
                      <option value="경계적">경계적</option>
                    </select>
                  ) : (
                    <ReadOnlyBlock value={initialReaction} />
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="second" className="rounded-2xl border border-slate-200 px-4">
              <AccordionTrigger className="py-4 text-base font-semibold text-slate-900 hover:no-underline">
                2차 상담
              </AccordionTrigger>
              <AccordionContent className="space-y-5 pb-5">
                <EditableField
                  isEditable={isEditable}
                  label="심화 상담 내용"
                  value={deepConsultationNote}
                  onChange={setDeepConsultationNote}
                  multiline
                />

                <div className="space-y-2">
                  <FieldLabel>미팅 적합 판정</FieldLabel>
                  {isEditable ? (
                    <select
                      value={meetingFit}
                      onChange={(event) => setMeetingFit(event.target.value as typeof meetingFit)}
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none ring-0"
                    >
                      <option value="적합">적합</option>
                      <option value="보류">보류</option>
                      <option value="부적합">부적합</option>
                    </select>
                  ) : (
                    <ReadOnlyBlock value={meetingFit} />
                  )}
                </div>

                <EditableField
                  isEditable={isEditable}
                  label="고객 성향/주의사항 메모"
                  value={customerMemo}
                  onChange={setCustomerMemo}
                  multiline
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {isEditable && (
            <div className="mt-5">
              <Button onClick={onHandoff} className="w-full">
                영업팀에 인계하기 →
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <div className="text-sm font-medium text-slate-700">{children}</div>;
}

function ReadOnlyRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}

function ReadOnlyBlock({ value }: { value: string }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{value}</div>;
}

function EditableField({
  isEditable,
  label,
  value,
  onChange,
  multiline = false,
}: {
  isEditable: boolean;
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      {isEditable ? (
        multiline ? (
          <Textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-24" />
        ) : (
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none ring-0"
          />
        )
      ) : (
        <ReadOnlyBlock value={value || '-'} />
      )}
    </div>
  );
}
