"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Rss, Zap, Settings, Play, RefreshCw, Plus, Trash2, Key } from "lucide-react";

interface ApiConfig {
  provider: string;  // openai, zhipu, deepseek, kimi, etc.
  endpoint?: string; // Custom endpoint for compatible APIs
  model?: string;    // Specific model name
}

interface DataSource {
  id: string;
  name: string;
  url: string;
  type: "rss" | "url";
  category: string;
  enabled: boolean;
}

interface CategoryMapping {
  keywords: string[];
  category: string;
}

const llmProviders = [
  { id: "openai", label: "OpenAI GPT", endpoint: "https://api.openai.com/v1", defaultModel: "gpt-4o-mini" },
  { id: "zhipu", label: "智谱 GLM", endpoint: "https://open.bigmodel.cn/api/paas/v4", defaultModel: "glm-4-flash" },
  { id: "deepseek", label: "DeepSeek", endpoint: "https://api.deepseek.com/v1", defaultModel: "deepseek-chat" },
  { id: "kimi", label: "Kimi 月之暗面", endpoint: "https://api.moonshot.cn/v1", defaultModel: "moonshot-v1-8k" },
  { id: "qwen", label: "阿里通义千问", endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1", defaultModel: "qwen-turbo" },
  { id: "wenxin", label: "百度文心一言", endpoint: "https://qianfan.baidubce.com/v3", defaultModel: "ernie-4.0-8k-latest" },
  { id: "custom", label: "自定义（兼容 OpenAI 格式）", endpoint: "", defaultModel: "" },
];

const defaultCategories = [
  { id: "tech-giants", label: "大厂动态" },
  { id: "industry-pulse", label: "行业脉搏" },
  { id: "model-tracking", label: "模型追踪" },
  { id: "tool-unboxing", label: "工具开箱" },
  { id: "hot-tools", label: "热门skill" },
];

export default function AutomationPage() {
  const [activeTab, setActiveTab] = useState<"api" | "sources" | "schedule" | "prompt">("api");
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    provider: "openai",
    endpoint: "",
    model: "",
  });

  const [dataSources, setDataSources] = useState<DataSource[]>([
    { id: "1", name: "BBC 科技", url: "https://feeds.bbci.co.uk/news/technology/rss.xml", type: "rss", category: "tech-giants", enabled: true },
    { id: "2", name: "TechCrunch", url: "https://techcrunch.com/feed/", type: "rss", category: "industry-pulse", enabled: true },
    { id: "3", name: "The Verge", url: "https://www.theverge.com/rss/index.xml", type: "rss", category: "tech-giants", enabled: true },
    { id: "4", name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index", type: "rss", category: "industry-pulse", enabled: true },
  ]);

  const [schedule, setSchedule] = useState({
    enabled: false,
    interval: "daily", // hourly, daily, weekly
    time: "09:00",
  });

  const [defaultCoverImage, setDefaultCoverImage] = useState("");

  const [customPrompt, setCustomPrompt] = useState(`请根据以下内容生成一篇突触简报的文章：

## 要求
- 标题简洁有力，不超过30字
- 摘要100字以内，突出核心信息
- 自动分类到对应板块
- 支持的板块：大厂动态、行业脉搏、模型追踪、工具开箱、热门skill
- 正文用Markdown格式，层次分明

## 内容
{content}

## 输出格式
标题：
摘要：
分类：
正文：`);

  // Load saved configurations on mount
  useEffect(() => {
    // Load API config (provider, endpoint, model)
    const savedApiConfig = localStorage.getItem("automation_api_config");
    if (savedApiConfig) {
      try {
        const parsed = JSON.parse(savedApiConfig);
        setApiConfig({
          provider: parsed.provider || "openai",
          endpoint: parsed.endpoint || "",
          model: parsed.model || "",
        });
      } catch (e) {
        console.error("Failed to parse saved API config");
      }
    }

    const savedDataSources = localStorage.getItem("automation_data_sources");
    if (savedDataSources) {
      try {
        setDataSources(JSON.parse(savedDataSources));
      } catch (e) {
        console.error("Failed to parse saved data sources");
      }
    }

    const savedSchedule = localStorage.getItem("automation_schedule");
    if (savedSchedule) {
      try {
        setSchedule(JSON.parse(savedSchedule));
      } catch (e) {
        console.error("Failed to parse saved schedule");
      }
    }

    const savedPrompt = localStorage.getItem("automation_prompt");
    if (savedPrompt) {
      setCustomPrompt(savedPrompt);
    }
  }, []);

  const handleSaveApiKeys = () => {
    const selectedProvider = llmProviders.find(p => p.id === apiConfig.provider);
    const configToSave = {
      provider: apiConfig.provider,
      endpoint: apiConfig.endpoint || selectedProvider?.endpoint,
      model: apiConfig.model || selectedProvider?.defaultModel,
    };
    localStorage.setItem("automation_api_config", JSON.stringify(configToSave));
    alert("配置已保存");
  };

  const handleSaveDataSources = () => {
    localStorage.setItem("automation_data_sources", JSON.stringify(dataSources));
    alert("数据源已保存");
  };

  const handleSaveSchedule = () => {
    localStorage.setItem("automation_schedule", JSON.stringify(schedule));
    alert("更新频率已保存");
  };

  const handleSavePrompt = () => {
    localStorage.setItem("automation_prompt", customPrompt);
    alert("提示词已保存");
  };

  const handleTriggerManualUpdate = async () => {
    const selectedProvider = llmProviders.find(p => p.id === apiConfig.provider);
    const configToSave = {
      provider: apiConfig.provider,
      endpoint: apiConfig.endpoint || selectedProvider?.endpoint,
      model: apiConfig.model || selectedProvider?.defaultModel,
    };

    const enabledSources = dataSources.filter(s => s.enabled);
    if (enabledSources.length === 0) {
      alert("请至少启用一个数据源");
      return;
    }

    if (!confirm(`确定要从 ${enabledSources.length} 个数据源抓取文章吗？`)) {
      return;
    }

    try {
      const payload = {
        llmConfig: configToSave,
        dataSources: enabledSources,
        defaultCoverImage,
      };
      console.log("Sending payload:", payload);

      let data;
      try {
        const res = await fetch("/api/automation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        data = await res.json();
        console.log("Response:", data);
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        alert("网络错误，请重试");
        return;
      }

      // Show results if available
      if (data.results) {
        const successCount = data.results.filter((r: any) => r.status === "success").length || 0;
        const failCount = data.results.filter((r: any) => r.status === "error").length || 0;
        const skipCount = data.results.filter((r: any) => r.status === "skipped").length || 0;

        alert(`成功: ${successCount}, 跳过: ${skipCount}, 失败: ${failCount}`);
      } else if (data.error) {
        alert(data.error);
      } else {
        alert("更新完成");
      }
    } catch (error: any) {
      console.error("Update error:", error);
      alert("更新失败: " + (error?.message || "未知错误"));
    }
  };

  const addDataSource = () => {
    const newSource: DataSource = {
      id: Date.now().toString(),
      name: "",
      url: "",
      type: "rss",
      category: "tech-giants",
      enabled: true,
    };
    setDataSources([...dataSources, newSource]);
  };

  const removeDataSource = (id: string) => {
    setDataSources(dataSources.filter(s => s.id !== id));
  };

  const updateDataSource = (id: string, field: keyof DataSource, value: any) => {
    setDataSources(dataSources.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 text-sm text-[#737373] hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </Link>
          <h1 className="font-headline text-xl font-bold text-white uppercase tracking-wider">
            自动更新
          </h1>
        </div>
        <button
          onClick={handleTriggerManualUpdate}
          className="btn-primary"
        >
          <Play className="w-4 h-4" />
          立即更新
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[#262626]">
        {[
          { id: "api", label: "API 配置", icon: Key },
          { id: "sources", label: "数据源", icon: Rss },
          { id: "schedule", label: "更新频率", icon: RefreshCw },
          { id: "prompt", label: "提示词", icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-accent text-accent"
                : "border-transparent text-[#737373] hover:text-white"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* API Config Tab */}
      {activeTab === "api" && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-sm font-medium text-white mb-1">AI 模型提供商</h3>
            <p className="text-xs text-[#737373] mb-4">
              选择用于生成文章的 AI 模型，支持 OpenAI 及所有兼容格式的国产/国际模型
            </p>

            {/* Provider Selection */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {llmProviders.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => setApiConfig({
                    ...apiConfig,
                    provider: provider.id,
                    endpoint: provider.endpoint,
                    model: provider.defaultModel,
                  })}
                  className={`p-3 text-left text-sm border transition-colors ${
                    apiConfig.provider === provider.id
                      ? "border-accent bg-accent/10 text-white"
                      : "border-[#404040] text-[#A3A3A3] hover:border-[#525252]"
                  }`}
                >
                  {provider.label}
                </button>
              ))}
            </div>

            {/* API Key Info */}
            <div className="mb-4 p-3 bg-[#1A1A1A] border border-[#262626] rounded">
              <p className="text-xs text-[#A3A3A3] mb-1">API Key 配置方式</p>
              <p className="text-xs text-[#737373]">
                API Key 已移至服务器环境变量配置，请前往 Netlify 仪表板设置 <code className="text-accent">AUTOMATION_LLM_API_KEY</code> 等环境变量。
              </p>
            </div>

            {/* Custom Endpoint (for custom provider) */}
            {apiConfig.provider === "custom" && (
              <div className="mb-4">
                <label className="block text-xs text-[#A3A3A3] mb-2">API Endpoint</label>
                <input
                  type="url"
                  value={apiConfig.endpoint || ""}
                  onChange={(e) => setApiConfig({ ...apiConfig, endpoint: e.target.value })}
                  placeholder="https://api.example.com/v1"
                  className="w-full h-10 px-3 bg-[#131313] border border-[#404040] text-white text-sm placeholder:text-[#525252] placeholder:font-normal focus:border-accent focus:outline-none transition-colors font-mono"
                />
              </div>
            )}

            {/* Model Name */}
            <div className="mb-4">
              <label className="block text-xs text-[#A3A3A3] mb-2">模型名称（可选）</label>
              <input
                type="text"
                value={apiConfig.model || ""}
                onChange={(e) => setApiConfig({ ...apiConfig, model: e.target.value })}
                placeholder={llmProviders.find(p => p.id === apiConfig.provider)?.defaultModel || "auto"}
                className="w-full h-10 px-3 bg-[#131313] border border-[#404040] text-white text-sm placeholder:text-[#525252] placeholder:font-normal focus:border-accent focus:outline-none transition-colors font-mono"
              />
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-medium text-white mb-1">网页转 Markdown <span className="text-accent">(免费)</span></h3>
            <p className="text-xs text-[#737373] mb-4">
              使用免费的 Jina AI Reader，无需 API Key，直接将网页 URL 转为干净的 Markdown 格式
            </p>
            <div className="p-3 bg-[#1A1A1A] border border-[#262626] rounded">
              <p className="text-xs text-[#A3A3A3] mb-2">使用方式：在任意 URL 前加前缀</p>
              <code className="text-accent text-xs">https://r.jina.ai/https://openai.com/blog/xxx</code>
            </div>
            <p className="text-xs text-[#525252] mt-3">
              数据源中的 RSS 条目会自动使用此方式转换，无需额外配置
            </p>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-medium text-white mb-1">封面图策略</h3>
            <p className="text-xs text-[#737373] mb-4">
              AI 生成的文章会自动提取正文第一张图片作为封面，或使用下方指定的默认图
            </p>
            <input
              type="url"
              value={defaultCoverImage}
              onChange={(e) => setDefaultCoverImage(e.target.value)}
              placeholder="https://example.com/default-cover.jpg"
              className="w-full h-10 px-3 bg-[#131313] border border-[#404040] text-white text-sm placeholder:text-[#525252] placeholder:font-normal focus:border-accent focus:outline-none transition-colors"
            />
            <p className="text-xs text-[#525252] mt-2">
              不填写则自动提取正文图片，无图片时显示默认灰色背景
            </p>
          </div>

          <button onClick={handleSaveApiKeys} className="btn-primary">
            保存配置
          </button>
        </div>
      )}

      {/* Data Sources Tab */}
      {activeTab === "sources" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-[#737373]">
              配置要监控的 RSS 源和网页，AI 会自动抓取并生成文章
            </p>
            <button onClick={addDataSource} className="btn-ghost">
              <Plus className="w-4 h-4 mr-1" />
              添加数据源
            </button>
          </div>

          <div className="space-y-4">
            {dataSources.map((source) => (
              <div key={source.id} className="card p-4">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-[#A3A3A3] mb-1">名称</label>
                    <input
                      type="text"
                      value={source.name}
                      onChange={(e) => updateDataSource(source.id, "name", e.target.value)}
                      placeholder="数据源名称"
                      className="w-full h-10 px-3 bg-[#131313] border border-[#404040] text-white text-sm focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-[#A3A3A3] mb-1">URL</label>
                    <input
                      type="url"
                      value={source.url}
                      onChange={(e) => updateDataSource(source.id, "url", e.target.value)}
                      placeholder="https://..."
                      className="w-full h-10 px-3 bg-[#131313] border border-[#404040] text-white text-sm focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#A3A3A3] mb-1">分类</label>
                    <select
                      value={source.category}
                      onChange={(e) => updateDataSource(source.id, "category", e.target.value)}
                      className="w-full h-10 px-3 bg-[#131313] border border-[#404040] text-white text-sm focus:border-accent focus:outline-none"
                    >
                      {defaultCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <label className="flex items-center gap-2 text-sm text-[#A3A3A3]">
                    <input
                      type="checkbox"
                      checked={source.enabled}
                      onChange={(e) => updateDataSource(source.id, "enabled", e.target.checked)}
                      className="w-4 h-4 accent-[#3CFFD0]"
                    />
                    启用
                  </label>
                  <button
                    onClick={() => removeDataSource(source.id)}
                    className="text-[#737373] hover:text-[#E5484D]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button onClick={handleSaveDataSources} className="btn-primary">
            保存数据源
          </button>
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === "schedule" && (
        <div className="space-y-6">
          <div className="card p-6">
            <label className="flex items-center gap-3 mb-6">
              <input
                type="checkbox"
                checked={schedule.enabled}
                onChange={(e) => setSchedule({ ...schedule, enabled: e.target.checked })}
                className="w-5 h-5 accent-[#3CFFD0]"
              />
              <span className="text-white">启用自动更新</span>
            </label>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#A3A3A3] mb-2">更新频率</label>
                <select
                  value={schedule.interval}
                  onChange={(e) => setSchedule({ ...schedule, interval: e.target.value })}
                  disabled={!schedule.enabled}
                  className="w-full h-10 px-3 bg-[#131313] border border-[#404040] text-white text-sm focus:border-accent focus:outline-none disabled:opacity-50"
                >
                  <option value="hourly">每小时</option>
                  <option value="daily">每天</option>
                  <option value="weekly">每周</option>
                </select>
              </div>

              {schedule.interval !== "hourly" && (
                <div>
                  <label className="block text-sm text-[#A3A3A3] mb-2">执行时间</label>
                  <input
                    type="time"
                    value={schedule.time}
                    onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
                    disabled={!schedule.enabled}
                    className="w-full h-10 px-3 bg-[#131313] border border-[#404040] text-white text-sm focus:border-accent focus:outline-none disabled:opacity-50"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="section-label mb-4">提醒</h3>
            <p className="text-sm text-[#737373]">
              自动更新功能需要服务器支持定时任务。可配合 Vercel Cron Jobs 或系统级 cron 使用。
            </p>
          </div>

          <button onClick={handleSaveSchedule} className="btn-primary">
            保存设置
          </button>
        </div>
      )}

      {/* Prompt Tab */}
      {activeTab === "prompt" && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="section-label mb-4">AI 生成提示词</h3>
            <p className="text-sm text-[#737373] mb-4">
              自定义 AI 生成文章时的指令。可用 <code className="text-accent">{"{content}"}</code> 引用抓取的内容
            </p>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 bg-[#131313] border border-[#404040] text-white text-sm placeholder:text-[#525252] focus:border-accent focus:outline-none transition-colors resize-none font-mono"
            />
          </div>

          <button onClick={handleSavePrompt} className="btn-primary">
            保存提示词
          </button>
        </div>
      )}
    </div>
  );
}