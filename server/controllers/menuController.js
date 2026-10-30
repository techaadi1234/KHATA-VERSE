import MenuItem from '../models/MenuItem.js';

// @desc    Get all menu items (Students and Vendors)
// @route   GET /api/menu
// @access  Private
export const getMenuItems = async (req, res, next) => {
  try {
    const items = await MenuItem.find({}).sort({ category: 1, itemName: 1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new item to Canteen Menu (Vendor Only)
// @route   POST /api/menu
// @access  Private/Vendor
export const addMenuItem = async (req, res, next) => {
  try {
    const { name, itemName, price, category, canteenShift } = req.body;
    const resolvedName = (itemName || name || '').trim();

    if (!resolvedName) {
      return res.status(400).json({ message: 'Item name is required' });
    }

    if (price === undefined || price === null || Number(price) < 0) {
      return res.status(400).json({ message: 'A valid price is required' });
    }

    const item = await MenuItem.create({
      itemName: resolvedName,
      price: Number(price),
      category: category || 'Snacks',
      canteenShift: canteenShift || 'night',
      isAvailable: true,
    });

    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle item availability (Bhaiya turns egg omelet ON/OFF)
// @route   PATCH /api/menu/:id/toggle
// @access  Private/Vendor
export const toggleItemAvailability = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    item.isAvailable = !item.isAvailable;
    await item.save();

    res.json({
      message: `Item status updated to ${item.isAvailable ? 'Available' : 'Unavailable'}`,
      item,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update menu item (Vendor Only)
// @route   PUT /api/menu/:id
// @access  Private/Vendor
export const updateMenuItem = async (req, res, next) => {
  try {
    const { name, itemName, price, category } = req.body;

    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found.' });
    }

    const resolvedName = (itemName || name || '').trim();
    if (resolvedName) item.itemName = resolvedName;
    if (price !== undefined) item.price = Number(price);
    if (category) item.category = category;

    const updatedItem = await item.save();
    return res.json(updatedItem);
  } catch (error) {
    return next(error);
  }
};

// @desc    Delete menu item (Vendor Only)
// @route   DELETE /api/menu/:id
// @access  Private/Vendor
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
