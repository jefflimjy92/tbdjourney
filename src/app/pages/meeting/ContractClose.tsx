/**
 * ContractClose.tsx - 계약 체결
 * Phase 5 Step S9: 계약 등록, 후속 처리, 청구 인계
 */
import { MeetingExecution, type MeetingExecutionProps } from '@/app/pages/MeetingExecution';

interface ContractCloseProps {
  onNavigate: MeetingExecutionProps['onNavigate'];
  type?: MeetingExecutionProps['type'];
  initialRequestId?: string | null;
}

export function ContractClose({ onNavigate, type, initialRequestId }: ContractCloseProps) {
  return (
    <MeetingExecution
      onNavigate={onNavigate}
      type={type}
      initialRequestId={initialRequestId}
      meetingStageFilter="contract_close"
    />
  );
}
