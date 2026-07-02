const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    defaultViewport: { width: 420, height: 800 }
  });
  
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);

  try {
    // 1. Home Page (Nudge Card)
    console.log('Navigating to Home...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'assets/screenshot_home.png' });

    // 2. Cart Page (Incognito Toggle)
    console.log('Navigating to Cart...');
    await page.goto('http://localhost:3000/cart', { waitUntil: 'networkidle0' });
    // Toggle incognito
    await page.click('.slider');
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'assets/screenshot_cart_incognito.png' });
    
    // Toggle back
    await page.click('.slider');
    await new Promise(r => setTimeout(r, 500));

    // 3. Trigger Anomaly (15 items)
    console.log('Triggering Anomaly...');
    await page.select('select', '15'); 
    await new Promise(r => setTimeout(r, 500));
    
    await page.click('button.btn-add'); // Click Checkout button
    await new Promise(r => setTimeout(r, 1000)); // wait for bottom sheet animation
    
    await page.screenshot({ path: 'assets/screenshot_anomaly_sheet.png' });
    console.log('Screenshots captured successfully.');
  } catch(e) {
    console.error('Error during capture:', e);
  } finally {
    await browser.close();
  }
})();
