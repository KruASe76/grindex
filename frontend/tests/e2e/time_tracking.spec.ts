import {expect, test} from '@playwright/test';

test.describe('Time Tracking & Live Updates', () => {
    const testUser = {
        email: `time-test-${Date.now()}@example.com`,
        password: 'password123',
        fullName: 'Time Test User',
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

    test('should track time, show live indicators, and save log', async ({browser, page}) => {
        test.setTimeout(180000);

        // create activity
        const activityName = `Tracking Activity ${Date.now()}`;
        await page.getByTestId('create-activity-input').fill(activityName);
        await page.getByTestId('create-activity-btn').click();
        const activityItem = page.locator('[data-testid="activity-card"][data-activity-name="' + activityName + '"]').first();
        await expect(activityItem).toBeVisible({timeout: 20000});

        // create room and objective
        await page.goto('/rooms');
        const roomName = `Live Track Room ${Date.now()}`;
        await page.getByLabel('Name').fill(roomName);
        await page.getByRole('button', {name: /Create/i}).click();
        await expect(page.getByText(roomName).first()).toBeVisible({timeout: 10000});
        await page.getByText(roomName).first().click();
        const roomUrl = page.url();

        await page.getByPlaceholder(/New Objective Name/i).fill('Live Objective');
        await page.getByRole('button', {name: ''}).filter({has: page.locator('svg.lucide-plus')}).click();
        await expect(page.getByText('Live Objective').first()).toBeVisible();

        // map activity
        await page.getByRole('button', {name: /Map Activities/i}).click();
        await expect(page.locator('select').first()).toBeVisible();
        await page.locator('select').first().selectOption({label: `📅 ${activityName}`});
        await page.locator('select').nth(1).selectOption({label: '🎯 Live Objective'});
        await page.getByRole('button', {name: /Add/i}).click();
        await page.keyboard.press('Escape');

        // start tracking
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/dashboard/);
        await expect(activityItem.getByTitle('Start Timer')).toBeVisible({timeout: 10000});
        await activityItem.getByTitle('Start Timer').click({force: true});

        // verify tracking started
        await expect(activityItem.getByTitle('Stop Timer')).toBeVisible({timeout: 10000});

        // second user
        const context2 = await browser.newContext();
        const page2 = await context2.newPage();
        const user2 = {email: `obs-${Date.now()}@example.com`, password: 'password123', name: 'Observer'};

        await page2.goto('/register');
        await page2.getByLabel('Full Name:').fill(user2.name);
        await page2.getByLabel('Email:').fill(user2.email);
        await page2.getByLabel('Password:', {exact: true}).fill(user2.password);
        await page2.getByLabel('Confirm Password:').fill(user2.password);
        await page2.getByRole('button', {name: /Register/i}).click();
        await expect(page2).toHaveURL(/\/dashboard/);

        // join room
        await page2.goto(roomUrl);
        await page2.reload();

        // check member list indicator (ParticipantStatsView)
        await page2.waitForTimeout(5000);
        const userElement = page2.locator('h4').filter({hasText: testUser.fullName});
        await expect(userElement.getByText('●')).toBeVisible({timeout: 15000});

        // check leaderboard indicator
        await page2.getByRole('button', {name: /Leaderboard/i}).click();
        const lbItem = page2.locator('li').filter({hasText: testUser.fullName}).last();
        await expect(lbItem.getByText('●')).toBeVisible({timeout: 15000});

        await context2.close();

        // stop tracking (first user)
        await page.bringToFront();
        await page.goto('/dashboard');
        await expect(activityItem.getByTitle('Stop Timer')).toBeVisible();
        await activityItem.getByTitle('Stop Timer').click({force: true});

        // verify tracking stopped
        await expect(activityItem.getByTitle('Start Timer')).toBeVisible({timeout: 10000});
    });
});
