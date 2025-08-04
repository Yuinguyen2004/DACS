"use client"

import { BookOpen, CheckCircle, Home, Crown, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Link } from "react-router-dom"

export default function PaymentSuccessPage() {
  // Mock transaction details
  const transactionDetails = {
    orderId: "QM-PREMIUM-123456789",
    paymentMethod: "VNPay", // Or PayPal, based on actual selection
    amount: 9.99,
    currency: "USD",
    dateTime: new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm mb-8 rounded-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px:6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-400 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-semibold text-gray-900">Quizz</h1>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto space-y-8">
        <Card className="text-center shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mb-4 animate-bounce-in">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-4xl font-extrabold text-gray-900 mb-3">Payment Successful!</CardTitle>
            <CardDescription className="text-xl text-gray-700 max-w-xl mx-auto">
              Congratulations! Your Quizz Premium membership is now active.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pb-8">
            <div className="space-y-4 text-left max-w-sm mx-auto">
              <h3 className="text-xl font-semibold text-gray-900">Transaction Details</h3>
              <div className="grid grid-cols-2 gap-y-2 text-gray-700 text-sm">
                <span className="font-medium">Order ID:</span>
                <span>{transactionDetails.orderId}</span>
                <span className="font-medium">Payment Method:</span>
                <span>{transactionDetails.paymentMethod}</span>
                <span className="font-medium">Amount Paid:</span>
                <span>
                  ${transactionDetails.amount.toFixed(2)} {transactionDetails.currency}
                </span>
                <span className="font-medium">Date & Time:</span>
                <span>{transactionDetails.dateTime}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center justify-center">
                <Crown className="w-6 h-6 text-orange-500 mr-2" />
                Welcome to Premium!
              </h3>
              <p className="text-gray-700 max-w-md mx-auto">You now have access to:</p>
              <ul className="list-disc list-inside text-left text-gray-700 space-y-2 max-w-sm mx-auto">
                <li className="flex items-center">
                  <Zap className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0" />
                  Unlimited quizzes & attempts
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Detailed answer explanations
                </li>
                <li className="flex items-center">
                  <BookOpen className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                  Exclusive premium content
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link to="/">
                <Button
                  variant="outline"
                  className="h-12 px-8 text-lg font-semibold border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                >
                  <Home className="w-5 h-5 mr-3" />
                  Go to Homepage
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button className="h-12 px-8 text-lg font-semibold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1">
                  <Crown className="w-5 h-5 mr-3" />
                  Explore Premium Features
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
