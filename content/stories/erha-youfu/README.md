# 《二哈有福》故事包

这是《二哈有福》的内容源文件。它是游戏项目的一部分，不依赖 MongoDB 中的草稿数据；数据库中的故事记录应由这些文件按需导入，并在发布时生成不可变版本。

## 文件

- `design.md`：世界观、角色、关系、魔法与声音演出约定。
- `plan.md`：共同线、角色线和真结局的章节与实施计划。
- `replay-design.md`：多周目规则、路线差异、真结局条件、声音重玩与待实现验收。
- `chapter-01.ink` 至 `chapter-08.ink`：按章保存的 Ink 源稿，便于逐章审阅；单章后续稿依赖共同变量和跨章 knot。
- `playtest.ink`：22个章节试跑声明与作者前情预设。
- `story.ink`：八章正文与试跑预设合并后的可导入完整主剧本。
- `assets/README.md`：未来配音、声纹参考、音乐和音效的资源约定。

## 当前范围

仓库保存八章完整源稿，包含三条恋爱路线、各自伙伴变体、伙伴调查线、马二福真线、权力结局和两种失败结局。本轮重点扩写第二章以后的场景、互动、选择后果与生活尾声，验收依据和实际检查结果见 [扩写审查记录](expansion-review.md)。

`chapter-01.ink` 至 `chapter-08.ink` 是编辑源；`story.ink` 是由构建脚本拼接的导入产物，**不会在运行时自动读取章稿**。第一章末尾的单章结束点在构建时改成第二章入口，随后追加`playtest.ink`；其余跨章跳转与变量统一由完整稿编译。改章稿后须重新构建，不要分别维护两套正文。

```sh
node content/stories/erha-youfu/tools/build.mjs
node content/stories/erha-youfu/tools/build.mjs --check
node content/stories/erha-youfu/tools/verify.mjs
node content/stories/erha-youfu/tools/verify-routes.mjs
node --import tsx content/stories/erha-youfu/tools/verify-routes.mjs --service
```

故事内的新周目会重置本轮关系、道具、债务与技能，保留已获得的机制回响和已达结局回顾。同一存档可以连续完成多周目；另开平台会话不会继承回响。本轮未导入或发布数据库版本，已发布会话不受文件改动影响。`voiceId`、`audio` 和 `music` 是素材关联元数据；本轮没有实测配音或听读时长。

## 导入约定

`authoring.json` 保存 8 个说话角色的简介、性格、目标、秘密，以及 7 条初始关系；依据本目录 `design.md` 与章稿整理。关系不预设恋爱结局，`variableKey` 仅关联真实 Ink 变量，不赋值；信任变量不映射成虚构的 0–100 强度。旁白是演出角色，不额外编造社会关系。

```sh
node content/stories/erha-youfu/tools/build.mjs --check
node --import tsx content/stories/erha-youfu/tools/import.mjs --check
# 使用已确认的本地数据库；--write 更新草稿，--publish 另发不可变版本
MONGODB_URI=mongodb://127.0.0.1:27018/wawawa node --import tsx content/stories/erha-youfu/tools/import.mjs --write --publish
```

导入器保留现有 voiceId，按修订号更新同名故事，多个同名记录会拒绝操作。修改前草稿备份在忽略目录 `.local/import-backups`；导入后读回核对角色、关系、源码和图快照，并验证既有版本/会话未被改写。内容未改变时重复执行不新增版本。结构图沿用 SDD-008 当前提取器，不代表全部条件路径已被穷举。

导入工作台时，将 `story.ink` 作为当前故事的 `source`，再按 `design.md` 中的角色表填写角色配置。发布前要在工作台编译并保存；`chapter-01.ink` 仅用于单章回看，不代表完整故事入口。

## 多周目设计入口

建议先读 [多周目设计](replay-design.md) 了解三条女主路线与福门回响，再读 [章节计划](plan.md) 了解章节结构。故事内的“开启新周目”已经可玩；平台层仍未把回响保存为跨会话玩家档案。单独运行第一章仍只适合章节演示，完整通关请使用 `story.ink`。

## 指定章节试跑（SDD-006 CP01–CP06）

完整 `story.ink` 声明了第二、三章共同线，以及第四至第八章金妮、何敏、马二福、伙伴四条路线，共 22 个入口。更新工作台源码并重新发布后，在「对话模拟器」选择发布版本、章节及前情预设即可试跑。旧的第一章演示版没有这些入口；旧存档也不会因发布新版而迁移。

预设由剧本末尾的 `playtest_*` Ink knot 初始化，状态对应测试中的固定首轮路径：沉默回应 → 立界挡咒 → 校徽交何敏 → 接受道歉并要求停手 → 查李家 → 校史塔取证 → 分担护界压力；后续按所选路线采用公开、尊重、协作的选择。感情线在第六章前已确认关系，伙伴线保持单身；预设没有跨周目回响，因此不会直接解锁马二福真结局。第二、三章尚未选择人物路线。

这些是作者准备的测试前情，不是你的真实历史。普通存档与试跑存档分别恢复；可以返回正常进度继续玩。真实章节检查点回滚和旧版存档接入新版均不在本次范围。正常从头开始仍自动跨章，无需在每章结束时另选下一章。
