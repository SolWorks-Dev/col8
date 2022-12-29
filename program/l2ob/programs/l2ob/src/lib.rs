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

    #[access_control(authorized(&ctx.accounts.orderbook, &ctx.accounts.authority))]
    pub fn update_bids_and_asks(
        ctx: Context<Update>,
        bids: [[u64; 2]; 32],
        asks: [[u64; 2]; 32],
    ) -> Result<()> {        
        ctx.accounts.orderbook.update_bids_and_asks(bids, asks)
    }

    #[access_control(authorized(&ctx.accounts.orderbook, &ctx.accounts.authority))]
    pub fn update_bids(ctx: Context<Update>, bids: [[u64; 2]; 32]) -> Result<()> {        
        ctx.accounts.orderbook.update_bids(bids)
    }

    #[access_control(authorized(&ctx.accounts.orderbook, &ctx.accounts.authority))]
    pub fn update_asks(ctx: Context<Update>, asks: [[u64; 2]; 32]) -> Result<()> {        
        ctx.accounts.orderbook.update_asks(asks)
    }

    #[access_control(authorized(&ctx.accounts.orderbook, &ctx.accounts.authority))]
    pub fn update_market(
        ctx: Context<Update>,
        market: String,
        base_currency: String,
        quote_currency: String,
    ) -> Result<()> {
        ctx.accounts
            .orderbook
            .update_market(market, base_currency, quote_currency)
    }

    #[access_control(authorized(&ctx.accounts.orderbook, &ctx.accounts.authority))]
    pub fn deprecate(ctx: Context<Update>) -> Result<()> {
        ctx.accounts.orderbook.set_deprecated()
    }

    #[access_control(authorized(&ctx.accounts.orderbook, &ctx.accounts.authority))]
    pub fn undeprecate(ctx: Context<Update>) -> Result<()> {
        ctx.accounts.orderbook.set_not_deprecated()
    }

    #[access_control(authorized(&ctx.accounts.orderbook, &ctx.accounts.authority))]
    pub fn transfer_authority(
        ctx: Context<Update>,
        new_authority: Pubkey,
    ) -> Result<()> {

        ctx.accounts.orderbook.transfer_authority(new_authority)
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

        // check base and quote currency are non-empty
        require!(!base_currency.is_empty(), CustomError::BaseCurrencyEmpty);
        require!(!quote_currency.is_empty(), CustomError::QuoteCurrencyEmpty);

        // check minimum_size_increment is non-zero
        require!(
            minimum_size_increment > 0,
            CustomError::MinimumSizeIncrementZero
        );

        // check minimum_price_increment is non-zero
        require!(
            minimum_price_increment > 0,
            CustomError::MinimumPriceIncrementZero
        );

        // check orderbook is not already initialized
        require!(
            !self.is_initialized,
            CustomError::OrderbookAlreadyInitialized
        );

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
        self.bids = [[0, 0]; 32];
        self.asks = [[0, 0]; 32];
        self.is_initialized = true;
        self.is_deprecated = false;

        msg!("L2 Orderbook initialized 🥳");
        Ok(())
    }

    pub fn update_market(
        &mut self,
        market: String,
        base_currency: String,
        quote_currency: String,
    ) -> Result<()> {
        // check market is non-empty
        require!(!market.is_empty(), CustomError::MarketEmpty);

        // check base_currency is non-emptyΩ
        require!(!base_currency.is_empty(), CustomError::BaseCurrencyEmpty);

        // check quote_currency is non-empty
        require!(!quote_currency.is_empty(), CustomError::QuoteCurrencyEmpty);

        // update market name, base and quote currencies
        self.market_name = market;
        self.base_currency_name = base_currency;
        self.quote_currency_name = quote_currency;
        self.updated_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn update_bids_and_asks(
        &mut self,
        bids: [[u64; 2]; 32],
        asks: [[u64; 2]; 32],
    ) -> Result<()> {
        // check bids and asks are correct length
        require!(bids.len() == 32, CustomError::BidsLengthIncorrect);
        require!(asks.len() == 32, CustomError::AsksLengthIncorrect);

        // update bids and asks
        self.bids = bids;
        self.asks = asks;
        self.updated_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn update_bids(&mut self, bids: [[u64; 2]; 32]) -> Result<()> {
        // check bids are correct length
        require!(bids.len() == 32, CustomError::BidsLengthIncorrect);

        // update bids
        self.bids = bids;
        self.updated_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn update_asks(&mut self, asks: [[u64; 2]; 32]) -> Result<()> {
        // check asks are correct length
        require!(asks.len() == 32, CustomError::AsksLengthIncorrect);

        // update asks
        self.asks = asks;
        self.updated_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn set_deprecated(&mut self) -> Result<()> {
        // check orderbook is not already deprecated
        require!(!self.is_deprecated, CustomError::OrderbookAlreadyDeprecated);

        // deprecate orderbook
        self.is_deprecated = true;
        self.updated_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn set_not_deprecated(&mut self) -> Result<()> {
        // TODO: check orderbook is deprecated

        // "un"-deprecate orderbook
        self.is_deprecated = false;
        self.updated_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn transfer_authority(&mut self, authority: Pubkey) -> Result<()> {
        // update authority
        self.authority = authority;
        self.updated_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn update_minimum_size_increment_and_exponent(
        &mut self,
        minimum_size_increment: u64,
        size_exponent: i8,
    ) -> Result<()> {
        // check minimum_size_increment is non-zero
        require!(
            minimum_size_increment > 0,
            CustomError::MinimumSizeIncrementZero
        );

        // update minimum_size_increment and size_exponent
        self.minimum_size_increment = minimum_size_increment;
        self.size_exponent = size_exponent;
        self.updated_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn update_minimum_price_increment_and_exponent(
        &mut self,
        minimum_price_increment: u64,
        price_exponent: i8,
    ) -> Result<()> {
        // check minimum_price_increment is non-zero
        require!(
            minimum_price_increment > 0,
            CustomError::MinimumPriceIncrementZero
        );

        // update minimum_price_increment and price_exponent
        self.minimum_price_increment = minimum_price_increment;
        self.price_exponent = price_exponent;
        self.updated_at = Clock::get()?.unix_timestamp;
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
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut, has_one = authority)]
    pub orderbook: Box<Account<'info, L2Orderbook>>,
    #[account(mut)]
    pub authority: Signer<'info>,
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

    #[msg("The bids array must be 32 levels.")]
    BidsLengthIncorrect,

    #[msg("The asks array must be 32 levels.")]
    AsksLengthIncorrect,

    #[msg("The orderbook is already deprecated.")]
    OrderbookAlreadyDeprecated,

    #[msg("You are not permitted to perform this action.")]
    InvalidAuthority
}

fn authorized(orderbook: &L2Orderbook, signer: &AccountInfo) -> Result<()> {
    require!(signer.key.eq(&orderbook.authority), CustomError::InvalidAuthority);
    Ok(())
}