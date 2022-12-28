import { Program } from "@project-serum/anchor";
import { L2ob } from "./target/types/l2ob";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import BN from "bn.js";

// class for decimal type
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

  async getOrderbook(orderbook: PublicKey) {
    const ob = await this._program.account.l2Orderbook.fetch(orderbook);
    const typedBids = (ob.bids as [BN, BN][]).map((bid) => {
      return {
        price: bid[0].toNumber() * 10 ** ob.priceExponent,
        size: bid[1].toNumber() * 10 ** ob.sizeExponent,
      };
    });
    const typedAsks = (ob.asks as [BN, BN][]).map((ask) => {
      return {
        price: ask[0].toNumber() * 10 ** ob.priceExponent,
        size: ask[1].toNumber() * 10 ** ob.sizeExponent,
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
}
