/**
 * 支付管理器
 * 负责管理用户订阅、套餐升级和支付流程
 */

class PaymentManager {
    constructor() {
        // 支付套餐配置
        this.plans = {
            FREE: {
                id: 'free',
                name: '免费版',
                price: 0,
                duration: 'permanent',
                popular: false,
                features: {
                    dailyGenerations: 100,
                    monthlyGenerations: 3000,
                    dailyDownloads: 50,
                    monthlyDownloads: 1000,
                    vocabularyCount: { core: 4, common: 6, environment: 4 },
                    themes: ['超市', '医院', '公园', '学校', '家庭', '动物园'],
                    supportLevel: 'basic',
                    customVocabulary: false,
                    batchGeneration: false,
                    customStyles: false,
                    apiAccess: false,
                    commercialLicense: false
                }
            },
            BASIC_MONTHLY: {
                id: 'basic_monthly',
                name: '基础版',
                price: 9.9,
                duration: 'monthly',
                popular: true,
                features: {
                    dailyGenerations: 500,
                    monthlyGenerations: 15000,
                    dailyDownloads: 250,
                    monthlyDownloads: 5000,
                    vocabularyCount: { core: 8, common: 12, environment: 8 },
                    themes: 'all',
                    supportLevel: 'standard',
                    customVocabulary: true,
                    batchGeneration: false,
                    customStyles: false,
                    apiAccess: false,
                    commercialLicense: false
                }
            },
            PRO_MONTHLY: {
                id: 'pro_monthly',
                name: '专业版',
                price: 29.9,
                duration: 'monthly',
                popular: false,
                features: {
                    dailyGenerations: 2000,
                    monthlyGenerations: 60000,
                    dailyDownloads: 1000,
                    monthlyDownloads: 20000,
                    vocabularyCount: { core: 15, common: 20, environment: 15 },
                    themes: 'all',
                    supportLevel: 'priority',
                    customVocabulary: true,
                    batchGeneration: true,
                    customStyles: true,
                    apiAccess: false,
                    commercialLicense: false
                }
            },
            PREMIUM_MONTHLY: {
                id: 'premium_monthly',
                name: '高级版',
                price: 59.9,
                duration: 'monthly',
                popular: false,
                features: {
                    dailyGenerations: 10000,
                    monthlyGenerations: 300000,
                    dailyDownloads: 5000,
                    monthlyDownloads: 100000,
                    vocabularyCount: { core: 30, common: 40, environment: 30 },
                    themes: 'all',
                    supportLevel: 'vip',
                    customVocabulary: true,
                    batchGeneration: true,
                    customStyles: true,
                    apiAccess: true,
                    commercialLicense: true
                }
            }
        };

        // 支付提供商配置
        this.paymentProviders = {
            alipay: {
                name: 'alipay',
                displayName: '支付宝',
                enabled: true,
                icon: 'fab fa-alipay'
            },
            wechat: {
                name: 'wechat',
                displayName: '微信支付',
                enabled: false, // 暂时禁用，后续可以启用
                icon: 'fab fa-weixin'
            }
        };

        // 存储相关配置
        this.storageKey = 'payment_data';
        this.orderStorageKey = 'payment_orders';
        this.subscriptionStorageKey = 'user_subscription';

        // 状态管理
        this.currentSubscription = null;
        this.currentOrder = null;
        this.initialized = false;

        // UI相关
        this.currentModal = null;
        this.selectedPlan = null;
        this.selectedPaymentMethod = 'alipay';

        console.log('[PaymentManager] 支付管理器已创建');
    }

    /**
     * 初始化支付管理器
     */
    async initialize() {
        if (this.initialized) {
            console.log('[PaymentManager] 支付管理器已初始化');
            return;
        }

        try {
            console.log('[PaymentManager] 开始初始化支付管理器...');

            // 加载用户订阅信息
            await this.loadUserSubscription();

            // 检查订阅状态
            await this.checkSubscriptionStatus();

            // 设置事件监听器
            this.setupEventListeners();

            // 初始化UI状态
            this.updateUI();

            this.initialized = true;
            console.log('[PaymentManager] 支付管理器初始化完成');

            // 触发初始化完成事件
            this.triggerEvent('paymentManagerInitialized', {
                subscription: this.currentSubscription,
                plans: this.plans
            });

        } catch (error) {
            console.error('[PaymentManager] 初始化失败:', error);
            throw error;
        }
    }

    /**
     * 加载用户订阅信息
     */
    async loadUserSubscription() {
        try {
            if (window.storageManager && typeof window.storageManager.loadSecureData === 'function') {
                // 使用安全存储
                const subscriptionData = await window.storageManager.loadSecureData(this.subscriptionStorageKey);
                this.currentSubscription = subscriptionData || this.createDefaultSubscription();
            } else {
                // 使用localStorage
                const stored = localStorage.getItem(this.subscriptionStorageKey);
                this.currentSubscription = stored ? JSON.parse(stored) : this.createDefaultSubscription();
            }

            console.log('[PaymentManager] 用户订阅信息已加载:', this.currentSubscription);
        } catch (error) {
            console.error('[PaymentManager] 加载用户订阅失败:', error);
            this.currentSubscription = this.createDefaultSubscription();
        }
    }

    /**
     * 创建默认订阅信息
     */
    createDefaultSubscription() {
        return {
            userId: this.generateUserId(),
            currentPlan: 'free',
            planStatus: 'active',
            subscriptionId: null,
            startDate: new Date().toISOString(),
            endDate: null,
            autoRenewal: false,
            paymentMethod: null,
            features: this.getPlanFeatures('free'),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    /**
     * 生成用户ID
     */
    generateUserId() {
        // 尝试从现有存储中获取用户ID
        let userId = localStorage.getItem('user_unique_id');
        if (!userId) {
            userId = 'user_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('user_unique_id', userId);
        }
        return userId;
    }

    /**
     * 检查订阅状态
     */
    async checkSubscriptionStatus() {
        if (!this.currentSubscription) {
            return;
        }

        const now = new Date();
        const endDate = this.currentSubscription.endDate ? new Date(this.currentSubscription.endDate) : null;

        // 检查订阅是否过期
        if (endDate && now > endDate) {
            console.log('[PaymentManager] 订阅已过期，切换到免费版');
            await this.downgradeToFree();
        }

        // 检查订阅状态
        if (this.currentSubscription.planStatus !== 'active') {
            console.log('[PaymentManager] 订阅状态异常，重置为免费版');
            await this.downgradeToFree();
        }
    }

    /**
     * 降级到免费版
     */
    async downgradeToFree() {
        const freePlan = this.plans.FREE;

        this.currentSubscription = {
            ...this.currentSubscription,
            currentPlan: 'free',
            planStatus: 'active',
            subscriptionId: null,
            endDate: null,
            autoRenewal: false,
            paymentMethod: null,
            features: freePlan.features,
            updatedAt: new Date().toISOString()
        };

        await this.saveUserSubscription();
    }

    /**
     * 保存用户订阅信息
     */
    async saveUserSubscription() {
        try {
            const subscriptionData = {
                ...this.currentSubscription,
                updatedAt: new Date().toISOString()
            };

            if (window.storageManager && typeof window.storageManager.saveSecureData === 'function') {
                await window.storageManager.saveSecureData(this.subscriptionStorageKey, subscriptionData);
            } else {
                localStorage.setItem(this.subscriptionStorageKey, JSON.stringify(subscriptionData));
            }

            console.log('[PaymentManager] 用户订阅信息已保存');
        } catch (error) {
            console.error('[PaymentManager] 保存用户订阅失败:', error);
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 监听使用量更新事件
        window.addEventListener('usageUpdated', (event) => {
            this.handleUsageUpdate(event.detail);
        });

        // 监听页面可见性变化，检查订阅状态
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.initialized) {
                this.checkSubscriptionStatus();
            }
        });
    }

    /**
     * 处理使用量更新事件
     */
    handleUsageUpdate(usageDetail) {
        // 可以在这里根据使用情况智能推荐套餐升级
        const { usage, downloadUsage } = usageDetail;

        if (usage.daily.percentage >= 80 || downloadUsage.daily.percentage >= 80) {
            console.log('[PaymentManager] 使用量接近上限，可以建议升级');
        }
    }

    /**
     * 更新UI状态
     */
    updateUI() {
        // 更新套餐显示
        this.updatePlanDisplay();

        // 更新升级按钮状态
        this.updateUpgradeButton();
    }

    /**
     * 更新套餐显示
     */
    updatePlanDisplay() {
        const planElements = document.querySelectorAll('.current-plan-display');
        planElements.forEach(element => {
            const plan = this.plans[this.currentSubscription.currentPlan];
            element.textContent = plan.name;
        });

        // 更新使用量限制显示
        if (window.usageTracker) {
            window.usageTracker.updateUsageDisplay();
        }
    }

    /**
     * 更新升级按钮
     */
    updateUpgradeButton() {
        const upgradeButtons = document.querySelectorAll('.upgrade-btn, [data-action="upgrade"]');
        upgradeButtons.forEach(button => {
            if (this.currentSubscription.currentPlan === 'free') {
                button.style.display = 'inline-block';
                button.textContent = '升级套餐';
            } else {
                button.style.display = 'none';
            }
        });
    }

    /**
     * 显示支付模态框
     * @param {string} triggerReason - 触发原因: 'upgrade', 'limit', 'manual'
     */
    showPaymentModal(triggerReason = 'upgrade') {
        // 关闭现有模态框
        this.closePaymentModal();

        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'modal payment-modal fade show';
        modal.style.display = 'block';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'paymentModalTitle');
        modal.setAttribute('aria-hidden', 'false');

        const modalHTML = `
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="paymentModalTitle">
                            <i class="fas fa-crown text-warning"></i>
                            选择您的套餐
                        </h5>
                        <button class="modal-close" onclick="window.paymentManager.closePaymentModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="payment-intro">
                            ${this.getIntroContent(triggerReason)}
                        </div>
                        <div class="plans-container">
                            ${this.renderPlans()}
                        </div>
                        <div class="payment-methods">
                            <h6>选择支付方式</h6>
                            <div class="payment-method-options">
                                ${this.renderPaymentMethods()}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="window.paymentManager.closePaymentModal()">
                            稍后再说
                        </button>
                        <button class="btn btn-primary" id="confirmPaymentBtn" onclick="window.paymentManager.processPayment()">
                            <i class="fas fa-lock"></i>
                            安全支付
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.innerHTML = modalHTML;
        document.body.appendChild(modal);
        this.currentModal = modal;

        // 绑定套餐选择事件
        this.bindPlanSelectionEvents();

        // 防止body滚动
        document.body.style.overflow = 'hidden';
        modal.style.overflowY = 'auto';

        // 聚焦到模态框
        setTimeout(() => {
            modal.focus();
        }, 100);

        console.log('[PaymentManager] 支付模态框已显示');
    }

    /**
     * 获取介绍内容
     */
    getIntroContent(triggerReason) {
        const contents = {
            upgrade: `
                <div class="text-center mb-4">
                    <h6>升级您的套餐，解锁更多功能</h6>
                    <p class="text-muted">选择合适的套餐，享受更高配额和更多功能</p>
                </div>
            `,
            limit: `
                <div class="text-center mb-4">
                    <h6 class="text-warning">您已达到使用限制</h6>
                    <p class="text-muted">升级套餐即可继续使用，并享受更多功能</p>
                </div>
            `,
            manual: `
                <div class="text-center mb-4">
                    <h6>管理您的订阅</h6>
                    <p class="text-muted">选择最适合您需求的套餐</p>
                </div>
            `
        };

        return contents[triggerReason] || contents.upgrade;
    }

    /**
     * 渲染套餐选项
     */
    renderPlans() {
        let html = '<div class="row">';

        Object.values(this.plans).forEach(plan => {
            const isCurrentPlan = plan.id === this.currentSubscription.currentPlan;
            const planClass = isCurrentPlan ? 'current-plan' : '';
            const popularClass = plan.popular ? 'popular-plan' : '';

            html += `
                <div class="col-md-6 col-lg-3 mb-3">
                    <div class="plan-card ${planClass} ${popularClass}" data-plan-id="${plan.id}">
                        ${plan.popular ? '<div class="popular-badge">最受欢迎</div>' : ''}
                        ${isCurrentPlan ? '<div class="current-badge">当前套餐</div>' : ''}

                        <div class="plan-header">
                            <h6 class="plan-name">${plan.name}</h6>
                            <div class="plan-price">
                                <span class="currency">¥</span>
                                <span class="amount">${plan.price}</span>
                                <span class="period">${plan.duration === 'monthly' ? '/月' : ''}</span>
                            </div>
                        </div>

                        <div class="plan-features">
                            ${this.renderPlanFeatures(plan)}
                        </div>

                        <div class="plan-action">
                            <button class="btn ${isCurrentPlan ? 'btn-success' : 'btn-outline-primary'} btn-sm"
                                    ${isCurrentPlan ? 'disabled' : `onclick="window.paymentManager.selectPlan('${plan.id}')"`}>
                                ${isCurrentPlan ? '当前套餐' : '选择此套餐'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    /**
     * 渲染套餐功能
     */
    renderPlanFeatures(plan) {
        const features = [
            { icon: 'fas fa-image', text: `${plan.features.dailyGenerations.toLocaleString()}次/天生成` },
            { icon: 'fas fa-download', text: `${plan.features.dailyDownloads.toLocaleString()}次/天下载` },
            { icon: 'fas fa-book', text: `${this.getVocabularyText(plan.features.vocabularyCount)}` },
            { icon: 'fas fa-palette', text: this.getThemesText(plan.features.themes) },
            { icon: 'fas fa-headset', text: this.getSupportText(plan.features.supportLevel) }
        ];

        if (plan.features.customVocabulary) {
            features.push({ icon: 'fas fa-edit', text: '自定义词汇' });
        }
        if (plan.features.batchGeneration) {
            features.push({ icon: 'fas fa-layer-group', text: '批量生成' });
        }
        if (plan.features.apiAccess) {
            features.push({ icon: 'fas fa-code', text: 'API访问' });
        }

        return features.map(feature => `
            <div class="plan-feature">
                <i class="${feature.icon}"></i>
                <span>${feature.text}</span>
            </div>
        `).join('');
    }

    /**
     * 获取词汇文本
     */
    getVocabularyText(vocabularyCount) {
        return `${vocabularyCount.core + vocabularyCount.common + vocabularyCount.environment}个词汇`;
    }

    /**
     * 获取主题文本
     */
    getThemesText(themes) {
        return themes === 'all' ? '全部主题' : themes.length + '个主题';
    }

    /**
     * 获取支持文本
     */
    getSupportText(level) {
        const supportLevels = {
            basic: '基础支持',
            standard: '标准支持',
            priority: '优先支持',
            vip: 'VIP支持'
        };
        return supportLevels[level] || '基础支持';
    }

    /**
     * 渲染支付方式
     */
    renderPaymentMethods() {
        let html = '';

        Object.values(this.paymentProviders).forEach(provider => {
            if (!provider.enabled) return;

            html += `
                <label class="payment-method">
                    <input type="radio" name="paymentMethod" value="${provider.name}"
                           ${this.selectedPaymentMethod === provider.name ? 'checked' : ''}>
                    <i class="${provider.icon}"></i>
                    ${provider.displayName}
                </label>
            `;
        });

        return html;
    }

    /**
     * 绑定套餐选择事件
     */
    bindPlanSelectionEvents() {
        const planCards = this.currentModal.querySelectorAll('.plan-card');
        planCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // 如果点击的是按钮或者当前套餐，不处理
                if (e.target.tagName === 'BUTTON' || card.classList.contains('current-plan')) {
                    return;
                }

                const planId = card.dataset.planId;
                this.selectPlan(planId);
            });
        });

        // 绑定支付方式选择事件
        const paymentMethodInputs = this.currentModal.querySelectorAll('input[name="paymentMethod"]');
        paymentMethodInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.selectedPaymentMethod = e.target.value;
            });
        });
    }

    /**
     * 选择套餐
     */
    selectPlan(planId) {
        if (planId === this.currentSubscription.currentPlan) {
            return;
        }

        this.selectedPlan = planId;

        // 更新UI状态
        const planCards = this.currentModal.querySelectorAll('.plan-card');
        planCards.forEach(card => {
            card.classList.remove('selected');
        });

        const selectedCard = this.currentModal.querySelector(`[data-plan-id="${planId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }

        // 更新确认按钮状态
        const confirmBtn = this.currentModal.querySelector('#confirmPaymentBtn');
        const plan = this.plans[planId];

        if (plan.price === 0) {
            confirmBtn.textContent = '切换到此套餐';
            confirmBtn.className = 'btn btn-success';
        } else {
            confirmBtn.textContent = `支付 ¥${plan.price}`;
            confirmBtn.className = 'btn btn-primary';
        }

        console.log('[PaymentManager] 已选择套餐:', planId);
    }

    /**
     * 处理支付
     */
    async processPayment() {
        if (!this.selectedPlan) {
            this.showPaymentError('请先选择一个套餐');
            return;
        }

        const plan = this.plans[this.selectedPlan];

        // 免费套餐直接切换
        if (plan.price === 0) {
            await this.switchToFreePlan();
            return;
        }

        // 付费套餐处理支付
        try {
            this.showPaymentProcessing();

            // 创建订单
            const order = await this.createOrder(this.selectedPlan, this.selectedPaymentMethod);

            // 调用支付接口
            const paymentResult = await this.initiatePayment(order);

            if (paymentResult.success) {
                // 跳转到支付页面
                window.open(paymentResult.paymentUrl, '_blank');

                // 开始轮询支付状态
                this.startPaymentStatusPolling(order.orderId);
            } else {
                throw new Error(paymentResult.error || '支付初始化失败');
            }

        } catch (error) {
            console.error('[PaymentManager] 支付处理失败:', error);
            this.showPaymentError(error.message);
        }
    }

    /**
     * 切换到免费套餐
     */
    async switchToFreePlan() {
        await this.downgradeToFree();
        this.closePaymentModal();
        this.showPaymentSuccess('已切换到免费版');
    }

    /**
     * 创建订单
     */
    async createOrder(planId, paymentMethod) {
        const plan = this.plans[planId];
        const orderId = this.generateOrderId();

        const order = {
            orderId: orderId,
            userId: this.currentSubscription.userId,
            planId: planId,
            planName: plan.name,
            amount: plan.price,
            currency: 'CNY',
            status: 'pending',
            paymentMethod: paymentMethod,
            paymentId: null,
            createdAt: new Date().toISOString(),
            paidAt: null,
            expiredAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1小时后过期
            metadata: {
                originalPlan: this.currentSubscription.currentPlan,
                upgradeType: this.getUpgradeType(this.currentSubscription.currentPlan, planId),
                promoCode: null
            }
        };

        // 保存订单
        await this.saveOrder(order);
        this.currentOrder = order;

        console.log('[PaymentManager] 订单已创建:', order);
        return order;
    }

    /**
     * 生成订单ID
     */
    generateOrderId() {
        return 'order_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 获取升级类型
     */
    getUpgradeType(currentPlanId, targetPlanId) {
        if (currentPlanId === targetPlanId) return 'renewal';
        if (currentPlanId === 'free') return 'new';

        const currentPlan = this.plans[currentPlanId];
        const targetPlan = this.plans[targetPlanId];

        if (targetPlan.price > currentPlan.price) return 'upgrade';
        if (targetPlan.price < currentPlan.price) return 'downgrade';
        return 'change';
    }

    /**
     * 发起支付
     */
    async initiatePayment(order) {
        // 这里是支付接口的模拟实现
        // 实际应用中需要调用真实的支付API

        console.log('[PaymentManager] 模拟支付发起:', order);

        // 模拟支付URL生成
        const paymentUrl = `https://payment.example.com/pay?orderId=${order.orderId}&amount=${order.amount}`;

        return {
            success: true,
            paymentUrl: paymentUrl,
            orderId: order.orderId
        };
    }

    /**
     * 开始轮询支付状态
     */
    startPaymentStatusPolling(orderId) {
        const pollInterval = setInterval(async () => {
            try {
                const status = await this.checkPaymentStatus(orderId);

                if (status.status === 'paid') {
                    clearInterval(pollInterval);
                    await this.handlePaymentSuccess(orderId);
                } else if (status.status === 'failed' || status.status === 'cancelled') {
                    clearInterval(pollInterval);
                    await this.handlePaymentFailure(orderId, status.message);
                } else if (Date.now() > new Date(status.expiredAt).getTime()) {
                    clearInterval(pollInterval);
                    await this.handlePaymentExpired(orderId);
                }
            } catch (error) {
                console.error('[PaymentManager] 支付状态检查失败:', error);
            }
        }, 3000); // 每3秒检查一次

        // 设置超时，避免无限轮询
        setTimeout(() => {
            clearInterval(pollInterval);
        }, 5 * 60 * 1000); // 5分钟超时
    }

    /**
     * 检查支付状态
     */
    async checkPaymentStatus(orderId) {
        // 模拟支付状态检查
        // 实际应用中需要调用支付提供商的查询API

        const order = await this.getOrder(orderId);
        return {
            status: order.status,
            orderId: order.orderId,
            expiredAt: order.expiredAt
        };
    }

    /**
     * 处理支付成功
     */
    async handlePaymentSuccess(orderId) {
        try {
            const order = await this.getOrder(orderId);

            // 更新订单状态
            order.status = 'paid';
            order.paidAt = new Date().toISOString();
            await this.saveOrder(order);

            // 升级订阅
            await this.upgradeSubscription(order.planId, order);

            this.closePaymentModal();
            this.showPaymentSuccess('支付成功！套餐已升级');

            console.log('[PaymentManager] 支付成功处理完成:', orderId);
        } catch (error) {
            console.error('[PaymentManager] 支付成功处理失败:', error);
            this.showPaymentError('支付成功但升级失败，请联系客服');
        }
    }

    /**
     * 处理支付失败
     */
    async handlePaymentFailure(orderId, message) {
        try {
            const order = await this.getOrder(orderId);
            order.status = 'failed';
            await this.saveOrder(order);

            this.closePaymentModal();
            this.showPaymentError(`支付失败: ${message || '未知错误'}`);
        } catch (error) {
            console.error('[PaymentManager] 支付失败处理失败:', error);
        }
    }

    /**
     * 处理支付过期
     */
    async handlePaymentExpired(orderId) {
        try {
            const order = await this.getOrder(orderId);
            order.status = 'expired';
            await this.saveOrder(order);

            this.closePaymentModal();
            this.showPaymentError('支付已超时，请重新发起支付');
        } catch (error) {
            console.error('[PaymentManager] 支付过期处理失败:', error);
        }
    }

    /**
     * 升级订阅
     */
    async upgradeSubscription(planId, order) {
        const plan = this.plans[planId];
        const now = new Date();
        const endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + 1); // 一个月后过期

        this.currentSubscription = {
            ...this.currentSubscription,
            currentPlan: planId,
            planStatus: 'active',
            subscriptionId: 'sub_' + order.orderId,
            startDate: now.toISOString(),
            endDate: plan.duration === 'monthly' ? endDate.toISOString() : null,
            autoRenewal: false,
            paymentMethod: order.paymentMethod,
            features: plan.features,
            updatedAt: now.toISOString()
        };

        await this.saveUserSubscription();
        this.updateUI();

        // 触发订阅升级事件
        this.triggerEvent('subscriptionUpgraded', {
            oldPlan: order.metadata.originalPlan,
            newPlan: planId,
            subscription: this.currentSubscription
        });
    }

    /**
     * 获取套餐功能对比
     */
    getPlanFeatures() {
        const features = [
            { name: '每日生成次数', key: 'dailyGenerations', unit: '次', type: 'number' },
            { name: '每月生成次数', key: 'monthlyGenerations', unit: '次', type: 'number' },
            { name: '每日下载次数', key: 'dailyDownloads', unit: '次', type: 'number' },
            { name: '每月下载次数', key: 'monthlyDownloads', unit: '次', type: 'number' },
            { name: '词汇总数', key: 'vocabularyCount', type: 'vocabulary' },
            { name: '主题限制', key: 'themes', type: 'themes' },
            { name: '支持等级', key: 'supportLevel', type: 'support' },
            { name: '自定义词汇', key: 'customVocabulary', type: 'boolean' },
            { name: '批量生成', key: 'batchGeneration', type: 'boolean' },
            { name: '自定义样式', key: 'customStyles', type: 'boolean' },
            { name: 'API访问', key: 'apiAccess', type: 'boolean' },
            { name: '商业授权', key: 'commercialLicense', type: 'boolean' }
        ];

        const comparison = features.map(feature => {
            const row = { name: feature.name };

            Object.values(this.plans).forEach(plan => {
                let value = this.getNestedValue(plan.features, feature.key);

                if (feature.type === 'boolean') {
                    value = value ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-muted"></i>';
                } else if (feature.type === 'vocabulary') {
                    value = (value.core + value.common + value.environment).toLocaleString() + '个';
                } else if (feature.type === 'themes') {
                    value = value === 'all' ? '全部主题' : value.join(', ');
                } else if (feature.type === 'support') {
                    const supportMap = {
                        basic: '基础支持',
                        standard: '标准支持',
                        priority: '优先支持',
                        vip: 'VIP支持'
                    };
                    value = supportMap[value] || value;
                } else if (typeof value === 'number') {
                    value = value.toLocaleString() + (feature.unit || '');
                }

                row[plan.id] = value;
            });

            return row;
        });

        return comparison;
    }

    /**
     * 获取嵌套对象值
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : null;
        }, obj);
    }

    /**
     * 获取套餐功能
     */
    getPlanFeatures(planId) {
        const plan = this.plans[planId];
        return plan ? plan.features : null;
    }

    /**
     * 获取当前订阅状态
     */
    getCurrentSubscription() {
        return this.currentSubscription;
    }

    /**
     * 检查订阅是否有效
     */
    isSubscriptionActive() {
        if (!this.currentSubscription) {
            return false;
        }

        if (this.currentSubscription.planStatus !== 'active') {
            return false;
        }

        // 检查是否过期
        if (this.currentSubscription.endDate) {
            const now = new Date();
            const endDate = new Date(this.currentSubscription.endDate);
            return now <= endDate;
        }

        return true;
    }

    /**
     * 获取当前套餐限制
     */
    getCurrentPlanLimits() {
        if (!this.isSubscriptionActive() || !this.currentSubscription) {
            return this.getPlanFeatures('free');
        }

        return this.currentSubscription.features;
    }

    /**
     * 保存订单
     */
    async saveOrder(order) {
        try {
            const orders = await this.getOrders();
            orders.unshift(order);

            // 限制订单记录数量
            if (orders.length > 100) {
                orders.splice(100);
            }

            if (window.storageManager && typeof window.storageManager.saveSecureData === 'function') {
                await window.storageManager.saveSecureData(this.orderStorageKey, orders);
            } else {
                localStorage.setItem(this.orderStorageKey, JSON.stringify(orders));
            }

            console.log('[PaymentManager] 订单已保存:', order.orderId);
        } catch (error) {
            console.error('[PaymentManager] 保存订单失败:', error);
        }
    }

    /**
     * 获取订单
     */
    async getOrder(orderId) {
        try {
            const orders = await this.getOrders();
            return orders.find(order => order.orderId === orderId) || null;
        } catch (error) {
            console.error('[PaymentManager] 获取订单失败:', error);
            return null;
        }
    }

    /**
     * 获取所有订单
     */
    async getOrders() {
        try {
            if (window.storageManager && typeof window.storageManager.loadSecureData === 'function') {
                return await window.storageManager.loadSecureData(this.orderStorageKey) || [];
            } else {
                const stored = localStorage.getItem(this.orderStorageKey);
                return stored ? JSON.parse(stored) : [];
            }
        } catch (error) {
            console.error('[PaymentManager] 获取订单列表失败:', error);
            return [];
        }
    }

    /**
     * 关闭支付模态框
     */
    closePaymentModal() {
        if (this.currentModal) {
            this.currentModal.remove();
            this.currentModal = null;
            document.body.style.overflow = '';
        }

        // 重置状态
        this.selectedPlan = null;
        this.currentOrder = null;
    }

    /**
     * 显示支付处理状态
     */
    showPaymentProcessing() {
        if (!this.currentModal) return;

        const confirmBtn = this.currentModal.querySelector('#confirmPaymentBtn');
        if (confirmBtn) {
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';
            confirmBtn.disabled = true;
        }
    }

    /**
     * 显示支付成功消息
     */
    showPaymentSuccess(message) {
        if (window.app && typeof window.app.showNotification === 'function') {
            window.app.showNotification(message, 'success');
        } else {
            this.showTemporaryNotification(message, 'success');
        }
    }

    /**
     * 显示支付错误消息
     */
    showPaymentError(message) {
        if (window.app && typeof window.app.showNotification === 'function') {
            window.app.showNotification(message, 'error');
        } else {
            this.showTemporaryNotification(message, 'error');
        }
    }

    /**
     * 显示临时通知
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
            ${type === 'success' ? 'background-color: #4CAF50;' : ''}
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
        }, 4000);
    }

    /**
     * 触发自定义事件
     */
    triggerEvent(eventName, detail) {
        try {
            if (typeof CustomEvent !== 'undefined' && typeof window !== 'undefined') {
                const event = new CustomEvent(eventName, { detail });
                window.dispatchEvent(event);
            }
        } catch (error) {
            console.debug('[PaymentManager] 事件触发失败:', error.message);
        }
    }
}

// 创建全局实例
window.paymentManager = new PaymentManager();

// 导出类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaymentManager;
}

console.log('[PaymentManager] 支付管理器已加载');