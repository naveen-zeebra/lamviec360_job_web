# LamViec360

## JOB SEEKER APPLICATION

### UI, Functionality, Forms & End-to-End Flow

Reference: LamViec360-BRD v1.0 (HR Expert), LamViec360-URD_v2.0 (LV360-URD-002), plus approved UX decisions recorded during implementation planning.

Document status: Updated UI & Functionality Specification aligned with BRD v1.0 for Rockets implementation.

Last updated: October 2026

## 1. Scope

Complete Job Seeker experience from public discovery through registration (email/social login), identity verification (OTP, social login), profile completion (minimum 60% to apply), multiple resume management, job discovery (search, AI recommendations, job alerts), employer following, application (one-click/custom form with consent), application tracking, multi-round interview participation, offer review & negotiation, career insights & skill gap analysis, notifications (multi-channel), profile visibility controls, and profile/settings management.

## 2. Product Journey

Landing → Public Job Search → Job Details → Register/Login (Email or Social) → Email/OTP Verification → Profile Setup (min 60%) → Dashboard → Recommendations → Employer Following → Job Details → Apply → Consent → Submit → Application Tracker → Interview Participation → Offer Review → Career Insights → Notifications → Profile → Settings.

## 3. Public Navigation

| Area | Items |
| --- | --- |
| Navbar | Home, Find Jobs, Companies, Career Resources, About Us |
| Right actions | Language, Login, Sign Up (Email or Social), Company / Employer Site |
| Primary CTA | Find Jobs / Create Profile |
| Footer | Job Seekers, Companies, Company, Legal, Help/Support |

## 4. Landing Page

| Section | UI / Functionality |
| --- | --- |
| Hero | Headline, supporting copy, keyword search, location, Search Jobs CTA, Create Profile CTA |
| Statistics | Platform credibility metrics |
| Job Categories | Category cards with job count and View Jobs |
| Featured Jobs | Logo, title, company, location, salary (with gross/net indicator), work mode, experience, posted date, Save, Apply |
| How It Works | Create Profile → Discover Jobs → Apply → Track → Interview → Get Hired |
| Benefits | AI recommendations, smart search, application tracking, multi-channel notifications, professional profile, multiple resumes, saved jobs, career insights |
| Career Resources | Resume Tips, Interview Preparation, Career Growth, Salary Guide, Job Search Tips, Skill Gap Analysis |
| Employer Profiles | Browse top employers, view culture pages, follow companies |
| AI Interview Preparation | P2 / Coming Soon preview |
| Final CTA | Create Job Seeker Profile / Explore Jobs |
| Footer | Navigation, legal, support and social links |

## 5. Public Job Search

Public job search is accessible without login. Filters include keyword/job title, province/city, industry, salary range (VND), job type and other supported criteria. Only active, non-expired jobs shown (BR-201-09). Featured jobs appear at top of results (BR-201-08).

| Screen | Required UI |
| --- | --- |
| Search Header | Keyword, Location, Search |
| Filters | Category, Location, Salary (VND, gross/net), Job Type, Work Mode, Experience, Date Posted, Company. Filters persist during session (BR-201-06). |
| Results | Job title, company, logo, location, salary (with gross/net), date posted, job type, AI match score (if logged in). Max 1000 results per query (BR-201-01). |
| Sort | Date / Relevance / Match Score |
| Empty | No jobs found + clear filters / search again |
| Job Detail | Full JD, qualifications, company description, deadline, location, salary (gross/net clearly stated), Apply Now. Public jobs visible to all; private jobs visible to registered talent only (BR-201-10). |
| Salary Benchmark | Market salary range for similar roles (where available) |

## 6. Authentication

Approved UX decision: do not ask the user to choose an Account Type. The Job Seeker site Register action opens Job Seeker registration directly.

| Screen | Fields / Actions |
| --- | --- |
| Register (Email) | Full Name, Email, Password, Confirm Password, Terms & Privacy, PDPA Data Processing Consent |
| Register (Social) | Google / Facebook / Zalo social login. If email matches existing account → auto-link, notify user (LV-BR-0037). If no match → new registration with standard profile completion. |
| Email Verification | OTP/link, resend (60s cooldown, max 5 resends per LV-BR-0036). OTP expires after 10 minutes. |
| Login | Email, Password, Login, Forgot Password, Social Login options |
| Reset Password | Verification link (expires 60 minutes per LV-BR-0034, max 3 requests per 24hr), New Password, Confirm Password, password strength indicator |
| Failed Login | 3 consecutive failures in 15 min → 30 min block. 3 blocks in 24hr → manual review required (LV-BR-0038). Brute force → permanent block pending investigation. |

**Session Management (LV-BR-0035):**

- Sessions expire after 24 hours of inactivity.
- Refresh tokens valid for 7 days allow seamless re-authentication.
- Only one primary account per email/phone (LV-BR-0001).

## 7. Profile Setup

Guided post-registration onboarding should show progress and preserve entered values between steps. Minimum 60% profile completeness required to apply for jobs (BR-101-02).

| Step | Fields |
| --- | --- |
| Personal | Full Name, Profile Photo, Phone, Location, Date of Birth |
| Professional | Current Job Title, Experience (years), Industry, Skills (tag input) |
| Education | Degree, Institution, Graduation Year, Certifications |
| Experience | Company, Job Title, Start Date, End Date, Responsibilities (multiple entries) |
| Portfolio | Projects and achievements showcase (LV-CAP-006) |
| Resume & Preferences | Resume upload (multiple resumes supported per LV-BR-0007), Preferred Role, Preferred Location, Work Mode, Desired Salary (VND, 1M-500M range per BR-101-05) |
| Completion | Profile completeness indicator (minimum 60% to apply) and Complete Profile CTA. AI profile quality score. |

**Profile Business Rules:**

- Resume upload: PDF, DOC, DOCX, JPG or PNG; maximum 5MB per file (BR-101-03).
- Multiple resumes supported — tailored for different industries/roles (LV-BR-0007). This is a competitive advantage.
- Profile must include at least one contact method — email or phone (BR-101-04).
- Profile visibility changes take effect immediately (BR-101-07).
- Inactive profiles (no login for 12 months) are automatically archived (BR-101-08).
- Talent Profile shall represent truthful professional information (LV-BR-0005).
- AI-assisted profile improvement suggestions (LV-CAP-027).

## 8. Job Seeker Dashboard

| Component | Function |
| --- | --- |
| Header | Dashboard, Find Jobs, Recommended, Applications, Saved Jobs, Followed Companies, Notifications, Career Insights, Profile |
| KPI Cards | Recommended Jobs, Applications, Interviews, Saved Jobs, Followed Companies |
| Profile Completion | Percentage + Complete Profile (minimum 60% enforced). AI profile quality score. |
| Recommended Jobs | AI-powered recommendations updated daily based on profile changes (BR-201-02). Match score with explainable breakdown. |
| Recent Applications | Latest application status with timeline |
| Upcoming Interviews | Interview information (date, time, format, round number, interviewers) |
| Career Insights | Skill gap analysis, career path suggestions, learning recommendations (LV-CAP-010) |
| Job Alerts | Configured alerts by frequency: real-time, daily, weekly (BR-201-03) |
| Notifications | Recent job/application/interview/offer notifications (multi-channel) |

## 9. Recommendations

Phase 1 uses rule-based recommendations on the Dashboard and Job Detail page, using the same category/location as applied, saved or browsed jobs. AI recommendations updated daily based on profile changes (BR-201-02). Match score calculated based on skills, experience, location, salary alignment (BR-201-07). Match score displayed with explainable breakdown per AI Principle 2. Full ML recommendations are Phase 2.

## 10. Saved Jobs & Employer Following

Save/unsave jobs. Talent can save up to 100 jobs simultaneously (BR-201-04). Saved jobs expire after 90 days if job is closed (BR-201-03). Saved Jobs list supports View Job, Apply and Remove. Empty state links back to Find Jobs.

**Employer Following (NEW):**

- Follow favorite employers to receive updates on new job postings.
- View employer company profiles and culture/branding content.
- Research salary benchmarks and market trends for followed companies.
- Followed Companies list with unfollow option.

## 11. Application Flow

Job Details → Apply → Review Saved Profile → Select Resume (from multiple saved resumes) → Employer Questions → Optional Cover Letter/Additional Information → Review → Mandatory Candidate Data Consent → Submit → Confirmation.

| Screen | UI / Function |
| --- | --- |
| Review Profile | Pre-populated candidate information from saved profile (minimum 60% complete per BR-301-02) |
| Resume | Select from saved resumes (multiple supported per LV-BR-0007) or upload/replace. Max 5MB per file. |
| Questions | Dynamic employer questions (required if marked per BR-301-05) |
| Additional | Optional cover letter and required application documents (total 10MB per application per BR-301-06) |
| Review | Complete application summary |
| Consent | Mandatory PDPA data-processing consent checkbox before final submission |
| Submit | Prevent duplicate submission (BR-301-01 — one application per job); show processing state |
| Success | Application confirmation: job, company, date, application ID, status. Auto-acknowledgment within 24hrs (BR-301-11). |

**Application Business Rules:**

- Application cannot be edited after submission (BR-301-03).
- Talent can withdraw application before screening stage (BR-301-04).
- Applications automatically marked "expired" after job closes (BR-301-07).
- Rejected applicants can reapply after 90 days if same position reposted (BR-301-09).
- Application data retained for 24 months for compliance (BR-301-10).
- One-click apply uses existing profile data — no additional form (BR-301-12).

## 12. Application Tracker

| Stage | UI Behavior |
| --- | --- |
| Applied | Submitted state (auto-acknowledgment within 24hrs) |
| Under Review | Employer reviewing (includes phone screening stage for Vietnam practice) |
| Shortlisted | Candidate progressed |
| Interview Scheduled | Interview stage — shows round number, date, time, format, interviewers |
| Offer Received | Offer stage — view compensation details (gross/net breakdown) |
| Hired | Successful outcome |
| Rejected | Application closed (rejection notification within 7 days per BR-302-06) |
| Withdrawn | Talent-initiated withdrawal (before screening stage only per BR-301-04) |

Tracker shows Job Title, Company Name, Application Date and Current Stage. Full status timeline shows stage history and dates. Where configured by the company, show "Typical: X-Y days" per stage. Closed jobs remain visible with a Position Closed badge.

## 13. Interview Participation

Support for multi-round interview process (Vietnam practice: 2-3 rounds per LV-BP-401).

| Feature | Description |
| --- | --- |
| Interview Invitation | Receive customized invitation with details: date, time, format, location/link, interviewers (sent 48hrs in advance per BR-401-02) |
| Schedule Confirmation | Confirm availability and schedule interview. Can reschedule once without penalty (BR-401-03). |
| Interview Rounds | Round 1: HR screening (phone/video/offline). Round 2: Technical/functional. Round 3: Leadership/culture fit (if applicable). |
| Preparation | Review job description, research company profile. AI interview preparation (P2). |
| Skills Assessment | Complete skills assessments or tests if required. |
| Feedback & Outcomes | Receive interview outcomes and next steps. Track progress across rounds. |

**Interview Rules (Talent side):**

- Interview no-show = automatic rejection unless valid reason within 24hrs (BR-401-08).
- Interview recordings require talent consent (BR-401-11).
- Provide references or additional information when requested.

## 14. Offer Review & Negotiation

View and respond to employment offers (LV-BP-501, Stage 5).

- [ ] View offer with detailed compensation package (gross AND net salary per BR-501-01).
- [ ] View probation period terms per Vietnam Labor Law (BR-501-02).
- [ ] View breakdown of mandatory deductions and contributions (BR-501-03).
- [ ] Negotiate salary and terms (expected Vietnam practice per BR-501-07).
- [ ] Clarify questions about role, team, and expectations via messaging.
- [ ] Accept or decline offer within deadline (3-7 business days per BR-501-06).
- [ ] Sign employment contract via e-signature or confirm in-person signing.
- [ ] Confirm start date and onboarding logistics.

## 15. Notifications

Multi-channel notification strategy (LV-BR-0039):

- Email: Primary channel — application confirmation, offer letters, detailed communications.
- In-App: Real-time — CV viewed, status changes, new recommendations.
- SMS: Critical — interview invitations, urgent updates.
- Zalo (Phase 2): Integration with Vietnam's most popular messaging app.

Notification events: application confirmation, CV viewed, status changes, interview invitations, offer received, rejection, job alert matches, employer updates (followed companies). The company can suppress configured stage notifications.

**Job Alerts (BR-201-02/03):**

- AI recommendations updated daily based on profile changes.
- Alert frequency configurable: real-time, daily, weekly.
- Custom job alerts for specific criteria (role, industry, location, salary range).

## 16. AI Interview Preparation — P2

P2 / Should Have. The Job Seeker selects a saved application and receives AI-generated practice interview questions relevant to the job description. For current UI delivery, present the feature as Coming Soon if the AI service is not enabled.

| Screen | Fields / UI |
| --- | --- |
| AI Landing | Feature overview, benefit cards, Coming Soon state |
| Setup | Saved application / target job |
| Interview Type | Technical, Behavioral, HR, role-specific where supported |
| Skills | Relevant skills |
| Job Context | Job description context |
| Review | Selected inputs |
| Coming Soon | P2 label and optional Notify Me |

## 17. Career Insights & Development

AI-powered career guidance and professional development (LV-CAP-010, LV-CAP-028).

- [ ] Career path recommendations based on current profile and market trends.
- [ ] Skill gap analysis — identify missing skills for target roles.
- [ ] Learning recommendations — relevant courses and certifications.
- [ ] Market demand insights — in-demand skills for chosen industry.
- [ ] Salary insights — market salary ranges for similar roles/locations.
- [ ] Resume improvement suggestions (AI-powered per LV-CAP-027).
- [ ] Profile quality score with actionable improvement tips.

## 18. Profile & Settings

| Area | Fields / Actions |
| --- | --- |
| Profile | Personal, Experience (multiple entries), Education, Skills, Languages, Certifications, Portfolio, Salary Expectations |
| Resumes | Multiple resumes management (LV-BR-0007) — create, upload, organize by industry/role. PDF/DOC/DOCX, max 5MB each. |
| Preferences | Preferred Roles, Locations, Work Mode, Desired Salary (VND, 1M-500M per BR-101-05) |
| Notifications | Job recommendations, Application updates, Interview alerts, Offer notifications, Employer updates, Marketing. Per-channel preferences (Email, In-App, SMS). |
| Privacy | Profile visibility control (LV-BR-0008), Resume visibility, "Not looking" status (excludes from proactive employer recommendations per BR-202-08). Employer access per talent privacy preferences (LV-BR-0009). |
| Account | Email, Phone, Password, Social Login links, Logout, Delete Account (data deletion processed within 30 days per BR-901-13) |
| Language | English and Vietnamese active; architecture supports minimum five languages |

## 19. Responsive & Accessibility

- [ ] Mobile-first layouts for 375px/390px, tablet and desktop.
- [ ] No horizontal scrolling at 375px.
- [ ] Sidebars become drawers; tables become cards; filters become drawers/bottom sheets.
- [ ] Keyboard-accessible navigation, forms, dialogs and controls.
- [ ] Visible focus states and accessible labels.
- [ ] Status is not communicated by color alone.
- [ ] Target WCAG 2.1 Level AA for core flows.
- [ ] Respect reduced-motion preferences.

## 20. UI States

- [ ] Loading/skeleton for jobs, dashboard, applications, recommendations and career insights.
- [ ] Empty states for no applications, saved jobs, followed companies, notifications and recommendations.
- [ ] Error state with retry.
- [ ] Success confirmation after registration, profile completion, application submission and offer acceptance.

## 21. Acceptance Checklist

- [ ] Public search works without login. Featured jobs at top. Expired jobs excluded.
- [ ] Register opens Job Seeker registration directly; no Account Type screen.
- [ ] Social login supported (Google, Facebook, Zalo) with auto-linking to existing email accounts (LV-BR-0037).
- [ ] Email verification and password reset work. OTP 60s cooldown, max 5 resends. Reset link expires 60 min.
- [ ] Failed login: 3 attempts → 30 min block; 3 blocks → manual review (no auto-unlock).
- [ ] Session expires after 24hr inactivity; refresh tokens valid 7 days.
- [ ] Profile data persists across onboarding steps.
- [ ] Minimum 60% profile completeness enforced to apply for jobs.
- [ ] Multiple resumes supported — upload, manage, select per application.
- [ ] Resume accepts PDF, DOC, DOCX, JPG, PNG up to 5MB per file.
- [ ] Salary expectations validated within 1M-500M VND range.
- [ ] One-click/pre-populated apply flow works for logged-in users.
- [ ] Mandatory PDPA consent appears before final submission.
- [ ] One application per job enforced; no edit after submission.
- [ ] Application tracker displays current stage, timeline, and round information.
- [ ] Multi-round interview participation: view details, confirm/reschedule, track rounds.
- [ ] Offer review: gross/net salary, probation terms, negotiation, accept/decline.
- [ ] Employer following: follow companies, receive updates.
- [ ] Saved jobs: max 100, expiry after 90 days if job closed.
- [ ] Job alerts configurable: real-time, daily, weekly.
- [ ] Career insights: skill gap analysis, career path, learning recommendations.
- [ ] AI recommendations appear on dashboard and job details with explainable match scores.
- [ ] Notifications support multi-channel: Email, In-App, SMS.
- [ ] Profile visibility controls and "Not looking" status.
- [ ] Inactive profiles auto-archived after 12 months.
- [ ] AI Interview Preparation is represented as P2/Coming Soon when not active.
- [ ] English and Vietnamese are active; localization supports at least five languages.
- [ ] Core mobile flow is usable at 375px and meets WCAG 2.1 AA target.
