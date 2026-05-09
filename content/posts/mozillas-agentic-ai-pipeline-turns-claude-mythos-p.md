---
title: "Mozilla AI流水线用Claude揪出Firefox 271个老漏洞"
date: "2026-05-08"
category: "model-tracking"
source_url: "https://the-decoder.com/mozillas-agentic-ai-pipeline-turns-claude-mythos-preview-loose-and-finds-271-unknown-firefox-vulnerabilities/"
description: "Anthropic的Claude Mythos Preview在Firefox 150中发现271个未知安全漏洞，部分存在近20年。Mozilla采用agentic pipeline让AI自主构建测试用例并过滤误报，实现代码提交前的自动化安全检测。"
cover_image: "https://the-decoder.com/wp-content/uploads/2025/04/firefox_mozilla_logo_walls-2.png"
is_featured: false
---
## 事件背景

Mozilla近日披露，Anthropic的Claude Mythos Preview在Firefox 150浏览器中成功识别出271个此前未知的安全漏洞。这些漏洞的潜伏期令人震惊——部分安全缺陷已在代码库中存在近20年之久。

## 技术突破

Mozilla采用了一种创新的agentic pipeline（自主代理流水线）方案。这一流程的核心在于Claude能够自主构建并运行定制化的测试用例，通过自动化手段有效过滤误报结果。与传统安全检测依赖人工规则不同，AI能够主动发现代码逻辑中的潜在风险点。

## 落地实践

这一发现标志着AI安全检测从被动响应向主动预防的范式转变。Mozilla已明确表示，未来所有新提交代码在合并前都必须经过AI驱动的自动化安全扫描。这套系统的高效性已在Firefox项目中得到验证。

## 行业启示

271个漏洞的发现规模远超常规人工审计能力范围，证明大语言模型在代码审计领域具有独特优势。随着AI安全检测工具的成熟，软件开发的“安全左移”策略将获得更强大的技术支撑。