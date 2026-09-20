"use client";

import { useActionState, useEffect, useState } from "react";
import { renameSelf } from "./actions";

const initialState = { error: null, success: null };

export default function EditNameForm({ currentName }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(renameSelf, initialState);

  useEffect(() => {
    if (state?.success) setEditing(false);
  }, [state]);

  if (!editing) {
    return (
      <button
        type="button"
        className="sp-btn sp-btn-secondary"
        style={{ fontSize: 12, padding: "4px 10px" }}
        onClick={() => setEditing(true)}
      >
        ✏️ Edit name
      </button>
    );
  }

  return (
    <form action={formAction} className="sp-form" style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
      <div>
        <input
          className="sp-input"
          name="displayName"
          defaultValue={currentName}
          required
          maxLength={40}
          autoFocus
        />
        {state?.error && (
          <div className="sp-banner sp-banner-error" style={{ marginTop: 6, padding: "4px 8px", fontSize: 12 }}>
            {state.error}
          </div>
        )}
      </div>
      <button type="submit" className="sp-btn sp-btn-primary" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </button>
      <button type="button" className="sp-btn sp-btn-secondary" onClick={() => setEditing(false)}>
        Cancel
      </button>
    </form>
  );
}
