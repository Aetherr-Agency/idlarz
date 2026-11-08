import { defineConfig } from '@playwright/test';

// The smoke test runs against the real Supabase project in .env.local and needs a person to sign in (docs/29-e2e-test-account.md), so it is a
// local, headed run: `npm run reset-test-account -- --yes` first, then `npm run e2e` and sign in in the window that opens. It is not part of CI.
const port = Number(process.env.E2E_PORT ?? 3004);

export default defineConfig({
	testDir: 'e2e',
	timeout: 15 * 60_000, // the person signing in is part of the test
	expect: { timeout: 15_000 },
	fullyParallel: false,
	workers: 1,
	retries: 0,
	reporter: [['list']],
	use: {
		baseURL: `http://localhost:${port}`,
		headless: false,
		// the installed Chrome, so no browser download is needed; E2E_CHANNEL=chromium uses Playwright's own (npx playwright install chromium)
		channel: process.env.E2E_CHANNEL ?? 'chrome',
		viewport: { width: 1400, height: 900 },
		trace: 'retain-on-failure',
	},
	webServer: {
		command: `npm run dev -- -p ${port}`,
		url: `http://localhost:${port}`,
		reuseExistingServer: true,
		timeout: 120_000,
	},
});
