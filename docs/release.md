# 发布流程

## 概述

本项目提供了完整的自动化发布流程，支持正式版本和预发布版本（beta/alpha）的管理。

## 版本管理规范

项目采用 **语义化版本（Semantic Versioning）**，版本格式为 `major.minor.patch`：

| 版本类型 | 格式 | 说明 |
|----------|------|------|
| **Major** | `1.x.x` | 重大变更，不兼容的 API 更改 |
| **Minor** | `x.1.x` | 添加新功能，向后兼容 |
| **Patch** | `x.x.1` | 修复 bug，向后兼容 |

预发布版本格式：`major.minor.patch-prerelease.number`

| 预发布类型 | 格式示例 | 说明 |
|------------|----------|------|
| **Beta** | `1.0.0-beta.1` | 测试版本，功能基本完成 |
| **Alpha** | `1.0.0-alpha.1` | 内部测试版本，可能不稳定 |

## 版本升级命令

### 升级正式版本

```bash
# 升级补丁版本（修复 bug）
npm run bump:patch   # 1.0.0 → 1.0.1

# 升级次版本（添加新功能）
npm run bump:minor   # 1.0.0 → 1.1.0

# 升级主版本（重大变更）
npm run bump:major   # 1.0.0 → 2.0.0
```

### 升级预发布版本

```bash
# Beta 版本
npm run bump:beta           # 1.0.0 → 1.0.1-beta.1
npm run bump:major-beta     # 1.0.0 → 2.0.0-beta.1
npm run bump:minor-beta     # 1.0.0 → 1.1.0-beta.1

# Alpha 版本
npm run bump:alpha          # 1.0.0 → 1.0.1-alpha.1
npm run bump:major-alpha    # 1.0.0 → 2.0.0-alpha.1
npm run bump:minor-alpha    # 1.0.0 → 1.1.0-alpha.1
```

## 发布命令

### 一键发布命令

| 命令 | 说明 | 版本示例 |
|------|------|----------|
| `npm run publish:patch` | 升级补丁版本并发布到 npm | 1.0.0 → 1.0.1 |
| `npm run publish:minor` | 升级次版本并发布到 npm | 1.0.0 → 1.1.0 |
| `npm run publish:major` | 升级主版本并发布到 npm | 1.0.0 → 2.0.0 |
| `npm run publish:beta` | 升级 beta 版本并发布到 npm beta tag | 1.0.0 → 1.0.1-beta.1 |
| `npm run publish:alpha` | 升级 alpha 版本并发布到 npm alpha tag | 1.0.0 → 1.0.1-alpha.1 |

### 使用示例

```bash
# 修复了一个 bug，发布补丁版本
npm run publish:patch

# 添加了新功能，发布次版本
npm run publish:minor

# 有重大变更，发布主版本
npm run publish:major

# 发布测试版本（不影响 latest tag）
npm run publish:beta
```

## 版本升级规则

### 1. 从正式版本创建预发布版本

```bash
1.0.0 → npm run bump:beta → 1.0.1-beta.1
```

### 2. 同一预发布类型递增

```bash
1.0.1-beta.1 → npm run bump:beta → 1.0.2-beta.1
```

### 3. 切换预发布类型（重置编号）

```bash
1.0.1-beta.3 → npm run bump:alpha → 1.0.2-alpha.1
```

### 4. 从预发布版本升级到正式版本

```bash
1.0.1-beta.1 → npm run bump:patch → 1.0.2
```

## 自动化发布流程

执行发布命令时，会自动完成以下步骤：

```
1. 类型检查 (npm run lint)
       ↓
2. 运行测试 (npm run test)
       ↓
3. 构建项目 (npm run build)
       ↓
4. 版本升级 (自动更新 package.json)
       ↓
5. 发布到 npm
```

### 钩子脚本说明

`package.json` 中配置了以下钩子：

```json
{
  "scripts": {
    "prepublishOnly": "npm run lint && npm run test && npm run build"
  }
}
```

- **prepublishOnly**：在 `npm publish` 之前自动执行，确保代码质量

## 预发布版本使用说明

### 安装预发布版本

```bash
# 安装 beta 版本
npm install dev-proxy-cookie@beta

# 安装 alpha 版本
npm install dev-proxy-cookie@alpha

# 安装特定版本
npm install dev-proxy-cookie@1.0.0-beta.1
```

### 发布预发布版本的场景

1. **功能开发中**：发布 alpha 版本供团队内部测试
2. **功能完成待验证**：发布 beta 版本进行公测
3. **修复紧急 bug**：发布 beta 版本让用户提前验证

## 交互式发布脚本

项目还提供了完整的交互式发布脚本 `scripts/publish.sh`：

```bash
bash scripts/publish.sh
```

### 脚本功能

| 检查项 | 说明 |
|--------|------|
| npm 登录检查 | 自动检测并提示登录 |
| git 分支检查 | 确保在 main/master 分支 |
| git 状态检查 | 确保工作区干净 |
| 依赖检查 | 自动安装缺失的依赖 |
| 类型检查 | 执行 TypeScript 类型检查 |
| 测试运行 | 执行单元测试 |
| 构建项目 | 编译生成 dist 目录 |
| 版本选择 | 交互式选择版本升级类型 |
| 测试环境发布 | 支持先发布到测试环境 |
| 正式环境发布 | 发布到 npm 正式环境 |

### 脚本流程

```
┌─────────────────────────────────────────┐
│        dev-proxy-cookie 发布脚本        │
├─────────────────────────────────────────┤
│  1. 检查命令 (npm, git, node)          │
│  2. 检查 npm 登录状态                   │
│  3. 检查 git 分支                       │
│  4. 检查 git 状态                       │
│  5. 检查依赖安装                        │
│  6. 运行类型检查                        │
│  7. 运行测试                            │
│  8. 执行构建                            │
│  9. 选择版本升级类型                    │
│ 10. 可选：发布到测试环境                │
│ 11. 发布到正式环境                      │
│ 12. 创建 git tag 并推送                 │
└─────────────────────────────────────────┘
```

## 发布前检查清单

在执行发布命令之前，请确保：

- ✅ 所有代码已提交（`git status` 显示干净）
- ✅ 当前在正确的分支（main/master）
- ✅ 已登录 npm（`npm whoami` 能正常返回用户名）
- ✅ 依赖已安装（`node_modules` 目录存在）
- ✅ 测试全部通过（`npm test` 无失败）
- ✅ 类型检查通过（`npm run lint` 无错误）
- ✅ 构建成功（`npm run build` 生成 dist 目录）

## 常见问题

### Q: 发布时提示权限不足？

A: 确保已登录 npm 且拥有发布权限：

```bash
npm login
```

### Q: 预发布版本如何升级到正式版本？

A: 使用正式版本升级命令即可：

```bash
npm run publish:patch
```

### Q: 如何撤销发布？

A: 在 npm 上撤销发布需要在 24 小时内执行：

```bash
npm unpublish dev-proxy-cookie@<version>
```

### Q: 如何查看已发布的版本？

A:

```bash
npm view dev-proxy-cookie versions
```

## 发布流程最佳实践

1. **日常开发**：使用 `npm run bump:beta` 发布测试版本
2. **功能完成**：使用 `npm run publish:minor` 发布正式版本
3. **紧急修复**：使用 `npm run publish:patch` 发布补丁版本
4. **重大变更**：使用 `npm run publish:major` 发布主版本
5. **团队协作**：发布前使用 `scripts/publish.sh` 进行完整检查

## 版本号变更记录

| 版本 | 变更类型 | 说明 |
|------|----------|------|
| `1.0.0` | Initial | 初始版本 |
| `1.0.1` | Patch | 修复 bug |
| `1.1.0` | Minor | 添加新功能 |
| `2.0.0` | Major | 重大变更 |
| `1.0.0-beta.1` | Beta | Beta 测试版本 |
| `1.0.0-alpha.1` | Alpha | Alpha 测试版本 |
