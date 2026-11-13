import { expect, test as base, type Locator, type Page } from '@playwright/test';

const inFlight = new WeakMap<Page, Set<unknown>>();

/** Playwright `test`, ki od odprtja strani sledi odprtim zahtevam na backend API. */
export const test = base.extend({
  page: async ({ page }, use) => {
    const pending = new Set<unknown>();
    const isApi = (r: { url(): string }) => r.url().includes('/api/');
    page.on('request', (r) => { if (isApi(r)) pending.add(r); });
    page.on('requestfinished', (r) => pending.delete(r));
    page.on('requestfailed', (r) => pending.delete(r));
    inFlight.set(page, pending);
    await use(page);
  },
});
export { expect };

export const CAR_MAKE = process.env.E2E_CAR_MAKE || 'Volkswagen';
export const PREF_MAKE = process.env.E2E_PREF_MAKE || 'Audi';

export type Card = { title: string; year: number | null; price: number | null; kw: number | null; fuelLines: number };

/** Pot trenutnega URL-ja, npr. "/results". */
export const pathIs = (path: string) => (url: URL) => url.pathname === path;

/** Klikne element in vrne besedilo opozorila (alert), ki se ob tem prikaže. */
export async function clickAndGetAlert(page: Page, target: Locator): Promise<string> {
  const message = new Promise<string>((resolve) => {
    page.once('dialog', async (dialog) => {
      const text = dialog.message();
      await dialog.accept();
      resolve(text);
    });
  });
  await target.click();
  return message;
}

/** Posnetek zaslona, priložen v poročilo HTML (kot posnetki pri ročnem testiranju). */
export async function snap(page: Page, name: string) {
  await test.info().attach(name, { body: await page.screenshot(), contentType: 'image/png' });
}

/** Počaka, da na backend API ni nobene odprte zahteve vsaj 300 ms (npr. dvojne zahteve v StrictMode). */
export async function waitForApiIdle(page: Page) {
  const pending = inFlight.get(page)!;
  await expect
    .poll(async () => {
      if (pending.size > 0) return false;
      await page.waitForTimeout(300);
      return pending.size === 0;
    }, { intervals: [100] })
    .toBe(true);
}

/** Gumb iskalnega obrazca, ki prikazuje "N rezultatov". */
export const searchButton = (page: Page) => page.locator('form.glass-form button[type="submit"]');

/** Prebere število zadetkov z gumba, ko se števec posodobi. */
export async function resultCount(page: Page): Promise<number> {
  const button = searchButton(page);
  await waitForApiIdle(page);
  await expect(button).toHaveText(/^\d+ rezultatov$/);
  return Number((await button.textContent())!.match(/\d+/)![0]);
}

/** Izbere vrednost v filtru in počaka, da backend vrne novo število zadetkov. */
export async function setFilter(page: Page, name: string, value: string) {
  const counted = page.waitForResponse((r) => r.url().includes('/api/cars?') && r.request().method() === 'GET');
  await page.locator(`form.glass-form select[name="${name}"]`).selectOption(value);
  await counted;
  return resultCount(page);
}

/** Počaka, da se stran z rezultati naloži. */
export async function waitForResults(page: Page) {
  await expect(page).toHaveURL(pathIs('/results'));
  await expect(page.getByRole('heading', { name: 'Rezultati iskanja' })).toBeVisible();
  await expect(page.getByText('Nalagam...')).toHaveCount(0);
}

/** Prebere podatke s kartic oglasov na trenutni strani. */
export function readCards(page: Page): Promise<Card[]> {
  return page.locator('.card').evaluateAll((cards) =>
    cards.map((card) => {
      const title = Array.from(card.querySelector('.card-title')?.childNodes ?? [])
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent)
        .join('')
        .trim();
      const li = (label: string) =>
        Array.from(card.querySelectorAll('li')).find((el) => el.textContent?.startsWith(label))?.textContent ?? '';
      const digits = (s: string) => (/\d/.test(s) ? Number(s.replace(/\D/g, '')) : null);
      const kw = li('Moč:').match(/(\d+)\s*kW/);
      return {
        title,
        year: digits(li('Letnik:')),
        price: digits(card.querySelector('h6')?.textContent ?? ''),
        kw: kw ? Number(kw[1]) : null,
        fuelLines: Array.from(card.querySelectorAll('li')).filter((el) => el.textContent?.startsWith('Gorivo:')).length,
      };
    }),
  );
}

/** Na začetni strani izbere znamko in odpre rezultate iskanja. */
export async function searchByMake(page: Page, make = CAR_MAKE) {
  await page.goto('/');
  await resultCount(page);
  await setFilter(page, 'make', make);
  await searchButton(page).click();
  await waitForResults(page);
}

/** Prijava z e-pošto in geslom prek obrazca /login. */
export async function login(page: Page, email: string, password: string) {
  await page.getByRole('link', { name: 'Prijava' }).click();
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Prijava', exact: true }).click();
  await expect(page).toHaveURL(pathIs('/'));
}