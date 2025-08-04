# VNPAY Integration Guide

## Setup Instructions

### 1. Environment Configuration

Copy `.env.example` to `.env` and configure the following VNPAY settings:

```bash
# VNPAY Configuration
VNP_TMNCODE=your-vnpay-terminal-code
VNP_HASH_SECRET=your-vnpay-hash-secret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html  # Sandbox
VNP_API_URL=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction

# Return URLs (update domain as needed)
VNP_RETURN_URL=http://localhost:3000/api/v1/payments/vnpay/return-url
VNP_IPN_URL=http://localhost:3000/api/v1/payments/vnpay/ipn-handler
```

For production, use:
```bash
VNP_URL=https://vnpayment.vn/paymentv2/vpcpay.html
VNP_API_URL=https://vnpayment.vn/merchant_webapi/api/transaction
```

### 2. Database Schema

The system uses the `Payment` collection with the following structure:

```typescript
{
  user_id: ObjectId,           // Reference to User
  package_id: ObjectId,        // Reference to Package
  amount: Number,              // Payment amount in VND
  date: Date,                  // Payment creation date
  status: String,              // 'pending', 'succeeded', 'failed'
  payment_code: String,        // Unique payment identifier (vnp_TxnRef)
  vnp_transaction_no: String,  // VNPAY transaction number
  vnp_response_code: String    // VNPAY response code
}
```

## API Endpoints

### 1. Create Payment URL

**POST** `/api/v1/payments/vnpay/create-url`

**Headers:**
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Body:**
```json
{
  "packageId": "68720081a84bc31c0dfb695f"
}
```

**Response:**
```json
{
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_TxnRef=PAY123...",
  "paymentCode": "PAY68720081a84bc31c0dfb695f_1704295748000"
}
```

### 2. IPN Handler (VNPAY Callback)

**GET** `/api/v1/payments/vnpay/ipn-handler`

This endpoint is called by VNPAY to notify payment status. **Do not call this manually.**

**Response Format:**
```json
{
  "RspCode": "00",
  "Message": "Confirm Success"
}
```

### 3. Return URL Handler

**GET** `/api/v1/payments/vnpay/return-url`

This endpoint handles user returns from VNPAY payment page.

**Response:**
```json
{
  "success": true,
  "message": "Payment successful",
  "paymentCode": "PAY68720081a84bc31c0dfb695f_1704295748000",
  "amount": 100,
  "redirectUrl": "/payment/success"
}
```

### 4. Check Payment Status

**GET** `/api/v1/payments/status/:paymentCode`

**Headers:**
- `Authorization: Bearer <JWT_TOKEN>`

**Response:**
```json
{
  "paymentCode": "PAY68720081a84bc31c0dfb695f_1704295748000",
  "status": "succeeded",
  "amount": 100,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "vnpTransactionNo": "14637509"
}
```

## Usage Flow

1. **User Authentication**: User must be logged in with valid JWT token
2. **Create Payment**: Call create-url endpoint with packageId
3. **Redirect to VNPAY**: Redirect user to the returned paymentUrl
4. **Payment Processing**: User completes payment on VNPAY
5. **IPN Notification**: VNPAY calls IPN handler to update payment status
6. **User Return**: User is redirected back via return-url handler
7. **Status Check**: Frontend can check payment status using status endpoint

## Security Features

- ✅ HMAC-SHA512 signature verification
- ✅ Amount integrity validation
- ✅ Idempotency protection (prevents duplicate processing)
- ✅ User authentication via JWT
- ✅ Input validation with class-validator
- ✅ Comprehensive logging
- ✅ MongoDB ObjectId validation
- ✅ URL-safe OrderInfo formatting (spaces replaced with +)
- ✅ IPv4 address validation and conversion
- ✅ VNPAY date format compliance (yyyyMMddHHmmss)

## Error Handling

### IPN Handler Response Codes:
- `00`: Success
- `01`: Order not found
- `02`: Order already confirmed
- `04`: Invalid amount
- `97`: Invalid checksum
- `99`: Unknown error

### Common Issues:
1. **Invalid signature**: Check VNP_HASH_SECRET configuration
2. **Package not found**: Ensure packageId exists in database
3. **Authentication errors**: Verify JWT token is valid
4. **Amount mismatch**: VNPAY amount doesn't match package price
5. **IP address issues**: System automatically handles IPv6 to IPv4 conversion

### Technical Notes:
- **IP Address Handling**: The system automatically detects and validates client IP addresses:
  - Handles proxy headers (`x-forwarded-for`, `x-real-ip`)
  - Converts IPv6 localhost (`::1`) to IPv4 (`127.0.0.1`)
  - Removes IPv6-mapped IPv4 prefixes (`::ffff:` prefix)
  - Validates IPv4 format and octet ranges (0-255)
  - Falls back to `127.0.0.1` for invalid IPs
- **Date Format**: Generates `vnp_CreateDate` in VNPAY required format:
  - Format: `yyyyMMddHHmmss` (14 digits, no separators)
  - Example: `20250803085918` (2025-08-03 08:59:18)
  - Uses local server time for transaction timestamps

## Testing

Use the provided `test-vnpay-integration.http` file with VS Code REST Client extension:

1. Replace `YOUR_JWT_TOKEN_HERE` with a valid JWT token
2. Replace packageId with a valid MongoDB ObjectId
3. Configure VNPAY credentials in `.env`
4. Test each endpoint sequentially

## Production Checklist

- [ ] Update VNP_URL to production endpoint
- [ ] Configure proper domain for return URLs
- [ ] Set up SSL certificates
- [ ] Configure firewall to allow VNPAY IPs
- [ ] Set up monitoring and alerting
- [ ] Test payment flow end-to-end
- [ ] Implement post-payment business logic (email, subscription activation)

## Support

For VNPAY-specific issues, refer to:
- VNPAY Documentation: https://sandbox.vnpayment.vn/apis/
- VNPAY Support: support@vnpay.vn