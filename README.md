# DELT

DELT — Secure Digital Deal Workspace

DELT is a secure digital deal workspace designed for freelancers, creators, designers, developers, agencies, consultants, and independent professionals to manage client work in one place.

Instead of managing a project across WhatsApp, email, cloud storage, payment platforms, documents, and spreadsheets, DELT brings the core client-work lifecycle into a single Deal workspace.

Create a Deal. Work with your client. Get paid. Deliver securely.

What DELT Does

A DELT Deal can bring together:

🔐 Private Client Access — Secure client access with email OTP verification
💬 Client Communication — Keep deal-related conversations within the workspace
🤝 Price Negotiation — Structured price proposals instead of scattered negotiations
📁 Deliverables & Files — Upload and manage project deliverables
🔄 File Versions — Track updated versions of deliverables
💳 Payments — Payment integration with server-side verification
🧾 Invoices — Create, send, view and manage project invoices
📋 Project Information — Keep scope, pricing, deadlines and deliverables together
📜 Deal Activity — Maintain a timeline of important Deal events
🔔 Notifications — Keep creators informed about Deal activity
The Vision

DELT is being developed beyond a personal project with the goal of becoming a commercial SaaS product for independent professionals and teams.

The long-term workflow is:

Agreement
    ↓
Scope
    ↓
Invoice
    ↓
Payment
    ↓
Work
    ↓
Revisions
    ↓
Approval
    ↓
Delivery
    ↓
Deal Completed

The goal is to reduce the need for multiple disconnected tools while giving both the professional and client a structured, secure experience.

Roadmap

DELT is actively evolving. Planned areas include:

🧾 Advanced invoicing
📋 Project scope & milestones
📜 Contracts & agreements
✍️ E-signatures
🔄 Structured revisions & approvals
📁 Advanced file versioning
☁️ External storage integrations
📊 Creator analytics
👥 Client CRM
💳 Advanced payment infrastructure
🔔 Advanced notifications
🤖 AI-powered Deal assistance
📱 Mobile application

AI will be used to enhance the workflow, rather than simply being added as a standalone feature.

Architecture

DELT is built as a modern full-stack web application with a focus on secure access, transactional workflows and scalable file handling.

Core Stack
Frontend       → Next.js / React / TypeScript
Styling        → Tailwind CSS
Backend        → Next.js / API Routes
Database       → PostgreSQL / Supabase
Authentication → Email OTP / Secure sessions
Payments       → Razorpay
Email          → Resend
Storage        → Supabase Storage
Video          → FFmpeg-based processing
Deployment     → Vercel
Security

Security is an important part of the DELT architecture.

The system separates:

Internal database identifiers
Human-friendly Deal codes
Private client access
Email OTP verification
Client sessions
Server-side payment verification
Deal-specific permissions

Payment confirmation is verified server-side rather than relying solely on frontend callbacks.

Product Philosophy

DELT is not intended to compete with dedicated file-storage platforms by simply providing more storage.

Instead:

DELT is the workflow layer around the Deal.

Files, payments, communication, invoices, agreements and approvals become connected parts of the same client relationship.

For large projects, the long-term architecture can integrate with external storage and file-transfer providers while DELT manages the workflow, permissions and client experience.

Current Status

DELT is currently in active development.

The existing V1 establishes the core Deal infrastructure, while development is continuing toward a more complete commercial SaaS product.

Project

DELT began as a personal project and is now being developed with the intention of turning it into a real product.

Live: https://delt.website 

Linkedin : https://www.linkedin.com/in/shreyan-yemul-b802b5417/
