interface Props {
  message: string;
}

export default function AgentMessage({ message }: Props) {
  return (
    <ul>
      <li class="fhir_agent_container">
        <div class="is-flex is-align-items-center is-flex-direction-row">
          <span class="icon is-medium">
            <img src={"../images/agent-avatar.svg"} alt="user avatar" />
          </span>
          <p class="is-size-6 has-text-left has-text-weight-normal pl-5 is-align-self-center fhir_agent_prompt">
            {message}
          </p>
        </div>
      </li>
    </ul>
  );
}
