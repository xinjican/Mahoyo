# 久远寺邸

《魔法使之夜》美学风格的 Eleventy 静态博客。项目使用原生前端实现双主题、背景音乐、全文搜索、PJAX 页面切换和 Markdown 注音语法。

## 开发

```bash
npm install
npm run serve
```

本地构建：

```bash
npm run build
```

构建流程分为两步：

- `npm run build:site`：生成 Eleventy 静态页面到 `_site`
- `npm run build:search`：为 `_site` 生成 Pagefind 搜索索引

## 部署

GitHub Pages 部署由 `.github/workflows/deploy.yml` 触发。仓库部署在 `/Mahoyo` 子路径时，工作流会设置：

```bash
PATH_PREFIX=/Mahoyo
```

站点绝对 URL 默认配置在 `.eleventy.js`：

```js
https://xinjican.github.io/Mahoyo/
```

如果迁移到自定义域名，可以在构建环境中设置 `SITE_URL`。

## 写文章

文章放在 `src/posts/`，使用 Markdown front matter：

```md
---
title: 第一夜 · 始
date: 2026-05-23
description: 文章摘要
tags:
  - 随笔
---
```

注音语法：

```md
{苍崎青子|Aoko Aozaki}
```

会渲染为 HTML `ruby` 注音文本。

## 搜索

Pagefind 只索引带有 `data-pagefind-body` 的主内容区域，避免导航、播放器和搜索弹窗进入搜索结果。
