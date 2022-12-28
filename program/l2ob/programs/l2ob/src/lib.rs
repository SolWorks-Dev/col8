use anchor_lang::prelude::*;

declare_id!("9yVKseBXmeKibnuV4fBi248c9QcRhkateWrHgNynFSDZ");

// Program entrypoint
#[program]
pub mod l2ob {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        authority: Pubkey,
        market: String,
        base_currency: String,
        quote_currency: String,
        minimum_size_increment: u64,
        minimum_price_increment: u64,
        price_exponent: u8,
        size_exponent: u8,
    ) -> Result<()> {
        ctx.accounts.orderbook.create(
            authority,
            market,
            base_currency,
            quote_currency,
            minimum_size_increment,
            minimum_price_increment,
            price_exponent,
            size_exponent,
        )
    }

    pub fn test(_ctx: Context<Test>) -> Result<()> {
        msg!("Hello, world!");
        Ok(())
    }
}

impl L2Orderbook {
    pub const MAXIMUM_SIZE: usize = 32 + 8 + 8 + 16 + 16 + 16 + 8 + 8 + 1 + 1 + 1024 + 1024;

    pub fn create(
        &mut self,
        authority: Pubkey,
        market: String,
        base_currency: String,
        quote_currency: String,
        minimum_size_increment: u64,
        minimum_price_increment: u64,
        price_exponent: u8,
        size_exponent: u8,
    ) -> Result<()> {
        // check market is non-empty
        require!(!market.is_empty(), CustomError::MarketEmpty);

        // check base_currency is non-emptyΩ
        require!(!base_currency.is_empty(), CustomError::BaseCurrencyEmpty);

        // check quote_currency is non-empty
        require!(!quote_currency.is_empty(), CustomError::QuoteCurrencyEmpty);

        // TODO: check minimum_size_increment is non-zero

        // TODO: check minimum_price_increment is non-zero

        // TODO: check orderbook is not already initialized

        self.authority = authority;
        self.created_at = Clock::get()?.unix_timestamp;
        self.updated_at = Clock::get()?.unix_timestamp;
        self.market_name = market;
        self.base_currency_name = base_currency;
        self.quote_currency_name = quote_currency;
        self.minimum_size_increment = minimum_size_increment;
        self.minimum_price_increment = minimum_price_increment;
        self.price_exponent = price_exponent;
        self.size_exponent = size_exponent;
        self.bids = L2Levels([
            L2Layer {
                price: 0,
                size: 0,
            };
            64
        ]);
        self.asks = L2Levels([
            L2Layer {
                price: 0,
                size: 0,
            };
            64
        ]);

        msg!("L2 Orderbook initialized 🥳");
        Ok(())
    }

    pub fn update_market(&mut self, market: String, base_currency: String, quote_currency: String) -> Result<()> {
        // check market is non-empty
        require!(!market.is_empty(), CustomError::MarketEmpty);

        // check base_currency is non-emptyΩ
        require!(!base_currency.is_empty(), CustomError::BaseCurrencyEmpty);

        // check quote_currency is non-empty
        require!(!quote_currency.is_empty(), CustomError::QuoteCurrencyEmpty);

        self.market_name = market;
        self.base_currency_name = base_currency;
        self.quote_currency_name = quote_currency;
        Ok(())
    }
}

// Data structures
// total size: 32 + 8 + 8 + 16 + 16 + 16 + 8 + 8 + 1 + 1 + 1024 + 1024 = 2164
#[account]
#[derive(Default)]
pub struct L2Orderbook {
    // size = 32
    pub authority: Pubkey,
    
    // size = 4 + max string size in bytes = 16
    pub market_name: String,

    // size = 4 + max string size in bytes = 16
    pub base_currency_name: String,

    // size = 4 + max string size in bytes = 16
    pub quote_currency_name: String,

    // size = 1
    pub price_exponent: u8,

    // size = 1
    pub size_exponent: u8,
    
    // size = 8
    pub minimum_price_increment: u64,

    // size = 8
    pub minimum_size_increment: u64,

    // size = 8
    pub created_at: i64,

    // size = 8
    pub updated_at: i64,

    // size = support for 64 bid levels = (64 * 16) = 1024
    pub bids: L2Levels,

    // size = support for 64 ask levels = (64 * 16) = 1024
    pub asks: L2Levels,
}

// Account layouts for instructions
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + L2Orderbook::MAXIMUM_SIZE)]
    pub orderbook: Box<Account<'info, L2Orderbook>>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct Test<'info> {
    #[account(mut)]
    pub authority: Signer<'info>
}

// Error codes
#[error_code]
pub enum CustomError {
    #[msg("The market must be non-empty.")]
    MarketEmpty,

    #[msg("The base currency must be non-empty.")]
    BaseCurrencyEmpty,

    #[msg("The quote currency must be non-empty.")]
    QuoteCurrencyEmpty,
}

// total size: 8 + 8 = 16
#[account]
#[derive(Default, Copy)]
pub struct L2Layer {
    // size = 8
    pub price: u64,
    // size = 8
    pub size: u64,
}

#[account]
pub struct L2Levels([L2Layer; 64]);
impl Default for L2Levels {
    fn default() -> Self {
        L2Levels([L2Layer {
            price: 0,
            size: 0,
        }; 64])
    }
}