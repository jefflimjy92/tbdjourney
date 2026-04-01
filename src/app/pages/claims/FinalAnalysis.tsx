/**
 * FinalAnalysis.tsx - 최종 분석
 * Phase 6 Step S13: 최종 청구 분석, 검증, 제출
 */
import { Claims, type ClaimsProps } from '@/app/pages/Claims';

interface FinalAnalysisProps {
  type?: ClaimsProps['type'];
  initialRequestId?: string | null;
  onNavigate?: ClaimsProps['onNavigate'];
}

export function FinalAnalysis({ type, initialRequestId, onNavigate }: FinalAnalysisProps) {
  return (
    <Claims
      type={type}
      initialRequestId={initialRequestId}
      onNavigate={onNavigate}
      claimsStageFilter="final_analysis"
    />
  );
}
