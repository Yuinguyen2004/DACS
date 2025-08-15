"use client";

import { BookOpen, XCircle, RotateCcw, Home, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link, useSearchParams } from "react-router-dom";

export default function PaymentFailurePage() {
  const [searchParams] = useSearchParams();
  
  // Get error details from URL parameters
  const reason = searchParams.get('reason') || 'unknown_error';
  const errorCode = searchParams.get('errorCode') || '';
  
  // Map error reasons to Vietnamese messages
  const getErrorMessage = (reason: string, errorCode: string): string => {
    switch (reason) {
      case 'invalid_signature':
        return 'Chữ ký thanh toán không hợp lệ. Vui lòng thử lại.';
      case 'payment_not_found':
        return 'Không tìm thấy thông tin thanh toán. Vui lòng liên hệ hỗ trợ.';
      case 'payment_failed':
        return errorCode === '24' ? 'Giao dịch bị hủy bởi người dùng.' : 
               errorCode === '51' ? 'Tài khoản không đủ số dư.' :
               errorCode === '65' ? 'Tài khoản ngân hàng bị hạn chế.' :
               'Thanh toán thất bại. Vui lòng kiểm tra thông tin và thử lại.';
      case 'already_processed':
        return 'Giao dịch này đã được xử lý trước đó.';
      case 'processing_error':
        return 'Lỗi xử lý hệ thống. Vui lòng thử lại sau.';
      case 'capture_failed':
        return 'Không thể hoàn tất thanh toán PayPal. Vui lòng thử lại.';
      case 'cancelled':
        return 'Thanh toán đã bị hủy bởi người dùng.';
      default:
        return 'Đã xảy ra lỗi không xác định. Vui lòng liên hệ hỗ trợ.';
    }
  };
  
  const transactionDetails = {
    paymentMethod: reason.includes('paypal') ? "PayPal" : "VNPay",
    attemptTime: new Date().toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    errorMessage: getErrorMessage(reason, errorCode),
  };

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
            <CardTitle className="text-4xl font-extrabold text-gray-900 mb-3">
              Thanh toán không thành công!
            </CardTitle>
            <CardDescription className="text-xl text-gray-700 max-w-xl mx-auto">
              Rất tiếc, thanh toán của bạn không thể được xử lý vào lúc này.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pb-8">
            <div className="space-y-4 text-left max-w-sm mx-auto">
              <h3 className="text-xl font-semibold text-gray-900">
                Chi tiết giao dịch
              </h3>
              <div className="grid grid-cols-2 gap-y-2 text-gray-700 text-sm">
                <span className="font-medium">Phương thức:</span>
                <span>{transactionDetails.paymentMethod}</span>
                <span className="font-medium">Thời gian thử:</span>
                <span>{transactionDetails.attemptTime}</span>
                <span className="font-medium">Lỗi:</span>
                <span className="text-red-600">
                  {transactionDetails.errorMessage}
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Bạn có thể làm gì:
              </h3>
              <ul className="list-disc list-inside text-left text-gray-700 space-y-2 max-w-sm mx-auto">
                <li className="flex items-center">
                  <RotateCcw className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                  Kiểm tra lại thông tin thanh toán và thử lại.
                </li>
                <li className="flex items-center">
                  <Home className="w-4 h-4 text-purple-500 mr-2 flex-shrink-0" />
                  Thử sử dụng phương thức thanh toán khác.
                </li>
                <li className="flex items-center">
                  <HelpCircle className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
                  Liên hệ đội hỗ trợ để được trợ giúp.
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link to="/select-payment">
                <Button className="h-12 px-8 text-lg font-semibold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1">
                  <RotateCcw className="w-5 h-5 mr-3" />
                  Thử lại
                </Button>
              </Link>
              <Link to="/homepage">
                <Button
                  variant="outline"
                  className="h-12 px-8 text-lg font-semibold border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                >
                  <Home className="w-5 h-5 mr-3" />
                  Về trang chủ
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
