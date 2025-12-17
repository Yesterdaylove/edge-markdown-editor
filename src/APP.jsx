import React, { useState, useEffect, useRef } from 'react'
import './styles.css'
import './styles/auth.css'
import io from 'socket.io-client'
import AuthPage from './AuthPage'

// 添加调试输出
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5004'
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5004'

console.log('API URL:', API_URL)
console.log('Socket URL:', SOCKET_URL)

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [documentId, setDocumentId] = useState('')
  const [title, setTitle] = useState('我的文档')
  const [content, setContent] = useState(`# 欢迎使用边缘Markdown协作编辑器

## ✨ 功能特性
- 🌐 **实时协作** - 多人同时编辑，实时同步
- ⚡ **边缘计算** - 基于阿里云ESA，全球加速
- 💾 **自动保存** - 每5秒自动保存到云端
- 🔒 **安全加密** - 端到端加密传输

## 🚀 快速开始
1. 点击右上角"分享链接"邀请他人
2. 在左侧编辑Markdown内容
3. 右侧实时预览效果

## 📝 Markdown语法
- # 一级标题
- ## 二级标题
- **粗体**文字
- *斜体*文字
- \`代码\`
- - 无序列表
- 1. 有序列表`)
  
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [connectedUsers, setConnectedUsers] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [socket, setSocket] = useState(null)
  
  const saveTimeoutRef = useRef(null)
  const cursorPositionRef = useRef(0)
  const autoSaveEnabled = useRef(true) // 控制自动保存开关

  // 检查认证状态
  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated')
    const username = localStorage.getItem('username')
    if (auth === 'true' && username) {
      setIsAuthenticated(true)
      setUser({ username })
    }
  }, [])

  // 初始化文档（只在认证后执行）
  useEffect(() => {
    if (!isAuthenticated) return

    const initDocument = async () => {
      try {
        // 从URL获取文档ID，或创建新文档
        const urlParams = new URLSearchParams(window.location.search)
        const docId = urlParams.get('doc')
        
        console.log('初始化文档，docId:', docId)
        
        if (docId) {
          try {
            const response = await fetch(`${API_URL}/api/documents/${docId}`)
            console.log('获取文档响应状态:', response.status)
            
            if (response.ok) {
              const data = await response.json()
              console.log('获取文档成功:', data)
              setDocumentId(data.id)
              setTitle(data.title)
              setContent(data.content)
              connectWebSocket(docId)
            } else {
              console.log('获取文档失败，创建新文档')
              await createNewDocument()
            }
          } catch (error) {
            console.error('获取文档请求失败:', error)
            await createNewDocument()
          }
        } else {
          console.log('无文档ID，创建新文档')
          await createNewDocument()
        }
      } catch (error) {
        console.error('初始化文档失败:', error)
        await createNewDocument()
      }
    }
    
    initDocument()
    
    return () => {
      if (socket) socket.disconnect()
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [isAuthenticated])

  // 连接WebSocket
  const connectWebSocket = (docId) => {
    console.log('连接WebSocket，文档ID:', docId)
    
    try {
      const newSocket = io(SOCKET_URL, {
        query: { 
          documentId: docId,
          username: user?.username || '匿名用户'
        },
        transports: ['websocket', 'polling']
      })
      
      newSocket.on('connect', () => {
        console.log('✅ WebSocket连接成功，ID:', newSocket.id)
        setIsConnected(true)
        newSocket.emit('join-document', {
          documentId: docId,
          username: user?.username || '匿名用户'
        })
      })
      
      newSocket.on('connect_error', (error) => {
        console.error('❌ WebSocket连接错误:', error)
        setIsConnected(false)
      })
      
      newSocket.on('user-joined', (data) => {
        console.log('用户加入:', data.users)
        setConnectedUsers(data.users)
      })
      
      newSocket.on('content-updated', (data) => {
        console.log('收到内容更新:', data)
        if (data.userId !== newSocket.id) {
          setContent(data.content)
          cursorPositionRef.current = data.cursorPosition || 0
        }
      })
      
      newSocket.on('user-left', (data) => {
        console.log('用户离开:', data.users)
        setConnectedUsers(data.users)
      })
      
      newSocket.on('disconnect', (reason) => {
        console.log('WebSocket断开连接，原因:', reason)
        setIsConnected(false)
      })
      
      setSocket(newSocket)
    } catch (error) {
      console.error('创建WebSocket失败:', error)
    }
  }

  // 创建新文档
  const createNewDocument = async () => {
    console.log('开始创建新文档...')
    
    try {
      const response = await fetch(`${API_URL}/api/documents`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          title: '新文档', 
          content: '# 新文档',
          createdBy: user?.username || '匿名用户'
        })
      })
      
      console.log('创建文档响应状态:', response.status)
      
      const data = await response.json()
      console.log('创建文档成功:', data)
      
      setDocumentId(data.id)
      
      // 更新URL
      window.history.replaceState({}, '', `?doc=${data.id}`)
      console.log('URL更新为:', window.location.href)
      
      connectWebSocket(data.id)
    } catch (error) {
      console.error('创建文档失败:', error)
      // 模拟一个文档ID，便于测试
      const mockId = 'mock-' + Date.now()
      setDocumentId(mockId)
      window.history.replaceState({}, '', `?doc=${mockId}`)
      console.log('使用模拟文档ID:', mockId)
    }
  }

  // 保存文档
  const saveDocument = async () => {
    if (!documentId) {
      console.error('文档ID为空，无法保存')
      setSaveStatus('文档未初始化 ✗')
      setTimeout(() => setSaveStatus(''), 2000)
      return
    }
    
    if (isSaving) {
      console.log('保存正在进行中，跳过')
      return
    }
    
    console.log('开始保存文档，ID:', documentId)
    console.log('保存内容长度:', content.length)
    
    setIsSaving(true)
    setSaveStatus('保存中...')
    
    try {
      const requestBody = {
        title: title || '无标题',
        content: content || '',
        updatedBy: user?.username || '匿名用户'
      }
      
      console.log('保存请求体:', requestBody)
      
      const response = await fetch(`${API_URL}/api/documents/${documentId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log('保存响应状态:', response.status)
      console.log('保存响应头:', response.headers)
      
      if (response.ok) {
        const responseData = await response.json().catch(() => ({}))
        console.log('保存成功:', responseData)
        setSaveStatus('保存成功 ✓')
        setTimeout(() => setSaveStatus(''), 2000)
        
        // 广播更新
        if (socket && socket.connected) {
          socket.emit('content-update', {
            documentId,
            content,
            cursorPosition: cursorPositionRef.current
          })
          console.log('已广播更新给其他用户')
        }
      } else {
        let errorText = ''
        try {
          errorText = await response.text()
        } catch (e) {
          errorText = response.statusText
        }
        console.error('保存失败，状态:', response.status, '错误:', errorText)
        setSaveStatus('保存失败 ✗')
      }
    } catch (error) {
      console.error('保存请求失败:', error)
      setSaveStatus('网络错误 ✗')
    } finally {
      setIsSaving(false)
    }
  }

  // 自动保存
  useEffect(() => {
    if (!isAuthenticated || !autoSaveEnabled.current) return
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      if (documentId && content.trim()) {
        console.log('自动保存触发，文档ID:', documentId)
        saveDocument()
      } else {
        console.log('自动保存跳过: 文档ID或内容为空')
      }
    }, 5000)
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [content, documentId, isAuthenticated])

  // 处理内容变化
  const handleContentChange = (e) => {
    const newContent = e.target.value
    setContent(newContent)
    cursorPositionRef.current = e.target.selectionStart
  }

  // 手动保存（点击保存按钮）
  const handleManualSave = () => {
    console.log('手动保存按钮点击')
    saveDocument()
  }

  // 复制分享链接
  const copyShareLink = () => {
    const shareLink = `${window.location.origin}${window.location.pathname}?doc=${documentId}`
    console.log('复制分享链接:', shareLink)
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        alert('分享链接已复制到剪贴板！\n' + shareLink)
      })
      .catch(() => {
        alert('复制失败，请手动复制URL')
      })
  }

  // 导出文档
  const exportDocument = () => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'document'}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    console.log('文档导出成功:', title)
  }

  // 登出
  // 登出
  const handleLogout = () => {
    console.log('开始登出流程...')
    
    // 先清除本地存储
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('username')
    localStorage.removeItem('token')
    
    // 优雅地断开socket连接
    if (socket) {
      console.log('正在断开WebSocket连接...')
      
      // 先发送离开消息（如果socket还连接着）
      if (socket.connected && documentId) {
        try {
          socket.emit('leave-document', {
            documentId,
            username: user?.username
          })
          console.log('已发送离开文档消息')
        } catch (e) {
          console.log('发送离开消息失败:', e)
        }
      }
      
      // 关闭所有事件监听器
      socket.off('connect')
      socket.off('connect_error')
      socket.off('user-joined')
      socket.off('content-updated')
      socket.off('user-left')
      socket.off('disconnect')
      
      // 断开连接
      setTimeout(() => {
        socket.disconnect()
        console.log('WebSocket已断开')
      }, 100)
    }
    
    // 清除状态
    setIsAuthenticated(false)
    setUser(null)
    setDocumentId('')
    setConnectedUsers([])
    setSocket(null)
    
    // 清除超时
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    
    console.log('用户已登出')
  }

  // 处理登录成功
  const handleLoginSuccess = () => {
    const username = localStorage.getItem('username')
    console.log('登录成功，用户:', username)
    setUser({ username })
    setIsAuthenticated(true)
  }

  // 测试API连接
  const testApiConnection = async () => {
    console.log('测试API连接...')
    try {
      const response = await fetch(API_URL)
      console.log('API连接测试结果:', {
        status: response.status,
        ok: response.ok,
        url: API_URL
      })
      alert(`API连接测试: ${response.ok ? '成功' : '失败'}\n状态码: ${response.status}\nURL: ${API_URL}`)
    } catch (error) {
      console.error('API连接测试失败:', error)
      alert(`API连接失败: ${error.message}\n请检查后端服务是否启动`)
    }
  }

  // Markdown渲染
  const renderMarkdown = (text) => {
    return text
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/^\d\. (.*$)/gm, '<li>$1</li>')
      .replace(/\n/g, '<br>')
  }

  // 用户列表组件
  const UserList = () => (
    <div className="user-list">
      <div className="user-list-title">
        <span>👥 在线协作者</span>
        <span className="connection-status">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
          {isConnected ? '已连接' : '连接中'}
        </span>
      </div>
      <div className="users">
        {user && (
          <div className="user-item current-user">
            <div className="user-avatar">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span className="user-name">{user.username} (我)</span>
          </div>
        )}
        {connectedUsers.filter(u => u !== user?.username).length > 0 ? (
          connectedUsers
            .filter(u => u !== user?.username)
            .map((userName, index) => (
              <div key={index} className="user-item">
                <div className="user-avatar">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="user-name">{userName}</span>
              </div>
            ))
        ) : (
          <div className="no-users">暂无其他协作者</div>
        )}
      </div>
      <div className="debug-controls">
        <button 
          className="btn-debug"
          onClick={testApiConnection}
        >
          🔧 测试API连接
        </button>
        <button 
          className="btn-debug"
          onClick={() => console.log('调试信息:', {
            documentId,
            title,
            contentLength: content.length,
            isSaving,
            saveStatus,
            isConnected,
            connectedUsers,
            API_URL,
            SOCKET_URL
          })}
        >
          📊 显示状态
        </button>
      </div>
    </div>
  )

  // 如果未认证，显示登录页面
  if (!isAuthenticated) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="app-container">
      {/* 顶部导航栏 */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">📝</span>
          <span className="logo-text">边缘Markdown编辑器</span>
        </div>
        
        <div className="header-controls">
          <input
            type="text"
            className="title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="文档标题"
          />
          
          <div className="status-indicator">
            {saveStatus && <span className="save-status">{saveStatus}</span>}
            <button
              className={`save-btn ${isSaving ? 'saving' : ''}`}
              onClick={handleManualSave}
              disabled={isSaving}
            >
              {isSaving ? '💾 保存中...' : '💾 保存'}
            </button>
          </div>
          
          <div className="action-buttons">
            <button className="btn btn-secondary" onClick={copyShareLink}>
              🔗 分享链接
            </button>
            <button className="btn btn-secondary" onClick={exportDocument}>
              📥 导出
            </button>
            <div className="user-profile">
              <span className="user-avatar-sm">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
              <span className="user-name-sm">{user?.username}</span>
              <button 
                className="btn btn-logout"
                onClick={handleLogout}
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主编辑区 */}
      <div className="main-content">
        {/* 侧边栏 - 用户列表 */}
        <aside className="sidebar">
          <UserList />
          
          <div className="document-info">
            <h3>📄 文档信息</h3>
            <div className="info-item">
              <span>所有者:</span>
              <span>{user?.username}</span>
            </div>
            <div className="info-item">
              <span>文档ID:</span>
              <code className="doc-id" title={documentId}>
                {documentId ? `${documentId.substring(0, 8)}...` : '未创建'}
              </code>
            </div>
            <div className="info-item">
              <span>字符数:</span>
              <span>{content.length}</span>
            </div>
            <div className="info-item">
              <span>API状态:</span>
              <span className={API_URL.includes('localhost') ? 'status-local' : 'status-remote'}>
                {API_URL.includes('localhost') ? '本地' : '远程'}
              </span>
            </div>
          </div>
        </aside>

        {/* 编辑器区域 */}
        <div className="editor-area">
          {/* 编辑器 */}
          <div className="editor-panel">
            <div className="panel-header">
              <span className="panel-icon">✏️</span>
              <span>编辑器</span>
              <span className="panel-hint">支持标准Markdown语法</span>
              <span className="auto-save-status">
                自动保存: <span className={autoSaveEnabled.current ? 'auto-save-on' : 'auto-save-off'}>
                  {autoSaveEnabled.current ? '开启' : '关闭'}
                </span>
              </span>
            </div>
            <textarea
              className="editor-textarea"
              value={content}
              onChange={handleContentChange}
              placeholder="开始编写Markdown内容..."
              spellCheck="false"
            />
          </div>

          {/* 预览器 */}
          <div className="preview-panel">
            <div className="panel-header">
              <span className="panel-icon">👁️</span>
              <span>实时预览</span>
              <span className="panel-hint">
                {connectedUsers.length > 1 ? `👥 ${connectedUsers.length}人协作中` : '单人编辑'}
              </span>
            </div>
            <div
              className="preview-content"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
            />
          </div>
        </div>
      </div>

      {/* 底部状态栏 */}
      <footer className="footer">
        <div className="footer-status">
          <div className="status-item">
            <span className="status-label">用户:</span>
            <span className="status-value">{user?.username}</span>
          </div>
          <div className="status-item">
            <span className="status-label">API:</span>
            <span className="status-value" title={API_URL}>
              {API_URL.replace('http://', '').replace('https://', '').split('/')[0]}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">文档ID:</span>
            <span className="status-value doc-id-small" title={documentId}>
              {documentId ? `${documentId.substring(0, 6)}...` : '无'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">状态:</span>
            <span className={`status-value ${isConnected ? 'status-connected' : 'status-disconnected'}`}>
              {isConnected ? '在线' : '离线'}
            </span>
          </div>
        </div>
        
        <div className="footer-copyright">
          <span>🚀 基于阿里云ESA边缘计算 | © 2024 实时协作编辑器 | 打开浏览器控制台查看调试信息</span>
        </div>
      </footer>

      {/* 加载遮罩 */}
      {isSaving && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div>正在保存到边缘存储...</div>
            <div className="loading-details">文档ID: {documentId}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App