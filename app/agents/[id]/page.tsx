"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useTaskStore } from "../../components/TaskStore";
import AgentDetailView from "../../components/AgentDetailView";

export default function AgentDetailPage() {
  const params = useParams();
  const { setSelectedAgentId } = useTaskStore();

  const id = params.id as string;

  useEffect(() => {
    if (id) {
      setSelectedAgentId(id);
    }
  }, [id, setSelectedAgentId]);

  return (
    <div className="flex-1 overflow-y-auto">
      <AgentDetailView />
    </div>
  );
}
