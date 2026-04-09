/* global process */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const usersFile = path.resolve(process.cwd(), '../product-api/users.txt');
const screenshotDir = path.resolve(process.cwd(), 'artifacts/screenshots');
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

function readUsers() {
  const content = fs.readFileSync(usersFile, 'utf8').trim().split('\n');
  return content.map((line) => {
    const parts = Object.fromEntries(line.split(';').map((item) => item.trim().split('=')));
    return parts;
  });
}

async function login(page, email, password) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByPlaceholder('Минимум 8 символов').fill(password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await expect(page).toHaveURL(/dashboard/);
}

async function logout(page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.context().clearCookies();
}

async function capture(page, name) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(700);
  await page.screenshot({
    path: path.join(screenshotDir, name),
    fullPage: true,
  });
}

async function apiLogin(request, email, password) {
  const response = await request.post(`${baseURL}/api/auth/login`, {
    data: { email, password },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  return payload.token;
}

async function apiGet(request, token, resourcePath) {
  const response = await request.get(`${baseURL}${resourcePath}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function activatePremium(page) {
  await page.goto('/checkout?plan=enterprise&period=month');
  await page.getByLabel('Компания').fill('ООО САНТЕХМОНТАЖ');
  await page.getByLabel('Email для подписки').fill('estimator@santehmontazh.local');
  await page.getByLabel('Владелец карты').fill('IVAN PETROV');
  await page.getByLabel('Номер карты').fill('4111111111111111');
  await page.getByLabel('Срок действия').fill('12/30');
  await page.getByLabel('CVC').fill('123');
  await capture(page, '08-checkout-page.png');
  await page.getByRole('button', { name: /Активировать подписку/ }).click();
  await expect(page).toHaveURL(/dashboard/);
}

test.beforeAll(() => {
  fs.rmSync(screenshotDir, { recursive: true, force: true });
  fs.mkdirSync(screenshotDir, { recursive: true });
});

test('полный комплект продуктовых скриншотов', async ({ page, request }) => {
  test.setTimeout(180000);
  const users = readUsers();
  const admin = users.find((user) => user.role === 'ADMIN');
  const estimator = users.find((user) => user.email === 'estimator@santehmontazh.local');
  const purchaser = users.find((user) => user.email === 'purchaser@santehmontazh.local');

  await page.goto('/');
  await capture(page, '01-landing-page.png');

  await page.goto('/pricing');
  await capture(page, '02-pricing-page.png');

  await page.goto('/login');
  await capture(page, '03-login-page.png');

  await page.goto('/register');
  await capture(page, '04-register-page.png');

  await login(page, purchaser.email, purchaser.password);
  await page.goto('/suppliers');
  await capture(page, '05-suppliers-premium-locked.png');
  await page.goto('/reports/deviations');
  await capture(page, '06-reports-premium-locked.png');
  await logout(page);

  await login(page, estimator.email, estimator.password);
  await capture(page, '07-dashboard-page.png');
  await activatePremium(page);

  const estimatorToken = await apiLogin(request, estimator.email, estimator.password);
  const projects = await apiGet(request, estimatorToken, '/api/projects');
  const estimates = await apiGet(request, estimatorToken, '/api/estimates');
  const materials = await apiGet(request, estimatorToken, '/api/materials');
  const suppliers = await apiGet(request, estimatorToken, '/api/suppliers');

  const firstProject = projects[0];
  const firstEstimate = estimates.find((entry) => entry.projectId === firstProject.id) ?? estimates[0];
  const firstEstimateItem = firstEstimate.items[0];
  const firstMaterial = materials[0];
  const firstSupplier = suppliers[0];

  await page.goto('/projects');
  await capture(page, '09-projects-page.png');

  await page.goto('/projects/new');
  await capture(page, '10-project-create-page.png');

  await page.goto(`/projects/${firstProject.id}`);
  await capture(page, '11-project-details-page.png');

  await page.goto('/estimates');
  await capture(page, '12-estimates-page.png');

  await page.goto(`/estimates/${firstEstimate.id}`);
  await capture(page, '13-estimate-details-page.png');

  await page.goto(`/estimates/${firstEstimate.id}/items/${firstEstimateItem.id}`);
  await capture(page, '14-estimate-item-details-page.png');

  await page.goto('/materials');
  await capture(page, '15-materials-page.png');

  await page.goto(`/materials/${firstMaterial.id}`);
  await capture(page, '16-material-details-page.png');

  await page.goto('/suppliers');
  await capture(page, '17-suppliers-page.png');

  await page.goto(`/suppliers/${firstSupplier.id}`);
  await capture(page, '18-supplier-details-page.png');

  await page.goto('/reports/deviations');
  await capture(page, '19-reports-page.png');

  await logout(page);
  await login(page, admin.email, admin.password);
  await page.goto('/admin/users');
  await capture(page, '20-admin-users-page.png');
});
