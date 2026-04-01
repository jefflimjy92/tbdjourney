# Sprint 4 구현 가이드 (Codex용)

> 목표: Match Rate 78.5% → 90%+ (18건 구현)
> 기준 문서: `docs/JOURNEY_TASK_MAP.md`
> 아키텍처: `docs/ARCHITECTURE.md`, `CLAUDE.md`

---

## 기술 스택 요약

- React 18 + TypeScript + Vite 6
- Tailwind CSS v4 + clsx
- 아이콘: lucide-react
- 토스트: sonner
- Path alias: `@` → `src`
- Mock 데이터 기반 (백엔드 없음, 컴포넌트 내 `const MOCK_*` 패턴)

---

## 기존 패턴 참고 파일

| 패턴 | 참고 파일 | 설명 |
|------|----------|------|
| 독립 패널 컴포넌트 | `src/app/pages/simpleClaims/SimpleClaimWorkflow.tsx` | Q2~Q9 패널 함수 패턴 |
| 페이지 래핑 확장 | `src/app/pages/meeting/PreAnalysis.tsx` | 기존 컴포넌트 위에 패널 추가 |
| 탭 기반 섹션 | `src/app/pages/DailyReport.tsx` | activeSection 상태 + switch 렌더링 |
| KPI 카드 | `src/app/pages/Dashboard.tsx` | grid 기반 KPI 카드 레이아웃 |
| 테이블 + 상태 뱃지 | `src/app/pages/growth/ReferralManagement.tsx` | 테이블 + STATUS_CONFIG 패턴 |

---

## 구현 항목 (18건)

### 그룹 1: 준법감시 8건 — `ComplianceDashboard.tsx` 확장

**파일**: `src/app/pages/compliance/ComplianceDashboard.tsx`

현재 이 파일은 기본 Mock 대시보드만 있음. 8개 섹션을 탭 또는 패널로 추가.

#### 1-1. 단계별 법률검토 추적 (S1~S17 + Q1~Q9)
```
- 각 Journey Step별 법률검토 상태 테이블
- 컬럼: 스텝코드, 스텝명, 검토상태(미검토/검토중/승인/반려), 검토자, 검토일
- Mock 데이터: S1~S17 + Q1~Q9 각 스텝에 대해 상태 배정
- 상태 뱃지: 미검토(gray), 검토중(blue), 승인(emerald), 반려(rose)
```

#### 1-2. 마케팅 소재 준법 심의 (허위/과장/오인)
```
- 마케팅 소재 리스트 테이블
- 컬럼: 소재ID, 소재유형(배너/영상/블로그/SNS), 제목, 심의상태, 위반유형(허위/과장/오인유발/해당없음), 심의자, 심의일
- Mock 데이터: 5~6건
- 위반 건은 rose 하이라이트
```

#### 1-3. 녹취 QA / 해피콜
```
- 녹취 QA 리스트
- 컬럼: 콜ID, 상담원, 고객명, 콜일시, QA점수(0-100), 위반항목(없음/수수료미안내/동의누락/과장안내), 해피콜상태(미실시/완료/불만)
- Mock 데이터: 6~8건
- QA 점수 색상: >=80 emerald, >=60 amber, <60 rose
```

#### 1-4. 민원 예방 / 징계
```
- 민원 접수 리스트
- 컬럼: 민원ID, 유형(고객불만/원수사민원/금감원민원), 접수일, 담당자, 상태(접수/조사중/조치완료/종결), 징계여부
- Mock 데이터: 4~5건
- 금감원민원은 critical 하이라이트
```

#### 1-5. 준법교육 운영
```
- 교육 일정 + 이수 현황
- 컬럼: 교육명, 대상, 일시, 이수율(%), 미이수자 수
- Mock 데이터: 3~4건 (신입교육, 정기교육, 특별교육)
- 이수율 progress bar
```

#### 1-6. 위탁업체 점검
```
- 위탁업체 리스트 (투에이치 등)
- 컬럼: 업체명, 위탁업무, 계약기간, 최근점검일, 점검결과(양호/보완/부적합), 다음점검일
- Mock 데이터: 2~3건
```

#### 1-7. Chinese Wall 모니터링
```
- 정보교류차단 현황
- 컬럼: 부서, 접근권한등급, 최근위반건수, 위반이력, 차단상태(정상/경고/위반)
- Mock 데이터: 4~5개 부서
- 위반 건수 > 0이면 amber/rose 하이라이트
```

#### 1-8. 내부통제 기준 관리
```
- 내부통제 기준 리스트
- 컬럼: 기준ID, 기준명, 카테고리(개인정보/금융거래/마케팅/업무위탁), 최종개정일, 시행상태(시행중/개정중/폐지), 담당부서
- Mock 데이터: 6~8건
```

**구현 패턴**: `DailyReport.tsx`의 탭 패턴 참고
```tsx
const [activeSection, setActiveSection] = useState<'legal_review' | 'marketing_review' | 'recording_qa' | 'complaints' | 'training' | 'vendor_check' | 'chinese_wall' | 'internal_control'>('legal_review');
```

---

### 그룹 2: 관리업무 6건 — 신규 `AdminOperations.tsx`

**파일**: `src/app/pages/admin/AdminOperations.tsx` (신규 생성)

App.tsx에 import + 라우팅 추가 필요:
```tsx
import { AdminOperations } from './pages/admin/AdminOperations';
// activeTab === 'admin-operations' && <AdminOperations />
```

`src/app/pages/admin/index.ts` 도 생성:
```tsx
export { AdminOperations } from './AdminOperations';
```

#### 2-1. 위촉/해촉 관리 (협회등록, 서류 징구)
```
- 설계사 위촉/해촉 리스트
- 컬럼: 성명, 등록번호, 위촉일, 해촉일, 상태(위촉/해촉/대기), 협회등록상태, 필수서류(징구완료/미비)
- Mock 데이터: 5~6명
- 해촉 시 계약 이관 대상 표시
```

#### 2-2. 계약 보전(배서) 처리
```
- 배서 요청 리스트
- 컬럼: 요청ID, 고객명, 보험사, 변경유형(담보변경/결제변경/계약자변경/수익자변경), 요청일, 처리상태(접수/처리중/완료/반려), 처리자
- Mock 데이터: 4~5건
```

#### 2-3. 보험료 계속분 수기결제/수납
```
- 수납 현황 리스트
- 컬럼: 고객명, 보험사, 상품명, 납입주기, 보험료, 결제방법(카드/계좌이체/수기), 납입상태(정상/연체/미납), 다음납입일
- Mock 데이터: 6~8건
- 연체/미납은 rose 하이라이트
```

#### 2-4. 신계약 수납 / 청약접수 반영
```
- 신계약 접수 리스트
- 컬럼: 청약번호, 고객명, 보험사, 상품명, 보험료, 접수일, 수납상태(미수납/수납완료/반송), 청약상태(접수/심사중/승인/거절)
- Mock 데이터: 4~5건
```

#### 2-5. 해촉자 계약 이관 처리
```
- 이관 대상 계약 리스트
- 컬럼: 해촉 설계사, 고객명, 보험사, 상품명, 이관 대상자(신규 담당), 이관상태(대기/진행중/완료), 이관일
- Mock 데이터: 3~4건
```

#### 2-6. 개인정보 문서 징구/보관
```
- 개인정보 동의서 관리
- 컬럼: 고객명, 문서유형(개인정보수집동의/제3자제공동의/마케팅동의/민감정보동의), 징구일, 보관상태(보관중/만료/미징구), 만료일
- Mock 데이터: 6~8건
- 만료 임박(30일 이내)은 amber, 만료는 rose
```

**구현 패턴**: `DailyReport.tsx` 탭 패턴 + `ReferralManagement.tsx` 테이블 패턴 참고

---

### 그룹 3: 재유입 2건 — `JourneyContext.tsx` + `rules.ts`

#### 3-1. 재유입 고객 식별 / 이전 여정 연결
**파일**: `src/app/pages/growth/ReferralManagement.tsx` (기존 확장)
```
- 재유입 탭 또는 R14 패널 내에 추가
- 완료된 여정의 고객이 다시 유입됐을 때 이전 여정 ID와 연결하여 표시
- 컬럼: 고객명, 이전여정ID, 이전완료일, 재유입일, 재유입경로(소개/직접/광고), 현재스텝
- Mock 데이터: 3건
```

#### 3-2. 재유입 → S4 자동 배정
**파일**: `src/app/pages/growth/ReferralManagement.tsx` (기존 R14 패널 확장)
```
- R14 재유입 패널의 "R1 전환" 버튼을 "S4 자동배정" 버튼으로 확장
- 재유입 고객이 기존 담당자에게 자동 배정되는 로직 표시
- 상태: 자동배정완료 / 수동배정필요 / 배정대기
```

---

### 그룹 4: 외주 2건 — `DocIssuance.tsx` 확장

**파일**: `src/app/pages/claims/DocIssuance.tsx` (기존 확장)

기존 `FieldTeamPanel` 아래에 외주 패널 추가.

#### 4-1. 외주업체(투에이치) 발급 요청 관리
```
- 외주 발급 요청 리스트
- 컬럼: 요청ID, 고객명, 기관명, 서류유형, 요청일, 외주업체(투에이치), 요청상태(접수/발급중/발급완료/실패), 예상완료일
- Mock 데이터: 4~5건
- 상태별 뱃지 색상
```

#### 4-2. 외주업체 발급 현황 추적
```
- 외주업체별 실적 KPI
- 투에이치: 월 처리건수, 평균 소요일, 성공률, 실패률
- KPI 카드 3~4개 + 최근 처리건 미니 테이블
```

---

## App.tsx 라우팅 추가 (그룹 2 전용)

`src/app/App.tsx`에 AdminOperations import 및 렌더링 추가가 필요합니다:

```tsx
import { AdminOperations } from './pages/admin/AdminOperations';

// switch문 내에 추가:
// activeTab === 'admin-operations' && <AdminOperations />
```

`src/app/navigation/navConfig.ts`에 메뉴 항목 추가:
- admin 역할에 'admin-operations' 네비게이션 추가

---

## 구현 순서 (권장)

1. **그룹 1** (준법감시 8건) — ComplianceDashboard.tsx 확장 → 가장 큰 갭
2. **그룹 2** (관리업무 6건) — AdminOperations.tsx 신규 생성
3. **그룹 3** (재유입 2건) — ReferralManagement.tsx R14 확장
4. **그룹 4** (외주 2건) — DocIssuance.tsx 확장

## 빌드 검증 명령어

각 파일 구현 후:
```bash
npx esbuild src/app/pages/compliance/ComplianceDashboard.tsx --bundle --jsx=automatic --platform=browser --loader:.tsx=tsx --external:react --external:react-dom --external:clsx --external:lucide-react --external:'@/*' --outfile=/dev/null
```

전체 빌드:
```bash
npm run build
```

---

## 완료 기준

- 18건 모두 UI 컴포넌트 구현 (Mock 데이터 포함)
- esbuild 개별 파일 번들 pass
- `npm run build` 전체 빌드 pass
- 예상 Match Rate: ~91% (135/149)
