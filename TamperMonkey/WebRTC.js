// ==UserScript==
// @name         禁用WebRTC
// @version      1.2
// @description  通过重写构造函数防止WebRTC泄露IP，比直接置空更稳定
// @author       Gemini
// @match        *://*/*
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const whitelist = [
        "https://fagedongxi.com/",
        "https://example.net"
    ];

    function isWhitelisted(url) {
        return whitelist.some(whitelistedUrl => url.startsWith(whitelistedUrl));
    }

    if (!isWhitelisted(window.location.href)) {
        const Win = unsafeWindow || window;

        // 备份原始构造函数（可选，此处直接重写以达到温和禁用的目的）
        const RTCPeerConnection = Win.RTCPeerConnection || Win.webkitRTCPeerConnection || Win.mozRTCPeerConnection;

        if (RTCPeerConnection) {
            // 重写构造函数
            const EmptyRTCPeerConnection = function(config) {
                const pc = new RTCPeerConnection(config);
                
                // 拦截创建 Offer 的过程，使其不返回真实的 SDP
                pc.createOffer = () => Promise.resolve({ type: 'offer', sdp: '' });
                pc.createAnswer = () => Promise.resolve({ type: 'answer', sdp: '' });
                
                // 屏蔽候选人收集
                Object.defineProperty(pc, 'onicecandidate', {
                    set: () => {},
                    get: () => null
                });

                return pc;
            };

            // 覆盖原接口
            Win.RTCPeerConnection = EmptyRTCPeerConnection;
            Win.webkitRTCPeerConnection = EmptyRTCPeerConnection;
            Win.mozRTCPeerConnection = EmptyRTCPeerConnection;
        }
    }
})();
