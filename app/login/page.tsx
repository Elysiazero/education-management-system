"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GraduationCap, User, Shield, Eye, EyeOff, Smartphone, Mail, Key } from "lucide-react"

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    name: "",
    role: "student" as "student" | "teacher" | "admin",
    confirmPassword: "",
    verificationCode: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isSending, setIsSending] = useState(false)
  const router = useRouter()

  const handleSendVerificationCode = async () => {
    if (!formData.phone) {
      setError("请先输入手机号")
      return
    }

    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      setError("请输入有效的手机号")
      return
    }

    try {
      setIsSending(true)
      setError("")

      // 模拟发送验证码到后端
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 启动60秒倒计时
      setCountdown(60)
    } catch (err) {
      setError("发送验证码失败，请重试")
    } finally {
      setIsSending(false)
    }
  }

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (!isLogin) {
        // 注册逻辑
        if (formData.password !== formData.confirmPassword) {
          setError("密码确认不匹配")
          return
        }
        if (formData.password.length < 6) {
          setError("密码长度至少6位")
          return
        }
        if (!formData.verificationCode) {
          setError("请输入验证码")
          return
        }
      }

      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 创建用户对象
      const user = {
        id: Math.random().toString(36).substr(2, 9),
        name: isLogin ? formData.email.split("@")[0] : formData.name,
        email: formData.email,
        phone: formData.phone,
        role: isLogin ? formData.role : "admin", // 注册用户默认为管理员
        avatar: `/placeholder.svg?height=40&width=40`,
      }

      // 保存用户信息到localStorage
      localStorage.setItem("user", JSON.stringify(user))

      // 跳转到首页
      router.push("/")
    } catch (err) {
      setError("操作失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="w-4 h-4" />
      case "teacher":
        return <GraduationCap className="w-4 h-4" />
      case "student":
        return <User className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg rounded-2xl overflow-hidden border-0">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-2 w-full"></div>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4 mt-2 shadow-lg">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">教育管理系统</CardTitle>
            <CardDescription className="text-gray-500">{isLogin ? "登录您的账户" : "创建账户"}</CardDescription>
          </CardHeader>

          <CardContent className="pt-0">
            <Tabs value={isLogin ? "login" : "register"} onValueChange={(value) => setIsLogin(value === "login")}>
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-xl p-1">
                <TabsTrigger
                    value="login"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2 font-medium"
                >
                  登录
                </TabsTrigger>
                <TabsTrigger
                    value="register"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-2 font-medium"
                >
                  注册
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="pt-4">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center text-gray-700">
                      <Mail className="w-4 h-4 mr-2" />
                      邮箱
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="请输入邮箱"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="py-5 px-4 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center text-gray-700">
                      <Key className="w-4 h-4 mr-2" />
                      密码
                    </Label>
                    <div className="relative">
                      <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="请输入密码"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                          className="py-5 px-4 rounded-xl"
                      />
                      <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5 text-gray-500" /> : <Eye className="w-5 h-5 text-gray-500" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="flex items-center text-gray-700">
                      {getRoleIcon(formData.role)}
                      <span className="ml-2">身份</span>
                    </Label>
                    <Select
                        value={formData.role}
                        onValueChange={(value: "student" | "teacher" | "admin") =>
                            setFormData({ ...formData, role: value })
                        }
                    >
                      <SelectTrigger className="py-5 px-4 rounded-xl">
                        <SelectValue placeholder="选择身份" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>学生</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="teacher">
                          <div className="flex items-center space-x-2">
                            <GraduationCap className="w-4 h-4" />
                            <span>教师</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4" />
                            <span>系统管理员</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {error && (
                      <Alert variant="destructive" className="rounded-xl">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                  )}

                  <Button type="submit" className="w-full py-6 rounded-xl text-base" disabled={loading}>
                    {loading ? (
                        <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      登录中...
                    </span>
                    ) : "登录"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="pt-4">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center text-gray-700">
                      <User className="w-4 h-4 mr-2" />
                      姓名
                    </Label>
                    <Input
                        id="name"
                        type="text"
                        placeholder="请输入姓名"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="py-5 px-4 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center text-gray-700">
                      <Mail className="w-4 h-4 mr-2" />
                      邮箱
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="请输入邮箱"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="py-5 px-4 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center text-gray-700">
                      <Smartphone className="w-4 h-4 mr-2" />
                      手机号
                    </Label>
                    <Input
                        id="phone"
                        type="tel"
                        placeholder="请输入手机号"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        className="py-5 px-4 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="verificationCode" className="flex items-center text-gray-700">
                      <Key className="w-4 h-4 mr-2" />
                      短信验证码
                    </Label>
                    <div className="flex space-x-2">
                      <Input
                          id="verificationCode"
                          type="text"
                          placeholder="请输入验证码"
                          value={formData.verificationCode}
                          onChange={(e) => setFormData({ ...formData, verificationCode: e.target.value })}
                          required
                          className="py-5 px-4 rounded-xl flex-1"
                      />
                      <Button
                          type="button"
                          onClick={handleSendVerificationCode}
                          disabled={isSending || countdown > 0}
                          className="py-5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                      >
                        {isSending ? (
                            <span className="flex items-center">
                          <svg className="animate-spin h-4 w-4 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          发送中
                        </span>
                        ) : countdown > 0 ? (
                            `${countdown}秒后重发`
                        ) : "获取验证码"}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center text-gray-700">
                      <Key className="w-4 h-4 mr-2" />
                      密码
                    </Label>
                    <div className="relative">
                      <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="请输入密码（至少6位）"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                          className="py-5 px-4 rounded-xl"
                      />
                      <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5 text-gray-500" /> : <Eye className="w-5 h-5 text-gray-500" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="flex items-center text-gray-700">
                      <Key className="w-4 h-4 mr-2" />
                      确认密码
                    </Label>
                    <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="请再次输入密码"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        className="py-5 px-4 rounded-xl"
                    />
                  </div>

                  <div className="py-2 px-4 bg-blue-50 rounded-lg text-blue-700 flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-blue-600" />
                    <span>信息保护</span>
                  </div>

                  {error && (
                      <Alert variant="destructive" className="rounded-xl">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                  )}

                  <Button type="submit" className="w-full py-6 rounded-xl text-base" disabled={loading}>
                    {loading ? (
                        <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      注册中...
                    </span>
                    ) : "注册账户"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>© 2025 教育管理系统 | 让学习更高效</p>
            </div>
          </CardContent>
        </Card>
      </div>
  )
}