import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { BN } from "bn.js";
import { L2ob } from "../target/types/l2ob";

describe("l2ob", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.L2ob as Program<L2ob>;

  it("Initialize orderbook", async () => {
    const orderbookAcc = anchor.web3.Keypair.generate();
    const auth = (program.provider as anchor.AnchorProvider).wallet;

    const tx = await program.methods
      .initialize(
        auth.publicKey,
        "DEGODS-SOL",
        "DEGODS",
        "SOL",
        new BN(0),
        new BN(0),
        0,
        0
      )
      .accounts({
        l2Orderbook: orderbookAcc.publicKey,
        authority: auth.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("Your transaction signature", tx);

    const ob = await program.account.l2Orderbook.fetch(orderbookAcc.publicKey);
    console.log("Orderbook", ob);
  });
});
