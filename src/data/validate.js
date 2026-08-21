/* Explosive Peter — o validador do conteúdo.
 *
 * Roda no boot, só em dev (ARCHITECTURE.md §9). Não corrige nada: reclama no
 * console e o jogo segue (P5).
 *
 * O principal é o ORÇAMENTO DE RODADA — hoje `MAX_ROUND_MS_DESIGN`, 20s (era
 * 15s, o número original do GDD; `config.js` explica a troca). O GDD chama
 * esse número de "o que precisa ser defendido em todo o desenvolvimento";
 * defender à mão significaria cronometrar 16 combinações a olho. São algumas
 * linhas para o computador vigiar desde o primeiro final escrito, e o momento
 * certo de descobrir que a cena ficou longa é enquanto ela está sendo escrita.
 *
 * Não importa `engine/`: os nomes de verbo e as constantes chegam por
 * parâmetro, senão `data/` deixaria de ser inerte.
 */

const AT_KEYS = ['x', 'y'];

/** Pictográficos em geral. Não pega tudo, mas pega o que um humano digita. */
const EMOJI = /\p{Extended_Pictographic}/u;

/** As células da grade do ending card (base.css). `at` fora desta lista cai
 *  na direita sem avisar ninguém — e o final ficaria com o personagem no
 *  lugar errado sem nenhum erro na tela. */
const CAST_AT = [
  'left', 'right', 'top', 'top-left', 'top-right', 'bottom-left', 'bottom-right',
];

export function validate(scenes, {
  verbs = [],
  themes = [],
  sfx = [],
  characters = [],
  emojiNaFala = [],
  maxRoundMs = 15000,
  dramaticPauseMs = 600,
  joinGap = 400,
  designW = 1000,
  designH = 600,
} = {}) {
  const problems = [];
  const known = new Set(verbs);
  const knownThemes = new Set(themes);
  const knownSfx = new Set(sfx);
  const knownChars = new Set(characters);
  // Quem pode usar emoji na fala. Chega por parâmetro, como todo o resto: o
  // validador não pode conhecer personagem pelo nome.
  const bocaComEmoji = new Set(emojiNaFala);
  const seenEndingIds = new Map();

  for (const scene of scenes) {
    const invadeAt = scene.invadeAt ?? 0;
    const sceneBeats = scene.timeline ?? [];
    const lastSceneAt = sceneBeats.reduce((max, b) => Math.max(max, invadeAt + b.at), invadeAt);
    const climaxAt = scene.climaxAt ?? lastSceneAt + joinGap;

    if (scene.climaxAt !== undefined && scene.climaxAt < lastSceneAt) {
      problems.push(
        `${scene.id}: climaxAt ${scene.climaxAt}ms vem ANTES do último beat da cena (${lastSceneAt}ms)`,
      );
    }

    checkBeats(scene.id, sceneBeats, invadeAt);
    for (const beat of sceneBeats) checkFala(scene.id, beat);

    if (!scene.endings?.length) {
      problems.push(`${scene.id}: cena sem nenhum final`);
      continue;
    }

    for (const ending of scene.endings) {
      const label = `${scene.id} + ${ending.id}`;

      if (seenEndingIds.has(ending.id)) {
        problems.push(`${ending.id}: id de final repetido (já usado em ${seenEndingIds.get(ending.id)})`);
      }
      seenEndingIds.set(ending.id, scene.id);

      if (typeof ending.weight !== 'number') problems.push(`${label}: falta weight`);
      if (!('survives' in ending)) problems.push(`${label}: falta survives (true | false | null)`);
      if (!ending.title) problems.push(`${label}: falta title`);

      // Tema escrito errado degradaria em silêncio para a paleta padrão —
      // o final ficaria sem tema e ninguém notaria até o playtest.
      if (knownThemes.size && ending.theme && !knownThemes.has(ending.theme)) {
        problems.push(`${label}: tema "${ending.theme}" não existe em base.css`);
      }
      checkSfx(label, ending.sfx);

      // O card do D11 é uma pessoa falando: sem `cast.who` não há quem fale,
      // e sem `line` o personagem aparece mudo. Nenhum dos dois quebra o jogo
      // (P5), mas os dois estragam a tela — e o momento de descobrir isso é
      // enquanto o final está sendo escrito.
      const quem = ending.cast?.who;
      if (!quem) problems.push(`${label}: falta cast.who (quem posa e fala no card)`);
      else if (knownChars.size && !knownChars.has(quem)) {
        problems.push(`${label}: cast.who "${quem}" não existe em characters.js`);
      }

      const onde = ending.cast?.at;
      if (onde && !CAST_AT.includes(onde)) {
        problems.push(`${label}: cast.at "${onde}" não existe (${CAST_AT.join(' | ')})`);
      }

      if (!ending.line) problems.push(`${label}: falta line (a fala do card)`);
      else if (EMOJI.test(ending.line) && !bocaComEmoji.has(quem)) {
        problems.push(`${label}: line com emoji ("${ending.line}") — line é fala, não interface`);
      }

      // Emoji em fala de personagem é proibido (regra de tom do projeto).
      for (const beat of ending.timeline ?? []) checkFala(label, beat);

      checkBeats(label, ending.timeline ?? [], climaxAt);

      const endsAt = (ending.timeline ?? []).reduce((max, b) => Math.max(max, climaxAt + b.at), climaxAt);
      const total = endsAt + dramaticPauseMs;
      if (total > maxRoundMs) {
        problems.push(`${label}: ${(total / 1000).toFixed(1)}s (teto ${maxRoundMs / 1000}s)`);
      }
    }
  }

  /** Emoji pode em interface, nunca em fala — nem em `say`, nem em `line`.
   *  A exceção é quem declara `emojiNaFala` em characters.js (hoje só o
   *  Vinicius, que fecha frase de efeito com um). */
  function checkFala(label, beat) {
    if (beat.do !== 'say' || !beat.text) return;
    if (EMOJI.test(beat.text) && !bocaComEmoji.has(beat.who)) {
      problems.push(`${label}: fala com emoji ("${beat.text}") — proibido em say`);
    }
  }

  /** Som escrito errado sairia mudo em silêncio — ninguém notaria. */
  function checkSfx(label, name) {
    if (!knownSfx.size || name === undefined || name === null) return;
    if (!knownSfx.has(name)) problems.push(`${label}: som "${name}" não existe em audio.js`);
  }

  function checkBeats(label, beats, anchor) {
    for (const beat of beats) {
      checkSfx(label, beat.sfx);
      if (beat.do === 'sfx') checkSfx(label, beat.name);
      if (typeof beat.at !== 'number') problems.push(`${label}: beat sem \`at\` numérico (${beat.do})`);
      if (!known.has(beat.do)) problems.push(`${label}: verbo inexistente "${beat.do}"`);
      if (anchor + (beat.at ?? 0) < 0) problems.push(`${label}: beat "${beat.do}" cai em tempo negativo`);

      for (const key of AT_KEYS) {
        const v = beat[key];
        if (v === undefined) continue;
        const limit = key === 'x' ? designW : designH;
        if (v < 0 || v > limit) {
          problems.push(`${label}: beat "${beat.do}" com ${key}=${v} fora do espaço de design (0..${limit})`);
        }
      }
    }
  }

  if (problems.length) {
    console.group(`[validate] ${problems.length} problema(s) no conteúdo`);
    problems.forEach((p) => console.warn('✗', p));
    console.groupEnd();
  } else {
    const n = scenes.reduce((sum, s) => sum + (s.endings?.length ?? 0), 0);
    console.info(`[validate] ok — ${scenes.length} cena(s), ${n} final(is), tudo dentro de ${maxRoundMs / 1000}s`);
  }

  return problems;
}
