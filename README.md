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

## GitHub Pages

The app can be hosted as a static site. Vite uses relative asset paths (`base: "./"`) so the build can be served at a repository URL such as `https://<username>.github.io/<repository>/`.

The published app is available at [mohamedmkamra.github.io/course-portfolio-builder](https://mohamedmkamra.github.io/course-portfolio-builder/).

The deployment workflow in `.github/workflows/deploy.yml` runs automatically on pushes to `main` and can also be started manually from **Actions → Deploy to GitHub Pages → Run workflow**. It installs dependencies with `npm ci`, builds the app, and deploys only `dist/`. Build and deployment results are available in the repository's **Actions** tab.

For forks, select **GitHub Actions** in **Settings → Pages** before running the workflow. See the [official Vite deployment guide](https://vite.dev/guide/static-deploy#github-pages). Keep this project's relative `base` setting; it does not need a repository name hardcoded into it.

Commit the source and `package-lock.json`. The `.gitignore` excludes dependencies, generated build output, generated configuration files, and local `.tar.gz` archives.
