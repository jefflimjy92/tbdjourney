# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

**deobada-admin-mvp** — 더바다(TheBada) 보험 운영 관리 어드민 대시보드.
고객 접수부터 상담, 미팅, 계약, 청구, 서류 발급까지 전 과정을 관리하는 통합 운영 시스템.

- **Frontend-only MVP**: 백엔드 없음, 모든 데이터는 in-memory mock (새로고침 시 초기화)
- **Korean-first**: 모든 UI 텍스트, 변수명 주석, 업무 용어가 한국어 기반

## Commands

```bash
npm run dev          # Vite dev server (default)
npm run dev:local    # Local only (127.0.0.1)
npm run dev:network  # Network accessible (0.0.0.0)
npm run build        # Production build (Vite)
npm run preview      # Preview built assets (port 4173)
```

빌드 검증 (개별 파일):
```bash
npx esbuild src/app/pages/SomeFile.tsx --bundle --jsx=automatic --platform=browser --loader:.tsx=tsx --external:react --external:react-dom --external:clsx --external:lucide-react --external:'@/*' --outfile=/dev/null
```

Mock 데이터 재생성 (Excel → TypeScript):
```bash
npm run generate:intake-dummy
```

ESLint/Prettier 설정 없음. TypeScript strict mode 사용.

## Tech Stack

- React 18 + TypeScript + Vite 6
- Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- Radix UI / Shadcn (`src/app/components/ui/`)
- MUI (일부 아이콘/컴포넌트)
- Recharts (차트), Lucide React (아이콘), clsx (클래스), date-fns (날짜)
- React Hook Form (폼), Sonner (토스트)
- Playwright (E2E — 설정만 완료, 테스트 미작성)

**Path alias**: `@` → `src` (vite.config.ts에서 설정)

## Architecture

### Routing — Custom Tab-based SPA

React Router 없음. `App.tsx`에서 `activeTab` 상태로 페이지를 switch 렌더링.
딥링크 패턴: `customers:ID`, `consultation:REQ_ID` 형태로 페이지+파라미터 전달.

### State Management — React Context

| Provider | 파일 | 역할 |
|----------|------|------|
| `JourneyProvider` | `src/app/journey/JourneyContext.tsx` | 고객 여정 상태 (핵심) |
| `IssuanceProvider` | `src/app/issuance/IssuanceContext.tsx` | 서류 발급 태스크 관리 |
| `RoleProvider` | `src/app/auth/RoleContext.tsx` | 사용자 역할/권한 |

### Journey 시스템 (핵심 비즈니스 로직)

모든 접수 건은 6단계 Journey를 거침:
```
접수(request) → 상담(consultation) → 미팅(meeting) → 이관(handoff) → 청구(claims) → 종결(closed)
```

4가지 Journey 유형: `refund`(3년환급) | `simple`(간편청구) | `intro`(소개) | `family`(가족)

**핵심 파일**:
- `src/app/journey/types.ts` — 모든 타입 정의 (JourneyPhase 8단계, RefundStep S1-S17, ReferralStep R1-R14, SimpleClaimStep Q1-Q9, TeamRole 9종)
- `src/app/journey/phaseConfig.ts` — Phase↔Step 매핑, 스텝 시퀀스, 역할별 가시 범위, KPI 정의
- `src/app/journey/rules.ts` — 단계 전환 규칙, 블로킹 검증, 요구사항 계산
- `src/app/journey/mockJourneys.ts` — 초기 mock 데이터

### 8-Phase Journey 모델 (Notion 업무 흐름도 기반)

| Phase | 라벨 | 3년환급 스텝 | 간편청구 스텝 | 소개 스텝 |
|-------|------|------------|-------------|----------|
| inflow | 유입 | S1 | Q1 | R1 |
| inquiry | 조회/신청 | S2-S3 | Q2 | R2-R3 |
| classification | 선별/배정 | S4 | — | — |
| tm | 상담/TM | S5-S6 | — | — |
| meeting | 미팅/계약 | S7-S9 | — | R4-R6 |
| claims | 청구/분석 | S10-S13 | Q3-Q6 | R7-R10 |
| payment | 지급/사후 | S14-S15 | Q7 | R11-R12 |
| growth | Growth Loop | S16-S17 | Q8-Q9 | R13-R14 |

### 역할 기반 네비게이션

`src/app/navigation/navConfig.ts`에서 9개 역할별 메뉴 필터링:
`call_member`, `call_lead`, `sales_member`, `sales_lead`, `claims_member`, `claims_lead`, `cs`, `compliance`, `admin`

### 주요 페이지 파일 (큰 파일 주의)

| 파일 | 라인 | 설명 |
|------|------|------|
| `MeetingExecution.tsx` | ~4,000 | 미팅 실행 — PreAnalysis/MeetingOnSite/ContractClose가 래핑 |
| `Claims.tsx` | ~2,300 | 청구 관리 |
| `Consultation.tsx` | ~2,000 | 상담 처리 |
| `IssuanceMaster.tsx` | ~1,500 | 서류 발급 마스터 뷰 |

## Directory Structure

```
src/
├── main.tsx                          # 엔트리포인트
├── app/
│   ├── App.tsx                       # 메인 셸 (탭 라우팅)
│   ├── journey/                      # 여정 상태머신 (types, rules, context, mock)
│   ├── issuance/                     # 서류발급 로직
│   ├── auth/                         # 역할 관리
│   ├── navigation/                   # 사이드바, navConfig
│   ├── pages/                        # 21개 메인 페이지
│   │   ├── tm/                       # 1차TM, 2차TM, 체크리스트
│   │   ├── meeting/                  # 사전분석, 미팅실행, 계약체결
│   │   ├── claims/                   # 청구접수, 미지급분석, 서류발급, 최종분석
│   │   ├── payment/                  # 지급확인, 사후관리
│   │   ├── growth/                   # 소개관리 (ReferralManagement)
│   │   ├── simpleClaims/             # 간편청구 워크플로우 (Q1-Q9)
│   │   ├── cs/                       # VOC 관리
│   │   └── compliance/               # 준법감시
│   ├── components/
│   │   ├── ui/                       # Shadcn/Radix 기본 컴포넌트 (50+)
│   │   ├── journey/                  # 여정 관련 UI (JourneyHeader, TransitionGuardModal)
│   │   ├── meeting/                  # 미팅센터 탭 (보장분석, 스크립트 등)
│   │   ├── claims/                   # 청구 관련 UI
│   │   └── operations/               # 운영 매트릭스 뷰
│   ├── mockData/                     # Mock 데이터 (generated/ 포함)
│   └── utils/                        # 유틸리티 (consultationValidation 등)
├── styles/                           # CSS (tailwind.css, theme.css, fonts.css)
└── assets/
```

## Key Conventions

- **컴포넌트 패턴**: 페이지별 독립 컴포넌트, Context 통한 상태 공유
- **스타일링**: Tailwind 유틸리티 클래스 + `clsx()` 조건부 클래스 + Shadcn 컴포넌트
- **아이콘**: Lucide React 우선, MUI 보조
- **Mock 데이터**: 컴포넌트 내부 `const MOCK_*` 패턴 또는 `mockData.ts` import
- **토스트**: `import { toast } from 'sonner'`

## Documentation

- `docs/ARCHITECTURE.md` — 상세 아키텍처 문서 (Journey 시스템, 컴포넌트 관계, 상태 흐름)
- `docs/JOURNEY_TASK_MAP.md` — Notion 업무 흐름도 기반 구현 현황 맵 (S1-S17, R1-R14, Q1-Q9)
- `docs/GAP_ANALYSIS_JOURNEY.md` — 구현 Gap 분석 보고서 (Match Rate 추적)
