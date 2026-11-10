/**
 * ====================================================================
 * 🧩 Clash Verge Rev 搭配扩展脚本 (Companion Filter)
 * 警告：此文件由 build.js 自动编译生成！
 * 生成时间: 2026-11-10T02:09:13.665Z
 * 说明：本脚本用于【搭配 clash-config.yml】使用：
 *       1. 在全局覆写配置中填入 clash-config.yml；
 *       2. 在全局扩展脚本中填入本脚本（自动清洗节点并装配地区分组）。
 * ====================================================================
 */

function main(config, profileName) {
  try {
    if (!config || typeof config !== 'object') return config;

    const rawProxies = Array.isArray(config.proxies) ? config.proxies : [];

    // 提示性/垃圾节点的通用正则过滤规则
    const JUNK_NODE_REGEX = /(?:流量|剩余|已用|套餐|到期|重置|时间|天数|过期|账号|账户|额度|续费|充值|余额|建议|请[勿可求准及时]?|务必|更新|订阅|通知|公告|提示|注意|规则|说明|维护|故障|重启|重连|超时|网络|售后|群|官网|网站|发布|频道|客服|工单|联系|防失联|教程|下载|客户端|导航|地址|备用|永久|官方|退订|反馈|返利|推广|邀请|折扣|优惠|福利|活动|赞助|广告)/i;
    const JUNK_ENG_REGEX = /^(?:info|traffic|expire|notice|alert|update|message|warn|website|channel|group|support|tips?|announcement)\b/i;
    const INVALID_SERVER_REGEX = /^(?:127\.0\.0\.1|0\.0\.0\.0|localhost)$/i;

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
      HK: /(?:香港|HK|Hong\s*Kong|🇭🇰)/i,
      SG: /(?:新加坡|SG|Singapore|狮城|🇸🇬)/i,
      JP: /(?:日本|JP|Japan|Tokyo|Osaka|东京|大阪|🇯🇵)/i,
      US: /(?:美国|US|USA|United\s*States|America|Los\s*Angeles|硅谷|洛杉矶|🇺🇸)/i,
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
  } catch (e) {
    return config;
  }
}
