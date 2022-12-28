import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { assert } from "chai";
import { SDK } from "../SDK";
import { L2ob } from "../target/types/l2ob";

describe("l2ob", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.L2Ob as Program<L2ob>;

  it("Initialize orderbook", async () => {
    const auth = provider.publicKey;
    const base = "DEGODS";
    const quote = "SOL";
    const market = `${base}-${quote}`;
    const minimumSizeIncrement = 1;
    const sizeExponent = 1;
    const minimumPriceIncrement = 0.1;
    const priceExponent = 2;

    const sdk = new SDK(program);
    const {
      orderbook
    } = await sdk.initialize({
      admin: auth,
      base,
      quote,
      minimumSizeIncrement: {
        value: minimumSizeIncrement,
        exponent: sizeExponent,
      },
      minimumPriceIncrement: {
        value: minimumPriceIncrement,
        exponent: priceExponent,
      },
    });

    const ob = await program.account.l2Orderbook.fetch(orderbook);
    console.log(JSON.stringify(ob, null, 2));
    assert.equal(ob.baseCurrencyName, base);
    assert.equal(ob.quoteCurrencyName, quote);
    assert.equal(ob.marketName, market);
    assert.equal(
      ob.minimumSizeIncrement.toNumber(),
      minimumSizeIncrement * 10 ** ob.sizeExponent
    );
    assert.equal(ob.sizeExponent, sizeExponent);
    assert.equal(
      ob.minimumPriceIncrement.toNumber(),
      minimumPriceIncrement * 10 ** ob.priceExponent
    );
    assert.equal(ob.priceExponent, priceExponent);
    assert.equal(auth.toBase58(), ob.authority.toBase58());
  });
});
