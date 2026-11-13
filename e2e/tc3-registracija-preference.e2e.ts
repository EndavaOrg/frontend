import { PREF_MAKE, clickAndGetAlert, pathIs, snap, expect, test } from './helpers';

// TC3 – Registracija, nastavitev preferenc in priporočila (F1, F8, F9)
// Predpogoji: uporabnik ni prijavljen, e-poštni naslov še ni uporabljen
// (vsak zagon uporabi nov naslov z žigom časa).

test('TC3 – registracija, nastavitev preferenc in priporočila', async ({ page }) => {
  const email = `e2e.${Date.now()}@example.com`;
  const phone = page.locator('#telefon');
  const register = page.getByRole('button', { name: 'Registriraj se!' });

  await test.step('1. Registracija z neveljavnim telefonom 12345', async () => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Registracija' }).click();
    await page.locator('#ime').fill('Test');
    await page.locator('#priimek').fill('Uporabnik');
    await phone.fill('12345');
    await page.locator('#email').fill(email);
    await page.locator('#geslo').fill('Test1234!');
    await register.click();

    await expect(phone).toHaveClass(/is-invalid/);
    await expect(page.locator('.invalid-feedback')).toContainText('telefonsko številko');
    await expect(page).toHaveURL(pathIs('/register')); // račun ni ustvarjen
    await snap(page, 'TC3-1');
  });

  await test.step('2. Popravek telefona na 040 123 456 – registracija uspe', async () => {
    await phone.fill('040 123 456');
    await expect(phone).not.toHaveClass(/is-invalid/);
    await register.click();

    await expect(page).toHaveURL(pathIs('/preferences'));
    await expect(page.getByRole('heading', { name: 'Tvoje preference za vozila' })).toBeVisible();
    await expect(page.getByText('Ni dodanih preferenc.')).toBeVisible();
    await snap(page, 'TC3-2');
  });

  await test.step('3. Dodajanje preference brez znamke in modela', async () => {
    const message = await clickAndGetAlert(page, page.getByRole('button', { name: /Dodaj preference/ }));
    expect(message).toContain('Vnesi vsaj znamko ali model.');
    await expect(page.getByText('Ni dodanih preferenc.')).toBeVisible();
    await snap(page, 'TC3-3');
  });

  await test.step(`4. Preferenca ${PREF_MAKE}, letnik od 2015, cena do 15.000 €`, async () => {
    await page.locator('select[name="make"]').selectOption(PREF_MAKE);
    await page.locator('select[name="first_registration"]').selectOption('2015');
    await page.locator('input[name="price_eur"]').fill('15000');
    await page.getByRole('button', { name: /Dodaj preference/ }).click();

    await expect(page.locator('.list-group-item')).toHaveText([new RegExp(`${PREF_MAKE}\\s*\\(2015\\)`)]);
    await snap(page, 'TC3-4');
  });

  await test.step('5. Začetna stran prikaže priporočila "Zanimivo zate"', async () => {
    await page.getByRole('link', { name: 'AvtoPrimerjalnik' }).click();
    await expect(page).toHaveURL(pathIs('/'));

    const section = page.locator('section', { has: page.getByRole('heading', { name: 'Zanimivo zate' }) });
    await expect(section).toBeVisible();
    await expect(section.locator('.card').first()).toBeVisible();
    // med priporočili je oglas znamke iz preference (kartice se menjajo na 4 s)
    await expect(section.locator('.card h6', { hasText: PREF_MAKE }).first()).toBeVisible();
    await snap(page, 'TC3-5');
  });

  // Popogoji: preferenca je shranjena in ostane tudi po ponovnem nalaganju strani
  await page.goto('/preferences');
  await expect(page.locator('.list-group-item')).toHaveText([new RegExp(`${PREF_MAKE}\\s*\\(2015\\)`)]);
});