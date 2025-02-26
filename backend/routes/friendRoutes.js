const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');

// Récupérer la liste des amis d'un utilisateur (passer l'id de l'utilisateur en paramètre)
router.get('/:userId', friendController.getFriends);

// Ajouter un ami (body : { userId, friendId })
router.post('/', friendController.addFriend);

// Supprimer un ami (body : { userId, friendId })
router.delete('/', friendController.removeFriend);

module.exports = router;
