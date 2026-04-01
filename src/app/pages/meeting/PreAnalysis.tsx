/**
 * PreAnalysis.tsx - 사전분석
 * Phase 5 Step S7: 보험 분석 파일 업로드, 미팅 전략 수립
 * Sprint 2: 가능/보상DB 분리 판단 + CASE1~4 동반/소개 유형 분류
 */
import React from 'react';
import { CheckCircle, ArrowRight, Users, FileText, Briefcase } from 'lucide-react';
import clsx from 'clsx';
import { MeetingExecution, type MeetingExecutionProps } from '@/app/pages/MeetingExecution';

// ── S7: 가능/보상DB 분리 판단 ──

type DbSeparationType = '' | 'possible' | 'compensation';

interface DbSeparationCriteria {
  key: string;
  label: string;
  description: string;
  checked: boolean;
  indicatesCompensation: boolean;
}

function DbSeparationPanel() {
  const [criteria, setCriteria] = React.useState<DbSeparationCriteria[]>([
    { key: 'existing_claim', label: '기존 보험금 지급이력 있음', description: '과거 보험금 수령 이력이 확인됨', checked: false, indicatesCompensation: true },
    { key: 'ongoing_treatment', label: '현재 치료 중인 질환 있음', description: '진행 중인 치료로 추가 청구 가능', checked: false, indicatesCompensation: true },
    { key: 'unpaid_items', label: '미지급 항목 발견', description: '심평원 대조 결과 미지급 건 확인', checked: true, indicatesCompensation: true },
    { key: 'new_insurance_need', label: '신규 보험 가입 필요', description: '보장 공백 또는 보강 필요 확인', checked: true, indicatesCompensation: false },
    { key: 'design_review_needed', label: '보험 설계 리뷰 필요', description: '현재 보험 구성 분석 및 재설계 제안', checked: true, indicatesCompensation: false },
  ]);

  const [selectedDb, setSelectedDb] = React.useState<DbSeparationType>('');
  const [confirmed, setConfirmed] = React.useState(false);

  const compensationCount = criteria.filter(c => c.checked && c.indicatesCompensation).length;
  const possibleCount = criteria.filter(c => c.checked && !c.indicatesCompensation).length;
  const autoSuggestion: DbSeparationType = compensationCount > possibleCount ? 'compensation' : 'possible';

  const handleToggle = (key: string) => {
    setCriteria(prev => prev.map(c => c.key === key ? { ...c, checked: !c.checked } : c));
    setConfirmed(false);
  };

  const DB_TYPE_CONFIG = {
    possible: { label: '가능DB', description: '신규 보험 가입 + 환급 진행', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    compensation: { label: '보상DB', description: '보험금 청구/보상 중심 진행', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
        <Briefcase className="h-4 w-4 text-blue-500" />
        S7. 가능DB / 보상DB 분리 판단
      </h3>

      <div className="space-y-1.5">
        {criteria.map(c => (
          <label key={c.key} className={clsx(
            'flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors',
            c.checked ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200 hover:bg-gray-50'
          )}>
            <input
              type="checkbox"
              checked={c.checked}
              onChange={() => handleToggle(c.key)}
              className="rounded border-gray-300 mt-0.5"
            />
            <div>
              <p className="text-xs font-medium text-gray-700">{c.label}</p>
              <p className="text-[10px] text-gray-500">{c.description}</p>
              <span className={clsx('text-[9px] font-bold mt-0.5 inline-block',
                c.indicatesCompensation ? 'text-amber-600' : 'text-blue-600'
              )}>
                {c.indicatesCompensation ? '→ 보상DB 지표' : '→ 가능DB 지표'}
              </span>
            </div>
          </label>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
        <p className="text-[10px] text-gray-500 mb-2">시스템 추천: <span className="font-bold">{DB_TYPE_CONFIG[autoSuggestion].label}</span> (보상지표 {compensationCount}건 / 가능지표 {possibleCount}건)</p>
        <div className="flex gap-2">
          {(['possible', 'compensation'] as const).map(dbType => {
            const cfg = DB_TYPE_CONFIG[dbType];
            return (
              <button
                key={dbType}
                onClick={() => { setSelectedDb(dbType); setConfirmed(false); }}
                className={clsx(
                  'flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-colors',
                  selectedDb === dbType ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                )}
              >
                {cfg.label}
                {dbType === autoSuggestion && <span className="text-[9px] ml-1">(추천)</span>}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDb && !confirmed && (
        <button
          onClick={() => setConfirmed(true)}
          className="w-full py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1"
        >
          <CheckCircle className="h-3.5 w-3.5" /> {DB_TYPE_CONFIG[selectedDb].label}로 확정
        </button>
      )}

      {confirmed && selectedDb && (
        <div className={clsx('rounded-lg px-4 py-3 text-xs font-bold flex items-center gap-2', DB_TYPE_CONFIG[selectedDb].bg, DB_TYPE_CONFIG[selectedDb].color, 'border', DB_TYPE_CONFIG[selectedDb].border)}>
          <CheckCircle className="h-4 w-4" />
          {DB_TYPE_CONFIG[selectedDb].label} 확정 — {DB_TYPE_CONFIG[selectedDb].description}
          {selectedDb === 'compensation' && <span className="text-[10px] font-normal ml-1">(S7 사전분석 스킵 가능)</span>}
        </div>
      )}
    </div>
  );
}

// ── S7: CASE1~4 동반/소개 유형 분류 ──

type CaseType = 'CASE1' | 'CASE2' | 'CASE3' | 'CASE4';

interface CaseDefinition {
  type: CaseType;
  label: string;
  description: string;
  flow: string;
  icon: React.ElementType;
}

const CASE_DEFINITIONS: CaseDefinition[] = [
  { type: 'CASE1', label: '본인 단독', description: '본인만 미팅 진행', flow: '표준 S7→S8→S9 플로우', icon: FileText },
  { type: 'CASE2', label: '동반신청 (가족)', description: '가족 동반 미팅 — 동일 설계사', flow: '본인+가족 동시 진행, 가족 Pack 추가', icon: Users },
  { type: 'CASE3', label: '소개 (지인)', description: '지인 소개 건 — Same-owner 배정', flow: 'R4 자동배정 → S8 미팅', icon: ArrowRight },
  { type: 'CASE4', label: '동반+소개 복합', description: '가족 동반 + 지인 소개 동시', flow: '가족 Pack + 소개 Pack 동시 적용', icon: Users },
];

function CaseClassificationPanel() {
  const [selectedCase, setSelectedCase] = React.useState<CaseType | ''>('');
  const [companionCount, setCompanionCount] = React.useState(0);
  const [referralCount, setReferralCount] = React.useState(0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
        <Users className="h-4 w-4 text-violet-500" />
        S7. 동반/소개 유형 분류 (CASE 1~4)
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {CASE_DEFINITIONS.map(caseDef => {
          const Icon = caseDef.icon;
          const isSelected = selectedCase === caseDef.type;
          return (
            <button
              key={caseDef.type}
              onClick={() => setSelectedCase(caseDef.type)}
              className={clsx(
                'p-3 rounded-lg border-2 text-left transition-colors',
                isSelected ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:border-gray-300 bg-white'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={clsx('h-3.5 w-3.5', isSelected ? 'text-violet-600' : 'text-gray-400')} />
                <span className={clsx('text-xs font-bold', isSelected ? 'text-violet-700' : 'text-gray-600')}>{caseDef.type}</span>
              </div>
              <p className={clsx('text-xs font-medium', isSelected ? 'text-violet-700' : 'text-gray-700')}>{caseDef.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{caseDef.description}</p>
            </button>
          );
        })}
      </div>

      {selectedCase && (
        <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 space-y-2">
          <p className="text-xs font-bold text-violet-700">
            {CASE_DEFINITIONS.find(c => c.type === selectedCase)?.label} 선택
          </p>
          <p className="text-[10px] text-violet-600">
            플로우: {CASE_DEFINITIONS.find(c => c.type === selectedCase)?.flow}
          </p>

          {(selectedCase === 'CASE2' || selectedCase === 'CASE4') && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-gray-600">동반 인원:</span>
              <div className="flex gap-1">
                {[1, 2, 3].map(n => (
                  <button
                    key={n}
                    onClick={() => setCompanionCount(n)}
                    className={clsx(
                      'w-7 h-7 rounded text-xs font-bold border',
                      companionCount === n ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-500 border-gray-300'
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-gray-400">명</span>
            </div>
          )}

          {(selectedCase === 'CASE3' || selectedCase === 'CASE4') && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-gray-600">소개 건수:</span>
              <div className="flex gap-1">
                {[1, 2, 3].map(n => (
                  <button
                    key={n}
                    onClick={() => setReferralCount(n)}
                    className={clsx(
                      'w-7 h-7 rounded text-xs font-bold border',
                      referralCount === n ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-500 border-gray-300'
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-gray-400">건</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──

interface PreAnalysisProps {
  onNavigate: MeetingExecutionProps['onNavigate'];
  type?: MeetingExecutionProps['type'];
  initialRequestId?: string | null;
}

export function PreAnalysis({ onNavigate, type, initialRequestId }: PreAnalysisProps) {
  return (
    <div className="space-y-4">
      {/* S7 확장 패널: DB 분리 + CASE 분류 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DbSeparationPanel />
        <CaseClassificationPanel />
      </div>
      {/* 기존 사전분석 MeetingExecution */}
      <MeetingExecution
        onNavigate={onNavigate}
        type={type}
        initialRequestId={initialRequestId}
        meetingStageFilter="pre_analysis"
      />
    </div>
  );
}
