// On évite que connectDB appelle process.exit()
import { vi } from 'vitest';
vi.spyOn(process, 'exit').mockImplementation((code) => {
  throw new Error(`process.exit called with ${code}`);
});

// Variables d’env requises par config/db et genericUpload
process.env.MONGO_URI = 'mongodb://localhost:27017/test';
process.env.DO_SPACES_BUCKET = 'dummy-bucket';
process.env.DO_SPACES_ENDPOINT = 'dummy-endpoint';
process.env.DO_ACCESS_KEY = 'dummy-key';
process.env.DO_SECRET_KEY = 'dummy-secret';

import { describe, it, expect, beforeAll, vi } from 'vitest';

// ------------------------------------
// 1. MOCKS à appliquer AVANT l'import
// ------------------------------------
vi.mock('dotenv', () => ({ config: () => null }));

vi.mock('http', () => ({
  createServer: () => ({
    listen: vi.fn(),
    on: vi.fn(),
  }),
}));

vi.mock('socket.io', () => {
  return vi.fn().mockImplementation(() => ({
    on: vi.fn(),
  }));
});

// Mock de la connexion DB pour qu'elle ne se déclenche pas
vi.mock('../backend/config/db', () => vi.fn());

// Mocks pour toutes les routes
vi.mock('../backend/routes/userRoutes', () => 'USER_ROUTE');
vi.mock('../backend/routes/eventRoutes', () => 'EVENT_ROUTE');
vi.mock('../backend/routes/locationRoutes', () => 'LOCATION_ROUTE');
vi.mock('../backend/routes/messageRoutes', () => 'MESSAGE_ROUTE');
vi.mock('../backend/routes/friendRoutes', () => 'FRIEND_ROUTE');
vi.mock('../backend/routes/invitationRoutes', () => 'INVITE_ROUTE');
vi.mock('../backend/routes/conversationRoutes', () => 'CONVO_ROUTE');
vi.mock('../backend/routes/cartRoutes', () => 'CART_ROUTE');
vi.mock('../backend/routes/genericUpload', () => 'UPLOAD_ROUTE');

// On mute les logs pour garder la sortie propre
beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// ------------------------------------
// 2. IMPORT de l'app après les mocks
// ------------------------------------
const { app, encryptMessage, decryptMessage } = await import(
  '../backend/app.js'
);

describe('backend/app.js', () => {
  it('exporte une instance Express utilisable', () => {
    expect(app).toBeDefined();
    expect(typeof app.use).toBe('function');
    expect(typeof app.set).toBe('function');
  });

  describe('helpers de chiffrement', () => {
    const sample = 'Test Vitest 🔒';

    it('encryptMessage génère “iv:ciphertext” en hex', () => {
      const ct = encryptMessage(sample);
      expect(typeof ct).toBe('string');
      // 32 hex (16 bytes iv) + ':' + au moins 1 hex
      expect(ct).toMatch(/^[0-9a-f]{32}:[0-9a-f]+$/);
    });

    it('decryptMessage retrouve le texte initial', () => {
      const ct = encryptMessage(sample);
      const pt = decryptMessage(ct);
      expect(pt).toBe(sample);
    });

    it('decryptMessage lance une erreur sur format invalide', () => {
      expect(() => decryptMessage('format_invalide')).toThrow();
    });
  });

  describe('montage des routes', () => {
    // [préfixe, nom mock]
    const routes = [
      ['/api/users', 'USER_ROUTE'],
      ['/api/events', 'EVENT_ROUTE'],
      ['/api/locations', 'LOCATION_ROUTE'],
      ['/api/messages', 'MESSAGE_ROUTE'],
      ['/api/friends', 'FRIEND_ROUTE'],
      ['/api/invitations', 'INVITE_ROUTE'],
      ['/api/conversations', 'CONVO_ROUTE'],
      ['/api/cart', 'CART_ROUTE'],
      ['/api', 'UPLOAD_ROUTE'],
    ];

    it.each(routes)('montage de la route %s', (prefix) => {
      const layer = app._router.stack.find((l) => l.regexp?.test(prefix));
      expect(layer).toBeDefined();
      // on vérifie juste qu'un middleware est bien monté à ce prefix
      expect(typeof layer.handle).toBe('function');
    });
  });
});
