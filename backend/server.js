const express = require('express');
const cors = require('cors');
const { getConfig, setConfig } = require('./config');
const { scrapeF2F } = require('./scrapers/f2f_scraper');
const { scrapeWIZ } = require('./scrapers/wiz_scraper');
const { scrape401G } = require('./scrapers/g401_scraper');
const { calculateDeckCost } = require('./analysis');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow frontend to communicate with backend
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    credentials: true
}));

app.use(express.json()); // Middleware to parse JSON bodies, crucial for POST requests

app.get('/api/config', (req, res) => {
    res.json(getConfig());
});

app.put('/api/config', (req, res) => {
    const newConfig = req.body;
    const updatedConfig = setConfig(newConfig);
    res.json({ message: 'Configuration updated', config: updatedConfig });
});

app.post('/api/scrape/quick', async (req, res) => {
    const { cardName } = req.body;
    const currentConfig = getConfig();

    if (!cardName) {
        return res.status(400).json({ error: 'cardName is required' });
    }
    try {
        console.log(`Initiating quick scrape for: ${cardName}`);
        let allResults = [];
        const scraperPromises = [];

        if (currentConfig.IS_F2F_SCRAPE) {
            scraperPromises.push(scrapeF2F(cardName, currentConfig).catch(e => { console.error("F2F Error:", e); return []; }));
        }
        if (currentConfig.IS_WIZ_SCRAPE) {
            scraperPromises.push(scrapeWIZ(cardName, currentConfig).catch(e => { console.error("WIZ Error:", e); return []; }));
        }
        if (currentConfig.IS_401_SCRAPE) {
            scraperPromises.push(scrape401G(cardName, currentConfig).catch(e => { console.error("401G Error:", e); return []; }));
        }

        const settledResults = await Promise.all(scraperPromises);
        settledResults.forEach(resultBatch => {
            if (Array.isArray(resultBatch)) {
                allResults = allResults.concat(resultBatch);
            }
        });

        console.log(`Total results for ${cardName}: ${allResults.length}`);
        res.json({ message: `Quick scrape completed for: ${cardName}`, data: allResults });
    } catch (error) {
        console.error('Scraping error in route /api/scrape/quick:', error);
        res.status(500).json({ error: 'Failed to scrape card data' });
    }
});

app.post('/api/scrape/full', async (req, res) => {
    const { cardList } = req.body;
    const currentConfig = getConfig();

    if (!cardList || !Array.isArray(cardList) || cardList.length === 0) {
        return res.status(400).json({ error: 'cardList (array of strings) is required' });
    }

    console.log(`Initiating full scrape for ${cardList.length} cards.`);
    let allScrapedData = [];
    for (const cardName of cardList) {
        console.log(`Full scrape: Processing card "${cardName}"`);
        const scraperPromises = [];
        if (currentConfig.IS_F2F_SCRAPE) {
            scraperPromises.push(scrapeF2F(cardName, currentConfig).catch(e => { console.error(`F2F Error for ${cardName}:`, e); return []; }));
        }
        if (currentConfig.IS_WIZ_SCRAPE) {
            scraperPromises.push(scrapeWIZ(cardName, currentConfig).catch(e => { console.error(`WIZ Error for ${cardName}:`, e); return []; }));
        }
        if (currentConfig.IS_401_SCRAPE) {
            scraperPromises.push(scrape401G(cardName, currentConfig).catch(e => { console.error(`401G Error for ${cardName}:`, e); return []; }));
        }

        const settledResults = await Promise.all(scraperPromises);
        settledResults.forEach(resultBatch => {
            if (Array.isArray(resultBatch)) {
                allScrapedData = allScrapedData.concat(resultBatch);
            }
        });
    }
    console.log(`Full scrape completed. Total items found: ${allScrapedData.length}`);
    res.json({ message: 'Full scrape processed.', data: allScrapedData });
});

// New endpoint for deck cost analysis
app.post('/api/analyze/deck-cost', (req, res) => {
    const { cardData } = req.body; // Expects an array of card objects named cardData

    if (!cardData || !Array.isArray(cardData)) {
        return res.status(400).json({ error: 'cardData (array of card objects) is required in the request body.' });
    }

    try {
        const analysisResult = calculateDeckCost(cardData);
        res.json(analysisResult);
    } catch (error) {
        console.error('Error in deck cost analysis:', error);
        res.status(500).json({ error: 'Failed to analyze deck cost.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});