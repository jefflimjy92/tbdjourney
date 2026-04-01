/**
 * FirstTM.tsx - 1차 TM (초기 상담)
 * Phase 4 Step S5: 첫 통화 연결, 보험 현황 확인, 기본 건강 체크
 */
import { Consultation, type ConsultationProps } from '@/app/pages/Consultation';

interface FirstTMProps {
  type?: ConsultationProps['type'];
  initialRequestId?: string | null;
}

export function FirstTM({ type, initialRequestId }: FirstTMProps) {
  return (
    <Consultation
      type={type}
      initialRequestId={initialRequestId}
      tmStageFilter="first"
    />
  );
}
