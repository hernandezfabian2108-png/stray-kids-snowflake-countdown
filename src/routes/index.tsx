import { createFileRoute, Link } from "@tanstack/react-router";
import coverBg from "@/assets/cover-background.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Calendario de Adviento" },
      { name: "description", content: "Un calendario de Adviento interactivo con 24 puertas y stickers de Stray Kids." },
      { property: "og:title", content: "Calendario de Adviento" },
      { property: "og:description", content: "Un calendario de Adviento interactivo con 24 puertas y stickers de Stray Kids." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Cover,
});

function Cover() {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6">
      <img
        src={coverBg}
        alt=""
        width={1808}
        height={1024}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="page-enter relative flex flex-col items-center gap-12 pb-[12vh] text-center">
        <h1 className="cover-title text-[clamp(3rem,11vw,7.5rem)]">
          Calendario
          <br />
          de Adviento
        </h1>
        <Link
          to="/puertas"
          className="candy-button px-12 py-4 text-[clamp(1.25rem,3vw,1.75rem)]"
        >
          Continuar
        </Link>
      </div>
    </main>
  );
}
