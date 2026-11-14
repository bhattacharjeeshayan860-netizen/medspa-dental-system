/**
 * Security Hardening Utilities
 *
 * Provides:
 * - Content Security Policy (CSP) helpers
 * - XSS sanitization for user-generated content
 * - Input validation patterns
 * - Secure DOM manipulation helpers
 *
 * Note: This is a frontend SPA. Server-side CSP headers should also be configured
 * on the hosting platform (nginx, Cloudflare, Vercel, Netlify, etc.).
 */

// ============================================================================
// Content Security Policy Helpers
// ============================================================================

/**
 * Generates a strict CSP policy string for the application.
 * Adjust directives based on your deployment environment and external dependencies.
 *
 * @param {Object} options - CSP configuration options
 * @param {boolean} options.reportOnly - If true, uses Content-Security-Policy-Report-Only header
 * @param {string} options.reportUri - Endpoint for CSP violation reports
 * @param {boolean} options.strict - If true, uses strict-dynamic and nonces
 * @returns {string} CSP policy string
 */
export function generateCSP({
  reportOnly = false,
  reportUri = '/api/csp-report',
  strict = true
} = {}) {
  const headerName = reportOnly
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy';

  const policies = [
    // Default fallback
    "default-src 'self'",

    // Scripts - only from self, with nonce for inline scripts if strict mode
    strict
      ? "script-src 'self' 'strict-dynamic' https://fonts.googleapis.com"
      : "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

    // Styles - self + Google Fonts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

    // Fonts - self + Google Fonts
    "font-src 'self' https://fonts.gstatic.com data:",

    // Images - self + data URIs + blob (for generated images)
    "img-src 'self' data: blob: https:",

    // Connect - published HTTPS APIs plus the local n8n instance used in development
    "connect-src 'self' https://fonts.googleapis.com http://localhost:5678 http://127.0.0.1:5678 wss: https:",

    // Media - self only
    "media-src 'self'",

    // Objects/embeds - none
    "object-src 'none'",

    // Frames - none (or specific trusted origins)
    "frame-src 'none'",

    // Frame ancestors - prevent clickjacking
    "frame-ancestors 'none'",

    // Base URI - restrict to self
    "base-uri 'self'",

    // Form action - restrict to self
    "form-action 'self'",

    // Upgrade insecure requests (HTTPS enforcement)
    "upgrade-insecure-requests",

    // Block mixed content
    "block-all-mixed-content"
  ];

  if (reportUri) {
    policies.push(`report-uri ${reportUri}`);
    policies.push(`report-to csp-endpoint`);
  }

  return `${headerName}: ${policies.join('; ')}`;
}

/**
 * Injects CSP meta tag into document head (for development/SPA without server control).
 * Note: meta tag CSP cannot enforce all directives (e.g., frame-ancestors, sandbox).
 * Server-side headers are strongly recommended for production.
 *
 * @param {Object} options - CSP configuration options
 */
export function injectCSPMetaTag(options = {}) {
  const cspString = generateCSP(options).replace(/^[^:]+:\s*/, '');

  // Remove existing CSP meta tag if present
  const existing = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (existing) existing.remove();

  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = cspString;
  document.head.appendChild(meta);

  return meta;
}

// ============================================================================
// XSS Sanitization
// ============================================================================

/**
 * HTML Entity encoding map
 */
const ENTITY_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * Encodes HTML special characters to prevent XSS.
 * Use when rendering user-controlled content as text (not HTML).
 *
 * @param {string} str - String to encode
 * @returns {string} HTML-encoded string
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"'`=/]/g, char => ENTITY_MAP[char]);
}

/**
 * Encodes string for safe use in HTML attribute values.
 *
 * @param {string} str - String to encode
 * @returns {string} Attribute-safe string
 */
export function escapeAttribute(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"'`=]/g, char => ENTITY_MAP[char]);
}

/**
 * Encodes string for safe use in JavaScript string contexts.
 *
 * @param {string} str - String to encode
 * @returns {string} JavaScript-safe string
 */
export function escapeJavaScript(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026');
}

/**
 * Encodes string for safe use in CSS contexts.
 *
 * @param {string} str - String to encode
 * @returns {string} CSS-safe string
 */
export function escapeCSS(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[^a-zA-Z0-9]/g, char =>
    `\\${char.charCodeAt(0).toString(16).padStart(4, '0')}`
  );
}

/**
 * Encodes string for safe use in URL contexts.
 *
 * @param {string} str - String to encode
 * @returns {string} URL-safe string
 */
export function escapeURL(str) {
  if (str === null || str === undefined) return '';
  return encodeURIComponent(String(str))
    .replace(/[!'()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

/**
 * Strips dangerous HTML tags and attributes while preserving safe formatting.
 * For richer content sanitization, use DOMPurify (recommended).
 *
 * @param {string} html - HTML string to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized HTML
 */
export function sanitizeHtml(html, options = {}) {
  if (!html) return '';

  const {
    allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br', 'span', 'a'],
    allowedAttributes = { a: ['href', 'title', 'target', 'rel'] },
    allowDataAttributes = false
  } = options;

  // Create a temporary element for parsing
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove script and style elements entirely
  doc.querySelectorAll('script, style, iframe, object, embed, form, input, button').forEach(el => el.remove());

  // Remove event handlers and javascript: URLs
  const allElements = doc.querySelectorAll('*');
  allElements.forEach(el => {
    // Remove on* event handlers
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on') || attr.value.includes('javascript:')) {
        el.removeAttribute(attr.name);
      }
    });

    // Validate tag
    if (!allowedTags.includes(el.tagName.toLowerCase())) {
      // Replace with text content
      const text = document.createTextNode(el.textContent || '');
      el.parentNode?.replaceChild(text, el);
      return;
    }

    // Validate attributes
    const allowedAttrs = allowedAttributes[el.tagName.toLowerCase()] || [];
    Array.from(el.attributes).forEach(attr => {
      const attrName = attr.name.toLowerCase();
      if (!allowedAttrs.includes(attrName) && !(allowDataAttributes && attrName.startsWith('data-'))) {
        el.removeAttribute(attr.name);
      }
    });

    // Sanitize href attributes
    if (el.tagName.toLowerCase() === 'a' && el.hasAttribute('href')) {
      const href = el.getAttribute('href');
      if (href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('/') && !href.startsWith('#') && !href.startsWith('mailto:')) {
        el.removeAttribute('href');
      }
      // Add security attributes
      el.setAttribute('rel', 'noopener noreferrer');
      if (href && href.startsWith('http')) {
        el.setAttribute('target', '_blank');
      }
    }
  });

  return doc.body.innerHTML;
}

/**
 * Creates a safe text node (completely escapes HTML).
 * Use this instead of innerHTML when rendering user content as text.
 *
 * @param {string} text - Text content
 * @returns {Text} Safe text node
 */
export function createSafeTextNode(text) {
  return document.createTextNode(String(text || ''));
}

/**
 * Safely sets element text content.
 *
 * @param {HTMLElement} element - Target element
 * @param {string} text - Text content
 */
export function safeSetText(element, text) {
  if (element) {
    element.textContent = String(text || '');
  }
}

// ============================================================================
// Input Validation Patterns
// ============================================================================

/**
 * Validation regex patterns for common input types
 */
export const VALIDATION_PATTERNS = {
  // Email - RFC 5322 compliant (simplified)
  email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,

  // Phone - E.164 format
  phoneE164: /^\+[1-9]\d{1,14}$/,

  // Phone - US format
  phoneUS: /^\+1\d{10}$/,

  // URL - must be HTTPS
  urlHttps: /^https:\/\/[^\s/$.?#].[^\s]*$/,

  // Alphanumeric only
  alphanumeric: /^[a-zA-Z0-9]+$/,

  // Alphanumeric + spaces, hyphens, underscores
  slug: /^[a-zA-Z0-9\s_-]+$/,

  // Safe filename
  filename: /^[a-zA-Z0-9._-]+$/,

  // UUID v4
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,

  // No script tags or event handlers
  noScripts: /<script|on\w+\s*=/i,

  // No SQL injection patterns
  noSqlInjection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b|(--|;|\/\*|\*\/))/i,

  // No path traversal
  noPathTraversal: /(\.\.[\/\\])/,

  // Strong password (min 8 chars, upper, lower, number, special)
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/
};

/**
 * Validates input against a pattern.
 *
 * @param {string} input - Input to validate
 * @param {RegExp} pattern - Validation pattern
 * @returns {boolean} True if valid
 */
export function validateInput(input, pattern) {
  if (input === null || input === undefined) return false;
  return pattern.test(String(input));
}

/**
 * Validates and sanitizes input in one step.
 *
 * @param {string} input - Input to validate and sanitize
 * @param {RegExp} pattern - Validation pattern
 * @param {Function} sanitizer - Sanitization function (default: escapeHtml)
 * @returns {Object} { valid: boolean, value: string, error?: string }
 */
export function validateAndSanitize(input, pattern, sanitizer = escapeHtml) {
  if (input === null || input === undefined) {
    return { valid: false, value: '', error: 'Input is required' };
  }

  const str = String(input);

  if (!pattern.test(str)) {
    return { valid: false, value: sanitizer(str), error: 'Invalid format' };
  }

  return { valid: true, value: sanitizer(str) };
}

/**
 * Validates multiple fields at once.
 *
 * @param {Object} fields - Object with field names as keys and { value, pattern, sanitizer } as values
 * @returns {Object} { valid: boolean, values: Object, errors: Object }
 */
export function validateForm(fields) {
  const values = {};
  const errors = {};
  let valid = true;

  for (const [name, config] of Object.entries(fields)) {
    const result = validateAndSanitize(config.value, config.pattern, config.sanitizer);
    values[name] = result.value;
    if (!result.valid) {
      errors[name] = result.error;
      valid = false;
    }
  }

  return { valid, values, errors };
}

// ============================================================================
// Secure DOM Manipulation
// ============================================================================

/**
 * Safely creates an element with attributes and text content.
 * Prevents XSS by using safe setters.
 *
 * @param {string} tag - HTML tag name
 * @param {Object} attributes - Element attributes
 * @param {string} text - Text content (will be escaped)
 * @returns {HTMLElement} Created element
 */
export function createSafeElement(tag, attributes = {}, text = '') {
  const element = document.createElement(tag);

  // Set attributes safely
  for (const [key, value] of Object.entries(attributes)) {
    if (key.startsWith('on') || key === 'href' && String(value).includes('javascript:')) {
      // Skip event handlers and javascript: URLs
      continue;
    }
    if (key === 'style' && typeof value === 'object') {
      // Safe style object assignment
      Object.assign(element.style, value);
    } else {
      element.setAttribute(key, String(value));
    }
  }

  // Set text content safely
  if (text) {
    element.textContent = String(text);
  }

  return element;
}

/**
 * Safely appends content to an element.
 *
 * @param {HTMLElement} parent - Parent element
 * @param {string|HTMLElement|Text|Array} content - Content to append
 */
export function safeAppend(parent, content) {
  if (!parent) return;

  const nodes = Array.isArray(content) ? content : [content];

  nodes.forEach(node => {
    if (typeof node === 'string') {
      parent.appendChild(document.createTextNode(node));
    } else if (node instanceof Node) {
      parent.appendChild(node);
    }
  });
}

/**
 * Clears element content safely.
 *
 * @param {HTMLElement} element - Element to clear
 */
export function safeClear(element) {
  if (element) {
    element.textContent = '';
  }
}

// ============================================================================
// Security Headers Utility (for server-side rendering or meta injection)
// ============================================================================

/**
 * Recommended security headers for production deployment.
 * Configure these on your web server (nginx, Apache, Cloudflare, etc.).
 *
 * @returns {Object} Header name -> value mapping
 */
export function getRecommendedSecurityHeaders() {
  return {
    // CSP - Primary XSS protection
    'Content-Security-Policy': generateCSP({ strict: true }),

    // Prevent MIME sniffing
    'X-Content-Type-Options': 'nosniff',

    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // XSS filter (legacy but still useful)
    'X-XSS-Protection': '1; mode=block',

    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions policy (feature policy)
    'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',

    // HSTS (only if HTTPS is enforced)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

    // Cross-origin policies
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin'
  };
}

// ============================================================================
// PHI/Sensitive Data Detection (Frontend Guardrails)
// ============================================================================

/**
 * Common PHI patterns that should never appear in frontend logs or analytics
 */
const PHI_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  /\b\d{10,}\b/, // Phone numbers (10+ digits)
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
  /\b\d{1,5}\s\w+\s(?:St|Ave|Rd|Dr|Ln|Blvd|Ct|Pl|Way)\b/i, // Address
  /\b(?:DOB|Date of Birth)\s*[:\-]\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/i, // DOB
  /\b(MRN|Medical Record)\s*[#:]\s*\w+\b/i // Medical Record Number
];

/**
 * Scans text for potential PHI.
 * Use before sending data to analytics, logging, or third-party services.
 *
 * @param {string} text - Text to scan
 * @returns {Object} { hasPhi: boolean, patterns: string[] }
 */
export function scanForPHI(text) {
  if (!text) return { hasPhi: false, patterns: [] };

  const str = String(text);
  const detected = [];

  for (const pattern of PHI_PATTERNS) {
    const matches = str.match(pattern);
    if (matches) {
      detected.push(...matches);
    }
  }

  return {
    hasPhi: detected.length > 0,
    patterns: [...new Set(detected)]
  };
}

/**
 * Redacts PHI from text for safe logging.
 *
 * @param {string} text - Text to redact
 * @returns {string} Redacted text
 */
export function redactPHI(text) {
  if (!text) return '';

  let result = String(text);

  for (const pattern of PHI_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]');
  }

  return result;
}

// ============================================================================
// CSRF Protection Helpers
// ============================================================================

/**
 * Generates a CSRF token.
 * In production, use crypto.randomUUID() or a proper CSRF library.
 *
 * @returns {string} CSRF token
 */
export function generateCSRFToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates a CSRF token (timing-safe comparison).
 *
 * @param {string} token - Submitted token
 * @param {string} expected - Expected token
 * @returns {boolean} True if valid
 */
export function validateCSRFToken(token, expected) {
  if (!token || !expected || token.length !== expected.length) return false;

  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }

  return result === 0;
}

// ============================================================================
// Initialize Security on App Load
// ============================================================================

/**
 * Initializes client-side security hardening.
 * Call this once at app startup.
 *
 * @param {Object} options - Security configuration
 */
export function initializeSecurity(options = {}) {
  const {
    injectCSP = true,
    cspOptions = {},
    enablePHIScanning = true
  } = options;

  // Inject CSP meta tag (development/SPA fallback)
  if (injectCSP) {
    injectCSPMetaTag(cspOptions);
  }

  // Override console methods to redact PHI in development
  if (enablePHIScanning && process.env.NODE_ENV === 'development') {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const redactArgs = (args) => args.map(arg =>
      typeof arg === 'string' ? redactPHI(arg) : arg
    );

    console.log = (...args) => originalLog(...redactArgs(args));
    console.error = (...args) => originalError(...redactArgs(args));
    console.warn = (...args) => originalWarn(...redactArgs(args));
  }

  // Add security-related event listeners
  if (typeof window !== 'undefined') {
    // Detect CSP violations
    document.addEventListener('securitypolicyviolation', (e) => {
      console.warn('[CSP Violation]', {
        directive: e.violatedDirective,
        blockedURI: e.blockedURI,
        documentURI: e.documentURI
      });
    });
  }

  return { cspInjected: injectCSP };
}

export default {
  generateCSP,
  injectCSPMetaTag,
  escapeHtml,
  escapeAttribute,
  escapeJavaScript,
  escapeCSS,
  escapeURL,
  sanitizeHtml,
  createSafeTextNode,
  safeSetText,
  VALIDATION_PATTERNS,
  validateInput,
  validateAndSanitize,
  validateForm,
  createSafeElement,
  safeAppend,
  safeClear,
  getRecommendedSecurityHeaders,
  scanForPHI,
  redactPHI,
  generateCSRFToken,
  validateCSRFToken,
  initializeSecurity
};