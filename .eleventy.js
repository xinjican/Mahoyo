module.exports = function (eleventyConfig) {
  // 注册 Nunjucks date 过滤器
  // 支持标准格式: YYYY, YYYY-MM, YYYY-MM-DD
  // 也支持带分隔符格式: YYYY.M.D, YYYY/MM/DD
  eleventyConfig.addNunjucksFilter("date", function (date, format) {
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();

    if (!format) {
      return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    // 替换格式字符串中的占位符
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

  // 输入输出路径
  return {
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
