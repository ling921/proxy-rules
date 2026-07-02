# 代理规则仓库

个人自用的 Clash Verge 配置，合并为单个 `clash-config.yml`，方便直接引用。

## 使用方法

### 1. 在 Clash Verge 的 **订阅 → 全局覆写配置** 中粘贴 `clash-config.yml` 的内容即可。


### 2. 在 Clash Verge 的 **订阅 → 全局扩展脚本** 中使用以下脚本将代理节点应用于所有的代理组：

```js
function main(config, profileName) {

  const nodeNames = (config.proxies || [])
    .map(p => p.name)
    .filter(n => !/(流量|剩余|套餐)/.test(n));

  config['proxy-groups'].forEach(group => {
    if (Array.isArray(group.proxies)) {
      if (group.proxies.length === 0) {
        group.proxies = nodeNames;
      }
      else {
        group.proxies = [...group.proxies, ...nodeNames]
      }
    }
  });

  return config;
}

```

## 配置说明

| 模块 | 说明 |
| --- | --- |
| `dns` | 国内 DNS + fallback，开启 GeoIP 防污染 |
| `proxy-groups` | 默认节点、Google、AI 分流，均支持自动测速 |
| `rule-providers` | 引入 Loyalsoldier 的直连/代理规则集 |
| `rules` | 局域网直连、国内直连、国外代理分流 |

## 更新规则

远程配置默认每 12 小时自动更新一次（可在 Verge 设置中调整）。手动更新时重新加载配置即可。
