// app/experiment-records/page.tsx
"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    BookOpen,
    Check,
    Clock,
    FlaskConical,
    User,
    Star,
    RotateCcw,
    FileText,
    Download
} from "lucide-react";

interface User {
    id: string;
    name: string;
    email: string;
    role: "student" | "teacher" | "admin";
}

interface ExperimentRecord {
    id: string;
    title: string;
    description: string;
    category: string;
    status: "completed" | "in-progress" | "not-started";
    progress: number;
    duration: number;
    rating?: number;
    assignedDate: string;
    dueDate: string;
    completedDate?: string;
    grade?: number;
    reportUrl?: string;
    assignmentId: string;
}

export default function ExperimentRecordsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [records, setRecords] = useState<ExperimentRecord[]>([]);
    const router = useRouter();

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (!userData) {
            router.push("/login");
            return;
        }

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // 模拟实验记录数据
        const mockRecords: ExperimentRecord[] = [
            {
                id: "1",
                title: "化学反应动力学",
                description: "研究化学反应速率与温度、浓度的关系",
                category: "化学",
                status: "completed",
                progress: 100,
                duration: 45,
                rating: 4.5,
                assignedDate: "2023-10-01",
                dueDate: "2023-10-15",
                completedDate: "2023-10-14",
                grade: 92,
                reportUrl: "/reports/report1.pdf",
                assignmentId: "a1"
            },
            {
                id: "2",
                title: "光的折射与反射",
                description: "探索光在不同介质中的传播规律",
                category: "物理",
                status: "in-progress",
                progress: 60,
                duration: 30,
                assignedDate: "2023-10-05",
                dueDate: "2023-10-20",
                assignmentId: "a2"
            },
            {
                id: "3",
                title: "细胞分裂观察",
                description: "使用显微镜观察细胞分裂的各个阶段",
                category: "生物",
                status: "not-started",
                progress: 0,
                duration: 60,
                assignedDate: "2023-10-10",
                dueDate: "2023-10-25",
                assignmentId: "a3"
            },
            {
                id: "4",
                title: "电路分析实验",
                description: "分析串联和并联电路的电流电压关系",
                category: "物理",
                status: "completed",
                progress: 100,
                duration: 40,
                rating: 4.3,
                assignedDate: "2023-09-20",
                dueDate: "2023-10-05",
                completedDate: "2023-10-03",
                grade: 88,
                reportUrl: "/reports/report4.pdf",
                assignmentId: "a4"
            }
        ];

        setRecords(mockRecords);
    }, [router]);

    const handleGoToExperiment = (id: string) => {
        router.push(`/virtual-lab?experimentId=${id}`);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
    }

    const completedRecords = records.filter(record => record.status === "completed");
    const inProgressRecords = records.filter(record => record.status === "in-progress");
    const notStartedRecords = records.filter(record => record.status === "not-started");

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">我的实验记录</h1>
                    <p className="text-gray-600">查看您已完成的实验和进行中的任务</p>
                </div>

                <Tabs defaultValue="all" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="all">全部记录</TabsTrigger>
                        <TabsTrigger value="completed">已完成</TabsTrigger>
                        <TabsTrigger value="in-progress">进行中</TabsTrigger>
                        <TabsTrigger value="not-started">未开始</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {records.map((record) => (
                                <RecordCard
                                    key={record.id}
                                    record={record}
                                    onGoToExperiment={handleGoToExperiment}
                                />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="completed">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {completedRecords.map((record) => (
                                <RecordCard
                                    key={record.id}
                                    record={record}
                                    onGoToExperiment={handleGoToExperiment}
                                />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="in-progress">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {inProgressRecords.map((record) => (
                                <RecordCard
                                    key={record.id}
                                    record={record}
                                    onGoToExperiment={handleGoToExperiment}
                                />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="not-started">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {notStartedRecords.map((record) => (
                                <RecordCard
                                    key={record.id}
                                    record={record}
                                    onGoToExperiment={handleGoToExperiment}
                                />
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function RecordCard({
                        record,
                        onGoToExperiment
                    }: {
    record: ExperimentRecord;
    onGoToExperiment: (id: string) => void;
}) {
    let statusBadge;
    switch (record.status) {
        case "completed":
            statusBadge = <Badge className="bg-green-600"><Check className="w-3 h-3 mr-1" />已完成</Badge>;
            break;
        case "in-progress":
            statusBadge = <Badge className="bg-yellow-500">进行中</Badge>;
            break;
        case "not-started":
            statusBadge = <Badge variant="secondary">未开始</Badge>;
            break;
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{record.title}</CardTitle>
                    {statusBadge}
                </div>
                <CardDescription>{record.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
                <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                        <FlaskConical className="w-4 h-4 mr-2" />
                        <span>{record.category}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>时长: {record.duration}分钟</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                        <User className="w-4 h-4 mr-2" />
                        <span>截止日期: {record.dueDate}</span>
                    </div>
                    {record.grade && (
                        <div className="flex items-center text-sm text-gray-500">
                            <Star className="w-4 h-4 mr-2 text-yellow-400" />
                            <span>成绩: {record.grade}分</span>
                        </div>
                    )}
                </div>

                {record.status === "in-progress" && (
                    <div className="mt-auto">
                        <div className="flex justify-between text-sm mb-2">
                            <span>进度</span>
                            <span>{record.progress}%</span>
                        </div>
                        <Progress value={record.progress} />
                        <Button
                            className="w-full mt-4"
                            onClick={() => onGoToExperiment(record.id)}
                        >
                            继续实验
                        </Button>
                    </div>
                )}

                {record.status === "not-started" && (
                    <Button
                        className="w-full mt-4"
                        onClick={() => onGoToExperiment(record.id)}
                    >
                        开始实验
                    </Button>
                )}

                {record.status === "completed" && (
                    <div className="mt-auto space-y-3">
                        <div className="flex justify-between text-sm">
                            <span>完成日期:</span>
                            <span>{record.completedDate}</span>
                        </div>

                        {record.reportUrl && (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => window.open(record.reportUrl, '_blank')}
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                查看实验报告
                            </Button>
                        )}

                        <Button
                            variant="default"
                            className="w-full"
                            onClick={() => onGoToExperiment(record.id)}
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            重新实验
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}