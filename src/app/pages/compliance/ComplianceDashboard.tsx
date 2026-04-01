/**
 * ComplianceDashboard.tsx - 준법/개인정보 대시보드
 * 개인정보 수집 현황, 민감도 히트맵, 보관 정책 모니터링
 */
import React from 'react';
import {
  Shield,
  Eye,
  AlertTriangle,
  CheckCircle,
  Lock,
  FileWarning,
  Clock,
  Database,
} from 'lucide-react';
import clsx from 'clsx';

type Sensitivity = 'high' | 'medium' | 'low';
type RetentionStatus = 'active' | 'expiring_soon' | 'expired';

interface PersonalDataInventory {
  phase: string;
  step: string;
  dataType: string;
  sensitivity: Sensitivity;
  purpose: string;
  retentionPeriod: string;
  retentionStatus: RetentionStatus;
  recordCount: number;
  consentRate: number;
}

const MOCK_INVENTORY: PersonalDataInventory[] = [
  {
    phase: '유입',
    step: 'S1',
    dataType: '이름, 연락처',
    sensitivity: 'medium',
    purpose: '서비스 신청',
    retentionPeriod: '계약 종료 후 5년',
    retentionStatus: 'active',
    recordCount: 1250,
    consentRate: 100,
  },
  {
    phase: '조회/신청',
    step: 'S2-S3',
    dataType: '주민등록번호, 보험증권',
    sensitivity: 'high',
    purpose: '보험 조회',
    retentionPeriod: '조회 후 즉시 파기',
    retentionStatus: 'active',
    recordCount: 980,
    consentRate: 98.5,
  },
  {
    phase: '상담/TM',
    step: 'S5-S6',
    dataType: '통화 녹음, 상담 기록',
    sensitivity: 'medium',
    purpose: '상담 품질 관리',
    retentionPeriod: '6개월',
    retentionStatus: 'expiring_soon',
    recordCount: 2450,
    consentRate: 95.2,
  },
  {
    phase: '미팅/계약',
    step: 'S7-S9',
    dataType: '계좌정보, 서명',
    sensitivity: 'high',
    purpose: '계약 체결',
    retentionPeriod: '계약 종료 후 5년',
    retentionStatus: 'active',
    recordCount: 420,
    consentRate: 100,
  },
  {
    phase: '청구/분석',
    step: 'S10-S13',
    dataType: '의료기록, 진단서',
    sensitivity: 'high',
    purpose: '보험금 청구',
    retentionPeriod: '청구 완료 후 3년',
    retentionStatus: 'active',
    recordCount: 380,
    consentRate: 99.1,
  },
  {
    phase: '지급/사후',
    step: 'S14-S15',
    dataType: '지급 내역, 만족도',
    sensitivity: 'low',
    purpose: '사후 관리',
    retentionPeriod: '1년',
    retentionStatus: 'expired',
    recordCount: 156,
    consentRate: 92.3,
  },
];

const SENSITIVITY_CONFIG: Record<Sensitivity, { label: string; color: string; bg: string }> = {
  high: { label: '높음', color: 'text-red-700', bg: 'bg-red-50' },
  medium: { label: '보통', color: 'text-amber-700', bg: 'bg-amber-50' },
  low: { label: '낮음', color: 'text-emerald-700', bg: 'bg-emerald-50' },
};

const RETENTION_CONFIG: Record<RetentionStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  active: { label: '정상', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle },
  expiring_soon: { label: '만료 임박', color: 'text-amber-700', bg: 'bg-amber-50', icon: Clock },
  expired: { label: '만료', color: 'text-red-700', bg: 'bg-red-50', icon: FileWarning },
};

export function ComplianceDashboard() {
  const highSensitivityCount = MOCK_INVENTORY.filter((i) => i.sensitivity === 'high').length;
  const expiringCount = MOCK_INVENTORY.filter(
    (i) => i.retentionStatus === 'expiring_soon' || i.retentionStatus === 'expired'
  ).length;
  const avgConsent =
    MOCK_INVENTORY.reduce((sum, i) => sum + i.consentRate, 0) / MOCK_INVENTORY.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">준법 / 개인정보 대시보드</h1>
        <p className="mt-1 text-sm text-gray-500">
          단계별 개인정보 수집 현황, 민감도, 보관 정책 모니터링
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '총 데이터 유형', value: MOCK_INVENTORY.length, icon: Database, color: 'text-gray-600' },
          { label: '고민감 항목', value: highSensitivityCount, icon: Shield, color: 'text-red-600' },
          { label: '보관 주의', value: expiringCount, icon: AlertTriangle, color: 'text-amber-600' },
          { label: '평균 동의율', value: `${avgConsent.toFixed(1)}%`, icon: CheckCircle, color: 'text-emerald-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <stat.icon className={clsx('h-5 w-5', stat.color)} />
              <span className="text-sm text-gray-500">{stat.label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Sensitivity Heatmap */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">단계별 민감도 히트맵</h2>
        <div className="grid grid-cols-6 gap-2">
          {MOCK_INVENTORY.map((item) => {
            const senCfg = SENSITIVITY_CONFIG[item.sensitivity];
            return (
              <div
                key={item.step}
                className={clsx('rounded-lg p-3 text-center', senCfg.bg)}
              >
                <p className="text-xs font-medium text-gray-500">{item.phase}</p>
                <p className={clsx('mt-1 text-sm font-bold', senCfg.color)}>{senCfg.label}</p>
                <p className="mt-1 text-xs text-gray-400">{item.step}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-red-50 border border-red-200" /> 높음</span>
          <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-amber-50 border border-amber-200" /> 보통</span>
          <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-emerald-50 border border-emerald-200" /> 낮음</span>
        </div>
      </div>

      {/* Data Inventory Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['단계', '스텝', '수집 데이터', '민감도', '수집 목적', '보관 기간', '보관 상태', '레코드 수', '동의율'].map(
                (h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {MOCK_INVENTORY.map((item) => {
              const senCfg = SENSITIVITY_CONFIG[item.sensitivity];
              const retCfg = RETENTION_CONFIG[item.retentionStatus];
              const RetIcon = retCfg.icon;
              return (
                <tr key={item.step} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{item.phase}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{item.step}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.dataType}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={clsx('rounded-full px-2 py-1 text-xs font-medium', senCfg.bg, senCfg.color)}>
                      {senCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.purpose}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{item.retentionPeriod}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium', retCfg.bg, retCfg.color)}>
                      <RetIcon className="h-3 w-3" />
                      {retCfg.label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{item.recordCount.toLocaleString()}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={clsx('text-sm font-medium', item.consentRate >= 98 ? 'text-emerald-600' : item.consentRate >= 95 ? 'text-amber-600' : 'text-red-600')}>
                      {item.consentRate}%
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
