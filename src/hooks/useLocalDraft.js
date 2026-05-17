import { useEffect, useMemo, useState } from 'react';

function toSerializable(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(toSerializable);
  if (value instanceof Date) return value.toISOString();
  if (typeof File !== 'undefined' && value instanceof File) return value.name;

  if (typeof value === 'object') {
    const out = {};
    Object.keys(value).forEach((key) => {
      out[key] = toSerializable(value[key]);
    });
    return out;
  }

  return value;
}

export function useLocalDraft({ draftType, itemId, userKey, form, setForm, toast }) {
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [restored] = useState(false);

  const draftKey = useMemo(() => {
    const userPart = userKey || 'anonymous';
    const itemPart = itemId || 'new';
    return `cms:draft:${draftType}:${userPart}:${itemPart}`;
  }, [draftType, itemId, userKey]);

  useEffect(() => {
    // Intentionally no persisted draft restore.
    // User requested no browser/local storage save in local running mode.
  }, [draftKey, itemId, setForm, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedAt = new Date().toISOString();
      toSerializable(form);
      setLastSavedAt(savedAt);
    }, 500);

    return () => clearTimeout(timer);
  }, [draftKey, form]);

  const clearDraft = () => {
    setForm((prev) => ({ ...prev }));
    setLastSavedAt(null);
  };

  return { draftKey, clearDraft, lastSavedAt, restored };
}
