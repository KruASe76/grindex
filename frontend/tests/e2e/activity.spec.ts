import {expect, test} from '@playwright/test';

test.describe('Activity Management', () => {
    const testUser = {
        email: `activity-test-${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Activity Test User',
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

    test('should create a new activity and view it in the list', async ({page}) => {
        const activityName = `Test Activity ${Date.now()}`;

        // create activity
        await page.getByTestId('create-activity-input').fill(activityName);
        await page.getByTestId('create-activity-btn').click();
        await page.waitForTimeout(2000);

        // verify it appears
        await expect(page.locator('[data-testid="activity-card"][data-activity-name="' + activityName + '"]')).toBeVisible({timeout: 20000});
    });

    test('should manually create a time log for an activity', async ({page}) => {
        const activityName = `Log Activity ${Date.now()}`;

        // create activity
        await page.getByTestId('create-activity-input').fill(activityName);
        await page.getByTestId('create-activity-btn').click();
        await page.waitForTimeout(2000);
        const activityCard = page.locator('[data-testid="activity-card"][data-activity-name="' + activityName + '"]');
        await expect(activityCard).toBeVisible({timeout: 20000});

        // open log modal
        await page.waitForTimeout(1000);
        await activityCard.hover();
        await activityCard.getByTitle('Log Time').click({force: true});

        // fill log modal
        await page.getByLabel(/Hours/i).fill('1');
        await page.getByLabel(/Minutes/i).fill('0');
        await page.getByRole('button', {name: /Save/i}).click();

        // verify that the modal is closed, and we are back on dashboard
        await page.waitForTimeout(1000);
        await expect(page.getByTestId('stats-chart').getByText(activityName + '1.0h')).toBeVisible();
    });
});
