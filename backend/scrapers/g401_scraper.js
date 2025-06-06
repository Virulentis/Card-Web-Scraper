const playwright = require('playwright');
const { CardCondition } = require('../data_structures');
const { findCardFrame } = require('./utils');

function cleanString(s) {
    if (!s) return "";
    s = s.replace(/\s*\(.*?\)/g, ''); // Remove content in parentheses
    return s.trim();
}

async function scrape401G(searchCardName, currentConfig) {
    console.log(`[401G Scraper] Searching for: ${searchCardName}`);
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

        const searchUrl = `https://store.401games.ca/pages/search-results?q=${encodeURIComponent(searchCardName)}&filters=Category,Magic:+The+Gathering+Singles`;
        console.log(`[401G Scraper] Navigating to: ${searchUrl}`);

        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Wait for content to load
        await page.waitForTimeout(3000);
        
        // Debug: Check what's on the page
        const pageTitle = await page.title();
        console.log(`[401G Scraper] Page title: ${pageTitle}`);
        
        // Try multiple possible selectors for search results
        const possibleProductSelectors = [
            '.fs-results-product-card',
            '.product-card',
            '.search-result',
            '.product-item',
            '[data-product]'
        ];
        
        let productItems = [];
        for (const selector of possibleProductSelectors) {
            try {
                productItems = await page.$$(selector);
                if (productItems.length > 0) {
                    console.log(`[401G Scraper] Found ${productItems.length} products using selector: ${selector}`);
                    break;
                }
            } catch (e) {
                console.log(`[401G Scraper] Product selector '${selector}' failed`);
            }
        }
        
        if (productItems.length === 0) {
            console.log(`[401G Scraper] No products found. Checking page content...`);
            const bodyText = await page.textContent('body');
            if (bodyText.toLowerCase().includes('no results') || bodyText.toLowerCase().includes('no products')) {
                console.log(`[401G Scraper] Page indicates no results for "${searchCardName}"`);
            } else {
                console.log(`[401G Scraper] Page content preview: ${bodyText.substring(0, 500)}...`);
            }
            return results;
        }

        for (let i = 0; i < productItems.length; i++) {
            const itemHandle = productItems[i];
            try {
                // Try multiple selectors for card name
                let fullCardName;
                const nameSelectors = [
                    '.fs-product-title',
                    '.product-title',
                    '.card-name',
                    'h3',
                    'h2',
                    '.title'
                ];
                
                for (const nameSelector of nameSelectors) {
                    try {
                        // Try both aria-label and textContent
                        fullCardName = await itemHandle.$eval(nameSelector, el => el.getAttribute('aria-label') || el.textContent.trim());
                        if (fullCardName) {
                            console.log(`[401G Scraper] Found name with selector '${nameSelector}': ${fullCardName}`);
                            break;
                        }
                    } catch (e) {
                        // Try next selector
                    }
                }
                
                if (!fullCardName) {
                    console.log(`[401G Scraper] Could not find card name for item ${i}`);
                    continue;
                }

                const cleanedCardName = cleanString(fullCardName);
                const normalizedSearchCardName = cleanString(searchCardName);
                
                console.log(`[401G Scraper] Processing: "${fullCardName}" -> "${cleanedCardName}"`);

                if (normalizedSearchCardName.toLowerCase() !== cleanedCardName.toLowerCase()) {
                    continue;
                }

                // Check stock status
                let stock = 0;
                const stockSelectors = [
                    '.in-stock',
                    '.out-of-stock',
                    '.stock-status',
                    '.availability'
                ];
                
                for (const stockSelector of stockSelectors) {
                    try {
                        const stockElement = await itemHandle.$(stockSelector);
                        if (stockElement) {
                            const stockText = await stockElement.textContent();
                            if (stockText.toLowerCase().includes('in stock') || stockSelector.includes('in-stock')) {
                                stock = 1;
                            }
                            break;
                        }
                    } catch (e) {
                        // Try next selector
                    }
                }

                if (stock === 0 && !currentConfig.ALLOW_OUT_OF_STOCK) {
                    continue;
                }

                let isFoil = false;
                if (fullCardName.toLowerCase().includes("foil")) {
                    isFoil = true;
                }

                if (isFoil && !currentConfig.ALLOW_FOIL) {
                    continue;
                }

                // Try to get card set
                let cardSet = 'Unknown';
                try {
                    const setSelectors = ['.fs-product-vendor', '.product-vendor', '.card-set'];
                    for (const setSelector of setSelectors) {
                        try {
                            cardSet = await itemHandle.$eval(setSelector, el => el.textContent.trim());
                            if (cardSet) {
                                cardSet = cardSet.replace(/Magic: The Gathering Singles/gi, '').replace(/^-/, '').trim();
                                break;
                            }
                        } catch (e) {
                            // Try next selector
                        }
                    }
                } catch (e) {
                    console.log(`[401G Scraper] Could not find set for ${fullCardName}`);
                }

                // Try to get price
                let price = 0.00;
                try {
                    const priceSelectors = ['.price', '.product-price', '.cost'];
                    for (const priceSelector of priceSelectors) {
                        try {
                            const priceText = await itemHandle.$eval(priceSelector, el => el.textContent);
                            if (priceText) {
                                price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
                                if (!isNaN(price)) break;
                            }
                        } catch (e) {
                            // Try next selector
                        }
                    }
                } catch (e) {
                    console.log(`[401G Scraper] Could not find price for ${fullCardName}`);
                }

                const condition = CardCondition.UNKNOWN;
                const frame = findCardFrame(fullCardName);

                // Try to get product link
                let productLink = searchUrl;
                try {
                    const linkSelectors = ['a.fs-product-card__meta', 'a', '.product-link'];
                    for (const linkSelector of linkSelectors) {
                        try {
                            const href = await itemHandle.$eval(linkSelector, el => el.getAttribute('href'));
                            if (href) {
                                productLink = href.startsWith('http') ? href : `https://store.401games.ca${href}`;
                                break;
                            }
                        } catch (e) {
                            // Try next selector
                        }
                    }
                } catch (e) {
                    console.log(`[401G Scraper] Could not find link for ${fullCardName}`);
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

            } catch (error) {
                console.log(`[401G Scraper] Error processing item ${i}: ${error.message}`);
                continue;
            }
        }

    } catch (error) {
        console.error(`[401G Scraper] Error scraping ${searchCardName} from 401 Games:`, error.message);
        if (error.message && error.message.includes("Target closed")) {
            console.warn(`[401G Scraper] Possible page redirect or closure during scrape for ${searchCardName}`);
        }
    } finally {
        if (browser) await browser.close();
    }

    console.log(`[401G Scraper] Found ${results.length} items for ${searchCardName}`);
    return results;
}

module.exports = { scrape401G };