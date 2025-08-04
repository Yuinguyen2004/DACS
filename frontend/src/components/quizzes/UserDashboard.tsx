"use client"

import type React from "react"

import { useState } from "react"
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
import { Link } from "react-router-dom"

// Mock User Data
const initialUser = {
  name: "Alex Doe",
  email: "alex.doe@example.com",
  avatarUrl: "/placeholder.svg?height=40&width=40",
  status: "Active",
  isPremium: true,
}

// Mock Participated Quizzes Data
const participatedQuizzes = [
  {
    id: 1,
    name: "JavaScript Fundamentals",
    highestScore: 8,
    totalQuestions: 10,
    attempts: 3,
    lastAttemptDate: "2024-07-20",
  },
  {
    id: 2,
    name: "Advanced React Patterns",
    highestScore: 7,
    totalQuestions: 12,
    attempts: 1,
    lastAttemptDate: "2024-07-18",
  },
  {
    id: 3,
    name: "World Geography Basics",
    highestScore: 18,
    totalQuestions: 20,
    attempts: 2,
    lastAttemptDate: "2024-07-15",
  },
  {
    id: 4,
    name: "English Grammar Essentials",
    highestScore: 14,
    totalQuestions: 15,
    attempts: 1,
    lastAttemptDate: "2024-07-10",
  },
]

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
  const [currentUser, setCurrentUser] = useState(initialUser)
  const [profileForm, setProfileForm] = useState({
    name: initialUser.name,
    email: initialUser.email,
  })

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setProfileForm((prev) => ({ ...prev, [id]: value }))
  }

  const handleSaveProfile = () => {
    setCurrentUser((prev) => ({ ...prev, ...profileForm }))
    alert("Profile updated successfully!")
    console.log("Saved Profile:", profileForm)
  }

  const handleChangePassword = () => {
    alert("Redirecting to change password page/modal (not implemented in demo).")
    // In a real app, this would open a modal or navigate to a password change page
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
                    <Link to="/dashboard">
                      <Home />
                      <span>My Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/manage-quizzes">
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
                      <AvatarImage src={currentUser.avatarUrl || "/placeholder.svg"} alt={currentUser.name} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-400 text-white text-sm">
                        {currentUser.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="group-data-[state=collapsed]:hidden">{currentUser.name}</span>
                    <ChevronDown className="ml-auto h-4 w-4 group-data-[state=collapsed]:hidden" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" side="right" align="start">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
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
                  <DropdownMenuItem className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Hello, {currentUser.name.split(" ")[0]}!</h2>
            <p className="text-gray-600">Welcome back to your learning hub.</p>
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
                          Total Quizzes Completed: <span className="font-semibold">15</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BarChart2 className="w-4 h-4 text-blue-600" />
                        <span>
                          Total Attempts: <span className="font-semibold">28</span>
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
                        <p className="text-3xl font-bold text-gray-900">85%</p>
                        <p className="text-sm text-gray-600">Average Score</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-sm border-gray-200">
                    <CardContent className="p-6 flex items-center space-x-4">
                      <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-pink-600" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-gray-900">5</p>
                        <p className="text-sm text-gray-600">Quizzes This Week</p>
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
                            Attempts
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Attempt
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {participatedQuizzes.map((quiz) => (
                          <tr key={quiz.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{quiz.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={getScoreColor(quiz.highestScore, quiz.totalQuestions)}>
                                {quiz.highestScore}/{quiz.totalQuestions}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{quiz.attempts}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {quiz.lastAttemptDate}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-orange-600 border-orange-200 hover:bg-orange-50 bg-transparent"
                              >
                                View Details
                              </Button>
                            </td>
                          </tr>
                        ))}
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
                    src={currentUser.avatarUrl || "/placeholder.svg?height=80&width=80"}
                    alt={currentUser.name}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-400 text-white text-2xl">
                    {currentUser.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{currentUser.name}</h3>
                  <p className="text-sm text-gray-600">{currentUser.email}</p>
                  <Badge variant="outline" className="mt-2 text-gray-600">
                    Status: {currentUser.status}
                  </Badge>
                  {currentUser.isPremium && (
                    <Badge className="ml-2 bg-gradient-to-r from-orange-400 to-pink-400 text-white">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium User
                    </Badge>
                  )}
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
                  Change Password
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  className="bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
