# Nizwa Fort Explorer

## Overview

Nizwa Fort Explorer is a bilingual (Arabic and English) web experience for exploring an illustrative 3D reconstruction of Nizwa Fort. The model is generated locally in code; it is an educational visualization rather than a measured architectural model. Some surrounding structures and component locations are illustrative and are not presented as archaeologically verified.

To run the project locally:

```bash
npm install
npm run dev
```

To create and preview a production build:

```bash
npm run build
npm run preview
```

## Screenshots note

Screenshots are stored in `src/screenshots/`:

![Arabic language mode](src/screenshots/arabic%20language%20mode.png)

![English language mode](src/screenshots/english%20language%20mode%20.png)

## Features

- Explore a procedurally built 3D fort model with mouse, touch, and camera controls.
- Rotate, zoom, and reset the view; toggle automatic rotation and model hotspots.
- Select fort sections from the model or sidebar to highlight them and read descriptions, topics, notes, and references.
- Save sections during a session and filter the sidebar to show saved sections.
- Switch between Arabic and English; the interface updates its direction for right-to-left or left-to-right reading and remembers the language in local storage.
- Open the learning hub and its informational dialogs.
- Review historical context with source links and explicit notes where model details are illustrative or published measurements differ.

## Tech Stack

- React 19 and TypeScript
- Vite 7 with the React plugin
- Three.js, React Three Fiber, and Drei for the 3D scene and controls
- Tailwind CSS 4 with its Vite plugin, plus project-specific CSS
- Lucide React icons

## Architecture

The React application contains the top bar and workspace. The workspace brings together the section sidebar, 3D viewer, and information panel. The viewer contains the procedural fort model and its selectable hotspots.

```text
App
├── TopBar
└── Workspace
    ├── SectionSidebar
    ├── FortViewer
    │   └── FortModel
    │       └── Hotspots
    └── InfoPanel
```

The model geometry is built from Three.js primitives and procedural geometry; it does not load an external fort model. The tower proportions follow the 45 m diameter and 34 m height cited by [Experience Oman](https://experienceoman.om/en/destinations/al-dakhiliyah/nizwa-fort). The [Oman Ministry of Education](https://home.moe.gov.om/ar/pages/183/show/690?GetLang=en) publishes different figures (43 m external diameter and 24 m height). These references disagree, so the displayed model uses the former proportions without claiming an absolute scale. For additional background, see the [official Nizwa Fort site](https://nizwafort.om/ar/%D8%B9%D9%86-%D8%A7%D9%84%D9%82%D9%84%D8%B9%D8%A9/).

## Project Structure

```text
.
├── public/
│   └── fort-mark.svg          # Favicon
├── src/
│   ├── components/
│   │   ├── FortModel.tsx      # Procedural 3D fort geometry and hotspots
│   │   ├── FortViewer.tsx     # Scene, camera, lighting, and controls
│   │   ├── InfoPanel.tsx      # Selected-section details and sources
│   │   ├── SectionSidebar.tsx # Section selection and saved-section filter
│   │   └── TopBar.tsx         # Navigation and language toggle
│   ├── data/
│   │   └── sections.ts        # Section content, positions, and references
│   ├── screenshots/           # Arabic and English interface screenshots
│   ├── App.tsx                # Application layout and shared state
│   ├── i18n.ts                # Arabic and English UI text
│   ├── main.tsx               # React entry point
│   └── styles.css             # Application styles
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```
