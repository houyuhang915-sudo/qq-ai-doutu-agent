import express from 'express'
import {
  Resources as MemeResources,
  getMeme as getGeneratedMeme,
} from '@memecrafters/meme-generator'

const app = express()
const host = '127.0.0.1'
const port = Number(process.env.PORT || 8787)
const model = process.env.ARK_ENDPOINT_ID || process.env.ARK_MODEL || 'doubao-seed-2-0-pro-260215'
const arkBaseUrl = process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3'
const hasArk = Boolean(process.env.ARK_API_KEY)
const usingEndpoint = Boolean(process.env.ARK_ENDPOINT_ID)
const supportsImageInput = process.env.ARK_SUPPORTS_IMAGE
  ? process.env.ARK_SUPPORTS_IMAGE === 'true'
  : /vision|seed|vlm|image|video/i.test(model)
let arkProbe = {
  checked: false,
  ok: false,
  message: hasArk
    ? '正在检查 Ark 可用性。'
    : '后端正在 fallback 模式下运行，没有 key 也能完成演示。',
}

app.use(express.json({ limit: '20mb' }))

function pick(list, id, fallback) {
  return list.find((item) => item.id === id) ?? fallback
}

const scenes = [
  {
    id: 'campus-cat',
    title: '校园偶遇小猫',
    cue: '柔软、轻松、让人想继续聊',
    mood: '疗愈向',
    productFit: '适合做陪伴式回复和贴纸化内容生成',
    replySeed: '你这张图一发出来，今天的疲惫感像被小猫替你收走了一半。',
    followUpSeed: '它最后有没有回头看你？这种小瞬间真的很适合被收藏成一天的结束语。',
    stickerSeed: '今日回血 / 猫猫批准你下班 / 情绪已被接住',
  },
  {
    id: 'concert-night',
    title: '演唱会返图',
    cue: '热烈、闪光、适合把情绪值再推高一点',
    mood: '高能向',
    productFit: '适合生成情绪延展文案和二次互动话题',
    replySeed: '这不是返图，是你今天情绪值满格的证据，我隔着屏幕都能听见现场的尖叫感。',
    followUpSeed: '如果只让你留一句今晚的标题，你会写“值回票价”还是“舍不得散场”？',
    stickerSeed: '今晚封神 / 情绪超频 / 返图请继续',
  },
  {
    id: 'deadline-night',
    title: '深夜赶 ddl',
    cue: '克制、辛苦、需要被理解但不想被说教',
    mood: '共情向',
    productFit: '适合做不油腻的安慰、鼓劲和接续话题',
    replySeed: '这张图有一种“明明很累但还在往前扛”的力量感，我第一眼就懂你现在的节奏。',
    followUpSeed: '你现在最想听到的是“快结束了”还是“我陪你把这段熬过去”？',
    stickerSeed: '今晚稳住 / ddl 不会赢 / 再撑一下就亮天',
  },
  {
    id: 'sunset-trip',
    title: '落日旅行随拍',
    cue: '松弛、漂亮、有一点点想把关系往前推',
    mood: '氛围向',
    productFit: '适合生成氛围感文案和带有记忆点的回复卡',
    replySeed: '这张图不像普通打卡，更像把“今天值得被记住”这件事认真存档了一次。',
    followUpSeed: '如果把这一刻做成一句只发给懂的人看的备注，你会怎么写？',
    stickerSeed: '落日已签收 / 氛围感到位 / 请继续发美照',
  },
]

const modes = [
  {
    id: 'companion',
    label: '陪伴式回法',
    angle: '更适合长期关系和高频聊天场景',
  },
  {
    id: 'playful',
    label: '玩梗式回法',
    angle: '更适合群聊、熟人社交和高传播内容',
  },
  {
    id: 'spark',
    label: '心动式回法',
    angle: '更适合暧昧、兴趣搭子和高情绪时刻',
  },
  {
    id: 'deep',
    label: '深聊式回法',
    angle: '更适合评论区深聊和内容理解型回复',
  },
]

const contexts = [
  { id: 'qq-chat', label: 'QQ 私聊', value: '适合做“秒回但不敷衍”的一对一互动' },
  { id: 'group-icebreak', label: '群聊接话', value: '适合帮用户在多人场景里迅速接住图片话题' },
  { id: 'comment-feed', label: '评论区互动', value: '适合发图后生成更有辨识度的回评内容' },
  { id: 'video-reply', label: '视频截图回聊', value: '适合从截图里提炼亮点并延展成回复卡' },
]

const relationships = [
  { id: 'bestie', label: '死党熟人', value: '语气可以更放松、更像默契接话' },
  { id: 'crush', label: '暧昧对象', value: '要有专属感，但不能油和冒犯' },
  { id: 'fandom', label: '兴趣搭子', value: '要体现“我懂你这张图的点在哪”' },
  { id: 'new-friend', label: '新认识的人', value: '要友好、有分寸，并给对方继续聊的空间' },
]

const memeGeneratorTemplates = [
  {
    key: 'cover_face',
    label: '捂脸',
    strategy: 'image_based',
    fitInputs: ['chat_screenshot', 'meme', 'photo', 'mixed', 'unknown'],
    fitStyles: ['cute', 'sarcastic'],
    description: '无字反应图，适合把对方内容做成“没眼看”的回敬表情包，文案单独发送。',
  },
  {
    key: 'capoo_point',
    label: '咖波指认',
    strategy: 'image_based',
    fitInputs: ['chat_screenshot', 'meme', 'photo', 'mixed', 'unknown'],
    fitStyles: ['sarcastic', 'brainhole'],
    description: '无字指认图，适合点名对方这波操作，图片和回复句子分开发。',
  },
  {
    key: 'you_dont_get',
    label: '你不懂啦',
    strategy: 'image_based',
    fitInputs: ['chat_screenshot', 'meme', 'photo', 'mixed', 'unknown'],
    fitStyles: ['cute', 'brainhole'],
    description: '无字卖萌反击图，适合轻松但欠欠地回去，文字放在回复栏而不是图上。',
  },
  {
    key: 'need',
    label: '你可能需要',
    strategy: 'image_based',
    fitInputs: ['chat_screenshot', 'meme', 'photo', 'mixed', 'unknown'],
    fitStyles: ['sarcastic', 'aggressive'],
    description: '无字建议型表情包，适合冷脸反击，最终回复文案和表情包分离。',
  },
  {
    key: 'clown',
    label: '小丑认证',
    strategy: 'image_based',
    fitInputs: ['chat_screenshot', 'meme', 'photo', 'mixed', 'unknown'],
    fitStyles: ['sarcastic', 'brainhole'],
    description: '无字嘲讽图，适合对方自信过头、硬装很懂的时候反手认证。',
  },
  {
    key: 'clown_mask',
    label: '小丑面具',
    strategy: 'image_based',
    fitInputs: ['chat_screenshot', 'meme', 'photo', 'mixed', 'unknown'],
    fitStyles: ['sarcastic', 'aggressive'],
    description: '无字反讽图，适合拆穿对方的装腔作势，语气比普通调侃更狠一点。',
  },
  {
    key: 'dog_dislike',
    label: '嫌弃狗狗',
    strategy: 'image_based',
    fitInputs: ['chat_screenshot', 'meme', 'photo', 'mixed', 'unknown'],
    fitStyles: ['cute', 'sarcastic'],
    description: '无字嫌弃反应图，适合那种“我看到了但不想认同”的回击。',
  },
  {
    key: 'jerry_stare',
    label: '杰瑞盯你',
    strategy: 'image_based',
    fitInputs: ['chat_screenshot', 'meme', 'photo', 'mixed', 'unknown'],
    fitStyles: ['sarcastic', 'brainhole'],
    description: '无字凝视图，适合对方说了句离谱话之后，用眼神压回去。',
  },
  {
    key: 'stare_at_you',
    label: '盯住现场',
    strategy: 'image_based',
    fitInputs: ['chat_screenshot', 'meme', 'photo', 'mixed', 'unknown'],
    fitStyles: ['sarcastic', 'aggressive'],
    description: '无字直视图，适合把对方的话放大成“大家都看见了”的公开处刑感。',
  },
  {
    key: 'karyl_point',
    label: '黑猫指认',
    strategy: 'image_based',
    fitInputs: ['chat_screenshot', 'meme', 'photo', 'mixed', 'unknown'],
    fitStyles: ['sarcastic', 'brainhole'],
    description: '无字点名图，适合在群聊或私聊里明确表达“说的就是你这个”。',
  },
  {
    key: 'taunt',
    label: '挑衅反挑衅',
    strategy: 'image_based',
    fitInputs: ['chat_screenshot', 'meme', 'photo', 'mixed', 'unknown'],
    fitStyles: ['aggressive', 'brainhole'],
    description: '无字挑衅动作图，适合把对方气势接住再反手顶回去。',
  },
  {
    key: 'tease',
    label: '逗你一下',
    strategy: 'image_based',
    fitInputs: ['chat_screenshot', 'meme', 'photo', 'mixed', 'unknown'],
    fitStyles: ['cute', 'brainhole'],
    description: '无字轻挑图，适合不想太凶时用欠欠的方式把场子拿回来。',
  },
  {
    key: 'why_at_me',
    label: '看我干嘛',
    strategy: 'image_based',
    fitInputs: ['chat_screenshot', 'meme', 'photo', 'mixed', 'unknown'],
    fitStyles: ['cute', 'sarcastic'],
    description: '无字装无辜图，适合对方先发难时用委屈巴巴的方式反弹。',
  },
  {
    key: 'garbage',
    label: '垃圾桶归位',
    strategy: 'image_based',
    fitInputs: ['chat_screenshot', 'meme', 'photo', 'mixed', 'unknown'],
    fitStyles: ['aggressive', 'sarcastic'],
    description: '无字处刑图，适合明显挑衅、低质炫耀或无效发言场景。',
  },
  {
    key: 'forbid',
    label: '禁止通行',
    strategy: 'image_based',
    fitInputs: ['chat_screenshot', 'meme', 'photo', 'mixed', 'unknown'],
    fitStyles: ['aggressive', 'sarcastic'],
    description: '无字制止图，适合一句话都懒得回太多时，用态度把局面封住。',
  },
  {
    key: 'dont_touch',
    label: '别碰瓷',
    strategy: 'image_based',
    fitInputs: ['chat_screenshot', 'meme', 'photo', 'mixed', 'unknown'],
    fitStyles: ['aggressive', 'brainhole'],
    description: '无字防御反击图，适合把对方的挑衅拦在外面，再单独补一句回怼。',
  },
  {
    key: 'google_captcha',
    label: '人机验证',
    strategy: 'image_based',
    fitInputs: ['chat_screenshot', 'meme', 'photo', 'mixed', 'unknown'],
    fitStyles: ['brainhole', 'sarcastic'],
    description: '无字脑洞图，适合把对方离谱发言处理成“先过一下智商验证”。',
  },
  {
    key: 'flash_blind',
    label: '闪瞎现场',
    strategy: 'image_based',
    fitInputs: ['chat_screenshot', 'meme', 'photo', 'mixed', 'unknown'],
    fitStyles: ['aggressive', 'sarcastic'],
    description: '无字强反应图，适合对方过于高调、太想炫的时候反手压回去。',
  },
  {
    key: 'hit_screen',
    label: '隔屏敲打',
    strategy: 'image_based',
    fitInputs: ['chat_screenshot', 'meme', 'photo', 'mixed', 'unknown'],
    fitStyles: ['aggressive', 'brainhole'],
    description: '无字输出图，适合挑衅指数高、需要明显攻击动作感的时候使用。',
  },
  {
    key: 'funny_mirror',
    label: '哈哈镜',
    strategy: 'image_based',
    fitInputs: ['chat_screenshot', 'meme', 'photo', 'mixed', 'unknown'],
    fitStyles: ['brainhole', 'cute'],
    description: '无字变形图，适合把对方内容做成离谱版二创，走脑洞反杀路线。',
  },
  {
    key: 'confuse',
    label: '迷惑现场',
    strategy: 'image_based',
    fitInputs: ['chat_screenshot', 'meme', 'photo', 'mixed', 'unknown'],
    fitStyles: ['cute', 'sarcastic'],
    description: '无字问号图，适合对方话说得怪但又不值得大动干戈时用迷惑回去。',
  },
  {
    key: 'support',
    label: '表面支持',
    strategy: 'image_based',
    fitInputs: ['chat_screenshot', 'meme', 'photo', 'mixed', 'unknown'],
    fitStyles: ['sarcastic', 'cute'],
    description: '无字捧场图，适合阴阳怪气式“表面支持、实则拆台”的玩法。',
  },
  {
    key: 'no_response',
    label: '无语暂停',
    strategy: 'image_based',
    fitInputs: ['chat_screenshot', 'meme', 'photo', 'mixed', 'unknown'],
    fitStyles: ['sarcastic', 'aggressive'],
    description: '无字冷处理图，适合把对方的话降成“我都不想认真接”的等级。',
  },
  {
    key: 'out',
    label: '请出局',
    strategy: 'image_based',
    fitInputs: ['chat_screenshot', 'meme', 'photo', 'mixed', 'unknown'],
    fitStyles: ['aggressive', 'brainhole'],
    description: '无字驱逐图，适合群聊、互怼或高挑衅场景下的直接清场感。',
  },
  {
    key: 'policeman',
    label: '警察叔叔',
    strategy: 'image_based',
    fitInputs: ['chat_screenshot', 'meme', 'photo', 'mixed', 'unknown'],
    fitStyles: ['brainhole', 'sarcastic'],
    description: '无字处置图，适合把对方离谱操作升级成“建议当场报备”的梗。',
  },
]

let memeGeneratorReadyPromise

const memeTemplates = [
  {
    id: 'side-eye-card',
    label: '侧眼反问',
    description: '适合对方装懂、炫耀、阴阳时，用轻蔑反问把气势抢回来。',
    renderStyle: 'poster',
    emoji: '🙄',
    fitStyles: ['sarcastic', 'cute'],
    fitInputs: ['chat_screenshot', 'meme', 'mixed'],
    palette: ['#8ca2ff', '#5f74ff', '#202b6b'],
  },
  {
    id: 'hard-clapback',
    label: '正面硬刚',
    description: '适合挑衅值很高的图，输出要短促、压迫感强。',
    renderStyle: 'split',
    emoji: '😈',
    fitStyles: ['aggressive'],
    fitInputs: ['meme', 'photo', 'mixed'],
    palette: ['#ff9b73', '#ff5b66', '#5e1738'],
  },
  {
    id: 'pity-bounce',
    label: '委屈回刺',
    description: '适合不想太凶时，用可怜语气把对方刺回去。',
    renderStyle: 'chat',
    emoji: '🥺',
    fitStyles: ['cute'],
    fitInputs: ['chat_screenshot', 'meme'],
    palette: ['#8fd8ff', '#7d9bff', '#3847af'],
  },
  {
    id: 'brainrot-bomb',
    label: '脑洞降维',
    description: '适合离谱图和梗图，用不按套路的脑洞完成反杀。',
    renderStyle: 'sticker',
    emoji: '👽',
    fitStyles: ['brainhole'],
    fitInputs: ['meme', 'photo', 'mixed'],
    palette: ['#b28eff', '#ff76c2', '#ff9650'],
  },
  {
    id: 'group-judge',
    label: '群聊审判席',
    description: '适合聊天截图或群聊炫耀图，把回复做成围观式公开处刑。',
    renderStyle: 'chat',
    emoji: '👀',
    fitStyles: ['sarcastic', 'brainhole'],
    fitInputs: ['chat_screenshot', 'mixed'],
    palette: ['#89a2ff', '#6378ff', '#1f235e'],
  },
  {
    id: 'deal-with-it',
    label: '冷脸收尾',
    description: '适合不想陪聊太久时，一张图把场子收住。',
    renderStyle: 'poster',
    emoji: '😎',
    fitStyles: ['sarcastic', 'aggressive'],
    fitInputs: ['meme', 'photo', 'mixed'],
    palette: ['#9bc4ff', '#5b7cff', '#12305b'],
  },
]

function getMemeTemplate(templateId) {
  return memeTemplates.find((item) => item.id === templateId) ?? memeTemplates[0]
}

function getMemeGeneratorTemplate(key) {
  return memeGeneratorTemplates.find((item) => item.key === key) ?? memeGeneratorTemplates[0]
}

function seedIndex(seed, length) {
  if (!length) {
    return 0
  }

  const source = String(seed || 'default')
  let total = 0
  for (const char of source) {
    total = (total * 33 + char.charCodeAt(0)) >>> 0
  }
  return total % length
}

function pickFallbackMemeGeneratorTemplate(inputType, battleStyleId) {
  const strictMatches = memeGeneratorTemplates.filter(
    (item) =>
      item.fitInputs.includes(inputType || 'unknown') &&
      item.fitStyles.includes(battleStyleId || 'sarcastic'),
  )
  if (strictMatches.length) {
    return strictMatches[seedIndex(`${inputType}:${battleStyleId}`, strictMatches.length)]
  }

  const inputMatches = memeGeneratorTemplates.filter((item) =>
    item.fitInputs.includes(inputType || 'unknown'),
  )
  if (inputMatches.length) {
    return inputMatches[seedIndex(inputType, inputMatches.length)]
  }

  return memeGeneratorTemplates[seedIndex(battleStyleId, memeGeneratorTemplates.length)]
}

async function ensureMemeGeneratorReady() {
  if (!memeGeneratorReadyPromise) {
    memeGeneratorReadyPromise = Promise.resolve().then(() => {
      MemeResources.checkResources()
    })
  }

  return memeGeneratorReadyPromise
}

function inferInputType(payload) {
  const source = [payload.imageName, payload.threadContext, payload.focus].filter(Boolean).join(' ')

  if (/聊天|对话|截图|微信|qq|message|screen|chat/i.test(source)) {
    return 'chat_screenshot'
  }
  if (payload.imageDataUrl) {
    return 'meme'
  }
  return 'unknown'
}

function pickTemplateForFallback(payload, inputType, battleStyleId) {
  return (
    memeTemplates.find(
      (item) =>
        item.fitStyles.includes(battleStyleId || 'sarcastic') &&
        item.fitInputs.includes(inputType || 'mixed'),
    ) ??
    memeTemplates.find((item) => item.fitStyles.includes(battleStyleId || 'sarcastic')) ??
    memeTemplates[0]
  )
}

function buildFallbackExperience(payload) {
  const scene = pick(scenes, payload.sceneId, scenes[1])
  const mode = pick(modes, payload.modeId, modes[2])
  const context = pick(contexts, payload.contextId, contexts[0])
  const relationship = pick(relationships, payload.relationshipId, relationships[1])

  const focusLine = payload.focus?.trim()
    ? `本轮优先遵循你的偏好：“${payload.focus.trim()}”。`
    : '本轮优先追求像真人、够专属、还能继续聊。'
  const uploadLine = payload.imageName
    ? `系统已接到你上传的图片「${payload.imageName}」，会先按真实图片意图组织回复。`
    : `当前使用的是「${scene.title}」演示场景。`
  const threadLine = payload.threadContext?.trim()
    ? `当前聊天上下文是：“${payload.threadContext.trim()}”。`
    : '当前默认把它当作用户发图后的第一轮回复。'
  const outcomeLine = payload.desiredOutcome?.trim()
    ? `本轮推进目标是：“${payload.desiredOutcome.trim()}”。`
    : '本轮默认目标是接住情绪并留下下一轮聊天空间。'

  const modeOpeners = {
    companion: '先稳稳接住情绪，再补一句让人觉得被认真看见的话。',
    playful: '先把画面里的亮点变成一个轻巧包袱，再顺势把气氛推起来。',
    spark: '先给对方“这是只对你说”的感觉，再留一点心跳空间。',
    deep: '先把图里的细节读准，再把回复延展成更有内容的交流。',
  }

  return {
    summary: `${uploadLine}${threadLine}${outcomeLine}${focusLine} 推荐采用「${mode.label}」，因为这张图的核心气质是“${scene.cue}”，最适合在 ${context.label} 里做有记忆点的专属回复。`,
    signal: `${scene.productFit}；${mode.angle}。`,
    visualSignal: payload.imageName
      ? `这张图最值得被接住的是“${scene.cue}”这层氛围，系统会优先从画面主体、光线和情绪浓度里提炼聊天切口。`
      : `当前以「${scene.title}」示例画面做视觉理解，重点抓“${scene.cue}”和最容易被忽略的细节亮点。`,
    nextStep: payload.desiredOutcome?.trim()
      ? `先用一句自然回复把情绪接住，再通过追问把对话推进到“${payload.desiredOutcome.trim()}”。`
      : '先把图里的情绪接稳，再留一个不冒犯、但能继续聊下去的追问口子。',
    analysisTags: [scene.mood, scene.title, context.label, relationship.label, mode.label],
    replyCards: [
      {
        badge: '首条回复',
        title: '先把情绪接住',
        body: `${modeOpeners[payload.modeId] ?? modeOpeners.spark} ${scene.replySeed}`,
      },
      {
        badge: '延展内容',
        title: '把“只发给你”的专属感做出来',
        body: payload.threadContext?.trim()
          ? `结合对方刚刚那句“${payload.threadContext.trim()}”，建议顺着画面细节接一句：${scene.followUpSeed}`
          : `${scene.followUpSeed} 这一步会直接把图片回复从“会聊天”升级成“会持续互动”。`,
      },
      {
        badge: '产品化输出',
        title: '自动匹配回复表情包和下一轮互动建议',
        body: payload.desiredOutcome?.trim()
          ? `系统会同步给出推荐回复表情包和可一键发送的短句「${scene.stickerSeed}」，并把下一轮互动往“${payload.desiredOutcome.trim()}”这个目标上推进。`
          : `系统会同步给出推荐回复表情包和可一键发送的短句「${scene.stickerSeed}」，并匹配下一轮追问，让回复不只是一句话，而是一整套互动动作。`,
      },
    ],
    quickReplies: [
      scene.replySeed,
      payload.threadContext?.trim()
        ? `你刚刚那句“${payload.threadContext.trim()}”我很有感觉，这张图也太会补情绪了。`
        : `这张图的好看不止在画面，还在它把“${scene.cue}”传得特别准。`,
      payload.desiredOutcome?.trim()
        ? `如果这轮想把气氛带到“${payload.desiredOutcome.trim()}”，我会选更自然一点的接法。`
        : `我想把这张直接存进“${relationship.label}限定返图”文件夹里。`,
    ],
    launchPlan: [
      `落地入口：${context.label}。${context.value}`,
      `关系调性：${relationship.label}。${relationship.value}`,
      payload.desiredOutcome?.trim()
        ? `推进目标：${payload.desiredOutcome.trim()}。生成结果会围绕这个目标做连续互动编排。`
        : 'AI 输出形态：推荐回复表情包 + 文案回复卡 + 下一轮追问建议，形成连续互动。',
    ],
  }
}

function normalizeExperience(candidate, fallback) {
  const safe = candidate && typeof candidate === 'object' ? candidate : {}

  const replyCards = Array.isArray(safe.replyCards)
    ? safe.replyCards
        .map((item) => ({
          badge: typeof item?.badge === 'string' ? item.badge : '',
          title: typeof item?.title === 'string' ? item.title : '',
          body: typeof item?.body === 'string' ? item.body : '',
        }))
        .filter((item) => item.title && item.body)
        .slice(0, 3)
    : []

  const quickReplies = Array.isArray(safe.quickReplies)
    ? safe.quickReplies.filter((item) => typeof item === 'string' && item.trim()).slice(0, 3)
    : []

  const launchPlan = Array.isArray(safe.launchPlan)
    ? safe.launchPlan.filter((item) => typeof item === 'string' && item.trim()).slice(0, 3)
    : []

  const analysisTags = Array.isArray(safe.analysisTags)
    ? safe.analysisTags.filter((item) => typeof item === 'string' && item.trim()).slice(0, 6)
    : []

  return {
    summary: typeof safe.summary === 'string' && safe.summary.trim() ? safe.summary : fallback.summary,
    signal: typeof safe.signal === 'string' && safe.signal.trim() ? safe.signal : fallback.signal,
    visualSignal:
      typeof safe.visualSignal === 'string' && safe.visualSignal.trim()
        ? safe.visualSignal
        : fallback.visualSignal,
    nextStep:
      typeof safe.nextStep === 'string' && safe.nextStep.trim() ? safe.nextStep : fallback.nextStep,
    analysisTags: analysisTags.length ? analysisTags : fallback.analysisTags,
    replyCards: replyCards.length ? replyCards : fallback.replyCards,
    quickReplies: quickReplies.length ? quickReplies : fallback.quickReplies,
    launchPlan: launchPlan.length ? launchPlan : fallback.launchPlan,
  }
}

function buildFallbackInputAnalysis(payload) {
  const inputType = inferInputType(payload)
  const threadContextSuggestion =
    inputType === 'chat_screenshot'
      ? payload.threadContext?.trim() || '检测到这更像一张聊天截图，建议按截图里对方最后一句接回去。'
      : ''
  const lastOpponentMessage =
    inputType === 'chat_screenshot'
      ? payload.threadContext?.trim() || '你看看这波是不是拿捏了。'
      : ''

  return {
    inputType,
    subject: payload.imageName ? `上传内容「${payload.imageName}」` : '演示敌方火力',
    visualSummary:
      inputType === 'chat_screenshot'
        ? '这张图更像聊天或社交截图，重点不只是画面，还包括对话语气、先后轮次和对方在炫什么。'
        : '这张图更像单张表情包或返图，重点是表情、姿态、字幕和它传递出来的社交气势。',
    emotionTags: ['挑衅', '得意', '可回击'],
    detectedText: inputType === 'chat_screenshot' && payload.threadContext?.trim() ? [payload.threadContext.trim()] : [],
    conversationTurns:
      inputType === 'chat_screenshot' && lastOpponentMessage
        ? [
            {
              speaker: '对方',
              text: lastOpponentMessage,
            },
          ]
        : [],
    threadContextSuggestion,
    lastOpponentMessage,
    suggestedBattleStyleId: payload.battleStyleId || 'sarcastic',
    recommendedTemplateIds: [pickTemplateForFallback(payload, inputType, payload.battleStyleId).id],
  }
}

function normalizeInputAnalysis(candidate, fallback) {
  const safe = candidate && typeof candidate === 'object' ? candidate : {}
  const validInputTypes = new Set(['chat_screenshot', 'meme', 'photo', 'mixed', 'unknown'])

  const conversationTurns = Array.isArray(safe.conversationTurns)
    ? safe.conversationTurns
        .map((item) => ({
          speaker: typeof item?.speaker === 'string' && item.speaker.trim() ? item.speaker.trim() : '未知',
          text: typeof item?.text === 'string' && item.text.trim() ? item.text.trim() : '',
        }))
        .filter((item) => item.text)
        .slice(0, 8)
    : []

  const detectedText = Array.isArray(safe.detectedText)
    ? safe.detectedText.filter((item) => typeof item === 'string' && item.trim()).slice(0, 8)
    : []

  const recommendedTemplateIds = Array.isArray(safe.recommendedTemplateIds)
    ? safe.recommendedTemplateIds
        .filter((item) => typeof item === 'string' && item.trim())
        .map((item) => getMemeTemplate(item).id)
        .slice(0, 3)
    : []

  return {
    inputType: validInputTypes.has(safe.inputType) ? safe.inputType : fallback.inputType,
    subject:
      typeof safe.subject === 'string' && safe.subject.trim() ? safe.subject.trim() : fallback.subject,
    visualSummary:
      typeof safe.visualSummary === 'string' && safe.visualSummary.trim()
        ? safe.visualSummary.trim()
        : fallback.visualSummary,
    emotionTags: Array.isArray(safe.emotionTags)
      ? safe.emotionTags.filter((item) => typeof item === 'string' && item.trim()).slice(0, 6)
      : fallback.emotionTags,
    detectedText: detectedText.length ? detectedText : fallback.detectedText,
    conversationTurns: conversationTurns.length ? conversationTurns : fallback.conversationTurns,
    threadContextSuggestion:
      typeof safe.threadContextSuggestion === 'string' && safe.threadContextSuggestion.trim()
        ? safe.threadContextSuggestion.trim()
        : fallback.threadContextSuggestion,
    lastOpponentMessage:
      typeof safe.lastOpponentMessage === 'string' && safe.lastOpponentMessage.trim()
        ? safe.lastOpponentMessage.trim()
        : fallback.lastOpponentMessage,
    suggestedBattleStyleId:
      typeof safe.suggestedBattleStyleId === 'string' && safe.suggestedBattleStyleId.trim()
        ? safe.suggestedBattleStyleId.trim()
        : fallback.suggestedBattleStyleId,
    recommendedTemplateIds: recommendedTemplateIds.length
      ? recommendedTemplateIds
      : fallback.recommendedTemplateIds,
  }
}

function buildFallbackBattleOutput(payload, fallback) {
  const scene = pick(scenes, payload.sceneId, scenes[1])
  const battleStyleName = payload.battleStyleName || '阴阳怪气'
  const inputAnalysis = normalizeInputAnalysis(payload.inputAnalysis, buildFallbackInputAnalysis(payload))
  const template = getMemeTemplate(
    inputAnalysis.recommendedTemplateIds[0] ||
      pickTemplateForFallback(payload, inputAnalysis.inputType, payload.battleStyleId).id,
  )

  return {
    ...fallback,
    caption: fallback.quickReplies[0] || scene.replySeed,
    subject: inputAnalysis.subject,
    emotionTags: inputAnalysis.emotionTags.length
      ? inputAnalysis.emotionTags.slice(0, 5)
      : [scene.mood, '挑衅', battleStyleName],
    provocationScore: scene.id === 'concert-night' ? 82 : scene.id === 'deadline-night' ? 61 : 73,
    attackVector: `优先抓住“${scene.cue}”和对方最想炫的那层气势，转成 ${battleStyleName} 风格的反击。`,
    inputType: inputAnalysis.inputType,
    memeTemplateId: template.id,
    memeTemplateReason: template.description,
    memeGeneratorKey: pickFallbackMemeGeneratorTemplate(
      inputAnalysis.inputType,
      payload.battleStyleId,
    ).key,
  }
}

function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function wrapCaption(text, maxChars = 12) {
  const characters = Array.from(String(text || '').trim())
  if (!characters.length) {
    return ['装得挺像，继续。']
  }

  const lines = []
  let current = ''

  for (const char of characters) {
    const next = `${current}${char}`
    if (Array.from(next).length > maxChars && current) {
      lines.push(current)
      current = char
    } else {
      current = next
    }
  }

  if (current) {
    lines.push(current)
  }

  return lines.slice(0, 3)
}

function dataUrlToImageBuffer(dataUrl, fallbackName = 'input.png') {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return null
  }

  const matched = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/)
  if (!matched) {
    return null
  }

  const mimeType = matched[1]
  const base64Data = matched[2]
  const extension = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png'

  return {
    name: fallbackName.endsWith(`.${extension}`) ? fallbackName : `${fallbackName}.${extension}`,
    data: Buffer.from(base64Data, 'base64'),
  }
}

function buildMemeGeneratorTexts(template, caption) {
  if (template.strategy === 'image_based') {
    return []
  }

  const meme = getGeneratedMeme(template.key)
  if (!meme) {
    return []
  }

  const { minTexts, maxTexts } = meme.info.params
  if (!minTexts && !maxTexts) {
    return []
  }

  const lines = wrapCaption(caption, 8).slice(0, Math.max(1, maxTexts || 1))
  if (lines.length >= minTexts) {
    return lines.slice(0, maxTexts || lines.length)
  }

  const padded = [...lines]
  while (padded.length < minTexts) {
    padded.push(lines[lines.length - 1] || caption || '回你了')
  }
  return padded.slice(0, maxTexts || padded.length)
}

async function tryGenerateMemeWithLibrary({
  templateKey,
  caption,
  imageDataUrl,
  imageName,
}) {
  await ensureMemeGeneratorReady()

  const template = getMemeGeneratorTemplate(templateKey)
  const meme = getGeneratedMeme(template.key)
  if (!meme) {
    return null
  }

  const imageInput = dataUrlToImageBuffer(imageDataUrl, imageName || template.key)
  const images =
    template.strategy === 'image_based' && imageInput ? [imageInput] : []
  const texts = buildMemeGeneratorTexts(template, caption)
  const result = meme.generate(images, texts, {})

  if (result.type !== 'Ok') {
    return null
  }

  return {
    template,
    dataUrl: `data:image/png;base64,${result.field0.toString('base64')}`,
  }
}

function buildRenderedMemeDataUrl({
  imageUrl,
  caption,
  palette = ['#5b64f8', '#7c8cff', '#ff8a6c'],
  template = memeTemplates[0],
  subject = '',
  lastOpponentMessage = '',
  inputType = 'unknown',
}) {
  const safeImage = imageUrl || 'data:image/svg+xml;base64,'
  const lines = wrapCaption(caption, template.renderStyle === 'split' ? 10 : 12)
  const width = 1080
  const height = 1080
  const safeSubject = escapeXml(subject || '已锁定敌方火力')
  const safeLastOpponentMessage = escapeXml(lastOpponentMessage || '对方先手已记录')
  const safeTemplateLabel = escapeXml(template.label)
  const safeDescription = escapeXml(template.description)
  const safeEmoji = escapeXml(template.emoji || '😏')

  const posterText = lines
    .map((line, index) => {
      const y = height - 170 - (lines.length - 1 - index) * 96
      const safe = escapeXml(line)
      return `
        <text x="540" y="${y}" text-anchor="middle"
          font-family="'Avenir Next','PingFang SC','Microsoft YaHei',sans-serif"
          font-size="72" font-weight="900" letter-spacing="2"
          paint-order="stroke" stroke="#000000" stroke-width="20" stroke-linejoin="round"
          fill="#ffffff">${safe}</text>
      `
    })
    .join('')

  const splitText = lines
    .map((line, index) => {
      const y = 540 + index * 92
      const safe = escapeXml(line)
      return `
        <text x="782" y="${y}" text-anchor="middle"
          font-family="'Avenir Next','PingFang SC','Microsoft YaHei',sans-serif"
          font-size="64" font-weight="900" letter-spacing="1.5"
          paint-order="stroke" stroke="#08111f" stroke-width="18" stroke-linejoin="round"
          fill="#ffffff">${safe}</text>
      `
    })
    .join('')

  const chatBubbles = `
    <rect x="64" y="670" width="952" height="152" rx="38" fill="rgba(15,23,42,0.86)" stroke="rgba(255,255,255,0.1)" />
    <text x="104" y="732"
      font-family="'PingFang SC','Microsoft YaHei',sans-serif"
      font-size="30" font-weight="700" fill="#9db2ff">对方上一轮</text>
    <text x="104" y="782"
      font-family="'PingFang SC','Microsoft YaHei',sans-serif"
      font-size="36" font-weight="700" fill="#f8fafc">${safeLastOpponentMessage}</text>
    <rect x="248" y="846" width="768" height="164" rx="40" fill="url(#battleStroke)" />
    <text x="290" y="908"
      font-family="'PingFang SC','Microsoft YaHei',sans-serif"
      font-size="30" font-weight="700" fill="#dbe4ff">我方回击</text>
    ${lines
      .map((line, index) => {
        const safe = escapeXml(line)
        return `<text x="290" y="${958 + index * 46}"
          font-family="'PingFang SC','Microsoft YaHei',sans-serif"
          font-size="40" font-weight="800" fill="#ffffff">${safe}</text>`
      })
      .join('')}
  `

  let bodySvg = ''
  if (template.renderStyle === 'split') {
    bodySvg = `
      <image href="${escapeXml(safeImage)}" x="0" y="0" width="596" height="${height}" preserveAspectRatio="xMidYMid slice" />
      <rect x="596" y="0" width="484" height="${height}" fill="url(#battleStroke)" />
      <text x="838" y="190" text-anchor="middle"
        font-family="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif"
        font-size="180">${safeEmoji}</text>
      <text x="838" y="302" text-anchor="middle"
        font-family="'Avenir Next','PingFang SC','Microsoft YaHei',sans-serif"
        font-size="42" font-weight="900" letter-spacing="6" fill="#dbe4ff">${safeTemplateLabel}</text>
      <text x="838" y="378" text-anchor="middle"
        font-family="'PingFang SC','Microsoft YaHei',sans-serif"
        font-size="28" font-weight="600" fill="rgba(248,250,252,0.84)">${safeSubject}</text>
      ${splitText}
      <rect x="636" y="816" width="404" height="170" rx="34" fill="rgba(8,17,31,0.22)" />
      <text x="676" y="874"
        font-family="'PingFang SC','Microsoft YaHei',sans-serif"
        font-size="26" font-weight="700" fill="#f8fafc">模板判断</text>
      <text x="676" y="922"
        font-family="'PingFang SC','Microsoft YaHei',sans-serif"
        font-size="26" font-weight="500" fill="rgba(248,250,252,0.86)">${safeDescription}</text>
    `
  } else if (template.renderStyle === 'chat' || inputType === 'chat_screenshot') {
    bodySvg = `
      <rect x="56" y="56" width="968" height="968" rx="42" fill="rgba(7,12,24,0.96)" />
      <rect x="56" y="56" width="968" height="968" rx="42" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2" />
      <text x="96" y="118"
        font-family="'Avenir Next','PingFang SC','Microsoft YaHei',sans-serif"
        font-size="34" font-weight="900" letter-spacing="5" fill="#dbe4ff">${safeTemplateLabel}</text>
      <text x="952" y="130" text-anchor="end"
        font-family="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif"
        font-size="86">${safeEmoji}</text>
      <text x="96" y="174"
        font-family="'PingFang SC','Microsoft YaHei',sans-serif"
        font-size="28" font-weight="600" fill="rgba(226,232,240,0.82)">${safeSubject}</text>
      <rect x="92" y="238" width="712" height="166" rx="40" fill="rgba(31,41,55,0.92)" />
      <text x="132" y="298"
        font-family="'PingFang SC','Microsoft YaHei',sans-serif"
        font-size="30" font-weight="700" fill="#9db2ff">对方上一轮</text>
      <text x="132" y="356"
        font-family="'PingFang SC','Microsoft YaHei',sans-serif"
        font-size="46" font-weight="800" fill="#f8fafc">${safeLastOpponentMessage}</text>
      <rect x="302" y="484" width="650" height="320" rx="44" fill="url(#battleStroke)" />
      <text x="350" y="550"
        font-family="'PingFang SC','Microsoft YaHei',sans-serif"
        font-size="30" font-weight="800" fill="#dbe4ff">我方回击</text>
      ${lines
        .map((line, index) => {
          const safe = escapeXml(line)
          return `<text x="350" y="${628 + index * 72}"
            font-family="'PingFang SC','Microsoft YaHei',sans-serif"
            font-size="56" font-weight="900" fill="#ffffff">${safe}</text>`
        })
        .join('')}
      <rect x="92" y="848" width="860" height="118" rx="34" fill="rgba(15,23,42,0.92)" stroke="rgba(255,255,255,0.08)" />
      <text x="132" y="918"
        font-family="'PingFang SC','Microsoft YaHei',sans-serif"
        font-size="28" font-weight="600" fill="rgba(248,250,252,0.84)">${safeDescription}</text>
    `
  } else if (template.renderStyle === 'sticker') {
    bodySvg = `
      <rect width="100%" height="100%" fill="url(#battleStroke)" />
      <rect x="64" y="64" width="952" height="952" rx="48" fill="rgba(7,10,20,0.28)" />
      <image href="${escapeXml(safeImage)}" x="730" y="102" width="246" height="246" preserveAspectRatio="xMidYMid slice" opacity="0.95" />
      <rect x="730" y="102" width="246" height="246" rx="34" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="3" />
      <text x="540" y="356" text-anchor="middle"
        font-family="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif"
        font-size="236">${safeEmoji}</text>
      <text x="540" y="450" text-anchor="middle"
        font-family="'Avenir Next','PingFang SC','Microsoft YaHei',sans-serif"
        font-size="38" font-weight="900" letter-spacing="6" fill="#eff6ff">${safeTemplateLabel}</text>
      ${posterText}
      <text x="540" y="888" text-anchor="middle"
        font-family="'PingFang SC','Microsoft YaHei',sans-serif"
        font-size="28" font-weight="700" fill="rgba(248,250,252,0.92)">${safeSubject}</text>
      <text x="540" y="934" text-anchor="middle"
        font-family="'PingFang SC','Microsoft YaHei',sans-serif"
        font-size="24" font-weight="500" fill="rgba(248,250,252,0.78)">${safeDescription}</text>
    `
  } else {
    bodySvg = `
      <image href="${escapeXml(safeImage)}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" />
      <rect x="0" y="500" width="${width}" height="580" fill="url(#battleFade)" />
      <rect x="66" y="70" width="262" height="84" rx="24" fill="rgba(8,15,33,0.68)" stroke="rgba(255,255,255,0.18)" />
      <text x="104" y="126"
        font-family="'Avenir Next','PingFang SC','Microsoft YaHei',sans-serif"
        font-size="34" font-weight="900" letter-spacing="4" fill="#dbe4ff">${safeTemplateLabel}</text>
      <text x="964" y="146" text-anchor="end"
        font-family="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif"
        font-size="100">${safeEmoji}</text>
      <text x="82" y="852"
        font-family="'PingFang SC','Microsoft YaHei',sans-serif"
        font-size="28" font-weight="600" fill="#e2e8f0">${safeSubject}</text>
      ${posterText}
    `
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="battleFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(2,6,23,0)" />
          <stop offset="100%" stop-color="rgba(2,6,23,0.95)" />
        </linearGradient>
        <linearGradient id="battleStroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${escapeXml(palette[0])}" />
          <stop offset="50%" stop-color="${escapeXml(palette[1])}" />
          <stop offset="100%" stop-color="${escapeXml(palette[2])}" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="#020617" />
      ${bodySvg}
      <rect x="20" y="20" width="${width - 40}" height="${height - 40}" rx="34" ry="34"
        fill="none" stroke="url(#battleStroke)" stroke-opacity="0.58" stroke-width="8" />
      <rect x="44" y="44" width="${width - 88}" height="${height - 88}" rx="28" ry="28"
        fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="2" />
    </svg>
  `

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

function cleanJsonText(text) {
  return text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
}

async function probeArkAccess() {
  if (!hasArk) {
    arkProbe = {
      checked: true,
      ok: false,
      message: '后端正在 fallback 模式下运行，没有 key 也能完成演示。',
    }
    return arkProbe
  }

  try {
    const response = await fetch(`${arkBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.ARK_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: '请只回复ok' }],
        thinking: {
          type: 'disabled',
        },
        max_tokens: 16,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      const needsEndpoint =
        /ModelNotOpen|AccessDisabled|InvalidEndpointOrModel/i.test(errorText) && !usingEndpoint

      arkProbe = {
        checked: true,
        ok: false,
        message: needsEndpoint
          ? 'Ark key 已配置，但当前模型未开通。请在方舟控制台开通模型，或改用 ep- 开头的 Endpoint ID。'
          : `Ark key 已配置，但当前资源不可用，已自动退回 fallback。`,
      }
      return arkProbe
    }

    arkProbe = {
      checked: true,
      ok: true,
      message: supportsImageInput
        ? '后端已连接火山方舟 Ark，可根据图片生成结构化回复。'
        : '后端已连接火山方舟 Ark。当前模型按文本模式运行，适合先验证链路。',
    }
    return arkProbe
  } catch {
    arkProbe = {
      checked: true,
      ok: false,
      message: 'Ark 探测失败，当前已退回 fallback。请检查网络、模型开通状态或 Endpoint 配置。',
    }
    return arkProbe
  }
}

async function generateWithArk(payload, fallback) {
  const outputSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      summary: { type: 'string' },
      signal: { type: 'string' },
      visualSignal: { type: 'string' },
      nextStep: { type: 'string' },
      analysisTags: { type: 'array', items: { type: 'string' } },
      replyCards: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            badge: { type: 'string' },
            title: { type: 'string' },
            body: { type: 'string' },
          },
          required: ['badge', 'title', 'body'],
        },
      },
      quickReplies: { type: 'array', items: { type: 'string' } },
      launchPlan: { type: 'array', items: { type: 'string' } },
    },
    required: [
      'summary',
      'signal',
      'visualSignal',
      'nextStep',
      'analysisTags',
      'replyCards',
      'quickReplies',
      'launchPlan',
    ],
  }

  const userContent = [
    {
      type: 'text',
      text: [
        '你现在是在为 QQ 发图回复场景生成可直接演示的产品结果。请先理解图片本身，再结合关系、上下文和推进目标输出结构化 JSON。不要输出 markdown，不要解释，只返回 JSON 对象。',
        '',
        '场景信息：',
        JSON.stringify(
          {
            sceneTitle: payload.sceneTitle,
            sceneCue: payload.sceneCue,
            sceneMood: payload.sceneMood,
            sceneProductFit: payload.sceneProductFit,
            contextId: payload.contextId,
            relationshipId: payload.relationshipId,
            modeId: payload.modeId,
            focus: payload.focus,
            imageName: payload.imageName,
            threadContext: payload.threadContext,
            desiredOutcome: payload.desiredOutcome,
          },
          null,
          2,
        ),
        '',
        '输出 JSON schema：',
        '{',
        '  "summary": "string",',
        '  "signal": "string",',
        '  "visualSignal": "string",',
        '  "nextStep": "string",',
        '  "analysisTags": ["string"],',
        '  "replyCards": [{ "badge": "string", "title": "string", "body": "string" }],',
        '  "quickReplies": ["string"],',
        '  "launchPlan": ["string"]',
        '}',
        '',
        '要求：',
        '1. 用中文输出。',
        '2. 语气贴近 QQ 年轻用户，不要油腻，不要模板腔。',
        '3. 如果有图片，先真实理解画面主体、氛围、情绪温度和适合被接话的视觉细节，再组织回复。',
        '4. summary 更像产品总判断；signal 更像为什么适合这样回；visualSignal 专门写图里最值得被接住的视觉/氛围信号；nextStep 专门写下一轮怎么续聊。',
        '5. 明确体现对图片氛围、关系状态、聊天上下文和推进目标的理解。',
        '6. replyCards 输出 3 条，quickReplies 输出 3 条，launchPlan 输出 3 条。',
        '7. quickReplies 要短、像用户可以直接点发送；replyCards 要更完整，像 AI 建议卡。',
        '8. 保证适合作为比赛 demo 里的产品结果。',
      ].join('\n'),
    },
  ]

  if (payload.imageDataUrl && supportsImageInput) {
    userContent.push({
      type: 'image_url',
      image_url: {
        url: payload.imageDataUrl,
        detail: 'high',
      },
    })
  }

  const requestBase = {
    model,
    messages: [
      {
        role: 'system',
        content:
          '你是腾讯校园产品方向的 AI 交互策划助手，负责把用户发来的图片转成适合 QQ 互动的专属回复方案。',
      },
      {
        role: 'user',
        content: userContent,
      },
    ],
    thinking: {
      type: 'disabled',
    },
    max_tokens: 1200,
    temperature: 0.7,
  }

  async function requestArk(useSchema) {
    const response = await fetch(arkBaseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + process.env.ARK_API_KEY,
      },
      body: JSON.stringify({
        ...requestBase,
        ...(useSchema
          ? {
              response_format: {
                type: 'json_schema',
                json_schema: {
                  name: 'mirror_reply_experience',
                  description: 'QQ 发图回复场景下的结构化 AI 生成结果',
                  schema: outputSchema,
                  strict: true,
                },
              },
            }
          : {}),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error('ark_request_failed ' + response.status + ' ' + errorText)
    }

    return response.json()
  }

  let data
  try {
    data = await requestArk(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (/response_format\.type.*json_schema.*not supported/i.test(message)) {
      data = await requestArk(false)
    } else {
      throw error
    }
  }

  const text = data?.choices?.[0]?.message?.content?.trim()
  if (!text) {
    return fallback
  }

  try {
    const parsed = JSON.parse(cleanJsonText(text))
    return normalizeExperience(parsed, fallback)
  } catch {
    return fallback
  }
}

async function generateInputAnalysisWithArk(payload, fallback) {
  const outputSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      inputType: { type: 'string' },
      subject: { type: 'string' },
      visualSummary: { type: 'string' },
      emotionTags: { type: 'array', items: { type: 'string' } },
      detectedText: { type: 'array', items: { type: 'string' } },
      conversationTurns: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            speaker: { type: 'string' },
            text: { type: 'string' },
          },
          required: ['speaker', 'text'],
        },
      },
      threadContextSuggestion: { type: 'string' },
      lastOpponentMessage: { type: 'string' },
      suggestedBattleStyleId: { type: 'string' },
      recommendedTemplateIds: { type: 'array', items: { type: 'string' } },
    },
    required: [
      'inputType',
      'subject',
      'visualSummary',
      'emotionTags',
      'detectedText',
      'conversationTurns',
      'threadContextSuggestion',
      'lastOpponentMessage',
      'suggestedBattleStyleId',
      'recommendedTemplateIds',
    ],
  }

  const userContent = [
    {
      type: 'text',
      text: [
        '你现在负责分析用户上传的内容，这个内容可能是聊天截图、表情包、自拍、返图或其他社交图片。',
        '请先判断输入类型，再尽量识别图里的文字和对话结构。如果看起来像聊天截图，要尽量抽出对方最近一轮说了什么，并生成一条适合自动填入“上一轮对话”输入框的中文总结。',
        '如果图里能看清聊天文字，请优先逐字提取，不要自行改写，不要偷换意思。',
        '如果能判断消息左右位置或配色，请把左侧白色/浅色气泡优先视作“对方”，右侧绿色/高亮气泡优先视作“我”。',
        'lastOpponentMessage 要优先填写图里对方最后一条可读原话；只有实在看不清时才允许概括。',
        '如果输入只是纯表情包、梗图或普通图片，没有真实聊天对话，请把 lastOpponentMessage 和 threadContextSuggestion 都返回空字符串，conversationTurns 返回空数组，不要编造聊天内容。',
        '只输出 JSON，不要输出 markdown，不要解释。',
        '',
        '可选 inputType 仅限：chat_screenshot、meme、photo、mixed、unknown。',
        'speaker 请优先使用“对方”“我”“未知”。',
        'suggestedBattleStyleId 仅限：sarcastic、aggressive、cute、brainhole。',
        'recommendedTemplateIds 必须从以下模板里选 1-3 个：',
        JSON.stringify(
          memeTemplates.map((item) => ({
            id: item.id,
            label: item.label,
            description: item.description,
            fitStyles: item.fitStyles,
            fitInputs: item.fitInputs,
          })),
          null,
          2,
        ),
      ].join('\n'),
    },
  ]

  if (payload.imageDataUrl && supportsImageInput) {
    userContent.push({
      type: 'image_url',
      image_url: {
        url: payload.imageDataUrl,
        detail: 'xhigh',
      },
    })
  }

  const requestBase = {
    model,
    messages: [
      {
        role: 'system',
        content:
          '你是一个擅长读聊天截图、表情包语境和社交情绪的多模态分析助手，目标是为“AI 嘴替 / 社交斗图 Agent”提供稳定的上游输入分析。',
      },
      {
        role: 'user',
        content: userContent,
      },
    ],
    thinking: {
      type: 'disabled',
    },
    max_tokens: 1200,
    temperature: 0.35,
  }

  async function requestArk(useSchema) {
    const response = await fetch(arkBaseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + process.env.ARK_API_KEY,
      },
      body: JSON.stringify({
        ...requestBase,
        ...(useSchema
          ? {
              response_format: {
                type: 'json_schema',
                json_schema: {
                  name: 'battle_input_analysis',
                  description: '上传图片的输入类型识别和聊天上下文抽取结果',
                  schema: outputSchema,
                  strict: true,
                },
              },
            }
          : {}),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error('ark_analysis_request_failed ' + response.status + ' ' + errorText)
    }

    return response.json()
  }

  let data
  try {
    data = await requestArk(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (/response_format\.type.*json_schema.*not supported/i.test(message)) {
      data = await requestArk(false)
    } else {
      throw error
    }
  }

  const text = data?.choices?.[0]?.message?.content?.trim()
  if (!text) {
    return fallback
  }

  try {
    const parsed = JSON.parse(cleanJsonText(text))
    return normalizeInputAnalysis(parsed, fallback)
  } catch {
    return fallback
  }
}

async function generateBattleWithArk(payload, fallback) {
  const battleStyleName = payload.battleStyleName || '阴阳怪气'
  const inputFallback = buildFallbackInputAnalysis(payload)
  const inputAnalysis =
    payload.inputAnalysis && typeof payload.inputAnalysis === 'object'
      ? normalizeInputAnalysis(payload.inputAnalysis, inputFallback)
      : await generateInputAnalysisWithArk(payload, inputFallback)
  const battleFallback = buildFallbackBattleOutput(payload, fallback)
  const outputSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      summary: { type: 'string' },
      signal: { type: 'string' },
      visualSignal: { type: 'string' },
      nextStep: { type: 'string' },
      analysisTags: { type: 'array', items: { type: 'string' } },
      replyCards: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            badge: { type: 'string' },
            title: { type: 'string' },
            body: { type: 'string' },
          },
          required: ['badge', 'title', 'body'],
        },
      },
      quickReplies: { type: 'array', items: { type: 'string' } },
      launchPlan: { type: 'array', items: { type: 'string' } },
      caption: { type: 'string' },
      subject: { type: 'string' },
      emotionTags: { type: 'array', items: { type: 'string' } },
      provocationScore: { type: 'integer' },
      attackVector: { type: 'string' },
      memeTemplateId: { type: 'string' },
      memeTemplateReason: { type: 'string' },
      memeGeneratorKey: { type: 'string' },
    },
    required: [
      'summary',
      'signal',
      'visualSignal',
      'nextStep',
      'analysisTags',
      'replyCards',
      'quickReplies',
      'launchPlan',
      'caption',
      'subject',
      'emotionTags',
      'provocationScore',
      'attackVector',
      'memeTemplateId',
      'memeTemplateReason',
      'memeGeneratorKey',
    ],
  }

  const userContent = [
    {
      type: 'text',
      text: [
        '你现在是 QQ / 微信 社交斗图场景中的 AI 嘴替 Agent。你的任务不是普通聊天，而是：看懂对方发来的表情包、聊天截图或图片，识别里面的挑衅、得意、装酷、卖惨或阴阳怪气等社交情绪，再替用户给出“推荐回复表情包 + 单独发送的嘴替文案”这一整套反击方案。',
        '',
        '请严格输出 JSON，不要输出 markdown，不要解释。',
        '',
        '输入上下文：',
        JSON.stringify(
          {
            battleStyleName,
            battleStyleId: payload.battleStyleId,
            sceneTitle: payload.sceneTitle,
            sceneCue: payload.sceneCue,
            sceneMood: payload.sceneMood,
            sceneProductFit: payload.sceneProductFit,
            contextId: payload.contextId,
            relationshipId: payload.relationshipId,
            focus: payload.focus,
            imageName: payload.imageName,
            threadContext: payload.threadContext,
            desiredOutcome: payload.desiredOutcome,
            inputAnalysis,
            memeTemplateLibrary: memeTemplates.map((item) => ({
              id: item.id,
              label: item.label,
              description: item.description,
              fitStyles: item.fitStyles,
              fitInputs: item.fitInputs,
              renderStyle: item.renderStyle,
            })),
            memeGeneratorLibrary: memeGeneratorTemplates.map((item) => ({
              key: item.key,
              label: item.label,
              strategy: item.strategy,
              description: item.description,
              fitStyles: item.fitStyles,
              fitInputs: item.fitInputs,
            })),
          },
          null,
          2,
        ),
        '',
        '输出要求：',
        '1. 用中文输出。',
        '2. caption 是要单独发送出去的主回复文案，不要把它当成图片上的字幕。它必须短、狠、准，有社交传播感，控制在 8-24 个中文字符内。',
        '3. subject 要概括画面主体，比如“戴墨镜的柴犬”“故作镇定的自拍”“明显在炫耀的返图”。',
        '4. emotionTags 输出 3-5 个情绪标签。',
        '5. provocationScore 是 0-100 的整数，表示挑衅强度。',
        '6. attackVector 说明为什么应该从这个点回击。',
        '7. quickReplies 输出 3 条，可以比 caption 稍长，但都要能直接发。',
        '8. replyCards 输出 3 条，像产品里的 AI 建议卡。',
        '9. memeTemplateId 必须从提供的模板库里选，优先选择能让回复显得像“现成表情包”而不是纯贴字的模板。',
        '10. memeTemplateReason 解释为什么选这张模板，要和对方语气、截图内容或图片气势对应起来。',
        '11. memeGeneratorKey 必须从提供的 memeGeneratorLibrary 里选一个最合适的回复表情包模板。这里是在“推荐发哪张表情包回去”，不是把原图重新做成新图。',
        '12. 结合 battleStyleName、关系距离、聊天上下文和用户目标，不要写成泛泛鸡汤。',
        '13. 如果图片不是真的挑衅，也要给出轻反击或高情商接回去的处理，不要瞎怼。',
        '14. quickReplies 要像真人会发的句子，避免太书面、太完整、太用力过猛。',
        '15. 保证结果适合比赛 Demo 演示，既有梗又可落地。',
      ].join('\n'),
    },
  ]

  if (payload.imageDataUrl && supportsImageInput) {
    userContent.push({
      type: 'image_url',
      image_url: {
        url: payload.imageDataUrl,
        detail: 'high',
      },
    })
  }

  const requestBase = {
    model,
    messages: [
      {
        role: 'system',
        content:
          '你是一个懂 QQ 年轻人语气、表情包文化和社交斗图节奏的 AI 嘴替 Agent，擅长把视觉挑衅转成高命中率反击文案。',
      },
      {
        role: 'user',
        content: userContent,
      },
    ],
    thinking: {
      type: 'disabled',
    },
    max_tokens: 1400,
    temperature: 0.85,
  }

  async function requestArk(useSchema) {
    const response = await fetch(arkBaseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + process.env.ARK_API_KEY,
      },
      body: JSON.stringify({
        ...requestBase,
        ...(useSchema
          ? {
              response_format: {
                type: 'json_schema',
                json_schema: {
                  name: 'battle_meme_output',
                  description: '社交斗图嘴替 Agent 的结构化输出',
                  schema: outputSchema,
                  strict: true,
                },
              },
            }
          : {}),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error('ark_battle_request_failed ' + response.status + ' ' + errorText)
    }

    return response.json()
  }

  let data
  try {
    data = await requestArk(true)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (/response_format\.type.*json_schema.*not supported/i.test(message)) {
      data = await requestArk(false)
    } else {
      throw error
    }
  }

  const text = data?.choices?.[0]?.message?.content?.trim()
  if (!text) {
    return battleFallback
  }

  try {
    const parsed = JSON.parse(cleanJsonText(text))
    const normalized = normalizeExperience(parsed, fallback)
    return {
      ...battleFallback,
      ...normalized,
      caption:
        typeof parsed.caption === 'string' && parsed.caption.trim()
          ? parsed.caption.trim()
          : normalized.quickReplies[0] || battleFallback.caption,
      subject:
        typeof parsed.subject === 'string' && parsed.subject.trim()
          ? parsed.subject.trim()
          : battleFallback.subject,
      emotionTags: Array.isArray(parsed.emotionTags)
        ? parsed.emotionTags.filter((item) => typeof item === 'string' && item.trim()).slice(0, 5)
        : battleFallback.emotionTags,
      provocationScore: Number.isFinite(parsed.provocationScore)
        ? Math.max(0, Math.min(100, Math.round(parsed.provocationScore)))
        : battleFallback.provocationScore,
      attackVector:
        typeof parsed.attackVector === 'string' && parsed.attackVector.trim()
          ? parsed.attackVector.trim()
          : battleFallback.attackVector,
      inputType: inputAnalysis.inputType,
      memeTemplateId: getMemeTemplate(parsed.memeTemplateId).id,
      memeTemplateReason:
        typeof parsed.memeTemplateReason === 'string' && parsed.memeTemplateReason.trim()
          ? parsed.memeTemplateReason.trim()
          : battleFallback.memeTemplateReason,
      memeGeneratorKey: getMemeGeneratorTemplate(parsed.memeGeneratorKey).key,
    }
  } catch {
    return battleFallback
  }
}

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    mode: hasArk && arkProbe.ok ? 'ark' : 'fallback',
    model: hasArk ? model : undefined,
    message: arkProbe.message,
    supportsImageInput,
  })
})

app.post('/api/generate', async (request, response) => {
  const payload = request.body ?? {}
  const fallback = buildFallbackExperience(payload)

  try {
    const experience = hasArk ? await generateWithArk(payload, fallback) : fallback

    response.json({
      ok: true,
      mode: hasArk ? 'ark' : 'fallback',
      supportsImageInput,
      experience,
    })
  } catch (error) {
    console.error('generate failed', error)
    response.json({
      ok: true,
      mode: 'fallback',
      experience: fallback,
      warning: 'generation_failed_fallback_returned',
    })
  }
})

app.post('/api/battle/analyze-input', async (request, response) => {
  const payload = request.body ?? {}
  const fallback = buildFallbackInputAnalysis(payload)

  try {
    const analysis = hasArk ? await generateInputAnalysisWithArk(payload, fallback) : fallback

    response.json({
      ok: true,
      mode: hasArk ? 'ark' : 'fallback',
      supportsImageInput,
      analysis,
      recommendedTemplates: analysis.recommendedTemplateIds.map((templateId) => getMemeTemplate(templateId)),
    })
  } catch (error) {
    console.error('battle analyze input failed', error)
    response.json({
      ok: true,
      mode: 'fallback',
      supportsImageInput,
      analysis: fallback,
      recommendedTemplates: fallback.recommendedTemplateIds.map((templateId) => getMemeTemplate(templateId)),
      warning: 'battle_input_analysis_failed_fallback_returned',
    })
  }
})

app.post('/api/battle/generate', async (request, response) => {
  const payload = request.body ?? {}
  const fallback = buildFallbackExperience({
    ...payload,
    modeId: payload.modeId || 'deep',
  })

  try {
    const battleOutput = hasArk
      ? await generateBattleWithArk(payload, fallback)
      : buildFallbackBattleOutput(payload, fallback)
    const template = getMemeTemplate(battleOutput.memeTemplateId)

    response.json({
      ok: true,
      mode: hasArk ? 'ark' : 'fallback',
      supportsImageInput,
      experience: battleOutput,
      analysis: normalizeInputAnalysis(payload.inputAnalysis, buildFallbackInputAnalysis(payload)),
      battle: {
        caption: battleOutput.caption,
        subject: battleOutput.subject,
        emotionTags: battleOutput.emotionTags,
        provocationScore: battleOutput.provocationScore,
        attackVector: battleOutput.attackVector,
        inputType: battleOutput.inputType,
        memeTemplate: template,
        memeTemplateReason: battleOutput.memeTemplateReason,
        memeGeneratorTemplate: getMemeGeneratorTemplate(battleOutput.memeGeneratorKey),
      },
    })
  } catch (error) {
    console.error('battle generate failed', error)
    const debugReason = error instanceof Error ? error.message : String(error)

    const battleOutput = buildFallbackBattleOutput(payload, fallback)
    const template = getMemeTemplate(battleOutput.memeTemplateId)

    response.json({
      ok: true,
      mode: 'fallback',
      supportsImageInput,
      experience: battleOutput,
      analysis: normalizeInputAnalysis(payload.inputAnalysis, buildFallbackInputAnalysis(payload)),
      battle: {
        caption: battleOutput.caption,
        subject: battleOutput.subject,
        emotionTags: battleOutput.emotionTags,
        provocationScore: battleOutput.provocationScore,
        attackVector: battleOutput.attackVector,
        inputType: battleOutput.inputType,
        memeTemplate: template,
        memeTemplateReason: battleOutput.memeTemplateReason,
        memeGeneratorTemplate: getMemeGeneratorTemplate(battleOutput.memeGeneratorKey),
      },
      warning: 'battle_generation_failed_fallback_returned',
      debugReason,
    })
  }
})

app.listen(port, host, () => {
  console.log(`mirror-demo-api listening on http://${host}:${port}`)
  console.log(`mode=${hasArk ? 'ark-configured' : 'fallback'} model=${hasArk ? model : 'local-fallback'}`)
  void probeArkAccess().then((result) => {
    console.log(`ark_probe=${result.ok ? 'ok' : 'fallback'} message=${result.message}`)
  })
})
