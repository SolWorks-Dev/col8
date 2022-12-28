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
        price_exponent: i8,
        size_exponent: i8,
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
    pub const MAXIMUM_SIZE: usize = 32 + 16 + 16 + 16 + 1 + 1 + 8 + 8 + 8 + 8 + 512 + 512 + 1 + 1;

    pub fn create(
        &mut self,
        authority: Pubkey,
        market: String,
        base_currency: String,
        quote_currency: String,
        minimum_size_increment: u64,
        minimum_price_increment: u64,
        price_exponent: i8,
        size_exponent: i8,
    ) -> Result<()> {
        // check market is non-empty
        require!(!market.is_empty(), CustomError::MarketEmpty);

        // check base_currency is non-empty
        require!(!base_currency.is_empty(), CustomError::BaseCurrencyEmpty);

        // check quote_currency is non-empty
        require!(!quote_currency.is_empty(), CustomError::QuoteCurrencyEmpty);

        // check minimum_size_increment is non-zero
        require!(minimum_size_increment > 0, CustomError::MinimumSizeIncrementZero);

        // check minimum_price_increment is non-zero
        require!(minimum_price_increment > 0, CustomError::MinimumPriceIncrementZero);

        // check orderbook is not already initialized
        require!(!self.is_initialized, CustomError::AlreadyInitialized);

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
        self.bids = [
            [0, 0];
            32
        ];
        self.asks = [
            [0, 0];
            32
        ];
        self.is_initialized = true;
        self.is_deprecated = false;

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
// total size: 32 + 16 + 16 + 16 + 1 + 1 + 8 + 8 + 8 + 8 + 512 + 512 + 1 + 1 = 1140
#[account]
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
    pub price_exponent: i8,

    // size = 1
    pub size_exponent: i8,
    
    // size = 8
    pub minimum_price_increment: u64,

    // size = 8
    pub minimum_size_increment: u64,

    // size = 8
    pub created_at: i64,

    // size = 8
    pub updated_at: i64,

    // size = support for 32 bid levels = (32 * 16) = 1024
    pub bids: [[u64; 2]; 32],

    // size = support for 32 ask levels = (32 * 16) = 1024
    pub asks: [[u64; 2]; 32],

    // size = 1
    pub is_initialized: bool,

    // size = 1
    pub is_deprecated: bool,
}

impl Default for L2Orderbook {
    fn default() -> Self {
        Self {
            authority: Pubkey::default(),
            market_name: String::default(),
            base_currency_name: String::default(),
            quote_currency_name: String::default(),
            minimum_size_increment: 0,
            minimum_price_increment: 0,
            price_exponent: 0,
            size_exponent: 0,
            created_at: 0,
            updated_at: 0,
            bids: [[0, 0]; 32],
            asks: [[0, 0]; 32],
            is_initialized: false,
            is_deprecated: false,
        }
    }
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

    #[msg("The minimum size increment must be non-zero.")]
    MinimumSizeIncrementZero,

    #[msg("The minimum price increment must be non-zero.")]
    MinimumPriceIncrementZero,

    #[msg("The orderbook is already initialized.")]
    OrderbookAlreadyInitialized,
}