import Image from "next/image";

export function SectionHeading({ eyebrow, title, description, light = false }: { eyebrow: string; title: string; description?: string; light?: boolean }) {
  return <div><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#4F8F68]">{eyebrow}</p><h2 className={`max-w-2xl text-3xl font-bold leading-tight tracking-tight md:text-4xl ${light ? "text-white" : "text-[#1a2e1f]"}`}>{title}</h2>{description && <p className={`mt-5 max-w-2xl text-sm leading-7 ${light ? "text-[#a3b8aa]" : "text-[#6b7280]"}`}>{description}</p>}</div>;
}

export function CoverImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 50vw" className={`object-cover ${className}`} />;
}
