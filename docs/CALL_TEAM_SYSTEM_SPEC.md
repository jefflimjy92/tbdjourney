# 상담팀 운영 A to Z 및 전산 상태 설계서

## 1. 문서 목적

이 문서는 더바다 어드민에서 상담팀이 실제로 수행하는 업무를 누락 없이 전산화하기 위한 운영 명세서다.
범위는 아래와 같다.

- 대상 팀: 상담팀원, 상담팀장
- 대상 구간: 유입 -> 조회/신청 -> 선별/배정 -> 1차 TM -> 2차 TM -> 미팅 인계
- 대상 여정: 3년환급 기본 플로우 중심, 소개/간편청구는 분기 규칙으로 별도 명시

이 문서는 기존 `CALL_TEAM_OPERATIONS.md`, `THEBADA_JOURNEY_MASTER.md`, `Consultation.tsx`, `Handoff.tsx`, `journey/rules.ts`의 용어를 기준으로 전산 운영 기준을 재정리한 표준안이다.

---

## 2. 상담팀 운영 원칙

### 2-1. 상태값 설계 원칙

상담팀 상태는 한 필드에 모두 우겨 넣지 말고 아래 4개 축으로 분리해야 한다.

1. `pipeline_status`
   현재 케이스가 상담 파이프라인 어디에 있는지
2. `reason_code`
   멈춤, 보류, 종료, 반려, 제외가 발생한 이유
3. `call_result`
   개별 통화 시도 1건의 결과
4. `handoff_status`
   미팅팀 인계 패킷의 품질 게이트 상태

이렇게 분리해야 하는 이유는 다음과 같다.

- 리포트에서 "부재"와 "상담종결"을 구분해서 볼 수 있다.
- 1차 TM 중 보류와 2차 TM 중 보류를 다르게 관리할 수 있다.
- 팀장은 인계 반려 사유만 따로 모아 품질 개선이 가능하다.
- 추후 영업팀/청구팀과 연계할 때 상태 폭발을 막을 수 있다.

### 2-2. 전산 기록 단위

상담팀 전산은 최소 아래 5개 단위로 기록되어야 한다.

- `case_master`
  고객/신청/배정/현재 상태의 기준 레코드
- `call_attempt_log`
  통화 시도별 결과 로그
- `consultation_fact_check`
  1차 TM에서 확인한 보험/건강/적합성 정보
- `handoff_packet`
  미팅팀으로 넘길 요약/주의사항/일정/결정권자 정보
- `qa_review_log`
  팀장 검토, 반려, 승인, 예외 승인 이력

### 2-3. 화면 매핑

- 유입/신청 확인: `Requests.tsx`, `Leads.tsx`
- 1차 TM: `FirstTM.tsx`, `Consultation.tsx`
- 2차 TM: `SecondTM.tsx`, `Consultation.tsx`
- 인계 작성/검토: `Handoff.tsx`, `TMChecklist.tsx`
- 일일 관리: `DailyReport.tsx`

---

## 3. 역할 정의

### 상담팀원

- 배정받은 DB 확인
- 1차 TM, 2차 TM 수행
- 상담 체크리스트 입력
- 통화 결과 및 재시도 일정 기록
- 미팅 적합도 판단
- 인계 패킷 작성

### 상담팀장

- 선별/배정 기준 관리
- 정기 배정 및 긴급 재배정
- QA 샘플링 및 스크립트 준수 점검
- 진행불가/예외 승인
- 미팅 인계 승인/반려
- 일일 전환율, 부재율, 취소 사유 모니터링

---

## 4. 상담팀 A to Z 업무 흐름

아래는 실제 운영 기준으로 상담팀이 관리해야 하는 전체 흐름이다.

### STEP 0. 유입 생성

목적:
광고/소개/재유입 등 어떤 채널로 들어왔는지 남기고 상담 대상 케이스를 생성한다.

전산 입력:

- 유입일시
- 유입채널
- 캠페인/매체/광고소재
- 랜딩 경로
- 고객 기본정보
- 마케팅 동의 여부

시스템 처리:

- `pipeline_status = inflow_received`
- 중복 휴대폰/중복 신청 여부 자동 체크
- 기존 고객 여부 태깅
- 소개/광고/재유입 소스 분류

다음 단계 진입 조건:

- 본인인증 또는 조회/신청 프로세스 시작

### STEP 1. 조회/신청 완료 확인

목적:
심평원 조회와 환급 신청이 끝났는지 판단해 상담 가능한 상태로 만든다.

전산 입력:

- 본인인증 결과
- 심평원 조회 성공/실패 여부
- 심평원 첨부 여부
- 신청서 제출 여부
- 조회 실패 메모

시스템 처리:

- 조회 성공 시 `pipeline_status = apply_submitted`
- 조회 실패 시 `pipeline_status = lookup_failed`
- 실패 건은 팀장 모니터링 큐로 이동

다음 단계 진입 조건:

- 신청서 제출 완료

### STEP 2. 선별/배정 준비

목적:
상담 가능한 DB만 남기고 우선순위를 정한 뒤 배정 가능한 상태로 만든다.

전산 입력:

- DB 유형: 가능DB / 보상DB / 소개DB / 동반신청
- 선별 결과
- 제외 여부
- 제외 사유
- 우선순위
- 지역
- 희망 시간대

시스템 처리:

- 자동 제외 규칙 적용
- 소개DB는 Same-owner 우선 규칙 적용
- 보상DB, VIP, 재유입 고객 우선순위 태그 부여
- `pipeline_status = screening_pending` 또는 `assign_ready` 또는 `screening_excluded`

팀장 확인 포인트:

- 27세 미만 자동 제외
- 보험 미가입/보험료 기준 미달 제외 여부
- 암/뇌/심 등 중대질환 플래그
- 마케팅 동의 불가 고객의 접촉 제한 여부

### STEP 3. 상담 배정

목적:
누가 언제 어떤 케이스를 담당하는지 명확하게 만든다.

전산 입력:

- 배정자
- 배정 시각
- 배정 회차
- 배정 소스: 정기/수시/긴급
- 배정 메모

시스템 처리:

- `pipeline_status = assigned`
- 알림톡 또는 내부 알림 발송
- 상담팀원 개인 큐에 노출
- SLA 카운트 시작

운영 규칙:

- 정기 배정: 10:00 / 13:00 / 15:00
- 과다 배정 방지를 위해 팀원별 보유 건수 표시
- 긴급 건은 일반 큐보다 상단 고정

### STEP 4. 1차 TM 준비

목적:
상담 전 고객 배경과 심평원 이력을 빠르게 파악해 첫 콜 성공률을 높인다.

전산 입력:

- 고객 기본정보 확인
- 유입채널 확인
- 심평원 이력 사전 확인자 / 확인시각
- 이전 접촉 이력

시스템 처리:

- `pipeline_status = first_tm_pending`
- 심평원 미검토 건은 경고 표시
- 동일 고객 과거 거절/민원 이력 표시

### STEP 5. 1차 TM 실행

목적:
고객 의향, 기본 적합성, 건강/보험 상태를 파악하고 2차 TM 또는 종결 여부를 판단한다.

상담팀원이 전산에 반드시 입력해야 하는 항목:

- 콜 시작시각, 종료시각
- 통화 연결 여부
- 스크립트 수행 여부
- 녹취 첨부 여부
- 고객 반응 요약
- 상담 요약
- 보험 가입 여부
- 보험 유형
- 월 납입 보험료
- 미납/실효 여부
- 계약자/납입자 일치 여부
- 교통사고 여부 및 상세
- 수술/시술/골절 여부 및 상세
- 중대질환(암/뇌/심) 여부 및 상세
- 복용 약물 여부 및 상세
- 동반 신청 여부
- 고객 성향
- 신뢰도
- 결정권자 여부

시스템 처리:

- `pipeline_status = first_tm_in_progress`
- 필수 체크리스트 누락 시 저장은 가능하되 완료 전환은 차단
- 암/뇌/심 플래그 감지 시 팀장 확인 태그 자동 생성
- 연락 시도 횟수 누적

1차 TM 결과 분기:

- 연결 성공 + 기본 적합 -> `first_tm_completed`
- 부재/통화불가 -> `first_tm_hold`
- 고객 명시 거절 -> `consultation_closed`
- 진행불가 조건 충족 -> `consultation_closed`
- 추가 확인 필요 -> `first_tm_hold`

### STEP 6. 부재/재시도 관리

목적:
연결 실패 건을 버리지 않고 정해진 규칙대로 재시도한다.

전산 입력:

- 시도 횟수
- 시도 채널
- 부재 사유
- 다음 재시도 예정일시
- 재시도 담당자
- 알림톡 발송 여부

시스템 처리:

- `pipeline_status = first_tm_hold` 또는 `second_tm_hold`
- `call_result` 로그 누적
- 3회 이상 부재 시 팀장 검토 대상
- 5회 이상 부재 시 종결 후보 태그

운영 규칙:

- 재시도 간격은 최소 1일, 최대 7일 권장
- 동일 시간대 반복 시도 금지
- 오전/점심/저녁 분산 시도

### STEP 7. 2차 TM 실행

목적:
미팅 의사, 일정, 유형, 결정권자 정보를 확정하고 실제 인계 가능한 상태로 만든다.

상담팀원이 전산에 반드시 입력해야 하는 항목:

- 1차 TM 요약 재확인
- 고객 objection 요약
- 미팅 적합도
- 대면/비대면 여부
- 희망 날짜/시간
- 희망 지역
- 결정권자 참석 여부
- 고객 반응
- 전달 메모
- 주의사항
- 녹취 또는 통화 기록 링크
- 의료기록 필요 예상 여부
- 청구 가능 포인트 메모

시스템 처리:

- `pipeline_status = second_tm_in_progress`
- 필수 인계 항목이 모두 채워져야 `meeting_candidate` 가능
- 일정 입력 시 미팅팀 캘린더 충돌 체크 가능하도록 구조화 저장

2차 TM 결과 분기:

- 미팅 의사 확정 -> `meeting_candidate`
- 일정만 보류 -> `second_tm_hold`
- 고객 재거절 -> `consultation_closed`
- 예외 케이스 -> `exception_review`

### STEP 8. 미팅 전환 판단

목적:
영업팀으로 보낼 가치가 있는 케이스만 인계하도록 사전 품질 게이트를 건다.

전산 입력:

- 미팅 적합도
- 고객 온도
- 결정권자 확인 여부
- 일정 확정도
- 필수 첨부 여부

시스템 처리:

- 기준 충족 시 `pipeline_status = meeting_scheduled` 또는 `handoff_draft`
- 기준 미충족 시 `second_tm_hold`
- 예외 승인 필요 시 `pipeline_status = exception_review`

권장 미팅 전환 기준:

- 수수료 안내 완료
- 기본 적합성 확인 완료
- 일정 또는 선호 시간 확보
- 결정권자 확인
- 고객 거부감이 명확하지 않음

### STEP 9. 인계 패킷 작성

목적:
영업팀이 재통화 없이 바로 미팅 준비할 수 있을 만큼 정보를 구조화한다.

상담팀원이 전산에 반드시 입력해야 하는 항목:

- 상담 요약
- 고객 반응
- objection 요약
- 결정권자
- 선호 시간대
- 주소/권역
- 미팅 유형
- 전달 메모
- 주의사항
- 콜 녹취 또는 전사
- 첨부 파일 목록

필수 품질 기준:

- 누가 결정권자인지 명확해야 함
- 어떤 포인트에 반응했는지 남아야 함
- 무엇을 싫어하는지 objection이 남아야 함
- 미팅팀이 주의해야 할 리스크가 적혀 있어야 함

시스템 처리:

- `pipeline_status = handoff_draft`
- `handoff_status = draft`

### STEP 10. 팀장 QA / 승인 / 반려

목적:
불완전한 상담 인계가 영업팀으로 넘어가지 않도록 막는다.

상담팀장이 확인해야 하는 항목:

- 1차/2차 TM 필수값 입력 완료
- 녹취/전사 첨부 여부
- 심평원 검토 완료 여부
- 스크립트 준수 여부
- 고객 반응/요약/주의사항의 구체성
- 일정/지역/결정권자 정보 존재 여부

팀장 액션:

- 승인 -> `pipeline_status = handoff_approved`, `handoff_status = approved`
- 반려 -> `pipeline_status = handoff_rejected`, `handoff_status = rejected`
- 예외승인 -> `pipeline_status = handoff_approved`, `reason_code = exception_approved`

반려 시 반드시 입력해야 할 항목:

- 반려 사유 코드
- 반려 상세 메모
- 재작업 담당자
- 재작업 기한

### STEP 11. 종료 / 제외 / 재유입 관리

목적:
진행이 중단된 케이스도 버리지 않고 원인과 재활용 가능성을 남긴다.

종료 시 필수 입력:

- 종료 사유 코드
- 종료 상세 메모
- 재유입 가능 여부
- 재유입 예상 시점
- 민원/주의 고객 여부

시스템 처리:

- `pipeline_status = consultation_closed`
- 재유입 가능 건은 리마케팅 큐로 이동 가능
- 민원 소지 건은 준법/관리자 태그

### STEP 12. 일일 운영 및 리포트

상담팀장 대시보드에서 반드시 보여야 하는 항목:

- 당일 유입 수
- 신청 완료 수
- 배정 가능 수
- 배정 완료 수
- 1차 TM 시도 수
- 1차 TM 완료 수
- 2차 TM 완료 수
- 미팅 인계 수
- 부재 건수
- 거절 건수
- 진행불가 건수
- 인계 반려 건수
- 상담원별 전환율
- 사유 코드별 취소/종결 현황

---

## 5. 전산 필수 엔티티와 입력 항목

## 5-1. 케이스 마스터

필수 컬럼:

- case_id
- customer_id
- journey_type
- inflow_channel
- db_category
- owner_id
- pipeline_status
- reason_code
- reason_detail
- priority
- assignment_round
- assigned_at
- next_action_at
- reentry_eligible
- created_at
- updated_at

## 5-2. 통화 시도 로그

통화 시도 단위로 아래를 남겨야 한다.

- attempt_no
- tm_stage: first / second
- call_started_at
- call_ended_at
- channel: phone / kakao / sms
- call_result
- reason_code
- memo
- next_retry_at
- recording_link
- actor

## 5-3. 1차 TM 팩트체크

- hira_reviewed_by
- hira_reviewed_at
- insurance_status
- insurance_type
- monthly_premium
- payment_status
- contractor_match
- traffic_accident
- surgery_flag
- surgery_detail
- critical_disease_flag
- critical_disease_detail
- medication_flag
- medication_detail
- companion_flag
- disposition
- trust_level
- customer_summary
- customer_reaction

## 5-4. 2차 TM / 인계 정보

- objection_summary
- meeting_fit
- meeting_type
- preferred_date
- preferred_time
- preferred_region
- decision_maker
- handoff_note
- caution_note
- need_medical_docs
- claim_opportunity_note
- transcript_attached
- call_record_link

## 5-5. QA 검토 로그

- review_stage
- reviewer
- reviewed_at
- result: approved / rejected / exception_approved
- reject_reason_code
- reject_reason_detail
- due_at

---

## 6. 상담팀 전산 상태값 표준안

아래 표준안은 현재 화면의 상태 혼선을 줄이기 위한 권장 구조다.

## 6-1. 파이프라인 상태값 (`pipeline_status`)

| 상태코드 | 한글명 | 설명 | 주체 |
|---|---|---|---|
| `inflow_received` | 유입접수 | 유입 이벤트 생성 완료 | 시스템 |
| `lookup_in_progress` | 조회중 | 심평원 조회/본인인증 진행 중 | 시스템 |
| `lookup_failed` | 조회실패 | 조회 실패 또는 신청 중단 | 시스템/팀장 |
| `apply_submitted` | 신청완료 | 고객 신청 완료 | 시스템 |
| `screening_pending` | 선별대기 | 선별/제외 판단 전 | 팀장 |
| `screening_excluded` | 선별제외 | 상담 대상 제외 | 팀장 |
| `assign_ready` | 배정가능 | 상담 가능한 상태 | 팀장 |
| `assigned` | 배정완료 | 담당자 배정 완료 | 팀장 |
| `first_tm_pending` | 1차TM대기 | 1차 TM 시작 전 | 팀원 |
| `first_tm_in_progress` | 1차TM진행중 | 1차 TM 수행 중 | 팀원 |
| `first_tm_hold` | 1차TM보류 | 부재/재시도/확인필요 | 팀원 |
| `first_tm_completed` | 1차TM완료 | 1차 TM 필수값 완료 | 팀원 |
| `second_tm_pending` | 2차TM대기 | 2차 TM 대상 확정 | 팀원 |
| `second_tm_in_progress` | 2차TM진행중 | 2차 TM 수행 중 | 팀원 |
| `second_tm_hold` | 2차TM보류 | 일정 미확정/재연락 필요 | 팀원 |
| `meeting_candidate` | 미팅전환후보 | 미팅 인계 가능성 높음 | 팀원 |
| `meeting_scheduled` | 미팅일정확정 | 고객과 미팅 일정까지 확정됨 | 팀원 |
| `handoff_draft` | 인계작성중 | 인계 패킷 작성 중 | 팀원 |
| `handoff_review` | 인계검토중 | 팀장 검토 중 | 팀장 |
| `handoff_rejected` | 인계반려 | 인계 재작성 필요 | 팀장 |
| `handoff_approved` | 인계승인 | 영업팀 전달 완료 | 팀장 |
| `consultation_closed` | 상담종결 | 상담팀 단계 종료 | 팀원/팀장 |
| `exception_review` | 예외검토 | 팀장 승인 필요한 특수 건 | 팀장 |

권장 전이 흐름:

`inflow_received -> apply_submitted -> screening_pending -> assign_ready -> assigned -> first_tm_pending -> first_tm_in_progress -> first_tm_completed -> second_tm_pending -> second_tm_in_progress -> meeting_candidate -> handoff_draft -> handoff_review -> handoff_approved`

종결 분기 예시:

- `screening_pending -> screening_excluded`
- `first_tm_in_progress -> first_tm_hold`
- `first_tm_in_progress -> consultation_closed`
- `second_tm_in_progress -> second_tm_hold`
- `handoff_review -> handoff_rejected`

## 6-2. 통화 결과값 (`call_result`)

| 코드 | 한글명 | 설명 |
|---|---|---|
| `connected` | 연결성공 | 고객과 정상 통화 |
| `no_answer` | 부재 | 수신 없음 |
| `busy` | 통화중 | 통화중으로 연결 안 됨 |
| `callback_requested` | 콜백요청 | 고객이 특정 시간 재연락 요청 |
| `wrong_number` | 결번/오번호 | 번호 오류 |
| `refused_call` | 통화거부 | 전화 수신 후 상담 거부 |
| `message_left` | 메시지전달 | 알림톡/SMS 발송 완료 |
| `not_reachable` | 연락두절 | 다회 시도에도 연결 안 됨 |

## 6-3. 보류 사유 코드 (`hold_reason_code`)

| 코드 | 사유 |
|---|---|
| `customer_unavailable` | 고객 부재 |
| `requested_callback` | 고객이 재통화 요청 |
| `decision_maker_absent` | 결정권자 부재 |
| `needs_document_check` | 서류/조회 재확인 필요 |
| `schedule_not_fixed` | 일정 미확정 |
| `customer_travel` | 해외/지방 체류 |
| `health_confirmation_needed` | 병력/건강정보 추가 확인 필요 |
| `internal_review_needed` | 팀장 검토 필요 |

## 6-4. 선별 제외 사유 코드 (`screening_exclude_reason_code`)

| 코드 | 사유 |
|---|---|
| `under_age` | 기준 연령 미달 |
| `no_marketing_consent` | 접촉 동의 미보유 |
| `duplicate_case` | 중복 신청 |
| `no_insurance` | 보험 미가입 |
| `premium_too_low` | 보험료 기준 미달 |
| `critical_disease` | 암/뇌/심 중대질환 이력 |
| `out_of_target_region` | 운영 권역 외 |
| `invalid_inflow` | 허위/테스트/유효하지 않은 유입 |

## 6-5. 상담 종결 사유 코드 (`close_reason_code`)

| 코드 | 사유 |
|---|---|
| `explicit_refusal` | 고객 명시 거절 |
| `fee_refusal` | 수수료 수용 불가 |
| `not_interested` | 서비스 관심 없음 |
| `already_with_competitor` | 타사 진행 중 |
| `critical_disease_confirmed` | 중대질환으로 진행 불가 |
| `no_claim_opportunity` | 환급/청구 가능성 낮음 |
| `policy_not_maintained` | 보험 유지 상태 불량 |
| `unreachable_after_max_attempts` | 최대 시도 후에도 연락 불가 |
| `customer_cancelled` | 고객 요청으로 중단 |
| `compliance_risk` | 민원/준법 리스크 |

## 6-6. 인계 반려 사유 코드 (`handoff_reject_reason_code`)

| 코드 | 사유 |
|---|---|
| `missing_recording` | 녹취/전사 누락 |
| `missing_summary` | 상담 요약 누락 |
| `missing_decision_maker` | 결정권자 정보 누락 |
| `missing_schedule_info` | 일정/시간 정보 불충분 |
| `missing_objection_note` | objection 정리 부족 |
| `missing_hira_review` | 심평원 검토 누락 |
| `script_not_completed` | 스크립트 수행 미완료 |
| `low_confidence_case` | 미팅 전환 근거 부족 |

## 6-7. 예외 승인 사유 코드 (`exception_reason_code`)

| 코드 | 사유 |
|---|---|
| `vip_priority` | VIP 우선 처리 |
| `manager_override` | 팀장 수동 승인 |
| `same_owner_referral` | 소개 Same-owner 예외 처리 |
| `special_campaign` | 특정 캠페인 우선 운영 |
| `high_claim_potential` | 청구 기대액 높아 예외 진행 |

## 6-8. 인계 상태값 (`handoff_status`)

| 코드 | 한글명 | 설명 |
|---|---|---|
| `draft` | 작성중 | 상담팀원이 인계 패킷 작성 중 |
| `submitted` | 제출됨 | 팀장 검토 요청 완료 |
| `rejected` | 반려 | 팀장 반려, 재작성 필요 |
| `approved` | 승인 | 영업팀 전달 가능 |
| `exception_approved` | 예외승인 | 일반 기준 미달이나 관리 승인으로 통과 |

---

## 7. 상태별 필수 입력 규칙

아래 규칙은 저장 차단 또는 상태 전이 차단 기준으로 쓰는 것이 좋다.

### `first_tm_completed` 전환 전 필수

- 심평원 검토자
- 심평원 검토시각
- 보험 가입 여부
- 건강 체크 4종
- 고객 반응 요약
- 상담 요약

### `second_tm_in_progress` 전환 전 필수

- 1차 TM 완료
- 재연락 가능 시간 또는 일정 후보

### `meeting_candidate` 전환 전 필수

- objection 요약
- 미팅 적합도
- 전달 메모
- 결정권자
- 선호 시간대

### `handoff_approved` 전환 전 필수

- 상담 요약
- 고객 반응
- 결정권자
- 선호 시간대
- 전달 메모
- 주의사항
- 녹취 또는 전사

### `consultation_closed` 전환 전 필수

- 종결 사유 코드
- 상세 메모
- 재유입 가능 여부

---

## 8. 권장 자동화 규칙

- 연락 시도 3회 이상이면 팀장 검토 알림
- 연락 시도 5회 이상이면 종결 후보 태그
- 중대질환 체크 시 `critical_disease` 후보 자동 태그
- 소개DB는 기존 담당자 자동 우선 배정
- 인계 반려 2회 이상인 상담원은 QA 코칭 대상 자동 태그
- 종결 후 재유입 가능 건은 D+30, D+90 리마케팅 큐 생성

---

## 9. 영업팀 인계 시 넘겨야 하는 최소 정보

영업팀이 "다시 처음부터 물어보지 않게" 하려면 아래는 반드시 넘겨야 한다.

- 고객 기본정보
- 유입경로
- 심평원 주요 포인트
- 보험 상태 및 월 보험료
- 고객의 핵심 니즈
- 고객 objection
- 결정권자 여부
- 대면/비대면 선호
- 선호 시간/지역
- 주의해야 할 표현/민감 포인트
- 녹취 또는 전사 링크
- 필요한 후속 서류 예상

---

## 10. 상담팀 기획 시 가장 중요한 결론

상담팀 전산은 단순히 "통화했다/안 했다"를 기록하는 도구가 아니라 아래 3가지를 동시에 해야 한다.

1. 전환 관리
   누구를 언제 2차 TM과 미팅으로 넘길지 판단
2. 품질 관리
   어떤 상담원이 어떤 이유로 인계가 반려되는지 파악
3. 재활용 관리
   지금 안 되는 고객을 언제 어떤 사유로 다시 볼지 남김

따라서 상담팀 설계에서 가장 중요한 필드는 `pipeline_status`, `reason_code`, `next_action_at`, `call_attempt_count`, `decision_maker`, `customer_summary`, `handoff_note`다.

---

## 11. 상담팀 상태값 단순안 (2뎁스)

복잡한 상태를 다 보여주기보다, 상담팀 운영에서는 아래처럼 2뎁스로 쓰는 것이 가장 관리하기 쉽다.

- 1뎁스: 현재 어느 구간에 있는지
- 2뎁스: 그 구간 안에서 어떤 상태인지

권장 구조는 아래와 같다.

### 11-1. 1뎁스 `대기`

설명:
아직 상담팀 실무가 본격 시작되지 않았거나, 다음 액션 전 대기 중인 상태

2뎁스 상태:

| 2뎁스 상태코드 | 상태명 | 사유 코드 |
|---|---|---|
| `waiting_apply` | 신청대기 | `customer_not_submitted`, `lookup_in_progress`, `lookup_failed_retry` |
| `waiting_screening` | 선별대기 | `screening_backlog`, `lead_review_pending`, `duplicate_check_pending` |
| `waiting_assign` | 배정대기 | `staff_not_assigned`, `assignment_batch_pending`, `priority_review_pending` |
| `waiting_recall` | 재콜대기 | `customer_requested_callback`, `no_answer_retry`, `busy_retry` |
| `waiting_schedule` | 일정확정대기 | `customer_not_confirmed`, `decision_maker_absent`, `schedule_coordination_needed` |

### 11-2. 1뎁스 `진행중`

설명:
상담팀이 실제로 콜, 확인, 인계 작성 등 액션을 수행 중인 상태

2뎁스 상태:

| 2뎁스 상태코드 | 상태명 | 사유 코드 |
|---|---|---|
| `in_progress_first_tm` | 1차TM 진행중 | `first_call_started`, `fact_check_in_progress`, `hira_review_in_progress` |
| `in_progress_second_tm` | 2차TM 진행중 | `second_call_started`, `meeting_needs_check`, `objection_handling` |
| `in_progress_handoff` | 인계작성중 | `handoff_note_writing`, `recording_uploading`, `summary_completing` |
| `in_progress_qa` | 팀장검토중 | `qa_review_pending`, `approval_pending`, `exception_review_pending` |

### 11-3. 1뎁스 `보류`

설명:
진행은 멈췄지만 추후 다시 액션할 가능성이 있는 상태

2뎁스 상태:

| 2뎁스 상태코드 | 상태명 | 사유 코드 |
|---|---|---|
| `hold_contact` | 연락보류 | `no_answer`, `busy`, `customer_unavailable`, `overseas_travel` |
| `hold_customer` | 고객확인보류 | `needs_family_discussion`, `needs_document_review`, `needs_health_check` |
| `hold_internal` | 내부검토보류 | `manager_review_needed`, `exception_check_needed`, `compliance_check_needed` |
| `hold_schedule` | 일정보류 | `schedule_not_fixed`, `customer_requested_delay`, `decision_maker_schedule_conflict` |

### 11-4. 1뎁스 `완료`

설명:
상담팀 단계 안에서 다음 단계로 넘길 준비가 끝난 상태

2뎁스 상태:

| 2뎁스 상태코드 | 상태명 | 사유 코드 |
|---|---|---|
| `done_first_tm` | 1차TM 완료 | `fact_check_completed`, `basic_fit_confirmed`, `next_step_ready` |
| `done_second_tm` | 2차TM 완료 | `meeting_intent_confirmed`, `schedule_candidate_secured`, `decision_maker_confirmed` |
| `done_handoff_submit` | 인계제출완료 | `handoff_packet_submitted`, `recording_attached`, `summary_completed` |
| `done_handoff_approved` | 인계승인완료 | `manager_approved`, `exception_approved`, `meeting_team_sent` |

### 11-5. 1뎁스 `종결`

설명:
상담팀에서 더 이상 진행하지 않는 종료 상태

2뎁스 상태:

| 2뎁스 상태코드 | 상태명 | 사유 코드 |
|---|---|---|
| `closed_refused` | 고객거절종결 | `explicit_refusal`, `not_interested`, `fee_refusal`, `already_with_competitor` |
| `closed_impossible` | 진행불가종결 | `critical_disease`, `no_insurance`, `no_claim_opportunity`, `out_of_scope` |
| `closed_unreachable` | 연락불가종결 | `max_attempt_reached`, `wrong_number`, `not_reachable_long_term` |
| `closed_rejected_handoff` | 인계불가종결 | `low_meeting_fit`, `missing_core_info`, `manager_final_reject` |
| `closed_customer_cancel` | 고객취소종결 | `customer_cancelled`, `requested_stop_contact`, `privacy_request` |

### 11-6. 가장 추천하는 실무 사용 방식

실무에서는 아래 조합으로 쓰는 것을 추천한다.

- 목록 화면: `1뎁스 상태 + 2뎁스 상태`
- 상세 화면: `1뎁스 상태 + 2뎁스 상태 + 사유 코드 + 사유 메모`
- 리포트 화면: `1뎁스 상태별 건수`, `2뎁스 상태별 건수`, `사유 코드별 건수`

예시:

- `대기 > 배정대기`
- `진행중 > 1차TM 진행중`
- `보류 > 연락보류`
- `완료 > 인계승인완료`
- `종결 > 고객거절종결`
