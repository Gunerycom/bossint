"use client";

import { useEffect } from "react";
import { useTaskStore } from "../components/TaskStore";
import ChatContainer from "../components/ChatContainer";

export default function NewChatPage() {
  const { setActiveConversationId } = useTaskStore();

  useEffect(() => {
    setActiveConversationId(null);
  }, [setActiveConversationId]);

  return <ChatContainer />;
}
