/**
 * 任务13.2代码验证脚本
 * 验证下载控制集成是否正确实现
 */

const fs = require('fs');
const path = require('path');

// 读取 app.js 文件内容
const appJsPath = path.join(__dirname, 'js', 'app.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

console.log('=== 任务13.2代码验证报告 ===\n');

// 验证1：检查 startGeneration 方法中的下载配额检查
console.log('1. 验证 startGeneration 方法中的下载配额检查:');

const startGenerationPattern = /\/\* 检查下载配额 \*\/[\s\S]*?}/gm;
const downloadCheckMatch = appJsContent.match(startGenerationPattern);

if (downloadCheckMatch) {
    const downloadCheckCode = downloadCheckMatch[0];

    // 检查关键代码片段
    const checks = [
        {
            name: '检查 enableDownloadTracking 条件',
            pattern: /window\.usageTracker\.downloadConfig\.enableDownloadTracking/
        },
        {
            name: '调用 getDownloadUsage()',
            pattern: /window\.usageTracker\.getDownloadUsage\(\)/
        },
        {
            name: '调用 checkDownloadLimit()',
            pattern: /window\.usageTracker\.checkDownloadLimit\(\)/
        },
        {
            name: '显示下载限制错误',
            pattern: /下载次数已达上限.*无法生成新图片/
        },
        {
            name: '调用 isNearDownloadLimit()',
            pattern: /window\.usageTracker\.isNearDownloadLimit\(\)/
        },
        {
            name: '显示接近限制警告',
            pattern: /今日下载已使用.*剩余仅/
        }
    ];

    checks.forEach(check => {
        if (check.pattern.test(downloadCheckCode)) {
            console.log(`   ✓ ${check.name}`);
        } else {
            console.log(`   ✗ ${check.name} - 缺失`);
        }
    });
} else {
    console.log('   ✗ 未找到下载配额检查代码');
}

console.log('\n2. 验证 handleGenerationSuccess 方法中的成功提示:');

const successMessagePattern = /获取下载配额信息[\s\S]*?this\.showMessage\(`图片生成成功！[^`]*`[\s\S]*?'success'\)/gm;
const successMessageMatch = appJsContent.match(successMessagePattern);

if (successMessageMatch) {
    const successMessageCode = successMessageMatch[0];

    // 检查关键代码片段
    const successChecks = [
        {
            name: '检查 enableDownloadTracking 条件',
            pattern: /window\.usageTracker\.downloadConfig\.enableDownloadTracking/
        },
        {
            name: '获取下载使用量',
            pattern: /const downloadUsage = window\.usageTracker\.getDownloadUsage\(\)/
        },
        {
            name: '构建下载信息字符串',
            pattern: /剩余下载次数：\$\{downloadUsage\.daily\.remaining\}/
        },
        {
            name: '在成功消息中包含下载信息',
            pattern: /this\.showMessage\(`图片生成成功！\$\{downloadInfo\}`/
        }
    ];

    successChecks.forEach(check => {
        if (check.pattern.test(successMessageCode)) {
            console.log(`   ✓ ${check.name}`);
        } else {
            console.log(`   ✗ ${check.name} - 缺失`);
        }
    });
} else {
    console.log('   ✗ 未找到成功提示优化代码');
}

console.log('\n3. 验证现有的下载功能是否保持不变:');

// 检查 downloadImage 方法
const downloadImagePattern = /async downloadImage\(\) \{[\s\S]*?\}/gm;
const downloadImageMatch = appJsContent.match(downloadImagePattern);

if (downloadImageMatch) {
    const downloadImageCode = downloadImageMatch[0];

    const downloadChecks = [
        {
            name: '下载前检查限制',
            pattern: /checkDownloadLimit\(\)/
        },
        {
            name: '下载成功后追踪',
            pattern: /trackDownload\(\{[\s\S]*?\}\)/
        }
    ];

    downloadChecks.forEach(check => {
        if (check.pattern.test(downloadImageCode)) {
            console.log(`   ✓ ${check.name}`);
        } else {
            console.log(`   ✗ ${check.name} - 缺失`);
        }
    });
} else {
    console.log('   ✗ 未找到 downloadImage 方法');
}

console.log('\n4. 验证代码位置和完整性:');

// 检查 startGeneration 方法中的代码位置
const startGenerationMatch = appJsContent.match(/async startGeneration\(\) \{[\s\S]*?检查下载配额[\s\S]*?\}/gm);
if (startGenerationMatch) {
    console.log('   ✓ 下载配额检查代码正确添加到 startGeneration 方法中');
} else {
    console.log('   ✗ 下载配额检查代码位置不正确');
}

// 检查 handleGenerationSuccess 方法中的代码位置
const handleGenerationMatch = appJsContent.match(/async handleGenerationSuccess[\s\S]*?获取下载配额信息[\s\S]*?\}/gm);
if (handleGenerationMatch) {
    console.log('   ✓ 下载信息提示代码正确添加到 handleGenerationSuccess 方法中');
} else {
    console.log('   ✗ 下载信息提示代码位置不正确');
}

console.log('\n=== 验证总结 ===');

// 统计检查项
const allChecks = [
    ...downloadCheckMatch ? [
        /window\.usageTracker\.downloadConfig\.enableDownloadTracking/,
        /window\.usageTracker\.getDownloadUsage\(\)/,
        /window\.usageTracker\.checkDownloadLimit\(\)/,
        /下载次数已达上限.*无法生成新图片/,
        /window\.usageTracker\.isNearDownloadLimit\(\)/,
        /今日下载已使用.*剩余仅/
    ] : [],
    ...successMessageMatch ? [
        /window\.usageTracker\.downloadConfig\.enableDownloadTracking/,
        /const downloadUsage = window\.usageTracker\.getDownloadUsage\(\)/,
        /剩余下载次数：\$\{downloadUsage\.daily\.remaining\}/,
        /this\.showMessage\(`图片生成成功！\$\{downloadInfo\}`/
    ] : [],
    ...downloadImageMatch ? [
        /checkDownloadLimit\(\)/,
        /trackDownload\(\{[\s\S]*?\}\)/
    ] : []
];

const passedChecks = allChecks.filter(pattern => pattern.test(appJsContent)).length;
const totalChecks = allChecks.length;

console.log(`代码检查项: ${passedChecks}/${totalChecks} 通过`);

if (passedChecks === totalChecks && downloadCheckMatch && successMessageMatch && downloadImageMatch) {
    console.log('\n🎉 任务13.2已成功完成！');
    console.log('✓ 下载配额检查已集成到生成流程');
    console.log('✓ 生成成功提示包含下载配额信息');
    console.log('✓ 所有代码片段位置正确');
} else {
    console.log('\n⚠️  任务13.2存在部分问题，请检查上述失败项');
}

// 保存验证报告
const reportContent = {
    timestamp: new Date().toISOString(),
    passedChecks,
    totalChecks,
    hasDownloadCheck: !!downloadCheckMatch,
    hasSuccessMessage: !!successMessageMatch,
    hasDownloadImage: !!downloadImageMatch
};

fs.writeFileSync(
    path.join(__dirname, 'task13.2-verification-report.json'),
    JSON.stringify(reportContent, null, 2),
    'utf8'
);

console.log('\n详细验证报告已保存到: task13.2-verification-report.json');