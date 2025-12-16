/**
 * 支付API接口封装
 * 提供支付宝和微信支付的API调用接口
 * 当前版本为模拟实现，保留真实集成的接口
 *
 * @author 儿童识字小报生成器
 * @version 1.0.0
 */

'use strict';

/**
 * 支付API类
 * 封装支付相关的API调用
 */
class PaymentAPI {
    constructor() {
        this.baseUrl = window.APP_CONFIG?.payment?.apiBaseUrl || '/api/payment';
        this.timeout = 30000;
        this.retryCount = 3;
        this.retryDelay = 1000;

        // 支付状态映射
        this.statusMap = {
            'WAIT_BUYER_PAY': 'pending',    // 等待买家付款
            'TRADE_SUCCESS': 'paid',        // 支付成功
            'TRADE_CLOSED': 'failed',       // 交易关闭
            'TRADE_FINISHED': 'paid',       // 交易完成
            'USERPAYING': 'pending',        // 用户支付中（微信）
            'SUCCESS': 'paid',              // 支付成功（微信）
            'PAYERROR': 'failed',           // 支付失败（微信）
            'REFUND': 'refunded'            // 已退款
        };

        // 环境配置
        this.isProduction = window.location.hostname !== 'localhost' &&
                           !window.location.hostname.includes('127.0.0.1');

        console.log('[PaymentAPI] 初始化，环境：', this.isProduction ? '生产' : '开发');
    }

    /**
     * 生成请求ID
     */
    generateRequestId() {
        return 'REQ_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 生成模拟订单号
     */
    generateMockOrderId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 8).toUpperCase();
        return 'PAY' + timestamp + random;
    }

    /**
     * 模拟网络延迟
     */
    async simulateNetworkDelay(minMs = 500, maxMs = 2000) {
        const delay = Math.random() * (maxMs - minMs) + minMs;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * 模拟API调用失败
     * 测试模式下默认不失败
     */
    simulateApiFailure(failureRate = 0) {
        // 在测试环境中，默认不模拟失败
        // 如果需要测试失败场景，可以通过参数控制
        return Math.random() < failureRate;
    }

    /**
     * 设置测试模式
     */
    setTestMode(mode = 'normal') {
        this.testMode = mode; // 'normal', 'success', 'failure'
        console.log(`[PaymentAPI] 测试模式设置为: ${mode}`);
    }

    /**
     * 获取测试模式
     */
    getTestMode() {
        return this.testMode || 'normal';
    }

    /**
     * 创建支付宝支付订单
     * @param {Object} orderData - 订单数据
     * @returns {Promise<Object>} 支付结果
     */
    async createAlipayOrder(orderData) {
        console.log('[PaymentAPI] 创建支付宝订单:', orderData);

        try {
            // 验证必要参数
            this.validateOrderData(orderData);

            // 模拟网络请求
            await this.simulateNetworkDelay();

            // 根据测试模式决定结果
            const testMode = this.getTestMode();
            if (testMode === 'failure') {
                throw new Error('模拟支付失败');
            }

            // 生成模拟支付URL
            const orderId = orderData.orderId || this.generateMockOrderId();
            const paymentUrl = this.generateMockAlipayUrl(orderData, orderId);

            // 保存订单信息到本地（模拟）
            this.saveMockOrder({
                orderId: orderId,
                provider: 'alipay',
                amount: orderData.amount,
                planId: orderData.planId,
                status: 'pending',
                createdAt: new Date().toISOString()
            });

            return {
                success: true,
                orderId: orderId,
                paymentUrl: paymentUrl,
                qrCode: `data:image/png;base64,${this.generateMockQRCode(orderId)}`,
                expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30分钟过期
                message: '支付宝订单创建成功'
            };

        } catch (error) {
            console.error('[PaymentAPI] 创建支付宝订单失败:', error);
            return {
                success: false,
                error: error.message,
                code: 'CREATE_ORDER_FAILED'
            };
        }
    }

    /**
     * 创建微信支付订单
     * @param {Object} orderData - 订单数据
     * @returns {Promise<Object>} 支付结果
     */
    async createWechatOrder(orderData) {
        console.log('[PaymentAPI] 创建微信订单:', orderData);

        try {
            // 验证必要参数
            this.validateOrderData(orderData);

            // 模拟网络请求
            await this.simulateNetworkDelay();

            // 根据测试模式决定结果
            const testMode = this.getTestMode();
            if (testMode === 'failure') {
                throw new Error('模拟微信支付失败');
            }

            // 生成模拟支付URL
            const orderId = orderData.orderId || this.generateMockOrderId();
            const paymentUrl = this.generateMockWechatUrl(orderData, orderId);

            // 保存订单信息到本地（模拟）
            this.saveMockOrder({
                orderId: orderId,
                provider: 'wechat',
                amount: orderData.amount,
                planId: orderData.planId,
                status: 'pending',
                createdAt: new Date().toISOString()
            });

            return {
                success: true,
                orderId: orderId,
                paymentUrl: paymentUrl,
                qrCode: `data:image/png;base64,${this.generateMockQRCode(orderId)}`,
                mwebUrl: paymentUrl, // 微信H5支付链接
                expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30分钟过期
                message: '微信订单创建成功'
            };

        } catch (error) {
            console.error('[PaymentAPI] 创建微信订单失败:', error);
            return {
                success: false,
                error: error.message,
                code: 'CREATE_ORDER_FAILED'
            };
        }
    }

    /**
     * 查询支付状态
     * @param {string} orderId - 订单号
     * @param {string} provider - 支付提供商
     * @returns {Promise<Object>} 支付状态
     */
    async queryPaymentStatus(orderId, provider) {
        console.log('[PaymentAPI] 查询支付状态:', { orderId, provider });

        try {
            // 验证参数
            if (!orderId || !provider) {
                throw new Error('订单号和支付提供商不能为空');
            }

            // 获取本地订单信息
            const order = this.getMockOrder(orderId);
            if (!order) {
                throw new Error('订单不存在');
            }

            // 模拟网络请求
            await this.simulateNetworkDelay(300, 1000);

            // 模拟状态变化（用于测试）
            const mockStatus = this.simulatePaymentStatus(order);

            // 更新本地订单状态
            order.status = mockStatus.status;
            if (mockStatus.status === 'paid') {
                order.paidAt = new Date().toISOString();
                order.tradeNo = 'TXN' + Date.now();
            }
            this.saveMockOrder(order);

            return {
                success: true,
                orderId: orderId,
                status: mockStatus.status,
                tradeNo: mockStatus.status === 'paid' ? order.tradeNo : null,
                paidAt: mockStatus.status === 'paid' ? order.paidAt : null,
                message: this.getStatusMessage(mockStatus.status, provider)
            };

        } catch (error) {
            console.error('[PaymentAPI] 查询支付状态失败:', error);
            return {
                success: false,
                error: error.message,
                code: 'QUERY_STATUS_FAILED'
            };
        }
    }

    /**
     * 验证订单数据
     * @param {Object} orderData - 订单数据
     */
    validateOrderData(orderData) {
        if (!orderData) {
            throw new Error('订单数据不能为空');
        }

        if (!orderData.amount || orderData.amount <= 0) {
            throw new Error('订单金额必须大于0');
        }

        if (!orderData.planId) {
            throw new Error('套餐ID不能为空');
        }

        // 验证金额格式
        if (typeof orderData.amount !== 'number' ||
            !/^\d+(\.\d{1,2})?$/.test(orderData.amount.toString())) {
            throw new Error('订单金额格式不正确');
        }
    }

    /**
     * 生成模拟支付宝支付URL
     * @param {Object} orderData - 订单数据
     * @param {string} orderId - 订单号
     * @returns {string} 支付URL
     */
    generateMockAlipayUrl(orderData, orderId) {
        // 在实际实现中，这里会调用支付宝SDK生成真实的支付URL
        // 现在返回一个模拟URL
        const params = new URLSearchParams({
            app_id: '2021000000000000000',
            method: 'alipay.trade.wap.pay',
            charset: 'utf-8',
            sign_type: 'RSA2',
            timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, ''),
            version: '1.0',
            notify_url: window.APP_CONFIG?.payment?.notifyUrl || '',
            return_url: window.APP_CONFIG?.payment?.returnUrl || window.location.href,
            biz_content: JSON.stringify({
                out_trade_no: orderId,
                product_code: 'QUICK_WAP_WAY',
                total_amount: orderData.amount.toFixed(2),
                subject: orderData.subject || '儿童识字小报-套餐升级',
                body: orderData.body || `升级到${orderData.planName || '付费套餐'}`
            })
        });

        // 模拟支付宝网关URL
        return `https://openapi.alipay.com/gateway.do?${params.toString()}&sign=MOCK_SIGNATURE`;
    }

    /**
     * 生成模拟微信支付URL
     * @param {Object} orderData - 订单数据
     * @param {string} orderId - 订单号
     * @returns {string} 支付URL
     */
    generateMockWechatUrl(orderData, orderId) {
        // 在实际实现中，这里会调用微信支付SDK生成真实的支付URL
        // 现在返回一个模拟URL
        const params = new URLSearchParams({
            appid: 'wx0000000000000000',
            mch_id: '1000000000',
            nonce_str: Math.random().toString(36).substr(2, 32),
            body: orderData.subject || '儿童识字小报-套餐升级',
            out_trade_no: orderId,
            total_fee: Math.round(orderData.amount * 100), // 转换为分
            spbill_create_ip: '127.0.0.1',
            notify_url: window.APP_CONFIG?.payment?.notifyUrl || '',
            trade_type: 'MWEB',
            scene_info: JSON.stringify({
                "h5_info": {
                    "type": "Wap",
                    "wap_url": window.location.origin,
                    "wap_name": "儿童识字小报"
                }
            })
        });

        // 模拟微信支付URL
        return `https://wx.tenpay.com/cgi-bin/mmpayweb-bin/checkmweb?prepay_id=MOCK_PREPAY_ID&package=MOCK_PACKAGE`;
    }

    /**
     * 生成模拟二维码（Base64）
     * @param {string} orderId - 订单号
     * @returns {string} Base64编码的二维码图片
     */
    generateMockQRCode(orderId) {
        // 这里应该生成真实的二维码图片
        // 现在返回一个模拟的Base64字符串
        return 'MOCK_QR_CODE_DATA_FOR_' + orderId;
    }

    /**
     * 模拟支付状态变化
     * @param {Object} order - 订单信息
     * @returns {Object} 支付状态
     */
    simulatePaymentStatus(order) {
        const now = Date.now();
        const createdTime = new Date(order.createdAt).getTime();
        const elapsedMinutes = (now - createdTime) / (1000 * 60);

        // 根据测试模式返回确定的结果
        const testMode = this.getTestMode();

        if (testMode === 'success') {
            // 成功模式：1秒后支付成功
            if (elapsedMinutes * 60 < 1) {
                return { status: 'pending' };
            } else {
                return { status: 'paid' };
            }
        } else if (testMode === 'failure') {
            // 失败模式：2秒后支付失败
            if (elapsedMinutes * 60 < 2) {
                return { status: 'pending' };
            } else {
                return { status: 'failed' };
            }
        } else {
            // 正常模式：基于时间的随机状态
            if (elapsedMinutes < 1) {
                // 1分钟内：支付中
                return { status: 'pending' };
            } else if (elapsedMinutes < 2) {
                // 1-2分钟：80%概率支付成功
                return {
                    status: Math.random() < 0.8 ? 'paid' : 'pending'
                };
            } else if (elapsedMinutes < 5) {
                // 2-5分钟：90%概率支付成功
                return {
                    status: Math.random() < 0.9 ? 'paid' : 'failed'
                };
            } else {
                // 5分钟后：支付失败
                return { status: 'failed' };
            }
        }
    }

    /**
     * 获取状态消息
     * @param {string} status - 状态
     * @param {string} provider - 支付提供商
     * @returns {string} 状态消息
     */
    getStatusMessage(status, provider) {
        const messages = {
            pending: '支付处理中，请稍候...',
            paid: '支付成功',
            failed: '支付失败',
            cancelled: '支付已取消',
            expired: '支付已过期',
            refunded: '已退款'
        };

        return messages[status] || '未知状态';
    }

    /**
     * 保存模拟订单到本地存储
     * @param {Object} order - 订单信息
     */
    saveMockOrder(order) {
        try {
            const orders = JSON.parse(localStorage.getItem('mock_payment_orders') || '{}');
            orders[order.orderId] = order;
            localStorage.setItem('mock_payment_orders', JSON.stringify(orders));
        } catch (error) {
            console.error('[PaymentAPI] 保存订单失败:', error);
        }
    }

    /**
     * 获取模拟订单
     * @param {string} orderId - 订单号
     * @returns {Object|null} 订单信息
     */
    getMockOrder(orderId) {
        try {
            const orders = JSON.parse(localStorage.getItem('mock_payment_orders') || '{}');
            return orders[orderId] || null;
        } catch (error) {
            console.error('[PaymentAPI] 获取订单失败:', error);
            return null;
        }
    }

    /**
     * 删除模拟订单
     * @param {string} orderId - 订单号
     */
    deleteMockOrder(orderId) {
        try {
            const orders = JSON.parse(localStorage.getItem('mock_payment_orders') || '{}');
            delete orders[orderId];
            localStorage.setItem('mock_payment_orders', JSON.stringify(orders));
        } catch (error) {
            console.error('[PaymentAPI] 删除订单失败:', error);
        }
    }

    /**
     * 清理过期的模拟订单
     */
    cleanExpiredOrders() {
        try {
            const orders = JSON.parse(localStorage.getItem('mock_payment_orders') || '{}');
            const now = Date.now();
            const expireTime = 24 * 60 * 60 * 1000; // 24小时过期

            Object.keys(orders).forEach(orderId => {
                const order = orders[orderId];
                const createdTime = new Date(order.createdAt).getTime();
                if (now - createdTime > expireTime) {
                    delete orders[orderId];
                }
            });

            localStorage.setItem('mock_payment_orders', JSON.stringify(orders));
        } catch (error) {
            console.error('[PaymentAPI] 清理过期订单失败:', error);
        }
    }

    /**
     * 获取所有模拟订单
     * @returns {Object} 订单列表
     */
    getAllMockOrders() {
        try {
            const orders = JSON.parse(localStorage.getItem('mock_payment_orders') || '{}');
            return orders;
        } catch (error) {
            console.error('[PaymentAPI] 获取订单列表失败:', error);
            return {};
        }
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaymentAPI;
} else {
    window.PaymentAPI = PaymentAPI;
}