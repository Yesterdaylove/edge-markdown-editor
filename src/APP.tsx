// src/App.tsx
import React, { useState } from 'react'

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="container">
      {/* ESA徽章 */}
      <div className="esa-badge">
        🚀 由阿里云ESA提供加速、计算和保护
      </div>
      
      {/* 英雄区域 */}
      <div className="hero">
        <h1>边缘Markdown协作编辑器</h1>
        <p>基于阿里云ESA边缘计算技术的实时协作编辑工具</p>
      </div>

      {/* 简单的Markdown编辑器 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* 编辑器区域 */}
        <div>
          <h3>📝 编辑区域</h3>
          <textarea 
            placeholder="输入Markdown内容..."
            style={{
              width: '100%',
              height: '400px',
              padding: '15px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '16px',
              fontFamily: 'monospace',
              resize: 'none'
            }}
            defaultValue="# 欢迎使用边缘Markdown编辑器

## 功能特点
- ✅ 基于阿里云ESA边缘计算
- ✅ 实时协作编辑
- ✅ 低延迟同步
- ✅ 无需后端服务器

## 技术栈
- React + TypeScript
- ESA Pages (前端部署)
- EdgeRoutine (边缘函数)
- 边缘KV存储

## 快速开始
1. 点击"创建新文档"
2. 邀请他人协作
3. 实时编辑和预览"
          />
          <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
            <button 
              style={{ 
                padding: '10px 20px', 
                background: '#4CAF50', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              保存文档
            </button>
            <button 
              style={{ 
                padding: '10px 20px', 
                background: '#2196F3', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              创建副本
            </button>
          </div>
        </div>

        {/* 预览区域 */}
        <div>
          <h3>👁️ 预览区域</h3>
          <div 
            style={{
              width: '100%',
              height: '400px',
              padding: '15px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              overflow: 'auto',
              backgroundColor: '#f9f9f9'
            }}
          >
            <h1>欢迎使用边缘Markdown编辑器</h1>
            <h2>功能特点</h2>
            <ul>
              <li>✅ 基于阿里云ESA边缘计算</li>
              <li>✅ 实时协作编辑</li>
              <li>✅ 低延迟同步</li>
              <li>✅ 无需后端服务器</li>
            </ul>
            <h2>技术栈</h2>
            <ul>
              <li>React + TypeScript</li>
              <li>ESA Pages (前端部署)</li>
              <li>EdgeRoutine (边缘函数)</li>
              <li>边缘KV存储</li>
            </ul>
            <h2>快速开始</h2>
            <ol>
              <li>点击"创建新文档"</li>
              <li>邀请他人协作</li>
              <li>实时编辑和预览</li>
            </ol>
          </div>
        </div>
      </div>

      {/* 技术展示面板 */}
      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        background: '#f5f5f5', 
        borderRadius: '10px',
        border: '1px solid #ddd'
      }}>
        <h3>🛠️ ESA技术栈展示</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginTop: '15px' }}>
          <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', color: '#667eea' }}>🌐</div>
            <div style={{ fontWeight: 'bold' }}>边缘节点</div>
            <div style={{ color: '#666', fontSize: '12px' }}>正在检测...</div>
          </div>
          <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', color: '#4CAF50' }}>⚡</div>
            <div style={{ fontWeight: 'bold' }}>网络延迟</div>
            <div style={{ color: '#666', fontSize: '12px' }}>-- ms</div>
          </div>
          <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', color: '#FF9800' }}>💾</div>
            <div style={{ fontWeight: 'bold' }}>边缘存储</div>
            <div style={{ color: '#666', fontSize: '12px' }}>已启用</div>
          </div>
          <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', color: '#9C27B0' }}>🔗</div>
            <div style={{ fontWeight: 'bold' }}>WebSocket</div>
            <div style={{ color: '#666', fontSize: '12px' }}>准备连接</div>
          </div>
        </div>
      </div>

      {/* 底部信息 */}
      <footer style={{ 
        marginTop: '40px', 
        textAlign: 'center', 
        color: '#666', 
        borderTop: '1px solid #eee',
        paddingTop: '20px'
      }}>
        <p>© 2024 边缘Markdown编辑器 - 阿里云ESA参赛作品</p>
        <p style={{ fontSize: '14px' }}>此应用完全运行在阿里云ESA边缘计算平台上</p>
      </footer>

      {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
            <div>正在连接到边缘服务器...</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App