# SDD-002: 标准 MCP 游玩适配

状态：规格；2026-10-24。在已经发布的故事上，让标准 MCP 客户端读取当前回合并提交有效选项。创作、编译和发布仍走管理界面与 HTTP API。

## 用户与边界

调用方是 Cursor 或其他说标准 MCP 的本机客户端。适配层调用现有 `GameService`，不另写一套剧情推进。返回台词和选项文本，不播放音频，也不把宿主的语音识别结果当作已经发生。`voiceId`、`audio`、`music` 仍是演出元数据。

本阶段不提供草稿、编译、发布工具，不接小智，也不声称任何设备会在播完后继续听。默认只监听 `127.0.0.1`。知道会话 ID 即可继续该存档，这与 HTTP 会话相同，不是多租户授权。

## 工具与提示

成功结果是一个 `text` 内容块，正文为 JSON。失败结果设置 `isError`，正文以 `CODE: message` 开头。结果里不出现 Ink 运行状态和重试回执。

| 名称 | 输入 | 成功正文 |
|---|---|---|
| `list_stories` | 无 | `{ stories: [{ id, title, latestVersionNumber }] }` |
| `start_session` | `{ storyId, versionId? }` | 游玩快照 |
| `get_session` | `{ sessionId }` | 游玩快照 |
| `choose_option` | `{ sessionId, turnId, revision, requestId }`，且 `choiceId` 与 `input` 恰好一个 | 游玩快照 |

`list_stories` 只包含至少发布过一次的草稿，顺序与草稿列表相同（最近更新在前）。`latestVersionNumber` 是该故事最新发布号。未发布的草稿不出现。

`start_session` 与 HTTP 开始会话相同：省略 `versionId` 时使用最新发布版本。`get_session` 只读取，不推进剧情。

游玩快照：

```ts
type PlaySnapshot = {
  sessionId: string;
  storyId: string;
  versionId: string;
  versionNumber: number;
  revision: number;
  updatedAt: string;
  turnId: string;
  ended: boolean;
  lines: Array<{ text: string; tags: string[]; speaker?: string; speakerName?: string; emotion?: string; audio?: string; music?: string }>;
  choices: Array<{ id: string; index: number; text: string }>;
  characters: Array<{ id: string; name: string; voiceId: string }>;
  variables: Record<string, unknown>;
};
```

`speaker` 是剧本标签中的角色 ID。能在该版本角色表中找到时增加 `speakerName`，找不到则只保留 ID。

`choose_option` 的 `requestId` 由调用方生成。同一次选择的重试必须复用它；一次新的选择必须换新值。选项文本的匹配规则与现有引擎一致，包括完整文字和“第一个”这类序号。

提示 `play_turn` 不接收参数。它要求客户端照读返回台词和说话人，只呈现本次选项，不编造情节、不修改变量；用户的原话作为 `input` 提交，对不上时如实转告服务端错误，并说明音色与音频字段不是已经播放的声音。

## 验收要求

| ID | 要求 | 验收依据 |
|---|---|---|
| M01 | 只列出已发布故事 | 未发布草稿不出现；含故事 ID、标题、最新版本号 |
| M02 | 开始会话并返回可继续游玩的快照 | 台词、说话人、选项、`sessionId`、`turnId`、`revision` 齐全 |
| M03 | 读取会话不推进 | 连续 `get_session` 的回合与变量保持不变 |
| M04 | 只接受当前有效选项 | 合法 `choiceId` 或口述文本推进；非法输入不改变存档 |
| M05 | 保留回合幂等 | 相同 `requestId` 与相同参数返回原快照且只推进一次；相同 ID 不同参数，或过期 `turnId` / `revision`，返回冲突且不推进 |
| M06 | 提示约束模型 | `play_turn` 文本包含照读、禁止编造选项和禁止声称已播放声音 |
| M07 | 不泄露内部状态 | 成功与失败正文都不含 Ink 状态或重试回执 |
| M08 | 两种入口共用工厂 | stdio 与 API 进程上的 `/mcp` 注册同一组工具和提示；stdio 日志不写 stdout；HTTP 默认绑定 `127.0.0.1` |

M01–M07 用进程内 MCP 客户端和内存仓储验收。M08 随 stdio 与 HTTP 入口验收。规格合并时这两项都还没有运行证据。

## 错误

工具输入不符合上表时，由 MCP SDK 拒绝，不调用 `GameService`。

`GameError` 映射为 `isError` 文本：`CODE: message`。沿用现有错误码，包括 `NOT_FOUND`、`VERSION_MISMATCH`、`STORY_ENDED`、`INVALID_CHOICE`、`STALE_REVISION`、`REQUEST_REUSED`、`RUNTIME_LIMIT`、`RUNTIME_ERROR`。有诊断信息时另起一行附上，仍不附带内部状态。冲突和非法选择之后再次读取，得到推进前的快照。

## 传输

stdio 入口只把协议写到 stdout。HTTP 使用 Streamable HTTP，路径为现有 API 进程上的 `/mcp`，主机与端口沿用 `HOST` 和 `PORT`。两种入口按请求或按连接创建服务器实例，不在进程内保存游戏进度。
