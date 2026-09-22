# LàmViệc360 - Job Seeker & Candidate Portal (`new-jobseeker-web`)

Dedicated Next.js 15 web application for Job Seekers and Candidates.

---

## 🚀 Key Features

- **Candidate Landing**: Hero job search with location & keyword filters, popular categories, featured jobs, and top companies.
- **Job Discovery & Search**: Instant multi-facet filtering (job type, location, experience level, salary range) and pagination.
- **Job Detail**: Comprehensive job overview, responsibilities, requirements, benefits, company profile, and instant apply flow.
- **Verified Company Directory**: Explore leading employers in Vietnam.
- **Candidate Authentication**: Fast registration, candidate login, and password recovery.
- **Seeker Dashboard**: Personalized job recommendations, profile completeness meter, and application progress status.
- **Resume & Profile Builder**: Edit headline, bio, work history, education, skills, and CV document upload.
- **Application Tracker**: Monitor real-time ATS status across all applied positions.
- **Saved Jobs**: Quick bookmarking and job alerts.
- **AI Interview Prep**: Interactive simulated mock interviews and practice questions.
- **Pure Web App**: PWA service workers and install manifests completely removed.

---

## ⚙️ Configuration

- **Dev Port**: `3001` (configured in `package.json` and `.env.local`).
- **Backend API Gateway**: Connects to Job Seeker Gateway (`http://localhost:8001/api/v1/jobseeker`).
- **Design System**: Built with Tailwind CSS v4 and LàmViệc360 design tokens.

---

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Dev Server
```bash
npm run dev
```
Open [http://localhost:3001](http://localhost:3001) in your browser.

### 3. Build for Production
```bash
npm run build
npm run start
```
