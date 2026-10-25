# SDD-005：模拟器语音与音频

状态：实施中；2026-10-25。保留 Ink 的确定性剧情，在本地工作台验证听台词、口述选择、确认提交的闭环。不扩展 MCP 或设备协议。

## 验收与测试

| ID | 行为 | 验收用例 |
|---|---|---|
| A01 | ASR、TTS 独立选择浏览器或已配置云服务；配置仅在服务端 | 无配置禁用云选项；状态接口不泄露密钥或地址；浏览器能力检测 |
| A02 | 手动朗读当前回合台词及选项；可停止 | 顺序播放；角色 voiceId 对应浏览器 voiceURI/name 或云 voice；空值使用默认；浏览器未知声音明确回退提示；云失败不暗中换提供商 |
| A03 | 浏览器识别或云录音识别只填入待确认文字 | 不自动提交；回合变更后迟到结果丢弃；最终选项仍由既有服务验证 |
| A04 | 可播放用户选择的本地音频及输入的 HTTP(S) 音频地址 | 原生播放器提供播放、暂停、进度；音频失败可见；替换/退出释放资源；不上传本地试听文件 |
| A05 | 录音、朗读、试听互斥；切换回合、离开模拟器、开始剧情操作时停止 | 取消请求、停止麦克风 tracks、释放 object URL；取消后不得播放旧响应 |
| A06 | 云适配限定 OpenAI 兼容格式，ASR/TTS 分别配置 | 服务端 POST /audio/transcriptions multipart file/model，POST /audio/speech JSON model/input/voice/response_format=mp3；模拟 HTTP 合约测试 |
| A07 | 云边界限制与错误恢复 | 文本最多 4000 字符；录音最多 60 秒、5 MB；上游 30 秒超时；音频响应最大 10 MB；安全错误、不回显密钥/上游正文；无重定向凭据泄漏 |
| A08 | UI 可访问且不误称能力 | 桌面/390px 检查；浏览器麦克风要求 localhost/HTTPS，权限/不支持提示；云调用可能计费且文本/录音会发送给配置服务 |

## 接口契约

- `GET /api/audio/capabilities` → `{ asr: { configured: boolean }, tts: { configured: boolean } }`。
- `POST /api/audio/speech` JSON `{ text: string, voice?: string }` → `audio/mpeg` 二进制；不改变故事存档。
- `POST /api/audio/transcriptions` 原始音频 body，Content-Type 为 `audio/webm`、`audio/mp4`、`audio/ogg` 或 `audio/wav`（可带 codecs 参数）→ `{ text: string }`；输出文本最多 300 字符，否则报错不截断成另一选项。
- 错误沿用 `{ error: { code, message } }`。无配置 503、输入错误 400/413/415、上游失败 502/超时 504。
- 服务端环境变量：`AUDIO_ASR_BASE_URL`、`AUDIO_ASR_API_KEY`、`AUDIO_ASR_MODEL`；`AUDIO_TTS_BASE_URL`、`AUDIO_TTS_API_KEY`、`AUDIO_TTS_MODEL`、`AUDIO_TTS_VOICE`。base URL 指向含版本的根（如 https://api.openai.com/v1），追加 `/audio/...`；全部必填才启用对应能力。仅允许 HTTPS，localhost HTTP 可用于本地兼容服务。

## 范围与证据

界面为创作者提供试听工具，不要求自动播放。音频 URL 由浏览器直接访问，不提供服务端 URL 抓取代理。Ink 的 audio/music 标签继续为资源标识，不自动解释成 URL，不实现背景音乐混音。浏览器语音可能使用浏览器厂商在线服务，不承诺离线或各设备音色一致。云接口通过模拟上游验证不等于厂商实测；有密钥后另做真实中文识别、音质和延迟验收。语音不是生成剧情，模型不能修改 Ink 状态。
