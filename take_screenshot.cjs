const CDP = require('chrome-remote-interface');
const fs = require('fs');

async function captureScreenshot() {
    let client;
    try {
        console.log('Connecting to Electron CDP on port 9222...');
        client = await CDP({ port: 9222 });

        const { Page } = client;
        await Page.enable();

        console.log('Waiting 3 seconds for React and TLDraw to render...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('Taking screenshot...');
        const { data } = await Page.captureScreenshot({ format: 'png' });
        fs.writeFileSync('test_screenshot.png', Buffer.from(data, 'base64'));

        console.log('Screenshot saved to test_screenshot.png');
    } catch (err) {
        console.error('CDP Error:', err);
    } finally {
        if (client) {
            await client.close();
            console.log('CDP connection closed.');
        }
    }
}

captureScreenshot();