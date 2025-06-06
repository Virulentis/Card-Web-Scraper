const playwright = require('playwright');
const { CardCondition } = require('../data_structures');
const { findCardFrame } = require('./utils'); // Shared utility

// Helper to map WIZ condition strings to CardCondition enum
function mapWIZCondition(conditionStr) {
    if (!conditionStr) return CardCondition.UNKNOWN;
    const cond = conditionStr.toLowerCase();
    if (cond.includes("nm") || cond.includes("near mint")) return CardCondition.NM;
    if (cond.includes("slightly played")) return CardCondition.SP;
    if (cond.includes("moderately played")) return CardCondition.MP;
    if (cond.includes("heavily played")) return CardCondition.HP; // Assuming HP if not others
    return CardCondition.UNKNOWN;
}

async function scrapeWIZ(searchCardName, currentConfig) {
    console.log(`[WIZ Scraper] Searching for: ${searchCardName}`);
    const results = [];
    let browser = null; // Initialize browser to null

    try {
        browser = await playwright.chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36'
        });
        const page = await context.newPage();

        const searchUrl = `https://www.kanatacg.com/products/search?q=${encodeURIComponent(searchCardName)}&c=1`;

        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForSelector('.inner', { timeout: 15000 }); // Main content area

        const productItems = await page.$$('.product.enable-msrp');

        for (const itemHandle of productItems) {
            const fullCardName = await itemHandle.$eval('.name', el => el.textContent.trim());
            // Normalize by removing text in parentheses and anything after " - " (like set name in title)
            const normalizedCardName = fullCardName.replace(/\s*\(.*?\)\s*|\s*-\s*.*/g, "").trim();


            if (searchCardName.toLowerCase() !== normalizedCardName.toLowerCase() || fullCardName.includes("- Art Series")) {
                // console.log(`[WIZ Scraper] Skipping "${fullCardName}" as it does not match "${searchCardName}" or is Art Series.`);
                continue;
            }

            let isItemFoil = false;
            if (fullCardName.toLowerCase().includes("foil")) {
                isItemFoil = true;
            }

            if (isItemFoil && !currentConfig.ALLOW_FOIL) {
                // console.log(`[WIZ Scraper] Skipping FOIL item ${fullCardName} due to config`);
                continue;
            }

            const cardSet = await itemHandle.$eval('.category', el => el.textContent.trim());
            const frame = findCardFrame(fullCardName);
            const productLinkHref = await itemHandle.$eval('.name > a', el => el.getAttribute('href'));
            const productLink = productLinkHref.startsWith('http') ? productLinkHref : `https://www.kanatacg.com${productLinkHref}`;


            const variantRows = await itemHandle.$$('.variant-row.row');
            if (variantRows.length === 0) {
                 const priceTextElement = await itemHandle.$('.price');
                 if (!priceTextElement) continue; // Skip if no price found
                 const priceText = (await priceTextElement.textContent()).trim().replace(/[^0-9.]/g, '');

                 const stockElement = await itemHandle.$('.variant-qty, .qty');
                 let stock = 0;
                 if (stockElement) {
                    const stockText = await stockElement.textContent();
                    if (stockText.toLowerCase().includes("out of stock")) {
                        stock = 0;
                    } else {
                        const stockMatch = stockText.match(/(\d+)/);
                        if (stockMatch) stock = parseInt(stockMatch[1], 10);
                    }
                 }


                 if (!currentConfig.ALLOW_OUT_OF_STOCK && stock === 0) {
                    continue;
                 }

                 let condition = CardCondition.UNKNOWN;
                 // Attempt to derive condition from full name for single-variant items if possible
                 if (fullCardName.toLowerCase().includes("near mint") || fullCardName.toLowerCase().includes("(nm)")) condition = CardCondition.NM;
                 else if (fullCardName.toLowerCase().includes("played") || fullCardName.toLowerCase().includes("(pl)")) condition = CardCondition.MP; // Assuming PL maps to MP
                 else if (fullCardName.toLowerCase().includes("slightly played") || fullCardName.toLowerCase().includes("(sp)")) condition = CardCondition.SP;
                 else if (fullCardName.toLowerCase().includes("heavily played") || fullCardName.toLowerCase().includes("(hp)")) condition = CardCondition.HP;


                 results.push({
                    card_name: normalizedCardName,
                    card_set: cardSet,
                    condition: condition,
                    is_foil: isItemFoil,
                    retailer: 'WIZ',
                    stock: stock,
                    price: parseFloat(priceText),
                    frame: frame,
                    link: productLink
                });

            } else {
                for (const variantHandle of variantRows) {
                    const stockFullText = await variantHandle.$eval('.variant-qty', el => el.textContent.trim());
                    let stock = 0;
                    if (stockFullText.toLowerCase().includes("out of stock")) {
                        stock = 0;
                    } else {
                        const stockMatch = stockFullText.match(/(\d+)/);
                        if (stockMatch) stock = parseInt(stockMatch[1], 10);
                    }

                    if (!currentConfig.ALLOW_OUT_OF_STOCK && stock === 0) {
                        continue;
                    }

                    const conditionText = await variantHandle.$eval('.variant-description', el => el.textContent.trim());
                    const condition = mapWIZCondition(conditionText);

                    let priceText = "";
                    const regularPriceEl = await variantHandle.$('.regular.price');
                    if (regularPriceEl) {
                        priceText = await regularPriceEl.textContent();
                    } else {
                        const noStockPriceEl = await variantHandle.$('.price.no-stock');
                        if (noStockPriceEl) {
                            priceText = await noStockPriceEl.textContent();
                        } else {
                            // console.log(`[WIZ Scraper] Price not found for variant of ${fullCardName}`);
                            continue;
                        }
                    }
                    const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));

                    results.push({
                        card_name: normalizedCardName,
                        card_set: cardSet,
                        condition: condition,
                        is_foil: isItemFoil,
                        retailer: 'WIZ',
                        stock: stock,
                        price: price,
                        frame: frame,
                        link: productLink
                    });
                }
            }
        }
    } catch (error) {
        console.error(`[WIZ Scraper] Error scraping ${searchCardName} from WIZ:`, error);
    } finally {
        if (browser) await browser.close();
    }

    console.log(`[WIZ Scraper] Found ${results.length} items for ${searchCardName}`);
    return results;
}

module.exports = { scrapeWIZ };
