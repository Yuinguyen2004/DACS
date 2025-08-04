# PayPal Configuration Guide

## Environment Variables Required

Add these environment variables to your `.env` file:

```bash
# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com  # For sandbox
# PAYPAL_API_BASE=https://api-m.paypal.com        # For production

# PayPal Return URLs (optional - if not set, frontend will handle)
PAYPAL_RETURN_URL_SUCCESS=http://localhost:3001/payment/paypal/success
PAYPAL_RETURN_URL_CANCEL=http://localhost:3001/payment/paypal/cancel
```

## How to get PayPal Credentials

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Log in with your PayPal account
3. Click "Create App"
4. Choose "Default Application" 
5. Select "Sandbox" for testing or "Live" for production
6. Copy the Client ID and Client Secret

## API Endpoints Added

1. **POST** `/api/v1/payments/paypal/create-payment` - Create PayPal order
2. **POST** `/api/v1/payments/paypal/capture-payment` - Capture payment
3. **GET** `/api/v1/payments/paypal/cancel` - Handle cancelled payments
4. **POST** `/api/v1/payments/paypal/webhook` - PayPal webhook handler

## Workflow

1. Frontend calls `create-payment` with packageId
2. Backend creates PayPal order and returns approval URL
3. User completes payment on PayPal
4. Frontend calls `capture-payment` with orderId
5. Backend captures the payment and updates status

## Testing

Use the `test-paypal-endpoints.http` file to test the endpoints.

## Notes

- PayPal uses Orders API v2 (modern approach)
- All amounts are in USD
- Payment status is automatically updated after successful capture
- Webhook verification is placeholder - implement proper verification for production