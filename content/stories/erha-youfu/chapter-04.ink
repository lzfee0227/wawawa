// 第四章：三条调查线与伙伴线
=== chapter_04_jinni ===
潮汐温室的病历在雨里发亮。罗金妮发现每个被治好的学生都被抽走了一点“避险运”。 # speaker:narrator # music:greenhouse-rain
“你记忆里的李二哈不会这样听病人的呼吸。”她说，“你愿意告诉我发生了什么吗？” # speaker:jin_ni # emotion:careful
+ [坦白自己有记忆断层]
    ~ trust_jin_ni += 2
    ~ knows_system_cost = true
    “我醒来时，带着另一个人的人生。可我不会拿旧记忆骗你。” # speaker:li_er_ha
    “那就从现在开始，一起记新的。”罗金妮说。 # speaker:jin_ni
    -> jinni_station
+ [只说系统给了提示]
    ~ trust_jin_ni -= 1
    “提示不是证据。”她把病历合上。 # speaker:jin_ni
    -> jinni_station

=== jinni_station ===
诊疗站的抽取管线正在给一名学生输送“好运”。罗金恩想砸掉总阀，罗金妮坚持先转移病人。 # speaker:narrator
+ [先按金妮的名单转移病人]
    ~ trust_jin_ni += 1
    ~ investigation += 1
    ~ shared_cost = true
    你们把风险拆成小段，让每个人只承受能承受的一次咳嗽和一次失手。 # speaker:narrator
    -> chapter_05_jinni
+ [直接切断总阀]
    ~ courage += 1
    ~ causality_debt += 1
    管线停了，病人却同时失去护界。罗金妮先救人，再严肃地指出你把自己当成了唯一的决定者。 # speaker:jin_ni
    -> chapter_05_jinni

=== chapter_04_hemin ===
契约实验室把每次抽取都写成“自愿”。何敏把代价记录推到你面前。 # speaker:he_min # music:contract-room
“如果记录对你不利，你也要保留。否则我们只是换一个人掌权。”
+ [交出完整的系统代价记录]
    ~ trust_he_min += 2
    ~ knows_system_cost = true
    ~ investigation += 1
    你把借势、警告和每次债务都写进同一页。 # speaker:li_er_ha
    -> hemin_experiment
+ [只交出能证明校董有罪的部分]
    ~ trust_he_min -= 1
    “删掉自己不利的证据，不能叫审议。”何敏说。 # speaker:he_min
    -> hemin_experiment

=== hemin_experiment ===
你们复现实验：只要两名见证人都能撤回签名，抽取就会停止。 # speaker:narrator
+ [让实验公开，接受同学质询]
    ~ trust_he_min += 1
    ~ investigation += 2
    ~ revocable_oath = true
    -> chapter_05_hemin
+ [先藏起实验，等掌握全部权限]
    ~ causality_debt += 1
    何敏同意继续查，但提醒你：延迟公开也会成为别人控制你的把柄。 # speaker:he_min
    -> chapter_05_hemin

=== chapter_04_ma ===
马家契约厅的墙上刻满“二福”两个字。马二福的母亲要求她签下守福继承书。 # speaker:narrator # music:contract-hall
马二福看向你：“如果你替我说话，我会把你一起写进契约。” # speaker:ma_er_fu # emotion:guarded
+ [要求她自己决定，我只作见证]
    ~ trust_ma_er_fu += 2
    ~ knows_system_cost = true
    你把笔推回她手边：“你的名字由你自己签。我也会把系统代价记录交给你。” # speaker:li_er_ha
    -> ma_repair
+ [替她签下解除申请]
    ~ trust_ma_er_fu -= 2
    你刚碰到笔，契约就把你的名字咬出一道血痕。 # speaker:narrator
    “你以为替我决定就是保护？”马二福冷冷地说。 # speaker:ma_er_fu
    -> ma_repair

=== ma_repair ===
马二福终于承认：“第一天的下跪咒是我施的。我会向校纪室道歉，也会赔偿被我吓到的新生。” # speaker:ma_er_fu # emotion:ashamed
~ ma_apology = true
~ trust_ma_er_fu += 1
+ [告诉她道歉必须包含具体补偿]
    ~ investigation += 1
    “还要公开说明我没有资格替别人决定尊严。”她补上。 # speaker:ma_er_fu
    -> chapter_05_ma
+ [说只要她对我道歉就够了]
    “只对你道歉不够。”马二福摇头。 # speaker:ma_er_fu
    -> chapter_05_ma

=== chapter_04_partner ===
校园撤离点挤满了被校董名单漏掉的学生。罗金恩负责搬运证据，金妮和何敏分别提供救援与复核方法。 # speaker:narrator # music:evacuation
+ [先建立公开的撤离名单]
    ~ trust_jin_en += 2
    ~ reputation += 1
    ~ investigation += 1
    -> chapter_05_partner
+ [先偷走校董的权限印章]
    ~ courage += 1
    ~ causality_debt += 1
    罗金恩把印章交给何敏登记：“证据要能交回去，不能只会藏。” # speaker:jin_en
    -> chapter_05_partner
