import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import * as moment from 'moment';

@Injectable()
export class ZaloPayService {
  private readonly logger = new Logger(ZaloPayService.name);
  private readonly appId: string;
  private readonly key1: string;
  private readonly key2: string;
  private readonly endpoint: string;
  private readonly callbackUrl: string;

  constructor(private configService: ConfigService) {
    // ZaloPay Sandbox credentials
    this.appId = this.configService.get<string>('ZALOPAY_APP_ID') || '2553';
    this.key1 = this.configService.get<string>('ZALOPAY_KEY1') || 'PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL';
    this.key2 = this.configService.get<string>('ZALOPAY_KEY2') || 'kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz';
    this.endpoint = this.configService.get<string>('ZALOPAY_ENDPOINT') || 'https://sb-openapi.zalopay.vn/v2/create';
    this.callbackUrl = this.configService.get<string>('ZALOPAY_CALLBACK_URL') || 'http://localhost:3000/api/v1/payments/zalopay/callback';
    
    this.logger.log(`ZaloPay initialized - App ID: ${this.appId}`);
  }

  /**
   * Create ZaloPay order
   */
  async createOrder(
    userId: string,
    packageId: string,
    amount: number,
    description: string,
  ): Promise<{ orderUrl: string; appTransId: string }> {
    try {
      // Generate unique transaction ID
      const appTransId = `${moment().format('YYMMDD')}_${Date.now()}`;
      
      // Prepare embed data
      const embedData = JSON.stringify({
        redirecturl: 'http://localhost:5173/payment-success',
        userId,
        packageId,
      });

      // Prepare items
      const items = JSON.stringify([
        {
          itemid: packageId,
          itemname: description,
          itemprice: amount,
          itemquantity: 1,
        },
      ]);

      // Prepare order data
      const orderData: any = {
        app_id: parseInt(this.appId),
        app_trans_id: appTransId,
        app_user: userId,
        app_time: Date.now(),
        amount: amount,
        item: items,
        embed_data: embedData,
        description: description,
        bank_code: '',
        callback_url: this.callbackUrl,
      };

      // Create MAC signature
      const data = `${this.appId}|${orderData.app_trans_id}|${orderData.app_user}|${orderData.amount}|${orderData.app_time}|${embedData}|${items}`;
      orderData.mac = crypto
        .createHmac('sha256', this.key1)
        .update(data)
        .digest('hex');

      this.logger.log(`[ZaloPay] Creating order: ${appTransId}`);
      this.logger.debug(`[ZaloPay] Order data:`, JSON.stringify(orderData, null, 2));

      // Convert to URL-encoded format
      const formData = new URLSearchParams();
      Object.keys(orderData).forEach(key => {
        formData.append(key, orderData[key].toString());
      });

      // Call ZaloPay API
      const response = await axios.post(this.endpoint, formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      this.logger.log(`[ZaloPay] Response:`, JSON.stringify(response.data));

      if (response.data.return_code === 1) {
        return {
          orderUrl: response.data.order_url,
          appTransId: appTransId,
        };
      } else {
        throw new BadRequestException(
          `ZaloPay error: ${response.data.return_message || response.data.sub_return_message}`,
        );
      }
    } catch (error) {
      this.logger.error('[ZaloPay] Create order error:', error.response?.data || error.message);
      throw new BadRequestException(`Failed to create ZaloPay order: ${error.message}`);
    }
  }

  /**
   * Verify callback from ZaloPay
   */
  verifyCallback(data: string, mac: string): boolean {
    const expectedMac = crypto
      .createHmac('sha256', this.key2)
      .update(data)
      .digest('hex');

    const isValid = mac === expectedMac;
    this.logger.log(`[ZaloPay] Callback verification: ${isValid}`);

    return isValid;
  }

  /**
   * Query order status from ZaloPay
   * Use this to actively check payment status when callback can't reach localhost
   */
  async queryOrderStatus(appTransId: string): Promise<{ returnCode: number; isSuccess: boolean }> {
    try {
      const queryEndpoint = 'https://sb-openapi.zalopay.vn/v2/query';

      // Create MAC for query
      const data = `${this.appId}|${appTransId}|${this.key1}`;
      const mac = crypto
        .createHmac('sha256', this.key1)
        .update(data)
        .digest('hex');

      const params = new URLSearchParams();
      params.append('app_id', this.appId);
      params.append('app_trans_id', appTransId);
      params.append('mac', mac);

      this.logger.log(`[ZaloPay] Querying order status: ${appTransId}`);

      const response = await axios.post(queryEndpoint, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      this.logger.log(`[ZaloPay] Query response:`, JSON.stringify(response.data));

      // return_code: 1 = success, 2 = failed, 3 = pending
      return {
        returnCode: response.data.return_code,
        isSuccess: response.data.return_code === 1,
      };
    } catch (error) {
      this.logger.error('[ZaloPay] Query order error:', error.message);
      return { returnCode: -1, isSuccess: false };
    }
  }
}
