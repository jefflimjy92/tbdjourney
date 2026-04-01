import React, { useMemo, useState } from 'react';
import { ArrowLeft, Check, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { format, subDays } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';

export interface EmployeeStepDefinition {
  key: string;
  label: string;
  headerCaption?: string;
  headerLabel?: string;
  shortLabel: string;
}

export interface EmployeeStepMatrixItem<T = unknown> {
  id: string;
  customerName: string;
  ownerName: string;
  typeLabel: string;
  dateLabel: string;
  stageLabel: string;
  summaryLabel: string;
  regionLabel?: string;
  completed: boolean;
  employeeStepKey?: string;
  stepIndex?: number;
  currentStepMarker?: 'check' | 'absence' | 'cancelled';
  decisionStepKey?: string;
  decisionLabel?: string;
  decisionMarker?: 'absence' | 'success' | 'fail';
  stepDates?: Record<string, string | undefined>;
  terminalReason?: string;
  original: T;
}

export interface EmployeeStepOwnerDetailColumn<T = unknown> {
  key: string;
  header: React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  placement?: 'before_steps' | 'after_steps';
  render: (item: EmployeeStepMatrixItem<T>) => React.ReactNode;
}

export interface EmployeeStepSummaryColumn<T = unknown> {
  key: string;
  header: React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  render: (summary: EmployeeStepSummary<T>) => React.ReactNode;
}

interface EmployeeStepMatrixOverviewProps<T = unknown> {
  items: EmployeeStepMatrixItem<T>[];
  steps: EmployeeStepDefinition[];
  emptyMessage?: string;
  dateColumnLabel?: string;
  hideDropout?: boolean;
  summaryColumns?: EmployeeStepSummaryColumn<T>[];
  stageColumnLabel?: string;
  summaryColumnLabel?: string;
  onSelectOwner?: (ownerName: string) => void;
}

interface EmployeeStepOwnerDetailProps<T = unknown> {
  ownerName: string;
  items: EmployeeStepMatrixItem<T>[];
  steps: EmployeeStepDefinition[];
  emptyMessage?: string;
  dateColumnLabel?: string;
  stageColumnLabel?: string;
  summaryColumnLabel?: string;
  detailColumns?: EmployeeStepOwnerDetailColumn<T>[];
  onSelectItem?: (item: T) => void;
  onBack?: () => void;
}

interface EmployeeStepSummary<T = unknown> {
  ownerName: string;
  totalCount: number;
  inProgressCount: number;
  completedCount: number;
  stepCounts: number[];
  stepDropoutCounts: number[];
  stepDropoutItems: EmployeeStepDropoutItem<T>[][];
  items: EmployeeStepMatrixItem<T>[];
}

interface EmployeeStepDropoutItem<T = unknown> {
  customerName: string;
  dateLabel: string;
  original: T;
  reason: string;
  requestId: string;
}

function resolveStepIndex<T>(
  item: EmployeeStepMatrixItem<T>,
  stepKeyIndexMap: Map<string, number>
) {
  return item.employeeStepKey && stepKeyIndexMap.has(item.employeeStepKey)
    ? stepKeyIndexMap.get(item.employeeStepKey) ?? 0
    : item.stepIndex ?? 0;
}

function resolveDecision<T>(
  item: EmployeeStepMatrixItem<T>,
  stepKeyIndexMap: Map<string, number>
) {
  if (item.decisionStepKey && stepKeyIndexMap.has(item.decisionStepKey)) {
    return {
      stepIndex: stepKeyIndexMap.get(item.decisionStepKey) ?? 0,
      label: item.decisionLabel,
      marker: item.decisionMarker,
    };
  }

  if (item.currentStepMarker === 'absence') {
    return {
      stepIndex: resolveStepIndex(item, stepKeyIndexMap),
      label: item.decisionLabel ?? '부재',
      marker: 'absence' as const,
    };
  }

  if (item.currentStepMarker === 'cancelled') {
    return {
      stepIndex: resolveStepIndex(item, stepKeyIndexMap),
      label: item.decisionLabel ?? item.stageLabel,
      marker: 'fail' as const,
    };
  }

  return null;
}

function resolveSummaryStepIndex<T>(
  item: EmployeeStepMatrixItem<T>,
  stepKeyIndexMap: Map<string, number>
) {
  const decision = resolveDecision(item, stepKeyIndexMap);
  if (decision && (decision.marker === 'absence' || decision.marker === 'fail')) {
    return decision.stepIndex;
  }

  return resolveStepIndex(item, stepKeyIndexMap);
}

function getStepDateLabel<T>(
  item: EmployeeStepMatrixItem<T>,
  steps: EmployeeStepDefinition[],
  currentStepIndex: number,
  stepIndex: number
) {
  const explicitDate = item.stepDates?.[steps[stepIndex]?.key];
  if (explicitDate) {
    return explicitDate;
  }

  const { dateLabel } = item;
  const matched = dateLabel.match(/\d{4}-\d{2}-\d{2}/);
  if (!matched || stepIndex > currentStepIndex) {
    return null;
  }

  const baseDate = new Date(`${matched[0]}T00:00:00`);
  if (Number.isNaN(baseDate.getTime())) {
    return null;
  }

  return format(subDays(baseDate, currentStepIndex - stepIndex), 'MM.dd');
}

function renderStepCheck<T>(
  item: EmployeeStepMatrixItem<T>,
  steps: EmployeeStepDefinition[],
  stepKeyIndexMap: Map<string, number>,
  stepIndex: number
) {
  const currentStepIndex = resolveStepIndex(item, stepKeyIndexMap);
  const decision = resolveDecision(item, stepKeyIndexMap);
  const isDecisionStep = decision?.stepIndex === stepIndex && Boolean(decision.label);
  const hasExplicitStepDates = Boolean(item.stepDates && Object.keys(item.stepDates).length > 0);
  const stepKey = steps[stepIndex]?.key;

  if (isDecisionStep) {
    const stepDateLabel = getStepDateLabel(item, steps, currentStepIndex, stepIndex);
    return (
      <div className="flex flex-col items-center gap-1">
        <span
          className={clsx(
            'inline-flex min-h-7 items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-bold',
            decision?.marker === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
            decision?.marker === 'absence' && 'border-amber-200 bg-amber-50 text-amber-700',
            decision?.marker === 'fail' && 'border-rose-200 bg-rose-50 text-rose-700'
          )}
        >
          {decision?.marker === 'absence' ? `△${decision.label}` : decision?.label}
        </span>
        {stepDateLabel ? <span className="text-[10px] font-medium text-slate-400">{stepDateLabel}</span> : null}
      </div>
    );
  }

  if (decision && (decision.marker === 'absence' || decision.marker === 'fail') && stepIndex > decision.stepIndex) {
    return <span className="text-slate-300">-</span>;
  }

  if (hasExplicitStepDates && stepKey && !item.stepDates?.[stepKey]) {
    return <span className="text-slate-300">-</span>;
  }

  if (stepIndex > currentStepIndex) {
    return <span className="text-slate-300">-</span>;
  }

  const isCurrent = stepIndex === currentStepIndex;
  const stepDateLabel = getStepDateLabel(item, steps, currentStepIndex, stepIndex);

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={clsx(
          'inline-flex h-7 min-w-7 items-center justify-center rounded-full border px-2 text-xs font-bold',
          isCurrent
            ? 'border-blue-100 bg-blue-50 text-blue-700'
            : 'border-slate-200 bg-slate-50 text-slate-500'
        )}
      >
        <Check size={14} />
      </span>
      {stepDateLabel ? <span className="text-[10px] font-medium text-slate-400">{stepDateLabel}</span> : null}
    </div>
  );
}

function buildEmployeeStepSummaries<T>(items: EmployeeStepMatrixItem<T>[], steps: EmployeeStepDefinition[]) {
  const grouped = new Map<string, EmployeeStepSummary<T>>();
  const stepKeyIndexMap = new Map(steps.map((step, index) => [step.key, index]));

  items.forEach((item) => {
    const existing =
      grouped.get(item.ownerName) ||
      ({
        ownerName: item.ownerName,
        totalCount: 0,
        inProgressCount: 0,
        completedCount: 0,
        stepCounts: Array(steps.length).fill(0),
        stepDropoutCounts: Array(steps.length).fill(0),
        stepDropoutItems: Array.from({ length: steps.length }, () => []),
        items: [],
      } satisfies EmployeeStepSummary<T>);

    existing.totalCount += 1;
    existing.inProgressCount += item.completed ? 0 : 1;
    existing.completedCount += item.completed ? 1 : 0;
    existing.items.push(item);

    const resolvedStepIndex = resolveSummaryStepIndex(item, stepKeyIndexMap);
    const decision = resolveDecision(item, stepKeyIndexMap);

    if (resolvedStepIndex !== undefined && existing.stepCounts[resolvedStepIndex] !== undefined) {
      existing.stepCounts[resolvedStepIndex] += 1;
    }

    if (decision?.marker === 'fail' && existing.stepDropoutCounts[decision.stepIndex] !== undefined) {
      const original = item.original as Record<string, unknown> | undefined;
      const requestId = typeof original?.requestId === 'string' ? original.requestId : item.id;

      existing.stepDropoutCounts[decision.stepIndex] += 1;
      existing.stepDropoutItems[decision.stepIndex].push({
        customerName: item.customerName,
        dateLabel: item.stepDates?.[steps[decision.stepIndex]?.key] || item.dateLabel,
        original: item.original,
        reason: item.terminalReason || decision.label || '이탈',
        requestId,
      });
    }

    grouped.set(item.ownerName, existing);
  });

  return Array.from(grouped.values())
    .map((summary) => ({
      ...summary,
      items: [...summary.items].sort((a, b) => b.dateLabel.localeCompare(a.dateLabel)),
    }))
    .sort((a, b) => {
      if (b.inProgressCount !== a.inProgressCount) {
        return b.inProgressCount - a.inProgressCount;
      }
      if (b.totalCount !== a.totalCount) {
        return b.totalCount - a.totalCount;
      }
      return a.ownerName.localeCompare(b.ownerName, 'ko');
    });
}

export function EmployeeStepMatrixOverview<T>({
  items,
  steps,
  emptyMessage = '직원 기준으로 확인할 데이터가 없습니다.',
  hideDropout = false,
  summaryColumns,
  onSelectOwner,
}: EmployeeStepMatrixOverviewProps<T>) {
  const summaries = useMemo(() => buildEmployeeStepSummaries(items, steps), [items, steps]);
  const [dropoutModal, setDropoutModal] = useState<{ step: string; items: EmployeeStepDropoutItem<T>[] } | null>(null);

  if (!summaries.length) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">직원</th>
                <th className="px-4 py-3 font-medium">진행 고객</th>
                {summaryColumns?.map((column) => (
                  <th key={`summary-${column.key}`} className={clsx('px-4 py-3 font-medium', column.headerClassName)}>
                    {column.header}
                  </th>
                ))}
                {steps.map((step) => (
                  <th key={step.key} className="px-3 py-3 text-center font-medium">
                    {step.headerLabel ? (
                      <div className="flex items-center justify-center gap-1 normal-case">
                        <span className="text-sm font-bold text-slate-700">{step.headerLabel}</span>
                        {step.headerCaption ? (
                          <span className="text-[10px] font-medium text-rose-500">{step.headerCaption}</span>
                        ) : null}
                      </div>
                    ) : (
                      <>
                        <div>{step.label}</div>
                        <div className="mt-1 text-[10px] font-normal normal-case text-slate-400">{step.shortLabel}</div>
                      </>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summaries.map((summary) => (
                <tr
                  key={summary.ownerName}
                  className={clsx('transition-colors hover:bg-slate-50', onSelectOwner && 'cursor-pointer')}
                  onClick={() => onSelectOwner?.(summary.ownerName)}
                >
                  <td className="px-4 py-4">
                    <div className="font-bold text-[#1e293b]">{summary.ownerName}</div>
                    <div className="mt-1 text-xs text-slate-500">완료 {summary.completedCount}명 · 전체 {summary.totalCount}명</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      {summary.inProgressCount}명
                    </span>
                  </td>
                  {summaryColumns?.map((column) => (
                    <td key={`${summary.ownerName}-${column.key}`} className={clsx('px-4 py-4', column.cellClassName)}>
                      {column.render(summary)}
                    </td>
                  ))}
                  {summary.stepCounts.map((count, index) => (
                    <td key={`${summary.ownerName}-${steps[index].key}`} className="px-3 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {count > 0 ? (
                          <span className="inline-flex min-w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700">
                            {count}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                        {!hideDropout && summary.stepDropoutCounts[index] > 0 ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDropoutModal({
                                step: steps[index].headerLabel || steps[index].shortLabel || steps[index].label,
                                items: summary.stepDropoutItems[index],
                              });
                            }}
                            className="text-[10px] font-semibold text-rose-600 underline-offset-2 hover:underline"
                          >
                            이탈 {summary.stepDropoutCounts[index]}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Dialog open={Boolean(dropoutModal)} onOpenChange={(open) => !open && setDropoutModal(null)}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{dropoutModal?.step ?? ''} 이탈 건</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {(dropoutModal?.items ?? []).map((item, index) => (
              <div key={`${item.requestId}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-slate-800">{item.customerName}</div>
                  <div className="text-xs text-slate-500">{item.dateLabel}</div>
                </div>
                <div className="mt-2 text-xs text-slate-500">접수ID {item.requestId}</div>
                <div className="mt-1 text-sm text-rose-600">이탈 사유 · {item.reason}</div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function EmployeeStepOwnerDetail<T>({
  ownerName,
  items,
  steps,
  emptyMessage = '확인할 고객 단계 데이터가 없습니다.',
  dateColumnLabel = '기준일',
  stageColumnLabel = '현재 단계',
  summaryColumnLabel = '요약',
  detailColumns,
  onSelectItem,
  onBack,
}: EmployeeStepOwnerDetailProps<T>) {
  const summaries = useMemo(() => buildEmployeeStepSummaries(items, steps), [items, steps]);
  const stepKeyIndexMap = useMemo(() => new Map(steps.map((step, index) => [step.key, index])), [steps]);
  const activeSummary = summaries.find((summary) => summary.ownerName === ownerName) ?? null;
  const hasCustomDetailColumns = Boolean(detailColumns?.length);
  const leadingDetailColumns = detailColumns?.filter((column) => column.placement !== 'after_steps') ?? [];
  const trailingDetailColumns = detailColumns?.filter((column) => column.placement === 'after_steps') ?? [];

  if (!activeSummary) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex items-center gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft size={14} />
              직원 현황
            </button>
          ) : null}
          <div>
            <div className="text-base font-bold text-[#1e293b]">{activeSummary.ownerName} 고객 단계 현황</div>
            <div className="mt-1 text-xs text-slate-500">
              진행중 {activeSummary.inProgressCount}명 · 완료 {activeSummary.completedCount}명 · 전체 {activeSummary.totalCount}명
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-medium">고객</th>
              {hasCustomDetailColumns ? (
                leadingDetailColumns.map((column) => (
                  <th
                    key={`detail-column-${column.key}`}
                    className={clsx('px-5 py-3 font-medium', column.headerClassName)}
                  >
                    {column.header}
                  </th>
                ))
              ) : (
                <th className="px-5 py-3 font-medium">기준 정보</th>
              )}
              {steps.map((step) => (
                <th key={`detail-${step.key}`} className="px-3 py-3 text-center font-medium">
                  {step.headerLabel ? (
                    <div className="flex items-center justify-center gap-1 normal-case">
                      <span className="text-sm font-bold text-slate-700">{step.headerLabel}</span>
                      {step.headerCaption ? (
                        <span className="text-[10px] font-medium text-rose-500">{step.headerCaption}</span>
                      ) : null}
                    </div>
                  ) : (
                    <>
                      <div>{step.label}</div>
                      <div className="mt-1 text-[10px] font-normal normal-case text-slate-400">{step.shortLabel}</div>
                    </>
                  )}
                </th>
              ))}
              {hasCustomDetailColumns
                ? trailingDetailColumns.map((column) => (
                    <th
                      key={`detail-column-${column.key}`}
                      className={clsx('px-5 py-3 font-medium', column.headerClassName)}
                    >
                      {column.header}
                    </th>
                  ))
                : null}
              <th className="px-5 py-3 text-right font-medium">열기</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeSummary.items.map((item) => (
              <tr
                key={item.id}
                className={clsx(
                  'transition-colors',
                  onSelectItem ? 'cursor-pointer hover:bg-slate-50' : 'hover:bg-slate-50'
                )}
                onClick={() => onSelectItem?.(item.original)}
              >
                <td className="px-5 py-4">
                  <div className="font-bold text-[#1e293b]">{item.customerName}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.regionLabel || '-'}</div>
                </td>
                {hasCustomDetailColumns ? (
                  leadingDetailColumns.map((column) => (
                    <td
                      key={`${item.id}-${column.key}`}
                      className={clsx('px-5 py-4 align-top', column.cellClassName)}
                    >
                      {column.render(item)}
                    </td>
                  ))
                ) : (
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-700">{item.typeLabel}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {dateColumnLabel} {item.dateLabel}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {stageColumnLabel} {item.stageLabel}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {summaryColumnLabel} {item.summaryLabel}
                    </div>
                    {item.terminalReason ? (
                      <div className="mt-1 text-xs font-medium text-rose-500">사유 · {item.terminalReason}</div>
                    ) : null}
                  </td>
                )}
                {steps.map((step, index) => (
                  <td key={`${item.id}-${step.key}`} className="px-3 py-4 text-center">
                    {renderStepCheck(item, steps, stepKeyIndexMap, index)}
                  </td>
                ))}
                {hasCustomDetailColumns
                  ? trailingDetailColumns.map((column) => (
                      <td
                        key={`${item.id}-${column.key}`}
                        className={clsx('px-5 py-4 align-top', column.cellClassName)}
                      >
                        {column.render(item)}
                      </td>
                    ))
                  : null}
                <td className="px-5 py-4 text-right">
                  {onSelectItem ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                      열기 <ChevronRight size={14} />
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-slate-400">보기</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
