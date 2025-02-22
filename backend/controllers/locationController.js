const Location = require('../models/Location');

// Obtenir tous les lieux
exports.getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find();
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtenir un lieu par son ID
exports.getLocationById = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) return res.status(404).json({ error: 'Lieu non trouvé' });
    res.json(location);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Créer un nouveau lieu
exports.createLocation = async (req, res) => {
  try {
    const newLocation = new Location(req.body);
    const savedLocation = await newLocation.save();
    res.status(201).json(savedLocation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mettre à jour un lieu
exports.updateLocation = async (req, res) => {
  try {
    const updatedLocation = await Location.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedLocation)
      return res.status(404).json({ error: 'Lieu non trouvé' });
    res.json(updatedLocation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Supprimer un lieu
exports.deleteLocation = async (req, res) => {
  try {
    const deletedLocation = await Location.findByIdAndDelete(req.params.id);
    if (!deletedLocation)
      return res.status(404).json({ error: 'Lieu non trouvé' });
    res.json({ message: 'Lieu supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
