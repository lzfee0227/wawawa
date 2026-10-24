// 第七章：福门之夜（路线终局）
=== chapter_07_route ===
{route == "jin_ni": -> chapter_07_jinni}
{route == "he_min": -> chapter_07_hemin}
{route == "ma_er_fu": -> chapter_07_ma}
-> chapter_07_partner

=== chapter_07_jinni ===
福门外环裂开，学生们的坏运像黑雨一样落下。罗金妮指挥轮值护界，你必须选择是否让自己成为唯一承福者。 # speaker:narrator # music:gate-storm
+ [按轮值名单分担]
    ~ shared_cost = true
    ~ investigation += 1
    -> chapter_08_jinni
+ [替所有人承福]
    ~ causality_debt += 2
    “我爱你，也不接受你把自己消耗成证据。”罗金妮说。 # speaker:jin_ni
    -> chapter_08_jinni

=== chapter_07_hemin ===
何敏让所有签署者逐一读出撤销条款。顾长明试图删掉最后一份副本。 # speaker:narrator # music:hearing-final
+ [让见证人共同保留副本]
    ~ revocable_oath = true
    ~ investigation += 1
    -> chapter_08_hemin
+ [接受校董的单一保管]
    ~ causality_debt += 1
    何敏把自己的签名暂时撤回：“任何不可复核的答案，都不能救人。” # speaker:he_min
    -> chapter_08_hemin

=== chapter_07_ma ===
马二福站在两个签署位置之间。她的家族印章要求她成为唯一守福者。 # speaker:narrator # music:inheritance
+ [与她共同重订可撤销契约]
    {romance && relationship_confirmed && ma_apology && knows_bloodline && knows_system_cost && trust_ma_er_fu >= 4 && investigation >= 3 && causality_debt <= 2 && shared_cost && revocable_oath && run_echo_shared_cost && run_echo_revocable_oath:
        ~ true_plan = true
        ~ revocable_oath = true
        “我签自己的名字，也保留撤回的权利。”马二福说。 # speaker:ma_er_fu
    - else:
        ~ true_plan = false
        “还缺一份证据。先把能救人的方案做完。”马二福说。 # speaker:ma_er_fu
    }
    -> chapter_08_ma
+ [只封住福门，接受现有继承规则]
    ~ true_plan = false
    ~ causality_debt += 1
    -> chapter_08_ma

=== chapter_07_partner ===
机动灾害响应队把学生送出外环。顾长明要求你们交出全部证据，换取由他任命的安全职位。 # speaker:narrator
+ [拒绝垄断，公开成立轮值响应队]
    ~ reputation += 1
    ~ investigation += 1
    -> chapter_08_partner
+ [接受任命，成为最年轻的校董]
    ~ causality_debt += 2
    -> power_end

=== power_end ===
顾长明把印章交给你。你拥有了命令所有人的权限，却发现响应队的名单正在一页页变薄。 # speaker:narrator
“最年轻的校董”成为校报标题；罗金恩把自己的名字从你的通讯录里删掉。 # speaker:jin_en
-> END
