"use client"

import { useState, useEffect } from "react"
import {
  BookOpen,
  ArrowLeft,
  Save,
  User,
  Mail,
  Crown,
  Shield,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Link, useParams, useNavigate } from "react-router-dom"

interface UserData {
  id: string
  name: string
  email: string
  role: "User" | "Teacher" | "Admin"
  status: "Active" | "Inactive" | "Suspended"
  isPremium: boolean
  joinDate: string
  lastLogin: string
  totalQuizzes: number
  totalAttempts: number
  notes: string
}

// Mock user data - in a real app, this would come from your backend
const mockUsers: UserData[] = [
  {
    id: "user1",
    name: "Alice Smith",
    email: "alice@example.com",
    role: "User",
    status: "Active",
    isPremium: true,
    joinDate: "2023-06-15",
    lastLogin: "2024-01-20",
    totalQuizzes: 25,
    totalAttempts: 87,
    notes: "Premium user since joining. Very active in programming quizzes.",
  },
  {
    id: "user2",
    name: "Bob Johnson",
    email: "bob@example.com",
    role: "Teacher",
    status: "Active",
    isPremium: false,
    joinDate: "2023-03-10",
    lastLogin: "2024-01-19",
    totalQuizzes: 12,
    totalAttempts: 45,
    notes: "Teacher account. Creates quality programming content.",
  },
  {
    id: "user3",
    name: "Charlie Brown",
    email: "charlie@example.com",
    role: "User",
    status: "Inactive",
    isPremium: false,
    joinDate: "2023-08-22",
    lastLogin: "2023-12-15",
    totalQuizzes: 8,
    totalAttempts: 23,
    notes: "User has been inactive for over a month. Consider re-engagement campaign.",
  },
]

export default function AdminEditUserPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()

  const [user, setUser] = useState<UserData | null>(null)
  const [formData, setFormData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)

  // Load user data on component mount
  useEffect(() => {
    if (userId) {
      // In a real app, you'd fetch from your API
      const foundUser = mockUsers.find((u) => u.id === userId)
      if (foundUser) {
        setUser(foundUser)
        setFormData({ ...foundUser })
      } else {
        // User not found, redirect back to admin dashboard
        navigate("/admin-dashboard")
      }
    }
    setIsLoading(false)
  }, [userId, navigate])

  // Track changes
  useEffect(() => {
    if (user && formData) {
      const hasChanged = JSON.stringify(user) !== JSON.stringify(formData)
      setHasChanges(hasChanged)
    }
  }, [user, formData])

  const handleInputChange = (field: keyof UserData, value: string | boolean) => {
    if (formData) {
      setFormData({
        ...formData,
        [field]: value,
      })
    }
  }

  const handleSave = () => {
    if (!formData) return

    // Basic validation
    if (!formData.name.trim()) {
      alert("Name is required.")
      return
    }
    if (!formData.email.trim()) {
      alert("Email is required.")
      return
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      alert("Please enter a valid email address.")
      return
    }

    // In a real app, you would send this data to your backend
    console.log("Updating user:", formData)
    alert("User updated successfully!")

    // Navigate back to admin dashboard
    navigate("/admin-dashboard")
  }

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm("You have unsaved changes. Are you sure you want to cancel?")) {
        navigate("/admin-dashboard")
      }
    } else {
      navigate("/admin-dashboard")
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "Inactive":
        return <XCircle className="w-4 h-4 text-gray-600" />
      case "Suspended":
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800"
      case "Inactive":
        return "bg-gray-100 text-gray-800"
      case "Suspended":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Admin":
        return <Shield className="w-4 h-4 text-purple-600" />
      case "Teacher":
        return <BookOpen className="w-4 h-4 text-blue-600" />
      case "User":
        return <User className="w-4 h-4 text-gray-600" />
      default:
        return <User className="w-4 h-4 text-gray-600" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-orange-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    )
  }

  if (!user || !formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-6">The user you're looking for doesn't exist.</p>
          <Link to="/admin-dashboard">
            <Button className="bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white">
              Back to Admin Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm mb-8 rounded-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-400 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-gray-900">Edit User</h1>
            </div>
            <Link to="/admin-dashboard">
              <Button variant="outline" className="flex items-center space-x-2 bg-transparent">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto space-y-8">
        {/* User Overview Card */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
              <User className="w-8 h-8 text-orange-500" />
              <span>User Information</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Edit user details and manage account settings for "{user.name}".
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="h-11 border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="h-11 border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            {/* Role and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center">
                  {getRoleIcon(formData.role)}
                  <span className="ml-2">User Role</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "User" | "Teacher" | "Admin") => handleInputChange("role", value)}
                >
                  <SelectTrigger className="h-11 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="User">User</SelectItem>
                    <SelectItem value="Teacher">Teacher</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center">
                  {getStatusIcon(formData.status)}
                  <span className="ml-2">Account Status</span>
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "Active" | "Inactive" | "Suspended") => handleInputChange("status", value)}
                >
                  <SelectTrigger className="h-11 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Premium Status */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-pink-50 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-3">
                <Crown className="w-5 h-5 text-orange-500" />
                <div>
                  <Label htmlFor="isPremium" className="text-base font-medium text-gray-700">
                    Premium Membership
                  </Label>
                  <p className="text-sm text-gray-600">Grant or revoke premium access</p>
                </div>
              </div>
              <Switch
                id="isPremium"
                checked={formData.isPremium}
                onCheckedChange={(checked) => handleInputChange("isPremium", checked)}
                className="data-[state=checked]:bg-orange-500 data-[state=unchecked]:bg-gray-300"
              />
            </div>

            {/* Admin Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                Admin Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={4}
                className="border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                placeholder="Add any notes about this user..."
              />
            </div>
          </CardContent>
        </Card>

        {/* User Statistics Card */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">User Statistics</CardTitle>
            <CardDescription className="text-gray-600">
              Overview of user activity and engagement (read-only).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{user.joinDate}</p>
                <p className="text-sm text-gray-600">Join Date</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{user.lastLogin}</p>
                <p className="text-sm text-gray-600">Last Login</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <BookOpen className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{user.totalQuizzes}</p>
                <p className="text-sm text-gray-600">Quizzes Taken</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <User className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{user.totalAttempts}</p>
                <p className="text-sm text-gray-600">Total Attempts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Status Display */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Badge className={getStatusColor(formData.status)}>
                {getStatusIcon(formData.status)}
                <span className="ml-1">{formData.status}</span>
              </Badge>
              <Badge variant="outline" className="text-gray-700">
                {getRoleIcon(formData.role)}
                <span className="ml-1">{formData.role}</span>
              </Badge>
              {formData.isPremium && (
                <Badge className="bg-gradient-to-r from-orange-400 to-pink-400 text-white">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="h-12 px-8 text-lg font-medium border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="h-12 px-8 text-lg font-semibold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5 mr-3" />
            {hasChanges ? "Save Changes" : "No Changes"}
          </Button>
        </div>
      </main>
    </div>
  )
}
