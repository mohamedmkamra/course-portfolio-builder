# Course Portfolio Builder

A browser-based tool for faculty to organize teaching materials, assessments, and reports for the courses they teach each semester. The app is independent of any university or department.

Work on one course portfolio at a time: set its semester, course code, and section; customize the folder structure; add files; review missing items; and export a ZIP with a spreadsheet manifest. Save and reuse templates across courses and semesters.

Files and progress are stored locally in your browser using IndexedDB. There is no backend, account system, or cloud sync. Export each course before starting another; the app retains one active working session. Browser storage is specific to the browser and site address, so export your work before changing devices or moving to a hosted URL.

## Default template

New sessions start with this folder structure:

```text
<semester>_<courseCode>_<section>/
├── 1_Delivered Syllabus_Lect Notes/
├── 2_Assessment Instruments/
│   ├── 1_Assignments/
│   ├── 2_Exams/
│   ├── 3_Project/
│   └── 4_Quizzes/
├── 3_Student Graded_Samples/
│   ├── Assignments/
│   ├── Exams/
│   ├── Projects/
│   └── Quizzes/
└── 4_Reports/
```

Each leaf folder accepts multiple files and preserves their original filenames on export. These folders are required by default; you can edit their required/optional settings. Exports also include the existing spreadsheet manifest and, when an override is used, a missing-items report.

Existing autosaved sessions and user-saved defaults still take precedence. To use this built-in structure in an existing session, export any work you want to keep, then choose **Reset to latest default**. This replaces the working structure and clears its attached files after confirmation.

## Run locally

With Node.js and npm installed:

```sh
npm ci
npm run dev
```

## Build

```sh
npm run build
npm run preview
```

The static website is generated in `dist/`. ZIP export works without a server; writing directly to a selected folder additionally requires browser support for the File System Access API.

## GitHub Pages later

The app can be hosted as a static site. Vite uses relative asset paths (`base: "./"`) so the build can be served at a repository URL such as `https://<username>.github.io/<repository>/`.

When ready to publish, use the [official Vite GitHub Pages deployment guide](https://vite.dev/guide/static-deploy#github-pages): select **GitHub Actions** in the repository's **Settings → Pages**, and add the documented workflow to install dependencies with `npm ci`, run `npm run build`, and deploy `dist/`. Keep this project's relative `base` setting; it does not need a repository name hardcoded into it.

Commit the source and `package-lock.json`. The `.gitignore` excludes dependencies, generated build output, generated configuration files, and local `.tar.gz` archives. No deployment workflow is enabled yet.
