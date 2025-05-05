import { describe, it, expect, vi, beforeEach } from 'vitest';
import httpMocks from 'node-mocks-http';

// 1) Import du controller et de ses dépendances
const {
  loginUser,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  blockUser,
  unblockUser,
  getUsersWhoBlocked,
} = require('../../controllers/userController');
const User = require('../../models/User');
const Friend = require('../../models/Friend');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('userController', () => {
  let req, res;

  beforeEach(() => {
    // Création de req/res factices
    req = httpMocks.createRequest({
      params: {},
      body: {},
      app: { get: vi.fn() },
    });
    res = httpMocks.createResponse({
      eventEmitter: require('events').EventEmitter,
    });
    // Réinitialisation et mock des méthodes
    vi.clearAllMocks();
    User.findOne = vi.fn();
    User.find = vi.fn();
    User.findById = vi.fn();
    User.findByIdAndUpdate = vi.fn();
    User.findByIdAndDelete = vi.fn();
    Friend.deleteOne = vi.fn();
    bcrypt.compare = vi.fn();
    bcrypt.hash = vi.fn();
    jwt.sign = vi.fn();
  });

  // -------- loginUser --------
  describe('loginUser', () => {
    it('400 si email ou mot de passe manquant', async () => {
      req.body = { email: '' };
      await loginUser(req, res);
      expect(res.statusCode).toBe(400);
      expect(res._getJSONData()).toEqual({
        error: 'Email et mot de passe sont requis',
      });
    });

    it('401 si user non trouvé', async () => {
      req.body = { email: 'a@b.com', password: 'pwd' };
      User.findOne.mockResolvedValueOnce(null);
      await loginUser(req, res);
      expect(res.statusCode).toBe(401);
      expect(res._getJSONData()).toEqual({
        error: 'Identifiants invalides',
      });
    });

    it('401 si mot de passe incorrect', async () => {
      const fakeUser = { _id: '1', password: 'hashed' };
      req.body = { email: 'a@b.com', password: 'pwd' };
      User.findOne.mockResolvedValueOnce(fakeUser);
      bcrypt.compare.mockResolvedValueOnce(false);
      await loginUser(req, res);
      expect(res.statusCode).toBe(401);
      expect(res._getJSONData()).toEqual({
        error: 'Identifiants invalides',
      });
    });

    it('200 et renvoie token+user si succès', async () => {
      const fakeUser = { _id: '1', password: 'hashed', username: 'Joe' };
      req.body = { email: 'a@b.com', password: 'pwd' };
      User.findOne.mockResolvedValueOnce(fakeUser);
      bcrypt.compare.mockResolvedValueOnce(true);
      jwt.sign.mockReturnValueOnce('jwt-token');

      await loginUser(req, res);
      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual({
        token: 'jwt-token',
        user: fakeUser,
      });
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: fakeUser._id },
        expect.any(String),
        { expiresIn: '1h' }
      );
    });
  });

  // -------- getAllUsers --------
  describe('getAllUsers', () => {
    it('200 et liste des users', async () => {
      const users = [{ name: 'A' }, { name: 'B' }];
      User.find.mockResolvedValueOnce(users);
      await getAllUsers(req, res);
      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual(users);
    });

    it('500 si erreur', async () => {
      User.find.mockRejectedValueOnce(new Error('fail'));
      await getAllUsers(req, res);
      expect(res.statusCode).toBe(500);
      expect(res._getJSONData()).toEqual({ error: 'fail' });
    });
  });

  // -------- getUserById --------
  describe('getUserById', () => {
    it('200 et user existant', async () => {
      const user = { _id: 'u1' };
      req.params.id = 'u1';
      User.findById.mockResolvedValueOnce(user);
      await getUserById(req, res);
      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual(user);
    });

    it('404 si pas trouvé', async () => {
      req.params.id = 'x';
      User.findById.mockResolvedValueOnce(null);
      await getUserById(req, res);
      expect(res.statusCode).toBe(404);
      expect(res._getJSONData()).toEqual({
        error: 'Utilisateur non trouvé',
      });
    });

    it('500 si erreur', async () => {
      req.params.id = 'x';
      User.findById.mockRejectedValueOnce(new Error('fail'));
      await getUserById(req, res);
      expect(res.statusCode).toBe(500);
      expect(res._getJSONData()).toEqual({ error: 'fail' });
    });
  });

  // -------- createUser --------
  describe('createUser', () => {
    it('400 si champs manquants', async () => {
      req.body = { username: 'u' }; // incomplet
      await createUser(req, res);
      expect(res.statusCode).toBe(400);
      expect(res._getJSONData()).toEqual({
        error: 'Tous les champs sont requis',
      });
    });

    it('201 et renvoie le user créé', async () => {
      const body = {
        username: 'u',
        email: 'e',
        password: 'pwd',
        firstname: 'f',
        lastname: 'l',
        phoneNumber: 'p',
      };
      req.body = body;
      bcrypt.hash.mockResolvedValueOnce('hashed');

      // on simule l’instance sauvée
      const savedUser = { ...body, password: 'hashed', role: 'user', _id: '1' };
      vi.spyOn(
        require('../../models/User').prototype,
        'save'
      ).mockResolvedValueOnce(savedUser);

      await createUser(req, res);
      expect(res.statusCode).toBe(201);
      expect(res._getJSONData()).toEqual(savedUser);
    });

    it('500 si erreur', async () => {
      req.body = {
        username: 'u',
        email: 'e',
        password: 'pwd',
        firstname: 'f',
        lastname: 'l',
        phoneNumber: 'p',
      };
      bcrypt.hash.mockRejectedValueOnce(new Error('err'));
      await createUser(req, res);
      expect(res.statusCode).toBe(500);
      expect(res._getJSONData()).toEqual({ error: 'err' });
    });
  });

  // -------- updateUser --------
  describe('updateUser', () => {
    it('200 et renvoie user mis à jour', async () => {
      const updated = { _id: '1', name: 'X' };
      req.params.id = '1';
      req.body = { name: 'X' };
      User.findByIdAndUpdate.mockResolvedValueOnce(updated);
      await updateUser(req, res);
      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual(updated);
    });

    it('404 si pas trouvé', async () => {
      req.params.id = '1';
      User.findByIdAndUpdate.mockResolvedValueOnce(null);
      await updateUser(req, res);
      expect(res.statusCode).toBe(404);
      expect(res._getJSONData()).toEqual({
        error: 'Utilisateur non trouvé',
      });
    });

    it('500 si erreur', async () => {
      req.params.id = '1';
      User.findByIdAndUpdate.mockRejectedValueOnce(new Error('err'));
      await updateUser(req, res);
      expect(res.statusCode).toBe(500);
      expect(res._getJSONData()).toEqual({ error: 'err' });
    });
  });

  // -------- deleteUser --------
  describe('deleteUser', () => {
    it('200 et message de suppression', async () => {
      req.params.id = '1';
      User.findByIdAndDelete.mockResolvedValueOnce({ _id: '1' });
      await deleteUser(req, res);
      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual({
        message: 'Utilisateur supprimé',
      });
    });

    it('404 si pas trouvé', async () => {
      req.params.id = '1';
      User.findByIdAndDelete.mockResolvedValueOnce(null);
      await deleteUser(req, res);
      expect(res.statusCode).toBe(404);
      expect(res._getJSONData()).toEqual({
        error: 'Utilisateur non trouvé',
      });
    });

    it('500 si erreur', async () => {
      req.params.id = '1';
      User.findByIdAndDelete.mockRejectedValueOnce(new Error('err'));
      await deleteUser(req, res);
      expect(res.statusCode).toBe(500);
      expect(res._getJSONData()).toEqual({ error: 'err' });
    });
  });

  // -------- blockUser --------
  describe('blockUser', () => {
    const ioMock = { to: () => ({ emit: vi.fn() }) };
    beforeEach(() => {
      req.app.get.mockReturnValue(ioMock);
    });

    it('400 si self-block', async () => {
      req.params = { id: '1', targetId: '1' };
      await blockUser(req, res);
      expect(res.statusCode).toBe(400);
      expect(res._getJSONData()).toEqual({
        error: 'Vous ne pouvez pas vous bloquer vous-même',
      });
    });

    it('200 et bloque + notifications', async () => {
      req.params = { id: '1', targetId: '2' };
      // On stub bien .mockResolvedValueOnce
      Friend.deleteOne.mockResolvedValueOnce({});
      // On renvoie un “Query” factice : obj.populate() -> Promise<updated>
      const updated = { blockedUsers: ['2'] };
      User.findByIdAndUpdate.mockReturnValueOnce({
        populate: () => Promise.resolve(updated),
      });

      await blockUser(req, res);

      // Les deux suppressions d’amis
      expect(Friend.deleteOne).toHaveBeenCalledTimes(2);
      // Statut OK
      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data.message).toContain('bloqué');
      expect(data.blockedUsers).toEqual(updated.blockedUsers);
    });

    it('404 si user introuvable', async () => {
      req.params = { id: '1', targetId: '2' };
      Friend.deleteOne.mockResolvedValueOnce({});
      // Query.populate() -> Promise<null>
      User.findByIdAndUpdate.mockReturnValueOnce({
        populate: () => Promise.resolve(null),
      });

      await blockUser(req, res);
      expect(res.statusCode).toBe(404);
      expect(res._getJSONData()).toEqual({
        error: 'Utilisateur non trouvé',
      });
    });

    it('500 si erreur', async () => {
      req.params = { id: '1', targetId: '2' };
      Friend.deleteOne.mockResolvedValueOnce({});
      // Simule Query.populate() qui rejette
      User.findByIdAndUpdate.mockReturnValueOnce({
        populate: () => Promise.reject(new Error('err')),
      });

      await blockUser(req, res);
      expect(res.statusCode).toBe(500);
      expect(res._getJSONData()).toEqual({ error: 'err' });
    });
  });

  // -------- unblockUser --------
  describe('unblockUser', () => {
    const ioMock = { to: () => ({ emit: vi.fn() }) };
    beforeEach(() => {
      req.app.get.mockReturnValue(ioMock);
    });

    it('200 et débloque + notification', async () => {
      req.params = { id: '1', targetId: '2' };
      const updated = { blockedUsers: [] };
      User.findByIdAndUpdate.mockReturnValueOnce({
        populate: () => Promise.resolve(updated),
      });

      await unblockUser(req, res);
      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data.message).toContain('débloqué');
      expect(data.blockedUsers).toEqual(updated.blockedUsers);
    });

    it('404 si user introuvable', async () => {
      req.params = { id: '1', targetId: '2' };
      User.findByIdAndUpdate.mockReturnValueOnce({
        populate: () => Promise.resolve(null),
      });

      await unblockUser(req, res);
      expect(res.statusCode).toBe(404);
      expect(res._getJSONData()).toEqual({
        error: 'Utilisateur non trouvé',
      });
    });

    it('500 si erreur', async () => {
      req.params = { id: '1', targetId: '2' };
      User.findByIdAndUpdate.mockReturnValueOnce({
        populate: () => Promise.reject(new Error('err')),
      });

      await unblockUser(req, res);
      expect(res.statusCode).toBe(500);
      expect(res._getJSONData()).toEqual({ error: 'err' });
    });
  });

  // -------- getUsersWhoBlocked --------
  describe('getUsersWhoBlocked', () => {
    it('200 et renvoie IDs', async () => {
      req.params.id = '2';
      const blockers = [{ _id: 'a' }, { _id: 'b' }];
      User.find.mockResolvedValueOnce(blockers);
      await getUsersWhoBlocked(req, res);
      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual(['a', 'b']);
    });

    it('500 si erreur', async () => {
      req.params.id = '2';
      User.find.mockRejectedValueOnce(new Error('err'));
      await getUsersWhoBlocked(req, res);
      expect(res.statusCode).toBe(500);
      expect(res._getJSONData()).toEqual({ error: 'err' });
    });
  });
});
