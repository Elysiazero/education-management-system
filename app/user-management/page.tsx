"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Users,
  Shield,
  Loader2
} from "lucide-react"
import { toast } from "sonner"

interface User {
  id: number
  userName: string
  realName: string
  email: string
  phone?: string
  roleIds: number[]
}

interface RoleDistribution {
  role: string
  count: number
  percentage: number
}

export default function UserManagementPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [roleDistribution, setRoleDistribution] = useState<RoleDistribution[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [newUser, setNewUser] = useState({
    userName: "",
    realName: "",
    email: "",
    phone: "",
    password: "Test@123",
    roleIds: [2]
  })
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<number | null>(null)
  const router = useRouter()
  const [saving, setSaving] = useState(false);
  const [emailError, setEmailError] = useState("")
  const [phoneError, setPhoneError] = useState("")

  // 获取访问令牌
  const getAccessToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("accessToken")
    }
    return null
  }

  // 角色名称到ID映射
  const roleNameToIdMap: Record<string, number> = {
    "系统管理员": 1,
    "管理员": 1,
    "教师": 2,
    "学生": 3,
    "ROLE_ADMIN": 1,
    "ROLE_TEACHER": 2,
    "ROLE_STUDENT": 3
  }

  // 获取当前用户信息
  const fetchCurrentUser = async () => {
    if (typeof window === 'undefined') return null;

    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return null
    }

    try {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role !== "admin") {
        router.push("/")
        return null
      }
      return parsedUser
    } catch (error) {
      console.error("解析用户数据错误:", error)
      router.push("/login")
      return null
    }
  }

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        toast.error("未找到访问令牌")
        return []
      }

      const response = await fetch("http://localhost:8080/api/v1/auth/admin/users?page=1&limit=100", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.text();
        console.error("服务器错误详情:", errorData);
        throw new Error(`获取用户列表失败: ${response.status} - ${errorData}`);
      }

      const data = await response.json()

      // 映射后端数据到前端接口
      const mappedUsers = data.users.map((user: any) => ({
        id: user.id,
        userName: user.username || "", // 确保有用户名
        realName: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        roleIds: user.roles.map((role: string) => roleNameToIdMap[role] || 0)
      }))

      return mappedUsers
    } catch (error) {
      console.error("获取用户列表错误:", error)
      toast.error("获取用户列表失败")
      return []
    }
  }

  // 获取单个用户详情（用于编辑）
  const fetchUserDetail = async (userId: number) => {
    try {
      const token = getAccessToken();
      if (!token) {
        toast.error("未找到访问令牌");
        return null;
      }

      const response = await fetch(`http://localhost:8080/api/v1/me/${userId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("获取用户详情失败");
      }

      const userData = await response.json();

      return {
        id: userData.id,
        userName: userData.username,
        realName: userData.realName,
        email: userData.email,
        phone: userData.phoneNumber,
        roleIds: userData.roles.map((role: string) => roleNameToIdMap[role] || 0)
      };
    } catch (error) {
      console.error("获取用户详情错误:", error);
      toast.error("获取用户详情失败");
      return null;
    }
  };

  // 获取角色分布统计
  const fetchRoleDistribution = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        toast.error("未找到访问令牌")
        return []
      }

      const response = await fetch("http://localhost:8080/api/v1/auth/admin/analytics/role-distribution", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error("获取角色分布统计失败")
      }

      const data = await response.json()

      // 映射角色名称
      const roleNameMap: Record<string, string> = {
        "ROLE_ADMIN": "管理员",
        "ROLE_TEACHER": "教师",
        "ROLE_STUDENT": "学生"
      }

      return data.map((item: any) => ({
        ...item,
        role: roleNameMap[item.role] || item.role
      }))
    } catch (error) {
      console.error("获取角色分布统计错误:", error)
      toast.error("获取角色分布统计失败")
      return []
    }
  }

  const createUser = async (userData: any) => {
    try {
      const token = getAccessToken();
      if (!token) {
        toast.error("未找到访问令牌");
        return false;
      }

      const payload = {
        userName: userData.userName,
        realName: userData.realName,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        roleIds: userData.roleIds
      };

      const response = await fetch("http://localhost:8080/api/v1/auth/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 201) {
        toast.success("用户创建成功");
        return true;
      }

      // 改进错误处理
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: `${response.status} ${response.statusText}` };
      }

      throw new Error(errorData.message || "创建用户失败");

    } catch (error: any) {
      console.error("创建用户错误:", error);
      toast.error(error.message || "创建用户失败");
      return false;
    }
  };

  // 更新用户基本信息
  const updateUser = async (userId: number, userData: any) => {
    try {
      const token = getAccessToken();
      if (!token) {
        toast.error("未找到访问令牌");
        return { success: false };
      }

      // 准备发送给后端的数据
      const payload = {
        userName: userData.userName,
        realName: userData.realName,
        email: userData.email,
        phone: userData.phone
      };

      const response = await fetch(`http://localhost:8080/api/v1/auth/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      // 处理成功响应
      if (response.status === 200 || response.status === 204) {
        return { success: true };
      }

      // 处理错误响应
      let errorMessage = `更新失败: ${response.status} ${response.statusText}`;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        }
      } catch (e) {
        console.warn("解析错误响应失败", e);
      }

      throw new Error(errorMessage);

    } catch (error: any) {
      console.error("更新用户错误:", error);
      toast.error(error.message || "更新用户失败");
      return { success: false };
    }
  };

  // 更新用户角色（新增方法）
  const updateUserRoles = async (userId: number, roleIds: number[]) => {
    try {
      const token = getAccessToken();
      if (!token) {
        toast.error("未找到访问令牌");
        return false;
      }

      const response = await fetch(`http://localhost:8080/api/v1/auth/admin/users/${userId}/roles`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ roleIds })
      });

      if (response.status === 200 || response.status === 204) {
        return true;
      }

      // 处理错误响应
      let errorMessage = `更新角色失败: ${response.status} ${response.statusText}`;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        }
      } catch (e) {
        console.warn("解析错误响应失败", e);
      }

      throw new Error(errorMessage);

    } catch (error: any) {
      console.error("更新用户角色错误:", error);
      toast.error(error.message || "更新用户角色失败");
      return false;
    }
  };

  const deleteUser = async (userId: number) => {
    try {
      const token = getAccessToken();
      if (!token) {
        toast.error("未找到访问令牌");
        return false;
      }

      const response = await fetch(`http://localhost:8080/api/v1/auth/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      // 正确处理 204 No Content 响应
      if (response.status === 200 || response.status === 204) {
        toast.success("用户删除成功");
        return true;
      }

      // 处理错误响应
      let errorMessage = `删除失败: ${response.status} ${response.statusText}`;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        }
      } catch (e) {
        console.warn("解析错误响应失败", e);
      }

      throw new Error(errorMessage);

    } catch (error: any) {
      console.error("删除用户错误:", error);
      toast.error(error.message || "删除用户失败");
      return false;
    }
  };

  useEffect(() => {
    const init = async () => {
      const user = await fetchCurrentUser()
      if (!user) return

      setCurrentUser(user)

      const [usersData, roleData] = await Promise.all([
        fetchUsers(),
        fetchRoleDistribution()
      ])

      setUsers(usersData)
      setFilteredUsers(usersData)
      setRoleDistribution(roleData)
      setIsLoading(false)
    }

    init()
  }, [router])

  useEffect(() => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(
          (user) =>
              (user.realName?.toLowerCase().includes(searchTerm.toLowerCase()) || "") ||
              (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || "") ||
              (user.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || "")
      )
    }

    if (roleFilter !== "all") {
      const roleMap: Record<string, number> = {
        "admin": 1,
        "teacher": 2,
        "student": 3
      }

      const roleId = roleMap[roleFilter]
      if (roleId) {
        filtered = filtered.filter((user) =>
            user.roleIds?.includes(roleId))
      }
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter])

  const getRoleLabel = (roleId: number) => {
    const labels: Record<number, string> = {
      1: "管理员",
      2: "教师",
      3: "学生"
    }
    return labels[roleId] || `角色${roleId}`
  }

  const getRoleColor = (roleId: number) => {
    const colors: Record<number, string> = {
      1: "bg-orange-100 text-orange-800",
      2: "bg-purple-100 text-purple-800",
      3: "bg-blue-100 text-blue-800"
    }
    return colors[roleId] || "bg-gray-100 text-gray-800"
  }

  // 验证邮箱格式
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      setEmailError("请输入有效的邮箱地址");
      return false;
    } else {
      setEmailError("");
      return true;
    }
  }

  // 验证电话号码格式
  const validatePhone = (phone: string) => {
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      setPhoneError("请输入有效的手机号码");
      return false;
    } else {
      setPhoneError("");
      return true;
    }
  }

  const handleCreateUser = async () => {
    // 表单验证
    if (!newUser.userName || !newUser.realName || !newUser.email) {
      toast.error("请填写必填字段：用户名、真实姓名和邮箱");
      return;
    }

    // 邮箱格式验证
    if (!validateEmail(newUser.email)) return;

    // 手机号格式验证（可选）
    if (newUser.phone && !validatePhone(newUser.phone)) return;

    const success = await createUser(newUser)
    if (success) {
      const updatedUsers = await fetchUsers()
      setUsers(updatedUsers)
      setShowUserDialog(false)
      setNewUser({
        userName: "",
        realName: "",
        email: "",
        phone: "",
        password: "Test@123",
        roleIds: [2]
      })
    }
  }

  const handleEditUser = async (userId: number) => {
    const userDetail = await fetchUserDetail(userId)
    if (userDetail) {
      setSelectedUser(userDetail)
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    // 表单验证
    if (!selectedUser.userName || !selectedUser.realName || !selectedUser.email) {
      toast.error("请填写必填字段：用户名、真实姓名和邮箱");
      return;
    }

    // 邮箱格式验证
    if (!validateEmail(selectedUser.email)) return;

    // 手机号格式验证（可选）
    if (selectedUser.phone && !validatePhone(selectedUser.phone)) return;

    setSaving(true);

    try {
      // 1. 更新用户基本信息
      const basicResult = await updateUser(selectedUser.id, {
        userName: selectedUser.userName,
        realName: selectedUser.realName,
        email: selectedUser.email,
        phone: selectedUser.phone || ""
      });

      if (!basicResult.success) {
        throw new Error("更新用户基本信息失败");
      }

      // 2. 更新用户角色（使用新添加的API）
      const roleResult = await updateUserRoles(selectedUser.id, selectedUser.roleIds);

      if (!roleResult) {
        throw new Error("更新用户角色失败");
      }

      // 显示成功提示
      toast.success("用户信息更新成功");

      // 刷新用户列表
      const updatedUsers = await fetchUsers();
      setUsers(updatedUsers);

      // 关闭编辑弹窗
      setSelectedUser(null);

      // 刷新页面数据
      window.location.reload();
    } catch (error) {
      console.error("保存失败:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    const success = await deleteUser(userId)
    if (success) {
      const updatedUsers = await fetchUsers()
      setUsers(updatedUsers)
      setUserToDelete(null)
      setDeleteConfirmOpen(false)
      // 刷新页面数据
      window.location.reload();
    }
  }

  const handleNewUserChange = (field: string, value: string | number | number[]) => {
    setNewUser(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDeleteConfirmation = (userId: number) => {
    setUserToDelete(userId)
    setDeleteConfirmOpen(true)
  }

  if (isLoading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-gray-600">加载用户数据中...</p>
          </div>
        </div>
    )
  }

  if (!currentUser) {
    return <div>未授权访问，正在重定向...</div>
  }

  const totalUsers = users.length;
  const teachers = users.filter(u => u.roleIds?.includes(2)).length;
  const students = users.filter(u => u.roleIds?.includes(3)).length;

  return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">用户管理</h1>
              <p className="text-gray-600">管理系统中的所有用户账户</p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={() => setShowUserDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                添加用户
              </Button>
            </div>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">总用户数</p>
                    <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Shield className="w-8 h-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">教师数量</p>
                    <p className="text-2xl font-bold text-gray-900">{teachers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">学生数量</p>
                    <p className="text-2xl font-bold text-gray-900">{students}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList>
              <TabsTrigger value="users">用户列表</TabsTrigger>
              <TabsTrigger value="analytics">用户分析</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              {/* 筛选器 */}
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <Search className="w-6 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                          placeholder="搜索用户..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                      />
                    </div>

                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="用户角色" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部角色</SelectItem>
                        <SelectItem value="admin">管理员</SelectItem>
                        <SelectItem value="teacher">教师</SelectItem>
                        <SelectItem value="student">学生</SelectItem>
                      </SelectContent>
                    </Select>

                    {/*<Button variant="outline">*/}
                    {/*  <Search className="w-4 h-4 mr-2" />*/}
                    {/*  高级搜索*/}
                    {/*</Button>*/}
                  </div>
                </CardContent>
              </Card>

              {/* 用户表格 */}
              <Card>
                <CardHeader>
                  <CardTitle>用户列表 ({filteredUsers.length} 个用户)</CardTitle>
                  <CardDescription>系统中所有用户的详细信息</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>用户</TableHead>
                          <TableHead>电话</TableHead>
                          <TableHead>角色</TableHead>
                          <TableHead>操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-12">
                                <div className="flex flex-col items-center">
                                  <Users className="w-12 h-12 text-gray-400 mb-2" />
                                  <p className="text-gray-500">未找到匹配的用户</p>
                                  <Button
                                      variant="ghost"
                                      className="mt-2"
                                      onClick={() => {
                                        setSearchTerm("");
                                        setRoleFilter("all");
                                      }}
                                  >
                                    重置筛选条件
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                  <TableCell>
                                    <div className="flex items-center space-x-3">
                                      <Avatar className="w-10 h-10">
                                        <AvatarImage src="/placeholder.svg" alt={user.realName} />
                                        <AvatarFallback>
                                          {user.realName?.charAt(0) || "U"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium">{user.realName || "未命名用户"}</p>
                                        <p className="text-sm text-gray-500">{user.email || "无邮箱"}</p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <p className="text-sm">{user.phone || "无电话"}</p>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                      {(user.roleIds || []).map((roleId, index) => (
                                          <Badge key={index} className={getRoleColor(roleId)}>
                                            {getRoleLabel(roleId)}
                                          </Badge>
                                      ))}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center space-x-2">
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleEditUser(user.id)}
                                          >
                                            <Edit className="w-4 h-4" />
                                          </Button>
                                        </DialogTrigger>
                                        {/*编辑弹窗*/}
                                        <DialogContent className="max-w-2xl">
                                          <DialogHeader>
                                            <DialogTitle>用户详情</DialogTitle>
                                            <DialogDescription>查看和编辑用户信息</DialogDescription>
                                          </DialogHeader>
                                          {selectedUser && (
                                              <div className="space-y-6">
                                                <div className="flex items-center space-x-4">
                                                  <Avatar className="w-16 h-16">
                                                    <AvatarImage
                                                        src="/placeholder.svg"
                                                        alt={selectedUser.realName}
                                                    />
                                                    <AvatarFallback className="text-lg">
                                                      {selectedUser.realName?.charAt(0) || "U"}
                                                    </AvatarFallback>
                                                  </Avatar>
                                                  <div>
                                                    <h3 className="text-lg font-semibold">{selectedUser.realName}</h3>
                                                    <p className="text-gray-600">{selectedUser.email}</p>
                                                  </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                  <div>
                                                    <Label>用户名 *</Label>
                                                    <Input
                                                        value={selectedUser.userName}
                                                        onChange={(e) => setSelectedUser({
                                                          ...selectedUser,
                                                          userName: e.target.value
                                                        })}
                                                        disabled={saving}
                                                    />
                                                  </div>
                                                  <div>
                                                    <Label>真实姓名 *</Label>
                                                    <Input
                                                        value={selectedUser.realName}
                                                        onChange={(e) => setSelectedUser({
                                                          ...selectedUser,
                                                          realName: e.target.value
                                                        })}
                                                        disabled={saving}
                                                    />
                                                  </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                  <div>
                                                    <Label>邮箱 *</Label>
                                                    <Input
                                                        value={selectedUser.email}
                                                        onChange={(e) => {
                                                          setSelectedUser({
                                                            ...selectedUser,
                                                            email: e.target.value
                                                          })
                                                          validateEmail(e.target.value)
                                                        }}
                                                        disabled={saving}
                                                    />
                                                    {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
                                                  </div>
                                                  <div>
                                                    <Label>电话</Label>
                                                    <Input
                                                        value={selectedUser.phone || ""}
                                                        onChange={(e) => {
                                                          setSelectedUser({
                                                            ...selectedUser,
                                                            phone: e.target.value
                                                          })
                                                          validatePhone(e.target.value)
                                                        }}
                                                        disabled={saving}
                                                    />
                                                    {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
                                                  </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                  <div>
                                                    <Label>角色</Label>
                                                    <Select
                                                        value={selectedUser.roleIds[0]?.toString() || "2"}
                                                        onValueChange={(value) => setSelectedUser({
                                                          ...selectedUser,
                                                          roleIds: [parseInt(value)]
                                                        })}
                                                        disabled={saving}
                                                    >
                                                      <SelectTrigger>
                                                        <SelectValue placeholder="选择角色" />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        <SelectItem value="1">管理员</SelectItem>
                                                        <SelectItem value="2">教师</SelectItem>
                                                        <SelectItem value="3">学生</SelectItem>
                                                      </SelectContent>
                                                    </Select>
                                                  </div>
                                                </div>

                                                <div className="flex justify-end space-x-2">
                                                  <Button
                                                      variant="outline"
                                                      onClick={() => setSelectedUser(null)}
                                                      disabled={saving}
                                                  >
                                                    取消
                                                  </Button>
                                                  <Button
                                                      onClick={handleUpdateUser}
                                                      disabled={saving || !!emailError || !!phoneError}
                                                  >
                                                    {saving ? (
                                                        <>
                                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                          保存中...
                                                        </>
                                                    ) : "保存更改"}
                                                  </Button>
                                                </div>
                                              </div>
                                          )}
                                        </DialogContent>
                                      </Dialog>

                                      {/*<Button*/}
                                      {/*    variant="ghost"*/}
                                      {/*    size="sm"*/}
                                      {/*    onClick={() => handleDeleteConfirmation(user.id)}*/}
                                      {/*    className="text-red-600 hover:text-red-700"*/}
                                      {/*>*/}
                                      {/*  <Trash2 className="w-4 h-4" />*/}
                                      {/*</Button>*/}
                                    </div>
                                  </TableCell>
                                </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>用户角色分布</CardTitle>
                  <CardDescription>各角色用户数量统计</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {roleDistribution.map((item) => (
                        <div key={item.role} className="flex items-center justify-between">
                          <span className="font-medium">{item.role}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                  className="h-2 rounded-full bg-blue-600"
                                  style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold w-12">{item.count}</span>
                          </div>
                        </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* 添加用户对话框 */}
          <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>添加新用户</DialogTitle>
                <DialogDescription>创建新的用户账户</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>用户名 *</Label>
                  <Input
                      placeholder="输入用户名"
                      value={newUser.userName}
                      onChange={(e) => handleNewUserChange("userName", e.target.value)}
                  />
                </div>
                <div>
                  <Label>真实姓名 *</Label>
                  <Input
                      placeholder="输入真实姓名"
                      value={newUser.realName}
                      onChange={(e) => handleNewUserChange("realName", e.target.value)}
                  />
                </div>
                <div>
                  <Label>邮箱 *</Label>
                  <Input
                      type="email"
                      placeholder="输入邮箱地址"
                      value={newUser.email}
                      onChange={(e) => {
                        handleNewUserChange("email", e.target.value)
                        validateEmail(e.target.value)
                      }}
                  />
                  {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
                </div>
                <div>
                  <Label>电话</Label>
                  <Input
                      placeholder="输入电话号码"
                      value={newUser.phone}
                      onChange={(e) => {
                        handleNewUserChange("phone", e.target.value)
                        validatePhone(e.target.value)
                      }}
                  />
                  {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
                </div>
                <div>
                  <Label>角色</Label>
                  <Select
                      value={newUser.roleIds[0]?.toString() || "2"}
                      onValueChange={(value) => handleNewUserChange("roleIds", [parseInt(value)])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择用户角色" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">管理员</SelectItem>
                      <SelectItem value="2">教师</SelectItem>
                      <SelectItem value="3">学生</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>初始密码</Label>
                  <Input
                      value={newUser.password}
                      onChange={(e) => handleNewUserChange("password", e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    至少8个字符，包含大小写字母、数字和特殊字符
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                      variant="outline"
                      onClick={() => setShowUserDialog(false)}
                  >
                    取消
                  </Button>
                  <Button
                      onClick={handleCreateUser}
                      disabled={!!emailError || !!phoneError}
                  >
                    创建用户
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* 删除确认对话框 */}
          <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>确认删除用户</DialogTitle>
                <DialogDescription>
                  此操作将永久删除该用户账户，且无法恢复。您确定要继续吗？
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                  取消
                </Button>
                <Button
                    variant="destructive"
                    onClick={() => {
                      if (userToDelete !== null) {
                        handleDeleteUser(userToDelete)
                      }
                    }}
                >
                  确认删除
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
  )
}