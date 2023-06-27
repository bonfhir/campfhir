import { type Signal, signal } from "@preact/signals";
import { createContext } from "preact";

export type SetThoughtsActionsFunction = (
  thoughtActionPanelOpen: boolean,
) => void;

export type AppContext = {
  thoughtActionPanelOpen: Signal<boolean>;
  setThoughtsActionsPanel: SetThoughtsActionsFunction;
};

function createAppState(): AppContext {
  const thoughtActionPanelOpen = signal<boolean>(false);

  const setThoughtsActionsPanel: SetThoughtsActionsFunction = (
    thoughtActionPanel: boolean,
  ) => {
    thoughtActionPanelOpen.value = thoughtActionPanel;
  };

  return {
    thoughtActionPanelOpen,
    setThoughtsActionsPanel,
  };
}

const currentAppState = createAppState();

export const AppState = createContext<AppContext>(currentAppState);
