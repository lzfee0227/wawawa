import type { Character } from './api';

export const sampleCharacters: Character[] = [
  { id: 'narrator', name: '旁白', voiceId: 'voice_narrator' },
  { id: 'lin', name: '林小姐', voiceId: 'voice_lin' }
];

export const sampleSource = `VAR affection = 0
VAR kept_secret = false

-> arrival

=== arrival ===
雨敲打着末班车站。林小姐递给你一封没有署名的信。 # speaker:narrator # music:rain
这封信的事，可以先不要告诉别人吗？ # speaker:lin # emotion:nervous
* [答应保密]
    ~ kept_secret = true
    ~ affection += 1
    谢谢。我就知道可以相信你。 # speaker:lin
    -> shelter
* [拒绝保密]
    我明白，我们还没有那么熟。 # speaker:lin
    -> shelter

=== shelter ===
一周后，你们在旧书店的屋檐下再次相遇。她没有带伞。 # speaker:narrator
* [把伞借给她]
    ~ affection += 1
    林小姐接过伞，朝你笑了一下。 # speaker:narrator
    -> letter
* [提醒她等雨停]
    你们沉默地听了一会儿雨声。 # speaker:narrator
    -> letter

=== letter ===
又过了一个月，那封信的寄件人终于出现了。 # speaker:narrator
我必须回去一趟。你想对我说什么？ # speaker:lin
* {kept_secret} [提起保密的约定]
    你一直记得。那就陪我一起去吧。 # speaker:lin # emotion:relieved
    结局：共同的秘密。你们走进雨中。 # speaker:narrator
    -> END
* [请求她留下]
    {affection >= 2:
        好，我愿意再留一天。 # speaker:lin # emotion:warm
        结局：雨后的约定。 # speaker:narrator
    - else:
        抱歉。有些路，我还是要独自走。 # speaker:lin
        结局：未寄出的信。 # speaker:narrator
    }
    -> END
* [向她告别]
    愿下次再见时，我们都带着好消息。 # speaker:lin
    结局：下一次相遇。 # speaker:narrator
    -> END
`;
