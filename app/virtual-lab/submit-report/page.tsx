"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery, useMutation, QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query"

// UI & Icons (imports remain the same)
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { FlaskConical, ArrowLeft, Loader2, Download, Save, Send, Upload, FileText, Trash, AlertCircle, CheckCircle } from 'lucide-react'


// =================================================================
// API层与类型定义
// =================================================================

const API_BASE_URL = "http://localhost:8080/api/v1/teaching";
// ✅ FIX 2: 添加缺失的常量
const RESOURCE_BASE_URL = "http://localhost:8080";

// --- 类型定义 ---
interface Student { id: number; realName: string; }
interface TaskInfo { id: number; taskName: string; endTime: string; experiment: { title: string; subject: string; }; taskRequirements: string; }
interface AutoContent { summary: string; reportTitle: string; keyDataPoints: Record<string, any>; actionTimeline: { time: string; action: string }[];[key: string]: any; }
// ✅ FIX 3: 补全 UploadedFile 接口
interface UploadedFile { id: string; fileName: string; fileURL: string; resourceType: string; description: string; }
interface MyReportData { id: number; status: "DRAFT" | "SUBMITTED" | "GRADED"; student: Student; task: TaskInfo; autoContent: AutoContent | null; manualContent: string | null; attachments: UploadedFile[] | null; }
interface ReportSubmission {
    taskId: string;
    manualContent: string;
    attachmentsRids: number[]; // 只包含附件ID的数字数组
    isSubmitted: boolean;
}
// ✅ FIX 5: 为 uploadFile 的变量定义一个类型
type UploadFileVariables = { file: File; userName: string; description: string };

const getAuthToken = () => localStorage.getItem("accessToken");

// --- API 函数 ---
const fetchMyReportData = async (taskId: string): Promise<MyReportData> => {
    // ... (此函数无改动)
    const token = getAuthToken()
    if (!token) throw new Error("用户未登录")
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/my-report`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
        if (response.status === 404) throw new Error("尚未开始此实验任务，无法提交报告。");
        throw new Error("获取报告数据失败");
    }
    const res = await response.json();
    if (!res.success) throw new Error(res.message || "获取报告数据失败");
    return res.data;
};

const saveOrSubmitReport = async (submission: ReportSubmission): Promise<void> => {
    const token = getAuthToken();
    if (!token) throw new Error("用户未登录");

    // 构造与后端 ReportSubmitDTO 完全匹配的请求体
    const body = {
        manualContent: submission.manualContent,
        attachmentsRids: submission.attachmentsRids,
        isSubmitted: submission.isSubmitted,
    };

    const response = await fetch(`${API_BASE_URL}/tasks/${submission.taskId}/my-report`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || (submission.isSubmitted ? "提交报告失败" : "保存草稿失败"));
    }
};

// ✅ FIX 3: 添加缺失的 getFileType 函数
const getFileType = (fileName: string): string => {
    const extension = fileName.split(".").pop()?.toLowerCase() || '';
    if (['pdf'].includes(extension)) return 'PDF';
    if (['doc', 'docx'].includes(extension)) return 'DOC';
    // ... 其他文件类型
    return 'OTHER';
}

// ✅ FIX 5: 修改 uploadFile 函数以接收单个对象参数
const uploadFile = async ({ file, userName, description }: UploadFileVariables): Promise<UploadedFile> => {
    const token = getAuthToken()
    if (!token) throw new Error("用户未登录")

    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", "REPORT_ATTACHMENT")

    const response = await fetch(`${RESOURCE_BASE_URL}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
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

// =================================================================
// 子组件
// =================================================================

// === 组件: TaskDetailsCard === (无改动)
const TaskDetailsCard: React.FC<{ task: TaskInfo }> = ({ task }) => {
    const daysRemaining = useMemo(() => {
        const endDate = new Date(task.endTime);
        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }, [task.endTime]);

    const isOverdue = daysRemaining === 0 && new Date() > new Date(task.endTime);

    return (
        <Card className="mb-6">
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <CardTitle className="flex items-center text-2xl">
                            <FlaskConical className="w-6 h-6 mr-3 text-blue-600" />
                            {task.taskName}
                        </CardTitle>
                        <CardDescription className="mt-2 ml-9">
                            实验: {task.experiment.title} | 学科: {task.experiment.subject}
                        </CardDescription>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                        <Badge variant={isOverdue ? "destructive" : daysRemaining <= 3 ? "secondary" : "default"}>
                            {isOverdue ? "已截止" : `剩余 ${daysRemaining} 天`}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-1">
                            截止时间: {new Date(task.endTime).toLocaleString()}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <h4 className="font-medium text-gray-800 mb-2">任务要求:</h4>
                <div className="bg-gray-50 p-4 rounded-md border">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                        {task.taskRequirements}
                    </pre>
                </div>
            </CardContent>
        </Card>
    );
};
// === 组件: EditReportTab ===
// ✅ FIX 4: 明确可编辑字段的类型
type EditableAutoContentField = 'reportTitle' | 'summary';

const EditReportTab: React.FC<{
    report: AutoContent;
    onEdit: (field: EditableAutoContentField, value: string) => void;
}> = ({ report, onEdit }) => {

    return (
        <div className="space-y-6">
            {/* 卡片1: 编辑基本信息 (无改动) */}
            <Card>
                <CardHeader>
                    <CardTitle>编辑报告核心内容</CardTitle>
                    <CardDescription>您可以修改AI生成的报告标题和摘要。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="reportTitle">报告标题</Label>
                        <Input
                            id="reportTitle"
                            value={report.reportTitle || ''}
                            onChange={(e) => onEdit('reportTitle', e.target.value)}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="summary">内容摘要</Label>
                        <Textarea
                            id="summary"
                            value={report.summary || ''}
                            onChange={(e) => onEdit('summary', e.target.value)}
                            className="mt-1 min-h-[120px]"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 卡片2: 展示关键数据点 */}
            <Card>
                <CardHeader>
                    <CardTitle>关键数据点分析</CardTitle>
                    <CardDescription>以下是系统根据您的实验日志自动分析得出的数据，仅供查阅。</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* ✅ FIX: 在调用 Object.entries 之前，提供一个空对象 {} 作为默认值 */}
                        {Object.entries(report.keyDataPoints || {}).map(([key, value]) => (
                            <div key={key} className="p-4 bg-gray-50 border rounded-lg">
                                <p className="font-semibold text-gray-700">{key}</p>
                                {typeof value === 'object' && value !== null ? (
                                    <div className="pl-4 mt-2 text-sm space-y-1">
                                        {Object.entries(value).map(([subKey, subValue]) => (
                                            <div key={subKey} className="flex justify-between">
                                                <span className="text-gray-600">{subKey}:</span>
                                                <span className="font-mono font-medium text-gray-900">{String(subValue)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-2xl font-bold font-mono text-gray-900 mt-1">{String(value)}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* 卡片3: 展示操作时间线 */}
            <Card>
                <CardHeader>
                    <CardTitle>关键操作时间线</CardTitle>
                    <CardDescription>记录了您在实验中的主要操作步骤。</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {/* ✅ FIX: 在调用 .map 之前，提供一个空数组 [] 作为默认值 */}
                        {(report.actionTimeline || []).map((event, index) => (
                            <li key={index} className="flex items-start p-2 border-b last:border-b-0">
                                <CheckCircle className="w-4 h-4 mr-3 mt-1 text-green-500 flex-shrink-0" />
                                <div className="flex-grow">
                                    <p className="font-medium text-gray-800">{event.action}</p>
                                    <p className="text-xs text-gray-500">{new Date(event.time).toLocaleString()}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
// === 组件: SubmissionTab === (无改动)
const SubmissionTab: React.FC<{
    manualContent: string;
    onManualContentChange: (value: string) => void;
    attachments: UploadedFile[];
    uploadingFiles: string[];
    onFileUpload: (files: FileList) => void;
    onRemoveAttachment: (id: string) => void;
    isSubmitted: boolean;
}> = ({
    manualContent,
    onManualContentChange,
    attachments,
    uploadingFiles,
    onFileUpload,
    onRemoveAttachment,
    isSubmitted
}) => {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>补充内容</CardTitle>
                        <CardDescription>您可以在此添加AI生成内容之外的个人心得、讨论或观察记录。</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={manualContent}
                            onChange={e => onManualContentChange(e.target.value)}
                            placeholder="请输入补充内容..."
                            className="min-h-[200px]"
                            disabled={isSubmitted}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>附件管理</CardTitle>
                        <CardDescription>上传与本次实验相关的辅助文件，如截图、数据表格等。</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!isSubmitted && (
                            <div className="mb-4">
                                <Label
                                    htmlFor="file-upload"
                                    className="cursor-pointer inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium bg-white hover:bg-gray-50"
                                >
                                    <Upload className="w-4 h-4 mr-2" />选择文件
                                </Label>
                                <input
                                    id="file-upload"
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => e.target.files && onFileUpload(e.target.files)}
                                />
                                <p className="text-xs text-gray-500 mt-2">支持PDF、Word、图片等格式，单个文件建议不超过10MB。</p>
                            </div>
                        )}

                        {/* 正在上传的文件列表 */}
                        {uploadingFiles.length > 0 && (
                            <div className="space-y-2 my-4">
                                {uploadingFiles.map(fileName => (
                                    <div key={fileName} className="flex items-center p-2 border rounded-md bg-blue-50">
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-500" />
                                        <span className="text-sm text-blue-700">{fileName} (上传中...)</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 已上传的附件列表 */}
                        {attachments.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-gray-600">已上传附件:</h3>
                                {attachments.map(file => (
                                    <div key={file.id} className="flex items-center justify-between p-2 border rounded-md bg-gray-50">
                                        <a href={file.fileURL} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline text-sm">
                                            <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                                            {file.fileName}
                                        </a>
                                        {!isSubmitted && (
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRemoveAttachment(file.id)}>
                                                <Trash className="w-4 h-4 text-red-500" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {attachments.length === 0 && uploadingFiles.length === 0 && (
                            <p className="text-sm text-gray-400">暂无附件</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    };
// =================================================================
// 页面主组件
// =================================================================
function SubmitReportPageComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const taskId = searchParams.get("taskId");

    // --- State Management ---
    const [manualContent, setManualContent] = useState("");
    const [attachments, setAttachments] = useState<UploadedFile[]>([]);
    const [editableReport, setEditableReport] = useState<AutoContent | null>(null);
    const [activeTab, setActiveTab] = useState("edit");
    // ✅ 包含了第一步的修复
    const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);

    // --- Data Fetching ---
    const { data, isLoading, error } = useQuery({
        queryKey: ["myReport", taskId],
        queryFn: () => fetchMyReportData(taskId!),
        enabled: !!taskId,
    });

    // --- State Initialization Effect ---
    useEffect(() => {
        if (data) {
            setManualContent(data.manualContent || "");
            setAttachments(data.attachments || []);
            setEditableReport(data.autoContent ? { ...data.autoContent } : null);
            if (data.status !== "DRAFT") {
                setActiveTab("submit");
            }
        }
    }, [data]);

    const isSubmitted = data?.status === "SUBMITTED" || data?.status === "GRADED";

    // --- Mutations ---
    const uploadMutation = useMutation<UploadedFile, Error, UploadFileVariables>({
        mutationFn: uploadFile,
        onSuccess: (newFile) => {
            setAttachments(prev => [...prev, newFile]);
            setUploadingFiles(prev => prev.filter(name => name !== newFile.fileName));
        },
        onError: (error, variables) => {
            setUploadingFiles(prev => prev.filter(name => name !== variables.file.name));
            alert(`文件 ${variables.file.name} 上传失败: ${error.message}`);
        }
    });
    const saveOrSubmitMutation = useMutation({
        mutationFn: saveOrSubmitReport, onSuccess: (_, vars) => {
            alert(vars.isSubmitted ? "报告提交成功！" : "草稿保存成功");
            queryClient.invalidateQueries({ queryKey: ["myReport", taskId] });
            if (vars.isSubmitted) router.push("/virtual-lab");
        }
    });

    // --- Event Handlers ---
    const handleEditReport = (field: EditableAutoContentField, value: string) => setEditableReport(prev => prev ? { ...prev, [field]: value } : null);

    const handleFileUpload = (files: FileList) => {
        if (!data) return;
        Array.from(files).forEach(file => {
            setUploadingFiles(prev => [...prev, file.name]);
            uploadMutation.mutate({
                file: file,
                userName: data.student.realName,
                description: `附件 - ${file.name}`
            });
        });
    };

    const handleRemoveAttachment = (fileId: string) => setAttachments(prev => prev.filter(f => f.id !== fileId));

    const handleSaveOrSubmit = (isSubmitting: boolean) => {
        if (!taskId) return;
        if (isSubmitting && !window.confirm("确定要提交报告吗？提交后将无法修改。")) return;

        // 从 attachments 状态（对象数组）中提取出ID列表（数字数组）
        const attachmentIds = attachments.map(att => Number(att.id));

        saveOrSubmitMutation.mutate({
            taskId,
            manualContent,
            attachmentsRids: attachmentIds, // 传递ID列表
            isSubmitted: isSubmitting,
        });
    };

    // --- Render Logic ---
    if (isLoading) return <div className="p-8"><Skeleton className="w-full h-[600px]" /></div>;
    if (error) return <Alert variant="destructive" className="m-8"><AlertTitle>加载错误</AlertTitle><AlertDescription>{error.message}</AlertDescription></Alert>;
    if (!data) return <Alert className="m-8">未找到报告数据。</Alert>;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />返回</Button>
                <TaskDetailsCard task={data.task} />

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="edit" disabled={isSubmitted}><FileText className="w-4 h-4 mr-2" />查看与编辑报告</TabsTrigger>
                        <TabsTrigger value="submit"><Send className="w-4 h-4 mr-2" />补充与提交</TabsTrigger>
                    </TabsList>

                    <TabsContent value="edit" className="mt-6">
                        {editableReport ? <EditReportTab report={editableReport} onEdit={handleEditReport} /> : <Alert><AlertDescription>该实验无自动生成内容，请直接前往“补充与提交”标签页填写。</AlertDescription></Alert>}
                    </TabsContent>

                    <TabsContent value="submit" className="mt-6">
                        <SubmissionTab
                            manualContent={manualContent}
                            onManualContentChange={setManualContent}
                            attachments={attachments}
                            uploadingFiles={uploadingFiles}
                            onFileUpload={handleFileUpload}
                            onRemoveAttachment={handleRemoveAttachment}
                            isSubmitted={isSubmitted}
                        />
                    </TabsContent>
                </Tabs>

                <div className="mt-8 flex justify-end gap-4">
                    {!isSubmitted ? (
                        <>
                            <Button variant="outline" onClick={() => handleSaveOrSubmit(false)} disabled={saveOrSubmitMutation.isPending}>
                                {saveOrSubmitMutation.isPending && !saveOrSubmitMutation.variables?.isSubmitted ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                保存草稿
                            </Button>
                            <Button onClick={() => handleSaveOrSubmit(true)} disabled={saveOrSubmitMutation.isPending}>
                                {saveOrSubmitMutation.isPending && saveOrSubmitMutation.variables?.isSubmitted ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                最终提交
                            </Button>
                        </>
                    ) : (
                        <Badge variant="secondary" className="text-lg p-4"><CheckCircle className="w-5 h-5 mr-2" />报告已提交</Badge>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Page Wrapper ---
export default function SubmitReportPageWrapper() {
    const [queryClient] = useState(() => new QueryClient());
    return (
        <QueryClientProvider client={queryClient}>
            <SubmitReportPageComponent />
        </QueryClientProvider>
    )
}