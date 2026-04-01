/**
 * ClaimReceipt.tsx - 청구 접수
 * Phase 6 Step S10: 청구 서류 접수, 기본 검증
 */
import { Claims, type ClaimsProps } from '@/app/pages/Claims';

interface ClaimReceiptProps {
  type?: ClaimsProps['type'];
  initialRequestId?: string | null;
  onNavigate?: ClaimsProps['onNavigate'];
}

export function ClaimReceipt({ type, initialRequestId, onNavigate }: ClaimReceiptProps) {
  return (
    <Claims
      type={type}
      initialRequestId={initialRequestId}
      onNavigate={onNavigate}
      claimsStageFilter="receipt"
    />
  );
}
