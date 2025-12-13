/**
 * 配置文件模板
 * 此文件由构建脚本自动生成，请勿手动编辑
 */

window.APP_CONFIG = {
    // ================================
    // Nano Banana Pro API 配置
    // ================================
    nanoBanana: {
        apiKey: "", // 移除默认API密钥，要求用户提供
        apiEndpoint: "{{NANO_BANANA_API_ENDPOINT}}",
        requireUserApiKey: true, // 强制要求用户提供API密钥
        defaultParams: {
            resolution: "{{DEFAULT_RESOLUTION}}",
            aspectRatio: "{{DEFAULT_ASPECT_RATIO}}",
            outputFormat: "{{DEFAULT_OUTPUT_FORMAT}}"
        }
    },

    // ================================
    // 应用配置
    // ================================
    app: {
        title: "{{APP_TITLE}}",
        version: "{{APP_VERSION}}",
        debugMode: "{{DEBUG_MODE}}" === "true",
        cacheExpireTime: parseInt("{{CACHE_EXPIRE_TIME}}") || 86400
    },

    // ================================
    // 使用量限制配置
    // ================================
    usage: {
        dailyLimit: parseInt("{{DAILY_USAGE_LIMIT}}") || 100,
        monthlyLimit: parseInt("{{MONTHLY_USAGE_LIMIT}}") || 3000,
        enableUsageTracking: "{{ENABLE_USAGE_TRACKING}}" !== "false",
        resetTime: "00:00:00", // 每日重置时间
        warningThreshold: 0.8, // 达到80%时显示警告
        currentUsage: {
            daily: 0,
            monthly: 0,
            lastReset: {
                daily: null,
                monthly: null
            }
        }
    },

    // ================================
    // 功能开关
    // ================================
    features: {
        usageStats: "{{ENABLE_USAGE_STATS}}" !== "false",
        generationHistory: "{{ENABLE_GENERATION_HISTORY}}" !== "false",
        customVocabulary: "{{ENABLE_CUSTOM_VOCABULARY}}" !== "false",
        enableUsageTracking: "{{ENABLE_USAGE_TRACKING}}" !== "false"
    },

    // ================================
    // 开发配置
    // ================================
    development: {
        devMode: "{{DEV_MODE}}" === "true",
        apiTimeout: parseInt("{{API_TIMEOUT}}") || 30000,
        pollingInterval: parseInt("{{POLLING_INTERVAL}}") || 3000,
        maxPollingAttempts: parseInt("{{MAX_POLLING_ATTEMPTS}}") || 60
    },

    // ================================
    // 内置配置
    // ================================
    builtIn: {
        // 支持的主题列表
        supportedThemes: [
            "超市", "医院", "公园", "学校", "家庭", "动物园"
        ],

        // 默认用户偏好
        defaultPreferences: {
            theme: "default",
            language: "zh-CN",
            autoSave: true,
            showPreview: true,
            defaultResolution: "4K",
            defaultAspectRatio: "3:4",
            autoGenerateVocabulary: true,
            vocabularyCount: {
                core: 4,
                common: 6,
                environment: 4
            }
        },

        // 提示词生成参数
        promptGeneration: {
            minCoreVocabulary: 3,
            maxCoreVocabulary: 5,
            minCommonVocabulary: 5,
            maxCommonVocabulary: 8,
            minEnvironmentVocabulary: 3,
            maxEnvironmentVocabulary: 5
        },

        // 存储配置
        storage: {
            maxHistoryRecords: 100,
            maxCacheSize: 5 * 1024 * 1024, // 5MB
            autoCleanupInterval: 24 * 60 * 60 * 1000 // 24小时
        },

        // 安全配置
        security: {
            maxInputLength: 1000,
            allowedFileTypes: ['image/png', 'image/jpeg', 'image/webp'],
            maxFileSize: 30 * 1024 * 1024, // 30MB
            sessionTimeout: 24 * 60 * 60 * 1000 // 24小时
        }
    },

    // ================================
    // 运行时配置（会根据环境动态调整）
    // ================================
    runtime: {
        // 检测到的浏览器信息
        browser: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine
        },

        // 本地存储可用性
        storage: {
            localStorage: !!window.localStorage,
            sessionStorage: !!window.sessionStorage,
            indexedDB: !!window.indexedDB
        },

        // Web API 支持情况
        apiSupport: {
            fetch: !!window.fetch,
            webCrypto: !!window.crypto && !!window.crypto.subtle,
            blob: !!window.Blob,
            file: !!window.File,
            fileReader: !!window.FileReader,
            canvas: !!document.createElement('canvas').getContext
        }
    },

    // ================================
    // 配置验证规则
    // ================================
    validation: {
        apiKey: {
            required: true,
            minLength: 20,
            maxLength: 200,
            pattern: /^[a-zA-Z0-9\-_]+$/
        },
        apiEndpoint: {
            required: true,
            pattern: /^https?:\/\/.+/,
            default: "https://api.kie.ai/api/v1/jobs/"
        },
        resolution: {
            allowed: ["1K", "2K", "4K"],
            default: "4K"
        },
        aspectRatio: {
            allowed: ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9", "auto"],
            default: "3:4"
        },
        outputFormat: {
            allowed: ["png", "jpg"],
            default: "png"
        },
        usage: {
            dailyLimit: {
                min: 1,
                max: 10000,
                default: 100
            },
            monthlyLimit: {
                min: 10,
                max: 100000,
                default: 3000
            },
            warningThreshold: {
                min: 0.1,
                max: 1.0,
                default: 0.8
            }
        }
    },

    // ================================
    // 错误消息
    // ================================
    messages: {
        errors: {
            apiKeyMissing: "未配置API密钥，请在设置中输入Nano Banana Pro API密钥",
            apiKeyInvalid: "API密钥格式无效，请检查您的密钥",
            networkError: "网络连接失败，请检查您的网络设置",
            apiError: "API调用失败，请稍后重试",
            configError: "配置错误，请检查环境变量设置",
            browserUnsupported: "您的浏览器不支持某些必需功能，请升级浏览器",
            dailyLimitExceeded: "今日使用次数已达上限，请明天再试",
            monthlyLimitExceeded: "本月使用次数已达上限，请下月再试"
        },
        success: {
            configLoaded: "配置加载成功",
            apiKeySaved: "API密钥保存成功",
            imageGenerated: "图片生成成功",
            imageDownloaded: "图片下载成功",
            usageReset: "使用量统计已重置"
        },
        warnings: {
            apiKeyDeprecated: "API密钥可能已过期，请检查",
            browserLimited: "您的浏览器功能有限，某些特性可能不可用",
            storageQuota: "本地存储空间不足，建议清理历史记录",
            dailyLimitWarning: "今日使用次数即将达到上限",
            monthlyLimitWarning: "本月使用次数即将达到上限",
            usageTrackingDisabled: "使用量追踪功能已关闭"
        }
    },

    // ================================
    // 版本信息
    // ================================
    version: {
        config: "1.0.0",
        buildTime: "{{BUILD_TIME}}",
        buildEnv: "{{BUILD_ENV}}"
    }
};

/**
 * 配置验证函数
 */
window.validateConfig = function() {
    const config = window.APP_CONFIG;
    const errors = [];
    const warnings = [];

    // 验证API密钥
    if (config.nanoBanana.requireUserApiKey) {
        // 如果要求用户提供API密钥，则不要求默认密钥存在
        if (config.nanoBanana.apiKey && config.nanoBanana.apiKey !== "" && !config.validation.apiKey.pattern.test(config.nanoBanana.apiKey)) {
            errors.push(config.messages.errors.apiKeyInvalid);
        }
        // 不检查默认API密钥是否存在
    } else {
        // 如果不要求用户密钥，则必须有默认密钥
        if (!config.nanoBanana.apiKey || config.nanoBanana.apiKey === "{{NANO_BANANA_API_KEY}}" || config.nanoBanana.apiKey === "") {
            errors.push(config.messages.errors.apiKeyMissing);
        } else if (!config.validation.apiKey.pattern.test(config.nanoBanana.apiKey)) {
            errors.push(config.messages.errors.apiKeyInvalid);
        }
    }

    // 验证API端点
    if (!config.validation.apiEndpoint.pattern.test(config.nanoBanana.apiEndpoint)) {
        errors.push(config.messages.errors.configError);
    }

    // 验证参数
    if (!config.validation.resolution.allowed.includes(config.nanoBanana.defaultParams.resolution)) {
        warnings.push("不支持的分辨率设置，将使用默认值");
        config.nanoBanana.defaultParams.resolution = config.validation.resolution.default;
    }

    if (!config.validation.aspectRatio.allowed.includes(config.nanoBanana.defaultParams.aspectRatio)) {
        warnings.push("不支持的宽高比设置，将使用默认值");
        config.nanoBanana.defaultParams.aspectRatio = config.validation.aspectRatio.default;
    }

    if (!config.validation.outputFormat.allowed.includes(config.nanoBanana.defaultParams.outputFormat)) {
        warnings.push("不支持的输出格式，将使用默认值");
        config.nanoBanana.defaultParams.outputFormat = config.validation.outputFormat.default;
    }

    // 验证使用量限制配置
    const usageValidation = config.validation.usage;

    if (config.usage.dailyLimit < usageValidation.dailyLimit.min ||
        config.usage.dailyLimit > usageValidation.dailyLimit.max) {
        warnings.push(`日使用量限制超出合理范围，将使用默认值 ${usageValidation.dailyLimit.default}`);
        config.usage.dailyLimit = usageValidation.dailyLimit.default;
    }

    if (config.usage.monthlyLimit < usageValidation.monthlyLimit.min ||
        config.usage.monthlyLimit > usageValidation.monthlyLimit.max) {
        warnings.push(`月使用量限制超出合理范围，将使用默认值 ${usageValidation.monthlyLimit.default}`);
        config.usage.monthlyLimit = usageValidation.monthlyLimit.default;
    }

    if (config.usage.warningThreshold < usageValidation.warningThreshold.min ||
        config.usage.warningThreshold > usageValidation.warningThreshold.max) {
        warnings.push(`警告阈值超出合理范围，将使用默认值 ${usageValidation.warningThreshold.default}`);
        config.usage.warningThreshold = usageValidation.warningThreshold.default;
    }

    // 验证月限制必须大于日限制
    if (config.usage.monthlyLimit < config.usage.dailyLimit) {
        errors.push("月使用量限制必须大于或等于日使用量限制");
    }

    // 检查使用量追踪功能是否启用
    if (!config.usage.enableUsageTracking) {
        warnings.push("使用量追踪功能已关闭，无法记录使用统计");
    }

    // 检查浏览器支持
    if (!config.runtime.apiSupport.fetch) {
        errors.push(config.messages.errors.browserUnsupported);
    }

    if (!config.runtime.storage.localStorage) {
        warnings.push(config.messages.warnings.browserLimited);

        // 如果没有本地存储，提醒使用量追踪可能受限
        if (config.usage.enableUsageTracking) {
            warnings.push("由于浏览器不支持本地存储，使用量追踪功能可能受限");
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
};

/**
 * 获取配置值
 * @param {string} path - 配置路径，如 "nanoBanana.apiKey"
 * @param {*} defaultValue - 默认值
 * @returns {*} 配置值
 */
window.getConfig = function(path, defaultValue = null) {
    const keys = path.split('.');
    let current = window.APP_CONFIG;

    for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            return defaultValue;
        }
    }

    // 检查是否是未替换的模板变量
    if (typeof current === 'string' && current.startsWith('{{') && current.endsWith('}}')) {
        return defaultValue;
    }

    return current;
};

/**
 * 设置运行时配置
 * @param {string} path - 配置路径
 * @param {*} value - 配置值
 */
window.setRuntimeConfig = function(path, value) {
    const keys = path.split('.');
    let current = window.APP_CONFIG.runtime;

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key];
    }

    current[keys[keys.length - 1]] = value;
};

/**
 * 获取环境信息
 */
window.getEnvironmentInfo = function() {
    const config = window.APP_CONFIG;
    const validation = window.validateConfig();

    return {
        config: {
            version: config.version.config,
            buildTime: config.version.buildTime,
            buildEnv: config.version.buildEnv
        },
        features: config.features,
        browser: config.runtime.browser,
        apiSupport: config.runtime.apiSupport,
        storage: config.runtime.storage,
        validation
    };
};

console.log("配置模板已加载");