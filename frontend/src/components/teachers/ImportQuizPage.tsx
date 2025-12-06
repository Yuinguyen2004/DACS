"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Upload, FileText, Loader2, ArrowLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { quizAPI } from "@/services/api"

export default function ImportQuizPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [questionCount, setQuestionCount] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string>("")
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      validateAndSetFile(droppedFile)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      validateAndSetFile(selectedFile)
    }
  }

  const validateAndSetFile = (selectedFile: File) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ]
    
    if (!validTypes.includes(selectedFile.type)) {
      setError("Chỉ chấp nhận file PDF hoặc Word (.docx, .doc)")
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB
      setError("File không được vượt quá 10MB")
      return
    }

    setFile(selectedFile)
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      setError("Vui lòng chọn file để import")
      return
    }

    setIsUploading(true)
    setError("")

    try {
      const count = questionCount ? parseInt(questionCount) : undefined
      const result = await quizAPI.importQuizFromFile(file, count)
      
      // Success - navigate to edit page to review AI-generated quiz
      navigate(`/edit/${result._id}`)
    } catch (err: any) {
      console.error('Import error:', err)
      setError(err.response?.data?.message || "Lỗi khi import quiz. Vui lòng thử lại.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/quiz-type-selector')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Import Quiz bằng AI</h1>
          </div>
          <p className="text-gray-600">
            Upload file Word hoặc PDF, AI sẽ tự động phân tích và tạo câu hỏi
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>
              Hỗ trợ file .docx, .doc và .pdf (tối đa 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition-all
                  ${dragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300'}
                  ${file ? 'bg-green-50 border-green-500' : ''}
                `}
              >
                <input
                  type="file"
                  id="file-upload"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {!file ? (
                  <>
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-2">
                      Kéo thả file vào đây hoặc
                    </p>
                    <label htmlFor="file-upload">
                      <Button type="button" variant="outline" asChild>
                        <span>Chọn file</span>
                      </Button>
                    </label>
                  </>
                ) : (
                  <>
                    <FileText className="w-12 h-12 mx-auto mb-4 text-green-600" />
                    <p className="font-medium text-gray-900 mb-1">{file.name}</p>
                    <p className="text-sm text-gray-500 mb-3">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFile(null)}
                    >
                      Chọn file khác
                    </Button>
                  </>
                )}
              </div>

              {/* Question Count Input (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="questionCount">
                  Số lượng câu hỏi mong muốn (tùy chọn)
                </Label>
                <Input
                  id="questionCount"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="Để trống để AI tự động quyết định"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  AI sẽ cố gắng tạo số câu hỏi bạn yêu cầu, nhưng phụ thuộc vào nội dung file
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={!file || isUploading}
                  className="flex-1"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang xử lý bằng AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Import Quiz
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/quiz-type-selector')}
                  disabled={isUploading}
                >
                  Hủy
                </Button>
              </div>

              {/* Info Text */}
              {isUploading && (
                <Alert>
                  <AlertDescription>
                    ⏳ AI đang phân tích file và tạo câu hỏi. Quá trình này có thể mất 30-60 giây.
                    Vui lòng không đóng trang.
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">💡 Mẹo sử dụng</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-700 space-y-2">
            <p>• File nên có cấu trúc rõ ràng với tiêu đề, câu hỏi và đáp án</p>
            <p>• AI có thể hiểu cả tiếng Việt và tiếng Anh</p>
            <p>• Sau khi import, bạn có thể chỉnh sửa câu hỏi trước khi xuất bản</p>
            <p>• Chức năng này chỉ dành cho Admin và Premium Users</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
