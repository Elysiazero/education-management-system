"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Upload, FileText, Video, Image, File, Plus, Filter, Download, Star, Check, X, Clock, ThumbsUp } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  email: string
  role: "student" | "teacher" | "admin"
}

interface Resource {
  id: number
  fileName: string
  userName: string
  description: string
  resourceType: string
  ossUrl: string
  createdAt: string
  metadata?: {
    size: string
    uploader: string
  }
  approved?: boolean
}

export default function ResourcesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [filteredResources, setFilteredResources] = useState<Resource[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showUpload, setShowUpload] = useState(false)
  const [newResource, setNewResource] = useState({
    fileName: '',
    description: '',
    resourceType: 'PDF',
    userName: '',
    file: null as File | null
  })
  const [activeTab, setActiveTab] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const API_BASE_URL = "http://localhost:8080";

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    setNewResource(prev => ({...prev, userName: parsedUser.name}))

    fetchResources()
  }, [router])

  const fetchResources = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/oss/check/all?page=1&size=100`)
      const data = await response.json()
      console.log("资源列表响应:", data); // 添加调试日志

      if (data.code === 200) {
        const resourcesWithStatus = data.data.records.map((res: any) => ({
          ...res,
          approved: res.userName === 'admin' || res.userName.includes('老师')
        }))

        setResources(resourcesWithStatus)
        setFilteredResources(resourcesWithStatus.filter((r: Resource) => r.approved))
      } else {
        toast.error('获取资源失败: ' + data.message)
      }
    } catch (error) {
      toast.error('网络错误: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let filtered = resources

    // 根据标签页过滤
    if (activeTab === 'pending') {
      filtered = filtered.filter(r => !r.approved)
    } else if (activeTab === 'recent') {
      // 最近上传：按日期倒序
      filtered = [...filtered]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
    } else if (activeTab === 'popular') {
      // 热门下载：模拟下载量排序
      filtered = [...filtered]
          .sort((a, b) =>
              (b.metadata?.size || '0MB').localeCompare(a.metadata?.size || '0MB'))
          .slice(0, 5)
    } else {
      // 全部资源：显示已审核的
      filtered = filtered.filter(r => r.approved)
    }

    // 应用搜索和筛选条件
    if (searchTerm) {
      filtered = filtered.filter(resource =>
          resource.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(resource => resource.resourceType === typeFilter)
    }

    setFilteredResources(filtered)
  }, [resources, searchTerm, typeFilter, activeTab])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PDF': return <FileText className="w-5 h-5 text-blue-600" />
      case 'VIDEO': return <Video className="w-5 h-5 text-red-600" />
      case 'IMAGE': return <Image className="w-5 h-5 text-green-600" />
      default: return <File className="w-5 h-5 text-purple-600" />
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PDF: '文档',
      DOC: '文档',
      PPT: '演示文稿',
      VIDEO: '视频',
      IMAGE: '图片',
      ZIP: '压缩文件',
      OTHER: '其他'
    }
    return labels[type] || type
  }

  const handleUpload = async () => {
    if (!newResource.file) {
      toast.error('请选择要上传的文件')
      return
    }

    const formData = new FormData()
    formData.append('userName', newResource.userName)
    formData.append('description', newResource.description)
    formData.append('fileName', newResource.fileName)
    formData.append('resourceType', newResource.resourceType)

    // 添加fileURL参数（文档要求）
    const fileURL = URL.createObjectURL(newResource.file)
    formData.append('fileURL', fileURL)

    // 添加文件
    formData.append('file', newResource.file)

    try {
      console.log("上传表单数据:", {
        userName: newResource.userName,
        description: newResource.description,
        fileName: newResource.fileName,
        resourceType: newResource.resourceType,
        fileURL: fileURL
      });

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData
        // 注意：不要手动设置Content-Type，浏览器会自动设置multipart/form-data
      })

      const result = await response.text()
      console.log("上传响应:", result);

      if (response.ok) {
        toast.success('资源上传成功')
        fetchResources()
        setNewResource({
          fileName: '',
          description: '',
          resourceType: 'PDF',
          userName: user?.name || '',
          file: null
        })
        setShowUpload(false)
      } else {
        toast.error('上传失败: ' + result)
      }
    } catch (error) {
      toast.error('上传失败: ' + (error as Error).message)
    } finally {
      // 清理临时URL
      URL.revokeObjectURL(fileURL)
    }
  }

  const handleDownload = async (fileName: string) => {
    try {
      // 获取资源详情
      const resource = resources.find(r => r.fileName === fileName)
      if (!resource) {
        toast.error('找不到资源信息')
        return
      }

      // 创建临时下载链接 - 先提供即时下载
      const tempLink = document.createElement('a')
      tempLink.href = resource.ossUrl
      tempLink.download = fileName
      document.body.appendChild(tempLink)
      tempLink.click()
      document.body.removeChild(tempLink)

      toast.success(`开始下载: ${fileName}`)

      // 异步调用下载API记录下载事件
      try {
        // 浏览器环境下无法指定具体路径，使用通用路径
        const downloadPath = `/downloads/${fileName}`

        const downloadResponse = await fetch(
            `${API_BASE_URL}/download?fileName=${encodeURIComponent(fileName)}&localFilePath=${encodeURIComponent(downloadPath)}`
        )

        const result = await downloadResponse.text()
        console.log("下载记录响应:", result)

        if (!downloadResponse.ok) {
          console.warn('下载记录失败: ' + result)
        }
      } catch (error) {
        console.error('下载记录错误: ' + (error as Error).message)
      }
    } catch (error) {
      toast.error('下载失败: ' + (error as Error).message)
    }
  }
  const handleDelete = async (fileName: string) => {
    if (!confirm(`确定要删除资源 "${fileName}" 吗？`)) return

    try {
      const response = await fetch(
          `${API_BASE_URL}/delete?fileName=${encodeURIComponent(fileName)}`,
          { method: 'DELETE' }
      )

      const result = await response.text()
      console.log("删除响应:", result);

      if (response.ok) {
        toast.success('资源删除成功')
        fetchResources()
      } else {
        toast.error('删除失败: ' + result)
      }
    } catch (error) {
      toast.error('删除失败: ' + (error as Error).message)
    }
  }
  const handleCombinedSearch = async () => {
    setIsLoading(true)
    try {
      // 构建查询参数
      const params = new URLSearchParams()
      if (searchTerm) params.append('fileName', searchTerm)
      if (typeFilter !== 'all') params.append('resourceType', typeFilter)
      if (user?.name) params.append('userName', user.name)

      const response = await fetch(
          `${API_BASE_URL}/oss/check/combined?${params.toString()}`
      )
      const data = await response.json()
      console.log("组合查询响应:", data);

      if (data.code === 200) {
        setFilteredResources(data.data)
      } else {
        toast.error('查询失败: ' + data.message)
      }
    } catch (error) {
      toast.error('查询失败: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }
  const handleApprove = (id: number) => {
    setResources(resources.map(r =>
        r.id === id ? {...r, approved: true} : r
    ))
    toast.success('资源已批准')
  }

  const handleReject = async (id: number, fileName: string) => {
    if (confirm(`确定要拒绝资源 "${fileName}" 吗？`)) {
      await handleDelete(fileName)
    }
  }

  const fetchProjectResources = async () => {
    setIsLoading(true)
    try {
      // 这里需要从项目中获取实际的项目名称
      const projectName = "Java项目" // 实际项目中应从用户数据获取

      const response = await fetch(
          `${API_BASE_URL}/oss/check/search-by-project-title?keyword=${encodeURIComponent(projectName)}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
      )
      const data = await response.json()
      console.log("项目资源响应:", data);

      if (data.code === 200) {
        setFilteredResources(data.data)
      } else {
        toast.error('获取项目资源失败: ' + data.message)
      }
    } catch (error) {
      toast.error('网络错误: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载用户信息...</p>
          </div>
        </div>
    )
  }

  return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">教学资源管理</h1>
              <p className="text-gray-600">浏览、上传和管理教学资源</p>
            </div>
            {(user.role === 'teacher' || user.role === 'admin') && (
                <Dialog open={showUpload} onOpenChange={setShowUpload}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      上传资源
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>上传新资源</DialogTitle>
                      <DialogDescription>添加新的教学资源到资源库</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="fileName">资源名称</Label>
                        <Input
                            id="fileName"
                            value={newResource.fileName}
                            onChange={(e) => setNewResource({...newResource, fileName: e.target.value})}
                            placeholder="输入资源名称"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">资源描述</Label>
                        <Textarea
                            id="description"
                            value={newResource.description}
                            onChange={(e) => setNewResource({...newResource, description: e.target.value})}
                            placeholder="输入资源描述"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="resourceType">资源类型</Label>
                          <Select
                              value={newResource.resourceType}
                              onValueChange={(value) => setNewResource({...newResource, resourceType: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PDF">文档</SelectItem>
                              <SelectItem value="VIDEO">视频</SelectItem>
                              <SelectItem value="IMAGE">图片</SelectItem>
                              <SelectItem value="DOC">Word文档</SelectItem>
                              <SelectItem value="PPT">演示文稿</SelectItem>
                              <SelectItem value="ZIP">压缩文件</SelectItem>
                              <SelectItem value="OTHER">其他</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="file">选择文件</Label>
                        <Input
                            id="file"
                            type="file"
                            onChange={(e) =>
                                setNewResource({
                                  ...newResource,
                                  file: e.target.files?.[0] || null
                                })
                            }
                        />
                      </div>
                      <Button onClick={handleUpload} className="w-full" disabled={!newResource.file}>
                        上传资源
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
            )}
          </div>

          {/* 筛选器 */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                      placeholder="搜索资源..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                  />
                </div>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="资源类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    <SelectItem value="PDF">文档</SelectItem>
                    <SelectItem value="VIDEO">视频</SelectItem>
                    <SelectItem value="IMAGE">图片</SelectItem>
                    <SelectItem value="DOC">Word</SelectItem>
                    <SelectItem value="PPT">演示文稿</SelectItem>
                    <SelectItem value="ZIP">压缩文件</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                    variant="outline"
                    onClick={fetchProjectResources}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  项目相关资源
                </Button>

                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  高级筛选
                </Button>
                <Button
                    variant="outline"
                    onClick={handleCombinedSearch}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  组合查询
                </Button>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="ml-4 text-gray-600">加载资源中...</p>
              </div>
          ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList>
                  <TabsTrigger value="all">全部资源</TabsTrigger>
                  <TabsTrigger value="recent">最近上传</TabsTrigger>
                  <TabsTrigger value="popular">热门下载</TabsTrigger>
                  <TabsTrigger value="favorites">我的收藏</TabsTrigger>
                  {(user.role === 'teacher' || user.role === 'admin') && (
                      <TabsTrigger value="pending">待审核</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="all" className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResources.map((resource) => (
                        <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                {getTypeIcon(resource.resourceType)}
                                <CardTitle className="text-lg ml-2 line-clamp-1">{resource.fileName}</CardTitle>
                              </div>
                            </div>
                            <CardDescription className="line-clamp-2 mt-2">{resource.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                              <div className="flex items-center">
                                <span className="mr-2">上传者: {resource.userName}</span>
                                <span>|</span>
                                <span className="ml-2">{new Date(resource.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center">
                                <span>{resource.metadata?.size || '未知大小'}</span>
                              </div>
                            </div>
                            <div className="mt-4 flex justify-between items-center">
                              <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(resource.fileName)}
                              >
                                <X className="w-4 h-4 mr-2" />
                                删除
                              </Button>
                              <Button
                                  size="sm"
                                  onClick={() => handleDownload(resource.fileName)}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                下载资源
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="recent" className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResources.map((resource) => (
                        <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                {getTypeIcon(resource.resourceType)}
                                <CardTitle className="text-lg ml-2 line-clamp-1">{resource.fileName}</CardTitle>
                              </div>
                              <span className="flex items-center text-gray-500 text-sm">
                          <Clock className="w-4 h-4 mr-1" />
                                {new Date(resource.createdAt).toLocaleDateString()}
                        </span>
                            </div>
                            <CardDescription className="line-clamp-2 mt-2">{resource.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between items-center mt-4">
                              <Button size="sm" variant="outline">
                                <ThumbsUp className="w-4 h-4 mr-2" />
                                收藏
                              </Button>
                              <Button
                                  size="sm"
                                  onClick={() => handleDownload(resource.fileName)}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                下载
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="popular" className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResources.map((resource) => (
                        <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                {getTypeIcon(resource.resourceType)}
                                <CardTitle className="text-lg ml-2 line-clamp-1">{resource.fileName}</CardTitle>
                              </div>
                              <span className="flex items-center text-gray-500 text-sm">
                          <Download className="w-4 h-4 mr-1" />
                                {Math.floor(Math.random() * 100) + 50} {/* 模拟下载量 */}
                        </span>
                            </div>
                            <CardDescription className="line-clamp-2 mt-2">{resource.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">{resource.userName}</span>
                              <Button
                                  size="sm"
                                  onClick={() => handleDownload(resource.fileName)}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                下载
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="favorites" className="pt-4">
                  <div className="bg-gray-100 rounded-lg p-12 text-center">
                    <Star className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700">暂无收藏资源</h3>
                    <p className="text-gray-500 mt-2">您可以将喜欢的资源添加到收藏夹</p>
                  </div>
                </TabsContent>

                {(user.role === 'teacher' || user.role === 'admin') && (
                    <TabsContent value="pending" className="pt-4">
                      {filteredResources.length === 0 ? (
                          <div className="bg-gray-100 rounded-lg p-12 text-center">
                            <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700">暂无待审核资源</h3>
                            <p className="text-gray-500 mt-2">所有资源已审核完成</p>
                          </div>
                      ) : (
                          <div className="space-y-6">
                            {filteredResources.map((resource) => (
                                <Card key={resource.id} className="border-l-4 border-yellow-500">
                                  <CardContent className="pt-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                      <div>
                                        <div className="flex items-center">
                                          {getTypeIcon(resource.resourceType)}
                                          <h3 className="text-lg font-semibold ml-2">{resource.fileName}</h3>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                  {getTypeLabel(resource.resourceType)}
                                </span>
                                          <span className="text-xs text-gray-500">
                                  上传者: {resource.userName}
                                </span>
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => handleReject(resource.id, resource.fileName)}
                                        >
                                          <X className="w-4 h-4 mr-2" />
                                          拒绝
                                        </Button>
                                        <Button onClick={() => handleApprove(resource.id)}>
                                          <Check className="w-4 h-4 mr-2" />
                                          通过
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                            ))}
                          </div>
                      )}
                    </TabsContent>
                )}
              </Tabs>
          )}
        </div>
      </div>
  )
}