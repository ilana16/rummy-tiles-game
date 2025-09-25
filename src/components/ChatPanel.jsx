import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { MessageCircle, Send, Bot, Crown } from 'lucide-react';

export default function ChatPanel({ 
  messages, 
  currentUserId, 
  onSendMessage, 
  message, 
  onMessageChange 
}) {
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage();
      inputRef.current?.focus();
    }
  };

  const formatTime = (timestamp) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isSystemMessage = (msg) => {
    return msg.playerId === 'system';
  };

  const isMyMessage = (msg) => {
    return msg.playerId === currentUserId;
  };

  return (
    <Card className="h-full flex flex-col shadow-lg border-l-2 border-orange-200 bg-white/95 backdrop-blur-sm rounded-none">
      <CardHeader className="pb-3 border-b border-orange-200">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <MessageCircle className="w-5 h-5 text-orange-600" />
          <span>Game Chat</span>
          {messages.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {messages.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              if (isSystemMessage(msg)) {
                return (
                  <div key={index} className="text-center">
                    <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                      {msg.message}
                    </div>
                  </div>
                );
              }

              const isMine = isMyMessage(msg);
              
              return (
                <div
                  key={index}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${isMine ? 'order-2' : 'order-1'}`}>
                    {/* Message bubble */}
                    <div
                      className={`px-3 py-2 rounded-lg ${
                        isMine
                          ? 'bg-orange-500 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm break-words">{msg.message}</p>
                    </div>
                    
                    {/* Message info */}
                    <div className={`flex items-center space-x-2 mt-1 text-xs text-gray-500 ${
                      isMine ? 'justify-end' : 'justify-start'
                    }`}>
                      {!isMine && (
                        <div className="flex items-center space-x-1">
                          {msg.playerUsername?.includes('AI') && (
                            <Bot className="w-3 h-3" />
                          )}
                          {msg.playerUsername?.includes('Host') && (
                            <Crown className="w-3 h-3" />
                          )}
                          <span className="font-medium">{msg.playerUsername}</span>
                        </div>
                      )}
                      <span>{formatTime(msg.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message Input */}
        <div className="border-t border-orange-200 p-4">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 h-10 border-orange-200 focus:border-orange-400 focus:ring-orange-400/20"
              maxLength={200}
            />
            <Button
              type="submit"
              disabled={!message.trim()}
              size="sm"
              className="h-10 px-3 bg-orange-500 hover:bg-orange-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          
          <div className="mt-2 text-xs text-gray-500 text-center">
            Press Enter to send • Max 200 characters
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
