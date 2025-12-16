/**
 * 使用量追踪器
 * 负责追踪用户的生成次数，实现日/月使用量限制
 */

class UsageTracker {
    constructor() {
        // 配置参数
        this.config = window.getConfig ? window.getConfig('usage') : {
            dailyLimit: 100,
            monthlyLimit: 3000,
            enableUsageTracking: true,
            resetTime: "00:00:00",
            warningThreshold: 0.8
        };

        // 下载控制配置
        const downloadConfig = window.getConfig ? window.getConfig('download') : null;
        this.downloadConfig = downloadConfig ?? {
            dailyLimit: 50,
            monthlyLimit: 1000,
            enableDownloadTracking: true,
            resetTime: "00:00:00",
            warningThreshold: 0.8
        };

        // localStorage 键名
        this.storageKey = 'usage_tracker_data';

        // 初始化使用量数据
        this.usageData = this.loadUsage() || this.getDefaultUsageData();

        // 检查是否需要重置
        this.checkAndResetUsage();

        // 初始化状态
        this.initialized = true;

        // 支付管理器引用（延迟初始化）
        this.paymentManager = null;

        console.log('[UsageTracker] 使用量追踪器初始化完成');
    }

    /**
     * 获取默认使用量数据结构
     */
    getDefaultUsageData() {
        const now = new Date();
        return {
            daily: {
                count: 0,
                date: this.formatDate(now),
                lastReset: now.toISOString()
            },
            monthly: {
                count: 0,
                yearMonth: this.formatYearMonth(now),
                lastReset: now.toISOString()
            },
            download: {
                daily: {
                    count: 0,
                    date: this.formatDate(now),
                    lastReset: now.toISOString()
                },
                monthly: {
                    count: 0,
                    yearMonth: this.formatYearMonth(now),
                    lastReset: now.toISOString()
                },
                history: [] // 最近30天的下载记录
            },
            history: [], // 最近30天的使用记录
            lastUpdated: now.toISOString()
        };
    }

    /**
     * 从 localStorage 加载使用量数据
     */
    loadUsage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            let data = null;

            if (stored) {
                data = JSON.parse(stored);
            }

            // 确保download字段存在（无论是新数据还是旧数据）
            if (data && !data.download) {
                const now = new Date();
                data.download = {
                    daily: {
                        count: 0,
                        date: this.formatDate(now),
                        lastReset: now.toISOString()
                    },
                    monthly: {
                        count: 0,
                        yearMonth: this.formatYearMonth(now),
                        lastReset: now.toISOString()
                    },
                    history: []
                };
            }

            return data;
        } catch (error) {
            console.error('[UsageTracker] 加载使用量数据失败:', error);
            return null;
        }
    }

    /**
     * 保存使用量数据到 localStorage
     */
    saveUsage() {
        try {
            this.usageData.lastUpdated = new Date().toISOString();
            localStorage.setItem(this.storageKey, JSON.stringify(this.usageData));

            // 同步更新到 storage manager 的 usage_stats
            if (window.storageManager && typeof window.storageManager.getUsageStats === 'function') {
                try {
                    const stats = window.storageManager.getUsageStats();
                    stats.dailyUsage = this.usageData.daily.count;
                    stats.monthlyUsage = this.usageData.monthly.count;
                    stats.usageTrackingDate = this.usageData.daily.date;
                    window.storageManager.saveUsageStats(stats);
                } catch (error) {
                    console.warn('[UsageTracker] 同步到 storageManager 失败:', error.message);
                    // 不影响主要的保存功能
                }
            }

            return true;
        } catch (error) {
            console.error('[UsageTracker] 保存使用量数据失败:', error);
            return false;
        }
    }

    /**
     * 检查并重置使用量（如果需要）
     */
    checkAndResetUsage() {
        const now = new Date();
        const currentDate = this.formatDate(now);
        const currentYearMonth = this.formatYearMonth(now);

        // 检查日重置
        if (this.usageData.daily.date !== currentDate) {
            this.resetDailyUsage(now);
        }

        // 检查月重置
        if (this.usageData.monthly.yearMonth !== currentYearMonth) {
            this.resetMonthlyUsage(now);
        }

        // 检查下载日重置（确保 download 数据存在）
        if (this.usageData.download && this.usageData.download.daily.date !== currentDate) {
            this.resetDownloadDailyUsage(now);
        }

        // 检查下载月重置（确保 download 数据存在）
        if (this.usageData.download && this.usageData.download.monthly.yearMonth !== currentYearMonth) {
            this.resetDownloadMonthlyUsage(now);
        }
    }

    /**
     * 重置每日使用量
     */
    resetDailyUsage(now = new Date()) {
        const oldCount = this.usageData.daily.count;

        // 保存到历史记录
        if (oldCount > 0) {
            this.usageData.history.unshift({
                date: this.usageData.daily.date,
                count: oldCount,
                timestamp: this.usageData.daily.lastReset
            });

            // 只保留最近30天的记录
            if (this.usageData.history.length > 30) {
                this.usageData.history = this.usageData.history.slice(0, 30);
            }
        }

        // 重置日统计
        this.usageData.daily = {
            count: 0,
            date: this.formatDate(now),
            lastReset: now.toISOString()
        };

        console.log(`[UsageTracker] 每日使用量已重置 (昨日: ${oldCount})`);
    }

    /**
     * 重置每月使用量
     */
    resetMonthlyUsage(now = new Date()) {
        const oldCount = this.usageData.monthly.count;

        // 重置月统计
        this.usageData.monthly = {
            count: 0,
            yearMonth: this.formatYearMonth(now),
            lastReset: now.toISOString()
        };

        console.log(`[UsageTracker] 每月使用量已重置 (上月: ${oldCount})`);
    }

    /**
     * 追踪生成操作
     * @param {Object} options - 生成选项
     * @returns {boolean} 是否允许生成
     */
    trackGeneration(options = {}) {
        if (!this.config.enableUsageTracking) {
            return true; // 如果未启用追踪，总是允许
        }

        // 检查每日限制
        if (!this.checkDailyLimit()) {
            this.showDailyLimitReached();
            return false;
        }

        // 检查是否接近限制
        if (this.isNearLimit()) {
            this.showNearLimitWarning();
        }

        // 增加使用量
        this.usageData.daily.count++;
        this.usageData.monthly.count++;

        // 保存数据
        this.saveUsage();

        // 更新显示
        this.updateUsageDisplay();

        console.log(`[UsageTracker] 生成已追踪，今日: ${this.usageData.daily.count}/${this.config.dailyLimit}`);
        return true;
    }

    /**
     * 检查每日限制
     * @returns {boolean} 是否未达到限制
     */
    checkDailyLimit() {
        return this.usageData.daily.count < this.config.dailyLimit;
    }

    /**
     * 检查是否接近限制
     * @returns {boolean} 是否接近限制
     */
    isNearLimit() {
        const usageRatio = this.usageData.daily.count / this.config.dailyLimit;
        return usageRatio >= this.config.warningThreshold;
    }

    /**
     * 获取当前使用量
     * @returns {Object} 使用量信息
     */
    getUsage() {
        return {
            daily: {
                count: this.usageData.daily.count,
                limit: this.config.dailyLimit,
                remaining: Math.max(0, this.config.dailyLimit - this.usageData.daily.count),
                percentage: Math.min(100, (this.usageData.daily.count / this.config.dailyLimit) * 100)
            },
            monthly: {
                count: this.usageData.monthly.count,
                limit: this.config.monthlyLimit,
                remaining: Math.max(0, this.config.monthlyLimit - this.usageData.monthly.count),
                percentage: Math.min(100, (this.usageData.monthly.count / this.config.monthlyLimit) * 100)
            },
            history: this.usageData.history,
            isTrackingEnabled: this.config.enableUsageTracking
        };
    }

    /**
     * 显示接近限制警告
     */
    showNearLimitWarning() {
        const remaining = this.config.dailyLimit - this.usageData.daily.count;
        const message = `今日剩余生成次数仅剩 ${remaining} 次，请合理使用。`;

        // 使用全局应用的通知系统
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, 'warning');
        } else {
            // 降级处理
            console.warn(`[UsageTracker] ${message}`);
            this.showTemporaryNotification(message, 'warning');
        }
    }

    /**
     * 显示达到限制提示
     */
    showDailyLimitReached() {
        const message = window.getConfig ?
            window.getConfig('messages.errors.dailyLimitExceeded', '今日使用次数已达上限，请明天再试') :
            '今日使用次数已达上限，请明天再试';

        // 使用全局应用的通知系统
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, 'error');
        } else {
            // 降级处理
            console.error(`[UsageTracker] ${message}`);
            this.showTemporaryNotification(message, 'error');
        }
    }

    /**
     * 更新页面上的使用量显示
     */
    updateUsageDisplay() {
        const usage = this.getUsage();
        const downloadUsage = this.getDownloadUsage();

        // 检查是否有document对象（浏览器环境）
        if (typeof document === 'undefined' || !document.getElementById) {
            // 非浏览器环境，只触发事件
            this.triggerUsageUpdatedEvent({ usage, downloadUsage });
            return;
        }

        // 查找使用量显示元素
        const usageElement = document.getElementById('usage-display');
        if (usageElement) {
            // 计算进度条样式类
            let generationProgressClass = 'normal';
            if (usage.daily.percentage >= 100) {
                generationProgressClass = 'error';
            } else if (usage.daily.percentage >= this.config.warningThreshold * 100) {
                generationProgressClass = 'warning';
            }

            let downloadProgressClass = 'normal';
            if (downloadUsage.daily.percentage >= 100) {
                downloadProgressClass = 'error';
            } else if (downloadUsage.daily.percentage >= this.downloadConfig.warningThreshold * 100) {
                downloadProgressClass = 'warning';
            }

            usageElement.innerHTML = `
                <div class="usage-info">
                    <div class="usage-section">
                        <span class="usage-daily">生成: ${usage.daily.count}/${usage.daily.limit}</span>
                        <span class="usage-monthly">本月: ${usage.monthly.count}/${usage.monthly.limit}</span>
                    </div>
                    <div class="usage-section">
                        <span class="download-daily">下载: ${downloadUsage.daily.count}/${downloadUsage.daily.limit}</span>
                        <span class="download-monthly">本月: ${downloadUsage.monthly.count}/${downloadUsage.monthly.limit}</span>
                    </div>
                </div>
                <div class="usage-progress-container">
                    <div class="usage-progress-bar generation ${generationProgressClass}" style="width: ${usage.daily.percentage}%" title="生成进度: ${usage.daily.count}/${usage.daily.limit}"></div>
                    <div class="usage-progress-bar download ${downloadProgressClass}" style="width: ${downloadUsage.daily.percentage}%" title="下载进度: ${downloadUsage.daily.count}/${downloadUsage.daily.limit}"></div>
                </div>
            `;

            // 添加生成警告样式
            if (usage.daily.percentage >= 100) {
                usageElement.classList.add('usage-limit-reached');
            } else if (usage.daily.percentage >= this.config.warningThreshold * 100) {
                usageElement.classList.add('usage-near-limit');
            } else {
                usageElement.classList.remove('usage-near-limit', 'usage-limit-reached');
            }

            // 添加下载警告样式
            if (downloadUsage.daily.percentage >= 100) {
                usageElement.classList.add('download-limit-reached');
            } else if (downloadUsage.daily.percentage >= this.downloadConfig.warningThreshold * 100) {
                usageElement.classList.add('download-near-limit');
            } else {
                usageElement.classList.remove('download-near-limit', 'download-limit-reached');
            }
        }

        // 触发自定义事件
        this.triggerUsageUpdatedEvent({ usage, downloadUsage });
    }

    /**
     * 触发使用量更新事件
     */
    triggerUsageUpdatedEvent(usage) {
        try {
            // 检查是否有CustomEvent
            if (typeof CustomEvent !== 'undefined' && typeof window !== 'undefined') {
                const event = new CustomEvent('usageUpdated', { detail: usage });
                window.dispatchEvent(event);
            }
        } catch (error) {
            // 忽略事件触发错误
            console.debug('[UsageTracker] 事件触发失败:', error.message);
        }
    }

    /**
     * 临时通知显示（降级方案）
     */
    showTemporaryNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} notification-temporary`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-size: 14px;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            ${type === 'error' ? 'background-color: #f44336;' : ''}
            ${type === 'warning' ? 'background-color: #ff9800;' : ''}
            ${type === 'info' ? 'background-color: #2196f3;' : ''}
        `;

        document.body.appendChild(notification);

        // 显示动画
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // 自动隐藏
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * 格式化日期为 YYYY-MM-DD
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * 格式化年月为 YYYY-MM
     */
    formatYearMonth(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }

    /**
     * 手动重置所有使用量数据
     */
    resetAllUsage() {
        this.usageData = this.getDefaultUsageData();
        this.saveUsage();
        this.updateUsageDisplay();
        console.log('[UsageTracker] 所有使用量数据已重置');
    }

    /**
     * 获取使用量统计摘要
     */
    getUsageSummary() {
        const usage = this.getUsage();
        const now = new Date();

        return {
            ...usage,
            resetTime: this.config.resetTime,
            today: this.formatDate(now),
            currentMonth: this.formatYearMonth(now),
            nextResetDate: this.getNextResetDate(),
            isNearLimit: this.isNearLimit(),
            isLimitReached: !this.checkDailyLimit()
        };
    }

    /**
     * 获取下次重置时间
     */
    getNextResetDate() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 设置重置时间
        const [hours, minutes, seconds] = this.config.resetTime.split(':');
        tomorrow.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds), 0);

        return tomorrow.toISOString();
    }

    // ================================
    // 下载追踪功能
    // ================================

    /**
     * 构建下载使用量对象
     * @param {Object} config - 下载配置
     * @returns {Object} 下载使用量信息
     */
    buildDownloadUsageObject(config) {
        // 确保 download 数据存在
        if (!this.usageData.download) {
            return {
                daily: {
                    count: 0,
                    limit: config.dailyLimit,
                    remaining: config.dailyLimit,
                    percentage: 0
                },
                monthly: {
                    count: 0,
                    limit: config.monthlyLimit,
                    remaining: config.monthlyLimit,
                    percentage: 0
                },
                history: [],
                isTrackingEnabled: config.enableDownloadTracking,
                isNearLimit: false,
                isLimitReached: false
            };
        }

        return {
            daily: {
                count: this.usageData.download.daily.count,
                limit: config.dailyLimit,
                remaining: Math.max(0, config.dailyLimit - this.usageData.download.daily.count),
                percentage: Math.min(100, (this.usageData.download.daily.count / config.dailyLimit) * 100)
            },
            monthly: {
                count: this.usageData.download.monthly.count,
                limit: config.monthlyLimit,
                remaining: Math.max(0, config.monthlyLimit - this.usageData.download.monthly.count),
                percentage: Math.min(100, (this.usageData.download.monthly.count / config.monthlyLimit) * 100)
            },
            history: this.usageData.download.history || [],
            isTrackingEnabled: config.enableDownloadTracking,
            isNearLimit: this.isNearDownloadLimit(),
            isLimitReached: !this.checkDownloadLimit()
        };
    }

    /**
     * 追踪下载操作
     * @param {Object} options - 下载选项
     * @returns {boolean} 是否允许下载
     */
    trackDownload(options = {}) {
        if (!this.downloadConfig.enableDownloadTracking) {
            return true; // 如果未启用下载追踪，总是允许
        }

        // 确保 download 数据存在
        if (!this.usageData.download) {
            console.warn('[UsageTracker] Download data not initialized, initializing now');
            const now = new Date();
            this.usageData.download = {
                daily: {
                    count: 0,
                    date: this.formatDate(now),
                    lastReset: now.toISOString()
                },
                monthly: {
                    count: 0,
                    yearMonth: this.formatYearMonth(now),
                    lastReset: now.toISOString()
                },
                history: []
            };
        }

        // 检查每日限制
        if (!this.checkDownloadLimit()) {
            this.showDownloadLimitReached();
            return false;
        }

        // 检查是否接近限制
        if (this.isNearDownloadLimit()) {
            this.showNearDownloadLimitWarning();
        }

        // 增加下载量
        this.usageData.download.daily.count++;
        this.usageData.download.monthly.count++;

        // 保存数据
        this.saveUsage();

        // 更新显示
        this.updateUsageDisplay();

        console.log(`[UsageTracker] 下载已追踪，今日: ${this.usageData.download.daily.count}/${this.downloadConfig.dailyLimit}`);
        return true;
    }

    /**
     * 检查下载限制
     * @returns {boolean} 是否未达到限制
     */
    checkDownloadLimit() {
        // 确保 download 数据存在
        if (!this.usageData.download) {
            return true; // 没有数据时允许下载
        }

        // 检查每日限制
        if (this.usageData.download.daily.count >= this.downloadConfig.dailyLimit) {
            return false;
        }

        // 检查每月限制
        if (this.usageData.download.monthly.count >= this.downloadConfig.monthlyLimit) {
            return false;
        }

        return true;
    }

    /**
     * 检查是否接近下载限制
     * @returns {boolean} 是否接近限制
     */
    isNearDownloadLimit() {
        // 确保 download 数据存在
        if (!this.usageData.download) {
            return false;
        }

        const dailyUsageRatio = this.usageData.download.daily.count / this.downloadConfig.dailyLimit;
        const monthlyUsageRatio = this.usageData.download.monthly.count / this.downloadConfig.monthlyLimit;

        return dailyUsageRatio >= this.downloadConfig.warningThreshold ||
               monthlyUsageRatio >= this.downloadConfig.warningThreshold;
    }

    /**
     * 显示接近下载限制警告
     */
    showNearDownloadLimitWarning() {
        // 确保 download 数据存在
        if (!this.usageData.download) {
            return;
        }

        const dailyRemaining = this.downloadConfig.dailyLimit - this.usageData.download.daily.count;
        const monthlyRemaining = this.downloadConfig.monthlyLimit - this.usageData.download.monthly.count;

        let message = `下载次数即将达到上限，`;
        if (dailyRemaining <= 5) {
            message += `今日剩余仅 ${dailyRemaining} 次。`;
        } else if (monthlyRemaining <= 50) {
            message += `本月剩余仅 ${monthlyRemaining} 次。`;
        } else {
            message += `请合理使用下载功能。`;
        }

        // 使用全局应用的通知系统
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, 'warning');
        } else {
            // 降级处理
            console.warn(`[UsageTracker] ${message}`);
            this.showTemporaryNotification(message, 'warning');
        }
    }

    /**
     * 显示达到下载限制提示
     */
    showDownloadLimitReached() {
        // 确保 download 数据存在
        if (!this.usageData.download) {
            this.showDownloadWarningNotification('下载次数已达上限，请明天再试。');
            return;
        }

        const isDailyLimit = this.usageData.download.daily.count >= this.downloadConfig.dailyLimit;
        const isMonthlyLimit = this.usageData.download.monthly.count >= this.downloadConfig.monthlyLimit;
        const downloadUsage = this.getDownloadUsage();

        // 尝试显示模态框，如果失败则显示简单通知
        try {
            this.showDownloadLimitModal(downloadUsage, isDailyLimit, isMonthlyLimit);
        } catch (error) {
            console.warn('[UsageTracker] 无法显示下载限制模态框:', error.message);

            let message;
            if (isDailyLimit && isMonthlyLimit) {
                message = `今日和本月的下载次数均已达到上限，请明天或下月再试。`;
            } else if (isDailyLimit) {
                message = `今日下载次数已达上限（${this.downloadConfig.dailyLimit}次），请明天再试。`;
            } else {
                message = `本月下载次数已达上限（${this.downloadConfig.monthlyLimit}次），请下月再试。`;
            }

            this.showDownloadWarningNotification(message);
        }
    }

    /**
     * 显示下载限制模态框
     */
    showDownloadLimitModal(downloadUsage, isDailyLimit, isMonthlyLimit) {
        // 检查是否已存在模态框
        let existingModal = document.querySelector('.download-limit-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'modal download-limit-modal fade show';
        modal.style.display = 'block';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'downloadLimitModalTitle');
        modal.setAttribute('aria-hidden', 'false');

        const dailyStatus = isDailyLimit ? 'exceeded' : 'normal';
        const monthlyStatus = isMonthlyLimit ? 'exceeded' : 'normal';
        const dailyProgress = Math.min(downloadUsage.daily.percentage, 100);
        const monthlyProgress = Math.min(downloadUsage.monthly.percentage, 100);

        const modalHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="downloadLimitModalTitle">
                            <i class="fas fa-download download-limit-icon"></i>
                            下载次数已满
                        </h5>
                    </div>
                    <div class="modal-body">
                        <div class="download-limit-info">
                            <div class="download-limit-row">
                                <span class="label">今日下载：</span>
                                <span class="value ${dailyStatus}">${downloadUsage.daily.count}/${downloadUsage.daily.limit}</span>
                            </div>
                            <div class="download-limit-progress">
                                <div class="download-limit-progress-bar">
                                    <div class="download-limit-progress-fill" style="width: ${dailyProgress}%"></div>
                                </div>
                            </div>
                            <div class="download-limit-row">
                                <span class="label">本月下载：</span>
                                <span class="value ${monthlyStatus}">${downloadUsage.monthly.count}/${downloadUsage.monthly.limit}</span>
                            </div>
                            <div class="download-limit-progress">
                                <div class="download-limit-progress-bar">
                                    <div class="download-limit-progress-fill" style="width: ${monthlyProgress}%"></div>
                                </div>
                            </div>
                        </div>
                        <div class="download-limit-message">
                            ${this.getDownloadLimitMessage(isDailyLimit, isMonthlyLimit)}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <div class="download-limit-actions">
                            ${this.getDownloadLimitActions(isDailyLimit, isMonthlyLimit)}
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.innerHTML = modalHTML;
        document.body.appendChild(modal);

        // 添加事件监听器
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeDownloadLimitModal();
            }
        });

        // ESC键关闭
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.closeDownloadLimitModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // 防止body滚动
        document.body.style.overflow = 'hidden';
        modal.style.overflowY = 'auto';

        // 聚焦到模态框
        setTimeout(() => {
            modal.focus();
        }, 100);
    }

    /**
     * 获取下载限制提示消息
     */
    getDownloadLimitMessage(isDailyLimit, isMonthlyLimit) {
        if (isDailyLimit && isMonthlyLimit) {
            return `
                <div style="text-align: center; color: var(--text-secondary); line-height: 1.6;">
                    <p style="margin-bottom: 1rem;"><strong style="color: var(--error-color);">今日和本月下载次数均已达到上限</strong></p>
                    <p style="margin-bottom: 0.5rem;">📅 今日配额：明日凌晨自动重置</p>
                    <p style="margin-bottom: 0;">📅 本月配额：下月1号自动重置</p>
                </div>
            `;
        } else if (isDailyLimit) {
            return `
                <div style="text-align: center; color: var(--text-secondary); line-height: 1.6;">
                    <p style="margin-bottom: 1rem;"><strong style="color: var(--warning-color);">今日下载次数已达上限</strong></p>
                    <p style="margin-bottom: 0.5rem;">📅 每日配额：明日凌晨自动重置</p>
                    <p style="margin-bottom: 0;">🔄 当前下载配额：${this.downloadConfig.dailyLimit}次/天</p>
                </div>
            `;
        } else {
            return `
                <div style="text-align: center; color: var(--text-secondary); line-height: 1.6;">
                    <p style="margin-bottom: 1rem;"><strong style="color: var(--warning-color);">本月下载次数已达上限</strong></p>
                    <p style="margin-bottom: 0.5rem;">📅 月度配额：下月1号自动重置</p>
                    <p style="margin-bottom: 0;">🔄 当前月度配额：${this.downloadConfig.monthlyLimit}次/月</p>
                </div>
            `;
        }
    }

    /**
     * 获取下载限制操作按钮
     */
    getDownloadLimitActions(isDailyLimit, isMonthlyLimit) {
        let actions = `
            <button class="download-limit-btn secondary" onclick="this.closest('.download-limit-modal').remove(); document.body.style.overflow='';">
                <i class="fas fa-times"></i>
                知道了
            </button>
        `;

        if (isDailyLimit && !isMonthlyLimit) {
            actions += `
                <button class="download-limit-btn primary" onclick="window.app && window.app.showUsageModal && window.app.showUsageModal(); this.closest('.download-limit-modal').remove(); document.body.style.overflow='';">
                    <i class="fas fa-chart-bar"></i>
                    查看详情
                </button>
            `;
        }

        return actions;
    }

    /**
     * 关闭下载限制模态框
     */
    closeDownloadLimitModal() {
        const modal = document.querySelector('.download-limit-modal');
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
        }
    }

    /**
     * 显示下载警告通知
     */
    showDownloadWarningNotification(message) {
        // 尝试使用全局应用的通知系统
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, 'warning');
        } else {
            // 使用自定义下载警告通知
            this.showCustomDownloadWarning(message);
        }
    }

    /**
     * 显示自定义下载警告通知
     */
    showCustomDownloadWarning(message) {
        // 移除已存在的下载警告通知
        const existingWarning = document.querySelector('.download-warning-notification');
        if (existingWarning) {
            existingWarning.remove();
        }

        const notification = document.createElement('div');
        notification.className = 'download-warning-notification';
        notification.innerHTML = `
            <div class="download-warning-content">
                <div class="download-warning-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="download-warning-text">
                    <div class="download-warning-title">下载限制提醒</div>
                    <div class="download-warning-message">${message}</div>
                </div>
                <button class="download-warning-close" onclick="this.closest('.download-warning-notification').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // 自动移除通知
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 8000);

        // 点击关闭
        notification.addEventListener('click', (e) => {
            if (e.target === notification || e.target.closest('.download-warning-close')) {
                notification.remove();
            }
        });
    }

    /**
     * 获取当前下载使用量
     * @returns {Object} 下载使用量信息
     */
    getDownloadUsage() {
        // 确保 download 配置存在
        if (!this.downloadConfig) {
            console.warn('[UsageTracker] Download config not initialized, using defaults');
            const config = {
                dailyLimit: 50,
                monthlyLimit: 1000,
                enableDownloadTracking: true,
                warningThreshold: 0.8
            };
            return this.buildDownloadUsageObject(config);
        }

        // 确保 download 数据存在
        if (!this.usageData.download) {
            return this.buildDownloadUsageObject(this.downloadConfig);
        }

        // 使用实际的配置和数据
        return {
            daily: {
                count: this.usageData.download.daily.count,
                limit: this.downloadConfig.dailyLimit,
                remaining: Math.max(0, this.downloadConfig.dailyLimit - this.usageData.download.daily.count),
                percentage: Math.min(100, (this.usageData.download.daily.count / this.downloadConfig.dailyLimit) * 100)
            },
            monthly: {
                count: this.usageData.download.monthly.count,
                limit: this.downloadConfig.monthlyLimit,
                remaining: Math.max(0, this.downloadConfig.monthlyLimit - this.usageData.download.monthly.count),
                percentage: Math.min(100, (this.usageData.download.monthly.count / this.downloadConfig.monthlyLimit) * 100)
            },
            history: this.usageData.download.history || [],
            isTrackingEnabled: this.downloadConfig.enableDownloadTracking,
            isNearLimit: this.isNearDownloadLimit(),
            isLimitReached: !this.checkDownloadLimit()
        };
    }

    /**
     * 重置每日下载使用量
     */
    resetDownloadDailyUsage(now = new Date()) {
        // 确保 download 数据存在
        if (!this.usageData.download) {
            console.warn('[UsageTracker] Download data not initialized, skipping daily reset');
            return;
        }

        const oldCount = this.usageData.download.daily.count;

        // 保存到历史记录
        if (oldCount > 0) {
            this.usageData.download.history.unshift({
                date: this.usageData.download.daily.date,
                count: oldCount,
                timestamp: this.usageData.download.daily.lastReset
            });

            // 只保留最近30天的记录
            if (this.usageData.download.history.length > 30) {
                this.usageData.download.history = this.usageData.download.history.slice(0, 30);
            }
        }

        // 重置日统计
        this.usageData.download.daily = {
            count: 0,
            date: this.formatDate(now),
            lastReset: now.toISOString()
        };

        console.log(`[UsageTracker] 每日下载使用量已重置 (昨日: ${oldCount})`);
    }

    /**
     * 重置每月下载使用量
     */
    resetDownloadMonthlyUsage(now = new Date()) {
        // 确保 download 数据存在
        if (!this.usageData.download) {
            console.warn('[UsageTracker] Download data not initialized, skipping monthly reset');
            return;
        }

        const oldCount = this.usageData.download.monthly.count;

        // 重置月统计
        this.usageData.download.monthly = {
            count: 0,
            yearMonth: this.formatYearMonth(now),
            lastReset: now.toISOString()
        };

        console.log(`[UsageTracker] 每月下载使用量已重置 (上月: ${oldCount})`);
    }

    // ================================
    // 支付集成功能
    // ================================

    /**
     * 初始化支付管理器引用
     */
    initializePaymentManager() {
        if (window.paymentManager && !this.paymentManager) {
            this.paymentManager = window.paymentManager;
            console.log('[UsageTracker] 支付管理器引用已建立');
        }
    }

    /**
     * 获取当前套餐限制
     * @returns {Object} 当前套餐的配额限制
     */
    getCurrentPlanLimits() {
        // 确保支付管理器已初始化
        this.initializePaymentManager();

        if (this.paymentManager && typeof this.paymentManager.getCurrentPlanLimits === 'function') {
            try {
                const planLimits = this.paymentManager.getCurrentPlanLimits();
                if (planLimits) {
                    console.log('[UsageTracker] 使用支付套餐配额:', planLimits);
                    return {
                        dailyLimit: planLimits.dailyGenerations || this.config.dailyLimit,
                        monthlyLimit: planLimits.monthlyGenerations || this.config.monthlyLimit,
                        downloadDailyLimit: planLimits.dailyDownloads || this.downloadConfig.dailyLimit,
                        downloadMonthlyLimit: planLimits.monthlyDownloads || this.downloadConfig.monthlyLimit
                    };
                }
            } catch (error) {
                console.warn('[UsageTracker] 获取支付套餐配额失败:', error.message);
            }
        }

        // 返回默认配额
        return {
            dailyLimit: this.config.dailyLimit,
            monthlyLimit: this.config.monthlyLimit,
            downloadDailyLimit: this.downloadConfig.dailyLimit,
            downloadMonthlyLimit: this.downloadConfig.monthlyLimit
        };
    }

    /**
     * 获取动态日限制
     * @returns {number} 当前生效的日限制
     */
    getDynamicDailyLimit() {
        const limits = this.getCurrentPlanLimits();
        return limits.dailyLimit;
    }

    /**
     * 获取动态月限制
     * @returns {number} 当前生效的月限制
     */
    getDynamicMonthlyLimit() {
        const limits = this.getCurrentPlanLimits();
        return limits.monthlyLimit;
    }

    /**
     * 获取动态下载日限制
     * @returns {number} 当前生效的下载日限制
     */
    getDynamicDownloadDailyLimit() {
        const limits = this.getCurrentPlanLimits();
        return limits.downloadDailyLimit;
    }

    /**
     * 获取动态下载月限制
     * @returns {number} 当前生效的下载月限制
     */
    getDynamicDownloadMonthlyLimit() {
        const limits = this.getCurrentPlanLimits();
        return limits.downloadMonthlyLimit;
    }

    /**
     * 检查动态限制
     * @returns {boolean} 是否未达到限制
     */
    checkDynamicLimits() {
        // 检查生成限制
        if (!this.checkDynamicDailyLimit()) {
            return false;
        }

        // 检查下载限制
        if (!this.checkDynamicDownloadLimit()) {
            return false;
        }

        return true;
    }

    /**
     * 检查动态日限制
     * @returns {boolean} 是否未达到日限制
     */
    checkDynamicDailyLimit() {
        const dailyLimit = this.getDynamicDailyLimit();
        return this.usageData.daily.count < dailyLimit;
    }

    /**
     * 检查动态月限制
     * @returns {boolean} 是否未达到月限制
     */
    checkDynamicMonthlyLimit() {
        const monthlyLimit = this.getDynamicMonthlyLimit();
        return this.usageData.monthly.count < monthlyLimit;
    }

    /**
     * 检查动态下载限制
     * @returns {boolean} 是否未达到下载限制
     */
    checkDynamicDownloadLimit() {
        // 确保 download 数据存在
        if (!this.usageData.download) {
            return true;
        }

        const downloadDailyLimit = this.getDynamicDownloadDailyLimit();
        const downloadMonthlyLimit = this.getDynamicDownloadMonthlyLimit();

        // 检查每日限制
        if (this.usageData.download.daily.count >= downloadDailyLimit) {
            return false;
        }

        // 检查每月限制
        if (this.usageData.download.monthly.count >= downloadMonthlyLimit) {
            return false;
        }

        return true;
    }

    /**
     * 检查是否接近动态限制
     * @returns {boolean} 是否接近限制
     */
    isNearDynamicLimit() {
        const dailyLimit = this.getDynamicDailyLimit();
        const downloadDailyLimit = this.getDynamicDownloadDailyLimit();
        const threshold = this.config.warningThreshold;

        const dailyUsageRatio = this.usageData.daily.count / dailyLimit;
        const downloadDailyUsageRatio = this.usageData.download ?
            this.usageData.download.daily.count / downloadDailyLimit : 0;

        return dailyUsageRatio >= threshold || downloadDailyUsageRatio >= threshold;
    }

    /**
     * 增强版生成追踪（集成支付感知）
     * @param {Object} options - 生成选项
     * @returns {boolean} 是否允许生成
     */
    trackGenerationEnhanced(options = {}) {
        if (!this.config.enableUsageTracking) {
            return true; // 如果未启用追踪，总是允许
        }

        // 初始化支付管理器
        this.initializePaymentManager();

        // 检查订阅状态
        if (this.paymentManager && typeof this.paymentManager.isSubscriptionActive === 'function') {
            if (!this.paymentManager.isSubscriptionActive()) {
                this.showSubscriptionExpiredModal();
                return false;
            }
        }

        // 检查动态限制
        if (!this.checkDynamicLimits()) {
            if (!this.checkDynamicDailyLimit()) {
                this.showDailyLimitReached();
            } else if (!this.checkDynamicDownloadLimit()) {
                this.showDownloadLimitReached();
            }
            return false;
        }

        // 检查是否接近限制
        if (this.isNearDynamicLimit()) {
            this.showNearDynamicLimitWarning();
        }

        // 增加使用量
        this.usageData.daily.count++;
        this.usageData.monthly.count++;

        // 保存数据
        this.saveUsage();

        // 更新显示
        this.updateUsageDisplay();

        const dailyLimit = this.getDynamicDailyLimit();
        console.log(`[UsageTracker] 生成已追踪，今日: ${this.usageData.daily.count}/${dailyLimit}`);
        return true;
    }

    /**
     * 增强版下载追踪（集成支付感知）
     * @param {Object} options - 下载选项
     * @returns {boolean} 是否允许下载
     */
    trackDownloadEnhanced(options = {}) {
        if (!this.downloadConfig.enableDownloadTracking) {
            return true; // 如果未启用下载追踪，总是允许
        }

        // 初始化支付管理器
        this.initializePaymentManager();

        // 检查订阅状态
        if (this.paymentManager && typeof this.paymentManager.isSubscriptionActive === 'function') {
            if (!this.paymentManager.isSubscriptionActive()) {
                this.showSubscriptionExpiredModal();
                return false;
            }
        }

        // 确保 download 数据存在
        if (!this.usageData.download) {
            console.warn('[UsageTracker] Download data not initialized, initializing now');
            const now = new Date();
            this.usageData.download = {
                daily: {
                    count: 0,
                    date: this.formatDate(now),
                    lastReset: now.toISOString()
                },
                monthly: {
                    count: 0,
                    yearMonth: this.formatYearMonth(now),
                    lastReset: now.toISOString()
                },
                history: []
            };
        }

        // 检查动态下载限制
        if (!this.checkDynamicDownloadLimit()) {
            this.showDownloadLimitReached();
            return false;
        }

        // 检查是否接近下载限制
        if (this.isNearDynamicLimit()) {
            this.showNearDynamicLimitWarning();
        }

        // 增加下载量
        this.usageData.download.daily.count++;
        this.usageData.download.monthly.count++;

        // 保存数据
        this.saveUsage();

        // 更新显示
        this.updateUsageDisplay();

        const downloadDailyLimit = this.getDynamicDownloadDailyLimit();
        console.log(`[UsageTracker] 下载已追踪，今日: ${this.usageData.download.daily.count}/${downloadDailyLimit}`);
        return true;
    }

    /**
     * 显示订阅过期模态框
     */
    showSubscriptionExpiredModal() {
        // 初始化支付管理器
        this.initializePaymentManager();

        if (this.paymentManager && typeof this.paymentManager.showPaymentModal === 'function') {
            this.paymentManager.showPaymentModal('expired');
        } else {
            // 降级处理
            const message = '您的订阅已过期，请升级套餐以继续使用';
            this.showTemporaryNotification(message, 'warning');
        }
    }

    /**
     * 显示接近动态限制警告
     */
    showNearDynamicLimitWarning() {
        const dailyLimit = this.getDynamicDailyLimit();
        const downloadDailyLimit = this.getDynamicDownloadDailyLimit();
        const dailyRemaining = dailyLimit - this.usageData.daily.count;
        const downloadDailyRemaining = downloadDailyLimit - (this.usageData.download?.daily.count || 0);

        let message = `使用量即将达到上限，`;
        if (dailyRemaining <= 5) {
            message += `今日剩余生成仅 ${dailyRemaining} 次。`;
        } else if (downloadDailyRemaining <= 5) {
            message += `今日剩余下载仅 ${downloadDailyRemaining} 次。`;
        } else {
            message += `请合理使用功能。`;
        }

        // 使用全局应用的通知系统
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, 'warning');
        } else {
            // 降级处理
            console.warn(`[UsageTracker] ${message}`);
            this.showTemporaryNotification(message, 'warning');
        }
    }

    /**
     * 获取增强版使用量信息
     * @returns {Object} 使用量信息
     */
    getEnhancedUsage() {
        const limits = this.getCurrentPlanLimits();

        return {
            daily: {
                count: this.usageData.daily.count,
                limit: limits.dailyLimit,
                remaining: Math.max(0, limits.dailyLimit - this.usageData.daily.count),
                percentage: Math.min(100, (this.usageData.daily.count / limits.dailyLimit) * 100)
            },
            monthly: {
                count: this.usageData.monthly.count,
                limit: limits.monthlyLimit,
                remaining: Math.max(0, limits.monthlyLimit - this.usageData.monthly.count),
                percentage: Math.min(100, (this.usageData.monthly.count / limits.monthlyLimit) * 100)
            },
            download: this.getDownloadUsage(),
            history: this.usageData.history,
            isTrackingEnabled: this.config.enableUsageTracking,
            currentPlan: this.paymentManager ? this.paymentManager.getCurrentSubscription()?.currentPlan : 'free',
            isNearLimit: this.isNearDynamicLimit(),
            isLimitReached: !this.checkDynamicLimits()
        };
    }

    /**
     * 重写原有的更新显示方法，使用动态配额
     */
    updateUsageDisplayEnhanced() {
        const usage = this.getEnhancedUsage();
        const downloadUsage = this.getDownloadUsage();

        // 检查是否有document对象（浏览器环境）
        if (typeof document === 'undefined' || !document.getElementById) {
            // 非浏览器环境，只触发事件
            this.triggerUsageUpdatedEvent({ usage, downloadUsage });
            return;
        }

        // 查找使用量显示元素
        const usageElement = document.getElementById('usage-display');
        if (usageElement) {
            // 计算进度条样式类
            let generationProgressClass = 'normal';
            if (usage.daily.percentage >= 100) {
                generationProgressClass = 'error';
            } else if (usage.daily.percentage >= this.config.warningThreshold * 100) {
                generationProgressClass = 'warning';
            }

            let downloadProgressClass = 'normal';
            if (downloadUsage.daily.percentage >= 100) {
                downloadProgressClass = 'error';
            } else if (downloadUsage.daily.percentage >= this.downloadConfig.warningThreshold * 100) {
                downloadProgressClass = 'warning';
            }

            // 添加当前套餐信息
            const currentPlanName = this.paymentManager ?
                this.paymentManager.plans[usage.currentPlan]?.name || '免费版' : '免费版';

            usageElement.innerHTML = `
                <div class="usage-info">
                    <div class="usage-section">
                        <span class="current-plan-label">当前套餐: ${currentPlanName}</span>
                        <span class="usage-daily">生成: ${usage.daily.count}/${usage.daily.limit}</span>
                        <span class="usage-monthly">本月: ${usage.monthly.count}/${usage.monthly.limit}</span>
                    </div>
                    <div class="usage-section">
                        <span class="download-daily">下载: ${downloadUsage.daily.count}/${downloadUsage.daily.limit}</span>
                        <span class="download-monthly">本月: ${downloadUsage.monthly.count}/${downloadUsage.monthly.limit}</span>
                    </div>
                </div>
                <div class="usage-progress-container">
                    <div class="usage-progress-bar generation ${generationProgressClass}"
                         style="width: ${usage.daily.percentage}%"
                         title="生成进度: ${usage.daily.count}/${usage.daily.limit}"></div>
                    <div class="usage-progress-bar download ${downloadProgressClass}"
                         style="width: ${downloadUsage.daily.percentage}%"
                         title="下载进度: ${downloadUsage.daily.count}/${downloadUsage.daily.limit}"></div>
                </div>
            `;

            // 添加生成警告样式
            if (usage.daily.percentage >= 100) {
                usageElement.classList.add('usage-limit-reached');
            } else if (usage.daily.percentage >= this.config.warningThreshold * 100) {
                usageElement.classList.add('usage-near-limit');
            } else {
                usageElement.classList.remove('usage-near-limit', 'usage-limit-reached');
            }

            // 添加下载警告样式
            if (downloadUsage.daily.percentage >= 100) {
                usageElement.classList.add('download-limit-reached');
            } else if (downloadUsage.daily.percentage >= this.downloadConfig.warningThreshold * 100) {
                usageElement.classList.add('download-near-limit');
            } else {
                usageElement.classList.remove('download-near-limit', 'download-limit-reached');
            }
        }

        // 触发自定义事件
        this.triggerUsageUpdatedEvent({ usage, downloadUsage });
    }
}

// 创建全局实例
window.usageTracker = new UsageTracker();

// 导出类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UsageTracker;
}

console.log('使用量追踪器已加载');