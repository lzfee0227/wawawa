# SDD-007: Streamable HTTP 上的灵矽调用方

状态：规格；2026-10-25。在已经发布的游玩工具上，把灵矽平台随请求带来的设备、智能体和会话交给本地游戏存档。不新增工具，不播放音频，也不把这三个值交给模型填写。

## 传输核对

`/mcp` 已经是 Streamable HTTP。API 进程用 `@modelcontextprotocol/server` 的 `createMcpHandler` 在 `GET`、`POST`、`DELETE /mcp` 上接收官方 Streamable HTTP 客户端：POST 承载 JSON-RPC，需要流式结果时用 SSE。stdio 仍走同一组工具。主机和端口继续用 `HOST` 与 `PORT`，默认 `127.0.0.1`。

灵矽旧接入说明里的 `POST /mcp/message` 是另一套 SSE 传输。本服务不增加这条路径。设备是否会在播完后继续听，仍要实机验证，不由本规格代替。

## 调用方

灵矽在调用云端 MCP 时会带上下列请求头，并且不会把它们放进工具参数：

| 头 | 存档字段 |
|---|---|
| `X-Linx-Device-Id` | `deviceId` |
| `X-Linx-Agent-Id` | `agentId` |
| `X-Linx-Session-Id` | `sessionId` |

三个头都没有，或都只含空白时，请求按没有调用方处理。工作室、stdio 和现有 HTTP 会话保持原样。

只要出现其中一个，三个都必须同时存在。每个值去掉首尾空白后是 1 到 200 个可见 ASCII 字符。重复发送同一个头，或含空格、控制字符，都拒绝整个 `/mcp` 请求。拒绝时返回 HTTP 400，错误码 `VALIDATION_ERROR`，并且不调用游戏服务。

## 写入本地游戏

适配层从本次 HTTP 请求读取调用方，再传给 `GameService`。游戏把调用方记在会话记录的 `linx` 上，和 Ink 状态放在一起，不进入公开会话，也不进入返回给模型的游玩快照。

| 调用 | 对 `linx` 的影响 |
|---|---|
| `start_session` | 有调用方时写入新存档；没有则不写该字段 |
| `choose_option` | 有调用方时改成这一次的值；没有则保留存档里已有的值。相同 `requestId` 的重试不修改它 |
| `get_session`、`list_stories` | 不写存档。读取前后的回合、变量、修订号和已保存的 `linx` 都不变 |

知道游戏 `sessionId` 仍可继续该存档。调用方是设备会话的记录，不是玩家账号，也不阻止另一台设备使用同一个存档。

## 验收要求

| ID | 要求 | 验收依据 |
|---|---|---|
| L01 | 保持 Streamable HTTP | 官方客户端经 `/mcp` 列出工具；`POST /mcp/message` 不存在 |
| L02 | 开始会话时记下三个标识 | 仓储里的 `linx` 与请求头一致；快照正文不含这些值 |
| L03 | 提交选项时更新，读取时不改 | 新的请求头覆盖 `linx`；没有请求头则保留；`get_session` 不改变回合和 `linx`；重试不覆盖 |
| L04 | 残缺或非法的请求头被拒绝 | HTTP 400，`VALIDATION_ERROR`，不新增存档 |
| L05 | 没有请求头时与现在相同 | 存档不出现 `linx`，游玩结果不变 |
