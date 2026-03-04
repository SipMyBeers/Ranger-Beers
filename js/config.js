// ============================================
// RANGER BEERS — Configuration
// Centralized constants for the application
// ============================================

const CONFIG = {
  // API Configuration
  API_BASE: 'https://ranger-beers-api.dzbeers747.workers.dev',
  
  // E-commerce
  SNIPCART_KEY: 'Y2QzMWQ1NWQtNjc3NC00MDY1LThkMmQtY2ZmNzg5ZDkwMWE2NjM5MDc5MTUyNTMxMDc3MzE4',
  
  // External CDN URLs
  CDN: {
    FONTS: 'https://fonts.googleapis.com',
    FONTS_CSS: 'https://fonts.googleapis.com/css2',
    SNIPCART_CSS: 'https://cdn.snipcart.com/themes/v3.7.1/default/snipcart.css',
    SNIPCART_JS: 'https://cdn.snipcart.com/themes/v3.7.1/default/snipcart.js',
    FIREBASE_APP: 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js',
    FIREBASE_AUTH: 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js',
    FIREBASE_FIRESTORE: 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js'
  },
  
  // Cache & Performance
  CACHE_VERSION: 'v1',
  ACCESS_CACHE_DURATION: 60000, // 1 minute in ms
  
  // Local Storage Keys
  STORAGE_KEYS: {
    TOKEN: 'rb_token',
    USER: 'rb_user',
    OFFLINE_QUEUE: 'rb_offline_queue'
  },
  
  // Feature Flags
  FEATURES: {
    OFFLINE_SUPPORT: true,
    ANIMATIONS: true,
    ANALYTICS: false
  }
};

// Export for ES modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
