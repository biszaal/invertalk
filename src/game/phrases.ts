import { CUSTOM_PHRASE_MAX } from '@/config';

export type Phrase = { source: 'preset'; id: string; text: string } | { source: 'custom'; text: string };

/**
 * Original, short, family-friendly starter pack (handoff proposal, confirm
 * before shipping). Ids are stable: analytics sends the id, never the text.
 */
export const STARTER_PHRASES: readonly { id: string; text: string }[] = [
  { id: 'p01', text: 'Good morning everyone' },
  { id: 'p02', text: 'I like chocolate ice cream' },
  { id: 'p03', text: 'Please pass the salt' },
  { id: 'p04', text: 'The cat sat on the mat' },
  { id: 'p05', text: 'How are you today' },
  { id: 'p06', text: "Let's go to the park" },
  { id: 'p07', text: 'The weather is nice today' },
  { id: 'p08', text: 'Red lorry yellow lorry' },
  { id: 'p09', text: 'She sells seashells' },
  { id: 'p10', text: 'Can you hear me now' },
];

export type CustomPhraseCheck = { ok: true; text: string } | { ok: false; reason: 'empty' | 'too_long' };

export function checkCustomPhrase(input: string): CustomPhraseCheck {
  const text = input.trim().replace(/\s+/g, ' ');
  if (!text) return { ok: false, reason: 'empty' };
  if (text.length > CUSTOM_PHRASE_MAX) return { ok: false, reason: 'too_long' };
  return { ok: true, text };
}
