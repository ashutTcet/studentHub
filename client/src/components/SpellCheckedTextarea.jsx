import { useMemo } from 'react';
import nspell from 'nspell';
import affData from 'dictionary-en-us/index.aff?raw';
import dicData from 'dictionary-en-us/index.dic?raw';

const TECHNICAL_ALLOWLIST = new Set([
  'javascript',
  'typescript',
  'react',
  'node',
  'node.js',
  'express',
  'mongodb',
  'mern',
  'api',
  'apis',
  'html',
  'css',
  'git',
  'github',
  'vite',
  'json',
  'jwt',
  'rest',
  'postgresql',
  'mysql',
  'docker',
  'kubernetes',
]);

const spell = nspell(affData, dicData);
for (const term of TECHNICAL_ALLOWLIST) {
  spell.add(term);
  spell.add(term.toUpperCase());
}

const URL_OR_EMAIL_REGEX = /(?:https?:\/\/\S+|www\.\S+|\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b)/gi;
const WORD_REGEX = /[A-Za-z][A-Za-z'.-]*/g;
const WORD_ONLY_REGEX = /^[A-Za-z][A-Za-z'.-]*$/;

const normalizeWord = (value) =>
  String(value || '')
    .replace(/^[^A-Za-z]+/, '')
    .replace(/[^A-Za-z]+$/, '')
    .replace(/^[.']+|[.']+$/g, '');

const escapeHtml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isMisspelled = (rawWord) => {
  const normalized = normalizeWord(rawWord);
  if (!normalized) return false;

  const lower = normalized.toLowerCase();
  if (TECHNICAL_ALLOWLIST.has(lower)) return false;
  if (lower.length <= 1) return false;
  if (/\d/.test(lower)) return false;
  if (lower.includes('://') || lower.includes('@')) return false;

  return !spell.correct(normalized) && !spell.correct(lower);
};

const getMisspelledWords = (text) => {
  const sanitized = String(text || '').replace(URL_OR_EMAIL_REGEX, ' ');
  const found = new Set();

  for (const match of sanitized.matchAll(WORD_REGEX)) {
    const token = match[0];
    if (isMisspelled(token)) {
      found.add(token.toLowerCase());
    }
  }

  return found;
};

const buildHighlightedHtml = (text, misspelledWords) => {
  if (!text) {
    return '&nbsp;';
  }

  const segments = String(text).split(/([A-Za-z][A-Za-z'.-]*)/g);

  return segments
    .map((segment) => {
      if (!segment) return '';

      if (!WORD_ONLY_REGEX.test(segment)) {
        return escapeHtml(segment);
      }

      const normalized = normalizeWord(segment).toLowerCase();
      const escaped = escapeHtml(segment);

      if (!normalized || !misspelledWords.has(normalized)) {
        return escaped;
      }

      return `<span class="misspelled-token" title="Possible spelling mistake">${escaped}</span>`;
    })
    .join('');
};

const SpellCheckedTextarea = ({
  name,
  value,
  onChange,
  rows = 4,
  placeholder = '',
  maxLength,
}) => {
  const misspelledWords = useMemo(() => getMisspelledWords(value), [value]);
  const highlightedHtml = useMemo(() => buildHighlightedHtml(value, misspelledWords), [value, misspelledWords]);

  return (
    <div className="spellcheck-textarea-wrap">
      <div className="spellcheck-overlay" aria-hidden="true" dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
      <textarea
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        spellCheck
        autoCorrect="on"
        autoCapitalize="sentences"
      />
      {misspelledWords.size > 0 ? (
        <small className="spellcheck-hint">Possible spelling: {Array.from(misspelledWords).slice(0, 8).join(', ')}</small>
      ) : null}
    </div>
  );
};

export default SpellCheckedTextarea;
