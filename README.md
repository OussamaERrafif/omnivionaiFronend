# front

Front-end repository

## Billing System

This application includes a complete billing system powered by Lemon Squeezy. The billing system provides:

- Multiple subscription plans (Free, Pro, Enterprise)
- Secure payment processing
- Webhook handling for subscription events
- Plan upgrade/downgrade functionality
- Quota management and enforcement

### Setup

1. Create a Lemon Squeezy account at [lemonsqueezy.com](https://lemonsqueezy.com)
2. Create products for each plan (Pro, Enterprise) with monthly and yearly variants
3. Copy the required environment variables from `.env.example` to your `.env.local`
4. Configure webhooks in Lemon Squeezy to point to `/api/lemonsqueezy/webhook`

### Features

- **Billing Modal**: Beautiful modal for plan selection and upgrades
- **Quota Exceeded Dialog**: Automatically shown when users hit their limits
- **Payment Success Page**: Confirmation page after successful payment
- **Webhook Processing**: Automatic subscription status updates
- **API Routes**: Secure checkout session creation

### Environment Variables

See `.env.example` for all required Lemon Squeezy configuration variables.

### Webhook Events Handled

- `order_created`: Updates user subscription on successful payment
- `subscription_created`: Handles subscription creation
- `subscription_updated`: Handles plan changes and pauses
- `subscription_cancelled`: Downgrades to free plan
- `subscription_expired`: Handles expired subscriptions
