/* engine.js: regras puras do campeonato P2P.
   Sem DOM. Roda no navegador, no Node (testes) e serve de referência para o Apps Script. */
(function (global) {
  'use strict';

  const CFG = { WIN: 3, DRAW: 1, LOSS: 0, TITULAR: 2, ZEBRA: 1.5, TOP_N: 10 };

  // Resultado de um clube em um jogo: 'V', 'E' ou 'D'
  function resultFor(g, club) {
    const home = g.home === club;
    const gf = home ? g.hg : g.ag;
    const ga = home ? g.ag : g.hg;
    return gf > ga ? 'V' : gf === ga ? 'E' : 'D';
  }

  // Classificação. Critérios: pontos, saldo, gols marcados, nome (ordem final fixa).
  function standings(games) {
    const t = {};
    const get = (c) => (t[c] = t[c] || { club: c, pts: 0, gp: 0, gc: 0, j: 0 });
    games.forEach((g) => {
      const h = get(g.home);
      const a = get(g.away);
      h.j++; a.j++;
      h.gp += g.hg; h.gc += g.ag;
      a.gp += g.ag; a.gc += g.hg;
      const r = resultFor(g, g.home);
      if (r === 'V') h.pts += CFG.WIN;
      else if (r === 'E') { h.pts += CFG.DRAW; a.pts += CFG.DRAW; }
      else a.pts += CFG.WIN;
    });
    return Object.values(t)
      .map((x) => Object.assign({}, x, { sg: x.gp - x.gc }))
      .sort((x, y) => y.pts - x.pts || y.sg - x.sg || y.gp - x.gp || x.club.localeCompare(y.club, 'pt'));
  }

  // Top 10 da tabela. Sem jogos anteriores, não há top 10 (sem zebra).
  function top10(games) {
    if (!games.length) return [];
    return standings(games).slice(0, CFG.TOP_N).map((x) => x.club);
  }

  function gamesBefore(results, round) {
    return Object.keys(results)
      .map(Number)
      .filter((r) => r < round)
      .sort((a, b) => a - b)
      .reduce((acc, r) => acc.concat(results[r] || []), []);
  }

  // Pontos de um clube em um jogo, com titular (2x) e zebra (1,5x). Multiplicadores se multiplicam.
  function clubPoints(g, club, titular, top) {
    const r = resultFor(g, club);
    let p = r === 'V' ? CFG.WIN : r === 'E' ? CFG.DRAW : CFG.LOSS;
    if (club === titular) p *= CFG.TITULAR;
    const opp = g.home === club ? g.away : g.home;
    if (r === 'V' && !top.includes(club) && top.includes(opp)) p *= CFG.ZEBRA;
    return p;
  }

  // Soma da rodada do jogador. Cada clube escalado pontua separadamente.
  function roundScore(player, games, top) {
    let total = 0;
    games.forEach((g) => {
      player.clubs.forEach((c) => {
        if (g.home === c || g.away === c) total += clubPoints(g, c, player.titular, top);
      });
    });
    return total;
  }

  // Desempates: só entram jogos do escopo do jogador (cada jogo uma vez).
  // Jogo sem palpite fica de fora e é contado em "missing".
  function tiebreak(player, games, picks) {
    let pred = 0, real = 0, teams = 0, exact = 0, missing = 0;
    games.forEach((g) => {
      const inScope = player.clubs.includes(g.home) || player.clubs.includes(g.away);
      if (!inScope) return;
      const p = (picks || []).find((x) => x.home === g.home && x.away === g.away);
      if (!p) { missing++; return; }
      pred += p.ph + p.pa;
      real += g.hg + g.ag;
      if (p.ph === g.hg && p.pa === g.ag) exact++;
      if (player.clubs.includes(g.home) && p.ph >= 1 && g.hg >= 1) teams++;
      if (player.clubs.includes(g.away) && p.pa >= 1 && g.ag >= 1) teams++;
    });
    return { diff: Math.abs(pred - real), teams, exact, missing };
  }

  function computeScores(data, round) {
    const games = data.results[round] || [];
    const top = top10(gamesBefore(data.results, round));
    const picksRound = (data.picks && data.picks[round]) || {};
    const scores = {};
    data.players.forEach((p) => {
      scores[p.id] = {
        points: roundScore(p, games, top),
        tb: tiebreak(p, games, picksRound[p.id]),
      };
    });
    return { top, scores };
  }

  // Ordem dos critérios do regulamento. Retorna 'a', 'b' ou null (empate total).
  function decide(A, B) {
    if (A.points !== B.points) return A.points > B.points ? 'a' : 'b';
    if (A.tb.diff !== B.tb.diff) return A.tb.diff < B.tb.diff ? 'a' : 'b';
    if (A.tb.teams !== B.tb.teams) return A.tb.teams > B.tb.teams ? 'a' : 'b';
    if (A.tb.exact !== B.tb.exact) return A.tb.exact > B.tb.exact ? 'a' : 'b';
    return null;
  }

  function initState(players) {
    const losses = {}, status = {};
    players.forEach((p) => { losses[p.id] = 0; status[p.id] = 'ativo'; });
    return { players, losses, status, champion: null, finalExtra: false };
  }

  // Duelos da próxima rodada.
  // - Chave principal (0 derrotas) joga entre si; repescagem (1 derrota) joga entre si.
  // - Quando sobra 1 na principal e 1 na repescagem: grande final.
  // - Final extra: só entre os dois que chegaram à grande final com 1 derrota cada.
  function nextDuels(state) {
    const alive = state.players.map((p) => p.id).filter((id) => state.status[id] !== 'eliminado');
    if (state.champion) return [];
    if (state.finalExtra) return [{ a: alive[0], b: alive[1], final: false, extra: true }];
    const main = alive.filter((id) => state.losses[id] === 0);
    const rep = alive.filter((id) => state.losses[id] === 1);
    if (main.length === 1 && rep.length === 1) return [{ a: main[0], b: rep[0], final: true }];
    const duels = [];
    for (let i = 0; i + 1 < main.length; i += 2) duels.push({ a: main[i], b: main[i + 1], final: false });
    for (let i = 0; i + 1 < rep.length; i += 2) duels.push({ a: rep[i], b: rep[i + 1], final: false });
    return duels;
  }

  function applyDuel(state, duel, winner) {
    const loser = winner === duel.a ? duel.b : duel.a;
    const winnerLossesBefore = state.losses[winner];
    state.losses[loser]++;
    if (state.losses[loser] >= 2) state.status[loser] = 'eliminado';
    if (duel.extra) {
      state.champion = winner;
      state.finalExtra = false;
    } else if (duel.final) {
      if (winnerLossesBefore === 0) state.champion = winner;   // invicto venceu
      else state.finalExtra = true;                             // repescagem venceu: ambos com 1 derrota
    }
    return state;
  }

  // Simula todas as rodadas com resultados informados, em ordem.
  function runSeason(data) {
    const state = initState(data.players);
    const log = [];
    const rounds = Object.keys(data.results).map(Number).sort((a, b) => a - b);
    for (const r of rounds) {
      if (state.champion) break;
      const { top, scores } = computeScores(data, r);
      const duels = nextDuels(state);
      const entry = { round: r, top10: top, duels: [], pending: false };
      const involved = new Set();
      duels.forEach((d) => { involved.add(d.a); involved.add(d.b); });
      entry.bye = state.players.map((p) => p.id).filter((id) => state.status[id] !== 'eliminado' && !involved.has(id));
      for (const d of duels) {
        const w = decide(scores[d.a], scores[d.b]);
        if (!w) { entry.duels.push(Object.assign({}, d, { pending: true })); entry.pending = true; continue; }
        const winner = w === 'a' ? d.a : d.b;
        entry.duels.push(Object.assign({}, d, {
          winner,
          pointsA: scores[d.a].points, pointsB: scores[d.b].points,
          missingA: scores[d.a].tb.missing, missingB: scores[d.b].tb.missing,
        }));
        applyDuel(state, d, winner);
      }
      entry.scores = scores;
      entry.snapshot = { losses: Object.assign({}, state.losses), status: Object.assign({}, state.status), champion: state.champion };
      log.push(entry);
      if (entry.pending) break;
    }
    return { log, state };
  }

  const api = { CFG, resultFor, standings, top10, computeScores, decide, initState, nextDuels, applyDuel, runSeason, clubPoints, roundScore, tiebreak };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.P2P = api;
})(typeof window !== 'undefined' ? window : globalThis);
