const playwright = require('playwright');
const { CardCondition } = require('../data_structures');
const { findCardFrame } = require('./utils');

// Helper to map WIZ condition strings to CardCondition enum
function mapWIZCondition(conditionStr) {
    if (!conditionStr) return CardCondition.UNKNOWN;
    const cond = conditionStr.toLowerCase();
    if (cond.includes("nm") || cond.includes("near mint")) return CardCondition.NM;
    if (cond.includes("slightly played")) return CardCondition.SP;
    if (cond.includes("moderately played")) return CardCondition.MP;
    if (cond.includes("heavily played")) return CardCondition.HP;
    return CardCondition.UNKNOWN;
}

async function scrapeWIZ(searchCardName, currentConfig) {
    console.log(`[WIZ Scraper] Searching for: ${searchCardName}`);
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

        const searchUrl = `https://www.kanatacg.com/products/search?q=${encodeURIComponent(searchCardName)}&c=1`;
        console.log(`[WIZ Scraper] Navigating to: ${searchUrl}`);

        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Wait for content to load
        await page.waitForTimeout(2000);
        
        // Debug: Check what's on the page
        const pageTitle = await page.title();
        console.log(`[WIZ Scraper] Page title: ${pageTitle}`);
        
        // Try multiple possible selectors for the main content area
        const possibleContainerSelectors = [
            '.inner',
            '.content',
            '.main-content',
            '.search-results',
            '.products'
        ];
        
        let foundContainer = false;
        for (const selector of possibleContainerSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 3000 });
                foundContainer = true;
                console.log(`[WIZ Scraper] Found content container: ${selector}`);
                break;
            } catch (e) {
                console.log(`[WIZ Scraper] Container selector '${selector}' not found`);
            }
        }
        
        if (!foundContainer) {
            console.log(`[WIZ Scraper] No content container found`);
        }

        // Try multiple product item selectors
        const possibleProductSelectors = [
            '.product.enable-msrp',
            '.product-item',
            '.product',
            '.search-result',
            '[data-product]'
        ];
        
        let productItems = [];
        for (const selector of possibleProductSelectors) {
            try {
                productItems = await page.$$(selector);
                if (productItems.length > 0) {
                    console.log(`[WIZ Scraper] Found ${productItems.length} products using selector: ${selector}`);
                    break;
                }
            } catch (e) {
                console.log(`[WIZ Scraper] Product selector '${selector}' failed: ${e.message}`);
            }
        }
        
        if (productItems.length === 0) {
            console.log(`[WIZ Scraper] No products found. Checking for "no results" message...`);
            const bodyText = await page.textContent('body');
            if (bodyText.toLowerCase().includes('no results') || bodyText.toLowerCase().includes('no products')) {
                console.log(`[WIZ Scraper] Page indicates no results for "${searchCardName}"`);
            } else {
                console.log(`[WIZ Scraper] Page content preview: ${bodyText.substring(0, 500)}...`);
            }
            return results;
        }

        for (let i = 0; i < productItems.length; i++) {
            const itemHandle = productItems[i];
            try {
                // Try multiple selectors for card name
                let fullCardName;
                const nameSelectors = [
                    '.name',
                    '.product-name',
                    '.card-name',
                    'h3',
                    'h2',
                    '.title'
                ];
                
                for (const nameSelector of nameSelectors) {
                    try {
                        fullCardName = await itemHandle.$eval(nameSelector, el => el.textContent.trim());
                        if (fullCardName) {
                            console.log(`[WIZ Scraper] Found name with selector '${nameSelector}': ${fullCardName}`);
                            break;
                        }
                    } catch (e) {
                        // Try next selector
                    }
                }
                
                if (!fullCardName) {
                    console.log(`[WIZ Scraper] Could not find card name for item ${i}`);
                    continue;
                }

                // Normalize by removing text in parentheses and anything after " - "
                const normalizedCardName = fullCardName.replace(/\s*\(.*?\)\s*|\s*-\s*.*/g, "").trim();
                console.log(`[WIZ Scraper] Processing: "${fullCardName}" -> "${normalizedCardName}"`);

                if (searchCardName.toLowerCase() !== normalizedCardName.toLowerCase() || fullCardName.includes("- Art Series")) {
                    continue;
                }

                let isItemFoil = false;
                if (fullCardName.toLowerCase().includes("foil")) {
                    isItemFoil = true;
                }

                if (isItemFoil && !currentConfig.ALLOW_FOIL) {
                    continue;
                }

                // Try to get card set
                let cardSet = 'Unknown';
                try {
                    cardSet = await itemHandle.$eval('.category', el => el.textContent.trim());
                } catch (e) {
                    try {
                        cardSet = await itemHandle.$eval('.product-set, .set', el => el.textContent.trim());
                    } catch (e2) {
                        console.log(`[WIZ Scraper] Could not find set for ${fullCardName}`);
                    }
                }

                const frame = findCardFrame(fullCardName);
                
                // Try to get product link
                let productLink = searchUrl;
                try {
                    const linkSelectors = ['.name > a', '.product-link', 'a'];
                    for (const linkSelector of linkSelectors) {
                        try {
                            const href = await itemHandle.$eval(linkSelector, el => el.getAttribute('href'));
                            if (href) {
                                productLink = href.startsWith('http') ? href : `https://www.kanatacg.com${href}`;
                                break;
                            }
                        } catch (e) {
                            // Try next selector
                        }
                    }
                } catch (e) {
                    console.log(`[WIZ Scraper] Could not find link for ${fullCardName}`);
                }

                // For now, create basic result - we'll improve price/stock parsing later
                results.push({
                    card_name: normalizedCardName,
                    card_set: cardSet,
                    condition: CardCondition.UNKNOWN,
                    is_foil: isItemFoil,
                    retailer: 'WIZ',
                    stock: 1, // Assume in stock if found
                    price: 0.00, // Placeholder
                    frame: frame,
                    link: productLink
                });

            } catch (error) {
                console.log(`[WIZ Scraper] Error processing item ${i}: ${error.message}`);
                continue;
            }
        }

    } catch (error) {
        console.error(`[WIZ Scraper] Error scraping ${searchCardName} from WIZ:`, error.message);
    } finally {
        if (browser) await browser.close();
    }

    console.log(`[WIZ Scraper] Found ${results.length} items for ${searchCardName}`);
    return results;
}

module.exports = { scrapeWIZ };