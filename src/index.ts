import { fetchCurrentSOLPrice, fetchListings, fetchBidEvents } from "./utils";
import { L2OrderbookLevels, L2Orderbook } from "./interfaces/L2OrderbookLevels";
import * as dotenv from 'dotenv'; 

dotenv.config();
const USDC_MODE = false;
const COLLECTION_NAME = "SMB";
const COLLECTION_MINT = "SMBH3wF6baUj6JWtzYvqcKuj2XCKWDqQxzspY12xPND";
const MARKET_NAME = `${COLLECTION_NAME}-${USDC_MODE ? "USDC" : "SOL"}`;
const API_KEY = process.env.API_KEY;
export const API_BASE_URL = "https://api.helius.xyz/";
export const API_SUFFIX = `?api-key=${API_KEY}`;
const LAMPORTS_PER_SOL = 1000000000;
const MAX_LEVELS = 8;

(async () => {
    const currentPrice = await fetchCurrentSOLPrice();
    const data = await fetchListings(COLLECTION_MINT);
    const bidEvents = await fetchBidEvents(COLLECTION_MINT);

    // map data to listings
    const listings = data.map((listing) => {
        return {
            price: Math.round(
                (listing.activeListings[0].amount / LAMPORTS_PER_SOL) *
                    (USDC_MODE ? currentPrice : 1)
            ),
            size: 1,
        };
    });

    // collapse bids to levels
    const levels: L2OrderbookLevels = [];
    for (const listing of listings) {
        const level = levels.find((level) => level.price === listing.price);
        if (level) {
            level.size += listing.size;
        } else {
            levels.push(listing);
        }
    }

    // sort levels
    const firstListings = levels
        .sort((a, b) => b.price - a.price)
        .slice(-MAX_LEVELS);

    // sort into list of bids and bids cancelled
    const bids = bidEvents.filter((event: any) => event.type === "NFT_BID");
    const bidsCancelled = bidEvents.filter(
        (event: any) => event.type === "NFT_BID_CANCELLED"
    );

    // map bids
    const bidsMapped = bids.map((bid: any) => {
        return {
            price: Math.round(
                (bid.amount / LAMPORTS_PER_SOL) * (USDC_MODE ? currentPrice : 1)
            ),
            size: 1,
            address: bid.nfts[0].mint,
        };
    });

    // remove bids if cancelled
    // TODO: check ordering by timestamp
    for (const bidCancelled of bidsCancelled) {
        const bid = bidsMapped.find(
            (bid: any) => bid.address === bidCancelled.nfts[0].mint
        );
        if (bid) {
            bidsMapped.splice(bidsMapped.indexOf(bid), 1);
        }
    }

    // collapse bids to levels
    const bidLevels: L2OrderbookLevels = [];
    for (const bid of bidsMapped) {
        const level = bidLevels.find((level) => level.price === bid.price);
        if (level) {
            level.size += bid.size;
        } else {
            bidLevels.push(bid);
        }
    }

    // sort levels
    const firstBids = bidLevels
        .map((x) => {
            return {
                price: x.price,
                size: x.size,
            };
        })
        .sort((a, b) => b.price - a.price)
        .slice(-MAX_LEVELS);

    // create orderbook
    const orderbook: L2Orderbook = {
        name: MARKET_NAME,
        mint: COLLECTION_MINT,
        updatedAt: new Date(),
        asks: firstListings,
        bids: firstBids,
    };

    console.log(JSON.stringify(orderbook, null, 2));
})();
