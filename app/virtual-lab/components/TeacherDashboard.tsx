"use client"

import type React from "react"
import { useState, useMemo } from "react"
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
import Link from "next/link"
import { Star, Plus, Send, FileText, AlertCircle, CheckCircle, Download, Award, Microscope, Atom, Beaker, FlaskConical } from "lucide-react"

// =================================================================
// 1. Type Definitions
// =================================================================
interface UserType { id: string; name: string; role: "student" | "teacher" | "admin"; }
interface Experiment {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  duration: number;
  creator: string;
  thumbnail: string;
  simPackageUrl: string;
  fileName: string;
}
interface Assignment { id: string; taskName: string; className: string; classId: string; experimentId: string; experimentTitle?: string; startTime: string; endTime: string; }
interface TaskReport { id: string; studentName: string; status: "未提交" | "已提交" | "已批改"; grade?: number; }
interface ClassDTO { id: number; name: string; }
interface UserInfoDTO { id: number; name: string; }
interface GradingStats { totalReports: number; submittedReports: number; gradedReports: number; averageGrade: number; }
interface TeacherDashboardProps { user: UserType; }

// =================================================================
// 2. API Request Functions
// =================================================================
const API_BASE_URL = "http://localhost:8080/api/v1/teaching"
const UPLOAD_BASE_URL = "http://localhost:8080"
const getAuthToken = () => typeof window !== "undefined" ? localStorage.getItem("accessToken") : null

// @notice OSS 配置，用于拼接封面图 URL
const OSS_BUCKET_INFO = {
  ENDPOINT: "oss-cn-chengdu.aliyuncs.com",
  BUCKET_NAME: "plantform-resource"
};
const BUCKET_URL = `https://${OSS_BUCKET_INFO.BUCKET_NAME}.${OSS_BUCKET_INFO.ENDPOINT}`;

const normalizeExperiment = (record: any): Experiment => ({
  id: String(record.id),
  title: record.title || "无标题实验",
  description: record.description || "",
  category: record.subject || "其它",
  difficulty: record.difficulty || 1,
  duration: record.duration || 30,
  creator: record.creator?.realName || "系统",
  thumbnail: record.thumbnailUrl || "",
  simPackageUrl: record.simPackageUrl || "", // 处理仿真包URL
  fileName: record.fileName || "download.zip" // 处理文件名
});

const mapReportStatus = (status: string): "未提交" | "已提交" | "已批改" => {
  switch (status?.toUpperCase()) {
    case "NOT_SUBMITTED": return "未提交";
    case "SUBMITTED": return "已提交";
    case "GRADED": return "已批改";
    default: return "未提交";
  }
};

const normalizeAssignment = (task: any): Assignment => ({
  id: String(task.id),
  taskName: task.taskName || "未命名任务",
  className: task.classInfo?.name || "未知班级",
  classId: String(task.classInfo?.id || ""),
  experimentId: String(task.experiment?.id || ""),
  experimentTitle: task.experiment?.title || "未知实验",
  startTime: task.startTime || new Date().toISOString(),
  endTime: task.endTime || new Date().toISOString(),
});

/**
 * @notice 更新：上传文件并从返回的文本中解析出 objectKey
 */
const uploadAndGetObjectKey = async (
  file: File,
  resourceType: string,
  user: UserType,
  description: string = ""
): Promise<string> => {
  const token = getAuthToken();
  if (!token) throw new Error("用户未登录");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("userName", user.name);
  formData.append("fileName", file.name);
  formData.append("resourceType", resourceType);
  formData.append("description", description);

  const res = await fetch(`${UPLOAD_BASE_URL}/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const responseText = await res.text();
  if (!res.ok) {
    throw new Error(responseText || "文件上传失败");
  }

  // 从 "文件上传并保存成功! ObjectKey: xxx" 中解析出 objectKey
  const objectKey = responseText.split("ObjectKey: ")[1];
  if (!objectKey) {
    throw new Error("无法从上传响应中解析出 ObjectKey");
  }
  return objectKey.trim();
};

/**
 * @notice 新增：完整的创建实验流程函数
 */
const createExperiment = async (
  newExperimentData: any,
  files: { simulationPackage?: File; thumbnail?: File },
  user: UserType
): Promise<Experiment> => {
  const token = getAuthToken();
  if (!token) throw new Error("用户未登录");
  if (!files.simulationPackage) throw new Error("必须提供仿真包文件");

  // 第 1 步: 上传仿真包并获取其 objectKey
  const simPackageObjectKey = await uploadAndGetObjectKey(files.simulationPackage, "SIMULATION_PACKAGE", user, `仿真包: ${newExperimentData.title}`);

  // 第 2 步: 如果有封面图，上传并构建其 URL
  let thumbnailUrl: string | undefined = undefined;
  if (files.thumbnail) {
    const thumbnailObjectKey = await uploadAndGetObjectKey(files.thumbnail, "IMAGE", user, `封面图: ${newExperimentData.title}`);
    thumbnailUrl = `${BUCKET_URL}/${thumbnailObjectKey}`;
  }

  // 第 3 步: 准备最终提交的数据
  const payload = {
    ...newExperimentData,
    simPackageObjectKey: simPackageObjectKey,
    thumbnailUrl: thumbnailUrl,
  };

  // 第 4 步: 调用创建实验的 API
  const response = await fetch(`${API_BASE_URL}/experiments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "创建实验记录失败");
  }
  const result = await response.json();
  return normalizeExperiment(result.data);
};

const publishAssignment = async (assignmentData: any): Promise<Assignment> => {
  const token = getAuthToken();
  if (!token) throw new Error("用户未登录");

  // 解析评分规则
  let scoringRules;
  try {
    scoringRules = JSON.parse(assignmentData.scoringRules);
  } catch (e) {
    throw new Error("评分规则必须是有效的JSON格式");
  }

  const response = await fetch(`${API_BASE_URL}/experiment-tasks/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      experimentId: Number(assignmentData.experimentId),
      classId: Number(assignmentData.classId),
      taskName: assignmentData.taskName,
      taskRequirements: assignmentData.requirements,
      startTime: assignmentData.startTime,
      endTime: assignmentData.endTime,
      studentIds: assignmentData.studentIds.map((id: string | number) => Number(id)),
      scoringRules: scoringRules // 新增评分规则
    }),
  });

  if (!response.ok) throw new Error((await response.json()).message || "发布任务失败");
  return normalizeAssignment((await response.json()).data);
};


const fetchTeacherTasks = async (): Promise<Assignment[]> => {
  const token = getAuthToken();
  if (!token) throw new Error("用户未登录");
  const response = await fetch(`${API_BASE_URL}/experiment-tasks/teacher-tasks`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error("获取教师任务失败");
  const data = (await response.json()).data;
  return (data?.content || data?.records || []).map(normalizeAssignment);
};

const fetchTaskReports = async (taskId: string): Promise<TaskReport[]> => {
  const token = getAuthToken();
  if (!token) throw new Error("用户未登录");
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/reports`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error("获取任务报告失败");
  const data = (await response.json()).data;
  return (data?.content || data?.records || []).map((r: any) => ({
    ...r,
    status: mapReportStatus(r.status),
    // ➡️ 只保留合法数字，其余设为 null
    grade:
      r.grade !== null && r.grade !== undefined && !isNaN(Number(r.grade))
        ? Number(r.grade)
        : null,
  }))
};

const fetchExperiments = async (): Promise<Experiment[]> => {
  const token = getAuthToken();
  if (!token) throw new Error("用户未登录");
  const response = await fetch(`${API_BASE_URL}/experiments?size=200`, { headers: { Authorization: `Bearer ${token}` } }); // Fetch more for filtering
  if (!response.ok) throw new Error("获取实验列表失败");
  const data = (await response.json()).data;
  return (data?.content || data?.records || []).map(normalizeExperiment);
};

const fetchClassesAndStudents = async (): Promise<{ classes: ClassDTO[], studentsMap: { [key: number]: UserInfoDTO[] } }> => {
  const token = getAuthToken();
  if (!token) throw new Error("用户未登录");
  const classesResponse = await fetch(`${API_BASE_URL}/admin/classes`, { headers: { Authorization: `Bearer ${token}` } });
  if (!classesResponse.ok) throw new Error("获取班级列表失败");
  const classesData = (await classesResponse.json()).data;
  const classes: ClassDTO[] = classesData?.content || classesData?.records || [];

  const studentsMap: { [key: number]: UserInfoDTO[] } = {};
  await Promise.all(classes.map(async (cls) => {
    const classDetailResponse = await fetch(`${API_BASE_URL}/classes/${cls.id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (classDetailResponse.ok) {
      studentsMap[cls.id] = ((await classDetailResponse.json()).data)?.members || [];
    }
  }));
  return { classes, studentsMap };
};

// =================================================================
// 3. Teacher Dashboard Component
// =================================================================
export default function TeacherDashboard({ user }: TeacherDashboardProps) {
  const queryClient = useQueryClient();

  // State
  const [isCreating, setIsCreating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [currentExperiment, setCurrentExperiment] = useState<Experiment | null>(null);
  const [newExperiment, setNewExperiment] = useState({ title: "", description: "", subject: "化学", difficulty: 3 });
  // @notice 修改：将 useState 的初始值从 null 改为 undefined，以匹配函数签名
  const [simulationPackage, setSimulationPackage] = useState<File | undefined>(undefined);
  const [thumbnailFile, setThumbnailFile] = useState<File | undefined>(undefined);
  const [newAssignment, setNewAssignment] = useState({
    taskName: "",
    classId: "",
    studentId: "",
    startTime: "", // 新增开始时间
    endTime: "",
    requirements: "",
    scoringRules: JSON.stringify([ // 新增评分规则
      {
        dimension: "操作准确性",
        metric: "DATA_ACCURACY",
        points: 50,
        expected: {
          metricName: "",
          targetValue: 0,
          tolerance: 0
        }
      }
    ], null, 2)
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  // Data Fetching
  const { data: experiments = [], isLoading: experimentsLoading } = useQuery<Experiment[]>({ queryKey: ["experiments"], queryFn: fetchExperiments });
  const { data: teacherTasks = [], isLoading: teacherTasksLoading } = useQuery<Assignment[]>({ queryKey: ["teacherTasks", user.id], queryFn: fetchTeacherTasks });
  const { data: classData, isLoading: classDataLoading } = useQuery({ queryKey: ['classesAndStudents'], queryFn: fetchClassesAndStudents });
  const { data: allReports, isLoading: reportsLoading } = useQuery({
    queryKey: ['allTaskReports', teacherTasks],
    queryFn: async () => {
      if (!teacherTasks?.length) return [];
      const reportsByTask = await Promise.all(teacherTasks.map(task => fetchTaskReports(task.id)));
      return reportsByTask.flat();
    },
    enabled: !!teacherTasks && teacherTasks.length > 0,
  });

  // Memoized Calculations
  const gradingStats = useMemo<GradingStats>(() => {
    if (!allReports) {
      return { totalReports: 0, submittedReports: 0, gradedReports: 0, averageGrade: 0 }
    }

    // 已批改且 grade 是有效数字
    const graded = allReports.filter(
      r => r.status === '已批改' && typeof r.grade === 'number' && !isNaN(r.grade)
    )

    const total = graded.reduce((sum, r) => sum + (r.grade as number), 0)
    const avg = graded.length ? +(total / graded.length).toFixed(1) : 0

    return {
      totalReports: allReports.length,
      submittedReports: allReports.filter(r => r.status !== '未提交').length,
      gradedReports: graded.length,
      averageGrade: avg,
    }
  }, [allReports])

  const filteredExperiments = useMemo(() => {
    let filtered = experiments || [];
    if (searchTerm) filtered = filtered.filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase()));
    if (categoryFilter !== "all") filtered = filtered.filter(e => e.category === categoryFilter);
    if (difficultyFilter !== "all") filtered = filtered.filter(e => e.difficulty === parseInt(difficultyFilter));
    return filtered;
  }, [experiments, searchTerm, categoryFilter, difficultyFilter]);

  // Mutations
  const createExperimentMutation = useMutation({
    mutationFn: () => createExperiment(newExperiment, { simulationPackage, thumbnail: thumbnailFile }, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiments"] });
      setIsCreating(false);
      alert("实验创建成功！");
      // 重置表单
      setNewExperiment({ title: "", description: "", subject: "化学", difficulty: 3 });
      setSimulationPackage(undefined);
      setThumbnailFile(undefined);
    },
    onError: (error: Error) => alert(`创建失败: ${error.message}`),
  });

  const publishAssignmentMutation = useMutation({
    mutationFn: publishAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherTasks"] });
      setIsPublishing(false);
      alert("任务发布成功！");
    },
    onError: (error: Error) => alert(`发布失败: ${error.message}`),
  });

  // Handlers
  const handleCreateExperiment = () => {
    if (!simulationPackage) {
      alert("请务必上传一个仿真包文件。");
      return;
    }
    createExperimentMutation.mutate();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | undefined>>) => {
    if (e.target.files?.[0]) {
      setter(e.target.files[0]);
    } else {
      setter(undefined);
    }
  };

  const handleDownload = (url: string, fileName: string) => {
    if (!url) {
      alert("此实验没有可用的下载链接。");
      return;
    }
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePublishAssignment = () => {
    if (!currentExperiment || !newAssignment.classId) return alert("请选择实验和班级");
    const studentIds = newAssignment.studentId ? [newAssignment.studentId] : classData?.studentsMap[Number(newAssignment.classId)]?.map(s => s.id.toString()) || [];
    if (studentIds.length === 0) return alert("该班级下没有学生");
    if (!currentExperiment || !newAssignment.classId)
      return alert("请选择实验和班级");

    if (!newAssignment.startTime || !newAssignment.endTime)
      return alert("请填写开始时间和截止时间");

    if (!newAssignment.scoringRules.trim())
      return alert("请填写评分规则");

    try {
      JSON.parse(newAssignment.scoringRules);
    } catch (e) {
      return alert("评分规则必须是有效的JSON格式");
    }
    publishAssignmentMutation.mutate({ ...newAssignment, experimentId: currentExperiment.id, studentIds });
  };

  // Render Helpers
  const renderStarRating = (d: number) => <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < d ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />)}</div>;

  if (experimentsLoading || teacherTasksLoading || classDataLoading) {
    return <div className="p-8"><Skeleton className="h-screen w-full" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div><h1 className="text-3xl font-bold text-gray-900">教师工作台</h1><p className="text-gray-600">管理您的实验和学生任务</p></div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> 新建实验</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader><DialogTitle>创建新实验</DialogTitle><DialogDescription>填写实验详情并上传所需文件，点击按钮即可完成创建。</DialogDescription></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="title" className="text-right">实验标题 <span className="text-red-500">*</span></Label><Input id="title" value={newExperiment.title} onChange={e => setNewExperiment({ ...newExperiment, title: e.target.value })} className="col-span-3" /></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="subject" className="text-right">所属学科 <span className="text-red-500">*</span></Label><Select value={newExperiment.subject} onValueChange={v => setNewExperiment({ ...newExperiment, subject: v })}><SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="化学">化学</SelectItem><SelectItem value="物理">物理</SelectItem><SelectItem value="生物">生物</SelectItem></SelectContent></Select></div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="difficulty" className="text-right">难度等级</Label>
                  <Input id="difficulty" type="number" min="1" max="5" value={newExperiment.difficulty} onChange={e => setNewExperiment({ ...newExperiment, difficulty: parseInt(e.target.value, 10) || 1 })} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="desc" className="text-right">实验描述</Label><Textarea id="desc" value={newExperiment.description} onChange={e => setNewExperiment({ ...newExperiment, description: e.target.value })} className="col-span-3" /></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="package" className="text-right">仿真包 <span className="text-red-500">*</span></Label><Input id="package" type="file" onChange={e => handleFileUpload(e, setSimulationPackage)} className="col-span-3" /></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="thumbnail" className="text-right">封面图</Label><Input id="thumbnail" type="file" accept="image/*" onChange={e => handleFileUpload(e, setThumbnailFile)} className="col-span-3" /></div>
              </div>
              <DialogFooter><Button onClick={handleCreateExperiment} disabled={createExperimentMutation.isPending}>{createExperimentMutation.isPending ? "创建中..." : "确认创建"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="mb-6">
          <CardHeader><CardTitle>教学统计</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <div>
              <FileText className="mx-auto h-7 w-7 text-blue-500 mb-1" />
              <p className="text-2xl font-bold">{gradingStats.totalReports}</p>
              <p className="text-sm text-gray-500">总报告数</p>
            </div>

            <div>
              <AlertCircle className="mx-auto h-7 w-7 text-yellow-500 mb-1" />
              <p className="text-2xl font-bold">
                {gradingStats.submittedReports - gradingStats.gradedReports}
              </p>
              <p className="text-sm text-gray-500">待批改</p>
            </div>

            <div>
              <CheckCircle className="mx-auto h-7 w-7 text-green-500 mb-1" />
              <p className="text-2xl font-bold">{gradingStats.gradedReports}</p>
              <p className="text-sm text-gray-500">已批改</p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="experiments">
          <TabsList>
            <TabsTrigger value="experiments">实验库</TabsTrigger>
            <TabsTrigger value="teacherTasks">已发布任务</TabsTrigger>
          </TabsList>
          <TabsContent value="experiments" className="pt-4">
            <Card className="mb-6"><CardContent className="pt-6 flex flex-col md:flex-row gap-4"><Input placeholder="搜索实验..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-grow" /><Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">所有学科</SelectItem><SelectItem value="化学">化学</SelectItem><SelectItem value="物理">物理</SelectItem><SelectItem value="生物">生物</SelectItem></SelectContent></Select><Select value={difficultyFilter} onValueChange={setDifficultyFilter}><SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">所有难度</SelectItem><SelectItem value="1">1星</SelectItem><SelectItem value="2">2星</SelectItem><SelectItem value="3">3星</SelectItem><SelectItem value="4">4星</SelectItem><SelectItem value="5">5星</SelectItem></SelectContent></Select></CardContent></Card>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExperiments.map(exp => (
                <Card key={exp.id} className="flex flex-col">
                  <CardHeader><CardTitle>{exp.title}</CardTitle><CardDescription className="h-10 overflow-hidden">{exp.description}</CardDescription></CardHeader>
                  <CardContent className="flex-grow flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-4"><Badge variant="secondary">{exp.category}</Badge>{renderStarRating(exp.difficulty)}</div>
                    <div className="flex gap-2 mt-auto">
                      <Button variant="outline" className="w-full" onClick={() => handleDownload(exp.simPackageUrl, exp.fileName)}>
                        <Download className="w-4 h-4 mr-2" /> 下载
                      </Button>
                      <Dialog open={isPublishing && currentExperiment?.id === exp.id} onOpenChange={(open) => !open && setIsPublishing(false)}>
                        <DialogTrigger asChild><Button className="w-full" onClick={() => { setIsPublishing(true); setCurrentExperiment(exp); }}><Send className="w-4 h-4 mr-2" /> 发布任务</Button></DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>发布任务: {exp.title}</DialogTitle></DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">任务名称</Label><Input value={newAssignment.taskName} onChange={e => setNewAssignment({ ...newAssignment, taskName: e.target.value })} className="col-span-3" /></div>
                            <div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">选择班级</Label><Select onValueChange={v => setNewAssignment({ ...newAssignment, classId: v, studentId: '' })}><SelectTrigger className="col-span-3"><SelectValue placeholder="选择班级" /></SelectTrigger><SelectContent>{classData?.classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label className="text-right">开始时间 <span className="text-red-500">*</span></Label>
                              <Input
                                type="datetime-local"
                                value={newAssignment.startTime}
                                onChange={e => setNewAssignment({ ...newAssignment, startTime: e.target.value })}
                                className="col-span-3"
                              />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label className="text-right">截止时间 <span className="text-red-500">*</span></Label>
                              <Input
                                type="datetime-local"
                                value={newAssignment.endTime}
                                onChange={e => setNewAssignment({ ...newAssignment, endTime: e.target.value })}
                                className="col-span-3"
                              />
                            </div>

                            <div className="grid grid-cols-4 items-start gap-4">
                              <Label className="text-right pt-2">
                                评分规则 <span className="text-red-500">*</span>
                                <p className="text-xs text-gray-500 mt-1">
                                  使用JSON格式配置评分标准
                                </p>
                              </Label>
                              <Textarea
                                value={newAssignment.scoringRules}
                                onChange={e => setNewAssignment({ ...newAssignment, scoringRules: e.target.value })}
                                className="col-span-3 font-mono text-sm h-40"
                                placeholder={`示例格式：\n[\n  {\n    "dimension": "操作准确性",\n    "metric": "DATA_ACCURACY",\n    "points": 50,\n    "expected": {\n      "metricName": "电阻电流",\n      "targetValue": 0.5,\n      "tolerance": 0.05\n    }\n  }\n]`}
                              />
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4"><Label className="text-right pt-2">任务要求</Label><Textarea value={newAssignment.requirements} onChange={e => setNewAssignment({ ...newAssignment, requirements: e.target.value })} className="col-span-3" /></div>
                          </div>
                          <DialogFooter><Button onClick={handlePublishAssignment} disabled={publishAssignmentMutation.isPending}>{publishAssignmentMutation.isPending ? "发布中..." : "确认发布"}</Button></DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="teacherTasks" className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teacherTasks.map(task => (
                <Card key={task.id}>
                  <CardHeader><CardTitle>{task.taskName}</CardTitle><CardDescription>实验: {task.experimentTitle} | 班级: {task.className}</CardDescription></CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 mb-4">截止时间: {new Date(task.endTime).toLocaleString()}</p>
                    <Button className="w-full" asChild><Link href={`/virtual-lab/grading/${task.id}`}>查看提交与批改</Link></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {teacherTasks.length === 0 && <p className="text-center text-gray-500 py-16">您尚未发布任何任务。</p>}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
