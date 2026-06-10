# IntelliResolve
An AI-driven student grievance prioritization and resolution platform built for educational institutions.

IntelliResolve transforms traditional complaint management into an intelligent, transparent, and data-driven process using Natural Language Processing (NLP), automated routing, sentiment analysis, and predictive analytics.

Designed as a full-stack web application, the platform helps universities and colleges reduce resolution delays, improve accountability, and enhance student satisfaction through AI-powered decision making.

Problem Statement-

Educational institutions often rely on manual complaint handling systems that suffer from:

Delayed resolutions,
Incorrect complaint routing,
Lack of prioritization,
No transparency or tracking,
Poor communication between students and administration,
Limited analytical insights

IntelliResolve addresses these challenges through intelligent automation and AI-assisted grievance management.

Key Features-
AI-Powered Complaint Processing,
Complaint category classification,
Sentiment analysis,
Intelligent priority assignment,
Explainable AI recommendations,
Department auto-routing,
SLA deadline calculation,
Duplicate complaint detection,
Complaint clustering,
AI-suggested resolutions

The platform processes every complaint through an 11-step NLP pipeline before assigning it to the appropriate department.

Role-Based Dashboards-

Student Portal

Submit complaints,
Track complaint status,
View AI explanations,
Receive notifications,
Chat with assigned staff,
Submit feedback

Staff Portal

Manage assigned complaints,
Update resolution progress,
View AI recommendations,
Monitor SLA deadlines

Admin Portal

Complaint oversight,
Analytics dashboard,
Escalation management,
Department performance tracking

Super Admin Portal

Multi-institution management,
Predictive analytics,
User administration,
System-wide monitoring

Smart Automation-
NLP-based classification,
Sentiment-aware prioritization,
Automatic department assignment,
SLA monitoring and escalation,
Workload balancing,
Duplicate complaint alerts,
Knowledge-based resolution suggestions

Analytics & Insights-
Complaint trends,
Category distribution,
Resolution metrics,
SLA compliance reports,
Heatmaps and dashboards,
Predictive complaint forecasting,
Root cause analysis

AI Engine Workflow-
Complaint Submission
          │
          ▼
Text Preprocessing
          │
          ▼
Keyword Extraction
          │
          ▼
Category Classification
          │
          ▼
Sentiment Analysis
          │
          ▼
Priority Assignment
          │
          ▼
Explainable AI Generation
          │
          ▼
Department Auto-Routing
          │
          ▼
SLA Calculation
          │
          ▼
Duplicate Detection
          │
          ▼
Complaint Clustering
          │
          ▼
AI Resolution Suggestions

Tech Stack-
Frontend

React.js,
TypeScript,
Tailwind CSS,
Recharts,
Zustand

Backend

Node.js,
Express.js,
JWT Authentication,
bcrypt

Database

Supabase,
PostgreSQL,
Row Level Security (RLS)

AI & NLP

natural.js,
compromise.js,
TF-IDF,
Cosine Similarity,
K-Means Clustering

Integrations

Nodemailer,
SendGrid,
Web Speech API,
LLM-powered Chat Assistant

Based on the system architecture and technology stack defined in the dissertation.

Architecture-
Frontend (React + TypeScript)
            │
            ▼
Backend API (Node.js + Express)
            │
            ▼
AI Engine Layer
 ├─ Classification
 ├─ Sentiment Analysis
 ├─ Priority Detection
 ├─ Duplicate Detection
 └─ Resolution Suggestions
            │
            ▼
Supabase/PostgreSQL
            │
            ▼
Notifications & External Services

Security Features-
JWT Authentication,
Role-Based Access Control (RBAC),
Password Hashing with bcrypt,
Email Verification,
Audit Logging,
Multi-Tenant Isolation,
Row Level Security (RLS)
