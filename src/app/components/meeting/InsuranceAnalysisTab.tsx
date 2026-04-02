import React, { useState } from 'react';
import { Download, FileBarChart, FileText, Trash2, Upload } from 'lucide-react';
import clsx from 'clsx';
import { CoverageGapFlags } from './CoverageGapFlags';
import {
  MOCK_CONTRACTS,
  MOCK_COVERAGE_ITEMS,
  MOCK_GAP_FLAGS,
} from './mockInsuranceAnalysis';

interface UploadedAnalysisFile {
  name: string;
  size: number;
  downloadedAt?: string;
}

export function InsuranceAnalysisTab() {
  const [uploadedFile, setUploadedFile] = useState<UploadedAnalysisFile | null>(null);

  const totalContracts = MOCK_CONTRACTS.length;
  const activeContracts = MOCK_CONTRACTS.filter((contract) => contract.status === '정상').length;
  const totalPremium = MOCK_CONTRACTS.reduce((sum, contract) => sum + contract.premium, 0);
  const renewalCount = MOCK_CONTRACTS.filter((contract) => contract.isRenewal).length;
  const detectedGaps = MOCK_GAP_FLAGS.filter((flag) => flag.detected).length;

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadedFile({
      name: file.name,
      size: file.size,
    });
    event.currentTarget.value = '';
  };

  const handleDownload = () => {
    if (!uploadedFile) return;
    setUploadedFile((current) => (current ? { ...current, downloadedAt: new Date().toISOString() } : current));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Upload size={18} className="text-blue-600" />
          <h3 className="font-bold text-sm text-slate-800">보장분석 파일 업로드</h3>
          <span className="text-xs text-slate-400 ml-2">KB / 삼성 보장분석 결과 파일</span>
        </div>

        <div className="p-4">
          {uploadedFile ? (
            <div className="flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-blue-600 border border-blue-100">
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-800">{uploadedFile.name}</p>
                  <p className="text-xs text-slate-500">{formatSize(uploadedFile.size)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex h-9 items-center gap-1.5 rounded border border-blue-300 bg-white px-3 text-[11px] font-bold text-blue-700 hover:bg-blue-100"
                >
                  <Download size={12} />
                  다운로드
                </button>
                <button
                  type="button"
                  onClick={() => setUploadedFile(null)}
                  className="inline-flex h-9 items-center gap-1.5 rounded border border-rose-200 bg-white px-3 text-[11px] font-bold text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 size={12} />
                  삭제
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-slate-700">보장분석 결과 파일을 업로드하세요.</p>
                <p className="mt-1 text-xs text-slate-400">PDF, 이미지(PNG/JPG), Excel 파일을 지원합니다.</p>
              </div>
              <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded border border-blue-300 bg-white px-3 text-[11px] font-bold text-blue-700 hover:bg-blue-50">
                <Upload size={12} />
                파일 업로드
                <input type="file" className="hidden" onChange={handleUpload} />
              </label>
            </div>
          )}
        </div>
      </div>

      <CoverageGapFlags flags={MOCK_GAP_FLAGS} />

      <div className="grid grid-cols-5 gap-3">
        {[
          { label: '전체 계약', value: `${totalContracts}건`, color: 'text-slate-700' },
          { label: '유효 계약', value: `${activeContracts}건`, color: 'text-blue-600' },
          { label: '월 보험료 합계', value: `${totalPremium}만원`, color: 'text-emerald-600' },
          { label: '갱신형', value: `${renewalCount}건`, color: 'text-amber-600' },
          { label: '갭 감지', value: `${detectedGaps}건`, color: detectedGaps > 0 ? 'text-red-600' : 'text-green-600' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase">{card.label}</div>
            <div className={clsx('text-lg font-bold mt-1', card.color)}>{card.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <FileBarChart size={18} className="text-blue-600" />
          <h3 className="font-bold text-sm text-slate-800">담보 현황</h3>
          <span className="text-xs text-slate-400 ml-2">{MOCK_COVERAGE_ITEMS.length}개 담보</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">보험사</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">상품명</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">담보명</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">유형</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">가입금액</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">갱신</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MOCK_COVERAGE_ITEMS.map((item, index) => {
                const contract = MOCK_CONTRACTS.find((value) => value.id === item.contractId);
                return (
                  <tr key={`${item.contractId}-${item.coverageName}-${index}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-slate-500">{contract?.insurer}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-600 font-medium">{contract?.productName}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-700">{item.coverageName}</td>
                    <td className="px-4 py-2.5">
                      <CoverageBadge category={item.category} />
                    </td>
                    <td className="px-4 py-2.5 text-xs text-right font-bold text-slate-700">
                      {item.amount >= 10000 ? `${(item.amount / 10000).toFixed(0)}억` : `${item.amount}만`}원
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {item.isRenewal ? (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">갱신</span>
                      ) : (
                        <span className="text-[10px] text-slate-400">비갱신</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function formatSize(bytes: number) {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function CoverageBadge({ category }: { category: string }) {
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
