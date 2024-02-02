import { chromium } from 'playwright';

(async () => {
    try {
        const browser = await chromium.connectOverCDP('http://localhost:9222');

        console.log(browser.isConnected() && 'Connected to Chrome.');
        console.log(`Contexts in CDP session: ${browser.contexts().length}.`);

        const context = browser.contexts()[0];

        const page = await context.newPage();
        await page.goto('https://s.salla.sa');
        await page.screenshot({ path: 'example.png' });

        await page.close();
        await context.close();
        await browser.close();
    } catch (error) {
        console.log(error);
    }
})();