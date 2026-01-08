# Learning Nugget - Interactive Computer Vision E-Learning Platform

An interactive, multi-modal learning platform for teaching Computer Vision concepts through structured lessons, coding exercises, experiments, and podcasts.

## 🚀 Quick Start

```bash
# 1. Clone repository
git clone https://github.com/sebastianvauth/learningnuggetpreviewer.git
cd learningnuggetpreviewer

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# 3. Start local server
npx http-server -p 8000
# Open http://localhost:8000
```

**📖 Full Setup Instructions**: See [SETUP.md](SETUP.md)

**🔐 Security Notice**: See [SECURITY_CREDENTIAL_ROTATION.md](SECURITY_CREDENTIAL_ROTATION.md) for credential management

---

## ✨ Features

- **612 Interactive Lessons** across 21+ Computer Vision chapters
- **Multi-Modal Learning**: Lessons, coding exercises, experiments, videos, podcasts
- **Progress Tracking**: User authentication, completion tracking, achievements
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Search Functionality**: Find lessons quickly across all content
- **Secure Authentication**: Supabase-powered user management

---

## 📚 Course Content

### Computer Vision Curriculum
- **Ch 1**: Introduction to Vision (perception, illusions, attention)
- **Ch 2**: Perception Systems (light physics, cameras, sensors)
- **Ch 3**: Image Representation (pixels, color theory, HDR)
- **Ch 4**: Image Formation & Transformations
- **Ch 5-6**: Fourier Transforms
- **Ch 7**: Image Characteristics
- **Ch 8**: Image Modifications
- **Ch 9-10**: Filters, Kernels & Morphology
- **Plus**: Chapters 11-21 covering advanced topics

---

## 🏗️ Architecture

### Frontend
- Vanilla JavaScript (ES6 modules)
- HTML5 + CSS3
- No framework dependencies (intentional simplicity)

### Backend
- Supabase (PostgreSQL database)
- Row Level Security (RLS) policies
- Authentication & user profiles

### Styling Architecture
- **External CSS**: Centralized stylesheet at `course_content/03-computer-vision/styles/lesson.css`
- **Consistent Styling**: 90+ lesson files share visual style
- **Features**: Gradients, animations, accessibility enhancements, responsive design

---

## 🔧 Technology Stack

- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Frontend**: Vanilla JS, HTML5, CSS3
- **Fonts**: Google Fonts (Inter)
- **Deployment**: GitHub Pages

---

## 📂 Project Structure

```
learning-nugget/
├── config.js                  # Secure configuration loader
├── script.js                  # Main application (3,724 lines)
├── style.css                  # Global styles
├── index.html                 # Entry point
├── content.json               # Course catalog (612 lessons)
├── course_content/            # Lesson HTML files
│   └── 03-computer-vision/
│       ├── styles/lesson.css  # Shared lesson styles
│       └── cv-ch*/            # Chapter folders
├── tests/                     # Test suite
├── .env.example               # Environment template
├── .gitignore                 # Excludes credentials
└── SETUP.md                   # Setup instructions
```

---

## 🧪 Testing

Open `tests/test_runner.html` in your browser to run the test suite.

**Test Coverage**: Currently minimal (only content parser tested)
- **TODO**: Add comprehensive test coverage for auth, progress tracking, navigation

---

## 🤝 Contributing

### Code Style
- Use existing styles/components from reference lessons
- Avoid duplicating functionality
- Keep files under 300 lines when feasible
- Follow [BEST_PRACTICES_FOR_LESSON_HTML.md](BEST_PRACTICES_FOR_LESSON_HTML.md)

### Creating New Lessons
1. Link to external CSS: `<link rel="stylesheet" href="../../styles/lesson.css">`
2. Use semantic HTML (no inline event handlers)
3. Ensure accessibility (alt text, ARIA labels, keyboard navigation)
4. Test on multiple browsers and devices

### Interactive Canvases
- Listen for section visibility via `MutationObserver`
- Run `syncCanvasSize()` in draw loop to prevent zero-width renders

---

## 🔐 Security

**⚠️ Important**: Never commit credentials to git!

- Environment variables stored in `.env` (excluded by `.gitignore`)
- Supabase credentials loaded via `config.js`
- Row Level Security enabled on all database tables
- CSP headers recommended for production

See [SECURITY_CREDENTIAL_ROTATION.md](SECURITY_CREDENTIAL_ROTATION.md) for credential management.

---

## 🚀 Deployment

### GitHub Pages (Current)
See [SECURITY_CREDENTIAL_ROTATION.md](SECURITY_CREDENTIAL_ROTATION.md) for GitHub Actions setup.

### Environment Variables in Production
Use GitHub Secrets to inject credentials at build time:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 📝 Known Issues

See GitHub Issues for current bugs and feature requests.

**High Priority**:
- Large `script.js` file (3,724 lines) needs modularization
- Inline event handlers in lesson HTML violate CSP
- Missing comprehensive test coverage

---

## 📄 License

[Add your license here]

---

## 📧 Contact

[Add contact information]

---

## 🙏 Acknowledgments

Built with:
- [Supabase](https://supabase.com) - Backend infrastructure
- [Google Fonts](https://fonts.google.com) - Inter typeface
- Community contributors

