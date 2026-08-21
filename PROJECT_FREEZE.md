# CodeScope — Project Freeze & Definition of Done

## 1. Product Scope
CodeScope is a developer tool that provides repository analysis, code exploration, and AI-assisted investigation.

**Current Capabilities:**
- **Repository Flow:** Connect local or remote repositories. Backend indexer processes the repository (parsing, mapping, symbol extraction).
- **Code Exploration:** View repository files, view parsed symbols and relationships in the workspace.
- **Investigation Flow:** AI-driven repository investigation where the system answers user queries based on indexed context.
- **AI Functionality:** `investigate` and `chat` functionalities are implemented.
- **Workspace UI:** The central shell contains a sidebar, a main content area (which houses the Code Graph or file viewer), and a Knowledge panel on the right.

**Trace (Frontend → API → Backend → Database):**
- **Frontend** calls `API_BASE/api/repo/index-local` or `/upload` to ingest a repository.
- **Backend API** receives the request and triggers the parsing/indexing logic.
- **Backend** processes files, extracting symbols and relationships.
- **Database** (SQLite) stores `Repo`, `File`, `Symbol`, and `SymbolRelationship` models via Prisma.
- The **Frontend** can then trigger investigations via `/api/repo/:id/investigate` or `/api/chat`.

## 2. Current User Journey
1. **Authentication:** User lands on the Login/Signup page.
2. **Launch Experience:** After authenticating, the user connects a new repository or selects an existing one from the list.
3. **Workspace:** The user enters the workspace for the selected repository. They can navigate the codebase, see the file tree, view the Knowledge panel, and initiate AI investigations.

## 3. Authentication Scope
- **Firebase client configuration:** IMPLEMENTED
- **Email/password signup:** IMPLEMENTED
- **Email/password login:** IMPLEMENTED
- **Google authentication:** IMPLEMENTED
- **Authentication persistence:** IMPLEMENTED (via Firebase `onAuthStateChanged`)
- **Logout:** IMPLEMENTED
- **Current authenticated-user identity:** IMPLEMENTED (client-side state)
- **User avatar/name/email display:** IMPLEMENTED
- **Protected workspace behavior:** IMPLEMENTED (client-side route protection)
- **Firebase → frontend integration:** IMPLEMENTED
- **Firebase → backend integration:** NOT IMPLEMENTED
- **Whether backend APIs verify Firebase tokens:** NOT IMPLEMENTED (Endpoints are currently unprotected)
- **Any authentication limitations:** The backend currently does not enforce authentication or user-based repository ownership. Anyone with API access can access any indexed repository.

## 4. Locked UI / Design System
The visual design is considered locked under the following language:
- deep black / graphite
- steel-gray UI
- restrained blue signals
- premium technical developer-tool aesthetic
- cinematic but controlled
- no purple, no neon-heavy treatment
- minimal, purposeful animation

**Locked Elements:**
- Login page
- Signup experience
- Authentication visual identity
- Workspace shell
- Header
- Sidebar structure
- Knowledge panel
- Code Graph overall direction & "Coming Soon" experience
- Typography hierarchy, Spacing/layout system, Color language

## 5. Implemented Features
- **Frontend Auth Integration:** Firebase login, signup, and Google Auth.
- **Workspace Shell UI:** Sidebar, layout, header.
- **Repository Ingestion:** Connecting and parsing local/remote repos via backend.
- **Database Schema:** Prisma SQLite schema covering repos, files, and symbol graphs.
- **AI Investigation Backend:** Logic to perform code investigations and chat.

## 6. Partially Implemented Features
- **Knowledge Panel:** UI exists, but may be disconnected from some real-time indexing status depending on the exact implementation details.
- **Investigation UI:** Can start and cancel investigations, but edge cases in rendering evidence/conclusions might need refinement.

## 7. Intentionally Deferred Features
- **Code Graph Interaction:** The interactive Code Graph is a "Coming Soon" feature. The UI direction is locked, but full interactability is deferred.
- **Backend Authentication Verification:** Deferred to a future phase to lock down API endpoints.
- **User Ownership of Repositories:** Currently, all repos are stored globally without tying them to a specific user ID in the database schema.

## 8. Backend Scope
- **Framework:** Express.js
- **Database:** SQLite (via Prisma)
- **Existing Routes:** `/api/repo`, `/api/chat`, `/api/health`
- **API Endpoints:** 
  - `POST /api/repo/index-local`
  - `POST /api/repo/upload`
  - `GET /api/repo`
  - `POST /api/repo/:id/investigate`
  - `DELETE /api/repo/:id/investigate`
  - `/api/chat`
- **Models (Prisma):** `Repo`, `File`, `Symbol`, `SymbolRelationship`
- **Middleware:** `cors()`, `express.json()`
- **Environment Variables:** `DATABASE_URL`, `GEMINI_API_KEY`, `PORT`
- **Limitations:** No authentication middleware. No rate limiting. SQLite may have concurrency limits for heavy indexing.

## 9. Database & Data Flow
**Flow Trace:**
User → Authentication (Complete: Frontend) 
→ Workspace (Complete: Frontend)
→ Repository Upload (Complete: Frontend to API)
→ API (Complete)
→ Repository analysis (Complete: Backend Indexing)
→ Database (Complete: Stores to SQLite)
→ Investigation (Complete: Backend processes AI request)
→ API (Complete: Streams/Returns to Frontend)

*Breakdown:* The data flow is end-to-end complete for core functionality, but the *Authentication* flow stops at the frontend and does not propagate to the database ownership layer.

## 10. Environment & Deployment Requirements
**Frontend (`client/.env`):**
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_API_URL`

**Backend (`server/.env`):**
- `DATABASE_URL`
- `GEMINI_API_KEY`
- `PORT`

**Commands:**
- Development: `npm run dev` (Frontend), `node index.js` (Backend)
- Production Build: `npm run build` (Frontend)

**Requirements:**
- Firebase Project configured and Authorized Domains set up.
- CORS on the backend must allow the deployed frontend domain.

## 11. Known Issues
- 🟠 **HIGH:** Backend APIs do not verify Firebase auth tokens. APIs are openly accessible.
- 🟠 **HIGH:** Database schema lacks a `User` model or relationship linking a `Repo` to an owner.
- 🟡 **MEDIUM:** SQLite is used as the database, which might not be suitable for concurrent production write-heavy indexing workloads without careful configuration.
- ⚪ **COSMETIC:** Code Graph is merely a visual placeholder ("Coming Soon").

## 12. Deployment Blockers
- **BLOCKER:** Environment variables for production must be securely provisioned.
- **BLOCKER:** CORS must be strictly configured to the production frontend domain.
- **BLOCKER (Product Decision):** If user-data isolation is required for production, the lack of backend token verification and repository ownership is a blocker.

## 13. Definition of Done
**A. MUST WORK BEFORE DEPLOYMENT**
- User can sign up and log in via Firebase.
- User can connect a repository.
- Backend successfully indexes the repository and saves to DB.
- User can run an AI investigation without crashing.
- Production build succeeds without errors.
- Environment variables are correctly mapped in the deployment environment.

**B. SHOULD WORK BEFORE DEPLOYMENT**
- Clean error states for failed repo indexing.
- Responsive UI on standard desktop resolutions.

**C. INTENTIONALLY DEFERRED**
- Fully interactive visual Code Graph.

**D. POST-DEPLOYMENT / FUTURE PRODUCT WORK**
- Multi-user data isolation and backend API token verification (unless defined as a blocker by product owners).
- Advanced team/collaboration features.

## 14. Final Audit Checklist
- [ ] Authentication (Signup, Login, Google Auth, Logout, Persistence)
- [ ] Protected Routes (Cannot access workspace without auth)
- [ ] Repository Flow (Ingestion, error handling, loading states)
- [ ] Investigation Flow (Query, AI response, cancellation)
- [ ] UI Consistency (Typography, spacing, colors match locked design)
- [ ] Environment Configuration (Firebase, API URLs, Gemini Key)
- [ ] Production Build (Vite build success, Express static serving or proper proxy)

## 15. Recommended Final Sequence
1. Review this Freeze document to confirm scope boundaries.
2. Conduct the Final Audit against the checklist.
3. Identify and fix ONLY genuine deployment blockers (e.g., critical crashes, env var issues).
4. Perform a Re-audit to ensure fixes didn't introduce regressions.
5. Execute Production Build.
6. Deploy.

---

**PROJECT STATUS:**
NEAR READY

- The core technical pipeline (Repo ingest → Index → AI Investigate) is functionally intact.
- The UI and visual design language are established and locked.
- Authentication exists on the frontend but lacks backend enforcement and database-level user isolation.
- Deployment is blocked primarily by environment configuration, CORS setup, and a product decision on whether to launch with unprotected backend APIs.
