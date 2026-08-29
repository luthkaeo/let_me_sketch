# Prosona

> Claude Code용 서비스 기획 루프. 쉬운 말로 인터뷰하고, 정책을 쓰고, 여정을 그리고,
> 실제 UI 선례를 인용해 화면을 명세하고 — 마지막에 운영 수치를 되읽어 그게 실제로 통했는지 본다.

**Prosona는 기획만 한다. 코드는 만들지 않는다.** 산출물은 기획자의 것이다 — 서비스 정의,
규칙과 예외, 비즈니스 플로우, 프로세스 단위 화면 설계 문서.

## 왜 만들었나

**AI가 기획 루프를 스스로 굴리는 구간(runway)을 최대화한다.** 그 구간의 상한을 정하는 건 둘이다.

- **컨텍스트 열화** — 대화가 길어질수록 앞서 정한 정책을 잊고, 용어가 흔들리고, 이전 화면과 모순되는 플로우가 나온다
- **판단 근거 부재** — 근거가 없으니 확인하려고 멈춘다. 멈춤이 곧 자율 구간의 종료다

앞의 것은 **페이즈별 컨텍스트 격리 + 디스크 상태**로, 뒤의 것은 **정책·제약을 파일로 고정**해서 없앤다.

그런데 실측이 가설을 뒤집었다. 스킬 없이 같은 과제를 시킨 베이스라인은 **한 번도 멈추지 않았고**,
대신 답할 수 없는 페이즈를 **조용히 건너뛰었다** — 제약과 여정과 화면 9개를 쓰면서 타깃 사용자를
끝내 한 번도 적지 않았고, 그 사실을 밝히지도 않았다. 그래서 완결성은 **주장이 아니라 코드가 검사**한다.

## 설치

```bash
claude plugin marketplace add /경로/prosona
```

```bash
claude plugin install prosona@prosona-dev
```

## 루프

```
  10 frame       쉬운 말 인터뷰 → 브리프 + 유저 페르소나        [GATE 1]
  20 policy      규칙 · 예외 · 결정 권한                        [GATE 2]
  30 journey     페르소나별 여정 + 실패 경로                    [GATE 3]
  40 reference   Mobbin 동일 도메인 선례, 채택/기각 + URL
  50 screens     화면 명세 (.md + .json), 상태 3종 필수         [GATE 4]
  60 review      격리된 가상 유저 QA, 50으로 루프백 최대 2회    [GATE 5]
  90 handoff     여정 단위 구현 태스크 목록
  95 operate     목표 지표 ↔ 실측 대조 → 어긋난 결정을 supersede
```

게이트 사이에서는 되묻지 않는다. 근거가 없으면 가정을 명시하고 `## 미해결`에 올린 뒤 상태 파일에
정지 사유를 남긴다. 예외는 GATE 1 앞의 인터뷰 하나뿐 — 거기서는 **묻는 것이 곧 일**이다.

`ultra`에서는 GATE 2·3·4가 사라지고 방향(1)과 검증(5)만 남는다.

## 무엇이 다른가

**완결성을 코드가 검사한다.** 페이즈는 산출 파일에 필수 절이 실제로 있을 때만 통과한다.
모델은 규율을 어기는 게 아니라 그 항목이 있다는 걸 잊는다. 잊음은 설득으로 못 고친다.

**결정이 문장이 아니라 노드다.** `why`와 `dependsOn`이 비면 쓰기 시점에 거부된다. 그래서
`impactOf(C-003)`이 사슬을 타고 내려가, **그 제약을 언급조차 안 한 결정**까지 찾아낸다.

**바뀐 이유가 남는다.** 결정을 뒤집으면 `supersedes`로 잇고, 화면을 다시 쓰면 이전 버전을
`.history/`에 보존한다. `/prosona-trace`가 셋을 한 줄기 타임라인으로 보여준다.

**루프가 자기를 감사한다.** `/prosona-harness`가 모델 드리프트, 계획되지 않은 정지, 비용 이상치,
그리고 루프가 닫히지 않은 것을 보고한다. **모든 지적이 고칠 방법을 함께 단다** — 다음 실행이
행동할 수 없는 지적은 불평이다.

**절대 생략하지 않는 것.** 빈 상태 · 에러 상태 · 되돌리기 · 접근성 기본 ·
**아무도 쓰기 싫어하는 정책 예외**.

## 명령

| 명령 | 페이즈 |
|---|---|
| `/prosona` | 시작 또는 재개 |
| `/prosona-frame` | 10 — 인터뷰·브리프·페르소나 |
| `/prosona-policy` | 20 — 규칙·예외·결정 권한 |
| `/prosona-journey` | 30 — 여정과 실패 경로 |
| `/prosona-reference` | 40 — Mobbin 선례 |
| `/prosona-screens` | 50 — 화면 명세 |
| `/prosona-review` | 60 — 가상 유저 QA |
| `/prosona-handoff` | 90 — 구현 태스크 목록 |
| `/prosona-operate` | 95 — 지표 대조 |
| `/prosona-loop` | 전체 연속 실행 |
| `/prosona-trace` | 결정·개정 타임라인 |
| `/prosona-harness` | 실행 자체 감사 |

## 스크립트

```bash
node scripts/check-screens.mjs <50_screens 경로>    # 화면 명세 스키마 검증
node scripts/render-screens.mjs <50_screens 경로>   # 상태 3종 나란히 보는 시안 렌더
node scripts/to-figma.mjs <50_screens 경로>         # Figma 플러그인용 문서
node scripts/trace.mjs <프로젝트 경로>              # 결정·개정 타임라인
node scripts/harness.mjs [.prosona 경로]            # 모델·정지·비용 감사
node --test scripts/lib/*.test.js                   # 테스트 107개, 의존성 0
```

## 요구 사항

Node 20+. Mobbin MCP는 선택 — 없으면 레퍼런스 페이즈가 `근거 없음 — 신규 설계`로 기록하고
계속 진행한다. 하드 실패하지 않는다.

## 계보

세 곳에서 이식했고 근거를 함께 옮겼다. 인터뷰 프레임워크와 발행→측정→되먹임 루프는
[Polysona](https://github.com/LilMGenius/polysona), 사다리와 부채 마커 패턴은
[Ponytail](https://github.com/DietrichGebert/ponytail), 하드 게이트·파일 핸드오프·스킬 TDD는
Superpowers와 ECC에서 왔다.

## 라이선스

MIT
