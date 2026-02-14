# SQL Chatbot for Loan Management System

A sophisticated AI-powered chatbot designed to provide real-time data analytics and insights for a Loan Management System. It translates natural language questions into complex PostgreSQL queries, executes them, and provides actionable insights.

## 🏗️ Architecture

The system follows a modern decoupled architecture:

```mermaid
graph TD
    User([User]) <--> Frontend[Frontend - React/Tailwind]
    Frontend <--> Backend[Backend - Express/TypeScript]
    Backend <--> OpenAI[OpenAI API - GPT-4o-mini]
    Backend <--> DB[(PostgreSQL Database)]
    Backend <--> Prisma[[Prisma ORM]]
    Prisma <--> DB
```

### Flow of Operations
1.  **Input Parsing**: User submits a question in plain English.
2.  **SQL Generation**: The LLM (GPT-4o-mini) interprets the natural language and generates a valid PostgreSQL SELECT query based on the system's schema.
3.  **Data Retrieval**: The generated SQL is executed against the database using Prisma.
4.  **Insight Synthesis**: The raw database results are sent back to the LLM to generate professional, context-aware analytical insights.
5.  **Multi-turn Context**: The system maintains conversation history to handle follow-up questions (e.g., "Why is that?" or "Show me more details").

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS (Modern, glassmorphic UI).
- **Backend**: Node.js, Express, TypeScript.
- **ORM**: Prisma (PostgreSQL).
- **AI Engine**: OpenAI GPT-4o-mini.
- **Data Source**: PostgreSQL (Cloud/Local).

## 🌟 Core Features

- **NL-to-SQL**: Converts complex natural language to precise PostgreSQL queries.
- **Automated Insights**: Doesn't just show numbers; explains what the data means.
- **Schema-Aware**: Securely generates queries limited to documentation-approved schemas.
- **Conversational Support**: Handles general questions about the system or domain without requiring database queries.


## 📊 Database Schema

The system analyzes data across four primary entities:
- **Loan Transactions**: Core loan records, status, and approved amounts.
- **Banking Entities**: Salary info, verification status, and consent modes.
- **EMI Entities**: Payment schedules, principal/interest breakdown, and delinquency.
- **Transaction Entities**: Actual payment records and risk metrics (DPD).

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- OpenAI API Key

### Backend Setup
1.  `cd backend`
2.  `npm install`
3.  Create a `.env` file based on `.env.example`:
    ```env
    PORT=3000
    DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
    OPENAI_API_KEY="your_api_key_here"
    ```
4.  Generate Prisma client: `npx prisma generate`
5.  Start the server: `npm run dev`

### Frontend Setup
1.  `cd frontend`
2.  `npm install`
3.  Start the development server: `npm run dev`

## 📂 Project Structure

```text
SQL_chatbot/
├── backend/                # Express server & AI Logic
│   ├── prisma/             # Database schema & migrations
│   ├── src/                # TypeScript source code
│   └── ...
├── frontend/               # React application
│   ├── src/                # React components & styles
│   └── ...
└── README.md               # Project documentation
```
