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

const { TextArea } = Input;

/* ======================== 类型声明 ======================== */
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
interface Attachment {
    name: string;
    url: string;
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
interface Report {
    id: number;
    status: string;
    submitTime: string;
    student: Student;
    task: Task;
    autoContent: Record<string, any>;
    manualContent: string;
    attachments: Attachment[];
    grade?: Grade;
    autoScore?: number;
}

/* ======================== 组件 ======================== */
const ReportDetailPage: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const reportId = params?.reportId as string;

    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    /* ---------- 通用工具 ---------- */
    const getAuthToken = () =>
        typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    /* ---------- 拉取报告 ---------- */
    useEffect(() => {
        if (reportId) fetchReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reportId]);

    const fetchReport = async () => {
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

            const res = await fetch(
                `http://localhost:8080/api/v1/teaching/reports/${reportId}`,
                { headers }
            );
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const result = await res.json();
            if (!result.success || !result.data)
                throw new Error(result.message || "获取报告详情失败");

            setReport(result.data);
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
                `http://localhost:8080/api/v1/teaching/reports/${reportId}/grade`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        manualScore: Number(values.manualScore), // 强制数字
                        feedback: values.feedback,
                    }),
                }
            );
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const result = await res.json();
            if (!result.success) throw new Error(result.message || "评分提交失败");

            message.success("评分提交成功");
            fetchReport(); // 重新拉取
        } catch (err: any) {
            console.error("提交评分失败:", err);
            message.error(err.message || "未知错误");
        } finally {
            setSubmitting(false);
        }
    };

    /* ---------- Loading 状态 ---------- */
    if (loading) return <Spin spinning />; // 去掉 fullscreen，避免 sticky/fixed 警告

    /* ---------- 非法 ID ---------- */
    if (!reportId || isNaN(Number(reportId)))
        return (
            <div className="p-6">
                <Button onClick={() => router.back()}>返回</Button>
                <Card className="mt-4" title="报告详情">
                    <p className="text-red-500">无效的报告ID</p>
                </Card>
            </div>
        );

    if (!report)
        return (
            <div className="p-6">
                <Button onClick={() => router.back()}>返回</Button>
                <Card className="mt-4" title="报告详情">
                    <p className="text-red-500">无法加载报告详情</p>
                    <Button type="primary" onClick={fetchReport} className="mt-2">
                        重新加载
                    </Button>
                </Card>
            </div>
        );

    /* ---------- 主体渲染 ---------- */
    return (
        <div className="p-6">
            <Button onClick={() => router.push(`/virtual-lab/grading/${report.task.id}`)} className="mb-4">
                返回报告列表
            </Button>

            <Spin spinning={submitting}>
                {/* 学生信息 */}
                <Card title="学生信息" className="mb-4">
                    <Descriptions bordered>
                        <Descriptions.Item label="姓名">{report.student.realName}</Descriptions.Item>
                        <Descriptions.Item label="学号">{report.student.username}</Descriptions.Item>
                        <Descriptions.Item label="提交时间">{report.submitTime}</Descriptions.Item>
                        <Descriptions.Item label="报告状态" span={3}>
                            <span
                                className={`font-medium ${report.status === "已提交" ? "text-blue-600" :
                                        report.status === "已批改" ? "text-green-600" : "text-gray-600"
                                    }`}
                            >
                                {report.status}
                            </span>
                        </Descriptions.Item>
                    </Descriptions>
                </Card>

                {/* 任务信息 */}
                <Card title="实验任务信息" className="mb-4">
                    <Descriptions bordered>
                        <Descriptions.Item label="任务名称">{report.task.taskName}</Descriptions.Item>
                        <Descriptions.Item label="实验名称">{report.task.experiment.title}</Descriptions.Item>
                        <Descriptions.Item label="截止时间">{report.task.endTime}</Descriptions.Item>
                        <Descriptions.Item label="任务要求" span={3}>
                            {report.task.taskRequirements}
                        </Descriptions.Item>
                    </Descriptions>
                </Card>

                {/* 报告正文 */}
                <Card title="报告内容" className="mb-4">
                    <h3 className="font-medium mt-0 mb-2">自动生成内容</h3>
                    <div className="p-4 bg-gray-50 rounded mb-4">
                        <pre>{JSON.stringify(report.autoContent, null, 2)}</pre>
                    </div>

                    <h3 className="font-medium mb-2">手动填写内容</h3>
                    <div className="p-4 bg-gray-50 rounded whitespace-pre-line mb-4">
                        {report.manualContent || "无手动填写内容"}
                    </div>

                    {!!report.attachments?.length && (
                        <>
                            <h3 className="font-medium mb-2">附件</h3>
                            <div className="flex flex-wrap gap-2">
                                {report.attachments.map((file, idx) => (
                                    <a
                                        key={idx}
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                    >
                                        {file.name}
                                    </a>
                                ))}
                            </div>
                        </>
                    )}
                </Card>

                {/* 批改表单 */}
                <Card title="报告批改">
                    <Form form={form} layout="vertical" onFinish={handleSubmitGrade}>
                        <Form.Item
                            label="手动评分"
                            name="manualScore"
                            rules={[
                                { required: true, message: "请输入手动评分" },
                                {
                                    validator: (_, value) =>
                                        value === undefined || value === null
                                            ? Promise.reject("请输入手动评分")
                                            : value < 0 || value > 100
                                                ? Promise.reject("评分必须在 0-100 之间")
                                                : Promise.resolve(),
                                },
                            ]}
                        >
                            <InputNumber
                                min={0}
                                max={100}
                                step={0.5}
                                precision={1}
                                addonAfter="分"
                                style={{ width: "100%" }}
                            />
                        </Form.Item>

                        <div className="mb-4">
                            <p className="font-medium mb-1">自动评分</p>
                            <span className="text-xl font-semibold">{report.autoScore ?? 0} 分</span>
                        </div>

                        {report.grade?.finalScore !== undefined && (
                            <div className="mb-4">
                                <p className="font-medium mb-1">最终成绩</p>
                                <span className="text-2xl font-bold text-blue-600">
                                    {report.grade.finalScore} 分
                                </span>
                            </div>
                        )}

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
