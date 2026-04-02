import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Clipboard, FileText, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { ScriptTopicItem, type ReferenceData } from './ScriptTopicItem';
import {
  COVERAGE_SCRIPT_TOPICS,
  COVERAGE_TOPIC_REFERENCES,
  HIRA_SCRIPT_TOPICS,
  HIRA_TOPIC_REFERENCES,
  MOCK_HIRA_DISEASE_RECORDS,
} from './mockScriptTemplates';
import {
  MOCK_CONTRACTS,
  MOCK_COVERAGE_ITEMS,
  MOCK_GAP_FLAGS,
} from './mockInsuranceAnalysis';

interface TopicState {
  isActive: boolean;
  text: string;
}

function formatReferenceForScript(referenceData?: ReferenceData) {
  if (!referenceData || referenceData.type !== 'coverage') return '';

  const lines: string[] = [`참조 요약: ${referenceData.summary}`];

  if (referenceData.coverageItems?.length) {
    referenceData.coverageItems.slice(0, 3).forEach((item) => {
      lines.push(
        `- ${item.insurer} / ${item.coverageName} / ${item.amount >= 10000 ? `${(item.amount / 10000).toFixed(0)}억` : `${item.amount}만`}원 / ${
          item.isRenewal ? '갱신형' : '비갱신형'
        }`,
      );
    });
  }

  if (referenceData.gapDetail) {
    lines.push(`- 갭 분석: ${referenceData.gapDetail}`);
  }

  if (referenceData.gapRecommendation) {
    lines.push(`- 제안 포인트: ${referenceData.gapRecommendation}`);
  }

  return lines.join('\n');
}

function composeCoverageBlock(label: string, state: TopicState | undefined, defaultText: string, referenceData?: ReferenceData) {
  if (!state?.isActive) return null;

  const referenceText = formatReferenceForScript(referenceData);
  const scriptText = state.text.trim() || defaultText.trim();
  const body = [referenceText, scriptText].filter(Boolean).join('\n\n');

  return body ? `【${label}】\n${body}` : null;
}

function buildHiraReference(topicId: string): ReferenceData | undefined {
  const ref = HIRA_TOPIC_REFERENCES[topicId];
  if (!ref || ref.records.length === 0) return undefined;
  return {
    type: 'hira',
    summary: ref.summary,
    hiraRecords: ref.records,
  };
}

function buildCoverageReference(topicId: string): ReferenceData | undefined {
  const ref = COVERAGE_TOPIC_REFERENCES[topicId];
  if (!ref) return undefined;

  const gapFlag = MOCK_GAP_FLAGS.find((flag) => flag.id === ref.gapFlagId);
  const coverageItems = MOCK_COVERAGE_ITEMS.filter((item) => ref.relatedCoverageNames.includes(item.coverageName)).map((item) => {
    const contract = MOCK_CONTRACTS.find((value) => value.id === item.contractId);
    return {
      coverageName: item.coverageName,
      insurer: contract?.insurer || '',
      amount: item.amount,
      category: item.category,
      isRenewal: item.isRenewal,
    };
  });

  return {
    type: 'coverage',
    summary: ref.summary,
    coverageItems,
    gapDetected: gapFlag?.detected,
    gapSeverity: gapFlag?.severity,
    gapDetail: gapFlag?.detail,
    gapRecommendation: gapFlag?.recommendation,
  };
}

function buildDiseaseReference(code: string, name: string, visitCount: number, lastVisitDate: string): ReferenceData {
  const allRecords = Object.values(HIRA_TOPIC_REFERENCES)
    .flatMap((topic) => topic.records)
    .filter((record) => record.diseaseCode === code);

  return {
    type: 'hira',
    summary: `${name}(${code}) / 총 ${visitCount}회 진료 / 최종: ${lastVisitDate}`,
    hiraRecords:
      allRecords.length > 0
        ? allRecords
        : [
            {
              date: lastVisitDate,
              hospital: '-',
              department: '-',
              diagnosis: name,
              diseaseCode: code,
              treatmentType: '외래',
              details: `총 ${visitCount}회 진료`,
            },
          ],
  };
}

export function SalesScriptTab() {
  const [coverageStates, setCoverageStates] = useState<Record<string, TopicState>>(() => {
    const initial: Record<string, TopicState> = {};
    COVERAGE_SCRIPT_TOPICS.forEach((topic) => {
      initial[topic.id] = { isActive: false, text: '' };
    });
    return initial;
  });
  const [expandedSections, setExpandedSections] = useState({
    hira: true,
    disease: true,
    coverage: true,
    preview: true,
  });
  const [copied, setCopied] = useState(false);

  const hiraReferences = useMemo(() => {
    const refs: Record<string, ReferenceData | undefined> = {};
    HIRA_SCRIPT_TOPICS.forEach((topic) => {
      refs[topic.id] = buildHiraReference(topic.id);
    });
    return refs;
  }, []);

  const diseaseReferences = useMemo(() => {
    const refs: Record<string, ReferenceData> = {};
    MOCK_HIRA_DISEASE_RECORDS.forEach((record) => {
      refs[record.code] = buildDiseaseReference(record.code, record.name, record.visitCount, record.lastVisitDate);
    });
    return refs;
  }, []);

  const coverageReferences = useMemo(() => {
    const refs: Record<string, ReferenceData | undefined> = {};
    COVERAGE_SCRIPT_TOPICS.forEach((topic) => {
      refs[topic.id] = buildCoverageReference(topic.id);
    });
    return refs;
  }, []);

  const composedScript = useMemo(() => {
    const parts: string[] = [];

    COVERAGE_SCRIPT_TOPICS.forEach((topic) => {
      const block = composeCoverageBlock(topic.label, coverageStates[topic.id], topic.defaultText, coverageReferences[topic.id]);
      if (block) parts.push(block);
    });

    return parts.join('\n\n---\n\n');
  }, [coverageReferences, coverageStates]);

  const activeCount = Object.values(coverageStates).filter((state) => state.isActive).length;

  const handleCopyAll = () => {
    navigator.clipboard.writeText(composedScript);
    setCopied(true);
    toast.success('보장분석 스크립트가 복사되었습니다.');
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-blue-600" />
            <span className="font-bold text-sm text-slate-800">영업 스크립트</span>
          </div>
          <span className="text-xs text-slate-400">|</span>
          <span className="text-xs text-slate-500">
            보장분석 활성 토픽 <span className="font-bold text-blue-600">{activeCount}</span>개
          </span>
        </div>
      </div>

      <SectionHeader
        icon={<FileText size={16} />}
        title="A. 심평원 진료내역 기반"
        subtitle={`${HIRA_SCRIPT_TOPICS.length}개 토픽`}
        expanded={expandedSections.hira}
        onToggle={() => setExpandedSections((prev) => ({ ...prev, hira: !prev.hira }))}
      />
      {expandedSections.hira && (
        <div className="space-y-2">
          {HIRA_SCRIPT_TOPICS.map((topic) => (
            <ScriptTopicItem
              key={topic.id}
              label={topic.label}
              source="hira"
              isActive
              defaultExpanded
              text=""
              defaultText={topic.defaultText}
              savedVersions={[]}
              referenceData={hiraReferences[topic.id]}
              onToggle={() => {}}
              onChange={() => {}}
              onLoadTemplate={() => {}}
            />
          ))}
        </div>
      )}

      <SectionHeader
        icon={<FileText size={16} />}
        title="심평원 상병코드별 보기"
        subtitle={`${MOCK_HIRA_DISEASE_RECORDS.length}개 상병코드`}
        expanded={expandedSections.disease}
        onToggle={() => setExpandedSections((prev) => ({ ...prev, disease: !prev.disease }))}
      />
      {expandedSections.disease && (
        <div className="space-y-2">
          {MOCK_HIRA_DISEASE_RECORDS.map((record) => (
            <ScriptTopicItem
              key={record.code}
              label={`${record.code} - ${record.name} (${record.visitCount}회)`}
              source="hira"
              isActive
              defaultExpanded
              text=""
              defaultText={record.scriptTemplate}
              savedVersions={[]}
              referenceData={diseaseReferences[record.code]}
              onToggle={() => {}}
              onChange={() => {}}
              onLoadTemplate={() => {}}
            />
          ))}
        </div>
      )}

      <SectionHeader
        icon={<Shield size={16} />}
        title="B. 보장분석 기반"
        subtitle={`${COVERAGE_SCRIPT_TOPICS.length}개 토픽`}
        expanded={expandedSections.coverage}
        onToggle={() => setExpandedSections((prev) => ({ ...prev, coverage: !prev.coverage }))}
      />
      {expandedSections.coverage && (
        <div className="space-y-2">
          {COVERAGE_SCRIPT_TOPICS.map((topic) => (
            <ScriptTopicItem
              key={topic.id}
              label={topic.label}
              source="coverage"
              isActive={coverageStates[topic.id]?.isActive ?? false}
              defaultExpanded={Boolean(coverageReferences[topic.id])}
              text={coverageStates[topic.id]?.text ?? ''}
              defaultText={topic.defaultText}
              savedVersions={topic.savedVersions}
              referenceData={coverageReferences[topic.id]}
              onToggle={() =>
                setCoverageStates((prev) => ({
                  ...prev,
                  [topic.id]: { ...prev[topic.id], isActive: !prev[topic.id].isActive },
                }))
              }
              onChange={(text) =>
                setCoverageStates((prev) => ({
                  ...prev,
                  [topic.id]: { ...prev[topic.id], text },
                }))
              }
              onLoadTemplate={(text) =>
                setCoverageStates((prev) => ({
                  ...prev,
                  [topic.id]: { ...prev[topic.id], text, isActive: true },
                }))
              }
            />
          ))}
        </div>
      )}

      <SectionHeader
        icon={<Clipboard size={16} />}
        title="보장분석 스크립트 미리보기"
        subtitle={composedScript ? `${composedScript.length}자` : '작성된 스크립트 없음'}
        expanded={expandedSections.preview}
        onToggle={() => setExpandedSections((prev) => ({ ...prev, preview: !prev.preview }))}
      />
      {expandedSections.preview && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {composedScript ? (
            <>
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={handleCopyAll}
                  className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <Clipboard size={12} />
                  {copied ? '복사됨' : '전체 복사'}
                </button>
              </div>
              <div className="p-5">
                <pre className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">{composedScript}</pre>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <FileText size={32} className="mx-auto text-slate-200 mb-3" />
              <p className="text-sm text-slate-400">보장분석 토픽을 활성화하면 여기에 스크립트가 합산됩니다.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
  expanded,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between bg-white rounded-lg border border-slate-200 px-4 py-3 hover:bg-slate-50 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="text-slate-600">{icon}</span>
        <span className="font-bold text-sm text-slate-800">{title}</span>
        <span className="text-xs text-slate-400 ml-1">{subtitle}</span>
      </div>
      {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
    </button>
  );
}
