const Friend = require('../models/Friend');
const Message = require('../models/Message');
const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
require('dotenv').config();

const MESSAGE_SECRET = process.env.MESSAGE_SECRET;

function decryptMessage(text) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = textParts.join(':');
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(MESSAGE_SECRET, 'hex'),
    iv
  );
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

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

        let lastMessage = 'Démarrer une conversation!';
        if (lastMessageDoc && lastMessageDoc.content) {
          // Déchiffrer le contenu du dernier message
          try {
            lastMessage = decryptMessage(lastMessageDoc.content);
          } catch (err) {
            console.error(
              'Erreur lors du déchiffrement du dernier message:',
              err
            );
            lastMessage = 'Message illisible';
          }
        }

        return {
          id: conversationId,
          friend: {
            id: friendUser._id,
            name: `${friendUser.firstname} ${friendUser.lastname}`,
            avatar: friendUser.avatar,
          },
          lastMessage,
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
