// app/virtual-lab/reports/[reportId]/page.tsx
"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Descriptions, Form, Input, Button, Spin, message } from 'antd';

const { TextArea } = Input;

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

const ReportDetailPage = ({ params }: { params: { reportId: string } }) => {
    const reportId = params.reportId;
    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();
    const router = useRouter();

    useEffect(() => {
        fetchReport();
    }, [reportId]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `http://localhost:8080/api/v1/teaching/reports/${reportId}`
            );
            const result = await response.json();
            if (result.success) {
                setReport(result.data);
                // 如果已有评分，设置表单初始值
                if (result.data.grade) {
                    form.setFieldsValue({
                        manualScore: result.data.grade.manualScore,
                        feedback: result.data.grade.feedback,
                    });
                }
            } else {
                message.error('获取报告详情失败: ' + result.message);
            }
        } catch (error: any) {
            message.error('请求失败: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitGrade = async (values: { manualScore: number; feedback: string }) => {
        try {
            setSubmitting(true);
            const response = await fetch(
                `http://localhost:8080/api/v1/teaching/reports/${reportId}/grade`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        manualScore: values.manualScore,
                        feedback: values.feedback,
                    }),
                }
            );

            const result = await response.json();
            if (result.success) {
                message.success('评分提交成功');
                // 刷新报告数据
                fetchReport();
            } else {
                message.error('评分提交失败: ' + result.message);
            }
        } catch (error: any) {
            message.error('请求失败: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!report) return <Spin spinning={loading} fullscreen />;

    return (
        <div className="p-6">
            {/* 返回按钮使用任务ID */}
            <Button onClick={() => router.push(`/virtual-lab/grading/${report.task.id}`)} className="mb-4">
                返回报告列表
            </Button>

            <Spin spinning={loading}>
                <Card title="学生信息" className="mb-4">
                    <Descriptions bordered>
                        <Descriptions.Item label="姓名">{report.student.realName}</Descriptions.Item>
                        <Descriptions.Item label="学号">{report.student.username}</Descriptions.Item>
                        <Descriptions.Item label="提交时间">{report.submitTime}</Descriptions.Item>
                        <Descriptions.Item label="报告状态" span={3}>
              <span className={`font-medium ${
                  report.status === '已提交' ? 'text-blue-600' :
                      report.status === '已批改' ? 'text-green-600' : 'text-gray-600'
              }`}>
                {report.status}
              </span>
                        </Descriptions.Item>
                    </Descriptions>
                </Card>

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

                <Card title="报告内容" className="mb-4">
                    <div className="mb-4">
                        <h3 className="font-medium mb-2">自动生成内容</h3>
                        <div className="p-4 bg-gray-50 rounded">
                            <pre>{JSON.stringify(report.autoContent, null, 2)}</pre>
                        </div>
                    </div>

                    <div className="mb-4">
                        <h3 className="font-medium mb-2">手动填写内容</h3>
                        <div className="p-4 bg-gray-50 rounded whitespace-pre-line">
                            {report.manualContent || '无手动填写内容'}
                        </div>
                    </div>

                    {report.attachments && report.attachments.length > 0 && (
                        <div>
                            <h3 className="font-medium mb-2">附件</h3>
                            <div className="flex flex-wrap gap-2">
                                {report.attachments.map((file, index) => (
                                    <a
                                        key={index}
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                    >
                                        {file.name}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>

                <Card title="报告批改" className="mb-4">
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmitGrade}
                        initialValues={{
                            manualScore: report.grade?.manualScore || 0,
                            feedback: report.grade?.feedback || '',
                        }}
                    >
                        <Form.Item
                            label="手动评分"
                            name="manualScore"
                            rules={[
                                { required: true, message: '请输入手动评分' },
                                { type: 'number', min: 0, max: 100, message: '评分必须在0-100之间' }
                            ]}
                        >
                            <Input
                                type="number"
                                min={0}
                                max={100}
                                step={0.5}
                                suffix="分"
                            />
                        </Form.Item>

                        <div className="mb-4">
                            <p className="font-medium mb-2">自动评分</p>
                            <div className="text-xl font-semibold">
                                {report.autoScore || 0} 分
                            </div>
                        </div>

                        {report.grade?.finalScore && (
                            <div className="mb-4">
                                <p className="font-medium mb-2">最终成绩</p>
                                <div className="text-2xl font-bold text-blue-600">
                                    {report.grade.finalScore} 分
                                </div>
                            </div>
                        )}

                        <Form.Item
                            label="评语反馈"
                            name="feedback"
                            rules={[{ max: 500, message: '评语不能超过500个字符' }]}
                        >
                            <TextArea rows={4} placeholder="请输入评语反馈..." />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={submitting}
                                className="mr-2"
                            >
                                {report.grade ? '更新评分' : '提交评分'}
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