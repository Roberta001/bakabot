// plugins/auto-login/index.js

module.exports = (context) => {
  // 从上下文中解构出需要的部分
  const { bot, pluginConfig, pluginName } = context;

  // 首先检查配置，如果未启用或配置不全，则直接返回
  if (!pluginConfig.enabled) {
    console.log(`[${pluginName}] 插件已禁用。`);
    return;
  }

  if (!pluginConfig.loginCommand) {
    console.error(`[${pluginName}] 错误：未在 config.json 中配置 'loginCommand'。插件不会运行。`);
    return;
  }

  // 使用 bot.once('login', ...)
  // 'login' 事件在机器人成功验证身份后，进入世界之前触发。这是执行登录命令的最佳时机。
  bot.once('login', () => {
    const delay = pluginConfig.delay || 1500; // 如果未配置延迟，则默认为1.5秒

    console.log(`[${pluginName}] 已监听到 'login' 事件，将在 ${delay}ms 后发送登录命令。`);

    setTimeout(() => {
      console.log(`[${pluginName}] 正在发送登录命令...`);
      bot.chat(pluginConfig.loginCommand);
    }, delay);
  });
};