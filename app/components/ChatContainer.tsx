"use client";

import { useTaskStore } from "./TaskStore";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";

export default function ChatContainer() {
  const {
    messages,
    input,
    setInput,
    sendMessage,
    isStreaming,
    stopStreaming,
  } = useTaskStore();

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-start pt-20 pb-6 px-6 max-w-3xl mx-auto w-full space-y-10 animate-fade-in text-[var(--text-primary)]">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-md flex items-center justify-center mx-auto mb-4 select-none">
              <img src="/bossint-b.png" alt="Bossint" className="w-10 h-10" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--text-primary)] font-sans">
              Autopilot Research
            </h2>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] font-medium max-w-none mx-auto leading-relaxed">
              Ask Bossint to crawl, track, or monitor anything. Check results in real-time.
            </p>
          </div>
          <div className="w-full">
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={() => sendMessage()}
              onStop={stopStreaming}
              isStreaming={isStreaming}
              isCentered={true}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden text-[var(--text-primary)]">
          <div className="flex-1 overflow-y-auto">
            <MessageList messages={messages} />
          </div>
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={() => sendMessage()}
            onStop={stopStreaming}
            isStreaming={isStreaming}
            isCentered={false}
          />
        </div>
      )}
    </div>
  );
}
