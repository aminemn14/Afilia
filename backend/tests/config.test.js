import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRequire } from 'module';

const requireCJS = createRequire(import.meta.url);

describe('connectDB', () => {
  let connectDB;
  let mongoose;
  let exitSpy;

  beforeEach(() => {
    // 1) Reset du cache pour que requireCJS('../config/db.js') relise le code
    vi.resetModules();

    // 2) Pose l'env
    process.env.MONGO_URI = 'mongodb://localhost:27017/testdb';

    // 3) Stub de process.exit pour qu'il jette (pour pouvoir tester le reject)
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`EXIT:${code}`);
    });

    // 4) Require mongoose et override connect AVANT de charger connectDB
    mongoose = requireCJS('mongoose');
    mongoose.connect = vi.fn();

    // 5) Maintenant qu'on a injecté mongoose.connect factice, on charge le module
    connectDB = requireCJS('../config/db.js');
  });

  afterEach(() => {
    exitSpy.mockRestore();
    delete process.env.MONGO_URI;
  });

  it('doit appeler mongoose.connect avec la bonne URI et options', async () => {
    mongoose.connect.mockResolvedValueOnce();
    await connectDB();
    expect(mongoose.connect).toHaveBeenCalledTimes(1);
    expect(mongoose.connect).toHaveBeenCalledWith(
      'mongodb://localhost:27017/testdb',
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
  });

  it('doit logger "MongoDB connected" en cas de succès', async () => {
    mongoose.connect.mockResolvedValueOnce();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await connectDB();
    expect(logSpy).toHaveBeenCalledWith('MongoDB connected');
    logSpy.mockRestore();
  });

  it('doit exit(1) en cas d’erreur de connexion', async () => {
    mongoose.connect.mockRejectedValueOnce(new Error('fail'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(connectDB()).rejects.toThrow('EXIT:1');
    expect(errorSpy).toHaveBeenCalledWith(
      'Erreur de connexion à MongoDB : ',
      'fail'
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
    errorSpy.mockRestore();
  });
});
