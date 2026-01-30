import { chromium } from "playwright-core";

// 1. CONFIGURATION & VALIDATION
const TOKEN = process.env.BROWSERLESS_TOKEN;
const USERNAME = process.env.LOGIN_USERNAME;
const PASSWORD = process.env.LOGIN_PASSWORD;

if (!TOKEN) {
  throw new Error("BROWSERLESS_TOKEN is missing.");
}

if (!USERNAME || !PASSWORD) {
  throw new Error("Missing credentials (LOGIN_USERNAME or LOGIN_PASSWORD).");
}

async function runLoginFlow() {
  console.log(`🚀 Connecting to Browserless (CDP)...`);

  // Connect to Browserless using CDP (Matching Test.mjs schema)
  const browser = await chromium.connectOverCDP(
    `wss://production-sfo.browserless.io?token=${TOKEN}`
  );

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log(`✅ Connected. Navigating to login page...`);

    // Helper: Fill Text Inputs (Preserved from your original script for human-like typing)
    async function fillInput(selector, value) {
      if (!value) return;
      const locator = page.locator(selector);
      await locator.waitFor({ state: 'visible', timeout: 10000 });
      await locator.click({ clickCount: 3 }); // Triple click to select all
      await locator.pressSequentially(String(value), { delay: 30 });
    }

    // --- Login Flow ---
    await page.goto('https://jaccess.jclonline.my/JACCESS/login.php', { waitUntil: 'networkidle', timeout: 60000 });

    console.log("✍️  Filling credentials...");
    await fillInput('#login-userid-field', USERNAME);
    await fillInput('#passwordorig', PASSWORD);

    const submitSelector = '#JURIS_LOGIN_SUBMIT';
    await page.waitForSelector(submitSelector, { state: 'visible', timeout: 10000 });

    console.log("ki️  Clicking Login...");
    
    // Wait for navigation and click
    await Promise.all([
      page.waitForLoadState('networkidle', { timeout: 60000 }),
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

  } catch (error) {
    console.error("❌ Automation Error during flow:", error);
    throw error; // Re-throw to be caught by the main catch block
  } finally {
    // Clean up resources (Matching Test.mjs schema)
    console.log("Cleaning up resources...");
    await browser.close();
  }
}

// Execute and catch errors
runLoginFlow().catch(console.error);
