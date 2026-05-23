/* ========================================
   魔法使之夜 — 演出与交互引擎
   ======================================== */

"use strict";

(function () {
  /* ---------- 1. 魔法微音效合成器 (Web Audio API Synthesizer) ---------- */
  const AUDIO_KEY = "mahoyo-sfx-enabled";
  let audioCtx = null;
  let sfxEnabled = localStorage.getItem(AUDIO_KEY) === "true"; // 默认跟随本地缓存

  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  /** 合成精致音效，免除网络音频资源加载失败问题 */
  function playSFX(type) {
    if (!sfxEnabled) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      if (type === "click") {
        // 水晶点击音效
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.12);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === "theme-alice") {
        // 幽邃的洋馆魔法声 (Alice 暗色)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc1.type = "triangle";
        osc1.frequency.setValueAtTime(240, now);
        osc1.frequency.exponentialRampToValueAtTime(120, now + 0.5);

        osc2.type = "sine";
        osc2.frequency.setValueAtTime(480, now);
        osc2.frequency.exponentialRampToValueAtTime(240, now + 0.5);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(600, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.5);
        osc2.stop(now + 0.5);
      } else if (type === "theme-aoko") {
        // 清脆升腾的魔术回路激活声 (Aoko 亮色)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(960, now + 0.4);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (err) {
      console.warn("SFX synthesis failed:", err);
    }
  }

  function initAudioToggle() {
    const btn = document.getElementById("audioToggleBtn");
    if (!btn) return;

    const icon = btn.querySelector(".audio-icon");

    // 根据初始状态更新 UI
    if (sfxEnabled) {
      btn.classList.add("active");
      if (icon) icon.textContent = "🔊";
    }

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      sfxEnabled = !sfxEnabled;
      localStorage.setItem(AUDIO_KEY, sfxEnabled);

      if (sfxEnabled) {
        btn.classList.add("active");
        if (icon) icon.textContent = "🔊";
        // 激活时播放一次 click 以测试
        playSFX("click");
      } else {
        btn.classList.remove("active");
        if (icon) icon.textContent = "🔇";
      }
    });
  }

  /* ---------- 2. 主题切换 & View Transitions 结界过渡 ---------- */
  const THEME_KEY = "mahoyo-theme";
  const DEFAULTS = {
    theme: "alice",
    accent: "#a855f7",
  };

  function getTheme() {
    return (
      localStorage.getItem(THEME_KEY) ||
      document.documentElement.getAttribute("data-theme") ||
      DEFAULTS.theme
    );
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);

    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      btn.setAttribute("aria-label", theme === "alice" ? "切换亮色" : "切换暗色");
    });
  }

  function initTheme() {
    const saved = getTheme();
    if (!document.documentElement.hasAttribute("data-theme")) {
      setTheme(saved);
    }
  }

  function toggleTheme(e) {
    const current = getTheme();
    const next = current === "alice" ? "aoko" : "alice";

    // 绑定点击音效
    playSFX(next === "alice" ? "theme-alice" : "theme-aoko");

    // 检查是否支持原生的 View Transitions API
    if (document.startViewTransition) {
      // 捕获点击坐标以设置遮罩原点
      const x = e ? e.clientX : window.innerWidth / 2;
      const y = e ? e.clientY : window.innerHeight / 2;
      document.documentElement.style.setProperty("--click-x", `${x}px`);
      document.documentElement.style.setProperty("--click-y", `${y}px`);

      document.startViewTransition(() => {
        setTheme(next);
      });
    } else {
      // 优雅降级
      setTheme(next);
      document.body.style.transition = "background-color 0.6s ease, color 0.6s ease";
    }
  }

  /* ---------- 3. 文字雾化出现演出动画 (Reveal Typing) ---------- */
  function initRevealTyping() {
    const elements = document.querySelectorAll(
      ".hero-title, .hero-sub, .reveal-typing, article blockquote"
    );
    elements.forEach((el) => {
      if (el.dataset.revealed) return;
      el.dataset.revealed = "true";

      const text = el.textContent.trim();
      el.innerHTML = ""; // 清空
      
      const chars = [...text];
      chars.forEach((char, idx) => {
        const span = document.createElement("span");
        span.className = "reveal-char";
        // 非换行空格处理
        span.textContent = char === " " ? "\u00A0" : char; 
        span.style.animationDelay = `${idx * 0.05 + 0.1}s`;
        el.appendChild(span);
      });
    });
  }

  /* ---------- 4. Pagefind 全文检索面板控制器 ---------- */
  let pagefindLoaded = false;
  let pagefindInstance = null;

  async function initPagefind() {
    if (pagefindLoaded) return;
    try {
      const prefix = window.PATH_PREFIX || "";
      // 动态导入 Pagefind 构建出来的 JS 文件
      const pagefind = await import(`${prefix}/pagefind/pagefind.js`);
      await pagefind.options({
        showImages: false
      });
      pagefindInstance = pagefind;
      pagefindLoaded = true;
      console.log("Pagefind 引擎动态装载成功。");
    } catch (err) {
      console.error("加载 Pagefind 客户端失败:", err);
    }
  }

  function initSearch() {
    const overlay = document.getElementById("searchOverlay");
    const closeBtn = document.getElementById("searchClose");
    const toggleBtn = document.getElementById("searchToggleBtn");
    const input = document.getElementById("search-input");
    const resultsContainer = document.getElementById("searchResults");

    if (!overlay || !closeBtn || !toggleBtn || !input) return;

    async function openSearch() {
      overlay.classList.add("active");
      input.focus();
      playSFX("click");
      await initPagefind();
    }

    function closeSearch() {
      overlay.classList.remove("active");
      playSFX("click");
      input.value = "";
      resultsContainer.innerHTML = "";
    }

    toggleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openSearch();
    });

    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      closeSearch();
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeSearch();
      }
    });

    // 实时搜索事件监听
    input.addEventListener("input", async (e) => {
      const query = e.target.value.trim();
      if (!query) {
        resultsContainer.innerHTML = "";
        return;
      }

      if (pagefindInstance) {
        // 调用 Pagefind 核心搜索
        const search = await pagefindInstance.search(query);
        resultsContainer.innerHTML = "";

        if (search.results.length === 0) {
          resultsContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2em 0;">未寻觅到相关线索...</div>`;
          return;
        }

        // 展示前 6 条结果
        for (const result of search.results.slice(0, 6)) {
          const data = await result.data();
          const entry = document.createElement("article");
          entry.className = "pagefind-result";
          entry.innerHTML = `
            <div class="pagefind-result-title">
              <a href="${data.url}">${data.meta.title}</a>
            </div>
            <div class="pagefind-result-excerpt">${data.excerpt}</div>
          `;
          // 点击搜索结果音效
          entry.addEventListener("click", () => playSFX("click"));
          resultsContainer.appendChild(entry);
        }
      }
    });

    // 全局快捷键：按下 `/` 打开，按下 `ESC` 关闭
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "/" &&
        !overlay.classList.contains("active") &&
        document.activeElement !== input &&
        document.activeElement.tagName !== "TEXTAREA" &&
        document.activeElement.tagName !== "INPUT"
      ) {
        e.preventDefault();
        openSearch();
      } else if (e.key === "Escape" && overlay.classList.contains("active")) {
        closeSearch();
      }
    });
  }

  /* ---------- 5. IntersectionObserver — 渐显动画 ---------- */
  function initReveal() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -20px 0px",
      }
    );

    document.querySelectorAll(".fade-in, .fade-in-strong, .reveal").forEach((el) => {
      observer.observe(el);
    });
  }

  /* ---------- 6. 导航栏毛玻璃动态效果 ---------- */
  function initHeaderGlass() {
    const header = document.querySelector("header");
    if (!header) return;

    let ticking = false;

    window.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          if (scrollY > 20) {
            header.classList.add("header-scrolled");
          } else {
            header.classList.remove("header-scrolled");
          }
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  /* ---------- 7. 页面加载动画 ---------- */
  function initPageLoad() {
    document.body.classList.add("page-loaded");

    setTimeout(() => {
      document.querySelectorAll(".post-entry").forEach((el) => {
        el.classList.add("visible");
      });
    }, 100);
  }

  /* ---------- 8. 时间戳格式化 ---------- */
  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}.${m}.${day}`;
  }

  function initDateFormats() {
    document.querySelectorAll(".post-date").forEach((el) => {
      const raw = el.getAttribute("datetime") || el.textContent.trim();
      el.textContent = formatDate(raw);
    });
  }

  /* ---------- 绑定普通的 UI 点击微音效 ---------- */
  function bindGlobalClicks() {
    document.querySelectorAll("a, button, .post-entry").forEach((el) => {
      // 排除主题与音效控制键，因为它们本身有专门的独立音效逻辑
      if (
        el.classList.contains("theme-toggle") ||
        el.classList.contains("audio-toggle") ||
        el.id === "searchToggleBtn" ||
        el.id === "searchClose"
      ) {
        return;
      }
      el.addEventListener("click", () => {
        playSFX("click");
      });
    });
  }

  /* ---------- 8. 🎵 背景音乐八音盒控制器 (无缝跨页面续播) ---------- */
  function initMusicPlayer() {
    const player = document.getElementById("musicPlayer");
    const audio = document.getElementById("bgAudio");
    const playBtn = document.getElementById("musicPlayBtn");

    if (!player || !audio || !playBtn) return;

    const STATE_KEY = "mahoyo-bgm-playing";
    const TIME_KEY = "mahoyo-bgm-time";

    let isPlaying = sessionStorage.getItem(STATE_KEY) === "true";
    let savedTime = parseFloat(sessionStorage.getItem(TIME_KEY) || "0");

    // 初始化音频的当前播放进度
    audio.currentTime = savedTime;

    if (isPlaying) {
      // 若之前属于播放状态，新页面载入后尝试自动接续播放
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          player.classList.add("playing");
        }).catch(err => {
          console.log("浏览器策略限制了首屏自动播放，已静默等待用户交互激活...", err);
          player.classList.remove("playing");
          isPlaying = false;
          sessionStorage.setItem(STATE_KEY, "false");
        });
      }
    }

    function togglePlay() {
      if (isPlaying) {
        audio.pause();
        player.classList.remove("playing");
        isPlaying = false;
        sessionStorage.setItem(STATE_KEY, "false");
      } else {
        audio.play().then(() => {
          player.classList.add("playing");
          isPlaying = true;
          sessionStorage.setItem(STATE_KEY, "true");
        }).catch(err => {
          console.error("背景音乐播放失败:", err);
        });
      }
      playSFX("click");
    }

    playBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // 阻止事件冒泡，防止与父级容器点击冲突
      togglePlay();
    });

    player.addEventListener("click", (e) => {
      if (e.target.closest(".music-info")) return; // 点击文字信息不触发
      togglePlay();
    });

    // 跨页面续播黑科技：在页面即将跳转、刷新或销毁前，瞬间将当前播放的秒数写入缓存
    window.addEventListener("beforeunload", () => {
      if (isPlaying) {
        sessionStorage.setItem(TIME_KEY, audio.currentTime.toString());
      }
    });

    // 每一秒周期性备份进度，双重防丢
    setInterval(() => {
      if (isPlaying && !audio.paused) {
        sessionStorage.setItem(TIME_KEY, audio.currentTime.toString());
      }
    }, 1000);
  }

  /* ---------- 9. Pjax 无刷新极速单页路由器 (100% 零间断无缝续播) ---------- */
  function rebindNewPageContent() {
    initDateFormats();
    initReveal();
    // 强制清除 dataset 标记以便对新文本进行字逐雾化重新渲染
    document.querySelectorAll(".hero-title, .hero-sub, .reveal-typing, article blockquote").forEach(el => {
      delete el.dataset.revealed;
    });
    initRevealTyping();
    bindGlobalClicks();
  }

  function initPjaxRouter() {
    const main = document.querySelector("main");
    if (!main) return;

    document.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (!link) return;

      const url = new URL(link.href, window.location.href);
      // 仅拦截本站同源链接，排除锚点和新窗口打开
      if (
        url.origin === window.location.origin &&
        !link.getAttribute("target") &&
        !url.hash &&
        !link.classList.contains("no-pjax")
      ) {
        e.preventDefault();
        navigateTo(url.pathname);
      }
    });

    async function navigateTo(path) {
      try {
        // 若搜索面板处于打开状态，跳转时自动关闭
        const overlay = document.getElementById("searchOverlay");
        if (overlay && overlay.classList.contains("active")) {
          overlay.classList.remove("active");
          const input = document.getElementById("search-input");
          if (input) input.value = "";
          const resultsContainer = document.getElementById("searchResults");
          if (resultsContainer) resultsContainer.innerHTML = "";
        }

        // 1. 旧页面内容优雅淡出
        main.style.transition = "opacity 0.22s ease";
        main.style.opacity = 0;
        await new Promise((r) => setTimeout(r, 220));

        // 2. 异步拉取新页面 HTML
        const response = await fetch(path);
        const html = await response.text();

        // 3. 解析新页面 DOM 结构
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // 4. 更新网页标题与浏览器历史地址栏
        document.title = doc.title;
        window.history.pushState({}, doc.title, path);

        // 5. 替换主体 <main> 内容，窗口滚动至顶部
        const newMain = doc.querySelector("main");
        if (newMain) {
          main.innerHTML = newMain.innerHTML;
        }
        window.scrollTo({ top: 0 });

        // 6. 重新绑定新页面中元素的所有交互演出逻辑
        rebindNewPageContent();

        // 7. 新页面内容优雅淡入
        main.style.opacity = 1;
      } catch (err) {
        console.warn("Pjax 导航失败，优雅降级为传统页面载入方式:", err);
        window.location.href = path;
      }
    }

    // 监听历史记录前进与后退
    window.addEventListener("popstate", () => {
      navigateTo(window.location.pathname);
    });
  }

  /* ---------- 启动 ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initAudioToggle();
    initRevealTyping();
    initSearch();
    initReveal();
    initHeaderGlass();
    initPageLoad();
    initDateFormats();
    bindGlobalClicks();
    initMusicPlayer();
    initPjaxRouter();

    // 主题切换按钮事件绑定（捕获 click 事件并传递以便获取原点坐标）
    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        toggleTheme(e);
      });
    });
  });
})();
