import { defineConfig, devices } from '@playwright/test';

// E2E (funkcionalni) testi za AvtoPrimerjalnik.
//
// Lokalno:  npx playwright test            (sam zažene frontend z `npm run dev`; backend mora teči)
// Cevovod:  CI=true npx playwright test    (brez grafičnega vmesnika, rezultati v HTML in JUnit XML)
//
// Okoljske spremenljivke:
//   E2E_BASE_URL       naslov že zagnanega frontenda (če ni podan, se zažene `npm run dev`)
//   E2E_USER_EMAIL     testni uporabnik za TC2 (seznam spremljanja)
//   E2E_USER_PASSWORD  geslo testnega uporabnika
//   E2E_CAR_MAKE       znamka za iskanje (privzeto Volkswagen)
//   E2E_PREF_MAKE      znamka za preferenco v TC3 (privzeto Audi)

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5173';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts', // končnica .e2e.ts, da jih Jest ne pobere kot teste enot
  timeout: 90_000, // backend za štetje vseh oglasov potrebuje nekaj sekund
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1, // TC-ji si delijo backend in bazo
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL,
    locale: 'sl-SI',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run dev -- --port 5173 --strictPort',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});