import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { assert } from "chai";
import { Decimal, SDK } from "../SDK";
import { L2ob } from "../target/types/l2ob";
import { DummyBids } from "./MockData";

describe("l2ob", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.L2Ob as Program<L2ob>;
  const sdk = new SDK(program);

  it("Initialize orderbook", async () => {
    const auth = provider.publicKey;
    const base = "DEGODS";
    const quote = "SOL";
    const market = `${base}-${quote}`;
    const minimumSizeIncrement = 1;
    const sizeExponent = 0;
    const minimumPriceIncrement = 10;
    const priceExponent = -2;

    const { orderbook } = await sdk.initialize({
      admin: auth,
      base,
      quote,
      minimumSizeIncrement: new Decimal(minimumSizeIncrement, sizeExponent),
      minimumPriceIncrement: new Decimal(minimumPriceIncrement, priceExponent),
    });

    const ob = await program.account.l2Orderbook.fetch(orderbook);
    assert.equal(ob.baseCurrencyName, base);
    assert.equal(ob.quoteCurrencyName, quote);
    assert.equal(ob.marketName, market);
    assert.equal(ob.minimumSizeIncrement.toNumber(), minimumSizeIncrement);
    assert.equal(ob.sizeExponent, sizeExponent);
    assert.equal(ob.minimumPriceIncrement.toNumber(), minimumPriceIncrement);
    assert.equal(ob.priceExponent, priceExponent);
    assert.equal(auth.toBase58(), ob.authority.toBase58());
  });

  it("Try initialize orderbook with base name", async () => {
    const auth = provider.publicKey;
    const base = "";
    const quote = "SOL";
    const minimumSizeIncrement = 1;
    const sizeExponent = 0;
    const minimumPriceIncrement = 10;
    const priceExponent = -2;

    try {
      await sdk.initialize({
        admin: auth,
        base,
        quote,
        minimumSizeIncrement: new Decimal(minimumSizeIncrement, sizeExponent),
        minimumPriceIncrement: new Decimal(
          minimumPriceIncrement,
          priceExponent
        ),
      });
      assert.fail("Should have failed");
    } catch {
      assert.ok(true);
    }
  });

  it("Try initialize orderbook with quote name", async () => {
    const auth = provider.publicKey;
    const base = "DEGODS";
    const quote = "";
    const minimumSizeIncrement = 1;
    const sizeExponent = 0;
    const minimumPriceIncrement = 10;
    const priceExponent = -2;

    try {
      await sdk.initialize({
        admin: auth,
        base,
        quote,
        minimumSizeIncrement: new Decimal(minimumSizeIncrement, sizeExponent),
        minimumPriceIncrement: new Decimal(
          minimumPriceIncrement,
          priceExponent
        ),
      });
      assert.fail("Should have failed");
    } catch {
      assert.ok(true);
    }
  });

  it("Update bids", async () => {
    const auth = provider.publicKey;
    const base = "DEGODS";
    const quote = "USDC";
    const minimumSizeIncrement = 1;
    const sizeExponent = 0;
    const minimumPriceIncrement = 1;
    const priceExponent = 0;

    const { orderbook } = await sdk.initialize({
      admin: auth,
      base,
      quote,
      minimumSizeIncrement: new Decimal(minimumSizeIncrement, sizeExponent),
      minimumPriceIncrement: new Decimal(minimumPriceIncrement, priceExponent),
    });

    const bids = DummyBids;
    await sdk.updateBids({
      orderbook,
      bids,
      authority: auth,
      padWithZeroes: true,
    });

    const ob = await program.account.l2Orderbook.fetch(orderbook);

    assert.equal((ob.bids as []).length, 32);
    for (let i = 0; i < bids.length; i++) {
      assert.equal(ob.bids[i][0].toNumber(), bids[i][0]);
      assert.equal(ob.bids[i][1].toNumber(), bids[i][1]);
    }
  });

  it("Update asks", async () => {
    const auth = provider.publicKey;
    const base = "DEGODS";
    const quote = "USDC";
    const minimumSizeIncrement = 1;
    const sizeExponent = 0;
    const minimumPriceIncrement = 1;
    const priceExponent = 0;

    const { orderbook } = await sdk.initialize({
      admin: auth,
      base,
      quote,
      minimumSizeIncrement: new Decimal(minimumSizeIncrement, sizeExponent),
      minimumPriceIncrement: new Decimal(minimumPriceIncrement, priceExponent),
    });

    const asks = DummyBids;
    await sdk.updateAsks({
      orderbook,
      asks,
      authority: auth,
      padWithZeroes: true,
    });

    const ob = await program.account.l2Orderbook.fetch(orderbook);

    assert.equal((ob.asks as []).length, 32);
    for (let i = 0; i < asks.length; i++) {
      assert.equal(ob.asks[i][0].toNumber(), asks[i][0]);
      assert.equal(ob.asks[i][1].toNumber(), asks[i][1]);
    }
  });

  it("Update bids and asks", async () => {
    const auth = provider.publicKey;
    const base = "DEGODS";
    const quote = "USDC";
    const minimumSizeIncrement = 1;
    const sizeExponent = 0;
    const minimumPriceIncrement = 1;
    const priceExponent = 0;

    const { orderbook } = await sdk.initialize({
      admin: auth,
      base,
      quote,
      minimumSizeIncrement: new Decimal(minimumSizeIncrement, sizeExponent),
      minimumPriceIncrement: new Decimal(minimumPriceIncrement, priceExponent),
    });

    const bids = DummyBids;
    const asks = DummyBids;
    await sdk.updateBids({
      orderbook,
      bids,
      authority: auth,
      padWithZeroes: true,
    });
    await sdk.updateAsks({
      orderbook,
      asks,
      authority: auth,
      padWithZeroes: true,
    });

    console.log(JSON.stringify(await sdk.getOrderbook(orderbook)));
    const ob = await program.account.l2Orderbook.fetch(orderbook);

    assert.equal((ob.bids as []).length, 32);
    assert.equal((ob.asks as []).length, 32);

    for (let i = 0; i < bids.length; i++) {
      assert.equal(ob.bids[i][0].toNumber(), bids[i][0]);
      assert.equal(ob.bids[i][1].toNumber(), bids[i][1]);
    }

    for (let i = 0; i < asks.length; i++) {
      assert.equal(ob.asks[i][0].toNumber(), asks[i][0]);
      assert.equal(ob.asks[i][1].toNumber(), asks[i][1]);
    }
  });
});
