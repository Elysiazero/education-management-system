"use client"

import { JSX, useEffect, useState } from "react"
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
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { QuickStatsDashboard } from "@/components/home/QuickStatsDashboard"; // 引入新的仪表盘组件

// 保持现有的接口定义
interface UserInterface {
  id: string
  username: string
  realName: string
  email: string
  phoneNumber: string
  avatarUrl: string | null
  roles: string[]
  permissions: string[]
  role: string
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
  const [loading, setLoading] = useState(true)
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const router = useRouter()
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";

  // 管理员活动数据 (保持不变)
  const adminActivities: RecentActivity[] = [
    {
      id: "1",
      userId: "user1",
      userName: "张三",
      userRole: "学生",
      action: "提交了实验报告",
      resource: "化学反应动力学实验",
      timestamp: "2小时前",
      type: "success",
    },
    {
      id: "2",
      userId: "user2",
      userName: "李老师",
      userRole: "教师",
      action: "创建了新的实训项目",
      resource: "Web开发实践",
      timestamp: "3小时前",
      type: "info",
    },
  ]

  // 普通用户活动数据 (保持不变)
  const userActivities: RecentActivity[] = [
    {
      id: "1",
      userId: "user1",
      userName: "当前用户",
      userRole: "教师",
      action: "批改了作业",
      resource: "数学期中考试",
      timestamp: "2小时前",
      type: "success",
    },
    {
      id: "2",
      userId: "user1",
      userName: "当前用户",
      userRole: "教师",
      action: "发布了新作业",
      resource: "英语阅读理解",
      timestamp: "1天前",
      type: "info",
    },
  ]

  // 角色转换函数 (保持不变)
  const convertRole = (role: string) => {
    if (role.startsWith("ROLE_")) {
      return role.substring(5).toLowerCase();
    }
    return role.toLowerCase();
  };

  useEffect(() => {
    console.log("首页组件挂载");

    const storedUser = localStorage.getItem("user");
    const storedRole = localStorage.getItem("userRole");
    const token = localStorage.getItem("accessToken");
    setAccessToken(token);

    if (storedUser && storedRole) {
      const userData = JSON.parse(storedUser);
      const convertedRole = convertRole(storedRole);

      const userWithRole = {
        ...userData,
        role: convertedRole
      };

      setUser(userWithRole);

      if (convertedRole === "admin") {
        setRecentActivities(adminActivities);
      } else {
        setRecentActivities(userActivities);
      }

      setLoading(false);
    } else {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = async () => {
    const token = localStorage.getItem("accessToken")

    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      } catch (error) {
        console.error("登出失败:", error)
      }
    }

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");

    router.push("/login")
  }

  const getRoleIcon = () => {
    if (user?.role === "admin") return <Shield className="w-4 h-4" />
    if (user?.role === "teacher") return <GraduationCap className="w-4 h-4" />
    return <Users className="w-4 h-4" />
  }

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case "success": return "bg-green-600"
      case "warning": return "bg-yellow-600"
      case "error": return "bg-red-600"
      case "info": return "bg-blue-600"
      default: return "bg-gray-600"
    }
  }

  // 模块卡片逻辑保持不变
  const getModuleCards = () => {
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

    const adminModules = [
      {
        title: "资源管理",
        description: "浏览和管理教学资源库",
        icon: <BookOpen className="w-8 h-8 text-green-600" />,
        href: "/resources",
        color: "bg-green-50 hover:bg-green-100",
      },
      {
        title: "用户管理",
        description: "管理系统用户和权限",
        icon: <Users className="w-8 h-8 text-orange-600" />,
        href: "/user-management",
        color: "bg-orange-50 hover:bg-orange-100",
      },
      {
        title: "日志审计",
        description: "系统操作日志和审计管理",
        icon: <BarChart3 className="w-8 h-8 text-red-600" />,
        href: "/audit-logs",
        color: "bg-red-50 hover:bg-red-100",
      }
    ]

    if (user?.role === "admin") {
      return adminModules
    }
    return userModules
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载用户信息...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <div>未登录，正在跳转到登录页...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header (保持不变) */}
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
              <div
                className="flex items-center space-x-3 cursor-pointer"
                onClick={() => router.push("/profile")}
              >
                <Avatar>
                  {user?.avatarUrl ? (
                    <AvatarImage
                      src={user.avatarUrl}
                      alt={user.realName}
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-blue-100 text-blue-800">
                      {user?.realName?.charAt(0) || "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{user.realName}</p>
                  <div className="flex items-center space-x-1">
                    {getRoleIcon()}
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
        {/* Welcome Section (保持不变) */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">欢迎回来，{user.realName}</h2>
          <p className="text-gray-600">
            {user.role === "admin" && "管理系统运行状态和用户权限"}
            {user.role === "teacher" && "管理您的课程和学生实训项目"}
            {user.role === "student" && "继续您的学习和实训项目"}
          </p>
        </div>

        {/* Quick Stats - 使用新的组件 */}
        {user && accessToken && <QuickStatsDashboard role={user.role} token={accessToken} />}

        {/* Module Cards (保持不变) */}
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

        {/* Recent Activity (保持不变) */}
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
    </div>
  )
}
