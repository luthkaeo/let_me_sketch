# S-01 <화면 이름>   (여정: J-001)

> 화면은 **쌍**으로 낸다 — 사람이 읽는 이 `.md`와 기계가 검사하는 같은 이름의 `.json`.
> 파일명: `50_screens/01-<slug>.md` / `50_screens/01-<slug>.json`

## 목적

<이 화면이 사용자 목표에서 담당하는 **한 가지**. 두 가지면 화면이 두 개여야 하는지 먼저 따진다>

## 근거

- 채택 [<앱> <화면>](<mobbin_url>) — <왜>
- 기각 [<앱> <화면>](<mobbin_url>) — <왜>
- (또는) 근거 없음 — 신규 설계: <이유>
- **사다리**: <어느 단에서 멈췄는가 — 재사용 / 플랫폼 관례 / 레퍼런스 차용 / 최소 신규>

## 구조

| 영역 | 내용 | 우선순위 |
|---|---|---|
| | | 1 |

## 상태   ← 3종 필수

- 기본: <무엇이 보이는가>
- 빈 상태: <데이터가 0일 때. 첫 사용자가 보는 화면이다>
- 에러: <무엇이 실패했고, 사용자가 다음에 무엇을 할 수 있는가>

## 되돌리기

<이 화면에서 빠져나가거나 방금 한 일을 취소하는 경로>

## 접근성

- 터치 타깃 <44px 이상> / 대비 <비율> / 스크린리더 레이블 <읽히는 문장>

## 내가 결정한 것

1. <결정> — 근거: `C-NNN` 또는 `P-X` 또는 채택한 레퍼런스

## 미해결

- <가정하고 넘어간 것. 없으면 `- 없음`>

---

## 짝이 되는 JSON

```jsonc
{
  "id": "S-01",
  "name": "<화면 이름>",
  "journey": "J-001",
  "states": {
    "default": { "tree": [
      { "type": "stack", "direction": "vertical", "spacing": 16, "children": [
        { "type": "text", "role": "title", "content": "<실제 카피>" }
      ]}
    ]},
    "empty":   { "tree": [ { "type": "text", "content": "<빈 상태에 실제로 보일 문장>" } ] },
    "error":   { "tree": [ { "type": "text", "content": "<에러 문구와 다음 행동>" } ] }
  }
}
```

노드: `stack{direction,spacing,padding,children}` · `grid{columns,children}` · `text` `image`
`button` `input` `divider`. Figma Auto Layout에 무손실 대응하도록 고른 형태다.

**선택 속성** (없으면 기본값으로 그린다. 넣으면 값이 검사된다)

| 속성 | 값 | 쓰는 이유 |
|---|---|---|
| `text.role` | `title` `body` `caption` `label` | 위계. 렌더와 Figma가 크기·굵기를 여기서 읽는다 |
| `button.variant` | `primary` `secondary` `ghost` | 주 동작이 하나임을 명세에 남긴다 |
| `image.aspect` | `16:9` 형식 | 비율이 레이아웃을 바꾸는 경우에만 |
| `stack.padding` | 픽셀 수 | 여백이 의미를 갖는 경우에만 |

색·폰트·일러스트는 명세에 넣지 않는다. 렌더는 명세의 함수이며, 렌더러가 없는 것을 예쁘게 채우면
**명세는 비었는데 화면은 통과하는** 상태가 만들어진다.

`content`가 빈 `text`/`button`/`input`은 스키마가 거부한다 — 말이 없는 노드는 플레이스홀더다.
검증: `node scripts/check-screens.mjs <50_screens 경로>`
시안: `node scripts/render-screens.mjs <50_screens 경로>` → `preview.html` (상태 3종 나란히)
Figma: `node scripts/to-figma.mjs <50_screens 경로>` → `figma/*.figma.json`
