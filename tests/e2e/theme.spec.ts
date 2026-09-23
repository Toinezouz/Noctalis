import { expect, test, type Browser, type Page } from '@playwright/test';
import { startGame } from './helpers.js';

// Chaque test repart d'un navigateur propre.
test.afterEach(async ({ browser }) => {
  await Promise.all(browser.contexts().map((context) => context.close()));
});

/** Ouvre l'accueil avec une preference systeme donnee. */
async function openHome(browser: Browser, colorScheme: 'light' | 'dark'): Promise<Page> {
  const context = await browser.newContext({ colorScheme });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByTestId('menu-create')).toBeVisible();
  return page;
}

/** Couleur de fond effective de la page. */
async function pageBackground(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

/** Luminance approchee d'une couleur « rgb(r, g, b) ». */
function brightness(color: string): number {
  const [r, g, b] = [...color.matchAll(/\d+/g)].slice(0, 3).map((m) => Number(m[0]));
  return (0.2126 * r! + 0.7152 * g! + 0.0722 * b!) / 255;
}

test.describe('Theme clair et sombre', () => {
  test('suit la preference du systeme par defaut', async ({ browser }) => {
    const dark = await openHome(browser, 'dark');
    await expect(dark.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(brightness(await pageBackground(dark))).toBeLessThan(0.25);

    const light = await openHome(browser, 'light');
    await expect(light.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(brightness(await pageBackground(light))).toBeGreaterThan(0.75);
  });

  test('le choix du joueur prime sur le systeme et survit au rechargement', async ({
    browser,
  }) => {
    // Systeme en clair, joueur qui veut du sombre.
    const page = await openHome(browser, 'light');
    await expect(page.getByTestId('theme-auto')).toHaveAttribute('aria-pressed', 'true');

    await page.getByTestId('theme-dark').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(brightness(await pageBackground(page))).toBeLessThan(0.25);

    await page.reload();
    // Applique des le chargement : pas d'eclair clair avant que React demarre.
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByTestId('theme-dark')).toHaveAttribute('aria-pressed', 'true');

    // Retour a « automatique » : le systeme reprend la main.
    await page.getByTestId('theme-auto').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('la barre du navigateur suit aussi le theme', async ({ browser }) => {
    const page = await openHome(browser, 'light');
    const meta = page.locator('meta[name="theme-color"]');
    await expect(meta).toHaveAttribute('content', /#fff4e2/i);
    await page.getByTestId('theme-dark').click();
    await expect(meta).toHaveAttribute('content', /#191029/i);
  });

  test('le theme se change aussi en pleine partie, sans la perturber', async ({ browser }) => {
    const { first, second } = await startGame(browser, ['Alice', 'Bob']);

    // Dans le bandeau de jeu, un seul bouton fait defiler auto / clair / sombre.
    const cycle = first.getByTestId('theme-cycle');
    await expect(cycle).toHaveAttribute('data-theme-value', 'auto');
    await cycle.click();
    await expect(cycle).toHaveAttribute('data-theme-value', 'light');
    await cycle.click();
    await expect(cycle).toHaveAttribute('data-theme-value', 'dark');
    await expect(first.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(brightness(await pageBackground(first))).toBeLessThan(0.25);
    // Le choix est personnel : l'adversaire n'est pas affecte.
    await expect(second.locator('html')).toHaveAttribute('data-theme', 'light');

    // La table reste lisible et la partie jouable.
    await expect(first.locator('.pool__tiles .tile')).toHaveCount(5);
    const ink = await first.evaluate(() => getComputedStyle(document.body).color);
    expect(brightness(ink)).toBeGreaterThan(0.75);
    await expect(first.getByTestId('got-five-button')).toBeVisible();
  });

  test('la fiche de deduction reste lisible en sombre', async ({ browser }) => {
    const { first } = await startGame(browser, ['Alice', 'Bob']);
    const cycle = first.getByTestId('theme-cycle');
    await cycle.click();
    await cycle.click();
    await expect(first.locator('html')).toHaveAttribute('data-theme', 'dark');
    await first.getByTestId('open-sheet').click();

    const sheet = first.getByTestId('deduction-sheet');
    await expect(sheet).toBeVisible();
    // La fiche elle-meme suit le theme.
    const paper = await sheet.evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(brightness(paper)).toBeLessThan(0.25);
    // Sur grand ecran, la fiche s'ouvre dans un panneau lateral qui doit
    // masquer la table ; sur mobile elle occupe tout l'ecran, sans panneau.
    const panel = first.locator('.sheet-panel');
    if ((await panel.count()) > 0) {
      const veil = await panel.evaluate((node) => getComputedStyle(node).backgroundColor);
      expect(brightness(veil)).toBeLessThan(0.25);
    }
    await expect(first.locator('.sheet-cell')).toHaveCount(60);
    // Les couleurs des tuiles ne changent pas : la fiche correspond au plateau.
    const cell = first.getByTestId('sheet-cell-1');
    await expect(cell).toHaveAttribute('data-color', 'green');
    const face = await cell.evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(face).toBe('rgb(47, 176, 97)');
  });
});
