// 第六章：福门之夜前夕
=== chapter_06_eve ===
钟楼下的旧礼堂开始倒数。顾长明把四枚权限印章摆在桌上。 # speaker:narrator # music:countdown
“只要有人愿意承担全部代价，学校就能恢复秩序。”他说。 # speaker:gu_chang_ming
你们已经知道，所谓秩序会把坏结果推给没有签名的人。 # speaker:narrator
{route == "jin_ni": 罗金妮把轮值名单铺开；每一段护界都有两名见证人。 # speaker:jin_ni}
{route == "he_min": 何敏把撤销条款投到墙上；每一次签名都留下回查入口。 # speaker:he_min}
{route == "ma_er_fu": 马二福把家族印章放在桌边，却没有碰笔。 # speaker:ma_er_fu}
{route == "partner": 罗金恩把学生响应队排成四列，公开点名，公开休息。 # speaker:jin_en}

+ [把自己的承福血脉告诉同伴]
    ~ knows_bloodline = true
    ~ investigation += 1
    ~ trust_jin_en += 1
    你说出李家曾封存福门，也说出系统每次护助都会增加债务。 # speaker:li_er_ha
    -> eve_plan
+ [暂时保留血脉，只公开已经验证的证据]
    ~ investigation += 1
    何敏要求你在终局前给出完整记录；没人替你把秘密说成真相。 # speaker:he_min
    -> eve_plan

=== eve_plan ===
{causality_debt > 2:
    系统提示：债务超过安全线。偿还方式是把下一次护界交给多人共同确认。 # speaker:system
    + [接受共同偿还]
        ~ causality_debt -= 1
        ~ shared_cost = true
        -> gate_choice
    + [继续把债务压在自己身上]
        ~ causality_debt += 1
        -> gate_choice
- else:
    -> gate_choice
}

=== gate_choice ===
你们来到福门外环。门上有两个签署位置，第三个位置被故意磨平。 # speaker:narrator # audio:gate-resonance
+ [重建共同分担方案]
    ~ shared_cost = true
    ~ investigation += 1
    -> chapter_07_route
+ [重建可撤销权限方案]
    ~ revocable_oath = true
    ~ investigation += 1
    -> chapter_07_route
