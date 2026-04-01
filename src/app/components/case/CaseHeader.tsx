import type { ReactNode } from 'react';
import { ShieldCheck, User2 } from 'lucide-react';
import { useJourney } from '@/app/journey/JourneyContext';
import type { JourneyPhase, JourneyType } from '@/app/journey/types';

const journeyTypeLabelMap: Record<JourneyType, string> = {
  refund: '3년환급',
  simple: '간편청구',
  intro: '소개',
  family: '가족',
};

const phaseLabelMap: Record<JourneyPhase, string> = {
  inflow: '유입',
  inquiry: '조회/신청',
  classification: '선별/배정',
  tm: '상담/TM',
  meeting: '미팅/계약',
  claims: '청구',
  payment: '지급/사후',
  growth: 'Growth',
};

export function CaseHeader({ requestId }: { requestId: string }) {
  const { journey } = useJourney(requestId);

  if (!journey) return null;

  const customerPhone =
    'customerPhone' in journey && typeof journey.customerPhone === 'string' && journey.customerPhone.trim()
      ? journey.customerPhone
      : '-';

  const journeyType =
    ('type' in journey ? journey.type : journey.journeyType) as JourneyType;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-4">
        <Badge tone="neutral">{requestId}</Badge>
        <Badge>{journey.customerName}</Badge>
        <Badge>{customerPhone}</Badge>
        <Badge tone="indigo">{journeyTypeLabelMap[journeyType]}</Badge>
        <Badge tone="emerald">{phaseLabelMap[journey.phase]}</Badge>
      </div>

      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <InfoChip
          icon={<ShieldCheck size={14} />}
          label="현재 상태"
          value={journey.currentStageStatus.statusLabel}
          tone="emerald"
        />
        <InfoChip
          icon={<User2 size={14} />}
          label="담당자"
          value={journey.owner}
          tone="slate"
        />
      </div>
    </div>
  );
}

function Badge({
  children,
  tone = 'slate',
}: {
  children: ReactNode;
  tone?: 'slate' | 'neutral' | 'emerald' | 'indigo';
}) {
  const toneClassName =
    tone === 'neutral'
      ? 'border-slate-200 bg-slate-100 text-slate-600'
      : tone === 'emerald'
        ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
        : tone === 'indigo'
          ? 'border-indigo-100 bg-indigo-50 text-indigo-700'
          : 'border-slate-200 bg-white text-slate-800';

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${toneClassName}`}>
      {children}
    </span>
  );
}

function InfoChip({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: 'emerald' | 'slate';
}) {
  const toneClassName =
    tone === 'emerald'
      ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
      : 'border-slate-200 bg-slate-50 text-slate-700';

  return (
    <div className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 ${toneClassName}`}>
      <span>{icon}</span>
      <div className="flex items-center gap-1.5 text-sm">
        <span className="font-medium opacity-80">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
    </div>
  );
}
