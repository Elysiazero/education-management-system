"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { FlaskConical, Download, Clock, Star, Microscope, Atom, Beaker, User, FileText, Paperclip, Trash, FileCheck, FileBarChart } from "lucide-react"

// =================================================================
// 1. Type Definitions
// =================================================================
// Note: In a real app, these would be in a shared `types.ts` file.
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
  completed: boolean
  progress: number
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
  status: "未开始" | "进行中" | "已提交" | "已批改"
  grade?: number
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
  status: "未开始" | "进行中" | "已提交" | "已批改"
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
// 2. API Request Functions
// =================================================================
// Note: In a real app, these would be in a shared `api.ts` file.
const API_BASE_URL = "http://localhost:8080/api/v1/teaching"
const RESOURCE_BASE_URL = "http://localhost:8080"

const getAuthToken = () => {
  return typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
}

const normalizeExperiment = (record: any): Experiment => ({
  id: String(record.id),
  title: record.title || "无标题实验",
  category: record.subject || "其它",
  description: record.description || "",
  difficulty: record.difficulty || 1,
  duration: record.duration || 30,
  completed: record.completed || false,
  progress: record.progress || 0,
  thumbnail: record.thumbnailUrl || "",
  creator: record.creator?.realName || "系统",
  simulationUrl: record.simulationUrl || "",
})

const mapTaskStatus = (status: string): "未开始" | "进行中" | "已提交" | "已批改" => {
  switch (status?.toUpperCase()) {
    case "PENDING": return "未开始"
    case "IN_PROGRESS": return "进行中"
    case "SUBMITTED": return "已提交"
    case "GRADED": return "已批改"
    default: return "未开始"
  }
}

const normalizeAssignment = (task: any): Assignment => ({
  id: String(task.id),
  taskName: task.taskName || "未命名任务",
  experimentId: String(task.experiment?.id || ""),
  experimentTitle: task.experiment?.title || "未知实验",
  endTime: task.endTime || new Date().toISOString(),
  status: mapTaskStatus(task.status),
  grade: task.grade,
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

const getMyReport = async (taskId: string): Promise<Report> => {
  const token = getAuthToken();
  if (!token) throw new Error("用户未登录");
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/my-report`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("获取实验报告失败");
  const data = (await response.json()).data;
  return {
    id: data.id,
    studentId: data.studentId,
    studentName: data.studentName,
    submittedAt: data.submittedAt,
    content: data.manualContent || "",
    autoContent: data.autoContent || "",
    grade: data.grade,
    feedback: data.feedback,
    status: mapTaskStatus(data.status),
    attachments: data.attachments || [],
  };
};

const submitReport = async (taskId: string, reportData: { content: string }, attachments: File[]): Promise<Report> => {
  const token = getAuthToken();
  if (!token) throw new Error("用户未登录");

  const attachmentIds = await Promise.all(attachments.map(async file => {
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
    body: JSON.stringify({ manualContent: reportData.content, isSubmitted: true, attachmentRids: attachmentIds }),
  });
  if (!reportResponse.ok) throw new Error("提交报告失败");
  return (await reportResponse.json()).data;
};

// =================================================================
// 3. Student Dashboard Component
// =================================================================
export default function StudentDashboard({ user }: StudentDashboardProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  // State Management
  const [currentPage, setCurrentPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null)
  const [selectedTask, setSelectedTask] = useState<Assignment | null>(null)
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const [reportContent, setReportContent] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])

  // Data Fetching
  const { data: experimentsData, isLoading: experimentsLoading } = useQuery({
    queryKey: ["experiments", currentPage],
    queryFn: () => fetchExperiments(currentPage, 9),
    placeholderData: { experiments: [], totalPages: 0 },
  })

  const { data: studentTasks = [], isLoading: studentTasksLoading } = useQuery<Assignment[]>({
    queryKey: ["studentTasks", user.id],
    queryFn: fetchMyTasks,
  })

  // When a task is selected, fetch the latest report data for the dialog
  const { data: currentReport, isLoading: reportLoading } = useQuery({
    queryKey: ['myReport', selectedTask?.id],
    queryFn: () => getMyReport(selectedTask!.id),
    enabled: !!selectedTask && isSubmittingReport, // Only fetch when dialog is open for a task
  });

  // **FIXED**: Use useEffect to handle side-effects from data fetching
  useEffect(() => {
    if (currentReport) {
      setReportContent(currentReport.content);
    }
  }, [currentReport]);


  // Mutations
  const startExperimentMutation = useMutation({
    mutationFn: startExperimentTask,
    onSuccess: (sessionId) => {
      router.push(`/virtual-lab/simulation/${sessionId}`);
    },
    onError: (error: Error) => alert(`启动实验失败: ${error.message}`),
  })

  const submitReportMutation = useMutation({
    mutationFn: ({ taskId, reportData, attachments }: { taskId: string; reportData: { content: string }; attachments: File[] }) => submitReport(taskId, reportData, attachments),
    onSuccess: () => {
      alert("报告提交成功！");
      setIsSubmittingReport(false);
      setAttachments([]);
      queryClient.invalidateQueries({ queryKey: ['studentTasks'] });
      queryClient.invalidateQueries({ queryKey: ['myReport', selectedTask?.id] });
    },
    onError: (error: Error) => alert(`提交失败: ${error.message}`),
  });

  // Memoized Filtering
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

  // Event Handlers
  const handleSelectExperiment = async (experiment: Experiment, task?: Assignment) => {
    setSelectedExperiment(null); // Show loading state
    setSelectedTask(task || studentTasks.find(t => t.experimentId === experiment.id) || null);
    try {
      const detailedData = await getExperimentById(experiment.id);
      setSelectedExperiment(detailedData);
    } catch (error) {
      alert("获取实验详情失败");
      console.error(error);
    }
  }

  const handleViewTaskDetails = async (task: Assignment) => {
    const experiment = experimentsData?.experiments.find(e => e.id === task.experimentId);
    if (experiment) {
      handleSelectExperiment(experiment, task);
    } else {
      // If experiment is not in the current page, fetch it
      try {
        const fetchedExperiment = await getExperimentById(task.experimentId);
        handleSelectExperiment(fetchedExperiment, task);
      } catch (error) {
        alert("获取实验信息失败");
      }
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
    if (!selectedTask) return;
    submitReportMutation.mutate({ taskId: selectedTask.id, reportData: { content: reportContent }, attachments });
  }

  // Render Helpers
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "化学": return <Beaker className="w-5 h-5" />;
      case "物理": return <Atom className="w-5 h-5" />;
      case "生物": return <Microscope className="w-5 h-5" />;
      default: return <FlaskConical className="w-5 h-5" />;
    }
  }

  const renderStarRating = (difficulty: number) => (
    <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < difficulty ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />)}</div>
  )

  // Loading UI
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

  // Experiment Detail View
  if (selectedExperiment) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={() => { setSelectedExperiment(null); setSelectedTask(null); }} className="mb-6 text-white hover:bg-gray-700">
            ← 返回列表
          </Button>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-2xl">{selectedExperiment.title}</CardTitle>
                  <CardDescription className="text-gray-300">{selectedExperiment.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-black rounded-lg mb-6 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <FlaskConical className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                      <p className="mb-4">准备启动虚拟实验环境</p>
                      <Button
                        onClick={() => startExperimentMutation.mutate(selectedTask!.id)}
                        disabled={!selectedTask || startExperimentMutation.isPending}
                      >
                        {startExperimentMutation.isPending ? "启动中..." : "启动实验"}
                      </Button>
                      {!selectedTask && <p className="text-xs mt-2 text-yellow-400">这不是一个任务，仅供浏览。</p>}
                    </div>
                  </div>
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-300">实验进度</span>
                      <span className="text-sm text-gray-300">{selectedExperiment.progress}%</span>
                    </div>
                    <Progress value={selectedExperiment.progress} className="bg-gray-700" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader><CardTitle className="text-sm text-white">实验信息</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-gray-300 text-sm">
                  <div className="flex items-center space-x-2">{getCategoryIcon(selectedExperiment.category)}<span>{selectedExperiment.category}</span></div>
                  <div className="flex items-center space-x-2"><User className="w-4 h-4" /><span>创建者: {selectedExperiment.creator}</span></div>
                  <div className="flex items-center space-x-2"><Clock className="w-4 h-4" /><span>{selectedExperiment.duration} 分钟</span></div>
                  <div className="flex items-center space-x-2"><span>难度:</span>{renderStarRating(selectedExperiment.difficulty)}</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader><CardTitle className="text-sm text-white">实验报告</CardTitle></CardHeader>
                <CardContent>
                  {selectedTask ? (
                    <div>
                      <div className="flex justify-between text-sm mb-2"><span>状态</span><Badge>{selectedTask.status}</Badge></div>
                      {selectedTask.status === "已批改" && <div className="flex justify-between text-sm mb-4"><span>成绩</span><span className="font-bold text-lg text-green-400">{selectedTask.grade} / 100</span></div>}

                      <Dialog open={isSubmittingReport} onOpenChange={setIsSubmittingReport}>
                        <DialogTrigger asChild>
                          <Button className="w-full" variant="outline">
                            {/* **FIXED**: Corrected string comparison */}
                            {selectedTask.status === '未开始' || selectedTask.status === '进行中' ? '提交/编辑报告' : '查看报告'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>实验报告: {selectedExperiment.title}</DialogTitle>
                          </DialogHeader>
                          {reportLoading ? <Skeleton className="h-64 w-full" /> : (
                            <>
                              <div className="grid gap-4 py-4">
                                {currentReport?.autoContent && (
                                  <div className="space-y-2">
                                    <Label>自动生成内容 (仅供参考)</Label>
                                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm max-h-40 overflow-y-auto" dangerouslySetInnerHTML={{ __html: currentReport.autoContent }} />
                                  </div>
                                )}
                                <div className="space-y-2">
                                  <Label htmlFor="reportContent">你的报告内容</Label>
                                  <Textarea id="reportContent" value={reportContent} onChange={(e) => setReportContent(e.target.value)} className="min-h-[200px]" />
                                </div>
                                <div className="space-y-2">
                                  <Label>附件</Label>
                                  <Input id="attachment-upload" type="file" multiple onChange={handleAttachmentUpload} className="hidden" />
                                  <label htmlFor="attachment-upload" className="cursor-pointer inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50">
                                    <Paperclip className="w-4 h-4 mr-2" /> 添加文件
                                  </label>
                                  <div className="mt-2 space-y-1">
                                    {attachments.map((file, index) => (
                                      <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded text-sm">
                                        <span>{file.name}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAttachment(index)}><Trash className="h-4 w-4 text-red-500" /></Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="secondary" onClick={() => setIsSubmittingReport(false)}>关闭</Button>
                                <Button onClick={handleSubmitReport} disabled={submitReportMutation.isPending}>
                                  {submitReportMutation.isPending ? '提交中...' : '确认提交'}
                                </Button>
                              </DialogFooter>
                            </>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">这不是一个任务，无需提交报告。</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main List View
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
          <TabsList>
            <TabsTrigger value="myTasks">我的任务</TabsTrigger>
            <TabsTrigger value="experiments">实验库</TabsTrigger>
          </TabsList>

          <TabsContent value="myTasks">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studentTasks.map((task) => (
                <Card key={task.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleViewTaskDetails(task)}>
                  <CardHeader>
                    <CardTitle>{task.taskName}</CardTitle>
                    <CardDescription>实验: {task.experimentTitle}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm"><span>状态</span><Badge>{task.status}</Badge></div>
                    <div className="flex justify-between text-sm"><span>截止时间</span><span>{new Date(task.endTime).toLocaleDateString()}</span></div>
                    <Button size="sm" variant="outline" className="w-full mt-2">查看任务详情</Button>
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
                <Card key={experiment.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleSelectExperiment(experiment)}>
                  <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden"><img src={experiment.thumbnail || "https://placehold.co/400x225/e2e8f0/4a5568?text=实验封面"} alt={experiment.title} className="object-cover w-full h-full" /></div>
                  <CardHeader><CardTitle>{experiment.title}</CardTitle></CardHeader>
                  <CardContent><div className="flex justify-between items-center"><Badge variant="secondary">{experiment.category}</Badge>{renderStarRating(experiment.difficulty)}</div></CardContent>
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
