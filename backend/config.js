// Backend Configuration

const config = {
    FILENAME: "input.txt", // Default input file, might be handled differently in web version
    OUTPUT_PATH: "results.json", // Default output, likely to be API response, not file
    ALLOW_FOIL: false,
    ALLOW_OUT_OF_STOCK: false,
    IS_F2F_SCRAPE: true,
    IS_WIZ_SCRAPE: true,
    IS_401_SCRAPE: true,
    // OUTPUT_CSV is likely irrelevant for API, but keeping for reference
    // OUTPUT_CSV: false,
};

// Make it mutable for PUT /api/config, though direct module export is cached
let currentConfig = { ...config };

module.exports = {
    getConfig: () => ({ ...currentConfig }), // Return a copy
    setConfig: (newConfig) => {
        // Basic validation/merging logic could be added here
        currentConfig = { ...currentConfig, ...newConfig };
        // Note: This won't persist changes to config.js file itself,
        // it only changes the in-memory representation.
        // Persisting to file would require fs.writeFile.
        return { ...currentConfig };
    }
};
