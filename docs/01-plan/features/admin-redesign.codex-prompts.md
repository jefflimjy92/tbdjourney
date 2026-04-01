# 어드민 구조 개편 — Codex 구현 프롬프트

> 사용법: 각 Phase 프롬프트를 `omc ask codex`에 그대로 붙여넣기
> 순서대로 실행할 것 (Phase 0 → 1 → 2 → ... → 9)
> 플랜 문서: `docs/01-plan/features/admin-redesign.plan.md`

---

## 프로젝트 공통 컨텍스트 (모든 프롬프트에 자동 포함됨)

```
Tech: React 18 + TypeScript + Vite 6 + Tailwind CSS v4
라우팅: React Router 없음. App.tsx의 activeTab(NavItem) 상태로 switch 렌더링.
딥링크 패턴: "consultation:REQ_ID", "case-detail:REQ_ID" 형태로 페이지+파라미터 전달.
Path alias: @ → src
아이콘: Lucide React
컴포넌트: Shadcn/Radix (src/app/components/ui/)
토스트: import { toast } from 'sonner'
스타일: Tailwind 유틸리티 + clsx()
```

---

## Phase 0 — navConfig.ts 메뉴 개편

```
파일: src/app/navigation/navConfig.ts

다음 작업을 수행해:

1. NavItem 유니온 타입에 'case-detail' 추가

2. FULL_NAV_SECTIONS를 아래 구조로 완전히 교체:
   - 대시보드 (dashboard)
   - 접수 관리 (requests)
   ─────────── [콜팀] ───────────
   - DB 분류/배정 (leads) — call_lead만 표시
   - 상담/TM (consultation) — 기존 서브메뉴(tm-first, tm-second, tm-checklist) 제거하고 단일 메뉴로
   ─────────── [영업팀] ───────────
   - 미팅 인계 (handoff) — sales_lead만 표시
   - 미팅 (meeting-all) — 단일 메뉴
   - 미팅 일정 (meeting-schedule)
   - 계약 목록 (contracts)
   ─────────── [청구팀] ───────────
   - 청구 (claims-all) — 단일 메뉴, 기존 서브메뉴 제거
   - 간편청구 (simple-claims)
   ─────────────────────────────
   - 고객 관리 (customers)
   - 일일 보고서 (daily-report)
   - 이탈 로그 (dropoff)
   - 설정 (settings)

3. ROLE_VISIBLE_SECTIONS를 아래로 업데이트:
   call_member:  ['dashboard', 'requests', 'consultation', 'daily-report']
   call_lead:    ['dashboard', 'requests', 'leads', 'consultation', 'daily-report']
   sales_member: ['dashboard', 'meeting-all', 'meeting-schedule', 'contracts']
   sales_lead:   ['dashboard', 'customers', 'handoff', 'meeting-all', 'meeting-schedule', 'contracts', 'daily-report']
   claims_member:['dashboard', 'claims-all', 'simple-claims']
   claims_lead:  ['dashboard', 'customers', 'claims-all', 'simple-claims', 'daily-report']
   cs:           ['dashboard', 'customers', 'requests', 'dropoff']
   compliance:   ['dashboard', 'customers', 'requests', 'settings']
   admin:        전체

주의: ROLE_VISIBLE_SECTIONS에서 섹션 id 문자열은 FULL_NAV_SECTIONS의 id와 일치해야 함.
NavItem 타입에서 제거하지 말 것 (App.tsx에서 여전히 참조됨). 타입만 추가.
```

---

## Phase 1 — App.tsx 라우팅 개편

```
파일: src/app/App.tsx

현재 코드 구조:
- lazyNamed() 헬퍼로 컴포넌트 lazy import
- activeTab: NavItem 상태로 페이지 전환
- handleNavigate(target: string)에서 딥링크 처리
- renderContent()에서 switch로 컴포넌트 렌더링
- getHeaderTitle()에서 헤더 타이틀 반환

다음 작업을 수행해:

1. lazyNamed로 CaseDetailPage import 추가:
   const CaseDetailPage = lazyNamed(() => import('./pages/CaseDetailPage'), 'CaseDetailPage');

2. AppShell 함수 컴포넌트 안에서:
   - activeTab 타입: NavItem (이미 'case-detail'이 추가되어 있음)
   - targetRequestId 상태와 함께 initialSection 상태 추가:
     const [initialSection, setInitialSection] = useState<'call' | 'sales' | 'claims'>('call');

3. handleNavigate 업데이트:
   기존:
     path === 'consultation' → setActiveTab('consultation')
     path === 'meeting-all' → setActiveTab('meeting-all')
     path === 'claims-all' → setActiveTab('claims-all')
   변경:
     path === 'consultation' → setInitialSection('call'); setActiveTab('case-detail')
     path === 'consultation-v2' → setInitialSection('call'); setActiveTab('case-detail')
     path === 'meeting-all' → setInitialSection('sales'); setActiveTab('case-detail')
     path === 'claims-all' → setInitialSection('claims'); setActiveTab('case-detail')
     path === 'case-detail' → setActiveTab('case-detail') (initialSection은 그대로)
   기존 path들도 fallback으로 남겨둘 것 (기존 페이지 유지)

4. renderContent()에 추가:
   case 'case-detail':
     return <CaseDetailPage
       requestId={targetRequestId ?? ''}
       initialSection={initialSection}
       onNavigate={handleNavigate}
     />;

5. getHeaderTitle()에 추가:
   case 'case-detail': return '케이스 상세';
```

---

## Phase 2 — CaseHeader 컴포넌트 (신규)

```
신규 파일: src/app/components/case/CaseHeader.tsx

참고 파일: src/app/components/journey/JourneyHeader.tsx (구조 참고)
참고 hook: src/app/journey/JourneyContext.tsx → useJourney(requestId)
참고 타입: src/app/journey/types.ts → JourneyPhase, JourneyType, TeamRole

useJourney(requestId)가 반환하는 journey 객체의 주요 필드:
  - journey.customerName: string
  - journey.customerPhone: string (있으면 사용, 없으면 '-')
  - journey.type: JourneyType ('refund' | 'simple' | 'intro' | 'family')
  - journey.phase: JourneyPhase
  - journey.stage: JourneyStage
  - journey.owner: string (현재 담당자명)
  - journey.currentStageStatus.statusLabel: string

만들 컴포넌트:

export function CaseHeader({ requestId }: { requestId: string }) {
  // useJourney로 journey 가져오기
  // journey 없으면 null 반환

  // 표시할 정보:
  // 1. 접수ID (requestId) — 회색 뱃지
  // 2. 고객명
  // 3. 연락처 (journey.customerPhone ?? '-')
  // 4. 케이스 유형 한글 변환:
  //    refund → '3년환급', simple → '간편청구', intro → '소개', family → '가족'
  // 5. 현재 단계 (journey.phase 한글):
  //    inflow→'유입', inquiry→'조회/신청', classification→'선별/배정',
  //    tm→'상담/TM', meeting→'미팅/계약', claims→'청구',
  //    payment→'지급/사후', growth→'Growth'
  // 6. 현재 상태 라벨 (journey.currentStageStatus.statusLabel)
  // 7. 담당자 (journey.owner)
}

스타일: JourneyHeader.tsx와 유사하게 rounded-2xl border border-slate-200 bg-white shadow-sm
상단 1행: 접수ID | 고객명 | 연락처 | 케이스유형 | 현재단계 뱃지들
하단 1행: 상태라벨 | 담당자
```

---

## Phase 3 — HandoffModal (신규)

```
신규 파일: src/app/components/HandoffModal.tsx

Shadcn Dialog 컴포넌트 사용:
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
  import { Button } from '@/app/components/ui/button';
  import { Checkbox } from '@/app/components/ui/checkbox';
  import { AlertTriangle } from 'lucide-react';
  import { toast } from 'sonner';

타입 정의:
interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
}

interface HandoffModalProps {
  requestId: string;
  handoffType: 'call-to-sales' | 'sales-to-claims';
  onConfirm: (acknowledged: boolean) => void; // true=정상, false=미충족 인계
  onCancel: () => void;
}

체크리스트 데이터:

const CALL_TO_SALES_CHECKLIST: ChecklistItem[] = [
  { id: 'health-check', label: '건강 체크리스트 완료', required: true },
  { id: 'consultation-note', label: '상담 내용 (1/2차) 입력 완료', required: true },
  { id: 'customer-trait', label: '고객 성향/주의사항 메모 작성', required: false },
  { id: 'meeting-fit', label: '미팅 적합 판정 확인', required: true },
];

const SALES_TO_CLAIMS_CHECKLIST: ChecklistItem[] = [
  { id: 'contract-info', label: '계약 정보 저장 완료 (보험사/보험료/가입일)', required: true },
  { id: 'insurance-policy-request', label: '보험증권: 고객이 보험사에 팩스 요청 완료', required: true },
  { id: 'payment-history-request', label: '지급내역서: 고객이 보험사에 팩스 요청 완료', required: true },
  { id: 'consent-form', label: '수급 동의서 + 위임장 서명 완료', required: true },
  { id: 'agreement', label: '약정서 확인', required: true },
  { id: 'refund-notice', label: '고객 환급 안내 완료', required: false },
];

동작 로직:
1. 사용자가 체크박스 체크
2. [인계 완료] 버튼 클릭 시:
   - 필수 항목 중 미체크 있으면:
     → 화면 내 경고 배너 표시 (AlertTriangle 아이콘 + "필수 항목이 미완료입니다. 그래도 인계하시겠습니까?")
     → [그래도 인계] 버튼 추가 표시
     → [그래도 인계] 클릭 시: onConfirm(false) 호출 + toast.warning('미충족 인계가 기록됩니다.')
   - 모두 체크되면:
     → onConfirm(true) 호출
3. [취소] 버튼 → onCancel() 호출

헤더 타이틀:
  call-to-sales → '콜팀 → 영업팀 인계'
  sales-to-claims → '영업팀 → 청구팀 인계'
```

---

## Phase 4 — CallTeamSection (신규)

```
신규 파일: src/app/components/case/CallTeamSection.tsx

참고 파일:
  - src/app/pages/Consultation.tsx (디테일 패널 UI 패턴 참고)
  - src/app/pages/tm/FirstTM.tsx (1차 상담 필드)
  - src/app/pages/tm/SecondTM.tsx (2차 상담 필드)

Shadcn 컴포넌트:
  import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/app/components/ui/accordion';
  import { Button } from '@/app/components/ui/button';
  import { Badge } from '@/app/components/ui/badge';

Props:
interface CallTeamSectionProps {
  requestId: string;
  isEditable: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onHandoff: () => void; // HandoffModal 트리거
}

섹션 구조 (Accordion 내부 3개 서브 섹션):

[접수 정보]
  - DB 분류 결과 (journey.dbCategory 표시 — 편집 불가, 읽기 표시)
  - 접수 채널
  - 배정 정보 (journey.owner)

[1차 상담]
  - 건강 체크리스트 (체크박스 목록, isEditable일 때만 체크 가능)
  - 보험 현황 입력 (textarea, isEditable일 때만 편집)
  - 초기 고객 반응 (select or textarea)

[2차 상담]
  - 심화 상담 내용 (textarea)
  - 미팅 적합 판정 (select: 적합/보류/부적합)
  - 고객 성향/주의사항 메모 (textarea)

[인계 액션] — isEditable일 때만 표시
  <Button onClick={onHandoff} className="w-full">
    영업팀에 인계하기 →
  </Button>

주의:
  - isEditable=false 일 때 모든 입력값은 읽기전용 텍스트로 표시
  - 실제 데이터 저장은 mock 수준 (useState로 로컬 상태 관리)
  - journey 데이터는 useJourney(requestId) hook으로 가져오기
```

---

## Phase 5 — SalesTeamSection (신규)

```
신규 파일: src/app/components/case/SalesTeamSection.tsx

참고 파일:
  - src/app/pages/MeetingExecution.tsx (미팅 실행 UI 패턴)
  - src/app/pages/meeting/PreAnalysis.tsx
  - src/app/pages/meeting/ContractClose.tsx

Props:
interface SalesTeamSectionProps {
  requestId: string;
  isEditable: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onHandoff: () => void;
}

섹션 구조:

[사전 분석]
  - 보장 분석 메모 (textarea)
  - 미팅 전략 메모 (textarea)
  - 미팅 예정일 (date input)

[미팅 실행]
  - 현장 체크리스트 (체크박스 목록)
    · 고객 신분증 확인
    · 청약서 서명 완료
    · 고객 질문 응대 완료
  - 미팅 기록 (textarea)

[계약 체결]
  - 보험사명 (text input)
  - 월 보험료 (number input, 단위: 원)
  - 가입일 (date input)
  - 전자서명 상태 (select: 미완료/진행중/완료)
  - 설계사 정보: journey.owner 값 읽기전용 표시 (별도 입력 필드 없음)

[인계 액션] — isEditable일 때만
  <Button onClick={onHandoff}>청구팀에 인계하기 →</Button>

주의:
  - isEditable=false → 읽기전용
  - useState로 로컬 상태 관리 (mock)
  - useJourney(requestId)로 데이터 참조
```

---

## Phase 6 — ClaimsTeamSection (신규)

```
신규 파일: src/app/components/case/ClaimsTeamSection.tsx

참고 파일: src/app/pages/Claims.tsx (STEP 구조 참고)

Shadcn:
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
  import { Button } from '@/app/components/ui/button';
  import { Badge } from '@/app/components/ui/badge';

Props:
interface ClaimsTeamSectionProps {
  requestId: string;
  isEditable: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  isClaimsLead: boolean; // 청구팀장 여부 (STEP 0 배정 드롭다운 표시용)
}

레이아웃: 세로 탭 (좌측 STEP 목록 + 우측 콘텐츠)

STEP 목록 (좌측 세로):
  STEP 0: 접수 확인
  STEP 1: 고객 프로필
  STEP 2: 데이터 통합
  STEP 3: 지급내역서
  STEP 4: 미지급 분석
  STEP 5: 서류 발급
  STEP 6: 서류 OCR
  STEP 7: 최종 확정

각 STEP 콘텐츠 (우측):

STEP 0 — 접수 확인:
  - 영업팀 인계 메모 표시 (읽기전용)
  - isClaimsLead일 때: 담당자 배정 드롭다운
    const MOCK_CLAIMS_MEMBERS = [
      { id: 'cm1', name: '김청구' },
      { id: 'cm2', name: '이청구' },
      { id: 'cm3', name: '박청구' },
    ];
    <Select onValueChange={(val) => toast.success(`${val}에게 배정되었습니다.`)}>
      <SelectTrigger><SelectValue placeholder="담당자 선택" /></SelectTrigger>
      <SelectContent>
        {MOCK_CLAIMS_MEMBERS.map(m => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
      </SelectContent>
    </Select>

STEP 1 — 고객 프로필:
  - 실손보험 정보 입력 (보험사, 보험 종류, 가입일)
  - 설계사 정보: journey.owner 읽기전용 표시 (영업팀 담당자가 곧 설계사)

STEP 2 — 데이터 통합:
  - 심평원/홈택스/건강보험 연동 현황 (각각 상태 뱃지: 미연동/연동중/완료)
  - 예상 청구액 표시

STEP 3~7 — 나머지:
  - 각 STEP별 상태 텍스트 + "준비중" placeholder UI
  - isEditable=false → 읽기전용

주의: 세로탭 선택은 로컬 useState로 관리
```

---

## Phase 7 — CaseDetailPage (신규)

```
신규 파일: src/app/pages/CaseDetailPage.tsx

import:
  - CaseHeader from '@/app/components/case/CaseHeader'
  - CallTeamSection from '@/app/components/case/CallTeamSection'
  - SalesTeamSection from '@/app/components/case/SalesTeamSection'
  - ClaimsTeamSection from '@/app/components/case/ClaimsTeamSection'
  - HandoffModal from '@/app/components/HandoffModal'
  - useJourney from '@/app/journey/JourneyContext'
  - useRole from '@/app/auth/RoleContext'

Props:
interface CaseDetailPageProps {
  requestId: string;
  initialSection?: 'call' | 'sales' | 'claims';
  onNavigate: (target: string) => void;
}

구현:

export function CaseDetailPage({ requestId, initialSection, onNavigate }: CaseDetailPageProps) {
  const { journey } = useJourney(requestId);
  const { role } = useRole();

  // 현재 담당팀 판단
  const isCallTeam = role === 'call_member' || role === 'call_lead';
  const isSalesTeam = role === 'sales_member' || role === 'sales_lead';
  const isClaimsTeam = role === 'claims_member' || role === 'claims_lead';
  const isClaimsLead = role === 'claims_lead';

  // journey.phase 기준으로 현재 활성 섹션 결정
  const getActiveSection = (): 'call' | 'sales' | 'claims' => {
    if (!journey) return initialSection ?? 'call';
    const phase = journey.phase;
    if (['inflow', 'inquiry', 'classification', 'tm'].includes(phase)) return 'call';
    if (phase === 'meeting') return 'sales';
    if (['claims', 'payment', 'growth'].includes(phase)) return 'claims';
    return initialSection ?? 'call';
  };

  const [expandedSection, setExpandedSection] = useState<string[]>([getActiveSection()]);
  const [handoffModal, setHandoffModal] = useState<'call-to-sales' | 'sales-to-claims' | null>(null);

  // 담당팀 여부 (현재 journey.phase 기준)
  const currentSection = getActiveSection();
  const isCallEditable = isCallTeam && currentSection === 'call';
  const isSalesEditable = isSalesTeam && currentSection === 'sales';
  const isClaimsEditable = isClaimsTeam && currentSection === 'claims';

  const handleHandoffConfirm = (acknowledged: boolean) => {
    if (!acknowledged) {
      // TODO: audit log에 handoff_incomplete 기록 (현재는 console.log)
      console.log('handoff_incomplete', { requestId, handoffType: handoffModal });
    }
    setHandoffModal(null);
    toast.success('인계가 완료되었습니다.');
    // TODO: journey.phase 업데이트
  };

  레이아웃:
  <div className="space-y-4">
    <CaseHeader requestId={requestId} />
    
    // Accordion — Radix/Shadcn Accordion type="multiple"
    <Accordion type="multiple" value={expandedSection} onValueChange={setExpandedSection}>
      <AccordionItem value="call">
        <AccordionTrigger>[콜팀] 접수/상담/TM</AccordionTrigger>
        <AccordionContent>
          <CallTeamSection
            requestId={requestId}
            isEditable={isCallEditable}
            isExpanded={expandedSection.includes('call')}
            onToggle={() => {}}
            onHandoff={() => setHandoffModal('call-to-sales')}
          />
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="sales">
        <AccordionTrigger>[영업팀] 미팅/계약</AccordionTrigger>
        <AccordionContent>
          <SalesTeamSection
            requestId={requestId}
            isEditable={isSalesEditable}
            isExpanded={expandedSection.includes('sales')}
            onToggle={() => {}}
            onHandoff={() => setHandoffModal('sales-to-claims')}
          />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="claims">
        <AccordionTrigger>[청구팀] 청구 처리</AccordionTrigger>
        <AccordionContent>
          <ClaimsTeamSection
            requestId={requestId}
            isEditable={isClaimsEditable}
            isExpanded={expandedSection.includes('claims')}
            onToggle={() => {}}
            isClaimsLead={isClaimsLead}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>

    {handoffModal && (
      <HandoffModal
        requestId={requestId}
        handoffType={handoffModal}
        onConfirm={handleHandoffConfirm}
        onCancel={() => setHandoffModal(null)}
      />
    )}
  </div>
}

주의:
  - requestId가 빈 문자열이면 "케이스를 선택해주세요." 안내 메시지 표시
  - useRole()에서 role 가져오는 방법은 src/app/auth/RoleContext.tsx 참고
  - toast import: import { toast } from 'sonner'
```

---

## Phase 8 — Handoff.tsx 미팅 인계 큐 개편

```
수정 파일: src/app/pages/Handoff.tsx

현재 파일 먼저 읽고 기존 구조를 파악한 뒤 아래 기능을 추가/수정해:

추가할 기능:

1. 미배정 케이스 카드 (상단 섹션 — "미배정 케이스")
   표시 정보:
   - 고객명 + 지역 (주소)
   - 케이스 유형 (3년환급/소개)
   - DB 분류
   - 콜팀 인계 메모 (고객 성향/주의사항)
   - 인계 시각

   Mock 데이터:
   const MOCK_UNASSIGNED = [
     { id: 'REQ-001', customerName: '홍길동', region: '강남구', type: 'refund', dbCategory: 'possible', callNote: '급한 성격, 환급 관심 높음', handoffAt: '2026-04-01 14:30' },
     { id: 'REQ-002', customerName: '김영희', region: '서초구', type: 'intro', dbCategory: 'referral', callNote: '차분함, 소개받은 케이스', handoffAt: '2026-04-01 15:10' },
   ];

2. 영업팀원 배정 UI (각 카드 하단)
   표시 정보:
   - 담당자명 | 담당 지역 | 이번주 목요일 미팅 수 (전체 케이스 수 X)

   Mock 데이터:
   const MOCK_SALES_MEMBERS = [
     { id: 'sm1', name: '김영업', region: '강남구', thursdayMeetings: 2 },
     { id: 'sm2', name: '이영업', region: '서초구', thursdayMeetings: 1 },
     { id: 'sm3', name: '박영업', region: '마포구', thursdayMeetings: 3 },
   ];

   배정 Select:
   <Select onValueChange={(memberId) => handleAssign(caseId, memberId)}>
     <SelectTrigger><SelectValue placeholder="담당자 배정" /></SelectTrigger>
     <SelectContent>
       {MOCK_SALES_MEMBERS.map(m => (
         <SelectItem key={m.id} value={m.id}>
           {m.name} — {m.region} — 목요일 미팅 {m.thursdayMeetings}건
         </SelectItem>
       ))}
     </SelectContent>
   </Select>

3. handleAssign(caseId, memberId):
   - 해당 케이스를 MOCK_UNASSIGNED에서 제거 (useState 업데이트)
   - toast.success(`배정 완료: ${memberName}에게 ${caseId} 배정됨`)
   - 상단 벨 아이콘 알림 뱃지 증가 (App.tsx 수준 상태 없으면 로컬 카운터로)

4. 권한 체크: useRole()에서 role가져와서 sales_lead가 아니면 "접근 권한이 없습니다." 표시
```

---

## Phase 9 — Leads.tsx DB분류/배정 균등배분 개편

```
수정 파일: src/app/pages/Leads.tsx

현재 파일 먼저 읽고 기존 구조를 파악한 뒤 아래 기능을 추가해:

추가할 UI 섹션 (기존 리스트 상단에 배치):

1. 다중 선택 모드 토글 버튼:
   <Button variant="outline" onClick={() => setSelectMode(!selectMode)}>
     {selectMode ? '선택 취소' : '균등 배분 시작'}
   </Button>

2. selectMode=true일 때:
   - 각 접수건 행 좌측에 체크박스 표시
   - 선택된 건수 표시: "N건 선택됨"

3. 콜팀원 다중 선택 패널 (selectMode=true):
   Mock 데이터:
   const MOCK_CALL_MEMBERS = [
     { id: 'cm1', name: '김상담', currentCount: 5 },
     { id: 'cm2', name: '이상담', currentCount: 3 },
     { id: 'cm3', name: '박상담', currentCount: 4 },
   ];
   각 팀원 체크박스로 다중 선택

4. [배분 미리보기] 버튼:
   - 선택된 접수건 N개 ÷ 선택된 팀원 M명 = 1인당 몇 건
   - 나머지는 앞 팀원부터 1건씩 추가
   - 미리보기 테이블 표시: 팀원명 | 배정 건수 | 배정될 접수ID 목록

5. [배분 확정] 버튼:
   - journey.owner 업데이트 (mock: useState로 처리)
   - toast.success('균등 배분이 완료되었습니다.')
   - selectMode 종료, 체크박스 해제

주의: 기존 Leads.tsx의 기존 기능 (리스트 표시, 필터 등) 건드리지 말고 추가만 할 것
```

---

## 빌드 검증 (각 Phase 완료 후 실행)

```bash
# 개별 파일 빌드 테스트
npx esbuild src/app/pages/CaseDetailPage.tsx --bundle --jsx=automatic --platform=browser \
  --loader:.tsx=tsx --external:react --external:react-dom --external:clsx \
  --external:lucide-react --external:'@/*' --outfile=/dev/null

# 전체 빌드
npm run build
```

---

## 실행 순서 요약

```
Phase 0: navConfig.ts 메뉴 정리
    ↓
Phase 1: App.tsx에 case-detail 라우팅 추가
    ↓
Phase 2: CaseHeader.tsx 신규 생성
Phase 3: HandoffModal.tsx 신규 생성  ← 2,3 병렬 가능
    ↓
Phase 4: CallTeamSection.tsx
Phase 5: SalesTeamSection.tsx        ← 4,5,6 병렬 가능
Phase 6: ClaimsTeamSection.tsx
    ↓
Phase 7: CaseDetailPage.tsx (조립)
    ↓
Phase 8: Handoff.tsx 개편
Phase 9: Leads.tsx 개편              ← 8,9 병렬 가능
```
