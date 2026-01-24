# Motorcycle Marketplace

Web-based marketplace for buying and selling motorcycles. Features real-time chat, seller analytics dashboard, and secure transaction management.

## Features

- User authentication with email and Google OAuth
- Product listings with multi-image upload
- Advanced search and filtering by brand, type, price, year, mileage
- Real-time messaging between buyers and sellers
- Transaction tracking and history
- Seller dashboard with sales analytics and charts
- Responsive design for all screen sizes

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS 4, React Router
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Libraries:** TanStack Query, Chart.js, react-select, Quill editor

## Requirements

- Node.js 18 or higher
- Supabase account

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/PhucTruong-ctrl/motorcycle-marketplace.git
   cd motorcycle-marketplace
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Create a `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```sh
   npm run dev
   ```

Access at `http://localhost:5173`

## Environment Variables

| Variable | Description |
|----------|-------------|
| VITE_SUPABASE_URL | Supabase project URL |
| VITE_SUPABASE_KEY | Supabase anonymous key |

## Project Structure

```
src/
  components/    - Reusable UI components
  pages/         - Page components
  services/      - Supabase API services
  hooks/         - Custom React hooks
  utils/         - Utility functions
```

## Contributing

Contributions are welcome. Please open an issue to discuss changes before submitting a pull request.

## License

MIT License
