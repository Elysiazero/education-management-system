// app/virtual-lab/grading/[taskId]/page.jsx

"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Pagination, Button, Spin, message } from 'antd';
import Link from 'next/link';

interface Report {
    id: number;
    student: {
        realName: string;
        username: string;
    };
    submitTime: string;
    status: string;
}

interface PaginationProps {
    current: number;
    pageSize: number;
    total: number;
}

const ReportListPage = ({ params }: { params: { taskId: string } }) => {
    const taskId = params.taskId;
    const router = useRouter();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationProps>({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    useEffect(() => {
        fetchReports();
    }, [pagination.current, pagination.pageSize]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `http://localhost:8080/api/v1/teaching/tasks/${taskId}/reports?pageNum=${pagination.current}&pageSize=${pagination.pageSize}`
            );
            const result = await response.json();
            if (result.success) {
                setReports(result.data.records);
                setPagination({
                    ...pagination,
                    total: result.data.total,
                });
            } else {
                message.error('获取报告列表失败: ' + result.message);
            }
        } catch (error: any) {
            message.error('请求失败: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: '学生姓名',
            dataIndex: ['student', 'realName'],
            key: 'studentName',
        },
        {
            title: '学号',
            dataIndex: ['student', 'username'],
            key: 'studentId',
        },
        {
            title: '提交时间',
            dataIndex: 'submitTime',
            key: 'submitTime',
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
        },
        {
            title: '操作',
            key: 'action',
            render: (_: any, record: Report) => (
                <Link href={`/virtual-lab/reports/${record.id}`}>
                    <Button type="primary">批改报告</Button>
                </Link>
            ),
        },
    ];

    const handlePageChange = (page: number, pageSize: number) => {
        setPagination({
            ...pagination,
            current: page,
            pageSize,
        });
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">实验报告批改</h1>
                <Button onClick={() => router.back()}>返回任务列表</Button>
            </div>

            <Spin spinning={loading}>
                <Table
                    columns={columns}
                    dataSource={reports}
                    rowKey="id"
                    pagination={false}
                />

                <div className="mt-4 flex justify-end">
                    <Pagination
                        current={pagination.current}
                        pageSize={pagination.pageSize}
                        total={pagination.total}
                        onChange={handlePageChange}
                        showSizeChanger
                        showTotal={total => `共 ${total} 条记录`}
                    />
                </div>
            </Spin>
        </div>
    );
};

export default ReportListPage;