"use strict";
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
exports.fetchCurrentSOLPrice = exports.fetchBidEvents = exports.fetchListings = void 0;
const axios_1 = __importDefault(require("axios"));
const index_1 = require("./index");
const fetchListings = (collectionAddress) => __awaiter(void 0, void 0, void 0, function* () {
    const path = "v1/active-listings";
    const url = `${index_1.API_BASE_URL}${path}${index_1.API_SUFFIX}`;
    const { data } = yield axios_1.default.post(url, {
        query: {
            verifiedCollectionAddresses: [collectionAddress],
        },
    });
    return data.result;
});
exports.fetchListings = fetchListings;
const fetchBidEvents = (collectionAddress) => __awaiter(void 0, void 0, void 0, function* () {
    const path = "v1/nft-events";
    const url = `${index_1.API_BASE_URL}${path}${index_1.API_SUFFIX}`;
    const { data } = yield axios_1.default.post(url, {
        query: {
            types: ["NFT_BID", "NFT_BID_CANCELLED"],
            nftCollectionFilters: {
                verifiedCollectionAddress: [collectionAddress],
            },
        },
    });
    return data.result;
});
exports.fetchBidEvents = fetchBidEvents;
const fetchCurrentSOLPrice = () => __awaiter(void 0, void 0, void 0, function* () {
    const url = "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";
    const { data } = yield axios_1.default.get(url);
    return data.solana.usd;
});
exports.fetchCurrentSOLPrice = fetchCurrentSOLPrice;
