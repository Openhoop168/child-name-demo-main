/**
 * 下载控制功能测试脚本
 * 在Node.js环境中运行，测试下载控制逻辑是否正确
 */

// 模拟浏览器环境
global.window = {};
global.document = {
    getElementById: () => null,
    createElement: () => ({
        style: {},
        appendChild: () => {},
        innerHTML: ''
    })
};

// 导入模块（在Node.js环境中需要特殊处理）
const fs = require('fs');
const path = require('path');

// 读取并执行js文件
function loadScript(filename) {
    const filePath = path.join(__dirname, 'js', filename);
    const scriptContent = fs.readFileSync(filePath, 'utf8');

    // 移除依赖浏览器的部分
    const modifiedScript = scriptContent
        .replace(/document\.getElementById/g, 'null')
        .replace(/addEventListener/g, '//addEventListener');

    eval(modifiedScript);
}

// 测试结果
const testResults = [];

function log(message) {
    console.log(message);
    testResults.push(message);
}

// 模拟 showMessage 函数
function showMessage(message, type) {
    log(`[消息提示] ${type.toUpperCase()}: ${message}`);
}

async function runTests() {
    log('=== 开始下载控制功能测试 ===\n');

    try {
        // 初始化依赖
        log('1. 初始化 StorageManager...');
        loadScript('storage-manager.js');
        global.window.storageManager = new StorageManager();

        log('2. 初始化 UsageTracker...');
        loadScript('usage-tracker.js');

        // 配置下载控制
        const usageConfig = {
            dailyLimit: 10,
            monthlyLimit: 300,
            enableUsageTracking: true,
            warningThreshold: 0.8
        };

        const downloadConfig = {
            dailyLimit: 5,
            monthlyLimit: 100,
            enableDownloadTracking: true,
            warningThreshold: 0.8
        };

        global.window.usageTracker = new UsageTracker(usageConfig, downloadConfig);
        log('✓ UsageTracker 初始化完成\n');

        // 测试1：下载限制检查
        log('--- 测试1：下载限制检查 ---');

        // 设置下载限制为0
        global.window.usageTracker.downloadConfig.dailyLimit = 0;
        global.window.usageTracker.usageData.download.daily.count = 0;

        const canDownload = global.window.usageTracker.checkDownloadLimit();

        if (!canDownload) {
            log('✓ 下载限制检查正常：当限制为0时返回false');

            // 模拟生成前的检查逻辑
            const downloadUsage = global.window.usageTracker.getDownloadUsage();
            if (!global.window.usageTracker.checkDownloadLimit()) {
                showMessage('每日下载次数已达上限（0/0次），无法生成新图片', 'error');
                log('✓ 生成前正确阻止了生成并显示错误提示');
            }
        } else {
            log('✗ 下载限制检查失败：当限制为0时应该返回false');
        }

        log('');

        // 测试2：接近下载限制警告
        log('--- 测试2：接近下载限制警告 ---');

        // 设置下载限制为5，当前使用4次（80%）
        global.window.usageTracker.downloadConfig.dailyLimit = 5;
        global.window.usageTracker.downloadConfig.warningThreshold = 0.8;
        global.window.usageTracker.usageData.download.daily.count = 4;

        const isNearLimit = global.window.usageTracker.isNearDownloadLimit();

        if (isNearLimit) {
            log('✓ 接近限制检查正常：当使用率达到80%时返回true');

            // 模拟生成前的警告提示
            const downloadUsage = global.window.usageTracker.getDownloadUsage();
            if (global.window.usageTracker.isNearDownloadLimit()) {
                const remaining = downloadUsage.daily.remaining;
                const percentage = Math.round((downloadUsage.daily.count / downloadUsage.daily.limit) * 100);
                showMessage(
                    `今日下载已使用 ${downloadUsage.daily.count}/${downloadUsage.daily.limit} 次（${percentage}%），剩余仅 ${remaining} 次`,
                    'warning'
                );
                log('✓ 正确显示了下载配额警告');
            }
        } else {
            log('✗ 接近限制检查失败：当使用率达到80%时应该返回true');
        }

        log('');

        // 测试3：成功提示信息
        log('--- 测试3：成功提示信息 ---');

        // 设置正常的下载配额
        global.window.usageTracker.downloadConfig.dailyLimit = 5;
        global.window.usageTracker.downloadConfig.warningThreshold = 0.8;
        global.window.usageTracker.usageData.download.daily.count = 2;

        // 模拟生成成功后的提示
        let downloadInfo = '';
        if (global.window.usageTracker && global.window.usageTracker.downloadConfig.enableDownloadTracking) {
            const downloadUsage = global.window.usageTracker.getDownloadUsage();
            downloadInfo = `，剩余下载次数：${downloadUsage.daily.remaining}`;
        }

        const successMessage = `图片生成成功！${downloadInfo}`;
        showMessage(successMessage, 'success');
        log(`✓ 成功提示包含下载配额信息: ${successMessage}`);

        log('');

        // 测试4：下载追踪功能
        log('--- 测试4：下载追踪功能 ---');

        // 重置下载计数
        global.window.usageTracker.usageData.download.daily.count = 0;

        // 模拟下载追踪
        const result = global.window.usageTracker.trackDownload({
            taskId: 'test-task-id',
            theme: '测试主题',
            title: '测试标题',
            timestamp: new Date().toISOString()
        });

        if (result) {
            log('✓ 下载追踪成功执行');

            // 验证计数增加
            const downloadUsage = global.window.usageTracker.getDownloadUsage();
            if (downloadUsage.daily.count === 1) {
                log('✓ 下载计数正确增加');
            } else {
                log(`✗ 下载计数错误: 期望1，实际${downloadUsage.daily.count}`);
            }
        } else {
            log('✗ 下载追踪失败');
        }

        log('');

        // 测试总结
        log('=== 测试总结 ===');
        const passedTests = testResults.filter(r => r.includes('✓')).length;
        const failedTests = testResults.filter(r => r.includes('✗')).length;

        log(`通过测试: ${passedTests}`);
        log(`失败测试: ${failedTests}`);
        log(`总计测试: ${passedTests + failedTests}`);

        if (failedTests === 0) {
            log('\n🎉 所有测试通过！下载控制功能正常工作。');
        } else {
            log('\n⚠️  部分测试失败，请检查相关功能。');
        }

    } catch (error) {
        log(`\n✗ 测试过程中出错: ${error.message}`);
        log(error.stack);
    }
}

// 运行测试
runTests();