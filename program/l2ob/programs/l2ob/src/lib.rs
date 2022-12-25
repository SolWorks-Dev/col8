use anchor_lang::prelude::*;

declare_id!("3Y7ozqoFGJoM6C4bCFmQEYTPHxT32RxNKo3qUx513p1p");

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
        ctx.accounts.l2_orderbook.create(
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
}

impl L2Orderbook {
    pub const MAXIMUM_SIZE: usize = 32 + 8 + 8 + 16 + 16 + 16 + 8 + 8 + 8 + 8;

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
// total size: 32 + 8 + 8 + 16 + 16 + 16 + 8 + 8 + 1 + 1 = 114
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
}


// Account layouts for instructions
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + L2Orderbook::MAXIMUM_SIZE)]
    pub l2_orderbook: Account<'info, L2Orderbook>,

    #[account(mut)]
    pub authority: Signer<'info>,


    pub system_program: Program<'info, System>
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
