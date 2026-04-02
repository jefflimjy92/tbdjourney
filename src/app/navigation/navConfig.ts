/**
 * navConfig.ts
 * 역할별 네비게이션 설정
 * 각 팀 역할에 따라 사이드바 메뉴를 필터링
 */
import type { TeamRole } from '@/app/journey/types';

export type NavItem =
  | 'dashboard'
  | 'requests'
  | 'customers'
  | 'leads'
  | 'case-detail'
  | 'consultation'
  | 'handoff'
  | 'meeting-all'
  | 'meeting-schedule'
  | 'contracts'
  | 'claims-all'
  | 'issuance-master'
  | 'simple-claims'
  | 'dropoff'
  | 'daily-report'
  | 'settings';

export const PROD_TAB_ITEMS = [
  'dashboard',
  'requests',
  'customers',
  'leads',
  'case-detail',
  'consultation',
  'handoff',
  'meeting-all',
  'meeting-schedule',
  'contracts',
  'claims-all',
  'simple-claims',
  'issuance-master',
  'daily-report',
  'dropoff',
  'settings',
] as const satisfies readonly NavItem[];

export const LEGACY_DEBUG_TAB_ITEMS = [
  'tm-first',
  'tm-second',
  'tm-checklist',
  'meeting-pre-analysis',
  'meeting-on-site',
  'meeting-contract-close',
  'claims-receipt',
  'claims-unpaid',
  'claims-doc-issuance',
  'claims-final',
  'claims-issuance',
  'issuance-manager',
  'issuance-staff',
  'payment-confirm',
  'aftercare',
  'referral-management',
  'voc',
  'compliance',
  'admin-operations',
  'documents',
] as const;

export type LegacyDebugTabItem = (typeof LEGACY_DEBUG_TAB_ITEMS)[number];
export type AppTab = NavItem | LegacyDebugTabItem;

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

/** 전체 메뉴 구조 (관리자 기준, 2-depth 그룹) */
export const FULL_NAV_SECTIONS: NavMenuSection[] = [
  // 고객 관리 (하위: 고객 관리 / 접수 관리)
  {
    id: 'customer-group',
    label: '고객 관리',
    icon: 'Users',
    children: [
      { navItem: 'customers', label: '고객 관리' },
      { navItem: 'requests', label: '접수 관리' },
    ],
  },

  // 상담팀 (기존 콜팀)
  {
    id: 'call-group',
    label: '상담팀',
    icon: 'Headphones',
    children: [
      { navItem: 'leads', label: 'DB 분류/배정' },
      { navItem: 'consultation', label: '상담/TM' },
    ],
  },

  // 영업팀
  {
    id: 'sales-group',
    label: '영업팀',
    icon: 'Briefcase',
    children: [
      { navItem: 'handoff', label: '미팅 배정 관리' },
      { navItem: 'meeting-all', label: '미팅 관리' },
      { navItem: 'meeting-schedule', label: '미팅 일정' },
      { navItem: 'contracts', label: '계약 목록' },
    ],
  },

  // 청구팀
  {
    id: 'claims-group',
    label: '청구팀',
    icon: 'FileCheck',
    children: [
      { navItem: 'claims-all', label: '3년 환급' },
      { navItem: 'simple-claims', label: '간편청구' },
      { navItem: 'issuance-master', label: '서류발급' },
    ],
  },

  { id: 'dashboard', label: '대시보드', icon: 'PieChart', navItem: 'dashboard' },
  { id: 'daily-report', label: '일일 보고서', icon: 'BarChart3', navItem: 'daily-report' },
  { id: 'dropoff', label: '이탈 로그', icon: 'ScrollText', navItem: 'dropoff' },
  { id: 'settings', label: '설정', icon: 'Settings', navItem: 'settings' },
];

/** 역할별 보이는 NavItem 목록 (그룹 내 개별 항목 수준 필터링) */
const ROLE_VISIBLE_ITEMS: Record<TeamRole, NavItem[] | 'all'> = {
  call_member:  ['dashboard', 'consultation', 'daily-report'],
  call_lead:    ['dashboard', 'leads', 'consultation', 'daily-report'],
  sales_member: ['dashboard', 'meeting-all', 'meeting-schedule', 'contracts'],
  sales_lead:   ['dashboard', 'handoff', 'meeting-all', 'meeting-schedule', 'contracts', 'daily-report'],
  claims_member: ['dashboard', 'claims-all', 'simple-claims', 'issuance-master'],
  claims_lead:  ['dashboard', 'claims-all', 'simple-claims', 'issuance-master', 'daily-report'],
  cs:           ['dashboard', 'customers', 'requests', 'dropoff'],
  compliance:   ['dashboard', 'customers', 'requests', 'settings'],
  admin:        'all',
};

/** 역할에 맞는 네비게이션 섹션 반환 (그룹 내 children도 필터링) */
export function getNavSectionsForRole(role: TeamRole): NavMenuSection[] {
  const allowed = ROLE_VISIBLE_ITEMS[role];

  return FULL_NAV_SECTIONS
    .map((section) => {
      // Flat item
      if (section.navItem) {
        if (allowed === 'all' || allowed.includes(section.navItem)) return section;
        return null;
      }
      // Group with children — 역할별 children 필터링
      if (section.children) {
        const visibleChildren =
          allowed === 'all'
            ? section.children
            : section.children.filter((c) => (allowed as NavItem[]).includes(c.navItem));
        if (visibleChildren.length === 0) return null;
        return { ...section, children: visibleChildren };
      }
      return null;
    })
    .filter((s): s is NavMenuSection => s !== null);
}
