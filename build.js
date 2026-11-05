const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const CONFIG_YML_PATH = path.join(ROOT_DIR, 'clash-config.yml');

// 产物统一输出到 dist 目录
const FLCLASH_OUTPUT_PATH = path.join(DIST_DIR, 'flclash-script.js');
const CLASH_VERGE_ALL_IN_ONE_PATH = path.join(DIST_DIR, 'clash-verge-all-in-one.js');
const CLASH_VERGE_FILTER_PATH = path.join(DIST_DIR, 'clash-verge-filter.js');

console.log('🔄 开始从 clash-config.yml 自动构建精简高效的脚本体系 (输出至 dist/)...');

if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

if (!fs.existsSync(CONFIG_YML_PATH)) {
  console.error('❌ 未找到源配置文件: clash-config.yml');
  process.exit(1);
}

const ymlRaw = fs.readFileSync(CONFIG_YML_PATH, 'utf8');
const baseConfig = YAML.parse(ymlRaw);

const baseProfile = baseConfig.profile || { 'store-selected': true };
const baseDns = baseConfig.dns || {};
const baseRuleProviders = baseConfig['rule-providers'] || {};
const baseProxyGroups = baseConfig['proxy-groups'] || [];
const baseRules = baseConfig.rules || [];

console.log(`📋 源配置解析成功:
  - 精简后策略组数量: ${baseProxyGroups.length} (已移除冗余的地区MANUAL)
  - 规则集数量: ${Object.keys(baseRuleProviders).length}
  - 分流规则数: ${baseRules.length}`);

// 公共的节点过滤与地区分类代码段
function getSharedFilterCode() {
  return `
    const rawProxies = Array.isArray(config.proxies) ? config.proxies : [];

    // 提示性/垃圾节点的通用正则过滤规则
    const JUNK_NODE_REGEX = /(?:流量|剩余|已用|套餐|到期|重置|时间|天数|过期|账号|账户|额度|续费|充值|余额|建议|请[勿可求准及时]?|务必|更新|订阅|通知|公告|提示|注意|规则|说明|维护|故障|重启|重连|超时|网络|售后|群|官网|网站|发布|频道|客服|工单|联系|防失联|教程|下载|客户端|导航|地址|备用|永久|官方|退订|反馈|返利|推广|邀请|折扣|优惠|福利|活动|赞助|广告)/i;
    const JUNK_ENG_REGEX = /^(?:info|traffic|expire|notice|alert|update|message|warn|website|channel|group|support|tips?|announcement)\b/i;
    const INVALID_SERVER_REGEX = /^(?:127\\.0\\.0\\.1|0\\.0\\.0\\.0|localhost)$/i;

    const isAvailableNode = (p) => {
      if (!p) return false;
      const name = typeof p === 'string' ? p.trim() : (typeof p.name === 'string' ? p.name.trim() : '');
      if (!name || JUNK_NODE_REGEX.test(name) || JUNK_ENG_REGEX.test(name)) return false;
      if (typeof p === 'object') {
        const server = typeof p.server === 'string' ? p.server.trim() : '';
        if (server && INVALID_SERVER_REGEX.test(server)) return false;
        if (p.port === 0 || p.port === '0') return false;
      }
      return true;
    };

    // 提取并清洗有效节点名
    const nodeNames = [
      ...new Set(
        rawProxies
          .filter(isAvailableNode)
          .map((p) => (typeof p === 'string' ? p.trim() : p.name.trim()))
          .filter((n) => n.length > 0)
      )
    ];

    // 如果原订阅已有 proxy-groups，收集已存在的有效节点作为后备补充
    if (nodeNames.length === 0 && Array.isArray(config['proxy-groups'])) {
      config['proxy-groups'].forEach((g) => {
        if (g && Array.isArray(g.proxies)) {
          g.proxies.forEach((name) => {
            if (
              typeof name === 'string' &&
              name.length > 0 &&
              !['DIRECT', 'REJECT', 'GLOBAL', 'AUTO', 'MANUAL', 'PROXY'].includes(name) &&
              isAvailableNode(name)
            ) {
              nodeNames.push(name);
            }
          });
        }
      });
    }

    const fallbackList = nodeNames.length > 0 ? nodeNames : ['DIRECT'];

    // 智能地区节点分类引擎
    const REGION_MAP = {
      HK: /(?:香港|HK|Hong\\s*Kong|🇭🇰)/i,
      SG: /(?:新加坡|SG|Singapore|狮城|🇸🇬)/i,
      JP: /(?:日本|JP|Japan|Tokyo|Osaka|东京|大阪|🇯🇵)/i,
      US: /(?:美国|US|USA|United\\s*States|America|Los\\s*Angeles|硅谷|洛杉矶|🇺🇸)/i,
      TW: /(?:台湾|TW|Taiwan|Taipei|台北|🇹🇼)/i
    };

    const regionNodes = {
      HK: [],
      SG: [],
      JP: [],
      US: [],
      TW: []
    };

    nodeNames.forEach((name) => {
      for (const [code, reg] of Object.entries(REGION_MAP)) {
        if (reg.test(name)) {
          regionNodes[code].push(name);
          break;
        }
      }
    });
  `;
}

// 1. 生成全量单脚本的核心逻辑（支持本地 YAML 微调优雅合并）
function generateAllInOneCoreLogic() {
  return `
    if (!config || typeof config !== 'object') return config;

${getSharedFilterCode()}

    // 基础静态配置模板（自动从 clash-config.yml 编译同步）
    const baseProfile = ${JSON.stringify(baseProfile, null, 2)};
    const baseDns = ${JSON.stringify(baseDns, null, 2)};
    const baseRuleProviders = ${JSON.stringify(baseRuleProviders, null, 2)};
    const baseProxyGroups = ${JSON.stringify(baseProxyGroups, null, 2)};
    const baseRules = ${JSON.stringify(baseRules, null, 2)};

    // 1. Profile 智能合并（保留本地用户在 YAML 中的自定义微调）
    config.profile = Object.assign({}, baseProfile, config.profile || {});

    // 2. DNS 智能合并（本地在 YAML 中对 DNS 的微调优先）
    const localDns = (config.dns && typeof config.dns === 'object') ? config.dns : {};
    config.dns = Object.assign({}, baseDns, localDns);
    if (Array.isArray(localDns['fake-ip-filter']) && localDns['fake-ip-filter'].length > 0) {
      config.dns['fake-ip-filter'] = [...new Set([...(baseDns['fake-ip-filter'] || []), ...localDns['fake-ip-filter']])];
    }

    // 3. 动态装配基础策略组并保留本地自定义策略组
    const builtGroups = baseProxyGroups.map((group) => {
      const g = Object.assign({}, group);
      const originalProxies = Array.isArray(g.proxies) ? g.proxies : [];

      const regionMatch = g.name.match(/^(HK|SG|JP|US|TW)-AUTO$/);
      if (regionMatch) {
        const regionCode = regionMatch[1];
        const matchedList = regionNodes[regionCode] || [];
        g.proxies = matchedList.length > 0 ? [...matchedList] : ['DIRECT'];
      } else if (g.name === 'MANUAL' || g.name === 'AUTO') {
        g.proxies = [...fallbackList];
      } else {
        g.proxies = [...new Set([...originalProxies, ...nodeNames])];
      }
      return g;
    });

    // 若本地 YAML 覆写中存在额外的自定义策略组，一并优雅合并
    if (Array.isArray(config['proxy-groups'])) {
      const localCustomGroups = config['proxy-groups'].filter(
        (lg) => lg && lg.name && !builtGroups.some((bg) => bg.name === lg.name)
      );
      localCustomGroups.forEach((cg) => {
        const g = Object.assign({}, cg);
        if (Array.isArray(g.proxies)) {
          g.proxies = [...new Set([...g.proxies, ...nodeNames])];
        }
        builtGroups.push(g);
      });
    }
    config['proxy-groups'] = builtGroups;

    // 4. 规则集智能合并（内置 Loyalsoldier + 本地用户额外规则集）
    config['rule-providers'] = Object.assign({}, baseRuleProviders, config['rule-providers'] || {});

    // 5. 分流规则智能合并（本地用户在 YAML 中新增的专属规则置顶优先命中）
    const localRules = Array.isArray(config.rules) ? config.rules : [];
    const customRules = localRules.filter((r) => {
      if (typeof r !== 'string') return false;
      if (r.startsWith('MATCH,') || r.startsWith('GEOIP,CN,')) return false;
      return !baseRules.includes(r);
    });

    config.rules = [...new Set([...customRules, ...baseRules])];

    return config;
  `;
}

// 2. 生成搭配脚本的核心逻辑（用于配合 clash-config.yml YAML 覆写）
function generateFilterCompanionLogic() {
  return `
    if (!config || typeof config !== 'object') return config;

${getSharedFilterCode()}

    // 针对已有策略组（由 clash-config.yml 注入）进行地区分类与节点填装
    (config['proxy-groups'] || []).forEach((g) => {
      if (!g || !Array.isArray(g.proxies)) return;

      const regionMatch = g.name.match(/^(HK|SG|JP|US|TW)-AUTO$/);
      if (regionMatch) {
        const regionCode = regionMatch[1];
        const matchedList = regionNodes[regionCode] || [];
        g.proxies = matchedList.length > 0 ? [...matchedList] : ['DIRECT'];
      } else if (g.name === 'MANUAL' || g.name === 'AUTO') {
        g.proxies = [...fallbackList];
      } else {
        g.proxies = [...new Set([...g.proxies, ...nodeNames])];
      }
    });

    return config;
  `;
}

// 产物 1：FlClash 移动端专属全量脚本
const flclashScript = `/**
 * ====================================================================
 * 📱 FlClash 移动端专属覆写脚本（全量独立）
 * 警告：此文件由 build.js 自动编译生成，请直接编辑 clash-config.yml！
 * 生成时间: ${new Date().toISOString()}
 * ====================================================================
 */

const main = (config) => {
  try {
${generateAllInOneCoreLogic()}
  } catch (e) {
    return config;
  }
};
`;

// 产物 2：Clash Verge 全量单脚本（内置默认配置，且支持本地 YAML 微调合并）
const clashVergeAllInOneScript = `/**
 * ====================================================================
 * 💻 Clash Verge Rev 全量单脚本 (All-in-One)
 * 警告：此文件由 build.js 自动编译生成，请直接编辑 clash-config.yml！
 * 生成时间: ${new Date().toISOString()}
 * 说明：
 *   1. 本脚本内置所有配置与规则。如果全局覆写配置（YAML）留空，直接全量生效；
 *   2. 如果你在本地【全局覆写配置（YAML）】中微调了参数或追加了临时规则，
 *      脚本会智能保留你的本地微调并置顶，免去频繁提交 Git 的繁琐！
 * ====================================================================
 */

function main(config, profileName) {
  try {
${generateAllInOneCoreLogic()}
  } catch (e) {
    return config;
  }
}
`;

// 产物 3：Clash Verge 搭配脚本（配合 clash-config.yml 组合使用）
const clashVergeFilterScript = `/**
 * ====================================================================
 * 🧩 Clash Verge Rev 搭配扩展脚本 (Companion Filter)
 * 警告：此文件由 build.js 自动编译生成！
 * 生成时间: ${new Date().toISOString()}
 * 说明：本脚本用于【搭配 clash-config.yml】使用：
 *       1. 在全局覆写配置中填入 clash-config.yml；
 *       2. 在全局扩展脚本中填入本脚本（自动清洗节点并装配地区分组）。
 * ====================================================================
 */

function main(config, profileName) {
  try {
${generateFilterCompanionLogic()}
  } catch (e) {
    return config;
  }
}
`;

fs.writeFileSync(FLCLASH_OUTPUT_PATH, flclashScript, 'utf8');
console.log('✅ 已生成 FlClash 移动端专属脚本: dist/flclash-script.js');

fs.writeFileSync(CLASH_VERGE_ALL_IN_ONE_PATH, clashVergeAllInOneScript, 'utf8');
console.log('✅ 已生成 Clash Verge 全量单脚本: dist/clash-verge-all-in-one.js');

fs.writeFileSync(CLASH_VERGE_FILTER_PATH, clashVergeFilterScript, 'utf8');
console.log('✅ 已生成 Clash Verge 搭配脚本: dist/clash-verge-filter.js');
