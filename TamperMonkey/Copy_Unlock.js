// ==UserScript==
// @name       SuperCopy
// @description  解除部分网站不允许复制的限制，主要用于：百度文库|道客巴巴|腾讯文档|豆丁网|思否社区|力扣|知乎|语雀|QQ文档|360doc|17k|CSDN等
// @namespace   picassoTX_lifting_restrictions
// @version     2.0.16-clean
// @author      WindrunnerMax,picassoTX
// @license     MIT
// @match       *://wenku.baidu.com/view/*
// @match       *://wenku.baidu.com/share/*
// @match       *://wenku.baidu.com/link*
// @match       *://wenku.baidu.com/aggs/*
// @match       *://wenku.baidu.com/ndPureView/*
// @match       *://*.doc88.com/*
// @match       *://wk.baidu.com/view/*
// @match       *://*.zhihu.com/*
// @match       *://docs.qq.com/doc/*
// @match       *://docs.qq.com/sheet/*
// @match       *://boke112.com/*/*
// @match       *://*.diyifanwen.com/*
// @match       *://www.uemeds.cn/*
// @match       *://www.oh100.com/*
// @match       *://www.aiyuke.com/news/*
// @match       *://www.fwsir.com/*
// @match       *://www.wenxm.cn/*
// @match       *://www.unjs.com/*
// @match       *://*.yjbys.com/*
// @match       *://*.qidian.com/*
// @match       *://*.zongheng.com/*
// @match       *://*.17k.com/*
// @match       *://*.ciweimao.com/*
// @match       *://book.qq.com/*
// @match       *://*.360doc.com/content/*
// @match       *://*.850500.com/news/*
// @match       *://utaten.com/lyric/*
// @match       *://*.jianbiaoku.com/*
// @match       *://www.kejudati.com/*
// @match       *://*.blog.csdn.net/*
// @match       *://*.bilibili.com/read/*
// @match       *://*.cnki.net/KXReader/*
// @match       *://*.cnrencai.com/*
// @match       *://*.jianshu.com/p/*
// @match       *://*.linovelib.com/novel/*
// @match       *://*.juejin.cn/post/*
// @match       *://*.zgbk.com/ecph/*
// @match       *://yuedu.baidu.com/*
// @match       *://www.shubaoc.com/*
// @match       *://blog.51cto.com/*
// @match       *://*.docin.com/*
// @match       *://*.ddwk8.cn/*
// @match       *://fanqienovel.com/*
// @match       *://*.examcoo.com/*
// @match       *://*.rrdynb.com/*
// @match       *://*.fuwu7.com/*
// @match       *://*.aipiaxi.com/*
// @match       *://wenku.csdn.net/*
// @match       *://www.kdocs.cn/*
// @match       *://*.mcmod.cn/*
// @match       *://*.yuque.com/*
// @match       *://*.51cto.com/*
// @match       *://vcsmemo.com/article/*
// @match       *://www.jinrilvsi.com/*
// @match       *://www.9136.com/*
// @match       *://www.jdxzz.com/*
// @match       *://www.gaosan.com/*/*.html
// @match       *://ai-bot.cn/sites/*.html
// @match       *://www.lyrical-nonsense.com/lyrics/*
// @match       *://tongxiehui.net/by/*
// @match       *://www.xuexila.com/*
// @match       *://www.ruiwen.com/article/*
// @match       *://*.cooco.net.cn/testdetail/**
// @match       *://www.51test.net/show/*.html
// @match       *://16map.com/sites/*.html
// @match       *://*.lqsbcl.net/*/**
// @exclude     *://stat.doc88.com/*
// @exclude     *://www.lqsbcl.net/*
// @connect     res3.doc88.com
// @license     MIT
// @run-at      document-start
// @grant       unsafeWindow
// @grant       GM_xmlhttpRequest
// @supportURL  https://github.com/Picasso-TX/TKScript/issues
// @updateURL   https://api.staticj.top/script/update/copy.meta.js
// @downloadURL https://api.staticj.top/script/update/copy.user.js
// ==/UserScript==

(function () {
  'use strict';

  var css_button = ".__copied-button{align-items:center;background:#000;border-radius:3px;color:#fff;cursor:pointer;display:flex;font-size:12px;justify-content:center;opacity:0;padding:4px 10px;position:absolute;transition:opacity .3s;z-index:-1000}";
  var css_hide = "#select-tooltip,#sfModal,.modal-backdrop,div[id^=reader-helper]{display:none!important}.modal-open{overflow:auto!important}._sf_adjust_body{padding-right:0!important}";

  const DOM_STAGE = { START: "document-start", END: "document-end" };
  const DOM_READY = "DOMContentLoaded";
  const PAGE_LOADED = "load";
  const MOUSE_UP = "mouseup";
  const COPY = "copy";
  const SELECT_START = "selectstart";
  const CONTEXT_MENU = "contextmenu";
  const KEY_DOWN = "keydown";
  const TEXT_PLAIN = "text/plain";
  const TEXT_HTML = "text/html";

  function isString(value) {
    return Object.prototype.toString.call(value) === "[object String]";
  }

  const dom = {
    query: (selector) => document.querySelector(selector),
    attr: (selector, attr, value) => {
      const el = document.querySelector(selector);
      el && el.setAttribute(attr, value);
    },
    append: (selector, content) => {
      const container = document.createElement("div");
      isString(content) ? (container.innerHTML = content) : container.appendChild(content);
      const target = document.querySelector(selector);
      target && target.append(container);
      return container;
    },
    remove: (selector) => {
      const el = document.querySelector(selector);
      el && el.remove();
    }
  };

  // 基础事件：阻止网站的 copy 事件传播
  const initBaseEvent = (websiteConfig) => {
    window.addEventListener(DOM_READY, () => {
      if (websiteConfig.initCopyEvent) {
        document.oncopy = (e) => e.stopPropagation();
        document.body.oncopy = (e) => e.stopPropagation();
        document.addEventListener(COPY, (e) => e.stopPropagation());
        document.body.addEventListener(COPY, (e) => e.stopPropagation());
      }
    });
  };

  const initBaseStyle = () => {
    window.addEventListener(DOM_READY, () => {
      dom.append("head", `<style>${css_button}</style>`);
      dom.append("head", `<style>${css_hide}</style>`);
    });
  };

  // 执行复制：优先 Clipboard API，降级 execCommand
  const execCopyCommand = (data) => {
    const textarea = document.createElement("textarea");
    const handler = (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      for (const [key, value] of Object.entries(data)) {
        event.clipboardData && event.clipboardData.setData(key, value);
      }
    };
    textarea.addEventListener(COPY, handler, true);
    textarea.style.cssText = "position:fixed;left:-999999999px;top:-999999999px";
    textarea.value = data[TEXT_PLAIN] || " ";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.removeEventListener(COPY, handler);
    document.body.removeChild(textarea);
  };

  const isEmptyContent = (data) => {
    if (!data) return true;
    return isString(data) ? !data : !data[TEXT_PLAIN];
  };

  const copy = (data) => {
    const params = isString(data) ? { [TEXT_PLAIN]: data } : data;
    if (!params[TEXT_PLAIN]) return false;
    if (navigator.clipboard && window.ClipboardItem) {
      const dataItems = {};
      for (const [key, value] of Object.entries(params)) {
        dataItems[key] = new Blob([value], { type: key });
      }
      navigator.clipboard.write([new ClipboardItem(dataItems)]).catch(() => execCopyCommand(params));
    } else {
      execCopyCommand(params);
    }
    return true;
  };

  // 浮动复制按钮
  let btnDom = null;
  let isReadyToHidden = false;
  const instance = {
    init(name) {
      const el = document.createElement("div");
      el.id = "__copy";
      el.className = "__copied-button";
      el.innerText = name || "复制";
      el.addEventListener("mouseup", (e) => e.stopPropagation(), true);
      el.addEventListener("mousedown", (e) => e.stopPropagation(), true);
      btnDom = el;
      document.body.appendChild(btnDom);
    },
    getInstance() {
      if (!btnDom) this.init();
      return btnDom;
    },
    show(event) {
      if (isReadyToHidden) return;
      const el = this.getInstance();
      el.style.left = `${event.pageX + 30}px`;
      el.style.top = `${event.pageY}px`;
      el.style.opacity = "1";
      el.style.zIndex = "1000";
    },
    hide(keep = 350) {
      const el = this.getInstance();
      el.style.opacity = "0";
      if (keep) {
        isReadyToHidden = true;
        setTimeout(() => { el.style.zIndex = "-10000"; isReadyToHidden = false; }, keep);
      }
    },
    onCopy(content, event) {
      const el = this.getInstance();
      this.show(event);
      el.onclick = () => { copy(content); this.hide(); };
    },
    enable() { this.getInstance().style.display = "flex"; },
    disable() { this.getInstance().style.display = "none"; }
  };

  const stopProp = (e) => e.stopPropagation();
  const utils = {
    hideButton: () => instance.disable(),
    showButton: () => instance.enable(),
    removeAttributes: (selector, attrs = []) => {
      const el = isString(selector) ? document.querySelector(selector) : selector;
      el && attrs.forEach((a) => el.removeAttribute(a));
    },
    enableUserSelectByCSS: (css) => {
      const defaultCss = `*{-webkit-touch-callout:auto!important;-webkit-user-select:auto!important;-moz-user-select:auto!important;-khtml-user-select:auto!important;-ms-user-select:auto!important;}`;
      const style = document.createElement("style");
      style.innerHTML = css || defaultCss;
      const head = document.getElementsByTagName("head")[0];
      if (head) head.appendChild(style);
      else window.addEventListener(PAGE_LOADED, () => document.getElementsByTagName("head")[0].appendChild(style));
    },
    enableOnSelectStart: (sel) => { const el = document.querySelector(sel); el && el.addEventListener(SELECT_START, stopProp); },
    enableOnContextMenu: (sel) => { const el = document.querySelector(sel); el && el.addEventListener(CONTEXT_MENU, stopProp); },
    enableOnCopy: (sel) => { const el = document.querySelector(sel); el && el.addEventListener(COPY, stopProp); },
    enableOnKeyDown: (sel) => {
      const el = document.querySelector(sel);
      el && el.addEventListener(KEY_DOWN, (e) => { if (e.key === "c" && e.ctrlKey) e.stopPropagation(); });
    },
    enableOnSelectStartByCapture: () => {
      window.addEventListener(SELECT_START, stopProp, true);
      document.addEventListener(SELECT_START, stopProp, true);
    },
    enableOnContextMenuByCapture: () => {
      window.addEventListener(CONTEXT_MENU, stopProp, true);
      document.addEventListener(CONTEXT_MENU, stopProp, true);
    },
    enableOnCopyByCapture: () => {
      window.addEventListener(COPY, stopProp, true);
      document.addEventListener(COPY, stopProp, true);
    },
    enableOnKeyDownByCapture: () => {
      document.addEventListener(KEY_DOWN, (e) => e.ctrlKey && e.key.toLocaleUpperCase() === "C" && e.stopPropagation(), true);
    }
  };

  // ===== 网站适配器 =====

  // doc88
  let path = "";
  const siteDoc88 = {
    regexp: /.*doc88\.com\/.+/,
    init: () => {
      dom.append("body", `<style id="copy-element-hide">#left-menu{display:none!important}</style>`);
      GM_xmlhttpRequest({
        method: "GET",
        url: "https://res3.doc88.com/resources/js/modules/main-v2.min.js?v=3.55",
        onload: (response) => {
          const r = /\("#cp_textarea"\).val\(([\S]*?)\);/.exec(response.responseText);
          if (r) path = r[1];
        }
      });
      window.addEventListener("load", () => {
        const cpFn = unsafeWindow.copyText.toString();
        const r = /<textarea[\s\S]*?>'\+([  \S]*?)\+"<\/textarea>/.exec(cpFn);
        if (r) path = r[1];
      });
    },
    getSelectedText: () => {
      let sel = unsafeWindow;
      path.split(".").forEach((v) => { sel = sel[v]; });
      if (!sel) {
        unsafeWindow.Config.vip = 1;
        unsafeWindow.Config.logined = 1;
        dom.remove("#copy-element-hide");
      }
      return sel;
    }
  };

  // 百度文库 wk
  const siteWkBaidu = {
    regexp: /.*wk\.baidu\.com\/view\/.+/,
    init() {
      utils.hideButton();
      utils.enableOnSelectStartByCapture();
      window.onload = () => dom.attr(".sf-edu-wenku-vw-container", "style", "");
    }
  };

  // 知乎
  const siteZhihu = {
    regexp: /.*zhihu\.com\/.*/,
    init() {
      utils.hideButton();
      utils.enableUserSelectByCSS();
      utils.enableOnCopyByCapture();
      if (location.hostname === "zhuanlan.zhihu.com") {
        const observer = new MutationObserver((list) => {
          for (const m of list) {
            for (const node of m.addedNodes) {
              if (node.nodeType !== 1) continue;
              if (node instanceof HTMLDivElement && node.querySelector("[data-focus-scope-start]")) {
                const el = node.querySelector("[data-focus-scope-start]");
                if (el && el.parentElement && el.parentElement.textContent.includes("立即登录/注册")) {
                  el.parentElement.parentElement && el.parentElement.parentElement.removeChild(el.parentElement);
                }
              }
            }
          }
        });
        observer.observe(document, { childList: true, subtree: true });
      }
    }
  };

  // 腾讯文档
  const siteTencentDoc = {
    regexp: /.*docs\.qq\.com\/.+/,
    config: { initCopyEvent: false, captureInstance: true, delay: 100 },
    init() {
      window.onload = () => utils.hideButton();
    },
    getSelectedText() {
      if (unsafeWindow.pad && unsafeWindow.pad.editor && !unsafeWindow.pad.editor.isCopyable()) {
        utils.showButton();
        const editor = unsafeWindow.pad.editor;
        if (editor.getCopyContent) {
          const content = editor.getCopyContent() || {};
          return { [TEXT_PLAIN]: content.plain || "", [TEXT_HTML]: content.html || "" };
        } else {
          editor._docEnv.copyable = true;
          editor.clipboardManager.copy();
          const plain = editor.clipboardManager.customClipboard.plain || "";
          const html = editor.clipboardManager.customClipboard.html || "";
          editor._docEnv.copyable = false;
          return { [TEXT_PLAIN]: plain, [TEXT_HTML]: html };
        }
      } else if (
        unsafeWindow.SpreadsheetApp &&
        unsafeWindow.SpreadsheetApp.permissions?.sheetStatus?.canCopy === false &&
        unsafeWindow.SpreadsheetApp.permissions?.sheetStatus?.canEdit?.() === false
      ) {
        utils.showButton();
        const SA = unsafeWindow.SpreadsheetApp;
        const [selection] = SA.view.getSelectionRanges();
        if (selection) {
          const text = [];
          const { startColIndex, startRowIndex, endColIndex, endRowIndex } = selection;
          for (let i = startRowIndex; i <= endRowIndex; i++) {
            for (let k = startColIndex; k <= endColIndex; k++) {
              const cell = SA.workbook.activeSheet.getCellDataAtPosition(i, k);
              if (cell) text.push(" ", cell.formattedValue?.value || cell.value || "");
            }
            if (i !== endRowIndex) text.push("\n");
          }
          const str = text.join("");
          return /^\s*$/.test(str) ? "" : str;
        }
        return "";
      }
      return "";
    }
  };

  // boke112
  const siteBoke112 = {
    regexp: /boke112\.com/,
    init() {
      utils.enableOnCopyByCapture();
      dom.append("head", `<style>:not(input):not(textarea)::selection{background-color:#2440B3!important;color:#fff!important}:not(input):not(textarea)::-moz-selection{background-color:#2440B3!important;color:#fff!important}</style>`);
    }
  };

  // 第一范文
  const siteDiyifanwen = {
    regexp: /diyifanwen/,
    init() {
      utils.hideButton();
      utils.enableOnCopyByCapture();
      utils.enableOnKeyDownByCapture();
    }
  };

  // mbalib
  const siteMbalib = {
    regexp: /mbalib/,
    init() {
      window.onload = () => utils.removeAttributes("fullScreenContainer", ["oncopy", "oncontextmenu", "onselectstart"]);
    }
  };

  // uemeds
  const siteUemeds = {
    regexp: /.+www\.uemeds\.cn\/.+/,
    init() { utils.hideButton(); utils.enableUserSelectByCSS(); }
  };

  // aiyuke
  const siteAiyuke = {
    regexp: /.+aiyuke\.com\/news\/.+/,
    init() { utils.hideButton(); utils.enableUserSelectByCSS(); }
  };

  // 起点
  const siteQidian = {
    regexp: /qidian/,
    init() {
      utils.hideButton();
      utils.enableUserSelectByCSS();
      utils.enableOnCopy(".main-read-container");
      utils.enableOnContextMenu(".main-read-container");
    }
  };

  // 纵横
  const siteZongheng = {
    regexp: /zongheng/,
    init() {
      utils.removeAttributes(".reader_box", ["style", "unselectable", "onselectstart"]);
      utils.removeAttributes(".reader_main", ["style", "unselectable", "onselectstart"]);
      utils.hideButton();
      utils.enableOnKeyDown("body");
      utils.enableUserSelectByCSS();
      utils.enableOnCopy(".content");
      utils.enableOnContextMenu("body");
      utils.enableOnSelectStart(".content");
    }
  };

  // 17k
  const site17k = {
    regexp: /17k/,
    init() { utils.hideButton(); utils.enableOnCopy(".readAreaBox .p"); }
  };

  // 刺猬猫
  const siteCiweimao = {
    regexp: /ciweimao/,
    init() {
      utils.hideButton();
      utils.enableUserSelectByCSS();
      utils.enableOnCopy("#J_BookCnt");
      utils.enableOnContextMenu("body");
      utils.enableOnSelectStart("#J_BookCnt");
    }
  };

  // QQ书城
  const siteBookQQ = {
    regexp: /book\.qq/,
    init() {
      utils.hideButton();
      utils.enableOnCopy("body");
      utils.enableUserSelectByCSS();
      utils.enableOnContextMenu("body");
      utils.enableOnSelectStart("body");
    }
  };

  // utaten
  const siteUtaten = {
    regexp: /utaten/,
    init() {
      utils.hideButton();
      utils.enableUserSelectByCSS();
      utils.enableOnSelectStartByCapture();
    }
  };

  // 百度文库（Canvas渲染）
  const siteWenkuBaidu = {
    config: { runAt: DOM_STAGE.START },
    regexp: /wenku\.baidu\.com\/(view|link|aggs).*/,
    init() {
      dom.append("head", `<style>@media print{body{display:block}}</style>`);
      let canvasDataGroup = [];
      const ctx2dProto = unsafeWindow.document.createElement("canvas").getContext("2d").__proto__;
      document.createElement = new Proxy(document.createElement, {
        apply(target, thisArg, args) {
          const el = Reflect.apply(target, thisArg, args);
          if (args[0] === "canvas") {
            const tmp = { canvas: el, data: [] };
            el.getContext("2d").fillText = function (...a) {
              tmp.data.push(a);
              ctx2dProto.fillText.apply(this, a);
            };
            canvasDataGroup.push(tmp);
          }
          return el;
        }
      });
      let pageData = {};
      Object.defineProperty(unsafeWindow, "pageData", {
        set: (v) => (pageData = v),
        get() {
          if (!pageData.vipInfo) return (pageData.vipInfo = {});
          pageData.vipInfo.global_svip_status = 1;
          pageData.vipInfo.global_vip_status = 1;
          pageData.vipInfo.isVip = 1;
          pageData.vipInfo.isWenkuVip = 1;
          return pageData;
        }
      });
      const render = () => {
        canvasDataGroup = canvasDataGroup.filter((i) => i.canvas.id);
        let templateText = canvasDataGroup.map((cd, idx) => {
          const top = idx * Number(cd.canvas.clientHeight);
          return cd.data.map((i) => `<div style="position:absolute;left:${i[1]}px;top:${i[2] + top}px">${i[0]}</div>`).join("");
        });
        const editorView = document.querySelector("#editor-view");
        if (editorView) templateText = [editorView.innerHTML];
        const html = `<div id='copy-template-html'><div class='template-container'><div class='title-container'><div>请自行复制</div><div id='template-close'>关闭</div></div><div id='copy-template-text'>${templateText.join("")}</div></div></div>`;
        const css = `<style id='copy-template-css'>body{overflow:hidden!important}#copy-template-html{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:999999;background:rgba(0,0,0,.5)}#copy-template-html>.template-container{height:80%;width:80%;background:#fff}.template-container>.title-container{display:flex;align-items:center;justify-content:space-between;padding:10px;border-bottom:1px solid #eee}#copy-template-text{height:100%;width:100%;position:relative;overflow:auto;background:#fff}#copy-template-html #template-close{cursor:pointer}</style>`;
        dom.append("body", html);
        dom.append("body", css);
        const closeBtn = document.querySelector("#copy-template-html #template-close");
        const close = () => { dom.remove("#copy-template-html"); dom.remove("#copy-template-css"); closeBtn && closeBtn.removeEventListener("click", close); };
        closeBtn && closeBtn.addEventListener("click", close);
      };
      document.addEventListener("DOMContentLoaded", () => {
        dom.append("head", `<style>#copy-btn-wk{padding:10px;background:rgba(0,0,0,.5);position:fixed;left:0;top:40%;cursor:pointer;color:#fff;z-index:99999}</style>`);
        dom.append("body", "<div id='copy-btn-wk'>复制</div>");
        const btn = dom.query("#copy-btn-wk");
        btn && (btn.onclick = render);
      });
    },
    getSelectedText() {
      if (window.getSelection && window.getSelection().toString()) return window.getSelection().toString();
      const r = /查看全部包含“([\s\S]*?)”的文档/.exec(document.body.innerHTML);
      return r ? r[1] : "";
    }
  };

  // CSDN
  const siteCsdn = {
    regexp: /csdn/,
    init() { utils.hideButton(); utils.enableOnCopyByCapture(); utils.enableUserSelectByCSS(); }
  };

  // B站专栏
  const siteBilibili = {
    regexp: /bilibili/,
    init() { utils.hideButton(); utils.enableOnCopyByCapture(); }
  };

  // 知网
  const siteCnki = {
    regexp: /cnki/,
    init() {
      utils.hideButton();
      utils.enableOnContextMenuByCapture();
      utils.enableOnKeyDownByCapture();
      utils.enableOnCopyByCapture();
    }
  };

  // 豆丁网
  const siteDocin = {
    regexp: /docin\.com\/.*/,
    config: { initCopyEvent: false, captureInstance: true, delay: 100 },
    init() {
      window.addEventListener(PAGE_LOADED, () => dom.query("#j_select")?.click());
      dom.append("head", "<style>#reader-copy-el{display:none}</style>");
    },
    getSelectedText() {
      return (unsafeWindow.docinReader && unsafeWindow.docinReader.st) || "";
    }
  };

  // 金山文档
  const siteKdoc = {
    config: { runAt: DOM_STAGE.START },
    regexp: /kdocs/,
    init() {
      const patch = () => { unsafeWindow.APP && (unsafeWindow.APP.canCopy = () => true); };
      if (unsafeWindow.APP) patch();
      else {
        let APP;
        Object.defineProperty(unsafeWindow, "APP", {
          configurable: false,
          set: (v) => { APP = v; v && patch(); },
          get: () => APP
        });
      }
    }
  };

  // 通用多站点（CSS+copy事件解锁）
  const siteGeneral = {
    regexp: new RegExp([
      "cnki", "oh100", "fwsir", "wenxm", "unjs", "yjbys", "360doc", "850500",
      "jianbiaoku", "kejudati", "yuque", "cnrencai", "ndPureView", "jianshu",
      "linovelib", "chazidian", "juejin", "zgbk", "yuedu\\.baidu", "shubaoc",
      "51cto", "ddwk8", "fanqienovel\\.com/reader", "cooco\\.net\\.cn", "aipiaxi",
      "wenku\\.csdn\\.net", "mcmod\\.cn", "51cto\\.com", "vcsmemo\\.com",
      "www\\.lyrical-nonsense\\.com", "tongxiehui\\.net", "www\\.xuexila\\.com",
      "www\\.ruiwen\\.com", "www\\.51test\\.net"
    ].join("|")),
    init() { utils.hideButton(); utils.enableUserSelectByCSS(); utils.enableOnCopyByCapture(); }
  };

  // 全封锁站点（CSS+所有事件捕获解锁）
  const siteStrict = {
    regexp: new RegExp(["rrdynb", "fuwu7", "jinrilvsi\\.com", "www\\.9136\\.com", "www\\.jdxzz\\.com", "www\\.gaosan\\.com", "lqsbcl\\.net"].join("|")),
    init() {
      utils.hideButton();
      utils.enableUserSelectByCSS();
      utils.enableOnCopyByCapture();
      utils.enableOnKeyDownByCapture();
      utils.enableOnSelectStartByCapture();
      utils.enableOnContextMenuByCapture();
    }
  };

  // examcoo
  const siteExamcoo = {
    config: { runAt: DOM_STAGE.START },
    regexp: /examcoo/,
    init() {
      utils.hideButton();
      utils.enableUserSelectByCSS();
      utils.enableOnCopyByCapture();
      utils.enableOnKeyDownByCapture();
      utils.enableOnSelectStartByCapture();
      utils.enableOnContextMenuByCapture();
    }
  };

  // ai-bot / 16map
  const siteAiBot = {
    config: { runAt: DOM_STAGE.END },
    regexp: /16map\.com|ai-bot\.cn/,
    init() {
      utils.hideButton();
      utils.enableUserSelectByCSS(`body *:not(input):not(textarea){-webkit-touch-callout:auto!important;-webkit-user-select:auto!important;-moz-user-select:auto!important;-khtml-user-select:auto!important;-ms-user-select:auto!important;}`);
    }
  };

  // ===== 调度 =====
  const websites = [
    siteWkBaidu, siteZhihu, siteTencentDoc, siteBoke112, siteDiyifanwen,
    siteMbalib, siteUemeds, siteAiyuke, siteQidian, siteZongheng,
    site17k, siteCiweimao, siteBookQQ, siteUtaten, siteWenkuBaidu,
    siteDoc88, siteCsdn, siteBilibili, siteCnki, siteDocin,
    siteKdoc, siteGeneral, siteStrict, siteExamcoo, siteAiBot
  ];

  let siteGetSelectedText = null;
  const initWebsite = () => {
    let websiteConfig = { initCopyEvent: true, runAt: DOM_STAGE.END, captureInstance: false, delay: 0 };
    for (const site of websites) {
      if (site.regexp.test(window.location.href)) {
        if (site.config) Object.assign(websiteConfig, site.config);
        if (websiteConfig.runAt === DOM_STAGE.END) {
          window.addEventListener(DOM_READY, () => site.init());
        } else {
          site.init();
        }
        if (site.getSelectedText) siteGetSelectedText = site.getSelectedText.bind(site);
        break;
      }
    }
    return websiteConfig;
  };

  const getSelectedText = () => {
    if (siteGetSelectedText) return siteGetSelectedText();
    if (window.getSelection) return (window.getSelection() || "").toString();
    if (document.getSelection) return (document.getSelection() || "").toString();
    if (document.selection) return document.selection.createRange().text;
    return "";
  };

  (function () {
    const websiteConfig = initWebsite();
    initBaseEvent(websiteConfig);
    initBaseStyle();
    window.addEventListener(MOUSE_UP, (e) => {
      const handler = () => {
        const content = getSelectedText();
        if (isEmptyContent(content)) { instance.hide(); return; }
        instance.onCopy(content, e);
      };
      websiteConfig.delay ? setTimeout(handler, websiteConfig.delay) : handler();
    }, websiteConfig.captureInstance);
  })();

}());
