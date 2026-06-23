"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useTaskStore } from "../../components/TaskStore";
import ChatContainer from "../../components/ChatContainer";

export default function ActiveChatPage() {
  const params = useParams();
  const { setActiveConversationId } = useTaskStore();

  const id = params.id as string;

  useEffect(() => {
    if (id) {
      setActiveConversationId(id);
    }
  }, [id, setActiveConversationId]);

  return <ChatContainer />;
}
