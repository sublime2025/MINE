// ==UserScript==
// @name         VIP视频解析
// @namespace    https://github.com/?
// @version      1.1.0
// @description  一键解析优酷、爱奇艺、芒果TV、腾讯视频、B站付费内容
// @author       VIP Parser
// @match        *://*.youku.com/*
// @match        *://*.iqiyi.com/*
// @match        *://*.mgtv.com/*
// @match        *://*.v.qq.com/*
// @match        *://*.bilibili.com/*
// @grant        GM_openInTab
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const PARSERS = [
        { title: "jy",   url: "https://jx.playerjy.com/?url=" },
        { title: "m3u8", url: "https://jx.m3u8.tv/jiexi/?url=" },
        { title: "77",   url: "https://jx.77flv.cc/?url=" },
        { title: "虾米", url: "https://jx.xmflv.com/?url=" },
        { title: "MAC",  url: "https://free.maccms.xyz/?url=" },
        { title: "8090", url: "https://www.8090g.cn/jiexi/?url=" },
        { title: "CK",   url: "https://www.ckplayer.vip/jiexi/?url=" },
        { title: "剖云", url: "https://www.pouyun.com/?url=" },
        { title: "盘古", url: "https://www.pangujiexi.com/jiexi/?url=" },
        { title: "如意", url: "https://ruyiplayer.com/?url=" },
    ];

    GM_addStyle(`
        #vip-btn {
            position: fixed;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 2147483647;
            user-select: none;
            font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
        }

        #vip-icon {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: linear-gradient(135deg, #ff6b00, #ff9800);
            box-shadow: 0 4px 14px rgba(255,107,0,0.55);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.18s ease, box-shadow 0.18s ease;
            font-size: 13px;
            font-weight: 800;
            color: #fff;
            letter-spacing: -0.5px;
            flex-direction: column;
            line-height: 1;
        }
        #vip-icon:hover {
            transform: scale(1.08);
            box-shadow: 0 6px 20px rgba(255,107,0,0.7);
        }
        #vip-icon .icon-label {
            font-size: 10px;
            font-weight: 600;
            margin-top: 2px;
            opacity: 0.9;
        }

        #vip-panel {
            position: absolute;
            left: 52px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(18, 18, 22, 0.96);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 14px;
            padding: 8px 6px;
            min-width: 90px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.6);
            display: none;
            flex-direction: column;
            gap: 4px;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
        #vip-panel.open {
            display: flex;
            animation: panelIn 0.18s cubic-bezier(.22,1,.36,1);
        }
        @keyframes panelIn {
            from { opacity: 0; transform: translateY(-50%) translateX(-8px); }
            to   { opacity: 1; transform: translateY(-50%) translateX(0); }
        }

        .vip-panel-title {
            font-size: 10px;
            color: rgba(255,255,255,0.3);
            text-align: center;
            padding: 2px 0 4px;
            letter-spacing: 1px;
            text-transform: uppercase;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            margin-bottom: 2px;
        }

        .vip-item {
            padding: 7px 14px;
            border-radius: 8px;
            color: rgba(255,255,255,0.85);
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            text-align: center;
            transition: background 0.12s, color 0.12s;
            white-space: nowrap;
        }
        .vip-item:hover {
            background: linear-gradient(90deg, #ff6b00, #ff9800);
            color: #fff;
        }
    `);

    // --- Build DOM ---
    const container = document.createElement('div');
    container.id = 'vip-btn';

    const icon = document.createElement('div');
    icon.id = 'vip-icon';
    icon.innerHTML = `VIP<span class="icon-label">解析</span>`;

    const panel = document.createElement('div');
    panel.id = 'vip-panel';

    const titleEl = document.createElement('div');
    titleEl.className = 'vip-panel-title';
    titleEl.textContent = '选择接口';
    panel.appendChild(titleEl);

    PARSERS.forEach(parser => {
        const item = document.createElement('div');
        item.className = 'vip-item';
        item.textContent = parser.title;
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const videoUrl = location.href;
            const parseUrl = parser.url + encodeURIComponent(videoUrl);
            GM_openInTab(parseUrl, { active: true });
            panel.classList.remove('open');
        });
        panel.appendChild(item);
    });

    container.appendChild(icon);
    container.appendChild(panel);
    document.body.appendChild(container);

    // --- Restore position ---
    const savedTop = GM_getValue('vip_top', null);
    if (savedTop !== null) {
        container.style.top = savedTop;
        container.style.transform = 'none';
    }

    // --- Dragging (threshold-based, no preventDefault to avoid mgtv event conflicts) ---
    const DRAG_THRESHOLD = 6; // px，超过此距离才判定为拖动
    let mouseDownY = 0;
    let mouseDownTop = 0;
    let isPressing = false;  // 鼠标是否按下
    let hasDragged = false;  // 本次按下是否触发了真实拖动

    icon.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        isPressing = true;
        hasDragged = false;
        mouseDownY = e.clientY;
        // 将 transform 固定为实际 top，方便后续计算
        const rect = container.getBoundingClientRect();
        mouseDownTop = rect.top;
        container.style.transform = 'none';
        container.style.top = mouseDownTop + 'px';
        // 不调用 preventDefault，避免芒果TV播放器拦截后续事件
    });

    document.addEventListener('mousemove', (e) => {
        if (!isPressing) return;
        const dy = e.clientY - mouseDownY;
        if (!hasDragged && Math.abs(dy) < DRAG_THRESHOLD) return; // 未超阈值，忽略
        hasDragged = true;
        let newTop = mouseDownTop + dy;
        const maxTop = window.innerHeight - container.offsetHeight;
        newTop = Math.max(0, Math.min(newTop, maxTop));
        container.style.top = newTop + 'px';
    });

    // 同时监听 window 和 document，防止芒果TV播放器消费掉 mouseup
    const onMouseUp = () => {
        if (!isPressing) return;
        isPressing = false;
        if (hasDragged) {
            GM_setValue('vip_top', container.style.top);
        }
        // hasDragged 保留到 click 事件触发后再清除
        setTimeout(() => { hasDragged = false; }, 0);
    };
    document.addEventListener('mouseup', onMouseUp, true);   // capture 优先
    window.addEventListener('mouseup', onMouseUp, true);

    // --- Toggle panel（依赖 hasDragged 而非 isDragging）---
    icon.addEventListener('click', (e) => {
        e.stopPropagation();
        if (hasDragged) return; // 拖动结束触发的 click，忽略
        panel.classList.toggle('open');
    }, true); // capture 确保在芒果TV事件之前执行

    // --- Close panel on outside click ---
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) panel.classList.remove('open');
    });
})();
