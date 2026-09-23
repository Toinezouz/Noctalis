import { expect, test, type Browser, type Page } from '@playwright/test';

// Every test starts from a clean browser.
test.afterEach(async ({ browser }) => {
  await Promise.all(browser.contexts().map((context) => context.close()));
});

/** Opens the home screen with a given browser language. */
async function openHome(browser: Browser, locale: string): Promise<Page> {
  const context = await browser.newContext({ locale });
  const page = await context.newPage();
  await page.goto('/');
  return page;
}

/** Expected texts in each language, for symmetric assertions. */
const TEXT = {
  fr: {
    name: 'Alice',
    yourTurn: 'À TOI DE JOUER',
    turnOf: (name: string) => `Au tour de ${name}`,
    step1: 'Étape 1 / 2',
    choosingColor: (name: string) => `${name} choisit une constellation`,
    logTurn1: (name: string) => `Tour 1 : au tour de ${name}`,
    logDraw: (name: string) => `Le tirage au sort désigne ${name}`,
    logRevealed: 'révèle l’étoile',
    logAnswers: 'répond',
    classifyAsk: 'te demande de SITUER l’étoile',
    classifyChoose: 'Choisis une place',
    classifyConfirm: 'Valider',
    compareAsk: 'te demande de JAUGER',
  },
  es: {
    name: 'Bruno',
    yourTurn: '¡TE TOCA!',
    turnOf: (name: string) => `Turno de ${name}`,
    step1: 'Paso 1 / 2',
    choosingColor: (name: string) => `${name} elige una constelación`,
    logTurn1: (name: string) => `Turno 1: juega ${name}`,
    logDraw: (name: string) => `El sorteo elige a ${name}`,
    logRevealed: 'revela la estrella',
    logAnswers: 'responde',
    classifyAsk: 'te pide que SITÚES la estrella',
    classifyChoose: 'Elige un sitio',
    classifyConfirm: 'Confirmar',
    compareAsk: 'te pide que MIDAS',
  },
} as const;

type Lang = keyof typeof TEXT;

interface BilingualGame {
  french: Page;
  spanish: Page;
  code: string;
  /** Player drawn by the server, and the other one. */
  active: Page;
  waiting: Page;
  activeLang: Lang;
  waitingLang: Lang;
}

/** Creates a two-player game, each player in their browser's language. */
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

  // The opening draw, then the tutorial.
  for (const page of [french, spanish]) {
    const skipDraw = page.getByTestId('roulette-continue');
    try {
      await skipDraw.waitFor({ state: 'visible', timeout: 4000 });
      await skipDraw.click();
      await page.getByTestId('roulette').waitFor({ state: 'detached', timeout: 4000 });
    } catch {
      // Draw already closed.
    }
    const skip = page.getByTestId('skip-onboarding');
    try {
      await skip.waitFor({ state: 'visible', timeout: 4000 });
      await skip.click();
    } catch {
      // Tutorial already seen.
    }
  }

  // The first player is drawn at random: only they have the constellation buttons.
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

test.describe('Translations', () => {
  test('the home screen follows the browser language', async ({ browser }) => {
    const spanish = await openHome(browser, 'es-ES');
    await expect(spanish.locator('html')).toHaveAttribute('lang', 'es');
    await expect(spanish.getByTestId('menu-create')).toHaveText('Crear una partida');
    await expect(spanish.getByTestId('menu-join')).toHaveText('Unirse a una partida');
    await expect(spanish.getByTestId('menu-help')).toHaveText('¿Cómo se juega?');
    await expect(spanish).toHaveTitle(/constelación/);

    const french = await openHome(browser, 'fr-FR');
    await expect(french.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(french.getByTestId('menu-create')).toHaveText('Lancer une partie');

    const english = await openHome(browser, 'en-GB');
    await expect(english.locator('html')).toHaveAttribute('lang', 'en');
    await expect(english.getByTestId('menu-create')).toHaveText('Start a game');
    await expect(english).toHaveTitle(/constellation before anyone else/);

    // A language we do not offer falls back to English.
    const other = await openHome(browser, 'de-DE');
    await expect(other.getByTestId('menu-create')).toHaveText('Start a game');
  });

  test('choosing a language is instant and survives a reload', async ({ browser }) => {
    const page = await openHome(browser, 'fr-FR');
    await expect(page.getByTestId('menu-create')).toHaveText('Lancer une partie');

    await page.getByTestId('lang-es').click();
    await expect(page.getByTestId('menu-create')).toHaveText('Crear una partida');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');

    await page.reload();
    await expect(page.getByTestId('menu-create')).toHaveText('Crear una partida');

    await page.getByTestId('lang-en').click();
    await expect(page.getByTestId('menu-create')).toHaveText('Start a game');

    await page.getByTestId('lang-fr').click();
    await expect(page.getByTestId('menu-create')).toHaveText('Lancer une partie');
  });

  test('each player sees the game in their own language', async ({ browser }) => {
    const { french, spanish, active, waiting, activeLang, waitingLang } =
      await startBilingualGame(browser);
    const activeName = TEXT[activeLang].name;

    // Turn banner and action panel, each in their own language.
    await expect(active.locator('.turn-indicator')).toContainText(TEXT[activeLang].yourTurn);
    await expect(waiting.locator('.turn-indicator')).toContainText(
      TEXT[waitingLang].turnOf(activeName),
    );
    await expect(active.locator('.action-panel')).toContainText(TEXT[activeLang].step1);
    await expect(waiting.locator('.action-panel')).toContainText(
      TEXT[waitingLang].choosingColor(activeName),
    );

    // Open sky and side panels.
    await expect(spanish.locator('.pool__head')).toContainText('El cielo común');
    await expect(spanish.locator('.table__side')).toContainText('En la mesa');
    await expect(spanish.locator('.table__side')).toContainText('Lo que ha pasado');
    await expect(french.locator('.pool__head')).toContainText('Le ciel commun');

    // The constellation buttons work for the active player.
    await active.getByTestId('reveal-green').click();
    await expect(active.getByTestId('hint-instruction')).toBeVisible();

    // The history is written in each player's language, from the same
    // server event.
    await expect(french.locator('.game-log')).toContainText(TEXT.fr.logRevealed);
    await expect(spanish.locator('.game-log')).toContainText(TEXT.es.logRevealed);
    await expect(spanish.locator('.game-log')).toContainText(TEXT.es.logTurn1(activeName));
    await expect(french.locator('.game-log')).toContainText(TEXT.fr.logTurn1(activeName));
    // Including the draw of the first player.
    await expect(french.locator('.game-log')).toContainText(TEXT.fr.logDraw(activeName));
    await expect(spanish.locator('.game-log')).toContainText(TEXT.es.logDraw(activeName));

    // Switching language mid-game, from the header.
    await french.getByTestId('lang-select').selectOption('en');
    await expect(french.locator('.pool__head')).toContainText('The open sky');
    await expect(french.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('the PLACE and GAUGE dialogs are translated on both sides', async ({ browser }) => {
    const { active, waiting, activeLang, waitingLang } = await startBilingualGame(browser);

    // The drawn player's turn: PLACE.
    await active.getByTestId('reveal-blue').click();
    await expect(active.getByTestId('hint-instruction')).toBeVisible();
    await active.locator('.pool__tiles button.tile').first().click();

    // Asker's side: both actions, in their language.
    await expect(active.getByTestId('choose-classify')).toContainText(
      activeLang === 'fr' ? 'SITUER' : 'SITUAR',
    );
    await expect(active.getByTestId('choose-compare')).toContainText(
      activeLang === 'fr' ? 'JAUGER' : 'MEDIR',
    );
    await active.getByTestId('choose-classify').click();

    // Responder's side: title, instruction and button in their language.
    await expect(waiting.locator('.modal__title')).toContainText(TEXT[waitingLang].classifyAsk);
    await expect(waiting.getByTestId('confirm-classify')).toHaveText(
      TEXT[waitingLang].classifyChoose,
    );
    await waiting.locator('.slot-picker__slot').first().click();
    await expect(waiting.getByTestId('confirm-classify')).toContainText(
      TEXT[waitingLang].classifyConfirm,
    );
    await waiting.getByTestId('confirm-classify').click();

    // The turn goes to the other player: GAUGE, in the other language.
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

  test('the star chart and the end screen are translated', async ({ browser }) => {
    const { french, spanish } = await startBilingualGame(browser);

    // The Spanish player's chart.
    await spanish.getByTestId('open-sheet').click();
    await expect(spanish.getByTestId('deduction-sheet')).toContainText('Mi carta celeste');
    await expect(spanish.getByTestId('crossed-count')).toContainText('tachados');
    await spanish.getByTestId('sheet-cell-17').click();
    // The label gets a suffix if the star is already revealed or held by
    // someone else: only its beginning is checked.
    await expect(spanish.getByTestId('sheet-cell-17')).toHaveAccessibleName(
      /^Número 17, Orión, 1 destello, tachado/,
    );
    await spanish.getByTestId('close-sheet').click();

    // End of game: Alice wins, each player reads the result in their language.
    const aliceSecrets = await spanish
      .locator('.player-zone--opponent .rack__column > .tile')
      .evaluateAll((nodes) => nodes.map((n) => Number(n.getAttribute('data-tile'))));

    await french.getByTestId('announce-button').click();
    for (const [index, number] of aliceSecrets.entries()) {
      await french.getByTestId(`announce-input-${String(index)}`).fill(String(number));
    }
    await french.getByTestId('submit-guess').click();
    await french.getByTestId('confirm-guess').click();

    await expect(french.getByTestId('game-over-result')).toContainText('Bravo Alice, tu as trouvé ta constellation');
    await expect(spanish.getByTestId('game-over-result')).toContainText('¡Victoria para Alice');
    await expect(spanish.getByTestId('rematch')).toHaveText('Jugar otra vez');
    await expect(spanish.getByTestId('back-home')).toHaveText('Volver al inicio');
  });

  test('room errors are translated', async ({ browser }) => {
    const spanish = await openHome(browser, 'es-ES');
    await spanish.getByTestId('menu-join').click();
    await spanish.getByTestId('name-input').fill('Bruno');
    await spanish.getByTestId('code-input').fill('ZZZZZ');
    await spanish.getByTestId('submit-room').click();
    await expect(spanish.getByTestId('home-error')).toHaveText(
      'Ninguna partida coincide con este código. Quizá haya caducado.',
    );

    await spanish.getByTestId('name-input').fill('B');
    await spanish.getByTestId('submit-room').click();
    await expect(spanish.getByTestId('home-error')).toContainText('Este nombre no es válido');
  });
});
