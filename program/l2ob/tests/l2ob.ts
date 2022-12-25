import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { L2ob } from "../target/types/l2ob";

describe("l2ob", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.L2ob as Program<L2ob>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
