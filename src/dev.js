/* Explosive Peter — modo desenvolvedor.
 *
 * Liga com `?dev=1` na URL e vale SÓ para a sessão corrente: não grava flag
 * nenhum, não abre uma segunda chave de localStorage (`state/progress.js`
 * continua sendo o único módulo que conhece storage) e recarregar sem o
 * parâmetro desliga tudo.
 *
 * Ao contrário da bancada de verbos do `main.js`, isto NÃO está atrás de
 * `import.meta.env.DEV`: existe também no build publicado, de propósito, para
 * a apresentação do trabalho — um link com `?dev=1` já abre podendo escolher
 * qual final rodar. Nasce desligado, então o jogador que chega pelo link
 * normal continua vendo o sorteio de sempre e o X/N continua valendo.
 *
 * O que o modo faz é UMA coisa só: destrava o clique nas células da coleção
 * dentro do card de final. Não escolhe cena (o final já arrasta a cena dele
 * junto), não acelera o relógio, não mexe no save.
 *
 * Este módulo não importa nada — só lê a URL.
 */

/** `?dev`, `?dev=1`, `?dev=sim` ligam; `?dev=0` e `?dev=false` não. */
export const devMode = (() => {
  const valor = new URLSearchParams(window.location.search).get('dev');
  return valor !== null && valor !== '0' && valor !== 'false';
})();
