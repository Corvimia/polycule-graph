import type { ReactNode } from "react";
import { useGraph } from "../../hooks/useGraph";
import { GraphContext } from "./GraphContext";

export function GraphProvider({ children }: { children: ReactNode }) {
  const graph = useGraph();
  return (
    <GraphContext.Provider value={graph}>
      {children}
    </GraphContext.Provider>
  );
}