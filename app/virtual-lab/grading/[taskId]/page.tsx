"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Table, Pagination, Button, Spin, message, Tag } from "antd";
import type { TableProps } from "antd";
import Link from "next/link";
import { ArrowLeftOutlined } from "@ant-design/icons";

/* ===================== 类型定义 ===================== */
type ReportStatus = "DRAFT" | "SUBMITTED" | "GRADED";

interface Report {
    id: number;
    student: {
        realName: string;
        username: string;
    };
    submitTime: string;
    status: ReportStatus;
}

interface PaginationState {
    current: number;
    pageSize: number;
    total: number;
}

/* ===================== 组件主体 ===================== */
const ReportListPage: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const taskId = params?.taskId as string;

    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationState>({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    /* ---------- 获取数据 ---------- */
    const fetchReports = async () => {
        if (!taskId || isNaN(Number(taskId))) {
            message.error("无效的任务ID");
            setLoading(false);
            return;
        }

        const token = localStorage.getItem("accessToken");
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
                `http://localhost:8080/api/v1/teaching/tasks/${taskId}/reports?pageNum=${pagination.current}&pageSize=${pagination.pageSize}`,
                { headers }
            );
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const result = await res.json();
            if (result.success && result.data) {
                // 仅保留“已提交”或“已批改”的报告
                const submittedReports = result.data.records.filter(
                    (r: Report) => r.status === "SUBMITTED" || r.status === "GRADED"
                );
                setReports(submittedReports);
                setPagination((p) => ({ ...p, total: submittedReports.length }));
            } else {
                message.error(`获取报告列表失败: ${result.message || "未知错误"}`);
            }
        } catch (err: any) {
            console.error("API请求错误:", err);
            message.error(`请求失败: ${err.message || "未知错误"}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (taskId) fetchReports();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.current, pagination.pageSize, taskId]);

    /* ---------- 渲染工具 ---------- */
    const getStatusTag = (status: ReportStatus) => {
        switch (status) {
            case "DRAFT":
                return <Tag color="gold">草稿</Tag>;
            case "SUBMITTED":
                return <Tag color="blue">已提交</Tag>;
            case "GRADED":
                return <Tag color="green">已批改</Tag>;
            default:
                return <Tag>{status}</Tag>;
        }
    };

    const columns: TableProps<Report>["columns"] = [
        {
            title: "学生姓名",
            dataIndex: ["student", "realName"],
            key: "studentName",
            render: (name: string) => name || "N/A",
        },
        { title: "学号", dataIndex: ["student", "username"], key: "studentId" },
        {
            title: "提交时间",
            dataIndex: "submitTime",
            key: "submitTime",
            render: (t: string) => (t ? new Date(t).toLocaleString() : "未提交"),
        },
        { title: "状态", dataIndex: "status", key: "status", render: getStatusTag },
        {
            title: "操作",
            key: "action",
            render: (_, r) => (
                <Link href={`/virtual-lab/reports/${r.id}`}>
                    <Button type="primary">
                        {r.status === "GRADED" ? "查看/修改评分" : "批改报告"}
                    </Button>
                </Link>
            ),
        },
    ];

    const handlePageChange = (page: number, pageSize: number) =>
        setPagination({ ...pagination, current: page, pageSize });

    /* ---------- taskId 无效 ---------- */
    if (!taskId || isNaN(Number(taskId))) {
        return (
            <div className="p-6 bg-white rounded-lg shadow-md m-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">实验报告批改</h1>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => router.push("/virtual-lab")}
                    >
                        返回任务列表
                    </Button>
                </div>
                <div className="text-center py-12">
                    <p className="text-red-500 text-lg">无效的任务ID</p>
                    <Button
                        type="primary"
                        onClick={() => router.push("/virtual-lab")}
                        className="mt-4"
                    >
                        返回任务列表
                    </Button>
                </div>
            </div>
        );
    }

    /* ---------- 正常渲染 ---------- */
    return (
        <div className="p-6 bg-white rounded-lg shadow-md m-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">实验报告批改</h1>
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.push("/virtual-lab")}
                >
                    返回任务列表
                </Button>
            </div>

            <Spin spinning={loading}>
                <Table columns={columns} dataSource={reports} rowKey="id" pagination={false} />

                <div className="mt-6 flex justify-end">
                    <Pagination
                        current={pagination.current}
                        pageSize={pagination.pageSize}
                        total={pagination.total}
                        onChange={handlePageChange}
                        showSizeChanger
                        showTotal={(t) => `共 ${t} 条记录`}
                    />
                </div>
            </Spin>
        </div>
    );
};

export default ReportListPage;
