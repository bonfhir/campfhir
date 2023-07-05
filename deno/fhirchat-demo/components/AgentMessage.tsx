import { useContext } from "preact/hooks";
import { AppContext } from "../hooks/appContext.ts";

interface Props {
  message: string;
}

export default function AgentMessage({ message }: Props) {
  const { setThoughtsActionsPanel } = useContext(AppContext);

  return (
    <ul>
      <li class="fhir_agent_container px-3">
        <div class="is-flex is-align-items-center is-flex-direction-row">
          <span class="icon is-medium">
            <img src={"../images/agent-avatar.svg"} alt="user avatar" />
          </span>
          <p class="is-size-6 has-text-left has-text-weight-normal pl-5 is-align-self-center fhir_agent_prompt">
            {message}
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
