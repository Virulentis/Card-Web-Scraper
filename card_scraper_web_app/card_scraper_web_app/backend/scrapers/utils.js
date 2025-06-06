// Shared utility functions for scrapers

function findCardFrame(fullCardName) {
    let res = "";
    const keywords = [
        "extended", "borderless", "promo", "serial numbered",
        "showcase", "oversized", "retro", "chinese", "japanese"
        // Add any other relevant keywords here
    ];
    const lowerCaseName = fullCardName.toLowerCase();

    for (const keyword of keywords) {
        if (lowerCaseName.includes(keyword)) {
            if (res === "") {
                res += keyword;
            } else {
                res += `, ${keyword}`;
            }
        }
    }
    return res;
}

module.exports = { findCardFrame };
