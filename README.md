# RevNow - Motorcycle Marketplace

RevNow is a modern, full-stack web application for buying and selling new and used motorcycles. It provides a seamless user experience with real-time features, advanced filtering, and a secure transaction process, all powered by React and Supabase.

<!-- Optional: Add a live demo link if you have one -->
<!-- > **Live Demo:** [revnow.yourdomain.com](https://revnow.yourdomain.com) -->

## ✨ Key Features

- **User Authentication**: Secure sign-up and login with email/password and Google OAuth.
- **Product Management**: Easily create, edit, and manage motorcycle listings with a rich-text editor and multi-image uploads.
- **Advanced Search & Filtering**: Powerful filtering by brand, type, model, price, year, mileage, and more, with multiple sorting options.
- **Real-time Chat**: Integrated messaging system for buyers and sellers to communicate directly.
- **Transaction System**: A streamlined process for purchasing motorcycles and tracking transaction history.
- **User Profiles & Reputation**: Public user profiles displaying listings and a community-based reputation system.
- **Seller Dashboard**: Visual analytics dashboard with charts for sellers to track their sales performance.
- **Responsive Design**: Fully responsive UI built with Tailwind CSS for a great experience on any device.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, React Router
- **Backend as a Service (BaaS)**: Supabase (PostgreSQL Database, Auth, Storage)
- **Key Libraries**:
  - `@tanstack/react-query` for data fetching and state management.
  - `react-select`, `react-multi-carousel`, `quill` for enhanced UI components.
  - `chart.js` for data visualization.

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js (v18 or later)
- npm, yarn, or pnpm

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/PhucTruong-ctrl/NienLuan2.git
    cd NienLuan2
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add your Supabase project credentials:
    ```env
    VITE_SUPABASE_URL=YOUR_SUPABASE_URL
    VITE_SUPABASE_KEY=YOUR_SUPABASE_ANON_KEY
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.
