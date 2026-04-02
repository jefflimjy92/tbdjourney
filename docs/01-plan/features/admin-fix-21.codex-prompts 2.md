# 어드민 기능 수정 21항목 — Codex 구현 프롬프트

> 사용법: 각 Sprint 프롬프트를 `omc ask codex`에 그대로 붙여넣기
> 순서대로 실행할 것 (Sprint 1 → 2 → 3 → 4 → 5)
> 각 Sprint 완료 후 빌드 검증: `npm run build`

---

## 프로젝트 공통 컨텍스트 (모든 프롬프트에 자동 포함됨)

```
Tech: React 18 + TypeScript + Vite 6 + Tailwind CSS v4
라우팅: React Router 없음. App.tsx의 activeTab(NavItem) 상태로 switch 렌더링.
Path alias: @ → src
아이콘: Lucide React
컴포넌트: Shadcn/Radix (src/app/components/ui/)
토스트: import { toast } from 'sonner'
스타일: Tailwind 유틸리티 + clsx()
역할 시스템: useRole() → currentRole (call_member, call_lead, sales_member, sales_lead, claims_member, claims_lead, cs, compliance, admin)
여정 데이터: useJourneyStore() → journeys, patchJourney() / useJourney(requestId) → journey
기간 필터: ListPeriodControls 컴포넌트 + performancePeriodUtils.ts
직원 현황: EmployeeStepMatrixOverview 컴포넌트
```

---

## Sprint 1 — 공통 + 처리 현황 (항목 3, 4, 5, 6, 7)

### Sprint 1-A: 기간 기본값 일괄 변경 (항목 6)

```
다음 파일들에서 periodPreset 초기값을 'this_month' → 'all'로 일괄 변경해:

1. src/app/pages/Requests.tsx (line 178)
   const [periodPreset, setPeriodPreset] = useState<PerformancePeriodPreset>('this_month');
   → 'all'로 변경

2. src/app/pages/Leads.tsx (line 133)
   → 'all'로 변경

3. src/app/pages/Consultation.tsx (line 276, line 498 — 두 곳)
   → 둘 다 'all'로 변경

4. src/app/pages/MeetingExecution.tsx (line 1313)
   → 'all'로 변경

5. src/app/pages/Claims.tsx (line 650, line 916 — 두 곳)
   → 둘 다 'all'로 변경

6. src/app/pages/ContractList.tsx (line 492)
   → 'all'로 변경

7. src/app/pages/Customers.tsx (line 273)
   → 'all'로 변경

총 9곳의 'this_month'를 'all'로 변경.
다른 로직은 건드리지 말 것. 기존 정렬(접수일/배정일 내림차순)은 유지.
```

### Sprint 1-B: 처리 현황 페이지 개편 (항목 3, 4, 5, 7)

```
파일: src/app/pages/Requests.tsx

현재 파일을 먼저 전체 읽고 구조를 파악한 뒤 아래 변경을 수행해:

1. [항목 3] 수치 배너 제거
   - 상단 "조회 완료율", "조회→신청 전환율", "신청 이탈률" 배너 영역 전체 삭제
   - 관련 계산 로직(lookupRate, conversionRate, dropoutRate)도 함께 제거
   - 배너가 있던 자리에 아무것도 렌더링하지 말 것

2. [항목 5] 탭 5개로 변경
   기존 STEP_TABS (S2~S9 기반 9개 탭)를 아래 5개로 교체:
   
   const STEP_TABS = [
     { key: 'all', label: '전체' },
     { key: 'intake', label: '접수' },
     { key: 'consultation', label: '상담' },
     { key: 'meeting', label: '미팅' },
     { key: 'claims', label: '청구' },
     { key: 'closed', label: '종결' },
   ];
   
   필터링 로직 변경:
   - 'intake': journey.phase === 'inflow' || journey.phase === 'inquiry' || journey.phase === 'classification'
   - 'consultation': journey.phase === 'tm'
   - 'meeting': journey.phase === 'meeting'
   - 'claims': journey.phase === 'claims' || journey.phase === 'payment'
   - 'closed': journey.phase === 'growth' 또는 status에 '종결', '완료', '노쇼', '취소' 포함
   
   기존 step 기반 필터 → phase 기반 필터로 전환.
   각 탭에 건수 카운트 뱃지 유지.

3. [항목 4] 테이블 컬럼 변경
   - "담당팀" 열 제거 (팀명 표시 삭제)
   - "현재 단계" 열에는 담당자명만 표시 (팀명 없이)
   - 기존 컬럼 뒤에 "담당 영업직원" 열 추가:
     · 값: journey.meetingDraft?.assignedStaff 또는 빈 문자열
     · 빈값이면 '-' 표시
   
4. [항목 7] 상태 필터 드롭다운 추가
   - 테이블 상단 헤더 영역 (ListPeriodControls 옆)에 상태 필터 Select 추가
   - Shadcn Select 사용:
     import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
   - 옵션: '전체 상태', 그리고 현재 필터된 데이터에서 추출한 고유 status 값들
   - 선택 시 리스트를 해당 status로 추가 필터링
   - state: const [statusFilter, setStatusFilter] = useState<string>('all');

주의: 기존 검색, onNavigate, 딥링크 로직은 건드리지 말 것.
```

---

## Sprint 2 — DB 분류/배정 (항목 1, 2)

```
파일: src/app/pages/Leads.tsx

현재 파일을 먼저 전체 읽고 구조를 파악한 뒤 아래 변경을 수행해:

1. [항목 2] 버튼 제거 및 변경
   - "자동 분류" 버튼: 완전 제거 (handleAutoClassify 관련 모달/confirm/로직도 함께 제거)
   - "정기 배정 (N건 미배정)" 버튼: 완전 제거 (showScheduleModal 관련 모달/로직도 함께 제거)
   - "균등 배분 시작" 버튼 텍스트 → "상담원 배정" 으로 변경
   - 관련 state (showScheduleModal, showClassifyConfirm, assignmentType, scheduleSlot, urgentReason 등) 중 
     더 이상 사용되지 않는 것들 정리

2. [항목 1] 탭 구분 변경
   - 인트로DB 탭, 보상DB 탭: 해당 탭 선택 시 서브필터/분류 UI가 있으면 제거
     (현재 DB_FILTER_TABS 자체는 유지하되, 탭 내부의 추가 분류/서브필터만 제거)
   - 소개DB 탭: 기존 구분 UI 유지
   - 소개DB 케이스는 상담팀 절차(상담원 배정) 없이 바로 영업 직원으로 미팅 인계 처리:
     · 소개DB 탭에서 "상담원 배정" 대신 "미팅 인계" 버튼 표시
     · 클릭 시 toast.success('소개DB: 소개자 동일 영업직원에게 미팅 인계됨')

주의: 
- 기존 리스트 테이블, 검색, 기간 필터, 드로어(상세보기) 기능은 건드리지 말 것
- selectMode 관련 균등배분 미리보기/확정 로직은 유지 (버튼 텍스트만 변경)
```

---

## Sprint 3 — 상담/TM (항목 8, 9, 10, 20, 21)

### Sprint 3-A: 품질 모니터링 탭 제거 + 직원 현황 본인 필터 (항목 10, 8)

```
파일: src/app/pages/Consultation.tsx

현재 파일을 먼저 전체 읽고 구조를 파악한 뒤 아래 변경을 수행해:

1. [항목 10] 품질 모니터링 탭 완전 제거
   - 탭 배열에서 '품질 모니터링' 항목 삭제
   - 해당 탭 선택 시 렌더링되는 QualityMonitoringPanel (또는 해당 JSX 블록) 제거
   - 탭이 3개(건별 목록, 직원 현황, 품질 모니터링) → 2개(건별 목록, 직원 현황)로 변경

2. [항목 8] 직원 현황 본인 데이터만 표시
   - useRole()에서 currentRole 가져오기
   - call_member 역할일 때: 직원 현황 탭의 데이터를 본인 이름으로 필터링
   - 구현 방법:
     · EmployeeStepMatrixOverview에 전달하는 데이터를 필터링
     · call_member일 때: items.filter(item => item.ownerName === 현재사용자명)
     · 현재 사용자명은 useRole()의 roleLabel 또는 mock으로 '김상담' 사용
     · call_lead, admin 등은 전체 표시 유지

주의: 건별 목록 탭의 기존 기능(상담 처리 드로어, 검색, 필터 등)은 건드리지 말 것.
```

### Sprint 3-B: 스텝 헤더 변경 + 이탈 건 모달 (항목 9)

```
파일: src/app/components/operations/EmployeeStepMatrixOverview.tsx
참고: src/app/pages/Consultation.tsx (CONSULTATION_STEPS 정의)

현재 파일을 먼저 전체 읽고 구조를 파악한 뒤 아래 변경을 수행해:

1. 스텝 헤더 라벨 변경
   각 스텝 헤더를 다음과 같이 변경:
   - STEP 0: 메인 라벨 "배정대기" + 작은 글씨 "취소 불가"
   - STEP 1: 메인 라벨 "1차콜" + 작은 글씨 "취소 불가"
   - STEP 2: 메인 라벨 "2차콜" + 작은 글씨 "취소 불가"
   - STEP 3: 메인 라벨 "미팅인계" + 작은 글씨 "취소 불가"
   
   헤더 렌더링 예시:
   <div>
     <span className="font-bold text-sm">{label}</span>
     <span className="text-[10px] text-rose-500 ml-1">취소 불가</span>
   </div>

2. 이탈 수 숫자 클릭 → 모달 팝업
   - 각 스텝의 이탈 건수 숫자를 클릭 가능하게 변경 (button 또는 clickable span)
   - 클릭 시 Dialog 모달 팝업:
     import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
   - 모달 내용: 해당 스텝의 이탈 건 리스트 (고객명, 접수ID, 이탈 사유, 이탈일)
   - mock 데이터로 2~3건 표시
   - state: const [dropoutModal, setDropoutModal] = useState<{ step: string; items: any[] } | null>(null);

주의: 이 컴포넌트는 Consultation, MeetingExecution, Claims에서 공통으로 사용됨. 
변경이 다른 페이지에도 적용됨을 인지하고 범용적으로 구현할 것.
```

### Sprint 3-C: 상태값 구조 수정 + 취소 불가 자동 연동 (항목 20, 21)

```
파일: src/app/components/StepStageSelector.tsx
참고: src/app/pages/Consultation.tsx (selectedStatus 사용처)

현재 파일을 먼저 전체 읽고 구조를 파악한 뒤 아래 변경을 수행해:

1. [항목 20] 상태값에서 제거 → 불가 사유로 이동
   현재 2차 상담 스텝의 상태 옵션:
     { id: '2nd-exception', label: '보험사 예외질환' }
     { id: '2nd-planner-relation', label: '설계사 친인척 관계' }
   
   이 두 항목을 상태값 선택지에서 제거하고,
   '불가' 또는 'impossible' 상태 선택 시 사유 선택란(REASON_OPTIONS)으로 이동:
   
   REASON_OPTIONS['impossible'] 배열에 추가:
     { id: 'exception-disease', label: '보험사 예외질환' }
     { id: 'planner-relative', label: '설계사 친인척 관계' }
   
   기존 REASON_OPTIONS['2nd-exception']과 REASON_OPTIONS['2nd-planner-relation'] 키는 제거.
   
   Consultation.tsx의 validation 로직(line 1497)에서도 
   '2nd-exception', '2nd-planner-relation'을 제거하고,
   'impossible' 상태에서 사유 필수 체크가 이미 포함되어 있는지 확인.

2. [항목 21] 취소 불가 처리 자동 연동
   1차 또는 2차 상담에서 상태값을 '1st-cancel' 또는 '2nd-cancel' 선택 시:
   - 전체 케이스 상태를 "종결 - 취소 불가"로 자동 반영
   - 구현 방법:
     · StepStageSelector의 onStatusChange 콜백 호출 시,
       '1st-cancel' 또는 '2nd-cancel'이면 추가로 부모에게 알림
     · 새 prop 추가: onCancelNotPossible?: (step: '1st' | '2nd') => void;
     · Consultation.tsx에서 이 콜백을 받아:
       - patchJourney(requestId, j => ({ ...j, status: '종결 - 취소 불가', phase: 'growth' }))
       - 단, auditTrail에 어느 단계(1차/2차)에서 취소 불가 처리됐는지 기록:
         auditTrail: [buildAudit('status_changed', actor, `${step}차 상담 후 취소 불가 처리`), ...]
       - toast.info('종결 - 취소 불가 처리가 완료되었습니다.')
   - 내부적으로 이력(1차에서 처리됐는지 2차에서 처리됐는지)은 auditTrail로 보존

주의:
- StepStageSelector.tsx의 기존 스텝 구조(step0~step3), 기존 상태 옵션들은 유지
- '2nd-exception', '2nd-planner-relation'만 상태에서 제거 → 사유로 이동
- 1st-cancel, 2nd-cancel 상태 자체는 유지 (선택 시 자동 종결 연동만 추가)
```

---

## Sprint 4 — 영업팀 (항목 11, 12, 13, 14, 15, 16)

### Sprint 4-A: Handoff 테이블 전환 + 이관 간소화 + 등급 제거 (항목 11, 12, 13)

```
파일: src/app/pages/Handoff.tsx

현재 파일을 먼저 전체 읽고 구조를 파악한 뒤 아래 변경을 수행해:

1. [항목 13] 등급 분류 제거
   - grade state 제거: const [grade, setGrade] = useState<'A' | 'B' | 'C' | ''>('');
   - A/B/C 등급 선택 버튼 UI 제거
   - 큐 테이블에서 "목표 등급" 열 제거
   - 이관 패킷 드로어에서 "1. 등급 부여" 섹션 제거
   - 미리보기 카드에서 등급 표시 제거
   - canHandoff 로직에서 등급 관련 조건 제거

2. [항목 11] 미배정 케이스 카드 → 테이블 전환
   현재 카드형 그리드(lg:grid-cols-2)를 테이블로 변경:
   
   <table> 컬럼 구성:
   | 고객명 | 지역 | 유형 | DB분류 | 병력/보험 요약 | 인계 메모 | 인계 시각 | 담당자 배정 |
   
   - "지역" 열: 볼드 처리로 강조
   - "병력/보험 요약" 열: 1차·2차 TM 확인 내용 요약 (callNote 필드 활용)
   - "담당자 배정" 열: 기존 Select 드롭다운 유지 (MOCK_SALES_MEMBERS)
   - 체크박스 열 추가 (좌측): 다중 선택 후 일괄 배정 가능
   - 상단에 "일괄 배정" 버튼: 선택된 건들을 한 영업직원에게 일괄 배정
   
   테이블 스타일: 기존 프로젝트의 다른 테이블과 동일한 Tailwind 패턴 사용
   (rounded-2xl border border-slate-200 + thead bg-slate-50 + hover:bg-slate-50)

3. [항목 12] 이관 패킷 드로어 대폭 간소화
   현재 6단계 구조(등급/근거/미팅후업무/청구체크리스트/소개DB/다음액션)를 축소:
   
   간소화된 구조:
   - 필수 입력 누락 현황 표시 (block 항목만 빨간색 리스트)
   - 메모 입력 (textarea 1개)
   - [인계 완료] 버튼
   
   총 액션: 누락 확인 → 메모 입력 → 인계 완료 (최대 3클릭 + 메모)
   
   기존 POST_MEETING_DOCS, CLAIM_HANDOFF_CHECKLIST는 제거하거나 
   필수 누락 체크용으로만 활용 (체크박스 UI 아닌, 자동 검증으로 전환)

주의: 
- 기존 탭 필터(전체/미팅팀/청구팀/소개DB), 검색, displayMode 토글은 유지
- sales_lead 권한 체크 유지
- 배정 완료 시 toast + unassignedCases 업데이트 로직 유지
```

### Sprint 4-B: 미팅 리스트 간소화 (항목 14)

```
파일: src/app/pages/MeetingExecution.tsx

현재 파일을 먼저 전체 읽고 구조를 파악한 뒤 아래 변경을 수행해:

1. 간편 청구 기능 제거
   - 미팅 리스트에서 type === '간편 청구' 항목을 필터링하여 숨기기
   - 또는 mock 데이터에서 '간편 청구' 타입 레코드 제거
   - 탭/필터에 '간편 청구' 옵션이 있으면 제거

2. 미팅 리스트 컬럼 재구성
   MEETING_DETAIL_COLUMNS를 다음 중심으로 재구성:
   - DB 유형 (유지)
   - 미팅 장소/시간 (유지)
   - 사전 준비 항목: 건강체크 완료 여부, 보장분석 완료 여부 (체크 아이콘)
   - 연동 내역: 심평원/홈택스/건보 연동 상태 (Badge로 표시)
   - 계약 현황 (유지)
   
   제거할 컬럼:
   - '간편 청구' 관련 표시가 있는 컬럼 내용
   - 복잡한 세부 항목은 상세보기로 이동

주의: 미팅 상세 드로어, PreAnalysis/MeetingOnSite/ContractClose 하위 컴포넌트는 건드리지 말 것.
```

### Sprint 4-C: 미팅 일정 뷰 개선 (항목 15)

```
파일: src/app/pages/MeetingSchedule.tsx

현재 파일을 먼저 전체 읽고 구조를 파악한 뒤 아래 변경을 수행해:

1. 뷰 모드 전환 변경
   현재 viewMode: 'calendar' | 'list' → 'staff' | 'time' 으로 변경
   - 'staff': 직원별 묶음 보기 (직원명으로 그룹핑, 각 직원 하위에 미팅 목록)
   - 'time': 시간순 보기 (시간 순서대로 전체 미팅 나열)
   - 토글 버튼 라벨: "직원별" / "시간순"

2. 주차 필터 자동 설정
   - 현재 해당 주차가 자동으로 선택되어 표시
   - selectedWeek 초기값을 현재 주차로 설정:
     const currentWeek = `${year}-W${weekNumber}`;
     const [selectedWeek, setSelectedWeek] = useState(currentWeek);

3. 상태 배지 클릭 → 필터링
   현재 상단 7개 상태 칩(전체/계약완료/확정/후속/배정중/취소/불가)을 클릭 가능하게:
   - 클릭 시 해당 상태로 리스트 필터링
   - state: const [statusFilter, setStatusFilter] = useState<string>('all');
   - 활성화된 배지는 진한 색상, 나머지는 연한 색상

주의: 기존 팀/직원 필터, mock 데이터 구조는 유지.
```

### Sprint 4-D: 영업 직원 현황 본인 필터 + 이탈 모달 (항목 16)

```
파일: src/app/pages/MeetingExecution.tsx

현재 파일을 먼저 전체 읽고 구조를 파악한 뒤 아래 변경을 수행해:

1. 영업팀원 본인 데이터만 표시
   - useRole()에서 currentRole 가져오기
   - sales_member일 때: 직원 현황 탭의 EmployeeStepMatrixOverview에 전달하는 데이터를
     본인 이름으로 필터링 (mock: '박미팅' 또는 currentRole 기반)
   - sales_lead, admin은 전체 표시 유지

2. STEP별 이탈 수 + 클릭 모달
   - Sprint 3-B에서 EmployeeStepMatrixOverview에 이미 이탈 모달 기능을 추가했으므로,
     여기서는 데이터만 올바르게 전달되는지 확인
   - MeetingExecution의 스텝 데이터가 EmployeeStepMatrixOverview로 정확히 전달되는지 검증

주의: 미팅 상세 드로어, 미팅 실행 기능은 건드리지 말 것.
```

---

## Sprint 5 — 청구팀 (항목 17, 18, 19)

### Sprint 5-A: 3년환급 필터링 + 직원 현황 (항목 17, 18)

```
파일: src/app/pages/Claims.tsx

현재 파일을 먼저 전체 읽고 구조를 파악한 뒤 아래 변경을 수행해:

1. [항목 17] 3년환급 탭 필터링
   - Claims.tsx의 메인 리스트에서 category === 'refund' (3년환급)인 건만 표시
   - 간편청구(category === 'simple')는 별도 탭(간편청구 메뉴)에서만 관리
   - 기존 탭 내 type 필터가 있으면 refund만 남기기

2. [항목 18] 청구팀 직원 현황 개선
   a. 본인 필터:
      - useRole()에서 currentRole 가져오기
      - claims_member일 때: 직원 현황 데이터를 본인 이름으로 필터링
      - claims_lead, admin은 전체 표시

   b. 이탈 정보 미표시:
      - 청구팀 직원 현황에서 이탈 수/이탈률 관련 열 숨기기
      - EmployeeStepMatrixOverview에 hideDropout?: boolean prop 추가 고려
        또는 Claims에서 전달 데이터에서 이탈 관련 필드 제거

   c. 환급금 열 추가:
      - 직원 현황 테이블에 "예상 환급금" 열 추가 (mock: 랜덤 금액 1,000,000 ~ 5,000,000원)
      - "실제 환급금" 열 추가 (mock: 예상의 70~100% 범위)
      - 포맷: toLocaleString() + '원'

주의: Claims.tsx의 기존 7탭 상세 구조(profile/insurance/refund/payout/analysis/docs/final)는 건드리지 말 것.
```

### Sprint 5-B: 간편청구 화면 전면 개편 (항목 19)

```
파일: src/app/pages/simpleClaims/SimpleClaimWorkflow.tsx

이 파일은 전면 개편. 현재 파일을 먼저 전체 읽고 구조를 파악한 뒤 아래와 같이 재작성해:

1. Q1~Q9 스텝 워크플로우 UI 완전 제거
   - StepIndicator, StepDetailPanel, Q2BranchPanel ~ Q9RetentionPanel 등 스텝 관련 컴포넌트 모두 제거
   - 상태값으로 단계를 관리 (접수/처리중/보험사접수/지급대기/완료/반려)

2. 메인 뷰: 테이블 리스트
   리스트 컬럼:
   | 청구번호 | 청구일시 | 대상자 | 병원 | 유형 | 방식 | 상태 | 상세보기 |
   
   - 유형: 본인 / 자녀 / 배우자 / 부모
   - 방식: 직접 / 대행
   - 상태: Badge 컴포넌트로 색상 구분
   - 상세보기: 버튼 클릭 → 상세 패널 열기
   
   Mock 데이터 (기존 MOCK_SIMPLE_CLAIMS 확장):
   const MOCK_SIMPLE_CLAIMS = [
     { id: 'SC-001', claimDate: '2026-03-28 14:30', patientName: '김지우', hospital: '강남세브란스', 
       claimType: '본인', method: '대행', status: '처리중', insuranceCompany: '삼성화재',
       phone: '010-1234-5678', relation: '본인', visitType: '외래', amount: 350000 },
     { id: 'SC-002', claimDate: '2026-03-27 10:15', patientName: '이민수(자녀)', hospital: '서울아산병원',
       claimType: '자녀', method: '직접', status: '보험사접수', insuranceCompany: 'DB손해보험',
       phone: '010-2345-6789', relation: '자녀', visitType: '입원', amount: 1200000 },
     { id: 'SC-003', claimDate: '2026-03-25 09:00', patientName: '박영희', hospital: '분당서울대병원',
       claimType: '본인', method: '대행', status: '완료', insuranceCompany: '한화생명',
       phone: '010-3456-7890', relation: '본인', visitType: '외래', amount: 180000 },
     { id: 'SC-004', claimDate: '2026-03-24 16:45', patientName: '최아라', hospital: '세브란스',
       claimType: '배우자', method: '대행', status: '접수', insuranceCompany: '교보생명',
       phone: '010-4567-8901', relation: '배우자', visitType: '외래', amount: 520000 },
     { id: 'SC-005', claimDate: '2026-03-22 11:30', patientName: '윤서연', hospital: '고려대안암병원',
       claimType: '본인', method: '직접', status: '반려', insuranceCompany: '메리츠화재',
       phone: '010-5678-9012', relation: '본인', visitType: '입원', amount: 2800000 },
   ];

3. 상세 뷰: 건별 실무 처리
   리스트에서 "상세보기" 클릭 시 → 같은 페이지 내 상세 패널 표시 (또는 드로어)
   
   좌측 (2/3 너비):
   - 청구 정보: 청구번호, 청구일시, 청구유형, 청구방식, 현재상태
   - 대상자 정보: 이름, 연락처, 관계(본인/자녀/배우자/부모)
   - 병원 정보: 병원명, 내원 유형(외래/입원)
   - 부상/질병 정보: textarea (mock 데이터)
   - 계좌 정보: 은행명, 계좌번호 (mock)
   - 제출 서류: 서류 목록 (이미지 파일명 + 다운로드 버튼 mock)
   - 보험 현황: 계약 정보, 실손 정보 (ReadOnly)
   
   우측 (1/3 너비):
   - 상태 변경 Select: 접수→처리중→보험사접수→지급대기→완료 / 반려
   - 보험사 배정 Select (mock 보험사 목록)
   - 보험사 청구 정보 입력: 접수번호 input, 접수일 date input
   - 보상파트너 메모: textarea
   - [저장] 버튼
   
   각 섹션은 rounded-2xl border border-slate-200 bg-white shadow-sm 스타일.
   
   상단에 [← 목록으로] 버튼으로 리스트 뷰 복귀.

주의:
- export { SimpleClaimWorkflow } 이름 유지 (App.tsx에서 import)
- 상태 필터 (전체/처리중/완료/반려) 유지 또는 재구현
```

---

## 빌드 검증 (각 Sprint 완료 후 실행)

```bash
npm run build
```

---

## 실행 순서 요약

```
Sprint 1-A: 기간 기본값 일괄 변경 (9개 파일, 단순 치환)
Sprint 1-B: 처리 현황 개편 (Requests.tsx)
    ↓
Sprint 2: DB 분류/배정 (Leads.tsx)
    ↓
Sprint 3-A: 품질모니터링 제거 + 직원현황 본인 (Consultation.tsx)
Sprint 3-B: 스텝 헤더 + 이탈 모달 (EmployeeStepMatrixOverview.tsx)
Sprint 3-C: 상태값 구조 + 취소불가 연동 (StepStageSelector.tsx + Consultation.tsx)
    ↓
Sprint 4-A: Handoff 개편 (Handoff.tsx)
Sprint 4-B: 미팅 리스트 간소화 (MeetingExecution.tsx)  ← 4-A와 병렬 가능
Sprint 4-C: 미팅 일정 뷰 (MeetingSchedule.tsx)        ← 4-A와 병렬 가능
Sprint 4-D: 영업 직원 현황 (MeetingExecution.tsx)       ← 4-B 이후
    ↓
Sprint 5-A: 3년환급 + 청구 직원현황 (Claims.tsx)
Sprint 5-B: 간편청구 전면 개편 (SimpleClaimWorkflow.tsx) ← 5-A와 병렬 가능
```
