import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { defaultQuestions } from '../config/chatbotDefaults';

const ChatWidget = () => {
    const { isAuthenticated } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);

    // Load from localStorage on first mount
    useEffect(() => {
        try {
            const stored = window.localStorage.getItem('lifeline_chat_v1');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setMessages(parsed);
                }
            }
        } catch (e) {
            // ignore storage errors
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            setMessages([]);
            try {
                window.localStorage.removeItem('lifeline_chat_v1');
            } catch (e) {
                // ignore
            }
        } else if (isAuthenticated && messages.length === 0) {
            setMessages([{
                id: 'welcome',
                from: 'bot',
                text: 'Hi! I am the LifeLine assistant. I can answer questions about blood donation, the donation process, and how to use this system.\nYou can also try the quick questions below.',
                timestamp: new Date().toISOString()
            }]);
        }
    }, [isAuthenticated, messages.length]);

    // Persist conversation
    useEffect(() => {
        if (!isAuthenticated) return;
        try {
            window.localStorage.setItem('lifeline_chat_v1', JSON.stringify(messages));
        } catch (e) {
            // ignore storage errors
        }
    }, [messages, isAuthenticated]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const toggleOpen = () => {
        if (!isAuthenticated) {
            setError('Please log in to use the assistant.');
            return;
        }
        setIsOpen(prev => !prev);
        setError(null);
    };

    const handleSend = async (textOverride) => {
        const content = (textOverride ?? input).trim();
        if (!content || !isAuthenticated) return;

        const newMessage = {
            id: `user-${Date.now()}`,
            from: 'user',
            text: content,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, newMessage]);
        setInput('');
        setIsTyping(true);
        setError(null);

        try {
            const response = await api.post('/api/chat', { message: content });
            const data = response.data;
            const replyText = typeof data === 'string' ? data : data.reply;
            const suggested = Array.isArray(data?.suggestedQuestions) ? data.suggestedQuestions : [];

            setMessages(prev => [
                ...prev,
                {
                    id: `bot-${Date.now()}`,
                    from: 'bot',
                    text: replyText || 'Sorry, I could not process that question.',
                    timestamp: new Date().toISOString(),
                    suggestedQuestions: suggested
                }
            ]);
        } catch (err) {
            console.error('Chat error', err);
            setMessages(prev => [
                ...prev,
                {
                    id: `bot-error-${Date.now()}`,
                    from: 'bot',
                    text: 'The assistant cannot reach the server right now. You can still tap the suggested questions above, or try again in a few minutes.',
                    timestamp: new Date().toISOString()
                }
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleSend();
    };

    const handleChipClick = (questionText) => {
        if (!isAuthenticated) return;
        const matched = defaultQuestions.find(q => q.question === questionText);
        const answer = matched ? matched.answer : null;
        const now = new Date().toISOString();

        const userMessage = {
            id: `user-chip-${Date.now()}`,
            from: 'user',
            text: questionText,
            timestamp: now
        };

        const botMessage = {
            id: `bot-chip-${Date.now()}`,
            from: 'bot',
            text: answer || 'Here is some information related to that question.',
            timestamp: now,
            suggestedQuestions: defaultQuestions.map(q => q.question).slice(0, 3)
        };

        setMessages(prev => [...prev, userMessage, botMessage]);
    };

    const handleSuggestedClick = (qText) => {
        const matched = defaultQuestions.find(q => q.question === qText);
        if (matched) {
            handleChipClick(matched.question);
        } else {
            handleSend(qText);
        }
    };

    const formatTime = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const lastBotMessage = [...messages].reverse().find(m => m.from === 'bot');
    const suggestedFromBackend = Array.isArray(lastBotMessage?.suggestedQuestions)
        ? lastBotMessage.suggestedQuestions
        : [];
    const shouldShowDefaultChips = messages.length === 0 || (messages.length === 1 && messages[0].id === 'welcome');
    const hasHistory = messages.length > 1;

    return (
        <>
            {error && (
                <div style={{
                    position: 'fixed',
                    right: '1.5rem',
                    bottom: '5rem',
                    background: '#DC2626',
                    color: 'white',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    zIndex: 50
                }}>
                    {error}
                </div>
            )}

            <motion.button
                onClick={toggleOpen}
                className={`fab ${!isOpen && hasHistory ? 'fab-pulse' : ''}`}
                type="button"
                aria-label="Open LifeLine assistant"
                initial={{ scale: 0.9, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
            >
                {isOpen ? '✕' : '💬'}
            </motion.button>

            <AnimatePresence>
                {isOpen && isAuthenticated && (
                    <motion.div
                        className="chat-panel"
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.98 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                    >
                        <div style={{
                            padding: '0.85rem 1rem',
                            borderBottom: '1px solid rgba(148,163,184,0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'linear-gradient(135deg, rgba(59,130,246,0.95), rgba(236,72,153,0.95))'
                        }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>LifeLine Assistant</div>
                                <div style={{ fontSize: '0.72rem', opacity: 0.9 }}>Ask about donation or using the system</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <span style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '999px',
                                    background: '#22C55E',
                                    boxShadow: '0 0 0 4px rgba(34,197,94,0.4)'
                                }} />
                                <span style={{ fontSize: '0.7rem' }}>Online</span>
                            </div>
                        </div>

                        {(shouldShowDefaultChips || suggestedFromBackend.length > 0) && (
                            <div style={{ padding: '0.55rem 0.85rem', borderBottom: '1px solid rgba(148,163,184,0.25)' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    {(suggestedFromBackend.length > 0 ? suggestedFromBackend : defaultQuestions.map(q => q.question)).map(q => (
                                        <button
                                            key={q}
                                            type="button"
                                            className="chip"
                                            onClick={() => (suggestedFromBackend.length > 0 ? handleSuggestedClick(q) : handleChipClick(q))}
                                            style={{
                                                background: 'rgba(15,23,42,0.9)',
                                                color: '#E5E7EB',
                                                borderColor: 'rgba(148,163,184,0.5)',
                                                fontSize: '0.7rem'
                                            }}
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{
                            flex: 1,
                            padding: '0.75rem',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem'
                        }}>
                            {messages.map(msg => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.16 }}
                                    style={{
                                        display: 'flex',
                                        justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start'
                                    }}
                                >
                                    <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', gap: '0.12rem' }}>
                                        <div
                                            style={{
                                                borderRadius: msg.from === 'user'
                                                    ? '1rem 0.3rem 1rem 1rem'
                                                    : '0.3rem 1rem 1rem 1rem',
                                                padding: '0.45rem 0.7rem',
                                                fontSize: '0.8rem',
                                                whiteSpace: 'pre-wrap',
                                                background: msg.from === 'user'
                                                    ? 'linear-gradient(135deg, #3B82F6, #22C55E)'
                                                    : 'rgba(15,23,42,0.96)',
                                                color: msg.from === 'user' ? 'white' : '#E5E7EB',
                                                border: msg.from === 'user'
                                                    ? 'none'
                                                    : '1px solid rgba(148,163,184,0.55)'
                                            }}
                                        >
                                            {msg.text}
                                        </div>
                                        <div style={{
                                            fontSize: '0.65rem',
                                            color: '#9CA3AF',
                                            textAlign: msg.from === 'user' ? 'right' : 'left'
                                        }}>
                                            {formatTime(msg.timestamp)}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {isTyping && (
                                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                    <div style={{
                                        borderRadius: '0.3rem 1rem 1rem 1rem',
                                        padding: '0.4rem 0.6rem',
                                        fontSize: '0.78rem',
                                        background: 'rgba(15,23,42,0.95)',
                                        border: '1px solid rgba(148,163,184,0.55)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        color: '#E5E7EB'
                                    }}>
                                        <span>Assistant is typing</span>
                                        <span style={{ display: 'inline-flex', gap: '0.12rem' }}>
                                            <span className="typing-dot" style={{ width: 4, height: 4, borderRadius: '999px', background: '#E5E7EB' }} />
                                            <span className="typing-dot" style={{ width: 4, height: 4, borderRadius: '999px', background: '#E5E7EB' }} />
                                            <span className="typing-dot" style={{ width: 4, height: 4, borderRadius: '999px', background: '#E5E7EB' }} />
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSubmit} style={{
                            padding: '0.6rem 0.75rem',
                            borderTop: '1px solid rgba(148,163,184,0.4)',
                            display: 'flex',
                            gap: '0.4rem',
                            alignItems: 'center'
                        }}>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about donation or LifeLine..."
                                maxLength={500}
                                style={{
                                    flex: 1,
                                    borderRadius: '999px',
                                    border: '1px solid rgba(148,163,184,0.6)',
                                    background: 'rgba(15,23,42,0.9)',
                                    color: '#E5E7EB',
                                    padding: '0.4rem 0.75rem',
                                    fontSize: '0.8rem',
                                    outline: 'none'
                                }}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                style={{
                                    borderRadius: '999px',
                                    border: 'none',
                                    padding: '0.4rem 0.75rem',
                                    background: input.trim()
                                        ? 'linear-gradient(135deg, #3B82F6, #22C55E)'
                                        : 'rgba(75,85,99,0.7)',
                                    color: 'white',
                                    fontSize: '0.8rem',
                                    cursor: input.trim() ? 'pointer' : 'not-allowed'
                                }}
                            >
                                Send
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ChatWidget;

