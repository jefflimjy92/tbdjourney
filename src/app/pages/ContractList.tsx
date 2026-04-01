import React, { useMemo, useState } from 'react';
import { Edit2, Filter, Plus, Search, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';

import { ContractRegistrationModal } from '@/app/components/ContractRegistrationModal';
import type { ContractData } from '@/app/components/ContractInfoSection';
import { ListPeriodControls } from '@/app/components/ListPeriodControls';
import {
  filterRowsByPeriodAndType,
  getDefaultCustomPeriodRange,
  getPerformancePeriodRange,
  getRowsDateBoundsByType,
  type PerformancePeriodPreset,
} from '@/app/issuance/performancePeriodUtils';

function formatCurrentTimestamp(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parsePremium(value: string) {
  const parsed = Number.parseInt(value.replace(/[^0-9]/g, ''), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatPremium(value: string) {
  return `${parsePremium(value).toLocaleString('ko-KR')}원`;
}

function getStatusMeta(status: ContractData['status']) {
  if (status === 'active') {
    return { label: '정상', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  }
  if (status === 'pending') {
    return { label: '대기', className: 'bg-amber-100 text-amber-700 border-amber-200' };
  }
  return { label: '임시', className: 'bg-slate-100 text-slate-600 border-slate-200' };
}

function getEntryMethodMeta(contract: ContractData) {
  if (contract.entryMethod === 'pasted') {
    return { label: '복붙', className: 'bg-sky-100 text-sky-700 border-sky-200' };
  }
  return { label: '수기', className: 'bg-slate-100 text-slate-600 border-slate-200' };
}

function getPaymentInfoSummary(contract: ContractData) {
  if (contract.paymentMethod === '카드') {
    return [contract.paymentMethod, contract.paymentCardCompany, contract.paymentCardNumber].filter(Boolean).join(' · ');
  }
  if (contract.paymentMethod === '현금' || contract.paymentMethod === '일시납') {
    return [contract.paymentMethod, contract.paymentNote].filter(Boolean).join(' · ');
  }
  return [contract.paymentMethod, contract.paymentWithdrawDay, contract.paymentBankName].filter(Boolean).join(' · ');
}

const INITIAL_CONTRACTS: ContractData[] = [
  {
    id: 'CTR-202603-120',
    insurer: '삼성화재',
    contractType: '신규',
    productType: '건강/암보험',
    productName: '건강보험 New내돈내삼4170(2603.8)(납입면제,해약환급금미지급형Ⅱ)',
    policyNumber: '52606317930000',
    contractor: '서병용',
    insuredPerson: '서병용',
    paymentCycle: '월납',
    premium: '122082',
    startDate: '2026-03-16',
    endDate: '2068-03-16',
    status: 'active',
    entryMethod: 'pasted',
    sourceCarrier: '삼성화재',
    sourceFormat: 'samsung_contract_detail',
    parseStatus: 'parsed',
    parseWarnings: [],
    registeredAt: '2026-03-16 19:42',
    contractStatusLabel: '정상',
    paymentMethod: '자동이체',
    paymentWithdrawDay: '05일',
    paymentAccountHolder: '서병용',
    paymentBankName: '국민은행',
    paymentAccountNumber: '01380204093943',
    contractorPhone: '010-4846-4523',
    insuredPhone: '010-4846-4523',
    contractorAddress: '01028 서울 강북구 삼양로123길 40-7 102동 202호 (수유동, 가온팰리스)',
    insuredAddress: '01028 서울 강북구 삼양로123길 40-7 102동 202호 (수유동, 가온팰리스)',
    rawPasteText: '삼성화재 계약상세 복붙 원문 예시',
    memo: '삼성 복붙 등록 샘플',
  },
  {
    id: 'CTR-202603-119',
    insurer: 'KB손해보험',
    contractType: '신규',
    productType: '운전자/상해보험',
    productName: '24984 KB 플러스 운전자상해보험(무배당)(26.01)',
    policyNumber: '2026-1669962000',
    contractor: '홍순희',
    insuredPerson: '홍순희',
    paymentCycle: '월납',
    premium: '15989',
    startDate: '2026-03-16',
    endDate: '2046-03-16',
    status: 'active',
    entryMethod: 'pasted',
    sourceCarrier: 'KB손해보험',
    sourceFormat: 'kb_contract_detail',
    parseStatus: 'parsed',
    parseWarnings: [],
    registeredAt: '2026-03-16 18:25',
    contractStatusLabel: '정상/납입정상',
    paymentMethod: '자동이체',
    paymentBankName: '국민은행',
    contractorPhone: '010-2498-6200',
    insuredPhone: '010-2498-6200',
    contractorAddress: '16407 경기 수원시 권선구 구운로 84, 3층 (구운동)',
    insuredAddress: '16407 경기 수원시 권선구 구운로 84, 3층 (구운동)',
    rawPasteText: 'KB손해보험 계약상세 복붙 원문 예시',
    memo: '',
  },
  {
    id: 'CTR-202603-118',
    insurer: '메리츠화재',
    contractType: '신규',
    productType: '실손의료보험',
    productName: '실손의료비보장보험',
    policyNumber: 'P2026-300118',
    contractor: '한수진',
    insuredPerson: '한수진',
    paymentCycle: '월납',
    premium: '42000',
    startDate: '2026-03-14',
    endDate: '2027-03-14',
    status: 'pending',
    entryMethod: 'manual',
    sourceCarrier: '메리츠화재',
    sourceFormat: 'manual',
    parseStatus: 'manual',
    parseWarnings: [],
    registeredAt: '2026-03-14 16:40',
    contractStatusLabel: '심사대기',
    paymentMethod: '자동이체',
    memo: '수기 등록 후 심사 대기',
  },
  {
    id: 'CTR-202602-117',
    insurer: '현대해상',
    contractType: '배서(증액)',
    productType: '종합보험',
    productName: '무배당 퍼펙트 종합보험',
    policyNumber: 'P2026-200117',
    contractor: '이영희',
    insuredPerson: '이영희',
    paymentCycle: '월납',
    premium: '50000',
    startDate: '2026-02-19',
    endDate: '2036-02-19',
    status: 'active',
    entryMethod: 'manual',
    sourceCarrier: '현대해상',
    sourceFormat: 'manual',
    parseStatus: 'manual',
    parseWarnings: [],
    registeredAt: '2026-02-19 14:22',
    contractStatusLabel: '정상',
    paymentMethod: '자동이체',
    memo: '',
  },
  {
    id: 'CTR-202601-116',
    insurer: 'DB손해보험',
    contractType: '신규',
    productType: '자동차보험',
    productName: '프로미카 자동차보험',
    policyNumber: 'P2026-100116',
    contractor: '손흥민',
    insuredPerson: '손흥민',
    paymentCycle: '일시납',
    premium: '850000',
    startDate: '2026-01-24',
    endDate: '2027-01-24',
    status: 'draft',
    entryMethod: 'manual',
    sourceCarrier: 'DB손해보험',
    sourceFormat: 'manual',
    parseStatus: 'manual',
    parseWarnings: ['계약 상태가 아직 최종 확정되지 않았습니다.'],
    registeredAt: '2026-01-24 11:10',
    contractStatusLabel: '임시',
    paymentMethod: '일시납',
    memo: '고객 최종 확인 전',
  },
  {
    id: 'CTR-202603-115',
    insurer: '한화생명',
    contractType: '신규',
    productType: '종신/정기보험',
    productName: '한화생명 스마트플러스 종신보험 (2603)',
    policyNumber: 'HW2026-330115',
    contractor: '김민정',
    insuredPerson: '김민정',
    paymentCycle: '월납',
    premium: '187000',
    startDate: '2026-03-05',
    endDate: '2086-03-05',
    status: 'active',
    entryMethod: 'manual',
    sourceCarrier: '한화생명',
    sourceFormat: 'manual',
    parseStatus: 'manual',
    parseWarnings: [],
    registeredAt: '2026-03-05 10:15',
    contractStatusLabel: '정상',
    paymentMethod: '자동이체',
    paymentWithdrawDay: '10일',
    paymentBankName: '신한은행',
    contractorPhone: '010-3321-8844',
    insuredPhone: '010-3321-8844',
    contractorAddress: '06234 서울 강남구 테헤란로 152 강남파이낸스센터',
    memo: '',
  },
  {
    id: 'CTR-202603-114',
    insurer: '교보생명',
    contractType: '추가',
    productType: '건강/암보험',
    productName: '교보생명 암보험 Plus (26.02)',
    policyNumber: 'KYB2026-320114',
    contractor: '이준호',
    insuredPerson: '이준호',
    paymentCycle: '월납',
    premium: '92500',
    startDate: '2026-03-10',
    endDate: '2056-03-10',
    status: 'active',
    entryMethod: 'pasted',
    sourceCarrier: '교보생명',
    sourceFormat: 'kyobo_contract_detail',
    parseStatus: 'parsed',
    parseWarnings: [],
    registeredAt: '2026-03-10 15:30',
    contractStatusLabel: '정상',
    paymentMethod: '자동이체',
    paymentWithdrawDay: '15일',
    paymentBankName: '우리은행',
    contractorPhone: '010-7762-3391',
    insuredPhone: '010-7762-3391',
    contractorAddress: '13494 경기 성남시 분당구 판교로 289',
    memo: '복붙 등록, 추가 계약',
  },
  {
    id: 'CTR-202602-113',
    insurer: 'NH농협생명',
    contractType: '신규',
    productType: '연금/저축보험',
    productName: 'NH농협생명 참행복연금보험 (26.01)',
    policyNumber: 'NH2026-220113',
    contractor: '박선영',
    insuredPerson: '박선영',
    paymentCycle: '월납',
    premium: '215000',
    startDate: '2026-02-01',
    endDate: '2046-02-01',
    status: 'active',
    entryMethod: 'manual',
    sourceCarrier: 'NH농협생명',
    sourceFormat: 'manual',
    parseStatus: 'manual',
    parseWarnings: [],
    registeredAt: '2026-02-01 09:50',
    contractStatusLabel: '정상',
    paymentMethod: '자동이체',
    paymentWithdrawDay: '01일',
    paymentBankName: '농협은행',
    contractorPhone: '010-9988-1122',
    insuredPhone: '010-9988-1122',
    contractorAddress: '21565 인천 남동구 구월남로 99',
    memo: '',
  },
  {
    id: 'CTR-202602-112',
    insurer: '삼성화재',
    contractType: '추가',
    productType: '실손의료보험',
    productName: '삼성화재 3세대 실손의료비보험 (26.01)',
    policyNumber: '52801234560000',
    contractor: '최동욱',
    insuredPerson: '최동욱',
    paymentCycle: '월납',
    premium: '58400',
    startDate: '2026-02-14',
    endDate: '2027-02-14',
    status: 'pending',
    entryMethod: 'pasted',
    sourceCarrier: '삼성화재',
    sourceFormat: 'samsung_contract_detail',
    parseStatus: 'parsed',
    parseWarnings: ['갱신형 실손 — 1년 후 재심사 필요'],
    registeredAt: '2026-02-14 13:20',
    contractStatusLabel: '심사대기',
    paymentMethod: '자동이체',
    paymentWithdrawDay: '20일',
    paymentBankName: '카카오뱅크',
    contractorPhone: '010-5541-7723',
    insuredPhone: '010-5541-7723',
    contractorAddress: '06292 서울 강남구 역삼동 816-3',
    memo: '추가 실손, 갱신 주의',
  },
  {
    id: 'CTR-202602-111',
    insurer: '메리츠화재',
    contractType: '신규',
    productType: '운전자/상해보험',
    productName: '메리츠 무배당 운전자보험 (26.01)',
    policyNumber: 'MZ2026-210111',
    contractor: '정유진',
    insuredPerson: '정유진',
    paymentCycle: '월납',
    premium: '34900',
    startDate: '2026-02-20',
    endDate: '2036-02-20',
    status: 'active',
    entryMethod: 'manual',
    sourceCarrier: '메리츠화재',
    sourceFormat: 'manual',
    parseStatus: 'manual',
    parseWarnings: [],
    registeredAt: '2026-02-20 11:00',
    contractStatusLabel: '정상',
    paymentMethod: '카드',
    paymentCardCompany: '삼성카드',
    paymentCardNumber: '****-****-****-3821',
    contractorPhone: '010-2234-9987',
    insuredPhone: '010-2234-9987',
    contractorAddress: '35233 대전 서구 둔산로 100',
    memo: '카드 자동결제',
  },
  {
    id: 'CTR-202603-110',
    insurer: 'KB손해보험',
    contractType: '신규',
    productType: '건강/암보험',
    productName: 'KB스타 건강보험 (무배당)(26.02)',
    policyNumber: '2026-1887320000',
    contractor: '윤서준',
    insuredPerson: '윤서준',
    paymentCycle: '월납',
    premium: '143600',
    startDate: '2026-03-01',
    endDate: '2071-03-01',
    status: 'active',
    entryMethod: 'pasted',
    sourceCarrier: 'KB손해보험',
    sourceFormat: 'kb_contract_detail',
    parseStatus: 'parsed',
    parseWarnings: [],
    registeredAt: '2026-03-01 17:05',
    contractStatusLabel: '정상/납입정상',
    paymentMethod: '자동이체',
    paymentBankName: 'KB국민은행',
    contractorPhone: '010-8833-2211',
    insuredPhone: '010-8833-2211',
    contractorAddress: '16719 경기 수원시 영통구 광교중앙로 170',
    memo: '',
  },
  {
    id: 'CTR-202601-109',
    insurer: '현대해상',
    contractType: '추가',
    productType: '종합보험',
    productName: '현대해상 하이라이프 종합보험 (26.01)',
    policyNumber: 'HH2026-150109',
    contractor: '강다솜',
    insuredPerson: '강다솜',
    paymentCycle: '월납',
    premium: '76200',
    startDate: '2026-01-10',
    endDate: '2056-01-10',
    status: 'active',
    entryMethod: 'manual',
    sourceCarrier: '현대해상',
    sourceFormat: 'manual',
    parseStatus: 'manual',
    parseWarnings: [],
    registeredAt: '2026-01-10 14:45',
    contractStatusLabel: '정상',
    paymentMethod: '자동이체',
    paymentWithdrawDay: '05일',
    paymentBankName: '하나은행',
    contractorPhone: '010-7711-4455',
    insuredPhone: '010-7711-4455',
    contractorAddress: '47899 부산 동구 중앙대로 206',
    memo: '추가 보장 강화',
  },
  {
    id: 'CTR-202601-108',
    insurer: 'DB손해보험',
    contractType: '신규',
    productType: '실손의료보험',
    productName: 'DB손해보험 참다이렉트 실손보험 (26.01)',
    policyNumber: 'DB2026-110108',
    contractor: '오민준',
    insuredPerson: '오민준',
    paymentCycle: '월납',
    premium: '51800',
    startDate: '2026-01-15',
    endDate: '2027-01-15',
    status: 'pending',
    entryMethod: 'manual',
    sourceCarrier: 'DB손해보험',
    sourceFormat: 'manual',
    parseStatus: 'manual',
    parseWarnings: ['갱신형 — 매년 갱신 심사'],
    registeredAt: '2026-01-15 10:30',
    contractStatusLabel: '심사대기',
    paymentMethod: '자동이체',
    paymentWithdrawDay: '25일',
    paymentBankName: '기업은행',
    contractorPhone: '010-6634-8899',
    insuredPhone: '010-6634-8899',
    contractorAddress: '04524 서울 중구 세종대로 136',
    memo: '갱신형 실손 주의 안내 완료',
  },
  {
    id: 'CTR-202512-107',
    insurer: '한화생명',
    contractType: '신규',
    productType: '건강/암보험',
    productName: '한화생명 건강플러스 암보험 (25.11)',
    policyNumber: 'HW2025-120107',
    contractor: '임선희',
    insuredPerson: '임선희',
    paymentCycle: '월납',
    premium: '128900',
    startDate: '2025-12-01',
    endDate: '2065-12-01',
    status: 'active',
    entryMethod: 'manual',
    sourceCarrier: '한화생명',
    sourceFormat: 'manual',
    parseStatus: 'manual',
    parseWarnings: [],
    registeredAt: '2025-12-01 09:20',
    contractStatusLabel: '정상',
    paymentMethod: '자동이체',
    paymentWithdrawDay: '10일',
    paymentBankName: '신한은행',
    contractorPhone: '010-4421-6677',
    insuredPhone: '010-4421-6677',
    contractorAddress: '06627 서울 서초구 서초대로 301',
    memo: '',
  },
  {
    id: 'CTR-202512-106',
    insurer: '교보생명',
    contractType: '신규',
    productType: '종신/정기보험',
    productName: '교보생명 무배당 정기보험 (25.10)',
    policyNumber: 'KYB2025-120106',
    contractor: '서태준',
    insuredPerson: '서태준',
    paymentCycle: '월납',
    premium: '89300',
    startDate: '2025-12-15',
    endDate: '2045-12-15',
    status: 'draft',
    entryMethod: 'manual',
    sourceCarrier: '교보생명',
    sourceFormat: 'manual',
    parseStatus: 'manual',
    parseWarnings: ['고객 최종 서명 미완료'],
    registeredAt: '2025-12-15 16:00',
    contractStatusLabel: '임시',
    paymentMethod: '자동이체',
    paymentWithdrawDay: '15일',
    paymentBankName: '국민은행',
    contractorPhone: '010-9911-3344',
    insuredPhone: '010-9911-3344',
    contractorAddress: '16229 경기 수원시 장안구 정자로 110',
    memo: '서명 완료 후 정식 등록 예정',
  },
];

export function ContractList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | ContractData['status']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [contracts, setContracts] = useState<ContractData[]>(INITIAL_CONTRACTS);
  const defaultCustomPeriodRange = useMemo(() => getDefaultCustomPeriodRange(), []);
  const [periodPreset, setPeriodPreset] = useState<PerformancePeriodPreset>('all');
  const [customPeriodStartDate, setCustomPeriodStartDate] = useState(defaultCustomPeriodRange.startDate);
  const [customPeriodEndDate, setCustomPeriodEndDate] = useState(defaultCustomPeriodRange.endDate);
  const [dateType, setDateType] = useState<'startDate' | 'endDate'>('startDate');

  const editingContract = useMemo(
    () => contracts.find((contract) => contract.id === editingContractId),
    [contracts, editingContractId],
  );

  const periodRange = useMemo(
    () =>
      getPerformancePeriodRange(
        periodPreset,
        customPeriodStartDate,
        customPeriodEndDate,
        new Date(),
        getRowsDateBoundsByType(
          contracts,
          dateType,
          {
            startDate: (contract) => contract.startDate,
            endDate: (contract) => contract.endDate,
          },
          defaultCustomPeriodRange,
        ),
      ),
    [contracts, customPeriodEndDate, customPeriodStartDate, dateType, defaultCustomPeriodRange, periodPreset],
  );

  const filteredContracts = useMemo(() => {
    const loweredQuery = searchQuery.trim().toLowerCase();

    return filterRowsByPeriodAndType(contracts, periodRange, dateType, {
      startDate: (contract) => contract.startDate,
      endDate: (contract) => contract.endDate,
    }).filter((contract) => {
      if (filterStatus !== 'all' && contract.status !== filterStatus) {
        return false;
      }

      if (!loweredQuery) {
        return true;
      }

      return [
        contract.policyNumber,
        contract.contractor,
        contract.insuredPerson,
        contract.productName,
        contract.insurer,
      ]
        .join(' ')
        .toLowerCase()
        .includes(loweredQuery);
    });
  }, [contracts, dateType, filterStatus, periodRange, searchQuery]);

  const stats = useMemo(() => {
    const totalPremium = filteredContracts.reduce((sum, contract) => sum + parsePremium(contract.premium), 0);
    const totalPremiumManwon = totalPremium / 10000;
    const formattedPremium = Number.isInteger(totalPremiumManwon)
      ? totalPremiumManwon.toLocaleString('ko-KR')
      : totalPremiumManwon.toLocaleString('ko-KR', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        });
    const pastedCount = filteredContracts.filter((contract) => contract.entryMethod === 'pasted').length;
    const latestContract = [...filteredContracts].sort((a, b) => (b.registeredAt || '').localeCompare(a.registeredAt || ''))[0];

    return {
      totalCount: filteredContracts.length,
      totalPremiumText: formattedPremium,
      pastedCount,
      latestLabel: latestContract ? `${latestContract.insurer} · ${latestContract.productName}` : '-',
    };
  }, [filteredContracts]);

  const handleContractSubmit = (data: ContractData) => {
    if (editingContractId) {
      setContracts((current) =>
        current.map((contract) =>
          contract.id === editingContractId
            ? {
                ...contract,
                ...data,
                id: contract.id,
                registeredAt: data.registeredAt || contract.registeredAt || formatCurrentTimestamp(),
              }
            : contract,
        ),
      );
    } else {
      const now = formatCurrentTimestamp();
      const nextContract: ContractData = {
        ...data,
        id: `CTR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`,
        registeredAt: data.registeredAt || now,
      };
      setContracts((current) => [nextContract, ...current]);
    }

    setEditingContractId(null);
    setIsModalOpen(false);
  };

  const handleEditClick = (contractId: string) => {
    setEditingContractId(contractId);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (contractId: string) => {
    if (!window.confirm('정말 이 계약 정보를 삭제하시겠습니까?')) return;

    setContracts((current) => current.filter((contract) => contract.id !== contractId));
    toast.info('계약 정보가 삭제되었습니다.');
  };

  const handleAddClick = () => {
    setEditingContractId(null);
    setIsModalOpen(true);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">계약 리스트</h1>
          <p className="mt-1 text-sm text-slate-500">복붙 등록과 직접 입력 계약을 같은 스냅샷 구조로 조회하고 관리합니다.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <ListPeriodControls
            preset={periodPreset}
            range={periodRange}
            dateType={dateType}
            dateTypeOptions={[
              { key: 'startDate', label: '보험 시작일' },
              { key: 'endDate', label: '보험 종료일' },
            ]}
            onDateTypeChange={(value) => setDateType(value as 'startDate' | 'endDate')}
            onPresetChange={setPeriodPreset}
            onStartDateChange={setCustomPeriodStartDate}
            onEndDateChange={setCustomPeriodEndDate}
          />
          <button className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
            <Filter size={16} />
            필터
          </button>
          <button
            onClick={handleAddClick}
            className="flex items-center gap-2 rounded-lg bg-[#1e293b] px-4 py-2 text-sm font-bold text-white shadow-sm shadow-slate-300 transition-colors hover:bg-slate-800"
          >
            <Plus size={18} />
            신규 계약 등록
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-1 text-xs font-bold text-slate-500">등록 계약</div>
          <div className="text-2xl font-bold text-slate-900">
            {stats.totalCount.toLocaleString()} <span className="text-sm font-normal text-slate-400">건</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-1 text-xs font-bold text-slate-500">합산 보험료</div>
          <div className="text-2xl font-bold text-emerald-600">
            {stats.totalPremiumText} <span className="text-sm font-normal text-slate-400">만원</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-1 text-xs font-bold text-slate-500">복붙 등록 건수</div>
          <div className="text-2xl font-bold text-sky-600">
            {stats.pastedCount} <span className="text-sm font-normal text-slate-400">건</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-1 text-xs font-bold text-slate-500">최근 등록 계약</div>
          <div className="truncate text-sm font-bold text-slate-900" title={stats.latestLabel}>
            {stats.latestLabel}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="계약번호/증권번호, 고객명, 상품명, 보험사 검색"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 lg:w-80"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: '전체' },
              { key: 'active', label: '정상' },
              { key: 'pending', label: '대기' },
              { key: 'draft', label: '임시' },
            ].map((status) => (
              <button
                key={status.key}
                onClick={() => setFilterStatus(status.key as 'all' | ContractData['status'])}
                className={clsx(
                  'rounded-full px-3 py-1.5 text-xs font-bold transition-colors',
                  filterStatus === status.key ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                )}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500">보험사</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500">상품명</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500">계약자</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500">피보험자</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500">계약/증권번호</th>
                <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-500">보험료</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500">납입주기</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500">보험기간</th>
                <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500">상태</th>
                <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-500">등록방식</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-500">등록시각</th>
                <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-500">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContracts.map((contract) => {
                const statusMeta = getStatusMeta(contract.status);
                const entryMeta = getEntryMethodMeta(contract);

                return (
                  <tr key={contract.id} className="align-top hover:bg-slate-50/80">
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900">{contract.insurer}</p>
                        <p className="text-[11px] text-slate-500">{contract.productType}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-[240px] space-y-2">
                        <p className="truncate text-sm font-bold text-slate-900" title={contract.productName}>
                          {contract.productName}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {contract.rawPasteText && (
                            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                              원문 있음
                            </span>
                          )}
                          {Boolean(contract.parseWarnings?.length) && (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                              경고 {contract.parseWarnings?.length}건
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-800">{contract.contractor}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-800">{contract.insuredPerson}</td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <p className="font-mono text-sm font-semibold text-slate-800">{contract.policyNumber}</p>
                        <p className="text-[11px] text-slate-500">{contract.contractType}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900">{formatPremium(contract.premium)}</p>
                        {getPaymentInfoSummary(contract) && <p className="text-[11px] text-slate-500">{getPaymentInfoSummary(contract)}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">{contract.paymentCycle}</td>
                    <td className="px-4 py-4">
                      <div className="space-y-1 text-sm text-slate-700">
                        <p>{contract.startDate}</p>
                        <p className="text-[11px] text-slate-400">~ {contract.endDate}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={clsx('inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold', statusMeta.className)}>
                        {contract.contractStatusLabel || statusMeta.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={clsx('inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold', entryMeta.className)}>
                        {entryMeta.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">{contract.registeredAt || '-'}</td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditClick(contract.id || '')}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                          title="수정"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(contract.id || '')}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                          title="삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 text-xs text-slate-500">
          <div>
            총 <span className="font-bold text-slate-700">{filteredContracts.length}</span>건을 표시하고 있습니다.
          </div>
          <div>복붙 계약은 수정 모달에서 원문과 파싱 결과를 다시 검수할 수 있습니다.</div>
        </div>
      </div>

      <ContractRegistrationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingContractId(null);
        }}
        onSubmit={handleContractSubmit}
        initialData={editingContract}
      />
    </div>
  );
}
