// plugins/navigator/index.js (新版本)
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const { GoalNear, GoalFollow } = require('mineflayer-pathfinder').goals;

module.exports = (context) => {
  const { bot, commands, pluginName } = context;

  bot.loadPlugin(pathfinder);

  let mcData;
  bot.once('spawn', () => {
    mcData = require('minecraft-data')(bot.version);
    const defaultMove = new Movements(bot, mcData);
    bot.pathfinder.setMovements(defaultMove);
    console.log(`[${pluginName}] Pathfinder 模块已初始化。`);
  });

  commands.register({
    name: 'come',
    permissionLevel: 1, // 需要至少是 User 等级
    description: '指令：移动至目标。参数：[玩家名] | <x> <z> | <x> <y> <z>',
    execute: (username, args) => {
      let targetGoal;

      switch (args.length) {
        case 0:
          // 修改点：不再检查实体，而是直接使用玩家名查询
          // 这需要服务器有某种方式能让bot知道所有玩家的位置，通常是这样
          const player = bot.players[username];
          if (!player) {
            bot.chat('> 目标错误：无法定位指令发送者。');
            return;
          }
          targetGoal = new GoalNear(player.entity.position.x, player.entity.position.y, player.entity.position.z, 1);
          bot.chat(`> 指令已接收。目标：${username}。`);
          break;
        
        // case 1, 2, 3 的逻辑基本不变，只修改提示语
        case 1:
          const targetPlayerName = args[0];
          const targetPlayer = bot.players[targetPlayerName];
          if (!targetPlayer) {
            bot.chat(`> 目标错误：无法定位玩家'${targetPlayerName}'。`);
            return;
          }
          targetGoal = new GoalNear(targetPlayer.entity.position.x, targetPlayer.entity.position.y, targetPlayer.entity.position.z, 1);
          bot.chat(`> 指令已接收。目标：玩家'${targetPlayerName}'。`);
          break;

        case 2:
          const x_xz = parseFloat(args[0]);
          const z_xz = parseFloat(args[1]);
          if (isNaN(x_xz) || isNaN(z_xz)) {
            bot.chat('> 参数错误：坐标格式无效。'); return;
          }
          targetGoal = new GoalNear(x_xz, bot.entity.position.y, z_xz, 1);
          bot.chat(`> 指令已接收。目标坐标：X:${x_xz.toFixed(0)}, Z:${z_xz.toFixed(0)}。`);
          break;
          
        case 3:
          const x_xyz = parseFloat(args[0]);
          const y_xyz = parseFloat(args[1]);
          const z_xyz = parseFloat(args[2]);
          if (isNaN(x_xyz) || isNaN(y_xyz) || isNaN(z_xyz)) {
            bot.chat('> 参数错误：坐标格式无效。'); return;
          }
          targetGoal = new GoalNear(x_xyz, y_xyz, z_xyz, 1);
          bot.chat(`> 指令已接收。目标坐标：X:${x_xyz.toFixed(0)}, Y:${y_xyz.toFixed(0)}, Z:${z_xyz.toFixed(0)}。`);
          break;

        default:
          bot.chat('> 参数错误：无效参数数量。');
          return;
      }

      bot.pathfinder.setGoal(targetGoal);
    },
  });

  commands.register({
    name: 'follow',
    permissionLevel: 1, // 需要至少是 User 等级
    description: '指令：持续跟随目标。参数：[玩家名]',
    execute: (username, args) => {
      const targetPlayerName = args.length > 0 ? args[0] : username;
      const targetPlayer = bot.players[targetPlayerName];

      if (!targetPlayer || !targetPlayer.entity) {
        bot.chat(`> 目标错误：无法定位玩家 '${targetPlayerName}'。`);
        return;
      }
      
      const goal = new GoalFollow(targetPlayer.entity, 3);
      bot.pathfinder.setGoal(goal, true);
      bot.chat(`> 指令已接收。开始跟随：${targetPlayerName}。`);
    },
  });

  commands.register({
    name: 'stop',
    permissionLevel: 1,
    description: '指令：中断当前移动任务。',
    execute: () => {
      bot.pathfinder.stop();
      bot.chat('> 任务已中断。');
    },
  });
};