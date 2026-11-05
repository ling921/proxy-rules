/**
 * ====================================================================
 * 💻 Clash Verge Rev 全量单脚本 (All-in-One)
 * 警告：此文件由 build.js 自动编译生成，请直接编辑 clash-config.yml！
 * 生成时间: 2026-11-05T03:33:28.074Z
 * 说明：
 *   1. 本脚本内置所有配置与规则。如果全局覆写配置（YAML）留空，直接全量生效；
 *   2. 如果你在本地【全局覆写配置（YAML）】中微调了参数或追加了临时规则，
 *      脚本会智能保留你的本地微调并置顶，免去频繁提交 Git 的繁琐！
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

    // 基础静态配置模板（自动从 clash-config.yml 编译同步）
    const baseProfile = {
      "store-selected": true
    };
    const baseDns = {
      "enable": true,
      "ipv6": false,
      "enhanced-mode": "fake-ip",
      "fake-ip-range": "198.18.0.1/16",
      "fake-ip-filter": [
        "*.lan",
        "*.localdomain",
        "*.example",
        "*.invalid",
        "*.localhost",
        "*.test",
        "*.local",
        "*.home.arpa",
        "time.*.com",
        "ntp.*.com",
        "*.ntp.org.cn",
        "+.pool.ntp.org",
        "stun.*",
        "*.market.xiaomi.com"
      ],
      "nameserver": [
        "https://223.5.5.5/dns-query",
        "https://1.1.1.1/dns-query"
      ],
      "fallback": [
        "https://8.8.8.8/dns-query"
      ],
      "fallback-filter": {
        "geoip": true,
        "geoip-code": "CN"
      }
    };
    const baseRuleProviders = {
      "reject": {
        "type": "http",
        "behavior": "domain",
        "url": "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt",
        "path": "./ruleset/reject.yaml",
        "interval": 86400
      },
      "icloud": {
        "type": "http",
        "behavior": "domain",
        "url": "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/icloud.txt",
        "path": "./ruleset/icloud.yaml",
        "interval": 86400
      },
      "apple": {
        "type": "http",
        "behavior": "domain",
        "url": "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/apple.txt",
        "path": "./ruleset/apple.yaml",
        "interval": 86400
      },
      "google": {
        "type": "http",
        "behavior": "domain",
        "url": "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/google.txt",
        "path": "./ruleset/google.yaml",
        "interval": 86400
      },
      "proxy": {
        "type": "http",
        "behavior": "domain",
        "url": "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt",
        "path": "./ruleset/proxy.yaml",
        "interval": 86400
      },
      "direct": {
        "type": "http",
        "behavior": "domain",
        "url": "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt",
        "path": "./ruleset/direct.yaml",
        "interval": 86400
      },
      "private": {
        "type": "http",
        "behavior": "domain",
        "url": "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/private.txt",
        "path": "./ruleset/private.yaml",
        "interval": 86400
      },
      "telegramcidr": {
        "type": "http",
        "behavior": "ipcidr",
        "url": "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/telegramcidr.txt",
        "path": "./ruleset/telegramcidr.yaml",
        "interval": 86400
      },
      "cncidr": {
        "type": "http",
        "behavior": "ipcidr",
        "url": "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/cncidr.txt",
        "path": "./ruleset/cncidr.yaml",
        "interval": 86400
      },
      "lancidr": {
        "type": "http",
        "behavior": "ipcidr",
        "url": "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/lancidr.txt",
        "path": "./ruleset/lancidr.yaml",
        "interval": 86400
      },
      "applications": {
        "type": "http",
        "behavior": "classical",
        "url": "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/applications.txt",
        "path": "./ruleset/applications.yaml",
        "interval": 86400
      }
    };
    const baseProxyGroups = [
      {
        "name": "PROXY",
        "type": "select",
        "proxies": [
          "AUTO",
          "HK-AUTO",
          "SG-AUTO",
          "JP-AUTO",
          "US-AUTO",
          "TW-AUTO",
          "MANUAL",
          "DIRECT"
        ],
        "icon": "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/adjust.svg"
      },
      {
        "name": "Google",
        "type": "select",
        "proxies": [
          "AUTO",
          "HK-AUTO",
          "SG-AUTO",
          "JP-AUTO",
          "US-AUTO",
          "TW-AUTO",
          "MANUAL"
        ],
        "icon": "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/google.svg"
      },
      {
        "name": "AI",
        "type": "select",
        "proxies": [
          "SG-AUTO",
          "US-AUTO",
          "JP-AUTO",
          "TW-AUTO",
          "AUTO",
          "MANUAL"
        ],
        "icon": "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/chatgpt.svg"
      },
      {
        "name": "Telegram",
        "type": "select",
        "proxies": [
          "SG-AUTO",
          "HK-AUTO",
          "JP-AUTO",
          "US-AUTO",
          "AUTO",
          "PROXY",
          "MANUAL"
        ],
        "icon": "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/telegram.svg"
      },
      {
        "name": "HK-AUTO",
        "type": "url-test",
        "proxies": [],
        "url": "https://www.gstatic.com/generate_204",
        "interval": 300,
        "tolerance": 50,
        "icon": "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/hk.svg"
      },
      {
        "name": "SG-AUTO",
        "type": "url-test",
        "proxies": [],
        "url": "https://www.gstatic.com/generate_204",
        "interval": 300,
        "tolerance": 50,
        "icon": "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/sg.svg"
      },
      {
        "name": "JP-AUTO",
        "type": "url-test",
        "proxies": [],
        "url": "https://www.gstatic.com/generate_204",
        "interval": 300,
        "tolerance": 50,
        "icon": "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/jp.svg"
      },
      {
        "name": "US-AUTO",
        "type": "url-test",
        "proxies": [],
        "url": "https://www.gstatic.com/generate_204",
        "interval": 300,
        "tolerance": 50,
        "icon": "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/us.svg"
      },
      {
        "name": "TW-AUTO",
        "type": "url-test",
        "proxies": [],
        "url": "https://www.gstatic.com/generate_204",
        "interval": 300,
        "tolerance": 50,
        "icon": "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/flags/tw.svg"
      },
      {
        "name": "MANUAL",
        "type": "select",
        "proxies": [],
        "icon": "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/adjust.svg"
      },
      {
        "name": "AUTO",
        "type": "url-test",
        "proxies": [],
        "url": "https://www.gstatic.com/generate_204",
        "interval": 300,
        "tolerance": 50,
        "icon": "https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/balance.svg"
      }
    ];
    const baseRules = [
      "RULE-SET,private,DIRECT",
      "RULE-SET,lancidr,DIRECT,no-resolve",
      "GEOIP,LAN,DIRECT,no-resolve",
      "DOMAIN,clash.razord.top,DIRECT",
      "DOMAIN,yacd.haishan.me,DIRECT",
      "PROCESS-NAME,com.openai.chatgpt,AI",
      "DOMAIN-SUFFIX,openai.com,AI",
      "DOMAIN-SUFFIX,chatgpt.com,AI",
      "DOMAIN-SUFFIX,oaistatic.com,AI",
      "DOMAIN-SUFFIX,oaiusercontent.com,AI",
      "DOMAIN-SUFFIX,sora.com,AI",
      "DOMAIN-SUFFIX,ai.com,AI",
      "DOMAIN-SUFFIX,chat.com,AI",
      "PROCESS-NAME,com.example.claudeclient,AI",
      "DOMAIN-SUFFIX,anthropic.com,AI",
      "DOMAIN-SUFFIX,claude.ai,AI",
      "DOMAIN-SUFFIX,claudeusercontent.com,AI",
      "PROCESS-NAME,com.google.android.apps.bard,AI",
      "DOMAIN-KEYWORD,google-gemini,AI",
      "DOMAIN-SUFFIX,deepmind.com,AI",
      "DOMAIN-SUFFIX,deepmind.google,AI",
      "DOMAIN-SUFFIX,ai.google.dev,AI",
      "DOMAIN-SUFFIX,generativeai.google,AI",
      "DOMAIN-SUFFIX,makersuite.google.com,AI",
      "DOMAIN-SUFFIX,aistudio.google.com,AI",
      "DOMAIN-SUFFIX,bard.google.com,AI",
      "DOMAIN-SUFFIX,gemini.google,AI",
      "DOMAIN-SUFFIX,gemini.google.com,AI",
      "DOMAIN-SUFFIX,notebooklm.google,AI",
      "DOMAIN-SUFFIX,notebooklm.google.com,AI",
      "DOMAIN-SUFFIX,jules.google,AI",
      "DOMAIN-SUFFIX,jules.google.com,AI",
      "DOMAIN,geller-pa.googleapis.com,AI",
      "DOMAIN,generativelanguage.googleapis.com,AI",
      "DOMAIN,proactivebackend-pa.googleapis.com,AI",
      "DOMAIN,alkalicore-pa.clients6.google.com,AI",
      "DOMAIN,alkalimakersuite-pa.clients6.google.com,AI",
      "DOMAIN,webchannel-alkalimakersuite-pa.clients6.google.com,AI",
      "DOMAIN,aiplatform.googleapis.com,AI",
      "DOMAIN,vertexai.googleapis.com,AI",
      "DOMAIN,studio.apis.google.com,AI",
      "DOMAIN,content-aiplatform.googleapis.com,AI",
      "DOMAIN,gemini-android.clients.google.com,AI",
      "DOMAIN,gemini-desktop.clients.google.com,AI",
      "DOMAIN,alkali-pa.googleapis.com,AI",
      "DOMAIN,aiplatform-prediction.googleapis.com,AI",
      "DOMAIN,notebooklm.clients6.google.com,AI",
      "DOMAIN,app.launchdarkly.com,AI",
      "DOMAIN,segment.io,AI",
      "DOMAIN,auth0.com,AI",
      "DOMAIN,auth0usercontent.com,AI",
      "DOMAIN,servd-anthropic-website.b-cdn.net,AI",
      "DOMAIN,openai.com.cdn.cloudflare.net,AI",
      "DOMAIN,openaiapi-site.azureedge.net,AI",
      "DOMAIN,openaicom-api-bdcpf8c6d2e9atf6.z01.azurefd.net,AI",
      "DOMAIN,openaicomproductionae4b.blob.core.windows.net,AI",
      "DOMAIN,production-openaicom-storage.azureedge.net,AI",
      "DOMAIN,o33249.ingest.sentry.io,AI",
      "DOMAIN,openaicom.imgix.net,AI",
      "DOMAIN,browser-intake-datadoghq.com,AI",
      "DOMAIN,sentry.io,AI",
      "DOMAIN,intercomcdn.com,AI",
      "DOMAIN,intercom.io,AI",
      "DOMAIN,identrust.com,AI",
      "DOMAIN,chatgpt.livekit.cloud,AI",
      "DOMAIN,host.livekit.cloud,AI",
      "DOMAIN,turn.livekit.cloud,AI",
      "DOMAIN-SUFFIX,t.me,Telegram",
      "DOMAIN-SUFFIX,tdesktop.com,Telegram",
      "DOMAIN-SUFFIX,telegram.me,Telegram",
      "DOMAIN-SUFFIX,telegram.org,Telegram",
      "DOMAIN-SUFFIX,telesco.pe,Telegram",
      "RULE-SET,telegramcidr,Telegram,no-resolve",
      "DOMAIN-SUFFIX,googledrive.com,Google",
      "DOMAIN-SUFFIX,googleusercontent.com,Google",
      "DOMAIN-KEYWORD,appspot,Google",
      "DOMAIN-KEYWORD,blogspot,Google",
      "DOMAIN-KEYWORD,gmail,Google",
      "DOMAIN-KEYWORD,google,Google",
      "DOMAIN-KEYWORD,recaptcha,Google",
      "DOMAIN-KEYWORD,youtube,Google",
      "DOMAIN-KEYWORD,onedrive,PROXY",
      "DOMAIN-SUFFIX,github.com,PROXY",
      "DOMAIN-SUFFIX,netflix.com,PROXY",
      "RULE-SET,applications,DIRECT",
      "RULE-SET,reject,REJECT",
      "RULE-SET,icloud,DIRECT",
      "RULE-SET,apple,DIRECT",
      "RULE-SET,google,Google",
      "RULE-SET,proxy,PROXY",
      "RULE-SET,direct,DIRECT",
      "RULE-SET,cncidr,DIRECT",
      "GEOIP,CN,DIRECT",
      "MATCH,PROXY"
    ];

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
  } catch (e) {
    return config;
  }
}
