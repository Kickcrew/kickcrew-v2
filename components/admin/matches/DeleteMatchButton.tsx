interface DeleteMatchButtonProps {
  onDelete: () => void;
}

export default function DeleteMatchButton({
  onDelete,
}: DeleteMatchButtonProps) {
  return (
    <button
      onClick={onDelete}
      className="bg-red-600 hover:bg-red-500 transition px-4 py-2 rounded-lg"
    >
      Delete
    </button>
  );
}