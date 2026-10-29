# Library Management System

A simple full-stack web application built with the MERN stack to manage books, members, and book issue/return records.

**Tech Stack:** MongoDB (Atlas) • Express.js • React (Vite) • Node.js • Mongoose

## Features

- **Dashboard:** total books, total members, issued books, and returned books.
- **Books:** add, edit, delete, and search books by title, author, or category.
  - Adding a book with the same title and author increases its copies instead of creating a duplicate.
  - A book that is currently issued cannot be deleted.
- **Members:** add, edit, delete, and search members.
  - Email addresses must be unique.
  - A member who still has an issued book cannot be deleted.
- **Issue / Return:** issue an available book to a member and mark it as returned.
  - A book cannot be issued when no copies are available.
  - A book cannot be returned twice.
  - Search and filter transactions by status.
- **Transaction history:** past issues and returns are kept even after a book or member is deleted.

## Project Structure

```
library-system/
├── client/            # React frontend (Vite)
│   └── src/
│       └── App.jsx
├── server/            # Node.js + Express backend
│   ├── server.js      # API routes, Mongoose models, server setup
│   └── .env           # Environment variables (not committed)
└── README.md
```

## Prerequisites

- Node.js (v18 or later recommended)
- A MongoDB Atlas account (or a local MongoDB instance)

## Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd library-system
```

### 2. Backend

```bash
cd server
npm install
```

Create a file named `.env` inside the `server` folder:

```
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

Start the server:

```bash
node server.js
```

You should see:

```
Server running on port 5000
MongoDB Connected Successfully
```

### 3. Frontend

Open a new terminal:

```bash
cd client
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## API Endpoints

### Books

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/books` | Get all books |
| POST | `/api/books` | Add a book |
| PUT | `/api/books/:id` | Update a book |
| DELETE | `/api/books/:id` | Delete a book |

### Members

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/members` | Get all members |
| POST | `/api/members` | Add a member |
| PUT | `/api/members/:id` | Update a member |
| DELETE | `/api/members/:id` | Delete a member |

### Transactions

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/transactions` | Get all transactions |
| POST | `/api/transactions/issue` | Issue a book to a member |
| PUT | `/api/transactions/:id/return` | Return an issued book |

## Database Collections

| Collection | Important Fields |
|------------|------------------|
| Books | title, author, category, quantity, available |
| Members | name, email, phone, membershipDate |
| Transactions | bookId, memberId, book, member, issueDate, returnDate, status |

## Validation Rules

- Book title and author are required, and quantity must be at least 1.
- Member name and email are required, and email must be unique.
- Book quantity cannot be reduced below the number of copies currently issued.
- Issue and return operations update the available copies automatically.

## Future Enhancements

- Admin login and authentication
- Fine calculation for late returns
- Pagination
- Book cover images
- Email notifications
- Reports and analytics
- Cloud deployment

## Notes

The `.env` file contains database credentials and must never be committed to GitHub.