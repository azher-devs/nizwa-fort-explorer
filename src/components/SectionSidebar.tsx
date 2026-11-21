import { ArrowLeft, Bookmark } from 'lucide-react'
import type { FortSection } from '../data/sections'
import { sectionIcons } from './sectionIcons'
import { uiText, type Language } from '../i18n'

export function SectionSidebar({ sections, selectedId, onSelect, savedOnly, savedCount, onToggleSaved, onShowAll, language }: { sections: FortSection[]; selectedId: string | null; onSelect: (id: string) => void; savedOnly: boolean; savedCount: number; onToggleSaved: () => void; onShowAll: () => void; language: Language }) {
  const t = uiText[language]
  return <aside className="section-panel" id="sectionList">
    <div className="section-panel__heading"><h2>{t.sectionList}</h2><button className={`icon-button bookmark-button ${savedOnly ? 'bookmark-button--active' : ''}`} aria-label={savedOnly ? t.savedLabel : t.savedOnly(savedCount)} title={t.saved} onClick={onToggleSaved}><Bookmark size={19} fill={savedOnly ? 'currentColor' : 'none'} /></button></div>
    <div className="section-list">{sections.length === 0 ? <p className="empty-sections">{t.noMatches}</p> : sections.map((section) => {
      const Icon = sectionIcons[section.icon]
      return <button key={section.id} className={`section-row ${selectedId === section.id ? 'section-row--active' : ''}`} onClick={() => onSelect(section.id)} aria-pressed={selectedId === section.id}>
        <span className="section-thumb"><Icon size={24} strokeWidth={1.45} /></span>
        <span className="section-copy"><strong>{section.name}</strong><small>{section.subtitle}</small></span>
        {selectedId === section.id && <span className="section-dot" />}
      </button>
    })}</div>
    <button className="list-all" onClick={onShowAll}>{t.showAll} <ArrowLeft size={17} /></button>
  </aside>
}
