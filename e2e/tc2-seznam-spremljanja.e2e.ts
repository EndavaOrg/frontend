import { clickAndGetAlert, login, readCards, searchByMake, snap, pathIs, expect, test } from './helpers';

// TC2 – Upravljanje seznama spremljanja (F2, F7)
// Predpogoji: obstaja testni uporabnik (E2E_USER_EMAIL / E2E_USER_PASSWORD), seznam spremljanja je prazen
// (vsak test teče v novem, praznem brskalniškem profilu, zato je seznam vedno prazen).

const EMAIL = process.env.E2E_USER_EMAIL;
const PASSWORD = process.env.E2E_USER_PASSWORD;

test('TC2 – dodajanje, pregled in odstranjevanje vozil na seznamu spremljanja', async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, 'Nastavi E2E_USER_EMAIL in E2E_USER_PASSWORD (obstoječ testni uporabnik).');

  const star = (i: number) => page.locator('.card').nth(i).getByTitle('Dodaj na seznam spremljanja');
  const titles: string[] = [];

  await test.step('1. Neprijavljen uporabnik klikne ⭐ – mora se prijaviti', async () => {
    await searchByMake(page);
    expect(await clickAndGetAlert(page, star(0))).toBe('Za dodajanje na seznam spremljanja se prijavite.');
    await snap(page, 'TC2-1');
  });

  await test.step('2. Prijava in dodajanje vozila', async () => {
    await login(page, EMAIL!, PASSWORD!);
    await expect(page.getByTitle('Watchlist')).toBeVisible();
    await expect(page.getByRole('link', { name: '⚙ Preference' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Odjava' })).toBeVisible();

    await searchByMake(page);
    const cards = await readCards(page);
    expect(cards.length, 'za test sta potrebna vsaj dva oglasa').toBeGreaterThanOrEqual(2);
    titles.push(cards[0].title, cards[1].title);

    expect(await clickAndGetAlert(page, star(0))).toBe('Dodano na seznam spremljanja!');
    await snap(page, 'TC2-2');
  });

  await test.step('3. Ponovni klik ⭐ na istem oglasu – vozilo ni dodano dvakrat', async () => {
    expect(await clickAndGetAlert(page, star(0))).toBe('To vozilo je že na seznamu spremljanja.');
    await snap(page, 'TC2-3');
  });

  await test.step('4. Dodajanje drugega oglasa in pregled seznama spremljanja', async () => {
    expect(await clickAndGetAlert(page, star(1))).toBe('Dodano na seznam spremljanja!');
    await page.getByTitle('Watchlist').click();
    await expect(page).toHaveURL(pathIs('/watchlist'));
    await expect(page.getByRole('heading', { name: 'Seznam spremljanja' })).toBeVisible();
    await expect(page.locator('.card')).toHaveCount(2);
    expect((await readCards(page)).map((c) => c.title)).toEqual(titles);
    await snap(page, 'TC2-4');
  });

  await test.step('5. Odstranitev obeh vozil', async () => {
    await page.getByRole('button', { name: /Odstrani/ }).first().click();
    await expect(page.locator('.card')).toHaveCount(1);
    await page.getByRole('button', { name: /Odstrani/ }).click();
    await expect(page.getByText('Seznam spremljanja je prazen.')).toBeVisible();
    await snap(page, 'TC2-5');
  });

  // Popogoji: seznam ostane prazen tudi po osvežitvi strani, uporabnik ostane prijavljen
  await page.reload();
  await expect(page.getByText('Seznam spremljanja je prazen.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Odjava' })).toBeVisible();
});