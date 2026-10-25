// 第五章：一起撑过这场雨／让规则作证／名字不是枷锁／能被叫停的队伍
=== chapter_05_jinni ===
第二天清早，旧渡口的绳铃就没停过。雨打在木栈桥上，像有人在门外不停催促。你们把诊疗站的病人送到这里，才得知昨夜一根桥桩松了，渡船只能靠到离岸半丈的地方。 # speaker:narrator # music:ferry-storm
罗金恩站在船头递绳，罗金妮带着岸边的人练口令。每次只有两个人过桥，后面的人必须等前面报出自己的名字，才能松开护界。 # speaker:narrator
{station_safe:
    阿槐的呼吸比昨夜稳，主动替罗金妮报数。他认得每一位病人的声音，哪怕被雨声盖住，也能听出少了谁。 # speaker:narrator
- else:
    阿槐还不能长时间站立。罗金妮让他坐在岸边报数，你推着他的椅子，避开每一处会溅起冷水的凹陷。昨夜切断总阀的后果没有随着天亮消失。 # speaker:narrator
}
第一趟只有空担架。你负责左边，罗金妮负责右边，两位自愿帮忙的学生轮流接替。罗金妮先说明，护界要抵消担架滑落的风险，会暂时消耗施术者的避险运；试验只开最小一层，谁觉得手冷或动作不稳就喊停。每个人听完，都自己说了愿意。 # speaker:narrator
第一次换手，薄界裂了一道缝。你想用力压住，她却让所有人一起退半步，把绳结改到更靠岸的位置。第二次，担架顺利到了船上。 # speaker:narrator
系统把两次记录读给你们听：同样的滑落风险，独自撑界时集中消耗你一人的避险运；四人接入后，消耗总量没有少，却分成了事先同意的四份。它记的是实际发生的因果负担，不只是担架重量。 # speaker:narrator
一位学生感到指尖发冷，开口退出，大家便放下担架、停住护界。系统确认没有继续从他身上取力，也没有替剩下的人追加份额。所有人的余量都还够，不必向环境预借，自然没有新增因果债。 # speaker:narrator
“分担实验成立。需要知情同意、可停止，以及足够的人手。多人不等于没有代价。” # speaker:system
~ shared_cost = true
~ investigation += 1
你原以为系统会替你找到一条更聪明的捷径。此刻最有用的却是阿槐那个有些沙哑的“到了”，和另一头罗金恩准时应的一声“接住”。 # speaker:narrator
第三趟载人时，河心撞来一根断木。船身一晃，绳铃急响。一个学生怕得忘了报数，前后两道护界同时绷紧，你的膝盖险些折下去。 # speaker:narrator # audio:rope-bell
罗金妮喊你先将担架退回稳处。系统同时给出另一个应急办法：由你临时承受全部冲击，可以抢出几息，却会新增两笔因果债，还可能让你无法自行下桥。 # speaker:narrator
你看得见退回去需要的那几步，也看得见担架上阿槐护着布包的手。他不是不知道害怕，只是不想再给人添麻烦。 # speaker:narrator
+ [接受分担方案]
    ~ trust_jin_ni += 1
    你喊出“退半步”，没有把罗金妮的口令压过去。她让岸边两个人稳住绳，让罗金恩用船桨顶开断木，自己站到最容易滑倒的那块板上。 # speaker:narrator
    你看见她鞋尖打滑，心里一紧，仍然等到她说“换”，才接过那一段力。四个人的呼吸终于接到一起，断木擦着桥桩漂走。 # speaker:narrator
    阿槐过桥后，第一个做的不是道谢，而是举起手，替下一张担架报“可以”。 # speaker:narrator
    ~ relationship_ready = true
    -> jinni_shelter
+ [独自承受整座渡口的坏运]
    ~ causality_debt += 2
    你接受了系统的代价提示，把所有冲击引向自己的薄界。担架猛地稳住，船和栈桥之间那道缝却像突然长到了你的胸口。 # speaker:narrator
    你听不见雨，只听见自己数到一半的呼吸。罗金妮在你倒下前抱住你的肩，罗金恩抛来绳圈，两人一前一后把你拖回岸边。 # speaker:narrator
    剩下的学生按刚才练过的次序接手。你躺在湿木板上，看着最后一张担架从自己旁边过去，才发现没有你，刚才那个方案仍然能继续。 # speaker:narrator
    罗金妮将温热的药水一点点喂给你，没有说你救了谁，也没有要求你立刻认错。她只是等你能正常呼吸，再把你移进岸边的避雨棚。 # speaker:narrator
    ~ relationship_ready = false
    -> jinni_shelter

=== jinni_shelter ===
渡船终于靠上对岸。药房点起两盏约定的灯，表示病人已接收；罗金恩留在那边办交接，你和罗金妮在避雨棚里守着最后几件行李。 # speaker:narrator
棚里有一股旧麻绳的气味。她翻到名单末尾，把你的名字划上一个小小的勾。你以为她要责备你，却听见她问你想不想吃一点东西。 # speaker:narrator
{relationship_ready == false:
    “刚才我很怕。不是怕计划不好看，是怕我好不容易把你拉回来，你又觉得自己应该躺回去。” # speaker:jin_ni
    你低头看自己的手，指缝里还有昨天托花盆留下的泥。你想做一件足够大的事，证明自己配留在这具身体里，却差点让别人再失去一次你。 # speaker:narrator
    + [承认逞强，约定下次先听口令]
        “我一直想证明自己有用。可你们要的是我活着回来，不是一张救人的账单。” # speaker:li_er_ha
        ~ relationship_ready = true
        ~ trust_jin_ni += 1
        “我会看你下一次怎么做。现在，先把药喝了。” # speaker:jin_ni
        她把碗交给你自己端着，终于不再怕你连这点重量也撑不住。 # speaker:narrator
        -> jinni_identity_followup
    + [暂时无法答应，先把伤养好]
        “我现在还不知道下次会不会又这样。不能为了让你好受就先答应。” # speaker:li_er_ha
        “那我们先不谈更远的事。救援照做，休息也照做。” # speaker:jin_ni
        她把自己的行李挪近一点，替你挡住风口。她没有离开，但这份照顾也不是对所有事情的认可。 # speaker:narrator
        -> jinni_identity_followup
- else:
    “你刚才看见我脚滑，还是等我喊了换。我很高兴。” # speaker:jin_ni
    “我差一点就想抢过去。” # speaker:li_er_ha
    “我知道。所以更高兴。” # speaker:jin_ni
    -> jinni_identity_followup
}

=== jinni_identity_followup ===
{identity_shared == false:
    雨势慢下来，她从行李里找出一条旧布带，问你还记不记得这是拿来做什么的。你记得它的颜色，却说不出她为什么把它留到现在。 # speaker:narrator
    “昨天你说以后再说。现在没有人等我们搬床，可以说了吗？” # speaker:jin_ni
    + [把身份和记忆断层说清楚]
        ~ identity_shared = true
        ~ trust_jin_ni += 1
        你说出李博特这个名字，也说出属于李二哈、却不完整的记忆。你承认昨天害怕她听完就走，所以拿系统遮住了真正的问题。 # speaker:narrator
        她将布带放回袋里。那是从前两个人用来量长高了多少的，不是什么能够检验灵魂的证物。她留着，只因为那些日子确实存在过。 # speaker:narrator
        “我不会因为你说出来，就立刻知道该怎么办。但以后别让我靠猜你来陪着你。” # speaker:jin_ni
        你答应。她安静了很久，才继续整理东西。这个答案来得晚，至少从这一刻起，你们都不用再假装记得同一件事。 # speaker:narrator
        -> jinni_relationship
    + [仍然不愿说出全部]
        ~ identity_shared = false
        ~ relationship_ready = false
        “那我现在不能答应和你走进一段感情。我需要知道自己在靠近谁。” # speaker:jin_ni
        “但今天我们一起救过人，这件事不会因为我拒绝就变成假的。作为伙伴，我还会来。” # speaker:jin_ni
        你将她的布带小心放回原处，没有拿那段不属于自己的童年挽留她。 # speaker:narrator
        -> jinni_relationship
- else:
    她拿出一条旧布带，告诉你那是以前量身高用的。你们曾争论到底是谁站得不直，她讲到一半，自己先笑了。 # speaker:narrator
    你没有假装想起来。你只是听完，问她后来是谁赢了。她说布带湿了，谁也没赢，倒是两个人都挨了一顿数落。 # speaker:narrator
    “我会继续记得那些事。也想看看，和现在的你还能遇见什么。” # speaker:jin_ni
    -> jinni_relationship
}

=== jinni_relationship ===
她准备起身时，你把一直没说完的话留在这个终于不再催促你们的下午。 # speaker:narrator
+ {romance && identity_shared && relationship_ready} [和罗金妮确认关系]
    “我还想和你一起吃很多次饭，听你把那些话说完。不是因为我应该替谁完成约定，是我自己想。” # speaker:li_er_ha
    罗金妮没有立即握住你的手。她问你，如果她还会难过、还会提起从前，你是否也愿意听。你说愿意，并把手放在她够得着、也可以不碰的地方。 # speaker:narrator
    “那就慢慢来。你不用一夜之间长成我记忆里的样子。” # speaker:jin_ni # emotion:warm
    她的手终于落进你掌心。雨停时，你们仍坐了一会儿，没有急着用一个更大的承诺填满安静。 # speaker:narrator
    ~ relationship_confirmed = true
    ~ trust_jin_ni += 1
    -> jinni_departure
+ [把她当作并肩伙伴]
    “我想先把伙伴做好。关于感情，我现在不作承诺。” # speaker:li_er_ha
    “好。那你下次背药箱，我来认路。” # speaker:jin_ni
    她收好旧布带，把另一端行李递给你。你们没有因为说清楚就少了一个同伴。 # speaker:narrator
    ~ romance = false
    ~ relationship_confirmed = false
    -> jinni_departure

=== jinni_departure ===
接下来的两天，你们留在药房核对病人的用药，补记换手时谁需要更长的休息。阿槐能自己走到院门了，却总怕忘记报数；罗金妮告诉他，睡觉的时候不用报名字。 # speaker:narrator
落潮夜当天傍晚，罗金恩的传讯纸鸟扑进药房门廊，翅膀上沾着面粉。校方要求今晚重新接通诊疗站管线，说是为应对潮汐提供统一供能。 # speaker:narrator
马二福也托人送来一张短笺：她从旧宅琴房找到马家的封存附页，记录了本地继承链的停用槽。她会带原件到钟楼，请大家一起核对。 # speaker:narrator
罗金妮重新打开名单，在每个名字旁补上“已离开”。她说这些人不能再被一张空床算作供能者。你们带着分担实验记录和转运回执返回学校，先去钟楼与伙伴汇合，商量怎样阻止重新接通。 # speaker:narrator
-> chapter_06_eve

=== chapter_05_hemin ===
试炼三天后，落潮夜当天的下午，听证厅很冷，连咳嗽都能弹回来。前两天你们申请旁听、补齐记录，陪许砚练习怎样把实验说清楚；现在你和何敏坐在最后一排等候，前面刚结束的是食堂油灯预算，一位老师为两枚铜币争了很久。 # speaker:narrator # music:hearing
你忽然担心，那场险些烫伤人的实验，在这里也只会变成两枚铜币一样的小事。何敏把编号副本摊在膝上，手指不停摩挲纸角。 # speaker:narrator
“我知道该说哪一句。就是怕站起来时，全都忘掉。” # speaker:he_min
“那你忘了就看我。我负责把纸递对面。” # speaker:li_er_ha
“对面？” # speaker:he_min
“正面。我现在就开始练。” # speaker:li_er_ha
她轻轻笑了一下，手指终于停住。 # speaker:narrator
{evidence_public:
    旁听席上来了前几天看过实验的学生。有人带着自己重做的记录，许砚坐在走道边，没有靠前，却也没有离开。 # speaker:narrator
- else:
    旁听席空了大半。许砚没有收到公开消息，是你们临时托管理员带信才赶来的；他进门时还以为自己做错了什么。何敏先向他解释清楚，才请他留下。 # speaker:narrator
}
轮到你们，主持者并没有先否定实验。他问：删掉抽取权限后，治疗设施靠什么维持？旧契约已经用了很多年，两个学生是否承担得起改变它的后果？ # speaker:narrator
何敏没有说自己能承担所有人。她把实验中的余热与强制抽取分开，指出安全供能可以保留，但每一个借出者都应知道借出的范围，并且能够停止。 # speaker:narrator
她刚讲到系统对照记录，一名秘书递来便笺：只要把涉及你个人的护助与债务从公开卷宗删去，就给你们进入核心档案室的许可。那里也许有更大的证据。 # speaker:narrator
{records_shared:
    你的完整记录就在她手边。何敏没有替你答应，也没有替你拒绝，只将便笺翻过来，让你看清背面同样空白，没有任何兑现许可的签章。 # speaker:narrator
- else:
    何敏翻到你交来时折过的那一页。她无法替这段空白作证，主持者却已经拿它质疑整份实验。你第一次清楚听见，被藏起来的部分怎样替别人说了话。 # speaker:narrator
}
+ [保留对自己不利的证据]
    ~ records_shared = true
    ~ knows_system_cost = true
    ~ evidence_public = true
    ~ relationship_ready = true
    ~ trust_he_min += 1
    你请系统从头读出记录，包括每一次明确的代价提示。有人听到因果债便往后坐了坐，你没有急着解释自己其实是好人。 # speaker:narrator
    何敏等你读完，才将实验图立起，让大家指出究竟哪一步因此不成立。讨论终于从你是否值得喜欢，回到了灯为什么能够停下来。 # speaker:narrator
    -> hemin_testimony
+ [先删掉，换取进入核心档案室]
    ~ records_shared = false
    ~ evidence_public = false
    ~ relationship_ready = false
    ~ trust_he_min -= 1
    你按住了那张记录，答应删去。秘书带走便笺，档案室许可却没有立刻送来；主持者宣布先休会，等材料“整理完整”再议。 # speaker:narrator
    何敏合上卷宗，声音比刚才更轻。 # speaker:narrator
    “你可以不愿公开自己的事。但刚才你拿我的证词，一起换了一张还没拿到的门票。” # speaker:he_min
    你们退到走廊。她没有把书包交给你，也没有继续谈晚上去哪吃饭，先拿纸逐项记下被删掉的内容，防止这次交换连痕迹都不剩。 # speaker:narrator
    -> hemin_repair

=== hemin_repair ===
许砚追出来，手里攥着自己的实验副本。他问还用不用等，下午有一班工，再耽误就扣钱。你不能再用一句“很快”让他替你承担犹豫。 # speaker:narrator
+ [撤回交换，补读完整记录]
    ~ records_shared = true
    ~ knows_system_cost = true
    ~ evidence_public = true
    ~ relationship_ready = true
    ~ trust_he_min += 1
    你请秘书撤销许可申请，把刚才删去的记录重新附回卷宗，并签下更正说明。何敏看着你写完，才帮你把纸压平。 # speaker:narrator
    “我会说明这一页为什么晚了。不能装成我们从来没有犹豫过。” # speaker:he_min
    你答应了。你们回到厅里，让系统当众读完遗漏的内容，许砚终于不必再猜自己等的是一个结果，还是另一次拖延。 # speaker:narrator
    -> hemin_testimony
+ [保留交换，只以伙伴继续调查]
    ~ romance = false
    ~ relationship_confirmed = false
    ~ relationship_ready = false
    你仍想等核心档案室的许可，也承认自己现在无法给何敏需要的坦诚。你们说定只以伙伴身份继续，将合作范围写得清清楚楚：实验记录共享，个人证词各自负责。 # speaker:narrator
    她拿出图书馆留存的实验副本，申请单独提交。你帮许砚把要点读了一遍，约定重做完实验便送他去上工；没有人因此否认已经成功过的实验，也没有人替你的空白担保。 # speaker:narrator
    -> hemin_testimony

=== hemin_testimony ===
听证恢复时，何敏请求现场重做余热实验。两位旁听者按她写下的步骤接线，许砚授权，再自行撤回。铜线停响后，主持者还在等待某位教师批准停止，许砚已经将手从桌上拿开。 # speaker:narrator
厅里安静下来。那只手没有受伤，没有得到奖赏，也没有因为违抗命令而颤抖。它只是回到了一个普通人自己身边。 # speaker:narrator
~ revocable_oath = true
~ investigation += 1
听证没有立刻推翻校董会。它给了你们一份盖印的实验记录，允许保留副本，并要求校方在今晚供能前解释旧契约为何不能撤回。何敏将这份有限的结果读了两遍，确认没有把希望误当成已经发生的事。 # speaker:narrator
散场后，你们留在空厅收椅子。她从桌缝里找回那支快用尽的铅笔，笑着说它今天比许多漂亮魔杖管用。你第一次看见她允许自己因一件尚未完美的事高兴。 # speaker:narrator
{records_shared:
    “谢谢你没有让我替你猜那一页。” # speaker:he_min
    “也谢谢你没有因为那一页，就认定其他的我都是假的。” # speaker:li_er_ha
- else:
    她将实验副本递给你，个人记录仍各自收好。你们约定今晚按证据办事，不用一次合作遮住尚未解决的分歧。 # speaker:narrator
}
-> hemin_relationship

=== hemin_relationship ===
走出听证厅时，夕光照在空下来的座位上。你们终于可以说一件不必写进卷宗的事。 # speaker:narrator
+ {romance && records_shared && relationship_ready} [和何敏确认关系]
    “那天一起分那块饼，我想的不是下一个实验。我想以后也能坐在你旁边。” # speaker:li_er_ha
    何敏将铅笔转了一圈，认真得像在检查一道自己从未做过的题。她问你是否介意她会着急、会说错话，也会有不想解释的时候。 # speaker:narrator
    “那就先吃饭。想说的时候再说。我也不是每天都有漂亮答案。” # speaker:li_er_ha
    “你今天有一句还不错。” # speaker:he_min # emotion:soft
    她主动牵住你的手，另一只手仍抱着卷宗。走到台阶时，你替她接过书包，她没有再拒绝。 # speaker:narrator
    ~ relationship_confirmed = true
    ~ trust_he_min += 1
    -> hemin_departure
+ [把她当作并肩伙伴]
    “我希望我们继续一起查。感情的事，我现在不承诺。” # speaker:li_er_ha
    “说清楚很好。那明天借书时，你还是得还我一支铅笔。” # speaker:he_min
    你们把话留在台阶上，没有让它混进任何一份实验结论。 # speaker:narrator
    ~ romance = false
    ~ relationship_confirmed = false
    -> hemin_departure

=== hemin_departure ===
广场上传来傍晚的报时钟，离约定启阵的第九声还早。校方的供能通知贴到了听证厅门外：为应对今晚潮汐，地下旧礼堂将统一接管临时授权。你们刚证明一个名字应该能够撤回，就有人准备让所有名字暂时不许退出。 # speaker:narrator
马二福的短笺夹在新通知后面：她从琴房旧箱找到封存附页，上面保留着本地继承链的停用位置。何敏请送信人转告她，带原件到钟楼，和检修图一起核对。 # speaker:narrator
何敏折好盖印记录，放在最容易取出的地方。她没有再说“证据足够了”，只告诉你，先去钟楼见齐伙伴，今晚再把这份实验带到真正运转的福门前。 # speaker:narrator
-> chapter_06_eve

=== chapter_05_ma ===
第二天清早，马二福带你从旧宅的侧门进去。她换下了带银扣的外套，袖口还留着登记服务时沾上的墨水。门房习惯地喊“第二守印人”，她停下来，让他叫自己的名字。 # speaker:narrator # music:fire-seal
琴房的门一推开，灰尘先扑到你鼻子里。你连打三个喷嚏，她扶着门笑了半天，终于露出一点在契约厅里完全不见的年纪。 # speaker:narrator
旧钢琴上压着一摞账册。马二福告诉你，母亲年轻时会弹琴，后来每次坐到这里，手边都是港口损坏的账单。琴键少了几颗，桌子倒是一直够用。 # speaker:narrator
你们在一只干裂的木盒里找到旧继承书。早年的承诺只要求守印者照看一座闸，后来的附页却不断增加城镇、年限和连带义务；最后甚至写到尚未出生的继承人。 # speaker:narrator
马二福指着那串比自己年龄更长的日期，一页页往前翻。她的名字早在她会写字以前，就已经出现在纸上。 # speaker:narrator
“难怪他们总说我小时候答应过。” # speaker:ma_er_fu
你伸手去扶差点掉下来的账册，她却先缩了一下。 # speaker:narrator
{ma_respected:
    她意识到你只是在接书，轻轻吐了口气，把盒子推到两人中间。昨天你在大厅里停下的那只手，让她今天愿意把东西放近一点。 # speaker:narrator
- else:
    昨天你替她碰笔的动作，还停在她记忆里。你只好把手放在桌边，等她自己把书摆稳。 # speaker:narrator
}
你们花了两天核对旧账。马二福每天抽空去登记处完成服务，回来时会多带一块干布，先擦掉椅上的潮气才让你坐。你们把每一处添改按日期摊开，渐渐拼出旧约如何变成今天的样子。箱底还封着一页维护说明，画着本地继承链的停用槽。马二福拆开封绳，把这张封存附页和旧契约分开收好，准备带去钟楼与检修图核对。 # speaker:narrator
落潮夜当天，母亲赶来时没有带管事，只站在门边看了很久。她承认自己也签过这样的纸，却说如果每个人都等到完全愿意才行动，港口的灯早灭了。 # speaker:narrator
马二福没有说母亲从未救过人。她翻出最早的那张照闸约定，问为什么后来不能重新问一次，为什么救过一次人就必须永远不得离开。 # speaker:narrator
争论间，继承火印顺着账册边缘亮起。晚潮将至，旧约已经开始寻找接印人。解除申请有两种写法：先接受完整继承，再请求减免；或者暂缓单人继承，先与港口各方共同提出替代安排。前者快，后者需要在今晚拿出能执行的办法。 # speaker:narrator
+ [请她拒绝单人继承，提出共同方案]
    ~ trust_ma_er_fu += 1
    ~ investigation += 1
    “我愿意帮你把港口的人找来，把能做的写清楚。但最后选哪条路，由你说。” # speaker:li_er_ha
    她问母亲能否只保留今晚的护潮义务，其他继承暂不签署。母亲没有答应，却也没有立刻叫人把你们赶出去。 # speaker:narrator
    马二福在空白纸上写下自己的主张：今晚不让灯灭，此后不能再替下一代签字。那两句话都很难，她没有划掉任何一句。 # speaker:narrator
    -> ma_own_decision
+ [请她先签下继承，再慢慢改变制度]
    “至少先把今晚撑过去，拿到印，也许以后更容易改。” # speaker:li_er_ha
    你说得认真，连自己也觉得这是现实些的办法。马二福看向母亲手腕上年复一年留下的旧印，迟迟没有拿笔。 # speaker:narrator
    “她当年是不是也这样想过？” # speaker:ma_er_fu
    母亲没有回答。火印继续亮着，马二福最终将完整继承书合上，只申请承担今晚的有限护潮义务。她没有因为你选了这个建议，就替你过一生。 # speaker:narrator
    -> ma_own_decision

=== ma_own_decision ===
你们拿着尚未获批的申请离开琴房，在侧廊等候港口代表的回信。马二福听见远处有人搬走旧钢琴上的账册，第一次分不清母亲是在生气，还是也想再弹一次。 # speaker:narrator
{ma_respected == false:
    “那天那支笔，我还没忘。你救人的时候手很快，替人作主的时候也一样快。” # speaker:ma_er_fu
    + [为代签道歉，把决定交还给她]
        ~ ma_respected = true
        ~ trust_ma_er_fu += 2
        “我把着急当成了资格。以后先问你，不再拿替你承担当理由。” # speaker:li_er_ha
        你将所有由你保管的申请摊在长椅上，让她逐份确认。她删掉一处你觉得很好听的保证，你没有重新写回去。 # speaker:narrator
        “这次我看见了。以后也看着。” # speaker:ma_er_fu
        -> ma_cost_record
    + [仍觉得替她决定更稳妥]
        ~ ma_respected = false
        ~ romance = false
        ~ relationship_ready = false
        “那我们只能在具体事情上合作。我不会把恋爱当成再交出一次名字。” # speaker:ma_er_fu
        你收回进一步靠近她的想法。她仍愿意带你去福门，但申请和笔从此由她自己保管。 # speaker:narrator
        -> ma_cost_record
- else:
    她把申请递给你看，问你有没有漏掉港口夜班的人。你发现自己已经能给出建议，而不必先抢过那支笔。 # speaker:narrator
    -> ma_cost_record
}

=== ma_cost_record ===
等待的时候，你提出把系统代价记录在场核对。马二福让你慢慢念，她不愿拿“我信你”省掉必要的询问，也不愿让你独自去猜家族会怎样利用你的血脉。 # speaker:narrator
你告诉她记录里的警告、已经接受的帮助和当前欠债。没有借过债的部分也照实说明，没有为了显得勇敢而编造危险。她将承福与继承分别写在两张纸上，免得任何人用其中一张偷换另一张。 # speaker:narrator
~ knows_system_cost = true
~ records_shared = true
{ma_respected:
    ~ relationship_ready = true
}
港口的回信终于送到。三名夜班工愿意来校内说明设施实际需要多少供能；他们没有承诺替你们解决一切，只答应不让“港口需要”继续成为一个无人能追问的借口。 # speaker:narrator
傍晚，你们把港口代表的回信带回钟楼平台。马二福从口袋里拿出那颗为登记服务拆下的银扣，用指尖推来推去。她说过去每次听钟声，只知道又到了该完成哪件事的时候，今天却真的希望它慢一点。 # speaker:narrator
-> ma_relationship

=== ma_relationship ===
风吹得很冷，你将前几天借来的手套递还。马二福没有马上接，先问你还有没有别的话。 # speaker:narrator
+ {romance && ma_respected && relationship_ready} [和马二福确认关系]
    “有。我想和你一起走下去，也想知道不去契约厅的时候，你愿意去哪。” # speaker:li_er_ha
    “没什么了不起的地方。可以买热栗子的街，有一家店不会问我的姓。” # speaker:ma_er_fu
    她低头看着两只不在同一个人手里的手套。你以为她还在考虑，正想把话说得更轻松，她却先握住了你的手腕。 # speaker:narrator
    “我愿意。但你不能只在我和家里吵架的时候喜欢我。我平常也不好哄。” # speaker:ma_er_fu # emotion:warm
    “我已经有一点经验了。” # speaker:li_er_ha
    她笑着瞪了你一眼，没有松手。你们先约定等今晚过去，一起去买一袋栗子；更远的事可以慢慢说。 # speaker:narrator
    ~ relationship_confirmed = true
    ~ trust_ma_er_fu += 1
    -> ma_departure
+ [把她当作并肩伙伴]
    “我想把伙伴做好，感情的事就停在这里。” # speaker:li_er_ha
    她接回手套，认真看了你一会儿。 # speaker:narrator
    “好。那下次来帮忙搬东西，不准再说自己只负责站得好看。” # speaker:ma_er_fu
    你们没有牵手，仍一起留在平台上等约好集合的伙伴。 # speaker:narrator
    ~ romance = false
    ~ relationship_confirmed = false
    -> ma_departure

=== ma_departure ===
离第九声钟还剩一个时辰，地下先回了一声。马二福手里的守福印热起来，回执上的三日期限正逐字变淡。 # speaker:narrator
顾长明让人送来新的通知：今晚由校方统一接管护潮与学生供能，承福者和守印者都应到地下旧礼堂报到。你们把港口代表的回信和有限义务申请带好，下到钟楼底层，与伙伴们一起商量怎样回应这份通知。 # speaker:narrator
-> chapter_06_eve

=== chapter_05_partner ===
第二天清早，第一辆转运车把回信带回洗衣房。六个人全部到了高处的宿舍，罗金恩用指尖一个名字一个名字地核对，直到最后一个也对上，才终于喝了早已凉掉的汤。昨夜留下的临时名单和回执，已经在墙上排成一列。 # speaker:narrator # music:evacuation
他把调度记录先给你看，和你约定，出发和改变计划都先告诉同行的人。你将自己的行程留在墙上，又接过笔登记今天愿意帮忙的人。名单不是谁更勇敢的排名，只记谁会做什么、什么时候必须休息。 # speaker:narrator
失联的室友终于回来了。他手里那份“修改推荐栏”的申请，其实只把名字列入额外供能者。管理人员给了他一张空白承诺，让他等到落潮夜，自会知道换来了什么。 # speaker:narrator
罗金恩很想骂人，张了两次嘴，最后只让他先把鞋脱下来烤。你看见那双鞋里全是水，忽然明白有些人签字时，根本不是在权衡远大的前途，只想赶紧找到一处不用淋雨的地方。 # speaker:narrator
罗金妮带来了可拆分的护界绳；何敏带来了旧契约和一套只借灯热的实验板。你们今天能完整验证一种方法，另一种仍需另找时间和证据。 # speaker:narrator
+ [调查分担机制]
    ~ partner_focus = "shared"
    -> partner_shared_test
+ [调查撤销机制]
    ~ partner_focus = "revocable"
    -> partner_revoke_test

=== partner_shared_test ===
你们在洗衣房外架起一只装满水的旧槽，底下垫好木块，没人站在槽边。罗金妮解释，试验的护界只抵消水槽滑脱这点风险，仍会短暂消耗施术者的避险运；手冷或动作不稳就停，不能靠意志硬撑。 # speaker:narrator
先由你独自撑界。系统记下同一水位和同一时长下，抵消风险耗去了多少余量；你开始接不稳一枚放在掌心的铜币，罗金妮便让你停下。水槽落回木垫，铜币也被她接住。 # speaker:narrator
第二次，她把绳结分给四名听懂风险、愿意帮忙的人。每个人先确认自己同意消耗的避险运额度，谁都可以提前喊停。罗金恩想逞强报最长，被妹妹看了一眼，老实改成与别人一样。 # speaker:narrator
水槽抬到半途，一名学生感到手冷，喊停后松开绳结。其他人也跟着停，水槽落回木垫，溅湿了所有人的鞋。罗金恩低头看着鞋尖，笑得比实验成功还轻松。 # speaker:narrator
“至少这次退出来，不用先等谁同意。” # speaker:jin_en
你们重新计算人数与每人负担，把木垫再抬高一点。第三次，水槽平稳越过门槛。系统将同等风险的两份读数对照：因果消耗总量不变，这次却由四个知情签名分担，没有超过任何人的额度，也没有向环境预借。刚才退出的学生，在喊停后没有再被消耗余量。 # speaker:narrator
“有能力的人也得轮休。我们先学会把人完整地带回家，再谈跑多远。” # speaker:jin_ni
~ shared_cost = true
~ investigation += 2
~ trust_jin_en += 1
你们将失败的两次也记进册子，连“垫木要够厚”这种不漂亮的细节都留下来。罗金妮收好绳结去诊疗站，你与罗金恩则拿着记录安排晚上的搬运队。 # speaker:narrator
-> partner_after_test

=== partner_revoke_test ===
何敏先让失联的室友读自己的申请，读到“必要时继续履行”时停下。必要到什么时候，谁来决定必要，申请上都没写。 # speaker:narrator
你们不敢直接拿他的好运试。何敏取来两只小灯，将同样的授权结构写到实验板上，只让一盏灯借另一盏灯的余热。借出者喊停，铜线仍在响，因为旧条款把撤回权留给管理员。 # speaker:narrator
罗金恩拔下连接，等灯壳冷下来。你们换一张纸，写清借出者本人随时可以撤回，再请不同的人照着步骤试。第一次在开始前停，第二次在传热时停，第三次只撤回其中一盏灯的授权。 # speaker:narrator
三个结果都记下来：本人撤回便停止本人的那一路，不需要队长批准；其他仍愿意供能的灯保持工作。见证人和副本负责证明谁说过什么，不能替签名的人决定是否继续。 # speaker:narrator
失联的室友摸着申请，说原来不是每个签名都必须像钩子一样拔不出来。罗金恩把实验纸放到他手边，让他带着去申请复核，没有替他把原契约撕掉。 # speaker:narrator
~ revocable_oath = true
~ investigation += 2
~ trust_jin_en += 1
何敏赶去提交证据，你们留下两份副本，一份带队使用，一份交给临时仓库保管。罗金恩还在最下面添了一句：队长不得代签。写完，他先把笔递给你看。 # speaker:narrator
-> partner_after_test

=== partner_after_test ===
接下来的两天，你们拿着实验记录安排轮班，修正了几次谁该接谁的疏漏。有人把第一次写错的名单留在墙上，说是省得后来的同学再犯一次。 # speaker:narrator
落潮夜当天黄昏，洗衣房终于有了些像样的秩序。绷带放在干处，湿鞋放在门边，出去的人报去处，回来的人先吃一口饭。没人正式命名它，大家却开始问“队里还缺不缺人”。 # speaker:narrator
你和罗金恩坐在台阶上，分吃一颗压扁的苹果。他说今天真累，累得只想找张床，却又担心睡醒名单少一行。 # speaker:narrator
“以后如果真有一支队伍，你想当什么？” # speaker:li_er_ha
“能轮到我休息的那种队员。偶尔当队长也行，但总得有人敢喊我回来吃饭。” # speaker:jin_en
你们笑了一阵。他没有再叫你去做英雄，反而认真问你晚上能不能按约定回来；你把自己的去处写到名单最下面，和所有人一样。 # speaker:narrator
顾长明的供能通知到时，名单还没干。它要求所有临时授权统一移交旧礼堂，之前的退出安排暂缓执行。你们刚学会怎样让人安全地进来、出去，就有人准备把门关上。 # speaker:narrator
马二福托人捎来消息：旧宅琴房留着一张封存附页，画出了本地继承链的停用槽。她正带原件去钟楼，想与大家手里的检修材料对照。罗金恩将这条消息念给你听，才从名单旁取下自己的外套。 # speaker:narrator
罗金恩擦掉嘴角的苹果汁，将两份记录分开包好，一份给留下的人，一份由你们带走。你们先去钟楼与其他伙伴汇合，再问清楚，所谓统一安排，是否把这些真实的名字也算了进去。 # speaker:narrator
-> chapter_06_eve
