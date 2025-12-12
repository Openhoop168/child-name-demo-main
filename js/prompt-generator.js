/**
 * 提示词生成器
 * 负责根据用户输入和词汇库生成完整的AI绘图提示词
 */

class PromptGenerator {
    constructor() {
        this.template = this.getTemplate();
    }

    /**
     * 获取提示词模板
     */
    getTemplate() {
        return `请生成一张儿童识字小报《{{主题/场景}}》，竖版 A4，学习小报版式，适合 5–9 岁孩子 认字与看图识物。

# 一、小报标题区（顶部）

**顶部居中大标题**：《{{标题}}》
* **风格**：十字小报 / 儿童学习报感
* **文本要求**：大字、醒目、卡通手写体、彩色描边
* **装饰**：周围添加与 {{主题/场景}} 相关的贴纸风装饰，颜色鲜艳

# 二、小报主体（中间主画面）

画面中心是一幅 **卡通插画风的「{{主题/场景}}」场景**：
* **整体气氛**：明亮、温暖、积极
* **构图**：物体边界清晰，方便对应文字，不要过于拥挤。

**场景分区与核心内容**
1.  **核心区域 A（主要对象）**：表现 {{主题/场景}} 的核心活动。
2.  **核心区域 B（配套设施）**：展示相关的工具或物品。
3.  **核心区域 C（环境背景）**：体现环境特征（如墙面、指示牌等）。

**主题人物**
* **角色**：1 位可爱卡通人物（职业/身份：与 {{主题/场景}} 匹配）。
* **动作**：正在进行与场景相关的自然互动。

# 三、必画物体与识字清单（Generated Content）

**请务必在画面中清晰绘制以下物体，并为其预留贴标签的位置：**

**1. 核心角色与设施：**
{{核心词汇列表}}

**2. 常见物品/工具：**
{{常见物品词汇列表}}

**3. 环境与装饰：**
{{环境词汇列表}}

*(注意：画面中的物体数量不限于此，但以上列表必须作为重点描绘对象)*

# 四、识字标注规则

对上述清单中的物体，贴上中文识字标签：
* **格式**：两行制（第一行拼音带声调，第二行简体汉字）。
* **样式**：彩色小贴纸风格，白底黑字或深色字，清晰可读。
* **排版**：标签靠近对应的物体，不遮挡主体。

# 五、画风参数
* **风格**：儿童绘本风 + 识字小报风
* **色彩**：高饱和、明快、温暖 (High Saturation, Warm Tone)
* **质量**：8k resolution, high detail, vector illustration style, clean lines.`;
    }

    /**
     * 生成完整提示词
     * @param {string} theme - 主题/场景
     * @param {string} title - 标题
     * @param {Object} vocabulary - 词汇对象
     * @returns {Object} 包含提示词和词汇信息的对象
     */
    generatePrompt(theme, title, vocabulary = null) {
        try {
            // 如果没有提供词汇，尝试从词汇管理器获取
            if (!vocabulary && window.vocabularyManager) {
                vocabulary = window.vocabularyManager.getCompleteVocabulary(theme);
            }

            // 如果仍然没有词汇，使用默认词汇
            if (!vocabulary) {
                vocabulary = this.getDefaultVocabulary(theme);
            }

            // 格式化词汇列表
            const coreVocabularyText = this.formatVocabularyForPrompt(vocabulary.core || []);
            const commonVocabularyText = this.formatVocabularyForPrompt(vocabulary.common || []);
            const environmentVocabularyText = this.formatVocabularyForPrompt(vocabulary.environment || []);

            // 替换模板中的占位符
            let prompt = this.template
                .replace(/\{\{主题\/场景\}\}/g, theme)
                .replace(/\{\{标题\}\}/g, title)
                .replace(/\{\{核心词汇列表\}\}/g, coreVocabularyText)
                .replace(/\{\{常见物品词汇列表\}\}/g, commonVocabularyText)
                .replace(/\{\{环境词汇列表\}\}/g, environmentVocabularyText);

            return {
                prompt,
                vocabulary,
                metadata: {
                    theme,
                    title,
                    generatedAt: new Date().toISOString(),
                    vocabularyCount: vocabulary.all ? vocabulary.all.length : 0
                }
            };

        } catch (error) {
            console.error('生成提示词失败:', error);
            throw error;
        }
    }

    /**
     * 格式化词汇为提示词文本
     */
    formatVocabularyForPrompt(vocabularyList) {
        if (!vocabularyList || vocabularyList.length === 0) {
            return '（暂无词汇）';
        }

        return vocabularyList
            .map(item => `${item.pinyin} ${item.hanzi}`)
            .join(', ');
    }

    /**
     * 获取默认词汇（备用方案）
     */
    getDefaultVocabulary(theme) {
        const defaultVocabulary = {
            core: [
                { pinyin: 'hǎo péng yǒu', hanzi: '好朋友', type: '人物', category: 'core' },
                { pinyin: 'xué xí', hanzi: '学习', type: '活动', category: 'core' },
                { pinyin: 'kuài lè', hanzi: '快乐', type: '情绪', category: 'core' }
            ],
            common: [
                { pinyin: 'shū běn', hanzi: '书本', type: '物品', category: 'common' },
                { pinyin: 'wán jù', hanzi: '玩具', type: '物品', category: 'common' },
                { pinyin: 'huā', hanzi: '花', type: '植物', category: 'common' },
                { pinyin: 'cǎo', hanzi: '草', type: '植物', category: 'common' }
            ],
            environment: [
                { pinyin: 'tài yáng', hanzi: '太阳', type: '自然', category: 'environment' },
                { pinyin: 'yún', hanzi: '云', type: '自然', category: 'environment' },
                { pinyin: 'fáng zi', hanzi: '房子', type: '建筑', category: 'environment' }
            ],
            all: []
        };

        defaultVocabulary.all = [
            ...defaultVocabulary.core,
            ...defaultVocabulary.common,
            ...defaultVocabulary.environment
        ];

        return defaultVocabulary;
    }

    /**
     * 验证输入参数
     */
    validateInput(theme, title) {
        const errors = [];

        if (!theme || typeof theme !== 'string' || theme.trim().length === 0) {
            errors.push('主题不能为空');
        }

        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            errors.push('标题不能为空');
        }

        if (theme && theme.length > 20) {
            errors.push('主题过长，请控制在20字以内');
        }

        if (title && title.length > 30) {
            errors.push('标题过长，请控制在30字以内');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 生成预览数据
     */
    generatePreview(theme, title) {
        const validation = this.validateInput(theme, title);

        if (!validation.isValid) {
            return {
                success: false,
                errors: validation.errors
            };
        }

        try {
            // 尝试匹配主题
            let matchedTheme = theme;
            if (window.vocabularyManager) {
                const bestMatch = window.vocabularyManager.findBestMatchingTheme(theme);
                if (bestMatch) {
                    matchedTheme = bestMatch;
                }
            }

            const result = this.generatePrompt(matchedTheme, title, null);

            return {
                success: true,
                data: {
                    ...result,
                    originalTheme: theme,
                    matchedTheme,
                    themeMatched: matchedTheme !== theme
                }
            };

        } catch (error) {
            return {
                success: false,
                errors: ['生成预览失败: ' + error.message]
            };
        }
    }

    /**
     * 生成提示词摘要
     */
    generateSummary(promptData) {
        if (!promptData || !promptData.vocabulary) {
            return '暂无摘要信息';
        }

        const { vocabulary, metadata } = promptData;
        const summary = [];

        summary.push(`主题：${metadata.theme}`);
        summary.push(`标题：${metadata.title}`);
        summary.push(`词汇数量：${metadata.vocabularyCount}个`);

        if (vocabulary.core && vocabulary.core.length > 0) {
            summary.push(`核心词汇：${vocabulary.core.length}个`);
        }

        if (vocabulary.common && vocabulary.common.length > 0) {
            summary.push(`常见物品：${vocabulary.common.length}个`);
        }

        if (vocabulary.environment && vocabulary.environment.length > 0) {
            summary.push(`环境词汇：${vocabulary.environment.length}个`);
        }

        return summary.join(' | ');
    }

    /**
     * 提取词汇用于显示
     */
    extractVocabularyForDisplay(promptData) {
        if (!promptData || !promptData.vocabulary) {
            return [];
        }

        const { vocabulary } = promptData;
        const displayVocabulary = [];

        // 添加核心词汇
        if (vocabulary.core) {
            vocabulary.core.forEach(item => {
                displayVocabulary.push({
                    ...item,
                    displayCategory: '核心角色与设施'
                });
            });
        }

        // 添加常见物品
        if (vocabulary.common) {
            vocabulary.common.forEach(item => {
                displayVocabulary.push({
                    ...item,
                    displayCategory: '常见物品/工具'
                });
            });
        }

        // 添加环境词汇
        if (vocabulary.environment) {
            vocabulary.environment.forEach(item => {
                displayVocabulary.push({
                    ...item,
                    displayCategory: '环境与装饰'
                });
            });
        }

        return displayVocabulary;
    }

    /**
     * 格式化提示词为JSON（用于API调用）
     */
    formatPromptForAPI(promptData, options = {}) {
        const defaults = {
            model: 'nano-banana-pro',
            aspect_ratio: '3:4',  // 竖版A4比例
            resolution: '4K',     // 高质量
            output_format: 'png', // PNG格式
            image_input: []
        };

        const apiParams = {
            ...defaults,
            ...options,
            prompt: promptData.prompt
        };

        return apiParams;
    }

    /**
     * 生成文件名建议
     */
    generateFileName(theme, title, timestamp = null) {
        const safeTitle = title.replace(/[^\w\u4e00-\u9fa5]/g, '_').substring(0, 20);
        const safeTheme = theme.replace(/[^\w\u4e00-\u9fa5]/g, '_').substring(0, 10);
        const time = timestamp || new Date().toISOString().slice(0, 19).replace(/[:-]/g, '_');

        return `识字小报_${safeTheme}_${safeTitle}_${time}.png`;
    }

    /**
     * 估算生成时间
     */
    estimateGenerationTime(promptLength) {
        // 基于提示词长度估算生成时间（秒）
        const baseTime = 30; // 基础时间
        const timePerChar = 0.1; // 每字符额外时间

        return Math.ceil(baseTime + (promptLength * timePerChar));
    }

    /**
     * 生成变体提示词
     */
    generateVariants(originalPromptData, variations = 3) {
        const variants = [];

        for (let i = 0; i < variations; i++) {
            // 创建词汇变体
            const variedVocabulary = this.createVocabularyVariant(originalPromptData.vocabulary, i);

            // 重新生成提示词
            const variantPrompt = this.generatePrompt(
                originalPromptData.metadata.theme,
                originalPromptData.metadata.title,
                variedVocabulary
            );

            variants.push({
                ...variantPrompt,
                variantId: i + 1,
                parentPrompt: originalPromptData
            });
        }

        return variants;
    }

    /**
     * 创建词汇变体
     */
    createVocabularyVariant(originalVocabulary, variantIndex) {
        const variant = {
            core: [],
            common: [],
            environment: []
        };

        // 简单的变体策略：随机调整词汇顺序
        const shuffleArray = (array) => {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        };

        if (originalVocabulary.core) {
            variant.core = shuffleArray(originalVocabulary.core).slice(0, Math.min(5, originalVocabulary.core.length));
        }

        if (originalVocabulary.common) {
            variant.common = shuffleArray(originalVocabulary.common).slice(0, Math.min(8, originalVocabulary.common.length));
        }

        if (originalVocabulary.environment) {
            variant.environment = shuffleArray(originalVocabulary.environment).slice(0, Math.min(5, originalVocabulary.environment.length));
        }

        variant.all = [...variant.core, ...variant.common, ...variant.environment];

        return variant;
    }
}

// 创建全局实例
window.promptGenerator = new PromptGenerator();