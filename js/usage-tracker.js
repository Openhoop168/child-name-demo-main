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

        // localStorage 键名
        this.storageKey = 'usage_tracker_data';

        // 初始化使用量数据
        this.usageData = this.loadUsage() || this.getDefaultUsageData();

        // 检查是否需要重置
        this.checkAndResetUsage();

        // 初始化状态
        this.initialized = true;

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
            return stored ? JSON.parse(stored) : null;
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

        // 检查是否有document对象（浏览器环境）
        if (typeof document === 'undefined' || !document.getElementById) {
            // 非浏览器环境，只触发事件
            this.triggerUsageUpdatedEvent(usage);
            return;
        }

        // 查找使用量显示元素
        const usageElement = document.getElementById('usage-display');
        if (usageElement) {
            usageElement.innerHTML = `
                <div class="usage-info">
                    <span class="usage-daily">今日: ${usage.daily.count}/${usage.daily.limit}</span>
                    <span class="usage-monthly">本月: ${usage.monthly.count}/${usage.monthly.limit}</span>
                </div>
            `;

            // 添加警告样式
            if (usage.daily.percentage >= 100) {
                usageElement.classList.add('usage-limit-reached');
            } else if (usage.daily.percentage >= this.config.warningThreshold * 100) {
                usageElement.classList.add('usage-near-limit');
            } else {
                usageElement.classList.remove('usage-near-limit', 'usage-limit-reached');
            }
        }

        // 触发自定义事件
        this.triggerUsageUpdatedEvent(usage);
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
}

// 创建全局实例
window.usageTracker = new UsageTracker();

// 导出类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UsageTracker;
}

console.log('使用量追踪器已加载');