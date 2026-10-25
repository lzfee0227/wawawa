// 第二章：缺页的校史
=== chapter_02_start ===
第二天早晨，你被走廊里拖桶的声音吵醒。床头放着罗金恩带来的两个面包，一个缺了角，旁边留着纸条：不是老鼠，是我。 # speaker:narrator # music:morning
你笑到一半，膝盖忽然酸了一下。昨天的咒已经散了，身体却还记得那股迫使人低头的重量。 # speaker:narrator
{discipline_pending:
    你想起和马二福约好的校纪室，把面包塞进口袋。承认弄脏她的东西是一回事，承认她有资格让你下跪，是另一回事。 # speaker:narrator
- else:
    门下塞进一张校纪室传票。礼堂的施咒记录需要双方确认，你的名字和马二福的名字并排写在纸上，字一样大。 # speaker:narrator
}
校纪室没有想象中的刑具，只有一张晃腿的桌子。马二福坐在窗边，银白魔杖封在透明匣里。校纪员把礼堂的留声石放上桌，昨天那句“下跪咒”又响了一遍。 # speaker:narrator # audio:seal-pulse
她的手指蜷起来。留声石里没有家族姓氏替她把话变轻。 # speaker:narrator
{opening_response == "apology":
    “你的赔偿单我带来了。墨水和衣料可以另算。” # speaker:ma_er_fu
    她把另一张写着施咒经过的纸推到桌子中央，没有压在赔偿单下面。 # speaker:narrator
- else:
    “昨天你的话让我不痛快。但这不能写成我施咒的理由。” # speaker:ma_er_fu
}
校纪员要求她说明是否有人先攻击她。她停了一会儿，回答没有。处分是暂停决斗资格两周、赔付检查费用，并在新生登记处做四次公共服务。 # speaker:narrator
“李二哈，我不该对你用下跪咒。对不起。” # speaker:ma_er_fu # emotion:ashamed
她说得生硬，目光没有躲开。你等了片刻，没有听见“但是”。 # speaker:narrator
+ [接受道歉，要求以后停手]
    “我听到了。以后我说停，你就停。不是只有魔杖碎了才算受伤。” # speaker:li_er_ha
    “记住了。” # speaker:ma_er_fu
    ~ trust_ma_er_fu += 1
    -> discipline_done
+ [承认她道歉了，暂不原谅]
    “处分归处分。我现在还不想说没关系。” # speaker:li_er_ha
    她抿了一下嘴，把原本伸向确认单的手收回去，等你自己签字。 # speaker:narrator
    “可以。” # speaker:ma_er_fu
    ~ trust_ma_er_fu += 1
    -> discipline_done

=== discipline_done ===
~ discipline_pending = false
~ ma_apology = true
出了门，你把面包掰开，才发现里面的奶油压扁了。马二福看了你一眼，像要讥讽，最终只是把快掉到地上的纸袋托了一下。 # speaker:narrator
“晚上那枚校徽的事，我会来。我有些话想问旧档案，不是问你。” # speaker:ma_er_fu
你没有把这句话当成和好。但至少她这次没有命令你跟上。 # speaker:narrator
白天的课程过去得很慢。教授教你们用最少的魔力点灯，罗金恩的灯泡亮得像煎蛋，熄灭时还冒了一股糊味。午后你练了十一次立界，最好的一次挡住了一粒粉笔头。昨天的奇迹没有把基础课送给你。 # speaker:narrator
傍晚，何敏在旧档案室门口等人。她脚下压着一块砖，门每过半分钟就试着把自己关上。罗金恩带了点心，罗金妮带来一卷防潮布。马二福最后到，袖口沾着登记台新换的红墨。 # speaker:narrator # music:archive-hum
{badge_holder == "he_min":
    何敏从内袋取出昨晚保管的校徽，先让你看清缺口，才放到桌上。 # speaker:narrator
}
{badge_holder == "jin_en":
    罗金恩从袖口翻出校徽，连同一粒面包屑递给何敏。何敏把面包屑拨开，郑重接过校徽。 # speaker:narrator
}
{badge_holder == "ma_er_fu":
    马二福打开贴有封条的小盒，把校徽交给何敏检查。盒里垫着一块手帕，银马的棱角没有划坏它。 # speaker:narrator
}
{badge_holder == "li_er_ha":
    你从外套口袋取出校徽，放进何敏摊开的防潮布里。 # speaker:narrator
    {badge_returned_by_ma:
        “你要的校史到了。现在可以拿答案来换了。” # speaker:li_er_ha
        “先看。别急着替它起名字。” # speaker:ma_er_fu
    }
}
~ badge_holder = "he_min"
何敏用三枚普通钉子抵住布角。纸上的旧校徽图案，与实物缺口严丝合缝。她在目录背面找出一排针孔：缺页是被人拆走的，留下的页码又被改过。 # speaker:narrator
“我白天问过管理员。他说旧书自然会坏。我问为什么每本都恰好坏在同一年，他就让我先去修选课单。” # speaker:he_min
“你去了吗？” # speaker:jin_en
“去了。所以我们今晚有借阅许可。” # speaker:he_min
她把一张盖章的单子压在最上面。你原以为她只是爱较真，现在才发现她已经替这次冒险争取了一个能解释的入口。 # speaker:narrator
桌上有三册书：李家的封存名录、马家的印契抄本、灾年医疗账。你们来不及先把每一本读完。 # speaker:narrator
+ [先查李家的名字]
    ~ archive_focus = "bloodline"
    ~ investigation += 1
    你在封存名录里看见“李二哈”三个字，墨迹新得刺眼。前面几页都是已经去世的人，最后一页却是今年的新生补录。 # speaker:narrator
    你把指尖从名字上挪开，纸仍然温热。系统只确认这是一份同血脉的响应记录，没有替你判断谁补了名字。 # speaker:narrator
    “有人在你入学前，就等着这张表填满。” # speaker:he_min
    -> archive_compare
+ [先查守福印的持有人]
    ~ archive_focus = "seal"
    ~ investigation += 1
    马家的抄本每一页都写着第二位守福者，几乎不写本人的名字。马二福翻页的声音越来越快，在一张空白签名页前突然停住。 # speaker:narrator
    “这张纸，和我家每年生日送来的贺卡是同一种。” # speaker:ma_er_fu
    她用指甲刮下纸角一点银粉。你第一次觉得，她收到的礼物可能比你的传票更难拆。 # speaker:narrator
    -> archive_compare
+ [先查被删掉的灾年记录]
    ~ archive_focus = "disaster"
    ~ investigation += 1
    灾年账上写着港口连着七天没有风浪。同一周，诊疗站收了十九个反复跌倒、误吞药物的学生。罗金妮把两本账的日期并排抄下。 # speaker:narrator
    “不能只看这两页就说是它害的。明天我去找原来的病历。” # speaker:jin_ni
    你看到第十九个名字旁边写着“已返乡”，返乡车费却记在丧葬一栏。点心忽然变得很难咽。 # speaker:narrator
    -> archive_compare

=== archive_compare ===
罗金恩负责对页码，马二福读印契里的古称，何敏把彼此缺的部分拼上。罗金妮将灾年的日期用细线连到封存名录。你们不是忽然懂了全部秘密，只是找到了几件不能同时当作巧合的事。 # speaker:narrator
名录记载李家负责承受阵法停机时的反冲，马家保管开启与封存所用的守福印。页边有一个小小的圆形凹槽，尺寸和旧校徽相同。 # speaker:narrator
“碰它之前，先把所有手拿开。” # speaker:he_min
你将校徽放进凹槽。胸口像被一根细线轻轻拉住，系统把响应频率同名录里的李家记录逐项比对，三项都吻合。 # speaker:narrator # audio:seal-pulse
“承福血脉响应确认。这只能证明你能承受反冲，不证明你应该替谁承受。” # speaker:system
~ knows_bloodline = true
你听见罗金妮把椅子挪近。她没有惊呼你有天赋，只问胸口疼不疼。你说不疼，说完才发现自己一直屏着气。 # speaker:narrator
{run_echo_revocable_oath:
    你想起系统播报过的撤销回响，问签名能否擦掉。马二福用橡皮擦了抄本上一个废名，银粉却沿笔画重新聚拢。回响给了问题，答案仍不在眼前。 # speaker:narrator
}
{run_echo_shared_cost:
    你提议找共同承受反冲的记录。何敏在空白目录上记下这个问题，提醒你眼前只有单人记录，不能拿回响替代试验。 # speaker:narrator
}
校徽下方传来咔的一声，桌脚陷下半寸。罗金恩先抓住点心，接着骂了自己一句，伸手撑住书架。罗金妮把他拉到安全处，何敏将校徽从凹槽抬起；地板停了，裂缝却没有合上。 # speaker:narrator # audio:stone-shift
裂缝通向一条检修廊。左边的铜牌写校史塔，右边写地下旧礼堂。许多年前，这两处竟然共用一条路。塔上应有封存物证，地下仍传来半拍迟到的钟声。 # speaker:narrator
“天黑以后只能查一处。回程还得走这些会动的楼梯。” # speaker:he_min
+ [带大家去校史塔，先取证]
    ~ investigation += 1
    -> archive_tower
+ [跟着回声去地下旧礼堂]
    ~ courage += 1
    -> old_hall

=== archive_tower ===
你们沿着左边的铁梯爬到塔顶。风把铁梯吹得像一把锯，罗金恩在后面报出每一级松动的位置。上方一个封存柜挂着三把锁，其中两把已经锈断。 # speaker:narrator
你没有施咒，和马二福一起把柜门往上托，何敏从缝隙伸进手，取出一枚烧焦的登记牌。牌背写着：检修钥片，持有人可查，不得启门。 # speaker:narrator
罗金妮用防潮布擦去灰，登记牌刚好能嵌进校徽缺口。扣上的一刻，你听见一道清楚的短音。系统确认这是检查通道的凭证，不是命令福门的权力。 # speaker:narrator
~ has_fumen_key = true
“原来钥匙也分能看和能管。” # speaker:jin_en
“最好一直分着。” # speaker:ma_er_fu
你们把牌上的编号抄了三份。何敏将合好的校徽交回你手里，请你保管到明天，让每个需要查验的人都能借到。 # speaker:narrator
~ badge_holder = "li_er_ha"
-> archive_return

=== old_hall ===
右边的石阶湿得发亮。到了旧礼堂，你才发现所谓墙上的名字，是每一届学生留下的风险名册。有的名字后面只有一道浅痕，有的被划得几乎透过石板。 # speaker:narrator # music:underground
最下面那块牌松了。你用听息找到固定钉，罗金恩拿点心盒的铁盖撬开它。牌后掉出一枚钥片和一张旧检修图，你的手伸过去，被图纸上的残余护界震开。 # speaker:narrator
“可借用通风井的风压挡住一次反冲。会新增一笔因果债，也可以花时间先排风。” # speaker:system
+ [先排风，再取钥片]
    你们轮流扳动锈死的风轮。整整一刻钟，没人再说漂亮话，只听见喘气和罗金恩数数。风压终于退去，钥片安静地落进你掌心。 # speaker:narrator
    -> hall_key
+ [借势护住手，立即取出]
    ~ causality_debt += 1
    薄界替你挡住石壁的反冲，手指仍被震得发麻。系统报出新添的一笔债，你把这句记录读给大家听。罗金恩扶住你，等麻意过去才松手。 # speaker:narrator
    -> hall_key

=== hall_key ===
钥片背面写着“检修凭证”，与你们带来的校徽缺口吻合。它允许进入检查通道，不能开启福门。你将两件东西扣在一起，收进口袋；何敏保存检修图。 # speaker:narrator
~ has_fumen_key = true
~ badge_holder = "li_er_ha"
~ investigation += 1
石板后面还有半句旧铭文：“承受者与守印者，应共同……”后面的字被新水泥盖住。马二福摸了摸那层水泥，没有强行揭开。 # speaker:narrator
“这一半还在，就有人知道另一半被藏在哪里。” # speaker:ma_er_fu
-> archive_return

=== archive_return ===
回到地面，晚餐的钟已经敲过。罗金恩把点心分成五份，你那份最小，他说英雄要保持轻盈。你想抗议，发现他自己那份只有碎屑。 # speaker:narrator
何敏在灯下整理借阅登记，把发现和猜测分了两栏。马二福补了一个家族旧字的读音。罗金妮写上明天要去诊疗站找的病历编号。 # speaker:narrator
你看着五个人的字挤在一页纸上。昨天你还不知道自己在这里算谁，今晚却有人把自己的调查安排在你的名字旁边。 # speaker:narrator
临走时，一张新公告从门缝钻进来：明日上午新生护界试炼，由顾长明主持。试炼地点的图案，与你们刚抄下的福门外环一模一样。 # speaker:narrator
你们约定带上钥片，只观察，不擅自启门。何敏把这句话圈了两遍，罗金恩在旁边画了一小块面包。 # speaker:narrator
-> chapter_03_start
