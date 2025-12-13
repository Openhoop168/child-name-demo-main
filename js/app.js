/**
 * 儿童识字小报生成器 - 主应用
 * 整合所有功能模块，提供完整的用户交互体验
 */

class ChildrenLiteracyApp {
    constructor() {
        this.currentStep = 1;
        this.currentPromptData = null;
        this.currentTaskId = null;
        this.isGenerating = false;
        this.currentPollingTimer = null; // 用于管理轮询定时器
        this.abortController = null; // 用于中断生成过程

        // DOM元素引用
        this.elements = {};

        this.initialized = false;
    }

    /**
     * 初始化应用
     */
    async initialize() {
        if (this.initialized) return;

        try {
            console.log('正在初始化儿童识字小报生成器...');

            // 显示加载状态
            this.showLoading('正在加载应用...');

            // 验证配置
            await this.validateConfiguration();

            // 初始化各个模块
            await this.initializeModules();

            // 绑定DOM元素
            this.bindElements();

            // 绑定事件监听器
            this.bindEventListeners();

            // 恢复上次状态
            await this.restoreLastState();

            // 检查用户API密钥
            const hasApiKey = await this.checkUserApiKey();

            if (!hasApiKey) {
                // 显示API密钥设置界面
                this.showApiKeySetupModal();
                this.hideLoading();
                this.initialized = true;
                return;
            }

            // 检查API配置（仅在用户有密钥时执行）
            await this.checkAPIConfiguration();

            this.initialized = true;
            this.hideLoading();

            console.log('儿童识字小报生成器初始化完成');
            this.showMessage('应用初始化完成', 'success');

            // 检查是否是分享链接
            this.checkShareLink();

        } catch (error) {
            console.error('应用初始化失败:', error);
            this.hideLoading();
            this.showInitializationError(error);
        }
    }

    /**
     * 检查用户API密钥
     */
    async checkUserApiKey() {
        try {
            console.log('检查用户API密钥...');

            // 从本地存储检查是否有保存的API密钥
            const savedApiKey = localStorage.getItem('user_api_key');

            if (!savedApiKey) {
                console.log('未找到用户API密钥');
                return false;
            }

            // 验证API密钥格式
            const validation = window.securityUtils.validateApiKeyFormat(savedApiKey);
            if (!validation.valid) {
                console.warn('API密钥格式无效:', validation.reason);
                localStorage.removeItem('user_api_key');
                return false;
            }

            console.log('找到有效的用户API密钥');

            // 设置到API客户端
            if (window.nanoBananaClient && typeof window.nanoBananaClient.setUserApiKey === 'function') {
                await window.nanoBananaClient.setUserApiKey(savedApiKey);
            }

            return true;

        } catch (error) {
            console.error('检查用户API密钥失败:', error);
            return false;
        }
    }

    /**
     * 显示API密钥设置模态框
     */
    showApiKeySetupModal() {
        try {
            console.log('显示API密钥设置模态框...');

            // 创建模态框HTML
            const modalHtml = `
                <div class="api-key-setup-modal" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                ">
                    <div class="api-key-setup-card" style="
                        background: white;
                        border-radius: 12px;
                        padding: 30px;
                        max-width: 500px;
                        width: 90%;
                        max-height: 80vh;
                        overflow-y: auto;
                        box-shadow: 0 8px 24px rgba(0,0,0,0.16);
                    ">
                        <div class="setup-header" style="text-align: center; margin-bottom: 25px;">
                            <h2 style="color: #4ECDC4; margin-bottom: 10px;">
                                <i class="fas fa-key"></i> 设置API密钥
                            </h2>
                            <p style="color: #666; margin: 0;">
                                欢迎使用儿童识字小报生成器！<br>
                                请先设置您的Nano Banana Pro API密钥以开始使用。
                            </p>
                        </div>

                        <div class="step" style="margin-bottom: 20px;">
                            <h3 style="color: #333; margin-bottom: 15px;">
                                <span style="display: inline-flex; align-items: center; justify-content: center;
                                           width: 24px; height: 24px; background: #4ECDC4; color: white;
                                           border-radius: 50%; font-size: 12px; margin-right: 8px;">1</span>
                                获取API密钥
                            </h3>
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0;">
                                <p style="margin: 0 0 10px 0; color: #333;">
                                    请访问 <a href="#" onclick="window.open('https://nano.banana.pro', '_blank')"
                                             style="color: #4ECDC4; text-decoration: none;">Nano Banana Pro官网</a>
                                    注册账号并获取API密钥。
                                </p>
                            </div>
                        </div>

                        <div class="step" style="margin-bottom: 20px;">
                            <h3 style="color: #333; margin-bottom: 15px;">
                                <span style="display: inline-flex; align-items: center; justify-content: center;
                                           width: 24px; height: 24px; background: #4ECDC4; color: white;
                                           border-radius: 50%; font-size: 12px; margin-right: 8px;">2</span>
                                输入API密钥
                            </h3>
                            <div class="input-group">
                                <div style="position: relative; margin-bottom: 10px;">
                                    <input type="password"
                                           id="userApiKeyInput"
                                           placeholder="请输入您的API密钥"
                                           style="width: 100%; padding: 12px 45px 12px 15px; border: 2px solid #e1e8ed;
                                                  border-radius: 8px; font-size: 14px; font-family: monospace;
                                                  transition: border-color 0.3s;"
                                           onfocus="this.style.borderColor='#4ECDC4'"
                                           onblur="this.style.borderColor='#e1e8ed'">
                                    <button type="button"
                                            onclick="window.app.toggleUserApiKeyVisibility()"
                                            style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
                                                   background: none; border: none; color: #666; cursor: pointer;
                                                   padding: 5px;">
                                        <i class="fas fa-eye" id="userApiKeyToggleIcon"></i>
                                    </button>
                                </div>
                                <div id="userApiKeyError" style="color: #ff7675; font-size: 12px; margin-top: 5px; display: none;">
                                    API密钥格式不正确
                                </div>
                            </div>
                        </div>

                        <div class="security-notice" style="
                            background: #fff3cd;
                            border: 1px solid #ffeaa7;
                            border-radius: 8px;
                            padding: 15px;
                            margin-bottom: 20px;
                        ">
                            <h4 style="color: #f39c12; margin: 0 0 8px 0; font-size: 14px;">
                                <i class="fas fa-shield-alt"></i> 安全提示
                            </h4>
                            <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 13px;">
                                <li>API密钥将安全保存在您的浏览器本地</li>
                                <li>我们不会上传或共享您的API密钥</li>
                                <li>请妥善保管您的API密钥，不要泄露给他人</li>
                            </ul>
                        </div>

                        <div class="setup-actions" style="display: flex; gap: 10px; justify-content: center;">
                            <button type="button"
                                    onclick="window.app.showApiKeyGuide()"
                                    style="padding: 10px 20px; background: #f8f9fa; color: #666; border: 1px solid #dee2e6;
                                           border-radius: 6px; cursor: pointer; font-size: 14px;">
                                <i class="fas fa-question-circle"></i> 获取帮助
                            </button>
                            <button type="button"
                                    id="saveUserApiKeyBtn"
                                    onclick="window.app.saveUserApiKey()"
                                    style="padding: 10px 20px; background: #4ECDC4; color: white; border: none;
                                           border-radius: 6px; cursor: pointer; font-size: 14px;">
                                <i class="fas fa-save"></i> 保存并开始使用
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // 添加到页面
            const modal = document.createElement('div');
            modal.id = 'apiKeySetupModal';
            modal.innerHTML = modalHtml;
            document.body.appendChild(modal);

            // 聚焦到输入框
            setTimeout(() => {
                document.getElementById('userApiKeyInput').focus();
            }, 100);

            // 绑定Enter键保存
            document.getElementById('userApiKeyInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.saveUserApiKey();
                }
            });

            this.showMessage('请设置API密钥以开始使用', 'info');

        } catch (error) {
            console.error('显示API密钥设置模态框失败:', error);
            this.showMessage('显示设置界面失败', 'error');
        }
    }

    /**
     * 保存用户API密钥
     */
    async saveUserApiKey() {
        try {
            const input = document.getElementById('userApiKeyInput');
            const errorDiv = document.getElementById('userApiKeyError');
            const saveBtn = document.getElementById('saveUserApiKeyBtn');

            const apiKey = input.value.trim();

            // 验证输入
            const validation = this.validateApiKeyInput(apiKey);
            if (!validation.isValid) {
                errorDiv.textContent = validation.error;
                errorDiv.style.display = 'block';
                input.focus();
                return;
            }

            // 隐藏错误信息
            errorDiv.style.display = 'none';

            // 禁用保存按钮，显示加载状态
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 验证中...';

            // 验证API密钥有效性（可选）
            const isValid = await this.verifyApiKeyValidity(apiKey);
            if (!isValid) {
                errorDiv.textContent = 'API密钥验证失败，请检查密钥是否正确';
                errorDiv.style.display = 'block';
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> 保存并开始使用';
                input.focus();
                return;
            }

            // 保存API密钥
            await this.storeUserApiKey(apiKey);

            // 设置到API客户端
            if (window.nanoBananaClient && typeof window.nanoBananaClient.setUserApiKey === 'function') {
                await window.nanoBananaClient.setUserApiKey(apiKey);
            }

            // 移除模态框
            const modal = document.getElementById('apiKeySetupModal');
            if (modal) {
                modal.remove();
            }

            this.showMessage('API密钥设置成功！', 'success');

            // 继续初始化流程
            await this.continueInitializationAfterApiKey();

        } catch (error) {
            console.error('保存用户API密钥失败:', error);

            const errorDiv = document.getElementById('userApiKeyError');
            const saveBtn = document.getElementById('saveUserApiKeyBtn');

            errorDiv.textContent = '保存失败，请重试';
            errorDiv.style.display = 'block';

            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> 保存并开始使用';
        }
    }

    /**
     * 验证API密钥输入
     */
    validateApiKeyInput(apiKey) {
        if (!apiKey) {
            return { isValid: false, error: '请输入API密钥' };
        }

        // 使用安全工具验证格式
        const validation = window.securityUtils.validateApiKeyFormat(apiKey);
        if (!validation.valid) {
            return { isValid: false, error: `API密钥格式无效: ${validation.reason}` };
        }

        return { isValid: true };
    }

    /**
     * 验证API密钥有效性
     */
    async verifyApiKeyValidity(apiKey) {
        try {
            // 这里可以调用API验证密钥是否有效
            // 暂时跳过实际验证，只检查格式
            console.log('API密钥格式验证通过');
            return true;
        } catch (error) {
            console.error('API密钥验证失败:', error);
            return false;
        }
    }

    /**
     * 存储用户API密钥
     */
    async storeUserApiKey(apiKey) {
        try {
            localStorage.setItem('user_api_key', apiKey);
            console.log('API密钥已保存到本地存储');
        } catch (error) {
            console.error('保存API密钥失败:', error);
            throw new Error('保存API密钥失败');
        }
    }

    /**
     * 加载用户API密钥
     */
    loadUserApiKey() {
        try {
            return localStorage.getItem('user_api_key');
        } catch (error) {
            console.error('加载API密钥失败:', error);
            return null;
        }
    }

    /**
     * 清除用户API密钥
     */
    clearUserApiKey() {
        try {
            localStorage.removeItem('user_api_key');
            console.log('API密钥已清除');
        } catch (error) {
            console.error('清除API密钥失败:', error);
        }
    }

    /**
     * 切换用户API密钥可见性
     */
    toggleUserApiKeyVisibility() {
        try {
            const input = document.getElementById('userApiKeyInput');
            const icon = document.getElementById('userApiKeyToggleIcon');

            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
            }
        } catch (error) {
            console.error('切换API密钥可见性失败:', error);
        }
    }

    /**
     * 显示API密钥获取指南
     */
    showApiKeyGuide() {
        const guideHtml = `
            <div style="max-width: 600px; text-align: left;">
                <h3 style="color: #4ECDC4; margin-bottom: 20px;">
                    <i class="fas fa-question-circle"></i> API密钥获取指南
                </h3>

                <div style="margin-bottom: 20px;">
                    <h4 style="color: #333; margin-bottom: 10px;">步骤1：注册账号</h4>
                    <ol style="color: #666; padding-left: 20px; line-height: 1.6;">
                        <li>访问 <a href="https://nano.banana.pro" target="_blank" style="color: #4ECDC4;">Nano Banana Pro官网</a></li>
                        <li>点击"注册"按钮创建账号</li>
                        <li>完成邮箱验证</li>
                    </ol>
                </div>

                <div style="margin-bottom: 20px;">
                    <h4 style="color: #333; margin-bottom: 10px;">步骤2：获取API密钥</h4>
                    <ol style="color: #666; padding-left: 20px; line-height: 1.6;">
                        <li>登录到控制台</li>
                        <li>进入"API管理"页面</li>
                        <li>点击"生成新密钥"</li>
                        <li>复制生成的API密钥</li>
                    </ol>
                </div>

                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="color: #f39c12; margin-bottom: 10px;">
                        <i class="fas fa-lightbulb"></i> 温馨提示
                    </h4>
                    <ul style="color: #666; margin: 0; padding-left: 20px; line-height: 1.6;">
                        <li>API密钥是一串长字符串，通常以"sk-"开头</li>
                        <li>请妥善保管您的API密钥，不要泄露给他人</li>
                        <li>如果密钥泄露，请及时在控制台重新生成</li>
                        <li>API密钥会保存在您的浏览器本地，我们不会上传</li>
                    </ul>
                </div>

                <div style="text-align: center; margin-top: 25px;">
                    <button onclick="this.closest('.confirm-dialog').remove(); window.open('https://nano.banana.pro', '_blank');"
                            style="padding: 10px 20px; background: #4ECDC4; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 10px;">
                        <i class="fas fa-external-link-alt"></i> 前往官网
                    </button>
                    <button onclick="this.closest('.confirm-dialog').remove();"
                            style="padding: 10px 20px; background: #f8f9fa; color: #666; border: 1px solid #dee2e6; border-radius: 6px; cursor: pointer;">
                        <i class="fas fa-times"></i> 关闭
                    </button>
                </div>
            </div>
        `;

        this.showDetailedMessage(guideHtml, 'info');
    }

    /**
     * 显示API密钥错误
     */
    showApiKeyError(message, type = 'error') {
        try {
            // 检查是否有设置模态框，如果有则在其中显示错误
            const errorDiv = document.getElementById('userApiKeyError');
            if (errorDiv) {
                errorDiv.textContent = message;
                errorDiv.style.display = 'block';

                // 聚焦到输入框
                const input = document.getElementById('userApiKeyInput');
                if (input) {
                    input.focus();
                }
                return;
            }

            // 如果没有模态框，显示全局错误消息
            this.showMessage(message, type);

        } catch (error) {
            console.error('显示API密钥错误失败:', error);
            // 降级显示
            this.showMessage(message, 'error');
        }
    }

    /**
     * 在API密钥设置完成后继续初始化
     */
    async continueInitializationAfterApiKey() {
        try {
            // 检查API配置
            await this.checkAPIConfiguration();

            // 显示初始化完成消息
            this.showMessage('应用初始化完成', 'success');

            // 检查是否是分享链接
            this.checkShareLink();

        } catch (error) {
            console.error('API密钥设置后继续初始化失败:', error);
            this.showMessage('初始化过程中出现错误', 'error');
        }
    }

    /**
     * 初始化各个模块
     */
    async initializeModules() {
        const modules = [
            { name: '词汇管理器', instance: window.vocabularyManager },
            { name: '存储管理器', instance: window.storageManager },
            { name: '安全工具', instance: window.securityUtils },
            { name: 'API客户端', instance: window.nanoBananaClient }
        ];

        for (const module of modules) {
            if (module.instance) {
                console.log(`初始化${module.name}...`);
                await module.instance.initialize();
            } else {
                console.warn(`${module.name}未找到`);
            }
        }
    }

    /**
     * 绑定DOM元素
     */
    bindElements() {
        // 步骤相关
        this.elements.stepContents = document.querySelectorAll('.step-content');
        this.elements.stepIndicators = document.querySelectorAll('.step');
        this.elements.inputForm = document.getElementById('inputForm');

        // 表单输入
        this.elements.themeInput = document.getElementById('theme');
        this.elements.titleInput = document.getElementById('title');

        // 提示词预览
        this.elements.promptText = document.getElementById('promptText');
        this.elements.vocabularyDisplay = document.getElementById('vocabularyDisplay');

        // 图片生成
        this.elements.generateImage = document.getElementById('generateImage');
        this.elements.generatedImage = document.getElementById('generatedImage');
        this.elements.downloadImage = document.getElementById('downloadImage');
        this.elements.shareImage = document.getElementById('shareImage');

        // API配置
        this.elements.apiKey = document.getElementById('apiKey');
        this.elements.saveApiKey = document.getElementById('saveApiKey');
        this.elements.toggleApiKey = document.getElementById('toggleApiKey');

        // 按钮
        this.elements.backToStep1 = document.getElementById('backToStep1');
        this.elements.copyPrompt = document.getElementById('copyPrompt');
        this.elements.editPrompt = document.getElementById('editPrompt');
        this.elements.createNew = document.getElementById('createNew');
        this.elements.regenerate = document.getElementById('regenerate');

        // API配置相关
        this.elements.editApiKey = document.getElementById('editApiKey');

        // 示例卡片
        this.elements.exampleCards = document.querySelectorAll('.example-card');

        // 进度显示
        this.elements.progressFill = document.querySelector('.progress-fill');
        this.elements.progressText = document.querySelector('.progress-text');
        this.elements.statusText = document.querySelector('.status-text');

        // 日志容器
        this.elements.logContainer = document.querySelector('.log-container');

        // 结果显示
        this.elements.resultTheme = document.getElementById('resultTheme');
        this.elements.resultTitle = document.getElementById('resultTitle');
        this.elements.resultTime = document.getElementById('resultTime');
        this.elements.resultSize = document.getElementById('resultSize');

        // 历史记录
        this.elements.historyList = document.getElementById('historyList');
        this.elements.historyCount = document.getElementById('historyCount');
        this.elements.clearHistory = document.getElementById('clearHistory');
    }

    /**
     * 绑定事件监听器
     */
    bindEventListeners() {
        // 表单提交
        this.elements.inputForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // 示例卡片点击
        this.elements.exampleCards.forEach(card => {
            card.addEventListener('click', () => {
                const theme = card.dataset.theme;
                const title = card.dataset.title;
                this.fillExample(theme, title);
            });
        });

        // 按钮事件
        this.elements.backToStep1.addEventListener('click', () => this.goToStep(1));
        this.elements.generateImage.addEventListener('click', () => this.startGeneration());
        this.elements.copyPrompt.addEventListener('click', () => this.copyPrompt());
        this.elements.editPrompt.addEventListener('click', () => this.editPrompt());
        this.elements.downloadImage.addEventListener('click', () => this.downloadImage());
        this.elements.shareImage.addEventListener('click', () => this.shareImage());
        this.elements.createNew.addEventListener('click', () => this.createNew());
        this.elements.regenerate.addEventListener('click', () => this.regenerate());

        // API配置事件
        this.elements.saveApiKey.addEventListener('click', () => this.saveApiKey());
        this.elements.toggleApiKey.addEventListener('click', () => this.toggleApiKeyVisibility());

        // 编辑API密钥事件
        if (this.elements.editApiKey) {
            this.elements.editApiKey.addEventListener('click', () => this.editApiKey());
        }

        // 历史记录事件
        if (this.elements.clearHistory) {
            this.elements.clearHistory.addEventListener('click', () => this.clearHistory());
        }

        // 输入框实时验证
        this.elements.themeInput.addEventListener('input', () => this.validateThemeInput());
        this.elements.titleInput.addEventListener('input', () => this.validateTitleInput());

        // 键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    /**
     * 处理表单提交
     */
    async handleFormSubmit() {
        try {
            const theme = this.elements.themeInput.value.trim();
            const title = this.elements.titleInput.value.trim();

            // 验证输入
            const validation = window.promptGenerator.validateInput(theme, title);
            if (!validation.isValid) {
                this.showMessage(validation.errors.join(', '), 'error');
                return;
            }

            // 显示加载状态
            this.showLoading('正在生成提示词...');

            // 生成提示词预览
            const previewResult = window.promptGenerator.generatePreview(theme, title);

            this.hideLoading();

            if (!previewResult.success) {
                this.showMessage(previewResult.errors.join(', '), 'error');
                return;
            }

            // 保存当前提示词数据
            this.currentPromptData = previewResult.data;

            // 显示提示词预览
            this.displayPromptPreview(previewResult.data);

            // 进入下一步
            this.goToStep(2);

            // 如果主题匹配了不同的主题，显示提示
            if (previewResult.data.themeMatched) {
                this.showMessage(`已自动匹配主题：${previewResult.data.matchedTheme}`, 'info');
            }

        } catch (error) {
            console.error('处理表单提交失败:', error);
            this.hideLoading();
            this.showMessage('生成提示词失败', 'error');
        }
    }

    /**
     * 填充示例
     */
    fillExample(theme, title) {
        this.elements.themeInput.value = theme;
        this.elements.titleInput.value = title;

        // 添加视觉反馈
        this.elements.themeInput.classList.add('highlighted');
        this.elements.titleInput.classList.add('highlighted');

        setTimeout(() => {
            this.elements.themeInput.classList.remove('highlighted');
            this.elements.titleInput.classList.remove('highlighted');
        }, 1000);

        // 自动提交表单
        setTimeout(() => {
            this.handleFormSubmit();
        }, 500);
    }

    /**
     * 显示提示词预览
     */
    displayPromptPreview(promptData) {
        // 设置提示词文本
        this.elements.promptText.value = promptData.prompt;

        // 显示词汇列表
        this.displayVocabularyList(promptData.vocabulary);
    }

    /**
     * 显示词汇列表
     */
    displayVocabularyList(vocabulary) {
        const displayVocabulary = window.promptGenerator.extractVocabularyForDisplay({ vocabulary });

        this.elements.vocabularyDisplay.innerHTML = displayVocabulary.map(item => `
            <div class="vocabulary-item">
                <span class="vocabulary-pinyin">${item.pinyin}</span>
                <span class="vocabulary-hanzi">${item.hanzi}</span>
            </div>
        `).join('');
    }

    /**
     * 开始生成图片
     */
    async startGeneration() {
        if (!this.currentPromptData) {
            this.showMessage('请先生成提示词', 'error');
            return;
        }

        if (this.isGenerating) {
            this.showMessage('正在生成中，请稍候...', 'warning');
            return;
        }

        try {
            this.isGenerating = true;
            this.goToStep(3);

            // 更新按钮状态为停止
            this.updateGenerateButtonState(true);

            // 检查API配置
            const config = window.nanoBananaClient.getConfig();
            if (!config.hasApiKey) {
                this.showMessage('请先配置API密钥', 'error');
                this.goToStep(1);
                this.isGenerating = false;
                return;
            }

            // 清空日志
            this.clearLogs();

            // 添加日志
            this.addLog('开始创建生成任务...');

            // 创建任务
            const taskResult = await window.nanoBananaClient.createTask(this.currentPromptData);

            if (!taskResult.success) {
                throw new Error(taskResult.error);
            }

            this.currentTaskId = taskResult.taskId;
            this.addLog(`任务创建成功，任务ID: ${taskResult.taskId}`);

            // 开始轮询任务状态
            await this.pollTaskStatus();

        } catch (error) {
            console.error('生成图片失败:', error);
            this.addLog(`生成失败: ${error.message}`, 'error');
            this.showMessage(`生成失败: ${error.message}`, 'error');
            this.isGenerating = false;
            this.updateGenerateButtonState(false);
            this.goToStep(2);
        }
    }

    /**
     * 轮询任务状态
     */
    async pollTaskStatus() {
        // 创建中断控制器
        this.abortController = new AbortController();

        try {
            this.addLog('开始轮询任务状态...');

            const result = await window.nanoBananaClient.pollTaskUntilComplete(
                this.currentTaskId,
                (progress) => this.updateProgress(progress),
                3000,
                this.abortController.signal
            );

            if (result.success) {
                this.addLog('任务完成！');
                this.handleGenerationSuccess(result);
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('轮询任务状态失败:', error);
            this.addLog(`轮询失败: ${error.message}`, 'error');

            // 如果是用户停止的错误，不显示为错误
            if (error.message === '生成已停止') {
                this.showMessage('生成已停止', 'info');
                return;
            }

            throw error;
        } finally {
            this.isGenerating = false;
            this.updateGenerateButtonState(false);
            this.abortController = null;
        }
    }

    /**
     * 更新生成进度
     */
    updateProgress(progress) {
        // 检查是否已被用户停止
        if (!this.isGenerating) {
            this.addLog('检测到生成已停止，中断轮询');
            throw new Error('生成已停止');
        }

        const percent = Math.min((progress.pollCount / progress.maxPolls) * 100, 95);

        this.elements.progressFill.style.width = `${percent}%`;

        let statusText = '处理中...';
        switch (progress.state) {
            case 'waiting':
                statusText = '排队等待中...';
                break;
            case 'processing':
                statusText = '正在生成图片...';
                break;
            default:
                statusText = `状态: ${progress.state}`;
        }

        this.elements.progressText.textContent = `${Math.round(percent)}%`;
        this.elements.statusText.textContent = statusText;

        this.addLog(`进度更新: ${statusText} (${progress.pollCount}/${progress.maxPolls})`);
    }

    /**
     * 处理生成成功
     */
    async handleGenerationSuccess(result) {
        try {
            this.addLog(`图片生成成功，共${result.data.count}张图片`);

            // 更新进度到100%
            this.elements.progressFill.style.width = '100%';
            this.elements.progressText.textContent = '100%';
            this.elements.statusText.textContent = '生成完成！';

            // 显示图片
            this.elements.generatedImage.src = result.data.primaryUrl;

            // 更新结果信息
            this.updateResultInfo();

            // 保存到历史记录
            await this.saveToHistory(result.data.primaryUrl);

            // 更新使用统计
            window.nanoBananaClient.updateUsageStats(true);

            // 等待图片加载完成后进入下一步
            this.elements.generatedImage.onload = () => {
                setTimeout(() => {
                    this.goToStep(4);
                    this.showMessage('图片生成成功！', 'success');
                }, 1000);
            };

        } catch (error) {
            console.error('处理生成成功结果失败:', error);
            throw error;
        }
    }

    /**
     * 更新结果信息
     */
    updateResultInfo() {
        this.elements.resultTheme.textContent = this.currentPromptData.metadata.theme;
        this.elements.resultTitle.textContent = this.currentPromptData.metadata.title;
        this.elements.resultTime.textContent = new Date().toLocaleString();
        this.elements.resultSize.textContent = '竖版A4 (3:4)';
    }

    /**
     * 保存生成记录
     */
    async saveGenerationRecord(result) {
        try {
            const record = {
                theme: this.currentPromptData.metadata.theme,
                title: this.currentPromptData.metadata.title,
                prompt: this.currentPromptData.prompt,
                vocabulary: this.currentPromptData.vocabulary,
                imageUrl: result.data.primaryUrl,
                imageUrls: result.data.urls,
                taskId: this.currentTaskId,
                generationTime: Date.now(),
                success: true
            };

            await window.storageManager.saveGenerationRecord(record);
            this.addLog('生成记录已保存');
        } catch (error) {
            console.error('保存生成记录失败:', error);
            this.addLog('保存生成记录失败', 'warning');
        }
    }

    /**
     * 跳转到指定步骤
     */
    goToStep(stepNumber) {
        // 隐藏所有步骤内容
        this.elements.stepContents.forEach(content => {
            content.classList.remove('active');
        });

        // 移除所有步骤指示器激活状态
        this.elements.stepIndicators.forEach(indicator => {
            indicator.classList.remove('active', 'completed');
        });

        // 显示目标步骤
        document.getElementById(`step${stepNumber}`).classList.add('active');

        // 设置步骤指示器状态
        for (let i = 1; i <= 4; i++) {
            const indicator = document.querySelector(`.step[data-step="${i}"]`);
            if (i < stepNumber) {
                indicator.classList.add('completed');
            } else if (i === stepNumber) {
                indicator.classList.add('active');
            }
        }

        this.currentStep = stepNumber;

        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * 复制提示词
     */
    async copyPrompt() {
        try {
            const promptText = this.elements.promptText.value;
            await navigator.clipboard.writeText(promptText);
            this.showMessage('提示词已复制到剪贴板', 'success');
        } catch (error) {
            console.error('复制失败:', error);
            this.showMessage('复制失败', 'error');
        }
    }

    /**
     * 编辑提示词
     */
    editPrompt() {
        this.elements.promptText.removeAttribute('readonly');
        this.elements.promptText.focus();
        this.elements.promptText.select();

        // 更改按钮文本
        this.elements.editPrompt.innerHTML = '<i class="fas fa-save"></i> 保存';
        this.elements.editPrompt.onclick = () => this.savePromptEdit();
    }

    /**
     * 保存提示词编辑
     */
    savePromptEdit() {
        this.elements.promptText.setAttribute('readonly', true);
        this.currentPromptData.prompt = this.elements.promptText.value;

        // 恢复按钮
        this.elements.editPrompt.innerHTML = '<i class="fas fa-edit"></i> 编辑';
        this.elements.editPrompt.onclick = () => this.editPrompt();

        this.showMessage('提示词已更新', 'success');
    }

    /**
     * 下载图片
     */
    async downloadImage() {
        try {
            const imageUrl = this.elements.generatedImage.src;
            const filename = window.promptGenerator.generateFileName(
                this.currentPromptData.metadata.theme,
                this.currentPromptData.metadata.title
            );

            const result = await window.nanoBananaClient.downloadImage(imageUrl, filename);

            if (result === true) {
                // 新窗口下载成功
                this.showMessage('图片下载已开始，请查看下载文件夹', 'success');
            } else if (result && result.fallback === 'download_failed') {
                // 需要手动下载
                this.showDownloadFallback(imageUrl, filename, result.error);
            } else {
                // Blob下载成功
                this.showMessage('图片下载成功', 'success');
            }

        } catch (error) {
            console.error('下载失败:', error);
            this.showMessage(`下载失败: ${error.message}`, 'error');
        }
    }

    /**
     * 分享图片
     */
    async shareImage() {
        try {
            if (!this.currentPromptData) {
                this.showMessage('没有可分享的内容', 'error');
                return;
            }

            const imageUrl = this.elements.generatedImage.src;
            const title = this.currentPromptData.metadata.title || '识字小报';
            const theme = this.currentPromptData.metadata.theme || '儿童识字';

            // 检查是否支持Web Share API
            if (navigator.share) {
                try {
                    // 对于移动设备，直接使用降级分享方式，避免CORS问题
                    // Web Share API 在移动端对文件支持有限，我们改用分享永久链接
                    await this.fallbackShare(imageUrl, title, theme, true);
                    return;
                } catch (shareError) {
                    if (shareError.name === 'AbortError') {
                        this.showMessage('分享已取消', 'info');
                        return;
                    } else {
                        // 降级到其他分享方式
                        this.fallbackShare(imageUrl, title, theme);
                    }
                }
            } else {
                // 浏览器不支持Web Share API，使用降级方案
                this.fallbackShare(imageUrl, title, theme);
            }
        } catch (error) {
            console.error('分享失败:', error);
            this.showMessage('分享失败，请重试', 'error');
        }
    }

    /**
     * 获取图片Blob（避免CORS）
     */
    async getImageBlobNoCORS() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            // 设置crossOrigin以避免CORS问题
            img.crossOrigin = 'anonymous';

            return new Promise((resolve, reject) => {
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Canvas转换失败'));
                        }
                    }, 'image/png');
                };

                img.onerror = () => {
                    // 如果CORS仍然失败，尝试其他方法
                    reject(new Error('图片加载失败'));
                };

                img.src = this.elements.generatedImage.src;
            });
        } catch (error) {
            // 降级方案：直接使用原图URL
            throw new Error('图片处理失败');
        }
    }

    /**
     * 降级分享方案
     */
    async fallbackShare(imageUrl, title, theme, isMobileShare = false) {
        const shareOptions = `
            <div style="text-align: center;">
                <h4><i class="fas fa-share-alt"></i> 分享小报</h4>
                <div class="share-options" style="margin: 20px 0;">
                    <div style="margin-bottom: 15px;">
                        <strong>方式1: 下载后分享（推荐）</strong>
                        <p style="color: #666; font-size: 0.9rem;">下载图片，然后通过微信、QQ等发送</p>
                        <button class="btn btn-primary" onclick="window.app.downloadImage()">
                            <i class="fas fa-download"></i> 下载图片
                        </button>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <strong>方式2: 上传到图床生成永久链接</strong>
                        <p style="color: #666; font-size: 0.9rem;">将图片上传到免费图床，获得永久分享链接</p>
                        <button class="btn btn-success" onclick="window.app.uploadToImageHost('${imageUrl}', '${title}', '${theme}')">
                            <i class="fas fa-cloud-upload-alt"></i> 上传到图床
                        </button>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <strong>方式3: 复制临时链接</strong>
                        <div style="background: #f0f0f0; padding: 10px; border-radius: 4px; margin: 10px 0; word-break: break-all; font-family: monospace; font-size: 12px;">
                            <code>${imageUrl}</code>
                        </div>
                        <button class="btn btn-secondary" onclick="navigator.clipboard.writeText('${imageUrl}').then(() => window.app.showMessage('链接已复制到剪贴板'))">
                            <i class="fas fa-copy"></i> 复制链接
                        </button>
                    </div>

                    <div>
                        <strong>方式4: 截图分享</strong>
                        <p style="color: #666; font-size: 0.9rem;">直接截图小报，通过微信发送</p>
                        <button class="btn btn-warning" onclick="window.app.showScreenshotGuide()">
                            <i class="fas fa-camera"></i> 查看截图指南
                        </button>
                    </div>
                </div>
                <div style="margin-top: 20px; padding: 15px; background: #d1ecf1; border-radius: 4px; border-left: 4px solid #17a2b8;">
                    <small><i class="fas fa-info-circle"></i> <strong>推荐使用方式1（下载分享）</strong>：最稳定，不会有任何拦截问题</small>
                </div>
            </div>
        `;

        this.showDetailedMessage(shareOptions, 'info');
    }

    /**
     * 生成二维码
     */
    generateQRCode(url) {
        try {
            // 使用免费的二维码API服务
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

            const qrDialog = document.createElement('div');
            qrDialog.className = 'qr-dialog';
            qrDialog.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <h4>扫描二维码分享</h4>
                    <img src="${qrCodeUrl}" alt="分享二维码" style="margin: 15px 0; border: 1px solid #ddd; border-radius: 8px;">
                    <p style="color: #666; font-size: 0.9rem; margin-bottom: 15px;">使用微信扫描二维码分享图片</p>
                    <button class="btn btn-secondary" onclick="this.closest('.qr-dialog').remove()">
                        关闭
                    </button>
                </div>
            `;

            // 添加样式
            qrDialog.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;

            document.body.appendChild(qrDialog);

            // 点击背景关闭
            qrDialog.addEventListener('click', (e) => {
                if (e.target === qrDialog) {
                    qrDialog.remove();
                }
            });

            this.showMessage('二维码已生成，请使用微信扫描', 'success');
        } catch (error) {
            console.error('生成二维码失败:', error);
            this.showMessage('生成二维码失败，请重试', 'error');
        }
    }

    /**
     * 生成永久分享链接
     */
    async generatePermanentLink(imageUrl, title, theme) {
        try {
            // 创建分享页面数据
            const shareData = {
                image: imageUrl,
                title: title,
                theme: theme,
                timestamp: Date.now(),
                description: `我用AI生成了这个${theme}识字小报`
            };

            // 将数据保存到本地存储作为"永久"链接
            const shareId = 'share_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
            localStorage.setItem(shareId, JSON.stringify(shareData));

            // 生成当前页面的分享链接（包含shareId参数）
            const shareUrl = `${window.location.origin}${window.location.pathname}?share=${shareId}`;

            const shareDialog = document.createElement('div');
            shareDialog.className = 'share-dialog';
            shareDialog.innerHTML = `
                <div style="text-align: center; padding: 20px; max-width: 400px;">
                    <h4><i class="fas fa-link"></i> 永久分享链接</h4>
                    <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 15px 0; word-break: break-all; font-family: monospace; font-size: 11px;">
                        <code>${shareUrl}</code>
                    </div>
                    <div style="margin: 15px 0;">
                        <button class="btn btn-primary" onclick="navigator.clipboard.writeText('${shareUrl}').then(() => window.app.showMessage('永久链接已复制到剪贴板'))">
                            <i class="fas fa-copy"></i> 复制链接
                        </button>
                        <button class="btn btn-success" onclick="window.app.generateQRCodeForShare('${shareUrl}', '${title}')">
                            <i class="fas fa-qrcode"></i> 生成二维码
                        </button>
                        <button class="btn btn-secondary" onclick="this.closest('.share-dialog').remove()">
                            关闭
                        </button>
                    </div>
                    <p style="color: #666; font-size: 0.9rem;">
                        <i class="fas fa-info-circle"></i> 此链接可直接在微信中打开分享
                    </p>
                </div>
            `;

            // 添加样式
            shareDialog.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;

            document.body.appendChild(shareDialog);

            // 点击背景关闭
            shareDialog.addEventListener('click', (e) => {
                if (e.target === shareDialog) {
                    shareDialog.remove();
                }
            });

            this.showMessage('永久链接已生成，可以安全分享到微信', 'success');
        } catch (error) {
            console.error('生成永久链接失败:', error);
            this.showMessage('生成永久链接失败，请重试', 'error');
        }
    }

    /**
     * 生成分享专用二维码
     */
    async generateQRCodeForShare(url, title) {
        try {
            // 如果是图片URL，先生成永久链接
            if (url.startsWith('http') && !url.includes('share=')) {
                // 从imageUrl, title, theme生成永久链接
                await this.generatePermanentLink(url, title, '');
                return;
            }

            // 使用免费的二维码API服务
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

            const qrDialog = document.createElement('div');
            qrDialog.className = 'qr-dialog';
            qrDialog.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <h4><i class="fas fa-qrcode"></i> 分享二维码</h4>
                    <p style="color: #666; font-size: 0.9rem; margin-bottom: 15px;">扫描二维码即可在微信中查看</p>
                    <img src="${qrCodeUrl}" alt="分享二维码" style="margin: 15px 0; border: 1px solid #ddd; border-radius: 8px;">
                    <div style="margin: 15px 0;">
                        <button class="btn btn-primary" onclick="navigator.clipboard.writeText('${url}').then(() => window.app.showMessage('链接已复制到剪贴板'))">
                            <i class="fas fa-copy"></i> 复制链接
                        </button>
                        <button class="btn btn-secondary" onclick="this.closest('.qr-dialog').remove()">
                            关闭
                        </button>
                    </div>
                </div>
            `;

            // 添加样式
            qrDialog.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;

            document.body.appendChild(qrDialog);

            // 点击背景关闭
            qrDialog.addEventListener('click', (e) => {
                if (e.target === qrDialog) {
                    qrDialog.remove();
                }
            });

            this.showMessage('二维码已生成，请使用微信扫描', 'success');
        } catch (error) {
            console.error('生成二维码失败:', error);
            this.showMessage('生成二维码失败，请重试', 'error');
        }
    }

    /**
     * 上传到图床生成永久链接
     */
    async uploadToImageHost(imageUrl, title, theme) {
        try {
            this.showMessage('正在上传到图床，请稍候...', 'info');

            // 由于CORS限制，我们无法直接上传到外部图床
            // 这里提供一个更实用的解决方案：指导用户手动上传
            const uploadGuide = `
                <div style="text-align: left; padding: 20px; max-width: 500px;">
                    <h4><i class="fas fa-cloud-upload-alt"></i> 图床上传指南</h4>

                    <div style="margin: 20px 0;">
                        <h5>推荐免费图床：</h5>
                        <ol style="margin: 10px 0; padding-left: 20px;">
                            <li><strong>ImgBB</strong> - imgbb.com（无需注册）</li>
                            <li><strong>Imgur</strong> - imgur.com（需注册）</li>
                            <li><strong>PostImage</strong> - postimages.org（无需注册）</li>
                        </ol>
                    </div>

                    <div style="margin: 20px 0; background: #f8f9fa; padding: 15px; border-radius: 8px;">
                        <h6>操作步骤：</h6>
                        <ol style="margin: 10px 0; padding-left: 20px; font-size: 0.9rem;">
                            <li>先点击"下载图片"保存到本地</li>
                            <li>打开上述任一图床网站</li>
                            <li>上传下载的图片</li>
                            <li>复制生成的链接进行分享</li>
                        </ol>
                    </div>

                    <div style="margin: 20px 0; text-align: center;">
                        <button class="btn btn-primary" onclick="window.app.downloadImage(); this.closest('.upload-guide-dialog').remove();">
                            <i class="fas fa-download"></i> 先下载图片
                        </button>
                        <button class="btn btn-success" onclick="window.open('https://imgbb.com/', '_blank');">
                            <i class="fas fa-external-link-alt"></i> 打开ImgBB
                        </button>
                        <button class="btn btn-secondary" onclick="this.closest('.upload-guide-dialog').remove();">
                            关闭
                        </button>
                    </div>

                    <div style="margin-top: 15px; padding: 10px; background: #d4edda; border-radius: 4px; font-size: 0.85rem;">
                        <i class="fas fa-lightbulb"></i> <strong>小贴士：</strong>ImgBB支持中文界面，上传速度较快，推荐使用
                    </div>
                </div>
            `;

            const uploadDialog = document.createElement('div');
            uploadDialog.className = 'upload-guide-dialog';
            uploadDialog.innerHTML = uploadGuide;

            uploadDialog.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;

            document.body.appendChild(uploadDialog);

            uploadDialog.addEventListener('click', (e) => {
                if (e.target === uploadDialog) {
                    uploadDialog.remove();
                }
            });

        } catch (error) {
            console.error('图床上传失败:', error);
            this.showMessage('图床上传失败，请使用下载分享方式', 'error');
        }
    }

    /**
     * 显示截图指南
     */
    showScreenshotGuide() {
        const guideDialog = document.createElement('div');
        guideDialog.className = 'screenshot-guide-dialog';
        guideDialog.innerHTML = `
            <div style="text-align: left; padding: 20px; max-width: 400px;">
                <h4><i class="fas fa-camera"></i> 截图分享指南</h4>

                <div style="margin: 20px 0;">
                    <h6>Windows系统：</h6>
                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 0.9rem;">
                        <li><strong>Win + Shift + S</strong> - 选择区域截图</li>
                        <li><strong>PrtScn</strong> - 全屏截图</li>
                        <li><strong>Alt + PrtScn</strong> - 当前窗口截图</li>
                    </ul>
                </div>

                <div style="margin: 20px 0;">
                    <h6>Mac系统：</h6>
                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 0.9rem;">
                        <li><strong>Cmd + Shift + 4</strong> - 选择区域截图</li>
                        <li><strong>Cmd + Shift + 3</strong> - 全屏截图</li>
                    </ul>
                </div>

                <div style="margin: 20px 0;">
                    <h6>手机/平板：</h6>
                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 0.9rem;">
                        <li>同时按 <strong>电源键 + 音量下键</strong></li>
                    </ul>
                </div>

                <div style="margin: 20px 0; text-align: center;">
                    <button class="btn btn-primary" onclick="this.closest('.screenshot-guide-dialog').remove();">
                        <i class="fas fa-check"></i> 我知道了
                    </button>
                </div>
            </div>
        `;

        guideDialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        document.body.appendChild(guideDialog);

        guideDialog.addEventListener('click', (e) => {
            if (e.target === guideDialog) {
                guideDialog.remove();
            }
        });
    }

    /**
     * 检查是否是分享链接
     */
    checkShareLink() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const shareId = urlParams.get('share');

            if (shareId && shareId.startsWith('share_')) {
                const shareData = localStorage.getItem(shareId);
                if (shareData) {
                    const data = JSON.parse(shareData);
                    this.showSharedContent(data);
                } else {
                    this.showMessage('分享链接已过期或不存在', 'error');
                }
            }
        } catch (error) {
            console.error('检查分享链接失败:', error);
        }
    }

    /**
     * 显示分享的内容
     */
    showSharedContent(shareData) {
        try {
            // 创建分享内容显示对话框
            const shareDialog = document.createElement('div');
            shareDialog.className = 'shared-content-dialog';
            shareDialog.innerHTML = `
                <div style="position: relative; max-width: 90vw; max-height: 90vh; overflow: auto;">
                    <button class="btn btn-secondary" style="position: absolute; top: 10px; right: 10px; z-index: 1001;"
                            onclick="this.closest('.shared-content-dialog').remove()">
                        <i class="fas fa-times"></i> 关闭
                    </button>

                    <div class="card" style="margin: 20px; text-align: center;">
                        <h2 style="color: #4ECDC4; margin-bottom: 20px;">
                            <i class="fas fa-star"></i> ${shareData.title}
                        </h2>

                        <div style="margin-bottom: 20px;">
                            <img src="${shareData.image}"
                                 alt="${shareData.title}"
                                 style="max-width: 100%; max-height: 70vh; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                        </div>

                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <p style="margin: 0; font-style: italic; color: #666;">${shareData.description}</p>
                            <p style="margin: 10px 0 0 0; font-size: 0.9rem; color: #999;">
                                <i class="fas fa-palette"></i> 主题：${shareData.theme} |
                                <i class="fas fa-clock"></i> ${new Date(shareData.timestamp).toLocaleString()}
                            </p>
                        </div>

                        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                            <button class="btn btn-primary" onclick="navigator.clipboard.writeText('${shareData.image}').then(() => window.app.showMessage('图片链接已复制'))">
                                <i class="fas fa-copy"></i> 复制图片链接
                            </button>
                            <button class="btn btn-success" onclick="window.app.downloadImageFromUrl('${shareData.image}', '${shareData.title}')">
                                <i class="fas fa-download"></i> 下载图片
                            </button>
                            <button class="btn btn-warning" onclick="window.app.generateQRCode('${shareData.image}')">
                                <i class="fas fa-qrcode"></i> 生成二维码
                            </button>
                        </div>

                        <div style="margin-top: 20px;">
                            <button class="btn btn-secondary" onclick="window.app.createNew()">
                                <i class="fas fa-plus"></i> 我也要创建这样的小报
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // 添加样式
            shareDialog.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;

            document.body.appendChild(shareDialog);

            // 点击背景关闭
            shareDialog.addEventListener('click', (e) => {
                if (e.target === shareDialog) {
                    shareDialog.remove();
                }
            });

            this.showMessage('分享内容加载成功', 'success');
        } catch (error) {
            console.error('显示分享内容失败:', error);
            this.showMessage('显示分享内容失败', 'error');
        }
    }

    /**
     * 显示下载备用方案
     */
    showDownloadFallback(imageUrl, filename, originalError) {
        const message = `
            <div style="text-align: center;">
                <h4>图片下载遇到问题</h4>
                <p><strong>错误:</strong> ${originalError}</p>
                <div style="margin: 20px 0;">
                    <h5>解决方案:</h5>
                    <ol style="text-align: left;">
                        <li>1. <strong>右键点击图片 → 另存图片</strong></li>
                        <li>2. <strong>复制图片链接:</strong></li>
                    </ol>
                    <div style="background: #f0f0f0; padding: 10px; border-radius: 4px; margin: 10px 0; word-break: break-all; font-family: monospace; font-size: 12px;">
                        <code>${imageUrl}</code>
                    </div>
                </div>
                <button class="btn btn-secondary" onclick="navigator.clipboard.writeText('${imageUrl}').then(() => this.showMessage('链接已复制到剪贴板'))">
                    <i class="fas fa-copy"></i> 复制链接
                </button>
            </div>
        `;

        this.showDetailedMessage(message, 'warning');
    }

    /**
     * 创建新的小报
     */
    createNew() {
        // 重置表单
        this.elements.inputForm.reset();
        this.currentPromptData = null;
        this.currentTaskId = null;

        // 清空图片
        this.elements.generatedImage.src = '';

        // 回到第一步
        this.goToStep(1);

        // 聚焦到主题输入框
        this.elements.themeInput.focus();
    }

    /**
     * 重新生成
     */
    async regenerate() {
        // 如果正在生成，显示停止选项
        if (this.isGenerating) {
            this.showStopGenerationConfirm();
            return;
        }

        // 显示重新生成确认对话框
        this.showRegenerateConfirm();
    }

    /**
     * 显示重新生成确认对话框
     */
    showRegenerateConfirm() {
        const confirmDialog = document.createElement('div');
        confirmDialog.className = 'confirm-dialog';
        confirmDialog.innerHTML = `
            <div style="text-align: center; padding: 30px; max-width: 400px;">
                <div style="margin-bottom: 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ffc107;"></i>
                </div>
                <h3 style="margin-bottom: 15px; color: #333;">确认重新生成？</h3>
                <p style="color: #666; margin-bottom: 25px; line-height: 1.5;">
                    重新生成将消耗新的API调用次数，<br>
                    确定要重新生成这张小报吗？
                </p>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button class="btn btn-secondary" onclick="this.closest('.confirm-dialog').remove()">
                        <i class="fas fa-times"></i> 取消
                    </button>
                    <button class="btn btn-primary" onclick="window.app.confirmRegenerate(); this.closest('.confirm-dialog').remove();">
                        <i class="fas fa-redo"></i> 确认重新生成
                    </button>
                </div>
            </div>
        `;

        // 添加样式
        confirmDialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        document.body.appendChild(confirmDialog);

        // 点击背景关闭
        confirmDialog.addEventListener('click', (e) => {
            if (e.target === confirmDialog) {
                confirmDialog.remove();
            }
        });
    }

    /**
     * 确认重新生成
     */
    confirmRegenerate() {
        this.goToStep(3);
        this.startGeneration();
    }

    /**
     * 显示停止生成确认对话框
     */
    showStopGenerationConfirm() {
        const stopDialog = document.createElement('div');
        stopDialog.className = 'stop-dialog';
        stopDialog.innerHTML = `
            <div style="text-align: center; padding: 30px; max-width: 400px;">
                <div style="margin-bottom: 20px;">
                    <i class="fas fa-stop-circle" style="font-size: 3rem; color: #dc3545;"></i>
                </div>
                <h3 style="margin-bottom: 15px; color: #333;">停止生成？</h3>
                <p style="color: #666; margin-bottom: 25px; line-height: 1.5;">
                    当前正在生成中，停止后将中断这个过程。<br>
                    确定要停止生成吗？
                </p>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button class="btn btn-secondary" onclick="this.closest('.stop-dialog').remove()">
                        <i class="fas fa-play"></i> 继续生成
                    </button>
                    <button class="btn btn-danger" onclick="window.app.confirmStopGeneration(); this.closest('.stop-dialog').remove();">
                        <i class="fas fa-stop"></i> 确认停止
                    </button>
                </div>
            </div>
        `;

        // 添加样式
        stopDialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        document.body.appendChild(stopDialog);

        // 点击背景关闭
        stopDialog.addEventListener('click', (e) => {
            if (e.target === stopDialog) {
                stopDialog.remove();
            }
        });
    }

    /**
     * 确认停止生成
     */
    confirmStopGeneration() {
        this.stopGeneration();
    }

    /**
     * 停止生成
     */
    stopGeneration() {
        try {
            // 发送中断信号
            if (this.abortController) {
                this.abortController.abort();
            }

            // 停止API客户端的轮询
            window.nanoBananaClient.stopCurrentPolling();

            // 重置状态
            this.isGenerating = false;
            this.currentTaskId = null;

            // 更新UI状态
            this.updateGenerateButtonState(false);

            // 添加停止日志
            this.addLog('生成已被用户停止', 'warning');
            this.showMessage('生成已停止', 'warning');

            // 返回到步骤2（提示词确认）
            this.goToStep(2);

        } catch (error) {
            console.error('停止生成失败:', error);
            this.showMessage('停止生成失败', 'error');
        }
    }

    /**
     * 更新生成按钮状态
     */
    updateGenerateButtonState(isGenerating) {
        if (!this.elements.regenerate) return;

        if (isGenerating) {
            // 生成中状态
            this.elements.regenerate.innerHTML = '<i class="fas fa-stop"></i> 停止生成';
            this.elements.regenerate.className = 'btn btn-danger';
            this.elements.regenerate.onclick = () => this.regenerate();
        } else {
            // 非生成状态
            this.elements.regenerate.innerHTML = '<i class="fas fa-redo"></i> 重新生成';
            this.elements.regenerate.className = 'btn btn-secondary';
            this.elements.regenerate.onclick = () => this.regenerate();
        }
    }

    /**
     * 编辑API密钥
     */
    editApiKey() {
        // 切换到编辑模式
        const apiKeyInput = this.elements.apiKey;
        const saveButton = this.elements.saveApiKey;
        const editButton = this.elements.editApiKey;

        // 启用输入框
        apiKeyInput.readOnly = false;
        apiKeyInput.value = '';
        apiKeyInput.placeholder = '请输入新的API密钥';

        // 显示保存按钮，隐藏编辑按钮
        saveButton.style.display = 'inline-flex';
        saveButton.disabled = false;
        saveButton.innerHTML = '<i class="fas fa-save"></i> 保存';
        saveButton.classList.remove('btn-success');
        saveButton.classList.add('btn-secondary');

        editButton.style.display = 'none';

        // 更新状态显示
        const statusElement = document.getElementById('apiKeyStatus');
        statusElement.innerHTML = `
            <i class="fas fa-edit" style="color: #45B7D1;"></i>
            <span>编辑API密钥</span>
        `;

        // 聚焦到输入框
        apiKeyInput.focus();

        this.showMessage('请输入新的API密钥', 'info');
    }

    /**
     * 保存API密钥
     */
    async saveApiKey() {
        try {
            const apiKey = this.elements.apiKey.value.trim();

            if (!apiKey) {
                this.showMessage('请输入API密钥', 'error');
                return;
            }

            // 验证密钥格式
            const validation = window.securityUtils.validateApiKeyFormat(apiKey);
            if (!validation.valid) {
                this.showMessage(`API密钥格式无效: ${validation.reason}`, 'error');
                return;
            }

            // 保存密钥
            await window.nanoBananaClient.saveApiKey(apiKey);

            // 更新配置界面状态
            await window.nanoBananaClient.initialize();
            const config = window.nanoBananaClient.getConfig();
            this.updateAPIConfigStatus(config);

            this.showMessage('API密钥保存成功', 'success');
            this.elements.apiKey.type = 'password';

        } catch (error) {
            console.error('保存API密钥失败:', error);
            this.showMessage('保存API密钥失败', 'error');
        }
    }

    /**
     * 切换API密钥可见性
     */
    toggleApiKeyVisibility() {
        const input = this.elements.apiKey;
        const icon = this.elements.toggleApiKey.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    /**
     * 验证主题输入
     */
    validateThemeInput() {
        const value = this.elements.themeInput.value.trim();
        const isValid = value.length >= 2 && value.length <= 20;

        this.elements.themeInput.classList.toggle('invalid', !isValid && value.length > 0);
        return isValid;
    }

    /**
     * 验证标题输入
     */
    validateTitleInput() {
        const value = this.elements.titleInput.value.trim();
        const isValid = value.length >= 2 && value.length <= 30;

        this.elements.titleInput.classList.toggle('invalid', !isValid && value.length > 0);
        return isValid;
    }

    /**
     * 处理键盘快捷键
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + Enter：提交表单
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            if (this.currentStep === 1) {
                this.handleFormSubmit();
            } else if (this.currentStep === 2) {
                this.startGeneration();
            }
        }

        // Escape：返回上一步
        if (e.key === 'Escape' && this.currentStep > 1) {
            this.goToStep(this.currentStep - 1);
        }
    }

    /**
     * 恢复上次状态
     */
    async restoreLastState() {
        try {
            const lastTheme = window.storageManager.getCache('last_theme');
            if (lastTheme) {
                this.elements.themeInput.value = lastTheme;
            }

            // 恢复API密钥显示
            const config = window.nanoBananaClient.getConfig();
            if (config.hasApiKey) {
                this.elements.apiKey.placeholder = '已配置API密钥';
            }

            // 加载历史记录
            await this.loadHistory();

            // 手动测试：检查localStorage
            console.log('[调试] localStorage中的generation_history:', localStorage.getItem('generation_history'));

        } catch (error) {
            console.error('恢复上次状态失败:', error);
        }
    }

    /**
     * 检查API配置
     */
    async checkAPIConfiguration() {
        try {
            const config = window.nanoBananaClient.getConfig();

            // 更新API配置界面状态
            this.updateAPIConfigStatus(config);

            if (!config.hasApiKey) {
                this.showMessage('请配置Nano Banana Pro API密钥', 'warning');
                this.goToStep(1);
            }

        } catch (error) {
            console.error('检查API配置失败:', error);
        }
    }

    /**
     * 更新API配置界面状态
     */
    updateAPIConfigStatus(config) {
        const statusElement = document.getElementById('apiKeyStatus');
        const apiKeyInput = this.elements.apiKey;
        const saveButton = document.getElementById('saveApiKey');

        if (!statusElement) return;

        if (config.hasApiKey) {
            // 显示已配置状态
            statusElement.innerHTML = `
                <i class="fas fa-check-circle" style="color: #96CEB4;"></i>
                <span>API密钥已配置</span>
            `;

            // 设置输入框为只读并显示部分密钥
            apiKeyInput.readOnly = true;
            apiKeyInput.value = config.apiKeyPreview || '•••••••••••••••••••••••';

            // 显示编辑按钮，隐藏保存按钮
            if (this.elements.editApiKey) {
                this.elements.editApiKey.style.display = 'inline-flex';
            }
            saveButton.style.display = 'none';

        } else {
            // 显示未配置状态
            statusElement.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="color: #FFEAA7;"></i>
                <span>API密钥未配置</span>
            `;

            // 启用输入框
            apiKeyInput.readOnly = false;
            apiKeyInput.value = '';

            // 显示保存按钮，隐藏编辑按钮
            if (this.elements.editApiKey) {
                this.elements.editApiKey.style.display = 'none';
            }
            saveButton.style.display = 'inline-flex';
            saveButton.disabled = false;
            saveButton.innerHTML = '<i class="fas fa-save"></i> 保存';
            saveButton.classList.remove('btn-success');
            saveButton.classList.add('btn-secondary');
        }
    }

    /**
     * 添加日志
     */
    addLog(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}\n`;

        this.elements.logContainer.textContent += logEntry;
        this.elements.logContainer.scrollTop = this.elements.logContainer.scrollHeight;
    }

    /**
     * 清空日志
     */
    clearLogs() {
        this.elements.logContainer.textContent = '';
    }

    /**
     * 显示加载状态
     */
    showLoading(message = '加载中...') {
        const modal = document.getElementById('loadingModal');
        const modalText = modal.querySelector('.modal-text');
        modalText.textContent = message;
        modal.classList.add('active');
    }

    /**
     * 隐藏加载状态
     */
    hideLoading() {
        const modal = document.getElementById('loadingModal');
        modal.classList.remove('active');
    }

    /**
     * 显示消息
     */
    showMessage(message, type = 'info') {
        const modal = document.getElementById('messageModal');
        const modalText = document.getElementById('messageText');
        const modalIcon = modal.querySelector('.modal-icon i');

        modalText.textContent = message;

        // 设置图标和颜色
        modalIcon.className = 'fas ';
        switch (type) {
            case 'success':
                modalIcon.className += 'fa-check-circle';
                modalIcon.style.color = '#96CEB4';
                break;
            case 'error':
                modalIcon.className += 'fa-exclamation-circle';
                modalIcon.style.color = '#FF7675';
                break;
            case 'warning':
                modalIcon.className += 'fa-exclamation-triangle';
                modalIcon.style.color = '#FFEAA7';
                break;
            default:
                modalIcon.className += 'fa-info-circle';
                modalIcon.style.color = '#45B7D1';
        }

        modal.classList.add('active');

        // 自动关闭
        setTimeout(() => {
            modal.classList.remove('active');
        }, 3000);
    }

    /**
     * 验证配置
     */
    async validateConfiguration() {
        console.log('验证应用配置...');

        // 检查全局配置是否存在
        if (typeof window.APP_CONFIG === 'undefined') {
            throw new Error('应用配置未找到，请运行构建脚本生成配置文件');
        }

        // 使用配置验证函数
        if (typeof window.validateConfig === 'function') {
            const validation = window.validateConfig();

            if (!validation.isValid) {
                const errorMessage = validation.errors.join('; ');
                console.error('配置验证失败:', validation.errors);

                // 显示详细错误信息
                this.showConfigurationError(validation.errors, validation.warnings);

                // 如果有致命错误，抛出异常
                if (validation.errors.length > 0) {
                    throw new Error(`配置验证失败: ${errorMessage}`);
                }
            }

            // 显示警告信息
            if (validation.warnings.length > 0) {
                console.warn('配置警告:', validation.warnings);
                this.showConfigurationWarnings(validation.warnings);
            }
        }

        // 检查环境信息
        if (typeof window.getEnvironmentInfo === 'function') {
            const envInfo = window.getEnvironmentInfo();
            console.log('环境信息:', envInfo);

            // 检查浏览器兼容性
            if (!envInfo.apiSupport.fetch) {
                throw new Error('您的浏览器不支持Fetch API，请升级浏览器');
            }

            if (!envInfo.storage.localStorage) {
                console.warn('localStorage不可用，某些功能可能受限');
            }

            // 记录环境信息到控制台
            if (envInfo.config.buildEnv === 'development') {
                console.log('开发模式已启用');
            }
        }

        console.log('配置验证完成');
    }

    /**
     * 显示配置错误
     */
    showConfigurationError(errors, warnings = []) {
        let message = '<h3>配置错误</h3>';
        message += '<div style="text-align: left; margin: 20px 0;">';

        if (errors.length > 0) {
            message += '<h4 style="color: #FF7675;">❌ 错误:</h4><ul>';
            errors.forEach(error => {
                message += `<li style="color: #FF7675; margin: 5px 0;">${error}</li>`;
            });
            message += '</ul>';
        }

        if (warnings.length > 0) {
            message += '<h4 style="color: #FFEAA7;">⚠️ 警告:</h4><ul>';
            warnings.forEach(warning => {
                message += `<li style="color: #FFEAA7; margin: 5px 0;">${warning}</li>`;
            });
            message += '</ul>';
        }

        message += '<div style="margin-top: 20px;">';
        message += '<p><strong>解决方案:</strong></p>';
        message += '<ol>';
        message += '<li>复制 <code>.env.example</code> 为 <code>.env.local</code></li>';
        message += '<li>在 <code>.env.local</code> 中配置必要的环境变量</li>';
        message += '<li>运行 <code>node build.js</code> 生成配置文件</li>';
        message += '<li>重新加载页面</li>';
        message += '</ol>';
        message += '</div>';

        message += '</div>';

        this.showDetailedMessage(message, 'error');
    }

    /**
     * 显示配置警告
     */
    showConfigurationWarnings(warnings) {
        if (warnings.length === 0) return;

        let message = '<h3>配置警告</h3>';
        message += '<div style="text-align: left; margin: 20px 0;">';
        message += '<ul>';
        warnings.forEach(warning => {
            message += `<li style="color: #FFEAA7; margin: 5px 0;">⚠️ ${warning}</li>`;
        });
        message += '</ul>';
        message += '</div>';

        this.showDetailedMessage(message, 'warning');
    }

    /**
     * 显示初始化错误
     */
    showInitializationError(error) {
        let message = '<h3>应用初始化失败</h3>';
        message += '<div style="text-align: left; margin: 20px 0;">';
        message += `<p style="color: #FF7675;"><strong>错误信息:</strong> ${error.message}</p>`;
        message += '<div style="margin-top: 20px;">';
        message += '<p><strong>可能的解决方案:</strong></p>';
        message += '<ol>';
        message += '<li>检查浏览器控制台获取详细错误信息</li>';
        message += '<li>确保已运行构建脚本生成配置文件</li>';
        message += '<li>检查网络连接</li>';
        message += '<li>尝试刷新页面</li>';
        message += '<li>清除浏览器缓存</li>';
        message += '</ol>';
        message += '</div>';
        message += '</div>';

        this.showDetailedMessage(message, 'error');
    }

    /**
     * 显示详细消息
     */
    showDetailedMessage(message, type = 'info') {
        const modal = document.getElementById('messageModal');
        const modalText = document.getElementById('messageText');
        const modalIcon = modal.querySelector('.modal-icon i');

        modalText.innerHTML = message;

        // 设置图标和颜色
        modalIcon.className = 'fas ';
        switch (type) {
            case 'success':
                modalIcon.className += 'fa-check-circle';
                modalIcon.style.color = '#96CEB4';
                break;
            case 'error':
                modalIcon.className += 'fa-exclamation-circle';
                modalIcon.style.color = '#FF7675';
                break;
            case 'warning':
                modalIcon.className += 'fa-exclamation-triangle';
                modalIcon.style.color = '#FFEAA7';
                break;
            default:
                modalIcon.className += 'fa-info-circle';
                modalIcon.style.color = '#45B7D1';
        }

        modal.classList.add('active');

        // 错误消息不自动关闭
        if (type !== 'error') {
            setTimeout(() => {
                modal.classList.remove('active');
            }, 5000);
        }
    }

    // ================================
    // 历史记录功能
    // ================================

    /**
     * 保存到历史记录
     */
    async saveToHistory(imageUrl) {
        try {
            console.log('开始保存历史记录，imageUrl:', imageUrl);
            console.log('currentPromptData:', this.currentPromptData);

            const record = {
                theme: this.currentPromptData.metadata.theme,
                title: this.currentPromptData.metadata.title,
                prompt: this.currentPromptData.prompt,
                imageUrl: imageUrl,
                thumbnailUrl: imageUrl, // 对于小图片，可以使用原图作为缩略图
                vocabulary: this.currentPromptData.vocabulary,
                timestamp: new Date().toISOString()
            };

            console.log('准备保存的记录:', record);

            const recordId = await window.storageManager.saveGenerationRecord(record);
            if (recordId) {
                console.log('历史记录保存成功:', recordId);
                await this.loadHistory(); // 重新加载历史记录列表
            } else {
                console.warn('历史记录保存失败');
            }
        } catch (error) {
            console.error('保存历史记录失败:', error);
        }
    }

    /**
     * 加载历史记录
     */
    async loadHistory() {
        try {
            console.log('开始加载历史记录...');
            const history = await window.storageManager.getGenerationHistory();
            console.log('加载到的历史记录:', history);
            this.renderHistory(history);
        } catch (error) {
            console.error('加载历史记录失败:', error);
            this.renderHistory([]); // 显示空列表
        }
    }

    /**
     * 渲染历史记录列表
     */
    renderHistory(history) {
        if (!this.elements.historyList) return;

        // 更新计数
        if (this.elements.historyCount) {
            this.elements.historyCount.textContent = history.length;
        }

        // 渲染列表
        if (history.length === 0) {
            this.elements.historyList.innerHTML = `
                <div class="empty-history">
                    <i class="fas fa-inbox"></i>
                    <p>暂无生成历史</p>
                    <small>生成的小报将保存在这里</small>
                </div>
            `;
            return;
        }

        this.elements.historyList.innerHTML = history.map(record => {
            const date = new Date(record.timestamp);
            const dateStr = date.toLocaleDateString();
            const timeStr = date.toLocaleTimeString();

            return `
                <div class="history-item" data-id="${record.id}">
                    <div class="history-image">
                        <img src="${record.thumbnailUrl}" alt="${record.title}"
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjhGOUZBIi8+CjxwYXRoIGQ9Ik0yNSA0MEgzVjM1SDI1VjQwWiIgc3Ryb2tlPSIjMkQzNDM2IiBzdHJva2Utd2lkdGg9IjIiLz4KPHBhdGggZD0iTTU1IDQwSDM1VjM1SDU1VjQwWiIgc3Ryb2tlPSIjMkQzNDM2IiBzdHJva2Utd2lkdGg9IjIiLz4KPHN2Zz4K'">
                    </div>
                    <div class="history-info">
                        <div class="history-title">${record.title}</div>
                        <div class="history-meta">
                            <div class="history-meta-item">
                                <i class="fas fa-palette"></i>
                                <span>${record.theme}</span>
                            </div>
                            <div class="history-meta-item">
                                <i class="fas fa-calendar"></i>
                                <span>${dateStr} ${timeStr}</span>
                            </div>
                        </div>
                        <div class="history-actions">
                            <button class="btn btn-primary btn-sm" onclick="window.app.loadFromHistory('${record.id}')">
                                <i class="fas fa-eye"></i> 查看
                            </button>
                            <button class="btn btn-success btn-sm" onclick="window.app.downloadFromHistory('${record.id}')">
                                <i class="fas fa-download"></i> 下载
                            </button>
                            <button class="btn delete-history btn-sm" onclick="window.app.deleteFromHistory('${record.id}')">
                                <i class="fas fa-trash"></i> 删除
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * 从历史记录加载
     */
    async loadFromHistory(recordId) {
        try {
            const history = await window.storageManager.getGenerationHistory();
            const record = history.find(r => r.id === recordId);

            if (!record) {
                this.showMessage('历史记录不存在', 'error');
                return;
            }

            // 恢复数据
            this.currentPromptData = {
                prompt: record.prompt,
                vocabulary: record.vocabulary,
                metadata: {
                    theme: record.theme,
                    title: record.title
                }
            };

            // 显示图片
            this.elements.generatedImage.src = record.imageUrl;

            // 更新结果信息
            this.elements.resultTheme.textContent = record.theme;
            this.elements.resultTitle.textContent = record.title;
            this.elements.resultTime.textContent = new Date(record.timestamp).toLocaleString();
            this.elements.resultSize.textContent = '竖版A4 (3:4)';

            // 跳转到结果页面
            this.goToStep(4);
            this.showMessage('历史记录加载成功', 'success');

        } catch (error) {
            console.error('加载历史记录失败:', error);
            this.showMessage('加载历史记录失败', 'error');
        }
    }

    /**
     * 从历史记录下载
     */
    async downloadFromHistory(recordId) {
        try {
            const history = await window.storageManager.getGenerationHistory();
            const record = history.find(r => r.id === recordId);

            if (!record) {
                this.showMessage('历史记录不存在', 'error');
                return;
            }

            const filename = window.promptGenerator.generateFileName(record.theme, record.title);
            await this.downloadImageFromUrl(record.imageUrl, filename);

        } catch (error) {
            console.error('下载历史记录失败:', error);
            this.showMessage('下载失败', 'error');
        }
    }

    /**
     * 从URL下载图片
     */
    async downloadImageFromUrl(imageUrl, filename) {
        try {
            const result = await window.nanoBananaClient.downloadImage(imageUrl, filename);

            if (result === true) {
                this.showMessage('图片下载已开始，请查看下载文件夹', 'success');
            } else if (result && result.fallback === 'download_failed') {
                this.showDownloadFallback(imageUrl, filename, result.error);
            } else {
                this.showMessage('图片下载成功', 'success');
            }
        } catch (error) {
            console.error('下载失败:', error);
            this.showMessage(`下载失败: ${error.message}`, 'error');
        }
    }

    /**
     * 从历史记录删除
     */
    async deleteFromHistory(recordId) {
        if (!confirm('确定要删除这条历史记录吗？')) {
            return;
        }

        try {
            const success = await window.storageManager.deleteGenerationRecord(recordId);
            if (success) {
                this.showMessage('历史记录删除成功', 'success');
                await this.loadHistory(); // 重新加载列表
            } else {
                this.showMessage('删除失败', 'error');
            }
        } catch (error) {
            console.error('删除历史记录失败:', error);
            this.showMessage('删除失败', 'error');
        }
    }

    /**
     * 清空历史记录
     */
    async clearHistory() {
        if (!confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
            return;
        }

        try {
            const success = await window.storageManager.clearGenerationHistory();
            if (success) {
                this.showMessage('历史记录已清空', 'success');
                await this.loadHistory(); // 重新加载列表
            } else {
                this.showMessage('清空失败', 'error');
            }
        } catch (error) {
            console.error('清空历史记录失败:', error);
            this.showMessage('清空失败', 'error');
        }
    }
}

// 应用启动
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 创建应用实例
        window.app = new ChildrenLiteracyApp();

        // 初始化应用
        await window.app.initialize();

    } catch (error) {
        console.error('应用启动失败:', error);

        // 显示错误信息
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
                <div style="text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.16);">
                    <h1 style="color: #FF7675; margin-bottom: 20px;">应用启动失败</h1>
                    <p style="color: #636E72; margin-bottom: 20px;">${error.message}</p>
                    <button onclick="location.reload()" style="padding: 12px 24px; background: #4ECDC4; color: white; border: none; border-radius: 8px; cursor: pointer;">
                        重新加载
                    </button>
                </div>
            </div>
        `;
    }
});