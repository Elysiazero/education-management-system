"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    FlaskConical,
    Search,
    ArrowLeft,
    Clock,
    Star,
    BookOpen,
    FileText,
    Download,
    Eye,
    Calendar,
    Award,
    TrendingUp,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"

// 创建 QueryClient 实例
const queryClient = new QueryClient()

interface User {
    id: string
    name: string
    email: string
    role: "student" | "teacher" | "admin"
}

interface ExperimentRecord {
    id: string
    experimentId: string
    experimentTitle: string
    experimentCategory: string
    taskName: string
    startTime: string
    endTime: string
    submitTime?: string
    status: "未开始" | "进行中" | "已提交" | "已批改"
    grade?: number
    feedback?: string
    progress: number
    duration: number
    difficulty: number
}

interface ExperimentStats {
    totalExperiments: number
    completedExperiments: number
    averageGrade: number
    totalHours: number
    categoryStats: {
        category: string
        count: number
        averageGrade: number
    }[]
}

// API基础URL
const API_BASE_URL = "http://localhost:8080/api/v1/teaching"

// 获取token的函数
const getAuthToken = () => {
    return localStorage.getItem("accessToken")
}

// 获取当前用户信息
const fetchUser = async (): Promise<User> => {
    const token = getAuthToken()
    if (!token) throw new Error("用户未登录")

    const response = await fetch(`http://localhost:8080/api/v1/me/profile`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
    if (!response.ok) throw new Error("获取用户信息失败")
    const backendUser = await response.json()
    const processRole = (roles: string[] = []): "student" | "teacher" | "admin" => {
        const firstRole = (roles[0] || "").toUpperCase()
        if (firstRole === "ROLE_STUDENT") return "student"
        if (firstRole === "ROLE_TEACHER") return "teacher"
        if (firstRole === "ROLE_ADMIN") return "admin"
        return "student"
    }
    return {
        id: String(backendUser.id),
        name: backendUser.realName || backendUser.username || "未命名用户",
        email: backendUser.email || "",
        role: processRole(backendUser.roles),
    }
}

// 获取实验记录
const fetchExperimentRecords = async (
    page = 0,
    size = 10,
    status?: string,
): Promise<{ records: ExperimentRecord[]; totalPages: number }> => {
    const token = getAuthToken()
    if (!token) throw new Error("用户未登录")

    const params = new URLSearchParams()
    params.append("page", page.toString())
    params.append("size", size.toString())
    if (status && status !== "all") params.append("status", status)

    const response = await fetch(`${API_BASE_URL}/experiment-tasks/my-tasks?${params.toString()}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    if (!response.ok) throw new Error("获取实验记录失败")

    const responseData = await response.json()
    const data = responseData?.data || {}
    const tasks = data?.content || data?.records || []

    const records: ExperimentRecord[] = tasks.map((task: any) => ({
        id: String(task.id),
        experimentId: String(task.experimentId || task.experiment?.id || ""),
        experimentTitle: task.experiment?.title || "未知实验",
        experimentCategory: task.experiment?.subject || "其它",
        taskName: task.taskName || "未命名任务",
        startTime: task.startTime || new Date().toISOString(),
        endTime: task.endTime || new Date().toISOString(),
        submitTime: task.submitTime,
        status: mapTaskStatus(task.status),
        grade: task.grade,
        feedback: task.feedback,
        progress: task.progress || 0,
        duration: task.experiment?.duration || 30,
        difficulty: task.experiment?.difficulty || 1,
    }))

    return {
        records,
        totalPages: data?.totalPages || data?.pages || 0,
    }
}

// 获取实验统计数据
const fetchExperimentStats = async (): Promise<ExperimentStats> => {
    const token = getAuthToken()
    if (!token) throw new Error("用户未登录")

    // 获取所有实验记录来计算统计数据
    const response = await fetch(`${API_BASE_URL}/experiment-tasks/my-tasks?page=0&size=1000`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    if (!response.ok) throw new Error("获取统计数据失败")

    const responseData = await response.json()
    const data = responseData?.data || {}
    const tasks = data?.content || data?.records || []

    // 计算统计数据
    const totalExperiments = tasks.length
    const completedExperiments = tasks.filter(
        (task: any) => task.status === "GRADED" || task.status === "SUBMITTED",
    ).length
    const gradedTasks = tasks.filter((task: any) => task.grade != null)
    const averageGrade =
        gradedTasks.length > 0
            ? gradedTasks.reduce((sum: number, task: any) => sum + (task.grade || 0), 0) / gradedTasks.length
            : 0
    const totalHours = tasks.reduce((sum: number, task: any) => sum + (task.experiment?.duration || 0), 0) / 60

    // 按学科分类统计
    const categoryMap = new Map<string, { count: number; totalGrade: number; gradeCount: number }>()
    tasks.forEach((task: any) => {
        const category = task.experiment?.subject || "其它"
        const existing = categoryMap.get(category) || { count: 0, totalGrade: 0, gradeCount: 0 }
        existing.count++
        if (task.grade != null) {
            existing.totalGrade += task.grade
            existing.gradeCount++
        }
        categoryMap.set(category, existing)
    })

    const categoryStats = Array.from(categoryMap.entries()).map(([category, stats]) => ({
        category,
        count: stats.count,
        averageGrade: stats.gradeCount > 0 ? stats.totalGrade / stats.gradeCount : 0,
    }))

    return {
        totalExperiments,
        completedExperiments,
        averageGrade,
        totalHours,
        categoryStats,
    }
}

const mapTaskStatus = (status: string): "未开始" | "进行中" | "已提交" | "已批改" => {
    switch (status?.toUpperCase()) {
        case "PENDING":
            return "未开始"
        case "IN_PROGRESS":
            return "进行中"
        case "SUBMITTED":
            return "已提交"
        case "GRADED":
            return "已批改"
        default:
            return "未开始"
    }
}

// 包装组件以提供 React Query 上下文
export default function ExperimentRecordsPageWrapper() {
    return (
        <QueryClientProvider client={queryClient}>
            <ExperimentRecordsPage />
        </QueryClientProvider>
    )
}

function ExperimentRecordsPage() {
    const router = useRouter()

    // 状态管理
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize] = useState(10)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [categoryFilter, setCategoryFilter] = useState<string>("all")

    // 使用 React Query 获取数据
    const { data: user, isLoading: userLoading } = useQuery<User>({
        queryKey: ["user"],
        queryFn: fetchUser,
        staleTime: 1000 * 60 * 5,
    })

    const {
        data: recordsData = { records: [], totalPages: 0 },
        isLoading: recordsLoading,
        error: recordsError,
    } = useQuery({
        queryKey: ["experimentRecords", currentPage, statusFilter],
        queryFn: () => fetchExperimentRecords(currentPage, pageSize, statusFilter),
        enabled: !!user,
        staleTime: 1000 * 60 * 5,
    })

    const { data: stats, isLoading: statsLoading } = useQuery<ExperimentStats>({
        queryKey: ["experimentStats"],
        queryFn: fetchExperimentStats,
        enabled: !!user,
        staleTime: 1000 * 60 * 5,
    })

    // 过滤记录
    const filteredRecords = recordsData.records.filter((record) => {
        const matchesSearch =
            record.experimentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.taskName.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = categoryFilter === "all" || record.experimentCategory === categoryFilter
        return matchesSearch && matchesCategory
    })

    const renderStarRating = (difficulty: number) => {
        return (
            <div className="flex">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < difficulty ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                ))}
            </div>
        )
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "已批改":
                return "default"
            case "已提交":
                return "secondary"
            case "进行中":
                return "outline"
            case "未开始":
                return "destructive"
            default:
                return "outline"
        }
    }

    // 加载错误处理
    if (recordsError) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="bg-red-100 text-red-700 p-4 rounded-lg max-w-md mx-auto">
                        <h2 className="text-xl font-bold mb-2">加载数据失败</h2>
                        <p className="mb-4">请检查网络连接后重试</p>
                        <Button variant="default" onClick={() => router.refresh()}>
                            重新加载
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    // 加载中状态
    if (userLoading || recordsLoading || statsLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center mb-6">
                        <Skeleton className="h-10 w-20 mr-4" />
                        <div>
                            <Skeleton className="h-8 w-48 mb-2" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                    </div>

                    {/* 统计卡片 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        {[...Array(4)].map((_, i) => (
                            <Card key={i}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-4" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-8 w-16 mb-2" />
                                    <Skeleton className="h-3 w-24" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* 筛选器 */}
                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Skeleton className="h-10" />
                                <Skeleton className="h-10" />
                                <Skeleton className="h-10" />
                                <Skeleton className="h-10" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* 记录列表 */}
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <Card key={i}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <Skeleton className="h-6 w-64 mb-2" />
                                            <Skeleton className="h-4 w-48" />
                                        </div>
                                        <Skeleton className="h-6 w-16" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">加载中...</div>
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 页面头部 */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            返回
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">我的实验记录</h1>
                            <p className="text-gray-600">查看您的实验历史和成绩</p>
                        </div>
                    </div>
                </div>

                {/* 统计卡片 */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">总实验数</CardTitle>
                                <FlaskConical className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalExperiments}</div>
                                <p className="text-xs text-muted-foreground">已完成 {stats.completedExperiments} 个</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">平均成绩</CardTitle>
                                <Award className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.averageGrade.toFixed(1)}</div>
                                <p className="text-xs text-muted-foreground">满分 100 分</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">学习时长</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalHours.toFixed(1)}h</div>
                                <p className="text-xs text-muted-foreground">累计实验时间</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">完成率</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats.totalExperiments > 0
                                        ? ((stats.completedExperiments / stats.totalExperiments) * 100).toFixed(1)
                                        : 0}
                                    %
                                </div>
                                <p className="text-xs text-muted-foreground">实验完成率</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* 筛选器 */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="搜索实验..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="选择状态" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">全部状态</SelectItem>
                                    <SelectItem value="PENDING">未开始</SelectItem>
                                    <SelectItem value="IN_PROGRESS">进行中</SelectItem>
                                    <SelectItem value="SUBMITTED">已提交</SelectItem>
                                    <SelectItem value="GRADED">已批改</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="选择学科" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">全部学科</SelectItem>
                                    <SelectItem value="化学">化学</SelectItem>
                                    <SelectItem value="物理">物理</SelectItem>
                                    <SelectItem value="生物">生物</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button variant="outline" onClick={() => router.push("/virtual-lab")}>
                                <BookOpen className="w-4 h-4 mr-2" />
                                返回实验平台
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Tabs defaultValue="records" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="records">
                            <FileText className="w-4 h-4 mr-2" />
                            实验记录
                        </TabsTrigger>
                        <TabsTrigger value="stats">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            统计分析
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="records">
                        {/* 实验记录列表 */}
                        <div className="space-y-4">
                            {filteredRecords.length === 0 ? (
                                <Card>
                                    <CardContent className="text-center py-12">
                                        <FlaskConical className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无实验记录</h3>
                                        <p className="text-gray-500">您还没有参与任何实验</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                filteredRecords.map((record) => (
                                    <Card key={record.id} className="hover:shadow-md transition-shadow">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-lg">{record.experimentTitle}</CardTitle>
                                                    <CardDescription className="mt-1">
                                                        任务: {record.taskName} | 学科: {record.experimentCategory}
                                                    </CardDescription>
                                                </div>
                                                <Badge variant={getStatusColor(record.status)}>{record.status}</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                                <div className="flex items-center space-x-2">
                                                    <Calendar className="w-4 h-4 text-gray-500" />
                                                    <span className="text-sm text-gray-600">
                            开始: {new Date(record.startTime).toLocaleDateString()}
                          </span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Clock className="w-4 h-4 text-gray-500" />
                                                    <span className="text-sm text-gray-600">
                            截止: {new Date(record.endTime).toLocaleDateString()}
                          </span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm text-gray-600">难度:</span>
                                                    {renderStarRating(record.difficulty)}
                                                </div>
                                                {record.grade !== undefined && (
                                                    <div className="flex items-center space-x-2">
                                                        <Award className="w-4 h-4 text-gray-500" />
                                                        <span className="text-sm text-gray-600">成绩: {record.grade}分</span>
                                                    </div>
                                                )}
                                            </div>

                                            {record.feedback && (
                                                <div className="bg-blue-50 p-3 rounded-md mb-4">
                                                    <h4 className="text-sm font-medium text-blue-900 mb-1">教师反馈</h4>
                                                    <p className="text-sm text-blue-800">{record.feedback}</p>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center space-x-4">
                                                    <span className="text-sm text-gray-500">进度: {record.progress}%</span>
                                                    <span className="text-sm text-gray-500">时长: {record.duration}分钟</span>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="w-4 h-4 mr-1" />
                                                        查看详情
                                                    </Button>
                                                    {record.status === "已批改" && (
                                                        <Button variant="outline" size="sm">
                                                            <Download className="w-4 h-4 mr-1" />
                                                            下载报告
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>

                        {/* 分页控件 */}
                        {recordsData.totalPages > 1 && (
                            <div className="mt-8">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    if (currentPage > 0) setCurrentPage(currentPage - 1)
                                                }}
                                                className={currentPage === 0 ? "opacity-50 cursor-not-allowed" : ""}
                                            />
                                        </PaginationItem>

                                        {Array.from({ length: recordsData.totalPages }, (_, i) => (
                                            <PaginationItem key={i}>
                                                <PaginationLink
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        setCurrentPage(i)
                                                    }}
                                                    isActive={i === currentPage}
                                                >
                                                    {i + 1}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ))}

                                        <PaginationItem>
                                            <PaginationNext
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    if (currentPage < recordsData.totalPages - 1) setCurrentPage(currentPage + 1)
                                                }}
                                                className={currentPage >= recordsData.totalPages - 1 ? "opacity-50 cursor-not-allowed" : ""}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="stats">
                        {/* 统计分析 */}
                        {stats && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>学科分布</CardTitle>
                                        <CardDescription>各学科实验数量和平均成绩</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {stats.categoryStats.map((category) => (
                                                <div key={category.category} className="flex justify-between items-center">
                                                    <div>
                                                        <span className="font-medium">{category.category}</span>
                                                        <span className="text-sm text-gray-500 ml-2">({category.count} 个实验)</span>
                                                    </div>
                                                    <div className="text-right">
                            <span className="font-medium">
                              {category.averageGrade > 0 ? category.averageGrade.toFixed(1) : "暂无"}分
                            </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>学习进度</CardTitle>
                                        <CardDescription>您的实验学习情况总览</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-6">
                                            <div>
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span>完成进度</span>
                                                    <span>
                            {stats.completedExperiments}/{stats.totalExperiments}
                          </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full"
                                                        style={{
                                                            width: `${stats.totalExperiments > 0 ? (stats.completedExperiments / stats.totalExperiments) * 100 : 0}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-green-600">{stats.completedExperiments}</div>
                                                    <div className="text-sm text-gray-500">已完成</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-orange-600">
                                                        {stats.totalExperiments - stats.completedExperiments}
                                                    </div>
                                                    <div className="text-sm text-gray-500">待完成</div>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t">
                                                <div className="text-center">
                                                    <div className="text-lg font-semibold">学习建议</div>
                                                    <p className="text-sm text-gray-600 mt-2">
                                                        {stats.averageGrade >= 90
                                                            ? "表现优秀！继续保持这种学习状态。"
                                                            : stats.averageGrade >= 80
                                                                ? "学习状态良好，可以尝试更有挑战性的实验。"
                                                                : stats.averageGrade >= 70
                                                                    ? "基础扎实，建议多练习提高实验技能。"
                                                                    : "建议复习基础知识，多参与实验练习。"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
