// Testes com os dados reais das 3 primeiras rodadas. Rodar: node test.js
const assert = require('assert');
const P2P = require('./engine.js');

const players = [
  { id: 'A', name: 'A', clubs: ['Flamengo', 'Vitória', 'Santos'], titular: 'Flamengo' },
  { id: 'B', name: 'B', clubs: ['Palmeiras', 'Botafogo', 'Vitória'], titular: 'Palmeiras' },
  { id: 'C', name: 'C', clubs: ['Flamengo', 'Vitória', 'Santos'], titular: 'Santos' },
  { id: 'D', name: 'D', clubs: ['Vasco', 'Bahia', 'Remo'], titular: 'Remo' },
];

const results = {
  1: [
    { home: 'Atlético-MG', away: 'Palmeiras', hg: 2, ag: 2 },
    { home: 'Internacional', away: 'Athletico-PR', hg: 0, ag: 1 },
    { home: 'Coritiba', away: 'Bragantino', hg: 0, ag: 1 },
    { home: 'Vitória', away: 'Remo', hg: 2, ag: 0 },
    { home: 'Fluminense', away: 'Grêmio', hg: 2, ag: 1 },
    { home: 'Corinthians', away: 'Bahia', hg: 1, ag: 2 },
    { home: 'Chapecoense', away: 'Santos', hg: 4, ag: 2 },
    { home: 'São Paulo', away: 'Flamengo', hg: 2, ag: 1 },
    { home: 'Mirassol', away: 'Vasco', hg: 2, ag: 1 },
    { home: 'Botafogo', away: 'Cruzeiro', hg: 4, ag: 0 },
  ],
  2: [
    { home: 'Flamengo', away: 'Internacional', hg: 1, ag: 1 },
    { home: 'Bragantino', away: 'Atlético-MG', hg: 1, ag: 0 },
    { home: 'Santos', away: 'São Paulo', hg: 1, ag: 1 },
    { home: 'Remo', away: 'Mirassol', hg: 2, ag: 2 },
    { home: 'Palmeiras', away: 'Vitória', hg: 5, ag: 1 },
    { home: 'Grêmio', away: 'Botafogo', hg: 5, ag: 3 },
    { home: 'Bahia', away: 'Fluminense', hg: 1, ag: 1 },
    { home: 'Vasco', away: 'Chapecoense', hg: 1, ag: 1 },
    { home: 'Cruzeiro', away: 'Coritiba', hg: 1, ag: 2 },
    { home: 'Athletico-PR', away: 'Corinthians', hg: 0, ag: 1 },
  ],
  3: [
    { home: 'Vitória', away: 'Flamengo', hg: 1, ag: 2 },
    { home: 'Chapecoense', away: 'Coritiba', hg: 3, ag: 3 },
    { home: 'Mirassol', away: 'Cruzeiro', hg: 2, ag: 2 },
    { home: 'Atlético-MG', away: 'Remo', hg: 3, ag: 3 },
    { home: 'Vasco', away: 'Bahia', hg: 0, ag: 1 },
    { home: 'São Paulo', away: 'Grêmio', hg: 2, ag: 0 },
    { home: 'Athletico-PR', away: 'Santos', hg: 2, ag: 1 },
    { home: 'Fluminense', away: 'Botafogo', hg: 1, ag: 0 },
    { home: 'Corinthians', away: 'Bragantino', hg: 2, ag: 0 },
    { home: 'Internacional', away: 'Palmeiras', hg: 1, ag: 3 },
  ],
};

const picks = {
  1: {
    A: [{ home: 'São Paulo', away: 'Flamengo', ph: 1, pa: 2 }, { home: 'Vitória', away: 'Remo', ph: 2, pa: 1 }, { home: 'Chapecoense', away: 'Santos', ph: 1, pa: 1 }],
    B: [{ home: 'Atlético-MG', away: 'Palmeiras', ph: 1, pa: 2 }, { home: 'Botafogo', away: 'Cruzeiro', ph: 2, pa: 0 }, { home: 'Vitória', away: 'Remo', ph: 1, pa: 0 }],
    C: [{ home: 'São Paulo', away: 'Flamengo', ph: 2, pa: 2 }, { home: 'Vitória', away: 'Remo', ph: 1, pa: 1 }, { home: 'Chapecoense', away: 'Santos', ph: 2, pa: 1 }],
    D: [{ home: 'Mirassol', away: 'Vasco', ph: 1, pa: 2 }, { home: 'Corinthians', away: 'Bahia', ph: 1, pa: 1 }, { home: 'Vitória', away: 'Remo', ph: 2, pa: 1 }],
  },
  2: {
    A: [{ home: 'Flamengo', away: 'Internacional', ph: 2, pa: 0 }, { home: 'Palmeiras', away: 'Vitória', ph: 3, pa: 0 }, { home: 'Santos', away: 'São Paulo', ph: 2, pa: 1 }],
    B: [{ home: 'Palmeiras', away: 'Vitória', ph: 3, pa: 1 }, { home: 'Grêmio', away: 'Botafogo', ph: 2, pa: 2 }],
    C: [{ home: 'Flamengo', away: 'Internacional', ph: 3, pa: 1 }, { home: 'Palmeiras', away: 'Vitória', ph: 2, pa: 0 }, { home: 'Santos', away: 'São Paulo', ph: 1, pa: 0 }],
    D: [{ home: 'Vasco', away: 'Chapecoense', ph: 2, pa: 0 }, { home: 'Bahia', away: 'Fluminense', ph: 2, pa: 1 }, { home: 'Remo', away: 'Mirassol', ph: 1, pa: 1 }],
  },
  3: {
    A: [{ home: 'Vitória', away: 'Flamengo', ph: 1, pa: 3 }, { home: 'Athletico-PR', away: 'Santos', ph: 1, pa: 1 }],
    D: [{ home: 'Vasco', away: 'Bahia', ph: 1, pa: 2 }, { home: 'Atlético-MG', away: 'Remo', ph: 2, pa: 0 }],
  },
};

const { log, state } = P2P.runSeason({ players, results, picks });
const byRound = (r) => log.find((e) => e.round === r);
const sc = (r, id) => byRound(r).scores[id].points;
let ok = 0;
function check(name, fn) { fn(); ok++; console.log('ok -', name); }

check('R1 pontos: A3 B8 C3 D3', () => {
  assert.strictEqual(sc(1, 'A'), 3); assert.strictEqual(sc(1, 'B'), 8);
  assert.strictEqual(sc(1, 'C'), 3); assert.strictEqual(sc(1, 'D'), 3);
});
check('R1 duelos: B vence A, D vence C', () => {
  const d = byRound(1).duels;
  assert.strictEqual(d.find((x) => x.a === 'A' || x.b === 'A').winner, 'B');
  assert.strictEqual(d.find((x) => x.a === 'C' || x.b === 'C').winner, 'D');
});
check('R1 gols: C diff 2, D diff 0', () => {
  assert.strictEqual(byRound(1).scores.C.tb.diff, 2);
  assert.strictEqual(byRound(1).scores.D.tb.diff, 0);
});
check('R2 zebra: Palmeiras (fora do top10) vence Vitória (top10) -> B = 9', () => {
  assert.ok(byRound(2).top10.includes('Vitória'));
  assert.ok(!byRound(2).top10.includes('Palmeiras'));
  assert.strictEqual(sc(2, 'B'), 9);
  assert.strictEqual(sc(2, 'D'), 4);
});
check('R2 duelos: B vence D (chave principal), A vence C (repescagem)', () => {
  const d = byRound(2).duels;
  assert.strictEqual(d.find((x) => [x.a, x.b].includes('B')).winner, 'B');
  assert.strictEqual(d.find((x) => [x.a, x.b].includes('A')).winner, 'A');
});
check('R2 A x C: A diff 2, C diff 3', () => {
  assert.strictEqual(byRound(2).scores.A.tb.diff, 2);
  assert.strictEqual(byRound(2).scores.C.tb.diff, 3);
});
check('R3 A = 6 e D = 5, A vence', () => {
  assert.strictEqual(sc(3, 'A'), 6); assert.strictEqual(sc(3, 'D'), 5);
  const d = byRound(3).duels;
  assert.strictEqual(d[0].winner, 'A');
});
check('estado após R3: A com 1 derrota, B invicto, C e D eliminados, sem campeão', () => {
  assert.strictEqual(state.losses.A, 1); assert.strictEqual(state.losses.B, 0);
  assert.strictEqual(state.status.C, 'eliminado'); assert.strictEqual(state.status.D, 'eliminado');
  assert.strictEqual(state.champion, null);
});
console.log(`\n${ok} testes passaram.`);
