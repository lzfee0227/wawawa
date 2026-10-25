// 第六章：福门之夜前夕
=== chapter_06_eve ===
落潮夜终于到了。离约定的第九声钟还剩一个时辰，校园外的海水正沿着黑色石阶退下去。你从回廊望出去，白天看不见的裂缝一条接一条露出，像地底有人慢慢张开手。 # speaker:narrator # music:countdown
钟楼底层已经点灯。罗金恩把长桌搬离漏雨的墙，桌上五只碗，汤里只有两块萝卜。他用勺子敲碗，宣布今晚任何人都不许空着肚子救学校。 # speaker:narrator
{route == "jin_ni":
    你和罗金妮带回潮湿的病历。她在门口先擦干鞋底，坐下时却忘了脱药篮。你替她取下来，发现肩带在她衣服上压出一道深痕。 # speaker:narrator
}
{route == "he_min":
    你和何敏抱着副本进门。她一张张数完才坐下，端起汤碗又放回去，问有没有人看见她的铅笔。那支铅笔一直夹在她耳后。 # speaker:narrator
}
{route == "ma_er_fu":
    马二福进门时外套少了一枚银扣。她把外套搭在椅背，你替她挂到炉旁，她说别烤得太近，过了一会儿又小声说了谢谢。 # speaker:narrator
}
{route == "partner":
    你和罗金恩把撤离名单压在碗下面。原本整齐的一页纸已经接上四张补单，边角全是不同人的手印。你们找回的人比最初那一列数字多得多。 # speaker:narrator
}
罗金恩先报最后一班转运车的位置。何敏问车上的人是否已经拿到自己的授权副本，罗金妮则问他们下车以后睡在哪里。那张被汤碗压住的地图很快挤满了字，几处空白仍旧刺眼。 # speaker:narrator
何敏带来一份授权格式，罗金妮带来愿意参与的救援者名单，马二福放下马家的封存附页，罗金恩拿出外环到渡口的实际撤离路线。它们都不完整，但终于能够摆到同一张桌上。 # speaker:narrator
你从胸前取出检修钥片。罗金恩用手托住你晃了一下的碗，问你还欠系统多少。你意识到，他从试炼以后就在等你自己把话说完。 # speaker:narrator
+ [向全队公开全部代价记录]
    ~ bloodline_shared = true
    ~ knows_system_cost = true
    ~ records_shared = true
    ~ investigation += 1
    ~ trust_jin_en += 1
    “大家看过名录，知道我是承福血脉。但还有些人没听过我的完整借用记录。今晚，我想把这一页补齐。” # speaker:li_er_ha
    你让系统逐笔读出借用记录，连自己当时为什么着急也说出来。没有借过的项目就明确记作零，没有拿空白冒充隐瞒。 # speaker:narrator
    “当前因果债：{causality_debt}。普通提示与本领内施法不增加债，越界护助另行预告。” # speaker:system
    罗金恩把你的碗往前推了推。这次他听完了才骂你笨，骂完把最后一块萝卜拨过来。 # speaker:narrator
    -> eve_visit
+ [只谈调查，保留个人记录]
    ~ bloodline_shared = false
    你把钥片和名录摊开，却不愿再让系统念出个人借用记录。此前听过的人没有替你公开，其他人仍不知道你的余量。屋里安静了一会儿。 # speaker:narrator
    “我们知道你有些事难说。可是进去以后，我该在什么时候拉你出来？” # speaker:jin_en
    你没有立即回答。他仍给你留着热汤，却把撤离方案中的单人任务划掉了。 # speaker:narrator
    -> eve_visit

=== eve_visit ===
门外响起三下敲门声。顾长明站在楼梯下，没有带随从。他看见桌上的材料，先问病人是否都已经离开诊疗站，然后把一只旧铁盒放下来。 # speaker:narrator
盒里是他年轻时的申请书。“缺家族担保”四个字，盖了三次。最下面夹着一张妹妹的住院收据，落款日期比最后一次驳回晚两天。 # speaker:narrator
“那时候只差一只稳定护界的手。我有力气，书在锁着的柜子里，能开柜子的人正在开会。” # speaker:gu_chang_ming
他收起收据，没有说后来妹妹怎样。屋里没人追问。你想起试炼时他替你拔出木刺的动作，突然明白那份耐心不是装的。 # speaker:narrator
“今晚旧家族的配额会失效。我需要一个能承受交接冲击的人。你帮我，以后寒门学生不必再拿这种纸去求谁。” # speaker:gu_chang_ming
“如果我说不呢？” # speaker:li_er_ha
“我仍要启阵。海潮不会等我们每个人都想明白。” # speaker:gu_chang_ming
他看向马二福，说守印家族也可以在新制度中保留席位。她没有接话，只把外套那枚缺扣的位置折进掌心。 # speaker:narrator
何敏问起终止授权。顾长明承认自己的接管协议没有给学生留停止权，因为临场的恐慌可能让整座城停在风暴里。他说到这里，声音第一次变硬。 # speaker:narrator
“你们可以质疑我的判断，不能在我救人的时候拔掉我的手。” # speaker:gu_chang_ming
“那要是您的手也在伤人呢？” # speaker:jin_ni
顾长明望着她，很久才把视线移开。他没有撕你们的材料，只留下一张临时托管许可：入阵以后若撑不住，可以让旧协议代为接手。 # speaker:narrator
门关上以后，系统识别出许可上的旧版条款。护助仍会询问你；托管不同，它允许协议暂时替你回应。一次试用到入门前结束，续签第二次可能把你列为阵法的一部分。 # speaker:narrator
“普通护助不需要这份许可。请不要把它们当成同一种帮助。” # speaker:system
+ [保留自己决定的权利]
    你把许可折起，没有签。罗金恩拿它垫在漏水的碗下面，何敏赶紧救走，说坏证据也得留着。 # speaker:narrator
    -> eve_plan
+ [试用一次临时托管]
    ~ dangerous_delegations = 1
    你签下仅限检查阶段的试用栏，确认到入门前终止。系统读出截止条件，何敏将副本装进自己的袋子。 # speaker:narrator
    一阵轻松涌上来，仿佛有人替你托住了脊背。你险些把这种轻松当成答案，直到罗金恩问你想坐哪张椅子，协议竟先把你的脚向前挪了半步。 # speaker:narrator
    “刚才那步，不是我想走的。” # speaker:li_er_ha
    “那就记住这个感觉。后面别只记得它不疼。” # speaker:jin_en
    -> eve_plan

=== eve_plan ===
钟楼的长针移了一格。你们必须把未说清的事留在门外，否则到阵里只能靠猜。 # speaker:narrator
{bloodline_shared == false:
    + [向全队补交完整代价记录]
        ~ bloodline_shared = true
        ~ knows_system_cost = true
        ~ records_shared = true
        你叫住正要收桌的罗金恩，把完整记录读完。他坐回来，在你说停的时候也停下笔，等你喘过气再继续。 # speaker:narrator
        “下次早一点。我不是非得等你快倒下才会帮忙。” # speaker:jin_en
        -> eve_debt
    + [仍保留秘密，接受撤离保护]
        “好。但如果你失去回应，我们就拉你出来，不让你单独接管核心。” # speaker:jin_en
        你答应这个边界，心里并不轻松。伙伴仍然同行，新的共同签署方案却不能建立在你没有说出的代价上。 # speaker:narrator
        -> eve_debt
- else:
    -> eve_debt
}

=== eve_debt ===
{causality_debt > 2:
    系统提示，你的旧债已经超过今晚新契约允许的余量。可以把当初借用的环境势能逐笔还进空载回路，最后保留两笔待偿；这需要放弃本晚的额外护助，并花掉半个时辰。 # speaker:narrator
    + [花时间偿还，放弃额外护助]
        你们把一盏盏空灯接上检修口。你重复立界、放下、再立界，直到掌心发热。每熄灭一盏灯，系统才注销对应的债，没有让旁人替你签一张空白欠条。 # speaker:narrator
        ~ causality_debt = 2
        ~ extra_help_forfeited = true
        马二福替你报剩余的盏数，何敏留着每次归还的读数。罗金妮要你最后十次坐着做，罗金恩索性搬来了椅子。 # speaker:narrator
        等钟声再响，追上顾长明的余裕少了，但你的手终于不再自己颤。 # speaker:narrator
        -> gate_choice
    + [保留时间，暂不偿还]
        你决定先去外环救人。系统明确告知旧债仍在，新契约暂不能接纳你，现有封门方案仍可执行。 # speaker:narrator
        罗金恩把撤离绳系在自己腕上，另一端递给你。这不是赞同你的所有决定，只是他不会让你无声无息地消失。 # speaker:narrator
        -> gate_choice
- else:
    你们核对完借用记录，当前债务仍在安全余量内。系统没有承诺今晚不会痛，只确认普通护界和检修还可以由你自己完成。 # speaker:narrator
    -> gate_choice
}

=== gate_choice ===
检修钥片打开钟楼地下的小门。五个人依次下阶，何敏在每个岔口留一段线，罗金恩负责把线尾接好。你终于重新听到第一晚那声迟到的半拍，来自门后两只互相应答的空铜碗。 # speaker:narrator # audio:gate-resonance
马二福用马家的封存附页对照门槽，确认普通方案可以先切断本地继承链，再由检修回路封门。它不会修好远方所有福门，但能把今晚的人带出去，也能解除她这一次继承。 # speaker:narrator
{route == "ma_er_fu" && run_echo_shared_cost && run_echo_revocable_oath:
    两道回响提醒你：旧铭文中的共同承担与退出权，可能原本是一套办法。你问是否能把两只铜碗当作同一条试验回路。 # speaker:narrator
    何敏制止你直接签名，先要一轮空载试验。罗金妮找来两位已经听清风险、可随时退出的成年救援者，自己也站在回路外看护。 # speaker:narrator
    + [一起验证两道回响的线索]
        罗金妮从检修架取来第三只铜碗，给三个签名分别接上储热片。你们只借储热片的余热，不抽取人体的力气。第一次由一片独供，灯很快熄灭；第二次按明示额度分给三片，三只铜碗各响一声，灯稳住了。 # speaker:narrator
        一名救援者按约定撤回自己的签名。灯光随即变暗，没有把他的份额暗中压给剩下的人。你们减小供给，重新征得同意才恢复灯亮。 # speaker:narrator
        何敏把撤销前后的读数念出来，马二福亲自擦去自己的试验签名。铜碗停响了，门没有把她的名字重新写回去。 # speaker:narrator
        ~ shared_cost = true
        ~ revocable_oath = true
        ~ investigation += 2
        “它原来允许人离开。后来有人把这句话磨掉了。” # speaker:ma_er_fu
        她摸过新水泥下露出的旧字。你想到的第一个念头不是终于能赢，而是她终于不用靠逃跑才能离开。 # speaker:narrator
        -> eve_readiness
    + [先救眼前的人，采用封门方案]
        你们留下试验材料和见证人姓名，今晚先按已经掌握的办法封门。马二福把附页收好，没有把谨慎当成背叛。 # speaker:narrator
        -> eve_readiness
- else:
    你们沿检修口做最后一次演练：罗金恩报位置，何敏复述，罗金妮确认撤离的人数，马二福指出封门槽，最后才轮到你试着立起薄界。 # speaker:narrator
    第一遍到第三个岔口时，线轴卡住了。你们退回去重新布线，让来时的每一段路都能接上回程。 # speaker:narrator
    -> eve_readiness
}

=== eve_readiness ===
~ true_plan = route == "ma_er_fu" && romance && relationship_confirmed && ma_apology && ma_respected && bloodline_shared && knows_system_cost && trust_ma_er_fu >= 4 && investigation >= 3 && causality_debt <= 2 && shared_cost && revocable_oath && run_echo_shared_cost && run_echo_revocable_oath
{route == "ma_er_fu":
    {run_echo_shared_cost == false: 系统没有提供共同分担的完整调查回响。你们还不能凭这一晚的猜测改写所有守福规则。 # speaker:narrator}
    {run_echo_revocable_oath == false: 关于层层转授的旧权限，回响里还没有能一路追到源头的线索。你摸了摸手中的附页，至少当地封门的步骤仍然清楚。 # speaker:narrator}
    {run_echo_shared_cost && run_echo_revocable_oath && (shared_cost == false || revocable_oath == false): 两道提示都在，但你们今晚没有完成两种机制的联合试验。提示本身不会替任何人签字。 # speaker:narrator}
    {bloodline_shared == false || knows_system_cost == false: 全队仍未共同核对你的代价余量。马二福合上新契约的试写页，说共同签署不能只由知情的两三个人决定。 # speaker:narrator}
    {relationship_confirmed == false: 你们没有作出共同生活的承诺，今晚按伙伴的封门安排合作。 # speaker:narrator}
    {ma_respected == false || trust_ma_er_fu < 4: 你们之间还有尚未修复的越界。马二福愿意合作封门，但没有同意与你承担新的守福签署。 # speaker:narrator}
    {causality_debt > 2: 系统再次提醒旧债超限，封门可以进行，新契约要另等偿还后的机会。 # speaker:narrator}
    {true_plan:
        “条件都核对过了。可到里面，我仍然会再问你一次。” # speaker:ma_er_fu
        “你也可以在那时说不。” # speaker:li_er_ha
        她点点头，像终于听见了自己一直等的半句回应。 # speaker:narrator
    }
}
第九声钟开始了。门缝里的光沿石阶爬上来，你握紧检修钥片，却没有走到所有人前面。罗金恩推开门，何敏接住线轴，罗金妮最后检查了一遍药箱。 # speaker:narrator
“走吧。回来再把那锅汤热一次。” # speaker:jin_en
-> chapter_07_route
