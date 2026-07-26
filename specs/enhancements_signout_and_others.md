# Enhancements: Header Navigation & Quiz Progress Smilies

Feature requests captured for future planning. Not yet planned or implemented.

## 1. Persistent top header

- A header bar present at the top of the page.
- **Left**: a logo that links back to the home page (`/`).
- **Right**: a sign-out option.

## 2. Quiz progress smilies

- Shown at the bottom of the question card while taking a quiz.
- Number of smiley icons equals the number of questions selected for the quiz (the chosen quiz length).
- Initial state: all smilies grey (unanswered).
- As each question is answered, its corresponding smiley updates:
  - **Correct** → green, smiling face.
  - **Incorrect** → red, sad face.
- Smiley order corresponds to question order (position N reflects question N's status).

## Open questions for later

- Should the header appear on every page (landing, signin/signup, quiz, history) or only on authenticated pages?
- Logo: text wordmark or image asset? No image logo currently exists in the project.
- Should the smiley row be interactive (e.g. click a smiley to jump to that question) or a passive progress indicator only?
- Exact smiley icon set/style (emoji vs. custom SVG/icon).
