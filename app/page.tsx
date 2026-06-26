"use client";

import CreateAgentView from "./components/CreateAgentView";
import { useTaskStore } from "./components/TaskStore";
import { useRouter } from "next/navigation";

export default function Home() {
  const { setInput, setDeployTemplate, setDeployCustomPrompt, setIsDeployOpen } = useTaskStore();
  const router = useRouter();

  const handlePromptFill = (text: string) => {
    setInput(text);
    router.push("/chat");
  };

  const handlePromptSubmit = (text: string) => {
    setDeployTemplate(null);
    setDeployCustomPrompt(text);
    setIsDeployOpen(true);
  };

  const handleDeployClick = (template: any) => {
    setDeployTemplate(template);
    setDeployCustomPrompt("");
    setIsDeployOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <CreateAgentView
        onPromptFill={handlePromptFill}
        onPromptSubmit={handlePromptSubmit}
        onDeployClick={handleDeployClick}
      />
    </div>
  );
}
