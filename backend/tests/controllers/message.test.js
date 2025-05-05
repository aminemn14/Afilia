import { beforeAll, describe, it, expect, vi, beforeEach } from 'vitest';
import httpMocks from 'node-mocks-http';
import crypto from 'crypto';

// ─── 0) Mock dotenv AVANT import du controller ──────────────────────────────
vi.mock('dotenv', () => ({ config: vi.fn() }));

// ─── 1) Injecter MESSAGE_SECRET AVANT require du controller ─────────────────
beforeAll(() => {
  process.env.MESSAGE_SECRET = crypto.randomBytes(32).toString('hex');
  vi.spyOn(crypto, 'randomBytes').mockReturnValue(Buffer.alloc(16, 0));
});

// ─── 2) IMPORT du controller APRÈS les mocks ────────────────────────────────
const {
  getAllMessages,
  getMessageById,
  createMessage,
  updateMessage,
  deleteMessage,
  getMessagesForConversation,
} = require('../../controllers/messageController');
const Message = require('../../models/Message');

describe('messageController', () => {
  let req, res, ioMock, roomMock;

  beforeEach(() => {
    // Recréer req/res
    req = httpMocks.createRequest({
      params: {},
      body: {},
      app: { get: vi.fn() },
    });
    res = httpMocks.createResponse({
      eventEmitter: require('events').EventEmitter,
    });

    // Réinitialiser tous les mocks Mongoose
    Message.find = vi.fn();
    Message.findById = vi.fn();
    Message.findByIdAndUpdate = vi.fn();
    Message.findByIdAndDelete = vi.fn();

    // ─── 2) Préparer un socket.io factice ────────────────────────────────────
    roomMock = { emit: vi.fn() };
    ioMock = {
      to: vi.fn().mockReturnValue(roomMock),
    };
    req.app.get.mockReturnValue(ioMock);
  });

  // --- getAllMessages ---
  describe('getAllMessages', () => {
    it('200 et renvoie la liste', async () => {
      const list = [{ content: 'a' }, { content: 'b' }];
      Message.find.mockResolvedValueOnce(list);

      await getAllMessages(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual(list);
    });

    it('500 si erreur', async () => {
      Message.find.mockRejectedValueOnce(new Error('fail'));

      await getAllMessages(req, res);

      expect(res.statusCode).toBe(500);
      expect(res._getJSONData()).toEqual({ error: 'fail' });
    });
  });

  // --- getMessageById ---
  describe('getMessageById', () => {
    it('404 si introuvable', async () => {
      req.params.id = 'x';
      Message.findById.mockResolvedValueOnce(null);

      await getMessageById(req, res);

      expect(res.statusCode).toBe(404);
      expect(res._getJSONData()).toEqual({ error: 'Message non trouvé' });
    });

    it('500 si erreur', async () => {
      req.params.id = 'x';
      Message.findById.mockRejectedValueOnce(new Error('oops'));

      await getMessageById(req, res);

      expect(res.statusCode).toBe(500);
      expect(res._getJSONData()).toEqual({ error: 'oops' });
    });
  });

  // --- createMessage ---
  describe('createMessage', () => {
    it('500 si erreur', async () => {
      vi.spyOn(Message.prototype, 'save').mockRejectedValueOnce(
        new Error('err')
      );

      await createMessage(req, res);

      expect(res.statusCode).toBe(500);
      expect(res._getJSONData()).toEqual({ error: 'err' });
    });
  });

  // --- updateMessage ---
  describe('updateMessage', () => {
    it('200 et renvoie l’objet mis à jour', async () => {
      const upd = { _id: '1', content: 'c' };
      req.params.id = '1';
      req.body = { content: 'c2' };
      Message.findByIdAndUpdate.mockResolvedValueOnce(upd);

      await updateMessage(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual(upd);
    });

    it('404 si introuvable', async () => {
      req.params.id = '1';
      Message.findByIdAndUpdate.mockResolvedValueOnce(null);

      await updateMessage(req, res);

      expect(res.statusCode).toBe(404);
      expect(res._getJSONData()).toEqual({ error: 'Message non trouvé' });
    });

    it('500 si erreur', async () => {
      req.params.id = '1';
      Message.findByIdAndUpdate.mockRejectedValueOnce(new Error('err'));

      await updateMessage(req, res);

      expect(res.statusCode).toBe(500);
      expect(res._getJSONData()).toEqual({ error: 'err' });
    });
  });

  // --- deleteMessage ---
  describe('deleteMessage', () => {
    it('200 et message de suppression', async () => {
      req.params.id = '1';
      Message.findByIdAndDelete.mockResolvedValueOnce({ _id: '1' });

      await deleteMessage(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual({ message: 'Message supprimé' });
    });

    it('404 si introuvable', async () => {
      req.params.id = '1';
      Message.findByIdAndDelete.mockResolvedValueOnce(null);

      await deleteMessage(req, res);

      expect(res.statusCode).toBe(404);
      expect(res._getJSONData()).toEqual({ error: 'Message non trouvé' });
    });

    it('500 si erreur', async () => {
      req.params.id = '1';
      Message.findByIdAndDelete.mockRejectedValueOnce(new Error('err'));

      await deleteMessage(req, res);

      expect(res.statusCode).toBe(500);
      expect(res._getJSONData()).toEqual({ error: 'err' });
    });
  });

  // --- getMessagesForConversation ---
  describe('getMessagesForConversation', () => {
    it('500 si erreur', async () => {
      req.params.conversationId = 'conv1';
      // Même mockReturnValue sur find, mais sort rejette
      Message.find.mockReturnValueOnce({
        sort: () => Promise.reject(new Error('boom')),
      });

      await getMessagesForConversation(req, res);

      expect(res.statusCode).toBe(500);
      expect(res._getJSONData()).toEqual({ error: 'boom' });
    });
  });
});
