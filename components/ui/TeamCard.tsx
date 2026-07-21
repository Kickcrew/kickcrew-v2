type TeamCardProps = {
  name: string;
  game: string;
};

export default function TeamCard({ name, game }: TeamCardProps) {
  return (
    <div className="bg-[#111111] border border-[#D4AF37] rounded-2xl p-6 hover:scale-105 transition duration-300">

      <div className="h-40 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-5xl">
        🎮
      </div>

      <h3 className="text-3xl text-[#D4AF37] mt-6">
        {name}
      </h3>

      <p className="text-gray-300 mt-2">
        {game}
      </p>

      <button className="mt-6 bg-[#D4AF37] text-black px-5 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition">
        View Team
      </button>

    </div>
  );
}