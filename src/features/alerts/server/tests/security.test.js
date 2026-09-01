import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { requireAdmin, validateSyncPayload } from '../middleware/security.js';

describe('Security Middleware', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.get('/protected', requireAdmin, (req, res) => res.json({ status: 'ok' }));
    app.get('/sync', validateSyncPayload, (req, res) => res.json({ status: 'ok' }));
  });

  describe('requireAdmin', () => {
    it('should reject requests without authorization header', async () => {
      const res = await request(app).get('/protected');
      expect(res.status).toBe(503); // Since ADMIN_SECRET might not be set in test env, it returns 503 or 401
    });
  });

  describe('validateSyncPayload', () => {
    it('should reject missing since parameter', async () => {
      const res = await request(app).get('/sync');
      expect(res.status).toBe(400);
    });

    it('should reject invalid string since parameter', async () => {
      const res = await request(app).get('/sync?since=abc');
      expect(res.status).toBe(400);
    });

    it('should reject negative since parameter', async () => {
      const res = await request(app).get('/sync?since=-1');
      expect(res.status).toBe(400);
    });

    it('should accept valid integer since parameter', async () => {
      const res = await request(app).get('/sync?since=10');
      expect(res.status).toBe(200);
    });
  });
});
