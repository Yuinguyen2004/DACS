"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  BookOpen,
  Trophy,
  BarChart2,
  Crown,
  Key,
  Save,
  AlertCircle,
  Calendar,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts"
import { Link, useNavigate } from "react-router-dom"
import { authAPI, userUtils, userAPI, testAttemptAPI } from "../../services/api"
import { User as UserType, TestAttempt } from "../../types/types"

export default function UserDashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [userAttempts, setUserAttempts] = useState<TestAttempt[]>([])
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
  })
  const [isCanceling, setIsCanceling] = useState(false)

  // Calculate progress data from actual user attempts
  const progressData = (() => {
    const completed = userAttempts.filter(a => a.status === 'completed').length
    const inProgress = userAttempts.filter(a => a.status !== 'completed').length
    const total = completed + inProgress

    if (total === 0) {
      // No attempts yet - show empty state
      return [
        { name: "Hoàn thành", value: 0, color: "hsl(var(--chart-1))" },
        { name: "Đang làm", value: 0, color: "hsl(var(--chart-2))" },
      ]
    }

    const completedPercent = Math.round((completed / total) * 100)
    const inProgressPercent = 100 - completedPercent

    return [
      { name: "Hoàn thành", value: completedPercent, color: "hsl(var(--chart-1))" },
      { name: "Đang làm", value: inProgressPercent, color: "hsl(var(--chart-2))" },
    ]
  })()

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        console.log('[PROFILE] Loading user profile data...')
        setIsLoading(true)

        // Check authentication
        const currentUser = authAPI.getCurrentUser()
        if (!currentUser) {
          console.log('[PROFILE] No authenticated user, redirecting to login')
          navigate('/')
          return
        }

        console.log('[PROFILE] Authenticated user found:', currentUser.name)
        setUser(currentUser)
        setProfileForm({
          name: currentUser.name || '',
          email: currentUser.email || '',
        })

        // Fetch user's test attempts
        try {
          console.log('[PROFILE] Fetching user test attempts...')
          const attempts = await testAttemptAPI.getMyAttempts()
          console.log('[PROFILE] User attempts loaded:', attempts.length)
          setUserAttempts(attempts)
        } catch (attemptError) {
          console.warn('[PROFILE] Failed to load test attempts:', attemptError)
          // Don't fail the whole page if attempts can't be loaded
        }

      } catch (error: any) {
        console.error('[PROFILE] Failed to load user data:', error)
        if (error.response?.status === 401) {
          navigate('/')
        } else {
          setError('Không thể tải thông tin tài khoản. Vui lòng thử lại sau.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [navigate])

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setProfileForm((prev) => ({ ...prev, [id]: value }))
  }

  const handleSaveProfile = async () => {
    try {
      console.log('[PROFILE] Updating profile:', profileForm)
      const updatedUser = await userAPI.updateProfile({
        name: profileForm.name,
        email: profileForm.email,
      })

      // Update local storage and state
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)

      alert('Cập nhật thông tin thành công!')
      console.log('[PROFILE] Profile updated successfully')
    } catch (error: any) {
      console.error('[PROFILE] Failed to update profile:', error)
      alert('Không thể cập nhật thông tin. Vui lòng thử lại sau.')
    }
  }

  const handleChangePassword = () => {
    alert('Tính năng đổi mật khẩu sẽ được triển khai trong phiên bản tới.')
    // TODO: Implement password change functionality
  }

  const handleCancelSubscription = async () => {
    try {
      setIsCanceling(true)
      console.log('[PROFILE] Canceling subscription...')
      await userAPI.cancelSubscription()

      // Refresh user data
      const updatedUser = await userAPI.getProfile()
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)

      console.log('[PROFILE] Subscription canceled successfully')
      alert('Hủy gói thành công. Bạn vẫn có thể sử dụng Premium đến hết thời hạn.')
    } catch (error: any) {
      console.error('[PROFILE] Failed to cancel subscription:', error)
      alert(error.response?.data?.message || 'Không thể hủy gói. Vui lòng thử lại sau.')
    } finally {
      setIsCanceling(false)
    }
  }

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatSubscriptionType = (type: string | undefined) => {
    switch (type?.toLowerCase()) {
      case 'monthly': return 'Hàng tháng'
      case 'yearly': return 'Hàng năm'
      case 'lifetime': return 'Trọn đời'
      default: return 'Premium'
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin tài khoản...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Có lỗi xảy ra</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Thử lại
          </Button>
        </div>
      </div>
    )
  }

  // No user found
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">👤</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Chưa đăng nhập</h2>
          <p className="text-gray-600 mb-4">Vui lòng đăng nhập để xem thông tin tài khoản</p>
          <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700">
            Đăng nhập
          </Button>
        </div>
      </div>
    )
  }

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100
    if (percentage >= 80) return "bg-green-100 text-green-800"
    if (percentage >= 60) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const chartConfig = {
    completed: {
      label: "Hoàn thành",
      color: "hsl(var(--chart-1))",
    },
    inProgress: {
      label: "Đang làm",
      color: "hsl(var(--chart-2))",
    },
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader>
          <Link to="/" className="flex items-center space-x-2 p-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-400 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 group-data-[state=collapsed]:hidden">Quizz</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        {/* Main Dashboard Content */}
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          {/* Welcome Section */}
          <div className="mb-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Xin chào, {user.name.split(" ")[0]}!</h2>
            <p className="text-gray-600">Chào mừng trở lại với không gian học tập của bạn.</p>
            <div className="mt-2">
              {userUtils.hasPremiumAccess(user) ? (
                <Badge className="bg-gradient-to-r from-orange-400 to-pink-400 text-white">
                  <Crown className="w-3 h-3 mr-1" />
                  Gói {userUtils.getPackageName(user)}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-600">
                  Gói {userUtils.getPackageName(user)}
                </Badge>
              )}
            </div>
          </div>

          {/* Overview & Activity Section */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">Tổng quan & Hoạt động gần đây</CardTitle>
              <CardDescription className="text-gray-600">
                Theo dõi tiến độ học tập và các lần làm quiz gần đây.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Progress Chart & Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 shadow-sm border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">Tiến độ học tập</CardTitle>
                    <CardDescription className="text-gray-600">
                      Tổng quan trạng thái hoàn thành quiz của bạn.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col md:flex-row items-center justify-center gap-6 p-6">
                    <ChartContainer config={chartConfig} className="h-[200px] w-[200px] flex-shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="name" hideLabel />} />
                          <Pie
                            data={progressData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={60}
                            outerRadius={80}
                            strokeWidth={2}
                            paddingAngle={5}
                            cornerRadius={5}
                          >
                            {progressData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                    <div className="flex flex-col gap-3 text-sm text-gray-700">
                      {progressData.map((entry, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span>
                            {entry.name}: <span className="font-semibold">{entry.value}%</span>
                          </span>
                        </div>
                      ))}
                      <Separator className="my-2" />
                      <div className="flex items-center space-x-2">
                        <Trophy className="w-4 h-4 text-yellow-600" />
                        <span>
                          Tổng quiz hoàn thành: <span className="font-semibold">{userAttempts.filter(a => a.status === 'completed').length}</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BarChart2 className="w-4 h-4 text-blue-600" />
                        <span>
                          Tổng lượt thử: <span className="font-semibold">{userAttempts.length}</span>
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats Cards */}
                <div className="grid grid-cols-1 gap-6">
                  <Card className="shadow-sm border-gray-200">
                    <CardContent className="p-6 flex items-center space-x-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-gray-900">
                          {userAttempts.length > 0
                            ? Math.round(
                                userAttempts
                                  .filter(a => a.status === 'completed')
                                  .reduce((acc, a) => acc + (a.score || 0), 0) /
                                userAttempts.filter(a => a.status === 'completed').length
                              )
                            : 0}%
                        </p>
                        <p className="text-sm text-gray-600">Điểm trung bình</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm border-gray-200">
                    <CardContent className="p-6 flex items-center space-x-4">
                      <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-gray-900">
                          {userAttempts.filter(a => {
                            const oneWeekAgo = new Date()
                            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
                            return new Date(a.started_at) >= oneWeekAgo
                          }).length}
                        </p>
                        <p className="text-sm text-gray-600">Quiz tuần này</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Recent Quiz Activity List */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Hoạt động quiz gần đây</CardTitle>
                  <CardDescription className="text-gray-600">Xem lại các lần làm quiz gần đây.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tên Quiz
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Điểm cao nhất
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Trạng thái
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ngày
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hành động
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {userAttempts.length > 0 ? (
                          userAttempts.slice(0, 5).map((attempt) => (
                            <tr key={attempt._id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {typeof attempt.quiz_id === 'object' ? attempt.quiz_id.title : 'Quiz'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge className={getScoreColor(attempt.correct_answers || 0, attempt.total_questions || 1)}>
                                  {attempt.correct_answers || 0}/{attempt.total_questions || 1}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {attempt.status === 'completed' ? 'Hoàn thành' : 'Đang làm'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {new Date(attempt.started_at).toLocaleDateString('vi-VN')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-orange-600 border-orange-200 hover:bg-orange-50 bg-transparent"
                                  onClick={() => navigate(`/history`)}
                                >
                                  Xem chi tiết
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                              Chưa có lịch sử làm quiz nào
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Profile Settings Section */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">Cài đặt hồ sơ</CardTitle>
              <CardDescription className="text-gray-600">
                Cập nhật thông tin cá nhân và quản lý tài khoản.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={user.avatar || "/placeholder.svg?height=80&width=80"}
                    alt={user.name}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-400 text-white text-2xl">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-gray-600">
                      Trạng thái: Hoạt động
                    </Badge>
                    {userUtils.hasPremiumAccess(user) ? (
                      <Badge className="bg-gradient-to-r from-orange-400 to-pink-400 text-white">
                        <Crown className="w-3 h-3 mr-1" />
                        Người dùng {userUtils.getPackageName(user)}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600">
                        Người dùng {userUtils.getPackageName(user)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Tên
                  </Label>
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    className="col-span-3 border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    className="col-span-3 border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleChangePassword}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Đổi mật khẩu
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  className="bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Lưu thay đổi
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Management Section - Only for Premium Users */}
          {userUtils.hasPremiumAccess(user) && (
            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Quản lý gói đăng ký</CardTitle>
                <CardDescription className="text-gray-600">
                  Xem thông tin và quản lý gói Premium của bạn.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-lg p-6 border border-orange-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-400 rounded-lg flex items-center justify-center">
                        <Crown className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Gói {formatSubscriptionType(user.subscriptionType)}
                        </h3>
                        {user.subscriptionCanceledAt ? (
                          <p className="text-orange-600 font-medium flex items-center">
                            <XCircle className="w-4 h-4 mr-1" />
                            Đã hủy - Hết hạn vào {formatDate(user.subscriptionEndDate)}
                          </p>
                        ) : user.subscriptionType?.toLowerCase() === 'lifetime' ? (
                          <p className="text-green-600 font-medium flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Truy cập trọn đời
                          </p>
                        ) : (
                          <p className="text-gray-600 flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Còn hiệu lực đến {formatDate(user.subscriptionEndDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Subscription Details */}
                  <Separator className="my-4" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Loại gói</p>
                      <p className="font-medium text-gray-900">{formatSubscriptionType(user.subscriptionType)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Ngày bắt đầu</p>
                      <p className="font-medium text-gray-900">{formatDate(user.subscriptionStartDate)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Ngày hết hạn</p>
                      <p className="font-medium text-gray-900">
                        {user.subscriptionType?.toLowerCase() === 'lifetime' ? 'Không giới hạn' : formatDate(user.subscriptionEndDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Trạng thái</p>
                      <p className={`font-medium ${user.subscriptionCanceledAt ? 'text-orange-600' : 'text-green-600'}`}>
                        {user.subscriptionCanceledAt ? 'Đã hủy' : 'Đang hoạt động'}
                      </p>
                    </div>
                  </div>

                  {/* Cancel Button - Only show if not canceled and not lifetime */}
                  {!user.subscriptionCanceledAt && user.subscriptionType?.toLowerCase() !== 'lifetime' && (
                    <>
                      <Separator className="my-4" />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                            disabled={isCanceling}
                          >
                            {isCanceling ? (
                              <>
                                <span className="animate-spin mr-2">⏳</span>
                                Đang xử lý...
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 mr-2" />
                                Hủy gói đăng ký
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center">
                              <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
                              Bạn có chắc chắn muốn hủy?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn vẫn có thể sử dụng các tính năng Premium đến ngày {formatDate(user.subscriptionEndDate)}.
                              Sau đó, tài khoản sẽ được chuyển về gói Miễn phí.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Giữ gói</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleCancelSubscription}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Xác nhận hủy
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
