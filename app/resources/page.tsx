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

interface User {
  id: string
  name: string
  email: string
  role: "student" | "teacher" | "admin"
}

interface Resource {
  id: string
  title: string
  description: string
  type: "document" | "video" | "image" | "other"
  category: string
  difficulty: "beginner" | "intermediate" | "advanced"
  fileSize: string
  uploadDate: string
  uploadedBy: string
  downloads: number
  rating: number
  tags: string[]
  approved: boolean
  url: string
}

export default function ResourcesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [filteredResources, setFilteredResources] = useState<Resource[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [showUpload, setShowUpload] = useState(false)
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    type: 'document' as 'document' | 'video' | 'image' | 'other',
    category: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    tags: ''
  })
  const [activeTab, setActiveTab] = useState('all')
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    setUser(JSON.parse(userData))

    // 模拟资源数据
    const mockResources: Resource[] = [
      {
        id: '1',
        title: 'React开发指南',
        description: '完整的React开发教程，包含基础概念到高级应用',
        type: 'document',
        category: '前端开发',
        difficulty: 'intermediate',
        fileSize: '2.5 MB',
        uploadDate: '2024-01-05',
        uploadedBy: '李老师',
        downloads: 156,
        rating: 4.8,
        tags: ['React', 'JavaScript', '前端'],
        approved: true,
        url: '/placeholder.pdf'
      },
      {
        id: '2',
        title: 'JavaScript基础视频教程',
        description: '从零开始学习JavaScript编程语言',
        type: 'video',
        category: '编程基础',
        difficulty: 'beginner',
        fileSize: '125 MB',
        uploadDate: '2024-01-03',
        uploadedBy: '王老师',
        downloads: 89,
        rating: 4.5,
        tags: ['JavaScript', '编程', '基础'],
        approved: true,
        url: '/placeholder-video.mp4'
      },
      {
        id: '3',
        title: '数据库设计原理',
        description: '关系型数据库设计的基本原理和最佳实践',
        type: 'document',
        category: '数据库',
        difficulty: 'advanced',
        fileSize: '3.2 MB',
        uploadDate: '2024-01-01',
        uploadedBy: '张老师',
        downloads: 67,
        rating: 4.6,
        tags: ['数据库', 'SQL', '设计'],
        approved: true,
        url: '/placeholder.pdf'
      },
      {
        id: '4',
        title: 'UI设计规范图集',
        description: '现代Web应用UI设计规范和示例',
        type: 'image',
        category: 'UI设计',
        difficulty: 'intermediate',
        fileSize: '15.8 MB',
        uploadDate: '2023-12-28',
        uploadedBy: '赵老师',
        downloads: 234,
        rating: 4.9,
        tags: ['UI', '设计', '规范'],
        approved: true,
        url: '/placeholder-images.zip'
      },
      {
        id: '5',
        title: 'Python数据分析实战',
        description: '使用Python进行数据分析的实际案例和代码',
        type: 'other',
        category: '数据分析',
        difficulty: 'advanced',
        fileSize: '8.7 MB',
        uploadDate: '2023-12-25',
        uploadedBy: '刘老师',
        downloads: 123,
        rating: 4.7,
        tags: ['Python', '数据分析', '实战'],
        approved: false,
        url: '/placeholder-code.zip'
      },
      {
        id: '6',
        title: '机器学习入门',
        description: '机器学习基础概念与算法实现',
        type: 'document',
        category: '人工智能',
        difficulty: 'intermediate',
        fileSize: '4.3 MB',
        uploadDate: '2024-01-10',
        uploadedBy: '陈老师',
        downloads: 98,
        rating: 4.6,
        tags: ['机器学习', 'AI', '算法'],
        approved: true,
        url: '/placeholder.pdf'
      },
      {
        id: '7',
        title: 'Node.js后端开发实战',
        description: '使用Node.js构建高性能后端服务',
        type: 'video',
        category: '后端开发',
        difficulty: 'advanced',
        fileSize: '210 MB',
        uploadDate: '2024-01-08',
        uploadedBy: '吴老师',
        downloads: 76,
        rating: 4.7,
        tags: ['Node.js', '后端', 'JavaScript'],
        approved: true,
        url: '/placeholder-video.mp4'
      },
      {
        id: '8',
        title: '移动应用设计模板',
        description: '适用于iOS和Android的移动应用UI设计模板',
        type: 'image',
        category: 'UI设计',
        difficulty: 'beginner',
        fileSize: '22.1 MB',
        uploadDate: '2024-01-02',
        uploadedBy: '郑老师',
        downloads: 189,
        rating: 4.8,
        tags: ['移动应用', 'UI', '设计'],
        approved: true,
        url: '/placeholder-images.zip'
      },
      {
        id: '9',
        title: '数据结构与算法习题集',
        description: '常见数据结构与算法问题及解答',
        type: 'document',
        category: '计算机科学',
        difficulty: 'advanced',
        fileSize: '1.8 MB',
        uploadDate: '2023-12-30',
        uploadedBy: '周老师',
        downloads: 143,
        rating: 4.9,
        tags: ['数据结构', '算法', '编程'],
        approved: true,
        url: '/placeholder.pdf'
      },
      {
        id: '10',
        title: 'DevOps实践指南',
        description: '现代软件开发与运维最佳实践',
        type: 'other',
        category: '运维',
        difficulty: 'intermediate',
        fileSize: '5.6 MB',
        uploadDate: '2023-12-22',
        uploadedBy: '孙老师',
        downloads: 87,
        rating: 4.5,
        tags: ['DevOps', '运维', 'CI/CD'],
        approved: true,
        url: '/placeholder-code.zip'
      }
    ]

    setResources(mockResources)
    setFilteredResources(mockResources.filter(r => r.approved))
  }, [router])

  useEffect(() => {
    let filtered = resources

    // 根据标签页过滤
    if (activeTab === 'pending') {
      filtered = filtered.filter(r => !r.approved)
    } else if (activeTab === 'recent') {
      // 最近上传：按日期倒序
      filtered = [...filtered]
          .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
          .slice(0, 5)
    } else if (activeTab === 'popular') {
      // 热门下载：按下载量排序
      filtered = [...filtered]
          .sort((a, b) => b.downloads - a.downloads)
          .slice(0, 5)
    } else {
      // 全部资源：显示已审核的
      filtered = filtered.filter(r => r.approved)
    }

    // 应用搜索和筛选条件
    if (searchTerm) {
      filtered = filtered.filter(resource =>
          resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(resource => resource.type === typeFilter)
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(resource => resource.category === categoryFilter)
    }

    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(resource => resource.difficulty === difficultyFilter)
    }

    setFilteredResources(filtered)
  }, [resources, searchTerm, typeFilter, categoryFilter, difficultyFilter, activeTab])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="w-5 h-5 text-blue-600" />
      case 'video': return <Video className="w-5 h-5 text-red-600" />
      case 'image': return <Image className="w-5 h-5 text-green-600" />
      case 'other': return <File className="w-5 h-5 text-purple-600" />
      default: return <File className="w-5 h-5 text-gray-600" />
    }
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      document: '文档',
      video: '视频',
      image: '图片',
      other: '其他'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getDifficultyLabel = (difficulty: string) => {
    const labels = {
      beginner: '初级',
      intermediate: '中级',
      advanced: '高级'
    }
    return labels[difficulty as keyof typeof labels] || difficulty
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    }
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const handleUpload = () => {
    const resource: Resource = {
      id: Date.now().toString(),
      title: newResource.title,
      description: newResource.description,
      type: newResource.type,
      category: newResource.category,
      difficulty: newResource.difficulty,
      fileSize: '1.0 MB',
      uploadDate: new Date().toISOString().split('T')[0],
      uploadedBy: user?.name || '',
      downloads: 0,
      rating: 0,
      tags: newResource.tags.split(',').map(tag => tag.trim()),
      approved: user?.role === 'teacher' || user?.role === 'admin',
      url: '/placeholder.pdf'
    }

    setResources([resource, ...resources])
    setNewResource({
      title: '',
      description: '',
      type: 'document',
      category: '',
      difficulty: 'beginner',
      tags: ''
    })
    setShowUpload(false)
  }

  const handleApprove = (id: string) => {
    setResources(resources.map(r =>
        r.id === id ? {...r, approved: true} : r
    ))
  }

  const handleReject = (id: string) => {
    setResources(resources.filter(r => r.id !== id))
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
                        <Label htmlFor="title">资源标题</Label>
                        <Input
                            id="title"
                            value={newResource.title}
                            onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                            placeholder="输入资源标题"
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
                          <Label htmlFor="type">资源类型</Label>
                          <Select value={newResource.type} onValueChange={(value: 'document' | 'video' | 'image' | 'other') => setNewResource({...newResource, type: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="document">文档</SelectItem>
                              <SelectItem value="video">视频</SelectItem>
                              <SelectItem value="image">图片</SelectItem>
                              <SelectItem value="other">其他</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="difficulty">难度等级</Label>
                          <Select value={newResource.difficulty} onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => setNewResource({...newResource, difficulty: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">初级</SelectItem>
                              <SelectItem value="intermediate">中级</SelectItem>
                              <SelectItem value="advanced">高级</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="category">分类</Label>
                        <Input
                            id="category"
                            value={newResource.category}
                            onChange={(e) => setNewResource({...newResource, category: e.target.value})}
                            placeholder="输入资源分类"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tags">标签</Label>
                        <Input
                            id="tags"
                            value={newResource.tags}
                            onChange={(e) => setNewResource({...newResource, tags: e.target.value})}
                            placeholder="输入标签，用逗号分隔"
                        />
                      </div>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">点击或拖拽文件到此处上传</p>
                        <p className="text-xs text-gray-500 mt-1">支持 PDF, DOC, PPT, MP4, JPG, PNG 等格式</p>
                      </div>
                      <Button onClick={handleUpload} className="w-full">
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
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                    <SelectItem value="document">文档</SelectItem>
                    <SelectItem value="video">视频</SelectItem>
                    <SelectItem value="image">图片</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="资源分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部分类</SelectItem>
                    <SelectItem value="前端开发">前端开发</SelectItem>
                    <SelectItem value="编程基础">编程基础</SelectItem>
                    <SelectItem value="数据库">数据库</SelectItem>
                    <SelectItem value="UI设计">UI设计</SelectItem>
                    <SelectItem value="数据分析">数据分析</SelectItem>
                    <SelectItem value="人工智能">人工智能</SelectItem>
                    <SelectItem value="后端开发">后端开发</SelectItem>
                    <SelectItem value="计算机科学">计算机科学</SelectItem>
                    <SelectItem value="运维">运维</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="难度等级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部难度</SelectItem>
                    <SelectItem value="beginner">初级</SelectItem>
                    <SelectItem value="intermediate">中级</SelectItem>
                    <SelectItem value="advanced">高级</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  高级筛选
                </Button>
              </div>
            </CardContent>
          </Card>

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
                            {getTypeIcon(resource.type)}
                            <CardTitle className="text-lg ml-2">{resource.title}</CardTitle>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(resource.difficulty)}`}>
                        {getDifficultyLabel(resource.difficulty)}
                      </span>
                        </div>
                        <CardDescription className="line-clamp-2 mt-2">{resource.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {resource.tags.map((tag, index) => (
                              <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {tag}
                        </span>
                          ))}
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-600">
                          <div className="flex items-center">
                            <span className="mr-2">上传者: {resource.uploadedBy}</span>
                            <span>|</span>
                            <span className="ml-2">{resource.uploadDate}</span>
                          </div>
                          <div className="flex items-center">
                            <Download className="w-4 h-4 mr-1" />
                            <span>{resource.downloads}</span>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1" />
                            <span className="font-medium">{resource.rating}</span>
                          </div>
                          <Button size="sm">
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
                            {getTypeIcon(resource.type)}
                            <CardTitle className="text-lg ml-2">{resource.title}</CardTitle>
                          </div>
                          <span className="flex items-center text-gray-500 text-sm">
                        <Clock className="w-4 h-4 mr-1" />
                            {resource.uploadDate}
                      </span>
                        </div>
                        <CardDescription className="line-clamp-2 mt-2">{resource.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {resource.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {tag}
                        </span>
                          ))}
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <Button size="sm" variant="outline">
                            <ThumbsUp className="w-4 h-4 mr-2" />
                            收藏
                          </Button>
                          <Button size="sm">
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
                            {getTypeIcon(resource.type)}
                            <CardTitle className="text-lg ml-2">{resource.title}</CardTitle>
                          </div>
                          <span className="flex items-center text-gray-500 text-sm">
                        <Download className="w-4 h-4 mr-1" />
                            {resource.downloads}
                      </span>
                        </div>
                        <CardDescription className="line-clamp-2 mt-2">{resource.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(resource.difficulty)}`}>
                        {getDifficultyLabel(resource.difficulty)}
                      </span>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1" />
                            <span className="font-medium">{resource.rating}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{resource.uploadedBy}</span>
                          <Button size="sm">
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
                                      {getTypeIcon(resource.type)}
                                      <h3 className="text-lg font-semibold ml-2">{resource.title}</h3>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                                    <div className="flex flex-wrap gap-2 mt-3">
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                {resource.category}
                              </span>
                                      <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(resource.difficulty)}`}>
                                {getDifficultyLabel(resource.difficulty)}
                              </span>
                                      <span className="text-xs text-gray-500">
                                上传者: {resource.uploadedBy}
                              </span>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => handleReject(resource.id)}>
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
        </div>
      </div>
  )
}