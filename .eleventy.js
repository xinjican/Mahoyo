// pathPrefix 通过环境变量传入，不硬编码
// 本地开发不设置 → 空字符串，访问 localhost:8080/
// GitHub Pages 在 Actions 中设置 PATH_PREFIX=/Mahoyo/
// 自定义域名不设置 → 空字符串，直接根路径
const pathPrefix = process.env.PATH_PREFIX || "";

module.exports = function (eleventyConfig) {
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

  // 全局数据：当前时间
  eleventyConfig.addGlobalData("now", () => new Date().toISOString());

  return {
    // 不同平台通过环境变量 PATH_PREFIX 控制链接前缀
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
