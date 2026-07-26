"use client";

type SearchBarProps = {
  search: string;
  setSearch: (value: string) => void;
};

export default function SearchBar({
  search,
  setSearch,
}: SearchBarProps) {
  return (
    <div className="w-full mb-6">
      <input
        type="text"
        placeholder="🔍 Search by name, email or division..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="
          w-full
          bg-[#111111]
          border
          border-[#D4AF37]/20
          rounded-xl
          px-5
          py-4
          text-white
          placeholder:text-gray-500
          focus:outline-none
          focus:border-[#D4AF37]
          transition
        "
      />
    </div>
  );
}