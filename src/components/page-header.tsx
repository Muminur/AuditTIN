export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-8 border-b border-line pb-6">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="mt-2 font-display text-3xl font-bold text-paper sm:text-4xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-3 max-w-2xl text-pretty text-base text-paper/75">
          {subtitle}
        </p>
      )}
    </header>
  );
}
