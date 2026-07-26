import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    roomName: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
    },
    roomCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

roomSchema.path('members').validate(function (members) {
  return members.length <= 15;
}, 'A room can have a maximum of 15 members.');

const Room = mongoose.model('Room', roomSchema);
export default Room;