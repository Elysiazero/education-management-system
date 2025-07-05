"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

// 定义报告类型
interface Report {
    id: string
    studentId: string
    studentName: string
    submittedAt: string
    content: string
    autoContent?: string
    grade?: number
    feedback?: string
    status: "未提交" | "已提交" | "已批改"
    attachments?: Attachment[]
}

interface Attachment {
    id: string
    name: string
    url: string
    type: string
}

// 获取报告详情的函数
const fetchReport = async (reportId: string): Promise<Report> => {
    const token = localStorage.getItem("accessToken")
    if (!token) throw new Error('用户未登录')

    const response = await fetch(`http://localhost:8080/api/v1/reports/${reportId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) throw new Error('获取报告失败')
    const data = await response.json()
    return data.data
}

export default function ReportDetailPage() {
    const params = useParams()
    const reportId = params.reportId as string

    const { data: report, isLoading, error } = useQuery<Report>({
        queryKey: ['report', reportId],
        queryFn: () => fetchReport(reportId),
    })

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="flex items-center mb-6">
                        <Skeleton className="h-8 w-24" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-2">加载报告失败</h2>
                    <p className="mb-4">请检查网络连接后重试</p>
                    <Button asChild>
                        <Link href="/virtual-lab">返回实验列表</Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <Button asChild variant="ghost">
                        <Link href="/virtual-lab" className="flex items-center">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            返回实验列表
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>实验报告详情</CardTitle>
                        <div className="text-sm text-gray-600">
                            <p>学生: {report?.studentName}</p>
                            <p>提交时间: {report?.submittedAt ? new Date(report.submittedAt).toLocaleString() : '未提交'}</p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {report?.autoContent && (
                                <div>
                                    <Label>自动生成内容</Label>
                                    <div className="mt-1 p-4 bg-gray-100 rounded-md">
                                        {report.autoContent}
                                    </div>
                                </div>
                            )}

                            <div>
                                <Label>报告内容</Label>
                                <Textarea
                                    value={report?.content || ""}
                                    readOnly
                                    className="mt-1 min-h-[200px]"
                                />
                            </div>

                            <div>
                                <Label htmlFor="grade">成绩</Label>
                                <Input
                                    id="grade"
                                    type="number"
                                    value={report?.grade || ""}
                                    readOnly
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="feedback">教师反馈</Label>
                                <Textarea
                                    id="feedback"
                                    value={report?.feedback || ""}
                                    readOnly
                                    className="mt-1 min-h-[100px]"
                                />
                            </div>

                            {report?.attachments && report.attachments.length > 0 && (
                                <div>
                                    <Label>附件</Label>
                                    <div className="mt-2 space-y-2">
                                        {report.attachments.map(attachment => (
                                            <div key={attachment.id} className="flex items-center p-3 border rounded-md">
                                                <a
                                                    href={attachment.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    {attachment.name}
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}