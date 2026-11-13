import { CAR_MAKE, pathIs, readCards, resultCount, searchButton, setFilter, snap, waitForResults, expect, test } from './helpers';

// TC1 – Iskanje avtomobila s filtri in razvrščanje rezultatov (F4, F6)
// Predpogoji: aplikacija in backend delujeta, uporabnik ni prijavljen.

test('TC1 – iskanje avtomobila s filtri in razvrščanje rezultatov', async ({ page }) => {
  let count = 0;

  await test.step('1. Izbira zavihka Avtomobili, znamke, letnika od 2015 in cene do 20.000 €', async () => {
    await page.goto('/');
    await page.getByRole('button', { name: /Avtomobili/ }).click();
    const all = await resultCount(page);

    await setFilter(page, 'make', CAR_MAKE);
    // seznam modelov se napolni z modeli izbrane znamke
    await expect.poll(() => page.locator('select[name="model"] option').count()).toBeGreaterThan(1);
    await setFilter(page, 'yearFrom', '2015');
    count = await setFilter(page, 'priceTo', '20000');

    expect(count, 'filtri zmanjšajo število zadetkov').toBeLessThanOrEqual(all);
    expect(count, `za ${CAR_MAKE} 2015+ do 20.000 € mora obstajati vsaj en oglas`).toBeGreaterThan(0);
    await snap(page, 'TC1-1');
  });

  await test.step('2. Klik na "N rezultatov" – rezultati ustrezajo filtrom', async () => {
    await searchButton(page).click();
    await waitForResults(page);

    const cards = await readCards(page);
    expect(cards).toHaveLength(Math.min(count, 20));
    for (const card of cards) {
      expect(card.title.toLowerCase(), card.title).toContain(CAR_MAKE.toLowerCase());
      expect(card.year, card.title).toBeGreaterThanOrEqual(2015);
      if (card.price !== null) expect(card.price, card.title).toBeLessThanOrEqual(20000);
      expect(card.fuelLines, `${card.title}: podrobnosti se ne smejo ponoviti`).toBe(1);
    }
    await expect(page.getByText(`Stran 1 / ${Math.max(1, Math.ceil(count / 20))}`)).toBeVisible();
    await snap(page, 'TC1-2');
  });

  await test.step('3. Moč 137–204 HP – na karticah je moč med 101 in 150 kW', async () => {
    await page.getByRole('button', { name: '← Nazaj na iskalnik' }).click();
    await expect(page).toHaveURL(pathIs('/'));
    await resultCount(page);
    await setFilter(page, 'powerUnit', 'HP');
    await setFilter(page, 'powerFrom', '137');
    await setFilter(page, 'powerTo', '204');
    await searchButton(page).click();
    await waitForResults(page);

    const cards = await readCards(page);
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(card.kw, card.title).toBeGreaterThanOrEqual(101); // 137 / 1,36 ≈ 101
      expect(card.kw, card.title).toBeLessThanOrEqual(150); //   204 / 1,36 = 150
    }
    await snap(page, 'TC1-3');
  });

  await test.step('4. Razvrščanje "Cena: Najnižja najprej"', async () => {
    await page.locator('#sortCombined').selectOption('price-asc');
    const prices = (await readCards(page)).map((c) => c.price);

    const firstMissing = prices.indexOf(null);
    const withPrice = (firstMissing === -1 ? prices : prices.slice(0, firstMissing)) as number[];
    expect(withPrice, 'cene naraščajo').toEqual([...withPrice].sort((a, b) => a - b));
    if (firstMissing !== -1) {
      expect(prices.slice(firstMissing), 'oglasi brez cene so na koncu').toEqual(prices.slice(firstMissing).map(() => null));
    }
    await expect(page.getByText(/^Stran 1 \/ \d+$/)).toBeVisible();
    await snap(page, 'TC1-4');
  });

  await test.step('5. Letnik od tekočega leta in cena do 500 € – ni rezultatov', async () => {
    await page.getByRole('button', { name: '← Nazaj na iskalnik' }).click();
    await resultCount(page);
    await setFilter(page, 'yearFrom', String(new Date().getFullYear()));
    expect(await setFilter(page, 'priceTo', '500')).toBe(0);
    await expect(searchButton(page)).toHaveText('0 rezultatov');

    await searchButton(page).click();
    await waitForResults(page);
    await expect(page.getByText('Ni rezultatov za podane kriterije.')).toBeVisible();
    await expect(page.getByText(/^Stran \d+ \/ \d+$/)).toHaveCount(0);
    await snap(page, 'TC1-5');
  });

  // Popogoji: uporabnik ostane neprijavljen
  await expect(page.getByRole('link', { name: 'Prijava' })).toBeVisible();
});