"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  BookOpen,
  FlaskConical,
  FolderOpen,
  BarChart3,
  LogOut,
  Search,
  Shield,
  GraduationCap,
  Users,
  Activity,
  Database,
  Server,
  AlertTriangle,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { NotificationCenter } from "@/components/notification-center"
import { GradeAlertManager } from "@/components/grade-alert-manager"

interface UserInterface {
  id: string
  name: string
  email: string
  role: "student" | "teacher" | "admin"
  avatar?: string
}

interface RecentActivity {
  id: string
  userId: string
  userName: string
  userRole: string
  action: string
  resource: string
  timestamp: string
  type: "success" | "warning" | "error" | "info"
}

export default function HomePage() {
  const [user, setUser] = useState<UserInterface | null>(null)
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const router = useRouter()

  useEffect(() => {
    // 检查用户登录状态
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }
    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)

    // 根据用户角色加载不同的最近活动
    if (parsedUser.role === "admin") {
      // 管理员看到的是系统中所有用户的操作记录
      const adminActivities: RecentActivity[] = [
        {
          id: "1",
          userId: "user1",
          userName: "张三",
          userRole: "student",
          action: "提交了实验报告",
          resource: "化学反应动力学实验",
          timestamp: "2小时前",
          type: "success",
        },
        {
          id: "2",
          userId: "user2",
          userName: "李老师",
          userRole: "teacher",
          action: "创建了新的实训项目",
          resource: "Web开发实践",
          timestamp: "3小时前",
          type: "info",
        },
        {
          id: "3",
          userId: "user3",
          userName: "王五",
          userRole: "student",
          action: "登录失败",
          resource: "系统认证",
          timestamp: "4小时前",
          type: "warning",
        },
        {
          id: "4",
          userId: "user4",
          userName: "赵老师",
          userRole: "teacher",
          action: "上传了教学资源",
          resource: "React开发指南.pdf",
          timestamp: "5小时前",
          type: "success",
        },
        {
          id: "5",
          userId: "user5",
          userName: "刘六",
          userRole: "student",
          action: "完成了虚拟实验",
          resource: "物理光学实验",
          timestamp: "6小时前",
          type: "success",
        },
      ]
      setRecentActivities(adminActivities)
    } else {
      // 教师和学生看到的是自己的学习/教学活动
      const userActivities: RecentActivity[] = [
        {
          id: "1",
          userId: parsedUser.id,
          userName: parsedUser.name,
          userRole: parsedUser.role,
          action: parsedUser.role === "teacher" ? "批改了作业" : "完成了虚拟仿真实验",
          resource: parsedUser.role === "teacher" ? "数学期中考试" : "化学反应动力学",
          timestamp: "2小时前",
          type: "success",
        },
        {
          id: "2",
          userId: parsedUser.id,
          userName: parsedUser.name,
          userRole: parsedUser.role,
          action: parsedUser.role === "teacher" ? "发布了新作业" : "提交了实训项目",
          resource: parsedUser.role === "teacher" ? "英语阅读理解" : "Web开发实践",
          timestamp: "1天前",
          type: "info",
        },
        {
          id: "3",
          userId: parsedUser.id,
          userName: parsedUser.name,
          userRole: parsedUser.role,
          action: parsedUser.role === "teacher" ? "更新了课程资料" : "下载了教学资源",
          resource: parsedUser.role === "teacher" ? "物理实验指导" : "React开发指南",
          timestamp: "2天前",
          type: "success",
        },
      ]
      setRecentActivities(userActivities)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/login")
  }

  if (!user) {
    return <div>Loading...</div>
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="w-4 h-4" />
      case "teacher":
        return <GraduationCap className="w-4 h-4" />
      case "student":
        return <Users className="w-4 h-4" />
      default:
        return <Users className="w-4 h-4" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "系统管理员"
      case "teacher":
        return "教师"
      case "student":
        return "学生"
      default:
        return "用户"
    }
  }

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-600"
      case "warning":
        return "bg-yellow-600"
      case "error":
        return "bg-red-600"
      case "info":
        return "bg-blue-600"
      default:
        return "bg-gray-600"
    }
  }

  const getModuleCards = () => {
    // 普通用户（教师和学生）的模块
    const userModules = [
      {
        title: "虚拟仿真实验",
        description: "进行虚拟仿真实验操作和学习",
        icon: <FlaskConical className="w-8 h-8 text-blue-600" />,
        href: "/virtual-lab",
        color: "bg-blue-50 hover:bg-blue-100",
      },
      {
        title: "教学资源",
        description: "浏览和管理教学资源库",
        icon: <BookOpen className="w-8 h-8 text-green-600" />,
        href: "/resources",
        color: "bg-green-50 hover:bg-green-100",
      },
      {
        title: "实训项目",
        description: "参与和管理实训项目",
        icon: <FolderOpen className="w-8 h-8 text-purple-600" />,
        href: "/training-projects",
        color: "bg-purple-50 hover:bg-purple-100",
      },
      {
        title: "成绩评估",
        description: "查看和管理成绩评估",
        icon: <BarChart3 className="w-8 h-8 text-indigo-600" />,
        href: "/grades",
        color: "bg-indigo-50 hover:bg-indigo-100",
      }
    ]

    // 管理员的模块
    const adminModules = [
      {
        title: "日志审计",
        description: "系统操作日志和审计管理",
        icon: <BarChart3 className="w-8 h-8 text-red-600" />,
        href: "/audit-logs",
        color: "bg-red-50 hover:bg-red-100",
      },
      {
        title: "用户管理",
        description: "管理系统用户和权限",
        icon: <Users className="w-8 h-8 text-orange-600" />,
        href: "/user-management",
        color: "bg-orange-50 hover:bg-orange-100",
      },
      {
        title: "系统监控",
        description: "监控系统运行状态和性能",
        icon: <Activity className="w-8 h-8 text-teal-600" />,
        href: "/system-monitor",
        color: "bg-teal-50 hover:bg-teal-100",
      },
      {
        title: "配置管理",
        description: "管理系统配置和参数",
        icon: <Server className="w-8 h-8 text-cyan-600" />,
        href: "/configuration",
        color: "bg-cyan-50 hover:bg-cyan-100",
      }
    ]

    if (user.role === "admin") {
      return adminModules
    }

    return userModules
  }

  const getQuickStats = () => {
    if (user.role === "admin") {
      // 管理员看到的是系统统计数据
      return [
        {
          title: "在线用户",
          value: "89",
          description: "当前在线",
          icon: <Users className="w-8 h-8 text-blue-600" />,
        },
        {
          title: "系统负载",
          value: "45%",
          description: "CPU使用率",
          icon: <Server className="w-8 h-8 text-green-600" />,
        },
        {
          title: "数据库查询",
          value: "1,247",
          description: "今日查询次数",
          icon: <Database className="w-8 h-8 text-purple-600" />,
        },
        {
          title: "系统警告",
          value: "3",
          description: "需要处理",
          icon: <AlertTriangle className="w-8 h-8 text-red-600" />,
        },
      ]
    } else {
      // 教师和学生看到的是学习/教学相关统计
      return [
        {
          title: "进行中的实验",
          value: "12",
          description: user.role === "teacher" ? "学生实验" : "我的实验",
          icon: <FlaskConical className="w-8 h-8 text-blue-600" />,
        },
        {
          title: "实训项目",
          value: "8",
          description: user.role === "teacher" ? "管理项目" : "参与项目",
          icon: <FolderOpen className="w-8 h-8 text-purple-600" />,
        },
        {
          title: "教学资源",
          value: "156",
          description: user.role === "teacher" ? "已上传" : "可用资源",
          icon: <BookOpen className="w-8 h-8 text-green-600" />,
        },
        {
          title: "完成率",
          value: "85%",
          description: user.role === "teacher" ? "班级平均" : "我的进度",
          icon: <BarChart3 className="w-8 h-8 text-indigo-600" />,
        },
      ]
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">教育管理系统</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input placeholder="搜索..." className="pl-10 w-64" />
              </div>

              <NotificationCenter userId={user.id} />

              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={user.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <div className="flex items-center space-x-1">
                    {getRoleIcon(user.role)}
                    <p className="text-xs text-gray-500">{getRoleLabel(user.role)}</p>
                  </div>
                </div>
              </div>

              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">欢迎回来，{user.name}</h2>
          <p className="text-gray-600">
            {user.role === "admin" && "管理系统运行状态和用户权限"}
            {user.role === "teacher" && "管理您的课程和学生实训项目"}
            {user.role === "student" && "继续您的学习和实训项目"}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {getQuickStats().map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  {stat.icon}
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getModuleCards().map((module, index) => (
            <Card
              key={index}
              className={`cursor-pointer transition-colors ${module.color}`}
              onClick={() => router.push(module.href)}
            >
              <CardHeader>
                <div className="flex items-center space-x-4">
                  {module.icon}
                  <div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full justify-start">
                  进入模块 →
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                {user.role === "admin" ? "系统活动记录" : "最近活动"}
              </CardTitle>
              <CardDescription>
                {user.role === "admin" ? "系统中所有用户的最新操作记录" : "您最近的操作记录"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4">
                    <div className={`w-2 h-2 rounded-full ${getActivityTypeColor(activity.type)}`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {user.role === "admin" ? (
                          <>
                            <span className="text-blue-600">{activity.userName}</span>
                            <span className="text-gray-500 text-xs ml-1">({activity.userRole})</span>
                            {" " + activity.action}：{activity.resource}
                          </>
                        ) : (
                          `${activity.action}：${activity.resource}`
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* 成绩预警管理器 */}
      {user && <GradeAlertManager userId={user.id} />}
    </div>
  )
}
