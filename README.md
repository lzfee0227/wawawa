# Wawawa · 声音里的分支世界

一个为纯语音互动故事准备的轻量创作与验证工作台：编写 Ink 剧本，发布版本，在模拟对话中验证好感度、历史选择和不同结局。

当前迭代优先补齐本地管理平台与“对话—选项—剧情推进”闭环，现有 MCP 保留且暂停扩展。管理界面可视化展示故事以便创作和调试；玩家最终体验面向声音。模拟器支持浏览器或已配置云服务的朗读与识别，以及本地/网络音频试听。识别结果先填写文本，确认提交才推进剧情。云服务真实音质与识别效果、小智设备尚未验收。MCP 只返回台词与选项，不播放声音。

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

也可以点击「新建空白故事」，或用「导入 Ink 文件」将 `.ink`/`.txt` 导入为独立草稿。导入保留源码，角色需按 `speaker` 标签填写；导入不自动发布。文件限制为 400000 字节、源码 100000 字符，完整单文件剧本可用，外部 `INCLUDE` 不支持。仓库的 [《二哈有福》完整稿](content/stories/erha-youfu/story.ink) 可直接用于验证。

发布记录中的「从 vN 开始模拟」会创建固定该版本的新会话；普通「开始模拟」「新开一局」「重新开始」使用最新发布版本。新会话会替换浏览器的最近存档引用。书架显示更新时间，查看故事后显示其发布状态。

## 模拟器语音和音频

进入「对话模拟器」后，可独立选择朗读（TTS）与识别（ASR）来源。点击「朗读当前回合」依次读出台词和选项；「语音输入」将识别结果放入选择输入框，确认后点「提交选择」。停止、切换回合或离开模拟器会取消当前语音任务。浏览器支持情况不同，识别可能需要厂商网络服务；麦克风请使用 `localhost`/`127.0.0.1` 或 HTTPS，局域网 HTTP 通常无法录音。

「播放一段音频」支持本地文件与 HTTP(S) 地址，提供原生播放、暂停和进度控件。本地试听文件不上传；网络地址由浏览器直接访问，需资源服务器允许访问且格式可解码。此版本不自动播放 Ink 的 `audio`/`music` 资源标签，也不做背景音乐混音。

角色 `voiceId` 在浏览器模式匹配系统声音名称或 voiceURI，找不到时提示并使用中文/系统默认声音；云模式直接作为服务商的 voice 参数，留空使用服务端默认。既有示例的占位音色 ID 可能不在云服务支持列表中，云试听前请替换或清空并发布新版本；运行会话使用已发布角色配置。

云接口限于 OpenAI 兼容格式，使用 `.env.example` 的 `AUDIO_ASR_*` 和 `AUDIO_TTS_*` 分别配置。BASE_URL 包含版本前缀，例如 `https://api.openai.com/v1`；服务端追加 `/audio/transcriptions` 和 `/audio/speech`。对应 BASE_URL、API_KEY、MODEL 都有值且地址有效才启用，TTS 还需 VOICE。密钥不得使用 `VITE_` 前缀。环境变量在 API 启动时读取，修改后重启；`.env` 不会自动加载。可在受保护的本地环境文件中配置后用 Node 22 启动：

```sh
node --env-file=.env --import tsx apps/server/src/index.ts
# 另一个终端启动前端
npm --prefix apps/web run dev
```

地址只允许 HTTPS，或 localhost HTTP 的本地兼容服务。厂商须支持 multipart `file/model` 转写并返回 `{text}`，以及 JSON `model/input/voice/response_format=mp3` 合成并返回 MPEG 音频；不承诺所有标称兼容的厂商均可用。界面会显示未配置或调用失败，不会自动切换提供商。云调用可能计费并将台词/录音发送给配置服务；这是本地受信任工作台接口，不适合直接公开。

单次朗读请求最多 4000 字符（界面分段），客户端录音最多 60 秒，服务端限制 5 MB（不解码验证时长），上游超时 30 秒，合成音频响应最多 10 MB。没有配音缓存、流式播放或费用配额。本轮自动测试区分模拟语音接口与真实音频解码；真实云密钥、麦克风识别准确率与系统音质需另行试用。

## MCP 游玩

stdio 给本机客户端拉起，HTTP 用 Streamable HTTP 挂在同一个 API 进程的 `/mcp`。两者调用同一套游玩工具。先发布故事，再让客户端列出故事、开始会话并提交当前选项。日志写在 stderr。灵矽若在请求里带上 `X-Linx-Device-Id`、`X-Linx-Agent-Id` 和 `X-Linx-Session-Id`，服务会把它们记到本地存档，不会放进返回给模型的台词。规格见 [SDD-007](docs/specs/007-linx-caller.md)。

```sh
npm run mcp
```

Cursor 可使用仓库里的 [`.cursor/mcp.json`](.cursor/mcp.json)。默认数据库是 `mongodb://127.0.0.1:27017/wawawa`。HTTP 地址是 `http://127.0.0.1:3001/mcp`。这不表示宿主会朗读台词，也不包含小智设备。

工作室的「MCP 测试」用同一个 HTTP 入口核对工具返回。它由人点击操作，用来看台词、选项和错误，不代替宿主模型，也不播放声音。规格见 [SDD-003](docs/specs/003-mcp-console.md)。

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
- [模拟器语音规格](docs/specs/005-simulator-audio.md)
- [管理平台基础规格](docs/specs/004-management-basics.md)
- [管理平台迭代验收](docs/reviews/management-basics.md)
- [MCP 游玩规格](docs/specs/002-mcp-play.md)
- [灵矽调用方规格](docs/specs/007-linx-caller.md)
- [MCP 测试台规格](docs/specs/003-mcp-console.md)
- [架构与API约定](docs/architecture.md)
- [需求、商业与技术调研](docs/research.md)
- [分阶段路线图](docs/roadmap.md)
- [测试策略](docs/testing.md)
- [MVP验收与比赛复盘](docs/reviews/mvp-validation.md)
- [MCP 游玩评审](docs/reviews/mcp-play.md)
- [MCP 测试台评审](docs/reviews/mcp-console.md)
- [开发约定](AGENTS.md)

采用规格驱动、AI协作开发，行为变更先更新验收要求。通过小规模PR合并主干，检查与评审结果随迭代记录。

此版本无身份认证，只用于受信任的本地创作验证；公开部署前须完成账号、授权和资源限制。MongoDB不是音频仓库，后续配音文件存对象存储。
