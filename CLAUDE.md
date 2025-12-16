# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

儿童识字小报生成器是一个专为5-9岁儿童设计的AI应用，通过Nano Banana Pro API生成个性化的识字小报来帮助儿童学习。项目采用纯前端技术栈，具有完整的商业化功能。

## 常用开发命令

### 构建配置
```bash
# 生成配置文件（从环境变量和模板）
node build.js

# 清理生成的配置文件
node build.js clean
```

### 本地开发运行
```bash
# 方法1：使用Python本地服务器（推荐）
python -m http.server 8000

# 方法2：使用Node.js http-server
npx http-server

# 方法3：直接在浏览器打开（简单测试）
start index.html  # Windows
open index.html    # macOS
```

### 测试
```bash
# 功能测试 - 直接在浏览器打开
open test-api-client.html          # API客户端测试
open test-usage-tracker.html       # 使用量追踪测试
open test-download-control.html    # 下载控制测试
open test-payment-integration.html # 支付集成测试

# 验证测试
open verify-download-control.html  # 验证下载控制
open verify-task13.2.html          # 验证任务13.2
```

## 项目架构

### 技术栈
- **前端**: HTML5 + CSS3 + Vanilla JavaScript（无框架依赖）
- **API服务**: Nano Banana Pro API（AI图片生成）
- **部署**: GitHub Pages
- **存储**: localStorage + 本地加密存储
- **构建工具**: Node.js（仅用于配置管理）

### 核心模块结构
```
js/
├── app.js                 # 主应用入口，控制整体流程
├── config.js              # 运行时配置（由build.js生成）
├── vocabulary-manager.js  # 词汇库管理器，处理主题词汇
├── prompt-generator.js    # AI提示词生成器
├── api-client.js          # Nano Banana API客户端
├── storage-manager.js     # 本地存储管理器
├── security-utils.js      # 安全工具（加密、验证等）
├── usage-tracker.js       # 使用量统计和配额管理
├── payment-manager.js     # 支付管理系统
└── package-info.json      # 包信息（由build.js生成）
```

### 配置管理系统
- **配置模板**: `config.template.js` - 包含所有可配置项的模板
- **环境变量**: `.env.local` - 本地环境变量配置
- **构建脚本**: `build.js` - 读取环境变量，生成运行时配置
- **运行时配置**: `js/config.js` - 应用实际使用的配置文件

### 商业化功能架构
1. **API密钥管理**: 用户使用自己的API密钥
2. **使用量追踪**: 日/月使用配额管理
3. **下载控制**: 基于会员等级的下载限制
4. **支付系统**: 支持支付宝和微信支付
5. **会员体系**: 四级会员套餐（免费、基础、专业、高级）

## 重要提醒

### 配置管理
- **不要手动编辑** `js/config.js`，它是由构建脚本生成的
- 修改配置后必须重新运行 `node build.js`
- 环境变量优先级：`.env.local` > `.env` > 系统环境变量 > 默认值

### API密钥安全
- API密钥存储在环境变量中，不要硬编码在代码里
- 生产环境部署前需要重新构建配置文件
- 密钥使用XOR加密存储在localStorage中

### 项目特点
- **纯前端架构**: 无后端依赖，所有处理在浏览器端完成
- **模块化设计**: 高度解耦的模块结构，便于维护和扩展
- **安全优先**: 多重安全防护机制
- **商业成熟**: 完整的付费体系和用户管理

## 开发注意事项

### 环境变量配置
创建 `.env.local` 文件：
```env
# 必需配置
NANO_BANANA_API_KEY=your_actual_api_key_here
NANO_BANANA_API_ENDPOINT=https://api.kie.ai/api/v1/jobs/

# 可选配置
APP_TITLE=儿童识字小报生成器
DEBUG_MODE=false
DEFAULT_RESOLUTION=4K
DEFAULT_ASPECT_RATIO=3:4

# 功能开关
ENABLE_USAGE_STATS=true
ENABLE_GENERATION_HISTORY=true
ENABLE_PAYMENT=true
```

### 开发规范
- 使用ES6+语法特性
- 每个模块都要有完整的错误处理
- 所有用户输入必须经过验证和过滤
- 敏感数据必须加密存储
- 添加详细的中文注释

### 测试策略
- 单元测试：每个核心模块都有对应的测试文件
- 集成测试：完整功能流程验证
- 浏览器兼容性：支持主流浏览器
- 性能测试：确保响应速度

### 部署流程
1. 推送代码到GitHub仓库
2. 在GitHub仓库设置中启用Pages功能
3. 选择从main分支部署
4. 访问 `https://username.github.io/repository-name/`

### 常见问题排查
- 如果配置不生效：检查是否运行了 `node build.js`
- 如果API调用失败：检查API密钥和网络连接
- 如果功能异常：查看浏览器控制台错误信息
- 如果存储问题：检查localStorage是否可用

## 文件修改指南

### 当修改配置时
1. 编辑 `.env.local` 文件
2. 运行 `node build.js` 重新生成配置
3. 刷新浏览器页面

### 当添加新功能时
1. 在相应的js模块中添加功能
2. 创建对应的测试文件
3. 更新 implement-tasks.md 记录
4. 如果需要新配置，更新 config.template.js

### 当修复bug时
1. 找到相关模块进行修复
2. 运行对应的测试验证
3. 在 implement-tasks.md 中记录修复内容

## 项目状态参考

当前项目已完成核心功能开发，包括：
- ✅ 基础识字小报生成功能
- ✅ API密钥用户自备系统
- ✅ 使用量追踪和配额管理
- ✅ 下载次数控制
- ✅ 支付系统集成（UI部分）
- ✅ 完整的安全防护机制

更多详细信息请参考：
- `technical-design.md` - 详细技术设计文档
- `implement-tasks.md` - 实施任务跟踪记录
- `memory.md` - 项目记忆文档
- `DEPLOYMENT.md` - 部署指南