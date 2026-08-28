'use strict';
// The loop auditing its own execution.
//
// Prosona's metric is runway, and runway is only honest if the run that produced
// it is inspectable: which model each phase actually used, where it stopped and
// why, what it cost, and whether the loop ever closed. Those facts live in
// state.json already; nothing read them back.
//
// Every finding carries a fix. A finding without one is a complaint, and a
// complaint cannot be acted on by the next run - which is the whole point of
// keeping the stop taxonomy in the first place.

const { PHASES } = require('./state');

// The single declaration of who runs what. The loop skill's dispatch table and
// this constant must agree; the test asserts it covers every phase.
//
// opus where the work is judgement (framing a service, playing a persona
// adversarially), sonnet where the work is disciplined writing against inputs
// that are already fixed. Measured: an all-opus inline run cost 220k tokens for
// four screens; the same phase dispatched to sonnet cost 94k.
const PHASE_MODELS = {
  '10_frame': 'opus',
  '20_policy': 'opus',
  '30_journey': 'sonnet',
  '40_reference': 'sonnet',
  '50_screens': 'sonnet',
  '60_review': 'opus',
  '90_handoff': 'sonnet',
  '95_operate': 'sonnet',
};

const RANK = { haiku: 1, sonnet: 2, opus: 3 };
const COST_OUTLIER_FACTOR = 3;

function auditRun(state) {
  const phases = (state && state.phases) || {};
  const findings = [];

  const ran = PHASES.filter((p) => (phases[p] || {}).status === 'approved');
  const withModel = ran.filter((p) => phases[p].model);

  if (ran.length && withModel.length < ran.length) {
    findings.push({
      code: 'UNMEASURED',
      detail: `${ran.length - withModel.length}개 페이즈가 실행 모델을 기록하지 않았다 (${ran
        .filter((p) => !phases[p].model)
        .join(', ')})`,
      fix: 'dispatch할 때 advancePhase에 model과 tokens를 함께 넘긴다. 기록하지 않은 실행은 감사할 수 없다.',
    });
  }

  for (const p of withModel) {
    const used = phases[p].model;
    const assigned = PHASE_MODELS[p];
    // Cheaper than assigned is a deliberate choice worth keeping; costlier is
    // the leak, and it is silent because the output still looks fine.
    if (RANK[used] > RANK[assigned]) {
      findings.push({
        code: 'MODEL_DRIFT',
        detail: `${p}이(가) ${assigned} 배정인데 ${used}로 실행됐다`,
        fix: `dispatch에 model=${assigned}을 명시한다. 생략하면 세션 모델을 상속한다.`,
      });
    }
  }

  for (const stop of state.stops || []) {
    if (!stop.code.startsWith('BLOCK_')) continue;
    findings.push({
      code: 'UNPLANNED_STOP',
      detail: `${stop.phase} ${stop.code} — ${stop.detail}`,
      fix: '이 detail이 가리키는 결핍을 브리프 제약 표나 정책 파일에 넣으면 다음 실행에서 이 정지가 사라진다.',
    });
  }

  if ((phases['90_handoff'] || {}).status === 'approved'
      && (phases['95_operate'] || {}).status !== 'approved') {
    findings.push({
      code: 'LOOP_NOT_CLOSED',
      detail: '90_handoff는 승인됐는데 95_operate가 없다 — 성공 지표가 목표로만 남고 실측과 대조되지 않았다',
      fix: '실측이 나오면 /prosona-operate로 지표를 대조하고, 어긋난 결정은 supersedes로 갱신한다.',
    });
  }

  const costs = ran.map((p) => phases[p].tokens).filter((n) => typeof n === 'number');
  const totalTokens = costs.reduce((a, b) => a + b, 0);
  if (costs.length > 2) {
    for (const p of ran) {
      const n = phases[p].tokens;
      if (typeof n !== 'number') continue;
      const others = costs.filter((c) => c !== n);
      const avgOthers = others.reduce((a, b) => a + b, 0) / (others.length || 1);
      if (avgOthers > 0 && n > avgOthers * COST_OUTLIER_FACTOR) {
        findings.push({
          code: 'COST_OUTLIER',
          detail: `${p}이(가) 다른 페이즈 평균의 ${(n / avgOthers).toFixed(1)}배를 썼다 (${n.toLocaleString()} 토큰)`,
          fix: '입력을 경로로만 넘겼는지, 이전 페이즈 산출물을 붙여넣지 않았는지 확인한다.',
        });
      }
    }
  }

  return {
    slug: state.slug,
    intensity: state.intensity,
    runway: state.runway || { current: 0, best: 0 },
    totalTokens,
    phases: ran.length,
    findings,
  };
}

function formatAudit(a) {
  const head = `하네스 감사 — ${a.slug || '(이름 없음)'} · ${a.intensity || '?'} · 통과 페이즈 ${a.phases} · runway ${a.runway.current}(최고 ${a.runway.best}) · 토큰 ${a.totalTokens.toLocaleString()}`;
  if (a.findings.length === 0) return `${head}\n\n결함 없음.`;
  const rows = a.findings.map((f) => `- [${f.code}] ${f.detail}\n  고칠 것: ${f.fix}`);
  return `${head}\n\n${rows.join('\n')}\n\n${a.findings.length}건.`;
}

module.exports = { auditRun, formatAudit, PHASE_MODELS };
