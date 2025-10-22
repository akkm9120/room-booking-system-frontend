# Room Booking Admin Frontend

A React-based admin dashboard for managing room bookings, users, and system settings.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Local Development
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
4. Update `.env` with your backend API URL
5. Start development server:
   ```bash
   npm start
   ```

## 🌐 Deploy to Vercel

### Option 1: Vercel CLI
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. Deploy:
   ```bash
   vercel
   ```

### Option 2: GitHub Integration
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard:
   - `REACT_APP_API_URL`: Your backend API URL (e.g., `https://your-backend.railway.app/api`)

### Environment Variables
Configure these in your Vercel project settings:
- `REACT_APP_API_URL`: Backend API base URL
- `REACT_APP_NAME`: Application name (optional)
- `REACT_APP_VERSION`: Application version (optional)

## 🏗️ Build

To build for production:
```bash
npm run build
```

The build artifacts will be stored in the `build/` directory.

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # API services
├── styles/             # CSS styles
└── utils/              # Utility functions
```

## 🔧 Configuration

The app uses environment variables for configuration:
- `REACT_APP_API_URL`: Backend API endpoint
- `GENERATE_SOURCEMAP`: Set to `false` for production builds
- `CI`: Set to `false` to treat warnings as warnings (not errors)

## 🔐 Authentication

The app uses JWT token-based authentication:
- Tokens are stored in localStorage
- Automatic token refresh on API calls
- Redirects to login on token expiration

## 📱 Features

- **Dashboard**: Overview of system metrics
- **Room Management**: Add, edit, and manage rooms
- **Booking Management**: View and manage bookings
- **User Management**: Manage system users
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Development

### Available Scripts
- `npm start`: Start development server
- `npm run build`: Build for production
- `npm test`: Run tests
- `npm run serve`: Serve production build locally

### Code Style
- ESLint configuration included
- Prettier recommended for code formatting
- Follow React best practices

## 🐛 Troubleshooting

### Build Issues
- Ensure all environment variables are set
- Check for ESLint errors and warnings
- Verify Node.js version compatibility

### Deployment Issues
- Verify environment variables in Vercel dashboard
- Check build logs for errors
- Ensure backend API is accessible from production

## 📞 Support

For issues and questions, please check the project documentation or contact the development team.