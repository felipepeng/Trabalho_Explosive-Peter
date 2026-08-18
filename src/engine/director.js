/* Explosive Peter — o diretor.
 *
 * Recebe uma lista de beats já em tempo absoluto e os agenda no clock.
 * NÃO importa `actions.js`: o mapa de verbos chega por parâmetro
 * (ARCHITECTURE.md §2, "a única inversão que importa"). É isso que mantém o
 * motor sem uma única linha de DOM — e testável sem navegador.
 *
 * P5 escrito como código: verbo inexistente vira warn e é pulado, verbo que
 * lança é logado e a rodada segue. Nenhum beat consegue matar a rodada.
 */

/**
 * Costura cena + final numa única lista de beats em tempo absoluto de rodada.
 *
 *   beats = cena.timeline  deslocados por `invadeAt`
 *        ++ final.timeline deslocados por `climaxAt ?? últimoBeatDaCena + joinGap`
 *
 * Cada timeline tem sua própria âncora (ARCHITECTURE.md §3, regra 2): mexer no
 * `invadeAt` da cena não obriga a recalcular os `at` dos três finais dela.
 *
 * @param {object} scene
 * @param {object} ending
 * @param {{joinGap?: number}} opts  `joinGap` espelha config.JOIN_GAP — o
 *        main.js sempre passa o valor de verdade; o default só existe para
 *        quem chamar isto num teste.
 * @returns {{beats: object[], invadeAt: number, climaxAt: number, endsAt: number}}
 */
export function buildRound(scene, ending, { joinGap = 400 } = {}) {
  const invadeAt = scene.invadeAt ?? 0;

  const sceneBeats = (scene.timeline ?? []).map((b) => ({ ...b, at: b.at + invadeAt }));
  const lastSceneAt = sceneBeats.reduce((max, b) => Math.max(max, b.at), invadeAt);

  const climaxAt = scene.climaxAt ?? lastSceneAt + joinGap;

  const endingBeats = (ending?.timeline ?? []).map((b) => ({ ...b, at: b.at + climaxAt }));
  const endsAt = endingBeats.reduce((max, b) => Math.max(max, b.at), climaxAt);

  const beats = [...sceneBeats, ...endingBeats].sort((a, b) => a.at - b.at);

  return { beats, invadeAt, climaxAt, endsAt };
}

export function createDirector({ clock }) {
  return {
    /**
     * Agenda todos os beats. Devolve um cancelador — mas o normal é a rodada
     * morrer pelo `ctx.signal`, que também barra o beat que já estava na fila
     * do frame corrente.
     */
    run(beats, ctx, verbs) {
      const ordered = [...beats].sort((a, b) => a.at - b.at);

      const cancels = ordered.map((beat) => {
        const verb = verbs[beat.do];

        if (typeof verb !== 'function') {
          console.warn(`[director] verbo inexistente: "${beat.do}"`, beat);
          return () => {};
        }

        return clock.at(beat.at, () => {
          if (ctx.signal?.aborted) return;
          try {
            verb(ctx, beat);
          } catch (err) {
            console.error(`[director] verbo "${beat.do}" falhou:`, err, beat);
          }
        });
      });

      return () => cancels.forEach((cancel) => cancel());
    },
  };
}
