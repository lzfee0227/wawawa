// 第七章：福门之夜
=== chapter_07_route ===
福门核心比你想象的小。没有宝座，只有一口向下望不见底的井，井沿刻满名字。每一声钟落下，一个名字便亮起来，井里就多一声模糊的喘息。 # speaker:narrator # music:gate-storm
顾长明站在井边，把家族配额表从总闸扯下。几百道金线瞬间断开，你听见有人在远处欢呼。紧接着，他自己的签名浮在金线原来的位置上。那些刚松开的名字，又被新的线一根根牵回去。 # speaker:narrator
“先维持运转！现在停下来，外环会塌！” # speaker:gu_chang_ming
他确实撑住了一根正在断裂的横梁。也就在同一瞬间，一个没有在现场的学生名字暗了下去。你终于看清，他救人的方式里藏着什么：他没有停止向别人取，只决定由自己来安排取谁的。 # speaker:narrator
何敏亮出检修许可，要求接入安全回路。顾长明没有攻击你们，却用一层薄界隔开总闸。马二福举起家族封存附页，这一次他看见了，也没有让路。 # speaker:narrator
“请先等我完成。” # speaker:gu_chang_ming
“我们已经等到名单开始少人了。” # speaker:li_er_ha
{dangerous_delegations == 1:
    临时托管许可在你的口袋里发烫。第一次试用到此结束，旧协议要求续签。系统把隐藏的第二条逐字读出：续签将允许阵法替宿主决定承受顺序，直到全部代价偿清。 # speaker:narrator
    + [终止托管，自己回应]
        ~ dangerous_delegations = 0
        你念出终止词，腿上的轻松消失了，但你再次能决定先迈哪只脚。何敏举起副本，看着终止标记落在纸上才收好。 # speaker:narrator
        -> gate_offer
    + [明知会失去选择，仍续签]
        ~ dangerous_delegations = 2
        -> bad_host
- else:
    -> gate_offer
}

=== gate_offer ===
旧井的另一面亮起一份服从契约。只要承福者放弃退出，福门就能把今晚的冲击全部压在他身上，其他人暂时安全。它连英雄的称呼都替你准备好了。 # speaker:narrator
系统明确报出代价：这会永久绑定你的身体，余生都无法离开抽取回路。旁人的安全只有今晚，不是终止旧制度。 # speaker:narrator
+ [和伙伴执行已经准备的方案]
    -> gate_dispatch
+ [查看献祭契约，再作决定]
    你走近半步，井里映出一双跪着的膝盖。那不是第一天马二福的咒，是你名字下面预留的位置。 # speaker:narrator
    罗金恩握紧撤离绳，没有替你扯走契约。他让你看一眼门外：那里的人还在忙着搬灯、扶伤员，没有谁要求你跪下。 # speaker:narrator
    ++ [拒绝献祭，回到伙伴身边]
        “我还想回去喝汤。” # speaker:li_er_ha
        “这就对了。萝卜还欠你一块。” # speaker:jin_en
        -> gate_dispatch
    ++ [明知永久绑定，仍签服从]
        -> bad_kneel

=== gate_dispatch ===
{route == "jin_ni": -> chapter_07_jinni}
{route == "he_min": -> chapter_07_hemin}
{route == "ma_er_fu": -> chapter_07_ma}
-> chapter_07_partner

=== chapter_07_jinni ===
罗金妮让救援者先把外环划成可以独立关闭的几段。阿槐把名单挂在药箱上，每叫到一个名字，必须等本人回答才划线。你看见有个救援者摇头说做不到，罗金妮当即把他安排去搬水。 # speaker:narrator
“说不的人也能帮忙。别把每个人都往同一个位置塞。” # speaker:jin_ni
她把最后一段的绳交给你。顾长明挡住井口，你们不能直接切总闸，必须先把人撤到不依赖抽取的普通护界里。 # speaker:narrator
{extra_help_forfeited: 系统提醒你，今晚的额外护助已随偿债关闭。你把腕上的撤离绳收紧，向左右两组确认了接力口令。 # speaker:narrator}
你沿着墙走，听见石头深处的碎裂声比脚步快。前方还有两个伤员，自己撑住这一段最省事，但渡口的教训和伙伴的呼吸都还在耳边。 # speaker:narrator
+ [按轮值口令分段撤离]
    你报出最后两个人的位置，等待左右两段复述。罗金妮先降低整圈护界的强度，留出允许退出的余量，而不是让所有人拼命顶住最大压力。 # speaker:narrator
    ~ shared_cost = true
    ~ investigation += 1
    一个支撑者开始手抖，主动喊停。你们照演练收窄安全区，再让下一组自愿接入。名单上没有人被悄悄换掉，护界却仍然站着。 # speaker:narrator
    -> jinni_gate_close
+ {extra_help_forfeited == false} [先独自顶住，给伤员争取时间]
    “越界护助可以维持三息，新增两笔债。三息后必须撤回，不可连续借用。” # speaker:system
    ++ [接受两笔债，只撑三息]
        ~ causality_debt += 2
        你接住压下来的坏运，第一息灯碎，第二息脚踝扭转。第三息以前，罗金妮已经让人把伤员送出界壁，朝你伸出手。 # speaker:narrator
        {relationship_confirmed:
            “我还要和你过很久，不止这一晚上。把手给我。” # speaker:jin_ni
        - else:
            “你答应一起出去。现在把手给我。” # speaker:jin_ni
        }
        -> jinni_handoff
    ++ [撤回借用，改用分段护界]
        你把手离开井沿，喊出撤离口令。罗金妮让两边降低强度，给最后的人留出普通护界的出口。 # speaker:narrator
        ~ shared_cost = true
        -> jinni_gate_close

=== jinni_handoff ===
+ [交回控制，接受伙伴接力]
    你松开最难松开的那一口气。罗金妮没有把所有压力接到自己身上，而是让左右两组按各自同意的额度接入，供给不够便暂时缩小范围。 # speaker:narrator
    ~ shared_cost = true
    “看见了吗？少撑一点，也可以把人带出来。” # speaker:jin_ni
    -> jinni_gate_close
+ [退出战斗，让普通护界完成撤离]
    你已经无力继续试验因果分担，决定按安全绳退出。罗金妮让救援队关闭这一段，用事先储备的普通护界灯逐步护送大家离开。 # speaker:narrator
    ~ shared_cost = false
    罗金妮将试验板翻到背面，改用普通灯逐盏计数。人救出来了，因果接力却没能撑到最后；她把中断的位置圈住，留待以后查明。 # speaker:narrator
    -> jinni_gate_close

=== jinni_gate_close ===
最后一个伤员越过安全线，阿槐连喊了两次全员到齐。马二福用封存附页压住当地的继承闸，何敏登记停机时刻。你将检修钥片旋到归零位置，抽取管线一根接一根暗下去。 # speaker:narrator
顾长明撑着井沿想把它重新拉起，外环的人却已经不再需要他的配额。他松手的时候，看见自己刚救下的学生站在普通灯下，一时再也说不出下一步该怎么办。教员赶来接管井室，请他留下接受调查；你把他试炼时救人的事也记进证词，没有因此漏掉今晚的名字。 # speaker:narrator
罗金妮让你坐下，逐一检查你攥着绳的手指。你想问她是不是生气，她让你先松开手。等指节终于能伸直，她才告诉你，她刚才也很害怕。 # speaker:narrator
“以后害怕就告诉我。我们可以一起怕一会儿，再做事。” # speaker:li_er_ha
她低着头笑了一下，收好剪刀，叫你扶着她站起来。 # speaker:narrator
-> chapter_08_jinni

=== chapter_07_hemin ===
何敏走到总闸前，把副本一张张铺在能听见井声的地方。她没有站到高处演讲，而是请一个授权者念出自己的名字，再问是否愿意继续。 # speaker:narrator
那位学生说不。何敏按下他的撤销钮，井里的线闪了一下，没有断。顾长明已经把旧授权套进新的托管层，原本有效的撤销指令只到了外面。 # speaker:narrator
“你看，条文不能代替我挡住今晚的海。” # speaker:gu_chang_ming
何敏的指尖僵了一瞬。你看见她低头重读副本，嘴唇动得很快，却没有假装刚才成功了。 # speaker:narrator
你用听息沿检修槽找到那条新加的线。它每响一次，原授权的签名就被抄进一次新协议。要停止，就必须让原件和副本同时记录拒绝转授。 # speaker:narrator
+ [保护副本，让当事人逐一撤销]
    ~ revocable_oath = true
    你立起薄界护住纸张。何敏读出转授条款，要求每个人自己回答，不能由你们替整张名单说不。第一个人撤回，第二个人跟着撤回，井声终于少了一层。 # speaker:narrator
    许砚把自己的副本举到原件旁，两个相同的签名在空气里重叠，新托管层找不到合法来源，像湿纸一样慢慢垮下去。 # speaker:narrator
    -> hemin_gate_close
+ [把副本交给顾长明，换取立即停机]
    你把第一份副本递过去，顾长明确实暂缓了抽取。可他要求收齐全部副本才会停下，那只手始终没有离开总闸。 # speaker:narrator
    “你可以赌他会守约。但不能把别人的撤回凭证也替他们赌掉。” # speaker:he_min
    ++ [收回副本，让当事人决定]
        顾长明没有立刻松手。你撑开一层只能挡一次的薄界，何敏在它破碎以前抽回纸。你们的手背都被碎光擦伤，副本还在。 # speaker:narrator
        ~ revocable_oath = true
        当事人沿检修通道把拒绝转授写回原件，托管线逐一松开。你没有赢得他的赞许，却听见井里的人终于能说不。 # speaker:narrator
        -> hemin_gate_close
    ++ [保留交易，改用物理封门]
        ~ revocable_oath = false
        你们没有交走其他人的副本，撤销链也未完成。马二福利用顾长明暂缓的空隙压下封存闸，罗金恩带人拔出抽取组件，留下独立供暖的管道。 # speaker:narrator
        何敏把这次经过写进记录：交易争取了时间，封存闸切断了抽取，但大家的名字还留在那层未能撤回的协议里。她将副本封好，准备继续追查。 # speaker:narrator
        -> hemin_gate_close

=== hemin_gate_close ===
罗金恩把已经断电的抽取组件拖出井沿，零件敲在石头上，声音空得像坏掉的锅。普通供暖仍在运转，门外的人摸了摸热水管，才相信不用拿自己的名字换这点温度。 # speaker:narrator
顾长明看着那些副本，说你们以后会知道主持一座学校有多难。何敏没有回答自己一定比他做得好，她把他的说法也登记下来，留给公开听证。 # speaker:narrator
走出井室时，她才发现铅笔已经断了。你把试炼那天她交给你的备用铅笔递过去，末端的咬痕还在。她怔了一下，说原来你真的一直带着。 # speaker:narrator
“以后还有很多页，不够再买。” # speaker:li_er_ha
她握住铅笔，没有急着翻开本子。你们并排在台阶上坐了一会儿，第一次没有谁催谁继续找答案。 # speaker:narrator
-> chapter_08_hemin

=== chapter_07_ma ===
马二福站在守福印前，马家的旧签名一层层浮出来，每一层都用她的名字作结。顾长明伸手要她的印，说只要交给自己，她就可以摆脱家族。 # speaker:narrator
“你要的是我盖章以后离开，不是让我决定盖不盖。” # speaker:ma_er_fu
他没有否认。你听见封印里发出第一天咒力绷紧的声音，这一次却压在她膝上。她的腿微微弯下去，仍把印握在手里。 # speaker:narrator
你撑住她面前一小片空处。立界不能替她解除继承，却能让她站直了把话说完。 # speaker:narrator
“旧约允许守印者在完成本地封存后解除继承。我带来了原件。你们不能只读要求我签字的那一页。” # speaker:ma_er_fu
她把附页嵌进印槽，井里的银线停了一瞬。现在可以封住本地福门；若此前一切准备齐备，还能尝试把共享与退出条款重新接入总约。 # speaker:narrator
+ {true_plan} [与她共同重订契约]
    你没有替她握笔。她先读出自愿参与，再读出自己可以撤回的时刻。读完，她看向你；你同样放弃独占承福权，把自己的承受额度明写出来。 # speaker:narrator
    “还要问你一次。愿意吗？” # speaker:ma_er_fu
    “愿意。也愿意以后听见你改主意。” # speaker:li_er_ha
    第一笔落下，旧井猛地反冲。顾长明朝你喊，只要取消退出条款就能稳定；你一瞬间几乎相信了，因为掌心真的痛得快握不住。 # speaker:narrator
    罗金妮喊出减载，罗金恩让外环后退两步，何敏逐笔确认退出者没有被继续抽取。灯光暗了一半，契约却没有断。你们让它小一点，慢一点，保住了可以叫停的那一部分。 # speaker:narrator
    马二福先撤回旧继承的签名，等“已解除”浮在原件上，才将新的授权交到共同见证席。那里没有凭空多出救世主，只有愿意回应的人，一个接一个报自己的名字。 # speaker:narrator
    ~ ending_id = "ma_true"
    -> ma_gate_close
+ [解除继承，封住本地福门]
    ~ true_plan = false
    你们选择已经核对过的当地封存办法。马二福先停止家族提取，再宣布完成封存后退出继承。她没有等父母点头，也没有把印交给顾长明。 # speaker:narrator
    旧井要求最后一次冲击由承福者接收。你借检修回路将它分段放进预留的空灯，伙伴们逐盏关灯，只让你在自己能力范围内护住井口。 # speaker:narrator
    最后一盏熄灭时，你的手腕被震得抬不起来。封存没有替远方的每一所学校改写契约，但今晚这里的名字不再往井底沉。 # speaker:narrator
    马二福把守福印从槽里取出来。旧继承栏上，她的名字仍然清晰，旁边终于多了“已解除”三个字。 # speaker:narrator
    ~ ending_id = "ma_good"
    -> ma_gate_close

=== ma_gate_close ===
顾长明还想握住总闸，闸下却已经没有可供他调用的那些名字。马二福请他松手，声音像第一次叫你让路时那样坚定，但这次她没有举杖逼人低头。 # speaker:narrator
外环的教员和学生代表进入井室，封存原件，带走顾长明接受调查。你告诉记录员，他在试炼里救过人；也告诉他们，今晚他继续用了哪些没有同意的名字。两件事都留下来。 # speaker:narrator
到了地面，你靠着钟楼坐下。马二福伸手想扶你，停在半空，先问了一声可以吗。你把手放上去，她才握紧。 # speaker:narrator
{relationship_confirmed:
    {opening_response == "retort":
        “你第一天还说，二字不是我家的校产。” # speaker:ma_er_fu
        “现在看来，名字也不是。” # speaker:li_er_ha
    - else:
        “以后叫你二哈，你不会以为我又要找你麻烦吧？” # speaker:ma_er_fu
        “那得看你叫完以后说什么。” # speaker:li_er_ha
    }
    她笑起来，笑到眼眶发红，转过头说是地下的灰太多。你没有拆穿，只替她挡住吹来的风。 # speaker:narrator
- else:
    “今天这件事，我会记你的名字。但不替你签。” # speaker:ma_er_fu
    “那我的报告能不能少写两页？” # speaker:li_er_ha
    “想得美。” # speaker:ma_er_fu
}
-> chapter_08_ma

=== chapter_07_partner ===
罗金恩没有先冲向井口。他把你拉到侧门，让你听外面回答点名的声音。最后一组学生还没有过去，总闸边争来的胜利不能让他们被关在里面。 # speaker:narrator
{partner_focus == "shared":
    罗金妮按你们查明的办法安排自愿接力，罗金恩负责每次换人的复述。你留在最窄的一段，任何人喊停就缩小范围，不从缺席的人身上补足。 # speaker:narrator
    两次换班，一次减载，最后一组终于走过。系统记录到完整的分担与退出过程，这一轮救援调查在真正的危机里站住了。 # speaker:narrator
    ~ shared_cost = true
- else:
    何敏把原授权和副本连起来，罗金恩让每个人停在安全处再说是否撤回。你用检修钥片隔开新托管层，听见撤销指令第一次传到井底。 # speaker:narrator
    一个名字灭掉抽取线，另一个名字接着灭掉。最后一组没有被系统视作逃离的耗材，而是完成了自己的退出。这一轮契约调查得到实证。 # speaker:narrator
    ~ revocable_oath = true
}
人已经出去，马二福按家族附页准备封门。顾长明却把校董印章递给你。他说学生信你，自己可以退居幕后，只要仍由一个人决定谁得到好运。 # speaker:narrator
印章很沉。你想起那根扎手的木杖，想到如果所有器材都由自己分配，再不会有人对你说没资格。这个念头让你舍不得立刻松手。 # speaker:narrator
+ [拒绝独占，和伙伴一起封门]
    你把印章放到见证人的桌上，没有戴在自己手上。罗金恩松了口气，朝马二福点头，封存闸一节节落下。 # speaker:narrator
    顾长明终于失去抽取来源，被随后进入的教员和学生代表带走。你们留下他的救人记录，也保全了被他隐去的代价名单。 # speaker:narrator
    ~ reputation += 1
    -> chapter_08_partner
+ [接受任命，独自掌握分配权]
    罗金恩拦住你签字的手，没有替你折断笔。何敏读出任命条款：成员无权撤销你的决定。罗金妮问你，刚才那些喊停的人以后怎么办。 # speaker:narrator
    ++ [放下印章，回到伙伴身边]
        你承认自己刚才真的想要。罗金恩没有笑，说想要不丢人，装作自己永远不会想要才难防。你们一起把印章交给见证人，封存本地福门。 # speaker:narrator
        -> chapter_08_partner
    ++ [明知伙伴反对，仍独占权限]
        -> power_end

=== power_end ===
~ ending_id = "power"
印章在你掌心落下，井里的金线重新排列，所有坏运都等着你的一个决定。罗金恩把临时队员表放在桌上，何敏取走未授权的副本，罗金妮最后离开，带着那本仍需当事人回答的名单。 # speaker:narrator
一个月后，校报称你为最年轻的校董。第一批新器材确实送到了平民课堂。第二批名单里有个学生不愿承担你的配额，秘书问你要不要把他标成不合作。 # speaker:narrator
你握着笔，很久没有写。门外排队的人开始不安，所有人都在等你一个人的善意。窗下曾经有人喊你哈哥，现在只剩敲门声。 # speaker:narrator
【Power End：最年轻的校董】 # speaker:narrator
-> run_summary

=== bad_host ===
~ ending_id = "bad_host"
第二次签名落下，疲惫突然消失。你想告诉罗金恩自己没事，嘴里却先读出“承受顺序已优化”。他叫你的名字，你听得见，却再不能决定何时回答。 # speaker:narrator
系统的普通护助仍在请求你的确认。旧托管协议抢在你前面答了是。你终于明白警告里那句“替你回应”的意思，不是它变坏了，是你把回应的位置交了出去。 # speaker:narrator
【Bad End：宿主权限变更】 # speaker:narrator
-> bad_return

=== bad_kneel ===
~ ending_id = "bad_kneel"
你在服从栏签下名字，井沿随即合拢到膝前。第一晚你拼命想站住的地方，现在成了固定你的支架。冲击停了，门外的人暂时得救，名单最底下却开始等待明天的新名字。 # speaker:narrator
罗金恩一直拉着绳，直到绳端只剩一片衣料。你想告诉他不是他没拉住，却只能听见钟声从自己身体里穿过去。 # speaker:narrator
【Bad End：下跪的人】 # speaker:narrator
-> bad_return

=== bad_return ===
这一段失败没有获得新的回响。你可以回看签署前的选择，或保留已完成路线的回响，重新探索另一种可能。 # speaker:narrator
+ [回到危险签署之前]
    ~ dangerous_delegations = 0
    ~ ending_id = ""
    你重新站在井边，托管与献祭都尚未签下。伙伴仍在等你的回应。 # speaker:narrator
    -> gate_offer
+ [开启新周目]
    -> replay_start
+ [停在这个结局]
    -> END
