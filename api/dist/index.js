"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_SUFFIX = exports.API_BASE_URL = void 0;
const utils_1 = require("./utils");
const ListingsConverter_1 = require("./classes/ListingsConverter");
const ListingsManager_1 = require("./classes/ListingsManager");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const USDC_MODE = true;
const COLLECTION_NAME = "DEGODS";
const COLLECTION_MINT = "6XxjKYFbcndh2gDcsUrmZgVEsoDxXMnfsaGY6fpTJzNr";
const MAX_LEVELS = 16;
const MARKET_NAME = `${COLLECTION_NAME}-${USDC_MODE ? "USDC" : "SOL"}`;
const API_KEY = process.env.API_KEY;
exports.API_BASE_URL = "https://api.helius.xyz/";
exports.API_SUFFIX = `?api-key=${API_KEY}`;
const LAMPORTS_PER_SOL = 1000000000;
(() => __awaiter(void 0, void 0, void 0, function* () {
    const currentPrice = yield (0, utils_1.fetchCurrentSOLPrice)();
    // get listings
    const lm = new ListingsManager_1.ListingsManager();
    const listings = yield lm.fetchMagicEdenListings(COLLECTION_NAME);
    const lc = new ListingsConverter_1.ListingsConverter();
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
    const bidEvents = yield (0, utils_1.fetchBidEvents)(COLLECTION_MINT);
    const bids = bidEvents.filter((event) => event.type === "NFT_BID");
    const bidsCancelled = bidEvents.filter((event) => event.type === "NFT_BID_CANCELLED");
    // map bids
    const bidsMapped = bids.map((bid) => {
        return {
            price: Math.round((bid.amount / LAMPORTS_PER_SOL) * (USDC_MODE ? currentPrice : 1)),
            size: 1,
            address: bid.nfts[0].mint,
        };
    });
    // remove bids if cancelled
    // TODO: check ordering by timestamp
    for (const bidCancelled of bidsCancelled) {
        const bid = bidsMapped.find((bid) => bid.address === bidCancelled.nfts[0].mint);
        if (bid) {
            bidsMapped.splice(bidsMapped.indexOf(bid), 1);
        }
    }
    // collapse bids to levels
    const bidLevels = [];
    for (const bid of bidsMapped) {
        const level = bidLevels.find((level) => level.price === bid.price);
        if (level) {
            level.size += bid.size;
        }
        else {
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
    const orderbook = {
        name: MARKET_NAME,
        mint: COLLECTION_MINT,
        updatedAt: new Date(),
        asks: firstListings,
        bids: firstBids,
    };
    console.log(JSON.stringify(orderbook, null, 2));
}))();
