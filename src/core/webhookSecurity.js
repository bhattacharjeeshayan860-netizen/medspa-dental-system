/**
 * Aurevia Practice OS — Webhook Cryptographic Verification & Replay Protection
 *
 * ARCHITECTURAL NOTICE & TRUST BOUNDARY:
 * This module is designed to run strictly in a TRUSTED SERVER/BACKEND ENVIRONMENT:
 * - A Node.js API Gateway / Reverse Proxy
 * - An n8n "Code" Node directly inside a webhook ingestion workflow
 *
 * CRITICAL SECURITY PRINCIPLE:
 * Webhook HMAC shared secrets (WEBHOOK_SECRET) MUST NEVER be bundled into
 * client-side browser JavaScript or exposed in Vite public variables (VITE_*).
 * Webhook requests from external providers (Twilio, Meta, Cal.com) are terminated
 * and verified server-side by n8n or an API gateway before any downstream action is taken.
 *
 * Implements OWASP API Security Top 10 (2023) guidance:
 * - API2:2023 (Broken Authentication) -> HMAC-SHA256 signatures with constant-time check
 * - API6:2023 (Unrestricted Business Flows) -> Timestamp freshness window + Event deduplication
 */

import crypto from 'node:crypto';

const DEDUPLICATION_CACHE = new Map();
const REPLAY_TOLERANCE_MS = 300000; // 5 minutes (300 seconds)

export function computeHmacSha256(rawBody, secret) {
  if (typeof rawBody !== 'string') {
    rawBody = JSON.stringify(rawBody);
  }
  return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}

export function constantTimeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyWebhookSignature({ rawBody, signatureHeader, secret }) {
  if (!signatureHeader || !secret) {
    return { valid: false, error: 'MISSING_SIGNATURE_OR_SECRET' };
  }

  // Support "sha256=<hex>" format or raw hex
  const cleanHeader = signatureHeader.startsWith('sha256=')
    ? signatureHeader.slice(7)
    : signatureHeader;

  const expectedSignature = computeHmacSha256(rawBody, secret);
  const isValid = constantTimeCompare(cleanHeader, expectedSignature);

  if (!isValid) {
    return { valid: false, error: 'INVALID_SIGNATURE' };
  }
  return { valid: true };
}

export function verifyWebhookFreshness(timestampMs, nowMs = Date.now()) {
  const ts = Number(timestampMs);
  if (isNaN(ts) || ts <= 0) {
    return { fresh: false, error: 'INVALID_TIMESTAMP' };
  }

  const age = Math.abs(nowMs - ts);
  if (age > REPLAY_TOLERANCE_MS) {
    return {
      fresh: false,
      error: 'EXPIRED_TIMESTAMP',
      ageSeconds: Math.round(age / 1000),
      maxToleranceSeconds: REPLAY_TOLERANCE_MS / 1000
    };
  }
  return { fresh: true, ageSeconds: Math.round(age / 1000) };
}

export function isEventDuplicate(eventId, ttlMs = 600000) {
  if (!eventId) return false;
  const now = Date.now();
  
  // Clean expired entries
  for (const [id, expiry] of DEDUPLICATION_CACHE.entries()) {
    if (now > expiry) {
      DEDUPLICATION_CACHE.delete(id);
    }
  }

  if (DEDUPLICATION_CACHE.has(eventId)) {
    return true;
  }

  DEDUPLICATION_CACHE.set(eventId, now + ttlMs);
  return false;
}

export function resetDeduplicationCache() {
  DEDUPLICATION_CACHE.clear();
}

export function processSecureWebhook({
  rawBody,
  signatureHeader,
  timestampHeader,
  eventId,
  secret,
  nowMs = Date.now()
}) {
  // 1. Freshness check
  const freshness = verifyWebhookFreshness(timestampHeader, nowMs);
  if (!freshness.fresh) {
    return {
      status: 'REJECTED',
      code: 401,
      reason: freshness.error,
      details: freshness
    };
  }

  // 2. Cryptographic signature check
  const sigCheck = verifyWebhookSignature({ rawBody, signatureHeader, secret });
  if (!sigCheck.valid) {
    return {
      status: 'REJECTED',
      code: 401,
      reason: sigCheck.error
    };
  }

  // 3. Replay / Event deduplication check
  if (eventId && isEventDuplicate(eventId)) {
    return {
      status: 'DUPLICATE_IGNORED',
      code: 200,
      reason: 'EVENT_ALREADY_PROCESSED',
      eventId
    };
  }

  return {
    status: 'ACCEPTED',
    code: 200,
    eventId
  };
}

/**
 * Express / Node.js HTTP Server Ingress Middleware for Webhook HMAC & Replay Enforcement.
 * Terminate unverified requests before reaching business logic.
 */
export function createWebhookVerificationMiddleware({ secret, getRawBody = (req) => req.rawBody || req.body } = {}) {
  return function webhookVerificationMiddleware(req, res, next) {
    const configuredSecret = secret || (typeof process !== 'undefined' ? process.env.WEBHOOK_SECRET : null);
    if (!configuredSecret) {
      if (res && res.status) {
        return res.status(500).json({ error: 'CONFIG_ERROR', message: 'WEBHOOK_SECRET not configured on server' });
      }
      return { status: 'ERROR', code: 500, reason: 'MISSING_SECRET' };
    }

    const headers = req.headers || {};
    const signatureHeader = headers['x-hub-signature-256'] || headers['x-signature-256'] || headers['x-aurevia-signature'];
    const timestampHeader = headers['x-timestamp'] || headers['x-request-timestamp'];
    const eventId = headers['x-event-id'] || headers['x-delivery-id'] || (req.body && req.body.event_id);
    const rawBody = getRawBody(req);

    const result = processSecureWebhook({
      rawBody: typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody || {}),
      signatureHeader,
      timestampHeader,
      eventId,
      secret: configuredSecret
    });

    if (result.status === 'REJECTED') {
      if (res && res.status) {
        return res.status(result.code).json({
          error: 'WEBHOOK_UNAUTHORIZED',
          reason: result.reason,
          details: result.details
        });
      }
      return result;
    }

    if (result.status === 'DUPLICATE_IGNORED') {
      if (res && res.status) {
        return res.status(200).json({
          status: 'DUPLICATE_IGNORED',
          message: 'Event was already processed within replay tolerance window.',
          eventId: result.eventId
        });
      }
      return result;
    }

    req.webhookContext = {
      verified: true,
      eventId: result.eventId
    };

    if (typeof next === 'function') {
      return next();
    }
    return result;
  };
}

/**
 * Mock ingress handler for integration tests and synthetic simulation harnesses.
 */
export function handleMockWebhookIngress(requestLike, { secret }) {
  const middleware = createWebhookVerificationMiddleware({ secret });
  let responseData = null;
  const mockRes = {
    status: (code) => ({
      json: (data) => {
        responseData = { statusCode: code, body: data };
        return responseData;
      }
    })
  };

  let nextCalled = false;
  middleware(requestLike, mockRes, () => {
    nextCalled = true;
  });

  if (nextCalled) {
    return { status: 'ACCEPTED', code: 200, context: requestLike.webhookContext };
  }
  return responseData;
}

/**
 * Concrete n8n Code Node (JavaScript) Implementation
 * Copy and paste this directly into an n8n Code node placed immediately after the Webhook node.
 */
export const N8N_WEBHOOK_VERIFICATION_CODE_NODE = `
// ============================================================================
// n8n Code Node: Server-Side Webhook HMAC & Replay Enforcement
// Location: Place immediately after the Inbound Webhook trigger node
// ============================================================================
const crypto = require('crypto');

const secret = $env.WEBHOOK_SECRET;
if (!secret) {
  throw new Error('WEBHOOK_SECRET environment variable is not configured in n8n');
}

const headers = $input.item.json.headers || {};
const rawBody = $input.item.json.rawBody || JSON.stringify($input.item.json.body || {});
const signatureHeader = headers['x-hub-signature-256'] || headers['x-signature-256'] || '';
const timestampHeader = Number(headers['x-timestamp'] || 0);

// 1. Freshness Check (300s / 5-minute tolerance window)
const ageMs = Math.abs(Date.now() - timestampHeader);
if (ageMs > 300000) {
  return [{ json: { error: 'EXPIRED_TIMESTAMP', status: 401 } }];
}

// 2. Cryptographic Constant-Time HMAC Signature Check
const cleanSignature = signatureHeader.startsWith('sha256=') ? signatureHeader.slice(7) : signatureHeader;
const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

const bufA = Buffer.from(cleanSignature, 'utf8');
const bufB = Buffer.from(expectedSignature, 'utf8');
if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
  return [{ json: { error: 'INVALID_SIGNATURE', status: 401 } }];
}

return [{ json: { verified: true, payload: $input.item.json.body } }];
`.trim();


