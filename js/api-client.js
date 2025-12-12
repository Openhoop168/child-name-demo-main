/**
 * Nano Banana Pro API 客户端
 * 负责与Nano Banana Pro API的交互
 */

class NanoBananaClient {
    constructor() {
        // 从全局配置加载API配置
        this.config = this.loadConfig();
        this.apiEndpoint = this.config.apiEndpoint;
        this.apiKey = null;
        this.taskCallbacks = new Map(); // 存储任务回调
        this.pollingIntervals = new Map(); // 存储轮询定时器
        this.currentPollingTimer = null; // 当前轮询定时器
        this.initialized = false;
    }

    /**
     * 加载配置
     */
    loadConfig() {
        try {
            // 检查全局配置是否已加载
            if (typeof window !== 'undefined' && window.APP_CONFIG) {
                return window.APP_CONFIG.nanoBanana || {
                    apiEndpoint: 'https://api.kie.ai/api/v1/jobs/',
                    apiKey: null,
                    defaultParams: {
                        resolution: '4K',
                        aspectRatio: '3:4',
                        outputFormat: 'png'
                    }
                };
            }

            // 如果没有全局配置，使用默认配置
            return {
                apiEndpoint: 'https://api.kie.ai/api/v1/jobs/',
                apiKey: null,
                defaultParams: {
                    resolution: '4K',
                    aspectRatio: '3:4',
                    outputFormat: 'png'
                }
            };
        } catch (error) {
            console.error('加载API配置失败:', error);
            return {
                apiEndpoint: 'https://api.kie.ai/api/v1/jobs/',
                apiKey: null,
                defaultParams: {
                    resolution: '4K',
                    aspectRatio: '3:4',
                    outputFormat: 'png'
                }
            };
        }
    }

    /**
     * 初始化API客户端
     */
    async initialize() {
        if (this.initialized) return;

        // 重新加载配置（可能在初始化时配置已更新）
        this.config = this.loadConfig();
        this.apiEndpoint = this.config.apiEndpoint;

        // 尝试从配置或本地存储加载API密钥
        this.apiKey = this.config.apiKey || await this.loadApiKey();

        this.initialized = true;
        console.log('Nano Banana API客户端初始化完成');
    }

    /**
     * 设置API配置
     */
    setConfig(config) {
        if (config.endpoint) {
            this.apiEndpoint = config.endpoint;
        }
        if (config.apiKey) {
            this.apiKey = config.apiKey;
            this.saveApiKey(config.apiKey);
        }
    }

    /**
     * 获取API配置
     */
    getConfig() {
        return {
            endpoint: this.apiEndpoint,
            hasApiKey: !!this.apiKey,
            apiKeyPreview: this.apiKey ? `${this.apiKey.substring(0, 8)}...` : null
        };
    }

    /**
     * 创建生成任务
     * @param {Object} promptData - 提示词数据
     * @param {Object} options - 生成选项
     * @returns {Promise<Object>} 任务创建结果
     */
    async createTask(promptData, options = {}) {
        try {
            if (!this.apiKey) {
                throw new Error('未设置API密钥，请先配置');
            }

            // 构造API请求参数
            const apiParams = this.buildAPIParams(promptData, options);

            const response = await fetch(`${this.apiEndpoint}createTask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(apiParams)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API请求失败 (${response.status}): ${errorData.msg || response.statusText}`);
            }

            const result = await response.json();

            if (result.code !== 200) {
                throw new Error(`API返回错误: ${result.msg}`);
            }

            return {
                success: true,
                taskId: result.data.taskId,
                message: '任务创建成功'
            };

        } catch (error) {
            console.error('创建任务失败:', error);
            return {
                success: false,
                error: error.message,
                message: '任务创建失败'
            };
        }
    }

    /**
     * 查询任务状态
     * @param {string} taskId - 任务ID
     * @returns {Promise<Object>} 任务状态
     */
    async queryTaskStatus(taskId) {
        try {
            if (!taskId) {
                throw new Error('任务ID不能为空');
            }

            const url = `${this.apiEndpoint}recordInfo?taskId=${encodeURIComponent(taskId)}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`查询任务状态失败 (${response.status}): ${errorData.msg || response.statusText}`);
            }

            const result = await response.json();

            if (result.code !== 200) {
                throw new Error(`API返回错误: ${result.msg}`);
            }

            return {
                success: true,
                data: result.data
            };

        } catch (error) {
            console.error('查询任务状态失败:', error);
            return {
                success: false,
                error: error.message,
                taskId
            };
        }
    }

    /**
     * 轮询任务状态直到完成
     * @param {string} taskId - 任务ID
     * @param {Function} onProgress - 进度回调
     * @param {number} interval - 轮询间隔（毫秒）
     * @returns {Promise<Object>} 最终结果
     */
    async pollTaskUntilComplete(taskId, onProgress = null, interval = 3000, abortSignal = null) {
        return new Promise((resolve, reject) => {
            let pollCount = 0;
            const maxPolls = 60; // 最大轮询次数
            this.currentPollingTimer = null;

            const poll = async () => {
                // 检查是否收到中断信号
                if (abortSignal && abortSignal.aborted) {
                    reject(new Error('生成已停止'));
                    return;
                }

                try {
                    pollCount++;

                    const result = await this.queryTaskStatus(taskId);

                    if (!result.success) {
                        reject(new Error(result.error));
                        return;
                    }

                    const taskData = result.data;

                    // 调用进度回调
                    if (onProgress) {
                        try {
                            onProgress({
                                taskId,
                                state: taskData.state,
                                pollCount,
                                maxPolls,
                                data: taskData
                            });
                        } catch (progressError) {
                            // 如果进度回调抛出错误，说明需要中断
                            reject(progressError);
                            return;
                        }
                    }

                    // 再次检查中断信号（在进度回调后）
                    if (abortSignal && abortSignal.aborted) {
                        reject(new Error('生成已停止'));
                        return;
                    }

                    // 检查任务状态
                    if (taskData.state === 'success') {
                        // 任务完成
                        const resultData = this.parseTaskResult(taskData.resultJson);
                        resolve({
                            success: true,
                            taskId,
                            data: resultData,
                            taskData
                        });
                    } else if (taskData.state === 'fail') {
                        // 任务失败
                        reject(new Error(`任务失败: ${taskData.failMsg || '未知错误'}`));
                    } else if (taskData.state === 'waiting' || taskData.state === 'processing') {
                        // 继续等待或处理
                        if (pollCount >= maxPolls) {
                            reject(new Error('任务超时'));
                            return;
                        }
                        this.currentPollingTimer = setTimeout(poll, interval);
                    } else {
                        // 未知状态
                        reject(new Error(`未知任务状态: ${taskData.state}`));
                    }

                } catch (error) {
                    reject(error);
                }
            };

            poll();
        });
    }

    /**
     * 停止当前轮询
     */
    stopCurrentPolling() {
        if (this.currentPollingTimer) {
            clearTimeout(this.currentPollingTimer);
            this.currentPollingTimer = null;
        }
    }

    /**
     * 解析任务结果
     * @param {string} resultJson - JSON格式的结果字符串
     * @returns {Object} 解析后的结果
     */
    parseTaskResult(resultJson) {
        try {
            if (!resultJson) {
                throw new Error('结果数据为空');
            }

            const result = JSON.parse(resultJson);

            if (!result.resultUrls || !Array.isArray(result.resultUrls) || result.resultUrls.length === 0) {
                throw new Error('未找到有效的图片URL');
            }

            return {
                success: true,
                urls: result.resultUrls,
                primaryUrl: result.resultUrls[0],
                count: result.resultUrls.length
            };

        } catch (error) {
            console.error('解析任务结果失败:', error);
            return {
                success: false,
                error: error.message,
                urls: []
            };
        }
    }

    /**
     * 构建API请求参数
     */
    buildAPIParams(promptData, options = {}) {
        // 从配置中获取默认参数
        const configDefaults = this.config.defaultParams || {};
        const defaults = {
            model: 'nano-banana-pro',
            aspect_ratio: configDefaults.aspectRatio || '3:4',  // 竖版A4比例
            resolution: configDefaults.resolution || '4K',     // 高质量
            output_format: configDefaults.outputFormat || 'png', // PNG格式
            image_input: []
        };

        // 合并用户选项
        const mergedOptions = { ...defaults, ...options };

        // 验证参数
        if (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.validation) {
            const validation = window.APP_CONFIG.validation;

            // 验证分辨率
            if (!validation.resolution.allowed.includes(mergedOptions.resolution)) {
                console.warn(`不支持的分辨率: ${mergedOptions.resolution}，使用默认值: ${validation.resolution.default}`);
                mergedOptions.resolution = validation.resolution.default;
            }

            // 验证宽高比
            if (!validation.aspectRatio.allowed.includes(mergedOptions.aspect_ratio)) {
                console.warn(`不支持的宽高比: ${mergedOptions.aspect_ratio}，使用默认值: ${validation.aspectRatio.default}`);
                mergedOptions.aspect_ratio = validation.aspectRatio.default;
            }

            // 验证输出格式
            if (!validation.outputFormat.allowed.includes(mergedOptions.output_format)) {
                console.warn(`不支持的输出格式: ${mergedOptions.output_format}，使用默认值: ${validation.outputFormat.default}`);
                mergedOptions.output_format = validation.outputFormat.default;
            }
        }

        return {
            model: mergedOptions.model,
            input: {
                prompt: promptData.prompt,
                image_input: mergedOptions.image_input,
                aspect_ratio: mergedOptions.aspect_ratio,
                resolution: mergedOptions.resolution,
                output_format: mergedOptions.output_format
            },
            callBackUrl: options.callBackUrl || null
        };
    }

    /**
     * 下载图片
     * @param {string} url - 图片URL
     * @param {string} filename - 文件名
     * @returns {Promise<Blob>} 图片数据
     */
    async downloadImage(url, filename) {
        try {
            // 方案1: 尝试使用新窗口下载（避免跨域问题）
            try {
                const link = document.createElement('a');
                link.href = url;
                link.download = filename || 'generated-image.png';
                link.target = '_blank';
                link.rel = 'noopener noreferrer';

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                console.log('图片下载已开始，请查看下载文件夹');
                return true;
            } catch (windowError) {
                console.warn('新窗口下载失败，尝试其他方法:', windowError.message);
            }

            // 方案2: 使用fetch + blob（可能遇到跨域问题）
            const response = await fetch(url, {
                mode: 'cors',
                credentials: 'omit'
            });

            if (!response.ok) {
                throw new Error(`下载失败 (${response.status}): ${response.statusText}`);
            }

            const blob = await response.blob();

            // 创建下载链接
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename || 'generated-image.png';

            // 触发下载
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // 清理临时URL
            URL.revokeObjectURL(downloadUrl);

            return blob;

        } catch (error) {
            console.error('下载图片失败:', error);

            // 方案3: 复制图片URL到剪贴板
            try {
                await navigator.clipboard.writeText(url);
                return {
                    success: false,
                    error: 'download_failed',
                    fallback: '图片URL已复制到剪贴板，请手动下载'
                };
            } catch (clipboardError) {
                console.warn('复制到剪贴板也失败:', clipboardError.message);
                throw error;
            }
        }
    }

    /**
     * 保存API密钥到本地存储
     */
    async saveApiKey(apiKey) {
        try {
            if (window.securityUtils) {
                // 使用安全工具加密保存
                await window.securityUtils.saveSecureData('nano_banana_api_key', apiKey);
            } else {
                // 直接保存（不安全，仅用于开发）
                localStorage.setItem('nano_banana_api_key', apiKey);
            }
        } catch (error) {
            console.error('保存API密钥失败:', error);
            throw error;
        }
    }

    /**
     * 从本地存储加载API密钥
     */
    async loadApiKey() {
        try {
            if (window.securityUtils) {
                // 使用安全工具解密加载
                return await window.securityUtils.loadSecureData('nano_banana_api_key');
            } else {
                // 直接加载（不安全，仅用于开发）
                return localStorage.getItem('nano_banana_api_key');
            }
        } catch (error) {
            console.error('加载API密钥失败:', error);
            return null;
        }
    }

    /**
     * 清除API密钥
     */
    async clearApiKey() {
        try {
            if (window.securityUtils) {
                await window.securityUtils.removeSecureData('nano_banana_api_key');
            } else {
                localStorage.removeItem('nano_banana_api_key');
            }
            this.apiKey = null;
        } catch (error) {
            console.error('清除API密钥失败:', error);
            throw error;
        }
    }

    /**
     * 验证API密钥格式
     */
    validateApiKey(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            return false;
        }

        // 基本长度检查（根据实际情况调整）
        return apiKey.length >= 20;
    }

    /**
     * 测试API连接
     */
    async testConnection() {
        try {
            if (!this.apiKey) {
                throw new Error('未设置API密钥');
            }

            // 创建一个简单的测试任务
            const testPrompt = {
                prompt: 'A simple test image of a red apple on a white background',
                vocabulary: { all: [] },
                metadata: { theme: 'test', title: 'test' }
            };

            const result = await this.createTask(testPrompt, {
                resolution: '1K', // 使用较低分辨率进行测试
                aspect_ratio: '1:1'
            });

            if (result.success) {
                // 查询一次状态以验证连接
                const status = await this.queryTaskStatus(result.taskId);
                return {
                    success: true,
                    message: 'API连接正常',
                    taskId: result.taskId
                };
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'API连接失败'
            };
        }
    }

    /**
     * 获取API使用统计
     */
    getUsageStats() {
        // 这里可以实现使用统计功能
        // 例如：调用次数、成功率、平均生成时间等
        return {
            totalCalls: parseInt(localStorage.getItem('nano_banana_total_calls') || '0'),
            successfulCalls: parseInt(localStorage.getItem('nano_banana_success_calls') || '0'),
            lastUsed: localStorage.getItem('nano_banana_last_used')
        };
    }

    /**
     * 更新使用统计
     */
    updateUsageStats(success) {
        const stats = this.getUsageStats();
        stats.totalCalls += 1;

        if (success) {
            stats.successfulCalls += 1;
        }

        stats.lastUsed = new Date().toISOString();

        localStorage.setItem('nano_banana_total_calls', stats.totalCalls.toString());
        localStorage.setItem('nano_banana_success_calls', stats.successfulCalls.toString());
        localStorage.setItem('nano_banana_last_used', stats.lastUsed);
    }

    /**
     * 清理资源
     */
    cleanup() {
        // 清除所有轮询定时器
        for (const [taskId, intervalId] of this.pollingIntervals) {
            clearInterval(intervalId);
        }
        this.pollingIntervals.clear();

        // 清除回调
        this.taskCallbacks.clear();
    }
}

// 创建全局实例
window.nanoBananaClient = new NanoBananaClient();