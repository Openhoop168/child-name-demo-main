/**
 * 词汇管理器
 * 负责管理主题词汇库，提供词汇查询和管理功能
 */

class VocabularyManager {
    constructor() {
        this.vocabularyData = null;
        this.currentTheme = null;
        this.initialized = false;
    }

    /**
     * 初始化词汇管理器
     */
    async initialize() {
        if (this.initialized) return;

        try {
            await this.loadVocabularyData();
            this.initialized = true;
            console.log('词汇管理器初始化完成');
        } catch (error) {
            console.error('词汇管理器初始化失败:', error);
            throw error;
        }
    }

    /**
     * 加载词汇数据
     */
    async loadVocabularyData() {
        try {
            const response = await fetch('data/vocabulary.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.vocabularyData = await response.json();
        } catch (error) {
            console.error('加载词汇数据失败:', error);
            // 如果加载失败，使用默认数据
            this.vocabularyData = this.getDefaultVocabulary();
        }
    }

    /**
     * 获取默认词汇数据（备用）
     */
    getDefaultVocabulary() {
        return {
            themes: {
                "默认主题": {
                    category: "通用",
                    description: "默认主题词汇",
                    core_items: [
                        { pinyin: "xué xí", hanzi: "学习", type: "活动", category: "core" },
                        { pinyin: "hǎo hái zi", hanzi: "好孩子", type: "人物", category: "core" }
                    ],
                    common_items: [
                        { pinyin: "shū", hanzi: "书", type: "物品", category: "common" },
                        { pinyin: "bǐ", hanzi: "笔", type: "物品", category: "common" }
                    ],
                    environment_items: [
                        { pinyin: "jiā", hanzi: "家", type: "场所", category: "environment" }
                    ]
                }
            }
        };
    }

    /**
     * 获取所有主题列表
     */
    getAllThemes() {
        if (!this.vocabularyData) {
            return [];
        }
        return Object.keys(this.vocabularyData.themes);
    }

    /**
     * 获取主题信息
     */
    getThemeInfo(theme) {
        if (!this.vocabularyData || !this.vocabularyData.themes[theme]) {
            return null;
        }
        return this.vocabularyData.themes[theme];
    }

    /**
     * 检查主题是否存在
     */
    hasTheme(theme) {
        return this.vocabularyData && this.vocabularyData.themes.hasOwnProperty(theme);
    }

    /**
     * 获取主题下的所有词汇
     */
    getThemeVocabulary(theme) {
        const themeInfo = this.getThemeInfo(theme);
        if (!themeInfo) {
            return [];
        }

        const vocabulary = [
            ...themeInfo.core_items || [],
            ...themeInfo.common_items || [],
            ...themeInfo.environment_items || []
        ];

        return vocabulary;
    }

    /**
     * 按类别获取词汇
     */
    getVocabularyByCategory(theme, category) {
        const themeInfo = this.getThemeInfo(theme);
        if (!themeInfo) {
            return [];
        }

        const categoryMap = {
            'core': themeInfo.core_items || [],
            'common': themeInfo.common_items || [],
            'environment': themeInfo.environment_items || []
        };

        return categoryMap[category] || [];
    }

    /**
     * 获取核心词汇（3-5个）
     */
    getCoreVocabulary(theme) {
        const coreItems = this.getVocabularyByCategory(theme, 'core');
        return this.selectRandomItems(coreItems, 3, 5);
    }

    /**
     * 获取常见物品词汇（5-8个）
     */
    getCommonVocabulary(theme) {
        const commonItems = this.getVocabularyByCategory(theme, 'common');
        return this.selectRandomItems(commonItems, 5, 8);
    }

    /**
     * 获取环境词汇（3-5个）
     */
    getEnvironmentVocabulary(theme) {
        const environmentItems = this.getVocabularyByCategory(theme, 'environment');
        return this.selectRandomItems(environmentItems, 3, 5);
    }

    /**
     * 获取完整词汇列表（15-20个）
     */
    getCompleteVocabulary(theme) {
        const core = this.getCoreVocabulary(theme);
        const common = this.getCommonVocabulary(theme);
        const environment = this.getEnvironmentVocabulary(theme);

        return {
            core,
            common,
            environment,
            all: [...core, ...common, ...environment]
        };
    }

    /**
     * 随机选择指定数量的项目
     */
    selectRandomItems(items, minCount, maxCount) {
        if (!items || items.length === 0) {
            return [];
        }

        const count = Math.min(
            Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount,
            items.length
        );

        const shuffled = [...items].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    /**
     * 格式化词汇为字符串
     */
    formatVocabularyToString(vocabularyList) {
        if (!vocabularyList || vocabularyList.length === 0) {
            return '';
        }

        return vocabularyList
            .map(item => `${item.pinyin} ${item.hanzi}`)
            .join(', ');
    }

    /**
     * 格式化词汇为Markdown列表
     */
    formatVocabularyToMarkdown(vocabularyList) {
        if (!vocabularyList || vocabularyList.length === 0) {
            return '';
        }

        return vocabularyList
            .map(item => `- ${item.pinyin} ${item.hanzi}`)
            .join('\n');
    }

    /**
     * 根据关键词搜索相似主题
     */
    searchSimilarThemes(keyword) {
        const allThemes = this.getAllThemes();
        const keywordLower = keyword.toLowerCase();

        return allThemes.filter(theme => {
            const themeLower = theme.toLowerCase();
            const themeInfo = this.getThemeInfo(theme);

            return themeLower.includes(keywordLower) ||
                   (themeInfo && themeInfo.description && themeInfo.description.toLowerCase().includes(keywordLower)) ||
                   (themeInfo && themeInfo.category && themeInfo.category.toLowerCase().includes(keywordLower));
        });
    }

    /**
     * 智能匹配主题
     */
    findBestMatchingTheme(input) {
        if (!input) return null;

        const allThemes = this.getAllThemes();
        const inputLower = input.toLowerCase().trim();

        // 精确匹配
        for (const theme of allThemes) {
            if (theme.toLowerCase() === inputLower) {
                return theme;
            }
        }

        // 模糊匹配
        const similarThemes = this.searchSimilarThemes(input);
        if (similarThemes.length > 0) {
            return similarThemes[0];
        }

        // 关键词匹配
        const keywords = {
            '购物': '超市',
            '买东西': '超市',
            '商场': '超市',
            '看病': '医院',
            '医生': '医院',
            '护士': '医院',
            '玩': '公园',
            '散步': '公园',
            '运动': '公园',
            '上学': '学校',
            '老师': '学校',
            '读书': '学校',
            '家': '家庭',
            '爸爸妈妈': '家庭',
            '动物': '动物园',
            '老虎': '动物园',
            '猴子': '动物园'
        };

        for (const [key, value] of Object.entries(keywords)) {
            if (inputLower.includes(key)) {
                return value;
            }
        }

        return null;
    }

    /**
     * 添加自定义词汇到主题
     */
    addCustomVocabulary(theme, vocabulary) {
        if (!this.vocabularyData) {
            this.vocabularyData = { themes: {} };
        }

        if (!this.vocabularyData.themes[theme]) {
            this.vocabularyData.themes[theme] = {
                category: "自定义",
                description: "用户自定义主题",
                core_items: [],
                common_items: [],
                environment_items: []
            };
        }

        const themeData = this.vocabularyData.themes[theme];

        // 根据类型分类词汇
        if (vocabulary.category === 'core') {
            themeData.core_items.push(vocabulary);
        } else if (vocabulary.category === 'common') {
            themeData.common_items.push(vocabulary);
        } else if (vocabulary.category === 'environment') {
            themeData.environment_items.push(vocabulary);
        } else {
            // 默认添加到常见物品
            themeData.common_items.push({
                ...vocabulary,
                category: 'common'
            });
        }
    }

    /**
     * 获取词汇统计信息
     */
    getVocabularyStats(theme) {
        const themeInfo = this.getThemeInfo(theme);
        if (!themeInfo) {
            return null;
        }

        return {
            coreCount: (themeInfo.core_items || []).length,
            commonCount: (themeInfo.common_items || []).length,
            environmentCount: (themeInfo.environment_items || []).length,
            totalCount: this.getThemeVocabulary(theme).length,
            category: themeInfo.category,
            description: themeInfo.description
        };
    }

    /**
     * 验证词汇数据格式
     */
    validateVocabulary(vocabulary) {
        const requiredFields = ['pinyin', 'hanzi', 'type'];
        const optionalFields = ['category'];

        for (const field of requiredFields) {
            if (!vocabulary[field] || typeof vocabulary[field] !== 'string') {
                return false;
            }
        }

        return true;
    }

    /**
     * 导出词汇数据
     */
    exportVocabulary(theme) {
        const themeData = this.getThemeInfo(theme);
        if (!themeData) {
            return null;
        }

        return {
            theme,
            ...themeData,
            vocabulary: this.getThemeVocabulary(theme)
        };
    }
}

// 创建全局实例
window.vocabularyManager = new VocabularyManager();