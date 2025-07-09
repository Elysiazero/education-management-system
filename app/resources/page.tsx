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
  realName: string
  email: string
  role: "student" | "teacher" | "admin"
}
interface Resource {
  resourceId: number;
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
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [currentDownloadFile, setCurrentDownloadFile] = useState<string | null>(null);
  const [downloadPath, setDownloadPath] = useState("C:/Users/");
  const router = useRouter()
  const API_BASE_URL = "http://localhost:8080";
// Add this new function for fetching smart recommendations
  const fetchSmartRecommendations = async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      const userData = localStorage.getItem('user');

      if (!userData) {
        throw new Error('用户信息不存在，请重新登录');
      }

      const parsedUser = JSON.parse(userData);
      let projectTags: string = "";

      // 1. Fetch project list based on user role
      if (parsedUser.role === "student") {
        const projectsResponse = await fetch(
            `${API_BASE_URL}/api/v1/teaching/projects/student/${parsedUser.id}`,
            { headers }
        );
        const projectsData = await projectsResponse.json();
        console.log("Student projects response:", projectsData);

        if (projectsData.code !== 200 || !projectsData.data || projectsData.data.length === 0) {
          toast.info('您当前没有参与任何项目');
          setFilteredResources([]);
          return;
        }
        projectTags = projectsData.data.flatMap((project: any) => project.tags || []);
      }
      else if (parsedUser.role === "teacher") {
        const projectsResponse = await fetch(
            `${API_BASE_URL}/api/v1/teaching/projects/creator/${parsedUser.id}`,
            { headers }
        );
        const projectsData = await projectsResponse.json();
        console.log("Teacher projects response:", projectsData);

        if (!projectsData || projectsData.length === 0) {
          toast.info('您当前没有创建任何项目');

          setFilteredResources([]);
          return;
        }

        projectTags = projectsData.flatMap((project: any) => project.tags || []);
      }
      else {
        // For admin or other roles, maybe show all resources or handle differently
        toast.info('当前角色没有项目推荐');
        setFilteredResources([]);
        return;
      }

      console.log("Project tags:", projectTags);

      // 2. Fetch recommendations for each project title
      const allRecommendations: Resource[] = [];
      const uniqueProjectTags = [...new Set(projectTags)];

      const recommendationPromises = uniqueProjectTags.map(tag =>
          fetch(
              `${API_BASE_URL}/oss/check/search-by-project-title?keyword=${encodeURIComponent(tag)}`,
              { headers }
          ).then(res => res.json())
      );

      // Wait for all recommendations to complete
      const recommendationsResults = await Promise.allSettled(recommendationPromises);
      console.log("recommendationsResults",recommendationsResults)

      // Process results
      recommendationsResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value.code === 200 && result.value.data) {
          allRecommendations.push(...result.value.data);
        }
      });

      // 3. Remove duplicates and set the filtered resources
      const uniqueRecommendations = allRecommendations.filter(
          (resource, index, self) =>
              index === self.findIndex((r) =>r.resourceId === resource.resourceId)
      );

      console.log("Final unique recommendations:", uniqueRecommendations);
      setFilteredResources(uniqueRecommendations);

      if (uniqueRecommendations.length === 0) {
        toast.info('没有找到与您项目相关的推荐资源');
      }
    } catch (error) {
      console.error('Error in fetchSmartRecommendations:', error);
      toast.error('获取智能推荐失败: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };
  // 获取认证头部
  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // 2. 添加获取用户详细信息的函数
  const fetchUserProfile = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/v1/me/profile`, { headers });
      const data = await response.json();
      console.log("用户data",data);

      if (data) {
        return data;
      } else {
        throw new Error(data.message || '获取用户信息失败');
      }
    } catch (error) {
      console.error('获取用户详细信息失败:', error);
      throw error;
    }
  };
// 3. 添加获取用户最近上传资源的函数
  const fetchRecentResources = async (userName: string) => {
    try {

      const headers = getAuthHeaders();
      console.log(userName)

      const response = await fetch(`${API_BASE_URL}/oss/check/by-user/${encodeURIComponent(userName)}`, { headers });
      const data = await response.json();
      console.log("最近上传data",data);

      if (data.code === 200) {
        return data.data;
      } else {
        throw new Error(data.message || '获取资源失败');
      }
    } catch (error) {
      console.error('获取用户资源失败:', error);
      throw error;
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('accessToken');

    if (!userData || !token) {
      router.push('/login')
      return
    }

    const loadData = async () => {
      try {
        // 获取基本用户信息
        const parsedUser = JSON.parse(userData);

        // 获取详细用户信息（包含realName）
        const userProfile = await fetchUserProfile();

        const completeUser = {
          ...parsedUser,
          realName: userProfile.realName || parsedUser.name
        };

        setUser(completeUser);
        setNewResource(prev => ({...prev, userName: completeUser.realName}));

        // 获取资源
        await fetchResources();

        // 获取用户最近上传的资源
        const recentResources = await fetchRecentResources(completeUser.realName);
        console.log("recentResources",recentResources);
        setResources(prev => [...prev, ...recentResources]);
      } catch (error) {
        toast.error('初始化数据失败: ' + (error as Error).message);
      }
    };

    loadData();
  }, [router]);

  // 获取表单数据的认证头部
  const getAuthHeadersFormData = () => {
    const token = localStorage.getItem('accessToken');
    return {
      'Authorization': `Bearer ${token}`
    };
  };

  useEffect(() => {
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('accessToken');

    if (!userData || !token) {
      router.push('/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    setNewResource(prev => ({...prev, userName: parsedUser.username}))

    fetchResources()
  }, [router])

  const fetchResources = async () => {
    setIsLoading(true)
    try {
      console.log("正在获取资源列表...");
      const response = await fetch(`${API_BASE_URL}/oss/check/all?page=1&size=100`, {
        headers: getAuthHeaders()
      })

      console.log("资源列表请求:", {
        url: `${API_BASE_URL}/oss/check/all?page=1&size=100`,
        headers: getAuthHeaders()
      });

      const data = await response.json()
      console.log("资源列表响应:", data);

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

  // Modify the useEffect for tab filtering
  useEffect(() => {
    let filtered = resources

    // Apply tab filtering
    if (activeTab === 'pending') {
      filtered = filtered.filter(r => !r.approved)
    } else if (activeTab === 'recent') {
      // Recent uploads: sort by date and take top 5
      const userResources = resources
          .filter(r => r.userName === user?.realName)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setFilteredResources(userResources);
      return;
    } else if (activeTab === 'recommended') {
      // For smart recommendations, we'll handle this in fetchSmartRecommendations
      fetchSmartRecommendations();
      return
    }
    // For 'all' tab, we show all approved resources (no additional filtering needed)

    // Apply search and type filters
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
    const userData = localStorage.getItem('user')
    if (!userData) {
      alert("用户信息不存在，请重新登录");
      return;
    }

    const parsedUser = JSON.parse(userData)
    newResource.userName = parsedUser.userName
    // 打印当前用户信息用于调试
    console.log("当前用户信息:", user);
    console.log("上传使用的用户名:", newResource.userName);

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

    // 打印表单数据内容
    console.log("表单数据内容:");
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      console.log("上传表单数据:", {
        userName: newResource.userName,
        description: newResource.description,
        fileName: newResource.fileName,
        resourceType: newResource.resourceType,
        fileURL: fileURL
      });

      const headers = getAuthHeadersFormData();
      console.log("上传请求头:", headers);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
        headers: headers
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


  /**
   * 请求后端把 OSS 文件保存到用户指定的 fileURL/localFilePath。
   * 前端只负责拼参和提示。
   *
   * @param fileName       要下载的文件名
   * @param localFilePath    用户输入的保存位置（与上传端的 fileURL 含义保持一致）
   */
  const handleDownload = async (fileName: string, localFilePath: string) => {
    if (!localFilePath) {
      toast.error('请输入保存路径（localFilePath）');
      return;
    }

    try {
      toast.info(`已发送下载请求：${fileName}`);

      // 统一鉴权头
      const headers = getAuthHeaders(); // 如果没有文件体，可直接用 JSON/表单都行

      // 直接把参数拼到查询串（后端文档要求）
      const reqUrl = `${API_BASE_URL}/download` +
          `?fileName=${encodeURIComponent(fileName)}` +
          `&localFilePath=${encodeURIComponent(localFilePath)}`;

      const res = await fetch(reqUrl, { headers });

      // 后端负责真正下载；这里仅按返回状态给提示
      const text = await res.text();
      if (res.ok) {
        toast.success(text || '下载任务已提交，稍后在指定路径查看。');
      } else {
        toast.error(`下载请求失败：${text}`);
      }
    } catch (err) {
      toast.error(`下载失败：${(err as Error).message}`);
      console.error('下载错误详情:', err);
    }
  };

  const triggerDownload = (fileName: string) => {
    console.log("触发下载弹窗，文件名:", fileName);
    const resource = resources.find(r => r.fileName === fileName);
    if (!resource) {
      toast.error('找不到资源信息');
      return;
    }
    console.log("设置当前下载文件:", fileName);
    setCurrentDownloadFile(fileName);
    console.log("显示下载弹窗");
    setShowDownloadDialog(true);
  };




  const handleDelete = async (fileName: string, userName: string) => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      alert("用户信息不存在，请重新登录");
      return;
    }

    const parsedUser = JSON.parse(userData)
    console.log('当前用户名:', parsedUser.username)
    console.log('资源用户名:', userName)

    // 检查权限：管理员可以删除所有，教师只能删除自己上传的
    const isAdmin = user?.role === 'admin';
    const isOwner = parsedUser.username === userName;

    if (isAdmin || isOwner) {
      if (!confirm(`确定要删除资源 "${fileName}" 吗？`)) return

      try {
        const headers = getAuthHeaders();
        console.log("删除资源请求:", {
          url: `${API_BASE_URL}/delete?fileName=${encodeURIComponent(fileName)}`,
          method: 'DELETE',
          headers: headers
        });

        const response = await fetch(
            `${API_BASE_URL}/delete?fileName=${encodeURIComponent(fileName)}`,
            { method: 'DELETE', headers }
        )

        const result = await response.text()
        console.log("删除响应:", result);

        if (response.ok) {
          toast.success('资源删除成功')
          // 直接过滤掉已删除的资源，而不是重新获取全部数据
          setResources(prev => prev.filter(r => r.fileName !== fileName))
          setFilteredResources(prev => prev.filter(r => r.fileName !== fileName))
        } else {
          toast.error('删除失败: ' + result)
        }
      } catch (error) {
        toast.error('删除失败: ' + (error as Error).message)
      }
    } else {
      alert('您没有权限删除此资源')
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

      const headers = getAuthHeaders();
      const url = `${API_BASE_URL}/oss/check/combined?${params.toString()}`

      console.log("组合查询请求:", {
        url,
        headers
      });

      const response = await fetch(url, { headers })
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
        r.resourceId === id ? {...r, approved: true} : r
    ))
    toast.success('资源已批准')
  }

  // 修改后的handleReject函数
  const handleReject = async (id: number, fileName: string, userName: string) => {
    if (confirm(`确定要拒绝资源 "${fileName}" 吗？`)) {
      await handleDelete(fileName, userName)
    }
  }

  const fetchProjectResources = async () => {
    setIsLoading(true)
    try {
      // 这里需要从项目中获取实际的项目名称
      const projectName = "Java项目" // 实际项目中应从用户数据获取

      const headers = getAuthHeaders();
      const url = `${API_BASE_URL}/oss/check/search-by-project-title?keyword=${encodeURIComponent(projectName)}`

      console.log("项目资源请求:", {
        url,
        headers
      });

      const response = await fetch(url, { headers })
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
          {/* 下载路径弹窗 */}
          <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>设置下载路径</DialogTitle>
                <DialogDescription>请输入文件保存路径</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="downloadPath">保存路径</Label>
                  <Input
                      id="downloadPath"
                      value={downloadPath}
                      onChange={(e) => setDownloadPath(e.target.value)}
                      placeholder="输入文件保存路径"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    setShowDownloadDialog(false);
                    toast.warning('下载已取消');
                  }}>取消</Button>
                  <Button onClick={() => {
                    if (currentDownloadFile) {
                      setShowDownloadDialog(false);
                      handleDownload(currentDownloadFile, downloadPath);
                    }
                  }}>开始下载</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

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
                  <TabsTrigger value="recommended">智能推荐</TabsTrigger>
                  <TabsTrigger value="recent">最近上传</TabsTrigger>
                  {(user.role === 'admin') && (
                      <TabsTrigger value="pending">待审核</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="all" className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResources.map((resource) => (
                        <Card key={resource.resourceId} className="hover:shadow-lg transition-shadow">
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
                              {user?.role !== 'student' && (
                                  <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDelete(resource.fileName, resource.userName)}
                                  >
                                    <X className="w-4 h-4 mr-2" />
                                    删除
                                  </Button>
                              )}
                              <Button
                                  size="sm"
                                  onClick={() => triggerDownload(resource.fileName)}
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

                <TabsContent value="recommended" className="pt-4">
                  {isLoading ? (
                      <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        <p className="ml-4 text-gray-600">正在获取智能推荐...</p>
                      </div>
                  ) : filteredResources.length === 0 ? (
                      <div className="bg-gray-100 rounded-lg p-12 text-center">
                        <Star className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700">暂无推荐资源</h3>
                        <p className="text-gray-500 mt-2">系统将根据您的项目和学习情况推荐资源</p>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredResources.map((resource) => (
                            // ... (keep the existing card rendering logic)
                            <Card key={resource.resourceId} className="hover:shadow-lg transition-shadow">
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
                                <div className="flex justify-between items-center mt-4">
                                  {/*<Button size="sm" variant="outline">*/}
                                  {/*  <ThumbsUp className="w-4 h-4 mr-2" />*/}
                                  {/*  收藏*/}
                                  {/*</Button>*/}
                                  {user?.role !== 'student' && (
                                      <Button
                                          size="sm"
                                          onClick={() => handleDelete(resource.fileName, resource.userName)}
                                      >
                                        <X className="w-4 h-4 mr-2" />
                                        删除
                                      </Button>
                                  )}
                                  <Button
                                      size="sm"
                                      onClick={() => triggerDownload(resource.fileName)}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    下载
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                        ))}
                      </div>
                  )}
                </TabsContent>

                <TabsContent value="recent" className="pt-4">
                  {filteredResources.length === 0 ? (
                      <div className="bg-gray-100 rounded-lg p-12 text-center">
                        <Clock className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700">暂无最近上传</h3>
                        <p className="text-gray-500 mt-2">您最近没有上传过资源</p>
                      </div>
                  ) : (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h2 className="text-xl font-semibold">我的最近上传</h2>
                          <span className="text-sm text-gray-500">
          共 {filteredResources.length} 个资源
        </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredResources
                              .filter(resource => resource.userName === user?.realName) // 只显示当前用户上传的资源
                              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                              .slice(0, 6) // 只显示最近6个
                              .map((resource) => (
                                  <Card key={resource.resourceId} className="hover:shadow-lg transition-shadow group">
                                    <CardHeader className="pb-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                          {getTypeIcon(resource.resourceType)}
                                          <CardTitle className="text-lg ml-2 line-clamp-1">
                                            {resource.fileName}
                                          </CardTitle>
                                        </div>
                                        <span className="text-xs text-gray-500">
                    {new Date(resource.createdAt).toLocaleDateString()}
                  </span>
                                      </div>
                                      <CardDescription className="line-clamp-2 mt-2">
                                        {resource.description || '暂无描述'}
                                      </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                                        <div className="flex items-center">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {getTypeLabel(resource.resourceType)}
                    </span>
                                        </div>
                                        <div className="flex items-center">
                    <span className="text-xs">
                      {resource.metadata?.size || '未知大小'}
                    </span>
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-center mt-4">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDelete(resource.fileName, resource.userName)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <X className="w-4 h-4 mr-2" />
                                          删除
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => triggerDownload(resource.fileName)}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                          <Download className="w-4 h-4 mr-2" />
                                          下载
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                              ))}
                        </div>

                        {filteredResources.filter(resource => resource.userName === user?.realName).length > 6 && (
                            <div className="text-center mt-6">
                              <Button variant="outline">
                                查看全部上传记录
                              </Button>
                            </div>
                        )}
                      </div>
                  )}
                </TabsContent>

                <TabsContent value="popular" className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResources.map((resource) => (
                        <Card key={resource.resourceId} className="hover:shadow-lg transition-shadow">
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
                                  onClick={() => triggerDownload(resource.fileName)}
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

                {/*<TabsContent value="favorites" className="pt-4">*/}
                {/*  <div className="bg-gray-100 rounded-lg p-12 text-center">*/}
                {/*    <Star className="w-12 h-12 text-yellow-400 mx-auto mb-4" />*/}
                {/*    <h3 className="text-xl font-semibold text-gray-700">暂无收藏资源</h3>*/}
                {/*    <p className="text-gray-500 mt-2">您可以将喜欢的资源添加到收藏夹</p>*/}
                {/*  </div>*/}
                {/*</TabsContent>*/}

                {( user.role === 'admin') && (
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
                                <Card key={resource.resourceId} className="border-l-4 border-yellow-500">
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
                                            onClick={() => handleReject(resource.resourceId, resource.fileName, resource.userName)}
                                        >
                                          <X className="w-4 h-4 mr-2" />
                                          拒绝
                                        </Button>
                                        <Button onClick={() => handleApprove(resource.resourceId)}>
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