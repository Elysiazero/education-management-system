"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery, useMutation, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FlaskConical, ArrowLeft, Loader2, Sparkles, RefreshCw, Download, Save, Send, Upload, FileText, Trash, AlertCircle, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"

// 创建 QueryClient 实例
const queryClient = new QueryClient()

interface User {
    id: string
    name: string
    email: string
    role: "student" | "teacher" | "admin"
}

interface Task {
    id: string
    taskName: string
    experimentTitle: string
    experimentCategory: string
    requirements: string
    startTime: string
    endTime: string
    status: "未开始" | "进行中" | "已提交" | "已批改"
}

interface ExperimentData {
    id: string
    title: string
    category: string
    description: string
    parameters: {
        temperature: number
        concentration: number
        time: number
    }
    results: {
        reactionRate: number
        conversionRate: number
        productConcentration: number
        actualTime: number
    }
    observations: string[]
}

interface GeneratedReport {
    id: string
    title: string
    abstract: string
    introduction: string
    methodology: string
    results: string
    discussion: string
    conclusion: string
    references: string[]
    generatedAt: string
}

interface UploadedFile {
    id: string
    fileName: string
    fileURL: string
    resourceType: string
    description: string
}

interface ReportSubmission {
    taskId: string
    content: string
    generatedContent?: string
    attachments: UploadedFile[]
    isSubmitted: boolean
}

// API基础URL
const API_BASE_URL = "http://localhost:8080/api/v1/teaching"
const UPLOAD_BASE_URL = "http://localhost:8080"
const RESOURCE_BASE_URL = "http://localhost:8080"

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

// 获取任务信息
const fetchTask = async (taskId: string): Promise<Task> => {
    const token = getAuthToken()
    if (!token) throw new Error("用户未登录")

    const response = await fetch(`${API_BASE_URL}/experiment-tasks/${taskId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    if (!response.ok) throw new Error("获取任务信息失败")

    const responseData = await response.json()
    const data = responseData?.data

    return {
        id: String(data.id),
        taskName: data.taskName || "未命名任务",
        experimentTitle: data.experiment?.title || "未知实验",
        experimentCategory: data.experiment?.subject || "其它",
        requirements: data.taskRequirements || "",
        startTime: data.startTime || new Date().toISOString(),
        endTime: data.endTime || new Date().toISOString(),
        status: mapTaskStatus(data.status),
    }
}

// 获取实验数据
const fetchExperimentData = async (experimentId: string): Promise<ExperimentData> => {
    const token = getAuthToken()
    if (!token) throw new Error("用户未登录")

    const response = await fetch(`${API_BASE_URL}/experiments/${experimentId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    if (!response.ok) throw new Error("获取实验数据失败")

    const responseData = await response.json()
    const data = responseData?.data

    return {
        id: String(data.id),
        title: data.title || "未知实验",
        category: data.subject || "其它",
        description: data.description || "",
        parameters: {
            temperature: 25, // 这些可能需要从实验的自定义参数中获取
            concentration: 0.1,
            time: 10,
        },
        results: {
            reactionRate: 0.025,
            conversionRate: 78.5,
            productConcentration: 0.078,
            actualTime: 8.5,
        },
        observations: [
            "反应开始时溶液无明显变化",
            "随着反应进行，溶液温度略有上升",
            "加入指示剂后溶液颜色发生变化",
            "反应达到平衡点时颜色稳定",
        ],
    }
}

// 生成实验报告
const generateReport = async (experimentData: ExperimentData, customContent?: string): Promise<GeneratedReport> => {
    // 这里可以调用AI服务生成报告，目前使用模拟数据
    const mockReport: GeneratedReport = {
        id: `report_${Date.now()}`,
        title: `${experimentData.title} - 实验报告`,
        abstract: `本实验通过虚拟仿真的方式研究了${experimentData.title}的反应过程。实验在温度${experimentData.parameters.temperature}°C、浓度${experimentData.parameters.concentration} mol/L的条件下进行，观察并记录了反应的各项参数变化。结果表明，反应转化率达到${experimentData.results.conversionRate}%，符合理论预期。${customContent ? `\n\n补充内容：${customContent}` : ""}`,
        introduction: `${experimentData.description}。本实验旨在通过虚拟仿真技术，让学生深入理解化学反应的基本原理和规律，培养学生的实验操作能力和数据分析能力。`,
        methodology: `实验采用虚拟仿真平台进行。首先设置实验参数：温度${experimentData.parameters.temperature}°C，反应物浓度${experimentData.parameters.concentration} mol/L，预计反应时间${experimentData.parameters.time}分钟。然后启动虚拟实验，实时监测反应过程中的各项指标变化，包括反应速率、转化率、产物浓度等。`,
        results: `实验结果如下：\n1. 反应速率：${experimentData.results.reactionRate} mol/L·s\n2. 转化率：${experimentData.results.conversionRate}%\n3. 产物浓度：${experimentData.results.productConcentration} mol/L\n4. 实际反应时间：${experimentData.results.actualTime}分钟\n\n实验观察记录：\n${experimentData.observations.map((obs, index) => `${index + 1}. ${obs}`).join("\n")}`,
        discussion: `从实验结果可以看出，反应按照预期进行，转化率达到${experimentData.results.conversionRate}%，说明反应条件设置合理。实际反应时间${experimentData.results.actualTime}分钟略短于预计时间，这可能是由于虚拟环境中反应条件更加理想化。反应速率${experimentData.results.reactionRate} mol/L·s符合该类反应的一般规律。`,
        conclusion: `通过本次虚拟仿真实验，成功验证了${experimentData.title}的基本规律。实验数据准确可靠，达到了预期的教学目标。虚拟仿真技术为化学实验教学提供了安全、高效的新途径。`,
        references: [
            "《无机化学》第四版，大连理工大学无机化学教研室编",
            "《化学实验教学研究》，化学教育杂志社",
            "虚拟仿真实验教学平台用户手册",
        ],
        generatedAt: new Date().toISOString(),
    }

    return mockReport
}

// 上传文件
const uploadFile = async (file: File, userName: string, description: string): Promise<UploadedFile> => {
    const token = getAuthToken()
    if (!token) throw new Error("用户未登录")

    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", "REPORT_ATTACHMENT")

    const response = await fetch(`${RESOURCE_BASE_URL}/upload`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    })

    if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "文件上传失败")
    }

    const responseData = await response.json()
    const data = responseData?.data

    return {
        id: String(data.id),
        fileName: file.name,
        fileURL: data.fileUrl || data.url || "",
        resourceType: getFileType(file.name),
        description: description,
    }
}

// 获取文件类型
const getFileType = (fileName: string): string => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    switch (extension) {
        case "pdf":
            return "PDF"
        case "doc":
        case "docx":
            return "DOC"
        case "ppt":
        case "pptx":
            return "PPT"
        case "jpg":
        case "jpeg":
        case "png":
        case "gif":
            return "JPG"
        case "mp4":
        case "avi":
        case "mov":
            return "MP4"
        default:
            return "OTHER"
    }
}

// 获取报告草稿
const fetchReportDraft = async (taskId: string): Promise<ReportSubmission | null> => {
    const token = getAuthToken()
    if (!token) throw new Error("用户未登录")

    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/my-report`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        if (response.status === 404) {
            return null // 没有草稿
        }

        if (!response.ok) throw new Error("获取报告草稿失败")

        const responseData = await response.json()
        const data = responseData?.data

        return {
            taskId: taskId,
            content: data.manualContent || "",
            generatedContent: data.autoContent || "",
            attachments:
                data.attachments?.map((att: any) => ({
                    id: String(att.id),
                    fileName: att.resourceName || att.fileName,
                    fileURL: att.fileUrl || att.url,
                    resourceType: att.resourceType || att.type,
                    description: att.description || "",
                })) || [],
            isSubmitted: data.status === "SUBMITTED" || data.status === "GRADED",
        }
    } catch (error) {
        console.error("获取草稿失败:", error)
        return null
    }
}

// 保存报告草稿
const saveReportDraft = async (submission: ReportSubmission): Promise<void> => {
    const token = getAuthToken()
    if (!token) throw new Error("用户未登录")

    const response = await fetch(`${API_BASE_URL}/tasks/${submission.taskId}/my-report`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            manualContent: submission.content,
            autoContent: submission.generatedContent,
            isSubmitted: false,
            attachmentsRids: submission.attachments.map((att) => Number(att.id)),
        }),
    })

    if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "保存草稿失败")
    }
}

// 提交报告
const submitReport = async (submission: ReportSubmission): Promise<void> => {
    const token = getAuthToken()
    if (!token) throw new Error("用户未登录")

    const response = await fetch(`${API_BASE_URL}/tasks/${submission.taskId}/my-report`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            manualContent: submission.content,
            autoContent: submission.generatedContent,
            isSubmitted: true,
            attachmentsRids: submission.attachments.map((att) => Number(att.id)),
        }),
    })

    if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "提交报告失败")
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
export default function SubmitReportPageWrapper() {
    return (
        <QueryClientProvider client={queryClient}>
            <SubmitReportPage />
        </QueryClientProvider>
    )
}

function SubmitReportPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const taskId = searchParams.get("taskId")
    const experimentId = searchParams.get("experimentId") || "default"

    // 状态管理
    const [activeTab, setActiveTab] = useState("generate")
    const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null)
    const [editableReport, setEditableReport] = useState<GeneratedReport | null>(null)
    const [customContent, setCustomContent] = useState("")
    const [manualContent, setManualContent] = useState("")
    const [attachments, setAttachments] = useState<UploadedFile[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [isDraft, setIsDraft] = useState(true)
    const [showSuccess, setShowSuccess] = useState(false)
    const [uploadingFiles, setUploadingFiles] = useState<string[]>([])

    // 使用 React Query 获取数据
    const { data: user, isLoading: userLoading } = useQuery<User>({
        queryKey: ["user"],
        queryFn: fetchUser,
        staleTime: 1000 * 60 * 5,
    })

    const { data: task, isLoading: taskLoading } = useQuery<Task>({
        queryKey: ["task", taskId],
        queryFn: () => fetchTask(taskId!),
        enabled: !!taskId,
        staleTime: 1000 * 60 * 5,
    })

    const { data: experimentData, isLoading: experimentLoading } = useQuery<ExperimentData>({
        queryKey: ["experimentData", experimentId],
        queryFn: () => fetchExperimentData(experimentId),
        enabled: !!experimentId,
        staleTime: 1000 * 60 * 5,
    })

    const { data: draft, isLoading: draftLoading } = useQuery<ReportSubmission | null>({
        queryKey: ["reportDraft", taskId],
        queryFn: () => fetchReportDraft(taskId!),
        enabled: !!taskId,
        staleTime: 1000 * 60 * 5,
    })

    // 初始化数据
    useEffect(() => {
        if (draft) {
            setManualContent(draft.content)
            setAttachments(draft.attachments)
            setIsDraft(!draft.isSubmitted)
            if (draft.generatedContent) {
                // 如果有生成的内容，解析并设置到编辑器中
                try {
                    const parsed = JSON.parse(draft.generatedContent)
                    setGeneratedReport(parsed)
                    setEditableReport({ ...parsed })
                    setActiveTab("edit") // 如果已有生成的报告，直接跳到编辑页面
                } catch (error) {
                    console.error("解析生成内容失败:", error)
                }
            }
        }
    }, [draft])

    // 生成报告的mutation
    const generateReportMutation = useMutation({
        mutationFn: ({ experimentData, customContent }: { experimentData: ExperimentData; customContent?: string }) =>
            generateReport(experimentData, customContent),
        onSuccess: (report) => {
            setGeneratedReport(report)
            setEditableReport({ ...report })
            setIsGenerating(false)
            setActiveTab("edit")
        },
        onError: (error) => {
            console.error("生成报告失败:", error)
            setIsGenerating(false)
        },
    })

    // 上传文件的mutation
    const uploadFileMutation = useMutation({
        mutationFn: ({ file, userName, description }: { file: File; userName: string; description: string }) =>
            uploadFile(file, userName, description),
        onSuccess: (uploadedFile, variables) => {
            setAttachments((prev) => [...prev, uploadedFile])
            setUploadingFiles((prev) => prev.filter((name) => name !== variables.file.name))
        },
        onError: (error, variables) => {
            console.error("文件上传失败:", error)
            setUploadingFiles((prev) => prev.filter((name) => name !== variables.file.name))
            alert(`文件 ${variables.file.name} 上传失败`)
        },
    })

    // 保存草稿的mutation
    const saveDraftMutation = useMutation({
        mutationFn: (submission: ReportSubmission) => saveReportDraft(submission),
        onSuccess: () => {
            setShowSuccess(true)
            setTimeout(() => setShowSuccess(false), 3000)
        },
        onError: (error) => {
            console.error("保存草稿失败:", error)
            alert("保存草稿失败，请重试")
        },
    })

    // 提交报告的mutation
    const submitReportMutation = useMutation({
        mutationFn: (submission: ReportSubmission) => submitReport(submission),
        onSuccess: () => {
            setIsDraft(false)
            alert("报告提交成功！")
            router.push("/virtual-lab")
        },
        onError: (error) => {
            console.error("提交报告失败:", error)
            alert("提交报告失败，请重试")
        },
    })

    // 处理生成报告
    const handleGenerateReport = () => {
        if (!experimentData) return

        setIsGenerating(true)
        generateReportMutation.mutate({ experimentData, customContent })
    }

    // 处理重新生成
    const handleRegenerateReport = () => {
        if (!experimentData) return

        setIsGenerating(true)
        generateReportMutation.mutate({ experimentData, customContent })
    }

    // 处理文件上传
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !user) return

        const files = Array.from(e.target.files)
        files.forEach((file) => {
            if (file.size > 10 * 1024 * 1024) {
                alert(`文件 ${file.name} 超过10MB限制`)
                return
            }

            setUploadingFiles((prev) => [...prev, file.name])
            uploadFileMutation.mutate({
                file,
                userName: user.name,
                description: `实验报告附件 - ${file.name}`,
            })
        })

        // 清空input
        e.target.value = ""
    }

    // 移除附件
    const removeAttachment = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index))
    }

    // 处理编辑报告内容
    const handleEditReport = (field: keyof GeneratedReport, value: string | string[]) => {
        if (!editableReport) return
        setEditableReport({
            ...editableReport,
            [field]: value,
        })
    }

    // 处理保存草稿
    const handleSaveDraft = () => {
        if (!taskId) return

        const submission: ReportSubmission = {
            taskId,
            content: manualContent,
            generatedContent: editableReport ? JSON.stringify(editableReport) : undefined,
            attachments,
            isSubmitted: false,
        }

        saveDraftMutation.mutate(submission)
    }

    // 处理提交报告
    const handleSubmitReport = () => {
        if (!taskId) return

        // 组合最终的报告内容
        let finalContent = manualContent

        if (editableReport) {
            const generatedContent = `
# ${editableReport.title}

## 摘要
${editableReport.abstract}

## 引言
${editableReport.introduction}

## 实验方法
${editableReport.methodology}

## 实验结果
${editableReport.results}

## 讨论
${editableReport.discussion}

## 结论
${editableReport.conclusion}

## 参考文献
${editableReport.references.map((ref, index) => `${index + 1}. ${ref}`).join("\n")}
`
            finalContent = generatedContent + (manualContent ? `\n\n## 补充内容\n${manualContent}` : "")
        }

        if (!finalContent.trim()) {
            alert("请填写报告内容或生成报告")
            return
        }

        if (window.confirm("确定要提交报告吗？提交后将无法修改。")) {
            const submission: ReportSubmission = {
                taskId,
                content: finalContent,
                generatedContent: editableReport ? JSON.stringify(editableReport) : undefined,
                attachments,
                isSubmitted: true,
            }

            submitReportMutation.mutate(submission)
        }
    }

    // 处理导出报告
    const handleExportReport = () => {
        if (!editableReport) return

        const reportContent = `
# ${editableReport.title}

## 摘要
${editableReport.abstract}

## 引言
${editableReport.introduction}

## 实验方法
${editableReport.methodology}

## 实验结果
${editableReport.results}

## 讨论
${editableReport.discussion}

## 结论
${editableReport.conclusion}

## 参考文献
${editableReport.references.map((ref, index) => `${index + 1}. ${ref}`).join("\n")}

${manualContent ? `\n## 补充内容\n${manualContent}` : ""}

---
生成时间: ${new Date(editableReport.generatedAt).toLocaleString()}
`

        const blob = new Blob([reportContent], { type: "text/markdown" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${editableReport.title}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    // 计算截止时间剩余天数
    const getDaysRemaining = () => {
        if (!task) return 0
        const endDate = new Date(task.endTime)
        const now = new Date()
        const diffTime = endDate.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return Math.max(0, diffDays)
    }

    // 加载中状态
    if (userLoading || taskLoading || experimentLoading || draftLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
                        <div className="space-y-4">
                            <div className="h-32 bg-gray-200 rounded"></div>
                            <div className="h-64 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!user || !task || !experimentData || !taskId) {
        return <div className="min-h-screen flex items-center justify-center">加载中...</div>
    }

    const daysRemaining = getDaysRemaining()
    const isOverdue = daysRemaining === 0

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* 页面头部 */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            返回
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">实验报告</h1>
                            <p className="text-gray-600">生成、编辑并提交您的实验报告</p>
                        </div>
                    </div>
                    {showSuccess && (
                        <Alert className="w-auto">
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>草稿保存成功</AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* 任务信息卡片 */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="flex items-center">
                                    <FlaskConical className="w-5 h-5 mr-2" />
                                    {task.taskName}
                                </CardTitle>
                                <CardDescription className="mt-2">
                                    实验: {task.experimentTitle} | 学科: {task.experimentCategory}
                                </CardDescription>
                            </div>
                            <div className="text-right">
                                <Badge variant={isOverdue ? "destructive" : daysRemaining <= 3 ? "secondary" : "default"}>
                                    {isOverdue ? "已截止" : `剩余 ${daysRemaining} 天`}
                                </Badge>
                                <p className="text-sm text-gray-500 mt-1">截止: {new Date(task.endTime).toLocaleString()}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div>
                            <h4 className="font-medium mb-2">任务要求:</h4>
                            <div className="bg-gray-50 p-3 rounded-md">
                                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{task.requirements}</pre>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 截止时间警告 */}
                {(isOverdue || daysRemaining <= 3) && (
                    <Alert className={`mb-6 ${isOverdue ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"}`}>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {isOverdue ? "任务已截止，请尽快联系老师" : `任务即将截止，请抓紧时间完成报告`}
                        </AlertDescription>
                    </Alert>
                )}

                {/* 主要内容区域 */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="generate">
                            <Sparkles className="w-4 h-4 mr-2" />
                            生成报告
                        </TabsTrigger>
                        <TabsTrigger value="edit" disabled={!generatedReport}>
                            <FileText className="w-4 h-4 mr-2" />
                            编辑报告
                        </TabsTrigger>
                        <TabsTrigger value="submit">
                            <Send className="w-4 h-4 mr-2" />
                            提交报告
                        </TabsTrigger>
                    </TabsList>

                    {/* 生成报告标签页 */}
                    <TabsContent value="generate">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* 实验信息 */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>实验信息</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="font-medium text-gray-900">{experimentData.title}</h3>
                                            <p className="text-sm text-gray-600">{experimentData.description}</p>
                                            <Badge variant="outline" className="mt-2">
                                                {experimentData.category}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">温度:</span>
                                                <span className="font-medium">{experimentData.parameters.temperature}°C</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">浓度:</span>
                                                <span className="font-medium">{experimentData.parameters.concentration} mol/L</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">转化率:</span>
                                                <span className="font-medium">{experimentData.results.conversionRate}%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">反应速率:</span>
                                                <span className="font-medium">{experimentData.results.reactionRate} mol/L·s</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 生成设置 */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>生成设置</CardTitle>
                                    <CardDescription>系统将基于您的实验数据自动生成专业的实验报告</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="customContent">自定义内容 (可选)</Label>
                                        <Textarea
                                            id="customContent"
                                            value={customContent}
                                            onChange={(e) => setCustomContent(e.target.value)}
                                            placeholder="请输入您想要添加到报告中的自定义内容，如特殊观察、个人见解等..."
                                            className="min-h-[120px] mt-2"
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <Button onClick={handleGenerateReport} disabled={isGenerating} className="flex-1">
                                            {isGenerating ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    生成中...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-4 h-4 mr-2" />
                                                    生成报告
                                                </>
                                            )}
                                        </Button>
                                        {generatedReport && (
                                            <Button variant="outline" onClick={handleRegenerateReport} disabled={isGenerating}>
                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                重新生成
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* 生成结果预览 */}
                        {generatedReport && (
                            <Card className="mt-6">
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle>生成结果预览</CardTitle>
                                        <div className="flex gap-2">
                                            <Button variant="outline" onClick={handleExportReport}>
                                                <Download className="w-4 h-4 mr-2" />
                                                导出
                                            </Button>
                                            <Button onClick={() => setActiveTab("edit")}>
                                                <FileText className="w-4 h-4 mr-2" />
                                                编辑报告
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="prose max-w-none">
                                        <h1>{generatedReport.title}</h1>
                                        <h2>摘要</h2>
                                        <p>{generatedReport.abstract}</p>
                                        <h2>引言</h2>
                                        <p>{generatedReport.introduction}</p>
                                        <h2>实验方法</h2>
                                        <p style={{ whiteSpace: "pre-line" }}>{generatedReport.methodology}</p>
                                        <h2>实验结果</h2>
                                        <p style={{ whiteSpace: "pre-line" }}>{generatedReport.results}</p>
                                        <h2>讨论</h2>
                                        <p>{generatedReport.discussion}</p>
                                        <h2>结论</h2>
                                        <p>{generatedReport.conclusion}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* 编辑报告标签页 */}
                    <TabsContent value="edit">
                        {editableReport && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>编辑报告内容</CardTitle>
                                    <CardDescription>您可以编辑以下内容来完善您的实验报告</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* 标题 */}
                                    <div>
                                        <Label htmlFor="title">报告标题</Label>
                                        <Input
                                            id="title"
                                            value={editableReport.title}
                                            onChange={(e) => handleEditReport("title", e.target.value)}
                                            className="mt-2"
                                        />
                                    </div>

                                    {/* 摘要 */}
                                    <div>
                                        <Label htmlFor="abstract">摘要</Label>
                                        <Textarea
                                            id="abstract"
                                            value={editableReport.abstract}
                                            onChange={(e) => handleEditReport("abstract", e.target.value)}
                                            className="mt-2 min-h-[100px]"
                                        />
                                    </div>

                                    {/* 引言 */}
                                    <div>
                                        <Label htmlFor="introduction">引言</Label>
                                        <Textarea
                                            id="introduction"
                                            value={editableReport.introduction}
                                            onChange={(e) => handleEditReport("introduction", e.target.value)}
                                            className="mt-2 min-h-[120px]"
                                        />
                                    </div>

                                    {/* 实验方法 */}
                                    <div>
                                        <Label htmlFor="methodology">实验方法</Label>
                                        <Textarea
                                            id="methodology"
                                            value={editableReport.methodology}
                                            onChange={(e) => handleEditReport("methodology", e.target.value)}
                                            className="mt-2 min-h-[120px]"
                                        />
                                    </div>

                                    {/* 实验结果 */}
                                    <div>
                                        <Label htmlFor="results">实验结果</Label>
                                        <Textarea
                                            id="results"
                                            value={editableReport.results}
                                            onChange={(e) => handleEditReport("results", e.target.value)}
                                            className="mt-2 min-h-[150px]"
                                        />
                                    </div>

                                    {/* 讨论 */}
                                    <div>
                                        <Label htmlFor="discussion">讨论</Label>
                                        <Textarea
                                            id="discussion"
                                            value={editableReport.discussion}
                                            onChange={(e) => handleEditReport("discussion", e.target.value)}
                                            className="mt-2 min-h-[120px]"
                                        />
                                    </div>

                                    {/* 结论 */}
                                    <div>
                                        <Label htmlFor="conclusion">结论</Label>
                                        <Textarea
                                            id="conclusion"
                                            value={editableReport.conclusion}
                                            onChange={(e) => handleEditReport("conclusion", e.target.value)}
                                            className="mt-2 min-h-[100px]"
                                        />
                                    </div>

                                    {/* 参考文献 */}
                                    <div>
                                        <Label htmlFor="references">参考文献</Label>
                                        <Textarea
                                            id="references"
                                            value={editableReport.references.join("\n")}
                                            onChange={(e) => handleEditReport("references", e.target.value.split("\n"))}
                                            className="mt-2 min-h-[80px]"
                                            placeholder="每行一个参考文献"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={handleExportReport}>
                                            <Download className="w-4 h-4 mr-2" />
                                            导出报告
                                        </Button>
                                        <Button onClick={() => setActiveTab("submit")}>
                                            <Send className="w-4 h-4 mr-2" />
                                            前往提交
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* 提交报告标签页 */}
                    <TabsContent value="submit">
                        <div className="space-y-6">
                            {/* 补充内容 */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>补充内容</CardTitle>
                                    <CardDescription>您可以在此添加额外的内容来补充生成的报告</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        value={manualContent}
                                        onChange={(e) => setManualContent(e.target.value)}
                                        placeholder="请输入您想要补充的内容，如个人心得、额外观察等..."
                                        className="min-h-[200px]"
                                        disabled={!isDraft}
                                    />
                                    <div className="flex justify-between mt-2">
                                        <span className="text-sm text-gray-500">已输入 {manualContent.length} 字符</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 附件上传 */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>附件上传</CardTitle>
                                    <CardDescription>上传相关的文件作为报告附件</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isDraft && (
                                        <div className="mb-4">
                                            <input
                                                type="file"
                                                id="attachment-upload"
                                                multiple
                                                onChange={handleFileUpload}
                                                className="hidden"
                                                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.ppt,.pptx"
                                            />
                                            <label
                                                htmlFor="attachment-upload"
                                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                                            >
                                                <Upload className="w-4 h-4 mr-2" />
                                                选择文件
                                            </label>
                                            <span className="ml-3 text-sm text-gray-500">
                        支持 PDF、Word、图片、PPT 等格式，单个文件不超过 10MB
                      </span>
                                        </div>
                                    )}

                                    {/* 上传中的文件 */}
                                    {uploadingFiles.length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium mb-2">上传中:</h4>
                                            {uploadingFiles.map((fileName) => (
                                                <div key={fileName} className="flex items-center bg-blue-50 p-3 rounded-md mb-2">
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-500" />
                                                    <span className="text-sm">{fileName}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* 已上传的附件 */}
                                    {attachments.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">已上传的附件:</h4>
                                            <div className="space-y-2">
                                                {attachments.map((file, index) => (
                                                    <div key={file.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                                                        <div className="flex items-center">
                                                            <FileText className="w-4 h-4 mr-2 text-gray-500" />
                                                            <div>
                                                                <span className="text-sm font-medium">{file.fileName}</span>
                                                                <p className="text-xs text-gray-500">{file.description}</p>
                                                            </div>
                                                        </div>
                                                        {isDraft && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeAttachment(index)}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <Trash className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* 提交区域 */}
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm text-gray-600">
                                                {isDraft ? "报告尚未提交，您可以继续编辑" : "报告已提交，等待老师批改"}
                                            </p>
                                            {!generatedReport && !manualContent.trim() && isDraft && (
                                                <p className="text-sm text-yellow-600 mt-1">请先生成报告或填写补充内容</p>
                                            )}
                                        </div>
                                        <div className="flex space-x-3">
                                            {isDraft ? (
                                                <>
                                                    <Button variant="outline" onClick={handleSaveDraft} disabled={saveDraftMutation.isPending}>
                                                        <Save className="w-4 h-4 mr-2" />
                                                        保存草稿
                                                    </Button>
                                                    <Button onClick={handleSubmitReport} disabled={submitReportMutation.isPending || isOverdue}>
                                                        <Send className="w-4 h-4 mr-2" />
                                                        {submitReportMutation.isPending ? "提交中..." : "提交报告"}
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button variant="outline" onClick={() => router.push("/virtual-lab")}>
                                                    返回实验平台
                                                </Button>
                                            )}
                                        </div>
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
