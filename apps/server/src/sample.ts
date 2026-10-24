export const sampleSource = `VAR kept_secret = false
VAR lin_affection = 0

-> arrival
=== arrival ===
雨敲着窗。林把一封信递给你。 # speaker:narrator # music:rain
别告诉别人，好吗？ # speaker:lin # emotion:nervous
* [替她保守秘密]
    ~ kept_secret = true
    ~ lin_affection += 1
    -> waiting
* [拒绝承诺]
    -> waiting

=== waiting ===
三天后，你们在车站重逢。 # speaker:narrator
* [递给她一杯热茶]
    ~ lin_affection += 1
    -> door
* [沉默等待]
    -> door

=== door ===
最后一班列车即将出发。 # speaker:narrator
* {kept_secret} [提起那晚的约定]
    你还记得。我愿意和你同行。 # speaker:lin
    -> END
* [请求她留下]
    {lin_affection >= 2:
        好，我留下。 # speaker:lin # emotion:warm
    - else:
        对不起，我们还不够了解彼此。 # speaker:lin
    }
    -> END
* [道别]
    她走进雨里，信留在你的口袋。 # speaker:narrator
    -> END
`;
export const sampleCharacters = [{ id: 'narrator', name: '旁白', voiceId: 'narrator-demo' }, { id: 'lin', name: '林', voiceId: 'lin-demo' }];
