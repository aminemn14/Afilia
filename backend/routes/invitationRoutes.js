const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitationController');

// Créer une invitation
router.post('/', invitationController.createInvitation);

// Récupérer les invitations reçues par un utilisateur (via /api/invitations/:userId)
router.get('/:userId', invitationController.getInvitationsByReceiver);

// Récupérer les invitations avec query parameters
router.get('/', invitationController.getInvitations);

// Mettre à jour une invitation (pour accepter ou refuser)
router.put('/:invitationId', invitationController.updateInvitation);

// Supprimer une invitation
router.delete('/:invitationId', invitationController.deleteInvitation);

module.exports = router;
