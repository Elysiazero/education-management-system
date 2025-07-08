"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    Card,
    Descriptions,
    Form,
    Input,
    InputNumber,
    Button,
    Spin,
    message,
} from "antd";
import { DownloadOutlined } from '@ant-design/icons';


const { TextArea } = Input;

/* ======================== 类型声明 ======================== */
// 后端API返回的原始报告结构
interface ApiReport {
    id: number;
    status: string;
    submitTime: string;
    student: Student;
    task: Task;
    autoContent: Record<string, any>;
    manualContent: string;
    attachments: string[][]; // 关键修正：类型为 string[][]
    grade?: Grade;
    autoScore?: number;
}

// 用于UI展示和交互的附件结构
interface UIAttachment {
    name: string; // 解析后的可读文件名
    url: string;  // 完整的下载URL
}

// 用于组件内部状态的报告结构
interface ReportForUI extends Omit<ApiReport, 'attachments'> {
    attachments: UIAttachment[]; // 附件被处理成UI友好的格式
}

interface Student {
    id: number;
    username: string;
    realName: string;
    avatarUrl: string;
}
interface Experiment {
    id: number;
    title: string;
    subject: string;
    difficulty: number;
    thumbnailUrl: string;
    createdAt: string;
}
interface Teacher {
    id: number;
    username: string;
    realName: string;
    avatarUrl: string;
}
interface Task {
    id: number;
    taskName: string;
    startTime: string;
    endTime: string;
    status: string;
    experiment: Experiment;
    taskRequirements: string;
    customParams: Record<string, any>;
    teacher: Teacher;
}
interface Grade {
    id?: number;
    autoScore?: number;
    manualScore?: number;
    finalScore?: number;
    feedback?: string;
    evaluator?: Teacher;
    evaluatedAt?: string;
}


/* ======================== 组件 ======================== */
const ReportDetailPage: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const reportId = params?.reportId as string;

    const [report, setReport] = useState<ReportForUI | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    /* ---------- 通用工具 ---------- */
    const getAuthToken = () =>
        typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    const API_BASE_URL = "http://localhost:8080/api/v1/teaching";
    const RESOURCE_BASE_URL = "http://localhost:8080";

    /* ---------- 拉取并格式化报告 ---------- */
    useEffect(() => {
        if (reportId) fetchAndNormalizeReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reportId]);

    const fetchAndNormalizeReport = async () => {
        if (!reportId || isNaN(Number(reportId))) {
            message.error("无效的报告ID");
            setLoading(false);
            return;
        }

        const token = getAuthToken();
        if (!token) {
            message.error("用户未登录，无法获取数据");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const headers = new Headers({
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            });

            const res = await fetch(`${API_BASE_URL}/reports/${reportId}`, { headers });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const result = await res.json();
            if (!result.success || !result.data)
                throw new Error(result.message || "获取报告详情失败");

            // **核心修正：数据格式化**
            const rawData: ApiReport = result.data;
            const attachmentsObjectKeys: string[] = (rawData.attachments || []).flat();
            const uiAttachments: UIAttachment[] = attachmentsObjectKeys.map(key => {
                const nameParts = key.split('_');
                // 从 objectKey 中解析出原始文件名
                const fileName = nameParts.length > 2 ? nameParts.slice(2).join('_') : key;
                return {
                    name: fileName,
                    url: `${RESOURCE_BASE_URL}/download-by-key?objectKey=${encodeURIComponent(key)}`
                };
            });

            setReport({ ...rawData, attachments: uiAttachments });
        } catch (err: any) {
            console.error("获取报告详情失败:", err);
            message.error(err.message || "未知错误");
        } finally {
            setLoading(false);
        }
    };

    /* ---------- report 变化后同步表单 ---------- */
    useEffect(() => {
        if (!report) return;
        form.setFieldsValue({
            manualScore: Number(report.grade?.manualScore ?? 0),
            feedback: report.grade?.feedback ?? "",
        });
    }, [report, form]);

    /**
     * @notice 处理带授权请求头的附件下载
     * @param attachment 要下载的附件对象
     */
    const handleDownloadAttachment = async (attachment: UIAttachment) => {
        const token = getAuthToken();
        if (!token) {
            message.error("请先登录！");
            return;
        }
        try {
            const response = await fetch(attachment.url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error(`下载文件失败: ${response.statusText}`);
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', attachment.name);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);

        } catch (error: any) {
            console.error("下载附件时出错:", error);
            message.error(error.message || "下载附件失败。");
        }
    };

    /* ---------- 提交评分 ---------- */
    const handleSubmitGrade = async (values: { manualScore: number; feedback: string }) => {
        if (!reportId || isNaN(Number(reportId))) {
            message.error("无效的报告ID");
            return;
        }

        const token = getAuthToken();
        if (!token) {
            message.error("用户未登录，无法提交评分");
            return;
        }

        try {
            setSubmitting(true);
            const headers = new Headers({
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            });

            const res = await fetch(
                `${API_BASE_URL}/reports/${reportId}/grade`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        manualScore: Number(values.manualScore),
                        feedback: values.feedback,
                    }),
                }
            );
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const result = await res.json();
            if (!result.success) throw new Error(result.message || "评分提交失败");

            message.success("评分提交成功");
            fetchAndNormalizeReport(); // 重新拉取
        } catch (err: any) {
            console.error("提交评分失败:", err);
            message.error(err.message || "未知错误");
        } finally {
            setSubmitting(false);
        }
    };

    /* ---------- Loading 状态 ---------- */
    if (loading) return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;

    /* ---------- 非法 ID 或未找到报告 ---------- */
    if (!report)
        return (
            <div className="p-6">
                <Button onClick={() => router.back()}>返回</Button>
                <Card className="mt-4" title="错误">
                    <p className="text-red-500">无法加载报告详情，或报告ID无效。</p>
                    <Button type="primary" onClick={fetchAndNormalizeReport} className="mt-2">
                        重新加载
                    </Button>
                </Card>
            </div>
        );

    /* ---------- 主体渲染 ---------- */
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <Button onClick={() => router.push(`/virtual-lab/grading/${report.task.id}`)} className="mb-4">
                返回报告列表
            </Button>

            <Spin spinning={submitting}>
                {/* 学生信息 */}
                <Card title="学生信息" className="mb-4 shadow-sm">
                    <Descriptions bordered size="small">
                        <Descriptions.Item label="姓名">{report.student.realName}</Descriptions.Item>
                        <Descriptions.Item label="学号">{report.student.username}</Descriptions.Item>
                        <Descriptions.Item label="提交时间">{new Date(report.submitTime).toLocaleString()}</Descriptions.Item>
                        <Descriptions.Item label="报告状态" span={3}>
                            <span
                                className={`font-medium ${report.status === "SUBMITTED" ? "text-blue-600" :
                                    report.status === "GRADED" ? "text-green-600" : "text-gray-600"
                                    }`}
                            >
                                {report.status === "SUBMITTED" ? "已提交" : report.status === "GRADED" ? "已批改" : report.status}
                            </span>
                        </Descriptions.Item>
                    </Descriptions>
                </Card>

                {/* 任务信息 */}
                <Card title="实验任务信息" className="mb-4 shadow-sm">
                    <Descriptions bordered size="small">
                        <Descriptions.Item label="任务名称">{report.task.taskName}</Descriptions.Item>
                        <Descriptions.Item label="实验名称">{report.task.experiment.title}</Descriptions.Item>
                        <Descriptions.Item label="截止时间">{new Date(report.task.endTime).toLocaleString()}</Descriptions.Item>
                        <Descriptions.Item label="任务要求" span={3}>
                            {report.task.taskRequirements}
                        </Descriptions.Item>
                    </Descriptions>
                </Card>

                {/* 报告正文 */}
                <Card title="报告内容" className="mb-4 shadow-sm">
                    <h3 className="font-medium mt-0 mb-2 text-gray-700">自动生成内容</h3>
                    <div className="p-4 bg-gray-100 rounded mb-4 font-mono text-sm">
                        <pre>{JSON.stringify(report.autoContent, null, 2)}</pre>
                    </div>

                    <h3 className="font-medium mb-2 text-gray-700">学生填写内容</h3>
                    <div className="p-4 bg-gray-100 rounded whitespace-pre-line mb-4">
                        {report.manualContent || <span className="text-gray-400">无</span>}
                    </div>

                    {!!report.attachments?.length && (
                        <>
                            <h3 className="font-medium mb-2 text-gray-700">学生附件</h3>
                            <div className="flex flex-wrap gap-2">
                                {report.attachments.map((file, idx) => (
                                    <Button
                                        key={idx}
                                        icon={<DownloadOutlined />}
                                        onClick={() => handleDownloadAttachment(file)}
                                    >
                                        {file.name}
                                    </Button>
                                ))}
                            </div>
                        </>
                    )}
                </Card>

                {/* 批改表单 */}
                <Card title="报告批改" className="shadow-sm">
                    <Form form={form} layout="vertical" onFinish={handleSubmitGrade}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Form.Item
                                label="手动评分"
                                name="manualScore"
                                rules={[
                                    { required: true, message: "请输入手动评分" },
                                    {
                                        validator: (_, value) =>
                                            value === undefined || value === null
                                                ? Promise.reject()
                                                : value < 0 || value > 100
                                                    ? Promise.reject("评分必须在 0-100 之间")
                                                    : Promise.resolve(),
                                    },
                                ]}
                            >
                                <InputNumber min={0} max={100} step={0.5} precision={1} addonAfter="分" style={{ width: "100%" }} />
                            </Form.Item>

                            <div>
                                <p className="font-medium mb-1 text-sm text-gray-600">自动评分</p>
                                <span className="text-xl font-semibold">{report.autoScore ?? 0} 分</span>
                            </div>

                            {report.grade?.finalScore !== undefined && (
                                <div>
                                    <p className="font-medium mb-1 text-sm text-gray-600">最终成绩</p>
                                    <span className="text-2xl font-bold text-blue-600">
                                        {report.grade.finalScore} 分
                                    </span>
                                </div>
                            )}
                        </div>

                        <Form.Item label="评语反馈" name="feedback" rules={[{ max: 500, message: "评语不能超过500个字符" }]}>
                            <TextArea rows={4} placeholder="请输入评语反馈…" />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={submitting} className="mr-2">
                                {report.grade ? "更新评分" : "提交评分"}
                            </Button>
                            <Button onClick={() => router.push(`/virtual-lab/grading/${report.task.id}`)}>
                                返回报告列表
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </Spin>
        </div>
    );
};

export default ReportDetailPage;
