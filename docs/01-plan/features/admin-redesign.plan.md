# 어드민 구조 개편 Plan

> 스펙: `.omc/specs/deep-interview-admin-redesign.md` (14라운드, 모호도 5%)
> 작성일: 2026-04-01
> 접근법: 점진적 전환 — 기존 페이지 유지 + CaseDetailPage 신규 추가

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **문제** | 하나의 접수건 처리에 팀별 페이지를 여러 번 이동해야 함. 팀간 인계는 카톡/엑셀로 처리 중 |
| **해결** | 통합 CaseDetailPage — 어떤 팀에서 열어도 같은 페이지, 현재 담당팀만 편집 |
| **기능 효과** | 콜팀→영업팀→청구팀 인계를 시스템 내 체크리스트 모달로 처리 |
| **핵심 가치** | 실무자 동선 단축 + 인계 누락 방지 + 팀별 책임 명확화 |

---

## 1. 요구사항 요약

### 핵심 요구사항
- 각 팀 목록(리스트 페이지)에서 케이스 클릭 → 통합 CaseDetailPage로 진입
- 현재 담당팀만 편집 가능, 나머지 팀 섹션은 읽기전용
- 팀간 인계: 체크리스트 모달 → 미충족 시 경고 후 인계 허용 (로그 기록)
- 권한: 실무자=본인 케이스, 팀장=팀 전체, admin=전체

### 팀별 주요 기능
| 팀 | 리스트 | 디테일 (케이스 섹션) | 배정 방식 |
|-----|-------|---------------------|----------|
| 콜팀 | 상담/TM 목록 | 접수정보 + 1·2차 상담 + 영업팀 인계 버튼 | DB분류/배정 균등배분 |
| 영업팀 | 미팅 목록, 계약 목록 | 사전분석 + 미팅실행 + 계약체결 + 청구팀 인계 버튼 | 미팅인계 큐에서 팀장 배정 |
| 청구팀 | 청구 목록 | STEP 0~7 세로탭 (STEP 0에서 팀장이 담당자 배정) | CaseDetail STEP0 |

---

## 2. 수용 기준 (Acceptance Criteria)

- [ ] **AC-01** 콜팀원 로그인 → 상담/TM 리스트에 본인 케이스만 표시
- [ ] **AC-02** 리스트에서 케이스 클릭 → CaseDetailPage로 진입 (딥링크: `case-detail:REQ_ID`)
- [ ] **AC-03** 콜팀원: 콜팀 섹션만 편집 가능, 영업·청구 섹션은 읽기전용
- [ ] **AC-04** 인계 버튼 클릭 → HandoffModal 팝업 (체크리스트 표시)
- [ ] **AC-05** 필수 항목 미체크 시 경고 다이얼로그 → 그래도 인계 가능 → `handoff_incomplete` 로그 기록
- [ ] **AC-06** 인계 완료 → 영업팀 미팅인계 큐에 케이스 등장
- [ ] **AC-07** 영업팀장 배정 → 해당 영업팀원 미팅 목록에 케이스 즉시 노출
- [ ] **AC-08** 청구팀 섹션 → STEP 0~7 세로탭 구조
- [ ] **AC-09** 청구팀장 → STEP 0에서 담당자 배정 드롭다운 표시
- [ ] **AC-10** DB분류/배정 → 다중선택 균등배분 UI 동작
- [ ] **AC-11** 영업팀 배정 판단: 담당자별 **미팅 예정일 기준 미팅 수** 표시
- [ ] **AC-12** 보험증권·지급내역서 항목 = 파일첨부 X, 고객의 보험사 팩스 요청 완료 여부 확인

---

## 3. 구현 계획 (Phase 0 ~ 9)

### Phase 0 — navConfig.ts 메뉴 개편
**파일**: `src/app/navigation/navConfig.ts`

제거 메뉴: `tm-first`, `tm-second`, `tm-checklist`, `meeting-refund`, `meeting-simple`, `claims-refund`, `claims-simple`, `issuance-master`, `issuance-manager`, `issuance-staff`, `payment-confirm`, `aftercare`, `referral-management`, `voc`, `compliance`, `admin-operations`

새 메뉴 구조:
```
대시보드
접수 관리 (admin, 팀장급)
─────────────────
[콜팀]
  DB분류/배정 (call_lead만)
  상담/TM
[영업팀]
  미팅 인계 (sales_lead만)
  미팅
  미팅 일정
  계약 목록
[청구팀]
  청구
  간편청구
─────────────────
고객 관리
일일 보고서
이탈 로그
설정
```

### Phase 1 — App.tsx 라우팅 개편
**파일**: `src/app/App.tsx`

변경사항:
- `NavItem` 타입에 `case-detail` 추가
- `lazyNamed`로 `CaseDetailPage` import
- `handleNavigate`: `consultation:ID` / `meeting-all:ID` / `claims-all:ID` → `case-detail:ID`
- `renderContent()`: `case-detail` case 추가
- `getHeaderTitle()`: `case-detail` 헤더 추가

### Phase 2 — CaseHeader 컴포넌트 (신규)
**파일**: `src/app/components/case/CaseHeader.tsx`

표시 정보: 고객명·연락처, 케이스 유형, 현재 단계, 담당자명·팀, 접수ID
기반: `JourneyHeader.tsx` 로직 + `useJourney(requestId)` hook

### Phase 3 — HandoffModal (신규)
**파일**: `src/app/components/HandoffModal.tsx`

인계 유형: `call-to-sales` | `sales-to-claims`

체크리스트 (call-to-sales):
- 건강 체크리스트 완료 (필수)
- 상담 내용 (1/2차) 입력 완료 (필수)
- 고객 성향/주의사항 메모 (선택)
- 미팅 적합 판정 확인 (필수)

체크리스트 (sales-to-claims):
- 계약 정보 저장 완료 (필수)
- 보험증권: 고객이 보험사에 팩스 요청 완료 여부 확인 (필수) ← 파일첨부 X
- 지급내역서: 고객이 보험사에 팩스 요청 완료 여부 확인 (필수) ← 파일첨부 X
- 수급 동의서 + 위임장 서명 완료 (필수)
- 약정서 확인 (필수)
- 고객 환급 안내 완료 (선택)

동작: 필수 미충족 → 경고 다이얼로그 → 그래도 인계 가능 → `handoff_incomplete` 로그

### Phase 4 — CallTeamSection (신규)
**파일**: `src/app/components/case/CallTeamSection.tsx`

기반: `Consultation.tsx` 디테일 패널 + `FirstTM.tsx` + `SecondTM.tsx` 통합

섹션:
```
[접수 정보] DB분류 결과, 접수 채널, 배정 정보
[1차 상담] 건강 체크리스트, 보험 현황, 초기 고객 반응
[2차 상담] 심화 상담, 미팅 적합 판정, 고객 성향 메모
[인계 액션] [영업팀에 인계하기] 버튼 → HandoffModal
```

Props: `requestId`, `isEditable`, `isExpanded`, `onToggle`

### Phase 5 — SalesTeamSection (신규)
**파일**: `src/app/components/case/SalesTeamSection.tsx`

기반: `MeetingExecution.tsx` + `PreAnalysis.tsx` + `MeetingOnSite.tsx` + `ContractClose.tsx`

섹션:
```
[사전 분석] 보장 분석, 미팅 전략 메모
[미팅 실행] 현장 체크리스트, 미팅 기록
[계약 체결] 계약 정보 (보험사·보험료·가입일), 전자서명 상태
[인계 액션] [청구팀에 인계하기] 버튼 → HandoffModal
```

설계사 정보 = `journey.owner` (영업팀 담당자) 재활용, 별도 필드 불필요

### Phase 6 — ClaimsTeamSection (신규)
**파일**: `src/app/components/case/ClaimsTeamSection.tsx`

기반: `Claims.tsx` STEP 구조 재사용

STEP 구조 (세로탭):
```
STEP 0: 접수 확인   — 영업팀 인계 내용 확인 + 담당자 배정 (팀장만)
STEP 1: 고객 프로필 — 실손보험 정보 + 설계사(영업팀 담당자) 정보 표시
STEP 2: 데이터 통합 — 심평원/홈택스/건보 연동 현황, 예상청구액
STEP 3: 지급내역서  — 보험사별 지급내역서 처리
STEP 4: 미지급 분석 — 미지급금 분석 결과
STEP 5: 서류 발급   — 발급대행 배정 현황, 수취 상태
STEP 6: 서류 OCR   — OCR 처리 결과
STEP 7: 최종 확정   — 예상환급금 확정, 보험사 제출
```

배정 UI (STEP 0, 청구팀장만):
```tsx
{isClaimsLead && (
  <Select onValueChange={handleAssignClaims}>
    {claimsTeamMembers.map(m => <SelectItem value={m.id}>{m.name}</SelectItem>)}
  </Select>
)}
```

### Phase 7 — CaseDetailPage (신규)
**파일**: `src/app/pages/CaseDetailPage.tsx`

Props: `requestId`, `initialSection?: 'call' | 'sales' | 'claims'`, `onNavigate`

레이아웃:
```tsx
<CaseHeader requestId={requestId} />

<Accordion type="multiple">
  <CallTeamSection  isEditable={isCallTeam && isAssigned}  isExpanded={activeSection === 'call'} />
  <SalesTeamSection isEditable={isSalesTeam && isAssigned} isExpanded={activeSection === 'sales'} />
  <ClaimsTeamSection isEditable={isClaimsTeam && isAssigned} isExpanded={activeSection === 'claims'} />
</Accordion>

{handoffModal && <HandoffModal ... />}
```

섹션 활성화 (journey.phase 기준):
- `inflow/inquiry/classification/tm` → call
- `meeting` → sales
- `claims/payment/growth` → claims

### Phase 8 — 미팅 인계 페이지 개편
**파일**: `src/app/pages/Handoff.tsx`

영업팀장 전용 배정 큐:
- 미배정 케이스 카드: 고객명·지역, 케이스유형·DB분류, 콜팀 인계 메모, 인계 시각
- 담당자 선택 UI: 담당자명 | 담당 지역 | 미팅 예정일 기준 미팅 수 (전체 케이스 수 X)
- 배정 완료 → 상태 `미배정→담당배정` → 알림 발송 (상단 벨 아이콘 뱃지)
- 접근 권한: `sales_lead`만

### Phase 9 — DB분류/배정 페이지 개편
**파일**: `src/app/pages/Leads.tsx`

추가 기능:
- 접수건 다중 선택 (체크박스)
- 가용 콜팀원 다중 선택
- [균등 배분 실행] 버튼
- 배분 미리보기 (팀원당 몇 건)
- 배분 확정 → `journey.owner` 업데이트

---

## 4. 구현 우선순위

| Phase | 파일 | 난이도 | 의존성 |
|-------|------|--------|--------|
| 0 | navConfig.ts | ⭐ | 없음 |
| 1 | App.tsx | ⭐⭐ | Phase 0 |
| 2 | CaseHeader.tsx | ⭐ | 없음 |
| 3 | HandoffModal.tsx | ⭐⭐ | 없음 |
| 4 | CallTeamSection.tsx | ⭐⭐⭐ | Phase 2,3 |
| 5 | SalesTeamSection.tsx | ⭐⭐⭐ | Phase 2,3 |
| 6 | ClaimsTeamSection.tsx | ⭐⭐⭐ | Phase 2 |
| 7 | CaseDetailPage.tsx | ⭐⭐⭐ | Phase 2~6 |
| 8 | Handoff.tsx | ⭐⭐ | Phase 3 |
| 9 | Leads.tsx | ⭐⭐ | 없음 |

---

## 5. 리스크 & 완화

| 리스크 | 완화 방법 |
|--------|----------|
| 기존 Consultation/MeetingExecution/Claims 코드 양이 많음 (~8,000줄) | 점진적 전환 — 기존 페이지 건드리지 않고 신규 컴포넌트에서 로직 참조 |
| journey.phase 기준 섹션 활성화 오작동 | 단위 테스트로 phase→section 매핑 검증 |
| 권한 체크 누락 (isEditable 잘못 넘겨짐) | CaseDetailPage에서 권한 계산 후 각 섹션에 props로 전달, 섹션 내부에선 판단 X |
| HandoffModal 체크리스트 미완료 인계 로그 누락 | onConfirm 콜백에서 acknowledged 파라미터로 구분, JourneyContext에서 로그 기록 |

---

## 6. 검증 체크리스트

- [ ] 콜팀원 로그인 → 상담/TM 목록에 본인 케이스만
- [ ] 케이스 클릭 → CaseDetailPage 진입
- [ ] 콜팀원: 콜팀 섹션만 편집, 나머지 읽기전용
- [ ] 인계 버튼 → HandoffModal 팝업
- [ ] 미충족 인계 → 경고 + 인계 가능 + 로그 기록
- [ ] 인계 후 → 미팅인계 큐 등장
- [ ] 영업팀장 배정 → 영업팀원 목록에 케이스 등장
- [ ] 청구팀 섹션 → STEP 0~7 세로탭
- [ ] 청구팀장 → STEP 0에서 담당자 배정 드롭다운
- [ ] DB분류/배정 → 다중선택 균등배분
