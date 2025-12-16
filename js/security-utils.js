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
     * 增强的HTML清理函数 - 防止XSS攻击
     */
    sanitizeHtml(html) {
        if (typeof html !== 'string') {
            return '';
        }

        // 移除危险标签和属性
        let sanitized = html
            // 移除script标签及其内容
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            // 移除iframe标签
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
            // 移除object标签
            .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
            // 移除embed标签
            .replace(/<embed\b[^>]*>/gi, '')
            // 移除form标签
            .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
            // 移除input标签
            .replace(/<input\b[^>]*>/gi, '')
            // 移除textarea标签
            .replace(/<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi, '')
            // 移除button标签
            .replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, '')
            // 移除meta标签
            .replace(/<meta\b[^>]*>/gi, '')
            // 移除link标签
            .replace(/<link\b[^>]*>/gi, '')
            // 移除style标签（保留内容但移除危险内容）
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

        // 移除所有on*事件属性（onclick, onerror等）
        sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
        sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^>\s]*/gi, '');

        // 移除危险的HTML属性
        const dangerousAttributes = [
            'javascript:', 'vbscript:', 'data:', 'src', 'href', 'action',
            'background', 'codebase', 'dynsrc', 'lowsrc', 'style', 'classid',
            'clsid', 'data', 'archive', 'usemap', 'ismap', 'formaction'
        ];

        dangerousAttributes.forEach(attr => {
            const regex = new RegExp(`\\s+${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
            sanitized = sanitized.replace(regex, '');
            const regex2 = new RegExp(`\\s+${attr}\\s*=\\s*[^>\\s]*`, 'gi');
            sanitized = sanitized.replace(regex2, '');
        });

        // 移除CSS表达式和危险CSS
        sanitized = sanitized.replace(/expression\s*\(/gi, '');
        sanitized = sanitized.replace(/javascript\s*:/gi, '');
        sanitized = sanitized.replace(/vbscript\s*:/gi, '');
        sanitized = sanitized.replace(/data\s*:/gi, '');

        // 移除HTML注释（可能包含恶意代码）
        sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, '');

        // 基本的HTML转义
        sanitized = sanitized
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');

        return sanitized.trim();
    }

    /**
     * 验证用户内容 - 综合安全检查
     */
    validateUserContent(content, type = 'text') {
        if (typeof content !== 'string') {
            return {
                valid: false,
                reason: '内容必须是字符串',
                cleanedContent: ''
            };
        }

        // 检查长度
        const lengthValidation = this.validateInputLength(content, 1, 10000);
        if (!lengthValidation.valid) {
            return {
                valid: false,
                reason: lengthValidation.reason,
                cleanedContent: ''
            };
        }

        // 检查内容安全性
        const safetyCheck = this.checkContentSafety(content);
        if (!safetyCheck.safe) {
            return {
                valid: false,
                reason: safetyCheck.reason,
                cleanedContent: this.sanitizeHtml(content)
            };
        }

        // 额外的XSS防护检查
        const xssPatterns = [
            // 基础XSS模式
            /<[^>]*script[^>]*>.*?<\/[^>]*script[^>]*>/gi,
            /<[^>]*iframe[^>]*>.*?<\/[^>]*iframe[^>]*>/gi,
            /<[^>]*object[^>]*>.*?<\/[^>]*object[^>]*>/gi,
            /<[^>]*embed[^>]*>/gi,

            // 事件处理器
            /on\w+\s*=\s*["'][^"']*["']/gi,
            /on\w+\s*=\s*[^>\s]*/gi,

            // JavaScript协议
            /javascript\s*:/gi,
            /vbscript\s*:/gi,
            /data\s*:\s*text\/html/gi,

            // CSS表达式
            /expression\s*\(/gi,

            // Meta标签注入
            /<meta[^>]*http-equiv[^>]*refresh/gi,
            /<meta[^>]*content[^>]*url/gi,

            // DOM注入
            /document\.(?:write|writeln|cookie|location|open|close)/gi,
            /window\.(?:location|open|close|alert|confirm|prompt)/gi,

            // 评估函数
            /eval\s*\(/gi,
            /setTimeout\s*\(/gi,
            /setInterval\s*\(/gi,

            // 其他危险模式
            /@import/gi,
            /binding\s*:/gi,
            /behavior\s*:/gi,
            /-moz-binding/gi
        ];

        for (const pattern of xssPatterns) {
            if (pattern.test(content)) {
                return {
                    valid: false,
                    reason: '内容包含潜在的XSS攻击代码',
                    cleanedContent: this.sanitizeHtml(content)
                };
            }
        }

        // SQL注入检查（如果内容可能用于数据库查询）
        const sqlPatterns = [
            /union\s+select/gi,
            /drop\s+table/gi,
            /delete\s+from/gi,
            /insert\s+into/gi,
            /update\s+\w+\s+set/gi,
            /create\s+table/gi,
            /alter\s+table/gi,
            /exec\s*\(/gi,
            /execute\s*\(/gi,
            /xp_cmdshell/gi,
            /sp_executesql/gi
        ];

        for (const pattern of sqlPatterns) {
            if (pattern.test(content)) {
                return {
                    valid: false,
                    reason: '内容包含潜在的SQL注入代码',
                    cleanedContent: this.sanitizeHtml(content)
                };
            }
        }

        // 命令注入检查
        const commandPatterns = [
            /\|\s*[^|]*\|/g,  // 管道命令
            /&&[^&]*&&/g,     // AND命令
            /;\s*\w+/g,      // 分号命令
            /\$\([^)]*\)/g,  // 命令替换
            /`[^`]*`/g,      // 反引号命令
            /\.\./g,         // 路径遍历
            /[\/\\]\./g,     // 隐藏文件访问
        ];

        for (const pattern of commandPatterns) {
            if (pattern.test(content)) {
                return {
                    valid: false,
                    reason: '内容包含潜在的命令注入代码',
                    cleanedContent: this.sanitizeHtml(content)
                };
            }
        }

        // 内容类型特定验证
        let cleanedContent = content;

        switch (type) {
            case 'html':
                cleanedContent = this.sanitizeHtml(content);
                break;
            case 'text':
                cleanedContent = this.sanitizeInput(content);
                break;
            case 'prompt':
                // AI提示词需要特殊处理，移除可能的安全风险
                cleanedContent = this.sanitizePromptContent(content);
                break;
            default:
                cleanedContent = this.sanitizeInput(content);
        }

        // 检查清理后是否还有内容
        if (!cleanedContent || cleanedContent.trim().length === 0) {
            return {
                valid: false,
                reason: '清理后内容为空',
                cleanedContent: ''
            };
        }

        return {
            valid: true,
            cleanedContent: cleanedContent,
            originalLength: content.length,
            cleanedLength: cleanedContent.length
        };
    }

    /**
     * 清理AI提示词内容 - 专门用于AI提示词
     */
    sanitizePromptContent(prompt) {
        if (typeof prompt !== 'string') {
            return '';
        }

        let cleaned = prompt;

        // 移除可能影响AI模型安全性的内容
        const unsafePatterns = [
            // 忽略指令模式
            /ignore\s+(?:previous|all)\s+(?:instructions|prompts?)/gi,
            /disregard\s+(?:previous|all)\s+(?:instructions|prompts?)/gi,
            /forget\s+(?:previous|all)\s+(?:instructions|prompts?)/gi,

            // 系统提示注入
            /system\s*:\s*/gi,
            /assistant\s*:\s*/gi,
            /developer\s*:\s*/gi,

            // 角色扮演注入
            /you\s+are\s+(?:no\s+longer|not)/gi,
            /act\s+as\s+(?:if\s+)?you\s+are/gi,
            /pretend\s+(?:to\s+be|that\s+you\s+are)/gi,

            // 信息泄露尝试
            /tell\s+me\s+about/gi,
            /show\s+me\s+(?:your|the)\s+(?:prompt|instructions|system)/gi,
            /what\s+(?:do\s+)?you\s+know\s+about/gi,

            // 危险请求
            /(?:generate|create|write|provide)\s+(?:code|script|program)/gi,
            /hack|exploit|bypass|circumvent/gi,
            /malware|virus|trojan|ransomware/gi
        ];

        for (const pattern of unsafePatterns) {
            cleaned = cleaned.replace(pattern, '[REMOVED_CONTENT]');
        }

        // 移除或替换敏感信息
        cleaned = cleaned.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD_NUMBER]');
        cleaned = cleaned.replace(/\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, '[SSN]');
        cleaned = cleaned.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
        cleaned = cleaned.replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE_NUMBER]');

        // 移除URL
        cleaned = cleaned.replace(/https?:\/\/[^\s<>"']+/gi, '[URL]');
        cleaned = cleaned.replace(/www\.[^\s<>"']+/gi, '[URL]');

        return cleaned.trim();
    }

    /**
     * 高级XSS检测 - 使用更复杂的方法检测XSS
     */
    advancedXSSDetection(content) {
        if (typeof content !== 'string') {
            return { safe: false, reason: '内容必须是字符串' };
        }

        // 解码HTML实体
        const decodedContent = this.decodeHtmlEntities(content);

        // 检查编码后的内容
        const xssPatterns = [
            // 编码的脚本标签
            /%3cscript%3e/gi,
            /%3c\/script%3e/gi,

            // Unicode编码
            /\\u003cscript\\u003e/gi,
            /\\u003c\\/script\\u003e/gi,

            // Hex编码
            /&#x3c;script&#x3e;/gi,
            /&#x3c;\/script&#x3e;/gi,

            // 混合编码
            /%3c\\u003cscript/gi,

            // 基于字符的混淆
            /<s[cC][rR][iI][pP][tT]/g,
            /<\\x73\\x63\\x72\\x69\\x70\\x74>/g
        ];

        for (const pattern of xssPatterns) {
            if (pattern.test(decodedContent)) {
                return { safe: false, reason: '检测到编码的XSS攻击' };
            }
        }

        // 检查DOM-based XSS
        if (this.checkDOMBasedXSS(decodedContent)) {
            return { safe: false, reason: '检测到DOM-based XSS攻击' };
        }

        return { safe: true };
    }

    /**
     * 检查DOM-based XSS
     */
    checkDOMBasedXSS(content) {
        const domXSSPatterns = [
            // DOM操作
            /document\.(?:write|writeln)/gi,
            /innerHTML\s*=/gi,
            /outerHTML\s*=/gi,
            /insertAdjacentHTML/gi,

            // 脚本创建
            /createElement\s*\(\s*["']script["']\s*\)/gi,
            /setAttribute\s*\(\s*["']on\w+["']/gi,

            // 事件监听器
            /addEventListener\s*\(\s*["']on\w+/gi,
            /attachEvent\s*\(\s*["']on\w+/gi,

            // 位置操作
            /location\.(?:href|hash|search|replace|assign)/gi,
            /window\.(?:open|location)/gi,

            // Cookie操作
            /document\.\s*cookie/gi
        ];

        return domXSSPatterns.some(pattern => pattern.test(content));
    }

    /**
     * 解码HTML实体
     */
    decodeHtmlEntities(text) {
        if (typeof text !== 'string') {
            return '';
        }

        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
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

    // ================================
    // 支付安全功能
    // ================================

    /**
     * 初始化支付安全功能
     */
    async initializePaymentSecurity() {
        try {
            // 生成支付专用加密密钥
            this.paymentEncryptionKey = this.generateRandomString(128);

            // 验证支付安全配置
            this.validatePaymentSecurityConfig();

            console.log('[SecurityUtils] 支付安全功能已初始化');
            return true;
        } catch (error) {
            console.error('[SecurityUtils] 支付安全功能初始化失败:', error);
            return false;
        }
    }

    /**
     * 验证支付安全配置
     */
    validatePaymentSecurityConfig() {
        // 检查必要的加密功能是否可用
        if (!this.encryptionKey) {
            throw new Error('基础加密密钥未初始化');
        }

        if (!this.paymentEncryptionKey) {
            throw new Error('支付加密密钥未初始化');
        }

        // 检查浏览器安全特性
        if (!window.crypto || !window.crypto.subtle) {
            console.warn('[SecurityUtils] 浏览器不支持高级加密功能，支付安全性可能降低');
        }

        return true;
    }

    /**
     * 加密支付数据
     * @param {Object} data - 要加密的支付数据
     * @returns {string} 加密后的数据
     */
    encryptPaymentData(data) {
        try {
            if (!this.paymentEncryptionKey) {
                this.initializePaymentSecurity();
            }

            const jsonString = JSON.stringify(data);
            const encrypted = this.xorEncrypt(jsonString, this.paymentEncryptionKey);

            // 添加时间戳和校验和
            const secureData = {
                data: encrypted,
                timestamp: Date.now(),
                checksum: this.generateChecksum(jsonString),
                version: '1.0'
            };

            return JSON.stringify(secureData);
        } catch (error) {
            console.error('[SecurityUtils] 支付数据加密失败:', error);
            throw new Error('支付数据加密失败');
        }
    }

    /**
     * 解密支付数据
     * @param {string} encryptedData - 加密的支付数据
     * @returns {Object} 解密后的支付数据
     */
    decryptPaymentData(encryptedData) {
        try {
            if (!this.paymentEncryptionKey) {
                throw new Error('支付加密密钥未初始化');
            }

            const secureData = JSON.parse(encryptedData);

            // 验证数据完整性
            if (!this.validatePaymentDataIntegrity(secureData)) {
                throw new Error('支付数据完整性验证失败');
            }

            // 检查数据时效性（支付数据5分钟内有效）
            const maxAge = 5 * 60 * 1000; // 5分钟
            if (Date.now() - secureData.timestamp > maxAge) {
                throw new Error('支付数据已过期');
            }

            const decrypted = this.xorDecrypt(secureData.data, this.paymentEncryptionKey);
            const data = JSON.parse(decrypted);

            // 验证校验和
            const currentChecksum = this.generateChecksum(decrypted);
            if (currentChecksum !== secureData.checksum) {
                throw new Error('支付数据校验和验证失败');
            }

            return data;
        } catch (error) {
            console.error('[SecurityUtils] 支付数据解密失败:', error);
            throw new Error('支付数据解密失败: ' + error.message);
        }
    }

    /**
     * 验证支付数据完整性
     * @param {Object} secureData - 安全数据对象
     * @returns {boolean} 验证结果
     */
    validatePaymentDataIntegrity(secureData) {
        try {
            // 检查必要字段
            if (!secureData.data || !secureData.timestamp || !secureData.checksum) {
                return false;
            }

            // 检查版本
            if (secureData.version && secureData.version !== '1.0') {
                console.warn('[SecurityUtils] 不支持的支付数据版本:', secureData.version);
            }

            return true;
        } catch (error) {
            console.error('[SecurityUtils] 支付数据完整性验证失败:', error);
            return false;
        }
    }

    /**
     * 验证支付金额
     * @param {number} amount - 支付金额
     * @returns {boolean} 验证结果
     */
    validatePaymentAmount(amount) {
        try {
            // 检查金额类型
            if (typeof amount !== 'number' || isNaN(amount)) {
                return false;
            }

            // 检查金额范围（0.01 - 99999.99）
            if (amount < 0.01 || amount > 99999.99) {
                return false;
            }

            // 检查小数位数（最多2位）
            const decimalPlaces = (amount.toString().split('.')[1] || '').length;
            if (decimalPlaces > 2) {
                return false;
            }

            // 验证有效套餐金额
            const validAmounts = [0, 9.9, 29.9, 59.9]; // 对应套餐价格
            if (!validAmounts.includes(amount)) {
                console.warn('[SecurityUtils] 可疑的支付金额:', amount);
                // 不直接拒绝，但记录警告
            }

            return true;
        } catch (error) {
            console.error('[SecurityUtils] 支付金额验证失败:', error);
            return false;
        }
    }

    /**
     * 生成订单签名
     * @param {Object} orderInfo - 订单信息
     * @returns {string} 订单签名
     */
    generateOrderSignature(orderInfo) {
        try {
            // 构建签名数据
            const signatureData = {
                orderId: orderInfo.orderId,
                amount: orderInfo.amount,
                planId: orderInfo.planId,
                userId: orderInfo.userId,
                timestamp: Date.now()
            };

            // 生成签名字符串
            const signatureString = JSON.stringify(signatureData);

            // 使用基础加密密钥生成签名
            const signature = this.xorEncrypt(signatureString, this.encryptionKey);

            // 转换为Base64格式的签名
            return btoa(signature.substring(0, 32)); // 取前32个字符作为签名
        } catch (error) {
            console.error('[SecurityUtils] 订单签名生成失败:', error);
            throw new Error('订单签名生成失败');
        }
    }

    /**
     * 验证订单签名
     * @param {Object} orderInfo - 订单信息
     * @param {string} signature - 订单签名
     * @returns {boolean} 验证结果
     */
    verifyOrderSignature(orderInfo, signature) {
        try {
            if (!orderInfo || !signature) {
                return false;
            }

            // 生成期望的签名
            const expectedSignature = this.generateOrderSignature(orderInfo);

            // 比较签名（使用时间安全的比较方式）
            return this.constantTimeCompare(signature, expectedSignature);
        } catch (error) {
            console.error('[SecurityUtils] 订单签名验证失败:', error);
            return false;
        }
    }

    /**
     * 时间安全的字符串比较
     * @param {string} a - 字符串A
     * @param {string} b - 字符串B
     * @returns {boolean} 比较结果
     */
    constantTimeCompare(a, b) {
        try {
            if (a.length !== b.length) {
                return false;
            }

            let result = 0;
            for (let i = 0; i < a.length; i++) {
                result |= a.charCodeAt(i) ^ b.charCodeAt(i);
            }

            return result === 0;
        } catch (error) {
            console.error('[SecurityUtils] 时间安全比较失败:', error);
            return false;
        }
    }

    /**
     * 生成支付随机数（防止重放攻击）
     * @param {number} length - 随机数长度
     * @returns {string} 随机数字符串
     */
    generatePaymentNonce(length = 32) {
        try {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let nonce = '';

            // 使用Web Crypto API生成随机数
            if (window.crypto && window.crypto.getRandomValues) {
                const randomValues = new Uint8Array(length);
                window.crypto.getRandomValues(randomValues);

                for (let i = 0; i < length; i++) {
                    nonce += chars[randomValues[i] % chars.length];
                }
            } else {
                // 降级到Math.random
                for (let i = 0; i < length; i++) {
                    nonce += chars[Math.floor(Math.random() * chars.length)];
                }
            }

            // 添加时间戳前缀
            return Date.now().toString(36) + '_' + nonce;
        } catch (error) {
            console.error('[SecurityUtils] 支付随机数生成失败:', error);
            throw new Error('支付随机数生成失败');
        }
    }

    /**
     * 验证支付随机数
     * @param {string} nonce - 随机数
     * @param {number} maxAge - 最大有效期（毫秒）
     * @returns {boolean} 验证结果
     */
    validatePaymentNonce(nonce, maxAge = 5 * 60 * 1000) { // 默认5分钟
        try {
            if (!nonce || typeof nonce !== 'string') {
                return false;
            }

            // 检查格式
            const parts = nonce.split('_');
            if (parts.length !== 2) {
                return false;
            }

            // 检查时间戳
            const timestamp = parseInt(parts[0], 36);
            if (isNaN(timestamp) || Date.now() - timestamp > maxAge) {
                return false;
            }

            // 检查随机部分长度
            if (parts[1].length < 16) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('[SecurityUtils] 支付随机数验证失败:', error);
            return false;
        }
    }

    /**
     * 生成支付数据校验和
     * @param {string} data - 数据字符串
     * @returns {string} 校验和
     */
    generateChecksum(data) {
        try {
            let hash = 0;
            if (data.length === 0) return hash.toString();

            for (let i = 0; i < data.length; i++) {
                const char = data.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // 转换为32位整数
            }

            return Math.abs(hash).toString(16);
        } catch (error) {
            console.error('[SecurityUtils] 校验和生成失败:', error);
            return '0';
        }
    }

    /**
     * 安全存储支付信息
     * @param {string} key - 存储键
     * @param {Object} paymentData - 支付数据
     * @returns {boolean} 存储结果
     */
    secureStorePaymentData(key, paymentData) {
        try {
            const secureKey = 'secure_payment_' + key;
            const encryptedData = this.encryptPaymentData(paymentData);

            localStorage.setItem(secureKey, encryptedData);

            // 记录存储操作
            this.logPaymentOperation('store', key, 'success');

            return true;
        } catch (error) {
            console.error('[SecurityUtils] 支付数据安全存储失败:', error);
            this.logPaymentOperation('store', key, 'error', error.message);
            return false;
        }
    }

    /**
     * 安全读取支付信息
     * @param {string} key - 存储键
     * @returns {Object|null} 支付数据
     */
    secureLoadPaymentData(key) {
        try {
            const secureKey = 'secure_payment_' + key;
            const encryptedData = localStorage.getItem(secureKey);

            if (!encryptedData) {
                return null;
            }

            const paymentData = this.decryptPaymentData(encryptedData);

            // 记录读取操作
            this.logPaymentOperation('load', key, 'success');

            return paymentData;
        } catch (error) {
            console.error('[SecurityUtils] 支付数据安全读取失败:', error);
            this.logPaymentOperation('load', key, 'error', error.message);
            return null;
        }
    }

    /**
     * 安全删除支付信息
     * @param {string} key - 存储键
     * @returns {boolean} 删除结果
     */
    secureRemovePaymentData(key) {
        try {
            const secureKey = 'secure_payment_' + key;
            localStorage.removeItem(secureKey);

            // 记录删除操作
            this.logPaymentOperation('remove', key, 'success');

            return true;
        } catch (error) {
            console.error('[SecurityUtils] 支付数据安全删除失败:', error);
            this.logPaymentOperation('remove', key, 'error', error.message);
            return false;
        }
    }

    /**
     * 记录支付操作日志
     * @param {string} operation - 操作类型
     * @param {string} key - 数据键
     * @param {string} status - 操作状态
     * @param {string} error - 错误信息（可选）
     */
    logPaymentOperation(operation, key, status, error = null) {
        try {
            const logEntry = {
                operation: operation,
                key: key,
                status: status,
                timestamp: new Date().toISOString(),
                error: error
            };

            // 使用基础安全存储功能
            this.saveSecureData('payment_security_log', logEntry);

            // 限制日志条目数量
            this.cleanupPaymentLogs(100);
        } catch (error) {
            console.error('[SecurityUtils] 支付操作日志记录失败:', error);
        }
    }

    /**
     * 清理支付安全日志
     * @param {number} maxEntries - 最大保留条目数
     */
    cleanupPaymentLogs(maxEntries = 100) {
        try {
            const logs = this.loadSecureData('payment_security_log') || [];
            if (Array.isArray(logs) && logs.length > maxEntries) {
                const trimmedLogs = logs.slice(-maxEntries);
                this.saveSecureData('payment_security_log', trimmedLogs);
            }
        } catch (error) {
            console.error('[SecurityUtils] 支付日志清理失败:', error);
        }
    }

    /**
     * 获取支付安全统计信息
     * @returns {Object} 安全统计信息
     */
    getPaymentSecurityStats() {
        try {
            const logs = this.loadSecureData('payment_security_log') || [];

            const stats = {
                totalOperations: logs.length,
                successfulOperations: logs.filter(log => log.status === 'success').length,
                failedOperations: logs.filter(log => log.status === 'error').length,
                operationsByType: {},
                lastActivity: logs.length > 0 ? logs[logs.length - 1].timestamp : null
            };

            // 按操作类型统计
            logs.forEach(log => {
                if (!stats.operationsByType[log.operation]) {
                    stats.operationsByType[log.operation] = 0;
                }
                stats.operationsByType[log.operation]++;
            });

            return stats;
        } catch (error) {
            console.error('[SecurityUtils] 获取支付安全统计失败:', error);
            return {
                totalOperations: 0,
                successfulOperations: 0,
                failedOperations: 0,
                operationsByType: {},
                lastActivity: null
            };
        }
    }
}

// 创建全局实例
window.securityUtils = new SecurityUtils();