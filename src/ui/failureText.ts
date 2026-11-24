/** Plain-language reversal failure copy; low storage gets its own message. */
export function failureText(code: string, fallback: string): string {
  return code === 'write_failed' ? "Couldn't save the recording. Free up some space on your phone and try again." : fallback;
}
