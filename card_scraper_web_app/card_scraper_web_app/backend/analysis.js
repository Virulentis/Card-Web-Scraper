// Functions for analyzing scraped card data

/**
 * Calculates the minimum cost of a deck from a list of scraped card objects.
 * Each card object is expected to have at least 'card_name' and 'price'.
 *
 * @param {Array<Object>} cardList - An array of card objects.
 * @returns {Object} An object containing totalCost and the list of cheapestCards.
 *                   Returns { totalCost: 0, cheapestCards: [] } if input is empty.
 */
function calculateDeckCost(cardList) {
    if (!cardList || cardList.length === 0) {
        return { totalCost: 0, cheapestCards: [], details: "No cards provided." };
    }

    const cardsByName = new Map();

    cardList.forEach(card => {
        if (!card || typeof card.card_name !== 'string' || typeof card.price !== 'number') {
            // console.warn("Skipping invalid card object:", card);
            return; // Skip malformed entries
        }

        const existingCard = cardsByName.get(card.card_name);
        if (!existingCard || card.price < existingCard.price) {
            cardsByName.set(card.card_name, card);
        }
    });

    const cheapestCards = Array.from(cardsByName.values());
    const totalCost = cheapestCards.reduce((sum, card) => sum + card.price, 0);

    return {
        totalCost: parseFloat(totalCost.toFixed(2)),
        cheapestCards: cheapestCards,
        // Providing count for clarity
        uniqueCardCount: cheapestCards.length,
        totalCardsProcessed: cardList.length
    };
}

module.exports = { calculateDeckCost };
