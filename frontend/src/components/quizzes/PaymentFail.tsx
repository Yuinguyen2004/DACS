"use client"

import { BookOpen, XCircle, RotateCcw, Home, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Link } from "react-router-dom"

export default function PaymentFailurePage() {
  // Mock transaction details (if available from a failed attempt)
  const transactionDetails = {
    paymentMethod: "VNPay", // Or PayPal
    attemptTime: new Date().toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    errorMessage: "Insufficient funds or invalid card details.", // Example error message
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4 sm:p-6 lg:p-8">
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
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mb-4 animate-shake">
              <XCircle className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-4xl font-extrabold text-gray-900 mb-3">Payment Unsuccessful!</CardTitle>
            <CardDescription className="text-xl text-gray-700 max-w-xl mx-auto">
              Unfortunately, your payment could not be processed at this time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pb-8">
            <div className="space-y-4 text-left max-w-sm mx-auto">
              <h3 className="text-xl font-semibold text-gray-900">Transaction Details</h3>
              <div className="grid grid-cols-2 gap-y-2 text-gray-700 text-sm">
                <span className="font-medium">Payment Method:</span>
                <span>{transactionDetails.paymentMethod}</span>
                <span className="font-medium">Attempt Time:</span>
                <span>{transactionDetails.attemptTime}</span>
                <span className="font-medium">Error:</span>
                <span className="text-red-600">{transactionDetails.errorMessage}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">What you can do:</h3>
              <ul className="list-disc list-inside text-left text-gray-700 space-y-2 max-w-sm mx-auto">
                <li className="flex items-center">
                  <RotateCcw className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                  Double-check your payment details and try again.
                </li>
                <li className="flex items-center">
                  <Home className="w-4 h-4 text-purple-500 mr-2 flex-shrink-0" />
                  Try using a different payment method.
                </li>
                <li className="flex items-center">
                  <HelpCircle className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
                  Contact our support team for assistance.
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link to="/select-payment">
                <Button className="h-12 px-8 text-lg font-semibold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1">
                  <RotateCcw className="w-5 h-5 mr-3" />
                  Try Again
                </Button>
              </Link>
              <Link to="/">
                <Button
                  variant="outline"
                  className="h-12 px-8 text-lg font-semibold border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                >
                  <Home className="w-5 h-5 mr-3" />
                  Back to Homepage
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
