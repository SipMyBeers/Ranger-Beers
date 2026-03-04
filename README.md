# Ranger Beers — Main Website

**Live URL**: https://ranger-beers.com

## How to Update the Live Site

### Overview
This is the main website — a static HTML/CSS/JS site hosted on **GitHub Pages**.

### Deployment Process

1. **Make your changes** to the local files
2. **Commit and push** to the `main` branch:

```bash
cd /Users/beers/Desktop/Ranger-Beers
git add .
git commit -m "Description of changes"
git push origin main
```

GitHub Pages will automatically deploy the changes to https://ranger-beers.com (usually takes 1-2 minutes).

### Repository
- **URL**: https://github.com/SipMyBeers/Ranger-Beers
- **Branch**: `main`

### Tech Stack
- Pure HTML/CSS/JS (static site)
- GitHub Pages hosting
- Service Worker for offline caching

### Development

```bash
# Install dependencies
npm install

# Run linter
npm run lint
```

### File Structure
```
Ranger-Beers/
├── index.html              # Main homepage
├── *.html                 # Various page templates
├── _headers               # Security & cache headers (GitHub Pages)
├── CNAME                  # Custom domain config
├── package.json            # NPM config & scripts
├── .eslintrc.json         # Code quality rules
├── .gitignore             # Git ignore patterns
├── js/                    # JavaScript files
│   ├── config.js          # Centralized configuration
│   ├── course-auth.js     # Authentication (magic link)
│   ├── course-engine.js   # Course progress & quizzes
│   ├── gear-data.js       # Product inventory data
│   ├── gear-modal.js      # Product modal UI
│   ├── shared.js          # Shared utilities
│   └── sw.js             # Service worker
├── css/                   # Stylesheets
│   ├── styles.css
│   ├── course-styles.css
│   └── school-landing.css
├── images/                # Static images
├── docs/                  # PDF documents
├── media/                 # Media assets
├── videos/                # Videos
├── ranger/                # Ranger course section
├── sapper/                # Sapper course section
└── ...                    # Other school subsites
```

### Configuration

All magic strings are centralized in `js/config.js`:
- API endpoints
- CDN URLs
- Storage keys
- Feature flags

### Security

- Content Security Policy (CSP) in `_headers`
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- Cache headers for performance
- Service worker for offline support

### Notes
- Each school subsite (airborne, sharp, sapper, etc.) has its own pages: index.html, shop.html, courses.html, standards.html, resources.html
- Subdirectory pages reference CSS/JS with relative paths (`../css/`, `../js/`)
- The `CNAME` file contains the custom domain configuration
- Service worker (`js/sw.js`) provides offline caching
