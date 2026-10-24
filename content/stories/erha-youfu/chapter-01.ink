// 《二哈有福》第一章：下跪咒与新生注册
// 本章是可直接导入工作台的原始 Ink。后续章节暂不写入。

VAR reputation = 0
VAR courage = 0
VAR investigation = 0
VAR causality_debt = 0
VAR trust_jin_en = 0
VAR trust_jin_ni = 0
VAR trust_he_min = 0
VAR trust_ma_er_fu = 0
VAR knows_bloodline = false
VAR has_fumen_key = false
VAR accepted_help = false

-> arrival

=== arrival ===
雨水沿着霍海魔法大学的黑曜石拱门往下流。新生礼堂里，成百上千盏浮灯排成一条银色长河。 # speaker:narrator # music:rain

你，李博特，刚刚魂穿到一个同名的新生身上。
更糟的是，所有人都叫你李二哈。 # speaker:narrator

一个金发女生挡在你面前。她穿着剪裁得像宣言一样利落的制服，校徽上的银马在灯下闪了一下。 # speaker:narrator # audio:footsteps

“原来你叫李二哈？”她抬起下巴，“凭你也配跟我的名字共享同一个二字？” # speaker:ma_er_fu # emotion:scornful

你想起昨天的记忆碎片：自己好像在分班登记处撞翻了她的墨水瓶，还把她写给校董会的申请踩出了一道脚印。

此时你要怎么回应？
* [沉默不语]
    ~ trust_ma_er_fu -= 1
    ~ reputation += 1
    -> kneel_curse
* [忽略她，直接路过]
    ~ reputation -= 1
    -> kneel_curse
* [怼回去]
    ~ courage += 1
    ~ reputation += 1
    ~ trust_ma_er_fu += 1
    “名字是父母给的，二字又不是你家的校产。”你说。
    马二福的眼睛眯了一下，像是第一次认真看你。 # speaker:ma_er_fu # emotion:surprised
    -> kneel_curse
* [先道歉]
    ~ reputation -= 1
    ~ trust_ma_er_fu += 1
    “昨天的事，对不起。我会赔你的制服。”
    “赔得起吗？”马二福冷笑，但魔杖没有立刻抬起。 # speaker:ma_er_fu # emotion:skeptical
    -> kneel_curse

=== kneel_curse ===
马二福抬起一根银白色魔杖。礼堂里嘈杂的人声像被谁掐住了喉咙。 # speaker:narrator # audio:magic-hum

“敢无视我，”她说，“下跪咒！” # speaker:ma_er_fu # emotion:angry

膝盖上方传来一股沉重的压力。你差点跪下，耳边却先响起了一个带着不合时宜 BGM 的声音。 # speaker:narrator # music:system-awakening

“叮。福运辅助系统激活。宿主已重生至霍海魔法大学，检测到高危法术。” # speaker:system

你在心里骂了一句：怎么才来？

系统只给出三个选项，像一张不太可靠的救命纸条：
* [立界，硬挡这一击]
    ~ courage += 1
    ~ causality_debt += 0
    -> break_curse
* [借势，把礼堂的钟声引过来]
    ~ causality_debt += 1
    ~ investigation += 1
    -> borrow_bell
* [先道歉，记住这次屈辱]
    ~ trust_ma_er_fu += 1
    ~ causality_debt += 0
    -> bow_choice

=== break_curse ===
你抬起手。没有咒语，没有华丽的光，只听见自己心脏跳了一下。 # speaker:narrator # emotion:focused

一道半透明的薄界在你膝前展开。下跪咒撞上去，碎成一圈银色水纹。 # speaker:narrator # audio:spell-shatter

礼堂里有人倒吸冷气。马二福的魔杖第一次偏离了你的眉心。 # speaker:ma_er_fu # emotion:surprised

“低阶立界？”何敏在旁边小声说，“你明明没有参加过护界预备课。” # speaker:he_min

“我也想知道我刚才做了什么。”

罗金恩从人群后面挤过来，一把揽住你的肩膀。 # speaker:jin_en
“哈哥，能站着就先别解释。校纪员来了。”
~ trust_jin_en += 1
-> registration

=== borrow_bell ===
你按照系统提示，把手指按在礼堂地砖的裂缝上。裂缝里有一条微弱的风。你借了它一下。 # speaker:narrator

钟楼的第一声钟响轰然落下。所有浮灯同时熄灭，魔杖上的咒光也被震散。 # speaker:narrator # music:bell-impact

黑暗里，马二福的声音离你很近：“你借了谁的势？” # speaker:ma_er_fu # emotion:low

“如果我说是礼堂，你信吗？”

“我只相信账单。”她收回魔杖，“这笔账我记下了。” # speaker:ma_er_fu
~ trust_ma_er_fu += 1
~ investigation += 1
~ accepted_help = true
罗金恩摸黑抓住你的袖口。 # speaker:jin_en
“哈哥，这种时候还敢乱借魔力，你真是越来越像你的外号了。”
~ trust_jin_en += 1
-> registration

=== bow_choice ===
你让膝盖碰到地面前的最后一寸空气，低声说：“昨天的事，是我不对。” # speaker:narrator # emotion:humiliated

下跪咒的压力停了一瞬。马二福似乎没想到你真的会道歉，魔杖尖端的银光因此晃了一下。 # speaker:ma_er_fu # emotion:uncertain

系统在你耳边提示：“检测到对方施法意图改变。建议保持清醒。” # speaker:system

你没有抬头，却听见魔力在她的呼吸里断了一拍。那不是心软，更像是她不习惯别人把选择还给她。 # speaker:narrator

“起来。”马二福说，“别让别人以为我喜欢欺负跪着的人。” # speaker:ma_er_fu
~ trust_ma_er_fu += 1
~ accepted_help = true
罗金妮从旁边递来一只手。 # speaker:jin_ni
“先站起来，哈哥。等你站稳了，再决定要不要还回去。”
~ trust_jin_ni += 1
-> registration

=== registration ===
校纪员把所有人赶到新生登记台前。马二福被叫去说明法术冲突，临走前回头看了你一眼。 # speaker:narrator

那一眼不像原谅，也不像仇恨。更像她在确认：你到底是走运，还是藏着什么。 # speaker:narrator

何敏把一张被雨水打湿的登记单递给你。纸背面印着一枚半圆形的旧校徽，校徽中央缺了一角。 # speaker:he_min

“这不是新生登记表的图案。”她说，“它和校史目录里一张被撕掉的图一模一样。”

罗金恩压低声音：“今晚去钟楼回廊？我知道一条不经过校纪室的路。” # speaker:jin_en

罗金妮看着你手里的旧校徽：“如果那是危险的东西，我们至少要先把它交给老师。” # speaker:jin_ni # emotion:concerned

系统提示只出现了一行字：
“检测到福门相关残响。请宿主选择第一位相信的人。” # speaker:system

* [把旧校徽交给何敏]
    ~ trust_he_min += 2
    ~ investigation += 1
    ~ knows_bloodline = true
    何敏没有追问你为什么相信她，只把校徽夹进自己的笔记本。 # speaker:he_min
    -> first_night
* [先交给罗金恩保管]
    ~ trust_jin_en += 2
    ~ reputation += 1
    罗金恩把校徽塞进袖口：“我不懂校史，但我懂什么时候该把东西藏好。” # speaker:jin_en
    -> first_night
* [追上马二福，把校徽给她看]
    ~ trust_ma_er_fu += 2
    ~ investigation += 1
    你在回廊口追上马二福。她看到校徽缺口时，脸色第一次真正变了。 # speaker:ma_er_fu # emotion:guarded
    “这东西不该出现在你手里。”
    “那它应该在谁手里？”
    马二福没有回答，只伸手按住校徽。两人的指尖同时感到一阵冰凉。 # speaker:narrator # audio:seal-pulse
    -> first_night
* [把校徽留在自己手里]
    ~ courage += 1
    ~ causality_debt += 1
    你把校徽贴身收好。系统立刻发出一声短促的警告。 # speaker:narrator # audio:system-warning
    “宿主选择独自承担。请确认：这不是系统建议。” # speaker:system
    -> first_night

=== first_night ===
新生注册结束，礼堂外的雨也停了。远处钟楼敲响第九声，回声在校园地下停了半拍。 # speaker:narrator # music:bell-distant

你们四个人站在回廊阴影里。没人知道那枚旧校徽究竟打开什么，但每个人都知道，今晚之后，霍海不会再只是大学。 # speaker:narrator

何敏说：“明晚，旧档案室门口。迟到的人负责解释。” # speaker:he_min
罗金恩说：“我带吃的。” # speaker:jin_en
罗金妮说：“我带绷带。” # speaker:jin_ni

回廊另一端，马二福独自停在雨后的窗边。她没有回头，却轻声说了一句只有你听得到的话：
“李二哈，别把那一福弄丢了。” # speaker:ma_er_fu # emotion:quiet

系统的最后一行提示浮在你的意识里：“第一章完成。福门残响已记录。” # speaker:system

-> END
