import MenuItem from '../models/MenuItem.js';

// @desc    Get all menu items (Students and Vendors)
// @route   GET /api/menu
// @access  Private
export const getMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find({}).sort({ category: 1, itemName: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a new item to Canteen Menu (Vendor Only)
// @route   POST /api/menu
// @access  Private/Vendor
export const addMenuItem = async (req, res) => {
  try {
    const { itemName, price, category, canteenShift } = req.body;

    const item = await MenuItem.create({
      itemName,
      price,
      category: category || 'Snacks',
      canteenShift: canteenShift || 'night',
      isAvailable: true,
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle item availability (Bhaiya turns egg omelet ON/OFF)
// @route   PATCH /api/menu/:id/toggle
// @access  Private/Vendor
export const toggleItemAvailability = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Toggle boolean value
    item.isAvailable = !item.isAvailable;
    await item.save();

    res.json({
      message: `Item status updated to ${item.isAvailable ? 'Available' : 'Unavailable'}`,
      item,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const updateMenuItem = async (req, res, next) => {
  try {
    const { name, price, category } = req.body;

    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found.' });
    }

    item.name = name || item.name;
    item.price = price !== undefined ? Number(price) : item.price;
    item.category = category || item.category;

    const updatedItem = await item.save();
    return res.json(updatedItem);
  } catch (error) {
    return next(error);
  }
};
export const deleteMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found.' });
    }

    await item.deleteOne();
    return res.json({ message: 'Menu item removed successfully.' });
  } catch (error) {
    return next(error);
  }
};