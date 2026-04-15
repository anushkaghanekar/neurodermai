import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { sendChatMessage } from "../lib/api";

const WELCOME_MESSAGE = {
  role: "assistant",
  content:
    "Hello! I'm the NeuroDermAI Assistant. I can help answer questions about skin conditions, your scan results, and general dermatology topics.\n\nPlease remember: I provide educational information only. Always consult a dermatologist for medical advice.\n\nHow can I help you today?",
};

const QUICK_PROMPTS = [
  "Is this condition contagious?",
  "What triggers this condition?",
  "When should I see a doctor?",
  "What moisturizers help?",
];

export default function ChatAssistant({ scanResult }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  async function handleSend(text) {
    const messageText = text || input.trim();
    if (!messageText || isTyping) return;

    const userMessage = { role: "user", content: messageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    try {
      // Build history for the API (exclude welcome message)
      const history = newMessages
        .filter((m) => m !== WELCOME_MESSAGE)
        .map((m) => ({ role: m.role, content: m.content }));

      const data = await sendChatMessage(
        messageText,
        history.slice(0, -1), // exclude the just-sent message
        scanResult || null
      );

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I encountered an error. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        className={`chat-fab ${isOpen ? "chat-fab-active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={28} className="text-white" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window fade-in">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <span className="chat-header-icon text-blue-600"><Bot size={24} /></span>
              <div>
                <h3 className="chat-header-title">DermAssistant</h3>
                <p className="chat-header-status">
                  {scanResult
                    ? `Context: ${scanResult.predicted_class || "Scan loaded"}`
                    : "General Q&A mode"}
                </p>
              </div>
            </div>
            <button
              className="chat-close-btn flex items-center justify-center"
              onClick={() => setIsOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-bubble ${
                  msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"
                }`}
              >
                <p className="chat-bubble-text">{msg.content}</p>
              </div>
            ))}
            {isTyping && (
              <div className="chat-bubble chat-bubble-ai">
                <div className="chat-typing">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts (show only at start or after first AI response) */}
          {messages.length <= 2 && !isTyping && (
            <div className="chat-quick-prompts">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  className="quick-prompt-btn"
                  onClick={() => handleSend(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chat-input-bar">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder="Ask about your scan results..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isTyping}
            />
            <button
              className="chat-send-btn flex items-center justify-center p-2"
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
