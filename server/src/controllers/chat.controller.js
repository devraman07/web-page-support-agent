import { chat } from "../services/chat.service.js";

export const chatController = async (req, res) => {
  try {
    const { question } = req.body;

    const answer = await chat(question);

    return res.status(200).json({
      success: true,
      message: "Response generated successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate response.",
      error: error.message,
    });
  }
};
