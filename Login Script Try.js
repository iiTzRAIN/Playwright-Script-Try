const { chromium } = require('playwright');

// 1. CONFIGURATION
const USERNAME = process.env.LOGIN_USERNAME;
const PASSWORD = process.env.LOGIN_PASSWORD;
const TOKEN = process.env.BROWSERLESS_TOKEN;
const BROWSERLESS_URL = process.env.BROWSERLESS_URL || `wss://production-sfo.browserless.io?token=${TOKEN}`;

// 2. HELPER: SESSION CLEANUP
async function closeSession(browser, context) {
  try {
    if (context) {
      console.log("Cleaning up session data...");
      // In Playwright, closing the context automatically clears cookies/storage
      // associated with that context, but we can be explicit if needed.
      await context.clearCookies();
      await context.close();
    }
    if (browser) await browser.close();
  } catch (err) {
    console.error("Cleanup warning:", err.message);
    if (browser) await browser.close();
  }
}

// 3. MAIN EXECUTION
(async () => {
  // --- Validation ---
  if (!USERNAME || !PASSWORD) {
    console.error("❌ Error: Missing credentials (LOGIN_USERNAME, LOGIN_PASSWORD).");
    process.exit(1);
  }

  if (!BROWSERLESS_URL || BROWSERLESS_URL.includes("undefined")) {
    console.error("❌ Error: Missing BROWSERLESS_URL or BROWSERLESS_TOKEN.");
    process.exit(1);
  }

  let browser;
  let context;
  let page;

  try {
    console.log(`🚀 Connecting to Browserless (Playwright)...`);
    
    // Playwright connection
    browser = await chromium.connect(BROWSERLESS_URL);
    
    // Create a fresh context (incognito-like container)
    context = await browser.newContext();
    page = await context.newPage();
    
    console.log(`✅ Connected. Navigating to login page...`);

    // Helper: Fill Text Inputs (Mimicking your original delay logic)
    async function fillInput(selector, value) {
      if (!value) return;
      const locator = page.locator(selector);
      
      // Wait for visibility
      await locator.waitFor({ state: 'visible', timeout: 10000 });
      
      // Triple click to select existing text (cleanup)
      await locator.click({ clickCount: 3 });
      
      // Type with delay to simulate human behavior
      await locator.pressSequentially(String(value), { delay: 30 });
    }

    // --- Login Flow ---
    // 'networkidle' in Playwright is similar to Puppeteer's 'networkidle0'
    await page.goto('https://jaccess.jclonline.my/JACCESS/login.php', { waitUntil: 'networkidle', timeout: 60000 });

    console.log("✍️  Filling credentials...");
    await fillInput('#login-userid-field', USERNAME);
    await fillInput('#passwordorig', PASSWORD);

    const submitSelector = '#JURIS_LOGIN_SUBMIT';
    // Playwright auto-waits, but explicit wait ensures element is ready
    await page.waitForSelector(submitSelector, { state: 'visible', timeout: 10000 });

    console.log("ki️  Clicking Login...");
    
    // Handling Navigation: Pattern is "Wait for event" -> "Trigger event"
    await Promise.all([
      page.waitForLoadState('networkidle', { timeout: 60000 }), // Wait for page to settle
      page.click(submitSelector)
    ]);

    console.log(`🎉 Login Successful for user: ${USERNAME}`);

    // --- Logout Flow ---
    console.log("👋 Initiating Logout...");
    const accountDropdown = '#control-account';
    await page.waitForSelector(accountDropdown, { state: 'visible', timeout: 10000 });
    await page.click(accountDropdown);

    const logoutSelector = 'a[href*="do_logout.php"]';
    await page.waitForSelector(logoutSelector, { state: 'visible', timeout: 5000 });

    await Promise.all([
      page.waitForLoadState('networkidle', { timeout: 30000 }),
      page.click(logoutSelector)
    ]);

    console.log("✅ Logout Complete.");
    process.exit(0);

  } catch (error) {
    console.error(`❌ Automation Failed: ${error.message}`);
    process.exit(1);
  } finally {
    await closeSession(browser, context);
  }
})();
