import React from 'react';
import { AlertTriangle, Check, CheckCircle2, ChevronDown, ChevronUp, Clipboard, Database, FileText } from 'lucide-react';
import clsx from 'clsx';

interface SavedVersion {
  id: string;
  text: string;
  savedAt: string;
  label: string;
}

export interface HiraReferenceItem {
  date: string;
  hospital: string;
  department: string;
  diagnosis: string;
  diseaseCode: string;
  treatmentType: string;
  details: string;
}

export interface CoverageReferenceItem {
  coverageName: string;
  insurer: string;
  amount: number;
  category: string;
  isRenewal: boolean;
}

export interface ReferenceData {
  type: 'hira' | 'coverage';
  summary: string;
  hiraRecords?: HiraReferenceItem[];
  coverageItems?: CoverageReferenceItem[];
  gapDetected?: boolean;
  gapSeverity?: 'high' | 'medium' | 'low';
  gapDetail?: string;
  gapRecommendation?: string;
}

interface ScriptTopicItemProps {
  label: string;
  source: 'hira' | 'coverage';
  isActive: boolean;
  defaultExpanded?: boolean;
  text: string;
  defaultText: string;
  savedVersions: SavedVersion[];
  referenceData?: ReferenceData;
  onToggle: () => void;
  onChange: (text: string) => void;
  onLoadTemplate: (text: string) => void;
}

export function ScriptTopicItem({
  label,
  source,
  isActive,
  defaultExpanded = false,
  text,
  defaultText,
  savedVersions,
  referenceData,
  onToggle,
  onChange,
  onLoadTemplate,
}: ScriptTopicItemProps) {
  const isHiraViewer = source === 'hira';
  const [showTemplates, setShowTemplates] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [showReference, setShowReference] = React.useState(true);
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded || isActive || isHiraViewer);

  React.useEffect(() => {
    if (defaultExpanded || isActive || isHiraViewer) {
      setIsExpanded(true);
    }
  }, [defaultExpanded, isActive, isHiraViewer]);

  const hasRefData = Boolean(
    referenceData &&
      ((referenceData.hiraRecords && referenceData.hiraRecords.length > 0) ||
        (referenceData.coverageItems && referenceData.coverageItems.length > 0)),
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(text || defaultText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={clsx(
        'border rounded-lg transition-all duration-200 overflow-hidden group',
        isHiraViewer || isActive
          ? 'border-slate-300 bg-white shadow-sm ring-1 ring-slate-200'
          : 'border-slate-200 bg-slate-50/50',
      )}
    >
      <div
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          {!isHiraViewer && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggle();
              }}
              className="shrink-0"
            >
              <SimpleToggle checked={isActive} />
            </button>
          )}
          <span className={clsx('text-sm font-bold transition-colors truncate', isHiraViewer || isActive ? 'text-slate-800' : 'text-slate-500')}>
            {label}
          </span>
          <span
            className={clsx(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
              isHiraViewer ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-700',
            )}
          >
            {isHiraViewer ? '심평원' : '보장분석'}
          </span>
          {hasRefData && !isExpanded && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-600">
              참조 데이터
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isHiraViewer && !isActive && text.length > 0 && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <FileText size={12} /> 작성됨
            </span>
          )}
          {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-1 duration-200">
          {referenceData && (
            <div className="rounded-lg border border-teal-200 bg-teal-50/50 overflow-hidden">
              <button
                onClick={() => setShowReference((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-teal-50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Database size={13} className="text-teal-600 shrink-0" />
                  <span className="text-xs font-bold text-teal-700 shrink-0">참조 데이터</span>
                  <span className="text-[10px] text-teal-500 truncate">{referenceData.summary}</span>
                </div>
                {showReference ? <ChevronUp size={12} className="text-teal-400" /> : <ChevronDown size={12} className="text-teal-400" />}
              </button>

              {showReference && (
                <div className="px-3 pb-3">
                  {referenceData.type === 'hira' && referenceData.hiraRecords && referenceData.hiraRecords.length > 0 && (
                    <div className="overflow-x-auto rounded-md border border-teal-100">
                      <table className="w-full text-xs">
                        <thead className="bg-teal-100/60">
                          <tr>
                            <th className="text-left px-2.5 py-1.5 font-bold text-teal-700">일자</th>
                            <th className="text-left px-2.5 py-1.5 font-bold text-teal-700">병원</th>
                            <th className="text-left px-2.5 py-1.5 font-bold text-teal-700">진단명</th>
                            <th className="text-left px-2.5 py-1.5 font-bold text-teal-700">상병코드</th>
                            <th className="text-left px-2.5 py-1.5 font-bold text-teal-700">구분</th>
                            <th className="text-left px-2.5 py-1.5 font-bold text-teal-700">상세</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-teal-50 bg-white">
                          {referenceData.hiraRecords.map((record, index) => (
                            <tr key={`${record.diseaseCode}-${index}`} className="hover:bg-teal-50/30">
                              <td className="px-2.5 py-1.5 text-slate-600 whitespace-nowrap">{record.date}</td>
                              <td className="px-2.5 py-1.5 text-slate-700 font-medium whitespace-nowrap">{record.hospital}</td>
                              <td className="px-2.5 py-1.5 text-slate-700">{record.diagnosis}</td>
                              <td className="px-2.5 py-1.5">
                                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 font-mono font-bold rounded text-[10px]">
                                  {record.diseaseCode}
                                </span>
                              </td>
                              <td className="px-2.5 py-1.5">
                                <TreatmentBadge type={record.treatmentType} />
                              </td>
                              <td className="px-2.5 py-1.5 text-slate-500 max-w-[220px] truncate">{record.details}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {referenceData.type === 'coverage' && (
                    <div className="space-y-2">
                      {referenceData.coverageItems && referenceData.coverageItems.length > 0 && (
                        <div className="overflow-x-auto rounded-md border border-teal-100">
                          <table className="w-full text-xs">
                            <thead className="bg-teal-100/60">
                              <tr>
                                <th className="text-left px-2.5 py-1.5 font-bold text-teal-700">보험사</th>
                                <th className="text-left px-2.5 py-1.5 font-bold text-teal-700">담보명</th>
                                <th className="text-right px-2.5 py-1.5 font-bold text-teal-700">가입금액</th>
                                <th className="text-center px-2.5 py-1.5 font-bold text-teal-700">유형</th>
                                <th className="text-center px-2.5 py-1.5 font-bold text-teal-700">갱신</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-teal-50 bg-white">
                              {referenceData.coverageItems.map((item, index) => (
                                <tr key={`${item.coverageName}-${index}`} className="hover:bg-teal-50/30">
                                  <td className="px-2.5 py-1.5 text-slate-600 whitespace-nowrap">{item.insurer}</td>
                                  <td className="px-2.5 py-1.5 text-slate-700 font-medium">{item.coverageName}</td>
                                  <td className="px-2.5 py-1.5 text-right font-bold text-slate-700">
                                    {item.amount >= 10000 ? `${(item.amount / 10000).toFixed(0)}억` : `${item.amount}만`}원
                                  </td>
                                  <td className="px-2.5 py-1.5 text-center">
                                    <CategoryBadge category={item.category} />
                                  </td>
                                  <td className="px-2.5 py-1.5 text-center">
                                    {item.isRenewal ? (
                                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 py-0.5 rounded">갱신</span>
                                    ) : (
                                      <span className="text-[10px] text-slate-400">비갱신</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {referenceData.gapDetail && (
                        <div
                          className={clsx(
                            'flex items-start gap-2 px-3 py-2 rounded-md text-xs',
                            referenceData.gapDetected ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200',
                          )}
                        >
                          {referenceData.gapDetected ? (
                            <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                          ) : (
                            <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
                          )}
                          <div>
                            <div className={clsx('font-bold', referenceData.gapDetected ? 'text-amber-700' : 'text-green-700')}>
                              {referenceData.gapDetected ? '갭 감지' : '양호'}
                              {referenceData.gapSeverity && referenceData.gapDetected && (
                                <span
                                  className={clsx(
                                    'ml-1.5 text-[10px] px-1 py-0.5 rounded',
                                    referenceData.gapSeverity === 'high'
                                      ? 'bg-red-100 text-red-600'
                                      : referenceData.gapSeverity === 'medium'
                                        ? 'bg-amber-100 text-amber-600'
                                        : 'bg-slate-100 text-slate-500',
                                  )}
                                >
                                  {referenceData.gapSeverity === 'high' ? '높음' : referenceData.gapSeverity === 'medium' ? '보통' : '낮음'}
                                </span>
                              )}
                            </div>
                            <div className="text-slate-600 mt-0.5">{referenceData.gapDetail}</div>
                            {referenceData.gapRecommendation && (
                              <div className="text-blue-600 font-medium mt-1">→ {referenceData.gapRecommendation}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {isHiraViewer ? (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 px-3 py-3">
              <p className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                <AlertTriangle size={12} />
                주요 확인 포인트
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{defaultText}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onLoadTemplate(defaultText)}
                  className="px-2.5 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  기본 템플릿 불러오기
                </button>
                {savedVersions.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowTemplates((prev) => !prev)}
                      className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1"
                    >
                      저장된 스크립트 ({savedVersions.length})
                      <ChevronDown size={12} />
                    </button>
                    {showTemplates && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                        {savedVersions.map((version) => (
                          <button
                            key={version.id}
                            onClick={() => {
                              onLoadTemplate(version.text);
                              setShowTemplates(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                          >
                            <div className="font-bold text-slate-700">{version.label}</div>
                            <div className="text-slate-400 mt-0.5">{version.savedAt}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {text.length > 0 && (
                  <button
                    onClick={handleCopy}
                    className="ml-auto px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
                  >
                    {copied ? <Check size={12} className="text-green-500" /> : <Clipboard size={12} />}
                    {copied ? '복사됨' : '복사'}
                  </button>
                )}
              </div>

              <textarea
                value={text}
                onChange={(event) => onChange(event.target.value)}
                className="w-full min-h-[120px] p-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none bg-slate-50 focus:bg-white leading-relaxed"
                placeholder="스크립트를 작성하거나 템플릿을 불러오세요..."
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SimpleToggle({ checked }: { checked: boolean }) {
  return (
    <div className={clsx('w-9 h-5 rounded-full relative transition-colors duration-200 ease-in-out', checked ? 'bg-blue-600' : 'bg-slate-300')}>
      <div
        className={clsx(
          'absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200 ease-in-out',
          checked ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </div>
  );
}

function TreatmentBadge({ type }: { type: string }) {
  const config: Record<string, string> = {
    입원: 'bg-red-50 text-red-600',
    응급: 'bg-orange-50 text-orange-600',
    외래: 'bg-blue-50 text-blue-600',
    시술: 'bg-purple-50 text-purple-600',
    수술: 'bg-pink-50 text-pink-600',
    '입원+수술': 'bg-red-50 text-red-700',
  };

  return (
    <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded-full', config[type] || 'bg-slate-100 text-slate-500')}>
      {type}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const config: Record<string, string> = {
    암: 'bg-red-50 text-red-600',
    뇌: 'bg-purple-50 text-purple-600',
    심장: 'bg-pink-50 text-pink-600',
    상해: 'bg-orange-50 text-orange-600',
    질병: 'bg-blue-50 text-blue-600',
    기타: 'bg-slate-100 text-slate-500',
  };

  return (
    <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded-full', config[category] || config.기타)}>
      {category}
    </span>
  );
}
