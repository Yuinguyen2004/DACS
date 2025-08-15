"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Home,
  BookOpen,
  History,
  LogOut,
  Trophy,
  BarChart2,
  Crown,
  ChevronDown,
  User,
  Settings,
  HelpCircle,
  Key,
  Save,
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
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts"
import { Link, useNavigate } from "react-router-dom"
import { authAPI, userUtils, userAPI, testAttemptAPI } from "../../services/api"
import { User as UserType, TestAttempt } from "../../types/types"

// Mock Featured Quizzes Data (kept for "Recommended Quizzes" section)
const featuredQuizzes = [
  {
    id: 101,
    title: "Python for Beginners",
    description: "Start your coding journey with Python!",
    questions: 20,
    isPremium: false,
    category: "Programming",
  },
  {
    id: 102,
    title: "Data Science Fundamentals",
    description: "Explore the basics of data analysis and machine learning.",
    questions: 30,
    isPremium: true,
    category: "Technology",
  },
  {
    id: 103,
    title: "History of Art",
    description: "Discover major art movements and famous artists.",
    questions: 25,
    isPremium: false,
    category: "Arts",
  },
  {
    id: 104,
    title: "Financial Literacy",
    description: "Learn essential concepts for managing your money.",
    questions: 15,
    isPremium: true,
    category: "Finance",
  },
]

// Mock Progress Data for Chart
const progressData = [
  { name: "Completed", value: 70, color: "hsl(var(--chart-1))" },
  { name: "In Progress", value: 20, color: "hsl(var(--chart-2))" },
  { name: "Not Started", value: 10, color: "hsl(var(--chart-3))" },
]

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
  
  const handleLogout = async () => {
    console.log('[PROFILE] User logging out')
    await authAPI.logout()
    console.log('[PROFILE] Logout successful, redirecting to login')
    navigate('/')
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

  const getFeaturedQuizStatus = (isPremium: boolean) => {
    return isPremium ? (
      <Badge className="bg-gradient-to-r from-orange-400 to-pink-400 text-white">
        <Crown className="w-3 h-3 mr-1" />
        Premium
      </Badge>
    ) : (
      <Badge variant="outline" className="text-green-600 border-green-600">
        Free
      </Badge>
    )
  }

  const chartConfig = {
    completed: {
      label: "Completed",
      color: "hsl(var(--chart-1))",
    },
    inProgress: {
      label: "In Progress",
      color: "hsl(var(--chart-2))",
    },
    notStarted: {
      label: "Not Started",
      color: "hsl(var(--chart-3))",
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
          <SidebarGroup>
            <SidebarGroupLabel className="group-data-[state=collapsed]:hidden">Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive>
                    <Link to="/profile">
                      <Home />
                      <span>My Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/manage">
                      <BookOpen />
                      <span>My Quizzes</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/history">
                      <History />
                      <span>Quiz History</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/upgrade">
                      <Crown />
                      <span>Upgrade Premium</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.name} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-400 text-white text-sm">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="group-data-[state=collapsed]:hidden">{user.name}</span>
                    <ChevronDown className="ml-auto h-4 w-4 group-data-[state=collapsed]:hidden" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" side="right" align="start">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>Support</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
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
              <CardTitle className="text-xl font-semibold text-gray-900">Overview & Recent Activity</CardTitle>
              <CardDescription className="text-gray-600">
                Track your learning progress and recent quiz attempts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Progress Chart & Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 shadow-sm border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">Your Learning Progress</CardTitle>
                    <CardDescription className="text-gray-600">
                      Overview of your quiz completion status.
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
                  <CardTitle className="text-lg font-semibold text-gray-900">Recent Quiz Activity</CardTitle>
                  <CardDescription className="text-gray-600">Review your most recent quiz attempts.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quiz Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Highest Score
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
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
              <CardTitle className="text-xl font-semibold text-gray-900">Profile Settings</CardTitle>
              <CardDescription className="text-gray-600">
                Update your personal information and manage your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={user.avatar_url || "/placeholder.svg?height=80&width=80"}
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
                    Name
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
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}