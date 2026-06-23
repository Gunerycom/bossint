"use client";

import WelcomeView from "./components/WelcomeView";
import { useTaskStore } from "./components/TaskStore";
import { useRouter } from "next/navigation";

export default function Home() {
  const { setInput, sendMessage, setDeployTemplate, setIsDeployOpen } = useTaskStore();
  const router = useRouter();

  const handlePromptFill = (text: string) => {
    setInput(text);
    router.push("/chat");
  };

  const handlePromptSubmit = (text: string) => {
    sendMessage(text);
  };

  const handleDeployClick = (template: any) => {
    setDeployTemplate(template);
    setIsDeployOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <WelcomeView
        onPromptFill={handlePromptFill}
        onPromptSubmit={handlePromptSubmit}
        onDeployClick={handleDeployClick}
      />
    </div>
  );
}
