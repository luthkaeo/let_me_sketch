# 진행 원장 — <slug>

> 한 줄 = 한 사건. append-only. 컴팩션이나 세션 재시작 이후 **이 파일이 기억보다 우선한다.**
> `appendLedger(workspace, slug, line)`이 타임스탬프를 붙여 쓴다. 손으로 고치지 않는다.

- 2026-08-27T10:00:00Z  10_frame     승인    .prosona/projects/x/10_service-brief.md
- 2026-08-27T10:00:00Z  10_frame     결정    D-001 온보딩 3단계 압축 (C-003, P-A)
- 2026-08-27T10:20:00Z  30_journey   승인    .prosona/projects/x/30_journey.md
- 2026-08-27T10:26:00Z  40_reference 완료    채택 7 · 기각 4 · 근거없음 2
- 2026-08-27T10:35:00Z  60_review    루프백  회차1 — 치명 2건 (J-003 빈 상태, J-005 되돌리기 없음)
- 2026-08-27T10:41:00Z  60_review    정지    BLOCK_CONTEXT — P-B 이탈 조건이 비어 판정 불가

기록하는 것: 페이즈 승인·반려, 게이트 통과, 루프백 회차와 사유, `BLOCK_*` 정지,
`ultra`에서 건너뛴 게이트의 `내가 결정한 것`(생략하지 않고 여기 누적한다).
