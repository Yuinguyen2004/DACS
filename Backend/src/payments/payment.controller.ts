import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  Req,
  Res,
  Logger,
  BadRequestException,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { Response } from 'express';
import { PaymentService } from './payment.service';
import { ZaloPayService } from './zalopay.service';
import { FirebaseAuthGuard, AllowInactiveUser } from '../auth/firebase-auth.guard';
import {
  PaymentStatus,
  PaymentMethod,
  PaymentDocument,
} from './payment.schema';
import { Request } from 'express';

@Controller('api/v1/payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly zaloPayService: ZaloPayService,
  ) { }

  @Post('vnpay/create-url')
  @UseGuards(FirebaseAuthGuard)
  async createPaymentUrl(
    @Body() createPaymentDto: { packageId: string },
    @Req()
    request: Request & {
      user: { userId: string; email: string; role: string };
    },
  ) {
    try {
      const userId = request.user.userId;
      const packageId = createPaymentDto.packageId;
      this.logger.log(
        `Creating payment URL for user ${userId}, package ${packageId}`,
      );

      // Tạo bản ghi thanh toán
      const payment = await this.paymentService.createPayment(
        userId,
        createPaymentDto.packageId,
      );

      // Tạo URL VNPAY
      const clientIp = this.paymentService.getClientIp(request);
      const paymentUrl = await this.paymentService.generateVNPayUrl(
        payment,
        clientIp,
      );

      return {
        paymentUrl,
        paymentCode: payment.payment_code,
      };
    } catch (error) {
      this.logger.error('Error creating payment URL:', error);
      throw new BadRequestException('Failed to create payment URL');
    }
  }

  @Post('paypal/create-payment')
  @UseGuards(FirebaseAuthGuard)
  async createPayPalPayment(
    @Body() createPaymentDto: { packageId: string },
    @Req()
    request: Request & {
      user: { userId: string; email: string; role: string };
    },
  ) {
    try {
      const userId = request.user.userId;
      const packageId = createPaymentDto.packageId;
      this.logger.log(
        `Creating PayPal payment for user ${userId}, package ${packageId}`,
      );

      // Tạo bản ghi thanh toán
      const payment = await this.paymentService.createPayment(
        userId,
        createPaymentDto.packageId,
        PaymentMethod.PAYPAL,
      );

      // Tạo đơn hàng PayPal (sử dụng API v2)
      const paypalOrder = await this.paymentService.createPayPalOrder(payment);

      // Tìm URL phê duyệt từ phản hồi PayPal
      const approvalUrl = paypalOrder.links?.find(
        (link: any) => link.rel === 'approve',
      )?.href;

      return {
        orderId: paypalOrder.id,
        approvalUrl: approvalUrl,
        paymentCode: payment.payment_code,
      };
    } catch (error) {
      this.logger.error('Error creating PayPal payment:', error);
      throw new BadRequestException('Failed to create PayPal payment');
    }
  }

  @Post('paypal/capture-payment')
  @UseGuards(FirebaseAuthGuard)
  async capturePayPalPayment(
    @Body() capturePaymentDto: { orderId: string },
    @Req()
    request: Request & {
      user: { userId: string; email: string; role: string };
    },
  ) {
    try {
      const { orderId } = capturePaymentDto;
      this.logger.log(`Capturing PayPal order ${orderId}`);

      // Bắt đơn hàng PayPal
      const capturedOrder =
        await this.paymentService.capturePayPalOrder(orderId);

      // Tìm thanh toán trong database theo PayPal order ID
      const payment = await this.paymentService.findByPayPalOrderId(orderId);
      if (!payment) {
        throw new BadRequestException('Payment not found');
      }

      // Cập nhật trạng thái thanh toán dựa trên kết quả bắt
      if (capturedOrder.status === 'COMPLETED') {
        const captureId =
          capturedOrder.purchase_units?.[0]?.payments?.captures?.[0]?.id;

        await this.paymentService.updatePaymentWithPayPal(
          (payment._id as any).toString(),
          orderId,
          captureId,
          PaymentStatus.SUCCESS,
        );

        this.logger.log(`PayPal payment ${payment._id} succeeded`);

        return {
          success: true,
          message: 'Payment captured successfully',
          paymentCode: payment.payment_code,
          captureId: captureId,
        };
      } else {
        await this.paymentService.updatePaymentWithPayPal(
          (payment._id as any).toString(),
          orderId,
          null,
          PaymentStatus.FAILED,
        );

        return {
          success: false,
          message: 'Payment capture failed',
          paymentCode: payment.payment_code,
        };
      }
    } catch (error) {
      this.logger.error('Error capturing PayPal payment:', error);
      throw new BadRequestException('Failed to capture PayPal payment');
    }
  }

  @Get('paypal/cancel')
  async handlePayPalCancel(@Query() query: { token: string }) {
    this.logger.log('PayPal payment cancelled:', JSON.stringify(query));

    try {
      const orderId = query.token; // PayPal sends order ID as token

      // Tìm thanh toán trong database
      const payment = await this.paymentService.findByPayPalOrderId(orderId);
      if (!payment) {
        return {
          success: false,
          message: 'Payment not found',
          redirectUrl: '/payment/failed',
        };
      }

      // Cập nhật trạng thái thanh toán thành đã hủy
      await this.paymentService.updatePaymentWithPayPal(
        (payment._id as any).toString(),
        orderId,
        null,
        PaymentStatus.FAILED,
      );

      return {
        success: false,
        message: 'Payment cancelled by user',
        paymentCode: payment.payment_code,
        redirectUrl: '/payment/cancelled',
      };
    } catch (error) {
      this.logger.error('Error handling PayPal cancel:', error);
      return {
        success: false,
        message: 'System error',
        redirectUrl: '/payment/failed',
      };
    }
  }

  @Get('paypal/return-url/success')
  async handlePayPalSuccess(
    @Query() query: { token: string; PayerID: string },
    @Res() res: Response,
  ) {
    this.logger.log('PayPal payment success return:', JSON.stringify(query));

    try {
      const { token: orderId, PayerID: payerId } = query;

      // Tìm thanh toán trong database
      const payment = await this.paymentService.findByPayPalOrderId(orderId);
      if (!payment) {
        this.logger.warn(`PayPal payment not found for order: ${orderId}`);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-fail?reason=payment_not_found`);
      }

      // Bắt đơn hàng PayPal
      const capturedOrder = await this.paymentService.capturePayPalOrder(orderId);

      // Cập nhật trạng thái thanh toán dựa trên kết quả bắt
      if (capturedOrder.status === 'COMPLETED') {
        const captureId = capturedOrder.purchase_units?.[0]?.payments?.captures?.[0]?.id;

        await this.paymentService.updatePaymentWithPayPal(
          (payment._id as any).toString(),
          orderId,
          captureId,
          PaymentStatus.SUCCESS,
        );

        this.logger.log(
          `PayPal payment ${payment._id} succeeded via return URL`,
        );

        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success?paymentCode=${payment.payment_code}&amount=${payment.amount}`);
      } else {
        await this.paymentService.updatePaymentWithPayPal(
          (payment._id as any).toString(),
          orderId,
          null,
          PaymentStatus.FAILED,
        );

        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-fail?reason=capture_failed`);
      }
    } catch (error) {
      this.logger.error('Error handling PayPal success return:', error);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-fail?reason=processing_error`);
    }
  }

  @Get('paypal/return-url/cancel')
  async handlePayPalReturnCancel(@Query() query: { token: string }, @Res() res: Response) {
    this.logger.log(
      'PayPal payment cancelled via return URL:',
      JSON.stringify(query),
    );

    try {
      const orderId = query.token;

      // Tìm thanh toán trong database
      const payment = await this.paymentService.findByPayPalOrderId(orderId);
      if (!payment) {
        this.logger.warn(`PayPal payment not found for order: ${orderId}`);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-fail?reason=payment_not_found`);
      }

      // Cập nhật trạng thái thanh toán thành đã hủy
      await this.paymentService.updatePaymentWithPayPal(
        (payment._id as any).toString(),
        orderId,
        null,
        PaymentStatus.FAILED,
      );

      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-fail?reason=cancelled`);
    } catch (error) {
      this.logger.error('Error handling PayPal return cancel:', error);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-fail?reason=processing_error`);
    }
  }

  @Post('paypal/webhook')
  async handlePayPalWebhook(@Body() webhookData: any, @Headers() headers: any) {
    this.logger.log('Received PayPal webhook:', JSON.stringify(webhookData));

    try {
      // Xác minh chữ ký webhook
      const isValidSignature = await this.paymentService.verifyPayPalWebhook(
        webhookData,
        headers,
      );
      if (!isValidSignature) {
        this.logger.error('Invalid PayPal webhook signature');
        throw new BadRequestException('Invalid webhook signature');
      }

      const eventType = webhookData.event_type;
      const resource = webhookData.resource;

      switch (eventType) {
        case 'CHECKOUT.ORDER.APPROVED':
          await this.handlePayPalOrderApproved(resource);
          break;
        case 'PAYMENT.CAPTURE.COMPLETED':
          await this.handlePayPalCaptureCompleted(resource);
          break;
        case 'PAYMENT.CAPTURE.DENIED':
        case 'PAYMENT.CAPTURE.REFUNDED':
          await this.handlePayPalCaptureFailed(resource);
          break;
        default:
          this.logger.log(`Unhandled PayPal webhook event: ${eventType}`);
      }

      return { status: 'success' };
    } catch (error) {
      this.logger.error('Error processing PayPal webhook:', error);
      throw new BadRequestException('Failed to process webhook');
    }
  }

  private async handlePayPalOrderApproved(resource: any) {
    const orderId = resource.id;
    const payment = await this.paymentService.findByPayPalOrderId(orderId);

    if (payment && payment.status === PaymentStatus.PENDING) {
      this.logger.log(`PayPal order ${orderId} approved via webhook`);
      // Note: We don't update status here, wait for capture completion
    }
  }

  private async handlePayPalCaptureCompleted(resource: any) {
    // Lấy order ID từ capture resource
    const orderId = resource.supplementary_data?.related_ids?.order_id;
    if (!orderId) {
      this.logger.error('No order ID found in capture completed webhook');
      return;
    }

    const payment = await this.paymentService.findByPayPalOrderId(orderId);

    if (payment && payment.status !== PaymentStatus.SUCCESS) {
      await this.paymentService.updatePaymentWithPayPal(
        (payment._id as any).toString(),
        orderId,
        resource.id,
        PaymentStatus.SUCCESS,
      );
      this.logger.log(
        `PayPal payment ${payment._id} marked as completed via webhook`,
      );
    }
  }

  private async handlePayPalCaptureFailed(resource: any) {
    const orderId = resource.supplementary_data?.related_ids?.order_id;
    if (!orderId) {
      this.logger.error('No order ID found in capture failed webhook');
      return;
    }

    const payment = await this.paymentService.findByPayPalOrderId(orderId);

    if (payment && payment.status === PaymentStatus.PENDING) {
      await this.paymentService.updatePaymentWithPayPal(
        (payment._id as any).toString(),
        orderId,
        resource.id,
        PaymentStatus.FAILED,
      );
      this.logger.log(
        `PayPal payment ${payment._id} marked as failed via webhook`,
      );
    }
  }

  private async handlePayPalPaymentCompleted(resource: any) {
    const paymentId = resource.parent_payment;
    const payment = await this.paymentService.findByPayPalPaymentId(paymentId);

    if (payment && payment.status !== PaymentStatus.SUCCESS) {
      await this.paymentService.updatePaymentStatus(
        (payment._id as any).toString(),
        PaymentStatus.SUCCESS,
        resource.id,
        'completed',
      );
      this.logger.log(
        `PayPal payment ${payment._id} marked as completed via webhook`,
      );
    }
  }

  private async handlePayPalPaymentFailed(resource: any) {
    const paymentId = resource.parent_payment;
    const payment = await this.paymentService.findByPayPalPaymentId(paymentId);

    if (payment && payment.status === PaymentStatus.PENDING) {
      await this.paymentService.updatePaymentStatus(
        (payment._id as any).toString(),
        PaymentStatus.FAILED,
        resource.id,
        'failed',
      );
      this.logger.log(
        `PayPal payment ${payment._id} marked as failed via webhook`,
      );
    }
  }

  @Get('vnpay/ipn-handler')
  async handleIPN(@Query() query: any) {
    this.logger.log('Received IPN from VNPAY:', JSON.stringify(query));

    try {
      // Bước 1: Xác minh chữ ký
      const isValidSignature = this.paymentService.verifyVNPaySignature({
        ...query,
      });
      if (!isValidSignature) {
        this.logger.error('Invalid signature from VNPAY');
        return { RspCode: '97', Message: 'Invalid Checksum' };
      }

      // Bước 2: Tìm thanh toán trong database
      const paymentCode = query.vnp_TxnRef;
      const payment = await this.paymentService.findByPaymentCode(paymentCode);
      if (!payment) {
        this.logger.error(`Payment not found: ${paymentCode}`);
        return { RspCode: '01', Message: 'Order not found' };
      }

      // Bước 3: Xác minh số tiền
      const vnpAmount = parseInt(query.vnp_Amount) / 100; // Convert from VND cents
      if (Math.abs(vnpAmount - payment.amount) > 0.01) {
        this.logger.error(
          `Amount mismatch: expected ${payment.amount}, got ${vnpAmount}`,
        );
        return { RspCode: '04', Message: 'Invalid amount' };
      }

      // Bước 4: Kiểm tra xử lý trùng lặp
      if (payment.status === PaymentStatus.SUCCESS) {
        this.logger.log(`Payment ${payment._id} already confirmed`);
        return { RspCode: '02', Message: 'Order already confirmed' };
      }

      // Bước 5: Cập nhật trạng thái thanh toán
      const vnpResponseCode = query.vnp_ResponseCode;
      const vnpTransactionNo = query.vnp_TransactionNo;

      if (vnpResponseCode === '00') {
        // Thành công
        await this.paymentService.updatePaymentStatus(
          (payment._id as any).toString(),
          PaymentStatus.SUCCESS,
          vnpTransactionNo,
          vnpResponseCode,
        );

        this.logger.log(`Payment ${payment._id} succeeded`);

        // TODO: Kích hoạt logic nghiệp vụ sau thanh toán tại đây
        // - Gửi thông báo email
        // - Kích hoạt đăng ký của người dùng
        // - Cập nhật package_id của người dùng

        return { RspCode: '00', Message: 'Confirm Success' };
      } else {
        // Thất bại
        await this.paymentService.updatePaymentStatus(
          (payment._id as any).toString(),
          PaymentStatus.FAILED,
          vnpTransactionNo,
          vnpResponseCode,
        );

        this.logger.log(
          `Payment ${payment._id} failed with code ${vnpResponseCode}`,
        );
        return { RspCode: '00', Message: 'Confirm Success' };
      }
    } catch (error) {
      this.logger.error('Error processing IPN:', error);
      return { RspCode: '99', Message: 'Unknown error' };
    }
  }

  @Get('vnpay/return-url')
  async handleReturnUrl(@Query() query: any, @Res() res: Response) {
    this.logger.log('User returned from VNPAY:', JSON.stringify(query));

    try {
      // Xác minh chữ ký
      const isValidSignature = this.paymentService.verifyVNPaySignature({
        ...query,
      });
      if (!isValidSignature) {
        this.logger.warn('Invalid signature from VNPay return URL');
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-fail?reason=invalid_signature`);
      }

      const paymentCode = query.vnp_TxnRef;
      const vnpResponseCode = query.vnp_ResponseCode;
      const vnpTransactionNo = query.vnp_TransactionNo;

      // Tìm thanh toán
      const payment = await this.paymentService.findByPaymentCode(paymentCode);
      if (!payment) {
        this.logger.warn(`Payment not found for code: ${paymentCode}`);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-fail?reason=payment_not_found`);
      }

      // Cập nhật trạng thái thanh toán nếu chưa được cập nhật
      if (payment.status === PaymentStatus.PENDING) {
        if (vnpResponseCode === '00') {
          // Thanh toán thành công
          await this.paymentService.updatePaymentStatus(
            (payment._id as any).toString(),
            PaymentStatus.SUCCESS,
            vnpTransactionNo,
            vnpResponseCode,
          );

          this.logger.log(
            `Payment ${payment._id} updated to SUCCESS via return URL`,
          );

          // Redirect to success page with payment details
          return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success?paymentCode=${paymentCode}&amount=${payment.amount}`);
        } else {
          // Thanh toán thất bại
          await this.paymentService.updatePaymentStatus(
            (payment._id as any).toString(),
            PaymentStatus.FAILED,
            vnpTransactionNo,
            vnpResponseCode,
          );

          this.logger.log(
            `Payment ${payment._id} updated to FAILED via return URL`,
          );

          return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-fail?reason=payment_failed&errorCode=${vnpResponseCode}`);
        }
      } else {
        // Thanh toán đã được xử lý trước đó (có thể từ IPN)
        if (payment.status === PaymentStatus.SUCCESS) {
          return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success?paymentCode=${paymentCode}&amount=${payment.amount}`);
        } else {
          return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-fail?reason=already_processed&errorCode=${payment.vnp_response_code || vnpResponseCode}`);
        }
      }
    } catch (error) {
      this.logger.error('Error processing return URL:', error);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-fail?reason=processing_error`);
    }
  }

  // Các endpoint tiện ích bổ sung
  @Get('status/:paymentCode')
  @UseGuards(FirebaseAuthGuard)
  async getPaymentStatus(@Param('paymentCode') paymentCode: string) {
    const payment = await this.paymentService.findByPaymentCode(paymentCode);
    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    return {
      paymentCode: payment.payment_code,
      status: payment.status,
      amount: payment.amount,
      createdAt: payment.date,
      vnpTransactionNo: payment.vnp_transaction_no,
    };
  }
  @Post('google-iap')
  @UseGuards(FirebaseAuthGuard)
  @AllowInactiveUser()  // Allow inactive users to purchase (they get activated after payment)
  async verifyGoogleIAP(
    @Body() body: { purchaseToken: string; productId: string; packageId: string },
    @Req() request: any,
  ) {
    try {
      const userId = request.user.userId;
      return await this.paymentService.verifyGooglePurchase(
        userId,
        body.purchaseToken,
        body.productId,
        body.packageId,
      );
    } catch (error) {
      this.logger.error('Error verifying Google IAP:', error);
      throw new BadRequestException('Failed to verify Google IAP');
    }
  }

  // ZaloPay endpoints
  @Post('zalopay/create-order')
  @UseGuards(FirebaseAuthGuard)
  @AllowInactiveUser()
  async createZaloPayOrder(
    @Body() body: { packageId: string; amount: number; description: string },
    @Req() request: any,
  ) {
    try {
      const userId = request.user.userId;
      
      this.logger.log(
        `[ZaloPay] Creating order for user ${userId}, package ${body.packageId}`,
      );

      // Create payment record
      const payment = await this.paymentService.createPayment(
        userId,
        body.packageId,
        PaymentMethod.ZALOPAY,
      );

      // Create ZaloPay order
      const orderResult = await this.zaloPayService.createOrder(
        userId,
        body.packageId,
        body.amount,
        body.description,
      );

      // Update payment with transaction ID
      await this.paymentService.updatePaymentTransactionId(
        (payment._id as any).toString(),
        orderResult.appTransId,
      );

      return {
        success: true,
        orderUrl: orderResult.orderUrl,
        paymentCode: payment.payment_code,
      };
    } catch (error) {
      this.logger.error('[ZaloPay] Create order error:', error);
      throw new BadRequestException('Failed to create ZaloPay order');
    }
  }

  @Post('zalopay/callback')
  async zaloPayCallback(@Body() body: any, @Res() res: Response) {
    this.logger.log('[ZaloPay] Callback received:', JSON.stringify(body));

    try {
      const { data, mac } = body;
      
      // Verify signature
      const isValid = this.zaloPayService.verifyCallback(data, mac);
      
      if (!isValid) {
        this.logger.warn('[ZaloPay] Invalid callback signature');
        return res.json({ return_code: -1, return_message: 'Invalid signature' });
      }

      // Parse data
      const dataJson = JSON.parse(data);
      const appTransId = dataJson.app_trans_id;
      
      this.logger.log(`[ZaloPay] Processing payment: ${appTransId}`);

      // Find payment by transaction ID
      const payment = await this.paymentService.findByTransactionId(appTransId);
      
      if (!payment) {
        this.logger.warn(`[ZaloPay] Payment not found: ${appTransId}`);
        return res.json({ return_code: -1, return_message: 'Payment not found' });
      }

      // Update payment status
      if (payment.status === PaymentStatus.PENDING) {
        await this.paymentService.updatePaymentStatus(
          (payment._id as any).toString(),
          PaymentStatus.SUCCESS,
          appTransId,
          'success',
        );
        
        this.logger.log(`[ZaloPay] Payment ${payment._id} updated to SUCCESS`);
      }

      return res.json({ return_code: 1, return_message: 'success' });
    } catch (error) {
      this.logger.error('[ZaloPay] Callback error:', error);
      return res.json({ return_code: 0, return_message: 'error' });
    }
  }
}
