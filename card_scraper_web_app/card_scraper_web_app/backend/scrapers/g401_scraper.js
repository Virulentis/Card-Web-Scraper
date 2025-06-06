const playwright = require('playwright');
const { CardCondition } = require('../data_structures');
const { findCardFrame } = require('./utils'); // Shared utility

// Ported from scraper_401.py
function cleanString(s) {
    if (!s) return "";
    s = s.replace(/\s*\(.*?\)/g, ''); // Remove content in parentheses
    return s.trim();
}

async function scrape401G(searchCardName, currentConfig) {
    console.log(`[401G Scraper] Searching for: ${searchCardName}`);
    const results = [];
    let browser = null; // Initialize browser to null

    try {
        browser = await playwright.chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36'
        });
        const page = await context.newPage();

        const searchUrl = `https://store.401games.ca/pages/search-results?q=${encodeURIComponent(searchCardName)}&filters=Category,Magic:+The+Gathering+Singles`;

        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        // It seems new 401 games site uses a dynamic grid that might not be just '#products-grid'
        // Waiting for a product card item itself might be more robust.
        await page.waitForSelector('.fs-results-product-card', { timeout: 15000 });

        const productItems = await page.$$('.fs-results-product-card');

        for (const itemHandle of productItems) {
            const fullCardName = await itemHandle.$eval('.fs-product-title', el => el.getAttribute('aria-label') || el.textContent.trim());
            const cleanedCardName = cleanString(fullCardName);

            // Normalize searchCardName in the same way for comparison
            const normalizedSearchCardName = cleanString(searchCardName);

            if (normalizedSearchCardName.toLowerCase() !== cleanedCardName.toLowerCase()) {
                // console.log(`[401G Scraper] Skipping "${cleanedCardName}" (full: "${fullCardName}") as it does not match normalized "${normalizedSearchCardName}"`);
                continue;
            }

            const inStockElement = await itemHandle.$('.in-stock'); // This class indicates in-stock status directly
            const outOfStockElement = await itemHandle.$('.out-of-stock'); // Check for explicit out-of-stock

            let stock = 0;
            if (inStockElement) {
                stock = 1; // Available
            } else if (outOfStockElement) {
                stock = 0; // Explicitly out of stock
            } else {
                // If neither is present, assume out of stock or unable to determine
                stock = 0;
            }

            if (stock === 0 && !currentConfig.ALLOW_OUT_OF_STOCK) {
                // console.log(`[401G Scraper] Skipping ${cleanedCardName} (Stock: ${stock}) due to config`);
                continue;
            }

            let isFoil = false;
            if (fullCardName.toLowerCase().includes("foil")) { // Check full name for "foil"
                 isFoil = true;
            }

            if (isFoil && !currentConfig.ALLOW_FOIL) {
                // console.log(`[401G Scraper] Skipping FOIL item ${cleanedCardName} due to config`);
                continue;
            }

            const cardSetTextElement = await itemHandle.$('.fs-product-vendor');
            let cardSet = '';
            if (cardSetTextElement) {
                 cardSet = (await cardSetTextElement.textContent()).trim();
                 cardSet = cardSet.replace(/Magic: The Gathering Singles/gi, '').replace(/^-/, '').trim();
            }


            const priceTextElement = await itemHandle.$('.price');
            if (!priceTextElement) continue; // Skip if no price element
            const priceText = await priceTextElement.textContent();
            const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));

            const condition = CardCondition.UNKNOWN; // 401 Games condition is not specified on search page
            const frame = findCardFrame(fullCardName);

            const productLinkElement = await itemHandle.$('a.fs-product-card__meta');
            let productLink = searchUrl; // Default to search URL if specific link not found
            if (productLinkElement) {
                const href = await productLinkElement.getAttribute('href');
                if (href) {
                    productLink = href.startsWith('http') ? href : `https://store.401games.ca${href}`;
                }
            }


            results.push({
                card_name: cleanedCardName,
                card_set: cardSet,
                condition: condition,
                is_foil: isFoil,
                retailer: '401G',
                stock: stock,
                price: price,
                frame: frame,
                link: productLink
            });
        }
    } catch (error) {
        console.error(`[401G Scraper] Error scraping ${searchCardName} from 401 Games:`, error);
        if (error.message && error.message.includes("Target closed") ) {
             console.warn(`[401G Scraper] Possible page redirect or closure during scrape for ${searchCardName}`);
        }
    } finally {
        if (browser) await browser.close();
    }

    console.log(`[401G Scraper] Found ${results.length} items for ${searchCardName}`);
    return results;
}

module.exports = { scrape401G };
