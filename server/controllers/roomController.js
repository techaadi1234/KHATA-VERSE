import Room from '../models/Room.js';
import User from '../models/User.js';

// Helper function to generate a random 6-character uppercase Room Code (e.g., "KHT123")
const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// @desc    Create a new room (Student becomes admin)
// @route   POST /api/rooms/create
// @access  Private
export const createRoom = async (req, res) => {
  try {
    const { roomName } = req.body;

    // Check if student is already in a room
    const user = await User.findById(req.user._id);
    if (user.room) {
      return res.status(400).json({ message: 'You are already in a room. Leave it before creating a new one.' });
    }

    const roomCode = generateRoomCode();

    const room = await Room.create({
      roomName,
      roomCode,
      admin: req.user._id,
      members: [req.user._id], // Creator automatically added as member #1
    });

    // Link room ID back to user profile
    user.room = room._id;
    await user.save();

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Join an existing room using Room Code (Max 15 members)
// @route   POST /api/rooms/join
// @access  Private
export const joinRoom = async (req, res) => {
  try {
    const { roomCode } = req.body;

    const user = await User.findById(req.user._id);
    if (user.room) {
      return res.status(400).json({ message: 'You are already in a room.' });
    }

    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) {
      return res.status(404).json({ message: 'Invalid room code.' });
    }

    // Enforce 15 members limit
    if (room.members.length >= 15) {
      return res.status(400).json({ message: 'Room is full! Maximum 15 members allowed.' });
    }

    // Add member to room
    room.members.push(req.user._id);
    await room.save();

    // Link room ID to user profile
    user.room = room._id;
    await user.save();

    const updatedRoom = await Room.findById(room._id).populate('members', 'name email monthlyBudget');
    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user's room details & all 15 members
// @route   GET /api/rooms/myroom
// @access  Private
export const getMyRoom = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.room) {
      return res.status(404).json({ message: 'You are not part of any room yet.' });
    }

    const room = await Room.findById(user.room).populate('members', 'name email monthlyBudget');
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};