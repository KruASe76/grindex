import {expect, test} from '@playwright/test';

test.describe('Multi-User Interaction', () => {
    test('should allow a second user to join a room and view admin/leaderboard', async ({browser}) => {
        // userA (admin)
        const contextA = await browser.newContext();
        const pageA = await contextA.newPage();
        const userA = {email: `userA-${Date.now()}@example.com`, password: 'password123', name: 'User A'};

        // register (A)
        await pageA.goto('http://localhost:5173/register');
        await pageA.getByLabel('Full Name:').fill(userA.name);
        await pageA.getByLabel('Email:').fill(userA.email);
        await pageA.getByLabel('Password:', {exact: true}).fill(userA.password);
        await pageA.getByLabel('Confirm Password:').fill(userA.password);
        await pageA.getByRole('button', {name: /Register/i}).click();
        await expect(pageA).toHaveURL(/\/dashboard/, {timeout: 15000});

        // create room (A)
        await pageA.goto('http://localhost:5173/rooms');
        const roomName = `Multi User Room ${Date.now()}`;
        await pageA.getByLabel('Name').fill(roomName);
        await pageA.getByRole('button', {name: /Create/i}).click();
        await pageA.waitForTimeout(2000);
        await expect(pageA.getByText(roomName).first()).toBeVisible({timeout: 10000});

        // enter room (A) to ensure it is ready and get URL
        await pageA.getByText(roomName).first().click();
        await expect(pageA).toHaveURL(/\/rooms\/.+/);
        const roomUrl = pageA.url();

        // userB (another member)
        const contextB = await browser.newContext();
        const pageB = await contextB.newPage();
        const userB = {email: `userB-${Date.now()}@example.com`, password: 'password123', name: 'User B'};

        // register B
        await pageB.goto('http://localhost:5173/register');
        await pageB.getByLabel('Full Name:').fill(userB.name);
        await pageB.getByLabel('Email:').fill(userB.email);
        await pageB.getByLabel('Password:', {exact: true}).fill(userB.password);
        await pageB.getByLabel('Confirm Password:').fill(userB.password);
        await pageB.getByRole('button', {name: /Register/i}).click();
        await expect(pageB).toHaveURL(/\/dashboard/, {timeout: 15000});

        // join room (B)
        await pageB.goto(roomUrl);

        // verify userB sees userA as admin
        await expect(pageB.getByText(userA.name)).toBeVisible();
        // label 'Room Admin' === crown icon
        await expect(pageB.getByLabel('Room Admin')).toBeVisible();

        // verify room view access
        await expect(pageB.getByRole('button', {name: /Leaderboard/i})).toBeVisible();

        await contextA.close();
        await contextB.close();
    });
});
