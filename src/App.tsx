import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, BookOpen, CalendarDays, Layers3, PlaySquare, RotateCcw, Scale, Settings, UserRound, X, ZoomIn, ZoomOut } from 'lucide-react'
import { FortViewer, type ViewerHandle } from './components/FortViewer'
import { InfoPanel } from './components/InfoPanel'
import { SectionSidebar } from './components/SectionSidebar'
import { TopBar } from './components/TopBar'
import { sections } from './data/sections'
import { localizeSections, uiText, type Language } from './i18n'

const learningIcons = [CalendarDays, Scale, PlaySquare, UserRound, Settings]

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem('nizwa-language') === 'en' ? 'en' : 'ar')
  const [autoRotate, setAutoRotate] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [showHotspots, setShowHotspots] = useState(true)
  const [loading, setLoading] = useState(true)
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [savedOnly, setSavedOnly] = useState(false)
  const [learningOpen, setLearningOpen] = useState<{ title: string; subtitle: string; description: string } | null>(null)
  const [learningHubOpen, setLearningHubOpen] = useState(false)
  const viewer = useRef<ViewerHandle>(null)
  const t = uiText[language]
  const localizedSections = localizeSections(language, sections)
  const selected = localizedSections.find((section) => section.id === selectedId) ?? null
  const toggleSaved = () => { if (selectedId) setSavedIds((current) => current.includes(selectedId) ? current.filter((id) => id !== selectedId) : [...current, selectedId]) }

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
    document.title = t.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.description)
    localStorage.setItem('nizwa-language', language)
  }, [language, t.title])

  useEffect(() => {
    const clearOutsideSelection = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('.section-panel, .info-panel, .viewer-panel, .topbar, .modal-backdrop')) return
      setSelectedId(null)
    }
    document.addEventListener('pointerdown', clearOutsideSelection)
    return () => document.removeEventListener('pointerdown', clearOutsideSelection)
  }, [])

  return <div className="app-shell min-h-screen" dir={language === 'ar' ? 'rtl' : 'ltr'}>
    <TopBar language={language} onToggleLanguage={() => setLanguage((value) => value === 'ar' ? 'en' : 'ar')} onOpenLearning={() => setLearningHubOpen(true)} />
    <div className="workspace">
      <SectionSidebar sections={savedOnly ? localizedSections.filter((section) => savedIds.includes(section.id)) : localizedSections} selectedId={selectedId} onSelect={setSelectedId} savedOnly={savedOnly} savedCount={savedIds.length} onToggleSaved={() => setSavedOnly((value) => !value)} onShowAll={() => { setSavedOnly(false); setSelectedId(null) }} language={language} />
      <section className="viewer-panel" id="viewer" aria-label={t.viewer}>
        <FortViewer ref={viewer} selectedId={selectedId} onSelect={setSelectedId} autoRotate={autoRotate} showHotspots={showHotspots} onLoadingChange={setLoading} language={language} />
        {loading && <div className="loading-label">{t.loading}</div>}
        <aside className="viewer-tools" aria-label={t.viewerTools}>
          <button onClick={() => viewer.current?.reset()} title={t.reset}><RotateCcw /><span>{t.reset}</span></button>
          <button onClick={() => viewer.current?.zoom('in')} title={t.zoomIn}><ZoomIn /><span>{t.zoomIn}</span></button>
          <button onClick={() => viewer.current?.zoom('out')} title={t.zoomOut}><ZoomOut /><span>{t.zoomOut}</span></button>
          <button onClick={() => setShowHotspots((visible) => !visible)} title={t.layers} aria-pressed={showHotspots}><Layers3 /><span>{t.layers}</span></button>
        </aside>
        <div className="viewer-tip"><span className="tip-bulb">✦</span><div><strong>{t.tip}</strong><p>{t.drag}<br />{t.pinch}<br />{t.hotspotTip}</p></div></div>
        <div className="viewer-caption"><div><small>{t.caption}</small><strong>{t.city}</strong></div><label className="rotation-switch"><span>{t.autoRotate}</span><input type="checkbox" checked={autoRotate} onChange={(event) => setAutoRotate(event.target.checked)} /><i /></label></div>
      </section>
      <InfoPanel section={selected} isSaved={selectedId ? savedIds.includes(selectedId) : false} onToggleSaved={toggleSaved} language={language} />
    </div>
    <span id="history" className="visually-hidden">{t.history}</span>
    {learningOpen && <div className="modal-backdrop" role="presentation" onClick={() => setLearningOpen(null)}><section className="compare-modal learning-modal" role="dialog" aria-modal="true" aria-labelledby="learning-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setLearningOpen(null)} aria-label={t.close}><X size={21} /></button><span className="modal-mark"><BookOpen size={22} /></span><h2 id="learning-title">{learningOpen.title}</h2><p>{learningOpen.description}</p><button className="primary-button" onClick={() => setLearningOpen(null)}>{t.done} <ArrowLeft size={18} /></button></section></div>}
    {learningHubOpen && <div className="modal-backdrop" role="presentation" onClick={() => setLearningHubOpen(false)}><section className="compare-modal learning-hub" role="dialog" aria-modal="true" aria-labelledby="hub-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setLearningHubOpen(false)} aria-label={t.close}><X size={21} /></button><span className="modal-mark"><BookOpen size={22} /></span><h2 id="hub-title">{t.hubTitle}</h2><div className="learning-options">{t.learning.map(([title, subtitle, description], index) => { const Icon = learningIcons[index]; return <button key={title} type="button" onClick={() => { setLearningHubOpen(false); setLearningOpen({ title, subtitle, description }) }}><Icon size={20} /><span><strong>{title}</strong><small>{subtitle}</small></span><ArrowLeft size={16} /></button> })}</div></section></div>}
  </div>
}
