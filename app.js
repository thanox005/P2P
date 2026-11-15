/* app.js: interface. Usa engine.js (P2P) e sincroniza com o Apps Script. */
(function () {
  'use strict';

  const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbyS68O74r3ToL_jcsO2LbigUtYQorKnGn-WSwDSoopagUmGhIY7E1R0SvAu3wSml13JwA/exec',   // URL do Web App (terminada em /exec)
    TOKEN: 'bolao2026x7',                  // mesmo valor de TOKEN no Code.gs
    WHATSAPP_NUMERO: '5577981396292',                         // ex.: 5577999999999 (apenas números)
  };

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const notConfigured = () => CONFIG.API_URL.startsWith('COLE_');

  let data = { players: [], results: {}, picks: {} };

  function status(msg, err) {
    $('status').textContent = msg;
    $('status').style.color = err ? 'var(--red)' : '';
  }

  function parseJSON(txt, label) {
    try { return JSON.parse(txt); }
    catch (e) { throw new Error(label + ': JSON inválido (' + e.message + ')'); }
  }

  function validate() {
    const ids = data.players.map((p) => p.id);
    data.players.forEach((p) => {
      if (p.clubs.length !== 3) throw new Error('Jogador ' + p.id + ' precisa de 3 clubes.');
      if (!p.clubs.includes(p.titular)) throw new Error('Titular de ' + p.id + ' precisa estar entre os 3 clubes.');
    });
    if (new Set(ids).size !== ids.length) throw new Error('Ids de jogadores repetidos.');
  }

  async function load() {
    $('contato').href = CONFIG.WHATSAPP_NUMERO ? 'https://wa.me/' + CONFIG.WHATSAPP_NUMERO : '#';
    if (notConfigured()) { status('API não configurada: dados ficam só nesta página.'); return; }
    try {
      const r = await fetch(CONFIG.API_URL);
      const j = await r.json();
      if (j && j.players) data = j;
      fillInputs();
      status('Dados carregados.');
    } catch (e) { status('Falha ao carregar: ' + e.message, true); }
  }

  function fillInputs() {
    $('inPlayers').value = JSON.stringify(data.players, null, 2);
  }

  async function save() {
    if (notConfigured()) return;
    await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ token: CONFIG.TOKEN, state: data }),
    });
  }

  $('btnSave').addEventListener('click', async () => {
    try {
      data.players = parseJSON($('inPlayers').value, 'Jogadores');
      validate();
      const round = Number($('inRound').value);
      const res = parseJSON($('inResults').value || '[]', 'Resultados');
      const picks = parseJSON($('inPicks').value || '{}', 'Palpites');
      data.results[round] = res;
      data.picks[round] = picks;
      await save();
      status('Rodada ' + round + ' salva. Clique em Simular temporada.');
    } catch (e) { status(e.message, true); }
  });

  $('btnSim').addEventListener('click', () => {
    try {
      data.players = parseJSON($('inPlayers').value, 'Jogadores');
      validate();
      const out = P2P.runSeason(data);
      render(out);
      status(out.state.champion ? 'Campeão: ' + out.state.champion : 'Temporada em andamento.');
    } catch (e) { status(e.message, true); }
  });

  function nameOf(id) {
    const p = data.players.find((x) => x.id === id);
    return p ? p.name : id;
  }

  function duelHTML(d) {
    const a = nameOf(d.a), b = nameOf(d.b);
    const tag = d.final ? '<span class="badge final">grande final</span>'
      : d.extra ? '<span class="badge extra">final extra</span>' : '';
    if (d.pending) {
      return '<div class="duel"><span>' + esc(a) + '</span><span class="vs">x</span><span>' + esc(b) + '</span></div>'
        + '<p class="pending">Empate total: regra final pendente.</p>';
    }
    const wa = d.winner === d.a;
    return '<div class="duel">'
      + '<span class="' + (wa ? 'win' : 'lose') + '">' + esc(a) + ' (' + d.pointsA + ')</span>'
      + '<span class="vs">' + tag + '<br>x</span>'
      + '<span class="' + (!wa ? 'win' : 'lose') + '">' + esc(b) + ' (' + d.pointsB + ')</span>'
      + '</div>';
  }

  function render(out) {
    const { log, state } = out;

    let br = '';
    if (state.champion) {
      br += '<div class="champ">Campeão: ' + esc(nameOf(state.champion)) + '</div>';
    }
    if (!log.length) br += '<p class="hint">Sem rodadas salvas.</p>';
    log.forEach((e) => {
      br += '<div class="round"><h3>Rodada ' + e.round + '</h3>';
      if (!e.duels.length) br += '<p class="hint">Sem duelos.</p>';
      e.duels.forEach((d) => { br += duelHTML(d); });
      if (e.bye && e.bye.length) {
        br += '<p class="hint">Aguardando: ' + e.bye.map((id) => '<span class="badge bye">' + esc(nameOf(id)) + '</span>').join(' ') + '</p>';
      }
      br += '</div>';
    });
    br += '<h3>Situação atual</h3><table><tr><th>Jogador</th><th class="num">Derrotas</th><th>Status</th></tr>';
    data.players.forEach((p) => {
      br += '<tr><td>' + esc(p.name) + '</td><td class="num">' + state.losses[p.id] + '</td><td>' + esc(state.status[p.id]) + '</td></tr>';
    });
    br += '</table>';
    $('bracket').innerHTML = br;

    let tb = '';
    log.forEach((e) => {
      tb += '<h3>Rodada ' + e.round + ' · top 10 antes da rodada</h3>';
      tb += '<p class="hint">' + (e.top10.length ? e.top10.map(esc).join(', ') : 'Sem tabela (1ª rodada, sem zebra)') + '</p>';
      tb += '<table><tr><th>Jogador</th><th class="num">Pontos</th><th class="num">Dif. gols</th><th class="num">Acertos</th><th class="num">Exatos</th><th class="num">Sem palpite</th></tr>';
      data.players.forEach((p) => {
        const s = e.scores[p.id];
        tb += '<tr><td>' + esc(p.name) + '</td><td class="num">' + s.points + '</td><td class="num">' + s.tb.diff
          + '</td><td class="num">' + s.tb.teams + '</td><td class="num">' + s.tb.exact + '</td><td class="num">' + s.tb.missing + '</td></tr>';
      });
      tb += '</table>';
    });
    $('tables').innerHTML = tb || '<p class="hint">Sem rodadas.</p>';
  }

  load();
})();
