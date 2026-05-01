import { useEffect, useLayoutEffect, useRef, useState, startTransition } from 'react'
import type { ChangeEvent, CSSProperties } from 'react'
import {
  BrainCircuit,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  MessageSquareQuote,
  RefreshCw,
  Settings2,
  Share2,
  Sparkles,
  Swords,
  Terminal,
  UploadCloud,
  Zap,
} from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './App.css'

gsap.registerPlugin(ScrollTrigger)

type Scene = {
  id: string
  title: string
  subtitle: string
  cue: string
  mood: string
  productFit: string
  imageLabel: string
  replySeed: string
  followUpSeed: string
  stickerSeed: string
}

type Option = {
  id: string
  label: string
  value?: string
  description?: string
  angle?: string
}

type ReplyCard = {
  badge: string
  title: string
  body: string
}

type Experience = {
  summary: string
  signal: string
  visualSignal: string
  nextStep: string
  analysisTags: string[]
  replyCards: ReplyCard[]
  quickReplies: string[]
  launchPlan: string[]
}

type HealthState = {
  ok: boolean
  mode: 'ark' | 'fallback' | 'unknown'
  model?: string
  message: string
  supportsImageInput?: boolean
}

type BattleTelemetry = {
  caption: string
  subject: string
  emotionTags: string[]
  provocationScore: number
  attackVector: string
  inputType?: string
  memeTemplate?: MemeTemplate
  memeTemplateReason?: string
  memeGeneratorTemplate?: {
    key: string
    label: string
    strategy: string
    description: string
  }
}

type MemeTemplate = {
  id: string
  label: string
  description: string
  renderStyle: string
}

type ConversationTurn = {
  speaker: string
  text: string
}

type InputAnalysis = {
  inputType: 'chat_screenshot' | 'meme' | 'photo' | 'mixed' | 'unknown'
  subject: string
  visualSummary: string
  emotionTags: string[]
  detectedText: string[]
  conversationTurns: ConversationTurn[]
  threadContextSuggestion: string
  lastOpponentMessage: string
  suggestedBattleStyleId: string
  recommendedTemplateIds: string[]
}

type BattleStyle = {
  id: string
  name: string
  icon: string
  description: string
  modeId: string
  palette: [string, string, string]
}

type BattleLog = {
  id: number
  text: string
  type: 'info' | 'system' | 'success' | 'warning'
}

type SidebarTab = 'workbench' | 'library' | 'assets'

const demoScenes: Scene[] = [
  {
    id: 'campus-cat',
    title: '小猫治愈局',
    subtitle: '适合嘴替成“柔中带刺”的反击',
    cue: '柔软、轻松、让人想继续聊',
    mood: '疗愈向',
    productFit: '适合做陪伴式回复和贴纸化内容生成',
    imageLabel: '晚自习后在教学楼台阶边偶遇一只懒洋洋的小猫',
    replySeed: '你这张图一发出来，今天的疲惫感像被小猫替你收走了一半。',
    followUpSeed: '它最后有没有回头看你？这种小瞬间真的很适合被收藏成一天的结束语。',
    stickerSeed: '今日回血 / 猫猫批准你下班 / 情绪已被接住',
  },
  {
    id: 'concert-night',
    title: '嚣张返图局',
    subtitle: '适合把挑衅感转成高情绪反杀',
    cue: '热烈、闪光、适合把情绪值再推高一点',
    mood: '高能向',
    productFit: '适合生成情绪延展文案和二次互动话题',
    imageLabel: '灯海亮起的瞬间，你举起手机拍下舞台和人群的合唱',
    replySeed:
      '这不是返图，是你今天情绪值满格的证据，我隔着屏幕都能听见现场的尖叫感。',
    followUpSeed:
      '如果只让你留一句今晚的标题，你会写“值回票价”还是“舍不得散场”？',
    stickerSeed: '今晚封神 / 情绪超频 / 返图请继续',
  },
  {
    id: 'deadline-night',
    title: '熬夜嘴硬局',
    subtitle: '适合识别“嘴上凶，实际很累”的图感',
    cue: '克制、辛苦、需要被理解但不想被说教',
    mood: '共情向',
    productFit: '适合做不油腻的安慰、鼓劲和接续话题',
    imageLabel: '凌晨的宿舍书桌上，电脑、资料和冷掉的咖啡堆在一起',
    replySeed:
      '这张图有一种“明明很累但还在往前扛”的力量感，我第一眼就懂你现在的节奏。',
    followUpSeed: '你现在最想听到的是“快结束了”还是“我陪你把这段熬过去”？',
    stickerSeed: '今晚稳住 / ddl 不会赢 / 再撑一下就亮天',
  },
  {
    id: 'sunset-trip',
    title: '氛围偷袭局',
    subtitle: '适合打出有画面感的高质回怼',
    cue: '松弛、漂亮、有一点点想把关系往前推',
    mood: '氛围向',
    productFit: '适合生成氛围感文案和带有记忆点的回复卡',
    imageLabel: '傍晚海边的风吹起外套，夕阳把整片天空染成橘粉色',
    replySeed:
      '这张图不像普通打卡，更像把“今天值得被记住”这件事认真存档了一次。',
    followUpSeed: '如果把这一刻做成一句只发给懂的人看的备注，你会怎么写？',
    stickerSeed: '落日已签收 / 氛围感到位 / 请继续发美照',
  },
]

const modes: Option[] = [
  {
    id: 'companion',
    label: '陪伴式回法',
    description: '先接住情绪，再给对方一个愿意继续聊下去的台阶。',
    angle: '更适合长期关系和高频聊天场景',
  },
  {
    id: 'playful',
    label: '玩梗式回法',
    description: '先制造轻松梗感，再把互动氛围拉起来。',
    angle: '更适合群聊、熟人社交和高传播内容',
  },
  {
    id: 'spark',
    label: '心动式回法',
    description: '先给到“只发给你”的专属感，再留下心跳点。',
    angle: '更适合暧昧、兴趣搭子和高情绪时刻',
  },
  {
    id: 'deep',
    label: '深聊式回法',
    description: '先读懂画面细节，再延展出更有内容的对话。',
    angle: '更适合评论区深聊和内容理解型回复',
  },
]

const contexts: Option[] = [
  { id: 'qq-chat', label: 'QQ 私聊', value: '适合做秒回但不敷衍的一对一斗图。' },
  { id: 'group-icebreak', label: '群聊接话', value: '适合帮用户在多人战场里迅速抢回主动权。' },
  { id: 'comment-feed', label: '评论区互动', value: '适合发图后生成更有辨识度的反击内容。' },
  { id: 'video-reply', label: '截图回怼', value: '适合从截图里提炼攻击点并快速生成嘴替文案。' },
]

const relationships: Option[] = [
  { id: 'bestie', label: '死党熟人', value: '可以更损一点，但保留玩笑分寸。' },
  { id: 'crush', label: '暧昧对象', value: '要有攻击性，但不能失去专属感。' },
  { id: 'fandom', label: '兴趣搭子', value: '重点是懂梗、懂图、懂对方在炫什么。' },
  { id: 'new-friend', label: '新认识的人', value: '友好带刺，避免一下子怼太满。' },
]

const targetOptions: Option[] = [
  { id: 'target-stall', label: '让对方接不上', value: '让我回过去以后，对方一时半会儿接不上。' },
  { id: 'target-play', label: '继续陪我玩梗', value: '让我回过去以后，对方继续陪我玩梗，不要冷场。' },
  { id: 'target-group', label: '群里抢回气势', value: '让我回过去以后，在群里把气势抢回来。' },
  { id: 'target-soft', label: '高情商接住', value: '让我回过去以后，既接住对方又不把关系怼僵。' },
  { id: 'target-flirt', label: '留一点暧昧钩子', value: '让我回过去以后，既能接住梗，又能留一点暧昧空间。' },
  { id: 'target-explain', label: '逼对方主动解释', value: '让我回过去以后，把球踢回去，让对方主动解释或者接话。' },
  { id: 'target-reverse', label: '把话题拉回我这边', value: '让我回过去以后，把注意力从对方那张图拉回到我这边。' },
  { id: 'target-pressure', label: '不撕破脸但压回去', value: '让我回过去以后，不把关系弄僵，但气势要压回去。' },
]

const focusOptions: Option[] = [
  { id: 'focus-human', label: '像本人亲自出手', value: '像我本人在回，别太像 AI。' },
  { id: 'focus-clean', label: '有梗但别低俗', value: '怼人要有梗，但不能太脏。' },
  { id: 'focus-light', label: '轻一点别太冲', value: '轻松一点，别太上头，留点余地。' },
  { id: 'focus-qq', label: '适合 QQ 私聊', value: '要像 QQ 私聊里真的会发出去的话。' },
  { id: 'focus-short', label: '短一点像秒回', value: '尽量短一点，像看到就秒回出去的话。' },
  { id: 'focus-cold', label: '冷一点别太热情', value: '语气冷一点，别显得我太上赶着。' },
  { id: 'focus-funny', label: '更好笑更有梗', value: '优先有梗和好笑，别太正经。' },
  { id: 'focus-sweet', label: '嘴硬但保留甜味', value: '嘴上要硬一点，但还是保留一点亲近感。' },
  { id: 'focus-group', label: '适合群聊发出去', value: '要像丢到群里也不会尴尬的话。' },
  { id: 'focus-clean-cut', label: '干脆一点别废话', value: '别铺垫太多，直接干脆一点。' },
]

const battleStyles: BattleStyle[] = [
  {
    id: 'sarcastic',
    name: '阴阳怪气',
    icon: '😏',
    description: '表面夸奖，实则反击，对方越看越不舒服。',
    modeId: 'deep',
    palette: ['#7c8cff', '#5b64f8', '#242e6f'],
  },
  {
    id: 'aggressive',
    name: '霸道回怼',
    icon: '🔥',
    description: '火力全开，输出要有压迫感和节奏感。',
    modeId: 'spark',
    palette: ['#ff8a6c', '#ff5a5f', '#5f1237'],
  },
  {
    id: 'cute',
    name: '委屈巴巴',
    icon: '🥺',
    description: '用装可怜和反向卖萌，把气势抢回来。',
    modeId: 'companion',
    palette: ['#88d3ff', '#7e9dff', '#4152ca'],
  },
  {
    id: 'brainhole',
    name: '离谱脑洞',
    icon: '👽',
    description: '不按套路出牌，靠脑洞完成降维打击。',
    modeId: 'playful',
    palette: ['#a08bff', '#ff73b2', '#ff8f52'],
  },
]

const pipelineStages = ['输入感知', '上下文记忆', '策略决策', '执行输出']

const inputTypeLabels: Record<InputAnalysis['inputType'], string> = {
  chat_screenshot: '聊天截图',
  meme: '表情包/梗图',
  photo: '普通图片',
  mixed: '混合内容',
  unknown: '待识别输入',
}

const PREFERENCES_KEY = 'qq-ai-doutu-preferences'

type UserPreferences = {
  battleStyleId: string
  contextId: string
  relationshipId: string
  focus: string
  desiredOutcome: string
  actionCount: number
  lastUsedAt: string
}

function loadPreferences(): Partial<UserPreferences> {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Partial<UserPreferences>
  } catch {
    return {}
  }
}

function savePreferences(prefs: Partial<UserPreferences>) {
  try {
    const existing = loadPreferences()
    const merged = { ...existing, ...prefs, lastUsedAt: existing.lastUsedAt ?? new Date().toISOString() }
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(merged))
  } catch {
    // ignore
  }
}

function recordPreferenceUsage() {
  try {
    const existing = loadPreferences()
    const merged = {
      ...existing,
      actionCount: (existing.actionCount ?? 0) + 1,
      lastUsedAt: new Date().toISOString(),
    }
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(merged))
  } catch {
    // ignore
  }
}

const savedPrefs = loadPreferences()

const initialIds = {
  sceneId: 'concert-night',
  contextId: savedPrefs.contextId ?? 'qq-chat',
  relationshipId: savedPrefs.relationshipId ?? 'crush',
  battleStyleId: savedPrefs.battleStyleId ?? 'sarcastic',
}

function getScene(sceneId: string) {
  return demoScenes.find((scene) => scene.id === sceneId) ?? demoScenes[1]
}

function getMode(modeId: string) {
  return modes.find((mode) => mode.id === modeId) ?? modes[0]
}

function getContext(contextId: string) {
  return contexts.find((item) => item.id === contextId) ?? contexts[0]
}

function getRelationship(relationshipId: string) {
  return relationships.find((item) => item.id === relationshipId) ?? relationships[0]
}

function getBattleStyle(battleStyleId: string) {
  return battleStyles.find((item) => item.id === battleStyleId) ?? battleStyles[0]
}

function getOptionByValue(options: Option[], value: string, fallback: Option) {
  return options.find((item) => item.value === value) ?? fallback
}

function getAutoGoal(inputType: InputAnalysis['inputType'] | null, relationshipId: string) {
  if (inputType === 'chat_screenshot') {
    return relationshipId === 'crush'
      ? targetOptions.find((item) => item.id === 'target-flirt') ?? targetOptions[1]
      : targetOptions.find((item) => item.id === 'target-soft') ?? targetOptions[1]
  }

  if (inputType === 'meme') {
    return relationshipId === 'bestie'
      ? targetOptions.find((item) => item.id === 'target-play') ?? targetOptions[1]
      : targetOptions.find((item) => item.id === 'target-pressure') ?? targetOptions[1]
  }

  return targetOptions[1]
}

function getAutoFocus(inputType: InputAnalysis['inputType'] | null, relationshipId: string) {
  if (inputType === 'chat_screenshot') {
    return relationshipId === 'crush'
      ? focusOptions.find((item) => item.id === 'focus-sweet') ?? focusOptions[0]
      : focusOptions.find((item) => item.id === 'focus-clean') ?? focusOptions[0]
  }

  if (inputType === 'meme') {
    return relationshipId === 'bestie'
      ? focusOptions.find((item) => item.id === 'focus-funny') ?? focusOptions[0]
      : focusOptions.find((item) => item.id === 'focus-short') ?? focusOptions[0]
  }

  return focusOptions[0]
}

function createLocalExperience(input: {
  sceneId: string
  modeId: string
  contextId: string
  relationshipId: string
  focus: string
  imageName?: string
  threadContext?: string
  desiredOutcome?: string
}) {
  const scene = getScene(input.sceneId)
  const mode = getMode(input.modeId)
  const context = getContext(input.contextId)
  const relationship = getRelationship(input.relationshipId)
  const focusLine = input.focus.trim()
    ? `这次重点遵循你的偏好：“${input.focus.trim()}”。`
    : '这次重点追求“像真人、够专属、能继续聊”。'
  const uploadLine = input.imageName
    ? `已识别你上传的图片「${input.imageName}」，会优先结合实拍内容来组织回复。`
    : `当前 Agent 先用「${scene.title}」这组默认语境预设完成判断。`
  const threadLine = input.threadContext?.trim()
    ? `当前对话上下文是：“${input.threadContext.trim()}”。`
    : '当前默认把它当作刚发图后的第一轮回复。'
  const outcomeLine = input.desiredOutcome?.trim()
    ? `这轮推进目标是：“${input.desiredOutcome.trim()}”。`
    : '这轮默认目标是先把气氛接住，再留下下一轮聊天空间。'
  const modeOpeners: Record<string, string> = {
    companion: '先稳稳接住情绪，再补一句让人觉得被认真看见的话。',
    playful: '先把画面里的亮点变成一个轻巧包袱，再顺势把气氛推起来。',
    spark: '先给对方“这是只对你说”的感觉，再留一点心跳空间。',
    deep: '先把图里的细节读准，再把回复延展成更有内容的交流。',
  }

  return {
    summary: `${uploadLine}${threadLine}${outcomeLine}${focusLine} 推荐采用「${mode.label}」，因为这张图的核心气质是“${scene.cue}”，最适合在 ${context.label} 里做有记忆点的专属回复。`,
    signal: `${scene.productFit}；${mode.angle ?? ''}`,
    visualSignal: input.imageName
      ? `这张图最值得被接住的是“${scene.cue}”这层氛围，系统会优先从主体、光线和情绪值里提炼回复切口。`
      : `当前以「${scene.title}」这组默认语境做视觉理解，重点抓“${scene.cue}”和最容易让人想接话的细节。`,
    nextStep: input.desiredOutcome?.trim()
      ? `先把情绪接住，再通过一句追问把对话自然推进到“${input.desiredOutcome.trim()}”。`
      : '先用一句不敷衍的回应接住画面情绪，再留一个顺势续聊的切口。',
    analysisTags: [scene.mood, scene.title, context.label, relationship.label, mode.label],
    replyCards: [
      {
        badge: '首条回复',
        title: '先把情绪接住',
        body: `${modeOpeners[input.modeId] ?? modeOpeners.spark} ${scene.replySeed}`,
      },
      {
        badge: '延展内容',
        title: '把“只发给你”的专属感做出来',
        body: input.threadContext?.trim()
          ? `结合对方刚刚那句“${input.threadContext.trim()}”，建议顺着画面细节接一句：${scene.followUpSeed}`
          : `${scene.followUpSeed} 这一步会直接把图片回复从“会聊天”升级成“会持续互动”。`,
      },
      {
        badge: '产品化输出',
        title: '自动匹配回复表情包和下一轮互动建议',
        body: input.desiredOutcome?.trim()
          ? `系统会同步给出推荐回复表情包和可一键发送的短句「${scene.stickerSeed}」，并把下一轮互动往“${input.desiredOutcome.trim()}”这个目标上推进。`
          : `系统会同步给出推荐回复表情包和可一键发送的短句「${scene.stickerSeed}」，并匹配下一轮追问，让回复不只是一句话，而是一整套互动动作。`,
      },
    ],
    quickReplies: [
      scene.replySeed,
      input.threadContext?.trim()
        ? `你刚刚那句“${input.threadContext.trim()}”我很有感觉，这张图也太会补情绪了。`
        : `这张图的好看不止在画面，还在它把“${scene.cue}”传得特别准。`,
      input.desiredOutcome?.trim()
        ? `如果这轮想把气氛带到“${input.desiredOutcome.trim()}”，我会选更自然一点的接法。`
        : `我想把这张直接存进“${relationship.label}限定返图”文件夹里。`,
    ],
    launchPlan: [
      `落地入口：${context.label}。${context.value ?? ''}`,
      `关系调性：${relationship.label}。${relationship.value ?? ''}`,
      input.desiredOutcome?.trim()
        ? `推进目标：${input.desiredOutcome.trim()}。生成结果会围绕这个目标做连续互动编排。`
        : 'AI 输出形态：推荐回复表情包 + 文案回复卡 + 下一轮追问建议，形成连续互动。',
      '系统会在后端自动选择最合适的内部能力组合，前端只展示最终可执行结果。',
    ],
  } satisfies Experience
}

function formatConversationTurns(turns: ConversationTurn[] | null | undefined) {
  if (!Array.isArray(turns) || !turns.length) {
    return ''
  }

  return turns
    .map((turn) => {
      const speaker = turn?.speaker?.trim() || '对方'
      const text = turn?.text?.trim() || ''
      return text ? `${speaker}：${text}` : ''
    })
    .filter(Boolean)
    .join('\n')
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function optimizeImageFile(file: File) {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      resolve(result)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image()
    element.onload = () => resolve(element)
    element.onerror = () => reject(new Error('image_load_failed'))
    element.src = rawDataUrl
  })

  const maxEdge = 1600
  const ratio = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * ratio))
  const height = Math.max(1, Math.round(image.naturalHeight * ratio))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context2d = canvas.getContext('2d')
  if (!context2d) {
    return { previewUrl: rawDataUrl, uploadUrl: rawDataUrl }
  }

  context2d.drawImage(image, 0, 0, width, height)

  const uploadUrl =
    file.type === 'image/png'
      ? canvas.toDataURL('image/jpeg', 0.9)
      : canvas.toDataURL(file.type.startsWith('image/') ? file.type : 'image/jpeg', 0.9)

  return {
    previewUrl: rawDataUrl,
    uploadUrl,
  }
}

export default function App() {
  const shellRef = useRef<HTMLDivElement | null>(null)
  const battleGridRef = useRef<HTMLElement | null>(null)
  const logsEndRef = useRef<HTMLDivElement | null>(null)
  const uploadPanelRef = useRef<HTMLElement | null>(null)
  const renderPanelRef = useRef<HTMLElement | null>(null)
  const ammoPanelRef = useRef<HTMLElement | null>(null)
  const defaultFocus = savedPrefs.focus ?? focusOptions[0].value ?? ''
  const defaultDesiredOutcome = savedPrefs.desiredOutcome ?? targetOptions[1].value ?? ''

  const [sceneId, setSceneId] = useState(initialIds.sceneId)
  const [battleStyleId, setBattleStyleId] = useState(initialIds.battleStyleId)
  const [contextId, setContextId] = useState(initialIds.contextId)
  const [relationshipId, setRelationshipId] = useState(initialIds.relationshipId)
  const [focus, setFocus] = useState(defaultFocus)
  const [threadContext, setThreadContext] = useState('')
  const [desiredOutcome, setDesiredOutcome] = useState(defaultDesiredOutcome)
  const [imageDataUrl, setImageDataUrl] = useState<string>('')
  const [imageName, setImageName] = useState('')
  const [inputAnalysis, setInputAnalysis] = useState<InputAnalysis | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAnalyzingInput, setIsAnalyzingInput] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [generationStep, setGenerationStep] = useState(0)
  const [logs, setLogs] = useState<BattleLog[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [battleTelemetry, setBattleTelemetry] = useState<BattleTelemetry | null>(null)
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>('workbench')
  const [showManualTuning, setShowManualTuning] = useState(false)
  const [styleTouchedManually, setStyleTouchedManually] = useState(false)
  const [goalTouchedManually, setGoalTouchedManually] = useState(false)
  const [focusTouchedManually, setFocusTouchedManually] = useState(false)
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'incoming' | 'outgoing'; speaker: string; text: string }>>([])
  const [pendingOpponentMessage, setPendingOpponentMessage] = useState('')
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false)
  const [health, setHealth] = useState<HealthState>({
    ok: false,
    mode: 'unknown',
    message: '正在检查后端连接',
  })
  const [experience, setExperience] = useState<Experience>(() =>
    createLocalExperience({
      sceneId: initialIds.sceneId,
      modeId: getBattleStyle(initialIds.battleStyleId).modeId,
      contextId: initialIds.contextId,
      relationshipId: initialIds.relationshipId,
      focus: defaultFocus,
      threadContext: '',
      desiredOutcome: defaultDesiredOutcome,
    }),
  )
  const [selectedReply, setSelectedReply] = useState(experience.quickReplies[0] ?? '')

  const scene = getScene(sceneId)
  const battleStyle = getBattleStyle(battleStyleId)
  const context = getContext(contextId)
  const relationship = getRelationship(relationshipId)
  const battleMode = getMode(battleStyle.modeId)
  const targetOption = getOptionByValue(targetOptions, desiredOutcome, targetOptions[1])
  const focusOption = getOptionByValue(focusOptions, focus, focusOptions[0])
  const recommendedStyle = inputAnalysis?.suggestedBattleStyleId
    ? getBattleStyle(inputAnalysis.suggestedBattleStyleId)
    : battleStyle
  const recommendedMode = getMode(recommendedStyle.modeId)
  const recommendedGoal = inputAnalysis
    ? getAutoGoal(inputAnalysis.inputType, relationship.id)
    : targetOption
  const recommendedFocus = inputAnalysis
    ? getAutoFocus(inputAnalysis.inputType, relationship.id)
    : focusOption
  const styleOverrideActive = recommendedStyle.id !== battleStyle.id
  const goalOverrideActive = recommendedGoal.value !== desiredOutcome
  const focusOverrideActive = recommendedFocus.value !== focus
  const agentDecisionSummary =
    inputAnalysis?.inputType === 'chat_screenshot'
      ? '先读聊天上下文，再决定回击力度和接话方向。'
      : inputAnalysis?.inputType === 'meme'
        ? '先识别梗感和挑衅信号，再从回复表情包库里选最合适的回法。'
        : imageDataUrl
          ? '先看画面主体和情绪温度，再决定更适合回文案还是回图。'
          : `当前先按「${scene.title}」这组默认语境启动 Agent 判断。`
  const agentReasonTags =
    inputAnalysis?.emotionTags?.length
      ? inputAnalysis.emotionTags.join(' / ')
      : `${scene.mood} / ${scene.cue}`
  const agentPlanCards = [
    {
      label: '输入判断',
      value: inputAnalysis ? inputTypeLabels[inputAnalysis.inputType] : '默认语境预设',
      note: inputAnalysis?.subject || scene.title,
    },
    {
      label: '推荐策略',
      value: recommendedStyle.name,
      note: `${recommendedMode.label} · ${styleOverrideActive ? '当前已被你手动覆盖' : '当前正在采用'}`,
    },
    {
      label: '本轮目标',
      value: recommendedGoal.label,
      note: `${recommendedGoal.value || '先接住，再推进下一轮互动。'}${goalOverrideActive ? ' · 当前已被你手动改写' : ''}`,
    },
    {
      label: '语气边界',
      value: recommendedFocus.label,
      note: `${recommendedFocus.value || '像真人、够自然、可直接发出去。'}${focusOverrideActive ? ' · 当前已被你手动改写' : ''}`,
    },
  ]
  const memeCaption = selectedReply || experience.quickReplies[0] || '装得挺像，继续。'
  const detectedOpponentLine =
    inputAnalysis?.lastOpponentMessage || threadContext || ''
  const detectedConversationText =
    formatConversationTurns(inputAnalysis?.conversationTurns) ||
    inputAnalysis?.threadContextSuggestion ||
    detectedOpponentLine
  const previewHistory =
    inputAnalysis?.conversationTurns?.length
      ? inputAnalysis.conversationTurns.map((turn) => ({
          role: turn.speaker.includes('我') ? 'outgoing' : 'incoming',
          speaker: turn.speaker,
          text: turn.text,
        }))
      : detectedOpponentLine
        ? [{ role: 'incoming', speaker: '对方', text: detectedOpponentLine }]
        : []
  const aiReplyCandidates = Array.from(
    new Set([selectedReply, ...experience.quickReplies].filter((reply): reply is string => Boolean(reply))),
  ).map((reply, index) => ({
    role: 'outgoing' as const,
    speaker: index === 0 ? 'AI 推荐' : `AI 备选 ${index}`,
    text: reply,
    isPrimary: index === 0,
  }))
  const memePreviewUrl = battleTelemetry?.memeGeneratorTemplate?.key
    ? `/reply-meme-previews/${battleTelemetry.memeGeneratorTemplate.key}.png`
    : ''
  const extractHint =
    inputAnalysis?.inputType === 'meme'
      ? '当前上传内容已经是单张表情包，可以直接提取保存。'
      : inputAnalysis?.inputType === 'chat_screenshot'
        ? '当前上传内容是聊天截图，先支持保存原图；如果你要，我后面还能继续补智能裁出表情包。'
        : imageDataUrl
          ? '当前上传内容可以直接保存为素材，方便继续斗图。'
          : '上传一张表情包或聊天截图后，这里会出现提取按钮。'
  const styleTokens = {
    '--accent-a': battleStyle.palette[0],
    '--accent-b': battleStyle.palette[1],
    '--accent-c': battleStyle.palette[2],
  } as CSSProperties

  function scrollGridToTop(behavior: ScrollBehavior = 'smooth') {
    if (battleGridRef.current) {
      battleGridRef.current.scrollTo({ top: 0, left: 0, behavior })
    }
    window.scrollTo({ top: 0, left: 0, behavior })
  }

  function focusSection(target: HTMLElement | null, tab: SidebarTab, message: string) {
    setActiveSidebarTab(tab)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setToastMessage(message)
  }

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    const syncHealth = async (signal?: AbortSignal) => {
      try {
        const response = await fetch('/api/health', { signal })

        if (!response.ok) {
          throw new Error('health request failed')
        }

        const payload = (await response.json()) as HealthState

        if (active) {
          setHealth(payload)
        }
      } catch (error) {
        if (!active || (error instanceof DOMException && error.name === 'AbortError')) {
          return
        }

        setHealth({
          ok: false,
          mode: 'unknown',
          message: '后端暂未连通，当前可先使用本地 fallback 演示。',
        })
      }
    }

    const syncIfVisible = () => {
      if (document.visibilityState === 'visible') {
        void syncHealth()
      }
    }

    void syncHealth(controller.signal)

    const intervalId = window.setInterval(syncIfVisible, 15000)
    window.addEventListener('focus', syncIfVisible)
    window.addEventListener('pageshow', syncIfVisible)
    document.addEventListener('visibilitychange', syncIfVisible)

    return () => {
      active = false
      controller.abort()
      window.clearInterval(intervalId)
      window.removeEventListener('focus', syncIfVisible)
      window.removeEventListener('pageshow', syncIfVisible)
      document.removeEventListener('visibilitychange', syncIfVisible)
    }
  }, [])

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    const resetScroll = () => {
      if (battleGridRef.current) {
        battleGridRef.current.scrollTop = 0
        battleGridRef.current.scrollLeft = 0
      }
      window.scrollTo(0, 0)
    }

    resetScroll()
    const rafId = window.requestAnimationFrame(resetScroll)
    window.addEventListener('pageshow', resetScroll)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('pageshow', resetScroll)
    }
  }, [])

  useEffect(() => {
    setSelectedReply((current) => {
      if (experience.quickReplies.includes(current)) {
        return current
      }
      return experience.quickReplies[0] ?? ''
    })
  }, [experience])

  useEffect(() => {
    if (!inputAnalysis) {
      return
    }

    if (!styleTouchedManually) {
      setBattleStyleId(recommendedStyle.id)
    }

    if (!goalTouchedManually) {
      setDesiredOutcome(recommendedGoal.value ?? targetOptions[1].value ?? '')
    }

    if (!focusTouchedManually) {
      setFocus(recommendedFocus.value ?? focusOptions[0].value ?? '')
    }

  }, [
    focusTouchedManually,
    goalTouchedManually,
    inputAnalysis,
    recommendedFocus,
    recommendedGoal,
    recommendedStyle,
    styleTouchedManually,
  ])

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  useEffect(() => {
    if (!toastMessage) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setToastMessage('')
    }, 1800)

    return () => window.clearTimeout(timer)
  }, [toastMessage])

  // Save user preferences to localStorage
  useEffect(() => {
    savePreferences({
      battleStyleId,
      contextId,
      relationshipId,
      focus,
      desiredOutcome,
    })
  }, [battleStyleId, contextId, relationshipId, focus, desiredOutcome])

  useLayoutEffect(() => {
    if (!shellRef.current) {
      return undefined
    }

    const ctx = gsap.context(() => {
      gsap.set(['.battle-sidebar', '.battle-header', '.battle-control-column', '.battle-output-column'], {
        autoAlpha: 0,
        y: 24,
      })

      const intro = gsap.timeline({
        defaults: {
          ease: 'power3.out',
          duration: 0.62,
        },
      })

      intro
        .to('.battle-sidebar', { autoAlpha: 1, y: 0 })
        .to('.battle-header', { autoAlpha: 1, y: 0 }, '-=0.4')
        .to(['.battle-control-column', '.battle-output-column'], { autoAlpha: 1, y: 0, stagger: 0.12 }, '-=0.34')

      gsap.fromTo(
        '.pulse-orb',
        { y: 0, scale: 1 },
        {
          y: -16,
          scale: 1.05,
          duration: 5.8,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          stagger: 0.9,
        },
      )
    }, shellRef)

    return () => ctx.revert()
  }, [])

  useLayoutEffect(() => {
    if (!shellRef.current || !hasGenerated) {
      return undefined
    }

    const ctx = gsap.context(() => {
      gsap.from(['.intel-card', '.ammo-chip', '.send-message', '.battle-toolbar button'], {
        autoAlpha: 0,
        y: 16,
        duration: 0.4,
        ease: 'power2.out',
        stagger: 0.05,
        clearProps: 'all',
      })
      gsap.from('.battle-output-stack > *', {
        autoAlpha: 0,
        y: 14,
        duration: 0.42,
        ease: 'power2.out',
        stagger: 0.06,
        clearProps: 'all',
      })
    }, shellRef)

    return () => ctx.revert()
  }, [hasGenerated, experience, selectedReply])

  function addLog(text: string, type: BattleLog['type'] = 'info') {
    setLogs((current) => [...current, { id: Date.now() + Math.random(), text, type }])
  }

  async function analyzeUploadedInput(uploadUrl: string, name: string) {
    const response = await fetch('/api/battle/analyze-input', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageDataUrl: uploadUrl,
        imageName: name,
        threadContext,
        focus,
        battleStyleId,
      }),
    })

    if (!response.ok) {
      throw new Error(`analyze failed: ${response.status}`)
    }

    return (await response.json()) as {
      analysis: InputAnalysis
      mode?: 'ark' | 'fallback'
      supportsImageInput?: boolean
      recommendedTemplates?: MemeTemplate[]
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const optimized = await optimizeImageFile(file)
      setImageName(file.name)
      setImageDataUrl(optimized.uploadUrl)
      setInputAnalysis(null)
      setBattleTelemetry(null)
      setHasGenerated(false)
      setLogs([])
      setGenerationStep(0)
      setIsAnalyzingInput(true)
      setToastMessage('敌方火力已锁定，正在分析这是聊天截图还是表情包。')

      const payload = await analyzeUploadedInput(optimized.uploadUrl, file.name)
      const analysis = payload.analysis
      setInputAnalysis(analysis)
      setStyleTouchedManually(false)
      setGoalTouchedManually(false)
      setFocusTouchedManually(false)
      setThreadContext(
        analysis.inputType === 'chat_screenshot'
          ? formatConversationTurns(analysis.conversationTurns) ||
              analysis.threadContextSuggestion ||
              analysis.lastOpponentMessage ||
              ''
          : '',
      )
      setToastMessage(
        analysis.inputType === 'chat_screenshot'
          ? '已识别为聊天截图，并自动回填上一轮对话。'
          : `已识别为${inputTypeLabels[analysis.inputType] ?? '社交图片'}，不会自动脑补聊天原话。`,
      )

      if (payload.mode) {
        setHealth((current) => ({
          ...current,
          ok: true,
          mode: payload.mode ?? current.mode,
          supportsImageInput: payload.supportsImageInput ?? current.supportsImageInput,
          message:
            payload.mode === 'ark'
              ? payload.supportsImageInput
                ? '后端已连接火山方舟 Ark，可分析聊天截图和图片内容。'
                : '后端已连接火山方舟 Ark，当前模型按文本模式运行。'
              : '当前后端运行在 fallback 模式，图片分析会退回演示逻辑。',
        }))
      }
    } catch {
      setToastMessage('这张图读取失败了，换一张试试。')
    } finally {
      setIsAnalyzingInput(false)
    }
    event.target.value = ''
  }

  function resetTarget() {
    setImageDataUrl('')
    setImageName('')
    setInputAnalysis(null)
    setStyleTouchedManually(false)
    setGoalTouchedManually(false)
    setFocusTouchedManually(false)
    setBattleTelemetry(null)
    setHasGenerated(false)
    setLogs([])
    setGenerationStep(0)
    setToastMessage('已切回演示目标，可继续调试整条链路。')
  }

  async function copyText(text: string, successMessage: string, fallbackMessage: string) {
    try {
      await navigator.clipboard.writeText(text)
      setToastMessage(successMessage)
    } catch {
      setToastMessage(fallbackMessage)
    }
  }

  async function handleCopyReply(text: string) {
    setSelectedReply(text)
    await copyText(text, '反击文案已复制到剪贴板。', '剪贴板写入失败，但这条文案已选中，可直接手动复制。')
  }

  async function handleShareAmmo() {
    await copyText(
      `${memeCaption}\n\n${experience.nextStep}`,
      '战斗文案已复制，可直接发回聊天窗口。',
      '复制失败，但内容已经准备好，可以手动带走。',
    )
  }

  async function handleCopyMemeSuggestion() {
    const templateLabel = battleTelemetry?.memeGeneratorTemplate?.label || '待匹配'
    const templateDescription = battleTelemetry?.memeGeneratorTemplate?.description || '等待 AI 先选出合适的回复表情包。'
    await copyText(
      `推荐回复表情包：${templateLabel}\n说明：${templateDescription}`,
      '表情包建议已复制。',
      '复制失败了，但建议内容还在页面里。',
    )
  }

  async function downloadImageAsset(url: string, filename: string, successMessage: string, failureMessage: string) {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = filename
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(objectUrl)
      setToastMessage(successMessage)
    } catch {
      setToastMessage(failureMessage)
    }
  }

  async function handleExtractUploadedMeme() {
    if (!imageDataUrl) {
      setToastMessage('先上传一张图，才能提取表情包。')
      return
    }

    const extension = imageName?.toLowerCase().endsWith('.png') ? 'png' : 'jpg'
    await downloadImageAsset(
      imageDataUrl,
      `source-sticker.${extension}`,
      '已开始下载当前上传内容。',
      '提取当前上传内容失败了。',
    )
  }

  async function handleDownloadReplyMeme() {
    if (!memePreviewUrl) {
      setToastMessage('先生成一轮结果，AI 选出回复表情包后才能下载。')
      return
    }

    const templateName = battleTelemetry?.memeGeneratorTemplate?.key || 'reply-meme'
    await downloadImageAsset(
      memePreviewUrl,
      `${templateName}.png`,
      '推荐回复表情包已开始下载。',
      '下载推荐回复表情包失败了。',
    )
  }

  async function handleGenerate() {
    setIsGenerating(true)
    setHasGenerated(false)
    setGenerationStep(0)
    setLogs([])
    setErrorMessage('')

    const fallback = createLocalExperience({
      sceneId,
      modeId: battleStyle.modeId,
      contextId,
      relationshipId,
      focus,
      imageName,
      threadContext,
      desiredOutcome,
    })

    const requestPromise = fetch('/api/battle/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sceneId,
        modeId: battleStyle.modeId,
        battleStyleId,
        battleStyleName: battleStyle.name,
        battlePalette: battleStyle.palette,
        contextId,
        relationshipId,
        focus,
        imageDataUrl,
        imageName,
        inputAnalysis,
        threadContext,
        desiredOutcome,
        sceneTitle: scene.title,
        sceneCue: scene.cue,
        sceneMood: scene.mood,
        sceneProductFit: scene.productFit,
      }),
      })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`generate failed: ${response.status}`)
        }

        return (await response.json()) as {
          experience: Experience
          battle?: BattleTelemetry
          analysis?: InputAnalysis
          mode?: 'ark' | 'fallback'
          supportsImageInput?: boolean
        }
      })

    try {
      setGenerationStep(1)
      addLog('[VLM 视觉中枢] 正在接入图像数据流...', 'system')
      await sleep(420)
      addLog(
        imageName
          ? `> 已锁定敌方素材：${imageName}`
          : `> 未上传真实图片，切换到 Agent 默认语境：「${scene.title}」`,
        'info',
      )
      addLog(
        inputAnalysis
          ? `> 输入识别：${inputTypeLabels[inputAnalysis.inputType]} / ${inputAnalysis.subject}`
          : `> 画面基调提取：${scene.cue}`,
        'success',
      )
      if (inputAnalysis?.lastOpponentMessage) {
        addLog(`> 自动抽取上一轮：${inputAnalysis.lastOpponentMessage}`, 'info')
      }

      setGenerationStep(2)
      await sleep(520)
      addLog('[Emotion Router] 情绪与挑衅指数分析启动', 'system')
      addLog(`> 检测到高频标签：${scene.mood} / 挑衅倾向 / 可玩梗空间`, 'warning')
      addLog(`> 已切换【${battleStyle.name}】反击战术`, 'info')
      addLog('[Agent Planner] 正在协调内部表达能力...', 'system')
      addLog('> 已根据输入语境自动收紧回复风格和表情包匹配。', 'success')

      setGenerationStep(3)
      await sleep(560)
      addLog('[LLM 嘴替引擎] 正在生成反击文案...', 'system')

      const payload = await requestPromise
      const nextExperience = payload.experience ?? fallback
      if (payload.analysis) {
        setInputAnalysis(payload.analysis)
      }

      startTransition(() => {
        setExperience(nextExperience)
      })
      setBattleTelemetry(payload.battle ?? null)
      setSelectedReply(payload.battle?.caption || nextExperience.quickReplies[0] || '')

      if (payload.mode) {
        setHealth((current) => ({
          ...current,
          ok: true,
          mode: payload.mode ?? current.mode,
          supportsImageInput: payload.supportsImageInput ?? current.supportsImageInput,
          message:
            payload.mode === 'ark'
              ? payload.supportsImageInput
                ? '后端已连接火山方舟 Ark，可按真实图片生成结构化结果。'
                : '后端已连接火山方舟 Ark，当前模型按文本模式运行。'
              : '当前后端运行在 fallback 模式，便于无 key 情况下演示。',
        }))
      }

      if (payload.battle?.subject) {
        addLog(`> 识别主体：${payload.battle.subject}`, 'info')
      }
      if (payload.battle?.emotionTags?.length) {
        addLog(`> 情绪标签：${payload.battle.emotionTags.join(' / ')}`, 'warning')
      }
      if (typeof payload.battle?.provocationScore === 'number') {
        addLog(`> 挑衅指数：${payload.battle.provocationScore}/100`, 'info')
      }
      if (payload.battle?.attackVector) {
        addLog(`> 反击切口：${payload.battle.attackVector}`, 'info')
      }
      if (payload.battle?.memeGeneratorTemplate?.label || payload.battle?.memeTemplate?.label) {
        addLog(
          `> 表情包模板：${payload.battle?.memeGeneratorTemplate?.label || payload.battle?.memeTemplate?.label}`,
          'success',
        )
      }
      addLog(`> 嘴替主句锁定：“${payload.battle?.caption || nextExperience.quickReplies[0] || memeCaption}”`, 'success')

      setGenerationStep(4)
      await sleep(480)
      addLog('[Meme Selector] 正在匹配最适合回过去的回复表情包...', 'system')
      addLog('> 已切换为“选回复表情包 + 给文案”模式，不再把原图容进新表情包。', 'success')
      addLog('[系统] 回复表情包与文案已备好，可以直接发回战场。', 'success')

      setHasGenerated(true)
      recordPreferenceUsage()
      setToastMessage(
        payload.mode === 'ark' ? 'Ark 已生成一版真实结果。' : '当前展示的是 fallback 版反击结果。',
      )

      // Initialize chat history for multi-turn preview
      const history: Array<{ role: 'incoming' | 'outgoing'; speaker: string; text: string }> = []
      const analysisForHistory = payload.analysis ?? inputAnalysis
      const detectedLineForHistory =
        analysisForHistory?.lastOpponentMessage || threadContext || ''
      if (analysisForHistory?.conversationTurns?.length) {
        for (const turn of analysisForHistory.conversationTurns) {
          history.push({ role: turn.speaker.includes('我') ? 'outgoing' : 'incoming', speaker: turn.speaker, text: turn.text })
        }
      } else if (detectedLineForHistory) {
        history.push({ role: 'incoming', speaker: '对方', text: detectedLineForHistory })
      }
      const aiReply = payload.battle?.caption || nextExperience.quickReplies[0] || ''
      if (aiReply) {
        history.push({ role: 'outgoing', speaker: 'AI 推荐', text: aiReply })
      }
      setChatHistory(history)
      setPendingOpponentMessage('')
    } catch {
      startTransition(() => {
        setExperience(fallback)
      })
      setBattleTelemetry(null)
      setSelectedReply(fallback.quickReplies[0] || '')
      setGenerationStep(4)
      addLog('[系统] 后端未返回结果，自动切到本地兜底策略。', 'warning')
      addLog(`> 本地嘴替主句：“${fallback.quickReplies[0] ?? memeCaption}”`, 'success')
      setErrorMessage('本次请求没有拿到后端结果，已经自动切回本地 fallback 方案。')
      setHasGenerated(true)
      setToastMessage('后端请求失败，已切换到本地兜底结果。')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleContinueChat() {
    if (isGeneratingFollowUp) return
    const opponentMessage = pendingOpponentMessage.trim()
    if (!opponentMessage) {
      setToastMessage('先输入对方刚发来的那句话，再让 AI 帮你接。')
      return
    }
    setIsGeneratingFollowUp(true)

    try {
      const response = await fetch('/api/battle/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatHistory,
          battleStyleId,
          battleStyleName: battleStyle.name,
          contextId,
          relationshipId,
          focus,
          desiredOutcome,
          threadContext,
          inputAnalysis,
          opponentMessage,
          selectedReply,
          battleTelemetry,
          experience,
        }),
      })

      if (!response.ok) throw new Error(`follow-up failed: ${response.status}`)

      const payload = await response.json() as {
        aiReply: string
        quickReplies: string[]
      }

      setChatHistory((prev) => [
        ...prev,
        { role: 'incoming', speaker: '对方', text: opponentMessage },
        { role: 'outgoing', speaker: 'AI 推荐', text: payload.aiReply },
      ])
      setPendingOpponentMessage('')

      if (payload.quickReplies?.length) {
        setSelectedReply(payload.quickReplies[0])
        startTransition(() => {
          setExperience((prev) => ({
            ...prev,
            quickReplies: payload.quickReplies,
          }))
        })
      }

      setToastMessage('已生成下一轮互动。')
    } catch {
      setToastMessage('生成下一轮失败，请稍后重试。')
    } finally {
      setIsGeneratingFollowUp(false)
    }
  }

  return (
    <div className="app-shell battle-theme" ref={shellRef} style={styleTokens}>
      <div className="battle-background" aria-hidden="true">
        <span className="pulse-orb pulse-orb-a" />
        <span className="pulse-orb pulse-orb-b" />
        <span className="pulse-orb pulse-orb-c" />
      </div>

      <aside className="battle-sidebar">
        <div className="battle-sidebar-brand">
          <Zap className="battle-brand-icon" />
        </div>

        <div className="battle-sidebar-nav">
          <button
            type="button"
            className={activeSidebarTab === 'workbench' ? 'is-active' : ''}
            aria-label="斗图工作台"
            title="斗图工作台"
            onClick={() => {
              setActiveSidebarTab('workbench')
              scrollGridToTop()
              setToastMessage('已回到工作台顶部。')
            }}
          >
            <Swords size={18} />
          </button>
          <button
            type="button"
            className={activeSidebarTab === 'library' ? 'is-active' : ''}
            aria-label="嘴替策略库"
            title="嘴替策略库"
            onClick={() => focusSection(ammoPanelRef.current, 'library', '已跳到嘴替策略库。')}
          >
            <MessageSquareQuote size={18} />
          </button>
          <button
            type="button"
            className={activeSidebarTab === 'assets' ? 'is-active' : ''}
            aria-label="素材仓"
            title="素材仓"
            onClick={() => focusSection(renderPanelRef.current, 'assets', '已跳到表情包素材与输出区。')}
          >
            <ImageIcon size={18} />
          </button>
        </div>

        <button
          type="button"
          className="battle-sidebar-settings"
          aria-label="设置"
          title="回到顶部"
          onClick={() => {
            setActiveSidebarTab('workbench')
            focusSection(uploadPanelRef.current, 'workbench', '已定位到上传与配置区。')
          }}
        >
          <Settings2 size={18} />
        </button>
      </aside>

      <main className="battle-body">
        <header className="battle-header">
          <div className="battle-header-copy">
            <div className="battle-title-row">
              <BrainCircuit size={22} />
              <div>
                <h1>AI 社交互动 Agent 原型</h1>
                <p>Perception · Memory · Planning · Action</p>
              </div>
            </div>
          </div>

          <div className="battle-status-row">
            <span className={`battle-chip ${health.mode === 'ark' ? 'is-online' : health.mode === 'fallback' ? 'is-warn' : ''}`}>
              <strong>Backend</strong>
              {health.mode === 'ark'
                ? `Ark${health.model ? ` · ${health.model}` : ''}`
                : health.mode === 'fallback'
                  ? 'Fallback'
                  : 'Checking'}
            </span>
            <span className={`battle-chip ${errorMessage ? 'is-error' : ''}`}>
              <strong>Status</strong>
              {errorMessage ? '已启用兜底' : health.message}
            </span>
          </div>
        </header>

        <section className="battle-grid" ref={battleGridRef}>
          <section className="battle-control-column">
            <article
              className={`battle-panel ${activeSidebarTab === 'workbench' ? 'is-section-active' : ''}`}
              ref={uploadPanelRef}
            >
              <div className="battle-panel-heading">
                <h2>
                  <span className="battle-dot is-danger" />
                  多模态输入
                </h2>
                <p>支持聊天截图、表情包、普通图片。Agent 会先识别输入，再决定怎么回。</p>
              </div>

              <label className={`target-dropzone ${imageDataUrl ? 'has-image' : ''}`}>
                <input type="file" accept="image/*" onChange={handleFileChange} />

                {imageDataUrl ? (
                  <div className="target-preview">
                    <img src={imageDataUrl} alt={imageName || '敌方火力预览'} />
                    <div className="target-preview-overlay">
                      <button type="button" onClick={resetTarget}>
                        <RefreshCw size={14} />
                        重新锁定目标
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="target-placeholder">
                    <UploadCloud size={30} />
                    <strong>点击上传聊天截图 / 表情包 / 图片</strong>
                    <span>没有真实素材也能先用默认语境预设演示整条 Agent 链路。</span>
                  </div>
                )}
              </label>

              <div className="target-meta">
                <span>{imageName || `默认语境：${scene.title}`}</span>
                <small>
                  {inputAnalysis
                    ? `${inputTypeLabels[inputAnalysis.inputType]} · ${inputAnalysis.subject}`
                    : imageName
                      ? '真实火力已接入'
                      : scene.subtitle}
                </small>
              </div>
            </article>

            <article className="battle-panel">
              <div className="battle-panel-heading">
                <h2>
                  <Swords size={15} />
                  Agent 决策面板
                </h2>
                <p>Agent 先自动判断，再允许你做少量人工微调。</p>
              </div>

              <div className="agent-plan-grid">
                {agentPlanCards.map((card) => (
                  <article key={card.label} className="agent-plan-card">
                    <span>{card.label}</span>
                    <strong>{card.value}</strong>
                    <p>{card.note}</p>
                  </article>
                ))}
              </div>

              <div className="agent-decision-callout">
                <div>
                  <span className="micro-label">Agent Auto Decision</span>
                  <h3>{agentDecisionSummary}</h3>
                  <p>当前关键判断信号：{agentReasonTags}</p>
                  {savedPrefs.lastUsedAt ? (
                    <p className="preference-hint">
                      已恢复你上次使用时保存的偏好设置。
                    </p>
                  ) : null}
                </div>
                {styleOverrideActive ? (
                  <button
                    type="button"
                    className="ghost-action"
                    onClick={() => {
                      setStyleTouchedManually(false)
                      setBattleStyleId(recommendedStyle.id)
                    }}
                  >
                    改回 Agent 推荐人格
                  </button>
                ) : null}
              </div>

              <div className="panel-divider">
                <span>人工微调（可选）</span>
                <button
                  type="button"
                  className="panel-toggle"
                  onClick={() => setShowManualTuning((current) => !current)}
                >
                  {showManualTuning ? '收起人工微调' : '展开人工微调'}
                </button>
              </div>

              {showManualTuning ? (
                <>
                  <div className="tactic-grid">
                    {battleStyles.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        className={`tactic-card ${style.id === battleStyleId ? 'is-selected' : ''}`}
                        onClick={() => {
                          setStyleTouchedManually(true)
                          setBattleStyleId(style.id)
                        }}
                      >
                        <div className="tactic-card-title">
                          <span>{style.icon}</span>
                          <strong>{style.name}</strong>
                        </div>
                        <p>{style.description}</p>
                      </button>
                    ))}
                  </div>

                  <div className="battle-config-grid">
                    <label>
                      <span>战场入口</span>
                      <select value={contextId} onChange={(event) => setContextId(event.target.value)}>
                        {contexts.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span>关系距离</span>
                      <select value={relationshipId} onChange={(event) => setRelationshipId(event.target.value)}>
                        {relationships.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span>默认语境</span>
                      <select value={sceneId} onChange={(event) => setSceneId(event.target.value)}>
                        {demoScenes.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.title}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span>底层策略</span>
                      <div className="readonly-pill">{battleMode.label}</div>
                    </label>
                  </div>

                  <div className="battle-notes">
                    <label>
                      <span>对话记忆（支持自动回填）</span>
                      <textarea
                        value={threadContext}
                        onChange={(event) => setThreadContext(event.target.value)}
                        placeholder="比如：对方先发了什么、有没有明显挑衅。"
                      />
                      <small className="battle-note-meta">
                        {isAnalyzingInput
                          ? 'AI 正在从截图里抽取整段可读对话。'
                          : detectedConversationText
                            ? `AI 已识别：${detectedConversationText}`
                            : '上传聊天截图后，这里会自动回填整段可读对话内容。'}
                      </small>
                    </label>

                    <label>
                      <span>Agent 目标</span>
                      <select
                        value={desiredOutcome}
                        onChange={(event) => {
                          setGoalTouchedManually(true)
                          setDesiredOutcome(event.target.value)
                        }}
                      >
                        {targetOptions.map((item) => (
                          <option key={item.id} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span>语气边界</span>
                      <select
                        value={focus}
                        onChange={(event) => {
                          setFocusTouchedManually(true)
                          setFocus(event.target.value)
                        }}
                      >
                        {focusOptions.map((item) => (
                          <option key={item.id} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </>
              ) : null}
            </article>

            <article className="battle-panel terminal-shell">
              <div className="battle-panel-heading terminal-heading">
                <h2>
                  <Terminal size={15} />
                  Agent 决策轨迹
                </h2>
                <p>这里展示 Agent 从识别到执行的整条动作链。</p>
              </div>

              <div className="terminal-screen">
                {logs.length === 0 ? (
                  <div className="terminal-idle">Waiting for target image and battle command...</div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className={`terminal-line is-${log.type}`}>
                      {log.text}
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
                <div className="terminal-scanlines" aria-hidden="true" />
              </div>
            </article>

            <button type="button" className="battle-cta" onClick={handleGenerate} disabled={isGenerating || isAnalyzingInput}>
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="spin" />
                  Agent 正在执行...
                </>
              ) : isAnalyzingInput ? (
                <>
                  <Loader2 size={18} className="spin" />
                  Agent 正在分析输入...
                </>
              ) : (
                <>
                  <Zap size={18} />
                  让 Agent 出手
                </>
              )}
            </button>
          </section>

          <section className="battle-output-column">
            <article className="battle-panel pipeline-panel">
              <div className="pipeline-row">
                {pipelineStages.map((label, index) => (
                  <div key={label} className="pipeline-item">
                    <div className={`pipeline-node ${generationStep > index + 1 ? 'is-done' : generationStep === index + 1 ? 'is-active' : ''}`}>
                      {generationStep > index + 1 ? <CheckCircle2 size={14} /> : <span>{index + 1}</span>}
                    </div>
                    <span>{label}</span>
                    {index < pipelineStages.length - 1 ? (
                      <div className="pipeline-connector">
                        <div
                          className="pipeline-connector-fill"
                          style={{
                            width:
                              generationStep > index + 1
                                ? '100%'
                                : generationStep === index + 1
                                  ? '50%'
                                  : '0%',
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </article>

            <article
              className={`battle-panel render-panel ${activeSidebarTab === 'assets' ? 'is-section-active' : ''}`}
              ref={renderPanelRef}
            >
              <div className="render-panel-head">
                <div>
                  <span className="micro-label">Battle Output</span>
                  <h3>Agent 执行动作</h3>
                </div>

                <div className="render-meta">
                  <span>{battleStyle.name}</span>
                  <span>
                    {battleTelemetry?.memeGeneratorTemplate?.label ||
                      battleTelemetry?.memeTemplate?.label ||
                      (inputAnalysis ? inputTypeLabels[inputAnalysis.inputType] : '待选模板')}
                  </span>
                  <span>{health.supportsImageInput ? '图像理解已启用' : '文本模式'}</span>
                </div>
              </div>

              {!hasGenerated && !isGenerating ? (
                <div className="battle-canvas idle" style={styleTokens}>
                  <div className="battle-canvas-empty">
                    <Sparkles size={34} />
                    <p>等待分析敌方火力...</p>
                    <span>先上传图片，或者直接用左侧默认语境预设打通整条 Agent 链路。</span>
                  </div>
                </div>
              ) : (
                <div className="battle-canvas ready" style={styleTokens}>
                  <div className={`battle-output-stack ${isGenerating ? 'is-processing' : ''}`}>
                    <div className="meme-pick-card">
                      <span className="micro-label">Reply Meme</span>
                      {memePreviewUrl ? (
                        <div className="meme-pick-preview">
                          <img src={memePreviewUrl} alt={battleTelemetry?.memeGeneratorTemplate?.label || '推荐回复表情包'} />
                        </div>
                      ) : null}
                      <h4>{battleTelemetry?.memeGeneratorTemplate?.label || '待匹配回复表情包'}</h4>
                      <p>
                        {battleTelemetry?.memeGeneratorTemplate?.description ||
                          '上传图片后，AI 会从回复表情包库里挑一个最适合发回去的。'}
                      </p>
                      <div className="meme-pick-meta">
                        <span>{inputAnalysis ? inputTypeLabels[inputAnalysis.inputType] : '待识别输入'}</span>
                        <span>{battleStyle.name}</span>
                        <span>{relationship.label}</span>
                      </div>
                    </div>

                    <div className="reply-copy-card">
                      <span className="micro-label">Reply Copy</span>
                      <h4>{memeCaption}</h4>
                      <p>{experience.nextStep}</p>
                    </div>
                  </div>

                  <div className="battle-toolbar">
                    <button type="button" onClick={handleCopyMemeSuggestion}>
                      <Share2 size={16} />
                      复制表情包建议
                    </button>
                    <button type="button" onClick={handleShareAmmo}>
                      <MessageSquareQuote size={16} />
                      复制整套回复
                    </button>
                  </div>
                </div>
              )}
            </article>

            <div className="battle-info-grid">
              <article className="battle-panel intel-card">
                <span className="micro-label">Input Reading</span>
                <h4>输入理解</h4>
                <p>{inputAnalysis?.visualSummary || experience.visualSignal}</p>
              </article>

              <article className="battle-panel intel-card">
                <span className="micro-label">Strategy Route</span>
                <h4>策略理由</h4>
                <p>{battleTelemetry?.attackVector || experience.signal}</p>
              </article>

              <article
                className={`battle-panel intel-card full-width ${activeSidebarTab === 'library' ? 'is-section-active' : ''}`}
                ref={ammoPanelRef}
              >
                <div className="intel-card-head">
                  <div>
                    <span className="micro-label">Meme Tools</span>
                    <h4>表情包提取</h4>
                  </div>
                  <small>把当前上传内容和 AI 推荐图直接存下来。</small>
                </div>
                <p>{extractHint}</p>
                <div className="extract-actions">
                  <button type="button" onClick={handleExtractUploadedMeme}>
                    提取当前上传内容
                  </button>
                  <button type="button" onClick={handleDownloadReplyMeme}>
                    下载推荐回复表情包
                  </button>
                </div>
              </article>

              <article className="battle-panel intel-card full-width">
                <div className="intel-card-head">
                  <div>
                    <span className="micro-label">Agent Reply Pack</span>
                    <h4>可直接执行的回复方案</h4>
                  </div>
                  <small>点一下就复制，不会刷新页面。</small>
                </div>

                <div className="ammo-bank">
                  {experience.quickReplies.map((reply) => (
                    <button
                      key={reply}
                      type="button"
                      className={`ammo-chip ${reply === selectedReply ? 'is-selected' : ''}`}
                      onClick={() => handleCopyReply(reply)}
                    >
                      {reply}
                    </button>
                  ))}
                </div>

                {battleTelemetry ? (
                  <div className="battle-telemetry">
                    <span>{battleTelemetry.subject}</span>
                    <span>{`挑衅指数 ${battleTelemetry.provocationScore}`}</span>
                    <span>{battleTelemetry.emotionTags.join(' / ')}</span>
                    {battleTelemetry.memeGeneratorTemplate ? (
                      <span>{battleTelemetry.memeGeneratorTemplate.label}</span>
                    ) : battleTelemetry.memeTemplate ? (
                      <span>{battleTelemetry.memeTemplate.label}</span>
                    ) : null}
                  </div>
                ) : null}
              </article>

              <article className="battle-panel intel-card full-width">
                <div className="intel-card-head">
                  <div>
                    <span className="micro-label">Action Preview</span>
                    <h4>模拟聊天框</h4>
                  </div>
                  <small>
                    {context.label} · {relationship.label}
                  </small>
                </div>

                <div className="send-chat">
                  {chatHistory.length ? (
                    chatHistory.map((message, index) => (
                      <article
                        key={`${message.speaker}-${index}-${message.text}`}
                        className={`send-message ${message.role}`}
                      >
                        <span>{message.speaker}</span>
                        <p>{message.text}</p>
                      </article>
                    ))
                  ) : previewHistory.length ? (
                    previewHistory.map((message, index) => (
                      <article
                        key={`${message.speaker}-${index}-${message.text}`}
                        className={`send-message ${message.role}`}
                      >
                        <span>{message.speaker}</span>
                        <p>{message.text}</p>
                      </article>
                    ))
                  ) : (
                    <article className="send-message system">
                      <span>聊天记录</span>
                      <p>当前还没有输入聊天内容。上传聊天截图或填写上一轮对话后，这里会按聊天气泡展示。</p>
                    </article>
                  )}

                  {!chatHistory.length && aiReplyCandidates.map((message) => (
                    <article
                      key={`${message.speaker}-${message.text}`}
                      className={`send-message outgoing ${message.isPrimary ? 'is-primary' : ''}`}
                    >
                      <span>{message.speaker}</span>
                      <p>{message.text}</p>
                    </article>
                  ))}

                  {hasGenerated && (
                    <div className="follow-up-composer">
                      <label className="follow-up-input">
                        <span>对方刚发了什么</span>
                        <textarea
                          value={pendingOpponentMessage}
                          onChange={(event) => setPendingOpponentMessage(event.target.value)}
                          placeholder="这里由你自己输入对方下一句，AI 只负责帮你接下一句。"
                        />
                      </label>
                      <button
                        type="button"
                        className="follow-up-button"
                        onClick={handleContinueChat}
                        disabled={isGeneratingFollowUp || !pendingOpponentMessage.trim()}
                      >
                        {isGeneratingFollowUp ? '正在生成这一轮回复...' : '根据这句继续往下回 →'}
                      </button>
                    </div>
                  )}
                </div>
              </article>

              <article className="battle-panel intel-card full-width">
                <div className="intel-card-head">
                  <div>
                    <span className="micro-label">Agent Expansion</span>
                    <h4>后续落地路线</h4>
                  </div>
                  <small>从原型演示走向真实社交助手。</small>
                </div>

                <div className="launch-checklist">
                  {experience.launchPlan.map((item, index) => (
                    <article key={item}>
                      <span>{`0${index + 1}`}</span>
                      <p>{item}</p>
                    </article>
                  ))}
                </div>
              </article>
            </div>
          </section>
        </section>
      </main>

      {toastMessage ? <div className="battle-toast">{toastMessage}</div> : null}
    </div>
  )
}
