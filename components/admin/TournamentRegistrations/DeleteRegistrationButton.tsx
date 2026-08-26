"use client";

import { useState } from "react";

interface DeleteRegistrationButtonProps {
  registrationId: number;
  onDeleted: (id: number) => void;
}

export default function DeleteRegistrationButton({
  registrationId,
  onDeleted,
}: DeleteRegistrationButtonProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this tournament registration?"
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      const response = await fetch(
        `/api/tournament-registrations/${registrationId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!result.success) {
        alert(result.message || "Failed to delete registration.");
        return;
      }

      onDeleted(registrationId);
    } catch (error) {
      console.error("Delete registration error:", error);
      alert("Something went wrong while deleting the registration.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-500 transition disabled:opacity-50"
    >
      {deleting ? "Deleting..." : "Delete"}
    </button>
  );
}