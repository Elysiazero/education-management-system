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

interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: "student" | "teacher" | "admin"
  status: "active" | "inactive" | "suspended"
  department?: string
  joinDate: string
  lastLogin?: string
  avatar?: string
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
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [showPermissionDialog, setShowPermissionDialog] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== "admin") {
      router.push("/")
      return
    }

    setCurrentUser(parsedUser)

    // 模拟用户数据
    const mockUsers: User[] = [
      {
        id: "1",
        name: "张三",
        email: "zhangsan@example.com",
        phone: "13800138001",
        role: "student",
        status: "active",
        department: "计算机科学系",
        joinDate: "2024-01-15",
        lastLogin: "2024-01-20 14:30:00",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: "2",
        name: "李四",
        email: "lisi@example.com",
        phone: "13800138002",
        role: "teacher",
        status: "active",
        department: "计算机科学系",
        joinDate: "2023-09-01",
        lastLogin: "2024-01-20 16:45:00",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: "3",
        name: "王五",
        email: "wangwu@example.com",
        phone: "13800138003",
        role: "student",
        status: "inactive",
        department: "电子工程系",
        joinDate: "2024-01-10",
        lastLogin: "2024-01-18 09:15:00",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: "4",
        name: "赵六",
        email: "zhaoliu@example.com",
        phone: "13800138004",
        role: "admin",
        status: "active",
        department: "管理部门",
        joinDate: "2023-01-01",
        lastLogin: "2024-01-20 17:00:00",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    ]

    // 模拟权限数据
    const mockPermissions: Permission[] = [
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
    ]

    setUsers(mockUsers)
    setFilteredUsers(mockUsers)
    setPermissions(mockPermissions)
  }, [router])

  useEffect(() => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.department?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => user.status === statusFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter, statusFilter])

  const getRoleLabel = (role: string) => {
    const labels = {
      student: "学生",
      teacher: "教师",
      admin: "管理员",
    }
    return labels[role as keyof typeof labels] || role
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      active: "活跃",
      inactive: "非活跃",
      suspended: "已暂停",
    }
    return labels[status as keyof typeof labels] || status
  }

  const getStatusColor = (status: string) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      suspended: "bg-red-100 text-red-800",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getRoleColor = (role: string) => {
    const colors = {
      student: "bg-blue-100 text-blue-800",
      teacher: "bg-purple-100 text-purple-800",
      admin: "bg-orange-100 text-orange-800",
    }
    return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const handleUserStatusToggle = (userId: string) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, status: user.status === "active" ? "inactive" : "active" } : user,
      ),
    )
  }

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((user) => user.id !== userId))
  }

  const exportUsers = () => {
    const csvContent = [
      ["姓名", "邮箱", "电话", "角色", "状态", "部门", "加入日期", "最后登录"].join(","),
      ...filteredUsers.map((user) =>
        [
          user.name,
          user.email,
          user.phone || "",
          getRoleLabel(user.role),
          getStatusLabel(user.status),
          user.department || "",
          user.joinDate,
          user.lastLogin || "",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `users_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!currentUser) {
    return <div>Loading...</div>
  }

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
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
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
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter((u) => u.status === "active").length}
                  </p>
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
                  <p className="text-2xl font-bold text-gray-900">{users.filter((u) => u.role === "teacher").length}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{users.filter((u) => u.role === "student").length}</p>
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
                      <SelectItem value="student">学生</SelectItem>
                      <SelectItem value="teacher">教师</SelectItem>
                      <SelectItem value="admin">管理员</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="用户状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部状态</SelectItem>
                      <SelectItem value="active">活跃</SelectItem>
                      <SelectItem value="inactive">非活跃</SelectItem>
                      <SelectItem value="suspended">已暂停</SelectItem>
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
                        <TableHead>角色</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>部门</TableHead>
                        <TableHead>加入日期</TableHead>
                        <TableHead>最后登录</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleColor(user.role)}>{getRoleLabel(user.role)}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(user.status)}>{getStatusLabel(user.status)}</Badge>
                          </TableCell>
                          <TableCell>{user.department || "-"}</TableCell>
                          <TableCell>{user.joinDate}</TableCell>
                          <TableCell className="text-sm text-gray-500">{user.lastLogin || "从未登录"}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}>
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
                                            src={selectedUser.avatar || "/placeholder.svg"}
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
                                          <Label>角色</Label>
                                          <Select defaultValue={selectedUser.role}>
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="student">学生</SelectItem>
                                              <SelectItem value="teacher">教师</SelectItem>
                                              <SelectItem value="admin">管理员</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div>
                                          <Label>状态</Label>
                                          <Select defaultValue={selectedUser.status}>
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="active">活跃</SelectItem>
                                              <SelectItem value="inactive">非活跃</SelectItem>
                                              <SelectItem value="suspended">已暂停</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label>电话</Label>
                                          <Input defaultValue={selectedUser.phone} />
                                        </div>
                                        <div>
                                          <Label>部门</Label>
                                          <Input defaultValue={selectedUser.department} />
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label>加入日期</Label>
                                          <Input defaultValue={selectedUser.joinDate} disabled />
                                        </div>
                                        <div>
                                          <Label>最后登录</Label>
                                          <Input defaultValue={selectedUser.lastLogin} disabled />
                                        </div>
                                      </div>

                                      <div className="flex justify-end space-x-2">
                                        <Button variant="outline">取消</Button>
                                        <Button>保存更改</Button>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>

                              <Button variant="ghost" size="sm" onClick={() => handleUserStatusToggle(user.id)}>
                                {user.status === "active" ? (
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
                    {["student", "teacher", "admin"].map((role) => {
                      const count = users.filter((u) => u.role === role).length
                      const percentage = Math.round((count / users.length) * 100)
                      return (
                        <div key={role} className="flex items-center justify-between">
                          <span className="font-medium">{getRoleLabel(role)}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                            </div>
                            <span className="text-sm font-semibold w-12">{count}</span>
                          </div>
                        </div>
                      )
                    })}
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
                    {["active", "inactive", "suspended"].map((status) => {
                      const count = users.filter((u) => u.status === status).length
                      const percentage = Math.round((count / users.length) * 100)
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <span className="font-medium">{getStatusLabel(status)}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  status === "active"
                                    ? "bg-green-600"
                                    : status === "inactive"
                                      ? "bg-gray-600"
                                      : "bg-red-600"
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold w-12">{count}</span>
                          </div>
                        </div>
                      )
                    })}
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
                <Label>姓名</Label>
                <Input placeholder="输入用户姓名" />
              </div>
              <div>
                <Label>邮箱</Label>
                <Input type="email" placeholder="输入邮箱地址" />
              </div>
              <div>
                <Label>电话</Label>
                <Input placeholder="输入电话号码" />
              </div>
              <div>
                <Label>角色</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="选择用户角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">学生</SelectItem>
                    <SelectItem value="teacher">教师</SelectItem>
                    <SelectItem value="admin">管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>部门</Label>
                <Input placeholder="输入所属部门" />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                  取消
                </Button>
                <Button onClick={() => setShowUserDialog(false)}>创建用户</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
