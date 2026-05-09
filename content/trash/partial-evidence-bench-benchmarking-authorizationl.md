---
title: "Partial Evidence Bench：专治企业AI的“假装完整”病"
date: "2026-05-08"
category: "model-tracking"
source_url: "https://arxiv.org/abs/2605.05379"
description: "研究者提出Partial Evidence Bench基准测试，通过72个任务评测AI代理在证据访问受限场景下的完整性判断能力。研究发现静默过滤会导致灾难性安全问题，而显式失败报告机制可有效消除隐患。该工作为治理关键型AI Agent失败提供了可量化的评估方案。"
cover_image: "/generated-covers/partial-evidence-bench-benchmarking-authorizationl.jpg"
is_featured: false
---
## 问题：AI的“看起来完整”陷阱

企业级AI代理常在受限检索系统、委托工作流和政策约束环境中运行。尽管访问控制可能正确执行，系统仍可能输出看似完整但实际缺失关键证据的答案——这是一种危险的“假完整性”。

## 解决方案：Partial Evidence Bench

研究者发布了一套确定性基准测试，包含三大场景家族：

- **尽职调查**（Due Diligence）
- **合规审计**（Compliance Audit）
- **安全事件响应**（Security Incident Response）

每个场景配备72个任务、ACL分区语料库，以及完整的Oracle评估体系。

## 核心发现

**基线测试结果触目惊心：**

- 静默过滤策略在所有场景中表现出**灾难性不安全**
- 显式失败报告机制在消除不安全完整性的同时，不会导致任务退化

**真实模型测试揭示差异化表现：**
不同模型在完整性处理上呈现显著差异——部分系统会过度声称完整性，部分保守低估，少部分能以企业可用形式报告不完整性。

## 意义

该工作为AI治理中的关键失败模式提供了可测量、可复现的评估框架，**无需人工评判或易污染的静态语料库**。