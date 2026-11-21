import { useEffect, useState } from 'react'
import { Bookmark, ChevronDown, Clock3, Compass, MapPin, Ruler, Shield, ExternalLink } from 'lucide-react'
import type { FortSection } from '../data/sections'
import { sectionIcons } from './sectionIcons'
import { uiText, type Language } from '../i18n'

export function InfoPanel({ section, isSaved, onToggleSaved, language }: { section: FortSection | null; isSaved: boolean; onToggleSaved: () => void; language: Language }) {
  const t = uiText[language]
  const [expanded, setExpanded] = useState(false)
  useEffect(() => setExpanded(false), [section?.id])
  return <aside className="info-panel" id="infoPanel">
    {!section ? <div className="welcome-panel"><div className="welcome-mark"><Compass size={30} /></div><h1>{t.welcomeTitle}</h1><p className="info-subtitle">{t.welcomeSubtitle}</p><p className="info-description">{t.welcomeDescription}</p></div> : <>
    {(() => { const SectionIcon = sectionIcons[section.icon]; return <>
    <div className="info-panel__top">
      <button className="info-bookmark" type="button" aria-label={isSaved ? t.unsave : t.save} aria-pressed={isSaved} onClick={onToggleSaved}>
        <Bookmark size={24} fill={isSaved ? 'currentColor' : 'none'} />
      </button>
      <span className="info-panel__dot" style={{ backgroundColor: section.color }} />
      <span>{section.name}</span>
    </div>
    <div className="info-hero">
      <span className="info-panel__image" aria-hidden="true"><SectionIcon className="info-panel__section-icon" strokeWidth={1.7} /></span>
      <div className="info-hero__copy"><h1>{section.name}</h1><p className="info-subtitle">{section.subtitle}</p></div>
    </div>
    <p className="info-description">{section.description}</p>
    <div className="facts-title">{t.facts}</div>
    <dl className="fact-list">
      <div><dt><Ruler size={15} /> {t.size}</dt><dd>{t.sizeValue}</dd></div>
      <div><dt><Clock3 size={15} /> {t.age}</dt><dd>{t.ageValue}</dd></div>
      <div><dt><Compass size={15} /> {t.use}</dt><dd>{t.useValue}</dd></div>
      <div><dt><MapPin size={15} /> {t.location}</dt><dd>{t.locationValue}</dd></div>
      <div><dt><Shield size={15} /> {t.materials}</dt><dd>{t.materialsValue}</dd></div>
    </dl>
    <button className="more-info-toggle" type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
      <span>{expanded ? t.less : t.more}</span><ChevronDown size={18} className={expanded ? 'more-info-toggle__icon more-info-toggle__icon--open' : 'more-info-toggle__icon'} />
    </button>
    {expanded && <div className="section-learning" aria-live="polite">
      {section.topics.map((topic) => <section className="section-learning__topic" key={topic.heading}><h2>{topic.heading}</h2><p>{topic.text}</p></section>)}
      <p className={`section-attribution section-attribution--${section.attribution}`}><strong>{t.note}</strong> {section.detail}</p>
      <div className="section-source"><strong>{t.source}</strong>{section.source.url ? <a href={section.source.url} target="_blank" rel="noreferrer">{section.source.label}<ExternalLink size={14} aria-hidden="true" /></a> : <span>{section.source.label}</span>}</div>
    </div>}
    </> })()}
    </>}
  </aside>
}
