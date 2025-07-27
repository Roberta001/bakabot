// plugins/core-commands/index.js
module.exports = (context) => {
  const { bot, commands } = context;

  commands.register({
    name: 'ping',
    permissionLevel: 0, // 任何人都可以用
    description: '系统响应检测。',
    execute: () => {
      bot.chat('> Pong.');
    },
  });

  commands.register({
    name: 'help',
    permissionLevel: 0,
    description: '查询可用指令集。',
    execute: (username, args) => {
      const userLevel = context.permissions.getLevel(username);
      const commandList = Array.from(commands.commands.values())
        .filter(cmd => userLevel >= cmd.permissionLevel); // 只显示用户有权使用的命令

      if (commandList.length === 0) {
        bot.chat('> 无可用指令。');
        return;
      }
      
      // ... (help 逻辑可以保持，但提示语可以修改) ...
      bot.chat('--- 指令集 ---');
      commandList.forEach(cmd => {
        bot.chat(`${commands.prefix}${cmd.name}: ${cmd.description || '无描述。'}`);
      });
    },
  });
};