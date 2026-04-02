import React, { useMemo, useState } from 'react';
import {
  FileText,
  Search,
  Download,
  Plus,
  X,
  CheckCircle2,
  Clock,
  PenTool,
  ShieldCheck,
} from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { JourneyHeader } from '@/app/components/journey/JourneyHeader';
import { JourneyRequirementPanel } from '@/app/components/journey/JourneyRequirementPanel';
import { useJourneyStore } from '@/app/journey/JourneyContext';
import { DOCUMENT_PACK_LABELS } from '@/app/journey/rules';
import type { DocumentRequirement, VerificationState } from '@/app/journey/types';

const DOC_STATE_ORDER: VerificationState[] = ['missing', 'sent', 'received', 'verified', 'waived'];
const DOC_STATE_LABELS: Record<VerificationState, string> = {
  missing: '누락',
  sent: '발송',
  received: '수신',
  verified: '검증 완료',
  waived: '예외 승인',
};

interface DocumentRow extends DocumentRequirement {
  requestId: string;
  customer: string;
  stage: string;
}

export function Documents() {
  const { journeys, updateDocumentRequirement } = useJourneyStore();
  const [selectedDoc, setSelectedDoc] = useState<DocumentRow | null>(null);

  const documents = useMemo(() => (
    Object.values(journeys).flatMap((journey) =>
      journey.documentRequirements.map((doc) => ({
        ...doc,
        requestId: journey.requestId,
        customer: journey.customerName,
        stage: journey.stage,
      })),
    )
  ), [journeys]);

  const cycleState = (doc: DocumentRow, forceState?: VerificationState) => {
    const currentIndex = DOC_STATE_ORDER.indexOf(doc.verificationState);
    const nextState = forceState || DOC_STATE_ORDER[(currentIndex + 1) % DOC_STATE_ORDER.length];
    updateDocumentRequirement(doc.requestId, doc.docCode, nextState, '문서허브');
    setSelectedDoc((current) => current ? { ...current, verificationState: nextState } : current);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="font-bold text-[#1e293b]">서류 및 동의 관리</h2>
          <p className="text-xs text-slate-500 mt-1">요청건별 문서 Pack 상태를 전산 기준으로 통합 관리합니다.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="접수ID, 고객명 검색..."
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-[#1e293b] text-white rounded text-sm hover:bg-slate-800">
            <Plus size={16} /> 문서 요청
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 sticky top-0">
            <tr>
              <th className="px-6 py-3 font-medium">연결 접수 ID</th>
              <th className="px-6 py-3 font-medium">고객명</th>
              <th className="px-6 py-3 font-medium">문서 유형</th>
              <th className="px-6 py-3 font-medium">문서 Pack</th>
              <th className="px-6 py-3 font-medium">상태</th>
              <th className="px-6 py-3 font-medium">수취 방식</th>
              <th className="px-6 py-3 font-medium">검증자</th>
              <th className="px-6 py-3 font-medium">처리일</th>
              <th className="px-6 py-3 font-medium text-right">다운로드</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <tr
                key={`${doc.requestId}-${doc.docCode}`}
                className="hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => setSelectedDoc(doc)}
              >
                <td className="px-6 py-4 font-mono text-xs font-bold text-[#0f766e]">{doc.requestId}</td>
                <td className="px-6 py-4 font-bold text-[#1e293b]">{doc.customer}</td>
                <td className="px-6 py-4 text-slate-600 flex items-center gap-2">
                  <FileText size={14} className="text-slate-400" />
                  {doc.label}
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">{DOCUMENT_PACK_LABELS[doc.pack]}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={doc.verificationState} />
                </td>
                <td className="px-6 py-4 text-slate-600">{doc.source}</td>
                <td className="px-6 py-4 text-slate-600">{doc.reviewedBy || '-'}</td>
                <td className="px-6 py-4 text-slate-500 text-xs">{doc.reviewedAt || '-'}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => toast('문서 다운로드는 준비 중입니다')}
                    className="text-slate-400 hover:text-[#1e293b]"
                  >
                    <Download size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedDoc(null)}
          />
          <div className="relative w-full max-w-xl bg-white shadow-2xl h-full flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-[#1e293b]">문서 상태 상세</h2>
                <div className="text-sm text-slate-500">{selectedDoc.requestId} - {selectedDoc.customer}</div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-[#1e293b]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 p-6 bg-slate-50/50 space-y-6 overflow-y-auto">
              <JourneyHeader requestId={selectedDoc.requestId} />
              <JourneyRequirementPanel requestId={selectedDoc.requestId} screen="documents" title="문서 게이트 패널" />

              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="size-12 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                  <FileText size={24} />
                </div>
                <div>
                  <div className="font-bold text-[#1e293b]">{selectedDoc.label}</div>
                  <div className="text-xs text-slate-500">{DOCUMENT_PACK_LABELS[selectedDoc.pack]} / {selectedDoc.source}</div>
                </div>
                <div className="ml-auto">
                  <StatusBadge status={selectedDoc.verificationState} />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-[#1e293b]">문서 메타 정보</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <Info label="필수 시점" value={selectedDoc.requiredWhen} />
                  <Info label="현재 단계" value={selectedDoc.stage} />
                  <Info label="검증자" value={selectedDoc.reviewedBy || '-'} />
                  <Info label="검증 시각" value={selectedDoc.reviewedAt || '-'} />
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-[#1e293b]">검증 상태 변경</h3>
                <div className="flex flex-wrap gap-2">
                  {DOC_STATE_ORDER.map((state) => (
                    <button
                      key={state}
                      onClick={() => cycleState(selectedDoc, state)}
                      className={clsx(
                        "px-3 py-1.5 rounded-full text-xs font-bold border transition-colors",
                        selectedDoc.verificationState === state
                          ? "bg-[#1e293b] text-white border-[#1e293b]"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {DOC_STATE_LABELS[state]}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-slate-500">문서 상태 변경 즉시 상담/미팅/이관/청구 화면의 게이트에 반영됩니다.</div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3">
              <button
                onClick={() => cycleState(selectedDoc)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50"
              >
                다음 상태로
              </button>
              <button
                onClick={() => cycleState(selectedDoc, 'verified')}
                className="px-4 py-2 bg-[#1e293b] text-white rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center gap-2"
              >
                <ShieldCheck size={16} /> 검증 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-xs text-slate-500 block">{label}</label>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: VerificationState }) {
  const styles = {
    missing: 'bg-rose-50 text-rose-700 border-rose-200',
    sent: 'bg-amber-50 text-amber-700 border-amber-200',
    received: 'bg-blue-50 text-blue-700 border-blue-200',
    verified: 'bg-green-50 text-green-700 border-green-200',
    waived: 'bg-slate-50 text-slate-700 border-slate-200',
  } as const;

  return (
    <span className={clsx("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold border", styles[status])}>
      {status === 'verified' && <CheckCircle2 size={12} />}
      {status === 'sent' && <Clock size={12} />}
      {status === 'received' && <PenTool size={12} />}
      {(status === 'missing' || status === 'waived') && <FileText size={12} />}
      {DOC_STATE_LABELS[status]}
    </span>
  );
}
