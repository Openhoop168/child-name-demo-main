/**
 * 安全工具类
 * 提供数据加密、安全存储等功能
 */

class SecurityUtils {
    constructor() {
        this.encryptionKey = null;
        this.initialized = false;
    }

    /**
     * 初始化安全工具
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // 生成或获取加密密钥
            await this.initializeEncryption();
            this.initialized = true;
            console.log('安全工具初始化完成');
        } catch (error) {
            console.error('安全工具初始化失败:', error);
            // 即使初始化失败，也标记为已初始化，避免重复尝试
            this.initialized = true;
        }
    }

    /**
     * 初始化加密功能
     */
    async initializeEncryption() {
        try {
            // 检查浏览器是否支持Web Crypto API
            if (!window.crypto || !window.crypto.subtle) {
                console.warn('浏览器不支持Web Crypto API，将使用基础加密');
                this.encryptionKey = this.generateSimpleKey();
                return;
            }

            // 尝试从本地存储获取密钥
            const storedKey = localStorage.getItem('app_encryption_key');
            if (storedKey) {
                this.encryptionKey = storedKey;
            } else {
                // 生成新的密钥
                this.encryptionKey = this.generateSimpleKey();
                localStorage.setItem('app_encryption_key', this.encryptionKey);
            }
        } catch (error) {
            console.error('初始化加密失败:', error);
            this.encryptionKey = this.generateSimpleKey();
        }
    }

    /**
     * 生成简单密钥（备用方案）
     */
    generateSimpleKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let key = '';
        for (let i = 0; i < 32; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    }

    /**
     * 简单异或加密
     */
    xorEncrypt(text, key) {
        try {
            let result = '';
            for (let i = 0; i < text.length; i++) {
                result += String.fromCharCode(
                    text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
                );
            }
            // 使用支持Unicode的Base64编码
            return this.unicodeToBase64(result);
        } catch (error) {
            throw new Error('加密失败: ' + error.message);
        }
    }

    /**
     * 简单异或解密
     */
    xorDecrypt(encryptedText, key) {
        try {
            // 使用支持Unicode的Base64解码
            const text = this.unicodeFromBase64(encryptedText);
            let result = '';
            for (let i = 0; i < text.length; i++) {
                result += String.fromCharCode(
                    text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
                );
            }
            return result;
        } catch (error) {
            console.error('解密失败:', error);
            return null;
        }
    }

    /**
     * 支持Unicode的Base64编码
     */
    unicodeToBase64(str) {
        try {
            // 首先将字符串转换为UTF-8字节
            const utf8Bytes = new TextEncoder().encode(str);
            // 然后将字节数组转换为Base64
            return btoa(String.fromCharCode(...utf8Bytes));
        } catch (error) {
            // 降级到简单方法（可能不支持中文）
            try {
                return btoa(unescape(encodeURIComponent(str)));
            } catch (fallbackError) {
                throw new Error('Base64编码失败: ' + fallbackError.message);
            }
        }
    }

    /**
     * 支持Unicode的Base64解码
     */
    unicodeFromBase64(base64) {
        try {
            // 解码Base64为字节字符串
            const binaryStr = atob(base64);
            // 转换为字节数组
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
            }
            // 解码UTF-8为字符串
            return new TextDecoder().decode(bytes);
        } catch (error) {
            // 降级到简单方法
            try {
                return decodeURIComponent(escape(atob(base64)));
            } catch (fallbackError) {
                throw new Error('Base64解码失败: ' + fallbackError.message);
            }
        }
    }

    /**
     * 安全保存数据
     */
    async saveSecureData(key, data) {
        try {
            if (!this.encryptionKey) {
                await this.initializeEncryption();
            }

            const jsonData = JSON.stringify({
                data: data,
                timestamp: Date.now(),
                version: '1.0'
            });

            const encrypted = this.xorEncrypt(jsonData, this.encryptionKey);
            localStorage.setItem(`secure_${key}`, encrypted);

            return true;
        } catch (error) {
            console.error('安全保存数据失败:', error);
            // 失败时使用普通保存
            localStorage.setItem(key, data);
            return false;
        }
    }

    /**
     * 安全加载数据
     */
    async loadSecureData(key) {
        try {
            if (!this.encryptionKey) {
                await this.initializeEncryption();
            }

            const encrypted = localStorage.getItem(`secure_${key}`);
            if (!encrypted) {
                return null;
            }

            const decrypted = this.xorDecrypt(encrypted, this.encryptionKey);
            if (!decrypted) {
                return null;
            }

            const parsed = JSON.parse(decrypted);

            // 检查数据完整性
            if (parsed.version !== '1.0' || !parsed.data) {
                throw new Error('数据格式无效');
            }

            return parsed.data;
        } catch (error) {
            console.error('安全加载数据失败:', error);
            // 尝试从普通存储加载
            return localStorage.getItem(key);
        }
    }

    /**
     * 删除安全数据
     */
    async removeSecureData(key) {
        try {
            localStorage.removeItem(`secure_${key}`);
            localStorage.removeItem(key); // 同时删除可能的普通存储数据
            return true;
        } catch (error) {
            console.error('删除安全数据失败:', error);
            return false;
        }
    }

    /**
     * 验证API密钥格式
     */
    validateApiKeyFormat(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            return { valid: false, reason: '密钥不能为空' };
        }

        const trimmedKey = apiKey.trim();

        if (trimmedKey.length < 20) {
            return { valid: false, reason: '密钥长度过短' };
        }

        if (trimmedKey.length > 200) {
            return { valid: false, reason: '密钥长度过长' };
        }

        // 检查是否包含基本字符
        if (!/^[a-zA-Z0-9\-_]+$/.test(trimmedKey)) {
            return { valid: false, reason: '密钥格式无效' };
        }

        return { valid: true };
    }

    /**
     * 生成随机字符串
     */
    generateRandomString(length = 16) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * 清理敏感数据
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') {
            return '';
        }

        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;')
            .trim();
    }

    /**
     * 验证输入长度
     */
    validateInputLength(input, minLength = 1, maxLength = 1000) {
        if (typeof input !== 'string') {
            return { valid: false, reason: '输入必须是字符串' };
        }

        const length = input.length;

        if (length < minLength) {
            return { valid: false, reason: `输入长度不能少于${minLength}个字符` };
        }

        if (length > maxLength) {
            return { valid: false, reason: `输入长度不能超过${maxLength}个字符` };
        }

        return { valid: true, length };
    }

    /**
     * 检查内容安全性
     */
    checkContentSafety(content) {
        if (typeof content !== 'string') {
            return { safe: false, reason: '内容必须是字符串' };
        }

        // 基础内容安全检查
        const forbiddenPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /eval\s*\(/gi,
            /document\./gi,
            /window\./gi
        ];

        for (const pattern of forbiddenPatterns) {
            if (pattern.test(content)) {
                return { safe: false, reason: '内容包含不安全的代码' };
            }
        }

        return { safe: true };
    }

    /**
     * 生成文件指纹
     */
    generateFileFingerprint(content) {
        if (typeof content !== 'string') {
            return null;
        }

        // 简单的哈希函数（生产环境建议使用更安全的算法）
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }

        return Math.abs(hash).toString(16);
    }

    /**
     * 创建会话令牌
     */
    createSessionToken() {
        const timestamp = Date.now();
        const random = this.generateRandomString(32);
        return `${timestamp}_${random}`;
    }

    /**
     * 验证会话令牌
     */
    validateSessionToken(token, maxAge = 24 * 60 * 60 * 1000) { // 默认24小时
        if (!token || typeof token !== 'string') {
            return false;
        }

        const parts = token.split('_');
        if (parts.length !== 2) {
            return false;
        }

        const timestamp = parseInt(parts[0]);
        if (isNaN(timestamp) || Date.now() - timestamp > maxAge) {
            return false;
        }

        return true;
    }

    /**
     * 获取浏览器指纹
     */
    getBrowserFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Browser fingerprint', 2, 2);

        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            !!window.sessionStorage,
            !!window.localStorage,
            canvas.toDataURL()
        ].join('|');

        return this.generateFileFingerprint(fingerprint);
    }

    /**
     * 防抖函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 节流函数
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 获取存储使用情况
     */
    getStorageUsage() {
        try {
            let totalSize = 0;
            let secureItems = 0;

            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length;
                    if (key.startsWith('secure_')) {
                        secureItems++;
                    }
                }
            }

            return {
                totalSize,
                totalSizeKB: Math.round(totalSize / 1024),
                itemCount: Object.keys(localStorage).length,
                secureItems,
                maxSizeKB: 5120, // 5MB (localStorage通常限制)
                usagePercent: Math.round((totalSize / (5120 * 1024)) * 100)
            };
        } catch (error) {
            console.error('获取存储使用情况失败:', error);
            return null;
        }
    }

    /**
     * 清理过期数据
     */
    cleanupExpiredData(maxAge = 7 * 24 * 60 * 60 * 1000) { // 默认7天
        try {
            const now = Date.now();
            let cleanedCount = 0;

            for (let key in localStorage) {
                if (key.startsWith('secure_') && localStorage.hasOwnProperty(key)) {
                    try {
                        const encrypted = localStorage[key];
                        const decrypted = this.xorDecrypt(encrypted, this.encryptionKey);
                        if (decrypted) {
                            const parsed = JSON.parse(decrypted);
                            if (parsed.timestamp && (now - parsed.timestamp) > maxAge) {
                                localStorage.removeItem(key);
                                cleanedCount++;
                            }
                        }
                    } catch (e) {
                        // 无法解析的数据，直接删除
                        localStorage.removeItem(key);
                        cleanedCount++;
                    }
                }
            }

            return { cleanedCount };
        } catch (error) {
            console.error('清理过期数据失败:', error);
            return { cleanedCount: 0 };
        }
    }
}

// 创建全局实例
window.securityUtils = new SecurityUtils();