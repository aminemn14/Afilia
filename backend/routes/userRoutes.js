const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.post('/login', userController.loginUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.post('/:id/block/:targetId', userController.blockUser);
router.post('/:id/unblock/:targetId', userController.unblockUser);
router.get('/blockedBy/:id', userController.getUsersWhoBlocked);

module.exports = router;
