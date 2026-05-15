/**
 * 环境检测工具模块
 * 
 * 提供智能环境检测功能，用于判断当前是否为生产构建环境，
 * 从而决定是否启用文件监听等开发环境特性。
 * 
 * @module env-detector
 */

/**
 * 判断环境变量值是否表示生产环境
 * 
 * @param value - 环境变量值
 * @returns 是否为生产环境值
 */
export function isProductionValue(value: string): boolean {
  const productionValues = [
    'production', // 生产环境
    'prod', // 生产环境
    'prd', // 生产环境
    'release', // 发布环境
    'staging', // 预发布环境
    'uat', // 预发布环境
  ];
  return productionValues.includes(value.toLowerCase().trim());
}

/**
 * 智能检测当前是否为生产构建环境
 * 通过多种方式综合判断，避免依赖单一环境变量
 * 
 * @param customEnvs 用户自定义的环境变量名称列表
 * @param debug 是否输出调试日志
 * @param loggerPrefix 日志前缀，用于区分不同模块
 * @returns 是否为生产环境
 */
export function detectProductionEnvironment(
  customEnvs: string[] = [],
  debug: boolean = false,
  loggerPrefix: string = '[env-detector]'
): boolean {
  const env = process.env;
  
  // 1. 检查自定义环境变量
  if (customEnvs.length > 0) {
    for (const envName of customEnvs) {
      const envValue = env[envName];
      if (envValue && isProductionValue(envValue)) {
        if (debug) {
          console.log(`${loggerPrefix} Detected production via custom env: ${envName}=${envValue}`);
        }
        return true;
      }
    }
  }

  // 2. 检查常见的环境变量
  const commonEnvNames = [
    'NODE_ENV',
    'BUILD_MODE',
    'VUE_APP_ENV',
    'VITE_NODE_ENV',
    'WEBPACK_MODE',
    'CI_ENV',
    'APP_ENV',
    'ENV',
    'DEPLOY_ENV',
    'RUN_MODE',
  ];

  for (const envName of commonEnvNames) {
    const envValue = env[envName];
    if (envValue && isProductionValue(envValue)) {
      if (debug) {
        console.log(`${loggerPrefix} Detected production via env: ${envName}=${envValue}`);
      }
      return true;
    }
  }

  // 3. 检查 CI/CD 环境标识
  if (env.CI === 'true' || env.CI === '1' || env.CI === 'yes') {
    if (debug) {
      console.log(`${loggerPrefix} Detected production via CI env`);
    }
    return true;
  }

  // 4. 检查 npm 生命周期事件（构建命令）
  if (env.npm_lifecycle_event) {
    const lifecycleEvent = env.npm_lifecycle_event.toLowerCase();
    if (lifecycleEvent.includes('build') || 
        lifecycleEvent.includes('prod') || 
        lifecycleEvent.includes('prd') ||
        lifecycleEvent.includes('release')) {
      if (debug) {
        console.log(`${loggerPrefix} Detected production via lifecycle event: ${env.npm_lifecycle_event}`);
      }
      return true;
    }
  }

  // 5. 检查进程参数（构建工具通常会传入特定参数）
  const processArgs = process.argv.join('').toLowerCase();
  if (processArgs.includes('build') || 
      processArgs.includes('production') ||
      processArgs.includes('--mode=production') ||
      processArgs.includes('--prod') ||
      processArgs.includes('--release')) {
    if (debug) {
      console.log(`${loggerPrefix} Detected production via process arguments`);
    }
    return true;
  }

  // 默认认为是开发环境
  return false;
}

/**
 * 判断是否应该启用文件监听
 * 
 * 注意：此函数仅在 isDev 参数未设置时调用，用于智能判断环境
 * 如果用户已通过 isDev 参数明确指定环境，则不会调用此函数
 * 
 * @param watch 用户设置的 watch 选项
 * @param customEnvs 用户自定义的环境变量列表
 * @param debug 是否输出调试日志
 * @param loggerPrefix 日志前缀
 * @returns 是否应该启用监听
 */
export function shouldEnableWatch(
  watch: boolean | 'auto',
  customEnvs: string[] = [],
  debug: boolean = false,
  loggerPrefix: string = '[env-detector]'
): boolean {
  // 用户显式设置为 true 或 false，直接返回
  if (typeof watch === 'boolean') {
    if (debug && !watch) {
      console.log(`${loggerPrefix} Watch disabled by user setting`);
    }
    return watch;
  }

  // 'auto' 模式：智能检测环境
  const isProduction = detectProductionEnvironment(customEnvs, debug, loggerPrefix);
  
  if (isProduction) {
    if (debug) {
      console.log(`${loggerPrefix} Auto-detected production mode - disabling watch`);
    }
    return false;
  }
  
  // 开发环境：启用监听
  if (debug) {
    console.log(`${loggerPrefix} Auto-detected development mode - enabling watch`);
  }
  
  return true;
}
