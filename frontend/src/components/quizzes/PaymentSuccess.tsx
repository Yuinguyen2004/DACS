"use client";

import { useEffect } from "react";
import { BookOpen, CheckCircle, Home, Crown, Zap } from "lucide-react";
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
import { userAPI } from "../../services/api";

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();

  // Refresh user data from backend to get updated premium status
  useEffect(() => {
    const refreshUserData = async () => {
      try {
        const freshUser = await userAPI.getProfile();
        localStorage.setItem('user', JSON.stringify(freshUser));
        console.log('[PaymentSuccess] User data refreshed with premium status');
      } catch (error) {
        console.error('[PaymentSuccess] Failed to refresh user data:', error);
      }
    };
    refreshUserData();
  }, []);
  
  // Get payment details from URL parameters
  const paymentCode = searchParams.get('paymentCode') || 'Unknown';
  const amount = parseFloat(searchParams.get('amount') || '0');
  
  const transactionDetails = {
    orderId: paymentCode,
    paymentMethod: "VNPay", // Default to VNPay, could be enhanced to detect from payment code
    amount: amount,
    currency: "VND",
    dateTime: new Date().toLocaleString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

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
            <CardTitle className="text-4xl font-extrabold text-gray-900 mb-3">
              Thanh toán thành công!
            </CardTitle>
            <CardDescription className="text-xl text-gray-700 max-w-xl mx-auto">
              Chúc mừng! Gói Quizz Premium của bạn đã được kích hoạt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pb-8">
            <div className="space-y-4 text-left max-w-sm mx-auto">
              <h3 className="text-xl font-semibold text-gray-900">
                Chi tiết giao dịch
              </h3>
              <div className="grid grid-cols-2 gap-y-2 text-gray-700 text-sm">
                <span className="font-medium">Mã đơn hàng:</span>
                <span>{transactionDetails.orderId}</span>
                <span className="font-medium">Phương thức:</span>
                <span>{transactionDetails.paymentMethod}</span>
                <span className="font-medium">Số tiền:</span>
                <span>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(transactionDetails.amount)}
                </span>
                <span className="font-medium">Thời gian:</span>
                <span>{transactionDetails.dateTime}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center justify-center">
                <Crown className="w-6 h-6 text-orange-500 mr-2" />
                Chào mừng bạn đến với Premium!
              </h3>
              <p className="text-gray-700 max-w-md mx-auto">
                Bạn hiện có quyền truy cập:
              </p>
              <ul className="list-disc list-inside text-left text-gray-700 space-y-2 max-w-sm mx-auto">
                <li className="flex items-center">
                  <Zap className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0" />
                  Không giới hạn quiz & lần thử
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Giải thích chi tiết đáp án
                </li>
                <li className="flex items-center">
                  <BookOpen className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                  Nội dung premium độc quyền
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link to="/homepage">
                <Button
                  variant="outline"
                  className="h-12 px-8 text-lg font-semibold border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                >
                  <Home className="w-5 h-5 mr-3" />
                  Về trang chủ
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button className="h-12 px-8 text-lg font-semibold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1">
                  <Crown className="w-5 h-5 mr-3" />
                  Khám phá tính năng Premium
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
