# 代理规则仓库

个人自用的 Clash Verge 配置，合并为单个 `clash-config.yml`，方便直接引用。

## 使用方法

在 Clash Verge 的 **订阅 → 全局扩展脚本** 中使用以下脚本，可自动拉取远程规则并与本地配置合并：

```js
const CONFIG_URL = 'https://gist.githubusercontent.com/ling921/a00ba6773a02bfc961151c59117ca2ac/raw/clash-config.yml';

// 辅助函数：获取并解析 YAML
async function fetchYaml(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 无法获取配置`);
    }
    const text = await response.text();
    return yaml.parse(text); // Verge 内置的 YAML 解析器
}

async function main(config, profileName) {
    try {
        const remoteConfig = await fetchYaml(CONFIG_URL);
        const { proxies: _, ...remoteWithoutProxies } = remoteConfig;
        Object.assign(config, remoteWithoutProxies); // rule-providers 和 rules 都会被覆盖

        // 填充或合并 proxy-groups 中的节点列表
        const nodeNames = (config.proxies || []).map(p => p.name);
        if (config['proxy-groups']) {
            config['proxy-groups'].forEach(group => {
                if (!Array.isArray(group.proxies)) {
                  group.proxies = nodeNames;
                } else {
                  group.proxies = [...group.proxies, ...nodeNames];
                }
            });
        }
    } catch (error) {
        console.error('加载远程配置失败:', error);
    }
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
