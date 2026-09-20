const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 1000));
  
  const landingStyle = await page.$eval('#state-landing', el => window.getComputedStyle(el).display);
  console.log('landing display:', landingStyle);
  
  const heroStyle = await page.$eval('.hero', el => {
      const s = window.getComputedStyle(el);
      return `display: ${s.display}, opacity: ${s.opacity}, visibility: ${s.visibility}, height: ${s.height}, color: ${s.color}`;
  });
  console.log('hero style:', heroStyle);
  
  await browser.close();
})();
