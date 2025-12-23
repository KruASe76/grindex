import {expect, test} from '@playwright/test';

test.describe('User Profile', () => {
    const testUser = {
        email: `profile-test-${Date.now()}@example.com`,
        password: 'password123',
        newPassword: 'newpassword456',
        fullName: 'Profile Test User',
    };

    test.beforeEach(async ({page}) => {
        await page.goto('/register');
        await page.getByLabel('Full Name:').fill(testUser.fullName);
        await page.getByLabel('Email:').fill(testUser.email);
        await page.getByLabel('Password:', {exact: true}).fill(testUser.password);
        await page.getByLabel('Confirm Password:').fill(testUser.password);
        await page.getByRole('button', {name: /Register/i}).click();
        await expect(page).toHaveURL(/\/dashboard/, {timeout: 15000});
    });

    test('should change password and login with new credentials', async ({page}) => {
        test.setTimeout(60000);

        await page.goto('/profile');
        await page.getByRole('button', {name: /Change Password/i}).click();

        await page.getByLabel('Old Password').fill(testUser.password);
        await page.getByLabel('New Password', {exact: true}).fill(testUser.newPassword);
        await page.getByLabel('Confirm New Password').fill(testUser.newPassword);

        await page.getByRole('button', {name: /Save|Update/i}).click();

        // expect success message or modal close
        try {
            await expect(page.getByText(/Password changed successfully/i).first()).toBeVisible({timeout: 10000});
        } catch (e) {
            const error = await page.locator('div[class*="error"]').first().textContent().catch(() => null);
            console.log("Password change error:", error);
            await page.waitForTimeout(2000);
            await expect(page.locator('div[class*="error"]').first()).toBeVisible();
            throw e;
        }

        // logout
        await page.getByRole('button', {name: /Logout/i}).click();
        await expect(page).toHaveURL(/\/login/, {timeout: 10000});
        await page.waitForTimeout(3000);

        // login with OLD password (should fail)
        await page.goto('/login');
        await page.getByLabel('Email:').fill(testUser.email);
        await page.getByLabel('Password:').fill(testUser.password);
        await page.getByRole('button', {name: /Login/i}).click();
        await page.waitForTimeout(5000);
        await expect(page.locator('[class*="error"]').first()).toBeVisible();

        // login with NEW password (should succeed)
        await page.getByLabel('Password:').fill(testUser.newPassword);
        await page.getByRole('button', {name: /Login/i}).click();
        await expect(page).toHaveURL(/\/dashboard/, {timeout: 10000});
    });
});
