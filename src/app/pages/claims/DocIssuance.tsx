/**
 * DocIssuance.tsx - 서류 발급
 * Phase 6 Step S12: 서류 발급, 증빙 수집
 * Sprint 3: 배분 사전준비(엑셀 정리) + 외근팀 관리(휴업/폐업/발급거부)
 */
import React from 'react';
import { FileSpreadsheet, Users, CheckCircle, Clock, AlertTriangle, Download, MapPin, Ban, Building } from 'lucide-react';
import clsx from 'clsx';
import { Claims, type ClaimsProps } from '@/app/pages/Claims';

// ── 배분 사전준비 (청구DB 엑셀 정리) ──

type DistributionStatus = 'raw' | 'reviewed' | 'assigned';

function DistributionPrepPanel() {
  const [batches] = React.useState([
    { id: 'DB-0401-A', date: '2026-04-01', total: 45, reviewed: 38, assigned: 30, staff: '김청구', region: '서울/경기', status: 'assigned' as DistributionStatus },
    { id: 'DB-0401-B', date: '2026-04-01', total: 32, reviewed: 32, assigned: 0, staff: '', region: '충청/대전', status: 'reviewed' as DistributionStatus },
    { id: 'DB-0401-C', date: '2026-04-01', total: 28, reviewed: 10, assigned: 0, staff: '', region: '경상/부산', status: 'raw' as DistributionStatus },
  ]);

  const STATUS_CFG = {
    raw: { label: '미정리', bg: 'bg-gray-100', text: 'text-gray-600' },
    reviewed: { label: '정리완료', bg: 'bg-blue-50', text: 'text-blue-700' },
    assigned: { label: '배정완료', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  };

  const totalAll = batches.reduce((s, b) => s + b.total, 0);
  const totalAssigned = batches.reduce((s, b) => s + b.assigned, 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
          배분 사전준비 (엑셀 정리)
        </h3>
        <button className="px-3 py-1.5 text-[10px] font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1">
          <Download className="h-3 w-3" /> 엑셀 내보내기
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-[10px] text-gray-500">총 청구DB</p>
          <p className="text-xl font-bold text-gray-700">{totalAll}건</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-[10px] text-blue-600">정리 완료</p>
          <p className="text-xl font-bold text-blue-700">{batches.reduce((s, b) => s + b.reviewed, 0)}건</p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3 text-center">
          <p className="text-[10px] text-emerald-600">배정 완료</p>
          <p className="text-xl font-bold text-emerald-700">{totalAssigned}/{totalAll}건</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500">배치 ID</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">지역</th>
              <th className="px-3 py-2 text-center font-medium text-gray-500">전체</th>
              <th className="px-3 py-2 text-center font-medium text-gray-500">정리</th>
              <th className="px-3 py-2 text-center font-medium text-gray-500">배정</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">담당자</th>
              <th className="px-3 py-2 text-center font-medium text-gray-500">상태</th>
              <th className="px-3 py-2 text-center font-medium text-gray-500">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {batches.map(b => {
              const st = STATUS_CFG[b.status];
              return (
                <tr key={b.id}>
                  <td className="px-3 py-2 font-medium text-gray-700">{b.id}</td>
                  <td className="px-3 py-2 text-gray-600">{b.region}</td>
                  <td className="px-3 py-2 text-center font-medium text-gray-700">{b.total}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={b.reviewed === b.total ? 'text-emerald-600 font-bold' : 'text-amber-600'}>{b.reviewed}/{b.total}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={b.assigned > 0 ? 'text-emerald-600 font-bold' : 'text-gray-400'}>{b.assigned}</span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{b.staff || <span className="text-gray-400">미배정</span>}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-bold', st.bg, st.text)}>{st.label}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {b.status === 'raw' && <button className="px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded hover:bg-blue-700">정리</button>}
                    {b.status === 'reviewed' && <button className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700">배정</button>}
                    {b.status === 'assigned' && <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mx-auto" />}
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

// ── 외근팀 관리 (휴업/폐업/발급거부) ──

type FieldStatus = 'active' | 'temp_closed' | 'perm_closed' | 'refused';

function FieldTeamPanel() {
  const [sites] = React.useState([
    { id: 'FS-01', institution: '서울대병원', region: '서울 종로구', staff: '정외근', status: 'active' as FieldStatus, lastVisit: '2026-03-31', pendingDocs: 3, note: '' },
    { id: 'FS-02', institution: '한양의원', region: '서울 성동구', staff: '정외근', status: 'temp_closed' as FieldStatus, lastVisit: '2026-03-28', pendingDocs: 1, note: '4/5 재개 예정' },
    { id: 'FS-03', institution: '강남메디컬', region: '서울 강남구', staff: '박외근', status: 'refused' as FieldStatus, lastVisit: '2026-03-25', pendingDocs: 2, note: '개인정보 이유 발급 거부' },
    { id: 'FS-04', institution: '신도림정형외과', region: '서울 구로구', staff: '박외근', status: 'perm_closed' as FieldStatus, lastVisit: '2026-03-20', pendingDocs: 0, note: '2026-03 폐업 확인' },
    { id: 'FS-05', institution: '인천중앙병원', region: '인천 남동구', staff: '최외근', status: 'active' as FieldStatus, lastVisit: '2026-03-30', pendingDocs: 5, note: '' },
  ]);

  const STATUS_CFG = {
    active: { label: '정상', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle },
    temp_closed: { label: '일시휴업', bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
    perm_closed: { label: '폐업', bg: 'bg-gray-100', text: 'text-gray-600', icon: Ban },
    refused: { label: '발급거부', bg: 'bg-rose-50', text: 'text-rose-700', icon: AlertTriangle },
  };

  const activeCount = sites.filter(s => s.status === 'active').length;
  const issueCount = sites.filter(s => s.status !== 'active').length;
  const totalPending = sites.reduce((s, site) => s + site.pendingDocs, 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-blue-500" />
        외근팀 관리 (휴업/폐업/발급거부)
      </h3>

      <div className="grid grid-cols-4 gap-2">
        <div className="bg-emerald-50 rounded-lg p-3 text-center">
          <p className="text-[10px] text-emerald-600">정상 운영</p>
          <p className="text-xl font-bold text-emerald-700">{activeCount}</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 text-center">
          <p className="text-[10px] text-amber-600">일시휴업</p>
          <p className="text-xl font-bold text-amber-700">{sites.filter(s => s.status === 'temp_closed').length}</p>
        </div>
        <div className="bg-rose-50 rounded-lg p-3 text-center">
          <p className="text-[10px] text-rose-600">발급거부/폐업</p>
          <p className="text-xl font-bold text-rose-700">{sites.filter(s => s.status === 'refused' || s.status === 'perm_closed').length}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-[10px] text-blue-600">대기 서류</p>
          <p className="text-xl font-bold text-blue-700">{totalPending}건</p>
        </div>
      </div>

      <div className="space-y-2">
        {sites.map(site => {
          const st = STATUS_CFG[site.status];
          const StatusIcon = st.icon;
          return (
            <div key={site.id} className={clsx('rounded-lg border p-3 flex items-center justify-between',
              site.status === 'active' ? 'border-gray-200' : site.status === 'refused' ? 'border-rose-200 bg-rose-50/30' : 'border-amber-200 bg-amber-50/30'
            )}>
              <div className="flex items-center gap-3">
                <StatusIcon className={clsx('h-4 w-4 flex-shrink-0', st.text)} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700">{site.institution}</span>
                    <span className={clsx('px-1.5 py-0.5 rounded text-[9px] font-bold', st.bg, st.text)}>{st.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-0.5">
                    <span>{site.region}</span>
                    <span>담당: {site.staff}</span>
                    <span>최종방문: {site.lastVisit}</span>
                    {site.pendingDocs > 0 && <span className="text-blue-600 font-medium">대기 {site.pendingDocs}건</span>}
                  </div>
                  {site.note && <p className="text-[10px] text-amber-600 mt-0.5">{site.note}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {site.status === 'refused' && (
                  <button className="px-2 py-1 text-[10px] font-bold bg-rose-600 text-white rounded hover:bg-rose-700">대체기관 찾기</button>
                )}
                {site.status === 'temp_closed' && (
                  <button className="px-2 py-1 text-[10px] font-bold bg-amber-600 text-white rounded hover:bg-amber-700">재개 확인</button>
                )}
                {site.status === 'active' && site.pendingDocs > 0 && (
                  <button className="px-2 py-1 text-[10px] font-bold bg-blue-600 text-white rounded hover:bg-blue-700">방문 배정</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 외주업체 발급 관리 ──

type OutsourceRequestStatus = 'received' | 'issuing' | 'completed' | 'failed';

function OutsourceIssuancePanel() {
  const [requests] = React.useState([
    {
      id: 'OS-001',
      customer: '김서준',
      institution: '서울아산병원',
      documentType: '입퇴원확인서',
      requestedAt: '2026-04-01',
      vendor: '투에이치',
      status: 'received' as OutsourceRequestStatus,
      eta: '2026-04-03',
    },
    {
      id: 'OS-002',
      customer: '박유리',
      institution: '강남메디컬',
      documentType: '진료비 세부내역서',
      requestedAt: '2026-03-31',
      vendor: '투에이치',
      status: 'issuing' as OutsourceRequestStatus,
      eta: '2026-04-02',
    },
    {
      id: 'OS-003',
      customer: '정민재',
      institution: '인천중앙병원',
      documentType: '의무기록사본',
      requestedAt: '2026-03-29',
      vendor: '투에이치',
      status: 'completed' as OutsourceRequestStatus,
      eta: '2026-03-31',
    },
    {
      id: 'OS-004',
      customer: '이서현',
      institution: '한양의원',
      documentType: '약제비 영수증',
      requestedAt: '2026-03-28',
      vendor: '투에이치',
      status: 'failed' as OutsourceRequestStatus,
      eta: '2026-03-30',
    },
  ]);

  const STATUS_CFG = {
    received: { label: '접수', bg: 'bg-slate-100', text: 'text-slate-700' },
    issuing: { label: '발급중', bg: 'bg-blue-50', text: 'text-blue-700' },
    completed: { label: '발급완료', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    failed: { label: '실패', bg: 'bg-rose-50', text: 'text-rose-700' },
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Building className="h-4 w-4 text-violet-500" />
          외주 발급 요청 관리
        </h3>
        <span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-bold text-violet-700">투에이치 연동 Mock</span>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500">요청ID</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">고객명</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">기관명</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">서류유형</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">요청일</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">외주업체</th>
              <th className="px-3 py-2 text-center font-medium text-gray-500">요청상태</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">예상완료일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.map((request) => {
              const st = STATUS_CFG[request.status];
              return (
                <tr key={request.id} className={clsx(request.status === 'failed' && 'bg-rose-50/40')}>
                  <td className="px-3 py-2 font-medium text-gray-700">{request.id}</td>
                  <td className="px-3 py-2 text-gray-700">{request.customer}</td>
                  <td className="px-3 py-2 text-gray-600">{request.institution}</td>
                  <td className="px-3 py-2 text-gray-600">{request.documentType}</td>
                  <td className="px-3 py-2 text-gray-500">{request.requestedAt}</td>
                  <td className="px-3 py-2 text-gray-600">{request.vendor}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-bold', st.bg, st.text)}>{st.label}</span>
                  </td>
                  <td className="px-3 py-2 text-gray-500">{request.eta}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OutsourcePerformancePanel() {
  const [recentResults] = React.useState([
    { id: 'TH-2401', completedAt: '2026-04-01 10:20', institution: '서울아산병원', turnaroundDays: 2.1, outcome: '성공' as const },
    { id: 'TH-2398', completedAt: '2026-03-31 16:05', institution: '인천중앙병원', turnaroundDays: 1.8, outcome: '성공' as const },
    { id: 'TH-2395', completedAt: '2026-03-30 14:40', institution: '한양의원', turnaroundDays: 3.4, outcome: '실패' as const },
  ]);

  const kpis = [
    { label: '월 처리건수', value: '42건', tone: 'text-violet-700', bg: 'bg-violet-50' },
    { label: '평균 소요일', value: '2.4일', tone: 'text-blue-700', bg: 'bg-blue-50' },
    { label: '성공률', value: '88%', tone: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: '실패율', value: '12%', tone: 'text-rose-700', bg: 'bg-rose-50' },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-500" />
          외주업체 발급 현황 추적
        </h3>
        <span className="text-[10px] text-gray-400">최근 30일 기준</span>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={clsx('rounded-lg p-3 text-center', kpi.bg)}>
            <p className="text-[10px] text-gray-500">{kpi.label}</p>
            <p className={clsx('text-xl font-bold mt-1', kpi.tone)}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500">처리ID</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">완료일시</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">기관명</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500">소요일</th>
              <th className="px-3 py-2 text-center font-medium text-gray-500">결과</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recentResults.map((row) => (
              <tr key={row.id}>
                <td className="px-3 py-2 font-medium text-gray-700">{row.id}</td>
                <td className="px-3 py-2 text-gray-500">{row.completedAt}</td>
                <td className="px-3 py-2 text-gray-600">{row.institution}</td>
                <td className="px-3 py-2 text-right text-gray-700 font-medium">{row.turnaroundDays.toFixed(1)}일</td>
                <td className="px-3 py-2 text-center">
                  <span className={clsx(
                    'px-1.5 py-0.5 rounded text-[10px] font-bold',
                    row.outcome === '성공' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  )}>
                    {row.outcome}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Component ──

interface DocIssuanceProps {
  type?: ClaimsProps['type'];
  initialRequestId?: string | null;
  onNavigate?: ClaimsProps['onNavigate'];
}

export function DocIssuance({ type, initialRequestId, onNavigate }: DocIssuanceProps) {
  return (
    <div className="space-y-4">
      {/* 청구준비 확장 패널 (청구팀장용) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DistributionPrepPanel />
        <FieldTeamPanel />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <OutsourceIssuancePanel />
        <OutsourcePerformancePanel />
      </div>
      {/* 기존 서류 발급 Claims */}
      <Claims
        type={type}
        initialRequestId={initialRequestId}
        onNavigate={onNavigate}
        claimsStageFilter="doc_issuance"
      />
    </div>
  );
}
