import React, { useState, useEffect } from 'react';
import './AIAgent.css';

const AIAgent: React.FC = () => {
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [input, setInput] = useState('');

  const getAgentResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();
    if (lowerInput.includes('find customer')) {
      return 'Sure, which customer are you looking for?';
    } else if (lowerInput.includes('create invoice')) {
      return 'I can help with that. Who is the customer and what are the items?';
    } else if (lowerInput.includes('inventory level')) {
      return 'Which product inventory are you interested in?';
    } else {
      return "I'm sorry, I can't help with that yet. I can find customers, create invoices, and check inventory levels.";
    }
  };

  const handleSend = () => {
    if (input.trim()) {
      const userMessage = { sender: 'user', text: input };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      
      const agentResponseText = getAgentResponse(input);
      const agentMessage = { sender: 'agent', text: agentResponseText };
      
      setTimeout(() => {
        setMessages([...newMessages, agentMessage]);
      }, 500);

      setInput('');
    }
  };

  useEffect(() => {
    // Scroll to the bottom of the messages container
    const messagesContainer = document.querySelector('.ai-agent-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="ai-agent-container">
      <div className="ai-agent-header">
        <h2>AI Agent</h2>
      </div>
      <div className="ai-agent-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`ai-agent-message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="ai-agent-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask the AI agent..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default AIAgent;
