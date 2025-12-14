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
            // 直接使用嵌入的词汇数据，避免外部文件依赖
            this.vocabularyData = this.getEmbeddedVocabulary();
            console.log('词汇数据加载完成');
        } catch (error) {
            console.error('加载词汇数据失败:', error);
            // 如果加载失败，使用默认数据
            this.vocabularyData = this.getDefaultVocabulary();
        }
    }

    /**
     * 获取嵌入的词汇数据
     */
    getEmbeddedVocabulary() {
        return {
            "themes": {
                "超市": {
                    "category": "购物场所",
                    "description": "超市购物相关的词汇",
                    "core_items": [
                        { "pinyin": "shōu yín yuán", "hanzi": "收银员", "type": "人物", "category": "core" },
                        { "pinyin": "huò jià", "hanzi": "货架", "type": "设施", "category": "core" },
                        { "pinyin": "tuī chē", "hanzi": "推车", "type": "工具", "category": "core" },
                        { "pinyin": "shōu yín tái", "hanzi": "收银台", "type": "设施", "category": "core" },
                        { "pinyin": "dǎ yìn jī", "hanzi": "打印机", "type": "设备", "category": "core" }
                    ],
                    "common_items": [
                        { "pinyin": "píng guǒ", "hanzi": "苹果", "type": "食物", "category": "common" },
                        { "pinyin": "niú nǎi", "hanzi": "牛奶", "type": "食物", "category": "common" },
                        { "pinyin": "miàn bāo", "hanzi": "面包", "type": "食物", "category": "common" },
                        { "pinyin": "jī dàn", "hanzi": "鸡蛋", "type": "食物", "category": "common" },
                        { "pinyin": "xiāng jiāo", "hanzi": "香蕉", "type": "食物", "category": "common" },
                        { "pinyin": "xi yè fěn", "hanzi": "洗衣粉", "type": "日用品", "category": "common" },
                        { "pinyin": "yá gāo", "hanzi": "牙膏", "type": "日用品", "category": "common" },
                        { "pinyin": "wèi shēng zhǐ", "hanzi": "卫生纸", "type": "日用品", "category": "common" }
                    ],
                    "environment_items": [
                        { "pinyin": "chū kǒu", "hanzi": "出口", "type": "标识", "category": "environment" },
                        { "pinyin": "rù kǒu", "hanzi": "入口", "type": "标识", "category": "environment" },
                        { "pinyin": "dēng", "hanzi": "灯", "type": "设备", "category": "environment" },
                        { "pinyin": "qiáng", "hanzi": "墙", "type": "建筑", "category": "environment" },
                        { "pinyin": "mén", "hanzi": "门", "type": "建筑", "category": "environment" }
                    ]
                },
                "医院": {
                    "category": "医疗机构",
                    "description": "医院就诊相关的词汇",
                    "core_items": [
                        { "pinyin": "yī shēng", "hanzi": "医生", "type": "人物", "category": "core" },
                        { "pinyin": "hù shì", "hanzi": "护士", "type": "人物", "category": "core" },
                        { "pinyin": "zhěn suǒ", "hanzi": "诊所", "type": "设施", "category": "core" },
                        { "pinyin": "yào xiāng", "hanzi": "药箱", "type": "设备", "category": "core" },
                        { "pinyin": "bing chuáng", "hanzi": "病床", "type": "设备", "category": "core" }
                    ],
                    "common_items": [
                        { "pinyin": "tǐ wēn jì", "hanzi": "体温计", "type": "医疗器械", "category": "common" },
                        { "pinyin": "yào", "hanzi": "药", "type": "药品", "category": "common" },
                        { "pinyin": "bēng dài", "hanzi": "绷带", "type": "医疗用品", "category": "common" },
                        { "pinyin": "mián qiú", "hanzi": "棉球", "type": "医疗用品", "category": "common" },
                        { "pinyin": "yī yuàn", "hanzi": "医院", "type": "场所", "category": "common" },
                        { "pinyin": "jiǔ jīng", "hanzi": "酒精", "type": "消毒用品", "category": "common" },
                        { "pinyin": "kǒu zhào", "hanzi": "口罩", "type": "防护用品", "category": "common" },
                        { "pinyin": "shǒu tào", "hanzi": "手套", "type": "防护用品", "category": "common" }
                    ],
                    "environment_items": [
                        { "pinyin": "guà hào chù", "hanzi": "挂号处", "type": "设施", "category": "environment" },
                        { "pinyin": "děng hòu qū", "hanzi": "等待区", "type": "区域", "category": "environment" },
                        { "pinyin": "zhǐ shì pái", "hanzi": "指示牌", "type": "标识", "category": "environment" },
                        { "pinyin": "jǐn jí shì", "hanzi": "急诊室", "type": "场所", "category": "environment" },
                        { "pinyin": "yào fáng", "hanzi": "药房", "type": "场所", "category": "environment" }
                    ]
                },
                "公园": {
                    "category": "休闲娱乐",
                    "description": "公园游玩相关的词汇",
                    "core_items": [
                        { "pinyin": "huā", "hanzi": "花", "type": "植物", "category": "core" },
                        { "pinyin": "shù", "hanzi": "树", "type": "植物", "category": "core" },
                        { "pinyin": "cǎo", "hanzi": "草", "type": "植物", "category": "core" },
                        { "pinyin": "cháng yǐ", "hanzi": "长椅", "type": "设施", "category": "core" },
                        { "pinyin": "xiǎo lù", "hanzi": "小路", "type": "道路", "category": "core" }
                    ],
                    "common_items": [
                        { "pinyin": "qiū qiān", "hanzi": "秋千", "type": "游乐设施", "category": "common" },
                        { "pinyin": "huá tī", "hanzi": "滑梯", "type": "游乐设施", "category": "common" },
                        { "pinyin": "mǎ mù", "hanzi": "木马", "type": "游乐设施", "category": "common" },
                        { "pinyin": "shāi tā", "hanzi": "沙塔", "type": "游乐设施", "category": "common" },
                        { "pinyin": "diào qiáo", "hanzi": "吊桥", "type": "游乐设施", "category": "common" },
                        { "pinyin": "tí qiū qiān", "hanzi": "踢足球", "type": "运动", "category": "common" },
                        { "pinyin": "fàng fēng zheng", "hanzi": "放风筝", "type": "娱乐", "category": "common" },
                        { "pinyin": "sàn bù", "hanzi": "散步", "type": "活动", "category": "common" }
                    ],
                    "environment_items": [
                        { "pinyin": "hú", "hanzi": "湖", "type": "自然景观", "category": "environment" },
                        { "pinyin": "qiáo", "hanzi": "桥", "type": "建筑", "category": "environment" },
                        { "pinyin": "níng shì pài", "hanzi": "凝视牌", "type": "标识", "category": "environment" },
                        { "pinyin": "lā jī tǒng", "hanzi": "垃圾桶", "type": "设施", "category": "environment" },
                        { "pinyin": "gōng gòng cè suǒ", "hanzi": "公共厕所", "type": "设施", "category": "environment" }
                    ]
                },
                "学校": {
                    "category": "教育机构",
                    "description": "学校学习相关的词汇",
                    "core_items": [
                        { "pinyin": "lǎo shī", "hanzi": "老师", "type": "人物", "category": "core" },
                        { "pinyin": "xué sheng", "hanzi": "学生", "type": "人物", "category": "core" },
                        { "pinyin": "jiào shì", "hanzi": "教室", "type": "场所", "category": "core" },
                        { "pinyin": "hēi bǎn", "hanzi": "黑板", "type": "设备", "category": "core" },
                        { "pinyin": "zhuō zi", "hanzi": "桌子", "type": "家具", "category": "core" }
                    ],
                    "common_items": [
                        { "pinyin": "shū", "hanzi": "书", "type": "学习用品", "category": "common" },
                        { "pinyin": "bǐ", "hanzi": "笔", "type": "学习用品", "category": "common" },
                        { "pinyin": "běn zi", "hanzi": "本子", "type": "学习用品", "category": "common" },
                        { "pinyin": "bāo", "hanzi": "包", "type": "用品", "category": "common" },
                        { "pinyin": "chǐ zi", "hanzi": "尺子", "type": "学习用品", "category": "common" },
                        { "pinyin": "xiàng pí", "hanzi": "橡皮", "type": "学习用品", "category": "common" },
                        { "pinyin": "wén jù hé", "hanzi": "文具盒", "type": "学习用品", "category": "common" },
                        { "pinyin": "tú shū", "hanzi": "图书", "type": "学习资料", "category": "common" }
                    ],
                    "environment_items": [
                        { "pinyin": "cāo chǎng", "hanzi": "操场", "type": "场所", "category": "environment" },
                        { "pinyin": "tú shū guǎn", "hanzi": "图书馆", "type": "场所", "category": "environment" },
                        { "pinyin": "shí táng", "hanzi": "食堂", "type": "场所", "category": "environment" },
                        { "pinyin": "xiào mén", "hanzi": "校门", "type": "建筑", "category": "environment" },
                        { "pinyin": "zǒu láng", "hanzi": "走廊", "type": "建筑", "category": "environment" }
                    ]
                },
                "家庭": {
                    "category": "生活场景",
                    "description": "家庭生活相关的词汇",
                    "core_items": [
                        { "pinyin": "bà ba", "hanzi": "爸爸", "type": "人物", "category": "core" },
                        { "pinyin": "mā ma", "hanzi": "妈妈", "type": "人物", "category": "core" },
                        { "pinyin": "wán jù", "hanzi": "玩具", "type": "物品", "category": "core" },
                        { "pinyin": "chuáng", "hanzi": "床", "type": "家具", "category": "core" },
                        { "pinyin": "yǐ zi", "hanzi": "椅子", "type": "家具", "category": "core" }
                    ],
                    "common_items": [
                        { "pinyin": "diàn shì", "hanzi": "电视", "type": "电器", "category": "common" },
                        { "pinyin": "shōu yīn jī", "hanzi": "收音机", "type": "电器", "category": "common" },
                        { "pinyin": "diàn huà", "hanzi": "电话", "type": "电器", "category": "common" },
                        { "pinyin": "bēi zi", "hanzi": "杯子", "type": "用品", "category": "common" },
                        { "pinyin": "wǎn", "hanzi": "碗", "type": "用品", "category": "common" },
                        { "pinyin": "kuài zi", "hanzi": "筷子", "type": "餐具", "category": "common" },
                        { "pinyin": "yáo he", "hanzi": "勺盒", "type": "餐具", "category": "common" },
                        { "pinyin": "máo jīn", "hanzi": "毛巾", "type": "用品", "category": "common" }
                    ],
                    "environment_items": [
                        { "pinyin": "mén", "hanzi": "门", "type": "建筑", "category": "environment" },
                        { "pinyin": "chuāng", "hanzi": "窗", "type": "建筑", "category": "environment" },
                        { "pinyin": "qiáng", "hanzi": "墙", "type": "建筑", "category": "environment" },
                        { "pinyin": "dēng", "hanzi": "灯", "type": "设备", "category": "environment" },
                        { "pinyin": "zhuō zi", "hanzi": "桌子", "type": "家具", "category": "environment" }
                    ]
                },
                "动物园": {
                    "category": "动物主题",
                    "description": "动物园动物相关的词汇",
                    "core_items": [
                        { "pinyin": "hóu zi", "hanzi": "猴子", "type": "动物", "category": "core" },
                        { "pinyin": "dà xiàng", "hanzi": "大象", "type": "动物", "category": "core" },
                        { "pinyin": "lǎo hǔ", "hanzi": "老虎", "type": "动物", "category": "core" },
                        { "pinyin": "xīng xing", "hanzi": "猩猩", "type": "动物", "category": "core" },
                        { "pinyin": "niǎo", "hanzi": "鸟", "type": "动物", "category": "core" }
                    ],
                    "common_items": [
                        { "pinyin": "xiǎo niǎo", "hanzi": "小鸟", "type": "动物", "category": "common" },
                        { "pinyin": "kǒng què", "hanzi": "孔雀", "type": "动物", "category": "common" },
                        { "pinyin": "xióng māo", "hanzi": "熊猫", "type": "动物", "category": "common" },
                        { "pinyin": "cháng jǐng lù", "hanzi": "长颈鹿", "type": "动物", "category": "common" },
                        { "pinyin": "shī zi", "hanzi": "狮子", "type": "动物", "category": "common" },
                        { "pinyin": "bào zi", "hanzi": "豹子", "type": "动物", "category": "common" },
                        { "pinyin": "láng", "hanzi": "狼", "type": "动物", "category": "common" },
                        { "pinyin": "hú li", "hanzi": "狐狸", "type": "动物", "category": "common" }
                    ],
                    "environment_items": [
                        { "pinyin": "lóng zi", "hanzi": "笼子", "type": "设施", "category": "environment" },
                        { "pinyin": "zhǐ shì pái", "hanzi": "指示牌", "type": "标识", "category": "environment" },
                        { "pinyin": "cǎo", "hanzi": "草", "type": "植物", "category": "environment" },
                        { "pinyin": "shù", "hanzi": "树", "type": "植物", "category": "environment" },
                        { "pinyin": "xiǎo lù", "hanzi": "小路", "type": "道路", "category": "environment" }
                    ]
                }
            },
            "metadata": {
                "version": "1.0.0",
                "last_updated": "2024-12-09",
                "description": "儿童识字小报词汇库，包含常见主题的汉字和拼音",
                "total_themes": 6,
                "categories": {
                    "core": "核心词汇",
                    "common": "常见物品/工具",
                    "environment": "环境与装饰"
                }
            }
        };
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