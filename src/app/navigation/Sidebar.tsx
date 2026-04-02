/**
 * Sidebar.tsx
 * App.tsx에서 분리된 사이드바 컴포넌트
 * 역할 기반 메뉴 필터링 + 역할 선택 드롭다운 포함
 */
import React, { useEffect, useState } from 'react';
import {
  ClipboardList,
  Users,
  Headphones,
  CalendarDays,
  FileCheck,
  Files,
  Settings,
  Menu,
  ListTodo,
  PieChart,
  Briefcase,
  ScrollText,
  ChevronDown,
  ChevronRight,
  Database,
  ArrowRightLeft,
  BarChart3,
  Stamp,
  Banknote,
  Repeat,
  Zap,
  MessageSquare,
  Shield,
} from 'lucide-react';
import clsx from 'clsx';
import { useRole, ROLE_LABELS, ROLE_GROUPS } from '@/app/auth/RoleContext';
import { getNavSectionsForRole, type AppTab, type NavItem, type NavMenuSection } from './navConfig';
import type { TeamRole } from '@/app/journey/types';

const ICON_MAP: Record<string, React.ReactNode> = {
  PieChart: <PieChart size={20} />,
  ClipboardList: <ClipboardList size={20} />,
  Users: <Users size={20} />,
  Database: <Database size={20} />,
  ListTodo: <ListTodo size={20} />,
  Headphones: <Headphones size={20} />,
  ArrowRightLeft: <ArrowRightLeft size={20} />,
  CalendarDays: <CalendarDays size={20} />,
  Briefcase: <Briefcase size={20} />,
  FileCheck: <FileCheck size={20} />,
  Stamp: <Stamp size={20} />,
  ScrollText: <ScrollText size={20} />,
  BarChart3: <BarChart3 size={20} />,
  Files: <Files size={20} />,
  Settings: <Settings size={20} />,
  Banknote: <Banknote size={20} />,
  Repeat: <Repeat size={20} />,
  Zap: <Zap size={20} />,
  MessageSquare: <MessageSquare size={20} />,
  Shield: <Shield size={20} />,
};

interface SidebarProps {
  activeTab: AppTab;
  isSidebarOpen: boolean;
  onTabChange: (tab: NavItem) => void;
  onToggleSidebar: () => void;
}

export function Sidebar({ activeTab, isSidebarOpen, onTabChange, onToggleSidebar }: SidebarProps) {
  const { currentRole, setRole, roleLabel } = useRole();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const sections = getNavSectionsForRole(currentRole);
  const canOverrideRole = import.meta.env.DEV;

  return (
    <aside
      className={clsx(
        'fixed inset-y-0 left-0 z-20 flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300 lg:static lg:inset-auto lg:shrink-0',
        isSidebarOpen
          ? 'translate-x-0 w-72 shadow-xl lg:w-60 lg:shadow-none'
          : '-translate-x-full w-72 lg:w-16 lg:translate-x-0',
      )}
    >
      {/* Logo Area */}
      <div className={clsx('flex items-center h-16 border-b border-slate-100 transition-all', isSidebarOpen ? 'px-6' : 'justify-center px-0')}>
        <div className="size-8 rounded bg-[#1e293b] flex items-center justify-center font-bold text-white shrink-0">
          TB
        </div>
        {isSidebarOpen && (
          <span className="ml-3 font-bold text-lg tracking-tight text-[#1e293b] whitespace-nowrap">더바다 Ops</span>
        )}
      </div>

      {/* Role Selector */}
      {isSidebarOpen && canOverrideRole && (
        <div className="px-3 pt-3 pb-1 relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm hover:bg-slate-100 transition-colors"
          >
            <span className="text-xs text-slate-500">역할:</span>
            <span className="font-medium text-[#1e293b] ml-1 truncate">{roleLabel}</span>
            <ChevronDown size={14} className="text-slate-400 ml-auto shrink-0" />
          </button>
          {roleDropdownOpen && (
            <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
              {ROLE_GROUPS.map((group) => (
                <div key={group.group}>
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {group.group}
                  </div>
                  {group.roles.map((role) => (
                    <button
                      key={role}
                      onClick={() => { setRole(role); setRoleDropdownOpen(false); }}
                      className={clsx(
                        'w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors',
                        currentRole === role ? 'text-[#0f766e] font-bold bg-emerald-50/50' : 'text-slate-700',
                      )}
                    >
                      {ROLE_LABELS[role]}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isSidebarOpen && !canOverrideRole && (
        <div className="px-3 pt-3 pb-1">
          <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <span className="text-xs text-slate-500">역할:</span>
            <span className="ml-2 font-medium text-[#1e293b]">{roleLabel}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <ul className="space-y-0.5 px-3">
          {sections.map((section, idx) => {
            const icon = ICON_MAP[section.icon] || <ListTodo size={20} />;

            // Add divider before analysis/report sections
            const prevSection = sections[idx - 1];
            const needsDivider = prevSection && (
              (section.id === 'dropoff' || section.id === 'daily-report' || section.id === 'documents' || section.id === 'settings') &&
              !['dropoff', 'daily-report', 'documents', 'settings'].includes(prevSection.id)
            );

            return (
              <React.Fragment key={section.id}>
                {needsDivider && <div className="my-2" />}
                {section.children ? (
                  <SidebarGroup
                    icon={icon}
                    label={section.label}
                    isOpen={isSidebarOpen}
                    activeIds={section.children.map((c) => c.navItem)}
                    currentTab={activeTab}
                    onToggle={onToggleSidebar}
                  >
                    {section.children.map((child) => (
                      <SidebarSubItem
                        key={child.navItem}
                        label={child.label}
                        isActive={activeTab === child.navItem}
                        onClick={() => onTabChange(child.navItem)}
                      />
                    ))}
                  </SidebarGroup>
                ) : (
                  <SidebarItem
                    icon={icon}
                    label={section.label}
                    isActive={activeTab === section.navItem}
                    isOpen={isSidebarOpen}
                    onClick={() => onTabChange(section.navItem!)}
                  />
                )}
              </React.Fragment>
            );
          })}
        </ul>
      </nav>

      {/* Footer Toggle */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={onToggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>
    </aside>
  );
}

// ─── Sub-components (extracted from App.tsx) ───

function SidebarItem({
  icon,
  label,
  isActive,
  isOpen,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <li className="mb-0.5">
      <button
        onClick={onClick}
        className={clsx(
          'w-full flex items-center px-3 py-2 rounded-lg transition-all duration-200 group relative',
          isActive ? 'bg-slate-100 text-[#1e293b] font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-[#1e293b]',
          !isOpen && 'justify-center',
        )}
      >
        <span className={clsx('shrink-0', isActive ? 'text-[#1e293b]' : 'text-slate-400 group-hover:text-[#1e293b]')}>
          {icon}
        </span>
        {isOpen && <span className="ml-3 truncate text-sm whitespace-nowrap">{label}</span>}
        {!isOpen && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#1e293b] text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
            {label}
          </div>
        )}
      </button>
    </li>
  );
}

function SidebarGroup({
  icon,
  label,
  isOpen,
  activeIds,
  currentTab,
  children,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
  activeIds: string[];
  currentTab: AppTab;
  children: React.ReactNode;
  onToggle: () => void;
}) {
  const isActiveGroup = activeIds.includes(currentTab);
  const [expanded, setExpanded] = useState(isActiveGroup);

  useEffect(() => {
    if (isActiveGroup) setExpanded(true);
  }, [isActiveGroup]);

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) onToggle();
    setExpanded(!expanded);
  };

  const handleMainClick = () => {
    if (!isOpen) {
      onToggle();
      setExpanded(true);
      return;
    }
    setExpanded((prev) => !prev);
  };

  return (
    <li className="mb-0.5">
      <div
        className={clsx(
          'w-full flex items-center px-3 py-2 rounded-lg transition-all duration-200 group relative cursor-pointer',
          isActiveGroup ? 'bg-slate-100 text-[#1e293b] font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-[#1e293b]',
        )}
        onClick={handleMainClick}
      >
        <span className={clsx('shrink-0', isActiveGroup ? 'text-[#1e293b]' : 'text-slate-400 group-hover:text-[#1e293b]')}>
          {icon}
        </span>
        {isOpen && (
          <>
            <span className="ml-3 truncate text-sm whitespace-nowrap flex-1 text-left">{label}</span>
            <button
              onClick={handleExpandClick}
              className="shrink-0 text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200/50"
            >
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          </>
        )}
        {!isOpen && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#1e293b] text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg">
            {label}
          </div>
        )}
      </div>
      <div
        className={clsx(
          'overflow-hidden transition-all duration-300 ease-in-out',
          expanded && isOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <ul className="mt-0.5 space-y-0.5">{children}</ul>
      </div>
    </li>
  );
}

function SidebarSubItem({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <li>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={clsx(
          'w-full flex items-center pl-11 pr-3 py-2 text-xs transition-colors rounded-lg',
          isActive ? 'text-[#1e293b] font-bold bg-slate-50' : 'text-slate-500 hover:text-[#1e293b] hover:bg-slate-50',
        )}
      >
        <span className="truncate">{label}</span>
      </button>
    </li>
  );
}
