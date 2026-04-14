// ==UserScript==
// @name         AI 对话目录
// @namespace    http://tampermonkey.net/
// @version      1.3.1
// @description  AI聊天网站多轮对话跳转目录
// @author       Mrchen
// @match        https://claude.ai/*
// @match        https://chatgpt.com/*
// @match        https://gemini.google.com/*
// @match        https://chat.qwen.ai/*
// @match        https://chatglm.cn/*
// @match        https://kimi.moonshot.cn/*
// @match        https://kimi.ai/*
// @match        https://chat.deepseek.com/*
// @grant        GM_addStyle
// @license      Apache-2.0
// ==/UserScript==

(function() {
    'use strict';

    const HOST = location.hostname;

    const SITES = {
        claude: {
            domain: 'claude.ai',
            tocSelector: '[data-testid="user-message"]',
            tocIgnoreSelectors: 'button, img, svg'
        },
        chatgpt: {
            domain: 'chatgpt.com',
            tocSelector: 'div[data-message-author-role="user"]',
            tocIgnoreSelectors: 'button, img, svg, .text-xs, [aria-label*="Attachment"]'
        },
        gemini: {
            domain: 'gemini.google.com',
            tocSelector: 'user-query, .query-text, .query-text-line, [data-text], .user-text',
            tocIgnoreSelectors: 'img, button, [role="button"], svg, a[target="_blank"], .attachment-preview, mat-chip, .query-source-icon, .query-source, [class*="label"], [class*="prefix"], [class*="icon"]',
            tocTextClean: /^你说\s*/
        },
        qwen: {
            domain: 'chat.qwen.ai',
            tocSelector: '.msg-user, [class*="user-message"], [class*="userMessage"]',
            tocIgnoreSelectors: 'button, img, svg'
        },
        chatglm: {
            domain: 'chatglm.cn',
            tocSelector: '[class*="user"], .user-message',
            tocIgnoreSelectors: 'button, img, svg'
        },
        kimi_moonshot: {
            domain: 'kimi.moonshot.cn',
            tocSelector: '[class*="user"], .user-message',
            tocIgnoreSelectors: 'button, img, svg'
        },
        kimi: {
            domain: 'kimi.ai',
            tocSelector: '[class*="user"], .user-message',
            tocIgnoreSelectors: 'button, img, svg'
        },
        deepseek: {
            domain: 'chat.deepseek.com',
            tocSelector: '[class*="user-message"], .father-chat .self',
            tocIgnoreSelectors: 'button, img, svg'
        }
    };

    let CURRENT_SITE = null;
    for (const key in SITES) {
        if (HOST.includes(SITES[key].domain)) {
            CURRENT_SITE = SITES[key];
            break;
        }
    }
    if (!CURRENT_SITE) return;

    const CONFIG = { pollInterval: 1000 };

    GM_addStyle(`
        #ai-nav-btn {
            position: fixed; right: 0; top: 50%; transform: translateY(-50%);
            z-index: 2147483647; width: 28px; height: 80px;
            background: #fff; color: #333; border: 1px solid #ddd; border-right: none;
            border-radius: 8px 0 0 8px; cursor: pointer; font-size: 12px;
            writing-mode: vertical-rl; letter-spacing: 2px; opacity: 0.85;
            transition: opacity 0.2s; box-shadow: -2px 0 6px rgba(0,0,0,0.08);
            padding: 0; margin: 0; line-height: 28px; text-align: center;
        }
        #ai-nav-btn:hover { opacity: 1; }
        #ai-nav-btn.ai-hidden { display: none; }

        #ai-nav-panel {
            position: fixed; right: 0; top: 50%; transform: translateY(-50%);
            z-index: 2147483646; width: 280px; max-height: 60vh;
            background: #fff; color: #333; border-radius: 10px 0 0 10px;
            box-shadow: -2px 0 12px rgba(0,0,0,0.1); border: 1px solid #e5e5e5;
            border-right: none; font-size: 13px;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            display: none; flex-direction: column;
        }
        #ai-nav-panel.ai-open { display: flex; }

        #ai-nav-header {
            display: flex; justify-content: space-between; align-items: center;
            padding: 10px 14px; border-bottom: 1px solid #eee;
            font-weight: 600; font-size: 14px; color: #222;
        }
        #ai-nav-header-actions { display: flex; align-items: center; gap: 4px; }
        #ai-nav-close, #ai-nav-refresh {
            background: none; border: none; color: #999; font-size: 16px;
            cursor: pointer; padding: 2px 4px; line-height: 1;
        }
        #ai-nav-close:hover, #ai-nav-refresh:hover { color: #333; }

        #ai-nav-list { overflow-y: auto; padding: 4px 0; flex: 1; }
        #ai-nav-list::-webkit-scrollbar { width: 4px; }
        #ai-nav-list::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }

        .ai-nav-item {
            padding: 8px 14px; cursor: pointer; border-bottom: 1px solid #f0f0f0;
            line-height: 1.4; transition: background 0.15s;
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #444;
        }
        .ai-nav-item:hover { background: #f5f5f5; }
        .ai-nav-item-index { color: #aaa; margin-right: 6px; font-size: 11px; }
        #ai-nav-empty { padding: 20px; text-align: center; color: #aaa; }

    `);

    let tocBtn, tocPanel, tocList, lastTOCData = '';

    function getUniqueQueries() {
        const containers = document.querySelectorAll(CURRENT_SITE.tocSelector);
        const unique = [];
        const seen = new Set();

        const arr = Array.from(containers);
        const filtered = arr.filter(node => !arr.some(other => other !== node && other.contains(node)));

        filtered.forEach(c => {
            const clone = c.cloneNode(true);
            if (CURRENT_SITE.tocIgnoreSelectors) {
                try {
                    clone.querySelectorAll(CURRENT_SITE.tocIgnoreSelectors).forEach(g => g.remove());
                } catch(e) {}
            }
            let t = (clone.innerText || '').replace(/\s+/g, ' ').trim();
            if (CURRENT_SITE.tocTextClean) {
                t = t.replace(CURRENT_SITE.tocTextClean, '').trim();
            }
            if (t.length > 1 && !seen.has(t)) {
                seen.add(t);
                unique.push({ el: c, text: t });
            }
        });
        return unique;
    }

    function initTOC() {
        if (document.getElementById('ai-nav-btn')) return;

        tocBtn = document.createElement('button');
        tocBtn.id = 'ai-nav-btn';
        tocBtn.textContent = '目 录';
        document.body.appendChild(tocBtn);

        tocPanel = document.createElement('div');
        tocPanel.id = 'ai-nav-panel';

        const header = document.createElement('div');
        header.id = 'ai-nav-header';

        const title = document.createElement('span');
        title.textContent = '对话目录';
        header.appendChild(title);

        const actions = document.createElement('div');
        actions.id = 'ai-nav-header-actions';

        const refreshBtn = document.createElement('button');
        refreshBtn.id = 'ai-nav-refresh';
        refreshBtn.title = '刷新';
        refreshBtn.textContent = '↻';
        refreshBtn.addEventListener('click', e => { e.stopPropagation(); updateTOCList(true); });
        actions.appendChild(refreshBtn);

        const closeBtn = document.createElement('button');
        closeBtn.id = 'ai-nav-close';
        closeBtn.title = '关闭';
        closeBtn.textContent = '✕';
        closeBtn.addEventListener('click', e => {
            e.stopPropagation();
            tocPanel.classList.remove('ai-open');
            tocBtn.classList.remove('ai-hidden');
        });
        actions.appendChild(closeBtn);

        header.appendChild(actions);
        tocPanel.appendChild(header);

        tocList = document.createElement('div');
        tocList.id = 'ai-nav-list';
        tocPanel.appendChild(tocList);

        document.body.appendChild(tocPanel);

        tocBtn.addEventListener('click', () => {
            tocBtn.classList.add('ai-hidden');
            tocPanel.classList.add('ai-open');
            updateTOCList(true);
        });
    }

    function updateTOCList(force = false) {
        if (!tocPanel || !tocPanel.classList.contains('ai-open')) return;

        const unique = getUniqueQueries();
        const currentData = unique.map(u => u.text).join('|');
        if (!force && currentData === lastTOCData) return;
        lastTOCData = currentData;

        while (tocList.firstChild) tocList.removeChild(tocList.firstChild);

        if (unique.length === 0) {
            const empty = document.createElement('div');
            empty.id = 'ai-nav-empty';
            empty.textContent = '暂无对话';
            tocList.appendChild(empty);
            return;
        }

        unique.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = 'ai-nav-item';

            const span = document.createElement('span');
            span.className = 'ai-nav-item-index';
            span.textContent = `${idx + 1}.`;
            div.appendChild(span);

            const preview = item.text.length > 30 ? item.text.slice(0, 30) + '…' : item.text;
            div.appendChild(document.createTextNode(preview));

            div.addEventListener('click', () => {
                const liveUnique = getUniqueQueries();
                const target = liveUnique[idx];
                const el = (target && target.el && target.el.isConnected) ? target.el : item.el;
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
            tocList.appendChild(div);
        });
    }

    function start() {
        initTOC();
        setInterval(() => {
            if (!document.getElementById('ai-nav-btn')) initTOC();
            updateTOCList();
        }, CONFIG.pollInterval);
    }

    window.addEventListener('load', start);
    start();
})();
