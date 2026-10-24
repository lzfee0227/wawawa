// 第二章：缺页的校史（共同线）
=== chapter_02_start ===
第二天傍晚，旧档案室的门缝里漏出一线蓝光。 # speaker:narrator # music:archive-hum
何敏把校徽放在桌上，先用三枚普通钉子压住边缘。 # speaker:he_min
“先约定：我们只记录能复核的事实。猜测要标成猜测。”
罗金恩把点心袋放在书堆上。 # speaker:jin_en
“我只负责把你们从会塌的书架下面拖出来。”
罗金妮检查门闩和绷带。 # speaker:jin_ni
“如果有人受伤，先救人，再争论谁的理论漂亮。”

校徽缺口在桌面上投出一片暗影。你听见那片暗影里有两次间隔很短的回声。 # speaker:narrator # audio:seal-pulse
+ [先查李家的名字]
    ~ investigation += 1
    ~ knows_bloodline = true
    你翻到一页被撕过的家谱。李家旁边只剩半句：“承福者，替人承受未落之厄。” # speaker:narrator
    何敏把残句抄下，却没有替你解释。 # speaker:he_min
    -> archive_split
+ [先查守福印的持有人]
    ~ investigation += 1
    你沿着校徽的银马纹路找到一册旧契约。第二位守福者的名字被墨水涂掉，只留下“马”字。 # speaker:narrator
    马二福站在门口，听见自己的姓后没有进来。 # speaker:ma_er_fu
    -> archive_split
+ [先查被删掉的灾年记录]
    ~ courage += 1
    ~ investigation += 1
    你找到三十年前的灾年表：每次“丰收奇迹”之后，都有学生失去考试运和健康。 # speaker:narrator
    罗金妮捏紧了绷带。 # speaker:jin_ni
    “好运如果要从别人身上拿，就不是治疗。”
    -> archive_split

=== archive_split ===
旧档案室的地板突然向下沉。校徽滑入一条只容一人通过的缝隙，下面传来钟声的第九个半拍。 # speaker:narrator # audio:stone-shift
何敏按住你的手腕。 # speaker:he_min
“这里有两个入口。一个通向校史塔，一个通向地下旧礼堂。”
+ [带大家去校史塔，先取证]
    ~ investigation += 1
    -> archive_tower
+ [跟着回声去地下旧礼堂]
    ~ courage += 1
    ~ causality_debt += 1
    -> old_hall

=== archive_tower ===
校史塔顶保存着一枚烧焦的登记牌。你用听息辨出：它不是钥匙，而是钥匙的半片。 # speaker:narrator
你把登记牌交给何敏。她在记录里写下“可验证的物证”，并把校徽归还给原持有人。 # speaker:he_min
~ has_fumen_key = true
“我们知道李家负责承福，马家握着另一半权限，但还不知道谁在抽取好运。” # speaker:he_min
-> chapter_03_start

=== old_hall ===
地下旧礼堂没有灯，墙上却挂满学生留下的名字。每个名字后面都有一笔被划掉的好运。 # speaker:narrator # music:underground
系统只说了一句。 # speaker:system
“检测到历史代价。未提供结论。”
你用手指碰到一块空白石砖，听见福门深处传来“共同签署”的半句回应。 # speaker:narrator
~ has_fumen_key = true
~ investigation += 1
罗金恩把你拉回来。 # speaker:jin_en
“知道它会吃人，就更不能让一个人进去当英雄。”
-> chapter_03_start
