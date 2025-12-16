import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:mobilefe/data/api_service.dart';
import 'package:mobilefe/providers/app_providers.dart';
import 'package:mobilefe/services/zalopay_service.dart';

final subscriptionServiceProvider = Provider<SubscriptionService>((ref) {
  return SubscriptionService(ref);
});

class SubscriptionService {
  final Ref _ref;
  InAppPurchase? _iap;
  bool _isAvailable = false;
  List<ProductDetails> _products = [];
  final Set<String> _kIds = {
    'premium_monthly',
  }; // Product ID from Google Play Console

  // Stream controller to broadcast purchase status to UI
  final _purchaseStatusController = StreamController<String>.broadcast();
  Stream<String> get purchaseStatusStream => _purchaseStatusController.stream;

  SubscriptionService(this._ref) {
    _init();
  }

  void _init() {
    // Check if we should use real IAP
    // On Web, Desktop, or if explicitly disabled, we skip real IAP
    if (kIsWeb) {
      // Web doesn't support dart:io Platform checks safely without conditional imports
      // And we want Mock Mode on Web anyway
      return;
    }

    // For mobile (Android/iOS), try to initialize IAP
    try {
      if (Platform.isAndroid || Platform.isIOS) {
        _iap = InAppPurchase.instance;
        final purchaseUpdated = _iap!.purchaseStream;
        purchaseUpdated.listen(
          (purchaseDetailsList) {
            _listenToPurchaseUpdated(purchaseDetailsList);
          },
          onDone: () {
            _purchaseStatusController.close();
          },
          onError: (error) {
            debugPrint('IAP Error: $error');
            _purchaseStatusController.add('error');
          },
        );
      }
    } catch (e) {
      debugPrint('Failed to initialize IAP: $e');
    }
  }

  Future<void> initialize() async {
    if (_iap == null) return;

    try {
      _isAvailable = await _iap!.isAvailable();
      if (_isAvailable) {
        const Set<String> ids = {'premium_monthly'};
        final ProductDetailsResponse response = await _iap!.queryProductDetails(
          ids,
        );
        _products = response.productDetails;
      }
    } catch (e) {
      debugPrint('Error initializing IAP products: $e');
    }
  }

  List<ProductDetails> get products => _products;
  bool get isAvailable => _isAvailable;

  Future<void> buyPremium() async {
    // MOCK MODE for Web, Desktop, or Debug
    bool isMockMode = kIsWeb || kDebugMode;
    if (!kIsWeb) {
      // Safe to check Platform only if not Web
      if (Platform.isLinux || Platform.isWindows || Platform.isMacOS) {
        isMockMode = true;
      }
    }

    if (isMockMode) {
      await _mockPurchase();
      return;
    }

    if (_iap == null) {
      debugPrint('IAP not initialized');
      _purchaseStatusController.add('error');
      return;
    }

    if (_products.isEmpty) {
      await initialize();
    }

    if (_products.isEmpty) {
      _purchaseStatusController.add('no_products');
      return;
    }

    final ProductDetails productDetails = _products.firstWhere(
      (product) => product.id == 'premium_monthly',
      orElse: () => _products.first,
    );

    final PurchaseParam purchaseParam = PurchaseParam(
      productDetails: productDetails,
    );
    _iap!.buyNonConsumable(purchaseParam: purchaseParam);
  }

  Future<void> _listenToPurchaseUpdated(
    List<PurchaseDetails> purchaseDetailsList,
  ) async {
    for (final PurchaseDetails purchaseDetails in purchaseDetailsList) {
      if (purchaseDetails.status == PurchaseStatus.pending) {
        _purchaseStatusController.add('pending');
      } else {
        if (purchaseDetails.status == PurchaseStatus.error) {
          _purchaseStatusController.add('error');
        } else if (purchaseDetails.status == PurchaseStatus.purchased ||
            purchaseDetails.status == PurchaseStatus.restored) {
          final bool valid = await _verifyPurchase(purchaseDetails);
          if (valid) {
            _purchaseStatusController.add('success');
            // Refresh user profile to get new premium status
            _ref.read(currentUserProvider.notifier).fetchUser();
          } else {
            _purchaseStatusController.add('invalid');
          }
        }

        if (purchaseDetails.pendingCompletePurchase) {
          await _iap!.completePurchase(purchaseDetails);
        }
      }
    }
  }

  Future<bool> _verifyPurchase(PurchaseDetails purchaseDetails) async {
    try {
      final apiService = _ref.read(apiServiceProvider);
      // Call backend to verify
      await apiService.verifyGooglePurchase(
        purchaseToken: purchaseDetails.verificationData.serverVerificationData,
        productId: purchaseDetails.productID,
        packageId: 'premium_monthly', // Map to your backend package ID
      );
      return true;
    } catch (e) {
      debugPrint('Verification failed: $e');
      return false;
    }
  }

  // Mock purchase flow for testing
  Future<void> _mockPurchase() async {
    _purchaseStatusController.add('pending');
    await Future.delayed(const Duration(seconds: 2)); // Simulate network

    try {
      final apiService = _ref.read(apiServiceProvider);
      // Send mock data to backend
      await apiService.verifyGooglePurchase(
        purchaseToken: 'mock_token_${DateTime.now().millisecondsSinceEpoch}',
        productId: 'premium_monthly',
        packageId:
            '691ac7f9c2d434914cd9f7fe', // Valid Premium Package ID from DB
      );
      _purchaseStatusController.add('success');
      _ref.read(currentUserProvider.notifier).fetchUser();
    } catch (e) {
      debugPrint('Mock purchase failed: $e');
      _purchaseStatusController.add('error');
    }
  }

  // ZaloPay purchase
  Future<void> buyPremiumWithZaloPay() async {
    final zaloPayService = _ref.read(zalopayServiceProvider);

    await zaloPayService.purchasePremium(
      packageId: '691ac7f9c2d434914cd9f7fe', // Your Premium package ID
      amount: 99000, // 99,000 VND
      description: 'Nâng cấp gói Premium - Truy cập không giới hạn',
    );
  }
}
