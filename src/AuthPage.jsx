import React, { useState } from 'react';
import './styles/auth.css';

const AuthPage = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (isLogin) {
      if (!formData.username.trim() || !formData.password) {
        setError('请输入用户名和密码');
        return false;
      }
    } else {
      if (!formData.username.trim()) {
        setError('请输入用户名');
        return false;
      }
      if (!formData.email.trim()) {
        setError('请输入邮箱');
        return false;
      }
      if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
        setError('请输入有效的邮箱地址');
        return false;
      }
      if (formData.password.length < 6) {
        setError('密码至少需要6个字符');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('两次输入的密码不一致');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (isLogin) {
        // 模拟登录验证
        if (formData.username === 'demo' && formData.password === 'demo123') {
          setSuccess('登录成功！正在跳转...');
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('username', formData.username);
          setTimeout(() => onLoginSuccess(), 1500);
        } else {
          setError('用户名或密码错误');
        }
      } else {
        // 模拟注册
        setSuccess('注册成功！正在跳转登录...');
        setTimeout(() => {
          setIsLogin(true);
          setFormData({
            username: formData.username,
            email: '',
            password: '',
            confirmPassword: ''
          });
        }, 1500);
      }
    } catch (err) {
      setError(isLogin ? '登录失败，请重试' : '注册失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const useDemoAccount = () => {
    setFormData({
      username: 'demo',
      email: 'demo@example.com',
      password: 'demo123',
      confirmPassword: 'demo123'
    });
    setIsLogin(true);
    setSuccess('已加载演示账号，点击登录即可体验');
  };

  const previewContent = `# 📝 欢迎使用边缘Markdown协作编辑器

## ✨ 产品特色

### 🌐 实时协作体验
- 多人同时编辑，实时同步预览
- 在线协作者状态显示
- 实时光标位置同步

### ⚡ 边缘计算加速
- 基于阿里云ESA全球部署
- 低延迟实时同步
- 数据就近存储处理

### 💼 个人工作区
- 文档历史版本管理
- 云端自动备份
- 多设备同步访问

## 🚀 快速开始
1. **登录您的账户**
2. **创建新文档** 或 **加入协作**
3. **开始实时编辑与预览**
4. **邀请团队成员协作**

## 🔒 数据安全
- 端到端加密传输
- 定期自动备份
- 私有文档保护
- 权限分级管理

> 💡 提示：演示账号可以直接登录体验完整功能！

---

**现在就开始您的协作写作之旅吧！** ✨`;

  return (
    <div className="auth-container">
      <header className="auth-header">
        <div className="logo">
          <span className="logo-icon">🚀</span>
          <span className="logo-text">边缘协作编辑器</span>
        </div>
        <div className="header-info">
          <span className="version">v1.0.0</span>
        </div>
      </header>

      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-form-container">
            <div className="auth-tabs">
              <button
                className={`auth-tab ${isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(true)}
              >
                登录账户
              </button>
              <button
                className={`auth-tab ${!isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(false)}
              >
                注册账户
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              {error && (
                <div className="auth-error">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="auth-success">
                  <span>✅</span>
                  <span>{success}</span>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="username">用户名</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="请输入用户名"
                  required
                />
              </div>

              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="email">邮箱地址</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="请输入邮箱"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="password">密码</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={isLogin ? "请输入密码" : "请设置密码（至少6位）"}
                  required
                />
              </div>

              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="confirmPassword">确认密码</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="请再次输入密码"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                className="auth-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  '处理中...'
                ) : isLogin ? (
                  '🚀 登录系统'
                ) : (
                  '📝 注册账户'
                )}
              </button>

              <div className="demo-credentials">
                <h4>🎮 快速体验</h4>
                <ul>
                  <li>
                    <strong>演示账号:</strong> demo / demo123
                  </li>
                  <li>
                    <strong>功能:</strong> 完整编辑、协作、预览
                  </li>
                  <li>
                    <strong>数据:</strong> 云端存储，多端同步
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={useDemoAccount}
                  style={{
                    marginTop: '1rem',
                    background: 'transparent',
                    border: '1px solid #667eea',
                    color: '#667eea',
                    padding: '0.8rem',
                    borderRadius: '8px',
                    width: '100%',
                    cursor: 'pointer'
                  }}
                >
                  使用演示账号
                </button>
              </div>
            </form>
          </div>

          <div className="auth-preview-container">
            <div className="preview-header">
              <h2>✨ 功能预览</h2>
            </div>
            <div 
              className="preview-content"
              dangerouslySetInnerHTML={{
                __html: previewContent
                  .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                  .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                  .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/`(.*?)`/g, '<code>$1</code>')
                  .replace(/> (.*$)/gm, '<blockquote>$1</blockquote>')
                  .replace(/\n/g, '<br>')
              }}
            />
          </div>
        </div>
      </main>

      <footer className="auth-footer">
        <p>🚀 基于边缘计算的实时协作平台 | © 2024 All Rights Reserved</p>
        <p>技术支持：阿里云 ESA 边缘计算服务</p>
      </footer>
    </div>
  );
};

export default AuthPage;