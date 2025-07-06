import { Conversation } from "../modals/conversationModel.js";
import { Message } from "../modals/messageModel.js";
import { getReceiverSocketId, io } from "../index.js";

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.id;
    const receiverId = req.params.id;
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "Message is required" });
    }

    let gotConversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!gotConversation) {
      gotConversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      message,
    });

    if (newMessage) {
      gotConversation.messages.push(newMessage._id);
    }
    await Promise.all([gotConversation.save(), newMessage.save()]);

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }
    return res.status(201).json({
      newMessage,
    });
  } catch (error) {
    console.error("Send Message Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

export const getMessage = async (req, res) => {
  try {
    const receiverId = req.params.id;
    const senderId = req.id;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    }).populate("messages");
    return res.status(200).json(conversation?.messages);
  } catch (error) {
    console.error("Get Message Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
