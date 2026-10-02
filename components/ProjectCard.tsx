import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/data/projects";

// Placeholders na paleta do site até as imagens reais chegarem (um por posição no grid)
const PLACEHOLDERS = [
  "bg-[radial-gradient(circle_at_25%_30%,color-mix(in_srgb,var(--accent)_35%,transparent),transparent_55%),linear-gradient(135deg,var(--surface),var(--bg))]",
  "bg-[radial-gradient(circle_at_75%_70%,color-mix(in_srgb,var(--muted)_60%,transparent),transparent_60%),linear-gradient(200deg,var(--surface),var(--bg))]",
  "bg-[radial-gradient(circle_at_60%_20%,color-mix(in_srgb,var(--accent)_25%,transparent),transparent_50%),radial-gradient(circle_at_20%_90%,color-mix(in_srgb,var(--muted)_45%,transparent),transparent_55%),linear-gradient(160deg,var(--bg),var(--surface))]",
];

export default function ProjectCard({
  title,
  description,
  stack,
  url,
  action,
  image,
  index = 0,
}: Project & { index?: number }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-muted/30 bg-surface/[0.18] backdrop-blur-[14px] transition duration-300 ease-out hover:-translate-y-1 hover:bg-surface/25 hover:backdrop-blur-[18px] hover:shadow-[0_10px_28px_-16px_color-mix(in_srgb,var(--accent)_18%,transparent)]">
      <div className="relative aspect-video border-b border-muted/30">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            // Pixel art: servida como está (o otimizador reamostraria e borraria os pixels)
            unoptimized={image.pixelated}
            className={`object-cover ${image.pixelated ? "[image-rendering:pixelated]" : ""}`}
            style={image.position ? { objectPosition: image.position } : undefined}
          />
        ) : (
          <div aria-hidden className={`absolute inset-0 ${PLACEHOLDERS[index % PLACEHOLDERS.length]}`} />
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-h3 font-semibold">{title}</h3>
        <p className="mt-2 text-fg/80">{description}</p>

        <ul className="mt-auto flex flex-wrap gap-2 pt-5" aria-label="Stack">
          {stack.map((tech) => (
            <li
              key={tech}
              className="rounded-full border border-transparent bg-surface px-3 py-1 text-small text-fg transition-colors hover:border-accent"
            >
              {tech}
            </li>
          ))}
        </ul>

        {(action || url) && (
          <div className="mt-5 flex flex-wrap gap-6">
            {action && (
              <Link
                href={action.href}
                className="inline-block rounded-md border border-accent px-5 py-2.5 text-small font-medium text-accent transition-colors hover:bg-accent/10"
              >
                {action.label}
              </Link>
            )}
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 text-small underline decoration-muted underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
              >
                Ver projeto
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
