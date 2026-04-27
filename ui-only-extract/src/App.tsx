import { useEffect, useLayoutEffect, useRef, useState, startTransition } from 'react'
import type { ChangeEvent, CSSProperties } from 'react'
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
  palette: [string, string, string]
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

const demoScenes: Scene[] = [
  {
    id: 'campus-cat',
    title: '校园偶遇小猫',
    subtitle: '治愈感、高互动意愿、非常适合发图接话',
    cue: '柔软、轻松、让人想继续聊',
    mood: '疗愈向',
    productFit: '适合做陪伴式回复和贴纸化内容生成',
    imageLabel: '晚自习后在教学楼台阶边偶遇一只懒洋洋的小猫',
    replySeed: '你这张图一发出来，今天的疲惫感像被小猫替你收走了一半。',
    followUpSeed: '它最后有没有回头看你？这种小瞬间真的很适合被收藏成一天的结束语。',
    stickerSeed: '今日回血 / 猫猫批准你下班 / 情绪已被接住',
    palette: ['#ffd36f', '#ff835c', '#8f4dff'],
  },
  {
    id: 'concert-night',
    title: '演唱会返图',
    subtitle: '高情绪密度，最容易做出“专属回复”惊喜感',
    cue: '热烈、闪光、适合把情绪值再推高一点',
    mood: '高能向',
    productFit: '适合生成情绪延展文案和二次互动话题',
    imageLabel: '灯海亮起的瞬间，你举起手机拍下舞台和人群的合唱',
    replySeed:
      '这不是返图，是你今天情绪值满格的证据，我隔着屏幕都能听见现场的尖叫感。',
    followUpSeed:
      '如果只让你留一句今晚的标题，你会写“值回票价”还是“舍不得散场”？',
    stickerSeed: '今晚封神 / 情绪超频 / 返图请继续',
    palette: ['#ff9a5a', '#ff4f87', '#6f5bff'],
  },
  {
    id: 'deadline-night',
    title: '深夜赶 ddl',
    subtitle: '真实校园痛点，最能体现“懂你”的 AI 回法',
    cue: '克制、辛苦、需要被理解但不想被说教',
    mood: '共情向',
    productFit: '适合做不油腻的安慰、鼓劲和接续话题',
    imageLabel: '凌晨的宿舍书桌上，电脑、资料和冷掉的咖啡堆在一起',
    replySeed:
      '这张图有一种“明明很累但还在往前扛”的力量感，我第一眼就懂你现在的节奏。',
    followUpSeed: '你现在最想听到的是“快结束了”还是“我陪你把这段熬过去”？',
    stickerSeed: '今晚稳住 / ddl 不会赢 / 再撑一下就亮天',
    palette: ['#6be7ff', '#3f7cff', '#161f64'],
  },
  {
    id: 'sunset-trip',
    title: '落日旅行随拍',
    subtitle: '画面美感强，适合做高级感回复和轻心动互动',
    cue: '松弛、漂亮、有一点点想把关系往前推',
    mood: '氛围向',
    productFit: '适合生成氛围感文案和带有记忆点的回复卡',
    imageLabel: '傍晚海边的风吹起外套，夕阳把整片天空染成橘粉色',
    replySeed:
      '这张图不像普通打卡，更像把“今天值得被记住”这件事认真存档了一次。',
    followUpSeed: '如果把这一刻做成一句只发给懂的人看的备注，你会怎么写？',
    stickerSeed: '落日已签收 / 氛围感到位 / 请继续发美照',
    palette: ['#ffb36b', '#ff7c96', '#5d8cff'],
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
  { id: 'qq-chat', label: 'QQ 私聊', value: '适合做“秒回但不敷衍”的一对一互动' },
  { id: 'group-icebreak', label: '群聊接话', value: '适合帮用户在多人场景里迅速接住图片话题' },
  { id: 'comment-feed', label: '评论区互动', value: '适合发图后生成更有辨识度的回评内容' },
  { id: 'video-reply', label: '视频截图回聊', value: '适合从截图里提炼亮点并延展成回复卡' },
]

const relationships: Option[] = [
  { id: 'bestie', label: '死党熟人', value: '语气可以更放松、更像默契接话' },
  { id: 'crush', label: '暧昧对象', value: '要有专属感，但不能油和冒犯' },
  { id: 'fandom', label: '兴趣搭子', value: '要体现“我懂你这张图的点在哪”' },
  { id: 'new-friend', label: '新认识的人', value: '要友好、有分寸，并给对方继续聊的空间' },
]

const initialIds = {
  sceneId: 'concert-night',
  modeId: 'spark',
  contextId: 'qq-chat',
  relationshipId: 'crush',
}

function getScene(sceneId: string) {
  return demoScenes.find((scene) => scene.id === sceneId) ?? demoScenes[0]
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
    : `当前用的是「${scene.title}」示例场景。`
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
      : `当前以「${scene.title}」示例画面做视觉理解，重点抓“${scene.cue}”和最容易让人想接话的细节。`,
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
        title: '自动生成贴字卡和下一轮互动建议',
        body: input.desiredOutcome?.trim()
          ? `系统会同步给出可一键发送的贴字短句「${scene.stickerSeed}」，并把下一轮互动往“${input.desiredOutcome.trim()}”这个目标上推进。`
          : `系统会同步给出可一键发送的贴字短句「${scene.stickerSeed}」，并匹配下一轮追问，让回复不只是一句话，而是一整套互动动作。`,
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
        : 'AI 输出形态：文案回复卡 + 表情贴字 + 下一轮追问建议，形成连续互动。',
    ],
  } satisfies Experience
}

export default function App() {
  const shellRef = useRef<HTMLDivElement | null>(null)
  const [sceneId, setSceneId] = useState(initialIds.sceneId)
  const [modeId, setModeId] = useState(initialIds.modeId)
  const [contextId, setContextId] = useState(initialIds.contextId)
  const [relationshipId, setRelationshipId] = useState(initialIds.relationshipId)
  const [focus, setFocus] = useState('像真人说话，但要比真人更会接梗')
  const [threadContext, setThreadContext] = useState('对方刚说“这张我真的很喜欢，但不知道怎么回更自然”。')
  const [desiredOutcome, setDesiredOutcome] = useState('让对方愿意继续展开聊，而不是只停在“好看”。')
  const [imageDataUrl, setImageDataUrl] = useState<string>('')
  const [imageName, setImageName] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [health] = useState<HealthState>({
    ok: true,
    mode: 'unknown',
    model: 'UI Extract',
    message: '纯前端 UI 提取版，使用本地 mock 数据演示。',
    supportsImageInput: true,
  })
  const [experience, setExperience] = useState<Experience>(() =>
    createLocalExperience({
      ...initialIds,
      focus: '像真人说话，但要比真人更会接梗',
      threadContext: '对方刚说“这张我真的很喜欢，但不知道怎么回更自然”。',
      desiredOutcome: '让对方愿意继续展开聊，而不是只停在“好看”。',
    }),
  )
  const [selectedReply, setSelectedReply] = useState(experience.quickReplies[0] ?? '')

  const scene = getScene(sceneId)
  const mode = getMode(modeId)
  const context = getContext(contextId)
  const relationship = getRelationship(relationshipId)
  const previewStyle = {
    '--scene-start': scene.palette[0],
    '--scene-mid': scene.palette[1],
    '--scene-end': scene.palette[2],
  } as CSSProperties
  const heroVisualStyle = {
    ...previewStyle,
    '--hero-image': "url('/mirror-lab-campus-v2.png')",
  } as CSSProperties

  useEffect(() => {
    setSelectedReply((current) => {
      if (experience.quickReplies.includes(current)) {
        return current
      }
      return experience.quickReplies[0] ?? ''
    })
  }, [experience])

  useEffect(() => {
    if (!toastMessage) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setToastMessage('')
    }, 1800)

    return () => window.clearTimeout(timer)
  }, [toastMessage])

  useLayoutEffect(() => {
    if (!shellRef.current) {
      return undefined
    }

    const ctx = gsap.context(() => {
      gsap.set(['.topbar', '.topbar-visual', '.control-panel', '.preview-panel'], {
        autoAlpha: 0,
        y: 32,
      })

      const intro = gsap.timeline({
        defaults: {
          ease: 'power3.out',
          duration: 0.72,
        },
      })

      intro
        .to('.topbar', { autoAlpha: 1, y: 0 })
        .to('.topbar-visual', { autoAlpha: 1, y: 0 }, '-=0.42')
        .to(['.control-panel', '.preview-panel'], { autoAlpha: 1, y: 0, stagger: 0.12 }, '-=0.4')

      gsap.fromTo(
        '.orb',
        { y: 0, scale: 1 },
        {
          y: -18,
          scale: 1.06,
          duration: 6,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          stagger: 1.2,
        },
      )

      gsap.fromTo(
        '.generate-button',
        { y: 0 },
        {
          y: -4,
          duration: 1.8,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        },
      )

      gsap.fromTo(
        '.preview-surface',
        { y: 0, rotate: 0 },
        {
          y: -8,
          rotate: -0.4,
          duration: 3,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        },
      )

      gsap.utils.toArray<HTMLElement>('.reveal').forEach((element) => {
        gsap.from(element, {
          autoAlpha: 0,
          y: 28,
          duration: 0.58,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 88%',
            once: true,
          },
        })
      })
    }, shellRef)

    return () => ctx.revert()
  }, [])

  useLayoutEffect(() => {
    if (!shellRef.current) {
      return undefined
    }

    const ctx = gsap.context(() => {
      gsap.from('.reply-card, .quick-replies button, .chat-thread .bubble-out', {
        autoAlpha: 0,
        y: 14,
        duration: 0.42,
        ease: 'power2.out',
        stagger: 0.05,
        clearProps: 'all',
      })
    }, shellRef)

    return () => ctx.revert()
  }, [experience])

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setImageName(file.name)
      setImageDataUrl(result)
      setToastMessage('图片已载入，UI 提取版会用它做本地预览演示。')
    }
    reader.readAsDataURL(file)
    event.target.value = ''
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
    await copyText(text, '快捷回复已复制到剪贴板。', '已选中这条回复，剪贴板写入失败时可直接手动复制。')
  }

  async function handleGenerate() {
    setIsGenerating(true)
    setErrorMessage('')

    const localExperience = createLocalExperience({
      sceneId,
      modeId,
      contextId,
      relationshipId,
      focus,
      imageName,
      threadContext,
      desiredOutcome,
    })

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 1200))

      startTransition(() => {
        setExperience(localExperience)
      })

      setToastMessage('UI 提取版已生成一轮本地示例结果。')
    } catch {
      setErrorMessage('本地 UI 演示生成失败，请刷新后重试。')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="app-shell" ref={shellRef}>
      <div className="ambient-orbs" aria-hidden="true">
        <span className="orb orb-a" />
        <span className="orb orb-b" />
        <span className="orb orb-c" />
      </div>

      <header className="topbar">
        <div className="topbar-copy">
          <p className="eyebrow">Mirror Lab</p>
          <h1>镜语</h1>
          <p className="topbar-description">
            把图片里的氛围、关系状态和下一轮聊天机会，直接压缩成可发送的专属回复。
          </p>
          <div className="topbar-badges">
            <span>{scene.mood}</span>
            <span>{mode.label}</span>
            <span>{imageDataUrl ? '图片预览已启用' : '主视觉演示中'}</span>
          </div>
        </div>

        <div className="topbar-actions">
          <div className="status-stack">
            <span className={`status-chip ${health.mode === 'ark' ? 'is-openai' : health.mode === 'fallback' ? 'is-fallback' : ''}`}>
              <strong>Backend</strong>
              {health.model === 'UI Extract'
                ? 'UI Extract'
                : health.mode === 'ark'
                ? `Ark${health.model ? ` · ${health.model}` : ''}`
                : health.mode === 'fallback'
                  ? 'Fallback'
                  : 'Checking'}
            </span>
            <span className={`status-chip ${errorMessage ? 'is-error' : ''}`}>
              <strong>Status</strong>
              {errorMessage ? '已启用兜底' : health.message}
            </span>
          </div>

          <aside className="topbar-visual" style={heroVisualStyle}>
            <div className="topbar-visual-copy">
              <span className="panel-label">当前场景</span>
              <h3>{scene.title}</h3>
              <p>{scene.subtitle}</p>
            </div>

            <div className="topbar-visual-grid">
              <article>
                <strong>{relationship.label}</strong>
                <span>关系状态</span>
              </article>
              <article>
                <strong>{context.label}</strong>
                <span>落地入口</span>
              </article>
              <article>
                <strong>{mode.label}</strong>
                <span>回复策略</span>
              </article>
            </div>
          </aside>
        </div>
      </header>

      <section className="studio-layout">
        <section className="control-panel">
          <div className="section-heading">
            <p className="eyebrow">Control Deck</p>
            <h3>把图发过来，系统帮你决定怎么回</h3>
          </div>

          <div className="field-group">
            <div>
              <span className="field-label">示例场景</span>
              <div className="scene-grid">
                {demoScenes.map((item) => {
                  const sceneStyle = {
                    '--scene-start': item.palette[0],
                    '--scene-mid': item.palette[1],
                    '--scene-end': item.palette[2],
                  } as CSSProperties

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`scene-card ${item.id === sceneId ? 'selected' : ''}`}
                      style={sceneStyle}
                      onClick={() => setSceneId(item.id)}
                    >
                      <span className="scene-title">{item.title}</span>
                      <span className="scene-subtitle">{item.subtitle}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <label className="upload-box">
              <span className="upload-title">上传一张真实图片</span>
              <span className="upload-copy">
                这里保留了上传与预览交互。没有图片也可以先用示例场景演示整套 UI。
              </span>
              {imageName ? <span className="upload-pill">{imageName}</span> : null}
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </label>

            <div>
              <span className="field-label">回复策略</span>
              <div className="chip-grid">
                {modes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`chip-button ${item.id === modeId ? 'selected' : ''}`}
                    onClick={() => setModeId(item.id)}
                  >
                    <span>{item.label}</span>
                    <small>{item.description}</small>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="inline-fields">
            <label className="select-field">
              <span>落地入口</span>
              <select value={contextId} onChange={(event) => setContextId(event.target.value)}>
                {contexts.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="select-field">
              <span>关系状态</span>
              <select value={relationshipId} onChange={(event) => setRelationshipId(event.target.value)}>
                {relationships.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="context-grid">
            <label className="textarea-field">
              <span>上一轮聊天上下文</span>
              <textarea
                value={threadContext}
                onChange={(event) => setThreadContext(event.target.value)}
                placeholder="比如：对方刚发图后说了什么、你们当前聊到哪里。"
              />
            </label>

            <label className="textarea-field">
              <span>本轮想推进到哪</span>
              <textarea
                value={desiredOutcome}
                onChange={(event) => setDesiredOutcome(event.target.value)}
                placeholder="比如：让对方继续展开聊、自然切到下次见面、在评论区形成二次互动。"
              />
            </label>
          </div>

          <label className="textarea-field">
            <span>语气偏好</span>
            <textarea
              value={focus}
              onChange={(event) => setFocus(event.target.value)}
              placeholder="比如：温柔一点，但别太油；像熟人聊天；适合评论区。"
            />
          </label>

          <button type="button" className="generate-button" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? '正在生成一版可落地回复...' : '生成专属回复方案'}
          </button>

          <p className="generation-note">
            {isGenerating
              ? '正在用本地 mock 数据重组这套回复体验，通常只需 1-2 秒。'
              : '点击后会用本地示例数据生成首条回复、续聊抓手和下一轮互动建议。'}
          </p>
        </section>

        <section className="preview-panel">
          <div className="section-heading compact">
            <p className="eyebrow">Preview</p>
            <h3>生成结果会直接变成产品可展示内容</h3>
          </div>

          <div className="preview-surface" style={heroVisualStyle}>
            <div className="preview-meta">
              <span className="panel-label">{scene.title}</span>
              <h3>{imageName ? '用户上传实拍已接入' : scene.imageLabel}</h3>
              <p>{imageName ? '当前是纯前端展示包，会保留图片预览并用本地 mock 结果驱动下方内容。' : scene.subtitle}</p>
              <div className="analysis-row">
                {experience.analysisTags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>

            <div className="preview-canvas">
              {imageDataUrl ? (
                <div className="mock-visual is-image">
                  <img src={imageDataUrl} alt={imageName || '用户上传图片预览'} />
                </div>
              ) : (
                <div className="mock-visual is-hero">
                  <div className="mock-visual-overlay">
                    <span>{scene.title}</span>
                    <small>{scene.imageLabel}</small>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={`reply-stack ${isGenerating ? 'is-generating' : ''}`}>
            <div>
              <span className="panel-label">系统摘要</span>
              <p className="summary-copy">{experience.summary}</p>
            </div>

            <div>
              <span className="panel-label">信号判断</span>
              <p className="signal-copy">{experience.signal}</p>
            </div>

            <div className="reply-card-grid insight-grid">
              <article className="reply-card insight-card">
                <div className="reply-card-header">
                  <span className="reply-badge">画面解读</span>
                </div>
                <h4>这张图最该接住什么</h4>
                <p>{experience.visualSignal}</p>
              </article>

              <article className="reply-card insight-card">
                <div className="reply-card-header">
                  <span className="reply-badge">续聊抓手</span>
                </div>
                <h4>下一轮怎么自然往下走</h4>
                <p>{experience.nextStep}</p>
              </article>
            </div>

            {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

            <div className="reply-card-grid">
              {experience.replyCards.map((card) => (
                <article key={card.title} className="reply-card">
                  <div className="reply-card-header">
                    <span className="reply-badge">{card.badge}</span>
                    <button type="button" onClick={() => handleCopyReply(card.body)}>
                      复制
                    </button>
                  </div>
                  <h4>{card.title}</h4>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>

            <div className="quick-replies">
              <div className="quick-replies-header">
                <span className="panel-label">快捷回复</span>
                <span>点一下即可复制，不会再整页刷新。</span>
              </div>
              <div>
                {experience.quickReplies.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    className={reply === selectedReply ? 'is-selected' : ''}
                    onClick={() => handleCopyReply(reply)}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>

            <div className="launch-lane">
              <div className="quick-replies-header">
                <span className="panel-label">落地动作</span>
                <span>把生成结果往真实产品能力上推进。</span>
              </div>

              <div className="launch-lane-grid">
                {experience.launchPlan.map((item, index) => (
                  <article key={item} className="launch-lane-card">
                    <span>{`0${index + 1}`}</span>
                    <p>{item}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="chat-phone reveal">
              <div className="phone-topbar">
                <div>
                  <strong>{relationship.label}</strong>
                  <span>
                    {context.label} · 镜语生成建议
                  </span>
                </div>
                <em>{health.model === 'UI Extract' ? 'UI Mock 在线' : health.mode === 'ark' ? 'Ark 在线' : 'Fallback 在线'}</em>
              </div>

              <div className="chat-thread">
                <article className="bubble bubble-in">
                  <p>{threadContext || '刚发完这张图，你觉得我应该怎么回才更有感觉？'}</p>
                </article>
                <article className="bubble bubble-out highlight">
                  <p>{experience.quickReplies[0]}</p>
                </article>
                <article className="bubble bubble-in">
                  <p>{desiredOutcome || '这个风格不错，再帮我留一个能继续聊下去的接话。'}</p>
                </article>
                <article className="bubble bubble-out">
                  <p>{experience.replyCards[1]?.body}</p>
                </article>
              </div>

              <div className="phone-actions">
                <span>贴字卡</span>
                <span>追问建议</span>
                <span>再生成一版</span>
              </div>

              <div className="composer-bar">
                <div className="composer-pill">{experience.quickReplies[0]}</div>
                <button type="button" onClick={() => handleCopyReply(experience.quickReplies[0] ?? '')}>
                  发送感
                </button>
              </div>
            </div>
          </div>
        </section>
      </section>

      {toastMessage ? <div className="toast">{toastMessage}</div> : null}
    </div>
  )
}
