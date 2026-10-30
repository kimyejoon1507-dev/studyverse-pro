import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'
import {
  ArrowRight, ArrowUpRight, Award, BookOpen, Brain, Check, ChevronDown,
  ChevronRight, CircleHelp, Clock3, Crosshair, Crown, Flame, Gamepad2,
  Heart, Lightbulb, LockKeyhole, Menu, MousePointer2, Plus, Rocket,
  Send, Shield, ShoppingBag, Sparkles, Swords, Target, Trophy, WandSparkles, X, Zap,
} from 'lucide-react'

type Subject = 'Mathematics' | 'Biology' | 'Physics' | 'Chemistry' | 'History'
type Section = 'Overview' | 'AI Tutor' | 'Quiz Lab' | 'Battle Arena' | 'Achievements'
type ChatMessage = { role: 'assistant' | 'user'; text: string }
type TutorIntent = 'chat' | 'explain' | 'quiz' | 'analyze'
type TutorRequest = { subject: Subject; intent: TutorIntent; messages: { role: ChatMessage['role']; content: string }[] }
type Profile = {
  xp: number
  coins: number
  hp: number
  weapon: number
  games: number
  quizzes: number
  tutorQuestions: number
  streak: number
  completed: string[]
}

const STORAGE_KEY = 'studyverse-pro-profile-v1'
const defaultProfile: Profile = { xp: 1240, coins: 340, hp: 100, weapon: 1, games: 0, quizzes: 0, tutorQuestions: 0, streak: 7, completed: ['first-steps'] }
const subjects: { name: Subject; icon: string; color: string; progress: number; lessons: string }[] = [
  { name: 'Mathematics', icon: '∑', color: 'violet', progress: 72, lessons: '12 / 16 lessons' },
  { name: 'Biology', icon: '⌬', color: 'green', progress: 48, lessons: '8 / 16 lessons' },
  { name: 'Physics', icon: '◉', color: 'blue', progress: 35, lessons: '6 / 16 lessons' },
  { name: 'Chemistry', icon: '⚗', color: 'orange', progress: 24, lessons: '4 / 16 lessons' },
  { name: 'History', icon: '⌛', color: 'pink', progress: 61, lessons: '10 / 16 lessons' },
]
const quizBank: Record<Subject, { question: string; choices: string[]; answer: number; explanation: string }[]> = {
  Mathematics: [
    { question: 'If f(x) = 3x² − 2x + 1, what is f′(x)?', choices: ['6x − 2', '3x − 2', '6x + 1', '3x² − 2'], answer: 0, explanation: 'Apply the power rule: the derivative of 3x² is 6x, of −2x is −2, and the constant becomes 0.' },
    { question: 'What is the value of log₂(32)?', choices: ['4', '5', '6', '8'], answer: 1, explanation: 'Since 2⁵ = 32, log₂(32) = 5.' },
    { question: 'A triangle has angles 45° and 65°. What is the third angle?', choices: ['60°', '70°', '80°', '90°'], answer: 1, explanation: 'Triangle angles sum to 180°. So 180° − 45° − 65° = 70°.' },
  ],
  Biology: [
    { question: 'Which organelle is primarily responsible for ATP production?', choices: ['Ribosome', 'Golgi apparatus', 'Mitochondrion', 'Lysosome'], answer: 2, explanation: 'Mitochondria perform cellular respiration, producing most of a cell’s ATP.' },
    { question: 'What is the main role of mRNA?', choices: ['Store energy', 'Carry genetic instructions to ribosomes', 'Digest proteins', 'Build cell walls'], answer: 1, explanation: 'Messenger RNA carries a transcribed copy of DNA instructions to the ribosome for translation.' },
    { question: 'Which molecule captures light energy in plants?', choices: ['Hemoglobin', 'Chlorophyll', 'Keratin', 'Collagen'], answer: 1, explanation: 'Chlorophyll pigments absorb light energy that powers photosynthesis.' },
  ],
  Physics: [
    { question: 'What is the SI unit of force?', choices: ['Joule', 'Pascal', 'Newton', 'Watt'], answer: 2, explanation: 'Force is measured in newtons (N), equivalent to kg·m/s².' },
    { question: 'If velocity doubles, kinetic energy becomes…', choices: ['2×', '3×', '4×', '½×'], answer: 2, explanation: 'Kinetic energy is ½mv². Doubling velocity multiplies v² by four.' },
    { question: 'Which law states that every action has an equal and opposite reaction?', choices: ['Newton’s first', 'Newton’s second', 'Newton’s third', 'Hooke’s law'], answer: 2, explanation: 'Newton’s third law describes equal and opposite force pairs.' },
  ],
  Chemistry: [
    { question: 'What is the chemical symbol for potassium?', choices: ['P', 'Po', 'K', 'Pt'], answer: 2, explanation: 'Potassium’s symbol is K, from its Latin name kalium.' },
    { question: 'A solution with pH 3 is…', choices: ['Acidic', 'Neutral', 'Basic', 'A salt'], answer: 0, explanation: 'A pH below 7 indicates an acidic solution.' },
    { question: 'How many electrons can the first shell hold?', choices: ['2', '4', '8', '18'], answer: 0, explanation: 'The first electron shell (n = 1) can hold a maximum of 2 electrons.' },
  ],
  History: [
    { question: 'In which year did the Berlin Wall fall?', choices: ['1987', '1989', '1991', '1993'], answer: 1, explanation: 'The Berlin Wall opened on November 9, 1989, a pivotal moment in the Cold War’s end.' },
    { question: 'The Renaissance began in which country?', choices: ['France', 'England', 'Italy', 'Spain'], answer: 2, explanation: 'The Renaissance began in Italy, especially Florence, during the 14th century.' },
    { question: 'Which ancient civilization built Machu Picchu?', choices: ['Maya', 'Aztec', 'Inca', 'Olmec'], answer: 2, explanation: 'Machu Picchu was built by the Inca in the 15th century in modern-day Peru.' },
  ],
}

function loadProfile(): Profile {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return defaultProfile
    const parsed: Partial<Profile> = JSON.parse(stored)
    return { ...defaultProfile, ...parsed, completed: Array.isArray(parsed.completed) ? parsed.completed : defaultProfile.completed }
  } catch {
    return defaultProfile
  }
}

function App() {
  const [profile, setProfile] = useState<Profile>(loadProfile)
  const [section, setSection] = useState<Section>('Overview')
  const [subject, setSubject] = useState<Subject>('Mathematics')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [toast, setToast] = useState('')
  const level = Math.floor(profile.xp / 500) + 1
  const xpInLevel = profile.xp % 500

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  }, [profile])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const updateProfile = useCallback((patch: Partial<Profile>) => setProfile(current => ({ ...current, ...patch })), [])
  const incrementTutorQuestions = useCallback(() => setProfile(current => ({ ...current, tutorQuestions: current.tutorQuestions + 1 })), [])
  const addReward = useCallback((xp: number, coins = Math.ceil(xp / 3), message?: string) => {
    setProfile(current => ({ ...current, xp: current.xp + xp, coins: current.coins + coins }))
    setToast(message ?? `+${xp} XP  ·  +${coins} coins earned`)
  }, [])
  const navigate = (next: Section) => {
    setSection(next)
    setMobileOpen(false)
  }
  const navItems: { label: Section; icon: typeof Brain }[] = [
    { label: 'Overview', icon: Sparkles }, { label: 'AI Tutor', icon: Brain },
    { label: 'Quiz Lab', icon: Target }, { label: 'Battle Arena', icon: Gamepad2 },
    { label: 'Achievements', icon: Trophy },
  ]

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><span>✦</span></div>
          <div><strong>studyverse<span className="brand-pro"> PRO</span></strong><small>LEARN. PLAY. EVOLVE.</small></div>
          <button className="icon-btn close-menu" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <div className="sidebar-label">YOUR SPACE</div>
        <nav className="main-nav">
          {navItems.map(item => {
            const Icon = item.icon
            return <button key={item.label} className={`nav-item ${section === item.label ? 'active' : ''}`} aria-label={item.label} title={item.label} onClick={() => navigate(item.label)}>
              <Icon size={17} strokeWidth={1.8} /><span>{item.label}</span>
              {item.label === 'Battle Arena' && <span className="nav-live" />}
            </button>
          })}
        </nav>
        <div className="sidebar-label subject-label">SUBJECTS <button aria-label="Add subject" onClick={() => setToast('More subjects coming soon')}><Plus size={14} /></button></div>
        <div className="subject-nav">
          {subjects.slice(0, 4).map(item => <button key={item.name} className={`subject-link ${subject === item.name ? 'selected' : ''}`} aria-label={item.name} title={item.name} onClick={() => { setSubject(item.name); if (section === 'Overview') setSection('Overview') }}>
            <span className={`subject-dot ${item.color}`}>{item.icon}</span><span>{item.name}</span><ChevronRight size={14} className="subject-chevron" />
          </button>)}
        </div>
        <div className="sidebar-spacer" />
        <div className="sidebar-challenge">
          <div className="challenge-orb"><Flame size={18} /></div>
          <div className="challenge-copy"><strong>Daily streak</strong><span>You're on fire!</span></div>
          <b>{profile.streak}<small> days</small></b>
          <div className="streak-track"><i /></div>
        </div>
        <button className="upgrade-card" onClick={() => setToast('You’re already exploring the Pro experience!')}>
          <div className="upgrade-icon"><Crown size={16} /></div>
          <div><b>Unlock your potential</b><span>Explore Studyverse Pro</span></div>
          <ArrowUpRight size={15} />
        </button>
        <button className="profile-button">
          <div className="avatar">A</div><div className="profile-copy"><b>Alex Morgan</b><span>Level {level} Explorer</span></div><ChevronDown size={15} />
        </button>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-btn menu-toggle" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={19} /></button>
          <div className="breadcrumb"><span>My space</span><ChevronRight size={14} /><b>{section}</b></div>
          <div className="topbar-right">
            <div className="top-stat"><Zap size={14} className="xp-icon" /><b>{profile.xp.toLocaleString()}</b><span>XP</span></div>
            <div className="top-stat coin-stat"><span className="coin">◈</span><b>{profile.coins}</b><span>COINS</span></div>
            <button className="top-avatar" title="Alex Morgan">A<span /></button>
          </div>
        </header>
        <div className="content-scroll">
          {section === 'Overview' && <Overview profile={profile} level={level} xpInLevel={xpInLevel} subject={subject} setSubject={setSubject} navigate={navigate} />}
          {section === 'AI Tutor' && <Tutor subject={subject} setSubject={setSubject} addReward={addReward} incrementTutorQuestions={incrementTutorQuestions} />}
          {section === 'Quiz Lab' && <QuizLab subject={subject} setSubject={setSubject} addReward={addReward} updateProfile={updateProfile} quizzes={profile.quizzes} />}
          {section === 'Battle Arena' && <BattleArena profile={profile} updateProfile={updateProfile} addReward={addReward} />}
          {section === 'Achievements' && <Achievements profile={profile} level={level} addReward={addReward} updateProfile={updateProfile} />}
        </div>
      </main>
      {mobileOpen && <button className="mobile-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
      {toast && <div className="toast"><span className="toast-check"><Check size={14} /></span>{toast}</div>}
    </div>
  )
}

function Overview({ profile, level, xpInLevel, subject, setSubject, navigate }: {
  profile: Profile; level: number; xpInLevel: number; subject: Subject; setSubject: (s: Subject) => void; navigate: (s: Section) => void
}) {
  return <div className="page-wrap">
    <div className="welcome-row">
      <div><div className="eyebrow"><span className="eyebrow-line" /> {new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: '2-digit', year: 'numeric' }).format(new Date()).toUpperCase()}</div><h1>Your universe,<br /><em>your rules.</em></h1>
        <p className="welcome-sub">Every great mind starts somewhere. Ready to make today count?</p></div>
      <div className="welcome-level"><div className="level-ring"><div><span>LVL</span><b>{level}</b></div></div><div className="level-meta"><span>YOUR JOURNEY</span><strong>Level {level} Explorer</strong><div className="level-progress"><i style={{ width: `${xpInLevel / 5}%` }} /></div><small>{xpInLevel} / 500 XP to level {level + 1}</small></div></div>
    </div>

    <section className="hero-card">
      <div className="hero-grid" />
      <div className="hero-content"><div className="hero-pill"><span /> YOUR NEXT ADVENTURE</div><h2>Knowledge is your<br /><span>superpower.</span></h2>
        <p>Pick up where you left off and turn a little<br className="desktop-break" /> learning into a legendary streak.</p>
        <button className="primary-btn" onClick={() => navigate('AI Tutor')}>Continue learning <ArrowRight size={16} /></button>
      </div>
      <div className="hero-art" aria-hidden="true"><div className="planet-halo" /><div className="planet"><span className="planet-ring" /><span className="planet-shine" /></div><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit-dot" /><div className="floating-star star-a">✦</div><div className="floating-star star-b">✧</div><div className="floating-star star-c">✦</div><div className="floating-label"><Sparkles size={12} /> LEVEL UP</div></div>
      <div className="hero-foot"><span><span className="hero-status-dot" /> YOUR PROGRESS, SAVED AUTOMATICALLY</span><span>01 <i /> 03</span></div>
    </section>

    <div className="section-heading"><div><div className="eyebrow">YOUR LEARNING PATH</div><h2>Choose your next move</h2></div><button className="text-button" onClick={() => navigate('Quiz Lab')}>View all subjects <ArrowRight size={14} /></button></div>
    <div className="subject-grid">
      {subjects.slice(0, 4).map((item, index) => <button className={`subject-card ${subject === item.name ? 'subject-card-selected' : ''}`} key={item.name} onClick={() => { setSubject(item.name); navigate('AI Tutor') }}>
        <div className="subject-card-top"><div className={`subject-emblem ${item.color}`}>{item.icon}</div><span className="card-index">0{index + 1}</span></div>
        <h3>{item.name}</h3><span className="subject-lessons">{item.lessons}</span>
        <div className="subject-progress"><i className={item.color} style={{ width: `${item.progress}%` }} /></div>
        <div className="subject-card-foot"><span>{item.progress}% complete</span><span className="subject-go"><ArrowUpRight size={14} /></span></div>
      </button>)}
    </div>

    <div className="lower-grid">
      <section className="panel continue-panel"><div className="panel-head"><div><div className="eyebrow">PICK UP WHERE YOU LEFT OFF</div><h3>Continue your journey</h3></div><button className="round-arrow" onClick={() => navigate('AI Tutor')} aria-label="Continue"><ArrowUpRight size={17} /></button></div>
        <div className="continue-item"><div className="continue-icon math-icon">∑</div><div className="continue-copy"><span>MATHEMATICS <i>•</i> UNIT 4</span><b>Derivatives & applications</b><small>Lesson 3 of 5 <i /> 12 min left</small></div><button className="continue-play" onClick={() => navigate('AI Tutor')}><ArrowRight size={16} /></button></div>
        <div className="continue-line"><span style={{ width: '62%' }} /></div>
      </section>
      <section className="panel stats-panel"><div className="panel-head"><div><div className="eyebrow">THE BIG PICTURE</div><h3>Your momentum</h3></div><div className="period-select">THIS WEEK <ChevronDown size={13} /></div></div>
        <div className="stats-main"><div><strong>{profile.quizzes + 8}</strong><span>lessons completed</span></div><div className="stat-trend"><ArrowUpRight size={14} /> 18%</div></div>
        <div className="week-chart">{[30, 48, 37, 76, 52, 94, 66].map((height, i) => <div className="chart-col" key={i}><div className={`chart-bar ${i === 5 ? 'chart-bar-highlight' : ''}`} style={{ height: `${height}%` }}><span>{i === 5 ? '✨' : ''}</span></div><small>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</small></div>)}</div>
      </section>
    </div>
    <div className="quick-modes"><div className="eyebrow">READY FOR A DIFFERENT KIND OF CHALLENGE?</div><div className="quick-mode-row">
      <button onClick={() => navigate('Quiz Lab')}><div className="quick-icon quiz-quick"><Target size={17} /></div><div><b>Quiz Lab</b><span>Test your knowledge</span></div><ArrowRight size={15} /></button>
      <button onClick={() => navigate('Battle Arena')}><div className="quick-icon battle-quick"><Swords size={17} /></div><div><b>Battle Arena</b><span>Learn through play</span></div><ArrowRight size={15} /></button>
      <button onClick={() => navigate('AI Tutor')}><div className="quick-icon tutor-quick"><Brain size={17} /></div><div><b>AI Tutor</b><span>Ask anything, anytime</span></div><ArrowRight size={15} /></button>
    </div></div>
  </div>
}

function SubjectSelect({ value, onChange }: { value: Subject; onChange: (subject: Subject) => void }) {
  return <label className="select-wrap"><span>SUBJECT</span><select value={value} onChange={event => onChange(event.target.value as Subject)}>{subjects.map(item => <option key={item.name}>{item.name}</option>)}</select><ChevronDown size={14} /></label>
}

function Tutor({ subject, setSubject, addReward, incrementTutorQuestions }: {
  subject: Subject; setSubject: (s: Subject) => void; addReward: (xp: number, coins?: number, message?: string) => void; incrementTutorQuestions: () => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', text: `Hey Alex! I'm your Studyverse tutor. What are you working on in ${subject} today? I can break down tricky concepts, quiz you, or help you build a study plan.` }])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [apiError, setApiError] = useState('')
  const [canRetry, setCanRetry] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pendingRef = useRef(false)
  const requestControllerRef = useRef<AbortController | null>(null)
  const retryRequestRef = useRef<TutorRequest | null>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, thinking])
  useEffect(() => {
    requestControllerRef.current?.abort()
    requestControllerRef.current = null
    pendingRef.current = false
    retryRequestRef.current = null
    setThinking(false)
    setApiError('')
    setCanRetry(false)
    setMessages([{ role: 'assistant', text: `Hey Alex! I'm your Studyverse tutor. What are you working on in ${subject} today? I can break down tricky concepts, quiz you, or help you build a study plan.` }])
    return () => requestControllerRef.current?.abort()
  }, [subject])

  const requestTutor = async (request: TutorRequest) => {
    if (pendingRef.current) return
    const controller = new AbortController()
    requestControllerRef.current = controller
    pendingRef.current = true
    setThinking(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal,
      })
      let payload: unknown
      try {
        payload = await response.json()
      } catch {
        throw new Error('invalid_response')
      }

      if (!response.ok) {
        const code = typeof payload === 'object' && payload !== null && 'error' in payload && typeof payload.error === 'string'
          ? payload.error
          : 'api_error'
        const diagnostic = typeof payload === 'object' && payload !== null && 'diagnostic' in payload && typeof payload.diagnostic === 'string'
          ? payload.diagnostic
          : undefined
        console.error('[Studyverse AI Tutor]', JSON.stringify({
          endpoint: '/api/chat',
          status: response.status,
          error: code,
          ...(diagnostic ? { diagnostic } : {}),
        }))
        throw new Error(code)
      }
      if (typeof payload !== 'object' || payload === null || !('reply' in payload)) {
        throw new Error('invalid_response')
      }
      const reply = payload.reply
      if (typeof reply !== 'string' || !reply.trim()) throw new Error('invalid_response')

      setMessages(current => [...current, { role: 'assistant', text: reply }])
      retryRequestRef.current = null
      setCanRetry(false)
      incrementTutorQuestions()
      addReward(5, 2, '+5 XP · Great question!')
    } catch (error) {
      if (!controller.signal.aborted) {
        const code = error instanceof Error ? error.message : 'network_error'
        const errorMessages: Record<string, string> = {
          missing_api_key: 'AI 튜터를 사용할 수 없습니다. 프로젝트 루트의 .env에 OPENAI_API_KEY를 설정하고 개발 서버를 다시 시작해 주세요.',
          invalid_server_configuration: 'OpenAI API 키가 올바르지 않습니다. 서버 환경 변수 설정을 확인해 주세요.',
          quota_exceeded: 'OpenAI API 사용 한도 또는 크레딧이 부족합니다. OpenAI 결제 및 사용 한도를 확인해 주세요.',
          rate_limited: 'OpenAI 요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.',
          upstream_unavailable: 'AI 서비스에 연결할 수 없습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.',
          request_timeout: '응답 시간이 초과되었습니다. 다시 시도해 주세요.',
          request_too_large: '메시지가 너무 깁니다. 질문을 짧게 줄여 다시 시도해 주세요.',
          invalid_request: '요청을 처리할 수 없습니다. 질문을 확인한 뒤 다시 시도해 주세요.',
          invalid_response: 'AI 서비스에서 응답을 읽지 못했습니다. 다시 시도해 주세요.',
          upstream_error: 'OpenAI가 요청을 거부했습니다. 개발자 콘솔과 서버 로그에서 모델 및 요청 오류를 확인해 주세요.',
          empty_response: 'OpenAI에서 텍스트 응답을 받지 못했습니다. 서버 로그를 확인해 주세요.',
          api_error: 'AI 튜터 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        }
        console.error('[Studyverse AI Tutor] Request failed in the browser.', {
          error: code,
          message: error instanceof Error ? error.message : 'Unknown client error',
        })
        setApiError(errorMessages[code] ?? 'AI 튜터에 연결할 수 없습니다. 연결을 확인한 뒤 다시 시도해 주세요.')
        setCanRetry(code !== 'invalid_request' && code !== 'request_too_large')
      }
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null
        pendingRef.current = false
        setThinking(false)
      }
    }
  }

  const send = (text = input, intent: TutorIntent = 'chat') => {
    if (!text.trim() || pendingRef.current) return
    const nextMessages = [...messages, { role: 'user' as const, text: text.trim() }].slice(-12)
    const request: TutorRequest = {
      subject,
      intent,
      messages: nextMessages.map(message => ({ role: message.role, content: message.text })),
    }
    setMessages(nextMessages)
    setInput('')
    setApiError('')
    setCanRetry(false)
    retryRequestRef.current = request
    void requestTutor(request)
  }
  const retryLastRequest = () => {
    if (!retryRequestRef.current || pendingRef.current) return
    setApiError('')
    void requestTutor(retryRequestRef.current)
  }
  const onKey = (event: KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send() } }

  return <div className="page-wrap feature-page">
    <div className="feature-title-row"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR PERSONAL LEARNING COMPANION</div><h1>Meet your <em>tutor.</em></h1><p>Big questions, small steps. Let's figure it out together.</p></div><div className={`tutor-badge ${thinking ? 'tutor-badge-loading' : ''}`}><span className="tutor-spark"><Sparkles size={17} /></span><div><b>STUDYVERSE AI</b><span>{thinking ? 'THINKING…' : 'READY TO HELP'}</span></div><i /></div></div>
    <div className="tutor-layout">
      <section className="chat-panel panel">
        <div className="chat-top"><div className="chat-tutor-avatar"><Brain size={19} /><span /></div><div className="chat-tutor-meta"><b>Nova <span>✦</span></b><small>Your AI learning companion</small></div><SubjectSelect value={subject} onChange={setSubject} /><button className="icon-btn chat-more" title="Tutor settings"><span>···</span></button></div>
        <div className="chat-context"><Lightbulb size={14} /><span>Tip: Ask Nova to explain a concept, quiz you, or help make a study plan.</span></div>
        <div className="chat-messages">
          <div className="chat-date">TODAY · {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date())}</div>
          {messages.map((message, index) => <div className={`message-row ${message.role === 'user' ? 'message-user' : ''}`} key={`${index}-${message.role}`}>
            {message.role === 'assistant' && <div className="message-avatar"><Sparkles size={13} /></div>}
            <div className="message-content"><div className="message-bubble">{message.text}</div><small>{message.role === 'assistant' ? 'NOVA · AI TUTOR' : 'YOU · JUST NOW'}</small></div>
            {message.role === 'user' && <div className="message-user-avatar">A</div>}
          </div>)}
          {thinking && <div className="message-row"><div className="message-avatar"><Sparkles size={13} /></div><div className="typing-bubble"><i /><i /><i /></div></div>}
          <div ref={bottomRef} />
        </div>
        {apiError && <div className="tutor-error" role="alert"><CircleHelp size={15} /><span>{apiError}</span>{canRetry && <button onClick={retryLastRequest} disabled={thinking}>다시 시도</button>}</div>}
        <div className="suggestion-row"><span>TRY ASKING</span>
          <button onClick={() => send(`Explain a key concept in ${subject} simply`, 'explain')}><Lightbulb size={12} />Explain it simply</button>
          <button onClick={() => send(`${subject} 연습 퀴즈를 만들어 줘.`, 'quiz')}><Target size={12} />Give me a quiz</button>
          <button onClick={() => send('효과적인 학습 계획을 세우는 것을 도와줘.')}><Clock3 size={12} />Make a study plan</button>
          <button onClick={() => send('내가 틀린 문제를 분석해 줘. 문제와 내 답, 정답을 확인하고 싶어.', 'analyze')}><CircleHelp size={12} />Analyze a mistake</button>
        </div>
        <div className="chat-input-row"><input value={input} maxLength={4000} onChange={e => setInput(e.target.value)} onKeyDown={onKey} placeholder={`Ask anything about ${subject.toLowerCase()}...`} aria-label="Message your AI tutor" /><button className="send-button" onClick={() => send()} disabled={!input.trim() || thinking} aria-label="Send message"><Send size={16} /></button></div>
        <div className="chat-disclaimer">Nova can make mistakes. Double-check important information. <span>Powered by curiosity <Sparkles size={11} /></span></div>
      </section>
      <aside className="tutor-aside">
        <div className="panel focus-panel"><div className="aside-label">YOUR CURRENT FOCUS</div><div className="focus-subject"><div className={`subject-emblem ${subjects.find(s => s.name === subject)?.color}`}>{subjects.find(s => s.name === subject)?.icon}</div><div><b>{subject}</b><span>Unit 4 · {subject === 'Mathematics' ? 'Calculus' : 'Core concepts'}</span></div></div><div className="focus-progress"><div><span>UNIT PROGRESS</span><b>{subjects.find(s => s.name === subject)?.progress}%</b></div><div className="subject-progress"><i className={subjects.find(s => s.name === subject)?.color} style={{ width: `${subjects.find(s => s.name === subject)?.progress}%` }} /></div></div><button className="aside-link" onClick={() => setSubject(subjects[(subjects.findIndex(s => s.name === subject) + 1) % subjects.length].name)}>Change subject <ArrowRight size={14} /></button></div>
        <div className="panel tutor-tip-panel"><div className="tip-icon"><WandSparkles size={16} /></div><div className="aside-label">A LITTLE STUDY MAGIC</div><h3>Learn by teaching.</h3><p>Try explaining a concept back to Nova in your own words. It’s one of the most powerful ways to make knowledge stick.</p><span className="tip-tag">THE FEYNMAN TECHNIQUE</span></div>
        <div className="session-xp"><span className="xp-mini"><Zap size={13} /></span><div><b>Study sessions earn XP</b><small>Keep the questions coming!</small></div><span>+5 <small>XP</small></span></div>
      </aside>
    </div>
  </div>
}

function QuizLab({ subject, setSubject, addReward, updateProfile, quizzes }: {
  subject: Subject; setSubject: (s: Subject) => void; addReward: (xp: number, coins?: number, message?: string) => void; updateProfile: (patch: Partial<Profile>) => void; quizzes: number
}) {
  const [quiz, setQuiz] = useState<typeof quizBank[Subject] | null>(null)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [answerChecked, setAnswerChecked] = useState(false)
  const [finished, setFinished] = useState(false)
  const current = quiz?.[index]
  const startQuiz = () => { setQuiz(quizBank[subject]); setIndex(0); setSelected(null); setAnswers([]); setAnswerChecked(false); setFinished(false) }
  const submitAnswer = () => setAnswerChecked(true)
  const continueQuiz = () => {
    if (selected === null || !current) return
    const nextAnswers = [...answers, selected === current.answer]
    setAnswers(nextAnswers)
    if (index >= (quiz?.length ?? 0) - 1) {
      setFinished(true)
      updateProfile({ quizzes: quizzes + 1 })
      const score = nextAnswers.filter(Boolean).length
      addReward(35 + score * 15, 20 + score * 8, `Quiz complete · ${score}/${quiz?.length} correct · XP earned!`)
      return
    }
    setIndex(value => value + 1)
    setSelected(null)
    setAnswerChecked(false)
  }
  const reset = () => { setQuiz(null); setFinished(false); setIndex(0); setSelected(null); setAnswers([]); setAnswerChecked(false) }

  return <div className="page-wrap feature-page">
    <div className="feature-title-row"><div><div className="eyebrow"><span className="eyebrow-line" /> PRACTICE MAKES PROGRESS</div><h1>Welcome to the <em>Quiz Lab.</em></h1><p>Turn what you know into what you can do. One question at a time.</p></div><div className="quiz-flask">✳</div></div>
    {!quiz ? <div className="quiz-layout"><section className="quiz-start panel"><div className="quiz-orb"><Target size={28} /></div><div className="eyebrow">YOUR NEXT CHALLENGE</div><h2>Ready to test your<br /><em>knowledge?</em></h2><p>Build a quick challenge from your favorite subject. Three questions, instant feedback, and XP for every effort.</p><div className="quiz-config"><SubjectSelect value={subject} onChange={setSubject} /><div className="quiz-config-item"><span>QUESTION COUNT</span><b>03 <small>QUESTIONS</small></b></div><div className="quiz-config-item"><span>DIFFICULTY</span><b><span className="difficulty-dot" /> Adaptive</b></div></div><button className="primary-btn quiz-start-btn" onClick={startQuiz}>Generate my quiz <WandSparkles size={16} /></button><div className="quiz-start-foot"><Shield size={13} /> Questions adapt to your selected subject</div></section>
      <aside className="quiz-side"><div className="panel quiz-reward"><div className="reward-spark"><Sparkles size={17} /></div><div className="aside-label">THE GOOD STUFF</div><h3>Every answer<br />moves you forward.</h3><div className="reward-line"><span>Complete a quiz</span><b>+35 XP</b></div><div className="reward-line"><span>Each correct answer</span><b>+15 XP</b></div><div className="reward-line"><span>Bonus coins</span><b>+20 ◈</b></div></div>
        <div className="quiz-previous panel"><div className="aside-label">YOUR RECENT ACTIVITY</div><div className="empty-activity"><div><BookOpen size={18} /></div><b>Your next win is waiting.</b><span>Finish a quiz to see your results here.</span></div></div></aside></div>
      : finished ? <section className="quiz-result panel"><div className="result-medal"><Trophy size={30} /></div><div className="eyebrow">CHALLENGE COMPLETE</div><h2>{answers.filter(Boolean).length === 3 ? 'Perfectly done.' : 'You showed up.'}</h2><p>{answers.filter(Boolean).length} of 3 correct · You earned rewards for putting in the work.</p><div className="result-score">{answers.filter(Boolean).length}<span>/03</span></div><div className="result-answer-list">{quiz.map((q, i) => <div key={q.question}><span className={answers[i] ? 'answer-correct' : 'answer-incorrect'}>{answers[i] ? <Check size={13} /> : <X size={13} />}</span><b>Question {i + 1}</b><span>{answers[i] ? 'Correct' : 'Keep practicing'}</span></div>)}</div><div className="result-actions"><button className="primary-btn" onClick={reset}>Back to Quiz Lab <ArrowRight size={15} /></button><button className="secondary-btn" onClick={startQuiz}>Try another <RotateIcon /></button></div></section>
      : current ? <section className="quiz-question-panel panel">
        <div className="quiz-progress-head"><div><div className="eyebrow">{subject.toUpperCase()} · KNOWLEDGE CHECK</div><h2>Your challenge awaits.</h2></div><button className="secondary-btn" onClick={reset}>Exit quiz <X size={14} /></button></div>
        <div className="quiz-question-progress"><span>QUESTION {String(index + 1).padStart(2, '0')} <i /> 03</span><div>{quiz.map((_, i) => <i key={i} className={i < index ? 'done' : i === index ? 'current' : ''} />)}</div></div>
        <div className="quiz-question-layout">
          <div className="quiz-question-main">
            <div className="question-count">{String(index + 1).padStart(2, '0')} <span>—</span> 03</div>
            <h3 className="question-text">{current.question}</h3>
            <div className="answer-options">{current.choices.map((choice, i) => {
              const answerClass = answerChecked ? (i === current.answer ? 'answer-correct-option' : selected === i ? 'answer-incorrect-option' : '') : ''
              return <button key={choice} disabled={answerChecked} onClick={() => setSelected(i)} className={`answer-option ${selected === i ? 'answer-selected' : ''} ${answerClass}`}><span className="answer-letter">{String.fromCharCode(65 + i)}</span>{choice}<span className="answer-radio">{selected === i && <i />}</span></button>
            })}</div>
            <div className="quiz-question-foot"><span><Clock3 size={14} /> TAKE YOUR TIME</span><button className="primary-btn" disabled={selected === null} onClick={answerChecked ? continueQuiz : submitAnswer}>{answerChecked ? index === 2 ? 'Finish quiz' : 'Next question' : 'Check answer'} <ArrowRight size={15} /></button></div>
          </div>
          <aside className={`quiz-explanation-panel ${answerChecked ? 'is-revealed' : ''}`} aria-live="polite">
            <div className="aside-label">{answerChecked ? selected === current.answer ? 'THAT’S RIGHT' : 'KEEP LEARNING' : 'ANSWER EXPLANATION'}</div>
            <h3>{answerChecked ? selected === current.answer ? 'Well reasoned.' : 'Here’s how to solve it.' : 'One step at a time.'}</h3>
            <p>{answerChecked ? current.explanation : 'Choose the answer that makes sense to you. We’ll walk through the reasoning here.'}</p>
            {answerChecked && <span className={`explanation-result ${selected === current.answer ? 'is-correct' : 'is-incorrect'}`}>{selected === current.answer ? <Check size={14} /> : <Lightbulb size={14} />}{selected === current.answer ? 'Correct answer' : `Correct answer: ${current.choices[current.answer]}`}</span>}
          </aside>
        </div>
      </section> : null}
  </div>
}

function RotateIcon() { return <ArrowUpRight size={15} /> }

type Enemy = { x: number; y: number; hp: number; maxHp: number; speed: number; boss: boolean }
type Bullet = { x: number; y: number; vx: number; vy: number; life: number; damage: number }
type ArenaItemKind = 'health' | 'ammo' | 'damage' | 'speed' | 'shield' | 'rapid'
type ArenaItem = { kind: ArenaItemKind; x: number; y: number; expiresAt: number }

const arenaItems: { kind: ArenaItemKind; label: string; color: string }[] = [
  { kind: 'health', label: '체력 회복 +30', color: '#ff6f91' },
  { kind: 'ammo', label: '탄약 충전 +30', color: '#ffd166' },
  { kind: 'damage', label: '공격력 증가', color: '#ff944d' },
  { kind: 'speed', label: '이동 속도 증가', color: '#48e4bf' },
  { kind: 'shield', label: '보호막 획득', color: '#66b8ff' },
  { kind: 'rapid', label: '연사 속도 증가', color: '#bd8cff' },
]

function BattleArena({ profile, updateProfile, addReward }: {
  profile: Profile; updateProfile: (patch: Partial<Profile>) => void; addReward: (xp: number, coins?: number, message?: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef({ running: false, raf: 0, player: { x: 0, y: 0 }, mouse: { x: 0, y: 0 }, keys: new Set<string>(), enemies: [] as Enemy[], bullets: [] as Bullet[], items: [] as ArenaItem[], buffs: { damageUntil: 0, speedUntil: 0, shieldUntil: 0, rapidUntil: 0 }, ammo: 90, nextShotFrame: 0, fireHeld: false, lastSpawn: 0, lastItemSpawn: 0, gameFrame: 0, frame: 0, hp: 100, kills: 0, score: 0, wave: 1, bossSpawned: false, hitFlash: 0, invulnerable: 0 })
  const [running, setRunning] = useState(false)
  const [hp, setHp] = useState(100)
  const [ammo, setAmmo] = useState(90)
  const [kills, setKills] = useState(0)
  const [wave, setWave] = useState(1)
  const [shopOpen, setShopOpen] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [message, setMessage] = useState('Press start to enter the arena')
  const [pickupNotice, setPickupNotice] = useState('')
  const [activeBuffs, setActiveBuffs] = useState<ArenaItemKind[]>([])
  const weaponLevelRef = useRef(profile.weapon)
  const pickupNoticeTimerRef = useRef<number | null>(null)
  const activeBuffSignatureRef = useRef('')
  weaponLevelRef.current = profile.weapon

  useEffect(() => () => {
    if (pickupNoticeTimerRef.current !== null) window.clearTimeout(pickupNoticeTimerRef.current)
  }, [])

  useEffect(() => {
    const state = gameRef.current
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let width = 0
    let height = 0
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = width * ratio
      canvas.height = height * ratio
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      if (!state.running) state.player = { x: width / 2, y: height / 2 }
      state.mouse = state.mouse.x === 0 && state.mouse.y === 0 ? { x: width * 0.8, y: height / 2 } : state.mouse
    }
    resize()
    window.addEventListener('resize', resize)
    const draw = () => {
      state.raf = requestAnimationFrame(draw)
      state.frame++
      const frame = state.frame
      if (state.running) state.gameFrame++
      const gameFrame = state.gameFrame
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = '#0c111b'
      ctx.fillRect(0, 0, width, height)
      ctx.strokeStyle = 'rgba(122,145,181,.055)'
      ctx.lineWidth = 1
      for (let x = (frame * 0.13) % 28; x < width; x += 28) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke() }
      for (let y = (frame * 0.13) % 28; y < height; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke() }
      for (let i = 0; i < 32; i++) {
        const x = (i * 97 + frame * (i % 3 + 0.15)) % Math.max(width, 1)
        const y = (i * 61 + Math.sin(frame * 0.016 + i) * 9) % Math.max(height, 1)
        ctx.fillStyle = `rgba(162,185,220,${0.1 + (i % 4) * 0.04})`
        ctx.fillRect(x, y, i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1)
      }
      const center = state.player
      if (state.running) {
        const key = state.keys
        let dx = Number(key.has('d') || key.has('arrowright')) - Number(key.has('a') || key.has('arrowleft'))
        let dy = Number(key.has('s') || key.has('arrowdown')) - Number(key.has('w') || key.has('arrowup'))
        if (dx && dy) { dx *= 0.707; dy *= 0.707 }
        const moveSpeed = gameFrame < state.buffs.speedUntil ? 5 : 3.2
        center.x = Math.max(19, Math.min(width - 19, center.x + dx * moveSpeed))
        center.y = Math.max(19, Math.min(height - 19, center.y + dy * moveSpeed))
        if (gameFrame - state.lastSpawn > Math.max(45, 114 - state.wave * 7) && !state.bossSpawned) {
          state.lastSpawn = gameFrame
          const angle = Math.random() * Math.PI * 2
          const side = Math.floor(Math.random() * 4)
          const x = side < 2 ? (side === 0 ? -15 : width + 15) : Math.random() * width
          const y = side >= 2 ? (side === 2 ? -15 : height + 15) : Math.random() * height
          state.enemies.push({ x: Math.max(-15, Math.min(width + 15, x + Math.cos(angle) * 24)), y: Math.max(-15, Math.min(height + 15, y + Math.sin(angle) * 24)), hp: 1 + Math.floor(state.wave / 3), maxHp: 1 + Math.floor(state.wave / 3), speed: 0.55 + Math.random() * 0.35 + state.wave * 0.04, boss: false })
        }
        const itemInterval = Math.max(240, 600 - Math.floor(gameFrame / 3600) * 45 - (state.wave - 1) * 30)
        if (gameFrame - state.lastItemSpawn >= itemInterval && state.items.length < 4) {
          state.lastItemSpawn = gameFrame
          let position = { x: 34 + Math.random() * Math.max(1, width - 68), y: 34 + Math.random() * Math.max(1, height - 68) }
          for (let attempt = 0; attempt < 8 && Math.hypot(position.x - center.x, position.y - center.y) < 76; attempt++) {
            position = { x: 34 + Math.random() * Math.max(1, width - 68), y: 34 + Math.random() * Math.max(1, height - 68) }
          }
          const item = arenaItems[Math.floor(Math.random() * arenaItems.length)]
          state.items.push({ kind: item.kind, ...position, expiresAt: gameFrame + 600 })
        }
        state.items = state.items.filter(item => item.expiresAt > gameFrame)
        const activeBuffsNow: ArenaItemKind[] = []
        if (gameFrame < state.buffs.damageUntil) activeBuffsNow.push('damage')
        if (gameFrame < state.buffs.speedUntil) activeBuffsNow.push('speed')
        if (gameFrame < state.buffs.shieldUntil) activeBuffsNow.push('shield')
        if (gameFrame < state.buffs.rapidUntil) activeBuffsNow.push('rapid')
        const buffSignature = activeBuffsNow.join(',')
        if (activeBuffSignatureRef.current !== buffSignature) {
          activeBuffSignatureRef.current = buffSignature
          setActiveBuffs(activeBuffsNow)
        }
        if (state.kills >= state.wave * 5 && !state.bossSpawned) {
          state.bossSpawned = true
          state.enemies.push({ x: width / 2, y: -45, hp: 10 + state.wave * 3, maxHp: 10 + state.wave * 3, speed: 0.5 + state.wave * 0.04, boss: true })
          setMessage(`⚠ WAVE ${state.wave} BOSS INBOUND`)
        }
        if (state.bossSpawned && state.enemies.every(enemy => !enemy.boss) && state.kills >= state.wave * 5) {
          state.bossSpawned = false
          state.wave++
          setWave(state.wave)
          addReward(50, 25, `Wave cleared! +50 XP · +25 coins`)
          setMessage(`WAVE ${state.wave} · KEEP GOING`)
        }
        for (const bullet of state.bullets) { bullet.x += bullet.vx; bullet.y += bullet.vy; bullet.life-- }
        state.bullets = state.bullets.filter(b => b.life > 0 && b.x > -20 && b.x < width + 20 && b.y > -20 && b.y < height + 20)
        for (const enemy of state.enemies) {
          const vx = center.x - enemy.x
          const vy = center.y - enemy.y
          const dist = Math.hypot(vx, vy) || 1
          enemy.x += (vx / dist) * enemy.speed
          enemy.y += (vy / dist) * enemy.speed
          if (dist < (enemy.boss ? 29 : 19) + 12 && state.invulnerable <= 0) {
            if (state.buffs.shieldUntil > gameFrame) {
              state.buffs.shieldUntil = 0
              state.invulnerable = 46
              setMessage('SHIELD ABSORBED A HIT')
            } else {
              state.hp = Math.max(0, state.hp - (enemy.boss ? 15 : 8))
              state.invulnerable = 46
              state.hitFlash = 9
              setHp(state.hp)
              if (state.hp <= 0) { state.running = false; state.fireHeld = false; setRunning(false); setGameOver(true); setMessage('RUN OVER · THE ARENA CLAIMS ANOTHER'); updateProfile({ hp: 100 }) }
            }
          }
        }
        state.invulnerable = Math.max(0, state.invulnerable - 1)
        state.hitFlash = Math.max(0, state.hitFlash - 1)
        for (const bullet of state.bullets) {
          for (const enemy of state.enemies) {
            if (Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y) < (enemy.boss ? 29 : 17)) {
              bullet.life = 0
              enemy.hp -= bullet.damage
              break
            }
          }
        }
        const pickedItems = state.items.filter(item => Math.hypot(item.x - center.x, item.y - center.y) < 25)
        if (pickedItems.length) {
          state.items = state.items.filter(item => !pickedItems.includes(item))
          for (const item of pickedItems) {
            switch (item.kind) {
              case 'health':
                state.hp = Math.min(100, state.hp + 30)
                setHp(state.hp)
                break
              case 'ammo':
                state.ammo = Math.min(120, state.ammo + 30)
                setAmmo(state.ammo)
                break
              case 'damage':
                state.buffs.damageUntil = gameFrame + 900
                break
              case 'speed':
                state.buffs.speedUntil = gameFrame + 900
                break
              case 'shield':
                state.buffs.shieldUntil = gameFrame + 900
                break
              case 'rapid':
                state.buffs.rapidUntil = gameFrame + 900
                break
            }
            const itemInfo = arenaItems.find(info => info.kind === item.kind)
            const notice = `아이템 획득 · ${itemInfo?.label ?? item.kind}`
            setPickupNotice(notice)
            setMessage(notice)
            if (pickupNoticeTimerRef.current !== null) window.clearTimeout(pickupNoticeTimerRef.current)
            pickupNoticeTimerRef.current = window.setTimeout(() => setPickupNotice(''), 2600)
          }
        }
        if (state.fireHeld) fireShot()
        const dead = state.enemies.filter(enemy => enemy.hp <= 0)
        if (dead.length) {
          state.enemies = state.enemies.filter(enemy => enemy.hp > 0)
          const count = dead.filter(enemy => !enemy.boss).length + dead.filter(enemy => enemy.boss).length
          state.kills += count
          setKills(state.kills)
          addReward(dead.some(enemy => enemy.boss) ? 80 : 3, dead.some(enemy => enemy.boss) ? 45 : 1, dead.some(enemy => enemy.boss) ? 'Boss defeated · +80 XP · +45 coins' : undefined)
          if (dead.some(enemy => enemy.boss)) state.bossSpawned = true
        }
      }
      for (const bullet of state.bullets) {
        ctx.beginPath(); ctx.fillStyle = '#5bf3d0'; ctx.shadowColor = '#5bf3d0'; ctx.shadowBlur = 12; ctx.arc(bullet.x, bullet.y, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0
      }
      for (const item of state.items) {
        const info = arenaItems.find(entry => entry.kind === item.kind)
        if (!info) continue
        const pulse = 1 + Math.sin(frame * 0.11 + item.x) * 0.08
        ctx.save()
        ctx.translate(item.x, item.y)
        ctx.scale(pulse, pulse)
        ctx.beginPath()
        ctx.fillStyle = `${info.color}22`
        ctx.arc(0, 0, 18, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.fillStyle = `${info.color}33`
        ctx.strokeStyle = info.color
        ctx.lineWidth = 2
        ctx.shadowColor = info.color
        ctx.shadowBlur = 13
        switch (item.kind) {
          case 'health':
            ctx.moveTo(0, 10); ctx.bezierCurveTo(-3, 7, -11, 2, -11, -4); ctx.bezierCurveTo(-11, -11, -2, -12, 0, -6); ctx.bezierCurveTo(2, -12, 11, -11, 11, -4); ctx.bezierCurveTo(11, 2, 3, 7, 0, 10)
            break
          case 'ammo':
            ctx.moveTo(-6, 10); ctx.lineTo(-6, -3); ctx.lineTo(-3, -8); ctx.lineTo(-3, -11); ctx.lineTo(3, -11); ctx.lineTo(3, -8); ctx.lineTo(6, -3); ctx.lineTo(6, 10); ctx.closePath()
            break
          case 'damage':
            ctx.moveTo(0, -11); ctx.lineTo(11, 9); ctx.lineTo(-11, 9)
            break
          case 'speed':
            ctx.moveTo(-10, -8); ctx.lineTo(-1, 0); ctx.lineTo(-10, 8); ctx.moveTo(1, -8); ctx.lineTo(10, 0); ctx.lineTo(1, 8)
            break
          case 'shield':
            for (let point = 0; point < 6; point++) {
              const angle = point * Math.PI / 3 - Math.PI / 2
              const x = Math.cos(angle) * 10
              const y = Math.sin(angle) * 10
              if (point === 0) ctx.moveTo(x, y)
              else ctx.lineTo(x, y)
            }
            ctx.closePath()
            break
          case 'rapid':
            for (let point = 0; point < 8; point++) {
              const angle = point * Math.PI / 4 - Math.PI / 2
              const radius = point % 2 === 0 ? 11 : 5
              const x = Math.cos(angle) * radius
              const y = Math.sin(angle) * radius
              if (point === 0) ctx.moveTo(x, y)
              else ctx.lineTo(x, y)
            }
            ctx.closePath()
            break
        }
        ctx.fill()
        ctx.stroke()
        ctx.restore()
      }
      for (const enemy of state.enemies) {
        const radius = enemy.boss ? 24 : 13
        const pulse = 1 + Math.sin(frame * 0.12 + enemy.x) * 0.06
        ctx.save(); ctx.translate(enemy.x, enemy.y); ctx.scale(pulse, pulse)
        ctx.beginPath(); ctx.fillStyle = enemy.boss ? 'rgba(255,81,119,.15)' : 'rgba(255,104,121,.12)'; ctx.arc(0, 0, radius + 8, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.fillStyle = enemy.boss ? '#b83860' : '#a9405b'; ctx.shadowColor = '#ff5579'; ctx.shadowBlur = 15; ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0
        ctx.beginPath(); ctx.fillStyle = enemy.boss ? '#ff8b9e' : '#ffabb2'; ctx.arc(-radius * 0.25, -radius * 0.12, enemy.boss ? 3 : 2, 0, Math.PI * 2); ctx.arc(radius * 0.25, -radius * 0.12, enemy.boss ? 3 : 2, 0, Math.PI * 2); ctx.fill()
        if (enemy.boss || enemy.hp < enemy.maxHp) {
          const barWidth = enemy.boss ? 58 : 28
          ctx.fillStyle = '#252b39'; ctx.fillRect(-barWidth / 2, -radius - 10, barWidth, 3)
          ctx.fillStyle = enemy.boss ? '#ff6383' : '#ffab70'; ctx.fillRect(-barWidth / 2, -radius - 10, barWidth * Math.max(0, enemy.hp / enemy.maxHp), 3)
        }
        ctx.restore()
      }
      if (state.running && state.buffs.shieldUntil > gameFrame) {
        ctx.beginPath()
        ctx.strokeStyle = 'rgba(102,184,255,.82)'
        ctx.lineWidth = 2
        ctx.shadowColor = '#66b8ff'
        ctx.shadowBlur = 12
        ctx.arc(center.x, center.y, 20, 0, Math.PI * 2)
        ctx.stroke()
        ctx.shadowBlur = 0
      }
      const aim = state.mouse
      const angle = Math.atan2(aim.y - center.y, aim.x - center.x)
      ctx.save(); ctx.translate(center.x, center.y); ctx.rotate(angle)
      ctx.fillStyle = '#b5c8db'; ctx.fillRect(3, -4, 17, 8)
      ctx.beginPath(); ctx.fillStyle = state.hitFlash ? '#ff526e' : '#56e8d0'; ctx.shadowColor = '#50f3d9'; ctx.shadowBlur = 16; ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0
      ctx.beginPath(); ctx.fillStyle = '#c9fff5'; ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
      if (!state.running) {
        ctx.fillStyle = 'rgba(7,10,16,.47)'; ctx.fillRect(0, 0, width, height)
        ctx.textAlign = 'center'; ctx.fillStyle = '#c3cdda'; ctx.font = '500 12px "Space Grotesk", sans-serif'; ctx.fillText(gameOver ? 'THE ARENA REMEMBERS' : 'ARENA // STANDBY', width / 2, height / 2 - 9)
        ctx.fillStyle = '#788699'; ctx.font = '11px "DM Sans", sans-serif'; ctx.fillText(gameOver ? 'Start a new run to fight another day' : 'Your next lesson is hiding behind that horde', width / 2, height / 2 + 13)
      }
    }
    draw()
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(state.raf) }
  }, [addReward, gameOver, profile.games, updateProfile])

  useEffect(() => {
    const keyDown = (event: globalThis.KeyboardEvent) => { if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault(); gameRef.current.keys.add(event.key.toLowerCase()) }
    const keyUp = (event: globalThis.KeyboardEvent) => gameRef.current.keys.delete(event.key.toLowerCase())
    const clearKeys = () => { gameRef.current.keys.clear(); gameRef.current.fireHeld = false }
    window.addEventListener('keydown', keyDown)
    window.addEventListener('keyup', keyUp)
    window.addEventListener('blur', clearKeys)
    return () => { window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp); window.removeEventListener('blur', clearKeys) }
  }, [])

  const startGame = () => {
    const state = gameRef.current
    state.running = true; state.hp = 100; state.ammo = 90; state.kills = 0; state.wave = 1; state.bossSpawned = false; state.enemies = []; state.bullets = []; state.items = []; state.buffs = { damageUntil: 0, speedUntil: 0, shieldUntil: 0, rapidUntil: 0 }; state.nextShotFrame = 0; state.fireHeld = false; state.lastSpawn = state.gameFrame; state.lastItemSpawn = state.gameFrame - 360; state.invulnerable = 0
    activeBuffSignatureRef.current = ''
    setActiveBuffs([])
    const rect = canvasRef.current?.getBoundingClientRect()
    state.player = { x: (rect?.width ?? 500) / 2, y: (rect?.height ?? 330) / 2 }
    state.mouse = { x: state.player.x + 120, y: state.player.y }
    setHp(100); setAmmo(90); setKills(0); setWave(1); setRunning(true); setGameOver(false); setPickupNotice(''); setMessage('WAVE 1 · HUNT THE MONSTERS')
    updateProfile({ games: profile.games + 1 })
  }
  const aimAt = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    gameRef.current.mouse = { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }
  const fireShot = () => {
    const state = gameRef.current
    if (!state.running || state.ammo <= 0 || state.gameFrame < state.nextShotFrame) return
    const dx = state.mouse.x - state.player.x
    const dy = state.mouse.y - state.player.y
    const dist = Math.hypot(dx, dy) || 1
    const weaponLevel = weaponLevelRef.current
    const shots = weaponLevel >= 4 ? [-0.12, 0, 0.12] : [0]
    for (const offset of shots) {
      const angle = Math.atan2(dy, dx) + offset
      state.bullets.push({ x: state.player.x + (dx / dist) * 19, y: state.player.y + (dy / dist) * 19, vx: Math.cos(angle) * 8, vy: Math.sin(angle) * 8, life: 48, damage: (weaponLevel >= 3 ? 2 : 1) + (state.gameFrame < state.buffs.damageUntil ? 1 : 0) })
    }
    state.ammo = Math.max(0, state.ammo - 1)
    setAmmo(state.ammo)
    state.nextShotFrame = state.gameFrame + (state.gameFrame < state.buffs.rapidUntil ? 4 : 11)
  }
  const shoot = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    aimAt(event)
    gameRef.current.fireHeld = true
    fireShot()
  }
  const stopFiring = () => { gameRef.current.fireHeld = false }
  const holdDirection = (key: string, event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    gameRef.current.keys.add(key)
  }
  const releaseDirection = (key: string) => gameRef.current.keys.delete(key)
  const fireAtTouch = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    const state = gameRef.current
    const canvas = canvasRef.current
    if (!canvas || !state.running) return
    const target = state.enemies.reduce<Enemy | null>((nearest, enemy) => {
      if (!nearest || Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y) < Math.hypot(nearest.x - state.player.x, nearest.y - state.player.y)) return enemy
      return nearest
    }, null)
    if (target) state.mouse = { x: target.x, y: target.y }
    state.fireHeld = true
    fireShot()
  }
  const upgradePrice = profile.weapon * 150
  const buyUpgrade = () => {
    if (profile.coins < upgradePrice) { setMessage('NOT ENOUGH COINS · KEEP FIGHTING'); return }
    updateProfile({ coins: profile.coins - upgradePrice, weapon: Math.min(4, profile.weapon + 1) })
    setShopOpen(false); setMessage('UPGRADE ACQUIRED · WEAPON POWER INCREASED')
  }
  const repair = () => {
    if (profile.coins < 60) { setMessage('NOT ENOUGH COINS · KEEP FIGHTING'); return }
    updateProfile({ coins: profile.coins - 60 }); gameRef.current.hp = 100; setHp(100); setShopOpen(false); setMessage('REPAIR KIT USED · HP RESTORED')
  }
  return <div className="page-wrap feature-page arena-page">
    <div className="feature-title-row"><div><div className="eyebrow"><span className="eyebrow-line" /> LEARN THROUGH PLAY</div><h1>Enter the <em>Battle Arena.</em></h1><p>Outthink the monsters. Outsmart the boss. Earn XP for every takedown.</p></div><button className="arena-help" onClick={() => setHelpOpen(!helpOpen)}><CircleHelp size={15} /> HOW TO PLAY</button></div>
    {helpOpen && <div className="help-banner"><b>WASD / ARROW KEYS</b> to move <i /> <b>MOUSE</b> to aim and hold to fire <i /> Walk over supply drops to collect them <i /> Drops expire after 10 seconds. <button onClick={() => setHelpOpen(false)}><X size={14} /></button></div>}
    <div className="arena-hud"><div className="hud-block hp-block"><span><Heart size={13} /> VITALS</span><b>{hp}<small> / 100</small></b><div className="hud-bar"><i className={hp < 30 ? 'critical' : ''} style={{ width: `${hp}%` }} /></div></div><div className="hud-block wave-block"><span><Crosshair size={13} /> CURRENT WAVE</span><b>0{wave}</b><small>{kills} TAKEDOWNS</small></div><div className="hud-block weapon-block"><span><Swords size={13} /> LOADOUT</span><b>Pulse Rifle <small>MK {profile.weapon}</small></b><div className="weapon-pips">{[1, 2, 3, 4].map(level => <i className={profile.weapon >= level ? 'filled' : ''} key={level} />)}</div></div><div className="hud-block currency-block"><span><span className="coin">◈</span> CREDITS</span><b>{profile.coins}</b><button onClick={() => setShopOpen(true)}>OPEN SHOP <ArrowUpRight size={12} /></button></div></div>
    <div className="arena-item-legend" aria-label="Items appear during the mission and disappear if not collected">
      {arenaItems.map(item => <span key={item.kind}><i className={`item-legend-shape item-${item.kind}`} style={{ color: item.color }} />{item.label}</span>)}
      {activeBuffs.length > 0 && <b className="arena-active-buffs">{activeBuffs.map(kind => arenaItems.find(item => item.kind === kind)?.label).join(' · ')}</b>}
    </div>
    <section className="game-panel panel">
      <div className="game-topbar"><div><span className={`game-live-dot ${running ? 'is-live' : ''}`} /><b>{running ? 'LIVE SIMULATION' : 'SIMULATION PAUSED'}</b><span className="game-separator">/</span><span>{message}</span></div><span className="game-code">SV-AR{String(wave).padStart(2, '0')} · {running ? 'REC' : 'READY'}</span></div>
      <div className="canvas-wrap"><canvas ref={canvasRef} onPointerMove={aimAt} onPointerDown={shoot} onPointerUp={stopFiring} onPointerLeave={stopFiring} onPointerCancel={stopFiring} aria-label="Battle Arena game area. Collect items by walking into them. Move using WASD or arrow keys and aim and shoot with your mouse or touchscreen." />
        {pickupNotice && <div className="pickup-notice" role="status" aria-live="polite"><Sparkles size={16} />{pickupNotice}</div>}
        <div className="touch-controls" role="group" aria-label="Touch game controls">
          <div className="touch-pad">
            <button type="button" aria-label="Move up" onPointerDown={event => holdDirection('w', event)} onPointerUp={() => releaseDirection('w')} onPointerCancel={() => releaseDirection('w')}>↑</button>
            <button type="button" aria-label="Move left" onPointerDown={event => holdDirection('a', event)} onPointerUp={() => releaseDirection('a')} onPointerCancel={() => releaseDirection('a')}>←</button>
            <button type="button" aria-label="Move down" onPointerDown={event => holdDirection('s', event)} onPointerUp={() => releaseDirection('s')} onPointerCancel={() => releaseDirection('s')}>↓</button>
            <button type="button" aria-label="Move right" onPointerDown={event => holdDirection('d', event)} onPointerUp={() => releaseDirection('d')} onPointerCancel={() => releaseDirection('d')}>→</button>
          </div>
          <button type="button" className="touch-fire" onPointerDown={fireAtTouch} onPointerUp={stopFiring} onPointerLeave={stopFiring} onPointerCancel={stopFiring}><Crosshair size={19} /><span>FIRE</span></button>
        </div>
      </div>
      <div className="game-control-bar"><div className="controls-hint"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> MOVE</span><i /><span><MousePointer2 size={13} /> AIM + FIRE</span><i /><span className="hp-hint"><Heart size={12} /> {hp}% HP</span><i /><span className="ammo-hint">AMMO {ammo}</span></div><div className="game-actions"><button className="shop-button" onClick={() => setShopOpen(true)}><ShoppingBag size={14} /> ITEM SHOP</button><button className={`arena-start ${running ? 'pause-btn' : ''}`} onClick={running ? () => { gameRef.current.running = false; gameRef.current.fireHeld = false; setRunning(false); setMessage('SIMULATION PAUSED · PRESS RESUME WHEN READY') } : startGame}>{running ? 'PAUSE RUN' : gameOver ? 'RUN IT BACK' : 'START MISSION'} <ArrowRight size={14} /></button></div></div>
    </section>
    <div className="arena-bottom-grid"><div className="arena-tip panel"><div className="arena-tip-icon"><Lightbulb size={16} /></div><div><b>STRATEGY TIP</b><span>Keep moving! Monsters chase your last position. Circle the arena to avoid getting cornered.</span></div></div><div className="arena-reward panel"><div className="arena-reward-icon"><Trophy size={17} /></div><div><b>EVERY TAKEDOWN COUNTS</b><span>+3 XP <i>·</i> Boss defeat +80 XP <i>·</i> Next boss at {wave * 5} kills</span></div></div></div>
    {shopOpen && <div className="modal-backdrop" onClick={() => setShopOpen(false)}><section className="shop-modal panel" onClick={event => event.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">FIELD SUPPLY</div><h2>Item shop</h2></div><button className="icon-btn" onClick={() => setShopOpen(false)} aria-label="Close shop"><X size={18} /></button></div><div className="shop-wallet"><span>YOUR CREDITS</span><b><span className="coin">◈</span> {profile.coins}</b></div><div className="shop-item"><div className="shop-item-icon weapon-shop"><Crosshair size={20} /></div><div className="shop-item-copy"><b>Pulse rifle upgrade <span>MK {Math.min(profile.weapon + 1, 4)}</span></b><small>{profile.weapon < 2 ? 'Increase your firepower.' : profile.weapon < 3 ? 'Deal double damage to enemies.' : profile.weapon < 4 ? 'Unlock a three-shot spread.' : 'Maximum weapon level reached.'}</small><div className="shop-level-pips">{[1, 2, 3, 4].map(level => <i className={profile.weapon >= level ? 'filled' : ''} key={level} />)}</div></div><button className="buy-button" disabled={profile.weapon >= 4 || profile.coins < upgradePrice} onClick={buyUpgrade}>{profile.weapon >= 4 ? 'MAX' : <><span className="coin">◈</span> {upgradePrice}</>}</button></div><div className="shop-item"><div className="shop-item-icon heal-shop"><Heart size={19} /></div><div className="shop-item-copy"><b>Field repair kit</b><small>Restore your HP to full. One use per purchase.</small></div><button className="buy-button" disabled={profile.coins < 60} onClick={repair}><span className="coin">◈</span> 60</button></div><div className="shop-disclaimer"><Shield size={13} /> Upgrades persist between missions. Choose your loadout wisely.</div></section></div>}
  </div>
}

function Achievements({ profile, level, addReward, updateProfile }: {
  profile: Profile; level: number; addReward: (xp: number, coins?: number, message?: string) => void; updateProfile: (patch: Partial<Profile>) => void
}) {
  const allAchievements = [
    { id: 'first-steps', name: 'First Steps', description: 'Start your Studyverse journey.', icon: Rocket, progress: 1, goal: 1, rewardXp: 50, unlocked: true },
    { id: 'curious-mind', name: 'Curious Mind', description: 'Ask your tutor 10 questions.', icon: Brain, progress: Math.min(profile.tutorQuestions, 10), goal: 10, rewardXp: 100, unlocked: profile.tutorQuestions >= 10 },
    { id: 'quiz-whiz', name: 'Quiz Whiz', description: 'Complete 5 knowledge checks.', icon: Target, progress: Math.min(profile.quizzes, 5), goal: 5, rewardXp: 150, unlocked: profile.quizzes >= 5 },
    { id: 'arena-rookie', name: 'Arena Rookie', description: 'Enter your first battle.', icon: Gamepad2, progress: Math.min(profile.games, 1), goal: 1, rewardXp: 75, unlocked: profile.games > 0 },
    { id: 'streak-keeper', name: 'Streak Keeper', description: 'Build a 7-day learning streak.', icon: Flame, progress: Math.min(profile.streak, 7), goal: 7, rewardXp: 200, unlocked: profile.streak >= 7 },
    { id: 'level-up', name: 'Level Up', description: 'Reach level 5 in your journey.', icon: Award, progress: Math.min(level, 5), goal: 5, rewardXp: 250, unlocked: level >= 5 },
  ]
  const unlocked = allAchievements.filter(item => item.unlocked).length
  return <div className="page-wrap feature-page">
    <div className="feature-title-row"><div><div className="eyebrow"><span className="eyebrow-line" /> LITTLE WINS, BIG MOMENTUM</div><h1>Your <em>achievements.</em></h1><p>Every milestone tells a story. Look how far you've come.</p></div><div className="achievement-summary"><div className="achievement-badge"><Trophy size={21} /></div><div><b>{unlocked} <span>/ {allAchievements.length}</span></b><small>MILESTONES UNLOCKED</small></div></div></div>
    <div className="achievement-progress panel"><div className="ach-progress-icon"><Award size={18} /></div><div className="ach-progress-copy"><b>Your explorer's path</b><span>Collect milestones as you learn, play, and grow.</span></div><div className="ach-progress-right"><b>{Math.round(unlocked / allAchievements.length * 100)}%</b><div><i style={{ width: `${unlocked / allAchievements.length * 100}%` }} /></div></div></div>
    <div className="section-heading achievement-section-heading"><div><div className="eyebrow">THE COLLECTION</div><h2>Milestones & memories</h2></div><span className="achievement-count">{unlocked} UNLOCKED</span></div>
    <div className="achievement-grid">{allAchievements.map(item => {
      const Icon = item.icon
      const claimed = profile.completed.includes(item.id)
      const claimReward = () => {
        updateProfile({ completed: [...profile.completed, item.id] })
        addReward(item.rewardXp, 25, `${item.name} claimed · +${item.rewardXp} XP · +25 coins`)
      }
      return <article className={`achievement-card panel ${item.unlocked ? 'unlocked' : ''}`} key={item.id}><div className="achievement-card-top"><div className={`achievement-icon ${item.unlocked ? '' : 'locked'}`}><Icon size={20} /></div>{item.unlocked ? <span className="unlocked-tag"><Check size={11} /> UNLOCKED</span> : <span className="locked-tag"><LockKeyhole size={12} /> LOCKED</span>}</div><h3>{item.name}</h3><p>{item.description}</p><div className="achievement-card-bottom"><div className="achievement-progress-line"><i style={{ width: `${item.progress / item.goal * 100}%` }} /></div><span>{item.progress}/{item.goal}</span>{item.unlocked && !claimed ? <button className="claim-reward" onClick={claimReward}>CLAIM +{item.rewardXp} XP</button> : <b>{claimed ? 'CLAIMED' : `+${item.rewardXp} XP`}</b>}</div></article>
    })}</div>
    <div className="achievement-footnote"><Sparkles size={14} /> The best achievement? The knowledge you take with you.</div>
  </div>
}

export default App
