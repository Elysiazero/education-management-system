"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { FlaskConical, Clock, Star, Microscope, Atom, Beaker, User, Paperclip, Trash, ArrowLeft, Download, Award, MessageSquareQuote, Save, Info } from "lucide-react"

// =================================================================
// 1. 类型定义 (Type Definitions)
// =================================================================

type TaskStatus = "未开始" | "进行中" | "已提交" | "已批阅" | "已截止";

interface UserType {
  id: string
  name: string
  role: "student" | "teacher" | "admin"
}

interface Experiment {
  id: string
  title: string
  description: string
  category: string
  difficulty: number
  duration: number
  thumbnail: string
  creator: string
  simulationUrl?: string
}

interface Assignment {
  id: string
  taskName: string
  experimentId: string
  experimentTitle: string
  endTime: string
  status: TaskStatus
  grade?: number
  requirements: string;
}

interface Report {
  id: string
  studentId: string
  studentName: string
  submittedAt: string
  content: string
  autoContent?: string
  grade?: number
  feedback?: string
  status: TaskStatus
  attachments?: Attachment[]
}

interface Attachment {
  id: string
  name: string
  url: string
  type: string
}

interface StudentDashboardProps {
  user: UserType;
}

// =================================================================
// 2. API 请求函数 (API Request Functions)
// =================================================================
const API_BASE_URL = "http://localhost:8080/api/v1/teaching"
const RESOURCE_BASE_URL = "http://localhost:8080"

const getAuthToken = () => {
  return typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
}

const normalizeExperiment = (record: any): Experiment => ({
  id: String(record.id),
  title: record.title || "无标题实验",
  category: record.subject || "其它",
  description: record.description || "暂无详细描述。",
  difficulty: record.difficulty || 1,
  duration: record.duration || 30,
  thumbnail: record.thumbnailUrl || "",
  creator: record.creator?.realName || "系统",
  simulationUrl: record.simulationUrl || "",
})

const normalizeAssignment = (task: any): Assignment => ({
  id: String(task.id),
  taskName: task.taskName || "未命名任务",
  experimentId: String(task.experiment?.id || ""),
  experimentTitle: task.experiment?.title || "未知实验",
  endTime: task.endTime || new Date().toISOString(),
  status: task.status || "未开始",
  grade: task.grade,
  requirements: task.taskRequirements || "无特定要求。",
})

const fetchExperiments = async (page = 0, size = 10): Promise<{ experiments: Experiment[]; totalPages: number }> => {
  const token = getAuthToken()
  if (!token) throw new Error("用户未登录")
  const response = await fetch(`${API_BASE_URL}/experiments?page=${page}&size=${size}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error("获取实验列表失败")
  const responseData = await response.json()
  const data = responseData?.data || {}
  return {
    experiments: (data.content || data.records || []).map(normalizeExperiment),
    totalPages: data.totalPages || 0,
  }
}

const fetchMyTasks = async (): Promise<Assignment[]> => {
  const token = getAuthToken()
  if (!token) throw new Error("用户未登录")
  const response = await fetch(`${API_BASE_URL}/experiment-tasks/my-tasks`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error("获取我的任务列表失败")
  const responseData = await response.json()
  const tasks = responseData?.data?.content || responseData?.data?.records || []
  return Array.isArray(tasks) ? tasks.map(normalizeAssignment) : []
}

const getExperimentById = async (id: string): Promise<Experiment> => {
  const token = getAuthToken()
  if (!token) throw new Error("用户未登录")
  const response = await fetch(`${API_BASE_URL}/experiments/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error("获取实验详情失败")
  const responseData = await response.json()
  if (!responseData.data) throw new Error(`无法找到ID为 ${id} 的实验`)
  return normalizeExperiment(responseData.data)
}

const startExperimentTask = async (taskId: string): Promise<string> => {
  const token = getAuthToken();
  if (!token) throw new Error("用户未登录");
  const response = await fetch(`${API_BASE_URL}/experiment-tasks/${taskId}/start`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "启动实验失败");
  }
  const data = await response.json();
  return data.data.sessionId;
};

const mapReportBEStatus = (status: string): TaskStatus => {
  switch (status?.toUpperCase()) {
    case "DRAFT": return "进行中";
    case "SUBMITTED": return "已提交";
    case "GRADED": return "已批阅";
    default: return "进行中";
  }
};

const formatAutoContentToHtml = (autoContent: any): string => {
  if (!autoContent || typeof autoContent !== 'object') {
    return autoContent || "";
  }
  let html = `<h4>${autoContent.reportTitle || '实验总结'}</h4>`;
  html += `<p>${autoContent.summary || ''}</p>`;
  if (autoContent.keyDataPoints) {
    html += '<h5>关键数据点:</h5><ul>';
    for (const key in autoContent.keyDataPoints) {
      const value = autoContent.keyDataPoints[key];
      if (typeof value === 'object' && value !== null) {
        html += `<li><strong>${key}:</strong><ul>`;
        for (const subKey in value) {
          html += `<li>${subKey}: ${value[subKey]}</li>`;
        }
        html += '</ul></li>';
      } else {
        html += `<li><strong>${key}:</strong> ${value}</li>`;
      }
    }
    html += '</ul>';
  }
  if (autoContent.actionTimeline && autoContent.actionTimeline.length > 0) {
    html += '<h5>操作时间线:</h5><ol>';
    autoContent.actionTimeline.forEach((item: any) => {
      html += `<li>[${new Date(item.time).toLocaleString()}] ${item.action}</li>`;
    });
    html += '</ol>';
  }
  return html;
};

const getMyReport = async (taskId: string): Promise<Report> => {
  const token = getAuthToken();
  if (!token) throw new Error("用户未登录");
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/my-report`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 404) {
    return {
      id: '',
      studentId: '',
      studentName: '',
      submittedAt: '',
      content: '',
      autoContent: '<h4>自动报告尚未生成</h4><p>请先进行实验操作以生成自动报告内容。</p>',
      status: '进行中',
      attachments: [],
    };
  }
  if (!response.ok) throw new Error("获取实验报告失败");
  const responseData = await response.json();
  const data = responseData.data;
  return {
    id: String(data.id),
    studentId: String(data.student?.id),
    studentName: data.student?.realName || '未知学生',
    submittedAt: data.submitTime,
    content: data.manualContent || "",
    autoContent: formatAutoContentToHtml(data.autoContent),
    grade: data.grade,
    feedback: data.feedback,
    status: mapReportBEStatus(data.status),
    attachments: data.attachments?.map((att: any) => ({
      id: String(att.id),
      name: att.fileName || '未知文件',
      url: att.fileUrl || '#',
      type: att.resourceType || 'FILE'
    })) || [],
  };
};

const submitReport = async (taskId: string, reportData: { content: string }, attachments: File[], isSubmitted: boolean): Promise<Report> => {
  const token = getAuthToken();
  if (!token) throw new Error("用户未登录");
  const attachmentsRids = await Promise.all(attachments.map(async file => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "REPORT_ATTACHMENT");
    const res = await fetch(`${RESOURCE_BASE_URL}/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
    if (!res.ok) throw new Error(`上传附件 ${file.name} 失败`);
    return (await res.json()).data.id;
  }));
  const reportResponse = await fetch(`${API_BASE_URL}/tasks/${taskId}/my-report`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      manualContent: reportData.content,
      isSubmitted: isSubmitted,
      attachmentsRids: attachmentsRids
    }),
  });
  if (!reportResponse.ok) {
    const errorData = await reportResponse.json().catch(() => ({ message: '提交报告时发生未知错误' }));
    throw new Error(errorData.message || "提交报告失败");
  }
  return (await reportResponse.json()).data;
};


// =================================================================
// 3. 学生仪表盘组件 (Student Dashboard Component)
// =================================================================
export default function StudentDashboard({ user }: StudentDashboardProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  // 状态管理
  const [currentPage, setCurrentPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [viewingTask, setViewingTask] = useState<Assignment | null>(null);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null)
  const [selectedTask, setSelectedTask] = useState<Assignment | null>(null)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [reportContent, setReportContent] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])

  // 数据获取 (React Query)
  const { data: experimentsData, isLoading: experimentsLoading } = useQuery({
    queryKey: ["experiments", currentPage],
    queryFn: () => fetchExperiments(currentPage, 9),
    placeholderData: { experiments: [], totalPages: 0 },
  })

  const { data: studentTasks = [], isLoading: studentTasksLoading } = useQuery<Assignment[]>({
    queryKey: ["studentTasks", user.id],
    queryFn: fetchMyTasks,
  })

  const { data: viewingTaskExperiment, isLoading: viewingTaskExperimentLoading } = useQuery({
    queryKey: ['experimentDetailsForTask', viewingTask?.experimentId],
    queryFn: () => getExperimentById(viewingTask!.experimentId),
    enabled: !!viewingTask,
  });

  const { data: currentReport, isLoading: reportLoading } = useQuery({
    queryKey: ['myReport', viewingTask?.id],
    queryFn: () => getMyReport(viewingTask!.id),
    enabled: !!viewingTask && isReportDialogOpen,
  });

  useEffect(() => {
    if (currentReport) {
      setReportContent(currentReport.content);
      setAttachments([]);
    }
  }, [currentReport]);


  // 数据变更 (React Query Mutations)
  const startExperimentMutation = useMutation({
    mutationFn: startExperimentTask,
    onSuccess: (sessionId) => {
      router.push(`/virtual-lab/simulation/${sessionId}`);
    },
    onError: (error: Error) => alert(`启动实验失败: ${error.message}`),
  })

  const submitReportMutation = useMutation({
    mutationFn: ({ taskId, reportData, attachments }: { taskId: string; reportData: { content: string }; attachments: File[] }) =>
      submitReport(taskId, reportData, attachments, true),
    onSuccess: () => {
      alert("报告提交成功！");
      setIsReportDialogOpen(false);
      setAttachments([]);
      queryClient.invalidateQueries({ queryKey: ['studentTasks'] });
      queryClient.invalidateQueries({ queryKey: ['myReport', viewingTask?.id] });
    },
    onError: (error: Error) => alert(`提交失败: ${error.message}`),
  });

  const saveDraftMutation = useMutation({
    mutationFn: ({ taskId, reportData, attachments }: { taskId: string; reportData: { content: string }; attachments: File[] }) =>
      submitReport(taskId, reportData, attachments, false),
    onSuccess: () => {
      alert("草稿保存成功！");
      queryClient.invalidateQueries({ queryKey: ['myReport', viewingTask?.id] });
    },
    onError: (error: Error) => alert(`保存草稿失败: ${error.message}`),
  });

  // 派生状态 (Memoized Filtering)
  const filteredExperiments = useMemo(() => {
    let experiments = experimentsData?.experiments || []
    if (searchTerm) {
      experiments = experiments.filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase()))
    }
    if (categoryFilter !== "all") {
      experiments = experiments.filter(e => e.category === categoryFilter)
    }
    if (difficultyFilter !== "all") {
      experiments = experiments.filter(e => e.difficulty === parseInt(difficultyFilter))
    }
    return experiments
  }, [experimentsData, searchTerm, categoryFilter, difficultyFilter])

  // 事件处理器
  // 已修改: 简化了 setSelectedTask 的逻辑
  const handleSelectExperiment = async (experiment: Experiment, task?: Assignment) => {
    setSelectedExperiment(null);
    setSelectedTask(task || null); // 如果没有 task 传入，则 selectedTask 为 null
    try {
      const detailedData = await getExperimentById(experiment.id);
      setSelectedExperiment(detailedData);
      setViewingTask(null);
    } catch (error) {
      alert("获取实验详情失败");
      console.error(error);
    }
  }

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReport = () => {
    if (!viewingTask) return;
    submitReportMutation.mutate({ taskId: viewingTask.id, reportData: { content: reportContent }, attachments });
  }

  const handleSaveDraft = () => {
    if (!viewingTask) return;
    saveDraftMutation.mutate({ taskId: viewingTask.id, reportData: { content: reportContent }, attachments });
  }

  // 渲染辅助函数
  const getCategoryIcon = (category: string, sizeClass = "w-5 h-5") => {
    const className = `inline-block ${sizeClass}`;
    switch (category) {
      case "化学": return <Beaker className={className} />;
      case "物理": return <Atom className={className} />;
      case "生物": return <Microscope className={className} />;
      default: return <FlaskConical className={className} />;
    }
  }

  const getStatusBadgeVariant = (status: TaskStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "已提交": return "default";
      case "已批阅": return "outline";
      case "已截止": return "destructive";
      case "进行中": return "secondary";
      case "未开始": return "secondary";
      default: return "secondary";
    }
  };

  const renderStarRating = (difficulty: number) => (
    <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < difficulty ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />)}</div>
  )

  // 加载状态 UI
  if (experimentsLoading || studentTasksLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-80" />
            </div>
          </div>
          <Card className="mb-6"><CardContent className="pt-6"><Skeleton className="h-10" /></CardContent></Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-40 rounded-t-lg" />
                <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                <CardContent><Skeleton className="h-10 w-full" /></CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 视图 B: 任务详情视图
  if (viewingTask) {
    const isActionDisabled = viewingTask.status === '已提交' || viewingTask.status === '已批阅' || viewingTask.status === '已截止';

    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => setViewingTask(null)} className="mb-6 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回任务列表
          </Button>
          {viewingTaskExperimentLoading ? (
            <Card><CardContent className="p-6"><Skeleton className="h-96" /></CardContent></Card>
          ) : viewingTaskExperiment ? (
            <Card className="overflow-hidden">
              <CardHeader className="bg-gray-100 p-6">
                <Badge variant={getStatusBadgeVariant(viewingTask.status)} className="w-fit mb-2 text-base px-3 py-1">{viewingTask.status}</Badge>
                <CardTitle className="text-2xl mt-2">{viewingTask.taskName}</CardTitle>
                <CardDescription>实验项目: {viewingTask.experimentTitle}</CardDescription>
              </CardHeader>
              <CardContent className="p-6 grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">实验介绍</h3>
                    <p className="text-gray-600 leading-relaxed">{viewingTaskExperiment.description}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">操作</h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        size="lg"
                        className="w-full sm:w-auto"
                        onClick={() => handleSelectExperiment(viewingTaskExperiment, viewingTask)}
                        disabled={isActionDisabled}
                        title={isActionDisabled ? `任务已${viewingTask.status}，无法操作` : ''}
                      >
                        {viewingTask.status === '进行中' ? '继续实验' : '开始实验'}
                      </Button>
                      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="lg" variant="outline" className="w-full sm:w-auto" disabled={viewingTask.status === '已截止'}>
                            {isActionDisabled ? '查看报告' : '提交/编辑报告'}
                          </Button>
                        </DialogTrigger>
                        {/* 报告弹窗内容在下方定义 */}
                      </Dialog>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 md:border-l md:pl-6">
                  <h3 className="font-semibold text-lg">任务信息</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span>截止日期:</span>
                      <strong className={new Date(viewingTask.endTime) < new Date() && !isActionDisabled ? 'text-red-500' : ''}>
                        {new Date(viewingTask.endTime).toLocaleString()}
                      </strong>
                    </div>
                    {viewingTask.status === '已批阅' && (
                      <div className="flex justify-between items-center">
                        <span>成绩:</span>
                        <strong className="text-xl text-purple-600">{viewingTask.grade} / 100</strong>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg pt-4 border-t">实验详情</h3>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">{getCategoryIcon(viewingTaskExperiment.category, "w-4 h-4")}<span>{viewingTaskExperiment.category}</span></div>
                    <div className="flex items-center gap-2"><User className="w-4 h-4" /><span>创建者: {viewingTaskExperiment.creator}</span></div>
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4" /><span>预计 {viewingTaskExperiment.duration} 分钟</span></div>
                    <div className="flex items-center gap-2"><span>难度:</span>{renderStarRating(viewingTaskExperiment.difficulty)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="text-center text-red-500">无法加载实验详情。</p>
          )}
        </div>

        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>实验报告: {viewingTask?.experimentTitle}</DialogTitle>
              <DialogDescription>
                {isActionDisabled ? "您正在查看已提交的报告。" : "请在此处填写并提交您的实验报告。"}
              </DialogDescription>
            </DialogHeader>
            {reportLoading ? <Skeleton className="h-64 w-full" /> : (
              <>
                <div className="grid gap-6 py-4 max-h-[60vh] overflow-y-auto pr-4">

                  {currentReport?.status === '已批阅' && (
                    <Card className="bg-purple-50 border-purple-200">
                      <CardHeader>
                        <CardTitle className="text-lg text-purple-800">教师评阅</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Award className="w-8 h-8 text-purple-600" />
                          <div>
                            <Label className="text-purple-700">最终得分</Label>
                            <p className="text-2xl font-bold text-purple-900">{currentReport.grade ?? 'N/A'} / 100</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <MessageSquareQuote className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                          <div>
                            <Label className="text-purple-700">教师评语</Label>
                            <p className="text-purple-800 leading-relaxed">{currentReport.feedback || '教师未填写评语。'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {currentReport?.autoContent && (
                    <div className="space-y-2">
                      <Label>自动生成内容 (仅供参考)</Label>
                      <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm max-h-40 overflow-y-auto prose" dangerouslySetInnerHTML={{ __html: currentReport.autoContent }} />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="reportContent">你的报告内容</Label>
                    <Textarea id="reportContent" value={reportContent} onChange={(e) => setReportContent(e.target.value)} className="min-h-[200px]" readOnly={isActionDisabled} />
                  </div>
                  <div className="space-y-2">
                    <Label>附件</Label>
                    {currentReport?.attachments && currentReport.attachments.length > 0 && (
                      <div className="space-y-2">
                        {currentReport.attachments.map(att => (
                          <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-gray-100 p-2 rounded text-sm hover:bg-gray-200 transition-colors">
                            <div className="flex items-center gap-2">
                              <Paperclip className="h-4 w-4 text-gray-600" />
                              <span className="truncate">{att.name}</span>
                            </div>
                            <Download className="h-4 w-4 text-blue-600" />
                          </a>
                        ))}
                      </div>
                    )}
                    {!isActionDisabled && (
                      <>
                        <Input id="attachment-upload" type="file" multiple onChange={handleAttachmentUpload} className="hidden" />
                        <label htmlFor="attachment-upload" className="cursor-pointer mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50">
                          <Paperclip className="w-4 h-4 mr-2" /> 添加文件
                        </label>
                        <div className="mt-2 space-y-1">
                          {attachments.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-blue-50 p-2 rounded text-sm">
                              <span>{file.name}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAttachment(index)}><Trash className="h-4 w-4 text-red-500" /></Button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between sm:items-center">
                  <div className="text-xs text-gray-500">
                    {currentReport?.status ? `报告状态: ${currentReport.status}` : ''}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="secondary" onClick={() => setIsReportDialogOpen(false)}>关闭</Button>
                    {!isActionDisabled && (
                      <>
                        <Button variant="outline" onClick={handleSaveDraft} disabled={saveDraftMutation.isPending || submitReportMutation.isPending}>
                          <Save className="w-4 h-4 mr-2" />
                          {saveDraftMutation.isPending ? '保存中...' : '保存草稿'}
                        </Button>
                        <Button onClick={handleSubmitReport} disabled={saveDraftMutation.isPending || submitReportMutation.isPending}>
                          {submitReportMutation.isPending ? '提交中...' : '确认提交'}
                        </Button>
                      </>
                    )}
                  </div>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // 视图 C: 实验启动页
  if (selectedExperiment) {
    const isLaunchDisabled = !selectedTask || selectedTask.status === '已提交' || selectedTask.status === '已批阅' || selectedTask.status === '已截止';
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <div className="max-w-4xl mx-auto w-full">
          <Button variant="ghost" onClick={() => { setSelectedExperiment(null); setSelectedTask(null); }} className="mb-6 text-white hover:bg-gray-700 absolute top-8 left-8">
            <ArrowLeft className="w-4 h-4 mr-2" /> 返回
          </Button>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <Card className="bg-gray-800 border-gray-700 text-center p-8">
                <CardHeader>
                  <CardTitle className="text-white text-3xl">{selectedExperiment.title}</CardTitle>
                  {/* 已修改: 只有在有关联任务时才显示任务名称 */}
                  {selectedTask && <CardDescription className="text-gray-300 mt-2">任务: {selectedTask.taskName}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <FlaskConical className="w-24 h-24 text-blue-400 mx-auto my-8 animate-pulse" />
                  <p className="mb-6 text-gray-400">准备启动虚拟实验环境</p>
                  <Button
                    size="lg"
                    className="w-full text-lg py-6"
                    onClick={() => startExperimentMutation.mutate(selectedTask!.id)}
                    disabled={isLaunchDisabled || startExperimentMutation.isPending}
                  >
                    {startExperimentMutation.isPending ? "启动中..." : "进入虚拟实验室"}
                  </Button>
                  {isLaunchDisabled && <p className="text-xs mt-4 text-yellow-400">{!selectedTask ? '这是一个浏览模式，无法启动。' : `该任务已${selectedTask.status}，无法进入实验。`}</p>}
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader><CardTitle className="text-base text-white">实验信息</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-gray-300 text-sm">
                  <div className="flex items-center space-x-2">{getCategoryIcon(selectedExperiment.category, "w-4 h-4")}<span>{selectedExperiment.category}</span></div>
                  <div className="flex items-center space-x-2"><User className="w-4 h-4" /><span>创建者: {selectedExperiment.creator}</span></div>
                  <div className="flex items-center space-x-2"><Clock className="w-4 h-4" /><span>{selectedExperiment.duration} 分钟</span></div>
                  <div className="flex items-center space-x-2"><span>难度:</span>{renderStarRating(selectedExperiment.difficulty)}</div>
                </CardContent>
              </Card>
              {selectedTask && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader><CardTitle className="text-base text-white flex items-center gap-2"><Info className="w-5 h-5" /> 任务详情</CardTitle></CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">状态:</span>
                      <Badge variant={getStatusBadgeVariant(selectedTask.status)}>{selectedTask.status}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">截止时间:</span>
                      <span className="text-white font-medium">{new Date(selectedTask.endTime).toLocaleString()}</span>
                    </div>
                    {selectedTask.status === '已批阅' && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">成绩:</span>
                        <span className="font-bold text-lg text-green-400">{selectedTask.grade} / 100</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400 block mb-1">任务要求:</span>
                      <p className="text-gray-300 bg-gray-900/50 p-3 rounded-md text-xs leading-relaxed max-h-28 overflow-y-auto">
                        {selectedTask.requirements}
                      </p>
                    </div>
                    <Button className="w-full mt-2" variant="outline" onClick={() => { setViewingTask(selectedTask); setSelectedExperiment(null); }}>
                      返回任务详情页
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 视图 A: 主列表视图 (默认)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">虚拟仿真实验平台</h1>
            <p className="text-gray-600">欢迎, {user.name}！探索科学世界，完成您的实验任务。</p>
          </div>
        </div>

        <Tabs defaultValue="myTasks" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="myTasks">我的任务</TabsTrigger>
            <TabsTrigger value="experiments">实验库</TabsTrigger>
          </TabsList>

          <TabsContent value="myTasks">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studentTasks.map((task) => (
                <Card key={task.id} className="cursor-pointer hover:shadow-lg transition-shadow flex flex-col" onClick={() => setViewingTask(task)}>
                  <CardHeader className="flex-grow">
                    <CardTitle>{task.taskName}</CardTitle>
                    <CardDescription>实验: {task.experimentTitle}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>状态</span>
                      <Badge variant={getStatusBadgeVariant(task.status)}>{task.status}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>截止时间</span>
                      <span>{new Date(task.endTime).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {studentTasks.length === 0 && <div className="text-center text-gray-500 py-16">您当前没有待完成的任务。</div>}
          </TabsContent>

          <TabsContent value="experiments">
            <Card className="mb-6">
              <CardContent className="pt-6 flex flex-col md:flex-row gap-4">
                <Input placeholder="搜索实验..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-grow" />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">所有学科</SelectItem><SelectItem value="化学">化学</SelectItem><SelectItem value="物理">物理</SelectItem><SelectItem value="生物">生物</SelectItem></SelectContent></Select>
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}><SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">所有难度</SelectItem><SelectItem value="1">1星</SelectItem><SelectItem value="2">2星</SelectItem><SelectItem value="3">3星</SelectItem><SelectItem value="4">4星</SelectItem><SelectItem value="5">5星</SelectItem></SelectContent></Select>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExperiments.map((experiment) => (
                <Card key={experiment.id} className="flex flex-col cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleSelectExperiment(experiment)}>
                  <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                    <img src={experiment.thumbnail || `https://placehold.co/400x225/e2e8f0/4a5568?text=${encodeURIComponent(experiment.title)}`} alt={experiment.title} className="object-cover w-full h-full" />
                  </div>
                  <CardHeader className="flex-grow">
                    <CardTitle>{experiment.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600">
                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="flex items-center gap-1.5" title={experiment.category}>
                        {getCategoryIcon(experiment.category, "w-4 h-4")}
                        <span>{experiment.category}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title={`${experiment.duration} 分钟`}>
                        <Clock className="w-4 h-4" />
                        <span>{experiment.duration} 分钟</span>
                      </div>
                      <div className="flex items-center gap-1.5" title={`难度 ${experiment.difficulty} 星`}>
                        {renderStarRating(experiment.difficulty)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Pagination className="mt-8">
              <PaginationContent>
                <PaginationPrevious onClick={() => setCurrentPage(p => Math.max(0, p - 1))} />
                {[...Array(experimentsData?.totalPages || 0)].map((_, i) => <PaginationItem key={i}><PaginationLink onClick={() => setCurrentPage(i)} isActive={i === currentPage}>{i + 1}</PaginationLink></PaginationItem>)}
                <PaginationNext onClick={() => setCurrentPage(p => Math.min((experimentsData?.totalPages || 1) - 1, p + 1))} />
              </PaginationContent>
            </Pagination>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
