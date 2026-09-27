# Project decisions

- Keep hosted-preview authentication's trusted origin list and message protocol unchanged; they are an external compatibility contract for shared sessions, while standalone/local use falls back to localStorage.
- Do not load development-only component tagging; the application has no runtime dependency on editor tooling.
- Broadcast demo-session updates to all authentication hook instances; the sign-in screen and route guard otherwise disagree until refresh.