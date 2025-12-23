import {expect, test} from '@playwright/test';

test.describe('Authentication Flow', () => {
    test.beforeEach(async ({context}) => {
        await context.clearCookies();
    });

    const testUser = {
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Test User',
    };

    test('should register a new user', async ({page}) => {
        await page.goto('/register');

        await page.getByLabel('Full Name:').fill(testUser.fullName);
        await page.getByLabel('Email:').fill(testUser.email);
        await page.getByLabel('Password:', {exact: true}).fill(testUser.password);
        await page.getByLabel('Confirm Password:').fill(testUser.password);

        await page.getByRole('button', {name: /Register/i}).click();

        await expect(page).toHaveURL(/\/dashboard/, {timeout: 15000});
        await expect(page.getByRole('heading', {name: /My Activities/i})).toBeVisible();
        await expect(page.getByTestId('create-activity-input')).toBeVisible();
    });

    test('should login with existing user', async ({page}) => {
        const loginUser = {
            email: `login-${Date.now()}@example.com`,
            password: 'password123',
            fullName: 'Login User'
        };

        // register the user
        await page.goto('/register');
        await page.getByLabel('Full Name:').fill(loginUser.fullName);
        await page.getByLabel('Email:').fill(loginUser.email);
        await page.getByLabel('Password:', {exact: true}).fill(loginUser.password);
        await page.getByLabel('Confirm Password:').fill(loginUser.password);
        await page.getByRole('button', {name: /Register/i}).click();
        await expect(page).toHaveURL(/\/dashboard/, {timeout: 15000});

        // logout
        await page.getByRole('button', {name: /Logout/i}).click();
        await expect(page).not.toHaveURL(/\/dashboard/);

        // login
        await page.goto('/login');
        await expect(page).toHaveURL(/\/login/);
        await page.getByLabel('Email:').fill(loginUser.email);
        await page.getByLabel('Password:').fill(loginUser.password);
        await page.getByRole('button', {name: /Login/i}).click();

        await expect(page).toHaveURL(/\/dashboard/, {timeout: 20000});
        await expect(page.getByRole('heading', {name: /My Activities/i})).toBeVisible();
        await expect(page.getByTestId('create-activity-input')).toBeVisible();
    });
});
