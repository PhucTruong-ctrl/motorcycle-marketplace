# RevNow - Motorcycle Marketplace

RevNow is a full-stack web application for buying and selling new and used motorcycles. It provides real-time features, advanced filtering, and a secure transaction process, powered by React and Supabase.

## Features

- User Authentication: Email/password and Google OAuth
- Product Management: Create, edit, and manage motorcycle listings with multi-image uploads
- Advanced Search and Filtering: Filter by brand, type, model, price, year, mileage
- Real-time Chat: Integrated messaging for buyers and sellers
- Transaction System: Purchase tracking and transaction history
- User Profiles: Public profiles with listings and reputation
- Seller Dashboard: Analytics with charts for sales performance
- Responsive Design: Tailwind CSS for all screen sizes

## Tech Stack

- Frontend: React 19, Vite, Tailwind CSS 4, React Router
- Backend: Supabase (PostgreSQL, Auth, Storage)
- Libraries: TanStack Query, react-select, chart.js, Quill editor

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/PhucTruong-ctrl/Motorcycles-Trading-Platform.git
   cd Motorcycles-Trading-Platform
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the project root:
   ```env
   VITE_SUPABASE_URL=YOUR_SUPABASE_URL
   VITE_SUPABASE_KEY=YOUR_SUPABASE_ANON_KEY
   ```

4. Run the development server:
   ```sh
   npm run dev
   ```

   Access the application at `http://localhost:5173`

## Project Structure

```
src/
  components/    # Reusable UI components
  pages/         # Page components
  services/      # API and Supabase services
  hooks/         # Custom React hooks
  utils/         # Utility functions
```

## License

MIT License
