"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingsConverter = void 0;
class ListingsConverter {
    constructor() { }
    convertMagicEdenListingsToL2OrderbookLevels({ listings, roundPrice = true, usdcMode = false, solUsdcPrice, }) {
        // map data to listings
        const data = listings.map((listing) => {
            const convertedPrice = usdcMode
                ? listing.price * solUsdcPrice
                : listing.price;
            const roundedPrice = roundPrice
                ? Math.round(convertedPrice)
                : convertedPrice;
            return {
                price: roundedPrice,
                size: listing.tokenSize,
            };
        });
        const levels = [];
        for (const listing of data) {
            const level = levels.find((level) => level.price === listing.price);
            if (level) {
                level.size += listing.size;
            }
            else {
                levels.push(listing);
            }
        }
        return levels;
    }
}
exports.ListingsConverter = ListingsConverter;
