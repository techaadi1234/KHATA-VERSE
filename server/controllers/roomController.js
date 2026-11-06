import Room from '../models/Room.js';
import User from '../models/User.js';

// Helper function to generate a random 6-character uppercase Room Code (e.g., "KHT123")
const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// @desc    Create a new room (Student becomes admin, room becomes active)
// @route   POST /api/rooms/create
// @access  Private
export const createRoom = async (req, res) => {
  try {
    const { roomName } = req.body;
    if (!roomName || !roomName.trim()) {
      return res.status(400).json({ message: 'Room name is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const roomCode = generateRoomCode();

    const room = await Room.create({
      roomName: roomName.trim(),
      roomCode,
      admin: req.user._id,
      members: [req.user._id], // Creator automatically added as member #1
    });

    // Add room to user's rooms list and set as currently active room
    if (!user.rooms) {
      user.rooms = [];
    }
    user.rooms.push(room._id);
    user.room = room._id;
    await user.save();

    const populatedRoom = await Room.findById(room._id)
      .populate('members', 'name email monthlyBudget')
      .populate('admin', 'name email');

    res.status(201).json(populatedRoom);
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
    if (!roomCode || !roomCode.trim()) {
      return res.status(400).json({ message: 'Room code is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const room = await Room.findOne({ roomCode: roomCode.trim().toUpperCase() });
    if (!room) {
      return res.status(404).json({ message: 'Invalid room code. Please check and try again.' });
    }

    // Check if user is already a member of this specific room
    const isAlreadyMember = room.members.some(
      (mId) => String(mId) === String(user._id)
    );
    if (isAlreadyMember) {
      // Just make it the active room and return
      user.room = room._id;
      if (!user.rooms) user.rooms = [];
      if (!user.rooms.some((rId) => String(rId) === String(room._id))) {
        user.rooms.push(room._id);
      }
      await user.save();

      const populatedRoom = await Room.findById(room._id)
        .populate('members', 'name email monthlyBudget')
        .populate('admin', 'name email');
      return res.json(populatedRoom);
    }

    // Enforce 15 members limit
    if (room.members.length >= 15) {
      return res.status(400).json({ message: 'Room is full! Maximum 15 members allowed.' });
    }

    // Add member to room
    room.members.push(req.user._id);
    await room.save();

    // Link room ID to user profile and set as active
    if (!user.rooms) user.rooms = [];
    user.rooms.push(room._id);
    user.room = room._id;
    await user.save();

    const updatedRoom = await Room.findById(room._id)
      .populate('members', 'name email monthlyBudget')
      .populate('admin', 'name email');

    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all rooms current user is part of
// @route   GET /api/rooms/myrooms
// @access  Private
export const getMyRooms = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find all rooms where user is listed as a member
    const rooms = await Room.find({ members: req.user._id })
      .populate('members', 'name email monthlyBudget')
      .populate('admin', 'name email')
      .sort({ updatedAt: -1 });

    // Sync user.rooms array if out of sync
    const roomIds = rooms.map((r) => r._id);
    user.rooms = roomIds;

    // If current active room is not valid or empty, pick the first available room
    if (!user.room || !roomIds.some((rId) => String(rId) === String(user.room))) {
      user.room = roomIds.length > 0 ? roomIds[0] : null;
      await user.save();
    }

    res.json({
      rooms,
      activeRoomId: user.room,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Switch user's current active room
// @route   POST /api/rooms/switch/:roomId
// @access  Private
export const switchRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const room = await Room.findById(roomId)
      .populate('members', 'name email monthlyBudget')
      .populate('admin', 'name email');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const isMember = room.members.some(
      (m) => String(m._id || m) === String(user._id)
    );
    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this room' });
    }

    // Set as active room
    user.room = room._id;
    if (!user.rooms) user.rooms = [];
    if (!user.rooms.some((rId) => String(rId) === String(room._id))) {
      user.rooms.push(room._id);
    }
    await user.save();

    res.json({
      message: 'Active room updated',
      activeRoom: room,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Leave a specific room
// @route   POST /api/rooms/leave/:roomId
// @access  Private
export const leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Remove user from room members
    room.members = room.members.filter(
      (mId) => String(mId) !== String(user._id)
    );

    if (room.members.length === 0) {
      // If no members left, delete the room
      await Room.findByIdAndDelete(roomId);
    } else {
      // If user was admin, pass admin rights to the next member
      if (String(room.admin) === String(user._id)) {
        room.admin = room.members[0];
      }
      await room.save();
    }

    // Remove from user's rooms array
    user.rooms = (user.rooms || []).filter(
      (rId) => String(rId) !== String(roomId)
    );

    // If the room left was the active room, set active room to next available room
    if (String(user.room) === String(roomId)) {
      user.room = user.rooms.length > 0 ? user.rooms[0] : null;
    }
    await user.save();

    res.json({
      message: 'Left room successfully',
      activeRoomId: user.room,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user's active room details & all members
// @route   GET /api/rooms/myroom
// @access  Private
export const getMyRoom = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user.room is missing or unlinked, try finding any room they belong to
    if (!user.room) {
      const anyRoom = await Room.findOne({ members: req.user._id });
      if (anyRoom) {
        user.room = anyRoom._id;
        if (!user.rooms) user.rooms = [];
        if (!user.rooms.some((rId) => String(rId) === String(anyRoom._id))) {
          user.rooms.push(anyRoom._id);
        }
        await user.save();
      } else {
        return res.status(404).json({ message: 'You are not part of any room yet.' });
      }
    }

    let room = await Room.findById(user.room)
      .populate('members', 'name email monthlyBudget')
      .populate('admin', 'name email');

    // In case the room was deleted, fallback to another room they belong to
    if (!room) {
      const fallbackRoom = await Room.findOne({ members: req.user._id })
        .populate('members', 'name email monthlyBudget')
        .populate('admin', 'name email');

      if (fallbackRoom) {
        user.room = fallbackRoom._id;
        await user.save();
        room = fallbackRoom;
      } else {
        user.room = null;
        user.rooms = [];
        await user.save();
        return res.status(404).json({ message: 'You are not part of any room yet.' });
      }
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};