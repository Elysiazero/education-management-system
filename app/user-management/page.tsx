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
import { Search, Plus, Edit, Trash2, Download, Upload, Users, UserCheck, UserX, Shield, Activity } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: number
  realName: string
  email: string
  phone?: string
  roleIds: number[]
  status: number
  userName: string
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
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [newUser, setNewUser] = useState({
    userName: "",
    realName: "",
    email: "",
    phone: "",
    password: "Test@123",
    roleIds: [2], // 默认教师角色
    status: 1 // 默认活跃
  })
  const router = useRouter()

  // 获取访问令牌
  const getAccessToken = () => {
    return localStorage.getItem("accessToken")
  }

  // 获取当前用户信息
  const fetchCurrentUser = async () => {
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
    try {
      const token = localStorage.getItem('accessToken');
      console.log('token:',token)
      const response = await fetch("http://localhost:8080/api/admin/users?page=1&limit=100", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (!response.ok) {
        // 尝试读取错误响应体
        const errorData = await response.text();
        console.error("服务器错误详情:", errorData);
        throw new Error(`获取用户列表失败: ${response.status} - ${errorData}`);
      }

      const data = await response.json()
      return data.users || []
    } catch (error) {
      console.error("获取用户列表错误:", error)
      toast.error("获取用户列表失败")
      return []
    }
  }

  // 获取角色分布统计
  const fetchRoleDistribution = async () => {
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

  // 创建用户
  const createUser = async (userData: any) => {
    try {
      const response = await fetch("http://localhost:8080/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify(userData)
      })

      if (response.status === 201) {
        toast.success("用户创建成功")
        return true
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "创建用户失败")
      }
    } catch (error: any) {
      console.error("创建用户错误:", error)
      toast.error(error.message || "创建用户失败")
      return false
    }
  }

  // 更新用户
  const updateUser = async (userId: number, userData: any) => {
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
        const errorData = await response.json()
        throw new Error(errorData.message || "更新用户失败")
      }
    } catch (error: any) {
      console.error("更新用户错误:", error)
      toast.error(error.message || "更新用户失败")
      return false
    }
  }

  // 删除用户
  const deleteUser = async (userId: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/admin/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${getAccessToken()}`
        }
      })

      if (response.status === 200) {
        toast.success("用户删除成功")
        return true
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "删除用户失败")
      }
    } catch (error: any) {
      console.error("删除用户错误:", error)
      toast.error(error.message || "删除用户失败")
      return false
    }
  }

  // 切换用户状态
  const toggleUserStatus = async (userId: number, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1

    try {
      const response = await fetch(`http://localhost:8080/api/admin/${userId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.status === 200) {
        toast.success("用户状态更新成功")
        return true
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || "更新用户状态失败")
      }
    } catch (error: any) {
      console.error("更新用户状态错误:", error)
      toast.error(error.message || "更新用户状态失败")
      return false
    }
  }

  // 导出用户数据
  const exportUsers = async () => {
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
              user.realName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.userName.toLowerCase().includes(searchTerm.toLowerCase())
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
            user.roleIds.includes(roleId)
        )
      }
    }

    if (statusFilter !== "all") {
      const statusValue = statusFilter === "ACTIVE" ? 1 : 0
      filtered = filtered.filter((user) => user.status === statusValue)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter, statusFilter])

  const getRoleLabel = (roleId: number) => {
    const labels: Record<number, string> = {
      1: "管理员",
      2: "教师",
      3: "学生"
    }
    return labels[roleId] || `角色${roleId}`
  }

  const getStatusLabel = (status: number) => {
    return status === 1 ? "活跃" : "非活跃"
  }

  const getStatusColor = (status: number) => {
    return status === 1 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
  }

  const getRoleColor = (roleId: number) => {
    const colors: Record<number, string> = {
      1: "bg-orange-100 text-orange-800",
      2: "bg-purple-100 text-purple-800",
      3: "bg-blue-100 text-blue-800"
    }
    return colors[roleId] || "bg-gray-100 text-gray-800"
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
      realName: selectedUser.realName,
      email: selectedUser.email,
      phone: selectedUser.phone || "",
      status: selectedUser.status
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

  const handleUserStatusToggle = async (userId: number, currentStatus: number) => {
    const success = await toggleUserStatus(userId, currentStatus)
    if (success) {
      const updatedUsers = await fetchUsers()
      setUsers(updatedUsers)
    }
  }

  const handleNewUserChange = (field: string, value: string | number | number[]) => {
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
  const activeUsers = users.filter(u => u.status === 1).length
  const teachers = users.filter(u => u.roleIds.includes(2)).length
  const students = users.filter(u => u.roleIds.includes(3)).length

  return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">用户管理</h1>
              <p className="text-gray-600">管理系统中的所有用户账户</p>
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
                                    <AvatarImage src="/placeholder.svg" alt={user.realName} />
                                    <AvatarFallback>{user.realName.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{user.realName}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm">{user.userName}</p>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {user.roleIds.map((roleId, index) => (
                                      <Badge key={index} className={getRoleColor(roleId)}>
                                        {getRoleLabel(roleId)}
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
                                                    alt={selectedUser.realName}
                                                />
                                                <AvatarFallback className="text-lg">
                                                  {selectedUser.realName.charAt(0)}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div>
                                                <h3 className="text-lg font-semibold">{selectedUser.realName}</h3>
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
                                                    value={selectedUser.realName}
                                                    onChange={(e) => setSelectedUser({
                                                      ...selectedUser,
                                                      realName: e.target.value
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
                                                    value={selectedUser.roleIds[0]?.toString() || ""}
                                                    onValueChange={(value) => setSelectedUser({
                                                      ...selectedUser,
                                                      roleIds: [parseInt(value)]
                                                    })}
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
                                              <div>
                                                <Label>状态</Label>
                                                <Select
                                                    value={selectedUser.status.toString()}
                                                    onValueChange={(value) => setSelectedUser({
                                                      ...selectedUser,
                                                      status: parseInt(value)
                                                    })}
                                                >
                                                  <SelectTrigger>
                                                    <SelectValue placeholder="选择状态" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="1">活跃</SelectItem>
                                                    <SelectItem value="0">非活跃</SelectItem>
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
                                    {user.status === 1 ? (
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

                {/* 用户活跃度统计（后端未提供） */}
                <Card>
                  <CardHeader>
                    <CardTitle>用户状态分布</CardTitle>
                    <CardDescription>用户活跃状态统计</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">活跃用户</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                                className="h-2 rounded-full bg-green-600"
                                style={{ width: `${(activeUsers / totalUsers) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-12">{activeUsers}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">非活跃用户</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                                className="h-2 rounded-full bg-gray-600"
                                style={{ width: `${((totalUsers - activeUsers) / totalUsers) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-12">{totalUsers - activeUsers}</span>
                        </div>
                      </div>
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