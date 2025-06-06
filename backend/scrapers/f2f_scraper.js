const playwright = require('playwright');
const { CardCondition } = require('../data_structures');
const { findCardFrame } = require('./utils'); // Added import

// Helper to map F2F condition strings to CardCondition enum
function mapF2FCondition(conditionStr) {
    if (!conditionStr) return CardCondition.UNKNOWN;
    const cond = conditionStr.toUpperCase();
    if (cond === "NM") return CardCondition.NM;
    if (cond === "PL") return CardCondition.MP; // F2F 'PL' seems to map to 'MP' in original
    if (cond === "HP") return CardCondition.HP;
    if (cond === "SP") return CardCondition.SP; // Adding SP if it appears
    return CardCondition.UNKNOWN;
}

async function scrapeF2F(searchCardName, currentConfig) {
    console.log(`[F2F Scraper] Searching for: ${searchCardName}`);
    const results = [];
    let browser = null; // Define browser outside try to ensure it's accessible in finally

    try {
        browser = await playwright.chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36'
        });
        const page = await context.newPage();

        const searchUrl = `https://www.facetofacegames.com/search/?keyword=${encodeURIComponent(searchCardName)}&general%20brand=Magic%3A%20The%20Gathering`;

        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForSelector('.hawk-results__action-stockPrice', { timeout: 15000 });

        const itemHandles = await page.$$('.hawk-results-item__inner');

        for (const itemHandle of itemHandles) {
            const fullCardName = await itemHandle.$eval('.hawk-results__hawk-contentTitle', el => el.textContent.trim());
            const normalizedCardName = fullCardName.replace(/(?:\s*\(.*|\s*-\s*.*)/g, "").trim();

            if (searchCardName.toLowerCase() !== normalizedCardName.toLowerCase()) {
                continue;
            }

            const cardSet = await itemHandle.$eval('.hawk-results__hawk-contentSubtitle', el => el.textContent.trim());
            const frame = findCardFrame(fullCardName); // Now uses imported function

            const conditionsData = await itemHandle.$$eval('[id^="condition_"]', (nodes) =>
                nodes.map(n => ({ id: n.id, value: n.getAttribute('value') }))
            );
            const finishesData = await itemHandle.$$eval('[id^="finish_"]', (nodes) =>
                nodes.map(n => ({ id: n.id, value: n.getAttribute('value') }))
            );

            conditionsData.reverse();
            finishesData.reverse();

            const priceElements = await itemHandle.$$('.hawkPrice');

            for (const priceEl of priceElements) {
                const variantId = await priceEl.getAttribute('data-var-id');
                const priceText = await priceEl.textContent();
                const stockText = await itemHandle.$eval(`.hawkStock[data-var-id="${variantId}"]`, el => el.getAttribute('data-stock-num'));

                const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
                const stock = parseInt(stockText, 10);

                if (!currentConfig.ALLOW_OUT_OF_STOCK && stock === 0) {
                    continue;
                }

                let condition = CardCondition.UNKNOWN;
                if (conditionsData.length > 0) {
                    const condData = conditionsData.pop();
                    if (condData) condition = mapF2FCondition(condData.value);
                }

                let is_foil = false;
                if (finishesData.length > 0) {
                    const finishData = finishesData.pop();
                    if (finishData && finishData.value !== "Non-Foil") {
                        is_foil = true;
                    }
                }

                if (!is_foil && fullCardName.toLowerCase().includes('foil')) {
                    is_foil = true;
                }

                if (!currentConfig.ALLOW_FOIL && is_foil) {
                    continue;
                }

                const cardLinkElement = await itemHandle.$('.hawk-results__hawk-contentTitle > a');
                let link = page.url();
                if (cardLinkElement) {
                    const href = await cardLinkElement.getAttribute('href');
                    if (href) {
                       link = href.startsWith('http') ? href : `https://www.facetofacegames.com${href}`;
                    }
                }

                results.push({
                    card_name: normalizedCardName,
                    card_set: cardSet,
                    condition: condition,
                    is_foil: is_foil,
                    retailer: 'F2F',
                    stock: stock,
                    price: price,
                    frame: frame,
                    link: link
                });
            }
        }
    } catch (error) {
        console.error(`[F2F Scraper] Error scraping ${searchCardName} from F2F:`, error);
    } finally {
        if (browser) await browser.close();
    }

    console.log(`[F2F Scraper] Found ${results.length} items for ${searchCardName}`);
    return results;
}

module.exports = { scrapeF2F }; // findCardFrame removed from exports
