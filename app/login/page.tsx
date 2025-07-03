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
import { User, Eye, EyeOff, Smartphone, Mail, Key, ArrowLeft } from "lucide-react"

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
    realName: "",
    confirmPassword: "",
    smsCode: "",
  })
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isSending, setIsSending] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1)
  const [resetFormData, setResetFormData] = useState({
    phone: "",
    smsCode: "",
    newPassword: "",
    confirmNewPassword: ""
  })
  const router = useRouter()

  const handleSendVerificationCode = async (phone: string) => {
    if (!phone) {
      setError("请先输入手机号")
      return
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError("请输入有效的手机号")
      return
    }

    try {
      setIsSending(true)
      setError("")

      // 调用发送验证码接口
      const response = await fetch(`${API_BASE_URL}/send-code?phoneNumber=${phone}`, {
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
      // 保存角色信息
      localStorage.setItem('userRole', data.roles)
      console.log("qvanxian",data.roles)
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
      console.log("登录页",userData)
      // 合并角色信息和用户信息
      const userWithRole = {
        ...userData,
        role: data.roles // 使用登录接口返回的角色
      }
      localStorage.setItem('user', JSON.stringify(userWithRole))
console.log("信息",userWithRole)
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

      // 注册请求
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          realName: formData.realName,
          email: formData.email,
          phoneNumber: formData.phone,
          smsCode: formData.smsCode
        })
      })

      const data = await response.json()

      if (!response.ok) {
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
      setLoading(true);
      setError("");

      // 表单验证
      if (!resetFormData.phone) {
        setError("请输入手机号");
        return;
      }

      if (!resetFormData.smsCode) {
        setError("请输入验证码");
        return;
      }

      // 调试日志
      console.log("Sending forgot-password request:", {
        phoneNumber: resetFormData.phone,
        smsCode: resetFormData.smsCode
      });

      // 调用忘记密码接口
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: resetFormData.phone,
          smsCode: resetFormData.smsCode,
        }),
      });

      // 调试日志
      console.log("Response status:", response.status);
      const responseText = await response.text();
      console.log("Response text:", responseText);

      if (!response.ok) {
        let errorMessage = "验证失败";
        try {
          // 尝试解析错误响应
          const errorData = responseText ? JSON.parse(responseText) : {};
          errorMessage = errorData.message || response.statusText || errorMessage;
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // 解析成功响应
      const data = responseText ? JSON.parse(responseText) : {};
      setSuccessMessage(data.message || "身份验证成功，请设置新密码");
      setForgotPasswordStep(2);
    } catch (err: any) {
      setError(err.message || "验证失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  const handleResetPassword = async () => {
    try {
      setLoading(true)
      setError("")

      // 表单验证
      if (resetFormData.newPassword !== resetFormData.confirmNewPassword) {
        setError("新密码确认不匹配")
        return
      }

      if (resetFormData.newPassword.length < 8) {
        setError("密码长度至少8位")
        return
      }

      // 调用重置密码接口
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: resetFormData.phone,
          newPassword: resetFormData.newPassword,
          smsCode: resetFormData.smsCode
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '重置密码失败')
      }

      setSuccessMessage("密码重置成功！请登录")
      setIsForgotPassword(false)
      setIsLogin(true)
      setResetFormData({
        phone: "",
        smsCode: "",
        newPassword: "",
        confirmNewPassword: ""
      })
    } catch (err: any) {
      setError(err.message || "重置密码失败，请重试")
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

  // 渲染忘记密码表单
  const renderForgotPasswordForm = () => {
    return (
        <div className="space-y-5">
          <Button
              variant="ghost"
              className="flex items-center gap-2 mb-2 text-blue-600"
              onClick={() => {
                setIsForgotPassword(false)
                setError("")
                setSuccessMessage("")
              }}
          >
            <ArrowLeft size={16} />
            返回登录
          </Button>

          <h2 className="text-xl font-bold text-center text-gray-800">
            {forgotPasswordStep === 1 ? "找回密码" : "重置密码"}
          </h2>

          {forgotPasswordStep === 1 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="reset-phone" className="flex items-center text-gray-700">
                    <Smartphone className="w-4 h-4 mr-2" />
                    手机号
                  </Label>
                  <Input
                      id="reset-phone"
                      type="tel"
                      placeholder="请输入手机号"
                      value={resetFormData.phone}
                      onChange={(e) => setResetFormData({ ...resetFormData, phone: e.target.value })}
                      required
                      className="py-5 px-4 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reset-smsCode" className="flex items-center text-gray-700">
                    <Key className="w-4 h-4 mr-2" />
                    短信验证码
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                        id="reset-smsCode"
                        type="text"
                        placeholder="请输入验证码"
                        value={resetFormData.smsCode}
                        onChange={(e) => setResetFormData({ ...resetFormData, smsCode: e.target.value })}
                        required
                        className="py-5 px-4 rounded-xl flex-1"
                    />
                    <Button
                        type="button"
                        onClick={() => handleSendVerificationCode(resetFormData.phone)}
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

                <Button
                    type="button"
                    className="w-full py-6 rounded-xl text-base"
                    onClick={handleForgotPassword}
                    disabled={loading}
                >
                  {loading ? (
                      <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  验证中...
                </span>
                  ) : "下一步"}
                </Button>
              </>
          ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="flex items-center text-gray-700">
                    <Key className="w-4 h-4 mr-2" />
                    新密码
                  </Label>
                  <div className="relative">
                    <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="请输入新密码（至少8位）"
                        value={resetFormData.newPassword}
                        onChange={(e) => setResetFormData({ ...resetFormData, newPassword: e.target.value })}
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
                  <Label htmlFor="confirm-new-password" className="flex items-center text-gray-700">
                    <Key className="w-4 h-4 mr-2" />
                    确认新密码
                  </Label>
                  <Input
                      id="confirm-new-password"
                      type="password"
                      placeholder="请再次输入新密码"
                      value={resetFormData.confirmNewPassword}
                      onChange={(e) => setResetFormData({ ...resetFormData, confirmNewPassword: e.target.value })}
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

                <Button
                    type="button"
                    className="w-full py-6 rounded-xl text-base"
                    onClick={handleResetPassword}
                    disabled={loading}
                >
                  {loading ? (
                      <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  重置中...
                </span>
                  ) : "重置密码"}
                </Button>
              </>
          )}
        </div>
    )
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
            <CardDescription className="text-gray-500">
              {isForgotPassword
                  ? (forgotPasswordStep === 1 ? "找回密码" : "设置新密码")
                  : (isLogin ? "登录您的账户" : "创建账户")
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0">
            {isForgotPassword ? (
                renderForgotPasswordForm()
            ) : (
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
                            onClick={() => {
                              setIsForgotPassword(true)
                              setForgotPasswordStep(1)
                              setError("")
                              setSuccessMessage("")
                            }}
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
                              onClick={() => handleSendVerificationCode(formData.phone)}
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
            )}

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>© 2025 教育管理系统 | 让学习更高效</p>
            </div>
          </CardContent>
        </Card>
      </div>
  )
}