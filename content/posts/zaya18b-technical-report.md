---
title: "8B MoE推理模型ZAYA1-8B挑战DeepSeek-R1"
date: "2026-05-08"
category: "model-tracking"
source_url: "https://arxiv.org/abs/2605.05365"
description: "Zyphra发布ZAYA1-8B推理模型，基于AMD全栈平台训练，仅700M活跃参数即可匹配DeepSeek-R1-0528。引入Markovian RSA测试时计算方法，在AIME'25达91.9%，HMMT'25达89.6%，大幅缩小与更大模型差距。"
cover_image: "/generated-covers/zaya18b-technical-report.svg"
is_featured: false
---
## 模型概述

Zyphra正式发布ZAYA1-8B推理模型，这是一款专注于推理能力的混合专家（MoE）架构模型。核心参数配置为700M活跃参数和8B总参数，基于Zyphra自研的MoE++架构打造。值得注意的是，该模型的预训练、中期训练和监督微调（SFT）全程在AMD全栈计算平台上完成。

## 核心技术

ZAYA1-8B采用创新的四阶段强化学习后训练流程：推理预热、数学与谜题强化学习、400任务RLVE-Gym课程学习，以及代码RL和行为RL。此外，团队引入**Markovian RSA**方法，能在测试时递归聚合并行推理轨迹，仅携带4K token的推理尾迹即可实现高效计算。

## 性能表现

在数学与编程基准测试中，ZAYA1-8B匹配或超越DeepSeek-R1-0528。采用Markovian RSA后，AIME'25达91.9%，HMMT'25达89.6%，显著缩小与Gemini-2.5 Pro、DeepSeek-V3.2等更大模型的性能差距。