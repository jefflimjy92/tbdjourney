import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building,
  FileText,
  MapPin,
  Search,
  UserPlus,
  Users,
} from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useIssuanceOperations } from '@/app/issuance/IssuanceContext';
import { ListPeriodControls } from '@/app/components/ListPeriodControls';
import { RegionMultiSelect } from '@/app/components/issuance/RegionMultiSelect';
import { StaffPerformanceBoard } from '@/app/components/issuance/StaffPerformanceBoard';
import { StaffPerformanceTable } from '@/app/components/issuance/StaffPerformanceTable';
import { AssignmentStatusBadge, TaskStatusBadge } from '@/app/components/issuance/IssuanceStatusBadge';
import { IssuanceProgressBar } from '@/app/components/issuance/IssuanceProgressBar';
import {
  applyPerformancePeriodToRows,
  filterRowsByPeriodAndType,
  getDefaultCustomPeriodRange,
  getPerformanceCompletedLabel,
  getPerformancePeriodRange,
  getRowsDateBounds,
  getRowsDateBoundsByType,
  type PerformancePeriodPreset,
} from '@/app/issuance/performancePeriodUtils';
import { compareBySortKey, matchesRegionSelections, summarizeRegionSelections, UNCLASSIFIED_REGION } from '@/app/issuance/regionUtils';
import type {
  AutoAssignmentPlan,
  IssuanceLocationSortKey,
  IssuanceTask,
  IssuanceTaskStatus,
  RegionSelection,
  StaffAssignmentStatus,
} from '@/app/types/issuance';

type TabFilter = 'all' | 'unassigned' | 'in_progress' | 'completed';
type AssignmentMode = 'auto' | 'manual';
type StaffViewLayout = 'table' | 'board';
type LocationDateType = 'assignedAt' | 'completedAt';
type IssuanceViewMode = 'locations' | 'customers' | 'customer-detail' | 'location-detail' | 'people';

interface IssuanceMasterProps {
  initialClaimId?: string | null;
  onNavigate?: (target: string) => void;
}

interface MasterLocationRow {
  taskId: string;
  claimId: string;
  customerName: string;
  customerPhone: string;
  customerSSN: string;
  customerAddress: string;
  locationId: string;
  locationName: string;
  locationAddress: string;
  regionLevel1?: string;
  regionLevel2?: string;
  regionLevel3?: string;
  visitPeriod: string;
  type: IssuanceTask['locations'][number]['type'];
  status: IssuanceTaskStatus;
  requiredDocCount: number;
  assignedManagerId?: string;
  assignedManagerName?: string;
  assignedManagerAt?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignedStaffPhone?: string;
  completedAt?: string;
  boardStatus: TabFilter;
}

interface CustomerLocationRow {
  locationId: string;
  locationName: string;
  locationAddress: string;
  visitPeriod: string;
  type: IssuanceTask['locations'][number]['type'];
  requiredDocNames: string[];
  completedDocNames: string[];
  completedDocCount: number;
  totalDocCount: number;
  assignedStaffName?: string;
  assignedStaffPhone?: string;
  assignedAt?: string;
  completedAt?: string;
  assignmentStatus?: StaffAssignmentStatus;
  locationStatus: IssuanceTaskStatus;
}

interface CustomerSummaryRow {
  taskId: string;
  claimId: string;
  customerName: string;
  customerPhone: string;
  customerSSN: string;
  customerAddress: string;
  locationCount: number;
  completedLocationCount: number;
  requiredDocCount: number;
  completedDocCount: number;
  staffNames: string[];
  latestAssignedAt?: string;
  latestCompletedAt?: string;
  locations: CustomerLocationRow[];
}

export function IssuanceMaster({ initialClaimId, onNavigate }: IssuanceMasterProps) {
  const {
    tasks,
    assignments,
    staffMembers,
    getLocationAssignment,
    getStaffPerformanceRows,
    getAssignableStaffCandidates,
    getAutoAssignmentPlan,
    assignStaffToLocations,
  } = useIssuanceOperations();
  const [activeFilter, setActiveFilter] = useState<TabFilter>('unassigned');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<IssuanceViewMode>('locations');
  const defaultCustomPeriodRange = useMemo(() => getDefaultCustomPeriodRange(), []);
  const [staffViewLayout, setStaffViewLayout] = useState<StaffViewLayout>('board');
  const [performancePeriodPreset, setPerformancePeriodPreset] = useState<PerformancePeriodPreset>('this_month');
  const [customPeriodStartDate, setCustomPeriodStartDate] = useState(defaultCustomPeriodRange.startDate);
  const [customPeriodEndDate, setCustomPeriodEndDate] = useState(defaultCustomPeriodRange.endDate);
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedCustomerTaskId, setSelectedCustomerTaskId] = useState<string | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode | null>(null);
  const [assignStaffId, setAssignStaffId] = useState('');
  const [selectedAutoStaffIds, setSelectedAutoStaffIds] = useState<string[]>([]);
  const [regionSelections, setRegionSelections] = useState<RegionSelection[]>([]);
  const [sortKey, setSortKey] = useState<IssuanceLocationSortKey>('unassigned_first');
  const [locationPeriodPreset, setLocationPeriodPreset] = useState<PerformancePeriodPreset>('all');
  const [locationCustomStartDate, setLocationCustomStartDate] = useState(defaultCustomPeriodRange.startDate);
  const [locationCustomEndDate, setLocationCustomEndDate] = useState(defaultCustomPeriodRange.endDate);
  const [locationDateType, setLocationDateType] = useState<LocationDateType>('assignedAt');

  const baseTasks = useMemo(
    () => (initialClaimId ? tasks.filter((task) => task.claimId === initialClaimId) : tasks),
    [initialClaimId, tasks]
  );

  const locationRows = useMemo<MasterLocationRow[]>(
    () =>
      baseTasks.flatMap((task) =>
        task.locations.map((location) => {
          const assignment = getLocationAssignment(location.id);
          const boardStatus: TabFilter =
            assignment?.status === 'completed' || location.status === 'completed'
              ? 'completed'
              : assignment
                ? 'in_progress'
                : 'unassigned';
          return {
            taskId: task.id,
            claimId: task.claimId,
            customerName: task.customerName,
            customerPhone: task.customerPhone,
            customerSSN: task.customerSSN,
            customerAddress: task.customerAddress,
            locationId: location.id,
            locationName: location.name,
            locationAddress: location.address,
            regionLevel1: location.regionLevel1,
            regionLevel2: location.regionLevel2,
            regionLevel3: location.regionLevel3,
            visitPeriod: location.visitPeriod,
            type: location.type,
            status: location.status,
            requiredDocCount: location.requiredDocs.length,
            assignedManagerId: location.assignedManagerId,
            assignedManagerName: location.assignedManagerName,
            assignedManagerAt: location.assignedManagerAt,
            assignedStaffId: assignment?.staffId,
            assignedStaffName: assignment?.staffName,
            assignedStaffPhone: assignment?.staffPhone,
            completedAt: assignment?.completedAt,
            boardStatus,
          };
        })
      ),
    [baseTasks, getLocationAssignment]
  );

  const stats = useMemo(
    () => ({
      total: locationRows.length,
      unassigned: locationRows.filter((row) => row.boardStatus === 'unassigned').length,
      inProgress: locationRows.filter((row) => row.boardStatus === 'in_progress').length,
      completed: locationRows.filter((row) => row.boardStatus === 'completed').length,
    }),
    [locationRows]
  );

  const baseFilteredRows = useMemo(() => {
    let result = locationRows;

    if (activeFilter !== 'all') {
      result = result.filter((row) => row.boardStatus === activeFilter);
    }

    if (!searchQuery.trim()) {
      return result;
    }

    const query = searchQuery.trim().toLowerCase();
    return result
      .filter((row) =>
        [
          row.customerName,
          row.locationName,
          row.locationAddress,
          row.assignedManagerName,
          row.regionLevel1,
          row.regionLevel2,
          row.regionLevel3,
        ]
        .join(' ')
        .toLowerCase()
        .includes(query)
      );
  }, [activeFilter, locationRows, searchQuery]);

  const locationPeriodRange = useMemo(
    () =>
      getPerformancePeriodRange(
        locationPeriodPreset,
        locationCustomStartDate,
        locationCustomEndDate,
        new Date(),
        getRowsDateBoundsByType(
          baseFilteredRows,
          locationDateType,
          {
            assignedAt: (row) => row.assignedManagerAt,
            completedAt: (row) => row.completedAt,
          },
          defaultCustomPeriodRange
        )
      ),
    [
      baseFilteredRows,
      defaultCustomPeriodRange,
      locationCustomEndDate,
      locationCustomStartDate,
      locationDateType,
      locationPeriodPreset,
    ]
  );

  const filteredRows = useMemo(() => {
    const rowsByPeriod = filterRowsByPeriodAndType(baseFilteredRows, locationPeriodRange, locationDateType, {
      assignedAt: (row) => row.assignedManagerAt,
      completedAt: (row) => row.completedAt,
    });
    const missingAssignedRows =
      locationDateType === 'assignedAt'
        ? baseFilteredRows.filter((row) => !row.assignedManagerAt)
        : [];
    const dedupedRows = Array.from(new Map([...rowsByPeriod, ...missingAssignedRows].map((row) => [row.locationId, row])).values());
    const result = dedupedRows.filter((row) => matchesRegionSelections(row, regionSelections));
    return [...result].sort((left, right) => compareBySortKey(left, right, sortKey));
  }, [baseFilteredRows, locationDateType, locationPeriodRange, regionSelections, sortKey]);

  const customerRows = useMemo<CustomerSummaryRow[]>(() => {
    const rowsByTask = new Map<string, MasterLocationRow[]>();
    filteredRows.forEach((row) => {
      const current = rowsByTask.get(row.taskId);
      if (current) {
        current.push(row);
      } else {
        rowsByTask.set(row.taskId, [row]);
      }
    });

    return Array.from(rowsByTask.entries())
      .map(([taskId, matchedRows]) => {
        const task = baseTasks.find((item) => item.id === taskId);
        if (!task) {
          return null;
        }

        const locations = task.locations.map((location) => {
          const assignment = getLocationAssignment(location.id);
          const docs = assignment?.requiredDocs ?? location.requiredDocs;
          const completedDocs = docs.filter((doc) => doc.status === 'confirmed');
          return {
            locationId: location.id,
            locationName: location.name,
            locationAddress: location.address,
            visitPeriod: location.visitPeriod,
            type: location.type,
            requiredDocNames: docs.map((doc) => doc.name),
            completedDocNames: completedDocs.map((doc) => doc.name),
            completedDocCount: completedDocs.length,
            totalDocCount: docs.length,
            assignedStaffName: assignment?.staffName,
            assignedStaffPhone: assignment?.staffPhone,
            assignedAt: assignment?.assignedAt ?? location.assignedManagerAt,
            completedAt: assignment?.completedAt,
            assignmentStatus: assignment?.status as StaffAssignmentStatus | undefined,
            locationStatus: location.status,
          };
        });

        const latestAssignedAt = locations
          .map((location) => location.assignedAt)
          .filter(Boolean)
          .sort()
          .at(-1);
        const latestCompletedAt = locations
          .map((location) => location.completedAt)
          .filter(Boolean)
          .sort()
          .at(-1);

        return {
          taskId,
          claimId: task.claimId,
          customerName: task.customerName,
          customerPhone: task.customerPhone,
          customerSSN: task.customerSSN,
          customerAddress: task.customerAddress,
          locationCount: locations.length,
          completedLocationCount: locations.filter((location) => location.locationStatus === 'completed').length,
          requiredDocCount: locations.reduce((sum, location) => sum + location.totalDocCount, 0),
          completedDocCount: locations.reduce((sum, location) => sum + location.completedDocCount, 0),
          staffNames: Array.from(
            new Set(matchedRows.map((row) => row.assignedStaffName).filter(Boolean) as string[])
          ),
          latestAssignedAt,
          latestCompletedAt,
          locations,
        };
      })
      .filter((row): row is CustomerSummaryRow => Boolean(row))
      .sort((left, right) => left.customerName.localeCompare(right.customerName, 'ko'));
  }, [baseTasks, filteredRows, getLocationAssignment]);

  const allFilteredSelected = useMemo(
    () => filteredRows.length > 0 && filteredRows.every((row) => selectedLocationIds.includes(row.locationId)),
    [filteredRows, selectedLocationIds]
  );

  const selectedLocation = useMemo(
    () => locationRows.find((row) => row.locationId === selectedLocationId) ?? null,
    [locationRows, selectedLocationId]
  );

  const selectedCustomer = useMemo(
    () => customerRows.find((row) => row.taskId === selectedCustomerTaskId) ?? null,
    [customerRows, selectedCustomerTaskId]
  );
  const isCustomerDetailView = viewMode === 'customer-detail' && Boolean(selectedCustomer);
  const isLocationDetailView = viewMode === 'location-detail' && Boolean(selectedLocation && selectedTask);

  const selectedTask = useMemo(
    () => (selectedLocation ? baseTasks.find((task) => task.id === selectedLocation.taskId) ?? null : null),
    [baseTasks, selectedLocation]
  );

  const selectedTaskProgress = useMemo(() => {
    if (!selectedTask) {
      return { completed: 0, total: 0 };
    }

    return {
      completed: selectedTask.locations.filter((location) => location.status === 'completed').length,
      total: selectedTask.locations.length,
    };
  }, [selectedTask]);

  const selectedTaskLocationRows = useMemo(() => {
    if (!selectedTask) {
      return [];
    }

    return selectedTask.locations.map((location) => {
      const assignment = getLocationAssignment(location.id);
      const docs = assignment?.requiredDocs ?? location.requiredDocs;
      const uploadedCount = docs.filter((doc) => doc.status !== 'pending').length;

      return {
        ...location,
        assigneeName: assignment?.staffName ?? location.assignedManagerName,
        uploadedCount,
        totalDocCount: docs.length,
        assignmentStatus: assignment?.status as StaffAssignmentStatus | undefined,
      };
    });
  }, [getLocationAssignment, selectedTask]);

  const selectedStaff = useMemo(
    () => staffMembers.find((staff) => staff.id === assignStaffId) ?? null,
    [assignStaffId, staffMembers]
  );

  const regionLabelSummary = (regions?: RegionSelection[]) => {
    return summarizeRegionSelections(regions);
  };

  const staffRegionsById = useMemo(
    () => new Map(staffMembers.map((staff) => [staff.id, staff.assignedRegions ?? []] as const)),
    [staffMembers]
  );

  const staffPerformanceRows = useMemo(() => {
    const rows = getStaffPerformanceRows();
    if (!searchQuery.trim()) {
      return rows;
    }

    const query = searchQuery.trim().toLowerCase();
    return rows.filter((row) =>
        [
          row.staffName,
          row.staffPhone,
          ...row.assignedRegions.map((region) => [region.level1, region.level2, region.level3].filter(Boolean).join(' ')),
        ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [getStaffPerformanceRows, searchQuery]);

  const performanceAllRange = useMemo(
    () =>
      getRowsDateBounds(
        assignments.filter((assignment) => assignment.status === 'completed'),
        (assignment) => assignment.completedAt,
        defaultCustomPeriodRange
      ),
    [assignments, defaultCustomPeriodRange]
  );

  const performancePeriodRange = useMemo(
    () =>
      getPerformancePeriodRange(
        performancePeriodPreset,
        customPeriodStartDate,
        customPeriodEndDate,
        new Date(),
        performanceAllRange
      ),
    [customPeriodEndDate, customPeriodStartDate, performanceAllRange, performancePeriodPreset]
  );

  const performanceCompletedLabel = useMemo(
    () => getPerformanceCompletedLabel(performancePeriodPreset),
    [performancePeriodPreset]
  );

  const displayStaffPerformanceRows = useMemo(
    () => applyPerformancePeriodToRows(staffPerformanceRows, assignments, performancePeriodRange),
    [assignments, performancePeriodRange, staffPerformanceRows]
  );

  const assignableStaffCandidates = useMemo(
    () => getAssignableStaffCandidates(selectedLocationIds),
    [getAssignableStaffCandidates, selectedLocationIds]
  );

  const autoAssignmentPlan = useMemo<AutoAssignmentPlan | null>(
    () => (assignmentMode === 'auto' ? getAutoAssignmentPlan(selectedLocationIds) : null),
    [assignmentMode, getAutoAssignmentPlan, selectedLocationIds]
  );

  const filteredAutoAssignmentPlan = useMemo<AutoAssignmentPlan | null>(() => {
    if (!autoAssignmentPlan) {
      return null;
    }

    const items = autoAssignmentPlan.items.filter((item) => selectedAutoStaffIds.includes(item.staffId));
    const byStaffMap = new Map<string, { id: string; name: string; company?: string; count: number }>();
    items.forEach((item) => {
      const staff = byStaffMap.get(item.staffId);
      if (staff) {
        staff.count += 1;
      } else {
        byStaffMap.set(item.staffId, { id: item.staffId, name: item.staffName, company: item.managerCompany, count: 1 });
      }
    });

    return {
      ...autoAssignmentPlan,
      items,
      totalCount: items.length,
      regionMatchedCount: items.filter((item) => item.regionMatched).length,
      fallbackCount: items.filter((item) => !item.regionMatched).length,
      byStaff: [...byStaffMap.values()].sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, 'ko')),
      byManager: [],
    };
  }, [autoAssignmentPlan, selectedAutoStaffIds]);

  const selectedLocationCount = selectedLocationIds.length;
  const selectedAutoAssignedCount = filteredAutoAssignmentPlan?.totalCount ?? 0;
  const selectedAutoRegionMatchedCount = filteredAutoAssignmentPlan?.regionMatchedCount ?? 0;
  const selectedAutoUnassignedCount = Math.max(0, selectedLocationCount - selectedAutoAssignedCount);
  const selectedAutoUnmatchedCount = Math.max(0, selectedLocationCount - selectedAutoRegionMatchedCount);

  useEffect(() => {
    if (autoAssignmentPlan) {
      setSelectedAutoStaffIds(autoAssignmentPlan.byStaff.map((group) => group.id));
      return;
    }

    setSelectedAutoStaffIds([]);
  }, [autoAssignmentPlan]);

  useEffect(() => {
    if (viewMode !== 'customers' && viewMode !== 'customer-detail') {
      setSelectedCustomerTaskId(null);
    }
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === 'customer-detail' && !selectedCustomer) {
      setViewMode('customers');
    }
  }, [selectedCustomer, viewMode]);

  useEffect(() => {
    if (viewMode === 'location-detail' && !selectedLocation) {
      setViewMode('locations');
    }
  }, [selectedLocation, viewMode]);

  const toggleSelect = (locationId: string) => {
    setSelectedLocationIds((prev) =>
      prev.includes(locationId) ? prev.filter((item) => item !== locationId) : [...prev, locationId]
    );
  };

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedLocationIds([]);
      return;
    }

    setSelectedLocationIds(filteredRows.map((row) => row.locationId));
  };

  const toggleFilteredSelection = () => {
    if (allFilteredSelected) {
      setSelectedLocationIds([]);
      return;
    }

    setSelectedLocationIds(filteredRows.map((row) => row.locationId));
  };

  const closeAssignDialog = () => {
    setShowAssignDialog(false);
    setAssignmentMode(null);
    setAssignStaffId('');
    setSelectedAutoStaffIds([]);
  };

  const openAssignDialog = () => {
    setAssignmentMode(null);
    setAssignStaffId('');
    setSelectedAutoStaffIds([]);
    setShowAssignDialog(true);
  };

  const navigateToLocations = () => {
    setSelectedLocationId(null);
    setSelectedCustomerTaskId(null);
    setViewMode('locations');
  };

  const navigateToCustomers = () => {
    setSelectedLocationId(null);
    setSelectedCustomerTaskId(null);
    setViewMode('customers');
  };

  const navigateToPeople = () => {
    setSelectedLocationId(null);
    setSelectedCustomerTaskId(null);
    setViewMode('people');
  };

  const handleAssign = () => {
    if (selectedLocationIds.length === 0) {
      return;
    }

    if (!assignStaffId || !selectedStaff?.managerId) {
      return;
    }

    assignStaffToLocations(selectedLocationIds, assignStaffId, selectedStaff.managerId);
    toast.success(`${selectedLocationIds.length}개 방문지가 ${selectedStaff.name}에게 배정되었습니다.`);
    setSelectedLocationIds([]);
    closeAssignDialog();
  };

  const handleAutoAssign = () => {
    if (selectedLocationIds.length === 0) {
      return;
    }

    if (!filteredAutoAssignmentPlan || filteredAutoAssignmentPlan.items.length === 0) {
      return;
    }

    const grouped = new Map<string, { staffId: string; managerId: string; locationIds: string[] }>();
    filteredAutoAssignmentPlan.items.forEach((item) => {
      const key = `${item.staffId}::${item.managerId}`;
      const current = grouped.get(key);
      if (current) {
        current.locationIds.push(item.locationId);
        return;
      }

      grouped.set(key, {
        staffId: item.staffId,
        managerId: item.managerId,
        locationIds: [item.locationId],
      });
    });

    grouped.forEach((group) => {
      assignStaffToLocations(group.locationIds, group.staffId, group.managerId);
    });

    toast.success(
      `총 ${selectedLocationCount}건 중 ${selectedAutoAssignedCount}개 배정 (직원 ${filteredAutoAssignmentPlan.byStaff.length}명), ${selectedAutoUnassignedCount}개 미배정`
    );
    setSelectedLocationIds([]);
    closeAssignDialog();
  };

  return (
    <div className="flex flex-col h-full rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[#1e293b]">서류 발급 대행 - 전체 리스트</h2>
            <p className="mt-1 text-xs font-light text-slate-400">전체 방문지 기준으로 직원 배정과 업로드 진행 현황을 확인합니다.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigateToLocations();
                }}
                className={clsx(
                  'rounded-full px-3 py-1.5 text-xs font-bold transition-colors',
                  viewMode === 'locations' ? 'bg-slate-100 text-[#1e293b]' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                )}
              >
                방문지 목록
              </button>
              <button
                type="button"
                onClick={() => {
                  navigateToCustomers();
                }}
                className={clsx(
                  'rounded-full px-3 py-1.5 text-xs font-bold transition-colors',
                  viewMode === 'customers' ? 'bg-slate-100 text-[#1e293b]' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                )}
              >
                고객별 보기
              </button>
              <button
                type="button"
                onClick={() => {
                  navigateToPeople();
                }}
                className={clsx(
                  'rounded-full px-3 py-1.5 text-xs font-bold transition-colors',
                  viewMode === 'people' ? 'bg-slate-100 text-[#1e293b]' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                )}
              >
                직원 현황
              </button>
            </div>
          </div>

          <div className="relative w-full max-w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={
                viewMode === 'locations' || viewMode === 'customers'
                  ? '고객명, 연락처, 병원/약국 검색'
                  : '직원명, 연락처, 담당지역 검색'
              }
              className="w-full rounded-lg bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200"
            />
          </div>
        </div>
      </div>

      {viewMode !== 'people' ? (
      <div className="border-b border-slate-100 px-6 py-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {([
            { key: 'all', label: '전체', count: stats.total, minWidth: 'min-w-[76px]' },
            { key: 'unassigned', label: '미배정', count: stats.unassigned, minWidth: 'min-w-[88px]' },
            { key: 'in_progress', label: '진행중', count: stats.inProgress, minWidth: 'min-w-[88px]' },
            { key: 'completed', label: '완료', count: stats.completed, minWidth: 'min-w-[76px]' },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={clsx(
                'inline-flex items-center justify-between gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-colors',
                tab.minWidth,
                activeFilter === tab.key ? 'bg-slate-100 text-[#1e293b] shadow-sm' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              )}
            >
              <span>{tab.label}</span>
              <span className="min-w-[3ch] text-right tabular-nums">{tab.count}</span>
            </button>
          ))}
          <span className="ml-2 text-xs font-medium text-slate-400">필터 결과 {filteredRows.length}개소</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ListPeriodControls
            preset={locationPeriodPreset}
            range={locationPeriodRange}
            dateType={locationDateType}
            dateTypeOptions={[
              { key: 'assignedAt', label: '배정일' },
              { key: 'completedAt', label: '완료일' },
            ]}
            onDateTypeChange={(value) => setLocationDateType(value as LocationDateType)}
            onPresetChange={setLocationPeriodPreset}
            onStartDateChange={setLocationCustomStartDate}
            onEndDateChange={setLocationCustomEndDate}
          />
          <RegionMultiSelect
            rows={baseFilteredRows}
            value={regionSelections}
            onApply={(nextSelections) => {
              setRegionSelections(nextSelections);
              setSelectedLocationIds([]);
            }}
          />
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as IssuanceLocationSortKey)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-200"
          >
            <option value="unassigned_first">미배정 우선</option>
            <option value="region_asc">지역순</option>
            <option value="hospital_name_asc">기관명순</option>
            <option value="visit_date_desc">내원일 최신순</option>
            <option value="visit_date_asc">내원일 오래된순</option>
          </select>
          <button
            onClick={toggleFilteredSelection}
            disabled={filteredRows.length === 0}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            {allFilteredSelected ? '선택 해제' : '필터 결과 전체 선택'}
          </button>
          {selectedLocationIds.length > 0 && (
            <button
              onClick={openAssignDialog}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0f766e] px-4 py-2 text-sm font-bold text-white hover:bg-[#0d6560]"
            >
              <UserPlus size={16} />
              배정하기 ({selectedLocationIds.length}개소)
            </button>
          )}
        </div>
      </div>
      ) : (
        <div className="border-b border-slate-100 px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#1e293b]">
              직원별 현황 {displayStaffPerformanceRows.length}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setStaffViewLayout('table')}
                  className={clsx(
                    'rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors',
                    staffViewLayout === 'table'
                      ? 'bg-slate-100 text-[#1e293b]'
                      : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                  )}
                >
                  표 보기
                </button>
                <button
                  type="button"
                  onClick={() => setStaffViewLayout('board')}
                  className={clsx(
                    'rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors',
                    staffViewLayout === 'board'
                      ? 'bg-slate-100 text-[#1e293b]'
                      : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                  )}
                >
                  칸반 보기
                </button>
              </div>
              <ListPeriodControls
                preset={performancePeriodPreset}
                range={performancePeriodRange}
                onPresetChange={setPerformancePeriodPreset}
                onStartDateChange={setCustomPeriodStartDate}
                onEndDateChange={setCustomPeriodEndDate}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {viewMode === 'locations' ? (
        <table className="min-w-[1280px] w-full table-fixed text-left text-sm">
          <colgroup>
            <col className="w-12" />
            <col className="w-[170px]" />
            <col className="w-[120px]" />
            <col className="w-[440px]" />
            <col className="w-[90px]" />
            <col className="w-[100px]" />
            <col className="w-[150px]" />
            <col className="w-[150px]" />
            <col className="w-[110px]" />
          </colgroup>
          <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300"
                />
              </th>
              <th className="px-4 py-3 font-medium">고객명</th>
              <th className="px-4 py-3 font-medium">지역</th>
              <th className="px-4 py-3 font-medium">방문지</th>
              <th className="px-4 py-3 font-medium">유형</th>
              <th className="px-4 py-3 font-medium">서류 수</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium">배정 직원</th>
              <th className="px-4 py-3 font-medium">배정일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRows.map((row) => (
              <tr
                key={row.locationId}
                className={clsx(
                  'cursor-pointer transition-colors hover:bg-slate-50',
                  selectedLocationIds.includes(row.locationId) && 'bg-blue-50/50'
                )}
                onClick={() => {
                  setSelectedCustomerTaskId(null);
                  setSelectedLocationId(row.locationId);
                  setViewMode('location-detail');
                }}
              >
                <td className="px-4 py-4" onClick={(event) => event.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedLocationIds.includes(row.locationId)}
                    onChange={() => toggleSelect(row.locationId)}
                    className="rounded border-slate-300"
                  />
                </td>
                <td className="px-4 py-4">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedLocationId(null);
                      setSelectedCustomerTaskId(row.taskId);
                      setViewMode('customer-detail');
                    }}
                    className="font-bold text-[#1e293b] hover:text-[#0f766e] hover:underline"
                  >
                    {row.customerName}
                  </button>
                  <div className="mt-0.5 text-xs text-slate-400">{row.customerPhone}</div>
                </td>
                <td className="px-4 py-4 text-xs text-slate-500">
                  <div>{row.regionLevel1 ?? UNCLASSIFIED_REGION}</div>
                  <div className="mt-0.5">{row.regionLevel2 ?? UNCLASSIFIED_REGION}</div>
                  <div className="mt-0.5">{row.regionLevel3 ?? UNCLASSIFIED_REGION}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="font-bold text-[#1e293b]">{row.locationName}</div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin size={12} />
                    <span className="truncate">{row.locationAddress}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">내원 기간: {row.visitPeriod}</div>
                </td>
                <td className="px-4 py-4 text-slate-600">{row.type === 'pharmacy' ? '약국' : '병원'}</td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center gap-1.5 text-slate-600">
                    <FileText size={14} className="text-slate-400" />
                    {row.requiredDocCount}건
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <TaskStatusBadge status={row.status} />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {row.assignedStaffName ? (
                    <div>
                      {row.assignedStaffId && onNavigate ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onNavigate(`issuance-staff:${row.assignedStaffId}`);
                          }}
                          className="font-medium text-[#1e293b] hover:text-[#0f766e] hover:underline"
                        >
                          {row.assignedStaffName}
                        </button>
                      ) : (
                        <div className="font-medium text-[#1e293b]">{row.assignedStaffName}</div>
                      )}
                      <div className="mt-0.5 text-xs text-slate-400">{row.assignedStaffPhone ?? '-'}</div>
                      <div className="mt-0.5 text-xs text-slate-400">
                        {row.assignedStaffId
                          ? regionLabelSummary(staffRegionsById.get(row.assignedStaffId)) ?? '담당 지역 미설정'
                          : '담당 지역 미설정'}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">미배정</span>
                  )}
                </td>
                <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap">
                  {getLocationAssignment(row.locationId)?.assignedAt ?? row.assignedManagerAt ?? '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        ) : viewMode === 'customers' ? (
          <table className="min-w-[1240px] w-full table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[220px]" />
              <col className="w-[120px]" />
              <col className="w-[120px]" />
              <col className="w-[120px]" />
              <col className="w-[240px]" />
              <col className="w-[120px]" />
              <col className="w-[120px]" />
            </colgroup>
            <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">고객명</th>
                <th className="px-4 py-3 font-medium">방문지 수</th>
                <th className="px-4 py-3 font-medium">필요 서류</th>
                <th className="px-4 py-3 font-medium">완료 서류</th>
                <th className="px-4 py-3 font-medium">방문 담당자</th>
                <th className="px-4 py-3 font-medium">최근 배정일</th>
                <th className="px-4 py-3 font-medium">최근 완료일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customerRows.map((row) => (
                <tr
                  key={row.taskId}
                  className="cursor-pointer transition-colors hover:bg-slate-50"
                  onClick={() => setSelectedCustomerTaskId(row.taskId)}
                >
                  <td className="px-4 py-4">
                    <div className="font-bold text-[#1e293b]">{row.customerName}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{row.customerPhone}</div>
                    <div className="mt-1 text-[11px] text-slate-400">{row.customerAddress}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-[#1e293b]">{row.locationCount}개소</div>
                    <div className="mt-0.5 text-xs text-slate-400">완료 {row.completedLocationCount}개소</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-[#1e293b]">{row.requiredDocCount}건</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-[#1e293b]">{row.completedDocCount}건</div>
                  </td>
                  <td className="px-4 py-4">
                    {row.staffNames.length > 0 ? (
                      <div className="space-y-1">
                        {row.staffNames.slice(0, 2).map((name) => (
                          <div key={name} className="text-xs font-medium text-slate-600">{name}</div>
                        ))}
                        {row.staffNames.length > 2 && (
                          <div className="text-[11px] text-slate-400">외 {row.staffNames.length - 2}명</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">미배정</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-500">{row.latestAssignedAt ?? '-'}</td>
                  <td className="px-4 py-4 text-xs text-slate-500">{row.latestCompletedAt ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : isLocationDetailView && selectedLocation && selectedTask ? (
          <div className="min-w-[1240px] px-6 py-6">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <button
                  type="button"
                  onClick={navigateToLocations}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                >
                  <ArrowLeft size={14} />
                  방문지 목록으로
                </button>
                <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-400">{selectedLocation.claimId}</div>
                    <h3 className="mt-1 text-2xl font-bold text-[#1e293b]">{selectedLocation.locationName}</h3>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                      <span>{selectedLocation.customerName}</span>
                      <span>{selectedTask.customerPhone}</span>
                      <span>{selectedLocation.locationAddress}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm md:grid-cols-4">
                    <div>
                      <div className="text-xs text-slate-500">방문지</div>
                      <div className="mt-1 text-lg font-bold text-[#1e293b]">
                        {selectedTaskProgress.completed}/{selectedTaskProgress.total}개 완료
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">필요 서류</div>
                      <div className="mt-1 text-lg font-bold text-[#1e293b]">
                        {selectedTask.locations.reduce((sum, location) => sum + location.requiredDocs.length, 0)}건
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">배정 직원</div>
                      <div className="mt-1 text-lg font-bold text-[#1e293b]">{selectedLocation.assignedStaffName ?? '미배정'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">완료일</div>
                      <div className="mt-1 text-lg font-bold text-[#1e293b]">{selectedLocation.completedAt ?? '-'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 px-6 py-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                <div className="space-y-5">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-[#1e293b]">
                      <Users size={14} />
                      고객 정보
                    </h3>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-slate-500">이름</div>
                        <div className="font-medium">{selectedTask.customerName}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">생년월일</div>
                        <div className="font-medium">{selectedTask.customerSSN}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">연락처</div>
                        <div className="font-medium">{selectedTask.customerPhone}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">주소</div>
                        <div className="font-medium">{selectedTask.customerAddress}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-[#1e293b]">
                      <Building size={14} />
                      방문지 정보
                    </h3>
                    <div className="mt-3 space-y-2 text-sm">
                      <div>
                        <div className="text-xs text-slate-500">기관명</div>
                        <div className="font-medium">{selectedLocation.locationName}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">주소</div>
                        <div className="font-medium">{selectedLocation.locationAddress}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">내원 기간</div>
                        <div className="font-medium">{selectedLocation.visitPeriod}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">광역시도</div>
                        <div className="font-medium">{selectedLocation.regionLevel1 ?? UNCLASSIFIED_REGION}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">시군구</div>
                        <div className="font-medium">{selectedLocation.regionLevel2 ?? UNCLASSIFIED_REGION}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">행정동</div>
                        <div className="font-medium">{selectedLocation.regionLevel3 ?? UNCLASSIFIED_REGION}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">배정 직원</div>
                        <div className="font-medium">{selectedLocation.assignedStaffName ?? '미배정'}</div>
                        {selectedLocation.assignedStaffName && (
                          <div className="mt-0.5 text-xs text-slate-400">
                            {[selectedLocation.assignedStaffPhone, selectedLocation.assignedStaffId ? regionLabelSummary(staffRegionsById.get(selectedLocation.assignedStaffId)) : null]
                              .filter(Boolean)
                              .join(' · ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-lg border border-slate-200">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-[#1e293b]">고객 전체 방문지 진행률</div>
                    <div className="space-y-4 p-4">
                      <IssuanceProgressBar completed={selectedTaskProgress.completed} total={selectedTaskProgress.total} />
                      <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                        {selectedTaskLocationRows.map((location) => (
                          <div key={location.id} className="px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="font-medium text-[#1e293b]">{location.name}</div>
                                <div className="mt-1 text-[11px] text-slate-400">{location.visitPeriod}</div>
                                <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                                  <MapPin size={11} />
                                  <span>{location.address}</span>
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                                  <span>
                                    담당자:{' '}
                                    <span className="font-semibold text-slate-600">
                                      {location.assigneeName ?? '미배정'}
                                    </span>
                                  </span>
                                  <span>
                                    업로드:{' '}
                                    <span className="font-semibold text-slate-600">
                                      {location.uploadedCount}/{location.totalDocCount}
                                    </span>
                                  </span>
                                </div>
                              </div>
                              {location.assignmentStatus ? (
                                <AssignmentStatusBadge status={location.assignmentStatus} />
                              ) : (
                                <TaskStatusBadge status={location.status as IssuanceTaskStatus} />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : isCustomerDetailView && selectedCustomer ? (
          <div className="min-w-[1240px] px-6 py-6">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomerTaskId(null);
                    setViewMode('customers');
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                >
                  <ArrowLeft size={14} />
                  고객 목록으로
                </button>
                <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-400">{selectedCustomer.claimId}</div>
                    <h3 className="mt-1 text-2xl font-bold text-[#1e293b]">{selectedCustomer.customerName}</h3>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                      <span>{selectedCustomer.customerPhone}</span>
                      <span>{selectedCustomer.customerSSN}</span>
                      <span>{selectedCustomer.customerAddress}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm md:grid-cols-4">
                    <div>
                      <div className="text-xs text-slate-500">방문지</div>
                      <div className="mt-1 text-lg font-bold text-[#1e293b]">{selectedCustomer.locationCount}개소</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">완료 방문지</div>
                      <div className="mt-1 text-lg font-bold text-[#1e293b]">{selectedCustomer.completedLocationCount}개소</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">필요 서류</div>
                      <div className="mt-1 text-lg font-bold text-[#1e293b]">{selectedCustomer.requiredDocCount}건</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">완료 서류</div>
                      <div className="mt-1 text-lg font-bold text-[#1e293b]">{selectedCustomer.completedDocCount}건</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-auto">
                <table className="w-full min-w-[1180px] table-fixed text-left text-sm">
                  <colgroup>
                    <col className="w-[260px]" />
                    <col className="w-[120px]" />
                    <col className="w-[240px]" />
                    <col className="w-[240px]" />
                    <col className="w-[160px]" />
                    <col className="w-[120px]" />
                    <col className="w-[120px]" />
                    <col className="w-[120px]" />
                  </colgroup>
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">병원/약국</th>
                      <th className="px-4 py-3 font-medium">방문 기간</th>
                      <th className="px-4 py-3 font-medium">필요 서류</th>
                      <th className="px-4 py-3 font-medium">완료 서류</th>
                      <th className="px-4 py-3 font-medium">방문 담당자</th>
                      <th className="px-4 py-3 font-medium">배정일</th>
                      <th className="px-4 py-3 font-medium">완료일</th>
                      <th className="px-4 py-3 font-medium">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedCustomer.locations.map((location) => (
                      <tr key={location.locationId} className="align-top">
                        <td className="px-4 py-4">
                          <div className="font-semibold text-[#1e293b]">{location.locationName}</div>
                          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <MapPin size={12} />
                            <span>{location.locationAddress}</span>
                          </div>
                          <div className="mt-1 text-[11px] text-slate-400">
                            {location.type === 'pharmacy' ? '약국' : '병원'}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500">{location.visitPeriod}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {location.requiredDocNames.map((docName) => (
                              <span
                                key={docName}
                                className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600"
                              >
                                {docName}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="mb-2 text-xs font-semibold text-slate-500">
                            {location.completedDocCount}/{location.totalDocCount}건 완료
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {location.completedDocNames.length > 0 ? (
                              location.completedDocNames.map((docName) => (
                                <span
                                  key={docName}
                                  className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700 ring-1 ring-emerald-200"
                                >
                                  {docName}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-slate-400">완료 서류 없음</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-[#1e293b]">{location.assignedStaffName ?? '미배정'}</div>
                          <div className="mt-0.5 text-xs text-slate-400">{location.assignedStaffPhone ?? '-'}</div>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500">{location.assignedAt ?? '-'}</td>
                        <td className="px-4 py-4 text-xs text-slate-500">{location.completedAt ?? '-'}</td>
                        <td className="px-4 py-4">
                          {location.assignmentStatus ? (
                            <AssignmentStatusBadge status={location.assignmentStatus} />
                          ) : (
                            <TaskStatusBadge status={location.locationStatus} />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          staffViewLayout === 'table' ? (
            <StaffPerformanceTable
              rows={displayStaffPerformanceRows}
              completedLabel={performanceCompletedLabel}
              onNavigateToStaff={(staffId) => onNavigate?.(`issuance-staff:${staffId}`)}
              emptyMessage="표시할 직원 현황이 없습니다."
            />
          ) : (
            <StaffPerformanceBoard
              rows={displayStaffPerformanceRows}
              completedLabel={performanceCompletedLabel}
              onNavigateToStaff={(staffId) => onNavigate?.(`issuance-staff:${staffId}`)}
              emptyMessage="표시할 직원 현황이 없습니다."
            />
          )
        )}
      </div>

      {showAssignDialog && (
        <div className="fixed inset-0 z-[60] overflow-y-auto px-4 py-6">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={closeAssignDialog} />
          <div className="relative flex min-h-full items-start justify-center">
            <div className="my-4 flex w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl max-h-[calc(100vh-32px)]">
            <div className="shrink-0 border-b border-slate-200 px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-[#1e293b]">
                    {assignmentMode === null
                      ? '배정 방식 선택'
                      : assignmentMode === 'auto'
                        ? '자동 배정(지역 기준)'
                        : '수동 배정'}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {assignmentMode === null
                      ? `선택한 방문지 ${selectedLocationCount}개소의 배정 방식을 선택합니다.`
                      : assignmentMode === 'auto'
                        ? `선택한 방문지 ${selectedLocationCount}개소를 지역 우선, 진행량 분산 기준으로 직원까지 자동 배정합니다.`
                        : `선택한 방문지 ${selectedLocationCount}개소를 직원에게 직접 배정합니다.`}
                  </p>
                </div>
                {assignmentMode !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setAssignmentMode(null);
                      setAssignStaffId('');
                    }}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                  >
                    방식 다시 선택
                  </button>
                )}
              </div>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {assignmentMode === null ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setAssignmentMode('auto')}
                    className="rounded-xl border border-slate-200 p-5 text-left transition-colors hover:border-[#0f766e] hover:bg-emerald-50/40"
                  >
                    <div className="text-sm font-bold text-[#1e293b]">자동 배정(지역 기준)</div>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      지역 우선, 진행량 분산 기준으로 직원까지 자동 배정합니다.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignmentMode('manual')}
                    className="rounded-xl border border-slate-200 p-5 text-left transition-colors hover:border-[#0f766e] hover:bg-emerald-50/40"
                  >
                    <div className="text-sm font-bold text-[#1e293b]">수동 배정</div>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      지역과 진행 현황을 보고 직원을 직접 선택해 배정합니다.
                    </p>
                  </button>
                </div>
              ) : assignmentMode === 'auto' ? (
                <div className="space-y-4">
                  {filteredAutoAssignmentPlan ? (
                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="text-xs font-semibold text-slate-400">총 선택 건수</div>
                        <div className="mt-2 text-2xl font-bold text-[#1e293b]">{selectedLocationCount}</div>
                        <div className="mt-1 text-xs text-slate-400">체크한 방문지 전체 기준</div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="text-xs font-semibold text-slate-400">지역 매치</div>
                        <div className="mt-2 text-2xl font-bold text-emerald-700">{selectedAutoRegionMatchedCount}</div>
                        <div className="mt-1 text-xs text-slate-400">선택 직원 기준 매칭 가능</div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="text-xs font-semibold text-slate-400">매치 불가</div>
                        <div className="mt-2 text-2xl font-bold text-amber-600">{selectedAutoUnmatchedCount}</div>
                        <div className="mt-1 text-xs text-slate-400">선택 직원 기준 미매칭</div>
                      </div>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-[#1e293b]">
                          <span>직원별 배정 예정</span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedAutoStaffIds(
                                selectedAutoStaffIds.length === autoAssignmentPlan.byStaff.length
                                  ? []
                                  : autoAssignmentPlan.byStaff.map((group) => group.id)
                              )
                            }
                            className="text-[11px] text-slate-500 hover:text-slate-700"
                          >
                            {selectedAutoStaffIds.length === autoAssignmentPlan.byStaff.length ? '전체 해제' : '전체 선택'}
                          </button>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {autoAssignmentPlan.byStaff.map((group) => (
                            <label key={group.id} className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm hover:bg-slate-50">
                              <div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedAutoStaffIds.includes(group.id)}
                                    onChange={() =>
                                      setSelectedAutoStaffIds((prev) =>
                                        prev.includes(group.id) ? prev.filter((id) => id !== group.id) : [...prev, group.id]
                                      )
                                    }
                                    className="h-4 w-4 rounded border-slate-300 text-[#0f766e] focus:ring-[#0f766e]"
                                  />
                                  <span className="font-semibold text-[#1e293b]">{group.name}</span>
                                </div>
                                <div className="mt-0.5 text-xs text-slate-400">
                                  {regionLabelSummary(staffRegionsById.get(group.id)) ?? group.company ?? '-'}
                                </div>
                              </div>
                              <div className="font-bold text-[#1e293b]">{group.count}건</div>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200">
                        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-[#1e293b]">
                          선택 직원 합계
                        </div>
                        <div className="divide-y divide-slate-100">
                          {filteredAutoAssignmentPlan.byStaff.map((group) => (
                            <div key={group.id} className="flex items-center justify-between px-4 py-3 text-sm">
                              <div>
                                <div className="font-semibold text-[#1e293b]">{group.name}</div>
                                <div className="mt-0.5 text-xs text-slate-400">
                                  {regionLabelSummary(staffRegionsById.get(group.id)) ?? '담당 지역 미설정'}
                                </div>
                              </div>
                              <div className="font-bold text-[#1e293b]">{group.count}건</div>
                            </div>
                          ))}
                          {filteredAutoAssignmentPlan.byStaff.length === 0 && (
                            <div className="px-4 py-8 text-center text-sm text-slate-400">선택된 직원이 없습니다.</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      현재 체크한 {selectedLocationCount}건 중 <span className="font-semibold text-[#1e293b]">{selectedAutoAssignedCount}건</span>은 선택 직원에게 배정되고,
                      <span className="ml-1 font-semibold text-amber-600">{selectedAutoUnassignedCount}건</span>은 미배정으로 남습니다.
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-400">
                    자동 배정 가능한 직원 후보가 없습니다.
                  </div>
                )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    표에서 직원을 선택하면 해당 직원의 담당 지역 기준으로 바로 배정합니다.
                  </div>
                  <div className="rounded-lg border border-slate-200">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-[#1e293b]">
                      직원 선택
                    </div>
                    <StaffPerformanceTable
                      rows={assignableStaffCandidates}
                      variant="candidate"
                      selectable
                      selectedStaffId={assignStaffId}
                      onSelect={setAssignStaffId}
                      emptyMessage="선택 가능한 직원 후보가 없습니다."
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="shrink-0 flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <button
                onClick={closeAssignDialog}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                취소
              </button>
              {assignmentMode !== null && (
                <button
                  onClick={assignmentMode === 'auto' ? handleAutoAssign : handleAssign}
                  disabled={assignmentMode === 'auto' ? !filteredAutoAssignmentPlan || filteredAutoAssignmentPlan.items.length === 0 : !assignStaffId}
                  className="rounded-lg bg-[#1e293b] px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {assignmentMode === 'auto' ? '자동 배정 완료' : '배정 완료'}
                </button>
              )}
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
