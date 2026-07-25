import Link from "next/link";

type ButtonProps = {
  text: string;
  variant?: "primary" | "secondary";
  href?: string;
};

export default function Button({
  text,
  variant = "primary",
  href,
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:-translate-y-1";

  const variants = {
    primary:
      "bg-[#D4AF37] text-black hover:bg-yellow-400 hover:shadow-[0_0_25px_rgba(212,175,55,0.35)]",

    secondary:
      "border-2 border-[#D4AF37] text-[#D4AF37] bg-transparent hover:bg-[#D4AF37] hover:text-black",
  };

  const className = `${baseStyles} ${variants[variant]}`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {text}
      </Link>
    );
  }

  return (
    <button className={className}>
      {text}
    </button>
  );
}