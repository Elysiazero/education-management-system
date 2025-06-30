"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Search, Upload, FileText, Video, Image, File, Plus, Filter } from "lucide-react"

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
      }
    ]
    
    setResources(mockResources)
    setFilteredResources(mockResources.filter(r => r.approved))
  }, [router])

  useEffect(() => {
    let filtered = resources.filter(r => r.approved)

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
  }, [resources, searchTerm, typeFilter, categoryFilter, difficultyFilter])

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

  if (!user) {
    return <div>Loading...</div>
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

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">全部资源</TabsTrigger>
            <TabsTrigger value="recent">最近上传</TabsTrigger>
            <TabsTrigger value="popular">热门下载</TabsTrigger>
            <TabsTrigger value="favorites">我的收藏</TabsTrigger>
            {(user.role === 'teacher' || user.role === 'admin') && (
              <TabsTrigger value="pending">待审核</TabsTrigger>
            )}
          </TabsList>
      </Tabs>
      </div>
      </div>)}

          
