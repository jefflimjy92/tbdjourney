import React from 'react';
import {
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  PieChart as PieChartIcon,
  Activity,
  UserX,
  CreditCard,
  Download,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie,
  ComposedChart,
  Legend,
  Area
} from 'recharts';
import clsx from 'clsx';

// --- Mock Data ---

// 1. Acquisition Channels
const CHANNEL_DATA = [
  { name: '인스타그램', value: 45, fill: '#1e293b' }, // Dark slate
  { name: '네이버 블로그', value: 25, fill: '#475569' },
  { name: '지인 추천', value: 15, fill: '#64748b' },
  { name: '검색 광고', value: 10, fill: '#94a3b8' },
  { name: '기타', value: 5, fill: '#cbd5e1' },
];

// 2. Funnel Data
const FUNNEL_DATA = [
  { stage: '접수', count: 1250, conversion: 100, fill: '#cbd5e1' },
  { stage: '상담 완료', count: 980, conversion: 78.4, fill: '#94a3b8' },
  { stage: '미팅 진행', count: 650, conversion: 66.3, fill: '#64748b' },
  { stage: '계약 체결', count: 420, conversion: 64.6, fill: '#334155' },
  { stage: '청구 완료', count: 380, conversion: 90.5, fill: '#0f766e' },
];

// 3. Weekly Trends (Leads vs Contracts)
// Keep zero-inflow days visible in the tooltip while breaking the inflow line itself.
const WEEKLY_TRENDS = [
  { date: '1/19', leads: 45, contracts: 12, leadsLine: 45 },
  { date: '1/20', leads: 52, contracts: 15, leadsLine: 52 },
  { date: '1/21', leads: 0, contracts: 10, leadsLine: null },
  { date: '1/22', leads: 65, contracts: 18, leadsLine: 65 },
  { date: '1/23', leads: 48, contracts: 14, leadsLine: 48 },
  { date: '1/24', leads: 0, contracts: 20, leadsLine: null },
  { date: '1/25', leads: 42, contracts: 11, leadsLine: 42 },
];

// 4. Customer Segments
const CUSTOMER_SEGMENTS = [
  { name: '개인 (근로소득)', value: 65, fill: '#1e293b' },
  { name: '개인사업자', value: 25, fill: '#475569' },
  { name: '법인', value: 10, fill: '#94a3b8' },
];

// 5. Inflow Channel Detail (채널별 유입수 + CPA)
const INFLOW_CHANNEL_DETAIL = [
  { channel: 'Meta', inflow: 225, cpa: 12000, spend: 2700000 },
  { channel: 'Google', inflow: 180, cpa: 18000, spend: 3240000 },
  { channel: '카카오', inflow: 120, cpa: 9500, spend: 1140000 },
  { channel: '소개', inflow: 75, cpa: 0, spend: 0 },
  { channel: '직접', inflow: 50, cpa: 0, spend: 0 },
];

// 6. Daily Inflow Trend (최근 7일 채널별)
const DAILY_INFLOW_TREND = [
  { date: '3/25', Meta: 32, Google: 25, 카카오: 18, 소개: 10, 직접: 8 },
  { date: '3/26', Meta: 35, Google: 28, 카카오: 15, 소개: 12, 직접: 6 },
  { date: '3/27', Meta: 30, Google: 22, 카카오: 20, 소개: 8, 직접: 9 },
  { date: '3/28', Meta: 38, Google: 30, 카카오: 16, 소개: 11, 직접: 7 },
  { date: '3/29', Meta: 28, Google: 20, 카카오: 14, 소개: 13, 직접: 5 },
  { date: '3/30', Meta: 33, Google: 27, 카카오: 19, 소개: 10, 직접: 8 },
  { date: '3/31', Meta: 29, Google: 28, 카카오: 18, 소개: 11, 직접: 7 },
];

const INFLOW_COLORS: Record<string, string> = {
  Meta: '#1e293b',
  Google: '#475569',
  카카오: '#64748b',
  소개: '#94a3b8',
  직접: '#cbd5e1',
};

// 7. Churn Reasons
const CHURN_REASONS = [
  { reason: '수수료 부담', count: 145 },
  { reason: '단순 변심/무응답', count: 89 },
  { reason: '타 업체 계약', count: 65 },
  { reason: '가족/지인 반대', count: 42 },
  { reason: '서비스 불만족', count: 12 },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight">플랫폼 인사이트 (Platform Insights)</h1>
          <p className="text-slate-500 mt-1 text-sm">고객 유입부터 계약 전환까지의 전체 흐름 분석</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-colors">
             <Download size={14} /> 리포트 다운로드
          </button>
          <div className="text-xs font-medium bg-slate-800 text-white px-3 py-1.5 rounded shadow-sm flex items-center gap-1">
            <Activity size={12} className="text-emerald-400" /> Live Updated
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard 
          title="총 유입 고객 (Total Leads)" 
          value="1,250" 
          unit="명"
          trend="+12.5%" 
          trendUp={true}
          icon={<Users size={20} className="text-slate-600" />}
        />
        <KPICard 
          title="계약 체결율 (Conversion)" 
          value="33.6" 
          unit="%"
          trend="+2.1%" 
          trendUp={true}
          icon={<Target size={20} className="text-blue-600" />}
        />
        <KPICard 
          title="이탈률 (Churn Rate)" 
          value="18.2" 
          unit="%"
          trend="-1.5%" 
          trendUp={true} // Lower churn is good, displayed as green
          inverseTrend={true}
          icon={<UserX size={20} className="text-rose-500" />}
        />
        <KPICard 
          title="예상 매��액 (Revenue)" 
          value="4.2" 
          unit="억"
          trend="+5.8%" 
          trendUp={true}
          icon={<CreditCard size={20} className="text-emerald-600" />}
        />
      </div>

      {/* Inflow Section (S1) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-[#1e293b] flex items-center gap-2">
              <TrendingUp size={16} className="text-slate-400" /> 유입 현황 (Inflow Analytics)
            </h3>
            <p className="text-xs text-slate-400 mt-1">채널별 유입수, CPA, ROAS 분석</p>
          </div>
          <div className="flex gap-3 text-xs">
            <div className="px-3 py-1.5 bg-slate-50 rounded border border-slate-100">
              총 유입: <span className="font-bold text-[#1e293b]">{INFLOW_CHANNEL_DETAIL.reduce((s, c) => s + c.inflow, 0)}건</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-50 rounded border border-slate-100">
              평균 CPA: <span className="font-bold text-[#1e293b]">
                {Math.round(INFLOW_CHANNEL_DETAIL.filter(c => c.cpa > 0).reduce((s, c) => s + c.cpa, 0) / INFLOW_CHANNEL_DETAIL.filter(c => c.cpa > 0).length).toLocaleString()}원
              </span>
            </div>
            <div className="px-3 py-1.5 bg-emerald-50 rounded border border-emerald-100">
              ROAS: <span className="font-bold text-emerald-700">320%</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Channel Bar Chart */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 mb-3">채널별 유입수 & CPA</h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={INFLOW_CHANNEL_DETAIL} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="channel" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-lg text-xs">
                            <p className="font-bold text-slate-800 mb-1">{d.channel}</p>
                            <p>유입: <span className="font-bold">{d.inflow}건</span></p>
                            <p>CPA: <span className="font-bold">{d.cpa > 0 ? `${d.cpa.toLocaleString()}원` : '무료'}</span></p>
                            <p>광고비: <span className="font-bold">{d.spend > 0 ? `${(d.spend / 10000).toFixed(0)}만원` : '-'}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="inflow" radius={[4, 4, 0, 0]} barSize={32}>
                    {INFLOW_CHANNEL_DETAIL.map((entry, index) => (
                      <Cell key={`inflow-${index}`} fill={Object.values(INFLOW_COLORS)[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Daily Inflow Trend (Stacked Area) */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 mb-3">일별 유입 트렌드 (최근 7일)</h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <ComposedChart data={DAILY_INFLOW_TREND} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px' }} />
                  <Legend iconType="circle" formatter={(value) => <span className="text-[10px] font-medium text-slate-500">{value}</span>} />
                  {Object.entries(INFLOW_COLORS).map(([key, color]) => (
                    <Area key={key} type="monotone" dataKey={key} stackId="1" fill={color} fillOpacity={0.6} stroke={color} strokeWidth={1.5} />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 1. Acquisition Channels (Pie Chart) - Span 4 */}
        <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="font-bold text-[#1e293b] flex items-center gap-2">
              <PieChartIcon size={16} className="text-slate-400" /> 유입 채널 분석
            </h3>
            <p className="text-xs text-slate-400 mt-1">가장 많은 고객이 유입된 경로</p>
          </div>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={CHANNEL_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {CHANNEL_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-xs font-medium text-slate-500 ml-1">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] text-center pointer-events-none">
              <div className="text-2xl font-bold text-[#1e293b]">45%</div>
              <div className="text-[10px] text-slate-400 font-medium">Instagram</div>
            </div>
          </div>
        </div>

        {/* 2. Funnel Analysis (Bar Chart) - Span 8 */}
        <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-bold text-[#1e293b] flex items-center gap-2">
                <TrendingUp size={16} className="text-slate-400" /> 단계별 전환 퍼널 (Funnel)
              </h3>
              <p className="text-xs text-slate-400 mt-1">접수부터 청구 완료까지의 단계별 전환율</p>
            </div>
            <div className="text-xs font-medium px-2 py-1 bg-slate-50 text-slate-500 rounded border border-slate-100">
              전체 평균 전환율: <span className="text-[#1e293b] font-bold">30.4%</span>
            </div>
          </div>
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={FUNNEL_DATA} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-lg">
                          <p className="text-xs font-bold text-slate-800 mb-1">{data.stage}</p>
                          <p className="text-sm text-[#1e293b]">건수: {data.count}건</p>
                          <p className="text-xs text-blue-600 font-medium mt-1">전환율: {data.conversion}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                  {FUNNEL_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 3. Weekly Trends (Composed Chart) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="mb-6">
            <h3 className="font-bold text-[#1e293b]">주간 유입 및 계약 추이</h3>
            <p className="text-xs text-slate-400 mt-1">최근 7일간의 신규 유입 대비 계약 성사 건수</p>
          </div>
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <ComposedChart data={WEEKLY_TRENDS}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#475569' }}
                  domain={[0, 'dataMax + 4']}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  domain={[0, 'dataMax + 10']}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value, name, item) => {
                    if (name === 'leads') {
                      return [`${item?.payload?.leads ?? 0}건`, '신규 유입'];
                    }
                    return [`${value}건`, '계약 체결'];
                  }}
                />
                <Legend iconType="circle" formatter={(value) => <span className="text-xs font-medium text-slate-500">{value === 'leads' ? '신규 유입' : '계약 체결'}</span>} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="leadsLine"
                  stroke="#cbd5e1"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#cbd5e1' }}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                  name="leads"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="contracts"
                  stroke="#1e293b"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#1e293b' }}
                  activeDot={{ r: 6 }}
                  name="contracts"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Customer Segments & Churn (Mixed) */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* Segments */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="font-bold text-[#1e293b] text-sm mb-4">고객 유형 분포</h3>
            <div className="flex-1 flex flex-col justify-center gap-4">
              {CUSTOMER_SEGMENTS.map((seg, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-600">{seg.name}</span>
                    <span className="font-bold text-[#1e293b]">{seg.value}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ width: `${seg.value}%`, backgroundColor: seg.fill }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Churn Reasons */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="font-bold text-[#1e293b] text-sm mb-4">주요 이탈 사유 (Top 3)</h3>
            <div className="flex-1 space-y-3">
              {CHURN_REASONS.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="size-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-700 truncate">{item.reason}</div>
                    <div className="text-[10px] text-slate-400">{item.count}건</div>
                  </div>
                </div>
              ))}
              <button className="w-full mt-2 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 bg-slate-50 rounded border border-slate-100 transition-colors">
                전체 사유 보기
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ── S2+S3+S5 운영 모니터링 ── */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-bold text-[#1e293b]">운영 모니터링 (S2·S3·S5)</h2>
            <p className="text-xs text-slate-400 mt-0.5">건강보험 조회 · 신청 이탈률 · 상담 품질</p>
          </div>
          <div className="text-xs font-medium bg-emerald-50 text-emerald-700 px-2 py-1 rounded flex items-center gap-1">
            <Activity size={12} /> 실시간
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* S2: 건강보험 조회 현황 + 인증완료율 */}
          <div className="rounded-lg border border-slate-200 p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Shield size={14} className="text-blue-500" />
              S2. 건강보험 조회 현황
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-emerald-50 rounded-lg p-2.5 text-center">
                <div className="flex items-center justify-center gap-1">
                  <CheckCircle size={12} className="text-emerald-600" />
                  <span className="text-[10px] text-emerald-600 font-medium">조회 성공</span>
                </div>
                <p className="text-lg font-bold text-emerald-700 mt-1">847</p>
                <p className="text-[10px] text-emerald-600">85.2%</p>
              </div>
              <div className="bg-rose-50 rounded-lg p-2.5 text-center">
                <div className="flex items-center justify-center gap-1">
                  <XCircle size={12} className="text-rose-600" />
                  <span className="text-[10px] text-rose-600 font-medium">조회 실패</span>
                </div>
                <p className="text-lg font-bold text-rose-700 mt-1">147</p>
                <p className="text-[10px] text-rose-600">14.8%</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">인증 완료율</span>
                <span className="font-bold text-blue-600">82.4%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '82.4%' }} />
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">조회→신청 전환율</span>
                <span className="font-bold text-emerald-600">64.3%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '64.3%' }} />
              </div>
            </div>
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
              실패 사유 Top: 인증 시간초과(52%), 정보 불일치(31%), 시스템 오류(17%)
            </div>
          </div>

          {/* S3: 신청 이탈률 추적 */}
          <div className="rounded-lg border border-slate-200 p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-500" />
              S3. 신청 이탈률 추적
            </h3>
            {[
              { stage: '앱 진입 → 인증 시작', total: 1250, dropped: 188, rate: 15.0 },
              { stage: '인증 완료 → 조회 요청', total: 1062, dropped: 127, rate: 12.0 },
              { stage: '조회 결과 → 신청 제출', total: 935, dropped: 280, rate: 29.9 },
              { stage: '신청 제출 → 접수 완료', total: 655, dropped: 33, rate: 5.0 },
            ].map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-600 truncate pr-2">{item.stage}</span>
                  <span className={clsx('text-[10px] font-bold', item.rate > 20 ? 'text-rose-600' : item.rate > 10 ? 'text-amber-600' : 'text-emerald-600')}>
                    {item.rate}% ({item.dropped}명)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className={clsx('h-1.5 rounded-full', item.rate > 20 ? 'bg-rose-400' : item.rate > 10 ? 'bg-amber-400' : 'bg-emerald-400')}
                    style={{ width: `${item.rate}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="bg-amber-50 border border-amber-200 rounded px-2 py-1.5 text-[10px] text-amber-700 font-medium mt-1">
              핵심 이탈 구간: 조회 결과→신청 제출 (29.9%) — 예상 환급액 불만족 추정
            </div>
          </div>

          {/* S5: 팀장 실시간 품질 모니터링 */}
          <div className="rounded-lg border border-slate-200 p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Eye size={14} className="text-violet-500" />
              S5. 상담 품질 모니터링 (팀장용)
            </h3>
            <div className="space-y-2">
              {[
                { name: '김콜원', active: true, calls: 42, connected: 31, meetings: 8, score: 88 },
                { name: '이콜원', active: true, calls: 38, connected: 25, meetings: 5, score: 72 },
                { name: '박콜원', active: false, calls: 35, connected: 28, meetings: 7, score: 82 },
                { name: '최콜원', active: true, calls: 30, connected: 18, meetings: 3, score: 58 },
              ].map((staff, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div className={clsx('w-2 h-2 rounded-full flex-shrink-0', staff.active ? 'bg-emerald-500' : 'bg-slate-300')} />
                  <span className="text-[10px] font-bold text-slate-700 w-14 truncate">{staff.name}</span>
                  <div className="flex-1 grid grid-cols-4 gap-1 text-center text-[9px]">
                    <div>
                      <p className="text-slate-400">콜</p>
                      <p className="font-bold text-slate-700">{staff.calls}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">연결</p>
                      <p className="font-bold text-blue-600">{staff.connected}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">미팅</p>
                      <p className="font-bold text-emerald-600">{staff.meetings}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">QA</p>
                      <p className={clsx('font-bold', staff.score >= 80 ? 'text-emerald-600' : staff.score >= 60 ? 'text-amber-600' : 'text-rose-600')}>
                        {staff.score}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <div className="text-center">
                <p className="text-[9px] text-slate-400">팀 평균 연결률</p>
                <p className="text-sm font-bold text-blue-600">70.3%</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-slate-400">팀 평균 QA 점수</p>
                <p className="text-sm font-bold text-emerald-600">75점</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── S1 마케팅 트래킹 (UTM/Referrer/기기 + CPA/ROAS) ── */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-bold text-[#1e293b]">마케팅 트래킹 (S1)</h2>
            <p className="text-xs text-slate-400 mt-0.5">UTM · Referrer · 기기별 유입 분석 · CPA/ROAS 상세</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* UTM 파라미터 트래킹 */}
          <div className="rounded-lg border border-slate-200 p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Target size={14} className="text-blue-500" />
              UTM 파라미터 트래킹
            </h3>
            <div className="space-y-2">
              {[
                { param: 'utm_source', values: [
                  { value: 'meta', count: 225, pct: 34.6 },
                  { value: 'google', count: 180, pct: 27.7 },
                  { value: 'kakao', count: 120, pct: 18.5 },
                  { value: 'naver_blog', count: 75, pct: 11.5 },
                  { value: 'direct', count: 50, pct: 7.7 },
                ]},
                { param: 'utm_medium', values: [
                  { value: 'cpc', count: 380, pct: 58.5 },
                  { value: 'social', count: 145, pct: 22.3 },
                  { value: 'referral', count: 75, pct: 11.5 },
                  { value: 'organic', count: 50, pct: 7.7 },
                ]},
                { param: 'utm_campaign', values: [
                  { value: '2026_spring_refund', count: 280, pct: 43.1 },
                  { value: 'simple_claim_launch', count: 150, pct: 23.1 },
                  { value: 'family_plan', count: 120, pct: 18.5 },
                  { value: 'brand_awareness', count: 100, pct: 15.4 },
                ]},
              ].map((group) => (
                <div key={group.param} className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500">{group.param}</p>
                  {group.values.slice(0, 3).map((v) => (
                    <div key={v.value} className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-600 w-28 truncate">{v.value}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                        <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${v.pct}%` }} />
                      </div>
                      <span className="text-[9px] text-slate-500 w-12 text-right">{v.count}건</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Referrer / 기기별 트래킹 */}
          <div className="rounded-lg border border-slate-200 p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Activity size={14} className="text-teal-500" />
              Referrer · 기기별 유입
            </h3>

            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500">Referrer</p>
              {[
                { referrer: 'instagram.com', count: 185, pct: 28.5 },
                { referrer: 'blog.naver.com', count: 120, pct: 18.5 },
                { referrer: 'google.com', count: 95, pct: 14.6 },
                { referrer: 'kakao.com', count: 80, pct: 12.3 },
                { referrer: '(direct)', count: 170, pct: 26.2 },
              ].map((r) => (
                <div key={r.referrer} className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-600 w-28 truncate">{r.referrer}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                    <div className="bg-teal-400 h-1.5 rounded-full" style={{ width: `${r.pct}%` }} />
                  </div>
                  <span className="text-[9px] text-slate-500 w-12 text-right">{r.count}건</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1">
              <p className="text-[10px] font-bold text-slate-500">기기 유형</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { device: '모바일', count: 455, pct: 70, color: 'text-blue-600' },
                  { device: '데스크톱', count: 163, pct: 25, color: 'text-slate-600' },
                  { device: '태블릿', count: 32, pct: 5, color: 'text-amber-600' },
                ].map((d) => (
                  <div key={d.device} className="bg-slate-50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-slate-500">{d.device}</p>
                    <p className={clsx('text-sm font-bold', d.color)}>{d.pct}%</p>
                    <p className="text-[9px] text-slate-400">{d.count}건</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CPA / ROAS 상세 메트릭 */}
          <div className="rounded-lg border border-slate-200 p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <CreditCard size={14} className="text-emerald-500" />
              CPA / ROAS 상세 메트릭
            </h3>

            {/* 전체 요약 KPI */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-blue-600">전체 CPA</p>
                <p className="text-lg font-bold text-blue-700">₩13,500</p>
                <p className="text-[10px] text-blue-500">전월 ₩15,200 대비 -11%</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-2.5 text-center">
                <p className="text-[10px] text-emerald-600">전체 ROAS</p>
                <p className="text-lg font-bold text-emerald-700">320%</p>
                <p className="text-[10px] text-emerald-500">전월 280% 대비 +40%p</p>
              </div>
            </div>

            {/* 채널별 CPA/ROAS */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-500">채널별 효율</p>
              {[
                { channel: 'Meta', cpa: 12000, roas: 350, spend: 270, revenue: 945, efficiency: 'high' as const },
                { channel: 'Google', cpa: 18000, roas: 280, spend: 324, revenue: 907, efficiency: 'medium' as const },
                { channel: '카카오', cpa: 9500, roas: 420, spend: 114, revenue: 479, efficiency: 'high' as const },
                { channel: '소개', cpa: 0, roas: 0, spend: 0, revenue: 338, efficiency: 'organic' as const },
              ].map((ch) => {
                const effCfg = {
                  high: { label: '효율', bg: 'bg-emerald-50', text: 'text-emerald-700' },
                  medium: { label: '보통', bg: 'bg-amber-50', text: 'text-amber-700' },
                  low: { label: '비효율', bg: 'bg-rose-50', text: 'text-rose-700' },
                  organic: { label: '무료', bg: 'bg-blue-50', text: 'text-blue-700' },
                }[ch.efficiency];
                return (
                  <div key={ch.channel} className="flex items-center justify-between p-2 rounded border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-700 w-12">{ch.channel}</span>
                      <span className={clsx('px-1 py-0.5 rounded text-[9px] font-bold', effCfg.bg, effCfg.text)}>{effCfg.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[9px]">
                      <span className="text-slate-500">CPA <span className="font-bold text-slate-700">{ch.cpa > 0 ? `₩${(ch.cpa / 1000).toFixed(1)}K` : '-'}</span></span>
                      <span className="text-slate-500">ROAS <span className="font-bold text-emerald-600">{ch.roas > 0 ? `${ch.roas}%` : '∞'}</span></span>
                      <span className="text-slate-500">매출 <span className="font-bold text-slate-700">₩{ch.revenue}만</span></span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 월별 ROAS 추세 */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 mb-1.5">월별 ROAS 추세</p>
              <div className="flex items-end gap-1 h-12">
                {[
                  { month: '10월', roas: 220 },
                  { month: '11월', roas: 250 },
                  { month: '12월', roas: 240 },
                  { month: '1월', roas: 280 },
                  { month: '2월', roas: 290 },
                  { month: '3월', roas: 320 },
                ].map((m) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5">
                    <div
                      className={clsx('w-full rounded-t', m.roas >= 300 ? 'bg-emerald-400' : m.roas >= 250 ? 'bg-blue-400' : 'bg-slate-300')}
                      style={{ height: `${(m.roas / 350) * 100}%` }}
                    />
                    <span className="text-[8px] text-slate-400">{m.month.slice(0, 2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, unit, trend, trendUp, inverseTrend, icon }: any) {
  // inverseTrend: true means "Lower is Better" (e.g. Churn Rate)
  // trendUp: true means the number increased numerically.
  
  // Display Logic:
  // If inverseTrend is false (default): Increase = Green (Good), Decrease = Red (Bad)
  // If inverseTrend is true (e.g. Churn): Increase = Red (Bad), Decrease = Green (Good)

  let isPositive = false;
  if (inverseTrend) {
    isPositive = !trend.startsWith('+'); // If churn went down (-), it's positive
  } else {
    isPositive = trend.startsWith('+'); // If revenue went up (+), it's positive
  }

  const trendColor = isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50';
  const TrendIcon = trend.startsWith('+') ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-[120px]">
      <div className="flex justify-between items-start">
        <div className="text-sm font-medium text-slate-500">{title}</div>
        <div className={`p-1.5 rounded-lg bg-slate-50`}>{icon}</div>
      </div>
      <div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-bold text-[#1e293b] tracking-tight">{value}</span>
          {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className={clsx("text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5", trendColor)}>
            <TrendIcon size={12} /> {trend}
          </span>
          <span className="text-[10px] text-slate-400">vs 지난달</span>
        </div>
      </div>
    </div>
  );
}
