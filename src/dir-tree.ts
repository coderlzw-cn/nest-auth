import fs from 'node:fs';
import path from 'node:path';

interface Options {
  excludeNodeModules?: boolean;
  maxDepth?: number;
  includePatterns?: RegExp[];
  excludePatterns?: RegExp[];
}

interface DirectoryNode {
  name: string;
  type: 'directory' | 'file';
  children?: DirectoryNode[];
  size?: number;
  path: string;
}

/**
 * 读取目录并返回匹配的文件/目录数组，保持目录层级结构
 * @param {string} dirPath - 要读取的目录路径
 * @param {Object} options - 配置选项
 * @param {boolean} options.excludeNodeModules - 是否排除 node_modules 目录
 * @param {number} options.maxDepth - 最大递归深度
 * @param {Array<RegExp|string>} options.includePatterns - 包含的文件/目录模式数组（正则表达式或字符串）
 * @param {Array<RegExp|string>} options.excludePatterns - 排除的文件/目录模式数组（正则表达式或字符串）
 * @returns {Array<Object>} 匹配的文件/目录数组，保持目录层级结构
 */
export function getDirectoryTree(dirPath: string, options: Options = {}) {
  const { excludeNodeModules = true, maxDepth = Infinity, includePatterns = [], excludePatterns = [] } = options;

  // 将字符串模式转换为正则表达式数组
  const includeRegexes = includePatterns.map((pattern) => (pattern instanceof RegExp ? pattern : new RegExp(pattern)));
  const excludeRegexes = excludePatterns.map((pattern) => (pattern instanceof RegExp ? pattern : new RegExp(pattern)));

  /**
   * 检查当前路径是否应被排除
   * @param {string} currentPath - 当前处理的路径
   * @returns {boolean}
   */
  function shouldExclude(currentPath: string) {
    const relativePath = path.relative(dirPath, currentPath);
    return excludeRegexes.some((regex) => regex.test(relativePath));
  }

  /**
   * 检查路径是否匹配任意一个模式
   * @param {string} p - 路径
   * @param {Array<RegExp>} patterns - 正则表达式数组
   * @returns {boolean}
   */
  function pathMatchesAny(p: string, patterns: RegExp[]) {
    return patterns.some((regex) => regex.test(p));
  }

  /**
   * 递归遍历目录并构建节点对象
   * @param {string} currentPath - 当前路径
   * @param {number} depth - 当前递归深度
   * @returns {DirectoryNode|null}
   */
  function buildDirectoryNode(currentPath: string, depth = 0): DirectoryNode | null {
    if (depth > maxDepth) return null;

    const stats = fs.statSync(currentPath);
    const name = path.basename(currentPath);
    const relativePath = path.relative(dirPath, currentPath);

    // 如果是目录
    if (stats.isDirectory()) {
      // 排除 node_modules 目录
      if (excludeNodeModules && name === 'node_modules') {
        return null;
      }

      // 检查是否应该排除此目录
      if (shouldExclude(currentPath)) {
        return null;
      }

      // 获取子目录和文件
      const children = fs
        .readdirSync(currentPath)
        .map((child) => buildDirectoryNode(path.join(currentPath, child), depth + 1))
        .filter(Boolean); // 过滤掉 null 值

      // 如果设置了包含模式，检查当前目录是否匹配
      if (includeRegexes.length > 0) {
        // 如果当前目录匹配包含模式，保留所有子节点
        const isDirIncluded = pathMatchesAny(relativePath, includeRegexes);
        if (isDirIncluded) {
          return { name, type: 'directory', children: children as DirectoryNode[], path: currentPath };
        }
        // 如果当前目录不匹配包含模式，但子节点中有匹配的，保留当前目录
        if (children.length > 0) {
          return { name, type: 'directory', children: children as DirectoryNode[], path: currentPath };
        }
        // 如果当前目录不匹配包含模式，且没有匹配的子节点，返回 null
        return null;
      }

      // 如果没有设置包含模式，保留所有目录
      return { name, type: 'directory', children: children as DirectoryNode[], path: currentPath };
    }

    // 如果是文件
    if (stats.isFile()) {
      // 如果设置了包含模式，检查文件是否匹配任何一个包含模式
      if (includeRegexes.length > 0 && !pathMatchesAny(relativePath, includeRegexes)) {
        return null;
      }
      // 检查是否应该排除此文件
      if (!shouldExclude(currentPath)) {
        return { name, type: 'file', size: stats.size, path: currentPath };
      }

      return null;
    }

    return null;
  }

  const result = buildDirectoryNode(dirPath);
  // 如果结果是目录，返回其子节点数组
  return result && result.type === 'directory' ? result.children : [];
}
