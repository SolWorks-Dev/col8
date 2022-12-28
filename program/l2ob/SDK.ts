import { Program } from "@project-serum/anchor";
import { L2ob } from "./target/types/l2ob";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { BN } from "bn.js";

export type Decimal = {
  value: number;
  exponent: number;
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
        new BN(
          minimumSizeIncrement.value * 10 ** minimumSizeIncrement.exponent
        ),
        new BN(
          minimumPriceIncrement.value * 10 ** minimumPriceIncrement.exponent
        ),
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
}
