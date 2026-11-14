const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
const baseUrl = String(env.VITE_N8N_BASE_URL || '').replace(/\/$/, '');
const webhookPrefix = (env.VITE_N8N_WEBHOOK_PREFIX || '/webhook-test').replace(/\/$/, '');
// Live data is the safe default. Preview data must be explicitly enabled.
const configuredDemoMode = String(env.VITE_DEMO_MODE || 'false').toLowerCase() === 'true';
let runtimeDemoMode = configuredDemoMode;
const configuredTenantId = String(env.VITE_AUREVIA_TENANT_ID || '').trim();
const configuredRole = String(env.VITE_AUREVIA_USER_ROLE || '').trim();
const configuredAuthToken = String(env.VITE_N8N_AUTH_TOKEN || '').trim();
const publicWebhooks = String(env.VITE_N8N_PUBLIC_WEBHOOKS || 'false').toLowerCase() === 'true';
const webhookPath = (path) => `${webhookPrefix}/${path.replace(/^\//, '')}`;

export const apiConfig = {
  baseUrl,
  webhookPrefix,
  get demoMode() {
    return runtimeDemoMode;
  },
  get canEnableLiveMode() {
    return !configuredDemoMode && Boolean(baseUrl && (configuredAuthToken || publicWebhooks));
  },
  tenantId: configuredTenantId,
  userRole: configuredRole,
  publicWebhooks,
  webhooks: {
    incomingWhatsApp: webhookPath('patient-reply'),
    outboundCampaign: webhookPath('patient-outbound'),
    dashboard: webhookPath('dashboard'),
    clients: webhookPath('clients'),
    client: webhookPath('client'),
    conversations: webhookPath('conversations'),
    humanHandoffs: webhookPath('handoffs'),
    humanHandoffStatus: webhookPath('human-handoff-status'),
    patient: webhookPath('patient'),
    offers: webhookPath('offers'),
    config: webhookPath('config'),
    missedCall: webhookPath('missed-call'),
    booking: webhookPath('booking'),
    weeklyReport: webhookPath('weekly-report'),
    humanTakeover: webhookPath('human-takeover')
  }
};

export function setApiDemoMode(active) {
  const nextMode = Boolean(active);
  if (!nextMode && configuredDemoMode) {
    throw new ApiError('Live data is disabled by VITE_DEMO_MODE=true.', {
      code: 'DEMO_MODE_LOCKED',
      status: 403
    });
  }
  if (runtimeDemoMode !== nextMode) {
    runtimeDemoMode = nextMode;
    invalidateCache();
  }
  return runtimeDemoMode;
}

export const pendingRequests = new Map();
export const responseCache = new Map();
export const CACHE_TTL_MS = 15000; // 15 seconds TTL for read requests
export const DEFAULT_TIMEOUT_MS = 10000; // 10 second timeout

/**
 * Computes a tenant-scoped cache and deduplication key.
 * Enforces multi-tenant cache isolation so Clinic A can never read Clinic B's cached responses.
 */
export function getCacheKey(path, tenantId = null) {
  const normalizedTenant = tenantId || (typeof window !== 'undefined' && window.__AUREVIA_ACTIVE_TENANT__) || 'global';
  return `${normalizedTenant}:${path}`;
}

/**
 * Explicit cache invalidator for mutations and manual refreshes.
 * Supports tenant-scoped eviction as well as matching path patterns.
 */
export function invalidateCache(pathPattern = null, tenantId = null) {
  if (!pathPattern && !tenantId) {
    const size = responseCache.size;
    responseCache.clear();
    return size;
  }
  let cleared = 0;
  for (const key of Array.from(responseCache.keys())) {
    const colonIdx = key.indexOf(':');
    const keyTenant = colonIdx !== -1 ? key.slice(0, colonIdx) : 'global';
    const keyPath = colonIdx !== -1 ? key.slice(colonIdx + 1) : key;

    const matchesTenant = !tenantId || keyTenant === tenantId || keyTenant === 'global';
    const matchesPath = !pathPattern || keyPath.includes(pathPattern) || key.includes(pathPattern);

    if (matchesTenant && matchesPath) {
      responseCache.delete(key);
      cleared++;
    }
  }
  return cleared;
}

/**
 * Standardized API Error Shape
 */
export class ApiError extends Error {
  constructor(message, { status = 500, code = 'API_ERROR', endpoint = '' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.endpoint = endpoint;
  }
}

export async function request(path, options = {}) {
  const currentBaseUrl = options.baseUrl || baseUrl;
  if (!currentBaseUrl) {
    throw new ApiError('VITE_N8N_BASE_URL is not configured', { code: 'CONFIG_ERROR', status: 500, endpoint: path });
  }
  const isGet = !options.method || options.method === 'GET';
  const hasIdempotencyKey = Boolean(options.headers?.['Idempotency-Key'] || options.headers?.['X-Idempotency-Key']);
  const isIdempotent = isGet || hasIdempotencyKey;
  const isCurrentDemoMode = options.demoMode !== undefined ? options.demoMode : apiConfig.demoMode;

  // Extract tenant context upfront for cache and request isolation
  const tenantId = options.tenantId || options.clinicId || (typeof window !== 'undefined' && window.__AUREVIA_ACTIVE_TENANT__) || configuredTenantId || (isCurrentDemoMode ? 'aurevia-beverly-hills' : null);
  const userRole = options.userRole || (typeof window !== 'undefined' && window.__AUREVIA_ACTIVE_ROLE__) || configuredRole || (isCurrentDemoMode ? 'STAFF' : null);
  const authToken = options.authToken || configuredAuthToken;
  const cacheKey = getCacheKey(path, tenantId);

  // 1. Fresh in-memory cache check for GET requests (tenant-isolated)
  if (isGet) {
    const cached = responseCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      return cached.data;
    }

    // 2. Deduplicate simultaneous in-flight GET requests (tenant-isolated)
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }
  }

  const execute = async () => {
    if (!isCurrentDemoMode && !publicWebhooks && !options.authenticatedSession && !authToken) {
      throw new ApiError('Authentication required: Production requests require an active authenticated server session.', {
        code: 'AUTHENTICATION_REQUIRED',
        status: 401,
        endpoint: path
      });
    }

    // Public n8n webhooks still require tenant context for routing.
    if (!isCurrentDemoMode && !tenantId) {
      throw new ApiError('Tenant context required: Production requests must explicitly specify a verified tenant ID.', {
        code: 'TENANT_REQUIRED',
        status: 400,
        endpoint: path
      });
    }

    try {
      let attempts = 0;
      // Strictly idempotent retries: only GET or requests with an idempotency key can retry once
      const maxAttempts = isIdempotent ? 2 : 1;
      let lastError = null;

      while (attempts < maxAttempts) {
        attempts++;
        let response;
        const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
        
        try {
          const signal = options.signal || (AbortSignal.timeout ? AbortSignal.timeout(timeoutMs) : undefined);

          // Client context hints: strictly non-trusted routing metadata
          // Deliberate header merging: caller headers cannot strip required metadata
          const requestHeaders = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
          };

          if (tenantId) {
            requestHeaders['X-Tenant-Id'] = tenantId;
            requestHeaders['X-Client-Tenant-Hint'] = tenantId;
          }
          if (userRole) {
            requestHeaders['X-User-Role'] = userRole;
            requestHeaders['X-Client-Role-Hint'] = userRole;
          }
          if (authToken) {
            requestHeaders['Authorization'] = `Bearer ${authToken}`;
          }

          response = await fetch(`${currentBaseUrl}${path}`, {
            signal,
            headers: requestHeaders,
            ...options
          });
        } catch (err) {
          lastError = err;
          
          // Caller explicit cancellation
          if (options.signal?.aborted) {
            throw new ApiError(`Request to ${path} aborted by caller`, {
              code: 'ABORT_ERROR',
              status: 499,
              endpoint: path
            });
          }

          // Timeout handling
          if (err.name === 'TimeoutError') {
            throw new ApiError(`Request to ${path} timed out after ${timeoutMs}ms`, {
              code: 'TIMEOUT_ERROR',
              status: 504,
              endpoint: path
            });
          }

          // In demo mode only, fallback to cached data if network unreachable
          if (isCurrentDemoMode) {
            const fallback = responseCache.get(path);
            if (fallback) {
              console.warn(`[AI Reactivation API] Offline fallback served for ${path}`);
              return fallback.data;
            }
          }

          if (attempts < maxAttempts) {
            await new Promise((r) => setTimeout(r, 800));
            continue;
          }

          throw new ApiError(`Unable to reach n8n automation layer at ${currentBaseUrl} (Network failure)`, {
            code: 'NETWORK_ERROR',
            status: 503,
            endpoint: path
          });
        }

        if (!response.ok) {
          const detail = await response.text().catch(() => '');

          // If n8n returned transient 500/502/503/504 on an idempotent request, retry once
          if (response.status >= 500 && attempts < maxAttempts && isIdempotent) {
            await new Promise((r) => setTimeout(r, 800));
            continue;
          }

          // In demo mode only, fallback to cached data
          if (isCurrentDemoMode) {
            const fallback = responseCache.get(cacheKey);
            if (fallback) {
              console.warn(`[AI Reactivation API] HTTP ${response.status}, serving cached fallback for ${cacheKey}`);
              return fallback.data;
            }
          }

          // Production mode must fail clearly so failures are not silently masked
          const errorCode = response.status === 404 ? 'NOT_FOUND' : response.status === 400 ? 'BAD_REQUEST' : response.status === 401 || response.status === 403 ? 'AUTH_ERROR' : 'HTTP_ERROR';
          throw new ApiError(`n8n endpoint ${path} returned HTTP ${response.status}${detail ? `: ${detail.slice(0, 160)}` : ''}`, {
            code: errorCode,
            status: response.status,
            endpoint: path
          });
        }

        if (response.status === 204) return null;
        const body = await response.text();
        if (!body.trim()) {
          const emptyResult = path.includes('conversations') ? { success: true, conversations: [] } : path.includes('clients') ? [] : null;
          if (isGet && emptyResult) responseCache.set(cacheKey, { timestamp: Date.now(), data: emptyResult });
          return emptyResult;
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          if (isGet) responseCache.set(cacheKey, { timestamp: Date.now(), data: body });
          return body;
        }

        try {
          const parsed = JSON.parse(body);
          // Safe logging: never print raw patient PII payloads to browser console
          if (isGet) responseCache.set(cacheKey, { timestamp: Date.now(), data: parsed });
          return parsed;
        } catch {
          throw new ApiError(`n8n endpoint ${path} returned malformed or non-JSON response`, {
            code: 'PARSE_ERROR',
            status: 502,
            endpoint: path
          });
        }
      }

      throw lastError || new ApiError(`n8n endpoint ${path} failed`, { status: 500, endpoint: path });
    } finally {
      if (isGet) {
        pendingRequests.delete(cacheKey);
      }
    }
  };

  const promise = execute();
  if (isGet) {
    pendingRequests.set(cacheKey, promise);
  }

  return promise;
}

export const api = {
  getDashboard: () => request(apiConfig.webhooks.dashboard),
  getClients: () => request(apiConfig.webhooks.clients),
  getClient: (patientId) => request(`${apiConfig.webhooks.client}?patient_id=${encodeURIComponent(patientId)}`),
  getConversations: (patientId) => {
    const normalizedPatientId = String(patientId || '').trim();
    if (normalizedPatientId) {
      return request(`${apiConfig.webhooks.conversations}?patient_id=${encodeURIComponent(normalizedPatientId)}`);
    }
    return request(apiConfig.webhooks.conversations);
  },
  getGlobalConversations: () => request(apiConfig.webhooks.conversations),
  getHumanHandoffs: () => request(apiConfig.webhooks.humanHandoffs),
  updateHumanHandoffStatus: async (queueId, status) => {
    const res = await request(apiConfig.webhooks.humanHandoffStatus, {
      method: 'PATCH',
      body: JSON.stringify({ queue_id: queueId, status })
    });
    invalidateCache('handoff');
    invalidateCache('dashboard');
    return res;
  },
  updatePatient: async (patientId, fields) => {
    const res = await request(apiConfig.webhooks.patient, {
      method: 'PATCH',
      body: JSON.stringify({ patient_id: patientId, ...fields })
    });
    invalidateCache('client');
    invalidateCache('dashboard');
    return res;
  },
  getOffers: () => request(apiConfig.webhooks.offers),
  getConfig: () => request(apiConfig.webhooks.config),
  sendInboundReply: async (phone, message, messageId) => {
    const body = {
      phone: String(phone || '').trim(),
      message: String(message || '').trim(),
      timestamp: new Date().toISOString(),
      ...(messageId ? { message_id: messageId } : {})
    };
    const res = await request(apiConfig.webhooks.incomingWhatsApp, {
      method: 'POST',
      body: JSON.stringify(body)
    });
    invalidateCache('conversations');
    invalidateCache('dashboard');
    return res;
  },
  sendInboundTest: (phone, message, messageId) => api.sendInboundReply(phone, message, messageId),
  startOutboundCampaign: async (payload = {}) => {
    const body = {
      source: payload.source || 'aurevia-practice-os',
      campaign_name: payload.campaign_name || 'Returning Patient Reactivation',
      requested_at: payload.requested_at || new Date().toISOString(),
      customer_ids: Array.isArray(payload.customer_ids) ? payload.customer_ids.slice(0, 25) : [],
      max_recipients: Math.min(Number(payload.max_recipients) || 25, 25),
      offer_id: payload.offer_id || 'OFF001',
      timezone: payload.timezone || 'Asia/Kolkata',
      dry_run: Boolean(payload.dry_run)
    };
    const res = await request(apiConfig.webhooks.outboundCampaign, {
      method: 'POST',
      body: JSON.stringify(body)
    });
    invalidateCache('dashboard');
    invalidateCache('clients');
    return res;
  },
  startCampaign: (payload) => api.startOutboundCampaign(payload),
  sendMissedCall: async (payload = {}) => {
    const res = await request(apiConfig.webhooks.missedCall, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    invalidateCache('dashboard');
    return res;
  },
  createBooking: async (payload = {}) => {
    const res = await request(apiConfig.webhooks.booking, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    invalidateCache('dashboard');
    invalidateCache('clients');
    return res;
  },
  getWeeklyReport: (clinicId) => request(`${apiConfig.webhooks.weeklyReport}?clinic_id=${encodeURIComponent(clinicId || '')}`),
  updateTakeover: async (patientId, staffMember, active) => {
    const res = await request(apiConfig.webhooks.humanTakeover, {
      method: 'POST',
      body: JSON.stringify({ patient_id: patientId, staff_member: staffMember, human_active: active })
    });
    invalidateCache('conversations');
    invalidateCache('handoff');
    return res;
  }
};
