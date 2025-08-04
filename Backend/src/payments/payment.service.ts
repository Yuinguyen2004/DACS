import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  Payment,
  PaymentDocument,
  PaymentStatus,
  PaymentMethod,
} from './payment.schema';
import { PackageService } from '../packages/package.service';
import { UsersService } from '../users/user.service';
import * as crypto from 'crypto';
import * as qs from 'qs';
import axios from 'axios';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private paypalBaseUrl: string;

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private packageService: PackageService,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    // Khởi tạo URL cơ sở PayPal
    this.paypalBaseUrl =
      this.configService.get<string>('PAYPAL_API_BASE') ||
      'https://api-m.sandbox.paypal.com';
  }

  async createPayment(
    userId: string,
    packageId: string,
    paymentMethod: PaymentMethod = PaymentMethod.VNPAY,
  ): Promise<PaymentDocument> {
    this.logger.log(
      `Creating payment for user ${userId}, package ${packageId}`,
    );

    // Lấy thông tin gói
    const packageInfo =
      await this.packageService.getPackageForPayment(packageId);
    if (!packageInfo) {
      throw new NotFoundException('Package not found');
    }

    // Tạo mã thanh toán duy nhất trước
    const tempPaymentCode = `PAY_TEMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Tạo bản ghi thanh toán
    const payment = new this.paymentModel({
      user_id: userId,
      package_id: packageId,
      amount: packageInfo.price,
      date: new Date(),
      status: PaymentStatus.PENDING,
      payment_code: tempPaymentCode, // Mã tạm thời
      payment_method: paymentMethod,
    });

    const savedPayment = await payment.save();

    // Cập nhật mã thanh toán cuối cùng sử dụng _id thực tế
    const finalPaymentCode = `PAY${savedPayment._id}_${Date.now()}`;
    savedPayment.payment_code = finalPaymentCode;
    await savedPayment.save();

    this.logger.log(
      `Payment created with ID: ${savedPayment._id}, code: ${finalPaymentCode}`,
    );
    return savedPayment;
  }

  async generateVNPayUrl(
    payment: PaymentDocument,
    clientIp: string,
  ): Promise<string> {
    const vnpUrl = this.configService.get<string>('VNP_URL');
    const vnpTmnCode = this.configService.get<string>('VNP_TMNCODE');
    const vnpHashSecret = this.configService.get<string>('VNP_HASH_SECRET');
    const vnpReturnUrl = this.configService.get<string>('VNP_RETURN_URL');

    if (!vnpUrl || !vnpTmnCode || !vnpHashSecret || !vnpReturnUrl) {
      throw new BadRequestException('VNPAY configuration is incomplete');
    }

    // Định dạng ngày dưới dạng yyyyMMddHHmmss (định dạng yêu cầu của VNPAY)
    const now = new Date();
    const createDate =
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0');

    // Tạo expiry date (15 phút sau create date)
    const expireTime = new Date(now.getTime() + 15 * 60 * 1000);
    const expireDate =
      expireTime.getFullYear().toString() +
      (expireTime.getMonth() + 1).toString().padStart(2, '0') +
      expireTime.getDate().toString().padStart(2, '0') +
      expireTime.getHours().toString().padStart(2, '0') +
      expireTime.getMinutes().toString().padStart(2, '0') +
      expireTime.getSeconds().toString().padStart(2, '0');

    const amount = Math.round(payment.amount * 100); // Chuyển đổi sang xu VND

    const vnpParams = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: vnpTmnCode,
      vnp_Amount: amount.toString(),
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
      vnp_CurrCode: 'VND',
      vnp_IpAddr: clientIp,
      vnp_Locale: 'vn',
      vnp_OrderInfo: `${payment.payment_code}`,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: vnpReturnUrl,
      vnp_TxnRef: payment.payment_code,
    };

    // Sắp xếp tham số theo thứ tự bảng chữ cái để tạo chữ ký
    const sortedParams = this.sortParams(vnpParams);

    // Tạo chuỗi truy vấn cho chữ ký với URL encoding
    const signatureString = Object.keys(sortedParams)
      .sort()
      .map((key) => `${key}=${encodeURIComponent(sortedParams[key])}`)
      .join('&');

    // Ghi log thông tin chữ ký chi tiết để debug
    this.logger.debug('=== VNPAY SIGNATURE DEBUG INFO ===');
    this.logger.debug(`Hash Secret: ${vnpHashSecret}`);
    this.logger.debug(
      `Sorted Parameters: ${JSON.stringify(sortedParams, null, 2)}`,
    );
    this.logger.debug(`Signature String: ${signatureString}`);

    // Tạo chữ ký
    const hmac = crypto.createHmac('sha512', vnpHashSecret);
    const secureHash = hmac
      .update(Buffer.from(signatureString, 'utf-8'))
      .digest('hex');

    this.logger.debug(`Generated SecureHash: ${secureHash}`);
    this.logger.debug('=== END SIGNATURE DEBUG INFO ===');

    // Thêm chữ ký vào tham số
    sortedParams.vnp_SecureHash = secureHash;

    // Tạo URL cuối cùng với mã hóa phù hợp
    const finalUrl = `${vnpUrl}?${qs.stringify(sortedParams, { encode: true })}`;

    this.logger.log(`Generated VNPAY URL for payment ${payment.payment_code}`);
    return finalUrl;
  }

  async findByPaymentCode(
    paymentCode: string,
  ): Promise<PaymentDocument | null> {
    return this.paymentModel.findOne({ payment_code: paymentCode }).exec();
  }

  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    vnpTransactionNo?: string,
    vnpResponseCode?: string,
  ): Promise<PaymentDocument> {
    const updateData: any = { status };

    if (vnpTransactionNo) {
      updateData.vnp_transaction_no = vnpTransactionNo;
    }

    if (vnpResponseCode) {
      updateData.vnp_response_code = vnpResponseCode;
    }

    const updatedPayment = await this.paymentModel
      .findByIdAndUpdate(paymentId, updateData, { new: true })
      .exec();

    if (!updatedPayment) {
      throw new NotFoundException('Payment not found');
    }

    this.logger.log(`Payment ${paymentId} status updated to ${status}`);

    // Cập nhật gói người dùng nếu thanh toán thành công
    if (status === PaymentStatus.SUCCESS) {
      await this.updateUserPackageAfterPayment(updatedPayment);
    }

    return updatedPayment;
  }

  verifyVNPaySignature(vnpParams: any): boolean {
    const vnpHashSecret = this.configService.get<string>('VNP_HASH_SECRET');
    if (!vnpHashSecret) {
      throw new BadRequestException('VNP_HASH_SECRET is not configured');
    }
    const secureHash = vnpParams.vnp_SecureHash;

    // Xóa chữ ký khỏi tham số
    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHashType;

    // Sắp xếp tham số và tạo chuỗi chữ ký (cùng định dạng với tạo URL)
    const sortedParams = this.sortParams(vnpParams);
    const signatureString = Object.keys(sortedParams)
      .sort()
      .map((key) => `${key}=${sortedParams[key]}`)
      .join('&');

    // Ghi log thông tin xác minh chi tiết để debug
    this.logger.debug('=== VNPAY VERIFICATION DEBUG INFO ===');
    this.logger.debug(`Hash Secret: ${vnpHashSecret}`);
    this.logger.debug(`Received SecureHash: ${secureHash}`);
    this.logger.debug(
      `Sorted Parameters: ${JSON.stringify(sortedParams, null, 2)}`,
    );
    this.logger.debug(`Verification String: ${signatureString}`);

    // Tính toán chữ ký
    const hmac = crypto.createHmac('sha512', vnpHashSecret);
    const calculatedHash = hmac
      .update(Buffer.from(signatureString, 'utf-8'))
      .digest('hex');

    this.logger.debug(`Calculated SecureHash: ${calculatedHash}`);
    this.logger.debug(`Hashes Match: ${calculatedHash === secureHash}`);
    this.logger.debug('=== END VERIFICATION DEBUG INFO ===');

    const isValid = calculatedHash === secureHash;
    this.logger.log(`Signature verification: ${isValid ? 'VALID' : 'INVALID'}`);

    return isValid;
  }

  private sortParams(params: any): any {
    const sorted = {};
    Object.keys(params)
      .sort()
      .forEach((key) => {
        sorted[key] = params[key];
      });
    return sorted;
  }

  // Các phương thức PayPal
  private async getPayPalAccessToken(): Promise<string> {
    try {
      const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID');
      const clientSecret = this.configService.get<string>(
        'PAYPAL_CLIENT_SECRET',
      );

      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString(
        'base64',
      );

      const response = await axios.post(
        `${this.paypalBaseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data.access_token;
    } catch (error) {
      this.logger.error('Failed to get PayPal access token:', error);
      throw new BadRequestException('Failed to authenticate with PayPal');
    }
  }

  async createPayPalOrder(payment: PaymentDocument): Promise<any> {
    try {
      const accessToken = await this.getPayPalAccessToken();

      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: payment.amount.toString(),
            },
            description: `Payment for package ${payment.package_id}`,
            custom_id: payment.payment_code,
          },
        ],
        application_context: {
          return_url:
            this.configService.get<string>('PAYPAL_RETURN_URL_SUCCESS') ||
            `${this.configService.get<string>('BASE_URL') || 'http://localhost:3000'}/api/v1/payments/paypal/return-url/success`,
          cancel_url:
            this.configService.get<string>('PAYPAL_RETURN_URL_CANCEL') ||
            `${this.configService.get<string>('BASE_URL') || 'http://localhost:3000'}/api/v1/payments/paypal/return-url/cancel`,
        },
      };

      const response = await axios.post(
        `${this.paypalBaseUrl}/v2/checkout/orders`,
        orderData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // Cập nhật thanh toán với PayPal order ID
      await this.paymentModel.findByIdAndUpdate(payment._id, {
        paypal_order_id: response.data.id,
      });

      this.logger.log(
        `PayPal order created: ${response.data.id} for payment ${payment.payment_code}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error('PayPal order creation failed:', error);
      throw new BadRequestException('Failed to create PayPal order');
    }
  }

  async capturePayPalOrder(orderId: string): Promise<any> {
    try {
      const accessToken = await this.getPayPalAccessToken();

      const response = await axios.post(
        `${this.paypalBaseUrl}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`PayPal order captured: ${orderId}`);
      return response.data;
    } catch (error) {
      this.logger.error('PayPal order capture failed:', error);
      throw new BadRequestException('Failed to capture PayPal order');
    }
  }

  async updatePaymentWithPayPal(
    paymentId: string,
    paypalOrderId: string,
    paypalPaymentId: string | null,
    status: PaymentStatus,
  ): Promise<PaymentDocument> {
    const updateData: any = {
      status,
      paypal_order_id: paypalOrderId,
      paypal_payment_id: paypalPaymentId,
    };

    const updatedPayment = await this.paymentModel
      .findByIdAndUpdate(paymentId, updateData, { new: true })
      .exec();

    if (!updatedPayment) {
      throw new NotFoundException('Payment not found');
    }

    this.logger.log(`Payment ${paymentId} updated with PayPal data`);

    // Cập nhật gói người dùng nếu thanh toán thành công
    if (status === PaymentStatus.SUCCESS) {
      await this.updateUserPackageAfterPayment(updatedPayment);
    }

    return updatedPayment;
  }

  async findByPayPalOrderId(orderId: string): Promise<PaymentDocument | null> {
    return this.paymentModel.findOne({ paypal_order_id: orderId }).exec();
  }

  async findByPayPalPaymentId(
    paypalPaymentId: string,
  ): Promise<PaymentDocument | null> {
    return this.paymentModel
      .findOne({ paypal_payment_id: paypalPaymentId })
      .exec();
  }

  async verifyPayPalWebhook(webhookData: any, headers: any): Promise<boolean> {
    try {
      // Trong production, bạn nên xác minh chữ ký webhook
      // Hiện tại, chúng ta sẽ trả về true như một placeholder
      // Bạn có thể implement xác minh webhook thích hợp sử dụng PayPal SDK
      const authAlgo = headers['paypal-auth-algo'];
      const transmission_id = headers['paypal-transmission-id'];
      const cert_id = headers['paypal-cert-id'];
      const auth_signature = headers['paypal-auth-signature'];
      const transmission_time = headers['paypal-transmission-time'];

      // Placeholder cho xác minh webhook
      // Trong production, sử dụng PayPal SDK để xác minh các headers này
      this.logger.log(
        'PayPal webhook verification (placeholder - implement proper verification)',
      );

      return true; // Tạm thời - cần implement xác minh thích hợp
    } catch (error) {
      this.logger.error('Error verifying PayPal webhook:', error);
      return false;
    }
  }

  async updateUserPackageAfterPayment(payment: PaymentDocument): Promise<void> {
    try {
      this.logger.log(`Updating user package for payment ${payment._id}`);

      // Lấy thông tin gói để xác định chi tiết đăng ký
      const packageInfo = await this.packageService.getPackageForPayment(
        payment.package_id.toString(),
      );
      if (!packageInfo) {
        this.logger.error(`Package not found for payment ${payment._id}`);
        return;
      }

      // Tính toán ngày đăng ký dựa trên thời lượng gói
      const subscriptionStartDate = new Date();
      let subscriptionEndDate: Date | undefined;
      let subscriptionType: string;

      // Xác định loại đăng ký dựa trên thời lượng (tính bằng ngày)
      if (packageInfo.duration === 30) {
        subscriptionType = 'monthly';
        subscriptionEndDate = new Date();
        subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);
      } else if (packageInfo.duration === 365) {
        subscriptionType = 'yearly';
        subscriptionEndDate = new Date();
        subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 365);
      } else if (packageInfo.duration === 0 || packageInfo.duration > 3650) {
        subscriptionType = 'lifetime';
        // Đối với lifetime, subscriptionEndDate vẫn undefined
      } else {
        subscriptionType = 'custom';
        subscriptionEndDate = new Date();
        subscriptionEndDate.setDate(
          subscriptionEndDate.getDate() + packageInfo.duration,
        );
      }

      // Cập nhật gói người dùng và chi tiết đăng ký
      await this.usersService.updateUserPackage(
        payment.user_id.toString(),
        payment.package_id.toString(),
        subscriptionType,
        subscriptionStartDate,
        subscriptionEndDate,
      );

      this.logger.log(
        `Successfully updated user ${payment.user_id} package to ${payment.package_id}`,
      );
    } catch (error) {
      this.logger.error('Failed to update user package after payment:', error);
      // Không throw error để tránh ảnh hưởng đến luồng thanh toán
    }
  }

  // Lấy IP client từ request - đảm bảo định dạng IPv4
  getClientIp(request: any): string {
    let clientIp =
      request.headers['x-forwarded-for'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.connection?.socket?.remoteAddress;

    // Xử lý nhiều IP trong x-forwarded-for (lấy IP đầu tiên)
    if (clientIp && typeof clientIp === 'string' && clientIp.includes(',')) {
      clientIp = clientIp.split(',')[0].trim();
    }

    // Chuyển đổi IPv6 localhost thành IPv4
    if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
      clientIp = '127.0.0.1';
    }

    // Xóa tiền tố IPv6 nếu có (::ffff:192.168.1.1 -> 192.168.1.1)
    if (
      clientIp &&
      typeof clientIp === 'string' &&
      clientIp.startsWith('::ffff:')
    ) {
      clientIp = clientIp.substring(7);
    }

    // Xác thực định dạng IPv4
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (
      !clientIp ||
      typeof clientIp !== 'string' ||
      !ipv4Regex.test(clientIp)
    ) {
      this.logger.warn(
        `Invalid IP detected: ${clientIp}, using default 127.0.0.1`,
      );
      return '127.0.0.1';
    }

    // Xác thực mỗi octet nằm trong khoảng 0-255
    const octets = clientIp.split('.');
    for (const octet of octets) {
      const num = parseInt(octet, 10);
      if (num < 0 || num > 255) {
        this.logger.warn(
          `Invalid IP octet detected: ${clientIp}, using default 127.0.0.1`,
        );
        return '127.0.0.1';
      }
    }

    this.logger.debug(`Client IP detected: ${clientIp}`);
    return clientIp;
  }
}
