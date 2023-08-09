import { useContext } from "preact/hooks";
import { AppContext } from "../hooks/appContext.ts";

import { THINKING, THREE_DOTS } from "../constants/icons.ts";
import { blinkingCursor } from "../hooks/blinkingCursor.ts";

interface Props {
  message: string;
  iconPath: string;
}

export default function AgentMessage({ message, iconPath }: Props) {
  const { setThoughtsActionsPanel } = useContext(AppContext);
  const cursor = blinkingCursor();

  const displayText = iconPath === THINKING ? message + cursor : message;
  return (
    <ul>
      <li class="fhir_agent_container px-3">
        <div class="is-flex is-align-items-center is-flex-direction-row">
          <span class="icon is-medium">
            <img src={iconPath || THREE_DOTS} alt="" />
          </span>
          <p class="is-size-6 has-text-left has-text-weight-normal pl-5 is-align-self-center fhir_agent_prompt">
            {displayText}
          </p>
        </div>
        <div class="is-flex is-flex-direction-row is-align-items-center control">
          <span
            class="icon is-medium"
            onClick={() => setThoughtsActionsPanel(true)}
          >
            <img src={"../images/settings.svg"} alt="settings" />
          </span>
        </div>
      </li>
    </ul>
  );
}
