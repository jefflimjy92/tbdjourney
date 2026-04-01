/**
 * TMChecklist.tsx - 인계 체크리스트
 * Phase 4 → Phase 5 전환: 미팅 예약 확정, 인계 메모, 녹취 확인
 * Handoff.tsx 기능을 흡수
 */
import { Consultation, type ConsultationProps } from '@/app/pages/Consultation';

interface TMChecklistProps {
  type?: ConsultationProps['type'];
  initialRequestId?: string | null;
}

export function TMChecklist({ type, initialRequestId }: TMChecklistProps) {
  return (
    <Consultation
      type={type}
      initialRequestId={initialRequestId}
      tmStageFilter="checklist"
    />
  );
}
