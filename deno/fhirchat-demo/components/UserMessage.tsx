interface Props {
  message: string;
}

export default function UserMessage({ message }: Props) {
  return (
    <ul>
      <li>
        <div class="is-flex is-flex-direction-row pb-5">
          <span class="icon is-medium">
            <img src={"../images/user-avatar.svg"} alt="user avatar" />
          </span>
          <p class="is-size-6 has-text-left has-text-weight-normal pl-5 is-align-self-center user_prompt">
            {message}
          </p>
        </div>
      </li>
    </ul>
  );
}
