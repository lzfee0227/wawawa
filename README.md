# Wawawa · 声音里的分支世界

一个为纯语音互动故事准备的轻量创作与验证工作台：编写 Ink 剧本，发布版本，在模拟对话中验证好感度、历史选择和不同结局。

当前目标是本地创作闭环，以及在其上提供标准 MCP 游玩。管理界面可视化展示故事以便创作和调试；玩家最终体验面向声音。模拟器使用文字代替口头选择，角色音色仅保存配置。真实配音和小智设备尚未接入。MCP 只返回台词与选项，不播放声音。

## 开始

需要 Node.js 22.14+、npm 11，以及 MongoDB 7（推荐 Docker）。依赖锁文件由 npm 11 生成；旧 npm 在解析测试框架的可选依赖时可能失败。

```sh
npm ci
docker compose up -d mongo
npm run dev
```

打开 http://127.0.0.1:5173 。API 默认 http://127.0.0.1:3001 ，MongoDB 默认 `mongodb://127.0.0.1:27017/wawawa`。通过进程环境设置 `MONGODB_URI`、`PORT`、`HOST`；不要把真实连接凭据提交到Git。

若本机 27017 已有数据库，可使用另一个独立 MongoDB 实例，例如 `MONGODB_URI=mongodb://127.0.0.1:27018/wawawa npm run dev`。`.env.example` 只是配置示例，程序读取进程环境，不会自动加载 `.env`。

界面中的示例故事可以直接编辑、编译、保存发布后开始模拟。选择按钮或输入“第一个”等文字推进；刷新后恢复最近一次会话。角色ID与剧本中的 `speaker` 标签对应。

## MCP 游玩

stdio 给本机客户端拉起，HTTP 挂在同一个 API 进程的 `/mcp`。两者调用同一套游玩工具。先发布故事，再让客户端列出故事、开始会话并提交当前选项。日志写在 stderr。

```sh
npm run mcp
```

Cursor 可使用仓库里的 [`.cursor/mcp.json`](.cursor/mcp.json)。默认数据库是 `mongodb://127.0.0.1:27017/wawawa`。HTTP 地址是 `http://127.0.0.1:3001/mcp`。这不表示宿主会朗读台词，也不包含小智设备。工作室内的协议测试台见 [SDD-003](docs/specs/003-mcp-console.md)，实现合并前界面里还没有这个标签。

## 技术与质量

- 服务端：Node.js、TypeScript、Fastify、MongoDB、inkjs。
- 管理界面：Vite、React、TypeScript。
- Vitest 单元/组件测试与覆盖率，MongoDB 集成测试，Playwright 浏览器流程。

```sh
npm run check
npm run test:integration
npx playwright install chromium
npm run test:e2e
```

## 文档入口

- [MVP规格](docs/specs/001-mvp.md)
- [MCP 游玩规格](docs/specs/002-mcp-play.md)
- [MCP 测试台规格](docs/specs/003-mcp-console.md)
- [架构与API约定](docs/architecture.md)
- [需求、商业与技术调研](docs/research.md)
- [分阶段路线图](docs/roadmap.md)
- [测试策略](docs/testing.md)
- [MVP验收与比赛复盘](docs/reviews/mvp-validation.md)
- [MCP 游玩评审](docs/reviews/mcp-play.md)
- [开发约定](AGENTS.md)

采用规格驱动、AI协作开发，行为变更先更新验收要求。通过小规模PR合并主干，检查与评审结果随迭代记录。

此版本无身份认证，只用于受信任的本地创作验证；公开部署前须完成账号、授权和资源限制。MongoDB不是音频仓库，后续配音文件存对象存储。
