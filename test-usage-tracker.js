/**
 * 使用量追踪功能测试脚本
 * 在Node.js环境中模拟浏览器localStorage和window对象
 */

// 模拟localStorage
const localStorage = {
    data: {},
    getItem: function(key) {
        return this.data[key] || null;
    },
    setItem: function(key, value) {
        this.data[key] = value;
    },
    removeItem: function(key) {
        delete this.data[key];
    },
    clear: function() {
        this.data = {};
    }
};

// 模拟window对象
global.window = {
    localStorage: localStorage,
    APP_CONFIG: {
        usage: {
            dailyLimit: 100,
            monthlyLimit: 3000,
            enableUsageTracking: true,
            resetTime: "00:00:00",
            warningThreshold: 0.8
        }
    },
    getConfig: function(path, defaultValue = null) {
        const keys = path.split('.');
        let current = this.APP_CONFIG;
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return defaultValue;
            }
        }
        return current;
    },
    storageManager: {
        getUsageStats: function() {
            return {
                generationCount: 0,
                apiCalls: 0,
                successfulGenerations: 0,
                firstUsed: null,
                lastUsed: null,
                version: '1.0.0'
            };
        },
        saveUsageStats: function(stats) {
            console.log('保存到 storageManager:', stats);
        }
    }
};

// 模拟document对象
global.document = {
    addEventListener: function(event, callback) {},
    createElement: function(tag) {
        return {
            style: {},
            appendChild: function() {},
            remove: function() {}
        };
    },
    body: {
        appendChild: function() {}
    }
};

// 模拟CustomEvent
global.CustomEvent = function(event, options) {
    this.type = event;
    this.detail = options ? options.detail : null;
};

global.dispatchEvent = function(event) {
    console.log('触发事件:', event.type, event.detail);
};

// 读取并执行 usage-tracker.js
const fs = require('fs');
const path = require('path');

const usageTrackerCode = fs.readFileSync(
    path.join(__dirname, 'js', 'usage-tracker.js'),
    'utf8'
);

// 移除浏览器特定的代码
const modifiedCode = usageTrackerCode
    .replace(/window\.usageTracker/g, 'global.window.usageTracker')
    .replace(/console\.log/g, 'console.log');

// 执行代码
eval(modifiedCode);

// 测试函数
function runTests() {
    console.log('\n=== 开始测试使用量追踪功能 ===\n');

    const tracker = global.window.usageTracker;
    let passedTests = 0;
    let totalTests = 0;

    // 测试1: 初始化检查
    totalTests++;
    console.log('测试1: 检查初始化状态');
    if (tracker.initialized === true) {
        console.log('✅ 通过 - 使用量追踪器已正确初始化');
        passedTests++;
    } else {
        console.log('❌ 失败 - 使用量追踪器初始化失败');
    }
    console.log('');

    // 测试2: 配置检查
    totalTests++;
    console.log('测试2: 检查配置');
    if (tracker.config.dailyLimit === 100 && tracker.config.monthlyLimit === 3000) {
        console.log('✅ 通过 - 配置加载正确');
        passedTests++;
    } else {
        console.log('❌ 失败 - 配置加载错误');
    }
    console.log('');

    // 测试3: 获取使用量
    totalTests++;
    console.log('测试3: 获取当前使用量');
    const usage = tracker.getUsage();
    if (usage.daily.count === 0 && usage.monthly.count === 0) {
        console.log('✅ 通过 - 初始使用量为0');
        console.log(`   今日: ${usage.daily.count}/${usage.daily.limit}`);
        console.log(`   本月: ${usage.monthly.count}/${usage.monthly.limit}`);
        passedTests++;
    } else {
        console.log('❌ 失败 - 初始使用量不为0');
    }
    console.log('');

    // 测试4: 追踪生成
    totalTests++;
    console.log('测试4: 追踪生成操作');
    const canGenerate1 = tracker.trackGeneration({ test: 'test1' });
    const usage2 = tracker.getUsage();
    if (canGenerate1 === true && usage2.daily.count === 1) {
        console.log('✅ 通过 - 成功追踪生成操作');
        console.log(`   使用量更新为: ${usage2.daily.count}`);
        passedTests++;
    } else {
        console.log('❌ 失败 - 生成追踪失败');
    }
    console.log('');

    // 测试5: 多次生成
    totalTests++;
    console.log('测试5: 多次生成追踪');
    tracker.trackGeneration({ test: 'test2' });
    tracker.trackGeneration({ test: 'test3' });
    const usage3 = tracker.getUsage();
    if (usage3.daily.count === 3) {
        console.log('✅ 通过 - 正确追踪多次生成');
        console.log(`   总使用量: ${usage3.daily.count}`);
        passedTests++;
    } else {
        console.log('❌ 失败 - 多次生成追踪错误');
    }
    console.log('');

    // 测试6: 存储功能
    totalTests++;
    console.log('测试6: 测试存储功能');
    const saved = tracker.saveUsage();
    const loadedData = tracker.loadUsage();
    if (saved && loadedData && loadedData.daily.count === 3) {
        console.log('✅ 通过 - 存储功能正常');
        console.log(`   存储的使用量: ${loadedData.daily.count}`);
        passedTests++;
    } else {
        console.log('❌ 失败 - 存储功能异常');
    }
    console.log('');

    // 测试7: 限制检查
    totalTests++;
    console.log('测试7: 测试限制检查');
    const canGenerate = tracker.checkDailyLimit();
    const isNearLimit = tracker.isNearLimit();
    if (canGenerate && !isNearLimit) {
        console.log('✅ 通过 - 限制检查正常');
        console.log(`   可以生成: ${canGenerate}`);
        console.log(`   接近限制: ${isNearLimit}`);
        passedTests++;
    } else {
        console.log('❌ 失败 - 限制检查异常');
    }
    console.log('');

    // 测试8: 使用量摘要
    totalTests++;
    console.log('测试8: 获取使用量摘要');
    const summary = tracker.getUsageSummary();
    if (summary && summary.daily && summary.monthly && summary.history !== undefined) {
        console.log('✅ 通过 - 摘要数据完整');
        console.log(`   今日百分比: ${summary.daily.percentage.toFixed(1)}%`);
        console.log(`   本月百分比: ${summary.monthly.percentage.toFixed(1)}%`);
        passedTests++;
    } else {
        console.log('❌ 失败 - 摘要数据不完整');
    }
    console.log('');

    // 测试9: 重置功能（模拟）
    totalTests++;
    console.log('测试9: 测试重置功能');
    const beforeReset = tracker.usageData.daily.count;

    // 模拟日期变化
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tracker.usageData.daily.date = tracker.formatDate(tomorrow);

    tracker.checkAndResetUsage();
    const afterReset = tracker.usageData.daily.count;

    if (beforeReset > 0 && afterReset === 0) {
        console.log('✅ 通过 - 重置功能正常');
        console.log(`   重置前: ${beforeReset}, 重置后: ${afterReset}`);
        passedTests++;
    } else {
        console.log('❌ 失败 - 重置功能异常');
    }
    console.log('');

    // 输出测试结果
    console.log('=== 测试完成 ===');
    console.log(`总测试数: ${totalTests}`);
    console.log(`通过测试: ${passedTests}`);
    console.log(`失败测试: ${totalTests - passedTests}`);
    console.log(`通过率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (passedTests === totalTests) {
        console.log('\n🎉 所有测试通过！使用量追踪功能工作正常。');
    } else {
        console.log('\n⚠️  部分测试失败，请检查相关功能。');
    }

    return passedTests === totalTests;
}

// 运行测试
try {
    const allTestsPassed = runTests();

    // 输出 localStorage 内容（用于调试）
    console.log('\n=== localStorage 数据 ===');
    console.log(localStorage.getItem('usage_tracker_data'));

} catch (error) {
    console.error('测试运行失败:', error);
}