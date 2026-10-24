# 测试策略与验收追踪

测试优先覆盖会破坏故事可信度的错误，而非追求代码行数。所有结果以实际运行报告为准。

| 规格 | 验证层 | 必测场景 |
|---|---|---|
| R01–R03 | API集成 + UI E2E | 编辑保存刷新、编译错误、发布、版本隔离 |
| R04–R06 | 引擎单元 | 行标签、中文选择、历史flag、好感度、隐藏选项、两种结局 |
| R07 | Mongo集成 + E2E | 新实例读回存档、当前回合不重新推进、刷新恢复 |
| R08 | API集成 | 相同请求重试、相同ID不同载荷、过期turn、并发CAS只有一次提交 |
| R09 | React组件 + Playwright | 加载、错误、空态、键盘、窄屏、结束、模拟输入提示 |
| R10 | CI | typecheck、覆盖率门槛、构建、实际Mongo、浏览器流程 |
| M01–M07 | 进程内 MCP 客户端 | 已发布列表、开局快照、续读不推进、合法与非法选择、重复 requestId、过期回合、结果不含 Ink 状态 |
| M08 | stdio 与 HTTP `/mcp` | 两种入口注册同一组工具和 `play_turn`；stdio 不把日志写入 stdout |
| C01–C05 | React 组件 | MCP 测试标签、工具与 `play_turn` 约束、快照渲染、非法选择不推进、读取不推进 |
| C06 | 前端单测 | `/mcp` 的 `2026-07-28` 信封、JSON 与 SSE、协议错误和工具错误分开 |
| C07 | Playwright | 发布后经测试台走一步真实分支；窄屏无横向溢出 |

## 检查命令

`npm run check` 执行类型检查、单元/组件测试及覆盖率、生产构建。

启动MongoDB后运行 `npm run test:integration`。必须使用独立测试数据库，不能清理开发库。

安装浏览器 `npx playwright install chromium` 后，运行 `npm run test:e2e`。浏览器测试自动启动API和Vite；需要Mongo运行。测试报告位于 `playwright-report/`，失败保留截图/trace。

## 人工产品验收

1. 创建示例，确认“文本模拟语音”与“音色元数据”标识清楚。
2. 编译、保存、发布，选择保守秘密路径后查看延迟出现的条件选项。
3. 重开游戏走另一条路径，对比好感度、选项、结局。
4. 在选择点刷新，确认恢复相同台词与选项。
5. 修改剧本并发布，旧会话继续原版本，新会话读取新版本。
6. 用键盘和窄屏检查编辑器、模拟器、错误提示及焦点。

真实音频、语音识别和小智设备尚未实现，不计入“已通过”。M01–M07 由进程内 MCP 客户端覆盖，M08 由 API 进程上的 `/mcp` 和失败启动时的 stdio 输出覆盖。C01–C07 由工作室 MCP 测试台的组件测试、客户端单测和浏览器流程覆盖。设备试点仍须单独验证播完转监听、打断、重连和音色一致性。

## 2026-10-24 本地运行验收

以下为集成人实际执行后的结果，取代初始化阶段的“未安装、未运行”状态；早期阻塞记录保留在实施日志中。

环境：Node.js **22.14.0**、npm **11.21.1**、Vitest **4.1.12**。依赖已成功安装，`npm audit` 报告 **0 个漏洞**；这只是当前依赖审计结果，不等于完整安全审计。

| 检查 | 实际结果 | 范围与限制 |
|---|---|---|
| `npm run check` | 通过 | 完整类型检查、带覆盖率单元/组件测试、生产构建 |
| 服务端单元/API 测试 | 15 个通过 | 覆盖率统计限定于 engine/service/app/validation |
| 前端组件/API 测试 | 20 个通过 | 覆盖率统计限定于 App/api |
| 真实 MongoDB 集成 | 2 个通过 | 本地独立 MongoDB 4.4（27018）及远端 MongoDB 7 均通过 |
| Playwright E2E | 2 个通过 | 两条故事分支、修改实际源码后发布 v2、旧会话版本隔离、刷新恢复、错误与键盘操作 |
| 390px 窄屏自动检查 | 通过 | 未检测到横向溢出；不替代人工视觉评审 |
| 人工浏览器视觉评审 | 已完成 | 桌面编辑器、模拟器及 390px 窄屏截图已检查 |
| GitHub CI | 已通过 | Ubuntu、Node 22、MongoDB 7、Chromium 全流程通过，链接见文末 |

| 覆盖范围 | 行 | 语句 | 分支 | 函数 |
|---|---:|---:|---:|---:|
| 服务端 engine/service/app/validation | 100% | 98.56% | 91.86% | 97.91% |
| 前端 App/api | 100% | 95.97% | 89.61% | 98.52% |

上述 **100% 是限定范围内的行覆盖率，不是全仓覆盖率**。Mongo 仓储行为另由真实数据库集成测试验证；覆盖率也不证明所有剧情或设备组合正确。

本次数据库环境可按以下方式复验，前提是独立 MongoDB 已监听 27018：

```sh
MONGODB_URI=mongodb://127.0.0.1:27018 npm run test:integration
E2E_MONGODB_URI=mongodb://127.0.0.1:27018/wawawa_e2e npm run test:e2e
```

集成测试创建并清理自己的随机测试数据库；E2E 使用专用数据库。不要将这些变量指向生产库。阶段结论与尚未验证的商业/AI 能力见 [MVP 运行验收评审](reviews/mvp-validation.md)。

桌面编辑器、模拟器与 390px 窄屏截图已进行视觉检查。E2E 在 `test-results/` 输出 `desktop-author.png`、`desktop-simulator.png`、`mobile-author.png`；CI 将这些图片连同报告归档。

远端证据：[Quality CI](https://github.com/lzfee0227/wawawa/actions/runs/40088730485) 已通过，包含 MongoDB 7、单元/组件覆盖率、构建及 Chromium E2E；本地旧 MongoDB 版本不再是目标版本的未验证缺口。

## 2026-10-24 MCP 游玩

[传输检查](https://github.com/lzfee0227/wawawa/actions/runs/40103467985) 在 Node 22 上通过：服务端 19 个测试、前端 20 个、MongoDB 集成 2 个、Playwright 2 个。其中包含官方客户端的分支游玩、非法选择、`/mcp` 和 stdio 失败启动。没有宿主模型对话、配音或小智记录。阶段分数见 [MCP 游玩评审](reviews/mcp-play.md)。本机若是 Node 25，既有前端测试需要 `NODE_OPTIONS=--no-experimental-webstorage`，否则 Node 自带的 `localStorage` 会让组件测试失败。

## 2026-10-24 MCP 测试台

本地 Node 25 在 `NODE_OPTIONS=--no-experimental-webstorage` 下通过 `npm run check`：服务端 19 个测试，前端 35 个测试。前端覆盖统计包含 `App.tsx`、`api.ts`、`mcp-client.ts`、`McpConsole.tsx`，行覆盖 100%，语句 94.61%，分支 85.45%，函数 99.16%。Playwright 3 个通过，其中包含经真实 `/mcp` 发布、非法原话、选项推进、读取不推进，以及 390px 无横向溢出。远端 [Quality](https://github.com/lzfee0227/wawawa/actions/runs/40108062395) 在 Node 22 上通过，包含 MongoDB 集成和 Chromium。浏览器里走通了同一条人工操作路径。测试台仍然不是宿主模型，也没有播放音频。
