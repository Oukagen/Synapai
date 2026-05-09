---
title: "Mozilla用Claude Mythos Preview发现Firefox 271个未知漏洞"
date: "2026-05-08"
category: "model-tracking"
source_url: "https://the-decoder.com/mozillas-agentic-ai-pipeline-turns-claude-mythos-preview-loose-and-finds-271-unknown-firefox-vulnerabilities/"
description: "Mozilla的agentic AI pipeline利用Anthropic的Claude Mythos Preview，在Firefox 150中发现271个未知安全漏洞，包括20年前的老旧漏洞。AI自动构建测试用例过滤误报，未来所有代码提交前将自动检查。"
cover_image: "https://the-decoder.com/wp-content/uploads/2025/04/firefox_mozilla_logo_walls-2.png"
is_featured: false
---
## 背景

Mozilla与Anthropic合作，将Claude Mythos Preview部署至Firefox代码审查流程，测试AI在真实安全场景中的漏洞发现能力。

## 核心发现

- 在Firefox 150中发现**271个**此前未知的安全漏洞
- 漏洞年代跨度大，包含**近20年**历史遗留问题
- 部分漏洞属于高危级别

## 技术实现

Mozilla构建了一套**agentic pipeline**系统：

1. AI自动构建测试用例
2. 执行自动化测试流程
3. 过滤假阳性结果
4. 输出可信漏洞报告

整个流程无需人工干预，显著提升安全审查效率。

## 未来影响

Mozilla宣布：**所有新提交代码**在commit前必须通过AI安全检查，将AI安全审查纳入开发流程标准环节。