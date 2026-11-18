import api from "./axios";

export const sendChatMessage = async (userMessage) => {
  try {
    const response = await api.post("/chat", {
      user_message: userMessage
    });
    return {
      success: true,
      response: response.data.response,
      safe: response.data.safe
    };
  } catch (error) {
    console.error("Chat API Error:", error);
    return {
      success: false,
      response: "Sorry, I couldn't process your message. Please try again.",
      safe: false
    };
  }
};
