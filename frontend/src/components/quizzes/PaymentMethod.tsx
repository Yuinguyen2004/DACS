"use client"

import { useState } from "react"
import { BookOpen, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Link, useNavigate } from "react-router-dom" // Import useNavigate

export default function PaymentMethodSelectionPage() {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const premiumPrice = 9.99 // Giả định giá Premium
  const currency = "USD" // Giả định đơn vị tiền tệ
  const navigate = useNavigate() // Khởi tạo useNavigate

  const handleProceedToPayment = () => {
    if (selectedMethod) {
      // Giả lập kết quả thanh toán thành công hoặc thất bại
      const isPaymentSuccessful = Math.random() > 0.5 // 50% chance of success

      if (isPaymentSuccessful) {
        navigate("/payment-success")
      } else {
        navigate("/payment-failure")
      }
    }
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
                <h1 className="text-lg font-semibold text-gray-900">Quizz Payment</h1>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto space-y-8">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">Select Payment Method</CardTitle>
            <CardDescription className="text-lg text-gray-700">
              Choose how you'd like to pay for your Premium membership.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Order Summary</h3>
              <div className="flex justify-between text-gray-700">
                <span>Premium Membership (1 month)</span>
                <span>${premiumPrice.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg text-gray-900">
                <span>Total to Pay</span>
                <span>
                  ${premiumPrice.toFixed(2)} {currency}
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Choose a Method</h3>
              <RadioGroup value={selectedMethod || ""} onValueChange={setSelectedMethod} className="space-y-4">
                <Label
                  htmlFor="vnpay"
                  className={`flex items-center space-x-4 p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedMethod === "vnpay"
                      ? "border-orange-500 ring-2 ring-orange-200 bg-orange-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <RadioGroupItem value="vnpay" id="vnpay" className="sr-only" />
                  <img
                    src="/placeholder.svg?height=40&width=100"
                    alt="VNPay Logo"
                    className="h-10 w-auto object-contain"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">VNPay</p>
                    <p className="text-sm text-gray-600">Secure online payments via VNPay gateway.</p>
                  </div>
                  {selectedMethod === "vnpay" && <CheckCircle className="w-5 h-5 text-orange-500" />}
                </Label>

                <Label
                  htmlFor="paypal"
                  className={`flex items-center space-x-4 p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedMethod === "paypal"
                      ? "border-blue-500 ring-2 ring-blue-200 bg-blue-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <RadioGroupItem value="paypal" id="paypal" className="sr-only" />
                  <img
                    src="/placeholder.svg?height=40&width=100"
                    alt="PayPal Logo"
                    className="h-10 w-auto object-contain"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">PayPal</p>
                    <p className="text-sm text-gray-600">Pay easily and securely with your PayPal account.</p>
                  </div>
                  {selectedMethod === "paypal" && <CheckCircle className="w-5 h-5 text-blue-500" />}
                </Label>
              </RadioGroup>
            </div>

            <Button
              onClick={handleProceedToPayment}
              disabled={!selectedMethod}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proceed to Payment
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
