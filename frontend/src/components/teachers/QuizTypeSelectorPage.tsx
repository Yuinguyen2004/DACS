"use client"

import type React from "react"

import { useNavigate } from "react-router-dom"
import { BookOpen, ImageIcon, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useIsMobile } from "@/hooks/use-mobile"

interface QuizTypeOption {
  type: "basic" | "image"
  title: string
  description: string
  icon: React.ReactNode
  supportsImage?: boolean
}

export default function QuizTypeSelectorPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const quizTypes: QuizTypeOption[] = [
    {
      type: "basic",
      title: "Quiz Cơ Bản",
      description: "Câu hỏi văn bản đơn giản với 4 lựa chọn A B C D. Phù hợp cho kiến thức lý thuyết.",
      icon: <BookOpen className="w-12 h-12" />,
      supportsImage: false,
    },
    {
      type: "image",
      title: "Quiz Hình Ảnh",
      description:
        "Câu hỏi kết hợp hình ảnh và văn bản, với 4 lựa chọn A B C D. Hỗ trợ upload ảnh cho câu hỏi hoặc options, lý tưởng cho bài học trực quan.",
      icon: <ImageIcon className="w-12 h-12" />,
      supportsImage: true,
    },
  ]

  const handleSelectType = (type: "basic" | "image") => {
    const queryParams = new URLSearchParams()
    queryParams.set("type", type)
    if (type === "image") {
      queryParams.set("hybrid", "true")
    }
    navigate(`/teachers/create-quiz?${queryParams.toString()}`)
  }

  const handleCancel = () => {
    navigate("/manage")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Tạo Quiz Mới</h1>
          <p className="text-lg text-gray-600">Chọn loại quiz bạn muốn tạo</p>
        </div>

        {/* Quiz Type Cards */}
        <div className={`grid gap-6 mb-8 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
          {quizTypes.map((quizType) => (
            <Card
              key={quizType.type}
              className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer border-2 border-transparent hover:border-blue-500 bg-white"
              onClick={() => handleSelectType(quizType.type)}
            >
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4 text-blue-600">{quizType.icon}</div>
                <CardTitle className="text-2xl text-gray-900">{quizType.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-base text-gray-700 text-center">
                  {quizType.description}
                </CardDescription>
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelectType(quizType.type)
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
                  aria-label={`Chọn ${quizType.title}`}
                >
                  Chọn Loại Này
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-center gap-3">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="flex items-center gap-2 px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
            aria-label="Quay lại trang quản lý quiz"
          >
            <ArrowLeft className="w-4 h-4" />
            Hủy
          </Button>
        </div>

        {/* Accessibility */}
        <div className="sr-only">
          <h2>Hướng dẫn truy cập</h2>
          <p>
            Chọn một trong hai loại quiz ở trên để tiếp tục. Sử dụng phím Tab để di chuyển giữa các nút, Enter để chọn.
          </p>
        </div>
      </div>
    </div>
  )
}
