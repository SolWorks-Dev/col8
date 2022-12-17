export interface Listing {
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
