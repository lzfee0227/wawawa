export const playtestEntry = { id: 'second', chapter: '第二章', label: '守信前情', description: '已保守秘密，好感度为 2。' };
export const playtestSource = `// @playtest ${JSON.stringify({ ...playtestEntry, path: 'preview_second' })}
VAR trust = 0
VAR secret = false
开场
+ [保守秘密]
    ~ secret = true
    ~ trust += 2
    -> second
=== preview_second ===
~ secret = true
~ trust = 2
-> second
=== second ===
第二章
+ {secret} [提起秘密]
    ~ trust += 1
    -> finish
+ [告别]
    -> finish
=== finish ===
信任：{trust}
-> END
`;
