# Notion Export Analysis

Source analyzed: `/Users/joonyounglim/Downloads/노션.zip`

## Snapshot

- Root page title: `고객 여정별 업무 흐름도`
- Export contents: `449` files
- File types: `405` Markdown, `36` CSV, `8` PNG
- External links from root:
  - Figma board: `https://www.figma.com/board/UfvSlhVRhU0xMxy51HlLhn/...`
  - Vercel app: `https://tbd-user-journey-2xml.vercel.app/`

The export is not a single spec page. It is a mixed operating knowledge base made of:

- primary structured databases
- step-level journey pages
- team-by-team SOP/playbook pages
- compliance/privacy reference pages
- backlog-style improvement cards
- backup and legacy reference material

## Root Structure

The root page links to these primary artifacts:

- `고객여정`
- `더바다 개선 아이디어`
- `(찐)상세 업무 리스트`
- `준법 법률 데이터베이스`
- `개인정보 데이터베이스`
- `지표 & KPI`
- `백업용 임시`
- `제목 없음`

Observed caveats:

- `지표 & KPI` is linked from the root page but the referenced CSV is not present in this export.
- `제목 없음` is a flattened summary CSV with the same `40` journey rows as `고객여정`.
- Many CSVs are duplicated as `_all.csv`, but in most primary DBs the row counts match the base CSV.

## 1. Customer Journey DB

Primary file:

- `고객여정 8a5de6357b2d82af9b89013a7f376454.csv`

Current row count: `40`

Purpose:

- Defines the canonical customer-journey model
- Connects each step to its main phase, owning team, KPI, purpose, privacy data, and compliance review
- Serves as the top-level map for the whole operating model

Columns include:

- `순서`
- `단계명`
- `메인 페이즈`
- `주관팀`
- `준법검토 영역`
- `코드`
- `핵심 KPI`
- `핵심 목적`
- `취득 신규 개인정보`
- `개인정보 항목`
- `유형`

Journey types captured:

- `3년`: `17` steps (`S1`-`S17`)
- `소개`: `14` steps (`R1`-`R14`)
- `간편`: `9` steps (`Q1`-`Q9`)

Phase distribution:

- `유입`: `3`
- `조회·신청`: `5`
- `선별·배정`: `1`
- `상담·TM`: `4`
- `미팅·계약`: `6`
- `청구·분석`: `10`
- `지급·사후`: `6`
- `Growth Loop`: `5`

Team ownership distribution:

- `공통`: `6`
- `상담팀`: `8`
- `영업팀`: `8`
- `청구팀`: `16`
- `영업팀, 청구팀`: `2`

Important structural observation:

- This DB matches the repo's 3년/소개/간편 journey split and provides the business meaning behind the step codes.
- Each journey page is more than a label. The step pages link outward to SOP docs, privacy docs, and legal-review docs.

Representative step-page structure:

- step metadata (`메인 페이즈`, `주관팀`, `코드`, `핵심 목적`, `핵심 KPI`)
- linked manager/team-member tasks
- linked privacy acquisition items
- linked compliance review item
- linked source docs or Drive materials

Example:

- `TM 1차 통합(기초사실 확인·보험/병력 판정)` defines `S5`, links to 상담팀 팀원/팀장 SOPs, lists newly acquired data, and ties the step to a specific 준법 검토 page.

## 2. Detailed Task Playbook

Primary file:

- `(찐)상세 업무 리스트 31ade6357b2d80e5b675d87bc7be4aed.csv`

Current row count: `71`

Purpose:

- Team-by-team operating playbook
- Describes actual execution behavior, not just step labels
- Expands journey steps into real SOPs for members and managers

Top team/role counts:

- `인사팀 | 관리자`: `17`
- `영업팀 | 팀원`: `8`
- `청구팀 | 팀원`: `7`
- `상담팀 | 관리자`: `7`
- `준법감시팀 | 관리자`: `7`
- `상담팀 | 팀원`: `6`
- `영업팀 | 관리자`: `6`
- `기획·개발(IT)팀 | 관리자`: `5`
- `청구팀 | 관리자`: `5`
- `CS팀 | 팀원`: `2`
- `CS팀 | 관리자`: `1`

Representative content style:

- explicit business purpose
- step-by-step procedure
- system/tool list
- completion checklist
- caution/compliance notes
- linked Drive/Notion source materials

Representative examples:

- `콜팀원 2단계 : 1차 고객 TM(기초사실 확인/가치 안내)`
- `콜팀장 2단계 : 실시간 상담 품질 검수 및 피드백`
- `영업팀원 1단계 DB 수령·유선콜 진행`
- `청구팀원 1단계 오전업무 - 청구서 작성 사전준비`

This section behaves like an operations manual. For implementation work, it is the strongest source for:

- required workflow states
- actor-specific responsibilities
- checklists
- validation rules
- operational terminology

## 3. Compliance / Legal Model

Primary file:

- `준법 법률 데이터베이스 32cde6357b2d80df9dd4e14224d39297.csv`

Current row count: `26`

Purpose:

- Maps each journey stage to its legal/compliance review area
- Provides stage-level linkage from workflow to compliance concerns

Columns:

- `업무단계`
- `🗂️ 상세 업무 리스트 (1)`
- `준법/법률 데이터베이스`

This is the stage-level map.

There is also a more granular backup/working DB:

- `백업용 임시/⚖️ 준법 법률 항목 데이터베이스 e6623c2252dc4b8fbc87cd42bb82a0c4.csv`
- Row count: `39`

Detailed legal-item DB characteristics:

- `법률 유형`: concentrated in `개인정보·동의`, `고객안내·고지`, `모집행위규제`
- `위험도`: `18` high, `18` medium
- `조치 상태`: `30` are `전문가 확인 필요`
- `선택`: `26` No, `13` Yes

Representative item-page fields:

- `근거 법령`
- `법률 유형`
- `원본 출처 단계`
- `적용 단계`
- `위험도`
- `조치 상태`
- short guidance on what is or is not allowed

Representative example:

- `심평원 의료정보 처리(민감정보)` says HIRA medical data is sensitive information, should only be used for pre-analysis/meeting preparation, and should not be combined for sales use.

Implementation implication:

- Compliance is modeled as a first-class layer, not an afterthought.
- The workflow expects certain UI copy, data handling, and process separation to be justified against legal categories.

## 4. Privacy / Personal Data Model

Primary file:

- `개인정보 데이터베이스 4bbde6357b2d8311a72781935087549b.csv`

Current row count: `24`

Purpose:

- Catalogs what personal data is collected, when it is collected, how it is collected, and when it should be destroyed

Columns:

- `이름`
- `개인정보 유형`
- `민감도`
- `정보 수취 단계`
- `수취 방법`
- `수집 정보`
- `정보 폐기`
- `🗂️ 업무`
- `메모`

Sensitivity distribution:

- `3. 보통`: `6`
- `4. 민감`: `6`
- `2. 낮음`: `5`
- `5. 매우 민감`: `5`
- `1. 아주 낮음`: `1`

Retention distribution:

- `보험금 지급 이후`: `10`
- `10년 보관`: `6`
- `불필요`: `2`
- `미수집으로 불필요`: `2`

Collection-method examples:

- `자동 수취`
- `고객 직접 입력`
- `API 연동(건강보험심사평가원)`

Representative page style:

- collected fields
- legal basis for collection/use
- usage purpose
- disposal approach

Representative example:

- `기본 개인 정보` documents direct customer input fields, legal basis, use cases, and deletion policy.

Notable observation:

- Privacy is modeled per data artifact, not just per screen.
- The data catalog is linked back to journey stages and sometimes to specific SOPs.

## 5. Improvement-Idea Backlog

Primary file:

- `더바다 개선 아이디어 f86de6357b2d827aaa6c81f0c0583c65.csv`

Current row count: `62`

Purpose:

- Central feature/backlog board for future admin improvements
- Mostly short cards with metadata and parent-child structure
- Some cards include screenshot references

Shared characteristics:

- all `진행 상태` values are currently `시작 전`
- many cards are metadata-only stubs
- some higher-priority cards include screenshots or concrete UI direction

Category distribution:

- `업무 자동화`: `17`
- `기능 개선`: `15`
- `데이터 분석`: `11`
- `고객 유치`: `7`
- `사업 확장`: `3`

Common parent themes:

- `업무 매뉴얼·표준 통합`
- `고객 관리`
- `영업 자동화 구축`
- `CRM`
- `청구 자동화 보강`
- `KPI, 지표, 데이터 구조화`

Representative items:

- `전사 KPI 대시보드 자동화`
- `통합 고객 여정 뷰 (타임라인 통합)`
- `직원 고객 관리 현황 대시보드 (EmployeePipelineOverview)`
- `체크항목 구조화 + HIRA API 자동 입력 (HealthCheckSection)`
- `통합 검색·빠른 조회 기능`
- `준법·스크립트 버전 관리 체계`

Visual assets:

- `8` PNG screenshots
- screenshots appear in:
  - `직원 고객 관리 현황 대시보드 (EmployeePipelineOverview)`
  - `체크항목 구조화 + HIRA API 자동 입력 (HealthCheckSection)`

Implementation implication:

- This DB is the clearest source for future feature candidates and dashboard wish-list items.
- Most cards are not full specs yet, so they are good direction-setting inputs rather than complete implementation tickets.

## 6. Backup / Legacy / Working Material

Primary entry:

- `백업용 임시 32fde6357b2d801a87a0fecaaf2073e7.md`

This folder is large (`193` files total at the top level under the root page) and includes a mix of:

- alternate journey tables
- duplicated journey models
- previous privacy DB versions
- legal-item working DB
- meeting notes
- status master tables
- reason-code master tables

Important CSVs in this area:

- `2️⃣ 간편청구 고객여정`: `9` rows
- `3️⃣ 소개고객·가족연동 고객여정`: `14` rows
- `개인정보 데이터베이스 수정전`: `17` rows
- `⚖️ 준법 법률 항목 데이터베이스`: `39` rows
- `영업(미팅)팀 상태값 마스터 v2`: `16` rows
- `영업(미팅)팀 세부 사유 마스터 v2`: `49` rows
- `📝 회의록`: `2` rows

Interpretation:

- This folder is valuable for recovery and reference
- It should not be treated as the default source of truth unless the main DB is missing needed detail
- The state/reason masters are especially useful when reconstructing granular UI states or cancellation / failure reasons

## 7. How The Pieces Fit Together

The export forms a layered model:

1. `고객여정`
   - canonical workflow map
2. individual journey pages
   - purpose, KPI, linked SOPs, linked privacy items, linked legal items
3. `(찐)상세 업무 리스트`
   - actor-level operating procedures
4. `개인정보 데이터베이스`
   - data inventory and retention rules
5. `준법 법률 데이터베이스`
   - stage-level legal review anchors
6. `더바다 개선 아이디어`
   - future-state backlog and UI/system ideas
7. `백업용 임시`
   - legacy working material and granular masters

This is closer to a mini operating system specification than a simple Notion notes dump.

## Practical Takeaways For Future Work

- Treat `고객여정` as the workflow source of truth.
- Treat `(찐)상세 업무 리스트` as the execution/SOP source of truth.
- Treat `개인정보 데이터베이스` and `준법 법률 데이터베이스` as governance layers that should shape UI copy, data collection, and retention behavior.
- Treat `더바다 개선 아이디어` as the main source for enhancement backlog and dashboard/UI opportunities.
- Use `백업용 임시` only when the primary DBs do not have enough detail, or when reconstructing historical state taxonomies.

## What Is Already Clear

- The business model is explicitly journey-based and multi-team.
- The journey is not only sales-oriented; it spans intake, validation, meeting, claims execution, payout, and growth loop.
- Privacy and compliance are deeply entangled with step definitions.
- The export contains enough detail to drive future UI, state model, validation, and role-based workflow work.
- The repo's existing journey-centric structure appears conceptually aligned with this export, but a separate gap analysis is still needed to confirm coverage.
