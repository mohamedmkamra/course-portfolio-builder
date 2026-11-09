# Course Portfolio Builder Architecture

## 1. Project Architecture

- Frontend-only Vite + React + TypeScript application
- Tailwind CSS design system with a three-panel responsive workspace
- Browser storage layer using IndexedDB for autosave and template persistence
- Client-side export engine using JSZip, SheetJS, FileSaver, and File System Access API when available

## 2. Frontend Structure

```text
src/
├── App.tsx
├── components/
│   ├── DetailsPanel.tsx
│   ├── LeftTreePanel.tsx
│   ├── ReadinessModal.tsx
│   ├── StatusPill.tsx
│   └── WorkspacePanel.tsx
├── data/
│   └── defaultTemplate.ts
├── utils/
│   ├── export.ts
│   ├── id.ts
│   ├── naming.ts
│   ├── storage.ts
│   ├── tree.ts
│   └── validation.ts
└── types.ts
```

## 3. Backend Structure

- No backend is used
- All file handling is non-destructive and browser-local
- Exports are generated in memory, downloaded as ZIP, or written to a user-selected folder when browser support exists

## 4. Component Hierarchy

- `App`
- `LeftTreePanel`
- `WorkspacePanel`
- `DetailsPanel`
- `ReadinessModal`
- `StatusPill`

## 5. State Management Design

- `App.tsx` holds the primary state for MVP simplicity and predictability
- State domains:
  - Template tree
  - Portfolio metadata
  - Uploaded file registry
  - Selection state
  - Readiness and override state
  - Saved templates
- Derived state is computed with memoized validation and readiness summaries

## 6. Storage Strategy

- IndexedDB stores:
  - Active autosave session
  - Saved JSON-based templates
- Autosave persists both structure and file `Blob`s so interrupted sessions can recover without re-uploading

## 7. API Design

- No external API
- Internal client-side service contracts:
  - `validateTree(root, files)` → validation map
  - `createExportArtifacts(...)` → file artifact list
  - `saveSnapshot(snapshot)` / `loadSnapshot()`
  - `saveTemplate(template)` / `loadTemplates()`

## 8. File Processing Workflow

1. User selects a portfolio node
2. Files are dropped or selected
3. Files are stored with original metadata and classification role
4. Live validation recalculates immediately
5. Export creates renamed copies only
6. Manifest and override report are generated during export

## 9. Validation Engine Design

- Generic folders:
  - Required leaf folders need at least one file
  - Parent folders derive status from children
- Assessment folders:
  - Must contain `Assessment File`
  - Must contain `Student Samples`
  - Must contain either `Rubric` or `Model Answer / Solution`
- Outputs:
  - Per-node status
  - Missing required items
  - Optional gaps
  - Completion ratio
  - Portfolio readiness percentage

## 10. Export Pipeline

1. Build export root folder name from semester, course code, section
2. Traverse the template tree
3. Generate renamed copies using the naming convention
4. Create `portfolio_manifest.xlsx`
5. Create `missing_items_report.txt` when override is used
6. Package artifacts into ZIP or write them to a selected folder

## 11. Responsive UI Implementation

- Desktop: fixed three-panel grid
- Tablet/small laptop: same grid with tighter spacing
- Smaller screens: left and right panels become toggled sections, center workspace stays primary

## 12. Tailwind Design System

- Soft slate base palette for long-session comfort
- Clear status colors:
  - Green = complete
  - Red = blocking
  - Amber = partial
  - Gray = optional
- Reusable utility classes:
  - `panel`
  - `panel-title`
  - `input-base`
  - `btn-primary`
  - `btn-secondary`

## 13. Suggested Icons, Colors, Layouts

- Status icons:
  - `✅` complete
  - `❌` missing required
  - `⚠️` partial
  - `❓` optional
- Layout:
  - Left = structure and progress
  - Center = action workspace
  - Right = detail and guidance

## 14. MVP Notes

- Current MVP delivers the guided portfolio workflow, live validation, template editing, autosave, manifest generation, ZIP export, and optional folder export
- Recommended next steps:
  - Add richer PDF preview
  - Add drag-to-reparent tree editing
  - Add bulk classification helpers
  - Introduce Zustand when the app grows beyond single-screen state ownership
