type CardProps = {
  children: React.ReactNode;
};

export default function Card({ children }: CardProps) {
  return (
    <div className="
      bg-[#111111]
      rounded-2xl
      overflow-hidden
      border border-[#D4AF37]/20
      transition-all
      duration-500
      hover:border-[#D4AF37]
      hover:-translate-y-3
      hover:shadow-[0_0_30px_rgba(212,175,55,0.25)]
    ">
      {children}
    </div>
  );
}