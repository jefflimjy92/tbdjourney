/**
 * RoleContext.tsx
 * 역할 기반 접근 제어를 위한 React Context
 * 현재는 로컬 상태로 역할 전환을 지원 (향후 인증 시스템 연동)
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { TeamRole } from '@/app/journey/types';

export const ROLE_LABELS: Record<TeamRole, string> = {
  call_member: '상담팀원',
  call_lead: '상담팀장',
  sales_member: '영업팀원',
  sales_lead: '영업팀장',
  claims_member: '청구팀원',
  claims_lead: '청구팀장',
  cs: 'CS팀',
  compliance: '준법감시',
  admin: '관리자',
};

export const ROLE_GROUPS: { group: string; roles: TeamRole[] }[] = [
  { group: '상담팀', roles: ['call_member', 'call_lead'] },
  { group: '영업팀', roles: ['sales_member', 'sales_lead'] },
  { group: '청구팀', roles: ['claims_member', 'claims_lead'] },
  { group: '기타', roles: ['cs', 'compliance', 'admin'] },
];

interface RoleContextValue {
  currentRole: TeamRole;
  setRole: (role: TeamRole) => void;
  roleLabel: string;
  isAdmin: boolean;
  isLead: boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRole] = useState<TeamRole>('admin');

  const setRole = useCallback((role: TeamRole) => {
    setCurrentRole(role);
  }, []);

  const value = useMemo(() => ({
    currentRole,
    setRole,
    roleLabel: ROLE_LABELS[currentRole],
    isAdmin: currentRole === 'admin',
    isLead: currentRole === 'call_lead' || currentRole === 'sales_lead' || currentRole === 'claims_lead' || currentRole === 'admin',
  }), [currentRole, setRole]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) throw new Error('RoleProvider is missing');
  return context;
}
