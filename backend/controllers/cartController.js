const Cart = require('../models/Cart');
const Event = require('../models/Event');
const User = require('../models/User');

// Helpers
async function recalcTotal(cart) {
  cart.total = cart.items.reduce((sum, it) => sum + it.price, 0);
  cart.updatedAt = new Date();
  return cart.save();
}

// Ajouter un évènement au panier
exports.addToCart = async (req, res) => {
  try {
    const { userId, eventId } = req.body;

    // Vérifie que l'évènement existe
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Événement inexistant' });

    // Récupère ou crée le panier
    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = new Cart({ user: userId, items: [] });

    // Empêche les doublons
    if (cart.items.some((it) => it.event.toString() === eventId))
      return res.status(400).json({ error: 'Événement déjà dans le panier' });

    // Ajoute l'article et recalcule le total
    cart.items.push({ event: eventId, price: event.price });
    await recalcTotal(cart);

    // Notifie l'utilisateur via WebSocket
    const populated = await Cart.findOne({ user: userId }).populate(
      'items.event'
    );
    const io = req.app.get('socketio');
    io.to(userId).emit('cartUpdated', { items: populated.items });

    // Retourne le panier
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Récupérer le panier
exports.getCart = async (req, res) => {
  try {
    const userId = req.params.userId;
    const cart = await Cart.findOne({ user: userId }).populate('items.event');
    if (!cart) return res.status(200).json({ items: [], total: 0 });
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Supprimer un article du panier

exports.removeFromCart = async (req, res) => {
  try {
    const { userId, eventId } = req.body;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ error: 'Panier introuvable' });

    cart.items = cart.items.filter((it) => it.event.toString() !== eventId);
    await recalcTotal(cart);
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Checkout : paiement + cashback + maj évènements

exports.checkout = async (req, res) => {
  try {
    const { userId, cashbackUsed = 0 } = req.body;

    // Récupère le panier et populate
    const cart = await Cart.findOne({ user: userId }).populate('items.event');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Votre panier est vide' });
    }

    // Vérifie la dispo des places
    for (const { event } of cart.items) {
      if (event.remaining_participants < 1) {
        return res
          .status(409)
          .json({ error: `Plus de places pour « ${event.name} »` });
      }
    }

    // Mise à jour des événements (places restantes)
    await Promise.all(
      cart.items.map(async ({ event }) => {
        event.current_participants += 1;
        event.remaining_participants -= 1;
        if (event.remaining_participants === 0) event.status = 'full';
        await event.save();
      })
    );

    // 4alcul des montants
    const total = cart.total;
    const used = Math.min(parseFloat(cashbackUsed) || 0, total);
    const paidAmount = +(total - used).toFixed(2);
    const earnedCashback = +(paidAmount * 0.05).toFixed(2);

    // Mise à jour du solde de l'utilisateur
    const user = await User.findById(userId);
    user.cashbackBalance = +(
      user.cashbackBalance -
      used +
      earnedCashback
    ).toFixed(2);
    await user.save();

    // Vidage du panier
    cart.items = [];
    cart.total = 0;
    await cart.save();

    // Notifications WebSocket
    const io = req.app.get('socketio');
    // Panier vidé
    io.to(userId).emit('cartUpdated', { items: [] });
    // Nouveau solde cashback pour le profil
    io.to(userId).emit('cashbackUpdated', {
      userId,
      newCashbackBalance: user.cashbackBalance,
    });
    // Màj évents (places restantes)
    io.emit('eventsChanged');

    // Réponse au client
    res.json({
      message: 'Paiement réussi !',
      total,
      cashbackUsed: used,
      paidAmount,
      cashbackEarned: earnedCashback,
      newCashbackBalance: user.cashbackBalance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
