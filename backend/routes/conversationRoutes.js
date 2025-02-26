// routes/conversationRoutes.js
const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');

router.get('/:userId', conversationController.getConversations);

module.exports = router;
