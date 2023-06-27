import { useCallback, useEffect, useState } from "preact/hooks";

// The time to wait between characters when typing a message
const TYPING_DELAY_IN_MS = 30;

// Is added to the text length in calculations to add a pause after typing
const POST_TEXT_CHARACTER_BUFFER = 70;

interface Props {
  enabled: boolean;
  text?: string;
  typingDelayInMilliseconds?: number;
}

interface TypeAnimationReturnType {
  displayText: string;
  isTyping: boolean;
  resetTextAnimation: () => void;
}

export function useTextWithTypeAnimation({
  enabled,
  text = "",
  typingDelayInMilliseconds = TYPING_DELAY_IN_MS,
}: Props): TypeAnimationReturnType {
  const [typingProgress, setTypingProgress] = useState(0);

  const textLengthWithBuffer = text.length + POST_TEXT_CHARACTER_BUFFER;
  const isTyping = enabled && typingProgress < textLengthWithBuffer;
  const displayText = text.substring(0, typingProgress);

  const resetTextAnimation = useCallback(() => {
    setTypingProgress(0);
  }, []);

  // Controls the typer animation
  useEffect(() => {
    let intervalId: number;
    if (
      (enabled || typingProgress > 0) &&
      typingProgress < textLengthWithBuffer
    ) {
      // Display the current message one character at a time
      intervalId = setInterval(() => {
        setTypingProgress((progress) => progress + 1);
      }, typingDelayInMilliseconds);
    }

    return () => clearInterval(intervalId);
  }, [
    enabled,
    textLengthWithBuffer,
    typingDelayInMilliseconds,
    typingProgress,
  ]);

  return {
    displayText,
    isTyping,
    resetTextAnimation,
  };
}
