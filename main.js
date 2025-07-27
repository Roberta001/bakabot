// main.js (新版本)

const mineflayer = require('mineflayer');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class PermissionManager {
  constructor(filePath) {
    this.filePath = filePath;
    this.permissions = { admins: [], users: {} };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf8');
        this.permissions = JSON.parse(data);
        console.log('[PermissionManager] 权限文件已加载。');
      } else {
        console.warn('[PermissionManager] 警告: permissions.json 未找到，将使用默认空配置。');
        // 可选：在此处创建默认文件
        // fs.writeFileSync(this.filePath, JSON.stringify(this.permissions, null, 2));
      }
    } catch (err) {
      console.error('[PermissionManager] 加载权限文件时出错:', err);
    }
  }

  /**
   * 获取玩家的权限等级
   * @param {string} username - 玩家名
   * @returns {number} 权限等级 (0: Guest, 1: User, 99: Admin)
   */
  getLevel(username) {
    if (this.permissions.admins.includes(username)) {
      return 99; // Admin level
    }
    if (this.permissions.users[username]) {
      return this.permissions.users[username].level || 1; // User level
    }
    return 0; // Guest level
  }
}

// --- 修改: CommandManager ---
// 我们需要给 CommandManager 添加权限检查逻辑
class CommandManager {
  constructor(bot, permissions, prefix = '!') { // 注入 PermissionManager
    this.bot = bot;
    this.permissions = permissions; // 保存权限管理器实例
    this.prefix = prefix;
    this.commands = new Map();
    this.bot.on('chat', (username, message) => this.handleMessage(username, message));
  }

  handleMessage(username, message) {
    if (this.bot.username === username || !message.startsWith(this.prefix)) return;
    
    const args = message.slice(this.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = this.commands.get(commandName);

    if (command) {
      // --- 权限检查 ---
      const userLevel = this.permissions.getLevel(username);
      if (userLevel < command.permissionLevel) {
        this.bot.chat(`> 指令错误：权限不足。需要等级 ${command.permissionLevel}，你的等级为 ${userLevel}。`);
        return;
      }
      
      try {
        command.execute(username, args);
      } catch (err) {
        console.error(`执行命令 '${commandName}' 时出错:`, err);
        this.bot.chat('> 系统异常：指令执行失败。');
      }
    } else {
      this.bot.chat('> 指令错误：未知指令。');
    }
  }

  /**
   * 注册一个新命令
   * @param {object} options - 命令选项
   * @param {string} options.name - 命令名称
   * @param {number} [options.permissionLevel=0] - 所需最低权限等级
   * @param {string} [options.description=''] - 命令描述
   * @param {function(string, string[]): void} options.execute - 执行函数
   */
  register(options) {
    const { name, permissionLevel = 0, description = '', execute } = options;
    if (this.commands.has(name)) {
      console.warn(`[CommandManager] 警告: 命令 '${name}' 已被注册，将被覆盖。`);
    }
    this.commands.set(name, { name, permissionLevel, description, execute });
    console.log(`[CommandManager] 已注册命令: ${this.prefix}${name} (权限等级: ${permissionLevel})`);
  }
}



// --- 1. 加载配置 ---
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// --- 2. 创建共享上下文 (Context) ---
const context = {
  bot: null,
  config: config,
  eventBus: new EventEmitter(),
  state: {},
  commands: null, // 将在这里挂载命令管理器
};
context.permissions = new PermissionManager(path.join(__dirname, 'permissions.json'));

// --- 3. 创建 Mineflayer Bot 实例 ---
console.log('正在连接到服务器...');
try {
  context.bot = mineflayer.createBot(config.bot);
} catch (err) {
  console.error('创建机器人时出错:', err);
  process.exit(1);
}
const bot = context.bot;

// --- 新增: 实例化并挂载命令管理器 ---
// 在 bot 实例化后，插件加载前，创建 CommandManager
context.commands = new CommandManager(bot, context.permissions, config.commandPrefix || '!');

// --- 4. 插件加载器 (新版本) ---
const pluginsDir = path.join(__dirname, 'plugins');

console.log('正在加载插件...');
if (config.plugins && Array.isArray(config.plugins)) {
  config.plugins.forEach(pluginName => {
    const pluginDir = path.join(pluginsDir, pluginName);
    const pluginIndexFile = path.join(pluginDir, 'index.js');
    const pluginConfigFile = path.join(pluginDir, 'config.json');

    if (fs.existsSync(pluginIndexFile)) {
      try {
        // --- 新增：加载插件的独立配置 ---
        let pluginConfig = {};
        if (fs.existsSync(pluginConfigFile)) {
          try {
            pluginConfig = JSON.parse(fs.readFileSync(pluginConfigFile, 'utf8'));
            console.log(`[PluginLoader] 已为插件 '${pluginName}' 加载配置文件。`);
          } catch (configErr) {
            console.error(`[PluginLoader] 解析插件 '${pluginName}' 的 config.json 时出错:`, configErr);
          }
        }

        // 将插件配置添加到传递给插件的上下文中
        const pluginContext = {
          ...context, // 继承主上下文
          pluginConfig: pluginConfig, // 添加插件自己的配置
          pluginName: pluginName // 方便插件知道自己的名字
        };

        const plugin = require(pluginIndexFile);
        if (typeof plugin === 'function') {
          plugin(pluginContext); // 将包含独立配置的上下文注入插件
          console.log(`[PluginLoader] 已成功加载插件: ${pluginName}`);
        } else {
          console.warn(`[PluginLoader] 警告: 插件 '${pluginName}' 未导出函数，已跳过。`);
        }
      } catch (err) {
        console.error(`[PluginLoader] 加载插件 ${pluginName} 时发生错误:`, err);
      }
    } else {
      console.error(`[PluginLoader] 错误: 找不到插件目录或 index.js: ${pluginName}`);
    }
  });
} else {
  console.log('[PluginLoader] 配置文件中没有找到插件列表，不加载任何插件。');
}
console.log('所有插件加载完毕。');


// --- 5. 核心事件监听 ---
bot.on('login', () => {
  console.log(`机器人 ${bot.username} 已成功登录！`);
});

bot.once('spawn', () => {
  console.log('机器人已进入世界，框架启动完成！');
  context.eventBus.emit('framework:ready');
});

bot.on('kicked', (reason, loggedIn) => console.error('机器人被踢出服务器:', reason));
bot.on('error', (err) => console.error('机器人发生错误:', err));
bot.on('end', (reason) => console.log(`机器人连接已断开，原因: ${reason}`));