# 더바다(TheBada) Admin MVP - 아키텍처 및 기능 문서

> 최종 작성일: 2026-03-31  
> 버전: v0.0.1 (MVP)

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프로젝트명** | `deobada-admin-mvp` |
| **성격** | 보험 운영 관리 어드민 대시보드 (MVP) |
| **기술 스택** | React 18 + TypeScript + Vite 6 + Tailwind CSS v4 + Radix UI(Shadcn) + MUI |
| **현재 상태** | 백엔드 미연동, 목업 데이터 기반 프론트엔드 전용 |
| **페이지 수** | 21개 |
| **파일 수** | 162개 TypeScript/TSX 파일 |

---

## 2. 프로젝트의 목적

더바다 Ops Admin은 **보험 고객의 전체 라이프사이클을 관리하는 통합 운영 시스템**이다.  
고객 접수부터 상담, 미팅, 계약, 청구, 서류 발급 대행까지의 전 과정을 하나의 어드민에서 처리한다.

### 핵심 가치

- **접수 중심(Request Centric) 운영**: 모든 업무 흐름이 "접수(Request)"를 기준으로 추적됨
- **단계별 워크플로우 관리**: 6단계 Journey(접수→상담→미팅→이관→청구→종결)를 통한 체계적 진행
- **다중 역할 지원**: 마스터/관리자/직원 역할별 뷰 제공
- **실시간 운영 모니터링**: 일일 보고서, 이탈/취소 분석, 직원 성과 추적

---

## 3. Journey 시스템 (핵심 아키텍처)

더바다 Admin의 핵심은 **Journey 상태 머신**이다. 모든 접수 건은 아래 6단계를 거친다:

```
접수(request) → 상담(consultation) → 미팅(meeting) → 이관(handoff) → 청구(claims) → 종결(closed)
```

### 3.1 Journey 유형 (4가지)

| 유형 | 코드 | 설명 |
|------|------|------|
| 3년 환급 | `refund` | 가장 복잡한 풀 프로세스 |
| 간편 청구 | `simple` | 간소화된 청구 프로세스 |
| 소개/추천 | `intro` | 기존 고객 소개 경로 |
| 가족 플랜 | `family` | 가족 단위 보험 관리 |

### 3.2 단계 전환 규칙

- **블로킹 알림**: 서류 팩 검증 완료 전 단계 전환 불가
- **HIRA 조회 필수**: 환급/가족 Journey에서 필수
- **계약 팩 필수**: 미팅 성공 시 계약 서류 필수
- **감사 추적**: 모든 주요 액션에 actor, timestamp, message 기록
- **요구사항 심각도**: `block`(필수 해결) vs `warn`(정보성)

### 3.3 핵심 파일

| 파일 | 역할 |
|------|------|
| `src/app/journey/JourneyContext.tsx` | Journey 상태 관리 및 액션 |
| `src/app/journey/types.ts` | Journey 타입 정의 |
| `src/app/journey/rules.ts` | 단계 전환 규칙 및 요구사항 계산 |
| `src/app/journey/mockJourneys.ts` | 목업 데이터 |

---

## 4. 핵심 비즈니스 도메인 및 기능

### 4.1 고객 관리 (Customer Management)

- **경로**: `customers`, `CustomerDetail`
- **기능**: 고객 목록 조회, 상세 프로필(SSN, 연락처, 주소, 보험 분석 정보), VIP/일반 등급 관리
- **핵심 데이터**: 환급 예상액, 보험 유형, 가족 수, 중대질환 여부
- **연동 상태 추적**: 홈택스, HIRA(심평원), 건보, 신용정보 연동 여부
- **주요 파일**: `Customers.tsx`, `CustomerDetail.tsx`, `CustomerDetailPanel.tsx`, `CustomerProfileSummary.tsx`

### 4.2 접수 현황 (Request Intake)

- **경로**: `requests`
- **기능**: 전체 접수 건 목록, 상태별 필터링, 기간별 조회
- **접수 유형**: 환급 / 간편 청구 / 기타
- **기본 뷰**: 앱 진입 시 기본 페이지 (default active tab)
- **주요 파일**: `Requests.tsx`, `RequestDetailView.tsx`, `RequestInfoFields.tsx`

### 4.3 DB 배정 관리 (Lead Management)

- **경로**: `leads`, `lead-management`
- **기능**: 상담 대상 DB 배정, 리드 분배 및 관리
- **주요 파일**: `Leads.tsx`, `LeadManagement.tsx`

### 4.4 상담 관리 (Consultation)

- **경로**: `consultation`
- **기능**: 상담 리스트, 1차/2차 상담 진행, 팩트체크 (보험/건강 정보 수집)
- **단계별 검증**:
  - Step 1→2: 상태 선택 + 사유 입력
  - Step 2→3: 보험 정보(유형/보험료/납입상태), 건강 정보(교통사고/수술/중대질환/투약 - 4개 필수)
  - Step 3→4: 고객 성향(긍정/중립/부정), 신뢰도, 의사결정자
  - 미팅 이관 조건: 상태가 `meeting-handover`여야 함
- **주요 파일**: `Consultation.tsx`, `consultationValidation.ts`, `ConsultationFeedbackForm.tsx`

### 4.5 미팅 관리 (Meeting Management)

- **경로**: `meeting-schedule`, `meeting-refund`, `meeting-simple`
- **기능**:
  - **스케줄 관리**: 미팅 일정 등록/수정
  - **미팅 실행**: 6단계 체크리스트 기반 미팅 진행 (시스템 내 가장 큰 페이지, 4,096줄)
  - **보험 분석 탭**: 보장 갭 분석, 커버리지 플래그
  - **세일즈 스크립트 탭**: 상담 스크립트 템플릿 관리
  - **계약 캡처**: 수기 입력 또는 보험증권 붙여넣기 파싱
- **미팅 유형**: 3년 환급 미팅 / 간편 청구 미팅
- **미팅 완료 체크리스트**: 위임장 수집, 증권 확인, 납입확인서, 청구동의서, 소개 정보
- **종료 경로**: 계약완료, 실패, 현장불가, 취소, 노쇼, 심사거절, 철회
- **주요 파일**: `MeetingSchedule.tsx`, `MeetingExecution.tsx`, `MeetingCenterTabs.tsx`, `InsuranceAnalysisTab.tsx`, `SalesScriptTab.tsx`

### 4.6 이관 관리 (Handoff)

- **경로**: `handoff`
- **기능**: 계약 완료 후 청구팀으로의 업무 이관, 서류 준비 상태 확인
- **주요 파일**: `Handoff.tsx`

### 4.7 계약 관리 (Contract Management)

- **경로**: `contracts`
- **기능**: 계약 등록/조회, 보험사별 계약 데이터 관리
- **지원 보험사**: 삼성화재, KB손해보험 등
- **특수 기능**: 계약 정보 붙여넣기 파싱
- **주요 파일**: `ContractList.tsx`, `ContractRegistrationModal.tsx`, `contractPasteParser.ts`

### 4.8 청구 관리 (Claims)

- **경로**: `claims-refund`, `claims-simple`
- **기능**:
  - **3년 환급 심사**: 환급금 분석 및 청구 처리
  - **간편 청구 접수**: 간소화된 청구 프로세스
  - **서류 요건 관리**: 제출 서류, 의무기록, 납입 증빙
- **외부 연동**: HIRA(심평원) 진료 이력 조회
- **주요 파일**: `Claims.tsx`, `UnclaimedAnalysisView.tsx`

### 4.9 서류 발급 대행 (Document Issuance Operations)

- **경로**: `issuance-master`, `issuance-manager`, `issuance-staff`
- **역할별 뷰**:
  - **마스터**: 전체 발급 태스크 관리, 배정 승인
  - **관리자**: 기관(병원/약국)별 직원 배정, OCR 검토
  - **직원**: 방문 서류 다운로드, 현장 방문, 서류 업로드/확인
- **워크플로우**:
  ```
  미배정 → 관리자배정 → 직원배정 → 방문준비 → 업로드중 → 예외검토 → 최종완료
  ```
- **OCR 처리**: 업로드된 서류 자동 인식 → 확인/수정
- **인센티브 시스템**: 월별 완료 건수 기반 5단계 티어, 지역 매칭 보너스
- **성과 추적**: 직원별 주간/월간 KPI, 완료율, 인센티브 금액
- **주요 파일**: `IssuanceMaster.tsx`, `IssuanceManager.tsx`, `IssuanceStaff.tsx`, `IssuanceOperations.tsx`, `IssuanceContext.tsx`, `StaffPerformanceBoard.tsx`

### 4.10 운영 분석 (Operations Analytics)

- **대시보드** (`dashboard`): 데이터 무결성 대시보드 (KPI 카드)
- **일일 보고서** (`daily-report`): 일별 운영 현황 리포트
- **이탈/취소 분석** (`dropoff`): 이탈 사유 분석 (읽기 전용)
- **직원 파이프라인**: 직원별 파이프라인 개요, 단계별 매트릭스
- **주요 파일**: `Dashboard.tsx`, `DailyReport.tsx`, `DropOffLogs.tsx`, `EmployeePipelineOverview.tsx`

### 4.11 서류/동의 관리 (Documents)

- **경로**: `documents`
- **기능**: 서류 관리 및 동의서 처리
- **주요 파일**: `Documents.tsx`

### 4.12 시스템 설정 (Settings)

- **경로**: `settings`
- **기능**: 시스템 환경 설정
- **주요 파일**: `Settings.tsx`

---

## 5. 사이드바 네비게이션 구조

```
CORE OPERATIONS (핵심 운영)
├── 고객 관리 (customers)
├── DB 배정 관리 (leads)
├── 접수 현황 (requests) ← 기본 페이지
├── 상담 리스트 (consultation)
├── 이관 관리 (handoff)
├── 미팅 스케줄 (meeting-schedule)

MEETING MANAGEMENT (미팅 관리 그룹)
├── 3년 환급 미팅 (meeting-refund)
└── 간편 청구 관리 (meeting-simple)

CONTRACT & CLAIMS (계약 & 청구)
├── 계약 관리 (contracts)

CLAIMS (청구 관리 그룹)
├── 3년 환급 심사 (claims-refund)
└── 간편 청구 접수 (claims-simple)

DOCUMENT ISSUANCE (서류 발급 대행 그룹)
├── 전체 리스트 (issuance-master)
└── 직원별 리스트 (issuance-staff)

ANALYTICS & SETTINGS (분석 & 설정)
├── 이탈/취소 분석 (dropoff)
├── 일일 보고서 (daily-report)
├── 서류/동의 관리 (documents)
└── 시스템 설정 (settings)
```

---

## 6. 외부 시스템 연동 (Integration Points)

현재 모두 Mock 상태이며, 향후 실제 API 연동 예정:

| 시스템 | 용도 | Provider 코드 | 현재 상태 |
|--------|------|---------------|-----------|
| HIRA (심평원) | 진료 이력 조회 | `hira` | Mock |
| gloSign | 전자 서명 수집 | `gloSign` | Mock |
| easyPaper | 디지털 양식/청구서 | `easyPaper` | Mock |
| Kakao | 미팅 리마인더/소개 푸시 알림 | `kakao` | Mock |
| Claims System | 하류 청구 시스템 연동 | `claims` | Mock |
| Script | 상담 스크립트 실행 추적 | `script` | Mock |
| 홈택스/건보/신용정보 | 고객 재무 정보 조회 | - | Mock |

### 연동 상태 흐름

```
idle → requested → sent → received → verified
                                    ↘ failed
```

---

## 7. 기술 아키텍처

### 7.1 기술 스택 상세

| 계층 | 기술 |
|------|------|
| 빌드 도구 | Vite 6.3.5 |
| 언어 | TypeScript |
| UI 프레임워크 | React 18.3.1 |
| 라우팅 | React Router v6 (SPA, 커스텀 네비게이션) |
| 컴포넌트 라이브러리 | Radix UI (22개 패키지, Shadcn 패턴) + MUI |
| 스타일링 | Tailwind CSS v4 + CSS Variables (oklch 색상 체계) |
| 폼 관리 | React Hook Form 7.55.0 |
| 상태 관리 | React Context API (JourneyContext, IssuanceContext) |
| 차트 | Recharts 2.15.2 |
| 드래그앤드롭 | React DnD 16.0.1 |
| 애니메이션 | Framer Motion 12.x |
| 알림 | Sonner (토스트) |
| 아이콘 | Lucide React, MUI Icons |
| 날짜 처리 | date-fns 3.6.0 |
| E2E 테스트 | Playwright 1.58.2 |

### 7.2 상태 관리 아키텍처

```
┌─────────────────────────────────────┐
│          App.tsx (루트)              │
│  ┌─────────────────────────────┐    │
│  │     JourneyProvider         │    │
│  │  ┌───────────────────────┐  │    │
│  │  │  IssuanceProvider     │  │    │
│  │  │  ┌─────────────────┐  │  │    │
│  │  │  │  Page Components │  │  │    │
│  │  │  └─────────────────┘  │  │    │
│  │  └───────────────────────┘  │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

- **JourneyContext**: 고객 여정 전체 상태 (접수→종결), 상담/미팅 Draft, 서류 요건, 감사 추적
- **IssuanceContext**: 서류 발급 태스크, 직원 배정, 성과 KPI, OCR 처리
- **한계**: 인메모리 전용 - 페이지 새로고침 시 데이터 소실

### 7.3 데이터 흐름

```
사용자 입력 (폼)
    ↓
React Hook Form → 유효성 검증 (consultationValidation.ts)
    ↓
Context 메서드 호출 (saveConsultationDraft, applyMeetingStatus 등)
    ↓
상태 업데이트 (useState + useCallback)
    ↓
Rules Engine 실행 (computeJourney) → 알림, 블로킹 조건, 다음 액션 계산
    ↓
UI 렌더링 (테이블, 폼, 알림 배지)
```

### 7.4 프로젝트 디렉토리 구조

```
src/
├── main.tsx                           # React 엔트리포인트
├── app/
│   ├── App.tsx                        # 메인 앱 (사이드바, 라우팅, 600+ 줄)
│   ├── pages/                         # 21개 페이지 컴포넌트
│   │   ├── Dashboard.tsx              # 대시보드
│   │   ├── Customers.tsx              # 고객 목록
│   │   ├── CustomerDetail.tsx         # 고객 상세
│   │   ├── Leads.tsx                  # DB 배정
│   │   ├── LeadManagement.tsx         # 리드 관리
│   │   ├── Requests.tsx               # 접수 현황
│   │   ├── Consultation.tsx           # 상담 관리 (2,021줄)
│   │   ├── Handoff.tsx                # 이관 관리
│   │   ├── MeetingSchedule.tsx        # 미팅 스케줄
│   │   ├── MeetingExecution.tsx       # 미팅 실행 (4,096줄 - 최대)
│   │   ├── ContractList.tsx           # 계약 관리
│   │   ├── Claims.tsx                 # 청구 관리 (2,305줄)
│   │   ├── IssuanceMaster.tsx         # 서류 발급 마스터 (1,543줄)
│   │   ├── IssuanceManager.tsx        # 서류 발급 관리자
│   │   ├── IssuanceStaff.tsx          # 서류 발급 직원
│   │   ├── IssuanceOperations.tsx     # 서류 발급 운영
│   │   ├── DropOffLogs.tsx            # 이탈/취소 분석
│   │   ├── DailyReport.tsx            # 일일 보고서
│   │   ├── Documents.tsx              # 서류/동의 관리
│   │   ├── Qualification.tsx          # 자격 확인
│   │   └── Settings.tsx               # 시스템 설정
│   ├── components/
│   │   ├── ui/                        # Shadcn/Radix 공통 UI (40+ 컴포넌트)
│   │   ├── meeting/                   # 미팅 전용 컴포넌트
│   │   ├── claims/                    # 청구 전용 컴포넌트
│   │   ├── journey/                   # Journey 워크플로우 UI
│   │   ├── issuance/                  # 서류 발급 전용 컴포넌트
│   │   ├── operations/                # 운영 분석 컴포넌트
│   │   └── [기타 공통 컴포넌트]
│   ├── journey/                       # Journey 비즈니스 로직
│   │   ├── JourneyContext.tsx         # 상태 관리
│   │   ├── types.ts                   # 타입 정의
│   │   ├── rules.ts                   # 비즈니스 규칙 엔진
│   │   └── mockJourneys.ts            # 목업 데이터
│   ├── issuance/                      # 서류 발급 비즈니스 로직
│   │   ├── IssuanceContext.tsx         # 상태 관리
│   │   ├── types.ts                   # 타입 정의
│   │   ├── regionUtils.ts             # 지역 유틸리티
│   │   ├── incentiveUtils.ts          # 인센티브 계산
│   │   └── performancePeriodUtils.ts  # 성과 기간 유틸리티
│   ├── contracts/
│   │   └── contractPasteParser.ts     # 계약 붙여넣기 파서
│   ├── utils/
│   │   ├── consultationValidation.ts  # 상담 검증
│   │   └── customerUtils.ts           # 고객 유틸리티
│   ├── mockData/                      # 목업 데이터
│   │   ├── issuanceMock.ts            # 서류 발급 목업 (1,763줄)
│   │   └── generated/                 # Excel 기반 자동 생성 데이터
│   └── mockGenerators/                # 목업 데이터 생성기
├── styles/
│   ├── index.css                      # 메인 스타일 임포트
│   ├── tailwind.css                   # Tailwind v4 설정
│   └── theme.css                      # 디자인 토큰 (CSS 변수)
└── assets/                            # 정적 자산
```

---

## 8. 주요 데이터 모델

### 8.1 고객 (Customer)

```typescript
interface Customer {
  id: string;
  name: string;
  phone: string;
  ssn: string;          // YYMMDD-[1-4]XXXXXX
  birth: string;
  address: string;
  status: string;
  grade: 'VIP' | 'GENERAL';
  analysis: {
    refundAmount: number;
    insuranceType: string;
    decisionMaker: string;
    familyCount: number;
    criticalIllness: boolean;
  };
}
```

### 8.2 접수 건 (Request)

```typescript
interface Request {
  id: string;
  customerId: string;
  date: string;
  type: '환급' | '간편 청구' | '기타';
  stage: string;
  status: string;
}
```

### 8.3 Journey 상태

```typescript
interface RequestJourney {
  requestId: string;
  customerName: string;
  journeyType: 'refund' | 'simple' | 'intro' | 'family';
  owner: string;
  stage: 'request' | 'consultation' | 'meeting' | 'handoff' | 'claims' | 'closed';
  status: string;
  slaLabel: string;
  nextDueAt: string;
  nextAction: string;
  missingRequirements: RequirementAlert[];
  documentRequirements: DocumentRequirement[];
  integrationTasks: IntegrationTask[];
  auditTrail: AuditEvent[];
  consultationDraft: ConsultationDraft;  // 100+ 필드
  meetingDraft: MeetingDraft;            // 70+ 필드
}
```

### 8.4 서류 발급 태스크 (IssuanceTask)

```typescript
interface IssuanceTask {
  id: string;
  claimId: string;
  customerId: string;
  customerName: string;
  locations: IssuanceLocation[];  // 병원/약국
  status: 'unassigned' | 'assigned' | 'in_progress' | 'partial' | 'completed';
}
```

### 8.5 역할 체계

| 역할 | 코드 | 권한 범위 |
|------|------|-----------|
| 마스터 | `master_issuance` | 전체 태스크 관리, 배정 승인 |
| 관리자 | `manager_issuance` | 기관별 직원 배정, OCR 검토 |
| 직원 | `staff_issuance` | 방문, 서류 업로드/확인 |

---

## 9. 주요 컨벤션

- **언어**: 모든 UI 라벨, 상태 코드, 메시지가 한국어
- **날짜 형식**: `yyyy-MM-dd` 또는 `yyyy.MM.dd HH:mm`
- **주민등록번호**: `YYMMDD-[1-4]XXXXXX` (7번째 자리: 성별/세기 판별)
- **지역 계층**: 도/시 → 시/군/구 → 동 (3레벨)
- **색상 체계**: oklch 색상 공간 사용 (CSS 커스텀 프로퍼티)
- **경로 별칭**: `@` → `./src`
- **상태 코드**: 한국어 사용 (예: '미배정', '확정대기', '요청전송완료')

---

## 10. 현재 완성도 및 향후 발전 방향

### 현재 완성도

| 영역 | 상태 | 비고 |
|------|------|------|
| UI/UX | ✅ 완성 | 21개 페이지, 사이드바 네비게이션 |
| 비즈니스 로직 | ✅ 완성 | Journey 상태 머신, 검증, 전환 규칙 |
| 데이터 | ⚠️ Mock | 인메모리 목업 데이터 기반 |
| 백엔드 연동 | ❌ 미구현 | 전체 프론트엔드 전용 |
| 인증/권한 | ❌ 미구현 | 하드코딩된 역할 |
| 외부 시스템 | ❌ Mock | 6개 시스템 모두 Mock |
| E2E 테스트 | ⚠️ 설정됨 | Playwright 프레임워크 설정 완료 |

### 향후 발전 방향 (로드맵)

#### Phase 1: 백엔드 연동
- [ ] API 서버 구축 및 연동
- [ ] Context Mock 메서드 → 실제 API 호출 전환
- [ ] 데이터 영속성 확보 (인메모리 → DB)

#### Phase 2: 인증 및 권한
- [ ] 실제 인증 시스템 구축 (로그인/로그아웃)
- [ ] 역할 기반 접근 제어 (RBAC) 구현
- [ ] 하드코딩된 사용자 정보 제거

#### Phase 3: 외부 시스템 실연동
- [ ] HIRA (심평원) API 연동
- [ ] gloSign 전자 서명 연동
- [ ] easyPaper 디지털 양식 연동
- [ ] Kakao 알림 연동
- [ ] 홈택스/건보/신용정보 조회 연동

#### Phase 4: 고도화
- [ ] 실시간 알림 시스템 (WebSocket)
- [ ] 대시보드 KPI 모니터링 강화
- [ ] 모바일 반응형 UI 최적화
- [ ] E2E 테스트 커버리지 확장
- [ ] 성능 최적화 (대용량 데이터 처리)

---

## 11. 개발 환경 설정

```bash
# 의존성 설치
npm install

# 로컬 개발 서버 실행
npm run dev:local

# 네트워크 접근 가능 모드
npm run dev:network

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# 목업 데이터 재생성 (Excel → TypeScript/JSON/CSV)
npm run generate:intake-dummy
```
