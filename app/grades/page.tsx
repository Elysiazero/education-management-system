"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import {
  Search,
  TrendingUp,
  TrendingDown,
  Award,
  BookOpen,
  Download,
  Eye,
  Star,
  Target,
  Brain,
  CheckCircle,
  Users,
  FlaskConical,
  Filter,
  Plus,
  Edit,
  AlertTriangle,
  Clock,
  FileText,
  Bell,
  Lightbulb,
  BarChart3,
} from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: "student" | "teacher" | "admin"
}

interface Grade {
  id: string
  studentId: string
  studentName: string
  courseId: string
  courseName: string
  assignmentId: string
  assignmentName: string
  type: "experiment" | "project" | "exam" | "homework"
  autoScore: number
  manualScore?: number
  finalScore: number
  maxScore: number
  submissionDate: string
  gradedDate?: string
  feedback?: string
  criteria: GradingCriteria[]
  status: "pending" | "graded" | "reviewed" | "late"
  teamId?: string
  teamName?: string
  isTeamProject?: boolean
  trend?: "up" | "down" | "stable"
}

interface GradingCriteria {
  id: string
  name: string
  description: string
  maxPoints: number
  earnedPoints: number
  feedback?: string
}

interface StudentAnalytics {
  studentId: string
  studentName: string
  averageScore: number
  totalAssignments: number
  completedAssignments: number
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  progressTrend: { date: string; score: number }[]
}

interface GradeAlert {
  id: string
  studentId: string
  studentName: string
  type: "decline" | "failing" | "below_average" | "missing_assignment"
  severity: "low" | "medium" | "high" | "critical"
  message: string
  createdAt: string
  status: "active" | "acknowledged" | "resolved" | "ignored"
  suggestions: string[]
}

export default function GradesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [grades, setGrades] = useState<Grade[]>([])
  const [filteredGrades, setFilteredGrades] = useState<Grade[]>([])
  const [analytics, setAnalytics] = useState<StudentAnalytics[]>([])
  const [alerts, setAlerts] = useState<GradeAlert[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [subjectFilter, setSubjectFilter] = useState<string>("all")
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null)
  const [showGradeDialog, setShowGradeDialog] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }
    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)

    // 模拟成绩预警数据
    const mockAlerts: GradeAlert[] = [
      {
        id: "1",
        studentId: "student2",
        studentName: "李四",
        type: "decline",
        severity: "medium",
        message: "英语成绩连续两次下降，从85分降至72分",
        createdAt: "2024-01-08 16:00:00",
        status: "active",
        suggestions: ["安排一对一英语辅导", "加强语法基础练习", "增加阅读理解训练"],
      },
      {
        id: "2",
        studentId: "student3",
        studentName: "王五",
        type: "missing_assignment",
        severity: "high",
        message: "物理实验报告已逾期3天未提交",
        createdAt: "2024-01-08 12:00:00",
        status: "active",
        suggestions: ["立即联系学生了解情况", "提供实验报告模板", "安排补交时间"],
      },
      {
        id: "3",
        studentId: "student4",
        studentName: "赵六",
        type: "failing",
        severity: "critical",
        message: "数学成绩45分，低于及格线",
        createdAt: "2024-01-08 14:30:00",
        status: "acknowledged",
        suggestions: ["立即安排补习课程", "联系家长商讨学习计划", "提供基础知识复习资料"],
      },
    ]

    setAlerts(mockAlerts)

    // 根据用户角色加载不同的成绩数据
    if (parsedUser.role === "student") {
      // 学生只能看到自己的成绩
      const studentGrades: Grade[] = [
        {
          id: "1",
          studentId: parsedUser.id,
          studentName: parsedUser.name,
          courseId: "course1",
          courseName: "Web开发实践",
          assignmentId: "assign1",
          assignmentName: "个人实验：React基础",
          type: "experiment",
          autoScore: 85,
          manualScore: 88,
          finalScore: 87,
          maxScore: 100,
          submissionDate: "2024-01-15",
          gradedDate: "2024-01-18",
          feedback: "实验完成度很高，代码结构清晰，但注释还可以更详细。",
          criteria: [
            {
              id: "c1",
              name: "实验完成度",
              description: "实验步骤是否完整执行",
              maxPoints: 30,
              earnedPoints: 28,
              feedback: "大部分实验步骤完成良好",
            },
            {
              id: "c2",
              name: "代码质量",
              description: "代码规范性和可读性",
              maxPoints: 25,
              earnedPoints: 23,
              feedback: "代码结构清晰，命名规范",
            },
            {
              id: "c3",
              name: "实验报告",
              description: "实验报告的完整性和质量",
              maxPoints: 25,
              earnedPoints: 20,
              feedback: "报告内容完整但分析深度有待提升",
            },
            {
              id: "c4",
              name: "创新性",
              description: "实验中的创新点和思考",
              maxPoints: 20,
              earnedPoints: 16,
              feedback: "有一定思考但创新性不够突出",
            },
          ],
          status: "graded",
          trend: "up"
        },
        {
          id: "2",
          studentId: parsedUser.id,
          studentName: parsedUser.name,
          courseId: "course2",
          courseName: "虚拟仿真实验",
          assignmentId: "assign2",
          assignmentName: "化学反应动力学实验",
          type: "experiment",
          autoScore: 92,
          finalScore: 92,
          maxScore: 100,
          submissionDate: "2024-01-10",
          gradedDate: "2024-01-10",
          feedback: "实验操作规范，数据记录准确，分析深入。",
          criteria: [
            {
              id: "c5",
              name: "操作规范性",
              description: "实验操作是否规范",
              maxPoints: 40,
              earnedPoints: 38,
            },
            {
              id: "c6",
              name: "数据准确性",
              description: "实验数据是否准确",
              maxPoints: 35,
              earnedPoints: 33,
            },
            {
              id: "c7",
              name: "分析报告",
              description: "实验分析和结论",
              maxPoints: 25,
              earnedPoints: 21,
            },
          ],
          status: "graded",
          trend: "stable"
        },
        {
          id: "3",
          studentId: parsedUser.id,
          studentName: parsedUser.name,
          courseId: "course1",
          courseName: "Web开发实践",
          assignmentId: "assign3",
          assignmentName: "团队项目：电商网站开发",
          type: "project",
          autoScore: 0,
          finalScore: 0,
          maxScore: 100,
          submissionDate: "",
          teamId: "team1",
          teamName: "创新小组",
          isTeamProject: true,
          criteria: [
            {
              id: "c8",
              name: "项目功能",
              maxPoints: 40,
              earnedPoints: 0,
              description: "项目功能完整性",
            },
            {
              id: "c9",
              name: "团队协作",
              maxPoints: 30,
              earnedPoints: 0,
              description: "团队合作效果",
            },
            {
              id: "c10",
              name: "技术实现",
              maxPoints: 30,
              earnedPoints: 0,
              description: "技术方案和实现质量",
            },
          ],
          status: "pending",
          trend: "down"
        },
      ]

      setGrades(studentGrades)
      setFilteredGrades(studentGrades)

      // 学生个人分析数据
      const studentAnalytics: StudentAnalytics[] = [
        {
          studentId: parsedUser.id,
          studentName: parsedUser.name,
          averageScore: 89.5,
          totalAssignments: 3,
          completedAssignments: 2,
          strengths: ["实验操作", "代码规范", "逻辑思维"],
          weaknesses: ["报告分析", "创新思维"],
          recommendations: [
            "建议加强实验报告的分析深度，多思考实验现象背后的原理",
            "可以尝试在实验中加入自己的创新想法和改进方案",
            "继续保持良好的编程习惯和实验操作规范",
          ],
          progressTrend: [
            { date: "2023-12", score: 82 },
            { date: "2024-01", score: 87 },
            { date: "2024-02", score: 89 },
            { date: "2024-03", score: 92 },
          ],
        },
      ]

      setAnalytics(studentAnalytics)
    } else {
      // 教师和管理员的完整数据
      const mockGrades: Grade[] = [
        {
          id: "1",
          studentId: "student1",
          studentName: "张三",
          courseId: "course1",
          courseName: "Web开发实践",
          assignmentId: "assign1",
          assignmentName: "React项目开发",
          type: "project",
          autoScore: 85,
          manualScore: 88,
          finalScore: 87,
          maxScore: 100,
          submissionDate: "2024-01-15",
          gradedDate: "2024-01-18",
          feedback: "项目完成度很高，代码结构清晰，但UI设计还有改进空间。",
          criteria: [
            {
              id: "c1",
              name: "功能完整性",
              description: "项目功能是否完整实现",
              maxPoints: 30,
              earnedPoints: 28,
              feedback: "大部分功能实现良好",
            },
            {
              id: "c2",
              name: "代码质量",
              description: "代码规范性和可维护性",
              maxPoints: 25,
              earnedPoints: 23,
              feedback: "代码结构清晰，命名规范",
            },
            {
              id: "c3",
              name: "用户界面",
              description: "界面设计和用户体验",
              maxPoints: 25,
              earnedPoints: 20,
              feedback: "界面功能完整但美观度有待提升",
            },
            {
              id: "c4",
              name: "创新性",
              description: "项目的创新点和亮点",
              maxPoints: 20,
              earnedPoints: 16,
              feedback: "有一定创新但不够突出",
            },
          ],
          status: "graded",
          trend: "up"
        },
        // {
        //   id: "2",
        //   studentId: "student2",
        //   studentName: "李四",
        //   courseId: "course3",
        //   courseName: "英语",
        //   assignmentId: "assign4",
        //   assignmentName: "期中考试",
        //   type: "exam",
        //   autoScore: 72,
        //   finalScore: 72,
        //   maxScore: 100,
        //   submissionDate: "2024-01-10",
        //   gradedDate: "2024-01-12",
        //   feedback: "语法基础扎实，但阅读理解需要加强",
        //   status: "graded",
        //   trend: "down"
        // },
        // {
        //   id: "3",
        //   studentId: "student3",
        //   studentName: "王五",
        //   courseId: "course4",
        //   courseName: "物理",
        //   assignmentId: "assign5",
        //   assignmentName: "实验报告",
        //   type: "experiment",
        //   autoScore: 0,
        //   finalScore: 0,
        //   maxScore: 100,
        //   submissionDate: "",
        //   status: "late",
        //   trend: "stable"
        // }
      ]

      setGrades(mockGrades)
      setFilteredGrades(mockGrades)

      const mockAnalytics: StudentAnalytics[] = [
        {
          studentId: "student1",
          studentName: "张三",
          averageScore: 89.5,
          totalAssignments: 8,
          completedAssignments: 6,
          strengths: ["实验操作", "代码规范", "逻辑思维"],
          weaknesses: ["UI设计", "创新思维"],
          recommendations: [
            "建议多关注前端设计趋势，提升UI设计能力",
            "可以尝试更多创新性的项目实践",
            "继续保持良好的编程习惯",
          ],
          progressTrend: [
            { date: "2023-12", score: 82 },
            { date: "2024-01", score: 87 },
            { date: "2024-02", score: 89 },
            { date: "2024-03", score: 92 },
          ],
        },
      ]

      setAnalytics(mockAnalytics)
    }
  }, [router])

  useEffect(() => {
    let filtered = grades

    if (searchTerm) {
      filtered = filtered.filter(
          (grade) =>
              grade.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              grade.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              grade.assignmentName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((grade) => grade.type === typeFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((grade) => grade.status === statusFilter)
    }

    if (subjectFilter !== "all") {
      filtered = filtered.filter((grade) => grade.courseName === subjectFilter)
    }

    setFilteredGrades(filtered)
  }, [grades, searchTerm, typeFilter, statusFilter, subjectFilter])

  const getTypeLabel = (type: string) => {
    const labels = {
      experiment: "实验",
      project: "项目",
      exam: "考试",
      homework: "作业",
    }
    return labels[type as keyof typeof labels] || type
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: "待评分",
      graded: "已评分",
      reviewed: "已复核",
      late: "逾期",
    }
    return labels[status as keyof typeof labels] || status
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      graded: "bg-green-100 text-green-800",
      reviewed: "bg-blue-100 text-blue-800",
      late: "bg-red-100 text-red-800",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "graded":
        return <Badge variant="default">已评分</Badge>
      case "pending":
        return <Badge variant="secondary">待评分</Badge>
      case "late":
        return <Badge variant="destructive">逾期</Badge>
      case "reviewed":
        return <Badge variant="outline">已复核</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <div className="w-4 h-4" />
    }
  }

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 90) return "text-green-600"
    if (percentage >= 80) return "text-blue-600"
    if (percentage >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const calculateAverage = () => {
    const gradedGrades = filteredGrades.filter(grade => grade.finalScore > 0)
    if (gradedGrades.length === 0) return 0
    const total = gradedGrades.reduce((sum, grade) => sum + (grade.finalScore / grade.maxScore) * 100, 0)
    return Math.round(total / gradedGrades.length)
  }

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: "outline",
      medium: "secondary",
      high: "destructive",
      critical: "destructive",
    } as const

    const labels = {
      low: "低级",
      medium: "中级",
      high: "高级",
      critical: "严重",
    }

    return (
        <Badge variant={variants[severity as keyof typeof variants]}>
          {labels[severity as keyof typeof labels]}
        </Badge>
    )
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "decline":
        return <TrendingDown className="w-5 h-5 text-red-600" />
      case "failing":
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case "below_average":
        return <BarChart3 className="w-5 h-5 text-yellow-600" />
      case "missing_assignment":
        return <Clock className="w-5 h-5 text-orange-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case "acknowledged":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "ignored":
        return <div className="w-4 h-4 bg-gray-400 rounded-full" />
      default:
        return <div className="w-4 h-4" />
    }
  }

  const exportGrades = () => {
    const csvContent = [
      ["课程", "作业", "类型", "得分", "满分", "百分比", "状态", "提交日期"].join(","),
      ...filteredGrades.map((grade) =>
          [
            grade.courseName,
            grade.assignmentName,
            getTypeLabel(grade.type),
            grade.finalScore,
            grade.maxScore,
            `${Math.round((grade.finalScore / grade.maxScore) * 100)}%`,
            getStatusLabel(grade.status),
            grade.submissionDate,
          ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `grades_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!user) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  }

  // 学生端界面
  if (user.role === "student") {
    return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">我的成绩</h1>
                <p className="text-gray-600">查看您的学习成绩和进度分析</p>
              </div>
              <Button onClick={exportGrades}>
                <Download className="w-4 h-4 mr-2" />
                导出成绩
              </Button>
            </div>

            {/* 学生统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Award className="w-8 h-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">平均分</p>
                      <p className="text-2xl font-bold text-gray-900">{calculateAverage()}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <FlaskConical className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">实验完成</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {filteredGrades.filter((g) => g.type === "experiment" && g.status === "graded").length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">团队项目</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {filteredGrades.filter((g) => g.type === "project").length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">完成率</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.round(
                            (filteredGrades.filter((g) => g.status === "graded").length / filteredGrades.length) * 100,
                        ) || 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="grades" className="space-y-6">
              <TabsList>
                <TabsTrigger value="grades">成绩列表</TabsTrigger>
                <TabsTrigger value="analytics">学习分析</TabsTrigger>
                <TabsTrigger value="recommendations">学习建议</TabsTrigger>
              </TabsList>

              <TabsContent value="grades">
                {/* 筛选器 */}
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="搜索课程、作业..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                      </div>

                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="作业类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部类型</SelectItem>
                          <SelectItem value="experiment">实验</SelectItem>
                          <SelectItem value="project">项目</SelectItem>
                          <SelectItem value="exam">考试</SelectItem>
                          <SelectItem value="homework">作业</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="评分状态" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部状态</SelectItem>
                          <SelectItem value="pending">待评分</SelectItem>
                          <SelectItem value="graded">已评分</SelectItem>
                          <SelectItem value="reviewed">已复核</SelectItem>
                          <SelectItem value="late">逾期</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* 成绩表格 */}
                <Card>
                  <CardHeader>
                    <CardTitle>我的成绩</CardTitle>
                    <CardDescription>个人学习成绩详细信息</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>课程</TableHead>
                            <TableHead>作业/实验</TableHead>
                            <TableHead>类型</TableHead>
                            <TableHead>得分</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead>提交日期</TableHead>
                            <TableHead>操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredGrades.map((grade) => (
                              <TableRow key={grade.id}>
                                <TableCell className="font-medium">{grade.courseName}</TableCell>
                                <TableCell>
                                  <div>
                                    {grade.assignmentName}
                                    {grade.isTeamProject && (
                                        <Badge variant="outline" className="ml-2">
                                          团队: {grade.teamName}
                                        </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{getTypeLabel(grade.type)}</Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                <span className={`font-semibold ${getScoreColor(grade.finalScore, grade.maxScore)}`}>
                                  {grade.finalScore > 0 ? `${grade.finalScore}/${grade.maxScore}` : "未评分"}
                                </span>
                                    {grade.finalScore > 0 && (
                                        <span className="text-sm text-gray-500">
                                    ({Math.round((grade.finalScore / grade.maxScore) * 100)}%)
                                  </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(grade.status)}
                                </TableCell>
                                <TableCell>{grade.submissionDate || "未提交"}</TableCell>
                                <TableCell>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                      <DialogHeader>
                                        <DialogTitle>成绩详情</DialogTitle>
                                        <DialogDescription>{grade.assignmentName}</DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-6">
                                        {grade.finalScore > 0 && (
                                            <>
                                              <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                  <Label>自动评分</Label>
                                                  <p className="text-2xl font-bold text-blue-600">{grade.autoScore}</p>
                                                </div>
                                                {grade.manualScore && (
                                                    <div>
                                                      <Label>人工评分</Label>
                                                      <p className="text-2xl font-bold text-green-600">{grade.manualScore}</p>
                                                    </div>
                                                )}
                                              </div>

                                              <div>
                                                <Label>最终得分</Label>
                                                <p className="text-3xl font-bold text-purple-600">
                                                  {grade.finalScore}/{grade.maxScore}
                                                </p>
                                                <Progress
                                                    value={(grade.finalScore / grade.maxScore) * 100}
                                                    className="mt-2"
                                                />
                                              </div>

                                              <div>
                                                <Label>评分标准</Label>
                                                <div className="space-y-3 mt-2">
                                                  {grade.criteria.map((criterion) => (
                                                      <div key={criterion.id} className="border rounded-lg p-3">
                                                        <div className="flex justify-between items-center mb-2">
                                                          <h4 className="font-medium">{criterion.name}</h4>
                                                          <span className="text-sm font-semibold">
                                                    {criterion.earnedPoints}/{criterion.maxPoints}
                                                  </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mb-2">{criterion.description}</p>
                                                        <Progress
                                                            value={(criterion.earnedPoints / criterion.maxPoints) * 100}
                                                            className="mb-2"
                                                        />
                                                        {criterion.feedback && (
                                                            <p className="text-sm text-blue-600">{criterion.feedback}</p>
                                                        )}
                                                      </div>
                                                  ))}
                                                </div>
                                              </div>

                                              {grade.feedback && (
                                                  <div>
                                                    <Label>教师评语</Label>
                                                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                                                      <p className="text-sm">{grade.feedback}</p>
                                                    </div>
                                                  </div>
                                              )}
                                            </>
                                        )}

                                        {grade.finalScore === 0 && (
                                            <div className="text-center py-8">
                                              <p className="text-gray-500">该作业尚未评分</p>
                                            </div>
                                        )}
                                      </div>
                                    </DialogContent>
                                  </Dialog>
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
                  {/* 成绩趋势图 */}
                  <Card>
                    <CardHeader>
                      <CardTitle>学习进步趋势</CardTitle>
                      <CardDescription>最近几个月的成绩变化</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {analytics.length > 0 && (
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analytics[0].progressTrend}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis domain={[0, 100]} />
                              <Tooltip formatter={(value) => [`${value}%`, "得分"]} />
                              <Line
                                  type="monotone"
                                  dataKey="score"
                                  stroke="#10b981"
                                  strokeWidth={2}
                                  dot={{ r: 4 }}
                                  activeDot={{ r: 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  {/* 类型分析 */}
                  <Card>
                    <CardHeader>
                      <CardTitle>作业类型分析</CardTitle>
                      <CardDescription>不同类型作业的表现</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {["experiment", "project", "exam", "homework"].map((type) => {
                          const typeGrades = filteredGrades.filter((g) => g.type === type && g.finalScore > 0)
                          const average =
                              typeGrades.length > 0
                                  ? Math.round(
                                      typeGrades.reduce((sum, g) => sum + (g.finalScore / g.maxScore) * 100, 0) /
                                      typeGrades.length,
                                  )
                                  : 0

                          return (
                              <div key={type} className="flex items-center justify-between">
                                <span className="font-medium">{getTypeLabel(type)}</span>
                                <div className="flex items-center space-x-2">
                                  <Progress value={average} className="w-24" />
                                  <span className="text-sm font-semibold w-12">{average}%</span>
                                </div>
                              </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 能力分析 */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>能力分析</CardTitle>
                      <CardDescription>各项能力的评估结果</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-3 flex items-center">
                            <Star className="w-4 h-4 mr-2 text-yellow-500" />
                            优势能力
                          </h4>
                          <div className="space-y-2">
                            {analytics.length > 0 &&
                                analytics[0].strengths.map((strength, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                      <span className="text-sm">{strength}</span>
                                    </div>
                                ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-3 flex items-center">
                            <Target className="w-4 h-4 mr-2 text-orange-500" />
                            待提升能力
                          </h4>
                          <div className="space-y-2">
                            {analytics.length > 0 &&
                                analytics[0].weaknesses.map((weakness, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                      <Target className="w-4 h-4 text-orange-500" />
                                      <span className="text-sm">{weakness}</span>
                                    </div>
                                ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="recommendations">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Brain className="w-5 h-5 mr-2 text-purple-500" />
                      个性化学习建议
                    </CardTitle>
                    <CardDescription>基于您的学习表现生成的专属建议</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.length > 0 &&
                          analytics[0].recommendations.map((recommendation, index) => (
                              <div key={index} className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                                <p className="text-sm">{recommendation}</p>
                              </div>
                          ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
    )
  }

  // 教师和管理员界面
  return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">成绩评估系统</h1>
              <p className="text-gray-600">
                {user.role === "teacher" ? "管理学生成绩和评分" : "查看整体成绩统计和分析"}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                添加成绩
              </Button>
              <Button onClick={exportGrades} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                导出数据
              </Button>
            </div>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">总学生数</p>
                    <p className="text-2xl font-bold text-gray-900">156</p>
                    <p className="text-sm text-green-600">+12 本月</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">平均分</p>
                    <p className="text-2xl font-bold text-gray-900">{calculateAverage()}%</p>
                    <p className="text-sm text-green-600">+2.3 较上月</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">及格率</p>
                    <p className="text-2xl font-bold text-gray-900">85%</p>
                    <p className="text-sm text-green-600">+5% 较上月</p>
                  </div>
                  <Target className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">预警数量</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {alerts.filter((a) => a.status === "active").length}
                    </p>
                    <p className="text-sm text-red-600">需要关注</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="grades" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">概览</TabsTrigger>
              <TabsTrigger value="grades">成绩管理</TabsTrigger>
              <TabsTrigger value="analytics">智能分析</TabsTrigger>
              <TabsTrigger value="grading">评分管理</TabsTrigger>
              <TabsTrigger value="alerts">成绩预警</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>成绩分布</CardTitle>
                    <CardDescription>各分数段学生分布情况</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>90-100分</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={25} className="w-24" />
                          <span className="text-sm font-medium">25%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>80-89分</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={35} className="w-24" />
                          <span className="text-sm font-medium">35%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>70-79分</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={25} className="w-24" />
                          <span className="text-sm font-medium">25%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>60-69分</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={10} className="w-24" />
                          <span className="text-sm font-medium">10%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>60分以下</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={5} className="w-24" />
                          <span className="text-sm font-medium">5%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>学习建议</CardTitle>
                    <CardDescription>基于成绩分析的个性化建议</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="font-medium">加强基础知识</p>
                          <p className="text-sm text-gray-600">15名学生需要加强基础概念理解</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Brain className="w-5 h-5 text-purple-500 mt-0.5" />
                        <div>
                          <p className="font-medium">提高解题技巧</p>
                          <p className="text-sm text-gray-600">23名学生需要加强解题方法训练</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <BookOpen className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="font-medium">增加练习量</p>
                          <p className="text-sm text-gray-600">8名学生需要增加课后练习</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="grades">
              {/* 筛选器 */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Filter className="w-5 h-5 mr-2" />
                    筛选条件
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">搜索</label>
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="搜索学生、科目、作业..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">科目</label>
                      <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择科目" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部科目</SelectItem>
                          <SelectItem value="数学">数学</SelectItem>
                          <SelectItem value="英语">英语</SelectItem>
                          <SelectItem value="物理">物理</SelectItem>
                          <SelectItem value="化学">化学</SelectItem>
                          <SelectItem value="Web开发实践">Web开发实践</SelectItem>
                          <SelectItem value="虚拟仿真实验">虚拟仿真实验</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">类型</label>
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="作业类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部类型</SelectItem>
                          <SelectItem value="experiment">实验</SelectItem>
                          <SelectItem value="project">项目</SelectItem>
                          <SelectItem value="exam">考试</SelectItem>
                          <SelectItem value="homework">作业</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">状态</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择状态" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部状态</SelectItem>
                          <SelectItem value="graded">已评分</SelectItem>
                          <SelectItem value="pending">待评分</SelectItem>
                          <SelectItem value="late">逾期</SelectItem>
                          <SelectItem value="reviewed">已复核</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 成绩表格 */}
              <Card>
                <CardHeader>
                  <CardTitle>成绩列表 ({filteredGrades.length} 条记录)</CardTitle>
                  <CardDescription>学生成绩详细信息</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>学生</TableHead>
                          <TableHead>科目</TableHead>
                          <TableHead>作业/考试</TableHead>
                          <TableHead>类型</TableHead>
                          <TableHead>成绩</TableHead>
                          <TableHead>趋势</TableHead>
                          <TableHead>状态</TableHead>
                          <TableHead>提交时间</TableHead>
                          <TableHead>操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredGrades.map((grade) => (
                            <TableRow key={grade.id}>
                              <TableCell className="font-medium">{grade.studentName}</TableCell>
                              <TableCell>{grade.courseName}</TableCell>
                              <TableCell>{grade.assignmentName}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{getTypeLabel(grade.type)}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                              <span className={`font-bold text-lg ${getScoreColor(grade.finalScore, grade.maxScore)}`}>
                                {grade.finalScore > 0 ? grade.finalScore : "-"}
                              </span>
                                  {grade.maxScore > 0 && <span className="text-gray-500">/ {grade.maxScore}</span>}
                                  {grade.finalScore > 0 && (
                                      <Badge variant={grade.finalScore / grade.maxScore >= 0.6 ? "default" : "destructive"}>
                                        {Math.round((grade.finalScore / grade.maxScore) * 100)}%
                                      </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{grade.trend && getTrendIcon(grade.trend)}</TableCell>
                              <TableCell>{getStatusBadge(grade.status)}</TableCell>
                              <TableCell className="text-sm text-gray-500">{grade.submissionDate || "未提交"}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button size="sm" variant="outline">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <FileText className="w-4 h-4" />
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
              <Card>
                <CardHeader>
                  <CardTitle>成绩分析</CardTitle>
                  <CardDescription>整体成绩统计和分析</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { name: "1月", 平均分: 78, 及格率: 82 },
                        { name: "2月", 平均分: 82, 及格率: 85 },
                        { name: "3月", 平均分: 85, 及格率: 88 },
                        { name: "4月", 平均分: 87, 及格率: 90 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="平均分" stroke="#8884d8" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="及格率" stroke="#82ca9d" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="grading">
              <Card>
                <CardHeader>
                  <CardTitle>评分管理</CardTitle>
                  <CardDescription>待评分作业管理</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold">自动评分引擎</h3>
                      <Button variant="secondary">运行评分</Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">待评分作业</p>
                              <p className="text-2xl font-bold">24</p>
                            </div>
                            <FileText className="w-8 h-8 text-blue-600" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">已自动评分</p>
                              <p className="text-2xl font-bold">18</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">需要人工复核</p>
                              <p className="text-2xl font-bold">6</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-yellow-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">评分队列</h4>
                      <div className="border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>作业名称</TableHead>
                              <TableHead>课程</TableHead>
                              <TableHead>提交时间</TableHead>
                              <TableHead>状态</TableHead>
                              <TableHead>操作</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>React项目开发</TableCell>
                              <TableCell>Web开发实践</TableCell>
                              <TableCell>2024-01-15</TableCell>
                              <TableCell><Badge variant="secondary">排队中</Badge></TableCell>
                              <TableCell>
                                <Button size="sm" variant="outline">优先处理</Button>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>化学反应实验报告</TableCell>
                              <TableCell>虚拟仿真实验</TableCell>
                              <TableCell>2024-01-16</TableCell>
                              <TableCell><Badge variant="default">处理中</Badge></TableCell>
                              <TableCell>
                                <Button size="sm" variant="outline">查看详情</Button>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts">
              <div className="space-y-6">
                {/* 预警统计 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">活跃预警</p>
                          <p className="text-2xl font-bold text-red-600">
                            {alerts.filter((a) => a.status === "active").length}
                          </p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">已确认</p>
                          <p className="text-2xl font-bold text-yellow-600">
                            {alerts.filter((a) => a.status === "acknowledged").length}
                          </p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">已解决</p>
                          <p className="text-2xl font-bold text-green-600">
                            {alerts.filter((a) => a.status === "resolved").length}
                          </p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">处理率</p>
                          {/*<p className="text-2xl font-bold text-blue-600">*/}
                          {/*  {Math.round(*/}
                          {/*      (alerts.filter(a => a.status !== "active").length / alerts.length * 100*/}
                          {/*      ) || 0}%*/}
                          {/*</p>*/}
                        </div>
                        <BarChart3 className="w-8 h-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 预警列表 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Bell className="w-5 h-5 mr-2" />
                      成绩预警列表
                    </CardTitle>
                    <CardDescription>需要关注的学生成绩异常情况</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {alerts.map((alert) => (
                          <div key={alert.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3">
                                {getAlertIcon(alert.type)}
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h4 className="font-medium">{alert.studentName}</h4>
                                    {getSeverityBadge(alert.severity)}
                                    <div className="flex items-center space-x-1">
                                      {getStatusIcon(alert.status)}
                                      <span className="text-sm text-gray-500 capitalize">{alert.status}</span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                                  <p className="text-xs text-gray-500">{new Date(alert.createdAt).toLocaleString()}</p>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">
                                  确认
                                </Button>
                                <Button size="sm">处理</Button>
                              </div>
                            </div>

                            {/* 建议措施 */}
                            {alert.suggestions.length > 0 && (
                                <div className="bg-blue-50 p-3 rounded-md">
                                  <h5 className="text-sm font-medium text-blue-900 mb-2">建议措施：</h5>
                                  <ul className="text-sm text-blue-800 space-y-1">
                                    {alert.suggestions.map((suggestion, index) => (
                                        <li key={index} className="flex items-start space-x-2">
                                          <span className="text-blue-600">•</span>
                                          <span>{suggestion}</span>
                                        </li>
                                    ))}
                                  </ul>
                                </div>
                            )}
                          </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
  )
}