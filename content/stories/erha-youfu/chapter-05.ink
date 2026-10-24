// 第五章：价值冲突与关系确认
=== chapter_05_jinni ===
暴雨冲垮旧渡口，诊疗站的病人只能靠临时护界过河。 # speaker:narrator # music:ferry-storm
罗金妮提出把护界分成四段，由学生轮流维护。你听见系统提示：集中承福可以更快。 # speaker:system
* [接受分担方案]
    ~ shared_cost = true
    ~ investigation += 1
    ~ trust_jin_ni += 1
    你把最危险的一段也交给轮值表，而不是交给自己。 # speaker:narrator
    -> jinni_relationship
* [独自承受整座渡口的坏运]
    ~ causality_debt += 2
    你救下渡口，却在雨里摔倒。罗金妮救回你后说：“我需要伙伴，不需要一座会替所有人倒下的墙。” # speaker:jin_ni
    -> jinni_relationship

=== jinni_relationship ===
* {romance} [和金妮确认关系]
    ~ relationship_confirmed = true
    ~ trust_jin_ni += 1
    “我喜欢的是现在愿意听我说完的你。”罗金妮握住你的手。 # speaker:jin_ni # emotion:warm
    -> chapter_06_eve
* [把她当作并肩伙伴]
    “我们先把网络建起来，感情不拿来当奖励。”你说。 # speaker:li_er_ha
    -> chapter_06_eve

=== chapter_05_hemin ===
听证厅里，校董要求你删掉一条会暴露系统债务的记录。 # speaker:narrator # music:hearing
* [保留对自己不利的证据]
    ~ revocable_oath = true
    ~ investigation += 1
    ~ trust_he_min += 1
    何敏把记录投到每一面回声墙上，允许所有人逐条质问。 # speaker:he_min
    -> hemin_relationship
* [先删掉，换取进入核心档案室]
    ~ causality_debt += 1
    何敏没有离开，但她要求你在下一次听证中把删去的内容完整读回。 # speaker:he_min
    -> hemin_relationship

=== hemin_relationship ===
* {romance} [和何敏确认关系]
    ~ relationship_confirmed = true
    ~ trust_he_min += 1
    “我不需要一个永远正确的人，只要你愿意被复核。”何敏说。 # speaker:he_min # emotion:soft
    -> chapter_06_eve
* [把她当作并肩伙伴]
    “规则要能被质疑，我们的关系也一样。”你说。 # speaker:li_er_ha
    -> chapter_06_eve

=== chapter_05_ma ===
马家旧宅的继承火印要求马二福在你和家族之间选一个签名。 # speaker:narrator # music:fire-seal
* [请她拒绝单人继承，和你共同提出公开契约]
    ~ trust_ma_er_fu += 1
    ~ investigation += 1
    ~ revocable_oath = true
    “共同不等于把权力分给两个人，而是让任何一个人都能被质询。”她说。 # speaker:ma_er_fu
    -> ma_relationship
* [请她先签下继承，再慢慢改变制度]
    ~ causality_debt += 1
    “慢慢改变最容易变成永远不改。”马二福没有签。 # speaker:ma_er_fu
    -> ma_relationship

=== ma_relationship ===
* {romance} [和马二福确认关系]
    ~ relationship_confirmed = true
    ~ trust_ma_er_fu += 1
    “我选择和你一起查，但我的名字仍然是我的。”马二福说。 # speaker:ma_er_fu # emotion:resolute
    -> chapter_06_eve
* [把她当作并肩伙伴]
    “我会要求你尊重我，也会尊重你的拒绝。”你说。 # speaker:li_er_ha
    -> chapter_06_eve

=== chapter_05_partner ===
机动灾害响应队的第一张名单需要你在救援机制和契约机制之间选一个调查方向。 # speaker:narrator
* [调查分担机制]
    ~ shared_cost = true
    ~ investigation += 2
    ~ trust_jin_en += 1
    -> chapter_06_eve
* [调查撤销机制]
    ~ revocable_oath = true
    ~ investigation += 2
    ~ trust_jin_en += 1
    -> chapter_06_eve
