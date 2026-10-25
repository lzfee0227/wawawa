# SDD-006：指定章节试跑

状态：已实现并本地验收；2026-10-25。关联 R03、R06–R10。证据见 [章节试跑验收](../reviews/chapter-playtest.md)。

创作者可从已发布版本选择章节及作者定义的前情预设，创建独立试跑存档。正常游玩仍从故事开头执行，章节之间由 Ink 自然衔接。旧版本、旧存档不会被草稿或新版本改写。

| ID | 要求 | 验收用例 |
|---|---|---|
| CP01 | 章节入口由剧本声明并随版本冻结 | 新旧版本入口分别列出；无声明的旧版本可正常开局，显示未配置提示 |
| CP02 | 只接受已发布版本中声明的入口 ID | 未知 ID、任意路径、变量输入被拒绝；入口在发布前运行验证，失败不发布 |
| CP03 | 前情由 Ink 预设入口初始化 | 路线、道具、关系和历史条件由剧本确定；正常入口不执行试跑预设 |
| CP04 | 独立试跑、保存恢复及回合约束 | 试跑显示章节/预设/版本；刷新恢复；普通存档引用不被覆盖；重复和过期选择沿用 R08 |
| CP05 | 清楚的章节选择界面 | 选择版本、章节、前情预设，查看说明后开始；桌面、窄屏及键盘可用；能返回正常进度 |
| CP06 | 完整示例支持第二至第八章试跑 | 完整稿连续跨章；入口分别验证四条路线，第一章演示稿仍在 END 结束 |

## 冻结契约

源码以独占一行的 `// @playtest {JSON}` 声明入口。JSON 包含 `id`（字母开头的英文/数字/下划线/短横线，最多 80）、`chapter`（80 字）、`label`（80 字）、`description`（300 字）、`path`（Ink knot 名，英文标识符最多 80）。最多 40 条，ID 不重复；声明错误作为编译诊断；发布时验证每个入口执行至首个选择/结束，沿用运行限制。入口 knot 内由作者写 Ink 初始化和跳转；客户端不能提交路径或变量。

`PlaytestEntry = { id, chapter, label, description }`；`Version` 新增可选 `playtestEntries: PlaytestEntry[]`（旧数据缺省为空）；公开响应不含 path。`Session` 新增可选 `playtest: PlaytestEntry`，仅试跑存在。

新增 `POST /api/playtest-sessions { storyId, versionId, entryId }`，返回 201 Session。必须显式固定版本。普通 `/api/sessions` 及 MCP 契约不变。服务方法 `startPlaytest(storyId, versionId, entryId)`，从版本 source 读取白名单并使用版本 compiled 执行；引擎 `renderTurn(compiled, inkState?, choiceIndex?, entryPath?)` 仅服务内部传递入口。

浏览器使用 `wawawa.playtest.<storyId>` 保存试跑引用，`wawawa.playMode.<storyId>` 保存当前模式；正常 `wawawa.session.<storyId>` 不变。返回正常进度时恢复普通引用，没有则展示普通开局。试跑的重新开始必须沿用当前版本与入口。

## 范围与限制

本次提供作者预设试跑，不提供真实章节检查点回滚或跨版本存档迁移。预设不是玩家实际历史，界面需明示。已有数据库剧本需更新完整源码并重新发布才获得入口；不得自动覆盖用户草稿或发布内容。
