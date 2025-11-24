"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  Users,
  UserCheck,
  ClipboardList,
  BarChart2,
  Search,
  Filter,
  Crown,
  User as UserIcon,
  UserCog,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { authAPI, adminAPI, userUtils } from "../../../services/api";
import { User } from "../../../types/types";

interface AdminStats {
  totalUsers: number;
  totalTeachers: number;
  activeUsers: number;
  premiumUsers: number;
  totalQuizzes: number;
  totalAttempts: number;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [error, setError] = useState<string>("");

  const categories = ["all", "user", "teacher", "admin"];
  const statusOptions = ["all", "active", "inactive"];

  // Check admin access and load initial data
  useEffect(() => {
    const loadAdminData = async () => {
      try {
        console.log("[ADMIN] Loading admin dashboard...");
        setIsLoading(true);

        // Check authentication and admin access
        const currentUser = authAPI.getCurrentUser();
        if (!currentUser) {
          console.log("[ADMIN] No authenticated user, redirecting to login");
          navigate("/");
          return;
        }

        if (!userUtils.isAdmin(currentUser)) {
          console.log("[ADMIN] User is not admin, access denied");
          navigate("/");
          return;
        }

        // Load admin stats and users
        const [statsData, usersData] = await Promise.all([
          adminAPI.getAdminStats(),
          adminAPI.getAllUsers({ page: 1, limit: 10 }),
        ]);

        setStats(statsData);
        setUsers(usersData.users);
        setTotalPages(usersData.pagination.totalPages);

        console.log("[ADMIN] Admin data loaded successfully");
      } catch (error: any) {
        console.error("[ADMIN] Failed to load admin data:", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log("[ADMIN] Access denied, redirecting to homepage");
          navigate("/");
        } else {
          setError("Không thể tải dữ liệu admin. Vui lòng thử lại sau.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminData();
  }, [navigate]);

  // Load users with filters
  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const usersData = await adminAPI.getAllUsers({
        search: searchQuery || undefined,
        role: filterRole !== "all" ? filterRole : undefined,
        status: filterStatus !== "all" ? filterStatus : undefined,
        page: currentPage,
        limit: 10,
      });

      setUsers(usersData.users);
      setTotalPages(usersData.pagination.totalPages);
    } catch (error: any) {
      console.error("[ADMIN] Failed to load users:", error);
      setError("Không thể tải danh sách người dùng.");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Reload users when filters change
  useEffect(() => {
    if (!isLoading) {
      const timeoutId = setTimeout(() => {
        setCurrentPage(1);
        loadUsers();
      }, 300); // Debounce search

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, filterRole, filterStatus, isLoading]);

  // Reload users when page changes
  useEffect(() => {
    if (!isLoading && currentPage > 1) {
      loadUsers();
    }
  }, [currentPage, isLoading]);

  const handleUpdateUser = async (
    userId: string,
    field: "role" | "status",
    value: string
  ) => {
    try {
      const updateData = { [field]: value };
      await adminAPI.updateUser(userId, updateData);

      // Reload users to reflect changes
      await loadUsers();
      console.log(`[ADMIN] User ${userId} updated: ${field} = ${value}`);
    } catch (error: any) {
      console.error("[ADMIN] Failed to update user:", error);
      alert("Không thể cập nhật người dùng. Vui lòng thử lại.");
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa người dùng "${userName}"?`)) {
      return;
    }

    try {
      await adminAPI.deleteUser(userId);

      // Reload users and stats
      await Promise.all([loadUsers(), loadStats()]);
      console.log(`[ADMIN] User ${userId} deleted successfully`);
    } catch (error: any) {
      console.error("[ADMIN] Failed to delete user:", error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Không thể xóa người dùng. Vui lòng thử lại.");
      }
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await adminAPI.getAdminStats();
      setStats(statsData);
    } catch (error) {
      console.error("[ADMIN] Failed to reload stats:", error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md text-center p-6">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải bảng điều khiển admin...</p>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md text-center p-6">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Có lỗi xảy ra
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Thử lại
          </Button>
        </Card>
      </div>
    );
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
              <h1 className="text-lg font-semibold text-gray-900">
                Admin Dashboard
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.totalUsers || 0}
                </p>
                <p className="text-sm text-gray-600">Tổng số người dùng</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.totalTeachers || 0}
                </p>
                <p className="text-sm text-gray-600">Tổng số giáo viên</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.totalQuizzes || 0}
                </p>
                <p className="text-sm text-gray-600">Tổng số bài kiểm tra</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <BarChart2 className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.totalAttempts || 0}
                </p>
                <p className="text-sm text-gray-600">Tổng số lượt làm bài</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users/Teachers Management */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Người dùng
            </CardTitle>
            <CardDescription className="text-gray-600">
              Quản lý tài khoản người dùng và vai trò.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-6 border-b border-gray-100">
              <div className="relative flex-1 w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Tìm kiếm người dùng theo tên hoặc email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 border-gray-200 focus:border-orange-400 focus:ring-orange-400 w-full"
                />
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-full sm:w-40 h-10 border-gray-200">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category === "all"
                          ? "Tất cả vai trò"
                          : category === "user"
                          ? "Người dùng"
                          : category === "teacher"
                          ? "Giáo viên"
                          : category === "admin"
                          ? "Quản trị viên"
                          : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-40 h-10 border-gray-200">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status === "all"
                          ? "Tất cả trạng thái"
                          : status === "active"
                          ? "Đang hoạt động"
                          : status === "inactive"
                          ? "Không hoạt động"
                          : status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoadingUsers ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">
                  Đang tải danh sách người dùng...
                </p>
              </div>
            ) : users.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-900">
                        Tên
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900">
                        Email
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900">
                        Role
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900">
                        Trạng thái
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900">
                        Premium
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right">
                        Thao tác
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const isPremium = userUtils.hasPremiumAccess(user);
                      return (
                        <TableRow key={user._id} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-800">
                            {user.name}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            {user.email}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(value) =>
                                handleUpdateUser(user._id, "role", value)
                              }
                            >
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Người dùng</SelectItem>
                                <SelectItem value="admin">
                                  Quản trị viên
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.status}
                              onValueChange={(value) =>
                                handleUpdateUser(user._id, "status", value)
                              }
                            >
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">
                                  Hoạt động
                                </SelectItem>
                                <SelectItem value="inactive">
                                  Không hoạt động
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {isPremium ? (
                              <Badge className="bg-gradient-to-r from-orange-400 to-pink-400 text-white">
                                <Crown className="w-3 h-3 mr-1" />
                                Có
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-gray-600"
                              >
                                Không
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDeleteUser(user._id, user.name)
                              }
                              className="h-8 px-3 text-red-500 border-red-200 hover:bg-red-50 bg-transparent"
                              disabled={user.role === "admin"}
                            >
                              {user.role === "admin" ? "Không thể xóa" : "Xóa"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Không tìm thấy người dùng nào
                </h3>
                <p className="text-gray-600">
                  {searchQuery || filterRole !== "all" || filterStatus !== "all"
                    ? "Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc."
                    : "Chưa có người dùng nào trong hệ thống."}
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <div className="text-sm text-gray-700">
                  Trang {currentPage} / {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1 || isLoadingUsers}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages || isLoadingUsers}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
