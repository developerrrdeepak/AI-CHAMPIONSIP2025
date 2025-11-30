# AI Championship - HireVision AI Platform

[![CI/CD Pipeline](https://github.com/yourusername/ai-championship/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/yourusername/ai-championship/actions)
[![Security Rating](https://img.shields.io/badge/security-A+-green.svg)](./SECURITY.md)
[![Code Quality](https://img.shields.io/badge/code%20quality-10%2F10-brightgreen.svg)](#code-quality)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.0+-black.svg)](https://nextjs.org/)

A comprehensive AI-powered recruitment platform built with Next.js, TypeScript, and Firebase, featuring advanced candidate matching, interview automation, and analytics.

## 🚀 Features

### Core Functionality
- **AI-Powered Candidate Matching**: Advanced algorithms for job-candidate compatibility
- **Automated Interview Scheduling**: Smart scheduling with calendar integration
- **Real-time Analytics**: Comprehensive hiring metrics and insights
- **Multi-tenant Architecture**: Organization-based data isolation
- **Role-based Access Control**: Granular permissions for different user types

### AI Capabilities
- **Resume Analysis**: Intelligent parsing and skill extraction
- **Culture Fit Assessment**: AI-driven cultural compatibility scoring
- **Interview Question Generation**: Dynamic question creation based on job requirements
- **Candidate Ranking**: Automated scoring and ranking system
- **Voice Interview Support**: Text-to-speech integration with ElevenLabs

### Security Features
- **Enterprise-grade Security**: OWASP Top 10 compliance
- **Data Encryption**: End-to-end encryption for sensitive data
- **Audit Logging**: Comprehensive activity tracking
- **Rate Limiting**: API protection against abuse
- **Input Validation**: Comprehensive sanitization and validation

## 🛠️ Tech Stack

### Frontend
- **Next.js 15+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **React Hook Form** - Form management with validation

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Firebase Admin SDK** - Server-side Firebase operations
- **Zod** - Runtime type validation
- **JWT** - Secure token-based authentication

### Database & Storage
- **Firebase Firestore** - NoSQL document database
- **Firebase Storage** - File storage and CDN
- **Vultr PostgreSQL** - Relational data storage
- **Redis** - Caching and session management

### AI & ML
- **Google Gemini AI** - Large language model integration
- **ElevenLabs** - Text-to-speech synthesis
- **Raindrop MCP** - AI model orchestration

### DevOps & Monitoring
- **Docker** - Containerization
- **GitHub Actions** - CI/CD pipeline
- **ESLint & Prettier** - Code quality and formatting
- **Jest** - Unit and integration testing
- **Husky** - Git hooks for quality gates

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase project with Firestore enabled
- Environment variables configured (see `.env.example`)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-championship.git
   cd ai-championship
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:9002](http://localhost:9002)

### Environment Configuration

Create a `.env.local` file with the following variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... (see .env.example for complete list)
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (app)/             # Protected app routes
│   ├── api/               # API endpoints
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   └── layout/           # Layout components
├── lib/                  # Utility libraries
│   ├── auth-utils.ts     # Authentication helpers
│   ├── security.ts       # Security utilities
│   ├── error-handler.ts  # Error handling
│   └── utils.ts          # General utilities
├── firebase/             # Firebase configuration
├── hooks/                # Custom React hooks
└── types/                # TypeScript type definitions
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage
- **Branches**: 70%+
- **Functions**: 70%+
- **Lines**: 70%+
- **Statements**: 70%+

## 🔒 Security

This project implements enterprise-grade security measures:

- **Authentication**: Firebase Auth with custom claims
- **Authorization**: Role-based access control
- **Input Validation**: Zod schemas for all inputs
- **Rate Limiting**: API endpoint protection
- **Security Headers**: OWASP recommended headers
- **Dependency Scanning**: Automated vulnerability checks

See [SECURITY.md](./SECURITY.md) for detailed security information.

## 📊 Code Quality

### Quality Metrics
- **TypeScript**: Strict mode enabled
- **ESLint**: Security and best practices rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit quality gates
- **Jest**: Comprehensive test coverage

### Quality Gates
- ✅ Linting passes
- ✅ Type checking passes
- ✅ Tests pass with 70%+ coverage
- ✅ Security audit passes
- ✅ Build succeeds

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```bash
docker build -t ai-championship .
docker run -p 3000:3000 ai-championship
```

### Firebase Hosting
```bash
npm run build
firebase deploy
```

## 📈 Performance

### Optimization Features
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **Caching**: Redis for session and data caching
- **CDN**: Firebase Storage for static assets
- **Compression**: Gzip compression enabled

### Performance Metrics
- **Lighthouse Score**: 95+
- **First Contentful Paint**: <1.5s
- **Largest Contentful Paint**: <2.5s
- **Cumulative Layout Shift**: <0.1

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Write tests for new features
- Update documentation as needed
- Follow the existing code style
- Ensure all quality gates pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](https://github.com/yourusername/ai-championship/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/ai-championship/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ai-championship/discussions)
- **Email**: support@yourcompany.com

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Firebase](https://firebase.google.com/) - Backend-as-a-Service
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- [Vercel](https://vercel.com/) - Deployment platform

---

**Built with ❤️ for the AI Championship**