// controllers/conversationController.js
const Friend = require('../models/Friend');
const Message = require('../models/Message');

exports.getConversations = async (req, res) => {
  try {
    const { userId } = req.params;
    // Récupérer la liste des amis pour l'utilisateur
    const friends = await Friend.find({ userId }).populate(
      'friendId',
      '-password'
    );

    // Pour chaque ami, générer un id de conversation et récupérer le dernier message
    const conversations = await Promise.all(
      friends.map(async (friendItem) => {
        const friendUser = friendItem.friendId;
        // Générer un conversation_id en triant les deux IDs
        const conversationId = [userId, friendUser._id.toString()]
          .sort()
          .join('_');
        // Récupérer le dernier message (tri décroissant par created_at)
        const lastMessageDoc = await Message.findOne({
          conversation_id: conversationId,
        }).sort({ created_at: -1 });
        return {
          id: conversationId,
          friend: {
            id: friendUser._id,
            name: `${friendUser.firstname} ${friendUser.lastname}`,
            avatar: friendUser.avatar,
          },
          lastMessage: lastMessageDoc
            ? lastMessageDoc.content
            : 'Démarrer une conversation!',
          updatedAt: lastMessageDoc
            ? lastMessageDoc.created_at
            : friendItem.createdAt,
          unread: false,
        };
      })
    );
    res.json(conversations);
  } catch (error) {
    console.error('Erreur dans getConversations:', error);
    res.status(500).json({ error: error.message });
  }
};
