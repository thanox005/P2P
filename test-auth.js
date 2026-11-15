// Testes das regras de cadastro. Rodar: node test-auth.js
const assert = require('assert');
const { normEmail, validarCadastro } = require('./auth-rules.js');

let ok = 0;
function t(nome, fn) { fn(); ok++; console.log('ok -', nome); }

t('normaliza e-mail', () => {
  assert.strictEqual(normEmail('  Ana@Exemplo.COM '), 'ana@exemplo.com');
});
t('aceita cadastro válido', () => {
  assert.deepStrictEqual(validarCadastro({ nome: 'Ana', email: 'ana@x.com', senha: 'abc12345' }), []);
});
t('rejeita nome curto', () => {
  assert.ok(validarCadastro({ nome: 'A', email: 'a@x.com', senha: 'abc12345' }).length === 1);
});
t('rejeita e-mail inválido', () => {
  assert.ok(validarCadastro({ nome: 'Ana', email: 'ana.x.com', senha: 'abc12345' }).some(e => e.includes('E-mail')));
});
t('rejeita senha curta', () => {
  assert.ok(validarCadastro({ nome: 'Ana', email: 'a@x.com', senha: 'abc1' }).some(e => e.includes('8')));
});
t('rejeita senha sem número', () => {
  assert.ok(validarCadastro({ nome: 'Ana', email: 'a@x.com', senha: 'abcdefgh' }).some(e => e.includes('números')));
});
console.log(`\n${ok} testes passaram.`);
