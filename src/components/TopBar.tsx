import { Castle, GalleryVerticalEnd, Map } from 'lucide-react'
import type { Language } from '../i18n'
import { uiText } from '../i18n'

export function TopBar({ language, onToggleLanguage, onOpenLearning }: { language: Language; onToggleLanguage: () => void; onOpenLearning: () => void }) {
  const t = uiText[language]
  return <header className="topbar">
    <a href="#viewer" className="brand"><strong>{t.title}</strong></a>
    <div className="topbar-actions"><button className="language-toggle" type="button" onClick={onToggleLanguage} aria-label={language === 'en' ? t.switchToArabic : t.switchToEnglish}>{language === 'en' ? 'عربي' : 'EN'}</button>
    <nav className="main-nav" aria-label={t.nav}>
      <a className="main-nav__active" href="#viewer"><Map size={19} />{t.explore}</a><a href="#sectionList"><Castle size={18} />{t.sections}</a><button type="button" onClick={onOpenLearning}><GalleryVerticalEnd size={18} />{t.gallery}</button>
    </nav>
    </div>
  </header>
}
