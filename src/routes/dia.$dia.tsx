import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import doorsBg from "@/assets/doors-background.jpg";
import { getDay } from "@/lib/days";

export const Route = createFileRoute("/dia/$dia")({
  loader: ({ params }) => {
    const day = getDay(params.dia);
    if (!day) throw notFound();
    return day;
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `Día ${loaderData.day} · Calendario de Adviento` : "Calendario de Adviento";
    const description = loaderData
      ? `La sorpresa detrás de la puerta ${loaderData.day} del calendario de Adviento.`
      : "Calendario de Adviento interactivo.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: DayPage,
});

function DayPage() {
  const day = Route.useLoaderData();

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center px-6 py-24">
      <img
        src={doorsBg}
        alt=""
        width={1920}
        height={1088}
        className="fixed inset-0 h-full w-full object-cover"
      />

      <Link
        to="/puertas"
        aria-label="Volver a las puertas"
        className="candy-button fixed left-5 top-20 z-30 grid h-14 w-14 place-items-center sm:left-8"
      >
        <ArrowLeft className="h-6 w-6" strokeWidth={3} />
      </Link>

      <div className="page-enter relative flex flex-col items-center gap-6">
        <span className="door-number text-[clamp(4rem,14vw,8rem)] leading-none">{day.day}</span>
        <img
          src={day.sticker}
          alt=""
          className="day-sticker w-[min(70vw,320px)]"
          draggable={false}
        />
        {/* Aquí va el contenido de cada día */}
      </div>
    </main>
  );
}
