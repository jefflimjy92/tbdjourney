/**
 * MeetingOnSite.tsx - 미팅 실행
 * Phase 5 Step S8: 대면 미팅, 보장분석 설명, 서명/동의
 * Sprint 2: 클로바노트 녹취 분석 연동 + 티어별 코칭 기록
 */
import React from 'react';
import { Mic, FileText, CheckCircle, Clock, Star, MessageSquare, Upload, Play, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { MeetingExecution, type MeetingExecutionProps } from '@/app/pages/MeetingExecution';

// ── S8: 클로바노트 연동 (녹취 분석) ──

type ClovaStatus = 'idle' | 'recording' | 'uploading' | 'analyzing' | 'completed' | 'failed';

interface ClovaAnalysisResult {
  duration: string;
  speakerCount: number;
  summary: string;
  keyTopics: string[];
  actionItems: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

function ClovaNotePanel() {
  const [status, setStatus] = React.useState<ClovaStatus>('idle');
  const [result, setResult] = React.useState<ClovaAnalysisResult | null>(null);

  const MOCK_RESULT: ClovaAnalysisResult = {
    duration: '42:15',
    speakerCount: 2,
    summary: '고객(강다연)에게 실손의료비 보장 분석 결과를 설명하고, 보장 공백(암진단비, 뇌혈관질환)에 대한 보강 설계를 제안함. 고객은 암진단비 보강에 긍정적 반응, 뇌혈관질환은 추가 검토 희망.',
    keyTopics: ['실손의료비 현황', '암진단비 보강', '뇌혈관질환 보장', '수수료 안내', '가족 연동 제안'],
    actionItems: ['암진단비 3,000만 보강 설계안 전달', '뇌혈관질환 보장 비교표 준비', '배우자 가족연동 안내 예정'],
    sentiment: 'positive',
  };

  const STATUS_CONFIG = {
    idle: { label: '대기', color: 'text-gray-500', bg: 'bg-gray-50' },
    recording: { label: '녹취 중...', color: 'text-rose-600', bg: 'bg-rose-50' },
    uploading: { label: '업로드 중...', color: 'text-blue-600', bg: 'bg-blue-50' },
    analyzing: { label: '분석 중...', color: 'text-amber-600', bg: 'bg-amber-50' },
    completed: { label: '분석 완료', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    failed: { label: '실패', color: 'text-rose-600', bg: 'bg-rose-50' },
  };

  const SENTIMENT_CONFIG = {
    positive: { label: '긍정적', color: 'text-emerald-700', bg: 'bg-emerald-50' },
    neutral: { label: '보통', color: 'text-gray-700', bg: 'bg-gray-50' },
    negative: { label: '부정적', color: 'text-rose-700', bg: 'bg-rose-50' },
  };

  const handleStartAnalysis = () => {
    setStatus('uploading');
    setTimeout(() => setStatus('analyzing'), 800);
    setTimeout(() => {
      setStatus('completed');
      setResult(MOCK_RESULT);
    }, 1600);
  };

  const stCfg = STATUS_CONFIG[status];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Mic className="h-4 w-4 text-emerald-500" />
          S8. 클로바노트 녹취 분석
        </h3>
        <span className={clsx('px-2 py-0.5 rounded text-[10px] font-bold', stCfg.bg, stCfg.color)}>
          {stCfg.label}
        </span>
      </div>

      {status === 'idle' && (
        <div className="space-y-2">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">녹취 파일을 업로드하거나 클로바노트에서 가져오기</p>
            <div className="flex gap-2 mt-3 justify-center">
              <button
                onClick={handleStartAnalysis}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1"
              >
                <Play className="h-3.5 w-3.5" /> 녹취 파일 분석
              </button>
              <button className="px-4 py-2 text-xs font-bold border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50">
                클로바노트 연동
              </button>
            </div>
          </div>
        </div>
      )}

      {(status === 'uploading' || status === 'analyzing') && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
            <p className={clsx('text-xs font-bold', stCfg.color)}>{stCfg.label}</p>
          </div>
        </div>
      )}

      {status === 'completed' && result && (
        <div className="space-y-3">
          {/* 요약 정보 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-gray-500">통화 시간</p>
              <p className="text-sm font-bold text-gray-800">{result.duration}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-gray-500">참여자</p>
              <p className="text-sm font-bold text-gray-800">{result.speakerCount}명</p>
            </div>
            <div className={clsx('rounded-lg p-2 text-center', SENTIMENT_CONFIG[result.sentiment].bg)}>
              <p className="text-[10px] text-gray-500">고객 반응</p>
              <p className={clsx('text-sm font-bold', SENTIMENT_CONFIG[result.sentiment].color)}>
                {SENTIMENT_CONFIG[result.sentiment].label}
              </p>
            </div>
          </div>

          {/* AI 요약 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-[10px] font-bold text-blue-700 mb-1">AI 요약</p>
            <p className="text-xs text-blue-800 leading-relaxed">{result.summary}</p>
          </div>

          {/* 핵심 주제 */}
          <div>
            <p className="text-[10px] font-bold text-gray-600 mb-1.5">핵심 주제</p>
            <div className="flex flex-wrap gap-1.5">
              {result.keyTopics.map((topic, i) => (
                <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-[10px] font-medium">{topic}</span>
              ))}
            </div>
          </div>

          {/* 후속 조치 */}
          <div>
            <p className="text-[10px] font-bold text-gray-600 mb-1.5">후속 조치 (Action Items)</p>
            <div className="space-y-1">
              {result.actionItems.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── S8: 티어별 코칭 기록 ──

type CoachingTier = 1 | 2 | 3;

interface CoachingRecord {
  id: string;
  date: string;
  tier: CoachingTier;
  staffName: string;
  coach: string;
  type: 'observation' | 'roleplay' | 'debrief' | 'accompaniment';
  score: number;
  strengths: string;
  improvements: string;
  nextAction: string;
}

function TierCoachingPanel() {
  const TIER_CONFIG = {
    1: { label: 'Tier 1 (신입)', description: '동행미팅 필수, 매 건 피드백', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-100' },
    2: { label: 'Tier 2 (성장)', description: '주 1회 동행, 주간 피드백', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100' },
    3: { label: 'Tier 3 (독립)', description: '월 1회 점검, 자율 운영', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100' },
  };

  const COACHING_TYPE_LABELS = {
    observation: '관찰',
    roleplay: '역할극',
    debrief: '디브리핑',
    accompaniment: '동행미팅',
  };

  const [records] = React.useState<CoachingRecord[]>([
    { id: 'CR-01', date: '2026-03-31', tier: 1, staffName: '김민수', coach: '박영업팀장', type: 'accompaniment', score: 65, strengths: '고객 라포 형성 우수', improvements: '보장 분석 설명 시 전문용어 과다', nextAction: '쉬운 표현 연습 (역할극 3회)' },
    { id: 'CR-02', date: '2026-03-29', tier: 2, staffName: '이서연', coach: '박영업팀장', type: 'debrief', score: 78, strengths: '청약서 작성 정확도 높음', improvements: '클로징 타이밍 개선 필요', nextAction: '클로징 스크립트 복습' },
    { id: 'CR-03', date: '2026-03-28', tier: 1, staffName: '김민수', coach: '박영업팀장', type: 'roleplay', score: 55, strengths: '경청 자세 양호', improvements: '반론 처리 미숙', nextAction: '반론 처리 5가지 시나리오 연습' },
  ]);

  const [selectedTier, setSelectedTier] = React.useState<CoachingTier | 0>(0);
  const [showAddForm, setShowAddForm] = React.useState(false);

  const filtered = selectedTier === 0 ? records : records.filter(r => r.tier === selectedTier);
  const avgScore = filtered.length > 0 ? Math.round(filtered.reduce((s, r) => s + r.score, 0) / filtered.length) : 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-500" />
          S8. 티어별 코칭 기록
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-2 py-1 text-[10px] font-bold text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
        >
          + 코칭 기록
        </button>
      </div>

      {/* 티어 필터 */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setSelectedTier(0)}
          className={clsx('px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors',
            selectedTier === 0 ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-300'
          )}
        >
          전체
        </button>
        {([1, 2, 3] as CoachingTier[]).map(tier => {
          const cfg = TIER_CONFIG[tier];
          return (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={clsx('px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors',
                selectedTier === tier ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'bg-white text-gray-500 border-gray-300'
              )}
            >
              T{tier}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-1 text-xs text-gray-500">
          평균 점수: <span className={clsx('font-bold', avgScore >= 70 ? 'text-emerald-600' : avgScore >= 50 ? 'text-amber-600' : 'text-rose-600')}>{avgScore}점</span>
        </div>
      </div>

      {/* 코칭 기록 추가 폼 */}
      {showAddForm && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="팀원명" className="px-2 py-1.5 text-xs border border-gray-300 rounded" />
            <select className="px-2 py-1.5 text-xs border border-gray-300 rounded">
              <option value="">티어 선택</option>
              <option value="1">Tier 1 (신입)</option>
              <option value="2">Tier 2 (성장)</option>
              <option value="3">Tier 3 (독립)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className="px-2 py-1.5 text-xs border border-gray-300 rounded">
              <option value="">코칭 유형</option>
              <option value="observation">관찰</option>
              <option value="roleplay">역할극</option>
              <option value="debrief">디브리핑</option>
              <option value="accompaniment">동행미팅</option>
            </select>
            <input placeholder="점수 (0-100)" type="number" className="px-2 py-1.5 text-xs border border-gray-300 rounded" />
          </div>
          <textarea placeholder="강점" className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded" rows={1} />
          <textarea placeholder="개선점" className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded" rows={1} />
          <textarea placeholder="다음 액션" className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded" rows={1} />
          <button className="w-full py-1.5 text-[10px] font-bold bg-blue-600 text-white rounded hover:bg-blue-700">
            코칭 기록 저장
          </button>
        </div>
      )}

      {/* 코칭 기록 리스트 */}
      <div className="space-y-2">
        {filtered.map(record => {
          const tierCfg = TIER_CONFIG[record.tier];
          return (
            <div key={record.id} className="rounded-lg border border-gray-200 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-bold', tierCfg.badge, tierCfg.color)}>T{record.tier}</span>
                  <span className="text-xs font-bold text-gray-700">{record.staffName}</span>
                  <span className="text-[10px] text-gray-400">· {COACHING_TYPE_LABELS[record.type]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">{record.date}</span>
                  <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-bold',
                    record.score >= 70 ? 'bg-emerald-50 text-emerald-700' : record.score >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                  )}>{record.score}점</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div>
                  <span className="text-emerald-600 font-bold">강점</span>
                  <p className="text-gray-600 mt-0.5">{record.strengths}</p>
                </div>
                <div>
                  <span className="text-amber-600 font-bold">개선</span>
                  <p className="text-gray-600 mt-0.5">{record.improvements}</p>
                </div>
                <div>
                  <span className="text-blue-600 font-bold">다음 액션</span>
                  <p className="text-gray-600 mt-0.5">{record.nextAction}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ──

interface MeetingOnSiteProps {
  onNavigate: MeetingExecutionProps['onNavigate'];
  type?: MeetingExecutionProps['type'];
  initialRequestId?: string | null;
}

export function MeetingOnSite({ onNavigate, type, initialRequestId }: MeetingOnSiteProps) {
  return (
    <div className="space-y-4">
      {/* 기존 미팅 실행 MeetingExecution */}
      <MeetingExecution
        onNavigate={onNavigate}
        type={type}
        initialRequestId={initialRequestId}
        meetingStageFilter="on_site"
      />
      {/* S8 확장 패널: 클로바노트 + 티어 코칭 (팀장용) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ClovaNotePanel />
        <TierCoachingPanel />
      </div>
    </div>
  );
}
