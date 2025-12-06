import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:mobilefe/data/api_service.dart';
import 'package:mobilefe/providers/app_providers.dart';

final zalopayServiceProvider = Provider<ZaloPayService>((ref) {
  return ZaloPayService(ref);
});

enum ZaloPayStatus {
  idle,
  loading, // Creating order
  processing, // User in ZaloPay
  success, // Payment successful
  cancelled, // User cancelled
  error, // Error occurred
}

class ZaloPayService {
  final Ref _ref;

  // Status stream for UI updates
  final _statusController = StreamController<ZaloPayStatus>.broadcast();
  Stream<ZaloPayStatus> get statusStream => _statusController.stream;

  String? _currentPaymentCode;
  Timer? _pollingTimer;

  ZaloPayService(this._ref);

  /// Purchase premium package with ZaloPay
  Future<void> purchasePremium({
    required String packageId,
    required int amount,
    required String description,
  }) async {
    _statusController.add(ZaloPayStatus.loading);

    try {
      debugPrint('[ZaloPay] Creating order...');
      final apiService = _ref.read(apiServiceProvider);

      // Step 1: Create order via backend
      final orderResponse = await apiService.createZaloPayOrder(
        packageId: packageId,
        amount: amount,
        description: description,
      );

      final orderUrl = orderResponse['orderUrl'] as String?;
      final paymentCode = orderResponse['paymentCode'] as String?;

      if (orderUrl == null || orderUrl.isEmpty) {
        throw Exception('Invalid order URL');
      }

      _currentPaymentCode = paymentCode;
      debugPrint('[ZaloPay] Order created: $paymentCode');

      // Step 2: Open ZaloPay for payment
      _statusController.add(ZaloPayStatus.processing);

      final uri = Uri.parse(orderUrl);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);

        debugPrint('[ZaloPay] Payment URL opened');

        // Step 3: Start polling payment status
        _startPollingPaymentStatus(paymentCode!);
      } else {
        throw Exception('Could not launch ZaloPay');
      }
    } catch (e) {
      debugPrint('[ZaloPay] Purchase error: $e');
      _statusController.add(ZaloPayStatus.error);
      _stopPolling();
    }
  }

  /// Start polling payment status
  void _startPollingPaymentStatus(String paymentCode) {
    debugPrint('[ZaloPay] Starting payment status polling...');

    int pollCount = 0;
    const maxPolls = 60; // Poll for 5 minutes max (5 seconds interval)

    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 5), (timer) async {
      pollCount++;

      if (pollCount > maxPolls) {
        debugPrint('[ZaloPay] Polling timeout');
        timer.cancel();
        _statusController.add(ZaloPayStatus.cancelled);
        return;
      }

      try {
        final apiService = _ref.read(apiServiceProvider);
        final status = await apiService.checkPaymentStatus(paymentCode);

        debugPrint('[ZaloPay] Poll $pollCount: Status = ${status['status']}');

        if (status['status'] == 'success') {
          debugPrint('[ZaloPay] Payment successful!');
          timer.cancel();
          _statusController.add(ZaloPayStatus.success);

          // Refresh user data
          await Future.delayed(const Duration(seconds: 1));
          _ref.read(currentUserProvider.notifier).fetchUser();
        } else if (status['status'] == 'failed' ||
            status['status'] == 'canceled') {
          debugPrint('[ZaloPay] Payment failed/cancelled');
          timer.cancel();
          _statusController.add(ZaloPayStatus.cancelled);
        }
        // Keep polling if status is still 'pending'
      } catch (e) {
        debugPrint('[ZaloPay] Polling error: $e');
        // Continue polling on error
      }
    });
  }

  /// Stop polling
  void _stopPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
  }

  /// Cancel current payment
  void cancelPayment() {
    debugPrint('[ZaloPay] Payment cancelled by user');
    _stopPolling();
    _statusController.add(ZaloPayStatus.cancelled);
  }

  void dispose() {
    _stopPolling();
    _statusController.close();
  }
}
