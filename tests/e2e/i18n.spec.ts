import { expect, test, type Browser, type Page } from '@playwright/test';

// Chaque test repart d'un navigateur propre.
test.afterEach(async ({ browser }) => {
  await Promise.all(browser.contexts().map((context) => context.close()));
});

/** Ouvre l'accueil dans une langue de navigateur donnee. */
async function openHome(browser: Browser, locale: string): Promise<Page> {
  const context = await browser.newContext({ locale });
  const page = await context.newPage();
  await page.goto('/');
  return page;
}

/** Textes attendus dans chaque langue, pour les assertions symetriques. */
const TEXT = {
  fr: {
    name: 'Alice',
    yourTurn: 'À TON TOUR',
    turnOf: (name: string) => `Tour de ${name}`,
    step1: 'Étape 1 / 2',
    choosingColor: (name: string) => `${name} choisit une constellation`,
    logTurn1: (name: string) => `Tour 1 : au tour de ${name}`,
    logRevealed: 'a révélé l’étoile',
    logAnswers: 'répond',
    classifyAsk: 'te demande de SITUER l’étoile',
    classifyChoose: 'Choisis une position',
    classifyConfirm: 'Valider',
    compareAsk: 'te demande de JAUGER',
  },
  es: {
    name: 'Bruno',
    yourTurn: '¡TE TOCA!',
    turnOf: (name: string) => `Turno de ${name}`,
    step1: 'Paso 1 / 2',
    choosingColor: (name: string) => `${name} está eligiendo una constelación`,
    logTurn1: (name: string) => `Turno 1: le toca a ${name}`,
    logRevealed: 'ha revelado la estrella',
    logAnswers: 'responde',
    classifyAsk: 'te pide SITUAR la estrella',
    classifyChoose: 'Elige una posición',
    classifyConfirm: 'Confirmar',
    compareAsk: 'te pide MEDIR',
  },
} as const;

type Lang = keyof typeof TEXT;

interface BilingualGame {
  french: Page;
  spanish: Page;
  code: string;
  /** Joueur tire au sort par le serveur, et son adversaire. */
  active: Page;
  waiting: Page;
  activeLang: Lang;
  waitingLang: Lang;
}

/** Cree une partie a deux joueurs, chacun dans la langue de son navigateur. */
async function startBilingualGame(browser: Browser): Promise<BilingualGame> {
  const french = await openHome(browser, 'fr-FR');
  const spanish = await openHome(browser, 'es-ES');

  await french.getByTestId('menu-create').click();
  await french.getByTestId('name-input').fill(TEXT.fr.name);
  await french.getByTestId('submit-room').click();
  await expect(french.getByTestId('room-code')).toBeVisible();
  const code = (await french.getByTestId('room-code').innerText()).replace(/\s/g, '');

  await spanish.getByTestId('menu-join').click();
  await spanish.getByTestId('name-input').fill(TEXT.es.name);
  await spanish.getByTestId('code-input').fill(code);
  await spanish.getByTestId('submit-room').click();
  await expect(spanish.getByTestId('waiting-host')).toBeVisible();

  await french.getByTestId('start-game').click();
  await expect(french.getByTestId('announce-button')).toBeVisible();
  await expect(spanish.getByTestId('announce-button')).toBeVisible();

  // L'annonce du tirage au sort, puis le tutoriel.
  for (const page of [french, spanish]) {
    const skipDraw = page.getByTestId('roulette-continue');
    try {
      await skipDraw.waitFor({ state: 'visible', timeout: 4000 });
      await skipDraw.click();
      await page.getByTestId('roulette').waitFor({ state: 'detached', timeout: 4000 });
    } catch {
      // Annonce deja refermee.
    }
    const skip = page.getByTestId('skip-onboarding');
    try {
      await skip.waitFor({ state: 'visible', timeout: 4000 });
      await skip.click();
    } catch {
      // Tutoriel deja vu.
    }
  }

  // Le premier joueur est tire au sort : seul lui a les boutons de couleur.
  const frenchStarts = (await french.locator('[data-testid^="reveal-"]').count()) > 0;
  return {
    french,
    spanish,
    code,
    active: frenchStarts ? french : spanish,
    waiting: frenchStarts ? spanish : french,
    activeLang: frenchStarts ? 'fr' : 'es',
    waitingLang: frenchStarts ? 'es' : 'fr',
  };
}

test.describe('Traduction espagnole', () => {
  test("l'accueil suit la langue du navigateur", async ({ browser }) => {
    const spanish = await openHome(browser, 'es-ES');
    await expect(spanish.locator('html')).toHaveAttribute('lang', 'es');
    await expect(spanish.getByTestId('menu-create')).toHaveText('Crear una partida');
    await expect(spanish.getByTestId('menu-join')).toHaveText('Unirse a una partida');
    await expect(spanish.getByTestId('menu-help')).toHaveText('¿Cómo se juega?');
    await expect(spanish).toHaveTitle(/constelación/);

    const french = await openHome(browser, 'fr-FR');
    await expect(french.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(french.getByTestId('menu-create')).toHaveText('Créer une partie');

    // Une langue inconnue retombe sur le francais.
    const other = await openHome(browser, 'de-DE');
    await expect(other.getByTestId('menu-create')).toHaveText('Créer une partie');
  });

  test('le choix de langue est immediat et survit au rechargement', async ({ browser }) => {
    const page = await openHome(browser, 'fr-FR');
    await expect(page.getByTestId('menu-create')).toHaveText('Créer une partie');

    await page.getByTestId('lang-es').click();
    await expect(page.getByTestId('menu-create')).toHaveText('Crear una partida');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');

    await page.reload();
    await expect(page.getByTestId('menu-create')).toHaveText('Crear una partida');

    await page.getByTestId('lang-fr').click();
    await expect(page.getByTestId('menu-create')).toHaveText('Créer une partie');
  });

  test('chaque joueur voit la partie dans sa propre langue', async ({ browser }) => {
    const { french, spanish, active, waiting, activeLang, waitingLang } =
      await startBilingualGame(browser);
    const activeName = TEXT[activeLang].name;

    // Bandeau de tour et panneau d'action, chacun dans sa langue.
    await expect(active.locator('.turn-indicator')).toContainText(TEXT[activeLang].yourTurn);
    await expect(waiting.locator('.turn-indicator')).toContainText(
      TEXT[waitingLang].turnOf(activeName),
    );
    await expect(active.locator('.action-panel')).toContainText(TEXT[activeLang].step1);
    await expect(waiting.locator('.action-panel')).toContainText(
      TEXT[waitingLang].choosingColor(activeName),
    );

    // Zone publique et panneaux lateraux.
    await expect(spanish.locator('.pool__head')).toContainText('Registro común');
    await expect(spanish.locator('.table__side')).toContainText('Jugadores');
    await expect(spanish.locator('.table__side')).toContainText('Historial');

    // Les boutons de couleur sont traduits pour le joueur actif.
    await active.getByTestId('reveal-green').click();
    await expect(active.getByTestId('hint-instruction')).toBeVisible();

    // L'historique est rendu dans la langue de chaque joueur, a partir du
    // meme evenement serveur.
    await expect(french.locator('.game-log')).toContainText(TEXT.fr.logRevealed);
    await expect(spanish.locator('.game-log')).toContainText(TEXT.es.logRevealed);
    await expect(spanish.locator('.game-log')).toContainText(TEXT.es.logTurn1(activeName));
    await expect(french.locator('.game-log')).toContainText(TEXT.fr.logTurn1(activeName));
    // Y compris le tirage au sort du premier joueur.
    await expect(french.locator('.game-log')).toContainText(`Tirage au sort : ${activeName}`);
    await expect(spanish.locator('.game-log')).toContainText(`Sorteo: empieza ${activeName}`);
  });

  test('les dialogues SITUER et JAUGER sont traduits des deux cotes', async ({ browser }) => {
    const { active, waiting, activeLang, waitingLang } = await startBilingualGame(browser);

    // Tour du joueur tire au sort : SITUER.
    await active.getByTestId('reveal-blue').click();
    await expect(active.getByTestId('hint-instruction')).toBeVisible();
    await active.locator('.pool__tiles button.tile').first().click();

    // Cote demandeur : les deux actions, dans SA langue.
    await expect(active.getByTestId('choose-classify')).toContainText(
      activeLang === 'fr' ? 'SITUER' : 'SITUAR',
    );
    await expect(active.getByTestId('choose-compare')).toContainText(
      activeLang === 'fr' ? 'JAUGER' : 'MEDIR',
    );
    await active.getByTestId('choose-classify').click();

    // Cote repondeur : titre, consigne et bouton dans SA langue.
    await expect(waiting.locator('.modal__title')).toContainText(TEXT[waitingLang].classifyAsk);
    await expect(waiting.getByTestId('confirm-classify')).toHaveText(
      TEXT[waitingLang].classifyChoose,
    );
    await waiting.locator('.slot-picker__slot').first().click();
    await expect(waiting.getByTestId('confirm-classify')).toContainText(
      TEXT[waitingLang].classifyConfirm,
    );
    await waiting.getByTestId('confirm-classify').click();

    // Le tour passe a l'autre joueur : JAUGER, dans l'autre langue.
    await expect(waiting.locator('.turn-indicator')).toContainText(TEXT[waitingLang].yourTurn);
    await waiting.getByTestId('reveal-red').click();
    await expect(waiting.getByTestId('hint-instruction')).toBeVisible();
    await waiting.locator('.pool__tiles button.tile').first().click();
    await waiting.getByTestId('choose-compare').click();
    await waiting.locator('.hint-dialog__rack .tile-back').nth(1).click();
    await waiting.getByTestId('confirm-compare').click();

    await expect(active.getByTestId('confirm-compare-answer')).toBeVisible();
    await expect(active.locator('.modal__title')).toContainText(TEXT[activeLang].compareAsk);
    await active.getByTestId('confirm-compare-answer').click();
    await expect(waiting.locator('.game-log')).toContainText(TEXT[waitingLang].logAnswers);
  });

  test('la fiche de deduction et la fin de partie sont traduites', async ({ browser }) => {
    const { french, spanish } = await startBilingualGame(browser);

    // Fiche cote espagnol.
    await spanish.getByTestId('open-sheet').click();
    await expect(spanish.getByTestId('deduction-sheet')).toContainText('Mi carta celeste');
    await expect(spanish.getByTestId('crossed-count')).toContainText('tachados');
    await spanish.getByTestId('sheet-cell-17').click();
    // Le libelle porte un suffixe si la tuile est deja revelee au centre :
    // on verifie donc le debut du libelle.
    await expect(spanish.getByTestId('sheet-cell-17')).toHaveAccessibleName(
      /^Número 17, Aurora, 1 brillo, eliminado/,
    );
    await spanish.getByTestId('close-sheet').click();

    // Fin de partie : Alice gagne, chacun lit le resultat dans sa langue.
    const aliceSecrets = await spanish
      .locator('.player-zone--opponent .rack__column > .tile')
      .evaluateAll((nodes) => nodes.map((n) => Number(n.getAttribute('data-tile'))));

    await french.getByTestId('announce-button').click();
    for (const [index, number] of aliceSecrets.entries()) {
      await french.getByTestId(`announce-input-${String(index)}`).fill(String(number));
    }
    await french.getByTestId('submit-guess').click();
    await french.getByTestId('confirm-guess').click();

    await expect(french.getByTestId('game-over-result')).toContainText('Victoire de Alice');
    await expect(spanish.getByTestId('game-over-result')).toContainText('¡Alice ha ganado!');
    await expect(spanish.getByTestId('rematch')).toHaveText('Jugar otra vez');
    await expect(spanish.getByTestId('back-home')).toHaveText('Volver al inicio');
  });

  test('les erreurs de salon sont traduites', async ({ browser }) => {
    const spanish = await openHome(browser, 'es-ES');
    await spanish.getByTestId('menu-join').click();
    await spanish.getByTestId('name-input').fill('Bruno');
    await spanish.getByTestId('code-input').fill('ZZZZZ');
    await spanish.getByTestId('submit-room').click();
    await expect(spanish.getByTestId('home-error')).toHaveText(
      'Esta partida no existe (o ha caducado).',
    );

    await spanish.getByTestId('name-input').fill('B');
    await spanish.getByTestId('submit-room').click();
    await expect(spanish.getByTestId('home-error')).toContainText('Apodo no válido');
  });
});
