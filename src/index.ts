import { fetchCurrentSOLPrice, fetchListings, fetchBidEvents } from "./utils";
import { ListingsConverter } from "./classes/ListingsConverter";
import { ListingsManager } from "./classes/ListingsManager";
import { L2OrderbookLevels, L2Orderbook } from "./interfaces/L2OrderbookLevels";
import * as dotenv from 'dotenv'; 

dotenv.config();
const USDC_MODE = true;
const COLLECTION_NAME = "DEGODS";
const COLLECTION_MINT = "6XxjKYFbcndh2gDcsUrmZgVEsoDxXMnfsaGY6fpTJzNr";
const MAX_LEVELS = 16;

const MARKET_NAME = `${COLLECTION_NAME}-${USDC_MODE ? "USDC" : "SOL"}`;
const API_KEY = process.env.API_KEY;
export const API_BASE_URL = "https://api.helius.xyz/";
export const API_SUFFIX = `?api-key=${API_KEY}`;
const LAMPORTS_PER_SOL = 1_000_000_000;

(async () => {
    const currentPrice = await fetchCurrentSOLPrice();

    // get listings
    const lm = new ListingsManager();
    const listings = await lm.fetchMagicEdenListings(COLLECTION_NAME);
    const lc = new ListingsConverter();
    const levels = lc.convertMagicEdenListingsToL2OrderbookLevels({ 
        listings, 
        roundPrice: true,
        usdcMode: USDC_MODE,
        solUsdcPrice: currentPrice
    });
    const firstListings = levels
        .sort((a, b) => b.price - a.price)
        .slice(-MAX_LEVELS);
        
    // sort into list of bids and bids cancelled
    const bidEvents = await fetchBidEvents(COLLECTION_MINT);
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
