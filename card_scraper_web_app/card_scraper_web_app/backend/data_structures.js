// Data Structures for MTG Cards

// Enum for Card Condition
const CardCondition = Object.freeze({
    NM: "NM", // Near Mint
    SP: "SP", // Slightly Played
    MP: "MP", // Moderately Played
    HP: "HP", // Heavily Played
    // Adding a general 'PLAYED' for simplicity if condition is not detailed
    PLAYED: "PLAYED",
    // Adding UNKNOWN for cases where condition is not specified (like 401 games)
    UNKNOWN: "UNKNOWN"
});

// Example of how a Card object might look.
// We don't need a strict TypedDict equivalent in JS for this structure,
// plain objects will do. Validation can be done at API boundaries if needed.
/*
interface Card {
    card_name: string;
    card_set: string;
    condition?: CardCondition; // Optional
    is_foil: boolean;
    retailer: string;
    stock: number; // or string like "In Stock" / "Out of Stock" if number not available
    price: number; // Using number for price, ensure consistency (e.g., store in cents or use a Decimal library if precision is critical)
    frame?: string; // Optional
    link: string; // Adding a link to the card page could be useful
    image_url?: string; // Optional, if we can scrape it
}
*/

// We can export CardCondition for use in other modules
module.exports = {
    CardCondition
};

// No explicit Card class or constructor is defined here,
// as plain JavaScript objects are usually sufficient.
// If methods were needed on Card objects, a class would be more appropriate.
EOF
