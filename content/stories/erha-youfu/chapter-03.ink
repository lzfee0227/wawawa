// 第三章：新生试炼与同行之约（共同线分流）
=== chapter_03_start ===
新生试炼在温室外庭开始。顾长明校董让所有人穿过一圈会改变方向的护界。 # speaker:narrator # music:trial
“最优秀的人，当然有资格替所有人做决定。” # speaker:gu_chang_ming # emotion:confident
何敏立即记下这句话。 # speaker:he_min
罗金妮看向被护界困住的低年级生。 # speaker:jin_ni
罗金恩已经在找能让大家撤出的路。 # speaker:jin_en

系统给出两种处理代价的办法。 # speaker:system
* [让大家分担护界压力]
    ~ courage += 1
    ~ investigation += 1
    ~ reputation += 1
    ~ shared_cost = true
    你让每个人只承担一小段压力，护界因此出现可供撤离的缝隙。 # speaker:narrator
    -> trial_route
* [借福把压力集中到自己身上]
    ~ causality_debt += 1
    ~ investigation += 1
    你让系统把压力先记在自己身上。它警告：这笔债必须在福门前偿还。 # speaker:system
    你仍然打开了出口，但没有把代价藏起来。 # speaker:narrator
    -> trial_route

=== trial_route ===
试炼结束后，三位同伴和罗金恩各自提出同行邀请。选择决定接下来的调查方向，不等于自动承诺恋爱。 # speaker:narrator
* [和罗金妮查诊疗站的抽取装置]
    ~ route = "jin_ni"
    ~ trust_jin_ni += 1
    -> route_choice
* [和何敏查契约实验室的权限记录]
    ~ route = "he_min"
    ~ trust_he_min += 1
    -> route_choice
* [和马二福回马家契约厅]
    ~ route = "ma_er_fu"
    ~ trust_ma_er_fu += 1
    -> route_choice
* [和罗金恩组织学生撤离与取证]
    ~ route = "partner"
    ~ trust_jin_en += 1
    -> route_choice

=== route_choice ===
你们在温室边的长椅上把关系说清楚。 # speaker:narrator
* [明确想与同行者发展感情]
    ~ romance = true
    ~ relationship_confirmed = false
    “我想靠近你，但不会把你的帮助当成答应。”你说。 # speaker:li_er_ha
    -> route_dispatch
* [先做伙伴，感情以后再决定]
    ~ romance = false
    “我现在只想把证据和人都带回来。”你说。 # speaker:li_er_ha
    -> route_dispatch

=== route_dispatch ===
{route == "jin_ni": -> chapter_04_jinni}
{route == "he_min": -> chapter_04_hemin}
{route == "ma_er_fu": -> chapter_04_ma}
-> chapter_04_partner
