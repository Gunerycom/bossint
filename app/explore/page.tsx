"use client";

import ExploreView from "../components/ExploreView";
import { useTaskStore } from "../components/TaskStore";

export default function ExplorePage() {
  const { setDeployTemplate, setIsDeployOpen } = useTaskStore();

  const handleDeployClick = (template: any) => {
    setDeployTemplate(template);
    setIsDeployOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <ExploreView onDeployClick={handleDeployClick} />
    </div>
  );
}
