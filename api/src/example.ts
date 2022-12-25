import axios from 'axios';
import * as dotenv from 'dotenv'; 
dotenv.config();

interface Listing {
    mint: string;
    name: string;
    firstVerifiedCreator: string;
    verifiedCollectionAddress: string;
    activeListings: {
        transactionSignature: string;
        marketplace: string;
        amount: number;
        seller: string;
    }[];
}

interface MappedListing {
    price: number;
    size: number;
}

(async () => {
    const API_KEY = process.env.API_KEY;
    const COLLECTION_NAME = "DEGODS";
    const COLLECTION_MINT = "6XxjKYFbcndh2gDcsUrmZgVEsoDxXMnfsaGY6fpTJzNr";
    const LAMPORTS_PER_SOL = 1_000_000_000;

    const url = `https://api.helius.xyz/v1/active-listings?api-key=${API_KEY}`;
    const { data } = await axios.post(url, {
        query: {
            "verifiedCollectionAddresses": [COLLECTION_MINT]
        }
    });
    const listings = data.result as Listing[];
    console.log(JSON.stringify(listings.filter(x => x.activeListings[0].amount < (400 * LAMPORTS_PER_SOL)), null, 2));

    // map data to listings
    const mappedListings = listings.map((listing) => {
        return {
            price: Math.round((listing.activeListings[0].amount / LAMPORTS_PER_SOL)),
            size: 1,
        } as MappedListing;
    });

    // collapse bids to levels
    const levels: MappedListing[] = [];
    for (const listing of mappedListings) {
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
})();