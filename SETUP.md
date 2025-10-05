# Minimind Outreach Agent - Setup Guide

## Overview

The Minimind Outreach Agent is an AI-powered system for automated, personalized cold outreach for design services. It analyzes Facebook pages for design quality, generates proposals, and manages the entire outreach workflow with human-in-the-loop moderation.

## Features Implemented

### MVP Features (Completed)
- **Page Analysis**: Fetch Facebook page data and analyze design quality with AI scoring
- **AI Scorecard**: Comprehensive design quality assessment (0-100 score)
- **Need Decision Module**: AI determines if a page needs design help (Yes/Maybe/No)
- **Proposal Generator**: Auto-generates personalized proposals (Facebook + Email formats)
- **Moderator Approval Workflow**: Queue system for reviewing and approving drafts
- **Campaign Management**: Create and manage outreach campaigns
- **Message Center**: Track sent messages and monitor replies
- **Dashboard**: KPI cards and recent activity feed
- **Settings Panel**: Configure system parameters (Admin only)
- **Role-Based Access**: Admin, Moderator, Sales, Analyst roles

### Database Schema
Complete relational database with:
- Users (role-based access control)
- Pages (Facebook page metadata)
- Analyses (AI design assessments)
- Campaigns (outreach campaigns)
- Drafts (proposal drafts awaiting approval)
- Messages (sent communications)
- Replies (responses from prospects)
- Follow-ups (scheduled follow-up messages)
- Audit Logs (complete activity tracking)
- Settings (system configuration)

### Security
- Row Level Security (RLS) enabled on all tables
- Role-based policies for data access
- Audit logging for all significant actions
- Secure authentication with Supabase Auth

## Demo Accounts

Two demo accounts have been created and seeded with sample data:

1. **Admin Account**
   - Email: `admin@minimind.agency`
   - Password: `demo123`
   - Role: Admin (full access to all features including Settings)

2. **Moderator Account**
   - Email: `moderator@minimind.agency`
   - Password: `demo123`
   - Role: Moderator (can review and approve drafts, manage campaigns)

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Supabase account (already configured)

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   The `.env` file is already configured with your Supabase credentials:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

3. **Database Setup**
   The database schema has been automatically created with all necessary tables, indexes, and RLS policies.

4. **Demo Data**
   Sample data (users, pages, analyses, drafts, campaigns) has been seeded automatically.

### Running the Application

1. **Development Server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

2. **Production Build**
   ```bash
   npm run build
   npm run preview
   ```

## User Workflows

### 1. Analyze a Facebook Page
1. Log in with any demo account
2. Navigate to "Analyze Page"
3. Enter a Facebook page URL (e.g., `https://facebook.com/example-page`)
4. Click "Analyze"
5. View the AI-generated scorecard with:
   - Overall design score (0-100)
   - Detected issues (low resolution, inconsistent branding, etc.)
   - Suggested improvements
   - Need decision (Yes/Maybe/No)

### 2. Review and Approve Drafts (Moderator/Admin)
1. Navigate to "Drafts Queue"
2. Filter by status (Pending, Approved, Sent, Rejected)
3. Click a draft to open the editor
4. Review the Facebook message and email proposal
5. Actions available:
   - **Approve**: Mark draft as approved
   - **Reject**: Reject the proposal
   - **Send**: Send the message (only for approved drafts)

### 3. Manage Campaigns (Moderator/Admin)
1. Navigate to "Campaigns"
2. Click "New Campaign" to create a campaign
3. Enter campaign name and description
4. View campaign metrics:
   - Pages count
   - Sent messages
   - Replies received
5. Manage campaign status:
   - Active → Paused
   - Paused → Active
   - Archive campaigns

### 4. Monitor Messages and Replies
1. Navigate to "Message Center"
2. View all sent messages in the left panel
3. Click a message to see details and replies in the right panel
4. View reply classification:
   - Positive (interested)
   - Neutral
   - Negative (not interested)
   - Needs Info
   - Spam

### 5. Configure Settings (Admin Only)
1. Navigate to "Settings"
2. Configure system parameters:
   - Daily send limit
   - Follow-up delay days
   - Auto-approve enabled/disabled
   - Need threshold score
   - Moderator approval required
3. Click "Save Changes"

## Design Guidelines

### Brand Colors
- **Primary**: `#c8f031` (Lime) - Used for primary actions and accents
- **Dark**: `#212529` - Used for text and navigation background
- **White**: `#FFFFFF` - Used for backgrounds and cards

### Typography
- Headings: Modern sans-serif, bold
- Body: System sans-serif (Arial fallback)

### UI Principles
- Clean, professional interface
- Rounded corners (8-12px)
- Soft shadows for depth
- Consistent spacing (padding p-3/p-4)
- Responsive design with mobile support

## Database Structure

### Key Tables

**users**: User accounts with role-based access
- Roles: admin, moderator, sales, analyst

**pages**: Facebook pages to be analyzed
- Stores page metadata, contact info, images

**analyses**: AI-generated design assessments
- Score, issues, suggestions, need decision

**drafts**: Proposal drafts awaiting approval
- FB message, email subject/body, status

**messages**: Sent communications
- Platform (facebook/email), status tracking

**replies**: Responses from prospects
- AI classification, confidence score

**campaigns**: Outreach campaigns
- Track pages, sent count, reply count

**audit_logs**: Complete activity tracking
- User actions, timestamps, details

**settings**: System configuration
- Configurable parameters for admin

## Next Steps

### Recommended Enhancements (Post-MVP)

1. **Facebook Integration**
   - Connect to Facebook Graph API for real page data
   - Implement actual message sending via Facebook Messenger

2. **Email Integration**
   - Connect to SMTP/Gmail API for email sending
   - Monitor email replies automatically

3. **AI Improvements**
   - Integrate with OpenAI Vision API for real image analysis
   - Use GPT for better proposal generation
   - Implement reply classification with AI

4. **Follow-up Automation**
   - Auto-generate follow-up drafts after X days
   - Configurable follow-up cadence (Day 5, 12, 25)

5. **Bulk Operations**
   - CSV upload for bulk page analysis
   - Batch approval of drafts
   - Campaign-level operations

6. **Analytics & Reporting**
   - Response rate analytics
   - Conversion tracking
   - Export reports (CSV/PDF)

7. **Advanced Features**
   - A/B testing for message variants
   - CRM integration (HubSpot)
   - Auto-generated mockups (image generation)
   - PDF proposal export

## Support

For questions or issues:
- Review the code in `src/` directory
- Check Supabase dashboard for data
- Review audit logs for system activity

## Technical Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Deployment**: Vercel/Netlify compatible

## License

Built by Minimind Agency
