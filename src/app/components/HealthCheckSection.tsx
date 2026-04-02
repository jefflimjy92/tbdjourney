import React, { useState } from 'react';
import clsx from 'clsx';
import svgPaths from "@/imports/svg-9jtw3qwxu5";

// Checkmark Icon Component
function CheckIcon() {
  return (
    <div className="relative shrink-0 size-[8px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 8">
        <g>
          <path d={svgPaths.p247d1a00} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33319" />
        </g>
      </svg>
    </div>
  );
}

interface HealthCheckSectionProps {
  trafficAccident: string;
  setTrafficAccident: (val: string) => void;
  trafficAccidentDetail: string;
  setTrafficAccidentDetail: (val: string) => void;
  surgery: string;
  setSurgery: (val: string) => void;
  surgeryOptions: string[];
  setSurgeryOptions: (val: string[]) => void;
  surgeryDetail: string;
  setSurgeryDetail: (val: string) => void;
  criticalDisease: string;
  setCriticalDisease: (val: string) => void;
  criticalOptions: string[];
  setCriticalOptions: (val: string[]) => void;
  criticalDetail: string;
  setCriticalDetail: (val: string) => void;
  medication: string;
  setMedication: (val: string) => void;
  medicationDetail: string;
  setMedicationDetail: (val: string) => void;
  trafficAccidentRef?: React.RefObject<HTMLDivElement | null>;
  surgeryRef?: React.RefObject<HTMLDivElement | null>;
  criticalDiseaseRef?: React.RefObject<HTMLDivElement | null>;
  medicationRef?: React.RefObject<HTMLDivElement | null>;
  highlightSection?: string | null;
}

export function HealthCheckSection(props: HealthCheckSectionProps) {
  const {
    trafficAccident, setTrafficAccident, trafficAccidentDetail, setTrafficAccidentDetail,
    surgery, setSurgery, surgeryOptions, setSurgeryOptions, surgeryDetail, setSurgeryDetail,
    criticalDisease, setCriticalDisease, criticalOptions, setCriticalOptions, criticalDetail, setCriticalDetail,
    medication, setMedication, medicationDetail, setMedicationDetail,
    trafficAccidentRef, surgeryRef, criticalDiseaseRef, medicationRef, highlightSection
  } = props;

  const [surgeryDetailsMap, setSurgeryDetailsMap] = useState<Record<string, string>>(
    () => (surgeryDetail ? { 기타: surgeryDetail } : ({} as Record<string, string>))
  );

  const handleSurgeryDetailChange = (key: string, value: string) => {
    const newMap = { ...surgeryDetailsMap, [key]: value };
    setSurgeryDetailsMap(newMap);
    const joined = Object.entries(newMap)
      .filter(([_, v]) => v && v.trim() !== '')
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    setSurgeryDetail(joined);
  };

  const toggleSurgeryOption = (option: string) => {
    if (surgeryOptions.includes(option)) {
      setSurgeryOptions(surgeryOptions.filter(o => o !== option));
    } else {
      setSurgeryOptions([...surgeryOptions, option]);
    }
  };

  const toggleCriticalOption = (option: string) => {
    if (criticalOptions.includes(option)) {
      setCriticalOptions(criticalOptions.filter(o => o !== option));
    } else {
      setCriticalOptions([...criticalOptions, option]);
    }
  };

  // D-3: Structured checklist completion status
  const checklistItems = [
    { label: '교통사고', filled: trafficAccident !== '', hasIssue: trafficAccident === '있음' },
    { label: '수술/시술', filled: surgery !== '', hasIssue: surgery === '있음' },
    { label: '중대질환', filled: criticalDisease !== '', hasIssue: criticalDisease === '있음' },
    { label: '투약이력', filled: medication !== '', hasIssue: medication === '있음' },
  ];
  const filledCount = checklistItems.filter(c => c.filled).length;
  const issueCount = checklistItems.filter(c => c.hasIssue).length;
  const isComplete = filledCount === checklistItems.length;

  return (
    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded p-2.5 relative">
      {/* Header */}
      <div className="border-b border-[#e2e8f0] pb-2 mb-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-[#314158]">병력 / 건강 확인</p>
          <div className="flex items-center gap-2">
            <span className={clsx(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border",
              isComplete ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
            )}>
              {filledCount}/{checklistItems.length} 완료
            </span>
          </div>
        </div>
      </div>

      {/* Checklist Summary Bar */}
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        {checklistItems.map((item, idx) => (
          <span
            key={idx}
            className={clsx(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border",
              !item.filled ? "bg-slate-50 text-slate-400 border-slate-200" :
              item.hasIssue ? "bg-rose-50 text-rose-600 border-rose-200" :
              "bg-emerald-50 text-emerald-600 border-emerald-200"
            )}
          >
            <span className={clsx("size-1.5 rounded-full", !item.filled ? "bg-slate-300" : item.hasIssue ? "bg-rose-500" : "bg-emerald-500")} />
            {item.label}
            {item.hasIssue && ' (있음)'}
          </span>
        ))}
        {issueCount > 0 && <span className="text-[10px] text-rose-500 font-bold ml-1">{issueCount}건 확인 필요</span>}
      </div>

      {/* Item 5: 교통사고 */}
      <div 
        ref={trafficAccidentRef}
        className={clsx(
          "bg-white border border-[#f1f5f9] rounded p-2 mb-2 transition-all duration-500",
          highlightSection === 'trafficAccident' && "ring-2 ring-blue-400 bg-blue-50/30"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-[#45556c]">5.교통사고 (3년내)</p>
          <div className="bg-[#f1f5f9] rounded flex p-0.5">
            <button
              onClick={() => setTrafficAccident('없음')}
              className={clsx(
                "px-2 py-1 rounded text-[10px] transition-all tracking-wide",
                trafficAccident === '없음' 
                  ? "bg-white text-[#62748e] font-bold shadow-sm"
                  : "text-[#90a1b9] font-medium"
              )}
            >
              없음
            </button>
            <button
              onClick={() => setTrafficAccident('있음')}
              className={clsx(
                "px-2 py-1 rounded text-[10px] font-bold transition-all tracking-wide shadow-sm",
                trafficAccident === '있음'
                  ? "bg-[#155dfc] text-white"
                  : "text-[#90a1b9] font-medium"
              )}
            >
              있음
            </button>
          </div>
        </div>
        {trafficAccident === '있음' && (
          <input
            type="text"
            className="w-full p-1.5 text-xs border border-[#cad5e2] rounded bg-white placeholder:text-slate-400"
            placeholder="사고 내용"
            value={trafficAccidentDetail}
            onChange={(e) => setTrafficAccidentDetail(e.target.value)}
          />
        )}
      </div>

      {/* Item 6: 수술/시술/골절 */}
      <div 
        ref={surgeryRef}
        className={clsx(
          "bg-white border border-[#f1f5f9] rounded p-2 mb-2 transition-all duration-500",
          highlightSection === 'surgery' && "ring-2 ring-blue-400 bg-blue-50/30"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-[#45556c]">6.용종/수술・시술/골절</p>
          <div className="bg-[#f1f5f9] rounded flex p-0.5">
            <button
              onClick={() => setSurgery('없음')}
              className={clsx(
                "px-2 py-1 rounded text-[10px] transition-all tracking-wide",
                surgery === '없음'
                  ? "bg-white text-[#62748e] font-bold shadow-sm"
                  : "text-[#90a1b9] font-medium"
              )}
            >
              없음
            </button>
            <button
              onClick={() => setSurgery('있음')}
              className={clsx(
                "px-2 py-1 rounded text-[10px] font-bold transition-all tracking-wide shadow-sm",
                surgery === '있음'
                  ? "bg-[#155dfc] text-white"
                  : "text-[#90a1b9] font-medium"
              )}
            >
              있음
            </button>
          </div>
        </div>
        {surgery === '있음' && (
          <div className="bg-[#f8fafc] border border-[#f1f5f9] rounded p-2 space-y-2">
            <p className="text-[10px] font-bold text-[#90a1b9] tracking-wide">상세 이력 입력</p>
            
            {/* 용종 Option */}
            <div className="space-y-2">
              <button
                onClick={() => toggleSurgeryOption('용종')}
                className={clsx(
                  "w-full px-3 py-1.5 rounded border flex items-center gap-2 text-xs font-bold transition-all",
                  surgeryOptions.includes('용종')
                    ? "bg-[#dbeafe] border-[#93c5fd] text-[#1e40af]"
                    : "bg-white border-[#e2e8f0] text-[#62748e]"
                )}
              >
                <div className={clsx(
                  "size-3 rounded-full border flex items-center justify-center shrink-0",
                  surgeryOptions.includes('용종') ? "border-[#1e40af] bg-transparent" : "border-[#cad5e2] bg-[#f8fafc]"
                )}>
                  {surgeryOptions.includes('용종') && <CheckIcon />}
                </div>
                용종
              </button>
              {surgeryOptions.includes('용종') && (
                <input
                  type="text"
                  className="w-full p-1.5 bg-white border border-[#bedbff] rounded text-xs placeholder:text-slate-400"
                  placeholder="용종 내용 입력"
                  value={surgeryDetailsMap['용종'] || ''}
                  onChange={(e) => handleSurgeryDetailChange('용종', e.target.value)}
                />
              )}
            </div>

            {/* 수술·시술 Option */}
            <div className="space-y-2">
              <button
                onClick={() => toggleSurgeryOption('수술·시술')}
                className={clsx(
                  "w-full px-3 py-1.5 rounded border flex items-center gap-2 text-xs font-bold transition-all",
                  surgeryOptions.includes('수술·시술')
                    ? "bg-[#dbeafe] border-[#93c5fd] text-[#1e40af]"
                    : "bg-white border-[#e2e8f0] text-[#62748e]"
                )}
              >
                <div className={clsx(
                  "size-3 rounded-full border flex items-center justify-center shrink-0",
                  surgeryOptions.includes('수술·시술') ? "border-[#1e40af] bg-transparent" : "border-[#cad5e2] bg-[#f8fafc]"
                )}>
                  {surgeryOptions.includes('수술·시술') && <CheckIcon />}
                </div>
                수술·시술
              </button>
              {surgeryOptions.includes('수술·시술') && (
                <input
                  type="text"
                  className="w-full p-1.5 bg-white border border-[#bedbff] rounded text-xs placeholder:text-slate-400"
                  placeholder="수술·시술 내용 입력"
                  value={surgeryDetailsMap['수술·시술'] || ''}
                  onChange={(e) => handleSurgeryDetailChange('수술·시술', e.target.value)}
                />
              )}
            </div>

            {/* 골절 Option */}
            <div className="space-y-2">
              <button
                onClick={() => toggleSurgeryOption('골절')}
                className={clsx(
                  "w-full px-3 py-1.5 rounded border flex items-center gap-2 text-xs font-bold transition-all",
                  surgeryOptions.includes('골절')
                    ? "bg-[#dbeafe] border-[#93c5fd] text-[#1e40af]"
                    : "bg-white border-[#e2e8f0] text-[#62748e]"
                )}
              >
                <div className={clsx(
                  "size-3 rounded-full border flex items-center justify-center shrink-0",
                  surgeryOptions.includes('골절') ? "border-[#1e40af] bg-transparent" : "border-[#cad5e2] bg-[#f8fafc]"
                )}>
                  {surgeryOptions.includes('골절') && <CheckIcon />}
                </div>
                골절
              </button>
              {surgeryOptions.includes('골절') && (
                <input
                  type="text"
                  className="w-full p-1.5 bg-white border border-[#bedbff] rounded text-xs placeholder:text-slate-400"
                  placeholder="골절 내용 입력"
                  value={surgeryDetailsMap['골절'] || ''}
                  onChange={(e) => handleSurgeryDetailChange('골절', e.target.value)}
                />
              )}
            </div>

            {/* 기타 Option */}
            <div className="space-y-2">
              <button
                onClick={() => toggleSurgeryOption('기타')}
                className={clsx(
                  "w-full px-3 py-1.5 rounded border flex items-center gap-2 text-xs font-bold transition-all",
                  surgeryOptions.includes('기타')
                    ? "bg-[#dbeafe] border-[#93c5fd] text-[#1e40af]"
                    : "bg-white border-[#e2e8f0] text-[#62748e]"
                )}
              >
                <div className={clsx(
                  "size-3 rounded-full border flex items-center justify-center shrink-0",
                  surgeryOptions.includes('기타') ? "border-[#1e40af] bg-transparent" : "border-[#cad5e2] bg-[#f8fafc]"
                )}>
                  {surgeryOptions.includes('기타') && <CheckIcon />}
                </div>
                기타
              </button>
              {surgeryOptions.includes('기타') && (
                <input
                  type="text"
                  className="w-full p-1.5 bg-white border border-[#bedbff] rounded text-xs placeholder:text-slate-400"
                  placeholder="기타 내용 입력"
                  value={surgeryDetailsMap['기타'] || ''}
                  onChange={(e) => handleSurgeryDetailChange('기타', e.target.value)}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Item 7: 중대질환 */}
      <div 
        ref={criticalDiseaseRef}
        className={clsx(
          "bg-white border border-[#f1f5f9] rounded p-2 mb-2 transition-all duration-500",
          highlightSection === 'criticalDisease' && "ring-2 ring-blue-400 bg-blue-50/30"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-[#45556c]">7. 중대질환(암/뇌/심)</p>
          <div className="bg-[#f1f5f9] rounded flex p-0.5">
            <button
              onClick={() => setCriticalDisease('없음')}
              className={clsx(
                "px-2 py-1 rounded text-[10px] transition-all tracking-wide",
                criticalDisease === '없음'
                  ? "bg-white text-[#62748e] font-bold shadow-sm"
                  : "text-[#90a1b9] font-medium"
              )}
            >
              없음
            </button>
            <button
              onClick={() => setCriticalDisease('있음')}
              className={clsx(
                "px-2 py-1 rounded text-[10px] font-bold transition-all tracking-wide shadow-sm",
                criticalDisease === '있음'
                  ? "bg-[#155dfc] text-white"
                  : "text-[#90a1b9] font-medium"
              )}
            >
              있음
            </button>
          </div>
        </div>
        {criticalDisease === '있음' && (
          <div className="bg-[#f8fafc] border border-[#f1f5f9] rounded p-2 space-y-2">
            <p className="text-[10px] font-bold text-[#90a1b9] tracking-wide">상세 이력 입력</p>
            
            {/* 암 Option */}
            <div className="space-y-2">
              <button
                onClick={() => toggleCriticalOption('암')}
                className={clsx(
                  "w-full px-3 py-1.5 rounded border flex items-center gap-2 text-xs font-bold transition-all",
                  criticalOptions.includes('암')
                    ? "bg-[#dbeafe] border-[#93c5fd] text-[#1e40af]"
                    : "bg-white border-[#e2e8f0] text-[#62748e]"
                )}
              >
                <div className={clsx(
                  "size-3 rounded-full border flex items-center justify-center shrink-0",
                  criticalOptions.includes('암') ? "border-[#1e40af] bg-transparent" : "border-[#cad5e2] bg-[#f8fafc]"
                )}>
                  {criticalOptions.includes('암') && <CheckIcon />}
                </div>
                암
              </button>
              {criticalOptions.includes('암') && (
                <input
                  type="text"
                  className="w-full p-1.5 bg-white border border-[#bedbff] rounded text-xs placeholder:text-slate-400"
                  placeholder="암 내용 입력"
                  value={criticalDetail}
                  onChange={(e) => setCriticalDetail(e.target.value)}
                />
              )}
            </div>

            {/* 뇌 Option */}
            <div className="space-y-2">
              <button
                onClick={() => toggleCriticalOption('뇌')}
                className={clsx(
                  "w-full px-3 py-1.5 rounded border flex items-center gap-2 text-xs font-bold transition-all",
                  criticalOptions.includes('뇌')
                    ? "bg-[#dbeafe] border-[#93c5fd] text-[#1e40af]"
                    : "bg-white border-[#e2e8f0] text-[#62748e]"
                )}
              >
                <div className={clsx(
                  "size-3 rounded-full border flex items-center justify-center shrink-0",
                  criticalOptions.includes('뇌') ? "border-[#1e40af] bg-transparent" : "border-[#cad5e2] bg-[#f8fafc]"
                )}>
                  {criticalOptions.includes('뇌') && <CheckIcon />}
                </div>
                뇌
              </button>
              {criticalOptions.includes('뇌') && (
                <input
                  type="text"
                  className="w-full p-1.5 bg-white border border-[#bedbff] rounded text-xs placeholder:text-slate-400"
                  placeholder="뇌질환 내용 입력"
                  value={criticalDetail}
                  onChange={(e) => setCriticalDetail(e.target.value)}
                />
              )}
            </div>

            {/* 심 Option */}
            <div className="space-y-2">
              <button
                onClick={() => toggleCriticalOption('심')}
                className={clsx(
                  "w-full px-3 py-1.5 rounded border flex items-center gap-2 text-xs font-bold transition-all",
                  criticalOptions.includes('심')
                    ? "bg-[#dbeafe] border-[#93c5fd] text-[#1e40af]"
                    : "bg-white border-[#e2e8f0] text-[#62748e]"
                )}
              >
                <div className={clsx(
                  "size-3 rounded-full border flex items-center justify-center shrink-0",
                  criticalOptions.includes('심') ? "border-[#1e40af] bg-transparent" : "border-[#cad5e2] bg-[#f8fafc]"
                )}>
                  {criticalOptions.includes('심') && <CheckIcon />}
                </div>
                심
              </button>
              {criticalOptions.includes('심') && (
                <input
                  type="text"
                  className="w-full p-1.5 bg-white border border-[#bedbff] rounded text-xs placeholder:text-slate-400"
                  placeholder="심장질환 내용 입력"
                  value={criticalDetail}
                  onChange={(e) => setCriticalDetail(e.target.value)}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Item 8: 복용 약물 */}
      <div 
        ref={medicationRef}
        className={clsx(
          "bg-white border border-[#f1f5f9] rounded p-2 transition-all duration-500",
          highlightSection === 'medication' && "ring-2 ring-blue-400 bg-blue-50/30"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-[#45556c]">8. 복용 약물</p>
          <div className="bg-[#f1f5f9] rounded flex p-0.5">
            <button
              onClick={() => setMedication('없음')}
              className={clsx(
                "px-2 py-1 rounded text-[10px] transition-all tracking-wide",
                medication === '없음'
                  ? "bg-white text-[#62748e] font-bold shadow-sm"
                  : "text-[#90a1b9] font-medium"
              )}
            >
              없음
            </button>
            <button
              onClick={() => setMedication('있음')}
              className={clsx(
                "px-2 py-1 rounded text-[10px] font-bold transition-all tracking-wide shadow-sm",
                medication === '있음'
                  ? "bg-[#155dfc] text-white"
                  : "text-[#90a1b9] font-medium"
              )}
            >
              있음
            </button>
          </div>
        </div>
        {medication === '있음' && (
          <input
            type="text"
            className="w-full p-1.5 text-xs border border-[#cad5e2] rounded bg-white placeholder:text-slate-400"
            placeholder="약물 종류"
            value={medicationDetail}
            onChange={(e) => setMedicationDetail(e.target.value)}
          />
        )}
      </div>
    </div>
  );
}
