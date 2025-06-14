const playwright = require('playwright');
const { CardCondition } = require('../data_structures');
const { findCardFrame } = require('./utils');

// Helper to map F2F condition strings to CardCondition enum
function mapF2FCondition(conditionStr) {
    if (!conditionStr) return CardCondition.UNKNOWN;
    const cond = conditionStr.toUpperCase();
    if (cond === "NM") return CardCondition.NM;
    if (cond === "PL") return CardCondition.MP;
    if (cond === "HP") return CardCondition.HP;
    if (cond === "SP") return CardCondition.SP;
    return CardCondition.UNKNOWN;
}

async function scrapeF2F(searchCardName, currentConfig) {
    console.log(`[F2F Scraper] Searching for: ${searchCardName}`);
    const results = [];
    let browser = null;

    try {
        browser = await playwright.chromium.launch({ 
            headless: true,
            timeout: 30000
        });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        const page = await context.newPage();

        const searchUrl = `https://www.facetofacegames.com/search/?keyword=${encodeURIComponent(searchCardName)}&general%20brand=Magic%3A%20The%20Gathering`;
        console.log(`[F2F Scraper] Navigating to: ${searchUrl}`);

        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Wait a bit for dynamic content to load
        await page.waitForTimeout(2000);
        
        // Debug: Check what's actually on the page
        const pageTitle = await page.title();
        console.log(`[F2F Scraper] Page title: ${pageTitle}`);
        
        // Try multiple possible selectors for search results
        const possibleSelectors = [
            '.hawk-results__action-stockPrice',
            '.hawk-results-item',
            '.hawk-results-item__inner',
            '.search-result',
            '.product-item',
            '[data-product]'
        ];
        
        let foundSelector = null;
        for (const selector of possibleSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 3000 });
                foundSelector = selector;
                console.log(`[F2F Scraper] Found results using selector: ${selector}`);
                break;
            } catch (e) {
                console.log(`[F2F Scraper] Selector '${selector}' not found`);
            }
        }
        
        if (!foundSelector) {
            console.log(`[F2F Scraper] No results found. Page might have no search results or different structure.`);
            
            // Debug: Save page content to see what we're dealing with
            const bodyText = await page.textContent('body');
            if (bodyText.toLowerCase().includes('no results') || bodyText.toLowerCase().includes('no products')) {
                console.log(`[F2F Scraper] Page indicates no results for "${searchCardName}"`);
            } else {
                console.log(`[F2F Scraper] Page content length: ${bodyText.length} characters`);
                // Log first 500 characters to debug
                console.log(`[F2F Scraper] Page preview: ${bodyText.substring(0, 500)}...`);
            }
            return results;
        }

        // Use the original selector pattern but with better error handling
        let itemHandles;
        try {
            itemHandles = await page.$$('.hawk-results-item__inner');
            if (itemHandles.length === 0) {
                // Try alternative selectors
                itemHandles = await page.$$('.product-item, .search-result-item, [data-product-id]');
            }
        } catch (e) {
            console.log(`[F2F Scraper] Error getting item handles: ${e.message}`);
            return results;
        }
        
        console.log(`[F2F Scraper] Found ${itemHandles.length} product items`);

        for (let i = 0; i < itemHandles.length; i++) {
            const itemHandle = itemHandles[i];
            try {
                // Try to get card name with multiple selectors
                let fullCardName;
                const nameSelectors = [
                    '.hawk-results__hawk-contentTitle',
                    '.product-title',
                    '.card-name',
                    'h3',
                    'h2',
                    '[data-name]'
                ];
                
                for (const nameSelector of nameSelectors) {
                    try {
                        fullCardName = await itemHandle.$eval(nameSelector, el => el.textContent.trim());
                        if (fullCardName) break;
                    } catch (e) {
                        // Try next selector
                    }
                }
                
                if (!fullCardName) {
                    console.log(`[F2F Scraper] Could not find card name for item ${i}`);
                    continue;
                }
                
                const normalizedCardName = fullCardName.replace(/(?:\s*\(.*|\s*-\s*.*)/g, "").trim();
                console.log(`[F2F Scraper] Found card: "${fullCardName}" -> normalized: "${normalizedCardName}"`);

                if (searchCardName.toLowerCase() !== normalizedCardName.toLowerCase()) {
                    continue;
                }

                // Try to get card set
                let cardSet = 'Unknown';
                try {
                    cardSet = await itemHandle.$eval('.hawk-results__hawk-contentSubtitle', el => el.textContent.trim());
                } catch (e) {
                    // Try alternative selectors for set
                    try {
                        cardSet = await itemHandle.$eval('.product-set, .card-set', el => el.textContent.trim());
                    } catch (e2) {
                        console.log(`[F2F Scraper] Could not find set for ${fullCardName}`);
                    }
                }

                const frame = findCardFrame(fullCardName);

                // For now, create a basic result with what we can find
                // We'll add more complex price/condition parsing later
                results.push({
                    card_name: normalizedCardName,
                    card_set: cardSet,
                    condition: CardCondition.UNKNOWN,
                    is_foil: fullCardName.toLowerCase().includes('foil'),
                    retailer: 'F2F',
                    stock: 1, // Assume in stock if we found it
                    price: 0.00, // Placeholder - we'll fix price parsing
                    frame: frame,
                    link: searchUrl
                });

            } catch (error) {
                console.log(`[F2F Scraper] Error processing item ${i}: ${error.message}`);
                continue;
            }
        }

    } catch (error) {
        console.error(`[F2F Scraper] Error scraping ${searchCardName} from F2F:`, error.message);
    } finally {
        if (browser) await browser.close();
    }

    console.log(`[F2F Scraper] Found ${results.length} items for ${searchCardName}`);
    return results;
}

module.exports = { scrapeF2F };