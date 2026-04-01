import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const usersFile = path.resolve(process.cwd(), '../product-api/users.txt');
const screenshotDir = path.resolve(process.cwd(), 'artifacts/screenshots');

function readUsers() {
  const content = fs.readFileSync(usersFile, 'utf8').trim().split('\n');
  return content.map((line) => {
    const parts = Object.fromEntries(line.split(';').map((item) => item.trim().split('=')));
    return parts;
  });
}

async function login(page, email, password) {
  await page.goto('/login');
  await page.getByPlaceholder('user@santehmontazh.local').fill(email);
  await page.getByPlaceholder('Минимум 8 символов').fill(password);
  await page.getByRole('button', { name: 'Войти' }).click();
}

test.beforeAll(() => {
  fs.mkdirSync(screenshotDir, { recursive: true });
});

test('основной пользовательский сценарий', async ({ page }) => {
  const users = readUsers();
  const admin = users.find((user) => user.role === 'ADMIN');
  const estimator = users.find((user) => user.role === 'ESTIMATOR');

  await page.goto('/login');
  await page.screenshot({ path: path.join(screenshotDir, 'login-page.png'), fullPage: true });

  await page.goto('/register');
  await page.getByPlaceholder('Иван Петров').fill('Новый Сметчик');
  await page.getByPlaceholder('user@santehmontazh.local').fill(`new-estimator-${Date.now()}@santehmontazh.local`);
  await page.getByPlaceholder('Минимум 8 символов').fill('User12345!');
  await page.getByRole('button', { name: 'Зарегистрироваться' }).click();
  await expect(page).toHaveURL(/dashboard/);

  await page.evaluate(() => localStorage.clear());
  await login(page, estimator.email, estimator.password);
  await expect(page).toHaveURL(/dashboard/);
  await page.screenshot({ path: path.join(screenshotDir, 'dashboard-page.png'), fullPage: true });

  await page.goto('/projects');
  await page.screenshot({ path: path.join(screenshotDir, 'projects-page.png'), fullPage: true });

  await page.goto('/estimates');
  await page.screenshot({ path: path.join(screenshotDir, 'estimate-page.png'), fullPage: true });

  await page.goto('/purchases');
  await page.screenshot({ path: path.join(screenshotDir, 'purchase-page.png'), fullPage: true });

  await page.goto('/suppliers');
  await page.screenshot({ path: path.join(screenshotDir, 'suppliers-page.png'), fullPage: true });

  await page.evaluate(() => localStorage.clear());
  await login(page, admin.email, admin.password);
  await page.goto('/reports/deviations');
  await page.screenshot({ path: path.join(screenshotDir, 'deviations-page.png'), fullPage: true });

  await page.goto('/admin/users');
  await page.screenshot({ path: path.join(screenshotDir, 'admin-users-page.png'), fullPage: true });
});
