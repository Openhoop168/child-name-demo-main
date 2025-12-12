# 儿童识字小报生成器

一个专为5-9岁儿童设计的智能识字工具，通过AI技术生成个性化的识字小报，帮助孩子们在有趣的场景中学习汉字。

## 🌟 功能特点

- **智能提示词生成**：根据主题自动生成包含15-20个相关词汇的AI绘图提示词
- **丰富词汇库**：涵盖超市、医院、公园、学校等多个常见场景
- **高质量图片生成**：使用Nano Banana Pro API生成4K分辨率的精美图片
- **安全存储**：本地加密存储用户数据和API密钥
- **响应式设计**：支持桌面和移动设备
- **用户体验优化**：步骤化引导，操作简单直观

## 🚀 快速开始

### 1. 克隆或下载项目

```bash
git clone <repository-url>
cd zhuanpan
```

### 2. 配置环境变量

1. **创建环境变量文件**：
   ```bash
   # 复制模板文件
   cp .env.example .env.local
   ```

2. **编辑环境变量**：
   打开 `.env.local` 文件，配置必要的环境变量：

   ```env
   # Nano Banana Pro API 配置（必填）
   NANO_BANANA_API_KEY=your_actual_api_key_here
   NANO_BANANA_API_ENDPOINT=https://api.kie.ai/api/v1/jobs/

   # 其他配置（可选，使用默认值）
   DEFAULT_RESOLUTION=4K
   DEFAULT_ASPECT_RATIO=3:4
   DEFAULT_OUTPUT_FORMAT=png
   ```

3. **获取API密钥**：
   - 访问 [API密钥管理页面](https://kie.ai/api-key)
   - 注册并获取您的API密钥
   - 将密钥填入 `NANO_BANANA_API_KEY`

### 3. 构建配置文件

运行构建脚本生成应用配置：

```bash
# 使用Node.js构建（推荐）
node build.js

# 或者如果没有Node.js，可以手动创建 js/config.js
# （参考 config.template.js 格式）
```

构建成功后会显示：
- ✅ 配置文件已生成
- ✅ 包信息文件已生成
- ✅ 配置文件语法验证通过

### 4. 运行应用

**方式一：直接打开（开发模式）**
```bash
# 直接在浏览器中打开
open index.html
```

**方式二：使用本地服务器（推荐）**
```bash
# Python 3
python -m http.server 8000

# Node.js (需要安装 http-server)
npx http-server

# 或者使用任何其他本地服务器
```

然后在浏览器中访问 `http://localhost:8000`

### 4. 开始使用

1. **输入信息**：输入主题（如：超市、医院）和标题（如：《走进超市》）
2. **预览提示词**：查看生成的AI绘图提示词和词汇列表
3. **生成图片**：调用AI生成识字小报图片
4. **下载保存**：下载生成的图片用于教学

## 📁 项目结构

```
zhuanpan/
├── index.html                 # 主页面
├── css/
│   └── style.css             # 主样式文件
├── js/
│   ├── app.js                # 主应用入口
│   ├── vocabulary-manager.js # 词汇管理器
│   ├── prompt-generator.js   # 提示词生成器
│   ├── api-client.js         # Nano Banana API客户端
│   ├── storage-manager.js    # 存储管理器
│   └── security-utils.js     # 安全工具
├── data/
│   └── vocabulary.json       # 词汇库数据
└── README.md                 # 说明文档
```

## 🎯 使用指南

### 基本使用流程

1. **填写基本信息**
   - 主题/场景：输入一个适合儿童学习的场景（如：公园、学校）
   - 小报标题：为识字小报起一个吸引人的标题（如：《美丽公园》）

2. **使用快速示例**
   - 点击预设的示例卡片快速填充内容
   - 支持的主题：超市、医院、公园、学校

3. **预览和编辑**
   - 查看自动生成的提示词和词汇列表
   - 可以手动编辑提示词进行微调
   - 词汇按类别分为：核心角色与设施、常见物品/工具、环境与装饰

4. **生成图片**
   - 点击"生成图片"开始AI生成过程
   - 实时查看生成进度和状态日志
   - 生成时间通常为30-60秒

5. **保存和分享**
   - 下载生成的PNG格式图片
   - 图片为竖版A4比例，适合打印
   - 每个词汇都带有拼音标签

### 快捷键操作

- `Ctrl/Cmd + Enter`：在步骤1提交表单，在步骤2开始生成
- `Esc`：返回上一步

## 🔧 技术架构

### 前端技术栈

- **HTML5**：页面结构和语义化标记
- **CSS3**：响应式设计，支持桌面和移动端
- **Vanilla JavaScript**：纯JavaScript实现，无框架依赖

### 核心模块

1. **词汇管理器** (`vocabulary-manager.js`)
   - 管理主题词汇库
   - 智能匹配主题
   - 词汇分类和格式化

2. **提示词生成器** (`prompt-generator.js`)
   - 基于模板生成AI提示词
   - 词汇提取和格式化
   - 多语言拼音支持

3. **API客户端** (`api-client.js`)
   - Nano Banana Pro API集成
   - 任务创建和状态轮询
   - 错误处理和重试机制

4. **存储管理器** (`storage-manager.js`)
   - 本地数据存储
   - 历史记录管理
   - 缓存和性能优化

5. **安全工具** (`security-utils.js`)
   - 数据加密存储
   - API密钥安全保护
   - 输入验证和内容安全

## 📊 支持的主题

内置支持以下主题场景：

| 主题 | 描述 | 词汇数量 |
|------|------|----------|
| 超市 | 超市购物场景，包含收银员、货架、推车等 | 18个 |
| 医院 | 医院就诊场景，包含医生、护士、药箱等 | 18个 |
| 公园 | 公园游玩场景，包含花草树木、游乐设施等 | 18个 |
| 学校 | 学校学习场景，包含老师、学生、教室等 | 18个 |
| 家庭 | 家庭生活场景，包含父母、家具、日用品等 | 18个 |
| 动物园 | 动物园参观场景，包含各种动物 | 18个 |

## 🔒 安全和隐私

- **本地存储**：所有数据都存储在浏览器本地
- **加密保护**：敏感数据使用本地加密存储
- **无服务器依赖**：纯前端应用，保护用户隐私
- **内容安全**：输入内容经过安全验证和过滤

## ⚙️ 配置管理

### 环境变量说明

项目支持通过环境变量进行配置管理，主要变量包括：

#### 必需配置
- `NANO_BANANA_API_KEY`: Nano Banana Pro API密钥（必填）

#### 可选配置
- `NANO_BANANA_API_ENDPOINT`: API端点（默认：官方端点）
- `DEFAULT_RESOLUTION`: 默认分辨率（1K/2K/4K，默认：4K）
- `DEFAULT_ASPECT_RATIO`: 默认宽高比（默认：3:4）
- `DEFAULT_OUTPUT_FORMAT`: 默认输出格式（png/jpg，默认：png）

#### 应用配置
- `APP_TITLE`: 应用标题（默认：儿童识字小报生成器）
- `APP_VERSION`: 应用版本
- `DEBUG_MODE`: 调试模式（true/false）
- `ENABLE_USAGE_STATS`: 使用统计（true/false）

### 构建脚本使用

#### 基本构建
```bash
node build.js
```

#### 清理生成的文件
```bash
node build.js clean
```

#### 构建过程中的验证

构建脚本会自动进行以下验证：

1. **环境变量验证**
   - 检查必需变量是否设置
   - 验证数值类型和布尔类型格式

2. **配置文件生成**
   - 替换模板变量
   - 生成 `js/config.js` 文件
   - 创建包信息文件

3. **语法验证**
   - 检查生成的配置文件语法
   - 验证是否有未替换的变量

### 配置文件结构

生成的 `js/config.js` 包含以下配置：

```javascript
window.APP_CONFIG = {
    nanoBanana: {
        apiKey: "您的API密钥",
        apiEndpoint: "API端点",
        defaultParams: {
            resolution: "4K",
            aspectRatio: "3:4",
            outputFormat: "png"
        }
    },
    app: {
        title: "儿童识字小报生成器",
        version: "1.0.0",
        debugMode: false
    },
    // ... 更多配置
};
```

### 开发环境配置

对于开发环境，您可以：

1. **创建开发配置**：
   ```env
   # .env.local
   DEV_MODE=true
   DEBUG_MODE=true
   NANO_BANANA_API_KEY=your_dev_key
   ```

2. **使用测试端点**：
   ```env
   NANO_BANANA_API_ENDPOINT=https://api-test.kie.ai/api/v1/jobs/
   ```

3. **启用详细日志**：
   ```env
   DEBUG_MODE=true
   POLLING_INTERVAL=1000  # 更快的轮询间隔
   ```

### 安全注意事项

- ✅ **安全**：API密钥存储在环境变量中，不暴露在代码中
- ✅ **隔离**：不同环境使用不同的配置文件
- ✅ **版本控制**：`.env.local` 文件已添加到 `.gitignore`
- ✅ **验证**：构建时自动验证配置格式和内容

## 🎨 自定义和扩展

### 添加新主题

1. 编辑 `data/vocabulary.json` 文件
2. 在 `themes` 对象中添加新的主题数据
3. 按照现有格式添加词汇数据
4. 刷新页面即可使用新主题

### 修改生成参数

在 `api-client.js` 中的 `buildAPIParams` 方法可以调整：
- 图片分辨率
- 宽高比
- 输出格式
- 其他API参数

### 自定义样式

修改 `css/style.css` 中的CSS变量：
```css
:root {
    --primary-color: #FF6B6B;    /* 主色调 */
    --secondary-color: #4ECDC4;  /* 辅助色 */
    --accent-color: #45B7D1;     /* 强调色 */
    /* 更多颜色变量... */
}
```

## 🐛 问题排查

### 常见问题

#### 配置相关问题

1. **配置错误：应用配置未找到**
   - 确保已运行 `node build.js` 生成配置文件
   - 检查 `js/config.js` 文件是否存在
   - 查看构建过程中的错误信息

2. **环境变量未设置**
   - 复制 `.env.example` 为 `.env.local`
   - 在 `.env.local` 中设置必需的环境变量
   - 重新运行构建脚本

3. **API密钥配置错误**
   - 检查密钥格式是否正确（应该包含字母、数字、连字符或下划线）
   - 确认API密钥有效且有足够余额
   - 检查环境变量中是否正确设置了 `NANO_BANANA_API_KEY`

4. **构建失败：语法错误**
   - 检查环境变量值是否包含特殊字符
   - 确保布尔值使用 true/false
   - 验证数值类型的变量

#### 运行时问题

5. **图片生成失败**
   - 检查网络连接
   - 查看控制台错误信息
   - 确认API端点配置正确
   - 验证提示词内容合规

6. **加载缓慢**
   - 检查网络速度
   - 尝试刷新页面
   - 清除浏览器缓存
   - 检查API响应时间

7. **本地存储问题**
   - 检查浏览器是否支持localStorage
   - 清理过期的存储数据
   - 重置应用设置

8. **配置验证警告**
   - 查看浏览器控制台的警告信息
   - 根据提示调整配置
   - 某些警告不影响核心功能

### 获取帮助

- 查看浏览器控制台获取详细错误信息
- 检查网络连接和API服务状态
- 确认浏览器支持所需的Web API

## 📱 浏览器兼容性

- **Chrome** 80+
- **Firefox** 75+
- **Safari** 13+
- **Edge** 80+

需要支持以下Web API：
- localStorage
- Fetch API
- Web Crypto API（可选，用于加密）

## 🔄 版本历史

### v1.0.0 (2024-12-09)
- 初始版本发布
- 支持基本的识字小报生成功能
- 内置6个主题场景
- 完整的前端界面和交互

## 📄 许可证

本项目采用 MIT 许可证。详见 LICENSE 文件。

## 🤝 贡献

欢迎提交问题报告和功能建议！

1. Fork 本项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件
- 项目讨论区

---

**让学习变得更有趣！** 🎈📚✨