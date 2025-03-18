# Recallio - Smart Tracking App

A smart task management, expense tracking, and calorie counting web application with AI assistance powered by Gemini Flash.

## Features

- Task management: Create, edit, and track tasks with priorities and due dates
- Expense tracking: Manage expenses with categories and visualize spending patterns
- Calorie counting: Track food intake and monitor nutrition details
- AI-powered analysis: Write natural language notes that are automatically categorized and saved to the appropriate feature
- Firebase integration: User authentication and real-time data storage

## Tech Stack

- Next.js (React)
- TypeScript
- Firebase (Authentication, Firestore)
- Google Gemini Flash AI
- Tailwind CSS
- Chart.js

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- Firebase account
- Gemini API key

### Setup

1. Clone the repository:

```bash
git clone https://github.com/AdityaB-11/recallio_web.git
cd recallio
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
cp .env
```

Edit `.env` and add your Firebase and Gemini API credentials.

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Firebase Setup

1. Create a new Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password sign-in method
3. Create a Firestore database
4. Add your Firebase configuration to the `.env.local` file

## Gemini API Setup

1. Get your API key from [Google AI Studio](https://makersuite.google.com/)
2. Add your Gemini API key to the `.env.local` file

## License

This project is licensed under the MIT License.
