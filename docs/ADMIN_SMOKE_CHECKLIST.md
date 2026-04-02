# Admin Smoke Checklist

## Baseline Commands

```bash
npm install
npm run typecheck
npm run build
npm run preview:local
```

Preview URL:

- `http://127.0.0.1:4173/`

## Route Contract Checks

Check that production tabs render correctly and do not fall back silently:

```bash
rg -n "meeting-refund|meeting-simple|claims-refund|claims-simple" src/app/App.tsx src/app/navigation/navConfig.ts
```

Expected:

- No production-only route mismatch remains.
- Any dev-only tab is intentionally isolated.

## Role Smoke

Open each URL in preview:

- `?role=admin&tab=dashboard`
- `?role=call_member&tab=dashboard`
- `?role=sales_lead&tab=meeting-all`
- `?role=claims_member&tab=claims-all`
- `?role=compliance&tab=settings`

Expected:

- Allowed roles reach the intended screen.
- Disallowed tabs fall back safely to `dashboard`.
- `case-detail` is reachable as a deep-link surface.

## Core Flow Smoke

### Requests

- `?tab=requests&role=admin`
- Click a request row.
- Check `현재 단계` shows stage text, not manager text.
- In request detail:
  - `고객 상세 정보` button responds
  - consultation / meeting / claims detail links respond

### Case Detail

- `?tab=case-detail&requestId=R-105376&section=call&role=admin`
- `?tab=case-detail&requestId=R-TBDH17720260313&section=call&role=call_member`

Expected:

- No dead-end for representative request IDs.
- Empty-state only appears for truly invalid IDs.

### Claims

- `?tab=claims-all&role=claims_member`
- `관리` button opens the claim detail flow.

### Meeting Schedule

- `?tab=meeting-schedule&role=sales_lead`
- Row overflow menu opens.
- `케이스 상세 보기` responds.

## Secondary CTA Smoke

Check that these no longer feel dead:

- `CustomerDetail`:
  - 저장
  - 문자 발송
  - 미팅팀 배정
- `DailyReport`:
  - 보고서 전송
  - 엑셀
- `Documents`:
  - 다운로드 아이콘
- `MeetingOnSite`:
  - 클로바노트 연동
- `PaymentConfirm`:
  - 엑셀 다운로드
- `SimpleClaimWorkflow`:
  - 문서 다운로드

Expected:

- Every CTA either performs a real action or shows an explicit toast/placeholder state.
- Nothing appears clickable but does nothing.

## Placeholder Policy Smoke

Check these screens:

- `Claims` payout tab
- `CustomerDetail` 보상환급관리 tab
- `ClaimsTeamSection` step placeholders

Expected:

- Placeholder copy clearly communicates "not in current scope" or "coming later".
- User is not misled into thinking the feature is complete.

## Responsive First-Pass Smoke

Use these viewport sizes:

- `1440x900`
- `1280x800`
- `1024x768`
- `768x1024`
- `390x844`

Check screens:

- `requests`
- `dashboard`
- `issuance-master`
- `settings`

Expected:

- Main content is still reachable.
- Sidebar does not permanently crush the content area on small screens.
- Header controls wrap instead of overflowing.
- Primary actions are reachable without hover-only behavior.

## Exit Criteria

- `npm run typecheck` passes
- `npm run build` passes
- Core CTA dead buttons: `0`
- Production route mismatch: `0`
- Representative request detail failures: `0`
- Responsive first-pass issues reduced to non-blocking cosmetic issues
