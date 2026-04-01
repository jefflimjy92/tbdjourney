/**
 * SimpleClaimWorkflow.tsx - 간편청구 전용 워크플로우
 * Q1-Q9 간편청구 전용 스테퍼
 */
import React from 'react';
import {
  CheckCircle,
  Circle,
  Clock,
  ArrowRight,
  Search,
  Filter,
  FileText,
  User,
  Upload,
  Send,
  DollarSign,
  ShieldAlert,
  Users,
  Heart,
  Link,
  TrendingUp,
  Bell,
  RefreshCw,
} from 'lucide-react';
import clsx from 'clsx';
import { SIMPLE_CLAIM_STEP_SEQUENCE, STEP_LABELS } from '@/app/journey/phaseConfig';

interface SimpleClaimStepUI {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const STEP_ICONS: Record<string, React.ElementType> = {
  Q1_intake_start: FileText,
  Q2_identity_verify: User,
  Q3_first_claim_call: Search,
  Q4_precision_analysis: FileText,
  Q5_customer_confirm: Send,
  Q6_insurer_submit: Upload,
  Q7_payment_tracking: Clock,
  Q8_gap_detection: Filter,
  Q9_retention_growth: DollarSign,
};

const STEP_DESCRIPTIONS: Record<string, string> = {
  Q1_intake_start: '간편청구 접수 개시',
  Q2_identity_verify: '고객 본인 인증 및 분기',
  Q3_first_claim_call: '청구콜 및 서류 확보',
  Q4_precision_analysis: '교차대조 정밀 분석',
  Q5_customer_confirm: '고객 안내 및 청구 확정',
  Q6_insurer_submit: '보험사 청구 접수',
  Q7_payment_tracking: '지급 추적 및 결과 안내',
  Q8_gap_detection: '보장 공백 분석',
  Q9_retention_growth: '가족/소개 확장',
};

/** phaseConfig 기반 단일 소스: SIMPLE_CLAIM_STEP_SEQUENCE + STEP_LABELS */
const SIMPLE_CLAIM_STEPS: SimpleClaimStepUI[] = SIMPLE_CLAIM_STEP_SEQUENCE.map(stepCode => {
  const shortId = stepCode.split('_')[0]; // Q1, Q2, ...
  return {
    id: shortId,
    label: STEP_LABELS[stepCode],
    description: STEP_DESCRIPTIONS[stepCode] || '',
    icon: STEP_ICONS[stepCode] || FileText,
  };
});

type ClaimStatus = 'completed' | 'current' | 'pending';

// ── Q2~Q7 Step Detail Panel Components ──

function Q2BranchPanel() {
  const [checks, setChecks] = React.useState({
    claimUnder3m: true,
    simpleDocuments: true,
    noLegalDispute: true,
    singleInsurer: false,
  });
  const simpleCount = Object.values(checks).filter(Boolean).length;
  const verdict = simpleCount >= 3 ? 'simple' : 'refund';

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-800">Q2. 간편청구 vs 3년환급 분기 판단</h3>
      <div className="grid grid-cols-2 gap-2">
        {([
          ['claimUnder3m', '청구액 300만원 이하'],
          ['simpleDocuments', '서류 간단 (진단서+영수증)'],
          ['noLegalDispute', '법적 분쟁 없음'],
          ['singleInsurer', '단일 보험사 청구'],
        ] as const).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 p-2 rounded border border-gray-200 bg-gray-50 text-sm cursor-pointer hover:bg-gray-100">
            <input
              type="checkbox"
              checked={checks[key as keyof typeof checks]}
              onChange={() => setChecks(prev => ({ ...prev, [key]: !prev[key as keyof typeof checks] }))}
              className="rounded border-gray-300"
            />
            {label}
          </label>
        ))}
      </div>
      <div className={clsx(
        'rounded-lg px-4 py-3 text-sm font-bold flex items-center gap-2',
        verdict === 'simple' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
      )}>
        {verdict === 'simple' ? (
          <><CheckCircle className="h-4 w-4" /> 간편청구 진행 가능 ({simpleCount}/4 충족)</>
        ) : (
          <><Clock className="h-4 w-4" /> 3년환급 서비스로 전환 권고 ({simpleCount}/4 충족)</>
        )}
      </div>
    </div>
  );
}

function Q3ScriptPanel() {
  const [scriptChecks, setScriptChecks] = React.useState<boolean[]>(Array(10).fill(false));
  const [docStatus, setDocStatus] = React.useState<Record<string, 'pending' | 'collected' | 'issue'>>({
    diagnosis: 'pending', receipt: 'pending', id_copy: 'pending', bankbook: 'pending', consent: 'pending',
  });
  const SCRIPT_ITEMS = [
    '본인 확인 완료', '질병/상해 경위 설명', '청구 대상 보험사 확인',
    '청구 가능 항목 안내', '예상 환급액 안내', '필요 서류 안내',
    '서류 제출 방법 안내', '수수료(10%) 안내', '개인정보 동의 획득', '향후 일정 안내',
  ];
  const DOC_ITEMS: [string, string][] = [
    ['diagnosis', '진단서'], ['receipt', '진료비 영수증'], ['id_copy', '신분증 사본'], ['bankbook', '통장 사본'], ['consent', '청구동의서'],
  ];
  const DOC_STATUS_STYLE = {
    pending: 'bg-gray-100 text-gray-500',
    collected: 'bg-emerald-50 text-emerald-700',
    issue: 'bg-rose-50 text-rose-700',
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-800">Q3. 청구콜 스크립트 & 서류 확보</h3>
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">스크립트 체크리스트 ({scriptChecks.filter(Boolean).length}/10)</p>
        <div className="grid grid-cols-2 gap-1.5">
          {SCRIPT_ITEMS.map((item, i) => (
            <label key={i} className="flex items-center gap-2 p-1.5 rounded text-xs cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={scriptChecks[i]}
                onChange={() => setScriptChecks(prev => prev.map((v, j) => j === i ? !v : v))}
                className="rounded border-gray-300 h-3.5 w-3.5"
              />
              <span className={scriptChecks[i] ? 'text-gray-700' : 'text-gray-400'}>{item}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">서류 확보 상태 ({Object.values(docStatus).filter(v => v === 'collected').length}/5)</p>
        <div className="space-y-1.5">
          {DOC_ITEMS.map(([key, label]) => (
            <div key={key} className="flex items-center justify-between p-2 rounded border border-gray-200">
              <span className="text-xs font-medium text-gray-700">{label}</span>
              <div className="flex gap-1">
                {(['pending', 'collected', 'issue'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setDocStatus(prev => ({ ...prev, [key]: st }))}
                    className={clsx(
                      'px-2 py-0.5 rounded text-[10px] font-bold border',
                      docStatus[key] === st ? DOC_STATUS_STYLE[st] + ' border-current' : 'bg-white text-gray-300 border-gray-200'
                    )}
                  >
                    {st === 'pending' ? '대기' : st === 'collected' ? '확보' : '문제'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Q4AnalysisPanel() {
  const MOCK_CROSS_DATA = [
    { item: '2025-11 정형외과 진료', hira: true, hometax: true, insurer: false, status: '미청구' },
    { item: '2025-09 치과 임플란트', hira: true, hometax: true, insurer: true, status: '청구완료' },
    { item: '2025-12 내과 입원(3일)', hira: true, hometax: false, insurer: false, status: '미청구' },
    { item: '2026-01 피부과 시술', hira: true, hometax: true, insurer: false, status: '미청구' },
    { item: '2026-02 한방병원 치료', hira: true, hometax: true, insurer: true, status: '청구완료' },
  ];
  const unclaimed = MOCK_CROSS_DATA.filter(d => d.status === '미청구');

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-800">Q4. 교차대조 정밀 분석</h3>
      <div className="text-xs text-gray-500 mb-1">심평원 / 홈텍스 / 보험사 데이터 교차 비교 (mock)</div>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500">진료 항목</th>
              <th className="px-3 py-2 text-center font-medium text-gray-500">심평원</th>
              <th className="px-3 py-2 text-center font-medium text-gray-500">홈텍스</th>
              <th className="px-3 py-2 text-center font-medium text-gray-500">보험사</th>
              <th className="px-3 py-2 text-center font-medium text-gray-500">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {MOCK_CROSS_DATA.map((row, i) => (
              <tr key={i} className={row.status === '미청구' ? 'bg-amber-50/50' : ''}>
                <td className="px-3 py-2 text-gray-700">{row.item}</td>
                {[row.hira, row.hometax, row.insurer].map((v, j) => (
                  <td key={j} className="px-3 py-2 text-center">
                    {v ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500 inline" /> : <Circle className="h-3.5 w-3.5 text-gray-300 inline" />}
                  </td>
                ))}
                <td className="px-3 py-2 text-center">
                  <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-bold',
                    row.status === '미청구' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  )}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
        <span className="font-bold">미청구 발굴: {unclaimed.length}건</span> — 추가 환급 가능 항목이 발견되었습니다.
      </div>
    </div>
  );
}

function Q5ConfirmPanel() {
  const [agreed, setAgreed] = React.useState(false);
  const RESULT_ITEMS = [
    { label: '실손보험 청구', amount: '450,000', insurer: '삼성화재' },
    { label: '상해보험 청구', amount: '120,000', insurer: '삼성화재' },
    { label: '미청구 발굴분', amount: '85,000', insurer: 'DB손해보험' },
  ];
  const total = RESULT_ITEMS.reduce((s, i) => s + parseInt(i.amount.replace(/,/g, '')), 0);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-800">Q5. 고객 안내 & 청구 확정</h3>
      <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
        {RESULT_ITEMS.map((item, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2">
            <div>
              <span className="text-xs font-medium text-gray-700">{item.label}</span>
              <span className="text-[10px] text-gray-400 ml-2">{item.insurer}</span>
            </div>
            <span className="text-xs font-bold text-gray-900">₩{item.amount}</span>
          </div>
        ))}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
          <span className="text-xs font-bold text-gray-700">예상 총 환급액</span>
          <span className="text-sm font-bold text-blue-700">₩{total.toLocaleString()}</span>
        </div>
      </div>
      <label className="flex items-start gap-2 p-3 rounded-lg border cursor-pointer hover:bg-gray-50"
        style={{ borderColor: agreed ? '#059669' : '#e5e7eb' }}>
        <input type="checkbox" checked={agreed} onChange={() => setAgreed(!agreed)} className="rounded border-gray-300 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-gray-700">고객 청구 확정 동의</p>
          <p className="text-[10px] text-gray-500 mt-0.5">분석 결과를 고객에게 안내하고, 청구 진행에 동의를 받았습니다.</p>
        </div>
      </label>
      {agreed && (
        <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
          <CheckCircle className="h-3.5 w-3.5" /> 동의 완료 — Q6 보험사 접수 진행 가능
        </div>
      )}
    </div>
  );
}

function Q6SubmitPanel() {
  const INSURERS = [
    { name: '삼성화재', status: 'submitted' as const, submittedAt: '2026-03-29 14:30' },
    { name: 'DB손해보험', status: 'pending' as const, submittedAt: null },
  ];
  const STATUS_MAP = {
    pending: { label: '접수 대기', style: 'bg-gray-100 text-gray-600' },
    submitted: { label: '접수 완료', style: 'bg-emerald-50 text-emerald-700' },
    rejected: { label: '반려', style: 'bg-rose-50 text-rose-700' },
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-800">Q6. 보험사 청구 접수</h3>
      <div className="space-y-2">
        {INSURERS.map((ins, i) => {
          const st = STATUS_MAP[ins.status];
          return (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
              <div>
                <p className="text-xs font-bold text-gray-700">{ins.name}</p>
                {ins.submittedAt && <p className="text-[10px] text-gray-400 mt-0.5">{ins.submittedAt}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className={clsx('px-2 py-0.5 rounded text-[10px] font-bold', st.style)}>{st.label}</span>
                {ins.status === 'pending' && (
                  <button className="px-2 py-1 text-[10px] font-bold bg-blue-600 text-white rounded hover:bg-blue-700">접수</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-medium text-gray-500 mb-1">청구서 미리보기</p>
        <div className="h-20 flex items-center justify-center border border-dashed border-gray-300 rounded text-xs text-gray-400">
          <FileText className="h-4 w-4 mr-1" /> 청구서 자동 생성 (PDF)
        </div>
      </div>
    </div>
  );
}

type DefenseStatus = 'none' | 'reduced' | 'denied';
type DefenseAction = 'pending' | 'objection_filed' | 'escalated' | 'resolved';
type CustomerNotifyStatus = 'not_sent' | 'sent' | 'confirmed';

interface PaymentDefenseRecord {
  insurer: string;
  claimAmount: string;
  paidAmount: string;
  defenseStatus: DefenseStatus;
  reason: string;
  defenseAction: DefenseAction;
}

function Q7TrackingPanel({ submittedDate }: { submittedDate: string }) {
  const submitted = new Date(submittedDate);
  const now = new Date();
  const daysSince = Math.floor((now.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24));
  const CHECKPOINTS = [
    { day: 0, label: '접수일', done: true },
    { day: 3, label: 'D+3 확인', done: daysSince >= 3 },
    { day: 5, label: 'D+5 독촉', done: daysSince >= 5 },
    { day: 7, label: 'D+7 에스컬레이션', done: daysSince >= 7 },
    { day: 14, label: '지급 완료 목표', done: false },
  ];

  // 감액/부지급 방어 상태
  const [defenseRecords, setDefenseRecords] = React.useState<PaymentDefenseRecord[]>([
    { insurer: '삼성화재', claimAmount: '450,000', paidAmount: '320,000', defenseStatus: 'reduced', reason: '비급여 항목 제외', defenseAction: 'pending' },
    { insurer: 'DB손해보험', claimAmount: '85,000', paidAmount: '0', defenseStatus: 'denied', reason: '면책기간 해당', defenseAction: 'pending' },
  ]);

  // 지급결과 고객 안내 상태
  const [customerNotify, setCustomerNotify] = React.useState<CustomerNotifyStatus>('not_sent');

  const DEFENSE_STATUS_CONFIG = {
    none: { label: '정상지급', style: 'bg-emerald-50 text-emerald-700' },
    reduced: { label: '감액', style: 'bg-amber-50 text-amber-700' },
    denied: { label: '부지급', style: 'bg-rose-50 text-rose-700' },
  };

  const DEFENSE_ACTION_CONFIG = {
    pending: { label: '대기', style: 'bg-gray-100 text-gray-600' },
    objection_filed: { label: '이의제기', style: 'bg-blue-50 text-blue-700' },
    escalated: { label: '에스컬레이션', style: 'bg-violet-50 text-violet-700' },
    resolved: { label: '해결', style: 'bg-emerald-50 text-emerald-700' },
  };

  const handleDefenseAction = (idx: number, action: DefenseAction) => {
    setDefenseRecords(prev => prev.map((r, i) => i === idx ? { ...r, defenseAction: action } : r));
  };

  const hasDefenseIssues = defenseRecords.some(r => r.defenseStatus !== 'none');
  const totalClaimed = defenseRecords.reduce((s, r) => s + parseInt(r.claimAmount.replace(/,/g, '')), 0);
  const totalPaid = defenseRecords.reduce((s, r) => s + parseInt(r.paidAmount.replace(/,/g, '')), 0);
  const defenseRate = totalClaimed > 0 ? Math.round((totalPaid / totalClaimed) * 100) : 0;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-800">Q7. 지급 추적 & 결과 안내</h3>
      <div className="flex items-center gap-1 text-xs text-gray-500">
        접수일: {submittedDate} · 경과: <span className={clsx('font-bold', daysSince >= 7 ? 'text-rose-600' : daysSince >= 5 ? 'text-amber-600' : 'text-blue-600')}>D+{daysSince}</span>
      </div>

      {/* 타임라인 */}
      <div className="relative">
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
        <div className="space-y-3">
          {CHECKPOINTS.map((cp, i) => (
            <div key={i} className="flex items-start gap-3 relative">
              <div className={clsx(
                'relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2',
                cp.done ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                  : daysSince >= cp.day - 1 && !cp.done ? 'bg-amber-100 border-amber-500 text-amber-700 animate-pulse'
                  : 'bg-white border-gray-300 text-gray-400'
              )}>
                {cp.done ? '✓' : cp.day}
              </div>
              <div className="pt-0.5">
                <p className={clsx('text-xs font-medium', cp.done ? 'text-gray-700' : 'text-gray-400')}>{cp.label}</p>
                {cp.done && !CHECKPOINTS[i + 1]?.done && i < CHECKPOINTS.length - 1 && (
                  <p className="text-[10px] text-blue-600 font-bold mt-0.5">← 현재 단계</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {daysSince >= 7 && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-xs text-rose-700 font-bold">
          D+7 초과 — 보험사 직접 문의 또는 감액/부지급 방어 대응이 필요합니다.
        </div>
      )}

      {/* 감액/부지급 방어 대응 */}
      {hasDefenseIssues && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-700 flex items-center gap-1">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
            감액/부지급 방어 대응
          </p>
          <div className="space-y-2">
            {defenseRecords.filter(r => r.defenseStatus !== 'none').map((record, idx) => {
              const dsCfg = DEFENSE_STATUS_CONFIG[record.defenseStatus];
              const daCfg = DEFENSE_ACTION_CONFIG[record.defenseAction];
              return (
                <div key={idx} className="rounded-lg border border-gray-200 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-700">{record.insurer}</span>
                      <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-bold', dsCfg.style)}>{dsCfg.label}</span>
                    </div>
                    <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-bold', daCfg.style)}>{daCfg.label}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div>
                      <span className="text-gray-500">청구액</span>
                      <p className="font-bold text-gray-700">₩{record.claimAmount}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">지급액</span>
                      <p className={clsx('font-bold', record.defenseStatus === 'denied' ? 'text-rose-600' : 'text-amber-600')}>₩{record.paidAmount}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">사유</span>
                      <p className="font-medium text-gray-700">{record.reason}</p>
                    </div>
                  </div>
                  {record.defenseAction === 'pending' && (
                    <div className="flex gap-1.5 pt-1">
                      <button
                        onClick={() => handleDefenseAction(idx, 'objection_filed')}
                        className="flex-1 py-1.5 text-[10px] font-bold bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        이의제기 접수
                      </button>
                      <button
                        onClick={() => handleDefenseAction(idx, 'escalated')}
                        className="flex-1 py-1.5 text-[10px] font-bold bg-violet-600 text-white rounded hover:bg-violet-700"
                      >
                        팀장 에스컬레이션
                      </button>
                    </div>
                  )}
                  {record.defenseAction === 'objection_filed' && (
                    <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1.5 text-[10px] text-blue-700">
                      이의제기 접수 완료 — 보험사 검토 대기 중 (평균 3~5영업일)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-2 flex items-center justify-between text-xs">
            <span className="text-gray-600">지급 인정률</span>
            <span className={clsx('font-bold', defenseRate >= 80 ? 'text-emerald-600' : defenseRate >= 50 ? 'text-amber-600' : 'text-rose-600')}>
              {defenseRate}% (₩{totalPaid.toLocaleString()} / ₩{totalClaimed.toLocaleString()})
            </span>
          </div>
        </div>
      )}

      {/* 지급결과 고객 안내 */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-gray-700 flex items-center gap-1">
          <Send className="h-3.5 w-3.5 text-teal-500" />
          지급결과 고객 안내
        </p>
        <div className="rounded-lg border border-gray-200 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-50 rounded p-2">
              <span className="text-gray-500 text-[10px]">총 청구액</span>
              <p className="font-bold text-gray-800">₩{totalClaimed.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <span className="text-gray-500 text-[10px]">실 지급액</span>
              <p className={clsx('font-bold', totalPaid >= totalClaimed ? 'text-emerald-600' : 'text-amber-600')}>₩{totalPaid.toLocaleString()}</p>
            </div>
          </div>
          {hasDefenseIssues && (
            <p className="text-[10px] text-amber-600 bg-amber-50 rounded px-2 py-1">
              일부 항목이 감액/부지급 처리되었습니다. 이의제기 진행 여부를 고객에게 안내해주세요.
            </p>
          )}
          <div className="flex items-center gap-2">
            {customerNotify === 'not_sent' ? (
              <button
                onClick={() => setCustomerNotify('sent')}
                className="flex-1 py-2 text-xs font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center justify-center gap-1"
              >
                <Send className="h-3.5 w-3.5" /> 고객에게 지급결과 안내 발송
              </button>
            ) : customerNotify === 'sent' ? (
              <div className="flex-1 flex items-center justify-between">
                <span className="text-xs text-blue-600 font-bold flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> 안내 발송됨 — 고객 확인 대기
                </span>
                <button
                  onClick={() => setCustomerNotify('confirmed')}
                  className="px-3 py-1 text-[10px] font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700"
                >
                  확인 완료
                </button>
              </div>
            ) : (
              <span className="flex-1 text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" /> 고객 확인 완료 — Q8 보장공백 탐지로 진행 가능
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Q8 보장 공백 탐지 패널 ──

interface CoverageGapItem {
  category: string;
  currentCoverage: string;
  recommendedCoverage: string;
  gapAmount: string;
  severity: 'high' | 'medium' | 'low';
  linkedToRefund: boolean;
}

function Q8GapDetectionPanel() {
  const [gaps] = React.useState<CoverageGapItem[]>([
    { category: '실손의료비', currentCoverage: '3,000만', recommendedCoverage: '1억', gapAmount: '7,000만', severity: 'high', linkedToRefund: false },
    { category: '암진단비', currentCoverage: '1,000만', recommendedCoverage: '5,000만', gapAmount: '4,000만', severity: 'high', linkedToRefund: false },
    { category: '뇌혈관질환', currentCoverage: '0', recommendedCoverage: '3,000만', gapAmount: '3,000만', severity: 'high', linkedToRefund: false },
    { category: '상해후유장해', currentCoverage: '5,000만', recommendedCoverage: '1억', gapAmount: '5,000만', severity: 'medium', linkedToRefund: false },
    { category: '일상생활배상', currentCoverage: '1억', recommendedCoverage: '1억', gapAmount: '0', severity: 'low', linkedToRefund: false },
  ]);

  const [linkedIds, setLinkedIds] = React.useState<Set<number>>(new Set());
  const gapsFound = gaps.filter(g => g.gapAmount !== '0');
  const linkedCount = linkedIds.size;

  const SEVERITY_STYLE = {
    high: { label: '심각', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    medium: { label: '주의', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    low: { label: '양호', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  };

  const handleLink = (idx: number) => {
    setLinkedIds(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-rose-500" />
        Q8. 보장 공백 탐지
      </h3>

      {/* 보장공백 분석 테이블 */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500">보장 항목</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500">현재 보장</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500">권장 보장</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500">공백</th>
              <th className="px-3 py-2 text-center font-medium text-gray-500">위험도</th>
              <th className="px-3 py-2 text-center font-medium text-gray-500">3년환급 연계</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {gaps.map((gap, i) => {
              const sev = SEVERITY_STYLE[gap.severity];
              const isLinked = linkedIds.has(i);
              return (
                <tr key={i} className={gap.gapAmount !== '0' ? 'bg-rose-50/30' : ''}>
                  <td className="px-3 py-2 font-medium text-gray-700">{gap.category}</td>
                  <td className="px-3 py-2 text-right text-gray-600">₩{gap.currentCoverage}</td>
                  <td className="px-3 py-2 text-right text-gray-600">₩{gap.recommendedCoverage}</td>
                  <td className="px-3 py-2 text-right font-bold text-gray-900">
                    {gap.gapAmount === '0' ? '-' : `₩${gap.gapAmount}`}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-bold', sev.bg, sev.text)}>
                      {sev.label}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {gap.gapAmount !== '0' ? (
                      <button
                        onClick={() => handleLink(i)}
                        className={clsx(
                          'px-2 py-0.5 rounded text-[10px] font-bold border transition-colors',
                          isLinked
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
                        )}
                      >
                        {isLinked ? '연계됨' : '연계'}
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-300">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3년환급 연계 안내 */}
      {linkedCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-start gap-3">
          <Link className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-blue-700">3년환급 서비스 연계 ({linkedCount}건)</p>
            <p className="text-[10px] text-blue-600 mt-0.5">
              보장 공백이 발견된 항목을 3년환급 서비스로 연계합니다. 고객에게 보장 강화 안내 후 환급 여정(S1)으로 전환됩니다.
            </p>
            <button className="mt-2 px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded hover:bg-blue-700 flex items-center gap-1">
              <ArrowRight className="h-3 w-3" /> 3년환급 여정 전환 요청
            </button>
          </div>
        </div>
      )}

      {/* 보장공백 KPI */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-[10px] text-gray-500">공백 발견율</p>
          <p className="text-lg font-bold text-rose-600">{Math.round((gapsFound.length / gaps.length) * 100)}%</p>
          <p className="text-[10px] text-gray-400">{gapsFound.length}/{gaps.length}개 항목</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-[10px] text-gray-500">3년환급 연계율</p>
          <p className="text-lg font-bold text-blue-600">{gapsFound.length > 0 ? Math.round((linkedCount / gapsFound.length) * 100) : 0}%</p>
          <p className="text-[10px] text-gray-400">{linkedCount}/{gapsFound.length}건 연계</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-[10px] text-gray-500">심각 공백</p>
          <p className="text-lg font-bold text-amber-600">{gaps.filter(g => g.severity === 'high' && g.gapAmount !== '0').length}</p>
          <p className="text-[10px] text-gray-400">즉시 보강 필요</p>
        </div>
      </div>
    </div>
  );
}

// ── Q9 리텐션/가족/소개 확장 패널 ──

interface RetentionAction {
  id: string;
  type: 'referral' | 'family' | 'retention';
  label: string;
  target: string;
  status: 'pending' | 'sent' | 'completed' | 'declined';
  dueDate: string;
  autoGenerated: boolean;
}

function Q9RetentionPanel() {
  const [actions, setActions] = React.useState<RetentionAction[]>([
    { id: 'RA-01', type: 'referral', label: '지인 소개 제안', target: '강다연 → 지인', status: 'pending', dueDate: '2026-04-02', autoGenerated: true },
    { id: 'RA-02', type: 'family', label: '배우자 가족연동 제안', target: '강다연 → 배우자(강현우)', status: 'sent', dueDate: '2026-04-01', autoGenerated: true },
    { id: 'RA-03', type: 'family', label: '부모 가족연동 제안', target: '강다연 → 어머니(박미숙)', status: 'pending', dueDate: '2026-04-03', autoGenerated: true },
    { id: 'RA-04', type: 'retention', label: '만족도 조사 발송', target: '강다연', status: 'completed', dueDate: '2026-03-30', autoGenerated: true },
    { id: 'RA-05', type: 'retention', label: '재청구 안내 알림', target: '강다연', status: 'pending', dueDate: '2026-06-30', autoGenerated: true },
  ]);

  const [showAddReferral, setShowAddReferral] = React.useState(false);

  const ACTION_TYPE_CONFIG = {
    referral: { icon: Users, label: '소개', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
    family: { icon: Heart, label: '가족', color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200' },
    retention: { icon: RefreshCw, label: '리텐션', color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
  };

  const ACTION_STATUS_CONFIG = {
    pending: { label: '대기', style: 'bg-gray-100 text-gray-600' },
    sent: { label: '발송됨', style: 'bg-blue-50 text-blue-700' },
    completed: { label: '완료', style: 'bg-emerald-50 text-emerald-700' },
    declined: { label: '거절', style: 'bg-rose-50 text-rose-700' },
  };

  const handleStatusChange = (id: string, newStatus: RetentionAction['status']) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  // KPI 계산
  const referralActions = actions.filter(a => a.type === 'referral');
  const familyActions = actions.filter(a => a.type === 'family');
  const referralCompleted = referralActions.filter(a => a.status === 'completed').length;
  const familyCompleted = familyActions.filter(a => a.status === 'completed' || a.status === 'sent').length;
  const autoGenerated = actions.filter(a => a.autoGenerated).length;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-teal-500" />
        Q9. 리텐션 / 가족 / 소개 확장
      </h3>

      {/* 소개 제안 섹션 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-600 flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> 소개 제안
          </p>
          <button
            onClick={() => setShowAddReferral(!showAddReferral)}
            className="px-2 py-0.5 text-[10px] font-bold text-violet-600 border border-violet-300 rounded hover:bg-violet-50"
          >
            + 수동 추가
          </button>
        </div>
        {showAddReferral && (
          <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="소개 대상자 이름" className="px-2 py-1.5 text-xs border border-gray-300 rounded" />
              <input placeholder="연락처" className="px-2 py-1.5 text-xs border border-gray-300 rounded" />
            </div>
            <select className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded">
              <option value="">관계 선택</option>
              <option value="friend">지인</option>
              <option value="colleague">직장동료</option>
              <option value="neighbor">이웃</option>
            </select>
            <button className="w-full py-1.5 text-[10px] font-bold bg-violet-600 text-white rounded hover:bg-violet-700">
              소개 제안 등록
            </button>
          </div>
        )}
      </div>

      {/* 가족 연동 제안 섹션 */}
      <div>
        <p className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-2">
          <Heart className="h-3.5 w-3.5" /> 가족 연동 제안
        </p>
        <div className="rounded-lg border border-pink-200 bg-pink-50/30 p-3">
          <div className="flex items-center gap-3 text-xs text-gray-700">
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-pink-200 flex items-center justify-center text-[10px] font-bold text-pink-700 border-2 border-white">본</div>
              <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center text-[10px] font-bold text-pink-600 border-2 border-white">배</div>
              <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center text-[10px] font-bold text-pink-600 border-2 border-white">모</div>
            </div>
            <div>
              <p className="font-medium">가족 그룹: 3명 (본인 + 배우자 + 어머니)</p>
              <p className="text-[10px] text-gray-500">연동 완료 시 가족 전체 보장 분석 가능</p>
            </div>
          </div>
        </div>
      </div>

      {/* 리텐션 액션 목록 (자동 생성) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-600 flex items-center gap-1">
            <Bell className="h-3.5 w-3.5" /> 리텐션 액션 ({autoGenerated}건 자동 생성)
          </p>
        </div>
        <div className="space-y-1.5">
          {actions.map(action => {
            const typeCfg = ACTION_TYPE_CONFIG[action.type];
            const statusCfg = ACTION_STATUS_CONFIG[action.status];
            const TypeIcon = typeCfg.icon;
            return (
              <div key={action.id} className={clsx('flex items-center justify-between p-2.5 rounded-lg border', typeCfg.border, typeCfg.bg + '/30')}>
                <div className="flex items-center gap-2 min-w-0">
                  <TypeIcon className={clsx('h-3.5 w-3.5 flex-shrink-0', typeCfg.color)} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{action.label}</p>
                    <p className="text-[10px] text-gray-500 truncate">{action.target} · {action.dueDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {action.autoGenerated && (
                    <span className="text-[9px] text-gray-400 border border-gray-200 rounded px-1">자동</span>
                  )}
                  <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-bold', statusCfg.style)}>
                    {statusCfg.label}
                  </span>
                  {action.status === 'pending' && (
                    <button
                      onClick={() => handleStatusChange(action.id, 'sent')}
                      className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      발송
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-[10px] text-gray-500">소개 생성률</p>
          <p className="text-lg font-bold text-violet-600">
            {referralActions.length > 0 ? Math.round((referralCompleted / referralActions.length) * 100) : 0}%
          </p>
          <p className="text-[10px] text-gray-400">{referralCompleted}/{referralActions.length}건</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-[10px] text-gray-500">가족 연동률</p>
          <p className="text-lg font-bold text-pink-600">
            {familyActions.length > 0 ? Math.round((familyCompleted / familyActions.length) * 100) : 0}%
          </p>
          <p className="text-[10px] text-gray-400">{familyCompleted}/{familyActions.length}건</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-[10px] text-gray-500">자동 생성 액션</p>
          <p className="text-lg font-bold text-teal-600">{autoGenerated}</p>
          <p className="text-[10px] text-gray-400">리텐션 자동화</p>
        </div>
      </div>
    </div>
  );
}

/** 현재 스텝에 맞는 상세 패널 렌더링 */
function StepDetailPanel({ step, submittedDate }: { step: string; submittedDate: string }) {
  switch (step) {
    case 'Q2': return <Q2BranchPanel />;
    case 'Q3': return <Q3ScriptPanel />;
    case 'Q4': return <Q4AnalysisPanel />;
    case 'Q5': return <Q5ConfirmPanel />;
    case 'Q6': return <Q6SubmitPanel />;
    case 'Q7': return <Q7TrackingPanel submittedDate={submittedDate} />;
    case 'Q8': return <Q8GapDetectionPanel />;
    case 'Q9': return <Q9RetentionPanel />;
    default: return <p className="text-xs text-gray-400 py-4 text-center">이 단계의 상세 화면은 준비 중입니다.</p>;
  }
}

interface SimpleClaimRecord {
  id: string;
  requestId: string;
  customerName: string;
  insuranceCompany: string;
  claimType: string;
  amount: string;
  currentStep: string;
  submittedDate: string;
  status: 'processing' | 'completed' | 'rejected';
}

const MOCK_SIMPLE_CLAIMS: SimpleClaimRecord[] = [
  {
    id: 'SC-001',
    requestId: 'R-2026-Q01',
    customerName: '강다연',
    insuranceCompany: '삼성화재',
    claimType: '실손보험',
    amount: '450,000',
    currentStep: 'Q7',
    submittedDate: '2026-03-28',
    status: 'processing',
  },
  {
    id: 'SC-002',
    requestId: 'R-2026-Q02',
    customerName: '윤서준',
    insuranceCompany: 'DB손해보험',
    claimType: '실손보험',
    amount: '1,200,000',
    currentStep: 'Q9',
    submittedDate: '2026-03-25',
    status: 'completed',
  },
  {
    id: 'SC-003',
    requestId: 'R-2026-Q03',
    customerName: '임지우',
    insuranceCompany: '현대해상',
    claimType: '상해보험',
    amount: '850,000',
    currentStep: 'Q4',
    submittedDate: '2026-03-30',
    status: 'processing',
  },
  {
    id: 'SC-004',
    requestId: 'R-2026-Q04',
    customerName: '배수민',
    insuranceCompany: 'KB손해보험',
    claimType: '실손보험',
    amount: '320,000',
    currentStep: 'Q5',
    submittedDate: '2026-03-29',
    status: 'processing',
  },
  {
    id: 'SC-005',
    requestId: 'R-2026-Q05',
    customerName: '조은별',
    insuranceCompany: '한화손해보험',
    claimType: '실손보험',
    amount: '180,000',
    currentStep: 'Q8',
    submittedDate: '2026-03-26',
    status: 'rejected',
  },
];

const RECORD_STATUS_CONFIG = {
  processing: { label: '처리 중', color: 'text-blue-700', bg: 'bg-blue-50' },
  completed: { label: '완료', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  rejected: { label: '반려', color: 'text-red-700', bg: 'bg-red-50' },
};

function StepIndicator({ step, currentStepId }: { step: SimpleClaimStepUI; currentStepId: string }) {
  const stepIndex = SIMPLE_CLAIM_STEPS.findIndex((s) => s.id === step.id);
  const currentIndex = SIMPLE_CLAIM_STEPS.findIndex((s) => s.id === currentStepId);

  let status: ClaimStatus = 'pending';
  if (stepIndex < currentIndex) status = 'completed';
  else if (stepIndex === currentIndex) status = 'current';

  const Icon = step.icon;

  return (
    <div className="flex flex-col items-center">
      <div
        className={clsx(
          'flex h-10 w-10 items-center justify-center rounded-full',
          status === 'completed' && 'bg-emerald-100',
          status === 'current' && 'bg-blue-100 ring-2 ring-blue-500',
          status === 'pending' && 'bg-gray-100'
        )}
      >
        {status === 'completed' ? (
          <CheckCircle className="h-5 w-5 text-emerald-600" />
        ) : (
          <Icon
            className={clsx(
              'h-5 w-5',
              status === 'current' ? 'text-blue-600' : 'text-gray-400'
            )}
          />
        )}
      </div>
      <p
        className={clsx(
          'mt-1 text-xs font-medium',
          status === 'completed' && 'text-emerald-600',
          status === 'current' && 'text-blue-600',
          status === 'pending' && 'text-gray-400'
        )}
      >
        {step.id}
      </p>
      <p className="text-xs text-gray-500 text-center max-w-[80px]">{step.label}</p>
    </div>
  );
}

export function SimpleClaimWorkflow() {
  const [selectedClaim, setSelectedClaim] = React.useState<string | null>(MOCK_SIMPLE_CLAIMS[0]?.id ?? null);
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'processing' | 'completed' | 'rejected'>('all');

  const selected = MOCK_SIMPLE_CLAIMS.find((c) => c.id === selectedClaim);
  const filtered = MOCK_SIMPLE_CLAIMS.filter(
    (c) => statusFilter === 'all' || c.status === statusFilter
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">간편청구 워크플로우</h1>
        <p className="mt-1 text-sm text-gray-500">
          Q1-Q9 · 간편청구 전용 스테퍼, 실시간 진행 현황
        </p>
      </div>

      {/* Stepper for selected claim */}
      {selected && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              {selected.customerName} ({selected.requestId})
            </h2>
            <span className={clsx('rounded-full px-2 py-1 text-xs font-medium', RECORD_STATUS_CONFIG[selected.status].bg, RECORD_STATUS_CONFIG[selected.status].color)}>
              {RECORD_STATUS_CONFIG[selected.status].label}
            </span>
          </div>
          <div className="flex items-start justify-between">
            {SIMPLE_CLAIM_STEPS.map((step, i) => (
              <React.Fragment key={step.id}>
                <StepIndicator step={step} currentStepId={selected.currentStep} />
                {i < SIMPLE_CLAIM_STEPS.length - 1 && (
                  <div className="mt-5 flex-1 border-t border-dashed border-gray-300 mx-1" />
                )}
              </React.Fragment>
            ))}
          </div>
          {/* Step Detail Panel */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <StepDetailPanel step={selected.currentStep} submittedDate={selected.submittedDate} />
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white p-1 w-fit">
        <Filter className="ml-2 h-4 w-4 text-gray-400" />
        {(['all', 'processing', 'completed', 'rejected'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={clsx(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              statusFilter === s
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            {s === 'all' ? '전체' : RECORD_STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['요청번호', '고객명', '보험사', '청구유형', '금액', '현재 단계', '신청일', '상태'].map(
                (h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((c) => {
              const stCfg = RECORD_STATUS_CONFIG[c.status];
              const stepLabel = SIMPLE_CLAIM_STEPS.find((s) => s.id === c.currentStep)?.label ?? c.currentStep;
              return (
                <tr
                  key={c.id}
                  onClick={() => setSelectedClaim(c.id)}
                  className={clsx(
                    'cursor-pointer hover:bg-gray-50',
                    selectedClaim === c.id && 'bg-blue-50'
                  )}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{c.requestId}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{c.customerName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{c.insuranceCompany}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{c.claimType}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">₩{c.amount}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {c.currentStep} - {stepLabel}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{c.submittedDate}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={clsx('rounded-full px-2 py-1 text-xs font-medium', stCfg.bg, stCfg.color)}>
                      {stCfg.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
