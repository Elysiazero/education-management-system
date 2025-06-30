"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, AlertCircle, Zap, Brain, Target } from "lucide-react"

interface AutoGradingEngineProps {
  assignmentId: string
  submissionData: any
  onGradingComplete: (result: any) => void
}

export function AutoGradingEngine({ assignmentId, submissionData, onGradingComplete }: AutoGradingEngineProps) {
  const [isGrading, setIsGrading] = useState(false)
  const [gradingProgress, setGradingProgress] = useState(0)
  const [gradingResult, setGradingResult] = useState<any>(null)

  const startAutoGrading = async () => {
    setIsGrading(true)
    setGradingProgress(0)

    // 模拟自动评分过程
    const steps = [
      { name: "代码语法检查", weight: 20 },
      { name: "功能完整性测试", weight: 30 },
      { name: "性能评估", weight: 20 },
      { name: "代码质量分析", weight: 15 },
      { name: "创新性评估", weight: 15 },
    ]

    let totalProgress = 0
    const results: any[] = []

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, 1000)) // 模拟处理时间

      // 模拟评分结果
      const score = Math.floor(Math.random() * 30) + 70 // 70-100分
      const status = score >= 90 ? "excellent" : score >= 80 ? "good" : score >= 70 ? "average" : "poor"

      results.push({
        name: step.name,
        score,
        maxScore: 100,
        status,
        feedback: generateFeedback(step.name, score),
        weight: step.weight,
      })

      totalProgress += step.weight
      setGradingProgress(totalProgress)
    }

    // 计算最终分数
    const finalScore = Math.round(
      results.reduce((sum, result) => sum + (result.score * result.weight) / 100, 0) / results.length,
    )

    const finalResult = {
      finalScore,
      maxScore: 100,
      details: results,
      suggestions: generateSuggestions(results),
      timestamp: new Date().toISOString(),
    }

    setGradingResult(finalResult)
    setIsGrading(false)
    onGradingComplete(finalResult)
  }

  const generateFeedback = (stepName: string, score: number) => {
    const feedbacks: { [key: string]: { [key: string]: string } } = {
      代码语法检查: {
        excellent: "代码语法完全正确，无任何语法错误。",
        good: "代码语法基本正确，有少量小问题。",
        average: "代码语法存在一些问题，需要修正。",
        poor: "代码语法错误较多，需要仔细检查。",
      },
      功能完整性测试: {
        excellent: "所有功能都完美实现，测试用例全部通过。",
        good: "大部分功能实现良好，少数测试用例未通过。",
        average: "基本功能实现，但部分高级功能缺失。",
        poor: "核心功能实现不完整，多个测试用例失败。",
      },
      性能评估: {
        excellent: "程序运行效率很高，响应时间优秀。",
        good: "程序性能良好，响应时间在可接受范围内。",
        average: "程序性能一般，有优化空间。",
        poor: "程序性能较差，需要优化算法和代码结构。",
      },
      代码质量分析: {
        excellent: "代码结构清晰，命名规范，注释完整。",
        good: "代码质量良好，结构较为清晰。",
        average: "代码质量一般，部分地方需要改进。",
        poor: "代码质量较差，结构混乱，缺乏注释。",
      },
      创新性评估: {
        excellent: "项目具有很强的创新性，有独特的亮点。",
        good: "项目有一定创新性，实现了一些有趣的功能。",
        average: "项目创新性一般，基本按要求完成。",
        poor: "项目缺乏创新性，仅完成基本要求。",
      },
    }

    const status = score >= 90 ? "excellent" : score >= 80 ? "good" : score >= 70 ? "average" : "poor"
    return feedbacks[stepName]?.[status] || "评估完成。"
  }

  const generateSuggestions = (results: any[]) => {
    const suggestions = []

    results.forEach((result) => {
      if (result.score < 80) {
        switch (result.name) {
          case "代码语法检查":
            suggestions.push("建议使用IDE的语法检查功能，仔细检查代码语法错误。")
            break
          case "功能完整性测试":
            suggestions.push("建议重新审查需求文档，确保所有功能都已实现。")
            break
          case "性能评估":
            suggestions.push("建议优化算法复杂度，减少不必要的计算和内存使用。")
            break
          case "代码质量分析":
            suggestions.push("建议遵循编码规范，添加适当的注释，提高代码可读性。")
            break
          case "创新性评估":
            suggestions.push("建议思考如何在基本功能基础上添加创新特性。")
            break
        }
      }
    })

    if (suggestions.length === 0) {
      suggestions.push("整体表现优秀，继续保持！")
    }

    return suggestions
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "good":
        return <CheckCircle className="w-5 h-5 text-blue-500" />
      case "average":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case "poor":
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-100 text-green-800"
      case "good":
        return "bg-blue-100 text-blue-800"
      case "average":
        return "bg-yellow-100 text-yellow-800"
      case "poor":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="w-5 h-5 mr-2" />
          智能评分引擎
        </CardTitle>
        <CardDescription>基于多维度标准进行自动评分</CardDescription>
      </CardHeader>
      <CardContent>
        {!gradingResult && !isGrading && (
          <div className="text-center py-8">
            <Zap className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">准备开始自动评分</h3>
            <p className="text-gray-600 mb-4">系统将从多个维度对作业进行智能评估</p>
            <Button onClick={startAutoGrading} size="lg">
              <Zap className="w-4 h-4 mr-2" />
              开始自动评分
            </Button>
          </div>
        )}

        {isGrading && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">正在进行智能评分...</h3>
              <Progress value={gradingProgress} className="mb-4" />
              <p className="text-sm text-gray-600">评分进度: {gradingProgress}%</p>
            </div>
          </div>
        )}

        {gradingResult && (
          <Tabs defaultValue="result" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="result">评分结果</TabsTrigger>
              <TabsTrigger value="suggestions">改进建议</TabsTrigger>
            </TabsList>

            <TabsContent value="result" className="space-y-4">
              {/* 总分显示 */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2">最终得分</h3>
                    <div className="text-6xl font-bold text-blue-600 mb-2">{gradingResult.finalScore}</div>
                    <p className="text-gray-600">满分 {gradingResult.maxScore} 分</p>
                    <Progress value={(gradingResult.finalScore / gradingResult.maxScore) * 100} className="mt-4" />
                  </div>
                </CardContent>
              </Card>

              {/* 详细评分 */}
              <div className="space-y-3">
                <h4 className="font-semibold">详细评分</h4>
                {gradingResult.details.map((detail: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(detail.status)}
                          <span className="font-medium">{detail.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(detail.status)}>
                            {detail.score}/{detail.maxScore}
                          </Badge>
                          <span className="text-sm text-gray-500">权重: {detail.weight}%</span>
                        </div>
                      </div>
                      <Progress value={(detail.score / detail.maxScore) * 100} className="mb-2" />
                      <p className="text-sm text-gray-600">{detail.feedback}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    改进建议
                  </CardTitle>
                  <CardDescription>基于评分结果生成的个性化建议</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {gradingResult.suggestions.map((suggestion: string, index: number) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
