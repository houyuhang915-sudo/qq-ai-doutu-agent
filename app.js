import { gsap } from './node_modules/gsap/index.js'
import { ScrollTrigger } from './node_modules/gsap/ScrollTrigger.js'

gsap.registerPlugin(ScrollTrigger)

const demoScenes = [
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
    replySeed: '这不是返图，是你今天情绪值满格的证据，我隔着屏幕都能听见现场的尖叫感。',
    followUpSeed: '如果只让你留一句今晚的标题，你会写“值回票价”还是“舍不得散场”？',
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
    replySeed: '这张图有一种“明明很累但还在往前扛”的力量感，我第一眼就懂你现在的节奏。',
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
    replySeed: '这张图不像普通打卡，更像把“今天值得被记住”这件事认真存档了一次。',
    followUpSeed: '如果把这一刻做成一句只发给懂的人看的备注，你会怎么写？',
    stickerSeed: '落日已签收 / 氛围感到位 / 请继续发美照',
    palette: ['#ffb36b', '#ff7c96', '#5d8cff'],
  },
]

const modes = [
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

const trackComparisons = [
  {
    id: 'track-1',
    title: '赛题1',
    summary: 'AI 玩转出圈交互叙事',
    score: '3.8',
    verdict: '创意空间大，但对叙事链路和内容生产要求更高。',
  },
  {
    id: 'track-2',
    title: '赛题2',
    summary: 'AI 改造视频广告',
    score: '3.6',
    verdict: '商业味浓，但容易做成策略稿，不如互动型 demo 直观。',
  },
  {
    id: 'track-3',
    title: '赛题3',
    summary: 'AI 玩转 QQ 养虾',
    score: '4.0',
    verdict: '趣味强，但赛题理解成本更高，评委需要更多背景代入。',
  },
  {
    id: 'track-4',
    title: '赛题4',
    summary: 'AI 玩转视觉互动',
    score: '5.0',
    verdict: '最容易做出“看一眼就懂、现场就能演示、评委会记住”的效果。',
    featured: true,
  },
  {
    id: 'track-5',
    title: '赛题5',
    summary: 'AI + 社媒流量密码',
    score: '4.1',
    verdict: '商业化想象不错，但容易和常规运营工具撞型。',
  },
]

const githubTools = [
  {
    name: 'shadcn-ui/ui',
    stars: '112.9k',
    url: 'https://github.com/shadcn-ui/ui',
    category: '结构层',
    note: '最值得借的是它的组件层级和信息密度控制，适合把 demo 做得更像正式产品。',
  },
  {
    name: 'magicuidesign/magicui',
    stars: '20.8k',
    url: 'https://github.com/magicuidesign/magicui',
    category: '氛围层',
    note: '很适合借鉴光效、流光背景、展示型卡片气质。我们这轮就按这个方向把页面氛围抬高了。',
  },
  {
    name: 'greensock/GSAP',
    stars: '24.4k',
    url: 'https://github.com/greensock/GSAP',
    category: '动效层',
    note: '如果后面要做路演版首屏进场、滚动叙事和卡片时序动画，它会是最稳的增强方案。',
  },
  {
    name: 'rough-stuff/rough-notation',
    stars: '9.5k',
    url: 'https://github.com/rough-stuff/rough-notation',
    category: '强调层',
    note: '适合把“赛道适配、AI 原生性、商业化”这些评审关键词做成手写标注式重点。',
  },
  {
    name: 'airbnb/lottie-web',
    stars: '31.8k',
    url: 'https://github.com/airbnb/lottie-web',
    category: '人格层',
    note: '后续可以给等待态、吉祥物、贴字生成过程加轻量动画，让产品更像可发布应用。',
  },
  {
    name: 'tsparticles/tsparticles',
    stars: '8.8k',
    url: 'https://github.com/tsparticles/tsparticles',
    category: '背景层',
    note: '适合做更细腻的粒子氛围背景，但终版只建议轻量使用，避免抢内容表达。',
  },
]

const state = {
  sceneId: 'concert-night',
  modeId: 'spark',
  contextId: 'qq-chat',
  relationshipId: 'crush',
  focus: '像真人说话，但要比真人更会接梗',
  uploadedAsset: null,
  experience: null,
  isGenerating: false,
  selectedReply: '',
  toastMessage: '',
}

let generateTimer = null
let toastTimer = null

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function getActiveScene() {
  return demoScenes.find((scene) => scene.id === state.sceneId) ?? demoScenes[0]
}

function buildExperience() {
  const scene = getActiveScene()
  const mode = modes.find((item) => item.id === state.modeId)
  const context = contexts.find((item) => item.id === state.contextId)
  const relationship = relationships.find((item) => item.id === state.relationshipId)

  const customBrief = state.uploadedAsset?.name
    ? `已识别你上传的图片“${state.uploadedAsset.name}”，并按「${scene.title}」这类视觉情绪来组织回复。`
    : `当前使用的是「${scene.title}」示例场景。`

  const focusLine = state.focus.trim()
    ? `同时遵循你的偏好：“${state.focus.trim()}”。`
    : '当前策略默认追求“像真人、够专属、能接着聊”。'

  const modeOpeners = {
    companion: '先稳稳接住情绪，再补一句让人觉得被认真看见的话。',
    playful: '先把画面里的亮点变成一个轻巧包袱，再顺势把气氛推起来。',
    spark: '先给对方“这是只对你说”的感觉，再留一点心跳空间。',
    deep: '先把图里的细节读准，再把回复延展成更有内容的交流。',
  }

  return {
    summary: `${customBrief}${focusLine} 推荐采用「${mode.label}」，因为这张图的核心气质是“${scene.cue}”，最适合在 ${context.label} 里做有记忆点的专属回复。`,
    signal: `${scene.productFit}；${mode.angle}。`,
    analysisTags: [
      scene.mood,
      scene.title,
      context.label,
      relationship.label,
      mode.label,
    ],
    replyCards: [
      {
        badge: '首条回复',
        title: '先把情绪接住',
        body: `${modeOpeners[state.modeId]} ${scene.replySeed}`,
      },
      {
        badge: '延展内容',
        title: '把“只发给你”的专属感做出来',
        body: `${scene.followUpSeed} 这一步会直接把图片回复从“会聊天”升级成“会持续互动”。`,
      },
      {
        badge: '产品化输出',
        title: '自动生成贴字卡和下一轮互动建议',
        body: `系统会同步给出可一键发送的贴字短句「${scene.stickerSeed}」，并匹配下一轮追问，让回复不只是一句话，而是一整套互动动作。`,
      },
    ],
    quickReplies: [
      scene.replySeed,
      `这张图的好看不止在画面，还在它把“${scene.cue}”传得特别准。`,
      `我想把这张直接存进“${relationship.label}限定返图”文件夹里。`,
    ],
    launchPlan: [
      `落地入口：${context.label}。${context.value}`,
      `关系调性：${relationship.label}。${relationship.value}`,
      'AI 输出形态：文案回复卡 + 表情贴字 + 下一轮追问建议，形成连续互动。',
    ],
  }
}

function renderSceneCards() {
  return demoScenes
    .map((scene) => {
      const selected = scene.id === state.sceneId ? 'selected' : ''
      const style = `--scene-start:${scene.palette[0]};--scene-mid:${scene.palette[1]};--scene-end:${scene.palette[2]};`

      return `
        <button type="button" class="scene-card ${selected}" data-scene-id="${scene.id}" style="${style}">
          <span class="scene-title">${escapeHtml(scene.title)}</span>
          <span class="scene-subtitle">${escapeHtml(scene.subtitle)}</span>
        </button>
      `
    })
    .join('')
}

function renderModeCards() {
  return modes
    .map((mode) => {
      const selected = mode.id === state.modeId ? 'selected' : ''

      return `
        <button type="button" class="chip-button ${selected}" data-mode-id="${mode.id}">
          <span>${escapeHtml(mode.label)}</span>
          <small>${escapeHtml(mode.description)}</small>
        </button>
      `
    })
    .join('')
}

function renderOptions(items, selectedId) {
  return items
    .map((item) => {
      const selected = item.id === selectedId ? 'selected' : ''
      return `<option value="${item.id}" ${selected}>${escapeHtml(item.label)}</option>`
    })
    .join('')
}

function renderReplyCards(experience) {
  return experience.replyCards
    .map(
      (card) => `
        <article class="reply-card">
          <span class="reply-badge">${escapeHtml(card.badge)}</span>
          <h4>${escapeHtml(card.title)}</h4>
          <p>${escapeHtml(card.body)}</p>
        </article>
      `,
    )
    .join('')
}

function renderQuickReplies(experience) {
  return experience.quickReplies
    .map((reply) => {
      const selected = reply === state.selectedReply ? 'is-selected' : ''
      return `<button type="button" class="${selected}" data-quick-reply="${escapeHtml(reply)}">${escapeHtml(reply)}</button>`
    })
    .join('')
}

function renderLaunchCards(experience) {
  return experience.launchPlan
    .map(
      (item) => `
        <article class="launch-card">
          <p>${escapeHtml(item)}</p>
        </article>
      `,
    )
    .join('')
}

function renderChatPreview(experience) {
  const relationship = relationships.find((item) => item.id === state.relationshipId)
  const context = contexts.find((item) => item.id === state.contextId)

  return `
    <div class="chat-phone reveal">
      <div class="phone-topbar">
        <div>
          <strong>${escapeHtml(relationship.label)}</strong>
          <span>${escapeHtml(context.label)} · 镜语生成建议</span>
        </div>
        <em>在线</em>
      </div>

      <div class="chat-thread">
        <article class="bubble bubble-in">
          <p>刚发完这张图，你觉得我应该怎么回才更有感觉？</p>
        </article>
        <article class="bubble bubble-out highlight">
          <p>${escapeHtml(experience.quickReplies[0])}</p>
        </article>
        <article class="bubble bubble-in">
          <p>这个风格不错，再帮我留一个能继续聊下去的接话。</p>
        </article>
        <article class="bubble bubble-out">
          <p>${escapeHtml(experience.replyCards[1].body)}</p>
        </article>
      </div>

      <div class="phone-actions">
        <span>贴字卡</span>
        <span>追问建议</span>
        <span>再生成一版</span>
      </div>
    </div>
  `
}

function renderTrackCards() {
  return trackComparisons
    .map((track) => {
      const featured = track.featured ? 'featured' : ''

      return `
        <article class="track-card ${featured} reveal">
          <div class="track-score">
            <span>${escapeHtml(track.title)}</span>
            <strong>${escapeHtml(track.score)}</strong>
          </div>
          <h4>${escapeHtml(track.summary)}</h4>
          <p>${escapeHtml(track.verdict)}</p>
        </article>
      `
    })
    .join('')
}

function renderGithubTools() {
  return githubTools
    .map(
      (tool) => `
        <article class="tool-card reveal">
          <div class="tool-meta">
            <span>${escapeHtml(tool.category)}</span>
            <strong>${escapeHtml(tool.stars)}</strong>
          </div>
          <h4><a href="${tool.url}" target="_blank" rel="noreferrer">${escapeHtml(tool.name)}</a></h4>
          <p>${escapeHtml(tool.note)}</p>
        </article>
      `,
    )
    .join('')
}

function showToast(message) {
  if (toastTimer) {
    window.clearTimeout(toastTimer)
  }

  state.toastMessage = message
  render()

  toastTimer = window.setTimeout(() => {
    state.toastMessage = ''
    render()
  }, 1600)
}

function initAnimations() {
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill())

  gsap.killTweensOf([
    '.topbar',
    '.hero-copy',
    '.hero-panel',
    '.control-panel',
    '.preview-panel',
    '.proof-card',
    '.track-card',
    '.launch-card',
    '.pipeline article',
    '.tool-card',
    '.chat-phone',
    '.orb',
    '.generate-button',
    '.preview-surface',
  ])

  gsap.set(['.topbar', '.hero-copy', '.hero-panel', '.control-panel', '.preview-panel'], {
    autoAlpha: 0,
    y: 32,
  })

  const heroTimeline = gsap.timeline({
    defaults: {
      ease: 'power3.out',
      duration: 0.72,
    },
  })

  heroTimeline
    .to('.topbar', { autoAlpha: 1, y: 0 })
    .to('.hero-copy', { autoAlpha: 1, y: 0 }, '-=0.42')
    .to('.hero-panel', { autoAlpha: 1, y: 0 }, '-=0.46')
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

  gsap.from('.quick-replies button', {
    autoAlpha: 0,
    y: 16,
    scale: 0.96,
    duration: 0.45,
    stagger: 0.08,
    ease: 'back.out(1.5)',
    delay: 0.15,
  })

  gsap.utils
    .toArray('.proof-card, .track-card, .launch-card, .pipeline article, .tool-card, .chat-phone')
    .forEach((element) => {
      gsap.from(element, {
        autoAlpha: 0,
        y: 42,
        duration: 0.72,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 86%',
          once: true,
        },
      })
    })

  gsap.to('.track-card.featured', {
    y: -10,
    duration: 2.6,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
  })
}

function render() {
  if (!state.experience) {
    state.experience = buildExperience()
  }

  const root = document.querySelector('#root')
  const scene = getActiveScene()
  const experience = state.experience
  const previewStyle = `--scene-start:${scene.palette[0]};--scene-mid:${scene.palette[1]};--scene-end:${scene.palette[2]};`
  const uploadedPreview = state.uploadedAsset
    ? `<img src="${state.uploadedAsset.url}" alt="用户上传预览" />`
    : `
      <div class="mock-visual">
        <span>${escapeHtml(scene.title)}</span>
        <small>${escapeHtml(scene.imageLabel)}</small>
      </div>
    `

  root.innerHTML = `
    <div class="app-shell">
      <div class="ambient-orbs" aria-hidden="true">
        <span class="orb orb-a"></span>
        <span class="orb orb-b"></span>
        <span class="orb orb-c"></span>
      </div>

      <header class="topbar">
        <div>
          <p class="eyebrow">腾讯 PCG 校园 AI 产品创意大赛</p>
          <h1>镜语</h1>
          <p class="topbar-copy">发图即回专属内容，把视觉互动变成更有温度的下一轮社交。</p>
        </div>

        <div class="topbar-badges" aria-label="项目标签">
          <span>推荐赛题 4</span>
          <span>AI 原生强</span>
          <span>路演演示友好</span>
        </div>
      </header>

      <section class="hero-section">
        <div class="hero-copy">
          <p class="eyebrow">最适合冲奖的方向</p>
          <h2>选「用 AI 玩转视觉互动，发图回复专属内容」</h2>
          <p class="hero-text">
            这条赛道最容易同时满足评审最看重的五件事：赛道适配、作品完整性、创新性、AI 原生感和用户洞察。
            我们把它做成一个真正可演示的产品原型，而不是只停留在概念页。
          </p>

          <div class="hero-metrics">
            <article>
              <strong>5/5</strong>
              <span>赛道适配</span>
            </article>
            <article>
              <strong>4.8/5</strong>
              <span>可演示性</span>
            </article>
            <article>
              <strong>4.7/5</strong>
              <span>落地空间</span>
            </article>
          </div>
        </div>

        <aside class="hero-panel">
          <p class="panel-label">评委一眼能记住的亮点</p>
          <ul class="hero-points">
            <li>从“看图”直接进入“回图、回情绪、回关系”的专属生成。</li>
            <li>同一张图可以自动适配 QQ 私聊、评论区、群聊等不同场景。</li>
            <li>输出不止一句文案，而是完整的回复卡、贴字包和下一轮互动建议。</li>
          </ul>

          <div class="hero-pulse reveal">
            <span>本轮强化</span>
            <p>加入聊天样机、赛题对比和 GitHub 工具灵感栈，让页面更像完整路演作品。</p>
          </div>
        </aside>
      </section>

      <main class="studio-layout">
        <section class="control-panel">
          <div class="section-heading">
            <p class="eyebrow">Demo Studio</p>
            <h3>设定这次 AI 要怎么回</h3>
          </div>

          <div class="field-group">
            <label class="field-label">先选一张代表性场景</label>
            <div class="scene-grid">
              ${renderSceneCards()}
            </div>
          </div>

          <div class="field-group">
            <label class="field-label" for="image-upload">或者上传你自己的图片</label>
            <label class="upload-box" for="image-upload">
              <input id="image-upload" type="file" accept="image/*" />
              <span class="upload-title">拖拽或选择图片</span>
              <span class="upload-copy">支持路演时快速替换成你自己的示例图。</span>
              ${
                state.uploadedAsset
                  ? `<span class="upload-file">${escapeHtml(state.uploadedAsset.name)}</span>`
                  : ''
              }
            </label>
          </div>

          <div class="field-group">
            <label class="field-label">回复策略</label>
            <div class="chip-grid">
              ${renderModeCards()}
            </div>
          </div>

          <div class="inline-fields">
            <label class="select-field">
              <span>触发场景</span>
              <select id="context-select">
                ${renderOptions(contexts, state.contextId)}
              </select>
            </label>

            <label class="select-field">
              <span>关系状态</span>
              <select id="relationship-select">
                ${renderOptions(relationships, state.relationshipId)}
              </select>
            </label>
          </div>

          <label class="textarea-field">
            <span>你想让 AI 额外注意什么</span>
            <textarea id="focus-input" rows="4">${escapeHtml(state.focus)}</textarea>
          </label>

          <button type="button" class="generate-button" id="generate-button">
            ${state.isGenerating ? '正在生成专属回复...' : '生成这张图的专属回复'}
          </button>
        </section>

        <section class="preview-panel">
          <div class="preview-surface" style="${previewStyle}">
            <div class="preview-meta">
              <p class="panel-label">视觉输入</p>
              <p>${escapeHtml(state.uploadedAsset?.name ?? scene.imageLabel)}</p>
            </div>

            <div class="preview-canvas">
              ${uploadedPreview}
            </div>

            <div class="analysis-row" aria-label="图像理解标签">
              ${experience.analysisTags
                .map((tag) => `<span>${escapeHtml(tag)}</span>`)
                .join('')}
            </div>
          </div>

          <div class="reply-stack ${state.isGenerating ? 'is-generating' : ''}">
            <div class="section-heading compact">
              <p class="eyebrow">AI Output</p>
              <h3>这张图该怎么回，镜语已经帮你想好了</h3>
            </div>

            <p class="summary-copy">${escapeHtml(experience.summary)}</p>
            <p class="summary-copy">${escapeHtml(experience.signal)}</p>

            <div class="reply-card-grid">
              ${renderReplyCards(experience)}
            </div>

            <div class="quick-replies">
              <p class="panel-label">可一键发送的短句</p>
              <div>
                ${renderQuickReplies(experience)}
              </div>
            </div>
          </div>

          ${renderChatPreview(experience)}
        </section>
      </main>

      <section class="proof-section">
        <article class="proof-card">
          <p class="eyebrow">评分对齐</p>
          <h3>它天然覆盖这次评审最核心的五个维度</h3>
          <p>
            赛道适配靠“发图回复专属内容”直接命中命题；作品完整性靠可操作 Demo；创新性和 AI
            原生性则来自视觉理解 + 关系感知 + 专属回复生成的一体化体验。
          </p>
        </article>

        <article class="proof-card accent">
          <p class="eyebrow">落地可行性</p>
          <h3>先上 QQ / 评论区，再延展到更多 PCG 视觉互动场景</h3>
          <p>
            同一套能力可以复用到 QQ 私聊、群聊、相册评论、内容社区回评、视频截图互动等多个入口，
            工程上是同一个视觉回复引擎，业务上却能覆盖多种社交链路。
          </p>
        </article>

        <article class="proof-card">
          <p class="eyebrow">商业化空间</p>
          <h3>不仅能玩得起来，也能长成产品</h3>
          <p>
            高级回复包、会员专属音色、IP 联名贴字模板、创作者互动助手，都是很自然的后续延展，
            正好对应评分表里的“落地可行性”和“商业化能力”两个加分项。
          </p>
        </article>
      </section>

      <section class="track-section">
        <div class="section-heading">
          <p class="eyebrow">Track Matrix</p>
          <h3>为什么我们优先做赛题 4，而不是其他命题赛道</h3>
          <p class="summary-copy">
            我把“评审理解成本、可演示性、AI 原生感、落地空间”综合成一个路演视角评分。
            不是说别的赛题不能做，而是赛题 4 最适合我们用最短时间做出更亮眼的成品。
          </p>
        </div>

        <div class="track-grid">
          ${renderTrackCards()}
        </div>
      </section>

      <section class="launch-section">
        <div class="section-heading">
          <p class="eyebrow">Launch Plan</p>
          <h3>把 Demo 讲成一个能落地的产品</h3>
        </div>

        <div class="launch-grid">
          ${renderLaunchCards(experience)}
        </div>

        <div class="pipeline">
          <article>
            <span>01</span>
            <h4>视觉理解</h4>
            <p>识别主体、氛围、情绪密度和适合延展的互动点。</p>
          </article>
          <article>
            <span>02</span>
            <h4>关系判断</h4>
            <p>根据社交场景和关系远近，控制语气边界与专属感强度。</p>
          </article>
          <article>
            <span>03</span>
            <h4>内容生成</h4>
            <p>一次生成回复文案、贴字卡、下一轮追问和风格变体。</p>
          </article>
          <article>
            <span>04</span>
            <h4>互动闭环</h4>
            <p>让“发图”不只触发一次回复，而是触发连续互动和关系推进。</p>
          </article>
        </div>
      </section>

      <section class="tool-section">
        <div class="section-heading">
          <p class="eyebrow">GitHub Radar</p>
          <h3>我在 GitHub 上筛过的一轮前端增强工具</h3>
          <p class="summary-copy">
            这几类仓库最适合继续给项目加分。我没有盲目全接依赖，而是先把最值钱的设计语言和交互思路融进当前版本。
          </p>
        </div>

        <div class="tool-grid">
          ${renderGithubTools()}
        </div>
      </section>

      ${
        state.toastMessage
          ? `<div class="toast">${escapeHtml(state.toastMessage)}</div>`
          : ''
      }
    </div>
  `

  bindEvents()
  initAnimations()
}

function bindEvents() {
  document.querySelectorAll('[data-scene-id]').forEach((button) => {
    button.addEventListener('click', () => {
      state.sceneId = button.getAttribute('data-scene-id')
      state.experience = buildExperience()
      render()
    })
  })

  document.querySelectorAll('[data-mode-id]').forEach((button) => {
    button.addEventListener('click', () => {
      state.modeId = button.getAttribute('data-mode-id')
      state.experience = buildExperience()
      render()
    })
  })

  document.querySelector('#context-select').addEventListener('change', (event) => {
    state.contextId = event.target.value
    state.experience = buildExperience()
    render()
  })

  document.querySelector('#relationship-select').addEventListener('change', (event) => {
    state.relationshipId = event.target.value
    state.experience = buildExperience()
    render()
  })

  document.querySelector('#focus-input').addEventListener('input', (event) => {
    state.focus = event.target.value
  })

  document.querySelector('#image-upload').addEventListener('change', (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (state.uploadedAsset?.url) {
      URL.revokeObjectURL(state.uploadedAsset.url)
    }

    state.uploadedAsset = {
      name: file.name,
      url: URL.createObjectURL(file),
    }
    state.experience = buildExperience()
    render()
  })

  document.querySelector('#generate-button').addEventListener('click', () => {
    if (generateTimer) {
      window.clearTimeout(generateTimer)
    }

    state.isGenerating = true
    render()

    generateTimer = window.setTimeout(() => {
      state.isGenerating = false
      state.experience = buildExperience()
      render()
    }, 680)
  })

  document.querySelectorAll('[data-quick-reply]').forEach((button) => {
    button.addEventListener('click', async () => {
      state.selectedReply = button.getAttribute('data-quick-reply')

      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(state.selectedReply)
        } catch {
          // Ignore clipboard failures in local preview mode.
        }
      }

      showToast('已复制一句可直接发送的回复')
    })
  })
}

state.experience = buildExperience()
render()
