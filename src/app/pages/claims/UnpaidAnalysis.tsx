/**
 * UnpaidAnalysis.tsx - 미지급금 분석
 * Phase 6 Step S11: 미지급금 발굴, 추가 청구 포인트 분석
 */
import { Claims, type ClaimsProps } from '@/app/pages/Claims';

interface UnpaidAnalysisProps {
  type?: ClaimsProps['type'];
  initialRequestId?: string | null;
  onNavigate?: ClaimsProps['onNavigate'];
}

export function UnpaidAnalysis({ type, initialRequestId, onNavigate }: UnpaidAnalysisProps) {
  return (
    <Claims
      type={type}
      initialRequestId={initialRequestId}
      onNavigate={onNavigate}
      claimsStageFilter="unpaid_analysis"
    />
  );
}
