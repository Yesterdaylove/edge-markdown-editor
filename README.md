# 边缘Markdown编辑器

> 本项目由阿里云ESA提供加速、计算和保护
![边缘编辑器架构图](images/image-info.png)

## 🚀 项目简介
基于阿里云ESA边缘计算技术的实时Markdown协作编辑器，实现毫秒级同步的多人协作编辑体验。

## 🏗️ 技术栈
- **前端**: React + TypeScript + Vite
- **边缘计算**: 阿里云ESA Pages + EdgeRoutine + 边缘KV存储
- **实时通信**: WebSocket (边缘部署)
- **编辑器**: Monaco Editor (VS Code同款)

## 🎯 功能特点
- [ ] 实时多人协作编辑
- [ ] Markdown即时预览
- [ ] 文档版本历史
- [ ] 边缘计算性能展示
- [ ] 离线编辑支持

## 🚀 快速开始

### 本地开发
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev