type SectionTitleProps = {
  eyebrow: string;
  title: string;
  description?: string;
  centered?: boolean;
};

export default function SectionTitle({
  eyebrow,
  title,
  description,
  centered = true,
}: SectionTitleProps) {
  return (
    <div className={centered ? "text-center mb-16" : "mb-12"}>
      <p className="uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
        {eyebrow}
      </p>

      <h2 className="text-5xl font-bold mt-4">
        {title}
      </h2>

      {description && (
        <p className="mt-6 max-w-3xl text-gray-400 leading-8 mx-auto">
          {description}
        </p>
      )}
    </div>
  );
}