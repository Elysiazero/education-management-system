"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, TrendingDown, Minus, Award, Target, Brain } from "lucide-react"

interface GradeAnalyticsProps {
  studentId: string
  grades: any[]
  analytics: any
}

export function GradeAnalytics({ studentId, grades, analytics }: GradeAnalyticsProps) {
  const studentGrades = grades.filter((g) => g.studentId === studentId)
  const studentAnalytic = analytics.find((a: any) => a.studentId === studentId)

  if (!studentAnalytic) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">暂无分析数据</p>
      </div>
    )
  }

  const getPerformanceData = () => {
    const typePerformance = ["experiment", "project", "exam", "homework"].map((type) => {
      const typeGrades = studentGrades.filter((g) => g.type === type)
      const average =
        typeGrades.length > 0
          ? Math.round(typeGrades.reduce((sum, g) => sum + (g.finalScore / g.maxScore) * 100, 0) / typeGrades.length)
          : 0

      return {
        type: type === "experiment" ? "实验" : type === "project" ? "项目" : type === "exam" ? "考试" : "作业",
        score: average,
      }
    })

    return typePerformance.filter((p) => p.score > 0)
  }

  const getScoreDistribution = () => {
    const distribution = { "90-100": 0, "80-89": 0, "70-79": 0, "60-69": 0, "0-59": 0 }
    studentGrades.forEach((grade) => {
      const percentage = (grade.finalScore / grade.maxScore) * 100
      if (percentage >= 90) distribution["90-100"]++
      else if (percentage >= 80) distribution["80-89"]++
      else if (percentage >= 70) distribution["70-79"]++
      else if (percentage >= 60) distribution["60-69"]++
      else distribution["0-59"]++
    })

    return Object.entries(distribution)
      .map(([range, count]) => ({ range, count }))
      .filter((item) => item.count > 0)
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-500" />
  }

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

  return (
    <div className="space-y-6">
      {/* 总体表现 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">平均分</p>
                <p className="text-2xl font-bold">{studentAnalytic.averageScore}%</p>
              </div>
              <Award className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">完成率</p>
                <p className="text-2xl font-bold">
                  {Math.round((studentAnalytic.completedAssignments / studentAnalytic.totalAssignments) * 100)}%
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">学习趋势</p>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(5)}
                  <span className="text-sm text-green-600">持续进步</span>
                </div>
              </div>
              <Brain className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 各类型表现 */}
      <Card>
        <CardHeader>
          <CardTitle>各类型作业表现</CardTitle>
          <CardDescription>不同类型作业的平均分对比</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getPerformanceData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 成绩趋势 */}
      <Card>
        <CardHeader>
          <CardTitle>学习进步趋势</CardTitle>
          <CardDescription>最近几个月的成绩变化</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={studentAnalytic.progressTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 分数分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>分数分布</CardTitle>
            <CardDescription>各分数段的作业数量</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={getScoreDistribution()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, count }) => `${range}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {getScoreDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 能力雷达图数据 */}
        <Card>
          <CardHeader>
            <CardTitle>能力分析</CardTitle>
            <CardDescription>各项能力的评估结果</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "理论基础", score: 85 },
                { name: "实践能力", score: 92 },
                { name: "创新思维", score: 78 },
                { name: "团队协作", score: 88 },
                { name: "问题解决", score: 90 },
              ].map((ability) => (
                <div key={ability.name} className="flex items-center justify-between">
                  <span className="font-medium">{ability.name}</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={ability.score} className="w-24" />
                    <span className="text-sm font-semibold w-12">{ability.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 学习建议 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>优势领域</CardTitle>
            <CardDescription>您表现优秀的方面</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {studentAnalytic.strengths.map((strength: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {strength}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>改进建议</CardTitle>
            <CardDescription>需要加强的方面</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {studentAnalytic.weaknesses.map((weakness: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <Badge variant="outline" className="border-orange-200 text-orange-800">
                    {weakness}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 个性化建议 */}
      <Card>
        <CardHeader>
          <CardTitle>个性化学习建议</CardTitle>
          <CardDescription>基于您的学习表现生成的专属建议</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {studentAnalytic.recommendations.map((recommendation: string, index: number) => (
              <div key={index} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm">{recommendation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
