"use client"

import {
  CheckCircle,
  Crown,
  Zap,
  BarChart,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  Award,
  LockOpen,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function UpgradePremiumPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm mb-8 rounded-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-400 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-gray-900">Quizz</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto space-y-10">
        {/* Hero Section */}
        <Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center mb-4">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-4xl font-extrabold text-gray-900 mb-3">
              Mở khóa toàn bộ tiềm năng học tập của bạn
            </CardTitle>
            <CardDescription className="text-xl text-gray-700 max-w-2xl mx-auto">
              Nâng cấp lên Premium với Quizz để truy cập các tính năng độc quyền, phân tích chi tiết và trải nghiệm không quảng cáo.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <Button className="h-14 px-10 text-lg font-semibold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1">
              <Zap className="w-5 h-5 mr-3" />
              Nâng cấp lên Premium ngay
            </Button>
            <p className="text-sm text-gray-500 mt-4">Bắt đầu chỉ từ $9.99/tháng • Hủy bất cứ lúc nào</p>
          </CardContent>
        </Card>

        {/* Premium Benefits Section */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">Tại sao nên nâng cấp lên Premium?</CardTitle>
            <CardDescription className="text-gray-600">
              Nâng tầm trải nghiệm làm quiz của bạn với những tính năng mạnh mẽ sau:
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Giải thích chi tiết</h3>
                <p className="text-gray-600 text-sm">
                  Hiểu rõ mọi đáp án với phần giải thích sâu cho từng câu hỏi.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Phân tích nâng cao</h3>
                <p className="text-gray-600 text-sm">
                  Theo dõi tiến trình, xác định điểm yếu và xem xu hướng kết quả của bạn.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <LockOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Truy cập không giới hạn</h3>
                <p className="text-gray-600 text-sm">
                  Làm bài kiểm tra không giới hạn số lần, bao gồm cả nội dung Premium.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Hỗ trợ ưu tiên</h3>
                <p className="text-gray-600 text-sm">
                  Nhận phản hồi nhanh hơn và được hỗ trợ tận tình từ đội ngũ của chúng tôi.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Trải nghiệm không quảng cáo</h3>
                <p className="text-gray-600 text-sm">
                  Tập trung hoàn toàn vào việc học mà không bị gián đoạn bởi quảng cáo.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Award className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-900">Nội dung độc quyền</h3>
                <p className="text-gray-600 text-sm">
                  Truy cập các bài kiểm tra đặc biệt và học liệu chỉ dành cho thành viên Premium.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Comparison Table */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">So sánh các gói</CardTitle>
            <CardDescription className="text-gray-600">Xem cách Premium nâng cao hành trình học tập của bạn.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[200px] text-gray-700 font-semibold">Tính năng</TableHead>
                    <TableHead className="text-center text-gray-700 font-semibold">Miễn phí</TableHead>
                    <TableHead className="text-center text-gray-700 font-semibold">
                      <Badge className="bg-gradient-to-r from-orange-400 to-pink-400 text-white text-sm px-3 py-1">
                        Premium
                      </Badge>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium text-gray-800">Số lần làm bài kiểm tra</TableCell>
                    <TableCell className="text-center text-gray-600">Giới hạn</TableCell>
                    <TableCell className="text-center text-green-600 font-medium">Không giới hạn</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-800">Giải thích chi tiết</TableCell>
                    <TableCell className="text-center text-red-600">
                      <XCircle className="w-5 h-5 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center text-green-600">
                      <CheckCircle className="w-5 h-5 mx-auto" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-800">Phân tích nâng cao</TableCell>
                    <TableCell className="text-center text-red-600">
                      <XCircle className="w-5 h-5 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center text-green-600">
                      <CheckCircle className="w-5 h-5 mx-auto" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-800">Trải nghiệm không quảng cáo</TableCell>
                    <TableCell className="text-center text-red-600">
                      <XCircle className="w-5 h-5 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center text-green-600">
                      <CheckCircle className="w-5 h-5 mx-auto" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-800">Bài kiểm tra độc quyền</TableCell>
                    <TableCell className="text-center text-red-600">
                      <XCircle className="w-5 h-5 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center text-green-600">
                      <CheckCircle className="w-5 h-5 mx-auto" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-800">Hỗ trợ ưu tiên</TableCell>
                    <TableCell className="text-center text-red-600">
                      <XCircle className="w-5 h-5 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center text-green-600">
                      <CheckCircle className="w-5 h-5 mx-auto" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-800">Lịch sử làm bài</TableCell>
                    <TableCell className="text-center text-green-600">
                      <CheckCircle className="w-5 h-5 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center text-green-600">
                      <CheckCircle className="w-5 h-5 mx-auto" />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Final Call to Action */}
        <Card className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="py-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Sẵn sàng chinh phục kiến thức của bạn?</h2>
            <p className="text-lg text-gray-700 mb-6">
              Hãy gia nhập cùng hàng ngàn người học đang tăng tốc tiến trình với Quizz Premium.
            </p>
            <Button className="h-14 px-10 text-lg font-semibold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1">
              <Crown className="w-5 h-5 mr-3" />
              Nâng cấp lên Premium ngay hôm nay!
            </Button>
            <p className="text-sm text-gray-500 mt-4">Thanh toán an toàn qua XXX • Đảm bảo hoàn tiền trong 7 ngày</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
