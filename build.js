#!/usr/bin/env node

/**
 * 儿童识字小报生成器 - 构建脚本
 * 读取环境变量并生成配置文件
 */

const fs = require('fs');
const path = require('path');

// 颜色输出工具
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

/**
 * 读取环境变量文件
 */
function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        logWarning(`环境变量文件不存在: ${filePath}`);
        return {};
    }

    logInfo(`读取环境变量文件: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    const envVars = {};

    content.split('\n').forEach(line => {
        line = line.trim();

        // 跳过注释和空行
        if (!line || line.startsWith('#')) {
            return;
        }

        // 解析环境变量
        const equalIndex = line.indexOf('=');
        if (equalIndex > 0) {
            const key = line.substring(0, equalIndex).trim();
            let value = line.substring(equalIndex + 1).trim();

            // 移除引号
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }

            envVars[key] = value;
        }
    });

    return envVars;
}

/**
 * 获取默认环境变量
 */
function getDefaultEnvVars() {
    return {
        // Nano Banana Pro API 配置
        NANO_BANANA_API_KEY: '',
        NANO_BANANA_API_ENDPOINT: 'https://api.kie.ai/api/v1/jobs/',
        DEFAULT_RESOLUTION: '4K',
        DEFAULT_ASPECT_RATIO: '3:4',
        DEFAULT_OUTPUT_FORMAT: 'png',

        // 应用配置
        APP_TITLE: '儿童识字小报生成器',
        APP_VERSION: '1.0.0',
        DEBUG_MODE: 'false',
        CACHE_EXPIRE_TIME: '86400',

        // 功能开关
        ENABLE_USAGE_STATS: 'true',
        ENABLE_GENERATION_HISTORY: 'true',
        ENABLE_CUSTOM_VOCABULARY: 'true',

        // 开发配置
        DEV_MODE: 'false',
        API_TIMEOUT: '30000',
        POLLING_INTERVAL: '3000',
        MAX_POLLING_ATTEMPTS: '60',

        // 构建信息
        BUILD_TIME: new Date().toISOString(),
        BUILD_ENV: process.env.NODE_ENV || 'development'
    };
}

/**
 * 验证必要的环境变量
 */
function validateEnvVars(envVars) {
    const required = [
        'NANO_BANANA_API_ENDPOINT',
        'APP_TITLE',
        'APP_VERSION'
    ];

    const missing = [];
    const warnings = [];

    required.forEach(key => {
        if (!envVars[key] || envVars[key] === '') {
            missing.push(key);
        }
    });

    // 检查API密钥
    if (!envVars.NANO_BANANA_API_KEY || envVars.NANO_BANANA_API_KEY === 'your_api_key_here') {
        warnings.push('NANO_BANANA_API_KEY 未设置或使用默认值，应用将需要在运行时配置');
    }

    // 验证数值类型的环境变量
    const numericVars = [
        'API_TIMEOUT',
        'POLLING_INTERVAL',
        'MAX_POLLING_ATTEMPTS',
        'CACHE_EXPIRE_TIME'
    ];

    numericVars.forEach(key => {
        if (envVars[key] && isNaN(parseInt(envVars[key]))) {
            warnings.push(`${key} 应该是数字，当前值: ${envVars[key]}`);
        }
    });

    // 验证布尔值类型的环境变量
    const booleanVars = [
        'DEBUG_MODE',
        'ENABLE_USAGE_STATS',
        'ENABLE_GENERATION_HISTORY',
        'ENABLE_CUSTOM_VOCABULARY',
        'DEV_MODE'
    ];

    booleanVars.forEach(key => {
        if (envVars[key] && !['true', 'false'].includes(envVars[key])) {
            warnings.push(`${key} 应该是 true 或 false，当前值: ${envVars[key]}`);
        }
    });

    return { missing, warnings };
}

/**
 * 替换模板变量
 */
function replaceTemplateVariables(template, envVars) {
    let result = template;

    // 替换所有 {{VARIABLE_NAME}} 格式的变量
    Object.keys(envVars).forEach(key => {
        const placeholder = `{{${key}}}`;
        result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), envVars[key]);
    });

    return result;
}

/**
 * 生成配置文件
 */
function generateConfigFile(envVars) {
    logInfo('生成配置文件...');

    const templatePath = path.join(__dirname, 'config.template.js');
    const outputPath = path.join(__dirname, 'js', 'config.js');

    if (!fs.existsSync(templatePath)) {
        throw new Error(`配置模板文件不存在: ${templatePath}`);
    }

    const template = fs.readFileSync(templatePath, 'utf8');
    const configContent = replaceTemplateVariables(template, envVars);

    // 确保输出目录存在
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, configContent);
    logSuccess(`配置文件已生成: ${outputPath}`);
}

/**
 * 生成包信息文件
 */
function generatePackageInfo(envVars) {
    logInfo('生成包信息文件...');

    const packageJsonPath = path.join(__dirname, 'package.json');
    const outputDir = path.join(__dirname, 'js');
    const outputPath = path.join(outputDir, 'package-info.json');

    let packageJson = {};
    if (fs.existsSync(packageJsonPath)) {
        packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    }

    const packageInfo = {
        name: packageJson.name || 'children-literacy-generator',
        version: packageJson.version || envVars.APP_VERSION || '1.0.0',
        description: packageJson.description || '儿童识字小报生成器',
        buildTime: envVars.BUILD_TIME,
        buildEnv: envVars.BUILD_ENV,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
    };

    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(packageInfo, null, 2));
    logSuccess(`包信息文件已生成: ${outputPath}`);
}

/**
 * 验证生成的配置文件
 */
function validateGeneratedConfig() {
    logInfo('验证生成的配置文件...');

    const configPath = path.join(__dirname, 'js', 'config.js');

    if (!fs.existsSync(configPath)) {
        throw new Error(`生成的配置文件不存在: ${configPath}`);
    }

    const content = fs.readFileSync(configPath, 'utf8');

    // 检查是否还有未替换的变量（排除代码中的合法模板变量）
    const allTemplateVars = content.match(/\{\{[^}]+\}\}/g);

    // 排除代码中用于逻辑判断的模板变量
    const unReplacedVars = allTemplateVars ? allTemplateVars.filter(v => {
        // 这些是代码中不应该被替换的模板变量
        const codeVars = [
            "{{') && current.endsWith('}}"
        ];
        return !codeVars.includes(v);
    }) : [];

    if (unReplacedVars.length > 0) {
        logWarning(`发现未替换的变量: ${unReplacedVars.join(', ')}`);
        return false;
    }

    // 检查基本语法
    try {
        // 简单的语法检查
        new Function(content);
        logSuccess('配置文件语法验证通过');
        return true;
    } catch (error) {
        logError(`配置文件语法错误: ${error.message}`);
        return false;
    }
}

/**
 * 显示构建信息
 */
function showBuildInfo(envVars) {
    log('\n📋 构建信息:', 'bright');
    log(`   应用名称: ${envVars.APP_TITLE}`, 'cyan');
    log(`   应用版本: ${envVars.APP_VERSION}`, 'cyan');
    log(`   构建时间: ${envVars.BUILD_TIME}`, 'cyan');
    log(`   构建环境: ${envVars.BUILD_ENV}`, 'cyan');
    log(`   API端点: ${envVars.NANO_BANANA_API_ENDPOINT}`, 'cyan');
    log(`   API密钥: ${envVars.NANO_BANANA_API_KEY ? '已配置' : '未配置'}`,
        envVars.NANO_BANANA_API_KEY ? 'green' : 'yellow');
}

/**
 * 主构建函数
 */
async function build() {
    try {
        log('🚀 开始构建儿童识字小报生成器配置...\n', 'bright');

        // 加载环境变量
        let envVars = {};

        // 从多个源加载环境变量
        const envFiles = ['.env.local', '.env'];
        for (const file of envFiles) {
            const fileEnv = loadEnvFile(path.join(__dirname, file));
            envVars = { ...envVars, ...fileEnv };
        }

        // 合并系统环境变量和默认值
        envVars = { ...getDefaultEnvVars(), ...process.env, ...envVars };

        // 验证环境变量
        const { missing, warnings } = validateEnvVars(envVars);

        if (missing.length > 0) {
            logError(`缺少必要的环境变量: ${missing.join(', ')}`);
            process.exit(1);
        }

        if (warnings.length > 0) {
            warnings.forEach(warning => logWarning(warning));
        }

        // 生成配置文件
        generateConfigFile(envVars);

        // 生成包信息文件
        generatePackageInfo(envVars);

        // 验证生成的文件
        const isValid = validateGeneratedConfig();
        if (!isValid) {
            logError('生成的配置文件验证失败');
            process.exit(1);
        }

        // 显示构建信息
        showBuildInfo(envVars);

        log('\n✨ 构建完成！', 'bright');
        log('   现在可以运行应用了:', 'cyan');
        log('   1. 直接打开 index.html 文件', 'cyan');
        log('   2. 或使用本地服务器运行', 'cyan');

    } catch (error) {
        logError(`构建失败: ${error.message}`);
        logError(error.stack);
        process.exit(1);
    }
}

/**
 * 清理生成的文件
 */
function clean() {
    logInfo('清理生成的配置文件...');

    const filesToClean = [
        path.join(__dirname, 'js', 'config.js'),
        path.join(__dirname, 'js', 'package-info.json')
    ];

    filesToClean.forEach(filePath => {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            logSuccess(`已删除: ${filePath}`);
        }
    });

    log('✨ 清理完成！', 'bright');
}

// 命令行参数处理
const command = process.argv[2];

switch (command) {
    case 'clean':
        clean();
        break;
    case 'build':
    default:
        build();
        break;
}

// 导出函数供其他脚本使用
module.exports = {
    build,
    clean,
    loadEnvFile,
    validateEnvVars,
    generateConfigFile
};