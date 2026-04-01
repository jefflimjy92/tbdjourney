import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { HandoffModal } from '@/app/components/HandoffModal';
import { CallTeamSection } from '@/app/components/case/CallTeamSection';
import { CaseHeader } from '@/app/components/case/CaseHeader';
import { ClaimsTeamSection } from '@/app/components/case/ClaimsTeamSection';
import { SalesTeamSection } from '@/app/components/case/SalesTeamSection';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/app/components/ui/accordion';
import { useRole } from '@/app/auth/RoleContext';
import { useJourney } from '@/app/journey/JourneyContext';

type CaseSection = 'call' | 'sales' | 'claims';
type HandoffType = 'call-to-sales' | 'sales-to-claims';

interface CaseDetailPageProps {
  requestId: string;
  initialSection?: CaseSection;
  onNavigate: (target: string) => void;
}

function resolveActiveSection(
  phase: string | undefined,
  initialSection: CaseSection,
): CaseSection {
  if (!phase) return initialSection;

  if (['inflow', 'inquiry', 'classification', 'tm'].includes(phase)) return 'call';
  if (phase === 'meeting') return 'sales';
  if (['claims', 'payment', 'growth'].includes(phase)) return 'claims';

  return initialSection;
}

export function CaseDetailPage({
  requestId,
  initialSection = 'call',
  onNavigate,
}: CaseDetailPageProps) {
  const { journey } = useJourney(requestId);
  const { currentRole } = useRole();

  const isCallTeam = currentRole === 'call_member' || currentRole === 'call_lead';
  const isSalesTeam = currentRole === 'sales_member' || currentRole === 'sales_lead';
  const isClaimsTeam = currentRole === 'claims_member' || currentRole === 'claims_lead';
  const isClaimsLead = currentRole === 'claims_lead';

  const currentSection = useMemo(
    () => resolveActiveSection(journey?.phase, initialSection),
    [initialSection, journey?.phase],
  );

  const [expandedSection, setExpandedSection] = useState<CaseSection[]>([currentSection]);
  const [handoffModal, setHandoffModal] = useState<HandoffType | null>(null);

  useEffect(() => {
    setExpandedSection([currentSection]);
  }, [currentSection, requestId]);

  const isCallEditable = isCallTeam && currentSection === 'call';
  const isSalesEditable = isSalesTeam && currentSection === 'sales';
  const isClaimsEditable = isClaimsTeam && currentSection === 'claims';

  const handleHandoffConfirm = (acknowledged: boolean) => {
    if (!acknowledged) {
      console.log('handoff_incomplete', { requestId, handoffType: handoffModal });
    }

    setHandoffModal(null);
    toast.success('인계가 완료되었습니다.');
  };

  if (!requestId) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <div className="text-lg font-semibold text-slate-900">케이스를 선택해주세요.</div>
        <div className="mt-2 text-sm text-slate-500">
          목록에서 접수 건을 선택하면 팀별 진행 상황과 인계 정보를 확인할 수 있습니다.
        </div>
        <button
          type="button"
          onClick={() => onNavigate('requests')}
          className="mt-6 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
        >
          접수 관리로 이동
        </button>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <div className="text-lg font-semibold text-slate-900">케이스 정보를 찾을 수 없습니다.</div>
        <div className="mt-2 text-sm text-slate-500">
          선택한 접수 ID에 대한 여정 데이터가 아직 준비되지 않았습니다.
        </div>
        <button
          type="button"
          onClick={() => onNavigate('requests')}
          className="mt-6 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CaseHeader requestId={requestId} />

      <Accordion
        type="multiple"
        value={expandedSection}
        onValueChange={(value) => setExpandedSection(value as CaseSection[])}
        className="space-y-3"
      >
        <AccordionItem value="call" className="rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
          <AccordionTrigger className="py-4 text-base font-semibold text-slate-900 hover:no-underline">
            [콜팀] 접수/상담/TM
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <CallTeamSection
              requestId={requestId}
              isEditable={isCallEditable}
              isExpanded={expandedSection.includes('call')}
              onToggle={() => {}}
              onHandoff={() => setHandoffModal('call-to-sales')}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sales" className="rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
          <AccordionTrigger className="py-4 text-base font-semibold text-slate-900 hover:no-underline">
            [영업팀] 미팅/계약
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <SalesTeamSection
              requestId={requestId}
              isEditable={isSalesEditable}
              isExpanded={expandedSection.includes('sales')}
              onToggle={() => {}}
              onHandoff={() => setHandoffModal('sales-to-claims')}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="claims" className="rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
          <AccordionTrigger className="py-4 text-base font-semibold text-slate-900 hover:no-underline">
            [청구팀] 청구 처리
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <ClaimsTeamSection
              requestId={requestId}
              isEditable={isClaimsEditable}
              isExpanded={expandedSection.includes('claims')}
              onToggle={() => {}}
              isClaimsLead={isClaimsLead}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {handoffModal && (
        <HandoffModal
          requestId={requestId}
          handoffType={handoffModal}
          onConfirm={handleHandoffConfirm}
          onCancel={() => setHandoffModal(null)}
        />
      )}
    </div>
  );
}
