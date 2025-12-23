import {expect, test} from '@playwright/test';

test.describe('Room Management', () => {
    const testUser = {
        email: `room-test-${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Room Test User',
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

    test('should create a new room, add objective, map activity, and view leaderboard', async ({page}) => {
        // create an activity first (for mapping later)
        const activityName = `Room Activity ${Date.now()}`;
        await page.getByTestId('create-activity-input').fill(activityName);
        await page.getByTestId('create-activity-btn').click();
        await page.waitForTimeout(2000);
        await expect(page.locator('[data-testid="activity-card"][data-activity-name="' + activityName + '"]')).toBeVisible({timeout: 20000});

        // create room
        await page.goto('/rooms');
        const roomName = `Test Room ${Date.now()}`;
        await page.getByLabel('Name').fill(roomName);
        await page.getByRole('button', {name: /Create/i}).click();
        await expect(page.getByText(roomName)).toBeVisible();

        // enter room
        await page.getByText(roomName).click();
        await expect(page).toHaveURL(/\/rooms\/.+/);

        // verify admin controls presence
        await expect(page.locator('h1').getByLabel('Room Admin')).toBeVisible();
        await expect(page.getByRole('heading', {name: /Manage Objectives/i})).toBeVisible();
        await expect(page.getByRole('heading', {name: /Manage Members/i})).toBeVisible();

        // add objective
        const objectiveName = 'Test Objective';
        await page.getByPlaceholder(/New Objective Name/i).fill(objectiveName); // in RoomAdminPanel
        await page.getByRole('button', {name: ''}).filter({has: page.locator('svg.lucide-plus')}).click(); // plus icon button
        await expect(page.getByText(objectiveName)).toBeVisible();

        // map activity to the objective
        await page.getByRole('button', {name: /Map Activities/i}).click();
        await page.waitForTimeout(1000);

        await page.locator('select').first().selectOption({label: `📅 ${activityName}`});
        await page.locator('select').nth(1).selectOption({label: '🎯 Test Objective'});

        await page.getByRole('button', {name: /Add/i}).click();
        await page.keyboard.press('Escape'); // close modal (convenience++)
        await page.waitForTimeout(500);

        // verify leaderboard
        await page.getByRole('button', {name: /Leaderboard/i}).click();
        await page.waitForTimeout(5000);
        await expect(page.locator('span[class*="_user_"]').getByText(testUser.fullName)).toBeVisible();
    });
});
