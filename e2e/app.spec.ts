import { expect, test, type Page } from '@playwright/test';

async function createGroup(page: Page, name: string, members: string) {
  await page.goto('./');
  await page.getByRole('button', { name: /Meal/ }).first().click();
  await page.getByPlaceholder('Friday hotpot').fill(name);
  const who = page.getByLabel('Who’s in?');
  await who.fill(members);
  await who.press('Enter');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByRole('heading', { name })).toBeVisible();
}

async function addExpense(page: Page, title: string, amount: string) {
  await page.getByRole('button', { name: 'Add expense' }).last().click();
  await page.getByLabel('Description').fill(title);
  await page.getByLabel('Amount', { exact: true }).fill(amount);
  await page.getByRole('button', { name: /^Save/ }).click();
  await expect(page.getByText(title, { exact: true })).toBeVisible();
}

test.describe('quick split', () => {
  test('HK dinner with 10% service charge, in Chinese from the /zh-hk/ page', async ({ page }) => {
    await page.goto('zh-hk/');
    await page.getByText('即刻埋單夾錢').click();
    // Use Hong Kong presets regardless of the test machine's locale.
    await page.goto('zh-hk/#/quick?c=HK');
    await page.getByLabel('帳單金額').fill('1000');
    await page.getByRole('button', { name: '+' }).click();
    await page.getByRole('button', { name: '+' }).click();
    await expect(page.getByText('HK$1,100.00').first()).toBeVisible();
    await expect(page.getByText('HK$275.00').first()).toBeVisible();
  });

  test('birthday person is treated', async ({ page }) => {
    await page.goto('#/quick?c=HK');
    await page.getByLabel('Bill amount').fill('300');
    // Remove the service charge for round numbers.
    await page.getByLabel('Service charge').fill('0');
    await page.getByRole('button', { name: '+' }).click();
    await page.locator('button[aria-pressed]').nth(2).click();
    await expect(page.getByText('$150.00').first()).toBeVisible();
  });
});

test.describe('groups', () => {
  test('log an expense and settle up', async ({ page }) => {
    await createGroup(page, 'Dim sum', 'Amy, Ben, Cat');
    await addExpense(page, 'Lunch', '300');
    await page.getByRole('tab', { name: 'Settle up' }).click();
    await expect(page.getByText(/\$100\.00/).first()).toBeVisible();
    await page.getByRole('tab', { name: 'Stats' }).click();
    await expect(page.getByText('By category')).toBeVisible();
  });
});

test.describe('regressions', () => {
  test('a 3-way percentage split is valid straight away', async ({ page }) => {
    await createGroup(page, 'Thirds', 'Amy, Ben, Cat');
    await page.getByRole('button', { name: 'Add expense' }).last().click();
    await page.getByLabel('Amount', { exact: true }).fill('300');
    await page.getByRole('tab', { name: '%' }).click();
    const save = page.getByRole('button', { name: /^Save/ });
    await expect(save).toBeEnabled();
    await save.click();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByText('Food', { exact: true })).toBeVisible();
  });

  test('Escape in the currency picker keeps the expense being edited', async ({ page }) => {
    await createGroup(page, 'Esc test', 'Amy, Ben');
    await page.getByRole('button', { name: 'Add expense' }).last().click();
    await page.getByLabel('Description').fill('Half-typed expense');
    await page.locator('[role=dialog] button').filter({ hasText: /^[A-Z]{3}$/ }).first().click();
    await expect(page.getByRole('heading', { name: 'Currency' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Currency' })).toBeHidden();
    await expect(page.getByLabel('Description')).toHaveValue('Half-typed expense');
  });

  test('group tabs fit on a small phone in German, French and Spanish', async ({ browser }) => {
    for (const lang of ['de', 'fr', 'es', 'th']) {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, serviceWorkers: 'block' });
    await ctx.addInitScript((lang) =>
      localStorage.setItem(
        'easysplit:v1',
        JSON.stringify({
          version: 1,
          settings: { lang, theme: 'light', country: 'DE' },
          groups: [{ id: 'g', name: 'Reise', emoji: '✈️', kind: 'trip', currency: 'EUR', country: 'DE', members: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], expenses: [], rates: {}, simplify: true, createdAt: 1, updatedAt: 1 }],
        }),
      ),
      lang,
    );
    const page = await ctx.newPage();
    await page.goto('#/g/g');
    const tabs = page.locator('[role=tab]');
    for (let i = 0; i < (await tabs.count()); i++) {
      await tabs.nth(i).click();
      // The selected tab is bold, so check every tab in its selected state too.
      const clipped = await tabs.evaluateAll((els) => els.filter((t) => t.scrollWidth > t.clientWidth + 1).map((t) => t.textContent));
      expect(clipped).toEqual([]);
    }
    await ctx.close();
    }
  });
});

test.describe('live sharing', () => {
  test('two friends see each other’s expenses', async ({ page, browser }) => {
    await createGroup(page, 'Ski trip', 'Amy, Ben');
    await page.getByRole('button', { name: 'More' }).click();
    await page.getByRole('button', { name: /Share live with friends/ }).click();
    await page.getByRole('button', { name: /Turn on & share link/ }).click();
    await expect(page.getByText('Live', { exact: true })).toBeVisible();
    await page.waitForTimeout(400);
    const cloudId = await page.evaluate(() => JSON.parse(localStorage.getItem('easysplit:v1') || '{}').groups[0].cloudId as string);
    expect(cloudId).toMatch(/^[A-Za-z0-9]{24}$/);

    const friend = await (await browser.newContext({ serviceWorkers: 'block' })).newPage();
    await friend.goto(`#/join/${cloudId}`);
    await friend.getByRole('button', { name: 'Join group' }).click();
    await expect(friend.getByRole('heading', { name: 'Ski trip' })).toBeVisible();

    await addExpense(friend, 'Lift pass', '800');
    await expect(page.getByText('Lift pass', { exact: true })).toBeVisible();

    await addExpense(page, 'Fondue', '240');
    await expect(friend.getByText('Fondue', { exact: true })).toBeVisible();
    await friend.context().close();
  });
});

test.describe('static pages', () => {
  test('country guide page has content, FAQ data and a working link to the calculator', async ({ page }) => {
    await page.goto('ja/tipping/jp/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('日本');
    const ld = await page.locator('script[type="application/ld+json"]').textContent();
    expect(ld).toContain('FAQPage');
    await page.getByRole('link', { name: /日本の設定で割り勘する/ }).first().click();
    await expect(page.getByText('JPY').first()).toBeVisible();
  });

  test('privacy page, sitemap and 404 page exist', async ({ page, request }) => {
    await page.goto('privacy/');
    await expect(page.getByRole('heading', { level: 1, name: 'Privacy policy' })).toBeVisible();
    const sitemap = await request.get('sitemap.xml');
    expect(await sitemap.text()).toContain('/tipping/jp/');
    await page.goto('404.html');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  });
});
