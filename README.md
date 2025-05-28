# Exam System

本项目为在线考试系统，包含后端（基于 NestJS）和前端（基于 React）两部分。适用于在线组卷、考试发布、答题与成绩管理等场景。

## 目录结构

```
exam-system/              # 后端（NestJS）
exam-system-frontend/     # 前端（React）
```

---

## 一、后端（exam-system）

### 1. 环境准备

- Node.js 版本建议 >= 18
- pnpm 包管理器
- 数据库（如 MySQL，需提前创建好数据库并配置好连接）

### 2. 安装依赖

```bash
cd exam-system
pnpm install
```

### 3. 配置环境变量

创建.env文件，设置 `DATABASE_URL`
并启动本地redis，端口为6379

### 4. 数据库迁移

```bash
pnpm prisma db push
```

### 5. 启动后端服务

启动所有微服务：

```bash
pnpm run start:all
```

---

## 二、前端（exam-system-frontend）

### 1. 环境准备

- Node.js 版本建议 >= 18
- pnpm 包管理器

### 2. 安装依赖

```bash
cd exam-system-frontend
pnpm install
```

### 3. 启动前端服务

开发模式：

```bash
pnpm run dev
```

访问 http://localhost:3000

---
