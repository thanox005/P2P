/* auth-rules.js: validações de cadastro usadas no navegador e testadas no Node.
   O servidor (Code.gs) repete as mesmas regras, porque não confia no cliente. */
(function (g) {
  'use strict';

  function normEmail(e) {
    return String(e || '').trim().toLowerCase();
  }

  function validarCadastro(dados) {
    const erros = [];
    const nome = String(dados.nome || '').trim();
    const email = normEmail(dados.email);
    const senha = String(dados.senha || '');

    if (nome.length < 2 || nome.length > 40) erros.push('Nome deve ter de 2 a 40 caracteres.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erros.push('E-mail inválido.');
    if (senha.length < 8) erros.push('Senha deve ter pelo menos 8 caracteres.');
    if (!/[A-Za-z]/.test(senha) || !/[0-9]/.test(senha)) erros.push('Senha precisa ter letras e números.');
    return erros;
  }

  const api = { normEmail, validarCadastro };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else g.AuthRules = api;
})(typeof window !== 'undefined' ? window : globalThis);
