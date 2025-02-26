const Invitation = require('../models/Invitation');

// Créer une invitation (évite les doublons)
exports.createInvitation = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    if (!senderId || !receiverId) {
      return res
        .status(400)
        .json({ error: 'senderId et receiverId sont requis.' });
    }

    // Vérifier si une invitation pending existe déjà
    const existingInvitation = await Invitation.findOne({
      senderId,
      receiverId,
      status: 'pending',
    });
    if (existingInvitation) {
      // Mettre à jour le timestamp et renvoyer l'invitation existante
      existingInvitation.createdAt = Date.now();
      const updatedInvitation = await existingInvitation.save();
      // Émettre un événement vers le receiver pour actualiser son interface
      const io = req.app.get('socketio');
      io.to(receiverId).emit('invitationUpdated', updatedInvitation);
      return res.status(200).json(updatedInvitation);
    }

    const newInvitation = new Invitation({ senderId, receiverId });
    const savedInvitation = await newInvitation.save();
    // Émettre un événement vers le receiver
    const io = req.app.get('socketio');
    io.to(receiverId).emit('invitationReceived', savedInvitation);
    res.status(201).json(savedInvitation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Récupérer les invitations reçues par un utilisateur (uniquement pending)
exports.getInvitationsByReceiver = async (req, res) => {
  try {
    const { userId } = req.params;
    const invitations = await Invitation.find({
      receiverId: userId,
      status: 'pending',
    }).populate('senderId', '-password');
    res.json(invitations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mettre à jour une invitation (par exemple pour accepter ou refuser)
exports.updateInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const updateData = req.body;
    const updatedInvitation = await Invitation.findByIdAndUpdate(
      invitationId,
      updateData,
      { new: true }
    );
    if (!updatedInvitation) {
      return res.status(404).json({ error: 'Invitation non trouvée.' });
    }
    // Émettre un événement pour actualiser l'interface du sender
    const io = req.app.get('socketio');
    io.to(updatedInvitation.senderId.toString()).emit(
      'invitationUpdated',
      updatedInvitation
    );
    res.json(updatedInvitation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Supprimer une invitation
exports.deleteInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const deletedInvitation = await Invitation.findByIdAndDelete(invitationId);
    if (!deletedInvitation) {
      return res.status(404).json({ error: 'Invitation non trouvée.' });
    }
    // Émettre un événement indiquant la suppression
    const io = req.app.get('socketio');
    io.to(deletedInvitation.senderId.toString()).emit(
      'invitationDeleted',
      deletedInvitation
    );
    res.json({ message: 'Invitation supprimée.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Récupérer les invitations en fonction des query parameters (si besoin)
exports.getInvitations = async (req, res) => {
  try {
    const { senderId, receiverId, status } = req.query;
    const query = {};
    if (senderId) query.senderId = senderId;
    if (receiverId) query.receiverId = receiverId;
    if (status) query.status = status;

    const invitations = await Invitation.find(query).populate(
      'senderId',
      '-password'
    );
    res.json(invitations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
