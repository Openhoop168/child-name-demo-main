/**
 * 配置文件模板
 * 此文件由构建脚本自动生成，请勿手动编辑
 */

window.APP_CONFIG = {
    // ================================
    // Nano Banana Pro API 配置
    // ================================
    nanoBanana: {
        apiKey: "2e171c664da19baffdf89e06c29df6d2",
        apiEndpoint: "https://api.kie.ai/api/v1/jobs/",
        defaultParams: {
            resolution: "4K",
            aspectRatio: "3:4",
            outputFormat: "png"
        }
    },

    // ================================
    // 应用配置
    // ================================
    app: {
        title: "儿童识字小报生成器",
        version: "1.0.0",
        debugMode: "true" === "true",
        cacheExpireTime: parseInt("86400") || 86400
    },

    // ================================
    // 功能开关
    // ================================
    features: {
        usageStats: "true" !== "false",
        generationHistory: "true" !== "false",
        customVocabulary: "true" !== "false"
    },

    // ================================
    // 开发配置
    // ================================
    development: {
        devMode: "true" === "true",
        apiTimeout: parseInt("30000") || 30000,
        pollingInterval: parseInt("3000") || 3000,
        maxPollingAttempts: parseInt("60") || 60
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
            browserUnsupported: "您的浏览器不支持某些必需功能，请升级浏览器"
        },
        success: {
            configLoaded: "配置加载成功",
            apiKeySaved: "API密钥保存成功",
            imageGenerated: "图片生成成功",
            imageDownloaded: "图片下载成功"
        },
        warnings: {
            apiKeyDeprecated: "API密钥可能已过期，请检查",
            browserLimited: "您的浏览器功能有限，某些特性可能不可用",
            storageQuota: "本地存储空间不足，建议清理历史记录"
        }
    },

    // ================================
    // 版本信息
    // ================================
    version: {
        config: "1.0.0",
        buildTime: "2025-12-09T12:50:57.977Z",
        buildEnv: "development"
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
    if (!config.nanoBanana.apiKey || config.nanoBanana.apiKey === "test_key_for_please_replace_with_actual_key") {
        errors.push(config.messages.errors.apiKeyMissing);
    } else if (!config.validation.apiKey.pattern.test(config.nanoBanana.apiKey)) {
        errors.push(config.messages.errors.apiKeyInvalid);
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

    // 检查浏览器支持
    if (!config.runtime.apiSupport.fetch) {
        errors.push(config.messages.errors.browserUnsupported);
    }

    if (!config.runtime.storage.localStorage) {
        warnings.push(config.messages.warnings.browserLimited);
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