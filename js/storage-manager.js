/**
 * 存储管理器
 * 负责管理应用的各种数据存储
 */

class StorageManager {
    constructor() {
        this.keys = {
            // API配置
            API_KEY: 'nano_banana_api_key',
            API_ENDPOINT: 'nano_banana_api_endpoint',

            // 用户数据
            USER_PREFERENCES: 'user_preferences',
            GENERATION_HISTORY: 'generation_history',
            CUSTOM_VOCABULARY: 'custom_vocabulary',

            // 应用配置
            APP_VERSION: 'app_version',
            LAST_USED_THEME: 'last_used_theme',
            USAGE_STATS: 'usage_stats',

            // 支付相关
            USER_SUBSCRIPTION: 'user_subscription',
            PAYMENT_ORDERS: 'payment_orders',
            PAYMENT_SETTINGS: 'payment_settings',

            // 缓存
            VOCABULARY_CACHE: 'vocabulary_cache',
            PROMPT_CACHE: 'prompt_cache'
        };

        this.initialized = false;
    }

    /**
     * 初始化存储管理器
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // 检查存储可用性
            this.checkStorageAvailability();

            // 清理过期数据
            await this.cleanupExpiredData();

            // 初始化默认设置
            this.initializeDefaultSettings();

            this.initialized = true;
            console.log('存储管理器初始化完成');
        } catch (error) {
            console.error('存储管理器初始化失败:', error);
            throw error;
        }
    }

    /**
     * 检查存储可用性
     */
    checkStorageAvailability() {
        try {
            const testKey = 'test_storage_availability';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            console.error('本地存储不可用:', error);
            throw new Error('本地存储不可用，某些功能可能无法正常使用');
        }
    }

    /**
     * 初始化默认设置
     */
    initializeDefaultSettings() {
        const defaultPreferences = {
            theme: 'default',
            language: 'zh-CN',
            autoSave: true,
            showPreview: true,
            defaultResolution: '4K',
            defaultAspectRatio: '3:4',
            autoGenerateVocabulary: true,
            vocabularyCount: {
                core: 4,
                common: 6,
                environment: 4
            }
        };

        const currentPreferences = this.getUserPreferences();
        if (!currentPreferences) {
            this.saveUserPreferences(defaultPreferences);
        }

        // 初始化使用统计
        const stats = this.getUsageStats();
        if (!stats.firstUsed) {
            stats.firstUsed = new Date().toISOString();
            stats.version = '1.0.0';
            this.saveUsageStats(stats);
        }
    }

    /**
     * 保存用户偏好设置
     */
    async saveUserPreferences(preferences) {
        try {
            const data = {
                ...preferences,
                updatedAt: new Date().toISOString()
            };

            if (window.securityUtils) {
                await window.securityUtils.saveSecureData(this.keys.USER_PREFERENCES, data);
            } else {
                localStorage.setItem(this.keys.USER_PREFERENCES, JSON.stringify(data));
            }

            return true;
        } catch (error) {
            console.error('保存用户偏好失败:', error);
            return false;
        }
    }

    /**
     * 获取用户偏好设置
     */
    async getUserPreferences() {
        try {
            let data;

            if (window.securityUtils) {
                data = await window.securityUtils.loadSecureData(this.keys.USER_PREFERENCES);
            } else {
                const stored = localStorage.getItem(this.keys.USER_PREFERENCES);
                data = stored ? JSON.parse(stored) : null;
            }

            return data;
        } catch (error) {
            console.error('获取用户偏好失败:', error);
            return null;
        }
    }

    /**
     * 保存生成历史记录
     */
    async saveGenerationRecord(record) {
        try {
            console.log('[StorageManager] 开始保存生成记录:', record);
            const history = await this.getGenerationHistory();
            console.log('[StorageManager] 当前历史记录:', history);

            const newRecord = {
                id: this.generateId(),
                ...record,
                createdAt: new Date().toISOString()
            };

            console.log('[StorageManager] 新记录:', newRecord);

            history.unshift(newRecord); // 添加到开头

            // 限制历史记录数量（最多保存100条）
            if (history.length > 100) {
                history.splice(100);
            }

            const data = {
                records: history,
                updatedAt: new Date().toISOString(),
                total: history.length
            };

            console.log('[StorageManager] 保存的数据:', data);

            if (window.securityUtils) {
                console.log('[StorageManager] 使用安全存储保存');
                await window.securityUtils.saveSecureData(this.keys.GENERATION_HISTORY, data);
            } else {
                console.log('[StorageManager] 使用localStorage保存');
                localStorage.setItem(this.keys.GENERATION_HISTORY, JSON.stringify(data));
            }

            // 更新使用统计
            this.updateUsageStats('generation_count', 1);

            console.log('[StorageManager] 保存成功，记录ID:', newRecord.id);
            return newRecord.id;
        } catch (error) {
            console.error('[StorageManager] 保存生成记录失败:', error);
            return null;
        }
    }

    /**
     * 获取生成历史记录
     */
    async getGenerationHistory(limit = null) {
        try {
            console.log('[StorageManager] 开始获取历史记录，limit:', limit);
            let data;

            if (window.securityUtils) {
                console.log('[StorageManager] 使用安全存储读取');
                data = await window.securityUtils.loadSecureData(this.keys.GENERATION_HISTORY);
            } else {
                console.log('[StorageManager] 使用localStorage读取，key:', this.keys.GENERATION_HISTORY);
                const stored = localStorage.getItem(this.keys.GENERATION_HISTORY);
                data = stored ? JSON.parse(stored) : null;
            }

            const records = data ? data.records : [];
            console.log('[StorageManager] 获取到的记录数量:', records.length);

            if (limit && limit > 0) {
                return records.slice(0, limit);
            }

            return records;
        } catch (error) {
            console.error('[StorageManager] 获取生成历史失败:', error);
            return [];
        }
    }

    /**
     * 删除生成历史记录
     */
    async deleteGenerationRecord(recordId) {
        try {
            const history = await this.getGenerationHistory();
            const filteredRecords = history.filter(record => record.id !== recordId);

            const data = {
                records: filteredRecords,
                updatedAt: new Date().toISOString(),
                total: filteredRecords.length
            };

            if (window.securityUtils) {
                await window.securityUtils.saveSecureData(this.keys.GENERATION_HISTORY, data);
            } else {
                localStorage.setItem(this.keys.GENERATION_HISTORY, JSON.stringify(data));
            }

            return true;
        } catch (error) {
            console.error('删除生成记录失败:', error);
            return false;
        }
    }

    /**
     * 清空生成历史记录
     */
    async clearGenerationHistory() {
        try {
            if (window.securityUtils) {
                await window.securityUtils.removeSecureData(this.keys.GENERATION_HISTORY);
            } else {
                localStorage.removeItem(this.keys.GENERATION_HISTORY);
            }

            return true;
        } catch (error) {
            console.error('清空生成历史失败:', error);
            return false;
        }
    }

    /**
     * 保存自定义词汇
     */
    async saveCustomVocabulary(theme, vocabulary) {
        try {
            const customVocab = await this.getCustomVocabulary() || {};

            customVocab[theme] = {
                vocabulary,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (window.securityUtils) {
                await window.securityUtils.saveSecureData(this.keys.CUSTOM_VOCABULARY, customVocab);
            } else {
                localStorage.setItem(this.keys.CUSTOM_VOCABULARY, JSON.stringify(customVocab));
            }

            return true;
        } catch (error) {
            console.error('保存自定义词汇失败:', error);
            return false;
        }
    }

    /**
     * 获取自定义词汇
     */
    async getCustomVocabulary(theme = null) {
        try {
            let data;

            if (window.securityUtils) {
                data = await window.securityUtils.loadSecureData(this.keys.CUSTOM_VOCABULARY);
            } else {
                const stored = localStorage.getItem(this.keys.CUSTOM_VOCABULARY);
                data = stored ? JSON.parse(stored) : null;
            }

            if (theme && data) {
                return data[theme] || null;
            }

            return data;
        } catch (error) {
            console.error('获取自定义词汇失败:', error);
            return null;
        }
    }

    /**
     * 删除自定义词汇
     */
    async deleteCustomVocabulary(theme) {
        try {
            const customVocab = await this.getCustomVocabulary();
            if (customVocab && customVocab[theme]) {
                delete customVocab[theme];

                if (window.securityUtils) {
                    await window.securityUtils.saveSecureData(this.keys.CUSTOM_VOCABULARY, customVocab);
                } else {
                    localStorage.setItem(this.keys.CUSTOM_VOCABULARY, JSON.stringify(customVocab));
                }
            }

            return true;
        } catch (error) {
            console.error('删除自定义词汇失败:', error);
            return false;
        }
    }

    /**
     * 保存使用统计
     */
    saveUsageStats(stats) {
        try {
            const currentStats = this.getUsageStats();
            const updatedStats = {
                ...currentStats,
                ...stats,
                updatedAt: new Date().toISOString()
            };

            localStorage.setItem(this.keys.USAGE_STATS, JSON.stringify(updatedStats));
            return true;
        } catch (error) {
            console.error('保存使用统计失败:', error);
            return false;
        }
    }

    /**
     * 获取使用统计
     */
    getUsageStats() {
        try {
            const stored = localStorage.getItem(this.keys.USAGE_STATS);
            return stored ? JSON.parse(stored) : {
                generationCount: 0,
                apiCalls: 0,
                successfulGenerations: 0,
                firstUsed: null,
                lastUsed: null,
                version: '1.0.0'
            };
        } catch (error) {
            console.error('获取使用统计失败:', error);
            return {
                generationCount: 0,
                apiCalls: 0,
                successfulGenerations: 0,
                firstUsed: null,
                lastUsed: null,
                version: '1.0.0'
            };
        }
    }

    /**
     * 更新使用统计
     */
    updateUsageStats(key, value) {
        const stats = this.getUsageStats();
        stats[key] = (stats[key] || 0) + value;
        stats.lastUsed = new Date().toISOString();
        this.saveUsageStats(stats);
    }

    /**
     * 保存缓存数据
     */
    saveCache(key, data, ttl = 24 * 60 * 60 * 1000) { // 默认24小时
        try {
            const cacheData = {
                data,
                timestamp: Date.now(),
                ttl
            };

            localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
            return true;
        } catch (error) {
            console.error('保存缓存失败:', error);
            return false;
        }
    }

    /**
     * 获取缓存数据
     */
    getCache(key) {
        try {
            const stored = localStorage.getItem(`cache_${key}`);
            if (!stored) return null;

            const cacheData = JSON.parse(stored);
            const now = Date.now();

            // 检查是否过期
            if (now - cacheData.timestamp > cacheData.ttl) {
                localStorage.removeItem(`cache_${key}`);
                return null;
            }

            return cacheData.data;
        } catch (error) {
            console.error('获取缓存失败:', error);
            return null;
        }
    }

    /**
     * 清理过期数据
     */
    async cleanupExpiredData() {
        try {
            const now = Date.now();
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
            let cleanedCount = 0;

            // 清理过期缓存
            for (let key in localStorage) {
                if (key.startsWith('cache_') && localStorage.hasOwnProperty(key)) {
                    try {
                        const cacheData = JSON.parse(localStorage[key]);
                        if (now - cacheData.timestamp > cacheData.ttl) {
                            localStorage.removeItem(key);
                            cleanedCount++;
                        }
                    } catch (e) {
                        localStorage.removeItem(key);
                        cleanedCount++;
                    }
                }
            }

            // 清理过期的生成记录（保留30天）
            const history = await this.getGenerationHistory();
            const filteredHistory = history.filter(record => {
                const recordTime = new Date(record.createdAt).getTime();
                return (now - recordTime) < (30 * 24 * 60 * 60 * 1000);
            });

            if (filteredHistory.length !== history.length) {
                const data = {
                    records: filteredHistory,
                    updatedAt: new Date().toISOString(),
                    total: filteredHistory.length
                };

                if (window.securityUtils) {
                    await window.securityUtils.saveSecureData(this.keys.GENERATION_HISTORY, data);
                } else {
                    localStorage.setItem(this.keys.GENERATION_HISTORY, JSON.stringify(data));
                }
            }

            console.log(`清理了 ${cleanedCount} 条过期数据`);
            return cleanedCount;
        } catch (error) {
            console.error('清理过期数据失败:', error);
            return 0;
        }
    }

    /**
     * 获取存储使用情况
     */
    getStorageUsage() {
        try {
            let totalSize = 0;
            let itemCount = 0;

            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length;
                    itemCount++;
                }
            }

            return {
                totalSize,
                totalSizeKB: Math.round(totalSize / 1024),
                totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
                itemCount,
                maxStorageMB: 5, // localStorage通常限制5MB
                usagePercent: Math.round((totalSize / (5 * 1024 * 1024)) * 100)
            };
        } catch (error) {
            console.error('获取存储使用情况失败:', error);
            return null;
        }
    }

    /**
     * 导出用户数据
     */
    async exportUserData() {
        try {
            const exportData = {
                version: '1.0.0',
                exportedAt: new Date().toISOString(),
                preferences: await this.getUserPreferences(),
                customVocabulary: await this.getCustomVocabulary(),
                usageStats: this.getUsageStats(),
                generationHistory: await this.getGenerationHistory(20) // 只导出最近20条
            };

            return exportData;
        } catch (error) {
            console.error('导出用户数据失败:', error);
            return null;
        }
    }

    /**
     * 导入用户数据
     */
    async importUserData(importData) {
        try {
            if (!importData || typeof importData !== 'object') {
                throw new Error('导入数据格式无效');
            }

            // 导入偏好设置
            if (importData.preferences) {
                await this.saveUserPreferences(importData.preferences);
            }

            // 导入自定义词汇
            if (importData.customVocabulary) {
                if (window.securityUtils) {
                    await window.securityUtils.saveSecureData(this.keys.CUSTOM_VOCABULARY, importData.customVocabulary);
                } else {
                    localStorage.setItem(this.keys.CUSTOM_VOCABULARY, JSON.stringify(importData.customVocabulary));
                }
            }

            // 合并使用统计
            if (importData.usageStats) {
                const currentStats = this.getUsageStats();
                const mergedStats = {
                    ...currentStats,
                    generationCount: currentStats.generationCount + (importData.usageStats.generationCount || 0),
                    apiCalls: currentStats.apiCalls + (importData.usageStats.apiCalls || 0),
                    successfulGenerations: currentStats.successfulGenerations + (importData.usageStats.successfulGenerations || 0),
                    importedAt: new Date().toISOString()
                };
                this.saveUsageStats(mergedStats);
            }

            return true;
        } catch (error) {
            console.error('导入用户数据失败:', error);
            return false;
        }
    }

    /**
     * 清空所有数据
     */
    async clearAllData() {
        try {
            const keysToKeep = ['app_version']; // 保留版本信息

            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key) && !keysToKeep.includes(key)) {
                    localStorage.removeItem(key);
                }
            }

            // 重新初始化默认设置
            this.initializeDefaultSettings();

            return true;
        } catch (error) {
            console.error('清空所有数据失败:', error);
            return false;
        }
    }

    // ================================
    // 支付相关存储方法
    // ================================

    /**
     * 保存用户订阅信息
     * @param {Object} subscription - 订阅信息
     * @returns {boolean} 是否保存成功
     */
    async saveUserSubscription(subscription) {
        try {
            const data = {
                ...subscription,
                updatedAt: new Date().toISOString()
            };

            if (window.securityUtils) {
                await window.securityUtils.saveSecureData(this.keys.USER_SUBSCRIPTION, data);
            } else {
                localStorage.setItem(this.keys.USER_SUBSCRIPTION, JSON.stringify(data));
            }

            console.log('[StorageManager] 用户订阅信息已保存:', subscription.currentPlan);
            return true;
        } catch (error) {
            console.error('[StorageManager] 保存用户订阅失败:', error);
            return false;
        }
    }

    /**
     * 获取用户订阅信息
     * @returns {Object|null} 订阅信息
     */
    async getUserSubscription() {
        try {
            let data;

            if (window.securityUtils) {
                data = await window.securityUtils.loadSecureData(this.keys.USER_SUBSCRIPTION);
            } else {
                const stored = localStorage.getItem(this.keys.USER_SUBSCRIPTION);
                data = stored ? JSON.parse(stored) : null;
            }

            return data;
        } catch (error) {
            console.error('[StorageManager] 获取用户订阅失败:', error);
            return null;
        }
    }

    /**
     * 删除用户订阅信息
     * @returns {boolean} 是否删除成功
     */
    async removeUserSubscription() {
        try {
            if (window.securityUtils) {
                await window.securityUtils.removeSecureData(this.keys.USER_SUBSCRIPTION);
            } else {
                localStorage.removeItem(this.keys.USER_SUBSCRIPTION);
            }

            console.log('[StorageManager] 用户订阅信息已删除');
            return true;
        } catch (error) {
            console.error('[StorageManager] 删除用户订阅失败:', error);
            return false;
        }
    }

    /**
     * 保存支付订单
     * @param {Object} order - 订单信息
     * @returns {boolean} 是否保存成功
     */
    async savePaymentOrder(order) {
        try {
            const orders = await this.getPaymentOrders();

            // 检查是否已存在相同订单ID的订单
            const existingIndex = orders.findIndex(o => o.orderId === order.orderId);
            if (existingIndex >= 0) {
                // 更新现有订单
                orders[existingIndex] = { ...orders[existingIndex], ...order };
            } else {
                // 添加新订单到开头
                orders.unshift(order);
            }

            // 限制订单记录数量
            if (orders.length > 100) {
                orders.splice(100);
            }

            const data = {
                orders: orders,
                updatedAt: new Date().toISOString(),
                total: orders.length
            };

            if (window.securityUtils) {
                await window.securityUtils.saveSecureData(this.keys.PAYMENT_ORDERS, data);
            } else {
                localStorage.setItem(this.keys.PAYMENT_ORDERS, JSON.stringify(data));
            }

            console.log('[StorageManager] 支付订单已保存:', order.orderId);
            return true;
        } catch (error) {
            console.error('[StorageManager] 保存支付订单失败:', error);
            return false;
        }
    }

    /**
     * 获取支付订单列表
     * @param {number} limit - 限制数量
     * @returns {Array} 订单列表
     */
    async getPaymentOrders(limit = null) {
        try {
            let data;

            if (window.securityUtils) {
                data = await window.securityUtils.loadSecureData(this.keys.PAYMENT_ORDERS);
            } else {
                const stored = localStorage.getItem(this.keys.PAYMENT_ORDERS);
                data = stored ? JSON.parse(stored) : null;
            }

            const orders = data ? data.orders : [];

            if (limit && limit > 0) {
                return orders.slice(0, limit);
            }

            return orders;
        } catch (error) {
            console.error('[StorageManager] 获取支付订单失败:', error);
            return [];
        }
    }

    /**
     * 获取单个支付订单
     * @param {string} orderId - 订单ID
     * @returns {Object|null} 订单信息
     */
    async getPaymentOrder(orderId) {
        try {
            const orders = await this.getPaymentOrders();
            return orders.find(order => order.orderId === orderId) || null;
        } catch (error) {
            console.error('[StorageManager] 获取单个支付订单失败:', error);
            return null;
        }
    }

    /**
     * 删除支付订单
     * @param {string} orderId - 订单ID
     * @returns {boolean} 是否删除成功
     */
    async removePaymentOrder(orderId) {
        try {
            const orders = await this.getPaymentOrders();
            const filteredOrders = orders.filter(order => order.orderId !== orderId);

            const data = {
                orders: filteredOrders,
                updatedAt: new Date().toISOString(),
                total: filteredOrders.length
            };

            if (window.securityUtils) {
                await window.securityUtils.saveSecureData(this.keys.PAYMENT_ORDERS, data);
            } else {
                localStorage.setItem(this.keys.PAYMENT_ORDERS, JSON.stringify(data));
            }

            console.log('[StorageManager] 支付订单已删除:', orderId);
            return true;
        } catch (error) {
            console.error('[StorageManager] 删除支付订单失败:', error);
            return false;
        }
    }

    /**
     * 清空支付订单
     * @returns {boolean} 是否清空成功
     */
    async clearPaymentOrders() {
        try {
            if (window.securityUtils) {
                await window.securityUtils.removeSecureData(this.keys.PAYMENT_ORDERS);
            } else {
                localStorage.removeItem(this.keys.PAYMENT_ORDERS);
            }

            console.log('[StorageManager] 支付订单已清空');
            return true;
        } catch (error) {
            console.error('[StorageManager] 清空支付订单失败:', error);
            return false;
        }
    }

    /**
     * 保存支付设置
     * @param {Object} settings - 支付设置
     * @returns {boolean} 是否保存成功
     */
    async savePaymentSettings(settings) {
        try {
            const data = {
                ...settings,
                updatedAt: new Date().toISOString()
            };

            if (window.securityUtils) {
                await window.securityUtils.saveSecureData(this.keys.PAYMENT_SETTINGS, data);
            } else {
                localStorage.setItem(this.keys.PAYMENT_SETTINGS, JSON.stringify(data));
            }

            console.log('[StorageManager] 支付设置已保存');
            return true;
        } catch (error) {
            console.error('[StorageManager] 保存支付设置失败:', error);
            return false;
        }
    }

    /**
     * 获取支付设置
     * @returns {Object|null} 支付设置
     */
    async getPaymentSettings() {
        try {
            let data;

            if (window.securityUtils) {
                data = await window.securityUtils.loadSecureData(this.keys.PAYMENT_SETTINGS);
            } else {
                const stored = localStorage.getItem(this.keys.PAYMENT_SETTINGS);
                data = stored ? JSON.parse(stored) : null;
            }

            return data;
        } catch (error) {
            console.error('[StorageManager] 获取支付设置失败:', error);
            return null;
        }
    }

    /**
     * 获取支付统计信息
     * @returns {Object} 支付统计
     */
    async getPaymentStats() {
        try {
            const orders = await this.getPaymentOrders();
            const subscription = await this.getUserSubscription();

            const stats = {
                totalOrders: orders.length,
                paidOrders: orders.filter(order => order.status === 'paid').length,
                pendingOrders: orders.filter(order => order.status === 'pending').length,
                failedOrders: orders.filter(order => order.status === 'failed').length,
                totalSpent: orders
                    .filter(order => order.status === 'paid')
                    .reduce((sum, order) => sum + (order.amount || 0), 0),
                currentPlan: subscription ? subscription.currentPlan : 'free',
                planStatus: subscription ? subscription.planStatus : 'active',
                lastPaymentDate: orders.length > 0 ? orders[0].createdAt : null,
                subscriptionStartDate: subscription ? subscription.startDate : null,
                subscriptionEndDate: subscription ? subscription.endDate : null
            };

            return stats;
        } catch (error) {
            console.error('[StorageManager] 获取支付统计失败:', error);
            return {
                totalOrders: 0,
                paidOrders: 0,
                pendingOrders: 0,
                failedOrders: 0,
                totalSpent: 0,
                currentPlan: 'free',
                planStatus: 'active',
                lastPaymentDate: null,
                subscriptionStartDate: null,
                subscriptionEndDate: null
            };
        }
    }

    /**
     * 生成唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// 创建全局实例
window.storageManager = new StorageManager();