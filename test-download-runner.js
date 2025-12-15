/**
 * 下载控制功能测试运行器
 * 用于Node.js环境下的自动化测试
 */

// 模拟浏览器环境
global.window = global;
global.localStorage = {
    data: {},
    getItem: function(key) {
        return this.data[key] || null;
    },
    setItem: function(key, value) {
        this.data[key] = value;
    },
    removeItem: function(key) {
        delete this.data[key];
    }
};
global.document = {
    createElement: function(tag) {
        return {
            style: {},
            appendChild: function() {},
            innerHTML: '',
            textContent: '',
            className: ''
        };
    },
    body: {
        appendChild: function() {},
        style: {},
        removeChild: function() {}
    },
    querySelector: function() { return null; },
    getElementById: function() { return null; }
};
global.CustomEvent = class CustomEvent {
    constructor(type, options) {
        this.type = type;
        this.detail = options ? options.detail : null;
    }
};
global.performance = {
    now: function() {
        return Date.now();
    }
};

// 模拟配置
global.APP_CONFIG = {
    usage: {
        dailyLimit: 100,
        monthlyLimit: 3000,
        enableUsageTracking: true,
        resetTime: "00:00:00",
        warningThreshold: 0.8
    },
    download: {
        dailyLimit: 50,
        monthlyLimit: 1000,
        enableDownloadTracking: true,
        resetTime: "00:00:00",
        warningThreshold: 0.8
    }
};
global.getConfig = function(path, defaultValue) {
    const keys = path.split('.');
    let current = global.APP_CONFIG;
    for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            return defaultValue;
        }
    }
    return current;
};

// 加载必要的模块
const fs = require('fs');
const path = require('path');

// 读取并执行文件内容
function loadScript(filename) {
    const filePath = path.join(__dirname, filename);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        // 移除HTML标签和script标签
        const scriptContent = content
            .replace(/<!DOCTYPE[^>]*>/, '')
            .replace(/<html[^>]*>.*?<\/html>/s, '')
            .replace(/<script[^>]*>/g, '')
            .replace(/<\/script>/g, '')
            .replace(/<[^>]*>/g, '');

        eval(scriptContent);
        console.log(`✓ 已加载 ${filename}`);
        return true;
    }
    console.log(`✗ 文件不存在: ${filename}`);
    return false;
}

// 测试结果收集
const testResults = {
    passed: 0,
    failed: 0,
    details: []
};

// 断言函数
function assert(condition, message) {
    if (condition) {
        testResults.passed++;
        testResults.details.push(`✓ ${message}`);
        console.log(`✓ ${message}`);
    } else {
        testResults.failed++;
        testResults.details.push(`✗ ${message}`);
        console.log(`✗ ${message}`);
    }
}

// 测试函数
async function runDownloadControlTests() {
    console.log('\n========== 开始下载控制功能测试 ==========\n');

    // 1. 基础初始化测试
    console.log('1. 测试UsageTracker初始化');
    try {
        loadScript('js/storage-manager.js');
        loadScript('js/usage-tracker.js');

        // 验证UsageTracker已创建
        assert(typeof window.usageTracker !== 'undefined', 'UsageTracker实例已创建');
        assert(window.usageTracker.initialized === true, 'UsageTracker已初始化');

        // 验证下载配置
        const downloadConfig = window.usageTracker.downloadConfig;
        assert(downloadConfig && typeof downloadConfig.dailyLimit === 'number', '下载配置正确加载');
    } catch (error) {
        assert(false, `初始化失败: ${error.message}`);
    }

    // 2. 下载追踪测试
    console.log('\n2. 测试下载追踪功能');
    try {
        // 重置数据
        window.usageTracker.resetAllUsage();

        // 测试首次下载
        const result1 = window.usageTracker.trackDownload();
        assert(result1 === true, '首次下载成功');

        const usage1 = window.usageTracker.getDownloadUsage();
        assert(usage1.daily.count === 1, '下载计数正确');
        assert(usage1.daily.percentage > 0, '使用百分比计算正确');

        // 测试多次下载
        window.usageTracker.trackDownload();
        window.usageTracker.trackDownload();

        const usage3 = window.usageTracker.getDownloadUsage();
        assert(usage3.daily.count === 3, '多次下载计数正确');
    } catch (error) {
        assert(false, `下载追踪测试失败: ${error.message}`);
    }

    // 3. 限制检查测试
    console.log('\n3. 测试下载限制检查');
    try {
        // 重置数据并设置小限制
        window.usageTracker.resetAllUsage();
        window.usageTracker.downloadConfig.dailyLimit = 3;

        // 测试限制内下载
        assert(window.usageTracker.checkDownloadLimit() === true, '限制内允许下载');

        // 填满配额
        window.usageTracker.trackDownload();
        window.usageTracker.trackDownload();
        window.usageTracker.trackDownload();

        // 测试达到限制
        assert(window.usageTracker.checkDownloadLimit() === false, '达到限制时阻止下载');

        // 测试超限下载
        const result = window.usageTracker.trackDownload();
        assert(result === false, '超限时下载被阻止');
    } catch (error) {
        assert(false, `限制检查测试失败: ${error.message}`);
    }

    // 4. 警告阈值测试
    console.log('\n4. 测试警告阈值');
    try {
        window.usageTracker.resetAllUsage();
        window.usageTracker.downloadConfig.dailyLimit = 10;
        window.usageTracker.downloadConfig.warningThreshold = 0.8;

        // 设置接近限制的使用量
        window.usageTracker.usageData.download.daily.count = 8;

        const isNearLimit = window.usageTracker.isNearDownloadLimit();
        assert(isNearLimit === true, '接近阈值时正确触发警告');

        // 设置低于阈值的使用量
        window.usageTracker.usageData.download.daily.count = 5;
        const isNotNearLimit = window.usageTracker.isNearDownloadLimit();
        assert(isNotNearLimit === false, '低于阈值时不触发警告');
    } catch (error) {
        assert(false, `警告阈值测试失败: ${error.message}`);
    }

    // 5. 数据持久化测试
    console.log('\n5. 测试数据持久化');
    try {
        window.usageTracker.resetAllUsage();

        // 设置测试数据
        window.usageTracker.downloadConfig.dailyLimit = 5;
        window.usageTracker.usageData.download.daily.count = 2;

        // 保存数据
        const saveResult = window.usageTracker.saveUsage();
        assert(saveResult === true, '数据保存成功');

        // 创建新实例测试加载
        const originalKey = window.usageTracker.storageKey;
        const testData = localStorage.getItem(originalKey);
        assert(testData !== null, '数据已保存到localStorage');

        // 解析保存的数据
        const parsedData = JSON.parse(testData);
        assert(parsedData.download.daily.count === 2, '保存的数据正确');
    } catch (error) {
        assert(false, `数据持久化测试失败: ${error.message}`);
    }

    // 6. 月度限制测试
    console.log('\n6. 测试月度限制');
    try {
        window.usageTracker.resetAllUsage();
        window.usageTracker.downloadConfig.monthlyLimit = 10;

        // 填满月度配额
        window.usageTracker.usageData.download.monthly.count = 10;

        const canDownload = window.usageTracker.checkDownloadLimit();
        assert(canDownload === false, '达到月度限制时阻止下载');

        const monthlyUsage = window.usageTracker.getDownloadUsage();
        assert(monthlyUsage.monthly.percentage === 100, '月度使用百分比计算正确');
    } catch (error) {
        assert(false, `月度限制测试失败: ${error.message}`);
    }

    // 7. 重置功能测试
    console.log('\n7. 测试重置功能');
    try {
        window.usageTracker.resetAllUsage();

        // 设置数据
        window.usageTracker.usageData.download.daily.count = 5;
        window.usageTracker.usageData.download.monthly.count = 50;

        // 执行日重置
        window.usageTracker.resetDownloadDailyUsage();

        assert(window.usageTracker.usageData.download.daily.count === 0, '日重置成功');
        assert(window.usageTracker.usageData.download.monthly.count === 50, '月重置不影响月度数据');

        // 执行月重置
        window.usageTracker.resetDownloadMonthlyUsage();
        assert(window.usageTracker.usageData.download.monthly.count === 0, '月重置成功');
    } catch (error) {
        assert(false, `重置功能测试失败: ${error.message}`);
    }

    // 8. 边界条件测试
    console.log('\n8. 测试边界条件');
    try {
        window.usageTracker.resetAllUsage();

        // 测试限制为0的情况
        window.usageTracker.downloadConfig.dailyLimit = 0;
        assert(window.usageTracker.checkDownloadLimit() === false, '限制为0时正确阻止');

        // 测试限制为1的情况
        window.usageTracker.downloadConfig.dailyLimit = 1;
        assert(window.usageTracker.checkDownloadLimit() === true, '限制为1且未使用时允许');

        window.usageTracker.trackDownload();
        assert(window.usageTracker.checkDownloadLimit() === false, '限制为1且已使用时阻止');
    } catch (error) {
        assert(false, `边界条件测试失败: ${error.message}`);
    }

    // 9. 性能测试
    console.log('\n9. 测试性能');
    try {
        window.usageTracker.resetAllUsage();
        window.usageTracker.downloadConfig.dailyLimit = 1000;

        const iterations = 100;
        const startTime = performance.now();

        for (let i = 0; i < iterations; i++) {
            window.usageTracker.trackDownload();
        }

        const endTime = performance.now();
        const duration = endTime - startTime;
        const avgTime = duration / iterations;

        assert(duration < 100, `${iterations}次操作总耗时少于100ms`);
        assert(avgTime < 1, `平均每次操作耗时少于1ms`);

        console.log(`  性能: ${iterations}次操作耗时${duration.toFixed(2)}ms，平均${avgTime.toFixed(3)}ms/次`);
    } catch (error) {
        assert(false, `性能测试失败: ${error.message}`);
    }

    // 输出测试结果
    console.log('\n========== 测试结果 ==========');
    console.log(`通过: ${testResults.passed}`);
    console.log(`失败: ${testResults.failed}`);
    console.log(`总计: ${testResults.passed + testResults.failed}`);

    const successRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1);
    console.log(`成功率: ${successRate}%\n`);

    // 详细结果
    console.log('详细结果:');
    testResults.details.forEach(detail => console.log(detail));

    return {
        passed: testResults.passed,
        failed: testResults.failed,
        successRate: parseFloat(successRate)
    };
}

// 运行测试
if (require.main === module) {
    runDownloadControlTests()
        .then(result => {
            if (result.failed === 0) {
                console.log('\n🎉 所有测试通过！');
                process.exit(0);
            } else {
                console.log('\n❌ 部分测试失败');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('测试运行出错:', error);
            process.exit(1);
        });
}

module.exports = { runDownloadControlTests };