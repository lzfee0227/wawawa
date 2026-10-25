// 第八章：留给谁的福
=== chapter_08_jinni ===
天亮时，诊疗站的抽取管线已经被封存。罗金妮把第一份跨城镇互助协议放在你面前。 # speaker:narrator # music:morning
{shared_cost:
    “每个节点轮换负责人，账目和护界记录向所有成员公开。”罗金妮说。 # speaker:jin_ni
- else:
    “我们先从一条轮值护界开始，直到你愿意把责任交给别人。”罗金妮说。 # speaker:jin_ni
}
+ {romance && relationship_confirmed} [和金妮成婚并共同协调互助网络]
    ~ echo_shared_cost = true
    “我愿意和你结婚，也愿意在下一次轮值里听你的反对。”罗金妮说。 # speaker:jin_ni # emotion:warm
    你们在跨城镇互助网络的自治节点前交换戒指。 # speaker:narrator
    -> end_jinni
+ [以伙伴身份交接网络]
    ~ echo_shared_cost = true
    你们把协调权限交给轮值委员会，保留长期合作。 # speaker:narrator
    -> end_partner_jinni

=== chapter_08_hemin ===
契约审议所的第一场公开听证没有掌声，只有逐条质询。 # speaker:narrator # music:public-hearing
{revocable_oath:
    何敏把撤销按钮交给当事人：“任何人都可以申请复核，任何权限都必须能被撤销。” # speaker:he_min
- else:
    何敏宣布暂缓签署，直到见证人补齐副本。 # speaker:he_min
}
+ {romance && relationship_confirmed} [和何敏成婚并共同接受审议]
    ~ echo_revocable_oath = true
    “我愿意和你成婚，也愿意让你在公开记录里指出我的错误。”何敏说。 # speaker:he_min # emotion:soft
    你们在审议所的门口交换戒指。 # speaker:narrator
    -> end_hemin
+ [以伙伴身份继续复核]
    ~ echo_revocable_oath = true
    你们把审议权交给独立成员，自己接受定期复核。 # speaker:narrator
    -> end_partner_hemin

=== chapter_08_ma ===
旧继承书在福门前燃尽，马二福把自己的名字从唯一守福者的位置上取下。 # speaker:narrator # music:seal-release
{true_plan:
    “这一福，不属于某一个人。”她说，“我愿意和你一起过日子，也愿意让共同规则约束我们。” # speaker:ma_er_fu # emotion:resolute
    -> end_ma_true
- else:
    “我会把继承权改成多人议事，但今天先封住这扇门。”马二福说。 # speaker:ma_er_fu
    {romance && relationship_confirmed:
        -> end_ma_good
    - else:
        -> end_ma_partner
    }
}

=== chapter_08_partner ===
响应队把最后一名学生送到安全线外。罗金恩把队章别在你的外套上。 # speaker:jin_en # music:clear-sky
“我们不需要一个救世主，需要能被叫停的队长。”
+ [主动选择单身，和伙伴建立响应队]
    {shared_cost || revocable_oath:
        ~ echo_partner = true
        你们离开校董体系，成立由多人轮值的机动灾害响应队。 # speaker:narrator
    - else:
        你们先把证据交给学生代表，约定下次补齐调查。 # speaker:narrator
    }
    -> end_partner

=== end_jinni ===
【金妮结局：从小到大的约定】 # speaker:narrator
你们的婚后生活有争吵、有轮值，也有每次把功劳写回所有人的记录。 # speaker:narrator
本轮获得福门回响：可分担代价。新周目中，系统只提示方向，不替你证明答案。 # speaker:system
-> run_summary
=== end_partner_jinni ===
【伙伴结局：共同的雨伞】 # speaker:narrator
金妮仍是互助网络的核心成员，你们把机动响应队设为协作单位。 # speaker:narrator
-> run_summary
=== end_hemin ===
【何敏结局：答案之外】 # speaker:narrator
你们的婚礼没有免除质询；第一份婚后协议就是允许彼此申请复核。 # speaker:narrator
本轮获得福门回响：可撤销权限。新周目中，系统只提示方向，不替你签名。 # speaker:system
-> run_summary
=== end_partner_hemin ===
【伙伴结局：可复核的答案】 # speaker:narrator
契约审议所与机动灾害响应队互相监督，所有撤销记录都公开保存。 # speaker:narrator
-> run_summary
=== end_ma_good ===
【马二福 Good End：名字写在一起】 # speaker:narrator
马二福与你成婚，地区议事团的席位按公开规则轮换；她的名字终于不再是一张契约。 # speaker:ma_er_fu # emotion:warm
-> run_summary
=== end_ma_partner ===
【马二福伙伴结局：名字由她自己保管】 # speaker:narrator
你们没有把互相尊重说成婚约；马二福加入公开议事团，你和伙伴们继续维护可撤销的规则。 # speaker:narrator
-> run_summary
=== end_ma_true ===
【马二福 True End：这一福，留给你】 # speaker:narrator
你们没有把福门换一个主人，而是把共同契约写成可质询、可撤销、可由多人承担的规则。 # speaker:narrator
“有福，是我愿意和你一起过日子。”马二福说。你们在众人见证下成婚。 # speaker:ma_er_fu # emotion:warm
-> run_summary
=== end_partner ===
【伙伴结局：霍海的新校规】 # speaker:narrator
四人离开校董体系，建立机动灾害响应队；成员轮值、公开记录，任何队长都可以被叫停。 # speaker:narrator
-> run_summary

=== run_summary ===
第 {run_number} 周目已经结束。系统只保留结局和已验证的回响，不保留上一轮的关系、道具或技能。 # speaker:system
{echo_shared_cost: “当前档案已有回响：可分担代价。” # speaker:system}
{echo_revocable_oath: “当前档案已有回响：可撤销权限。” # speaker:system}
+ [开启新周目]
    -> replay_start
+ [停在本轮结局]
    -> END

=== replay_start ===
~ run_number += 1
~ run_echo_shared_cost = echo_shared_cost
~ run_echo_revocable_oath = echo_revocable_oath
~ reputation = 0
~ courage = 0
~ investigation = 0
~ causality_debt = 0
~ trust_jin_en = 0
~ trust_jin_ni = 0
~ trust_he_min = 0
~ trust_ma_er_fu = 0
~ knows_bloodline = false
~ has_fumen_key = false
~ discipline_pending = false
~ badge_holder = "unassigned"
~ opening_response = "silence"
~ badge_returned_by_ma = false
~ shared_cost = false
~ revocable_oath = false
~ knows_system_cost = false
~ route = "unselected"
~ romance = false
~ relationship_confirmed = false
~ ma_apology = false
~ true_plan = false
~ identity_shared = false
~ records_shared = false
~ bloodline_shared = false
~ ma_respected = false
~ station_safe = false
~ trial_shared = false
~ evidence_public = false
~ relationship_ready = false
~ partner_focus = "none"
~ archive_focus = "none"
~ dangerous_delegations = 0
~ ending_id = ""
-> arrival
