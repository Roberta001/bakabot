# BakaBot

这是一个基于 [Mineflayer](https://github.com/PrismarineJS/mineflayer) 构建的、功能强大、可插拔的 Minecraft 机器人框架。它旨在简化复杂机器人的开发过程，通过模块化的插件系统、集成的命令管理器和权限控制，让你专注于实现机器人的具体功能，而不是底层框架的搭建。

## ✨ 特性

- **🔌 插件化架构**: 核心逻辑极简，所有功能均由独立的插件实现。
- **⚙️ 集中式命令管理器**: 插件只需注册命令，无需关心命令解析和前缀。
- **🔐 内置权限系统**: 通过 `permissions.json` 文件轻松管理不同玩家的命令权限。
- **📝 插件独立配置**: 每个插件都可以拥有自己的配置文件，保持高度模块化。
- **🚀 包含实用插件**: 内置寻路、交互、自动登录等多个实用插件，开箱即用。
- **💬 事件总线**: 插件之间可以通过共享的事件总线进行解耦通信，实现复杂协作。

---

## 🔧 环境要求

- [Node.js](https://nodejs.org/) (推荐 v16.x 或更高版本)
- 一个 Minecraft: Java Edition 服务器 (可以是正版或离线模式，支持原版服/插件服，暂不支持Mod服/群组服)

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <你的仓库URL>
cd <你的仓库目录>
```

### 2. 安装依赖

在项目根目录下运行以下命令，安装所有必需的库：

```bash
npm install
```

### 3. 配置机器人

在运行机器人之前，你需要配置几个关键文件：

#### a. 主配置文件 (`config.json`)

这是最重要的配置文件，用于设置机器人账号、服务器信息和要加载的插件。

```json
{
  "bot": {
    "host": "localhost",
    "port": 25565,
    "username": "MyFrameworkBot",
    "version": false,
    "auth": "offline"
  },
  "commandPrefix": "!",
  "plugins": [
    "core-commands",
    "navigator",
    "interactor",
    "auto-login"
  ]
}
```

- **`bot` 对象**:
  - `host`: 你的 Minecraft 服务器 IP 地址。
  - `port`: 服务器端口，默认为 `25565`。
  - `username`: 机器人的游戏名。
  - **对于正版服务器**:
    - 将 `auth` 设置为 `"microsoft"`。
    - 你可能还需要添加 `password` 字段，但这通常不推荐。Mineflayer 会尝试通过浏览器进行微软认证。
  - **对于离线(破解)服务器**:
    - 保持 `auth` 为 `"offline"`。
- **`commandPrefix`**: 机器人响应的命令前缀，例如 `!`。
- **`plugins`**: 一个数组，包含所有要加载的插件的**目录名**。你可以通过从这里移除插件名来禁用某个插件。

#### b. 权限配置文件 (`permissions.json`)

此文件用于控制谁可以使用哪些命令。

```json
{
  "admins": [
    "YourMinecraftName",
    "AnotherAdminName"
  ],
  "users": {
    "SomeTrustedPlayer": {
      "level": 2
    }
  }
}
```
- **`admins`**: 管理员列表。管理员拥有最高权限等级 (99)。
- **`users`**: 特殊用户列表。你可以为他们分配自定义的权限等级。
- **权限等级**:
  - **99**: Admin
  - **1-98**: Custom (例如，`2` 可以用于 `!loopclick` 等高风险命令)
  - **1**: User (可以访问 `!come`, `!follow` 等)
  - **0**: Guest (默认等级，只能访问 `!ping`, `!help` 等公共命令)

#### c. 插件配置文件 (例如 `plugins/auto-login/config.json`)

某些插件有自己的配置。例如，`auto-login` 插件需要你配置登录命令。

```json
// 文件路径: plugins/auto-login/config.json
{
  "enabled": true,
  "loginCommand": "/login your_password_here",
  "delay": 3000
}
```
- **请务必将 `your_password_here` 替换为你在服务器上真实的登录密码！**

### 4. 运行机器人

配置完成后，启动机器人：

```bash
npm start
```

如果一切顺利，你将在控制台看到插件加载信息，然后机器就会加入你指定的服务器。

---

## 🤖 内置命令参考

以下是框架默认启用的插件及其提供的命令。

### `core-commands` (核心命令)
- `!ping`: 检查机器人是否响应。 (权限: 0)
- `!help`: 列出你当前权限可用的所有命令。 (权限: 0)

### `navigator` (寻路与移动)
- `!come [玩家名|x z|x y z]`: 让机器人移动到目标位置。 (权限: 1)
- `!follow [玩家名]`: 让机器人跟随目标玩家。 (权限: 1)
- `!stop`: 中断机器人当前的移动或跟随任务。 (权限: 1)

### `interactor` (世界交互)
- `!lookat <方块名|x y z>`: 让机器人面向一个方块或坐标。 (权限: 1)
- `!click <left|right>`: 对机器人面向的方块进行单次左键或右键。 (权限: 1)
- `!loopclick <left|right> [间隔ms]`: 循环点击面向的方块。 (权限: 2)
- `!loopclick stop`: 停止循环点击任务。 (权限: 2)

---

## 🧩 开发你自己的插件

框架的核心就是可扩展性。创建一个新插件非常简单：

1.  在 `plugins/` 目录下创建一个新的文件夹，例如 `my-plugin`。
2.  在该文件夹内创建一个 `index.js` 文件。
3.  编写你的插件逻辑。插件模板如下：
    ```javascript
    // plugins/my-plugin/index.js
    module.exports = (context) => {
      // 从 context 对象中解构出你需要的工具
      const { bot, commands, permissions, eventBus, pluginConfig, pluginName } = context;

      // 注册一个新命令
      commands.register({
        name: 'hello',
        permissionLevel: 0,
        description: '一个简单的问候命令。',
        execute: (username, args) => {
          bot.chat(`> 你好, ${username}! 这是一个来自'${pluginName}'插件的问候。`);
        }
      });

      // 监听游戏事件
      bot.on('time', () => {
        // 每到游戏内的午夜，执行一些操作
        if (bot.time.timeOfDay === 18000) {
          // console.log('It is midnight!');
        }
      });
    };
    ```
4.  如果你的插件需要配置，可以在 `plugins/my-plugin/` 目录下创建一个 `config.json` 文件。插件代码可以通过 `pluginConfig` 对象访问它。
5.  最后，将你的插件文件夹名 `"my-plugin"` 添加到主 `config.json` 的 `plugins` 数组中，以启用它。

---

## 🤝 贡献

欢迎提交 Pull Request 或报告 Issues！如果你有任何好的想法或发现了 bug，请不要犹豫，让我们一起让这个框架变得更好。

## 📜 许可证

本项目采用 [MIT](LICENSE.md) 许可证。
