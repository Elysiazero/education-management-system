"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Eye, EyeOff, Smartphone, Mail, Key } from "lucide-react"

// API基础URL（根据实际环境配置）
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1/auth";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    realName: "", // 修改为 realName 以匹配后端
    confirmPassword: "",
    smsCode: "", // 修改为 smsCode 以匹配后端
  })
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
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

      // 调用发送验证码接口 - 使用 POST 方法
      const response = await fetch(`${API_BASE_URL}/send-code?phoneNumber=${formData.phone}`, {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '发送验证码失败')
      }

      // 启动60秒倒计时
      setCountdown(60)
      setSuccessMessage("验证码已发送，请查收短信")
    } catch (err: any) {
      setError(err.message || "发送验证码失败，请重试")
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

  const handleLogin = async () => {
    try {
      setLoading(true)
      setError("")
      console.log("-------------")
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '登录失败')
      }

      // 保存token到localStorage
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
// 添加用户信息存储
      localStorage.setItem('user', JSON.stringify(data.user)); // 确保响应中包含用户信息
      // 获取用户信息
      const userResponse = await fetch(`http://localhost:8080/api/v1/me/profile`, {
        headers: {
          'Authorization': `Bearer ${data.accessToken}`
        }
      })

      if (!userResponse.ok) {
        const errorData = await userResponse.json()
        throw new Error(errorData.message || "获取用户信息失败")
      }

      const userData = await userResponse.json()
      localStorage.setItem('user', JSON.stringify(userData))
      console.log("用户信息:", userData)
      console.log("登录成功，即将跳转");
      console.log("Access Token:", data.accessToken);
      console.log("用户数据:", data.user);
      // 跳转到首页
      router.push("/")
    } catch (err: any) {
      setError(err.message || "登录失败，请检查用户名和密码")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    try {
      setLoading(true)
      setError("")

      // 表单验证
      if (formData.password !== formData.confirmPassword) {
        setError("密码确认不匹配")
        return
      }

      if (formData.password.length < 8) {
        setError("密码长度至少8位")
        return
      }

      if (!formData.smsCode) {
        setError("请输入验证码")
        return
      }

      // 使用正确的字段名发送请求
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          realName: formData.realName, // 使用 realName
          email: formData.email,
          phoneNumber: formData.phone,
          smsCode: formData.smsCode // 使用 smsCode
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // 显示后端返回的具体错误信息
        throw new Error(data.message || `注册失败: ${response.status} ${response.statusText}`)
      }

      setSuccessMessage("注册成功！请登录")
      setIsLogin(true)
      setFormData({
        username: "",
        email: "",
        phone: "",
        password: "",
        realName: "",
        confirmPassword: "",
        smsCode: ""
      })
    } catch (err: any) {
      setError(err.message || "注册失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    try {
      setLoading(true)
      setError("")

      if (!formData.email) {
        setError("请输入邮箱")
        return
      }

      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '请求失败')
      }

      setSuccessMessage("密码重置邮件已发送，请查收")
    } catch (err: any) {
      setError(err.message || "请求失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isLogin) {
      await handleLogin()
    } else {
      await handleRegister()
    }
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg rounded-2xl overflow-hidden border-0">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-2 w-full"></div>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4 mt-2 shadow-lg">
              <User className="w-8 h-8 text-white" />
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
                    <Label htmlFor="username" className="flex items-center text-gray-700">
                      <User className="w-4 h-4 mr-2" />
                      用户名
                    </Label>
                    <Input
                        id="username"
                        type="text"
                        placeholder="请输入用户名"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
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

                  {error && (
                      <Alert variant="destructive" className="rounded-xl">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                  )}

                  {successMessage && (
                      <Alert className="rounded-xl bg-green-100 border-green-400">
                        <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
                      </Alert>
                  )}

                  <div className="flex justify-between items-center">
                    <Button
                        type="button"
                        variant="link"
                        className="text-blue-600 px-0"
                        onClick={handleForgotPassword}
                        disabled={loading}
                    >
                      忘记密码?
                    </Button>
                  </div>

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
                    <Label htmlFor="reg-username" className="flex items-center text-gray-700">
                      <User className="w-4 h-4 mr-2" />
                      用户名
                    </Label>
                    <Input
                        id="reg-username"
                        type="text"
                        placeholder="请输入用户名"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                        className="py-5 px-4 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="realName" className="flex items-center text-gray-700">
                      <User className="w-4 h-4 mr-2" />
                      姓名
                    </Label>
                    <Input
                        id="realName"
                        type="text"
                        placeholder="请输入姓名"
                        value={formData.realName}
                        onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
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
                    <Label htmlFor="smsCode" className="flex items-center text-gray-700">
                      <Key className="w-4 h-4 mr-2" />
                      短信验证码
                    </Label>
                    <div className="flex space-x-2">
                      <Input
                          id="smsCode"
                          type="text"
                          placeholder="请输入验证码"
                          value={formData.smsCode}
                          onChange={(e) => setFormData({ ...formData, smsCode: e.target.value })}
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
                    <Label htmlFor="reg-password" className="flex items-center text-gray-700">
                      <Key className="w-4 h-4 mr-2" />
                      密码
                    </Label>
                    <div className="relative">
                      <Input
                          id="reg-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="请输入密码（至少8位）"
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

                  {error && (
                      <Alert variant="destructive" className="rounded-xl">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                  )}

                  {successMessage && (
                      <Alert className="rounded-xl bg-green-100 border-green-400">
                        <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
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