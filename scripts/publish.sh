#!/bin/bash

# ==============================================================================
# dev-proxy-cookie npm 自动化发布脚本
# 自动化发布流程：检查 → 构建 → 测试 → 版本升级 → 发布
# ==============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印信息函数
info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
  if ! command -v "$1" &> /dev/null; then
    error "命令 $1 未找到，请先安装"
    exit 1
  fi
}

# 检查 npm 登录状态
check_npm_login() {
  info "检查 npm 登录状态..."
  if ! npm whoami &> /dev/null; then
    warning "尚未登录 npm，尝试自动登录..."
    
    # 检查是否有 .npmrc 配置文件
    if [ -f "$HOME/.npmrc" ]; then
      info "检测到 $HOME/.npmrc 配置文件，检查认证信息..."
      if grep -q "//registry.npmjs.org/:_authToken" "$HOME/.npmrc"; then
        success "npm 已通过配置文件认证"
        return
      fi
    fi
    
    if [ -f ".npmrc" ]; then
      info "检测到项目 .npmrc 配置文件，检查认证信息..."
      if grep -q "//registry.npmjs.org/:_authToken" ".npmrc"; then
        success "npm 已通过项目配置文件认证"
        return
      fi
    fi
    
    warning "未找到 npm 认证信息，请手动登录"
    info "正在执行 npm login..."
    npm login
    
    if ! npm whoami &> /dev/null; then
      error "npm 登录失败"
      exit 1
    fi
  fi
  success "npm 已登录: $(npm whoami)"
}

# 检查当前分支
check_git_branch() {
  info "检查 git 分支..."
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    warning "当前分支不是 main/master，当前分支: $CURRENT_BRANCH"
    read -p "确定要从当前分支发布吗? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      error "取消发布"
      exit 0
    fi
  fi
  success "当前分支: $CURRENT_BRANCH"
}

# 检查 git 状态
check_git_status() {
  info "检查 git 状态..."
  if ! git diff --quiet; then
    error "存在未提交的更改，请先提交或 stash"
    git status
    exit 1
  fi
  if ! git diff --cached --quiet; then
    error "存在未提交的暂存更改，请先提交"
    git status
    exit 1
  fi
  success "git 工作区干净"
}

# 检查依赖
check_dependencies() {
  info "检查依赖安装..."
  if [ ! -d "node_modules" ]; then
    info "安装依赖..."
    npm install
  fi
  success "依赖已安装"
}

# 运行测试
run_tests() {
  info "执行测试..."
  npm test
  success "测试通过"
}

# 运行类型检查
run_lint() {
  info "执行类型检查..."
  npm run lint
  success "类型检查通过"
}

# 获取当前版本
get_current_version() {
  node -p "require('./package.json').version"
}

# 版本升级
bump_version() {
  local current_version=$(get_current_version)
  
  info "当前版本: $current_version"
  info "版本升级选项:"
  echo "  1) patch   ($current_version → X.X.X+1)    - 修复 bug"
  echo "  2) minor   ($current_version → X.X+1.0)    - 添加新功能"
  echo "  3) major   ($current_version → X+1.0.0)    - 重大变更/不兼容"
  echo "  4) beta    ($current_version → X.X.X+1-beta.1) - Beta 测试版"
  echo "  5) alpha   ($current_version → X.X.X+1-alpha.1) - Alpha 测试版"
  echo "  6) 自定义版本号"
  read -p "请选择版本升级类型 (1-6): " -n 1 -r
  echo

  case $REPLY in
    1) npm version patch ;;
    2) npm version minor ;;
    3) npm version major ;;
    4) npm run bump:beta ;;
    5) npm run bump:alpha ;;
    6) 
      read -p "请输入新版本号: " VERSION
      npm version "$VERSION" --no-git-tag-version
      ;;
    *)
      error "无效选项"
      exit 1
      ;;
  esac

  local new_version=$(get_current_version)
  success "版本已升级为: $new_version"
}

# 发布到 npm
publish_to_npm() {
  local new_version=$(get_current_version)
  local tag="latest"
  
  # 如果是预发布版本，使用对应的 tag
  if [[ "$new_version" == *"-beta"* ]]; then
    tag="beta"
  elif [[ "$new_version" == *"-alpha"* ]]; then
    tag="alpha"
  fi
  
  info "发布到 npm (tag: $tag)..."
  
  # 检查是否有 npmrc 配置
  if [ -f ".npmrc" ]; then
    info "检测到 .npmrc 配置文件"
  fi
  
  # 执行发布
  npm publish --tag "$tag"
  
  # 创建 git tag
  git tag "v$new_version"
  git push origin "v$new_version"
  
  success "发布成功！版本: v$new_version (tag: $tag)"
}

# 发布到 npm 测试环境
publish_to_npm_test() {
  info "发布到 npm 测试环境..."
  npm publish --tag test
  success "测试环境发布成功"
}

# 确认发布
confirm_publish() {
  local new_version=$(get_current_version)
  
  echo
  echo "=========================================="
  echo "          发布确认信息"
  echo "=========================================="
  echo "发布版本: v$new_version"
  echo "发布标签: $(if [[ "$new_version" == *"-"* ]]; then echo "beta/alpha"; else echo "latest"; fi)"
  echo "=========================================="
  
  read -p "确认发布到 npm 吗? (y/N) " -n 1 -r
  echo
  
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    info "已取消发布"
    exit 0
  fi
}

# 主流程
main() {
  echo "=========================================="
  echo "  dev-proxy-cookie npm 自动化发布脚本"
  echo "=========================================="
  echo

  # 检查必要命令
  info "检查必要命令..."
  check_command "npm"
  check_command "git"
  check_command "node"
  success "命令检查通过"

  # 检查 npm 登录
  check_npm_login

  # 检查 git 分支
  check_git_branch

  # 检查 git 状态
  check_git_status

  # 检查依赖
  check_dependencies

  # 运行类型检查
  run_lint

  # 运行测试
  run_tests

  # 版本升级
  bump_version

  # 确认发布
  confirm_publish

  # 询问是否发布到测试环境
  read -p "是否先发布到测试环境? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    publish_to_npm_test
    read -p "测试环境发布成功，是否继续发布到正式环境? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      info "已取消正式发布"
      exit 0
    fi
  fi

  # 发布到正式环境
  publish_to_npm

  echo
  echo "=========================================="
  success "发布流程完成！"
  echo "=========================================="
  local final_version=$(get_current_version)
  echo "发布版本: v$final_version"
  echo "npm 包地址: https://www.npmjs.com/package/dev-proxy-cookie"
  echo "安装命令: npm install dev-proxy-cookie@${final_version}"
  echo
}

# 开始执行
main "$@"
