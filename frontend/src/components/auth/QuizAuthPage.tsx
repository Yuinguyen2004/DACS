"use client"

import { useState, FormEvent } from "react"
import { Eye, EyeOff, BookOpen, Loader2 } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authAPI } from "../../services/api"
import { LoginDto, RegisterDto } from "../../types/types"
import { useNavigate } from "react-router-dom"

export default function QuizAuthPage() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string>("")
  
  // Form data state
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError("")
  }

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password) {
      setError("Email và mật khẩu là bắt buộc")
      return false
    }
    
    if (!isLogin) {
      if (!formData.name || !formData.username) {
        setError("Họ tên và tên người dùng là bắt buộc")
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Mật khẩu xác nhận không khớp")
        return false
      }
      if (formData.password.length < 6) {
        setError("Mật khẩu phải có ít nhất 6 ký tự")
        return false
      }
    }
    
    return true
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setError("")

    try {
      // Import Firebase Auth and Google provider
      const { auth } = await import('../../firebase/firebase.config')
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth')
      
      const provider = new GoogleAuthProvider()
      console.log('[AUTH] Starting Google sign-in...')
      
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      
      console.log('[AUTH] Google sign-in successful:', user.email)
      
      // Get the ID token to send to backend
      const idToken = await user.getIdToken()
      
      // Send token to backend for verification and user creation/login
      const response = await fetch('http://localhost:3000/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          idToken: idToken,
          email: user.email,
          name: user.displayName,
          photoURL: user.photoURL
        })
      })

      if (!response.ok) {
        throw new Error('Failed to authenticate with backend')
      }

      const data = await response.json()
      
      // Store auth data
      localStorage.setItem('authToken', data.firebaseToken || idToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      console.log('[AUTH] Google authentication completed successfully')
      
      // Wait briefly to ensure localStorage is set
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Navigate to homepage
      navigate('/homepage')

    } catch (error: any) {
      console.error('[AUTH] Google sign-in error:', error)
      if (error.code === 'auth/popup-closed-by-user') {
        setError("Đăng nhập Google bị hủy")
      } else if (error.code === 'auth/popup-blocked') {
        setError("Popup bị chặn. Vui lòng cho phép popup và thử lại")
      } else {
        setError("Không thể đăng nhập bằng Google. Vui lòng thử lại")
      }
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('[AUTH] Form submission started:', { isLogin, email: formData.email })
    
    if (!validateForm()) {
      console.log('[AUTH] Form validation failed')
      return
    }

    setIsLoading(true)
    setError("")

    try {
      if (isLogin) {
        // Login
        const loginData: LoginDto = {
          email: formData.email,
          password: formData.password
        }
        
        console.log('[AUTH] Attempting login...')
        const result = await authAPI.login(loginData)
        console.log('[AUTH] Login successful:', result.user.name)
        
        // Wait a brief moment to ensure localStorage is fully written
        console.log('[AUTH] Waiting briefly to ensure localStorage is set...')
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Verify authentication state before navigating
        const verifyAuth = authAPI.isAuthenticated()
        console.log('[AUTH] Auth verification before navigation:', verifyAuth)
        
        if (verifyAuth) {
          console.log('[AUTH] Navigating to homepage...')
          navigate('/homepage')
        } else {
          console.error('[AUTH] Authentication verification failed after login')
          setError('Lỗi xác thực sau khi đăng nhập')
        }
      } else {
        // Register
        const registerData: RegisterDto = {
          name: formData.name,
          username: formData.username,
          email: formData.email,
          password: formData.password
        }
        
        console.log('[AUTH] Attempting registration...')
        const result = await authAPI.register(registerData)
        console.log('[AUTH] Registration successful:', result.name || result.email)
        
        // Switch to login after successful registration
        setIsLogin(true)
        setError("")
        setFormData({
          name: "",
          username: "",
          email: formData.email, // Keep email for convenience
          password: "",
          confirmPassword: ""
        })
        console.log('[AUTH] Switched to login mode after registration')
      }
    } catch (error: any) {
      console.error('[AUTH] Authentication error:', error)
      
      // Handle different error types
      if (error.response?.status === 401) {
        // Check if it's a blocked account error
        const errorMessage = error.response.data?.message || '';
        if (errorMessage.includes('blocked') || errorMessage.includes('khóa')) {
          // Show the exact error message from backend (already in Vietnamese)
          setError(errorMessage)
        } else {
          setError("Email hoặc mật khẩu không đúng")
        }
      } else if (error.response?.status === 400) {
        setError(error.response.data?.message || "Dữ liệu không hợp lệ")
      } else if (error.response?.status === 409) {
        setError("Email hoặc tên người dùng đã tồn tại")
      } else if (error.code === 'NETWORK_ERROR') {
        setError("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.")
      } else {
        setError("Đã xảy ra lỗi. Vui lòng thử lại sau.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-gray-800">Quizz</CardTitle>
            <CardDescription className="text-gray-600">
              {isLogin
                ? "Chào mừng bạn quay lại! Hãy đăng nhập để tiếp tục hành trình học tập của bạn."
                : "Tham gia cùng hàng nghìn người học và bắt đầu chuyến phiêu lưu làm bài quiz của bạn!"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Họ và Tên
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Nhập họ và tên của bạn"
                  className="h-11 border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            )}

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Tên người dùng
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Nhập tên người dùng"
                  className="h-11 border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Địa chỉ Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Nhập địa chỉ email của bạn"
                className="h-11 border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Mật khẩu
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu của bạn"
                  className="h-11 pr-10 border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </Button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Xác nhận mật khẩu
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu của bạn"
                    className="h-11 pr-10 border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                  </Button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full h-11 bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLogin ? "Đang đăng nhập..." : "Đang tạo tài khoản..."}
                </>
              ) : (
                isLogin ? "Đăng nhập" : "Tạo tài khoản"
              )}
            </Button>
          </form>

          {/* Google Sign In Button */}
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
            variant="outline"
            className="w-full h-11 border-gray-200 text-gray-700 hover:bg-gray-50 bg-white font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Đang đăng nhập với Google...
              </>
            ) : (
              <>
                <FcGoogle className="w-5 h-5 mr-3" />
                Đăng nhập với Google
              </>
            )}
          </Button>

          {isLogin && (
            <div className="text-center">
              <Button variant="link" className="text-sm text-orange-600 hover:text-orange-700 p-0 h-auto font-normal">
                Quên mật khẩu?
              </Button>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">or</span>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">{isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}</p>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-gray-200 text-gray-700 hover:bg-gray-50 bg-transparent"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Tạo tài khoản mới" : "Đăng nhập"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
