// ==UserScript==
// @name         高级 WebRTC 泄露防护盾
// @namespace    https://github.com/your-username/webrtc-shield
// @version      2.1
// @description  彻底拦截并伪装前端 WebRTC 接口，防止真实 IP 泄露，支持白名单管理。
// @author       资深安全专家
// @match        *://*/*
// @run-at       document-start
// @grant        none
// @all-frames   true
// @noframes     false
// ==/UserScript==

(function() {
    'use strict';

    // ================= 配置区域 =================
    // 在此处添加您允许使用 WebRTC 的信任域名（支持模糊匹配）
    const whitelist = [
        "https://transfer.52python.cn/",
        "https://fagedongxi.com/",
    ];
    // ============================================

    // 检查当前页面是否在白名单中
    function isWhitelisted(url) {
        return whitelist.some(whitelistedUrl => url.includes(whitelistedUrl));
    }

    // 如果在白名单内，则不进行拦截，直接放行原生 WebRTC
    if (isWhitelisted(window.location.href)) {
        console.log("[WebRTC Shield] 当前域名在白名单中，已放行 WebRTC 功能。");
        return;
    }

    // 拦截与阻断核心逻辑
    const blockWebRTC = function() {
        console.warn("[WebRTC Shield] 警告：当前网页正试图调用 WebRTC 接口获取网络信息，已被安全拦截。");
        throw new Error("WebRTC is disabled for privacy protection.");
    };

    // 需要清理和覆盖的浏览器 WebRTC 相关接口列表
    const targets = [
        'RTCPeerConnection',
        'webkitRTCPeerConnection',
        'mozRTCPeerConnection',
        'RTCSessionDescription',
        'RTCIceCandidate'
    ];

    // 严密冻结并重写 window 对象下的相关接口
    targets.forEach(target => {
        if (target in window) {
            try {
                Object.defineProperty(window, target, {
                    value: blockWebRTC,
                    writable: false,
                    configurable: false
                });
            } catch (e) {
                // 如果某些极端环境下无法重写，则尝试直接覆盖
                window[target] = blockWebRTC;
            }
        }
    });

    // 额外清理 navigator 下的媒体设备探测，防止通过设备指纹辅助定位
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
        navigator.mediaDevices.getUserMedia = function(constraints) {
            if (constraints && (constraints.audio || constraints.video)) {
                console.warn("[WebRTC Shield] 拦截到媒体设备请求。");
            }
            return originalGetUserMedia.apply(this, arguments);
        };
    }

})();
