/**
 * navConfig.ts
 * 역할별 네비게이션 설정
 * 각 팀 역할에 따라 사이드바 메뉴를 필터링
 */
import type { TeamRole } from '@/app/journey/types';

export type NavItem =
  | 'dashboard'
  | 'customers'
  | 'leads'
  | 'requests'
  | 'consultation'
  | 'tm-first'
  | 'tm-second'
  | 'tm-checklist'
  | 'handoff'
  | 'meeting-schedule'
  | 'meeting-all'
  | 'meeting-refund'
  | 'meeting-simple'
  | 'meeting-pre-analysis'
  | 'meeting-on-site'
  | 'meeting-contract-close'
  | 'contracts'
  | 'claims-all'
  | 'claims-refund'
  | 'claims-simple'
  | 'claims-issuance'
  | 'claims-receipt'
  | 'claims-unpaid'
  | 'claims-doc-issuance'
  | 'claims-final'
  | 'issuance-master'
  | 'issuance-manager'
  | 'issuance-staff'
  | 'payment-confirm'
  | 'aftercare'
  | 'referral-management'
  | 'simple-claims'
  | 'voc'
  | 'compliance'
  | 'dropoff'
  | 'daily-report'
  | 'documents'
  | 'settings';

export interface NavMenuChild {
  navItem: NavItem;
  label: string;
}

export interface NavMenuSection {
  id: string;
  label: string;
  icon: string; // lucide icon name
  navItem?: NavItem; // direct nav (no children)
  children?: NavMenuChild[];
}

/** 전체 메뉴 구조 (관리자 기준) */
export const FULL_NAV_SECTIONS: NavMenuSection[] = [
  { id: 'dashboard', label: '대시보드', icon: 'PieChart', navItem: 'dashboard' },
  { id: 'customers', label: '고객 관리', icon: 'Users', navItem: 'customers' },
  { id: 'leads', label: 'DB 분류/배정', icon: 'Database', navItem: 'leads' },
  { id: 'requests', label: '접수 관리', icon: 'ListTodo', navItem: 'requests' },
  {
    id: 'consultation',
    label: '상담/TM',
    icon: 'Headphones',
    children: [
      { navItem: 'consultation', label: '상담 전체' },
      { navItem: 'tm-first', label: '1차 TM' },
      { navItem: 'tm-second', label: '2차 TM' },
      { navItem: 'tm-checklist', label: 'TM 체크리스트' },
    ],
  },
  { id: 'handoff', label: '미팅 인계', icon: 'ArrowRightLeft', navItem: 'handoff' },
  {
    id: 'meeting',
    label: '미팅/계약',
    icon: 'CalendarDays',
    children: [
      { navItem: 'meeting-schedule', label: '미팅 일정' },
      { navItem: 'meeting-all', label: '미팅 전체' },
      { navItem: 'meeting-pre-analysis', label: '사전 분석' },
      { navItem: 'meeting-on-site', label: '미팅 실행' },
      { navItem: 'meeting-contract-close', label: '계약 체결' },
    ],
  },
  { id: 'contracts', label: '계약 목록', icon: 'Briefcase', navItem: 'contracts' },
  {
    id: 'claims',
    label: '청구/분석',
    icon: 'FileCheck',
    children: [
      { navItem: 'claims-all', label: '청구 전체' },
      { navItem: 'claims-receipt', label: '청구 접수' },
      { navItem: 'claims-unpaid', label: '미지급금 분석' },
      { navItem: 'claims-doc-issuance', label: '서류 발급' },
      { navItem: 'claims-final', label: '최종 분석' },
    ],
  },
  {
    id: 'issuance',
    label: '발급 관리',
    icon: 'Stamp',
    children: [
      { navItem: 'issuance-master', label: '발급 마스터' },
      { navItem: 'issuance-manager', label: '발급 관리자' },
      { navItem: 'issuance-staff', label: '발급 담당자' },
    ],
  },
  {
    id: 'payment',
    label: '지급/사후',
    icon: 'Banknote',
    children: [
      { navItem: 'payment-confirm', label: '지급 확인' },
      { navItem: 'aftercare', label: '사후 관리' },
    ],
  },
  {
    id: 'growth',
    label: 'Growth Loop',
    icon: 'Repeat',
    children: [
      { navItem: 'referral-management', label: '소개 관리' },
    ],
  },
  { id: 'simple-claims', label: '간편청구', icon: 'Zap', navItem: 'simple-claims' },
  { id: 'voc', label: 'CS / VOC', icon: 'MessageSquare', navItem: 'voc' },
  { id: 'compliance', label: '준법/개인정보', icon: 'Shield', navItem: 'compliance' },
  { id: 'dropoff', label: '이탈 로그', icon: 'ScrollText', navItem: 'dropoff' },
  { id: 'daily-report', label: '일일 보고서', icon: 'BarChart3', navItem: 'daily-report' },
  { id: 'documents', label: '문서 관리', icon: 'Files', navItem: 'documents' },
  { id: 'settings', label: '설정', icon: 'Settings', navItem: 'settings' },
];

/** 역할별 보이는 메뉴 섹션 ID */
const ROLE_VISIBLE_SECTIONS: Record<TeamRole, string[]> = {
  call_member: ['dashboard', 'requests', 'consultation', 'handoff', 'simple-claims', 'daily-report'],
  call_lead: ['dashboard', 'customers', 'leads', 'requests', 'consultation', 'handoff', 'simple-claims', 'daily-report'],
  sales_member: ['dashboard', 'meeting', 'contracts', 'documents'],
  sales_lead: ['dashboard', 'customers', 'leads', 'meeting', 'contracts', 'daily-report', 'documents'],
  claims_member: ['dashboard', 'claims', 'issuance', 'payment', 'simple-claims', 'documents'],
  claims_lead: ['dashboard', 'customers', 'claims', 'issuance', 'payment', 'simple-claims', 'daily-report', 'documents'],
  cs: ['dashboard', 'customers', 'requests', 'voc', 'dropoff', 'documents'],
  compliance: ['dashboard', 'customers', 'requests', 'compliance', 'documents', 'settings'],
  admin: FULL_NAV_SECTIONS.map(s => s.id),
};

/** 역할에 맞는 네비게이션 섹션 반환 */
export function getNavSectionsForRole(role: TeamRole): NavMenuSection[] {
  const visibleIds = ROLE_VISIBLE_SECTIONS[role];
  return FULL_NAV_SECTIONS.filter(section => visibleIds.includes(section.id));
}
