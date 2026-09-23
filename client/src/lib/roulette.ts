/**
 * Geometrie de la roulette d'ouverture.
 *
 * La roue est decoupee en secteurs egaux, le premier partant du haut (midi) et
 * tournant dans le sens des aiguilles d'une montre — exactement la convention
 * de `conic-gradient` en CSS. L'aiguille, elle, est fixe a midi (0 degre).
 *
 * Aucune de ces fonctions ne decide du vainqueur : le serveur a deja tire le
 * joueur qui commence, on calcule seulement la rotation qui l'amene sous
 * l'aiguille.
 */

/** Taille d'un secteur, en degres. */
export function sectorSize(count: number): number {
  if (count < 1) {
    throw new RangeError('sectorSize: il faut au moins un secteur');
  }
  return 360 / count;
}

/** Angle du centre du secteur `index`, en degres. */
export function sectorCenter(index: number, count: number): number {
  return index * sectorSize(count) + sectorSize(count) / 2;
}

/**
 * Rotation finale (en degres, toujours positive) amenant le secteur `index`
 * sous l'aiguille.
 *
 * @param turns  nombre de tours complets avant de s'arreter (>= 1).
 * @param offset decalage dans le secteur, de -1 (bord gauche) a 1 (bord
 *               droit) : la roue ne s'arrete pas toujours pile au centre.
 */
export function spinAngle(index: number, count: number, turns: number, offset = 0): number {
  if (turns < 1) {
    throw new RangeError('spinAngle: il faut au moins un tour complet');
  }
  const clamped = Math.max(-1, Math.min(1, offset));
  // 0.4 : on reste franchement a l'interieur du secteur, jamais sur un bord.
  const target = sectorCenter(index, count) + clamped * sectorSize(count) * 0.4;
  return turns * 360 - target;
}

/** Secteur se trouvant sous l'aiguille apres une rotation donnee. */
export function sectorAtPointer(rotation: number, count: number): number {
  const size = sectorSize(count);
  // La roue a tourne de `rotation` : le point de la roue sous l'aiguille est
  // celui qui se trouvait a l'angle `-rotation`.
  const angle = (((-rotation % 360) + 360) % 360) % 360;
  return Math.min(count - 1, Math.floor(angle / size));
}
