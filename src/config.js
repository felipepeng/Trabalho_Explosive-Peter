/* Explosive Peter — constantes de tuning. Um lugar só. */

/** Duração nominal do countdown, em ms. */
export const COUNTDOWN_MS = 10_000;

/** A partir de quantos segundos o timer fica vermelho. */
export const URGENT_AT = 3;

/** Rede de segurança: rodada que passar disso é forçada ao clímax. */
export const MAX_ROUND_MS = 26_000;

/** Teto de design, vigiado pelo validador em dev (ARCHITECTURE.md §9).
 *
 *  Era 15s (GDD, pilar 2) e virou 20s: as falas passavam rápido demais para
 *  serem lidas, e o clímax agora cai DEPOIS do mostrador zerar de propósito —
 *  o timer chegar a zero e a cena continuar é a piada, não um bug. O teto
 *  continua existindo e continua sendo defendido pelo validador; o que mudou
 *  foi o número. */
export const MAX_ROUND_MS_DESIGN = 20_000;

/** Gap entre o último beat da cena e o início do final, quando não há climaxAt. */
export const JOIN_GAP = 400;

/** Freeze-frame do clímax. */
export const FREEZE_MS = 150;

/** Pausa dramática antes do ending card. */
export const DRAMATIC_PAUSE_MS = 600;

/** Cooldown do anti-repetição. Ajustado ao catálogo real em picker.js. */
export const HISTORY_K = 3;

/** Cena forçada na primeira rodada da vida do jogador (GDD §3.2). */
export const FIRST_RUN_SCENE = 'ninguem-veio';

/** Espaço de design (ARCHITECTURE.md §6). */
export const DESIGN_W = 1000;
export const DESIGN_H = 600;

/** Paletas de tela de final declaradas em base.css (`#ending-card[data-theme]`).
 *  Vive aqui porque o validador precisa reprovar um `theme` escrito errado —
 *  senão o final degradaria em silêncio para a paleta padrão. */
export const CARD_THEMES = ['fogo', 'pedra', 'festa', 'mar', 'drop', 'fenda', 'corrompido'];
