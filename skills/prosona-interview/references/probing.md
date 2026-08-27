# Probing

The interview fails in one predictable way: the planner gives a reasonable-sounding
answer, it gets written down, and nothing in the persona file can be executed later.
These are the moves that get past that.

## Shallow answer detection

Treat an answer as shallow when it is any of these, and probe instead of recording:

| Shape | Example | Probe |
|---|---|---|
| Textbook | "사용자 중심으로 생각해요" | "그렇게 해서 실제로 뭘 뺐거나 넣은 적이 있어요?" |
| Universally agreeable | "직관적이어야죠" | "직관적이지 않지만 그대로 둔 화면도 있었을 텐데, 그건 왜 뒀어요?" |
| Restates the question | "좋은 기획은 좋은 문제에서 나오죠" | "가장 최근에 그렇게 판단한 게 언제였어요?" |
| Hedged both ways | "경우에 따라 다르죠" | "그럼 어떤 경우에 어느 쪽으로 기울어요? 한 번만 예를 들어 주세요." |

The rule under all four: **a principle you cannot violate is not a principle.** Keep
asking until the answer implies something they would refuse to ship.

## Laddering

Attribute → consequence → value, one rung per question, always anchored to the thing
they just named.

- attribute: "그 화면의 어떤 점이요?"
- consequence: "그게 사용자한테 뭘 해주죠?"
- value: "그게 왜 중요해요?"

Two failure modes. Climbing too fast lands on a platitude — go back down and ask for
the concrete case. Never climbing at all leaves you with UI preferences, which are
not decision principles.

## 5 Whys

Only on something they have already said twice. Asking why five times about a
throwaway remark manufactures a principle that was never there.

Stop early when the answer becomes a general fact about people rather than about
their judgment. That is the signal you have left the planner and entered the textbook.

## Projective technique

When a direct question keeps returning the socially correct answer, ask about someone
else:

- "같은 팀의 다른 기획자라면 이걸 어떻게 했을 것 같아요? 어디서 갈릴까요?"
- "이 화면을 누가 반려한다면 무슨 이유로 반려할까요?"
- "1년 뒤에 이 결정을 후회한다면 뭐 때문일까요?"

The distance makes the honest answer cheap to say.

## Saturation

Two consecutive answers with no new information ends the framework. New information
means: a new refusal, a new case, or a correction of something already written.
Elaboration of an existing point is not new information.

When a framework saturates early, write the topic under `## 미해결` rather than
padding it. A thin section that says it is thin is more useful than five rows of
invented nuance.

## What not to do

- Do not offer options ("A와 B 중 어느 쪽이세요?"). Options get picked; principles get
  stated. Ask open, then narrow with their own words.
- Do not summarize back at length. A long paraphrase gets agreed with out of
  politeness. One sentence, then the next question.
- Do not fix their wording in `## Raw`. The awkward phrase is often the exact thing
  that makes the principle theirs and not yours.
