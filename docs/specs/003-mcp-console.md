# SDD-003: 工作室 MCP 测试台

状态：规格；2026-10-24。在创作工作室里增加一个本机 MCP 客户端，用来核对已经发布故事的游玩工具。创作、编译和发布仍走剧本工作室。对话模拟器仍直接调用 HTTP API。

## 用户与边界

使用者是正在本地验证剧本的作者。测试台只向同源 `/mcp` 发送标准 MCP 请求，展示工具返回的台词、选项和错误。它不写草稿，不编译，不发布，不把结果写进模拟器用来恢复的本地存档。

这是人工操作的协议测试界面。它不是语言模型，不能用来证明宿主会照读台词。`voiceId`、`audio`、`music` 仍是演出元数据，页面不提供播放控件，也不把它们说成已经播出的声音。

## 客户端

浏览器对 `/mcp` 发送 JSON-RPC 2.0 的 `POST`。请求头包含 `Content-Type: application/json`、`Accept: application/json, text/event-stream`、`MCP-Protocol-Version: 2026-07-28` 和 `MCP-Method`。调用具体工具或提示时再加 `MCP-Name`。

每个请求的 `params._meta` 包含：

- `io.modelcontextprotocol/protocolVersion`：`2026-07-28`
- `io.modelcontextprotocol/clientInfo`：`{ name: "wawawa-studio", version: "0.1.0" }`
- `io.modelcontextprotocol/clientCapabilities`：`{}`

`application/json` 响应直接解析。`text/event-stream` 响应读取 `data:` 行里与本次 `id` 对应的 JSON-RPC 消息。开发服务器把 `/mcp` 代理到 API 进程，方式与 `/api` 相同。

JSON-RPC `error` 是协议失败。工具结果里 `isError: true` 是游玩失败，正文沿用 `CODE: message`。两种失败都原样展示，并且不替换当前快照。成功的工具结果只采用第一个 `text` 内容块，并把它解析为 JSON。解析失败视为协议失败。

可调用的工具与 [SDD-002](002-mcp-play.md) 相同：`list_stories`、`start_session`、`get_session`、`choose_option`。开始会话不传 `versionId`，因此使用最新发布版本。每次新的选择生成新的 `requestId`；`choiceId` 与 `input` 只提交一个。测试台不提供“用同一个 requestId 重试”的操作，该行为仍由服务端测试覆盖。

## 界面

第三个工作标签为「03 MCP 测试」，可用键盘聚焦，并有可访问名称。打开后读取工具列表和 `play_turn`。

页面展示四个工具名，以及提示中的三条约束：照读台词、禁止编造选项、禁止声称已播放声音。

作者可以刷新已发布故事列表，选择一个故事开始会话，用选项按钮提交 `choiceId`，或在输入框提交原话作为 `input`。另有「读取当前回合」，只调用 `get_session`。台词优先显示 `speakerName`，否则显示 `speaker`，都没有时显示「旁白」。

最近一次调用的工具名、参数和返回正文可见。错误使用警示区域展示工具或协议返回的原文。非法选择之后，仍显示推进前的选项。没有已发布故事时说明需要先在剧本工作室发布。

窄屏不出现横向溢出。

## 验收要求

| ID | 要求 | 验收依据 |
|---|---|---|
| C01 | 第三个标签可进入，并标明这是协议测试，不是配音或模型实测 | 组件测试 |
| C02 | 连接后列出四个游玩工具，并展示 `play_turn` 的三条约束 | 组件测试 |
| C03 | 列出故事并开始会话后，台词和选项只来自工具 JSON | 组件测试使用假客户端；浏览器测试打真实 `/mcp` |
| C04 | 选项按钮经 `choose_option` 推进；无法识别的输入显示错误，选项保持不变 | 组件测试与浏览器测试 |
| C05 | 读取当前回合不推进 | 连续 `get_session` 后 `turnId` 与 `revision` 不变 |
| C06 | 客户端按 `2026-07-28` 信封调用 `/mcp`，并区分协议错误与工具错误 | 客户端单测，包含 JSON 与 SSE 响应 |
| C07 | 窄屏没有横向溢出 | 浏览器测试 |

## 本阶段不做

不自动让模型游玩，不图形化 stdio，不重放同一个 `requestId`，不播放音频，也不把测试台的会话写入模拟器的本地恢复记录。
