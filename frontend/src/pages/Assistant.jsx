import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import logo from "../assets/hasad-logo.png";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";

const IconSend = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M22 2L11 13"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M22 2L15 22L11 13L2 9L22 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconBot = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 8V4H8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="3" y="8" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M6 13h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M10 13h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconUser = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const IconLeaf = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M2 22c5.523 0 10-4.477 10-10S7.523 2 2 2s-2 20 0 20Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M2 22c0-4 4-6 6-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconInfo = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M12 16v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function Assistant() {
  const { user, logout } = useAuth();
  const { farmId } = useParams();
  const navigate = useNavigate();
  const [farm, setFarm] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (farmId) {
      loadFarm();
      loadMessages();
    }
  }, [farmId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadFarm() {
    try {
      setLoading(true);
      const data = await api.getFarm(farmId);
      setFarm(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function loadMessages() {
    // Load from localStorage for session persistence
    const stored = localStorage.getItem(`hasad_chat_${farmId}`);
    if (stored) {
      setMessages(JSON.parse(stored));
    }
  }

  function saveMessages(msgs) {
    localStorage.setItem(`hasad_chat_${farmId}`, JSON.stringify(msgs));
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);
    setInput("");
    setSending(true);
    setError("");

    try {
      const response = await api.chat(farmId, userMessage.content);
      const assistantMessage = {
        role: "assistant",
        content: response.assistant_response,
        sources: response.sources_used || [],
        dataReferences: response.data_references || {},
        confidence: response.confidence_level || "unknown",
        tokens: response.tokens_used || 0,
      };
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      saveMessages(finalMessages);
    } catch (err) {
      setError(err.message);
      // Remove the user message on error
      setMessages(messages);
    } finally {
      setSending(false);
    }
  }

  function handleClear() {
    if (window.confirm("Clear chat history for this farm?")) {
      setMessages([]);
      localStorage.removeItem(`hasad_chat_${farmId}`);
    }
  }

  if (loading) {
    return <div style={loadingStyle}>Loading...</div>;
  }

  if (!farm) {
    return <div style={errorStyle}>Farm not found</div>;
  }

  return (
    <div style={wrap}>
      <Header user={user} logout={logout} farmName={farm.name} navigate={navigate} farmId={farmId} handleClear={handleClear} />

      <main style={main}>
        {error && (
          <div style={errorBox}>
            {error}
          </div>
        )}

        <div style={chatContainer}>
          <div style={messagesArea}>
            {messages.length === 0 ? (
              <div style={emptyState}>
                <div style={emptyIcon}><IconBot size={56} /></div>
                <div style={emptyTitle}>Start a Conversation</div>
                <div style={emptyText}>
                  Ask about irrigation, disease risk, weather, or general farming advice.
                  Responses are grounded in your farm's actual data.
                </div>
                <div style={suggestions}>
                  <SuggestionChip
                    text="How should I irrigate today?"
                    onClick={() => setInput("How should I irrigate today?")}
                  />
                  <SuggestionChip
                    text="What's the disease risk?"
                    onClick={() => setInput("What's the disease risk for my farm?")}
                  />
                  <SuggestionChip
                    text="Check my weather"
                    onClick={() => setInput("What's the weather at my farm?")}
                  />
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <MessageBubble key={idx} message={msg} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form style={inputArea} onSubmit={handleSend}>
            <input
              style={chatInput}
              type="text"
              placeholder="Ask about your farm..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
              maxLength={1000}
            />
            <button
              style={sendButton}
              type="submit"
              disabled={sending || !input.trim()}
            >
              {sending ? <div style={loadingSpinner} /> : <IconSend />}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

function Header({ user, logout, farmName, navigate, farmId, handleClear }) {
  return (
    <header style={header}>
      <div style={headerLeft}>
        <img
          src={logo}
          alt="HASAD"
          style={{ ...logoStyle, cursor: "pointer" }}
          onClick={() => navigate(`/farms/${farmId}`)}
        />
        <div>
          <div style={brandName}>AI Assistant</div>
          <div style={farmLabel}>{farmName}</div>
        </div>
      </div>

      <div style={headerRight}>
        <button style={secondaryBtn} onClick={handleClear}>
          Clear Chat
        </button>
        <button style={logoutBtn} onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div style={isUser ? userBubble : assistantBubble}>
      <div style={bubbleHeader}>
        {isUser ? <IconUser /> : <IconBot />}
        <span style={bubbleRole}>{isUser ? "You" : "HASAD"}</span>
      </div>
      <div style={bubbleContent}>{message.content}</div>
      {!isUser && message.confidence && (
        <div style={bubbleFooter}>
          <ConfidenceTag level={message.confidence} />
          {message.tokens > 0 && (
            <span style={bubbleMeta}>{message.tokens} tokens</span>
          )}
        </div>
      )}
      {!isUser && message.sources && message.sources.length > 0 && (
        <div style={sourcesBar}>
          {message.sources.map((source) => (
            <SourceTag key={source} source={source} />
          ))}
        </div>
      )}
    </div>
  );
}

function ConfidenceTag({ level }) {
  const config = {
    high: { bg: "#DCFCE7", color: "#16A34A", label: "High Confidence" },
    medium: { bg: "#FEF3C7", color: "#F59E0B", label: "Medium Confidence" },
    low: { bg: "#FEE2E2", color: "#DC2626", label: "Low Confidence" },
  };
  const { bg, color, label } = config[level] || config.low;

  return (
    <span style={{ ...confidenceTag, background: bg, color }}>
      {label}
    </span>
  );
}

function SourceTag({ source }) {
  const icon = source === "weather" ? <IconInfo /> :
                source === "irrigation" ? <IconLeaf /> :
                source === "disease_risk" ? <IconWarning /> :
                <IconInfo />;

  const label = source === "weather" ? "Weather" :
                 source === "irrigation" ? "Irrigation" :
                 source === "disease_risk" ? "Disease Risk" :
                 source;

  return (
    <span style={sourceTag}>
      {icon}
      {label}
    </span>
  );
}

function SuggestionChip({ text, onClick }) {
  return (
    <button style={suggestionChip} onClick={onClick} type="button">
      {text}
    </button>
  );
}

const IconWarning = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M12 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const wrap = {
  minHeight: "100vh",
  background: "#F8FAFC",
};

const header = {
  height: "72px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 32px",
  background: "white",
  borderBottom: "1px solid rgba(0,0,0,0.06)",
  position: "sticky",
  top: 0,
  zIndex: 100,
};

const headerLeft = {
  display: "flex",
  alignItems: "center",
  gap: 16,
};

const logoStyle = {
  height: "40px",
  width: "auto",
};

const brandName = {
  fontSize: "18px",
  fontWeight: 800,
  color: "#0F766E",
  letterSpacing: "-0.5px",
};

const farmLabel = {
  fontSize: "13px",
  color: "#0F766E",
  fontWeight: 700,
  marginTop: 2,
};

const headerRight = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const main = {
  maxWidth: 1000,
  margin: "24px auto",
  padding: "0 24px 40px",
  height: "calc(100vh - 72px)",
  display: "flex",
  flexDirection: "column",
};

const loadingStyle = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  fontSize: 18,
  color: "var(--muted)",
};

const errorStyle = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  fontSize: 18,
  color: "#b91c1c",
  fontWeight: 700,
};

const errorBox = {
  background: "#FEE2E2",
  border: "1px solid #FCA5A5",
  color: "#B91C1C",
  padding: "14px 16px",
  borderRadius: 12,
  marginBottom: 16,
  fontSize: "14px",
  fontWeight: 600,
};

const chatContainer = {
  background: "white",
  border: "1px solid rgba(0,0,0,0.06)",
  borderRadius: 16,
  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
  display: "flex",
  flexDirection: "column",
  flex: 1,
  overflow: "hidden",
};

const messagesArea = {
  flex: 1,
  padding: "24px",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

const emptyState = {
  textAlign: "center",
  padding: "60px 20px",
  color: "var(--muted)",
};

const emptyIcon = {
  opacity: 0.3,
  marginBottom: 16,
};

const emptyTitle = {
  fontWeight: 800,
  fontSize: 18,
  marginBottom: 8,
  color: "#0F172A",
};

const emptyText = {
  fontSize: 14,
  maxWidth: 400,
  margin: "0 auto 24px",
  lineHeight: 1.6,
};

const suggestions = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  justifyContent: "center",
};

const suggestionChip = {
  padding: "8px 16px",
  borderRadius: 20,
  border: "1px solid rgba(0,0,0,0.1)",
  background: "white",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  color: "#0F172A",
  transition: "all 0.2s",
};

const userBubble = {
  alignSelf: "flex-end",
  maxWidth: "70%",
  background: "#0F766E",
  color: "white",
  borderRadius: 18,
  borderRadiusBottomRight: 6,
  padding: "16px 18px",
};

const assistantBubble = {
  alignSelf: "flex-start",
  maxWidth: "80%",
  background: "#F8FAFC",
  border: "1px solid rgba(0,0,0,0.06)",
  borderRadius: 18,
  borderRadiusBottomLeft: 6,
  padding: "16px 18px",
};

const bubbleHeader = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  marginBottom: 8,
  fontSize: 12,
  fontWeight: 700,
  opacity: 0.9,
};

const bubbleRole = {
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

const bubbleContent = {
  fontSize: "14",
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
  color: "#0F172A",
};

const bubbleFooter = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 10,
  paddingTop: 10,
  borderTop: "1px solid rgba(0,0,0,0.08)",
};

const confidenceTag = {
  padding: "4px 10px",
  borderRadius: 12,
  fontSize: 11,
  fontWeight: 700,
};

const bubbleMeta = {
  fontSize: 10,
  color: "rgba(0,0,0,0.5)",
};

const sourcesBar = {
  display: "flex",
  gap: 6,
  marginTop: 10,
  flexWrap: "wrap",
};

const sourceTag = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  padding: "4px 10px",
  borderRadius: 12,
  background: "#F8FAFC",
  border: "1px solid rgba(0,0,0,0.08)",
  fontSize: 11,
  fontWeight: 700,
  color: "#0F172A",
};

const inputArea = {
  padding: "16px 20px",
  borderTop: "1px solid rgba(0,0,0,0.06)",
  background: "white",
  display: "flex",
  gap: 12,
};

const chatInput = {
  flex: 1,
  padding: "14px 18px",
  borderRadius: 24,
  border: "1px solid rgba(0,0,0,0.1)",
  outline: "none",
  background: "#F8FAFC",
  fontSize: "14",
  fontWeight: 500,
};

const sendButton = {
  padding: "14px 18px",
  borderRadius: 24,
  border: 0,
  background: "#0F766E",
  color: "white",
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
  minWidth: 52,
  transition: "all 0.2s",
};

const loadingSpinner = {
  width: "18px",
  height: "18px",
  border: "2px solid rgba(255,255,255,0.3)",
  borderTop: "2px solid white",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
};

const secondaryBtn = {
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.1)",
  background: "white",
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 13,
};

const logoutBtn = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.1)",
  background: "white",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 13,
};
