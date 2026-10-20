# 代理规则仓库

个人自用的 Clash Verge 配置，合并为单个 `clash-config.yml`，方便直接引用。

## 使用方法

### 1. 在 Clash Verge 的 **订阅 → 全局覆写配置** 中粘贴 `clash-config.yml` 的内容即可。

这是一份覆写配置，需要与包含实际代理节点的订阅配合使用。

### 2. 在 Clash Verge 的 **订阅 → 全局扩展脚本** 中使用以下脚本填充订阅节点：

`AUTO` 和 `MANUAL` 的空列表由脚本填充为实际节点，其它策略组保留自动、手动等入口，同时可以单独选择实际节点。重复执行脚本不会重复追加节点。

```js
function main(config, profileName) {

  const nodeNames = [...new Set((config.proxies || [])
    .map(p => p.name)
    .filter(n => typeof n === 'string' && n.length > 0)
    .filter(n => !/(流量|剩余|套餐)/.test(n)))];

  if (nodeNames.length === 0) {
    throw new Error('未找到可用的订阅节点，请先启用包含 proxies 的订阅。');
  }

  (config['proxy-groups'] || []).forEach(group => {
    if (Array.isArray(group.proxies)) {
      group.proxies = [...new Set([...group.proxies, ...nodeNames])];
    }
  });

  return config;
}

```

### 3. 手动固定节点

1. 在 `MANUAL`（手动选择）组里选中希望固定的实际节点。
2. 在需要固定的 `PROXY`、`Google` 或 `AI` 组中选择 `MANUAL`。
3. 这些组将使用 `MANUAL` 选中的节点，不再跟随 `AUTO` 的测速结果切换。以后只需在 `MANUAL` 中更换一次节点，所有选择了它的组都会跟随更新。

各业务组仍默认优先使用 `AUTO`；需要固定时再切换到 `MANUAL`。若 AI 与其它流量需要不同出口，也可以直接在 `AI` 组中选择实际节点。

`profile.store-selected: true` 会保存策略组的选择并在重启后恢复。固定节点如果失效，需要手动换一个；订阅删除或重命名该节点后，也需要重新选择。

## 配置说明

| 模块 | 说明 |
| --- | --- |
| `profile` | 保存策略组选择，重启后恢复 |
| `dns` | 国内 DNS + fallback，开启 GeoIP 防污染 |
| `proxy-groups` | `PROXY`、`Google`、`AI` 可选 `AUTO`、`MANUAL` 或实际节点；`AUTO` 每 300 秒测速，切换容差为 50 ms |
| `rule-providers` | 引入 Loyalsoldier 的直连/代理规则集 |
| `rules` | 局域网直连、国内直连、国外代理分流 |

## 本次规则优化

- AI 专用规则排在 Google 通用规则前，避免 Gemini、AI Studio、NotebookLM 等流量提前命中 `Google`。
- AI 专属域名使用后缀匹配，覆盖静态资源和附件子域；合并 OpenAI、Anthropic 的重复规则。共享服务仅保留已配置的精确端点，不扩大到整个 Google API、云平台或 CDN。
- 局域网优先直连，并对局域网 IP 和 Telegram IP 规则使用 `no-resolve`，避免这些规则主动触发 DNS 查询；国内 IP 规则保留解析能力，继续为未命中域名集的国内站点提供直连兜底。
- 自动测速改用 HTTPS，并增加 50 ms 切换容差，减少延迟小幅波动造成的换节点。
- 删除未被任何规则引用的 `gfw`、`tld-not-cn` 规则集定义。

字段含义见 [Mihomo 手动选择](https://wiki.metacubex.one/config/proxy-groups/select/)、[自动选择与切换容差](https://wiki.metacubex.one/config/proxy-groups/url-test/)、[选择记录缓存](https://wiki.metacubex.one/config/general/)及[规则匹配与 no-resolve](https://wiki.metacubex.one/config/rules/)。

## 更新规则

第三方规则集按 `rule-providers` 中的 `interval: 86400` 每 24 小时检查更新，也可以在客户端手动更新规则集。覆写配置本身的更新频率由客户端的引用方式和设置决定，与规则集更新间隔相互独立。
