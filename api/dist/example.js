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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
(() => __awaiter(void 0, void 0, void 0, function* () {
    const API_KEY = process.env.API_KEY;
    const COLLECTION_NAME = "DEGODS";
    const COLLECTION_MINT = "6XxjKYFbcndh2gDcsUrmZgVEsoDxXMnfsaGY6fpTJzNr";
    const LAMPORTS_PER_SOL = 1000000000;
    const url = `https://api.helius.xyz/v1/active-listings?api-key=${API_KEY}`;
    const { data } = yield axios_1.default.post(url, {
        query: {
            "verifiedCollectionAddresses": [COLLECTION_MINT]
        }
    });
    const listings = data.result;
    console.log(JSON.stringify(listings.filter(x => x.activeListings[0].amount < (400 * LAMPORTS_PER_SOL)), null, 2));
    // map data to listings
    const mappedListings = listings.map((listing) => {
        return {
            price: Math.round((listing.activeListings[0].amount / LAMPORTS_PER_SOL)),
            size: 1,
        };
    });
    // collapse bids to levels
    const levels = [];
    for (const listing of mappedListings) {
        const level = levels.find((level) => level.price === listing.price);
        if (level) {
            level.size += listing.size;
        }
        else {
            levels.push(listing);
        }
    }
    // sort levels
    const firstListings = levels
        .sort((a, b) => b.price - a.price)
        .slice(-8);
    // create virtual orderbook
    const orderbook = {
        name: `${COLLECTION_NAME}-SOL`,
        mint: COLLECTION_MINT,
        createdAt: new Date().toISOString(),
        asks: [],
        bids: firstListings,
    };
    // console.log(orderbook);
}))();
