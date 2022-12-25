import axios from "axios";
import { MagicEdenListing } from "../interfaces/MagicEdenListing";

export class ListingsManager {
    constructor() { }

    async fetchMagicEdenListings(collectionName: string) {
        let offset = 0;
        let limit = 20;
        let listings: MagicEdenListing[] = [];
        let hasMore = true;
        while (hasMore) {
            const url = `https://api-mainnet.magiceden.dev/v2/collections/${collectionName.toLowerCase()}/listings?offset=${offset}&limit=${limit}`;
            const { data } = await axios.get(url);
            listings = listings.concat(data);
            offset += limit;
            hasMore = data.length === limit;
        }
        return listings;
    }
}
