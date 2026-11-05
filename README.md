# 个人代理分流与规则配置

自用的 Clash 分流规则与覆写脚本仓库。已适配 **FlClash（移动端/全平台）** 与 **Clash Verge Rev（PC 桌面端）**。

> 💡 **单源驱动设计（Single Source of Truth）**：
> 本项目**只需维护 `clash-config.yml` 一个文件**。推送到 `master` 后，GitHub Actions 会自动编译生成所有平台适用的脚本（输出至 `dist/` 目录）并同步至 Gist 及仓库，jsDelivr 全球 CDN 同步生效。

---

## 🔗 个人专属配置直链与导入地址

- **Gist 仓库主页**：https://gist.github.com/ling921/a00ba6773a02bfc961151c59117ca2ac
- **GitHub 仓库**：https://github.com/ling921/proxy-rules

| 脚本 / 配置文件 | 类型说明 | 🌐 快捷访问（点击直达复制代码） | 📋 完整 URL（方便复制填入客户端） |
| :--- | :--- | :--- | :--- |
| **📱 `dist/flclash-script.js`** | **FlClash 专属全量脚本**<br>移动端 URL 导入（含地区分类+节点清洗） | [⚡ 国内 CDN 加速](https://fastly.jsdelivr.net/gh/ling921/proxy-rules@master/dist/flclash-script.js)<br>[🌏 Gist 国外直链](https://gist.githubusercontent.com/ling921/a00ba6773a02bfc961151c59117ca2ac/raw/flclash-script.js) | 国内 CDN: `https://fastly.jsdelivr.net/gh/ling921/proxy-rules@master/dist/flclash-script.js`<br>Gist 直链: `https://gist.githubusercontent.com/ling921/a00ba6773a02bfc961151c59117ca2ac/raw/flclash-script.js` |
| **💻 `dist/clash-verge-all-in-one.js`** | **Clash Verge 全量单脚本（推荐）**<br>内置全量配置，**免配 YAML 且支持本地 YAML 临时微调合并** | [⚡ 国内 CDN 加速](https://fastly.jsdelivr.net/gh/ling921/proxy-rules@master/dist/clash-verge-all-in-one.js)<br>[🌏 Gist 国外直链](https://gist.githubusercontent.com/ling921/a00ba6773a02bfc961151c59117ca2ac/raw/clash-verge-all-in-one.js) | 国内 CDN: `https://fastly.jsdelivr.net/gh/ling921/proxy-rules@master/dist/clash-verge-all-in-one.js`<br>Gist 直链: `https://gist.githubusercontent.com/ling921/a00ba6773a02bfc961151c59117ca2ac/raw/clash-verge-all-in-one.js` |
| **🧩 `dist/clash-verge-filter.js`** | **Clash Verge 搭配脚本**<br>搭配下方 YAML 覆写使用（仅负责节点清洗与地区装配） | [⚡ 国内 CDN 加速](https://fastly.jsdelivr.net/gh/ling921/proxy-rules@master/dist/clash-verge-filter.js)<br>[🌏 Gist 国外直链](https://gist.githubusercontent.com/ling921/a00ba6773a02bfc961151c59117ca2ac/raw/clash-verge-filter.js) | 国内 CDN: `https://fastly.jsdelivr.net/gh/ling921/proxy-rules@master/dist/clash-verge-filter.js`<br>Gist 直链: `https://gist.githubusercontent.com/ling921/a00ba6773a02bfc961151c59117ca2ac/raw/clash-verge-filter.js` |
| **📄 `clash-config.yml`** | **Clash 覆写配置 (YAML)**<br>源配置文件，搭配上方 `filter` 脚本使用 | [⚡ 国内 CDN 加速](https://fastly.jsdelivr.net/gh/ling921/proxy-rules@master/clash-config.yml)<br>[🌏 Gist 国外直链](https://gist.githubusercontent.com/ling921/a00ba6773a02bfc961151c59117ca2ac/raw/clash-config.yml) | 国内 CDN: `https://fastly.jsdelivr.net/gh/ling921/proxy-rules@master/clash-config.yml`<br>Gist 直链: `https://gist.githubusercontent.com/ling921/a00ba6773a02bfc961151c59117ca2ac/raw/clash-config.yml` |

---

## 🎯 精简高效的 11 大策略组架构

| 策略组 | 类型 | 行为与特性说明 |
| :--- | :--- | :--- |
| **`PROXY`** | `select` | 主代理入口，可选 `AUTO`、各地区 `*-AUTO`、`MANUAL` 或直接单选节点 |
| **`Google`** | `select` | 谷歌服务独立分流（支持各地区 `*-AUTO` 或直接单选） |
| **`AI`** | `select` | **首选 `SG-AUTO` / `US-AUTO`**，彻底规避香港节点对 ChatGPT/Claude 的封锁限制 |
| **`Telegram`** | `select` | **独立长连接分组**，避免常规浏览自动测速漂移导致 Telegram 频繁断线重连 |
| **`HK-AUTO`** | `url-test` | 🇭🇰 香港节点自动测速（300s，50ms 切换容差） |
| **`SG-AUTO`** | `url-test` | 🇸🇬 新加坡节点自动测速（300s，50ms 切换容差） |
| **`JP-AUTO`** | `url-test` | 🇯🇵 日本节点自动测速（300s，50ms 切换容差） |
| **`US-AUTO`** | `url-test` | 🇺🇸 美国节点自动测速（300s，50ms 切换容差） |
| **`TW-AUTO`** | `url-test` | 🇹🇼 台湾节点自动测速（300s，50ms 切换容差） |
| **`AUTO`** | `url-test` | 全局节点自动测速（容差 50ms） |
| **`MANUAL`** | `select` | 全局纯手动节点选择池（不跟随测速波动，手动锁定节点选它即可） |

---

## 📱 FlClash（移动端 / Android / iOS）配置备忘

1. 打开 FlClash $\rightarrow$ 进入 **配置 (Profiles)**；
2. 点击当前订阅卡片右侧的 **编辑 / 更多 (⋮)** $\rightarrow$ **覆写 (Override)** $\rightarrow$ **脚本 (Script)**；
3. 选择通过 URL 载入，填入 `dist/flclash-script.js` 的 **国内 CDN 加速** 或 **Gist 直链**，开启启用开关并保存；
4. **关键一步**：回到配置列表，点击当前订阅右侧的 **🔄 刷新** 按钮，切到「代理」页面即可生效。

---

## 💻 Clash Verge Rev（PC 端）配置备忘

Clash Verge Rev 提供两种使用方式：

### 方式一：全量单脚本模式（推荐，兼具开箱即用与本地自由微调）
1. **全局扩展脚本**：点击上方表格中 `clash-verge-all-in-one.js` 的访问超链接，浏览器打开后全选（`Ctrl+A`）并复制（`Ctrl+C`），粘贴保存；
2. **全局覆写配置（YAML）**：
   - **日常使用**：**直接留空**即可全量正常工作；
   - **临时微调（高级特性）**：如果你想临时微调某些参数（如开启 `ipv6: true`），或者临时为公司内网/特定网站添加一条规则，**直接在本地 YAML 里写即可**！
     - 脚本会自动合并你的本地微调；
     - 你在本地 YAML 写的新规则会**自动置顶优先命中**，**完全无需为了临时加一条规则而提交 Git**！
3. 刷新订阅或重载配置即可生效。

### 方式二：经典组合模式（YAML + 搭配脚本）
1. **全局覆写配置**：点击上方表格中 `clash-config.yml` 的访问超链接，全选复制并粘贴到 **全局覆写配置** 中；
2. **全局扩展脚本**：点击上方表格中 `clash-verge-filter.js` 的访问超链接，全选复制并粘贴到 **全局扩展脚本** 中（负责清洗节点并动态装配地区组）；
3. 刷新订阅或重载配置即可生效。

---

## 🛠️ 日常维护与构建

- **修改配置/规则**：只需修改根目录下的 [`clash-config.yml`](./clash-config.yml)。
- **本地编译（可选）**：
  ```bash
  npm run build
  ```
  产物会自动输出至 `dist/` 目录。
- **自动同步（云端）**：
  直接将修改推送到 GitHub `master` 分支，GitHub Actions 会自动执行编译，并将 `dist/` 目录下的 3 个专用 JS 脚本和 YAML 配置同步更新到 GitHub 仓库与绑定的 Gist，各链接自动生效。
