type ButtonProps = {
  text: string;
  variant?: "primary" | "secondary";
};

export default function Button({
  text,
  variant = "primary",
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:-translate-y-1";

  const variants = {
    primary:
      "bg-[#D4AF37] text-black hover:bg-yellow-400 hover:shadow-[0_0_25px_rgba(212,175,55,0.35)]",

    secondary:
      "border-2 border-[#D4AF37] text-[#D4AF37] bg-transparent hover:bg-[#D4AF37] hover:text-black",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]}`}>
      {text}
    </button>
  );
}