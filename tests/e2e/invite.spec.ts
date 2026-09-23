import { expect, test } from '@playwright/test';

test.describe('Invite links', () => {
  test('the link opens the join form with the code filled in', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    const host = await hostContext.newPage();
    const guest = await guestContext.newPage();

    await host.goto('/');
    await host.getByTestId('menu-create').click();
    await host.getByTestId('name-input').fill('Alex');
    await host.getByTestId('submit-room').click();
    await expect(host.getByTestId('room-code')).toBeVisible();
    const code = (await host.getByTestId('room-code').innerText()).replace(/\s/g, '');

    const link = await host.getByTestId('invite-link').inputValue();
    expect(link).toContain(`?join=${code}`);
    expect(link).toContain('lang=en');

    await guest.goto(link);
    await expect(guest.getByTestId('home-invited')).toBeVisible();
    await expect(guest.getByTestId('code-input')).toHaveValue(code);
    await guest.getByTestId('name-input').fill('Sam');
    await guest.getByTestId('submit-room').click();

    await expect(host.getByTestId('lobby-player-1')).toContainText('Sam');
    await expect(guest.getByTestId('lobby-player-1')).toContainText('Sam');
    // The invite has done its job: it leaves the address bar...
    await expect.poll(() => new URL(guest.url()).search).toBe('');
    // ...and leaving the room leads back to the plain home screen.
    await guest.getByTestId('leave-room').click();
    await expect(guest.getByTestId('menu-create')).toBeVisible();

    await hostContext.close();
    await guestContext.close();
  });

  test('with a remembered name, joining is one tap', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();
    const host = await hostContext.newPage();
    const guest = await guestContext.newPage();

    await host.goto('/');
    await host.getByTestId('menu-create').click();
    await host.getByTestId('name-input').fill('Noor');
    await host.getByTestId('submit-room').click();
    const link = await host.getByTestId('invite-link').inputValue();

    // A first visit remembers the name on this device.
    await guest.goto('/');
    await guest.evaluate(() => {
      window.localStorage.setItem('noctalis:prefs', JSON.stringify({ name: 'Robin' }));
    });
    await guest.goto(link);
    await expect(guest.getByTestId('name-input')).toHaveValue('Robin');
    await expect(guest.getByTestId('submit-room')).toBeFocused();
    await guest.keyboard.press('Enter');
    await expect(host.getByTestId('lobby-player-1')).toContainText('Robin');

    await hostContext.close();
    await guestContext.close();
  });

  test('a bad or outdated code in a link falls back gracefully', async ({ page }) => {
    await page.goto('/?join=not-a-code');
    await expect(page.getByTestId('menu-create')).toBeVisible();

    await page.goto('/?join=ZZZZZ');
    await expect(page.getByTestId('code-input')).toHaveValue('ZZZZZ');
    await page.getByTestId('name-input').fill('Kim');
    await page.getByTestId('submit-room').click();
    await expect(page.getByTestId('home-error')).toBeVisible();
  });

  test('shared links come with a preview card', async ({ request }) => {
    const home = await (await request.get('/')).text();
    expect(home).toMatch(/<meta property="og:image" content="https?:\/\/[^"]+\/og-image\.jpg" \/>/);
    expect(home).toContain('<meta name="twitter:card" content="summary_large_image" />');

    const invite = await (await request.get('/?join=AB7K9&lang=fr')).text();
    expect(invite).toContain('Une partie de NOCTALIS t’attend');
    expect(invite).toContain('Code de la partie : AB7K9.');

    const image = await request.get('/og-image.jpg');
    expect(image.status()).toBe(200);
    expect(image.headers()['content-type']).toBe('image/jpeg');
    expect((await image.body()).byteLength).toBeLessThan(300 * 1024);
  });
});
