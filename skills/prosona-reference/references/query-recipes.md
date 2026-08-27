# Mobbin query recipes

Mobbin exposes three tools — `search_screens(query, platform)`, `search_flows(query,
platform)`, `search_sections(query)` — and no domain or category filter. Everything
below exists to put the domain back into the query.

> **Tool names differ per install.** They may carry a server instance id, e.g.
> `mcp__463aaef4-…__search_screens`. List the available MCP tools (or check
> `ListMcpResources`) and match on the suffix rather than hardcoding a uuid.

## Building a query

1. Fix the app list first. Three to five competing or adjacent apps from the brief's
   domain, written down before any search. No list, no search.
2. One journey step (`J-NNN`) → one or two queries.
3. Shape: `"<app name> <UI elements and their relationship>"`.
4. `platform` is the brief's target platform (`ios` | `web`), not a guess.
5. `limit` 5 or lower and `mode: "standard"`. The responses carry screen images, and
   `deep` with the default limit of 20 costs more context than the phase that reads it.
   Budget 8 queries for the whole phase; a measured run needed 6 for 12 journey steps.

## Forbidden

| Kind | Example | Why |
|---|---|---|
| Compound | "온보딩과 결제 화면" | returns neither well |
| Negation | "광고 없는 화면" | the model matches "광고" |
| Style adjective | "모던한", "깔끔한" | matches everything, ranks nothing |
| Keyword list | "로그인 인증 보안 화면" | no relationship to match on |

## Example

```
J-003 본인확인 / 도메인=금융 / 앱=Toss, 카카오뱅크, Revolut / platform=ios
→ "Toss identity verification screen with document camera and step progress"
→ "Revolut selfie verification screen with retry state"
```

## Which tool

- `search_screens` — a single screen. The default.
- `search_flows` — a multi-step sequence, when the question is about order rather than
  layout (signup, checkout, verification).
- `search_sections` — a component within a screen (empty state, filter sheet, tab bar),
  when the screen itself is settled.

## Reading results

Adopt or reject each one against a persona exit condition or a brief constraint, and
name which. "좋아 보인다" is not adoption; "P-A의 이탈 조건(4단계 초과)을 3단계로 만족한다"
is. A step whose entries are all adoptions was not compared — go back and record what
lost.
