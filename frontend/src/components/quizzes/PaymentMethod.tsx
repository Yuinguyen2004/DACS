"use client";

import { useState, useEffect } from "react";
import { BookOpen, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Link, useNavigate, useParams } from "react-router-dom";
import { packageAPI, paymentAPI } from "../../services/api";
import { Package } from "../../types/types";

export default function PaymentMethodSelectionPage() {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { packageId } = useParams<{ packageId?: string }>();

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const data = await packageAPI.getPremiumPackages(); // Only fetch premium packages
        setPackages(data);

        if (data.length === 0) {
          setError("No premium packages available");
          return;
        }

        // If packageId is provided in URL, find and set the selected package
        if (packageId) {
          const pkg = data.find((p) => p._id === packageId);
          if (pkg) {
            setSelectedPackage(pkg);
          } else {
            // If no specific package, use the first premium package
            setSelectedPackage(data[0]);
          }
        } else {
          setSelectedPackage(data[0]); // Default to first premium package
        }
      } catch (err) {
        console.error("Failed to fetch premium packages:", err);
        setError("Failed to load premium packages");
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [packageId]);

  const handleProceedToPayment = async () => {
    if (!selectedMethod || !selectedPackage || processing) return;

    try {
      setProcessing(true);
      setError(null);

      if (selectedMethod === "vnpay") {
        const result = await paymentAPI.createVNPayPayment(selectedPackage._id);
        // Redirect to VNPay payment page
        window.location.href = result.paymentUrl;
      } else if (selectedMethod === "paypal") {
        const result = await paymentAPI.createPayPalPayment(
          selectedPackage._id
        );
        // Redirect to PayPal approval page
        window.location.href = result.approvalUrl;
      }
    } catch (err: any) {
      console.error("Payment creation failed:", err);
      setError(
        err.response?.data?.message ||
          "Failed to create payment. Please try again."
      );
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading packages...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm mb-8 rounded-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px:6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-400 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Quizz Payment
                </h1>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto space-y-8">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Upgrade to Premium
            </CardTitle>
            <CardDescription className="text-lg text-gray-700">
              Choose your premium package and payment method to unlock all
              features.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Package Selector (if multiple packages available) */}
            {packages.length > 1 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Choose Package
                </h3>
                <RadioGroup
                  value={selectedPackage?._id || ""}
                  onValueChange={(value) => {
                    const pkg = packages.find((p) => p._id === value);
                    if (pkg) setSelectedPackage(pkg);
                  }}
                  className="space-y-3"
                >
                  {packages.map((pkg) => (
                    <Label
                      key={pkg._id}
                      htmlFor={`package-${pkg._id}`}
                      className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                        selectedPackage?._id === pkg._id
                          ? "border-orange-500 ring-2 ring-orange-200 bg-orange-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem
                          value={pkg._id}
                          id={`package-${pkg._id}`}
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {pkg.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {pkg.Duration} tháng - {pkg.Benefit}
                          </p>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(pkg.price)}
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            )}

            {selectedPackage && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Order Summary
                </h3>
                <div className="flex justify-between text-gray-700">
                  <span>
                    {selectedPackage.name} ({selectedPackage.Duration} tháng)
                  </span>
                  <span>
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(selectedPackage.price)}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>{selectedPackage.Benefit}</p>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg text-gray-900">
                  <span>Tổng cần thanh toán</span>
                  <span>
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(selectedPackage.price)}
                  </span>
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Choose a Method
              </h3>
              <RadioGroup
                value={selectedMethod || ""}
                onValueChange={setSelectedMethod}
                className="space-y-4"
              >
                <Label
                  htmlFor="vnpay"
                  className={`flex items-center space-x-4 p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedMethod === "vnpay"
                      ? "border-orange-500 ring-2 ring-orange-200 bg-orange-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <RadioGroupItem
                    value="vnpay"
                    id="vnpay"
                    className="sr-only"
                  />
                  <img
                    src="https://stcd02206177151.cloud.edgevnpay.vn/assets/images/logo-icon/logo-primary.svg"
                    alt="VNPay Logo"
                    className="h-10 w-auto object-contain"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">VNPay</p>
                    <p className="text-sm text-gray-600">
                      Thanh toán trực tuyến an toàn qua cổng VNPay (VND).
                    </p>
                  </div>
                  {selectedMethod === "vnpay" && (
                    <CheckCircle className="w-5 h-5 text-orange-500" />
                  )}
                </Label>

                <Label
                  htmlFor="paypal"
                  className={`flex items-center space-x-4 p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedMethod === "paypal"
                      ? "border-blue-500 ring-2 ring-blue-200 bg-blue-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <RadioGroupItem
                    value="paypal"
                    id="paypal"
                    className="sr-only"
                  />
                  <img
                    src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg"
                    alt="PayPal Logo"
                    className="h-10 w-auto object-contain"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">PayPal</p>
                    <p className="text-sm text-gray-600">
                      Thanh toán dễ dàng và an toàn với tài khoản PayPal (USD).
                    </p>
                  </div>
                  {selectedMethod === "paypal" && (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  )}
                </Label>
              </RadioGroup>
            </div>

            <Button
              onClick={handleProceedToPayment}
              disabled={!selectedMethod || !selectedPackage || processing}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                "Proceed to Payment"
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
