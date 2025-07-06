import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function SubmitReportLoading() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* 页面头部 */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <Skeleton className="h-10 w-20 mr-4" />
                        <div>
                            <Skeleton className="h-8 w-48 mb-2" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                    </div>
                </div>

                {/* 任务信息卡片 */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <Skeleton className="h-6 w-64 mb-2" />
                                <Skeleton className="h-4 w-80" />
                            </div>
                            <div className="text-right">
                                <Skeleton className="h-6 w-20 mb-1" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-20 mb-2" />
                        <div className="bg-gray-50 p-3 rounded-md">
                            <Skeleton className="h-16 w-full" />
                        </div>
                    </CardContent>
                </Card>

                {/* 标签页 */}
                <div className="space-y-6">
                    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                    </div>

                    {/* 内容区域 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-24" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <Skeleton className="h-5 w-48 mb-2" />
                                        <Skeleton className="h-4 w-full mb-1" />
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-6 w-16 mt-2" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-24 mb-2" />
                                <Skeleton className="h-4 w-full" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Skeleton className="h-4 w-32 mb-2" />
                                    <Skeleton className="h-32 w-full" />
                                </div>
                                <div className="flex gap-2">
                                    <Skeleton className="h-10 flex-1" />
                                    <Skeleton className="h-10 w-32" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
