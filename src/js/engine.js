/* ========================================
   魔法使之夜 — 演出引擎
   ======================================== */

"use strict";

(function () {
  /* ---------- 1. 主题切换 ---------- */
  const THEME_KEY = "mahoyo-theme";
  const DEFAULTS = {
    theme: "alice",
    accent: "#a855f7",
  };

  /** 从 <html> 或 localStorage 读取当前主题 */
  function getTheme() {
    return (
      localStorage.getItem(THEME_KEY) ||
      document.documentElement.getAttribute("data-theme") ||
      DEFAULTS.theme
    );
  }

  /** 应用主题到 <html> 与 localStorage */
  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);

    // 更新主题切换按钮 icon
    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      btn.setAttribute("aria-label", theme === "alice" ? "切换亮色" : "切换暗色");
    });
  }

  /** 初始化主题 */
  function initTheme() {
    const saved = getTheme();
    // 如果 <html> 尚未设置 data-theme，则应用保存的值
    if (!document.documentElement.hasAttribute("data-theme")) {
      setTheme(saved);
    }
  }

  /** 切换主题 */
  function toggleTheme() {
    const current = getTheme();
    const next = current === "alice" ? "aoko" : "alice";
    setTheme(next);

    // 触发 CSS transition 的闪烁效果
    document.body.style.transition = "background-color 0.6s ease, color 0.6s ease";
  }

  /* ---------- 2. IntersectionObserver — 渐显动画 ---------- */
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
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    document.querySelectorAll(".fade-in, .fade-in-strong, .reveal").forEach((el) => {
      observer.observe(el);
    });
  }

  /* ---------- 3. 导航栏毛玻璃动态效果 ---------- */
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

  /* ---------- 4. 页面加载动画 ---------- */
  function initPageLoad() {
    // 为 body 添加加载完成类，触发入场动画
    document.body.classList.add("page-loaded");

    // 渐显首页文章列表
    setTimeout(() => {
      document.querySelectorAll(".post-entry, .hero-title, .hero-sub").forEach((el) => {
        el.classList.add("visible");
      });
    }, 100);
  }

  /* ---------- 5. 时间戳格式化 ---------- */
  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}.${m}.${day}`;
  }

  // 格式化 .post-date 元素中的时间
  function initDateFormats() {
    document.querySelectorAll(".post-date").forEach((el) => {
      const raw = el.getAttribute("datetime") || el.textContent.trim();
      el.textContent = formatDate(raw);
    });
  }

  /* ---------- 启动 ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initReveal();
    initHeaderGlass();
    initPageLoad();
    initDateFormats();

    // 主题切换按钮事件绑定
    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        toggleTheme();
      });
    });
  });
})();
