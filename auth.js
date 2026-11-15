/* auth.js: tela de entrada e cadastro. Fala com o Apps Script (Code.gs). */
(function () {
  'use strict';

  const CONFIG = {
    API_URL: 'COLE_AQUI_A_URL_DO_APPS_SCRIPT', // termina em /exec
    CHAVE_TOKEN: 'p2p_token',
  };

  const $ = (id) => document.getElementById(id);
  const naoConfigurado = () => CONFIG.API_URL.startsWith('COLE_');

  function msg(texto, erro) {
    $('msg').textContent = texto;
    $('msg').className = 'msg' + (erro ? ' erro' : '');
  }

  async function api(acao, dados) {
    if (naoConfigurado()) throw new Error('API não configurada no auth.js.');
    const r = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(Object.assign({ acao }, dados)),
    });
    const j = await r.json();
    if (j.erro) throw new Error(j.erro);
    return j;
  }

  function mostrarLogado(usuario) {
    $('areaLogin').classList.add('hidden');
    $('areaLogada').classList.remove('hidden');
    $('nomeUsuario').textContent = usuario.nome;
    $('papelUsuario').textContent = usuario.papel === 'admin' ? 'Administrador' : 'Jogador';
  }

  function mostrarLogin() {
    $('areaLogada').classList.add('hidden');
    $('areaLogin').classList.remove('hidden');
  }

  function trocarAba(cadastrar) {
    $('formEntrar').classList.toggle('hidden', cadastrar);
    $('formCadastrar').classList.toggle('hidden', !cadastrar);
    $('tabEntrar').classList.toggle('ativo', !cadastrar);
    $('tabCadastrar').classList.toggle('ativo', cadastrar);
    msg('');
  }

  function salvarSessao(j) {
    localStorage.setItem(CONFIG.CHAVE_TOKEN, j.token);
    mostrarLogado(j.usuario);
  }

  $('tabEntrar').addEventListener('click', () => trocarAba(false));
  $('tabCadastrar').addEventListener('click', () => trocarAba(true));

  $('formEntrar').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    msg('Entrando...');
    try {
      const j = await api('entrar', { email: $('lEmail').value, senha: $('lSenha').value });
      salvarSessao(j);
    } catch (e) { msg(e.message, true); }
  });

  $('formCadastrar').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const dados = { nome: $('cNome').value, email: $('cEmail').value, senha: $('cSenha').value };
    const erros = AuthRules.validarCadastro(dados);
    if (erros.length) return msg(erros[0], true);
    msg('Criando conta...');
    try {
      const j = await api('cadastrar', dados);
      salvarSessao(j);
    } catch (e) { msg(e.message, true); }
  });

  $('btnSair').addEventListener('click', async () => {
    const token = localStorage.getItem(CONFIG.CHAVE_TOKEN);
    try { if (token) await api('sair', { token }); } catch (e) { /* sessão já inválida */ }
    localStorage.removeItem(CONFIG.CHAVE_TOKEN);
    mostrarLogin();
    msg('Você saiu.');
  });

  async function verificarSessao() {
    const token = localStorage.getItem(CONFIG.CHAVE_TOKEN);
    if (!token || naoConfigurado()) return;
    try {
      const j = await api('eu', { token });
      mostrarLogado(j.usuario);
    } catch (e) {
      localStorage.removeItem(CONFIG.CHAVE_TOKEN);
    }
  }

  verificarSessao();
})();
