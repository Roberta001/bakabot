// plugins/interactor/index.js
const vec3 = require('vec3');

module.exports = (context) => {
  const { bot, commands, pluginName } = context;

  // 用于存储循环任务的ID，以便可以停止它
  let loopTask = null;

  // --- 1. 注册 'lookat' 命令 ---
  commands.register({
    name: 'lookat',
    permissionLevel: 1,
    description: '指令：面向目标。用法: !lookat <方块名> | !lookat <x> <y> <z>',
    execute: async (username, args) => {
      if (args.length === 0) {
        bot.chat('> 参数错误：需要提供方块名或坐标。');
        return;
      }

      let targetPosition;

      if (!isNaN(parseFloat(args[0])) && args.length >= 3) {
        const x = parseFloat(args[0]);
        const y = parseFloat(args[1]);
        const z = parseFloat(args[2]);

        if (isNaN(x) || isNaN(y) || isNaN(z)) {
          bot.chat('> 参数错误：坐标格式无效，请输入三个数字。');
          return;
        }
        
        targetPosition = vec3(x, y, z); // <--- 修改：不再使用 bot.vec3
        bot.chat(`> 指令已接收。正在转向坐标: ${targetPosition.toString()}`);

      } else {
        const blockName = args.join('_').toLowerCase();
        
        const mcData = require('minecraft-data')(bot.version);
        const blockType = mcData.blocksByName[blockName];
        if (!blockType) {
          bot.chat(`> 目标错误：未知的方块名称 '${blockName}'。`);
          return;
        }

        const block = bot.findBlock({
          matching: blockType.id,
          maxDistance: 128,
        });

        if (!block) {
          bot.chat(`> 目标错误：在附近找不到 '${blockName}'。`);
          return;
        }
        
        targetPosition = block.position.add(vec3(0.5, 0.5, 0.5));
        bot.chat(`> 指令已接收。正在转向最近的 ${blockName}。`);
      }

      try {
        await bot.lookAt(targetPosition);
        bot.chat('> 任务完成：已面向目标。');
      } catch (err) {
        bot.chat('> 系统异常：转向时发生错误。');
        console.error(`[${pluginName}] lookAt error:`, err);
      }
    },
  });

  // --- 2. 注册 'click' 命令 ---
  commands.register({
    name: 'click',
    permissionLevel: 1,
    description: '指令：与面向的方块交互。用法: !click <left|right>',
    execute: async (username, args) => {
      if (args.length === 0) {
        bot.chat('> 参数错误：需要指定 left 或 right。');
        return;
      }
      
      const targetBlock = bot.blockAtCursor(5); // 获取光标指向的5格内的方块
      if (!targetBlock) {
        bot.chat('> 目标错误：未面向任何方块。');
        return;
      }
      
      bot.chat(`> 指令已接收：正在与 ${targetBlock.name} 交互...`);
      const handSide = args[0].toLowerCase();

      try {
        if (handSide === 'left') {
          // 单次左键 = 挖掘一下
          await bot.dig(targetBlock);
        } else if (handSide === 'right') {
          // 单次右键 = 激活方块
          await bot.activateBlock(targetBlock);
        } else {
          bot.chat('> 参数错误：只能是 left 或 right。');
        }
      } catch (err) {
         bot.chat(`> 系统异常：与方块交互时发生错误。`);
         console.error(`[${pluginName}] click error:`, err.message);
      }
    },
  });

  // --- 3. 注册 'loopclick' 命令 ---
  commands.register({
    name: 'loopclick',
    permissionLevel: 2, // 循环任务风险较高，需要更高权限 (自定义)
    description: '指令：循环交互。用法: !loopclick <left|right> [间隔ms] 或 !loopclick stop',
    execute: (username, args) => {
      if (args.length === 0) {
        bot.chat('> 参数错误。用法: !loopclick <left|right> [间隔] 或 !loopclick stop');
        return;
      }

      const action = args[0].toLowerCase();

      // 停止循环任务
      if (action === 'stop') {
        if (loopTask) {
          clearInterval(loopTask);
          loopTask = null;
          bot.chat('> 循环任务已中断。');
        } else {
          bot.chat('> 无正在执行的循环任务。');
        }
        return;
      }

      // 如果已有任务在运行，则先停止
      if (loopTask) {
        clearInterval(loopTask);
        loopTask = null;
      }
      
      const interval = args[1] ? parseInt(args[1], 10) : 500; // 默认间隔500ms
      if (isNaN(interval) || interval < 50) {
        bot.chat('> 参数错误：间隔时间必须是大于50的数字。');
        return;
      }

      bot.chat(`> 循环任务已启动：${action} 点击，间隔 ${interval}ms。使用 !loopclick stop 停止。`);
      
      loopTask = setInterval(() => {
        const targetBlock = bot.blockAtCursor(5);
        if (!targetBlock) {
          // 如果没面向方块，可以选则停止或什么都不做
          // clearInterval(loopTask);
          // loopTask = null;
          // bot.chat('> 目标丢失，循环任务已自动中断。');
          return; // 这里选择什么都不做
        }
        
        try {
            if (action === 'left') {
                bot.swingArm('left'); // 持续挖掘最好只摆动手臂，避免dig()的复杂状态
                bot.dig(targetBlock, true, (err) => {
                    if (err) console.error(`[${pluginName}] Loop dig error:`, err.message);
                });
            } else if (action === 'right') {
                bot.activateBlock(targetBlock);
            }
        } catch(err) {
            console.error(`[${pluginName}] Loop click error:`, err.message);
        }

      }, interval);
    },
  });
};