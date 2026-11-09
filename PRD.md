# Product Requirements Document (PRD)

## Course Portfolio Builder Web Application

---

# 1. Product Overview

## Product Name

**Course Portfolio Builder**

## Product Type

Responsive web application for academic course portfolio preparation and export.

## Primary Goal

Provide instructors with a highly intuitive and flexible system for building standardized course portfolios through:

- Drag-and-drop file management
- Guided portfolio completion
- Smart validation
- Automatic folder generation
- Standardized file naming
- ZIP export generation
- Reusable portfolio templates

The application should significantly reduce the administrative burden associated with preparing university course portfolios.

---

# 2. Problem Statement

University instructors are typically required to prepare course portfolios manually using rigid folder structures and inconsistent file naming conventions.

Current problems include:

- Time-consuming manual organization
- Inconsistent portfolio structures between instructors
- Missing required documentation
- Non-standard file names
- Difficulty validating completeness
- Repetitive folder creation every semester
- Poor portability across devices
- Lack of reusable portfolio templates

The proposed system addresses these issues through a guided, flexible, template-driven portfolio builder.

---

# 3. Product Vision

The application should feel like:

> “A smart assistant that guides the instructor through preparing a complete and standardized course portfolio.”

The application must be:

- Extremely intuitive
- Minimal-training
- Responsive
- Modern
- Visually clean
- Flexible but structured
- Safe and non-destructive

---

# 4. Target Users

## Primary Users

- University instructors
- Course coordinators
- Program coordinators

## Secondary Users

- Accreditation committees
- Department administrators

---

# 5. Core Product Philosophy

The system should prioritize:

| Priority | Requirement                   |
| -------- | ----------------------------- |
| High     | Ease of use                   |
| High     | Minimal learning curve        |
| High     | Guided workflow               |
| High     | Flexibility                   |
| High     | Validation and completeness   |
| High     | Professional export structure |
| Medium   | Smart automation              |
| Medium   | Template reusability          |
| Low      | AI features (future phase)    |

---

# 6. Platform Requirements

## Supported Platforms

- Windows
- macOS
- Linux
- iPadOS
- Android tablets

## Supported Browsers

- Chrome
- Edge
- Safari
- Firefox

## Responsive Requirements

The interface must adapt cleanly to:

- Desktop monitors
- Laptops
- Tablets
- iPads
- Small laptop screens

---

# 7. High-Level Workflow

```text
Create portfolio
↓
Load default or custom template
↓
Edit portfolio structure if needed
↓
Edit assessment structure if needed
↓
Upload and classify files
↓
Validate completeness
↓
Review missing items summary
↓
Generate portfolio folder
↓
Generate ZIP archive
↓
Export manifest and reports
```

---

# 8. Portfolio Template System

# 8.1 Default Portfolio Template

The application ships with a predefined default portfolio structure.

Example:

```text
Course Portfolio
├── Course Information
├── Course Materials
├── Assessments
├── Student Performance
├── CLO / LOMS Assessment
├── Course Review
└── Supporting Documents
```

---

# 8.2 Editable Structure

Users must be able to:

- Add folders
- Rename folders
- Delete folders
- Reorder folders
- Nest folders
- Duplicate folders
- Mark folders as required/optional

---

# 8.3 Template Save/Load

Users can:

## Save Current Structure as Template

Example:

```text
Course_Template.json
COURSE101_Template.json
Lab_Course_Template.json
```

## Load Existing Template

This allows instructors to reuse structures across semesters.

---

# 8.4 Template Content

Templates should include:

- Folder hierarchy
- Assessment types
- Required/optional rules
- Validation rules
- Naming conventions
- Export settings

---

# 9. Assessment System

# 9.1 Default Assessment Types

Default preset:

```text
Assignments / Homework
Quizzes
Midterm Exam
Final Exam
Projects
Reports
Presentations
Lab Reports
```

---

# 9.2 Editable Assessment Types

Users can:

- Add assessment types
- Rename assessment types
- Delete assessment types
- Duplicate assessment types
- Reorder assessment types

---

# 9.3 Assessment Substructure

Each assessment may contain:

```text
Assessment File
Model Answer / Solution
Rubric
Student Samples
CLO Mapping
Supporting Files
```

---

# 9.4 Validation Rule

Assessment is complete if:

```text
Assessment File exists
AND
Student Samples exist
AND
(Rubric exists OR Model Answer exists)
```

---

# 10. UI/UX Requirements

# 10.1 General UI Principles

The interface must be:

- Extremely intuitive
- Minimal-click
- Drag-and-drop driven
- Modern
- Clean
- Visually guided
- Self-explanatory

The system should not feel technical.

---

# 10.2 Main Layout

## Left Panel

Portfolio progress tree

## Center Panel

Workspace and upload area

## Right Panel

Selected item details and validation

---

# 10.3 Left Tree Panel

Example:

```text
✅ Course Information
⚠️ Course Materials
❌ Assessments
   ├── ✅ Assignments
   ├── ❌ Quizzes
   ├── ⚠️ Midterm
   └── ✅ Final
```

---

# 10.4 Status Icons

| Icon | Meaning                |
| ---- | ---------------------- |
| ✅   | Complete               |
| ❌   | Missing required items |
| ⚠️   | Partially complete     |
| ❓   | Optional or unchecked  |

---

# 10.5 Smart Guidance

Clicking any item shows:

- Missing files
- Required actions
- Uploaded files
- Suggested naming
- Validation state

---

# 10.6 Drag-and-Drop

Users can:

- Drag files directly
- Multi-select upload
- Drop folders
- Replace files
- Preview uploaded files

---

# 10.7 Responsive Design

Desktop:

- Three-panel layout

Tablet:

- Collapsible side panels

Mobile-width:

- Stacked layout

---

# 11. File Naming System

# 11.1 Automatic Standardized Naming

Uploaded files retain original files safely.

Copied export files receive standardized names.

---

# 11.2 Default Naming Convention

```text
Semester_CourseCode_Section_ItemType_FileRole.ext
```

Example:

```text
Spring2026_COURSE101_Section01_Midterm_Exam_Paper.pdf
Spring2026_COURSE101_Section01_Final_Student_Sample_High.pdf
```

---

# 11.3 Editable Naming Rules

Users may customize naming patterns.

---

# 12. Validation System

# 12.1 Continuous Validation

Validation updates live during editing.

---

# 12.2 Readiness Summary Page

Before build/export:

```text
Portfolio readiness: 87%
```

Sections:

- Complete items
- Missing required items
- Partial items
- Optional missing items

---

# 12.3 Blocking Rules

Build/export is blocked if required items are missing unless overridden.

---

# 12.4 Override System

Instructor may override missing items.

Each override requires:

- Explanation
- Optional future action note

---

# 12.5 Missing Items Report

If override occurs:

Generate:

```text
missing_items_report.txt
```

Stored in portfolio root directory.

---

# 13. Export System

# 13.1 Output Location

Instructor selects destination path.

Example:

```text
/Documents/CoursePortfolios/
```

---

# 13.2 Generated Output

Application creates:

```text
Spring2026_COURSE101_Section01/
```

Contains:

- Organized folders
- Renamed copies
- ZIP archive
- Manifest file
- Missing items report if needed

---

# 13.3 ZIP Generation

Automatic ZIP generation after successful build.

---

# 13.4 Manifest Generation

Generate:

```text
portfolio_manifest.xlsx
```

Contains:

- Original file names
- Export file names
- Classification
- Folder destination
- Validation state

---

# 14. Non-Functional Requirements

# 14.1 Performance

- Handle large portfolios
- Support hundreds of files
- Fast drag/drop interaction

---

# 14.2 Safety

The app must NEVER modify original files.

Only copies are processed.

---

# 14.3 Reliability

- Auto-save progress
- Recover interrupted sessions
- Prevent accidental deletion

---

# 14.4 Accessibility

- Keyboard navigation
- High contrast support
- Screen-reader compatibility where possible

---

# 15. Suggested Technology Stack

## Frontend

- React
- Vite
- TypeScript
- Tailwind CSS

## Backend

- This must be a frontend-only application with no backend.
   Use:
   - JSZip for ZIP generation
   - SheetJS/xlsx for Excel manifest generation
   - FileSaver.js for downloading ZIP files
   - IndexedDB or localStorage for saved templates and auto-save

## File Processing

- pathlib
- shutil
- zipfile
- openpyxl

## State Management

- Zustand or Redux

---

# 16. Future Enhancements

## AI-Assisted Classification

Auto-detect:

- Syllabus
- Exams
- Rubrics
- Student samples

---

## Cloud Storage Integration

- OneDrive
- Google Drive
- Dropbox

---

## Blackboard Integration

Import/export directly.

---

## Multi-user Collaboration

---

## Accreditation Modes

- ABET
- NCAAA
- Internal QA templates

---

# 17. MVP Scope

## Included

- Editable portfolio structure
- Editable assessment structure
- Template save/load
- Drag-and-drop uploads
- Validation system
- Left-tree guidance
- Readiness summary
- Standardized renaming
- Folder generation
- ZIP export
- Manifest generation
- Override system
- Missing-item reports

## Excluded (Phase 1)

- AI classification
- Cloud sync
- Blackboard integration
- OCR
- Multi-user editing

---

# 18. Success Criteria

The app is successful if instructors can:

- Build a complete course portfolio quickly
- Reuse templates across semesters
- Detect missing items easily
- Export standardized portfolios consistently
- Use the system without formal training
