const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitationController');

// Créer une invitation
router.post('/', invitationController.createInvitation);

// Récupérer les invitations reçues par un utilisateur (via /api/invitations/:userId)
router.get('/:userId', invitationController.getInvitationsByReceiver);

// Nouvelle route pour récupérer les invitations avec query parameters (si besoin)
router.get('/', invitationController.getInvitations);

// Mettre à jour une invitation (pour accepter ou refuser)
router.put('/:invitationId', invitationController.updateInvitation);

// Supprimer une invitation
router.delete('/:invitationId', invitationController.deleteInvitation);

module.exports = router;
