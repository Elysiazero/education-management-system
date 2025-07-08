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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Search, Plus, Edit, Trash2, Download, Upload, Users, UserCheck, UserX, Shield, Activity } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: number
  name: string
  email: string
  phone?: string
  roles: string[]
  status: string
  userName: string
}

interface RoleDistribution {
  role: string
  count: number
  percentage: number
}

interface UserActivity {
  label: string
  count: number
}

interface Permission {
  id: string
  name: string
  description: string
  category: string
}

export default function UserManagementPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [roleDistribution, setRoleDistribution] = useState<RoleDistribution[]>([])
  const [userActivity, setUserActivity] = useState<UserActivity[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [showPermissionDialog, setShowPermissionDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [newUser, setNewUser] = useState({
    userName: "",
    realName: "",
    email: "",
    phone: "",
    password: "Test@123",
    roleIds: [2],
    status: 1
  })
  const router = useRouter()

  // 获取访问令牌
  const getAccessToken = () => {
    return localStorage.getItem("accessToken")
  }

  // 获取当前用户信息
  const fetchCurrentUser = async () => {
    console.log("fetchCurrentUser: 获取当前用户信息")
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return null
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== "admin") {
      router.push("/")
      return null
    }

    return parsedUser
  }

  // 获取用户列表
  const fetchUsers = async () => {
    console.log("fetchUsers: 获取用户列表")
    try {
      const response = await fetch("http://localhost:8080/api/admin/users?page=1&limit=100", {
        headers: {
          "Authorization": `Bearer ${getAccessToken()}`
        }
      })

      if (!response.ok) {
        throw new Error("获取用户列表失败")
      }

      const data = await response.json()
      return data.users
    } catch (error) {
      console.error("获取用户列表错误:", error)
      toast.error("获取用户列表失败")
      return []
    }
  }

  // 获取角色分布统计
  const fetchRoleDistribution = async () => {
    console.log("fetchRoleDistribution: 获取角色分布统计")
    try {
      const response = await fetch("http://localhost:8080/api/admin/analytics/role-distribution", {
        headers: {
          "Authorization": `Bearer ${getAccessToken()}`
        }
      })

      if (!response.ok) {
        throw new Error("获取角色分布统计失败")
      }

      return await response.json()
    } catch (error) {
      console.error("获取角色分布统计错误:", error)
      toast.error("获取角色分布统计失败")
      return []
    }
  }

  // 获取用户活跃度统计
  const fetchUserActivity = async () => {
    console.log("fetchUserActivity: 获取用户活跃度统计")
    try {
      const response = await fetch("http://localhost:8080/api/admin/analytics/user-activity", {
        headers: {
          "Authorization": `Bearer ${getAccessToken()}`
        }
      })

      if (!response.ok) {
        throw new Error("获取用户活跃度统计失败")
      }

      return await response.json()
    } catch (error) {
      console.error("获取用户活跃度统计错误:", error)
      toast.error("获取用户活跃度统计失败")
      return []
    }
  }

  // 创建用户
  const createUser = async (userData: any) => {
    console.log("createUser: 创建用户", userData)
    try {
      const response = await fetch("http://localhost:8080/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify(userData)
      })

      if (response.status === 204) {
        toast.success("用户创建成功")
        return true
      } else {
        throw new Error("创建用户失败")
      }
    } catch (error) {
      console.error("创建用户错误:", error)
      toast.error("创建用户失败")
      return false
    }
  }

  // 更新用户
  const updateUser = async (userId: number, userData: any) => {
    console.log(`updateUser: 更新用户 ${userId}`, userData)
    try {
      const response = await fetch(`http://localhost:8080/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify(userData)
      })

      if (response.status === 204) {
        toast.success("用户更新成功")
        return true
      } else {
        throw new Error("更新用户失败")
      }
    } catch (error) {
      console.error("更新用户错误:", error)
      toast.error("更新用户失败")
      return false
    }
  }

  // 删除用户
  const deleteUser = async (userId: number) => {
    console.log(`deleteUser: 删除用户 ${userId}`)
    try {
      const response = await fetch(`http://localhost:8080/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${getAccessToken()}`
        }
      })

      if (response.status === 204) {
        toast.success("用户删除成功")
        return true
      } else {
        throw new Error("删除用户失败")
      }
    } catch (error) {
      console.error("删除用户错误:", error)
      toast.error("删除用户失败")
      return false
    }
  }

  // 切换用户状态
  const toggleUserStatus = async (userId: number, currentStatus: string) => {
    console.log(`toggleUserStatus: 切换用户状态 ${userId}, 当前状态: ${currentStatus}`)
    const newStatus = currentStatus === "ACTIVE" ? 0 : 1

    try {
      const response = await fetch(`http://localhost:8080/api/admin/users/${userId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.status === 204) {
        toast.success("用户状态更新成功")
        return true
      } else {
        throw new Error("更新用户状态失败")
      }
    } catch (error) {
      console.error("更新用户状态错误:", error)
      toast.error("更新用户状态失败")
      return false
    }
  }

  // 导出用户数据
  const exportUsers = async () => {
    console.log("exportUsers: 导出用户数据")
    try {
      const response = await fetch("http://localhost:8080/api/admin/export", {
        headers: {
          "Authorization": `Bearer ${getAccessToken()}`
        }
      })

      if (!response.ok) {
        throw new Error("导出用户数据失败")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `users_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()

      toast.success("用户数据导出成功")
    } catch (error) {
      console.error("导出用户数据错误:", error)
      toast.error("导出用户数据失败")
    }
  }

  useEffect(() => {
    const init = async () => {
      const user = await fetchCurrentUser()
      if (!user) return

      setCurrentUser(user)

      const [usersData, roleData, activityData] = await Promise.all([
        fetchUsers(),
        fetchRoleDistribution(),
        fetchUserActivity()
      ])

      setUsers(usersData)
      setFilteredUsers(usersData)
      setRoleDistribution(roleData)
      setUserActivity(activityData)

      // 模拟权限数据
      setPermissions([
        {
          id: "1",
          name: "用户管理",
          description: "创建、编辑、删除用户账户",
          category: "系统管理",
        },
        {
          id: "2",
          name: "成绩管理",
          description: "查看和编辑学生成绩",
          category: "教学管理",
        },
        {
          id: "3",
          name: "实验管理",
          description: "创建和管理虚拟实验",
          category: "教学管理",
        },
        {
          id: "4",
          name: "资源管理",
          description: "上传和管理教学资源",
          category: "教学管理",
        },
        {
          id: "5",
          name: "日志审计",
          description: "查看系统操作日志",
          category: "系统管理",
        },
      ])

      setIsLoading(false)
    }

    init()
  }, [router])

  useEffect(() => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(
          (user) =>
              user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.userName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) =>
          user.roles.some(role => role.toLowerCase().includes(roleFilter.toLowerCase()))
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => user.status === statusFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter, statusFilter])

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      "ROLE_ADMIN": "管理员",
      "ROLE_TEACHER": "教师",
      "ROLE_STUDENT": "学生",
      "ROLE_USER": "用户"
    }
    return labels[role] || role
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      "ACTIVE": "活跃",
      "INACTIVE": "非活跃"
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "ACTIVE": "bg-green-100 text-green-800",
      "INACTIVE": "bg-gray-100 text-gray-800"
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      "ROLE_ADMIN": "bg-orange-100 text-orange-800",
      "ROLE_TEACHER": "bg-purple-100 text-purple-800",
      "ROLE_STUDENT": "bg-blue-100 text-blue-800",
      "ROLE_USER": "bg-gray-100 text-gray-800"
    }
    return colors[role] || "bg-gray-100 text-gray-800"
  }

  const handleCreateUser = async () => {
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
        roleIds: [2],
        status: 1
      })
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    const userData = {
      userName: selectedUser.userName,
      realName: selectedUser.name,
      email: selectedUser.email,
      phone: selectedUser.phone || "",
      status: selectedUser.status === "ACTIVE" ? 1 : 0,
      roleIds: selectedUser.roles.includes("ROLE_ADMIN") ? [1] :
          selectedUser.roles.includes("ROLE_TEACHER") ? [2] : [3]
    }

    const success = await updateUser(selectedUser.id, userData)
    if (success) {
      const updatedUsers = await fetchUsers()
      setUsers(updatedUsers)
      setSelectedUser(null)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    const success = await deleteUser(userId)
    if (success) {
      const updatedUsers = await fetchUsers()
      setUsers(updatedUsers)
    }
  }

  const handleUserStatusToggle = async (userId: number, currentStatus: string) => {
    const success = await toggleUserStatus(userId, currentStatus)
    if (success) {
      const updatedUsers = await fetchUsers()
      setUsers(updatedUsers)
    }
  }

  const handleNewUserChange = (field: string, value: string | number) => {
    setNewUser(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    )
  }

  if (!currentUser) {
    return <div>未授权访问，正在重定向...</div>
  }

  // 计算统计数据
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.status === "ACTIVE").length
  const teachers = users.filter(u => u.roles.includes("ROLE_TEACHER")).length
  const students = users.filter(u => u.roles.includes("ROLE_STUDENT")).length

  return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">用户管理</h1>
              <p className="text-gray-600">管理系统中的所有用户账户和权限</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                批量导入
              </Button>
              <Button variant="outline" onClick={exportUsers}>
                <Download className="w-4 h-4 mr-2" />
                导出用户
              </Button>
              <Button onClick={() => setShowUserDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                添加用户
              </Button>
            </div>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                  <UserCheck className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">活跃用户</p>
                    <p className="text-2xl font-bold text-gray-900">{activeUsers}</p>
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
                  <Activity className="w-8 h-8 text-orange-600" />
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
              <TabsTrigger value="permissions">权限管理</TabsTrigger>
              <TabsTrigger value="analytics">用户分析</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              {/* 筛选器 */}
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
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

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="用户状态" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部状态</SelectItem>
                        <SelectItem value="ACTIVE">活跃</SelectItem>
                        <SelectItem value="INACTIVE">非活跃</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button variant="outline">
                      <Search className="w-4 h-4 mr-2" />
                      高级搜索
                    </Button>
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
                          <TableHead>用户名</TableHead>
                          <TableHead>角色</TableHead>
                          <TableHead>状态</TableHead>
                          <TableHead>操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <Avatar className="w-10 h-10">
                                    <AvatarImage src="/placeholder.svg" alt={user.name} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{user.name}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm">{user.userName}</p>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {user.roles.map((role, index) => (
                                      <Badge key={index} className={getRoleColor(role)}>
                                        {getRoleLabel(role)}
                                      </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(user.status)}>
                                  {getStatusLabel(user.status)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setSelectedUser(user)}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                    </DialogTrigger>
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
                                                    alt={selectedUser.name}
                                                />
                                                <AvatarFallback className="text-lg">
                                                  {selectedUser.name.charAt(0)}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div>
                                                <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                                                <p className="text-gray-600">{selectedUser.email}</p>
                                              </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                <Label>用户名</Label>
                                                <Input
                                                    value={selectedUser.userName}
                                                    onChange={(e) => setSelectedUser({
                                                      ...selectedUser,
                                                      userName: e.target.value
                                                    })}
                                                />
                                              </div>
                                              <div>
                                                <Label>真实姓名</Label>
                                                <Input
                                                    value={selectedUser.name}
                                                    onChange={(e) => setSelectedUser({
                                                      ...selectedUser,
                                                      name: e.target.value
                                                    })}
                                                />
                                              </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                <Label>邮箱</Label>
                                                <Input
                                                    value={selectedUser.email}
                                                    onChange={(e) => setSelectedUser({
                                                      ...selectedUser,
                                                      email: e.target.value
                                                    })}
                                                />
                                              </div>
                                              <div>
                                                <Label>电话</Label>
                                                <Input
                                                    value={selectedUser.phone || ""}
                                                    onChange={(e) => setSelectedUser({
                                                      ...selectedUser,
                                                      phone: e.target.value
                                                    })}
                                                />
                                              </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                <Label>角色</Label>
                                                <Select
                                                    value={selectedUser.roles[0] || ""}
                                                    onValueChange={(value) => setSelectedUser({
                                                      ...selectedUser,
                                                      roles: [value]
                                                    })}
                                                >
                                                  <SelectTrigger>
                                                    <SelectValue placeholder="选择角色" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="ROLE_ADMIN">管理员</SelectItem>
                                                    <SelectItem value="ROLE_TEACHER">教师</SelectItem>
                                                    <SelectItem value="ROLE_STUDENT">学生</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                              <div>
                                                <Label>状态</Label>
                                                <Select
                                                    value={selectedUser.status}
                                                    onValueChange={(value) => setSelectedUser({
                                                      ...selectedUser,
                                                      status: value
                                                    })}
                                                >
                                                  <SelectTrigger>
                                                    <SelectValue placeholder="选择状态" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="ACTIVE">活跃</SelectItem>
                                                    <SelectItem value="INACTIVE">非活跃</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                            </div>

                                            <div className="flex justify-end space-x-2">
                                              <Button
                                                  variant="outline"
                                                  onClick={() => setSelectedUser(null)}
                                              >
                                                取消
                                              </Button>
                                              <Button onClick={handleUpdateUser}>
                                                保存更改
                                              </Button>
                                            </div>
                                          </div>
                                      )}
                                    </DialogContent>
                                  </Dialog>

                                  <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleUserStatusToggle(user.id, user.status)}
                                  >
                                    {user.status === "ACTIVE" ? (
                                        <UserX className="w-4 h-4 text-red-600" />
                                    ) : (
                                        <UserCheck className="w-4 h-4 text-green-600" />
                                    )}
                                  </Button>

                                  <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteUser(user.id)}
                                      className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="permissions">
              <Card>
                <CardHeader>
                  <CardTitle>权限管理</CardTitle>
                  <CardDescription>管理系统权限和角色权限分配</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* 权限分类 */}
                    {["系统管理", "教学管理"].map((category) => (
                        <div key={category} className="space-y-3">
                          <h3 className="text-lg font-semibold">{category}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {permissions
                                .filter((permission) => permission.category === category)
                                .map((permission) => (
                                    <Card key={permission.id} className="p-4">
                                      <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium">{permission.name}</h4>
                                        <Switch />
                                      </div>
                                      <p className="text-sm text-gray-600">{permission.description}</p>
                                    </Card>
                                ))}
                          </div>
                        </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>用户角色分布</CardTitle>
                    <CardDescription>各角色用户数量统计</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {roleDistribution.map((item) => (
                          <div key={item.role} className="flex items-center justify-between">
                            <span className="font-medium">{getRoleLabel(item.role)}</span>
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

                <Card>
                  <CardHeader>
                    <CardTitle>用户活跃度</CardTitle>
                    <CardDescription>用户状态分布统计</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {userActivity.map((item) => (
                          <div key={item.label} className="flex items-center justify-between">
                            <span className="font-medium">{item.label}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${
                                        item.label === "活跃用户" ? "bg-green-600" : "bg-gray-600"
                                    }`}
                                    style={{ width: `${(item.count / totalUsers) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold w-12">{item.count}</span>
                            </div>
                          </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
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
                  <Label>用户名</Label>
                  <Input
                      placeholder="输入用户名"
                      value={newUser.userName}
                      onChange={(e) => handleNewUserChange("userName", e.target.value)}
                  />
                </div>
                <div>
                  <Label>真实姓名</Label>
                  <Input
                      placeholder="输入真实姓名"
                      value={newUser.realName}
                      onChange={(e) => handleNewUserChange("realName", e.target.value)}
                  />
                </div>
                <div>
                  <Label>邮箱</Label>
                  <Input
                      type="email"
                      placeholder="输入邮箱地址"
                      value={newUser.email}
                      onChange={(e) => handleNewUserChange("email", e.target.value)}
                  />
                </div>
                <div>
                  <Label>电话</Label>
                  <Input
                      placeholder="输入电话号码"
                      value={newUser.phone}
                      onChange={(e) => handleNewUserChange("phone", e.target.value)}
                  />
                </div>
                <div>
                  <Label>角色</Label>
                  <Select
                      value={newUser.roleIds[0].toString()}
                      onValueChange={(value) => handleNewUserChange("roleIds", value)}
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
                      disabled
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                      variant="outline"
                      onClick={() => setShowUserDialog(false)}
                  >
                    取消
                  </Button>
                  <Button onClick={handleCreateUser}>
                    创建用户
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
  )
}