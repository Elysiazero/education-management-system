"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil, Save, Shield, GraduationCap, Users } from "lucide-react"

interface UserInterface {
    id: string
    name: string
    email: string
    role: "student" | "teacher" | "admin"
    avatar?: string
}

export default function ProfilePage() {
    const [user, setUser] = useState<UserInterface | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const router = useRouter()

    useEffect(() => {
        const userData = localStorage.getItem("user")
        if (!userData) {
            router.push("/login")
            return
        }

        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        setName(parsedUser.name)
        setEmail(parsedUser.email)
    }, [router])

    const getRoleIcon = (role: string) => {
        switch (role) {
            case "admin":
                return <Shield className="w-4 h-4" />
            case "teacher":
                return <GraduationCap className="w-4 h-4" />
            case "student":
                return <Users className="w-4 h-4" />
            default:
                return <Users className="w-4 h-4" />
        }
    }

    const getRoleLabel = (role: string) => {
        switch (role) {
            case "admin":
                return "系统管理员"
            case "teacher":
                return "教师"
            case "student":
                return "学生"
            default:
                return "用户"
        }
    }

    const handleSaveProfile = () => {
        if (!user) return

        const updatedUser = {
            ...user,
            name,
            email
        }

        localStorage.setItem("user", JSON.stringify(updatedUser))
        setUser(updatedUser)
        setIsEditing(false)

        // 在实际应用中，这里应该调用API更新服务器数据
        console.log("Profile updated:", updatedUser)
    }

    if (!user) {
        return <div className="flex justify-center items-center h-screen">加载中...</div>
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header - 与主页保持一致 */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-900">教育管理系统</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            {/* 省略搜索和通知中心等代码，与主页一致 */}
                            <div className="flex items-center space-x-3">
                                <Avatar>
                                    <AvatarImage src={user.avatar || "/placeholder.svg"} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="hidden md:block">
                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                    <div className="flex items-center space-x-1">
                                        {getRoleIcon(user.role)}
                                        <p className="text-xs text-gray-500">{getRoleLabel(user.role)}</p>
                                    </div>
                                </div>
                            </div>
                            {/* 省略退出按钮 */}
                        </div>
                    </div>
                </div>
            </header>

            {/* 个人中心内容 */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* 左侧个人信息卡片 */}
                    <div className="w-full md:w-1/3">
                        <Card className="sticky top-8">
                            <CardHeader className="items-center">
                                <Avatar className="w-24 h-24 mb-4">
                                    <AvatarImage src={user.avatar || "/placeholder.svg"} />
                                    <AvatarFallback className="text-2xl">
                                        {user.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <CardTitle className="text-xl">{user.name}</CardTitle>
                                <div className="flex items-center space-x-1 text-gray-600">
                                    {getRoleIcon(user.role)}
                                    <span>{getRoleLabel(user.role)}</span>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div>
                                    <Label className="text-gray-500">用户ID</Label>
                                    <p className="font-medium">{user.id}</p>
                                </div>

                                <div>
                                    <Label className="text-gray-500">邮箱</Label>
                                    <p className="font-medium">{user.email}</p>
                                </div>

                                <div>
                                    <Label className="text-gray-500">注册时间</Label>
                                    <p className="font-medium">2023年6月15日</p>
                                </div>

                                <Button variant="outline" className="w-full mt-4">
                                    更改头像
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 右侧编辑区域 */}
                    <div className="w-full md:w-2/3">
                        <Card>
                            <CardHeader className="flex-row justify-between items-center">
                                <CardTitle>个人资料</CardTitle>
                                {isEditing ? (
                                    <Button onClick={handleSaveProfile}>
                                        <Save className="mr-2 h-4 w-4" />
                                        保存更改
                                    </Button>
                                ) : (
                                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        编辑资料
                                    </Button>
                                )}
                            </CardHeader>

                            <CardContent>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <Label htmlFor="name">姓名</Label>
                                            {isEditing ? (
                                                <Input
                                                    id="name"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                />
                                            ) : (
                                                <p className="font-medium py-2">{name}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="email">电子邮箱</Label>
                                            {isEditing ? (
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                />
                                            ) : (
                                                <p className="font-medium py-2">{email}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="border-t pt-6">
                                        <h3 className="text-lg font-semibold mb-4">安全设置</h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium">密码</p>
                                                    <p className="text-sm text-gray-500">上次修改：3个月前</p>
                                                </div>
                                                <Button variant="outline">更改密码</Button>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium">双重认证</p>
                                                    <p className="text-sm text-gray-500">未启用</p>
                                                </div>
                                                <Button variant="outline">启用</Button>
                                            </div>
                                        </div>
                                    </div>

                                    {user.role === "student" && (
                                        <div className="border-t pt-6">
                                            <h3 className="text-lg font-semibold mb-4">学习偏好</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label>首选学习语言</Label>
                                                    <p className="font-medium">中文</p>
                                                </div>
                                                <div>
                                                    <Label>通知偏好</Label>
                                                    <p className="font-medium">仅重要通知</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* 活动记录卡片 */}
                        <Card className="mt-8">
                            <CardHeader>
                                <CardTitle>最近活动</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <div className="bg-blue-600 w-2 h-2 rounded-full mr-3"></div>
                                        <div>
                                            <p className="font-medium">登录系统</p>
                                            <p className="text-sm text-gray-500">今天 08:45</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="bg-green-600 w-2 h-2 rounded-full mr-3"></div>
                                        <div>
                                            <p className="font-medium">完成虚拟仿真实验</p>
                                            <p className="text-sm text-gray-500">昨天 14:23</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="bg-purple-600 w-2 h-2 rounded-full mr-3"></div>
                                        <div>
                                            <p className="font-medium">下载教学资源</p>
                                            <p className="text-sm text-gray-500">2025年10月12日</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}