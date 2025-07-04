"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil, Save, Shield, GraduationCap, Users, Lock } from "lucide-react"
import { toast } from "sonner"

interface UserInterface {
    id: string
    username: string
    realName: string
    email: string
    phoneNumber: string
    avatarUrl?: string
    roles: string[]
    permissions: string[]
}

interface ActivityLog {
    id: string
    action: string
    timestamp: string
}

export default function ProfilePage() {
    const [user, setUser] = useState<UserInterface | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [isEditingPassword, setIsEditingPassword] = useState(false)
    const [realName, setRealName] = useState("")
    const [email, setEmail] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [oldPassword, setOldPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const [avatarUrl, setAvatarUrl] = useState("")
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";

    useEffect(() => {
        const token = localStorage.getItem("accessToken")
        if (!token) {
            router.push("/login")
            return
        }

        fetchUserProfile(token)
        fetchActivityLogs(token)
    }, [router])

    const fetchUserProfile = async (token: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/me/profile`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })

            if (!response.ok) {
                throw new Error("获取用户信息失败")
            }

            const userData = await response.json()
            setUser(userData)
            setRealName(userData.realName)
            setEmail(userData.email)
            setPhoneNumber(userData.phoneNumber || "")
        } catch (error) {
            console.error("获取用户信息错误:", error)
            toast.error("获取用户信息失败")
            router.push("/login")
        }
    }

    const fetchActivityLogs = async (token: string) => {
        try {
            // 模拟活动日志数据
            const mockLogs = [
                { id: "1", action: "登录系统", timestamp: "今天 08:45" },
                { id: "2", action: "完成虚拟仿真实验", timestamp: "昨天 14:23" },
                { id: "3", action: "下载教学资源", timestamp: "2025年10月12日" }
            ]
            setActivityLogs(mockLogs)
        } catch (error) {
            console.error("获取活动日志错误:", error)
        }
    }

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

    const handleSaveProfile = async () => {
        if (!user) return

        const token = localStorage.getItem("accessToken")
        if (!token) {
            router.push("/login")
            return
        }

        try {
            const response = await fetch(`${API_BASE_URL}/me/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    realName,
                    email,
                    phoneNumber
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || "更新个人信息失败")
            }

            const updatedUser = {
                ...user,
                realName,
                email,
                phoneNumber
            }

            setUser(updatedUser)
            setIsEditing(false)
            toast.success("个人信息更新成功")
        } catch (error: any) {
            console.error("更新个人信息错误:", error)
            toast.error(error.message || "更新个人信息失败")
        }
    }

    const handleChangePassword = async () => {
        // 验证新密码是否匹配
        if (newPassword !== confirmPassword) {
            toast.error("新密码和确认密码不一致")
            return
        }

        // 验证新密码长度
        if (newPassword.length < 8 || newPassword.length > 32) {
            toast.error("密码长度必须在8到32位之间")
            return
        }

        // 验证旧密码是否输入
        if (!oldPassword) {
            toast.error("请输入当前密码")
            return
        }

        const token = localStorage.getItem("accessToken")
        if (!token) {
            router.push("/login")
            return
        }

        try {
            const response = await fetch(`${API_BASE_URL}/me/password`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    oldPassword,
                    newPassword
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || "修改密码失败")
            }

            // 密码修改成功后重置状态
            setIsEditingPassword(false)
            setOldPassword("")
            setNewPassword("")
            setConfirmPassword("")
            toast.success("密码修改成功")
        } catch (error: any) {
            console.error("修改密码错误:", error)
            toast.error(error.message || "修改密码失败，请检查当前密码")
        }
    }

    const handleAvatarUpload = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click()
        }
    }

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user) return

        // 验证文件类型
        if (!file.type.match(/image\/(jpeg|png|gif|webp)/)) {
            toast.error("请上传有效的图片格式 (JPEG, PNG, GIF, WEBP)")
            return
        }

        // 验证文件大小 (2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error("图片大小不能超过2MB")
            return
        }

        setIsUploading(true)
        const token = localStorage.getItem("accessToken")
        if (!token) {
            router.push("/login")
            return
        }

        try {
            // 创建图片URL（用于预览）
            const objectUrl = URL.createObjectURL(file)
            setAvatarUrl(objectUrl)  // 设置预览URL

            // 上传头像URL到服务器
            const response = await fetch(`${API_BASE_URL}/me/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    avatarUrl: objectUrl  // 改为传递URL而不是文件
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || "头像更新失败")
            }

            const userData = await response.json()
            setUser(userData)
            toast.success("头像更新成功")
        } catch (error: any) {
            console.error("头像上传错误:", error)
            toast.error(error.message || "头像更新失败")
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    if (!user) {
        return <div className="flex justify-center items-center h-screen">加载中...</div>
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-900">教育管理系统</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                                <Avatar>
                                    <AvatarImage src={user.avatarUrl || "/placeholder.svg"} />
                                    <AvatarFallback>{user.realName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="hidden md:block">
                                    <p className="text-sm font-medium text-gray-900">{user.realName}</p>
                                    <div className="flex items-center space-x-1">
                                        {user.roles.length > 0 && getRoleIcon(user.roles[0])}
                                        <p className="text-xs text-gray-500">
                                            {user.roles.length > 0 ? getRoleLabel(user.roles[0]) : "用户"}
                                        </p>
                                    </div>
                                </div>
                            </div>
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
                                    <AvatarImage src={avatarUrl || user.avatarUrl || "/placeholder.svg"} />
                                    <AvatarFallback className="text-2xl">
                                        {user.realName.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <CardTitle className="text-xl">{user.realName}</CardTitle>
                                <div className="flex items-center space-x-1 text-gray-600">
                                    {user.roles.length > 0 && getRoleIcon(user.roles[0])}
                                    <span>
                                        {user.roles.length > 0 ? getRoleLabel(user.roles[0]) : "用户"}
                                    </span>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div>
                                    <Label className="text-gray-500">用户ID</Label>
                                    <p className="font-medium">{user.id}</p>
                                </div>

                                <div>
                                    <Label className="text-gray-500">用户名</Label>
                                    <p className="font-medium">{user.username}</p>
                                </div>

                                <div>
                                    <Label className="text-gray-500">手机号</Label>
                                    <p className="font-medium">{phoneNumber || "未设置"}</p>
                                </div>

                                <div>
                                    <Label className="text-gray-500">注册时间</Label>
                                    <p className="font-medium">2023年6月15日</p>
                                </div>

                                <Button
                                    variant="outline"
                                    className="w-full mt-4"
                                    onClick={handleAvatarUpload}
                                    disabled={isUploading}
                                >
                                    {isUploading ? "上传中..." : "更改头像"}
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                />
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
                                            <Label htmlFor="realName">真实姓名</Label>
                                            {isEditing ? (
                                                <Input
                                                    id="realName"
                                                    value={realName}
                                                    onChange={(e) => setRealName(e.target.value)}
                                                />
                                            ) : (
                                                <p className="font-medium py-2">{realName}</p>
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

                                        <div>
                                            <Label htmlFor="phoneNumber">手机号码</Label>
                                            {isEditing ? (
                                                <Input
                                                    id="phoneNumber"
                                                    value={phoneNumber}
                                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                                />
                                            ) : (
                                                <p className="font-medium py-2">{phoneNumber || "未设置"}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="border-t pt-6">
                                        <h3 className="text-lg font-semibold mb-4">安全设置</h3>
                                        {isEditingPassword ? (
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="oldPassword">当前密码</Label>
                                                    <Input
                                                        id="oldPassword"
                                                        type="password"
                                                        value={oldPassword}
                                                        onChange={(e) => setOldPassword(e.target.value)}
                                                        placeholder="请输入当前密码"
                                                    />
                                                </div>

                                                <div>
                                                    <Label htmlFor="newPassword">新密码</Label>
                                                    <Input
                                                        id="newPassword"
                                                        type="password"
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        placeholder="8-32位字符"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="confirmPassword">确认新密码</Label>
                                                    <Input
                                                        id="confirmPassword"
                                                        type="password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        placeholder="再次输入新密码"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button onClick={handleChangePassword}>
                                                        <Save className="mr-2 h-4 w-4" />
                                                        保存密码
                                                    </Button>
                                                    <Button variant="outline" onClick={() => setIsEditingPassword(false)}>
                                                        取消
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-medium">密码</p>
                                                        <p className="text-sm text-gray-500">上次修改：3个月前</p>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setIsEditingPassword(true)}
                                                    >
                                                        更改密码
                                                    </Button>
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-medium">双重认证</p>
                                                        <p className="text-sm text-gray-500">未启用</p>
                                                    </div>
                                                    <Button variant="outline">启用</Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t pt-6">
                                        <h3 className="text-lg font-semibold mb-4">权限信息</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <Label>角色</Label>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {user.roles.map(role => (
                                                        <span key={role} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                                            {getRoleLabel(role)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <Label>权限</Label>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {user.permissions.map(permission => (
                                                        <span key={permission} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                                            {permission}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
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
                                    {activityLogs.map(log => (
                                        <div key={log.id} className="flex items-center">
                                            <div className="bg-blue-600 w-2 h-2 rounded-full mr-3"></div>
                                            <div>
                                                <p className="font-medium">{log.action}</p>
                                                <p className="text-sm text-gray-500">{log.timestamp}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}