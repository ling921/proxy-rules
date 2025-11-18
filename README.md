# Clash Verge 规则仓库

个人自用的 Clash Verge 规则集合。所有场景都对应 `rules/` 下的独立 `.txt` 文件，方便脚本、CI 或 Gist 工作流直接引用。

## 目录结构

- `rules/*.txt`：按用途拆分的纯文本规则（direct、proxy、ai、streaming 等）。
- `README.md`：仓库说明、规则清单以及语法速查。

## 规则清单

| 规则文件                                                                                                       | 描述                                         |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| [direct.txt](https://gist.githubusercontent.com/ling921/a00ba6773a02bfc961151c59117ca2ac/raw/direct.txt)       | 强制直连的域名或网段，适合本地服务与内网系统 |
| [hk.txt](https://gist.githubusercontent.com/ling921/a00ba6773a02bfc961151c59117ca2ac/raw/hk.txt)               | 香港站点与业务，便于定向路由                 |
| [ai.txt](https://gist.githubusercontent.com/ling921/a00ba6773a02bfc961151c59117ca2ac/raw/ai.txt)               | 常见 AI 平台与 API 端点，方便统一策略        |
| [microsoft.txt](https://gist.githubusercontent.com/ling921/a00ba6773a02bfc961151c59117ca2ac/raw/microsoft.txt) | Microsoft 以及 Office 生态相关域名           |
| [streaming.txt](https://gist.githubusercontent.com/ling921/a00ba6773a02bfc961151c59117ca2ac/raw/streaming.txt) | 串流影音平台，便于切换专属节点               |
| [proxy.txt](https://gist.githubusercontent.com/ling921/a00ba6773a02bfc961151c59117ca2ac/raw/proxy.txt)         | 必须走代理的服务，避免被墙或限速             |
| [block.txt](https://gist.githubusercontent.com/ling921/a00ba6773a02bfc961151c59117ca2ac/raw/block.txt)     | 屏蔽域名黑名单，可挂到 `REJECT`         |

## 语法速查

### 基本约定

- 文件统一使用 UTF-8（无 BOM），`#` 开头为注释。
- Clash 自上而下匹配，命中后立即返回策略。
- 建议统一使用 `DOMAIN-SUFFIX`、`DOMAIN`、`DOMAIN-KEYWORD`、`IP-CIDR`、`IP-CIDR6`、`GEOIP`、`FINAL` 等标准关键字。

### 常用规则类型

| 类型             | 示例                              | 说明                                 |
| ---------------- | --------------------------------- | ------------------------------------ |
| `DOMAIN`         | `DOMAIN,api.example.com,Proxy`    | 精确匹配单个域名                     |
| `DOMAIN-SUFFIX`  | `DOMAIN-SUFFIX,example.com,Proxy` | 匹配整个后缀及其子域名               |
| `DOMAIN-KEYWORD` | `DOMAIN-KEYWORD,keyword,Proxy`    | 域名包含关键字即可命中，适合模糊匹配 |
| `IP-CIDR`        | `IP-CIDR,192.168.0.0/16,DIRECT`   | IPv4 网段匹配，可追加 `,no-resolve`  |
| `IP-CIDR6`       | `IP-CIDR6,240c::/32,Proxy`        | IPv6 网段匹配                        |
| `GEOIP`          | `GEOIP,CN,DIRECT`                 | 基于 GeoIP 数据库的国家/地区规则     |
| `FINAL`          | `FINAL,Proxy`                     | 所有规则未命中时的兜底策略           |

> 规则提供器（Rule Provider）下可省略策略位，由策略组在导入后统一指定。本仓库的 `.txt` 仅保留「匹配类型 + 匹配值」，方便复用。

### 列表示例

```
# proxy.txt
DOMAIN-SUFFIX,example.com
DOMAIN-SUFFIX,example.org
DOMAIN,api.special.example
```

在 Clash 配置中可以这样引用：

```yaml
rule-providers:
  direct-sets:
    type: http
    behavior: classical
    path: rules/direct.txt
    url: https://gist.githubusercontent.com/ling921/a00ba6773a02bfc961151c59117ca2ac/raw/direct.txt
    interval: 43200

  hk-sets:
    type: http
    behavior: classical
    path: rules/hk.txt
    url: https://gist.githubusercontent.com/ling921/a00ba6773a02bfc961151c59117ca2ac/raw/hk.txt
    interval: 43200

  ai-sets:
    type: http
    behavior: classical
    path: rules/ai.txt
    url: https://gist.githubusercontent.com/ling921/a00ba6773a02bfc961151c59117ca2ac/raw/ai.txt
    interval: 43200

  microsoft-sets:
    type: http
    behavior: classical
    path: rules/microsoft.txt
    url: https://gist.githubusercontent.com/ling921/a00ba6773a02bfc961151c59117ca2ac/raw/microsoft.txt
    interval: 43200

  streaming-sets:
    type: http
    behavior: classical
    path: rules/streaming.txt
    url: https://gist.githubusercontent.com/ling921/a00ba6773a02bfc961151c59117ca2ac/raw/streaming.txt
    interval: 43200

  proxy-sets:
    type: http
    behavior: classical
    path: rules/proxy.txt
    url: https://gist.githubusercontent.com/ling921/a00ba6773a02bfc961151c59117ca2ac/raw/proxy.txt
    interval: 43200

  block-sets:
    type: http
    behavior: classical
    path: rules/block.txt
    url: https://gist.githubusercontent.com/ling921/a00ba6773a02bfc961151c59117ca2ac/raw/block.txt
    interval: 43200

rules:
  - RULE-SET,direct-sets,Direct
  - RULE-SET,hk-sets,HongKong
  - RULE-SET,ai-sets,AI
  - RULE-SET,microsoft-sets,Proxy
  - RULE-SET,streaming-sets,Streaming
  - RULE-SET,proxy-sets,Proxy
  - RULE-SET,block-sets,REJECT
```

### 校验建议

1. 编辑完成后用脚本检测非法字符、空行或重复规则。
2. `IP-CIDR`/`IP-CIDR6` 建议加 `no-resolve`，避免额外 DNS 查询。
3. 重要变更保留注释或版本说明，便于追踪来源。
