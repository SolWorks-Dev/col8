import { Program } from "@project-serum/anchor";
import { L2ob } from "./target/types/l2ob";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import BN from "bn.js";

export class Decimal {
  value: number;
  exponent: number;
  constructor(value: number, exponent: number) {
    this.value = value;
    this.exponent = exponent;
  }
  getRealValue() {
    return this.value * 10 ** this.exponent;
  }
  getValue() {
    return this.value;
  }
  getExponent() {
    return this.exponent;
  }
}

export type Orderbook = {
  orderbook: PublicKey;
  authority: PublicKey;
  marketName: string;
  baseCurrencyName: string;
  quoteCurrencyName: string;
  minimumSizeIncrement: number;
  sizeExponent: number;
  minimumPriceIncrement: number;
  priceExponent: number;
  createdAt: number;
  updatedAt: number;
  bids: {
    price: number;
    size: number;
  }[];
  asks: {
    price: number;
    size: number;
  }[];
  isInitialized: boolean;
  isDeprecated: boolean;
};

export class SDK {
  private _program: Program<L2ob>;

  constructor(program: Program<L2ob>) {
    this._program = program;
  }

  async initialize({
    admin,
    base,
    quote,
    minimumSizeIncrement,
    minimumPriceIncrement,
  }: {
    admin: PublicKey;
    base: string;
    quote: string;
    minimumSizeIncrement: Decimal;
    minimumPriceIncrement: Decimal;
  }) {
    const orderbookAcc = Keypair.generate();
    const market = `${base}-${quote}`;
    const txId = await this._program.methods
      .initialize(
        admin,
        market,
        base,
        quote,
        new BN(minimumSizeIncrement.value),
        new BN(minimumPriceIncrement.value),
        minimumPriceIncrement.exponent,
        minimumSizeIncrement.exponent
      )
      .accounts({
        orderbook: orderbookAcc.publicKey,
        authority: admin,
        systemProgram: SystemProgram.programId,
      })
      .signers([orderbookAcc])
      .rpc();
    return {
      orderbook: orderbookAcc.publicKey,
      txId,
    };
  }

  async updateBids({
    orderbook,
    bids,
    authority,
    priceExponent,
    sizeExponent,
    padWithZeroes = false,
  }: {
    orderbook: PublicKey;
    bids: number[][];
    authority: PublicKey;
    priceExponent?: number;
    sizeExponent?: number;
    padWithZeroes?: boolean;
  }) {
    // fetch orderbook if priceExponent or sizeExponent is not provided
    if (!priceExponent || !sizeExponent) {
      const ob = await this.getOrderbook(orderbook);
      priceExponent = ob.priceExponent;
      sizeExponent = ob.sizeExponent;
    }

    // pad with zeroes if required
    if (padWithZeroes) {
      bids = this.padWithZeroes(bids);
    }

    // map bids
    const bidsBN = bids.map((bid) => {
      const price = new Decimal(bid[0], priceExponent);
      const size = new Decimal(bid[1], sizeExponent);
      const pair = [price.getRealValue(), size.getRealValue()];
      return [new BN(pair[0]), new BN(pair[1])] as [BN, BN];
    });

    return await this._program.methods
      .updateBids(bidsBN)
      .accounts({
        orderbook,
        authority,
      })
      .rpc();
  }

  async updateBidsIx({
    orderbook,
    bids,
    authority,
    priceExponent,
    sizeExponent,
    padWithZeroes = false,
  }: {
    orderbook: PublicKey;
    bids: number[][];
    authority: PublicKey;
    priceExponent?: number;
    sizeExponent?: number;
    padWithZeroes?: boolean;
  }) {
    // fetch orderbook if priceExponent or sizeExponent is not provided
    if (!priceExponent || !sizeExponent) {
      const ob = await this.getOrderbook(orderbook);
      priceExponent = ob.priceExponent;
      sizeExponent = ob.sizeExponent;
    }

    // pad with zeroes if required
    if (padWithZeroes) {
      bids = this.padWithZeroes(bids);
    }

    // map bids
    const bidsBN = bids.map((bid) => {
      const price = new Decimal(bid[0], priceExponent);
      const size = new Decimal(bid[1], sizeExponent);
      const pair = [price.getRealValue(), size.getRealValue()];
      return [new BN(pair[0]), new BN(pair[1])] as [BN, BN];
    });

    return await this._program.methods
      .updateBids(bidsBN)
      .accounts({
        orderbook,
        authority,
      })
      .instruction();
  }

  async updateAsks({
    orderbook,
    asks,
    authority,
    priceExponent,
    sizeExponent,
    padWithZeroes = false,
  }: {
    orderbook: PublicKey;
    asks: number[][];
    authority: PublicKey;
    priceExponent?: number;
    sizeExponent?: number;
    padWithZeroes?: boolean;
  }) {
    // fetch orderbook if priceExponent or sizeExponent is not provided
    if (!priceExponent || !sizeExponent) {
      const ob = await this.getOrderbook(orderbook);
      priceExponent = ob.priceExponent;
      sizeExponent = ob.sizeExponent;
    }

    // pad with zeroes if required
    if (padWithZeroes) {
      asks = this.padWithZeroes(asks);
    }

    // map asks
    const asksBN = asks.map((ask) => {
      const price = new Decimal(ask[0], priceExponent);
      const size = new Decimal(ask[1], sizeExponent);
      const pair = [price.getRealValue(), size.getRealValue()];
      return [new BN(pair[0]), new BN(pair[1])] as [BN, BN];
    });

    return await this._program.methods
      .updateAsks(asksBN)
      .accounts({
        orderbook,
        authority,
      })
      .rpc();
  }

  async updateAsksIx({
    orderbook,
    asks,
    authority,
    priceExponent,
    sizeExponent,
    padWithZeroes = false,
  }: {
    orderbook: PublicKey;
    asks: number[][];
    authority: PublicKey;
    priceExponent?: number;
    sizeExponent?: number;
    padWithZeroes?: boolean;
  }) {
    // fetch orderbook if priceExponent or sizeExponent is not provided
    if (!priceExponent || !sizeExponent) {
      const ob = await this.getOrderbook(orderbook);
      priceExponent = ob.priceExponent;
      sizeExponent = ob.sizeExponent;
    }

    // pad with zeroes if required
    if (padWithZeroes) {
      asks = this.padWithZeroes(asks);
    }

    // map asks
    const asksBN = asks.map((ask) => {
      const price = new Decimal(ask[0], priceExponent);
      const size = new Decimal(ask[1], sizeExponent);
      const pair = [price.getRealValue(), size.getRealValue()];
      return [new BN(pair[0]), new BN(pair[1])] as [BN, BN];
    });

    return await this._program.methods
      .updateAsks(asksBN)
      .accounts({
        orderbook,
        authority,
      })
      .instruction();
  }

  async getOrderbook(orderbook: PublicKey) {
    const ob = await this._program.account.l2Orderbook.fetch(orderbook);
    const typedBids = (ob.bids as [BN, BN][]).map((bid) => {
      return {
        price: bid[0].toNumber() / 10 ** ob.priceExponent,
        size: bid[1].toNumber() / 10 ** ob.sizeExponent,
      };
    });
    const typedAsks = (ob.asks as [BN, BN][]).map((ask) => {
      return {
        price: ask[0].toNumber() / 10 ** ob.priceExponent,
        size: ask[1].toNumber() / 10 ** ob.sizeExponent,
      };
    });

    const typedOb: Orderbook = {
      orderbook: orderbook,
      authority: ob.authority,
      marketName: ob.marketName,
      baseCurrencyName: ob.baseCurrencyName,
      quoteCurrencyName: ob.quoteCurrencyName,
      minimumSizeIncrement: new Decimal(
        ob.minimumSizeIncrement.toNumber(),
        ob.sizeExponent
      ).getRealValue(),
      sizeExponent: ob.sizeExponent,
      minimumPriceIncrement: new Decimal(
        ob.minimumPriceIncrement.toNumber(),
        ob.priceExponent
      ).getRealValue(),
      priceExponent: ob.priceExponent,
      createdAt: ob.createdAt.toNumber(),
      updatedAt: ob.updatedAt.toNumber(),
      bids: typedBids,
      asks: typedAsks,
      isInitialized: ob.isInitialized,
      isDeprecated: ob.isDeprecated,
    };

    return typedOb;
  }

  padWithZeroes(bidsOrAsks: number[][]) {
    if (bidsOrAsks.length < 32) {
      const zeroes = Array(32 - bidsOrAsks.length).fill([0, 0]);
      return bidsOrAsks.concat(zeroes);
    } else if (bidsOrAsks.length > 32) {
      return bidsOrAsks.slice(0, 32);
    } else {
      return bidsOrAsks;
    }
  }
}
