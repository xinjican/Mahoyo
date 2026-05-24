const pathPrefix = process.env.PATH_PREFIX || "";
const siteUrl = process.env.SITE_URL || "https://xinjican.github.io/Mahoyo";
const CleanCSS = require("clean-css");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const { execSync } = require("child_process");
module.exports = function (eleventyConfig) {
  // 注册 Markdown 中二注音语法规则 ({汉字|注音} -> <ruby>汉字<rt>注音</rt></ruby>)
  eleventyConfig.amendLibrary("md", mdLib => {
    mdLib.inline.ruler.push("ruby_bracket", (state, silent) => {
      const max = state.posMax;
      const start = state.pos;
      if (state.src.charCodeAt(start) !== 123 /* { */) return false;

      let pos = start + 1;
      let foundPipe = -1;
      while (pos < max) {
        const code = state.src.charCodeAt(pos);
        if (code === 124 /* | */) {
          foundPipe = pos;
        } else if (code === 125 /* } */) {
          if (foundPipe !== -1 && foundPipe > start + 1 && pos > foundPipe + 1) {
            if (!silent) {
              state.push("ruby_open", "ruby", 1);

              const token_t1 = state.push("text", "", 0);
              token_t1.content = state.src.slice(start + 1, foundPipe);

              state.push("rt_open", "rt", 1);

              const token_t2 = state.push("text", "", 0);
              token_t2.content = state.src.slice(foundPipe + 1, pos);

              state.push("rt_close", "rt", -1);
              state.push("ruby_close", "ruby", -1);
            }
            state.pos = pos + 1;
            return true;
          }
          break;
        }
        pos++;
      }
      return false;
    });
  });

  // 注册 RSS 插件 (处理 ESM 导出兼容性)
  eleventyConfig.addPlugin(pluginRss.default || pluginRss);

  // 注册 Nunjucks date 过滤器
  eleventyConfig.addNunjucksFilter("date", function (date, format) {
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();

    if (!format) {
      return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    return format
      .replace(/YYYY/g, String(y))
      .replace(/YY/g, String(y).slice(-2))
      .replace(/MM/g, String(m).padStart(2, "0"))
      .replace(/M(?!\w)/g, String(m))
      .replace(/DD/g, String(day).padStart(2, "0"))
      .replace(/D(?!\w)/g, String(day));
  });

  // 注册 CleanCSS 压缩过滤器
  eleventyConfig.addFilter("cssmin", function(code) {
    return new CleanCSS({}).minify(code).styles;
  });

  // 调试 URL 过滤器的中间件已移除，使用原生的 HTML Base Plugin 处理

  // 全局数据：当前时间
  eleventyConfig.addGlobalData("now", () => new Date().toISOString());

  // 全局数据：路径前缀
  eleventyConfig.addGlobalData("pathPrefix", pathPrefix);

  // 全局数据：网站元数据 (SEO / RSS / Sitemap)
  eleventyConfig.addGlobalData("metadata", {
    title: "久远寺洋馆",
    subtitle: "《魔法使之夜》美学博客 — 基于 11ty 与纯原生前端技术",
    url: siteUrl, // 支持动态配置网站 URL (如 Cloudflare Pages 自定义域名)
    author: {
      name: "久远寺有珠 & 苍崎青子",
      email: "alice@kuonji.mansion"
    }
  });

  // 让 Eleventy 把 CSS 与 JS 静态文件自动复制到 _site 目录下
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");

  // 构建完成后自动触发 Pagefind 生成本地静态搜索索引
  eleventyConfig.on("eleventy.after", async () => {
    console.log("正在生成 Pagefind 搜索索引...");
    try {
      // 运行 pagefind 处理 _site 目录
      execSync("npx pagefind --site _site", { stdio: "inherit" });
      console.log("Pagefind 索引生成成功！");
    } catch (err) {
      console.error("生成 Pagefind 索引错误:", err);
    }
  });

  return {
    pathPrefix,
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_includes",
      data: "_data",
    },
    templateFormats: ["njk", "md", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
