/**
 * SecondTM.tsx - 2차 TM (심화 상담)
 * Phase 4 Step S6: 건강 상세, 예외질병 확인, 미팅 전환 판단
 */
import { Consultation, type ConsultationProps } from '@/app/pages/Consultation';

interface SecondTMProps {
  type?: ConsultationProps['type'];
  initialRequestId?: string | null;
}

export function SecondTM({ type, initialRequestId }: SecondTMProps) {
  return (
    <Consultation
      type={type}
      initialRequestId={initialRequestId}
      tmStageFilter="second"
    />
  );
}
