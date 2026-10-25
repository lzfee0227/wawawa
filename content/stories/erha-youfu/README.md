# 《二哈有福》故事包

这是《二哈有福》的内容源文件。它是游戏项目的一部分，不依赖 MongoDB 中的草稿数据；数据库中的故事记录应由这些文件按需导入，并在发布时生成不可变版本。

## 文件

- `design.md`：世界观、角色、关系、魔法与声音演出约定。
- `plan.md`：共同线、角色线和真结局的章节与实施计划。
- `replay-design.md`：多周目规则、路线差异、真结局条件、声音重玩与待实现验收。
- `chapter-01.ink` 至 `chapter-08.ink`：按章保存的 Ink 源稿，便于逐章审阅；单章后续稿依赖共同变量和跨章 knot。
- `story.ink`：八章合并后的唯一可导入工作台的完整主剧本。
- `assets/README.md`：未来配音、声纹参考、音乐和音效的资源约定。

## 当前范围

仓库保存八章完整源稿，包含三条恋爱路线、各自伙伴变体、伙伴调查线、马二福真线、权力结局和两种失败结局。本轮重点扩写第二章以后的场景、互动、选择后果与生活尾声，验收依据和实际检查结果见 [扩写审查记录](expansion-review.md)。

`chapter-01.ink` 至 `chapter-08.ink` 是编辑源；`story.ink` 是由构建脚本拼接的导入产物，**不会在运行时自动读取章稿**。第一章末尾的单章结束点在构建时改成第二章入口，其余跨章跳转与变量统一由完整稿编译。改章稿后须重新构建，不要分别维护两套正文。

```sh
node content/stories/erha-youfu/tools/build.mjs
node content/stories/erha-youfu/tools/build.mjs --check
node content/stories/erha-youfu/tools/verify.mjs
node content/stories/erha-youfu/tools/verify-routes.mjs
node --import tsx content/stories/erha-youfu/tools/verify-routes.mjs --service
```

故事内的新周目会重置本轮关系、道具、债务与技能，保留已获得的机制回响和已达结局回顾。同一存档可以连续完成多周目；另开平台会话不会继承回响。本轮未导入或发布数据库版本，已发布会话不受文件改动影响。`voiceId`、`audio` 和 `music` 是素材关联元数据；本轮没有实测配音或听读时长。

## 导入约定

导入工作台时，将 `story.ink` 作为当前故事的 `source`，再按 `design.md` 中的角色表填写角色配置。发布前要在工作台编译并保存；`chapter-01.ink` 仅用于单章回看，不代表完整故事入口。

## 多周目设计入口

建议先读 [多周目设计](replay-design.md) 了解三条女主路线与福门回响，再读 [章节计划](plan.md) 了解章节结构。故事内的“开启新周目”已经可玩；平台层仍未把回响保存为跨会话玩家档案。单独运行第一章仍只适合章节演示，完整通关请使用 `story.ink`。
