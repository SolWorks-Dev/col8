// max size = 8 + 8 = 16
interface L2OrderbookLevel {
  // type = u64, size = 8
  price: number;

  // type = u64, size = 8
  size: number;
}

// max size = 16 * 16 = 256
export type L2OrderbookLevels = L2OrderbookLevel[];

// max size = 10 + 32 + 8 + 256 + 256 = 660 bytes
export interface L2Orderbook {
  // type = 10 u8s, size = 10
  name: string;

  // type = Pubkey, size = 32
  mint: string;

  // type = u64, size = 8
  updatedAt: Date;

  // type = L2OrderbookLevels, size = 256
  asks: L2OrderbookLevels;

  // type = L2OrderbookLevels, size = 256
  bids: L2OrderbookLevels;
}
