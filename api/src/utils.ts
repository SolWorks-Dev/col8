import axios from "axios";
import { Listing } from "./interfaces/Listing";
import { API_BASE_URL, API_SUFFIX } from "./index";

export const fetchListings = async (collectionAddress: string) => {
    const path = "v1/active-listings";
    const url = `${API_BASE_URL}${path}${API_SUFFIX}`;
    const { data } = await axios.post(url, {
        query: {
            verifiedCollectionAddresses: [collectionAddress],
        },
    });
    return data.result as Listing[];
};
export const fetchBidEvents = async (collectionAddress: string) => {
    const path = "v1/nft-events";
    const url = `${API_BASE_URL}${path}${API_SUFFIX}`;
    const { data } = await axios.post(url, {
        query: {
            types: ["NFT_BID", "NFT_BID_CANCELLED"],
            nftCollectionFilters: {
                verifiedCollectionAddress: [collectionAddress],
            },
        },
    });
    return data.result;
};
export const fetchCurrentSOLPrice = async () => {
    const url =
        "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";
    const { data } = await axios.get(url);
    return data.solana.usd;
};