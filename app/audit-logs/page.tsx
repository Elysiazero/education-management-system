"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePickerWithRange } from "@/components/ui/date-picker"
import {
  Search,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Activity,
  Users,
  Database,
  Shield,
  Calendar,
} from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: "student" | "teacher" | "admin"
}

interface LogEntry {
  id: string
  timestamp: string
  userId: string
  userName: string
  userRole: string
  action: string
  resource: string
  details: string
  ipAddress: string
  userAgent: string
  status: "success" | "warning" | "error" | "info"
  category: "auth" | "project" | "resource" | "system" | "grade"
}

interface SystemMetric {
  name: string
  value: string
  change: string
  trend: "up" | "down" | "stable"
  icon: React.ReactNode
}

export default function AuditLogsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
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

    setUser(parsedUser)

    // 模拟日志数据
    const mockLogs: LogEntry[] = [
      {
        id: "1",
        timestamp: "2024-01-08 14:30:25",
        userId: "user1",
        userName: "张三",
        userRole: "student",
        action: "登录系统",
        resource: "认证系统",
        details: "用户成功登录",
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        status: "success",
        category: "auth",
      },
      {
        id: "2",
        timestamp: "2024-01-08 14:25:12",
        userId: "user2",
        userName: "李老师",
        userRole: "teacher",
        action: "创建实训项目",
        resource: "项目管理",
        details: "创建项目：Web开发实践",
        ipAddress: "192.168.1.101",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        status: "success",
        category: "project",
      },
      {
        id: "3",
        timestamp: "2024-01-08 14:20:45",
        userId: "user3",
        userName: "王五",
        userRole: "student",
        action: "登录失败",
        resource: "认证系统",
        details: "密码错误，登录失败",
        ipAddress: "192.168.1.102",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)",
        status: "error",
        category: "auth",
      },
      {
        id: "4",
        timestamp: "2024-01-08 14:15:30",
        userId: "user4",
        userName: "赵老师",
        userRole: "teacher",
        action: "上传教学资源",
        resource: "资源管理",
        details: "上传文件：React开发指南.pdf",
        ipAddress: "192.168.1.103",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        status: "success",
        category: "resource",
      },
      {
        id: "5",
        timestamp: "2024-01-08 14:10:15",
        userId: "admin1",
        userName: "系统管理员",
        userRole: "admin",
        action: "修改用户权限",
        resource: "用户管理",
        details: "修改用户张三的权限",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        status: "warning",
        category: "system",
      },
      {
        id: "6",
        timestamp: "2024-01-08 14:05:00",
        userId: "user5",
        userName: "刘六",
        userRole: "student",
        action: "提交实验报告",
        resource: "虚拟实验",
        details: "提交化学反应动力学实验报告",
        ipAddress: "192.168.1.104",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        status: "success",
        category: "project",
      },
    ]

    setLogs(mockLogs)
    setFilteredLogs(mockLogs)
  }, [router])

  useEffect(() => {
    let filtered = logs

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // 状态过滤
    if (statusFilter !== "all") {
      filtered = filtered.filter((log) => log.status === statusFilter)
    }

    // 分类过滤
    if (categoryFilter !== "all") {
      filtered = filtered.filter((log) => log.category === categoryFilter)
    }

    // 日期范围过滤
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter((log) => {
        const logDate = new Date(log.timestamp)
        return logDate >= dateRange.from! && logDate <= dateRange.to!
      })
    }

    setFilteredLogs(filtered)
  }, [logs, searchTerm, statusFilter, categoryFilter, dateRange])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "info":
        return <Info className="w-4 h-4 text-blue-600" />
      default:
        return <Info className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      success: "default",
      warning: "secondary",
      error: "destructive",
      info: "outline",
    } as const

    const labels = {
      success: "成功",
      warning: "警告",
      error: "错误",
      info: "信息",
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  const getCategoryLabel = (category: string) => {
    const labels = {
      auth: "认证",
      project: "项目",
      resource: "资源",
      system: "系统",
      grade: "成绩",
    }
    return labels[category as keyof typeof labels] || category
  }

  const systemMetrics: SystemMetric[] = [
    {
      name: "今日活跃用户",
      value: "156",
      change: "+12%",
      trend: "up",
      icon: <Users className="w-5 h-5 text-blue-600" />,
    },
    {
      name: "系统操作次数",
      value: "2,847",
      change: "+8%",
      trend: "up",
      icon: <Activity className="w-5 h-5 text-green-600" />,
    },
    {
      name: "错误日志数量",
      value: "23",
      change: "-15%",
      trend: "down",
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
    },
    {
      name: "数据库查询",
      value: "18,492",
      change: "+5%",
      trend: "up",
      icon: <Database className="w-5 h-5 text-purple-600" />,
    },
  ]

  const exportLogs = () => {
    const csvContent = [
      ["时间", "用户", "角色", "操作", "资源", "详情", "IP地址", "状态"].join(","),
      ...filteredLogs.map((log) =>
        [
          log.timestamp,
          log.userName,
          log.userRole,
          log.action,
          log.resource,
          log.details,
          log.ipAddress,
          log.status,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `audit_logs_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">日志审计系统</h1>
            <p className="text-gray-600">监控系统操作和用户行为</p>
          </div>
          <Button onClick={exportLogs}>
            <Download className="w-4 h-4 mr-2" />
            导出日志
          </Button>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {systemMetrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{metric.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                    <p
                      className={`text-sm ${metric.trend === "up" ? "text-green-600" : metric.trend === "down" ? "text-red-600" : "text-gray-600"}`}
                    >
                      {metric.change}
                    </p>
                  </div>
                  {metric.icon}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="logs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="logs">操作日志</TabsTrigger>
            <TabsTrigger value="security">安全事件</TabsTrigger>
            <TabsTrigger value="performance">性能监控</TabsTrigger>
            <TabsTrigger value="reports">审计报表</TabsTrigger>
          </TabsList>

          <TabsContent value="logs">
            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  筛选条件
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">搜索</label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="搜索用户、操作、资源..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">状态</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择状态" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部状态</SelectItem>
                        <SelectItem value="success">成功</SelectItem>
                        <SelectItem value="warning">警告</SelectItem>
                        <SelectItem value="error">错误</SelectItem>
                        <SelectItem value="info">信息</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">分类</label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择分类" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部分类</SelectItem>
                        <SelectItem value="auth">认证</SelectItem>
                        <SelectItem value="project">项目</SelectItem>
                        <SelectItem value="resource">资源</SelectItem>
                        <SelectItem value="system">系统</SelectItem>
                        <SelectItem value="grade">成绩</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">日期范围</label>
                    <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Logs Table */}
            <Card>
              <CardHeader>
                <CardTitle>操作日志 ({filteredLogs.length} 条记录)</CardTitle>
                <CardDescription>系统中所有用户操作的详细记录</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>时间</TableHead>
                        <TableHead>用户</TableHead>
                        <TableHead>操作</TableHead>
                        <TableHead>资源</TableHead>
                        <TableHead>详情</TableHead>
                        <TableHead>IP地址</TableHead>
                        <TableHead>状态</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{log.userName}</div>
                              <div className="text-sm text-gray-500">{getCategoryLabel(log.userRole)}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.action}</Badge>
                          </TableCell>
                          <TableCell>{log.resource}</TableCell>
                          <TableCell className="max-w-xs truncate" title={log.details}>
                            {log.details}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(log.status)}
                              {getStatusBadge(log.status)}
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

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  安全事件监控
                </CardTitle>
                <CardDescription>系统安全相关的事件和警报</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-medium text-red-900">多次登录失败</p>
                        <p className="text-sm text-red-700">IP: 192.168.1.102 在5分钟内尝试登录失败3次</p>
                      </div>
                    </div>
                    <Badge variant="destructive">高风险</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-yellow-900">异常访问时间</p>
                        <p className="text-sm text-yellow-700">用户在非工作时间（凌晨2:30）访问系统</p>
                      </div>
                    </div>
                    <Badge variant="secondary">中风险</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-blue-200 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Info className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">权限变更</p>
                        <p className="text-sm text-blue-700">管理员修改了用户权限设置</p>
                      </div>
                    </div>
                    <Badge variant="outline">低风险</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>系统性能指标</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>CPU使用率</span>
                      <span className="font-semibold">45%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>内存使用率</span>
                      <span className="font-semibold">62%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>磁盘使用率</span>
                      <span className="font-semibold">78%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>网络延迟</span>
                      <span className="font-semibold">23ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>响应时间统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>平均响应时间</span>
                      <span className="font-semibold">120ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>最大响应时间</span>
                      <span className="font-semibold">850ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>最小响应时间</span>
                      <span className="font-semibold">45ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>超时请求数</span>
                      <span className="font-semibold">3</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    日报表
                  </CardTitle>
                  <CardDescription>生成今日系统使用情况报表</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">生成日报表</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    周报表
                  </CardTitle>
                  <CardDescription>生成本周系统使用情况报表</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">生成周报表</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    月报表
                  </CardTitle>
                  <CardDescription>生成本月系统使用情况报表</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">生成月报表</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    用户行为报表
                  </CardTitle>
                  <CardDescription>分析用户使用行为和模式</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">生成用户报表</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    安全审计报表
                  </CardTitle>
                  <CardDescription>生成安全事件和风险评估报表</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">生成安全报表</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    性能报表
                  </CardTitle>
                  <CardDescription>生成系统性能和资源使用报表</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">生成性能报表</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
