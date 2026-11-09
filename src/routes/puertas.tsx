import { createFileRoute, Link } from "@tanstack/react-router";
import { Home } from "lucide-react";
import doorsBg from "@/assets/doors-background.jpg";
import { DAYS } from "@/lib/days";
import { Door } from "@/components/Door";

export const Route = createFileRoute("/puertas")({
  head: () => ({
    meta: [
      { title: "Las 24 puertas · Calendario de Adviento" },
      { name: "description", content: "Elige una puerta del calendario de Adviento y descubre su sorpresa." },
      { property: "og:title", content: "Las 24 puertas · Calendario de Adviento" },
      { property: "og:description", content: "Elige una puerta del calendario de Adviento y descubre su sorpresa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Doors,
});

function Doors() {
  return (
    <main className="relative min-h-svh">
      <img
        src={doorsBg}
        alt=""
        width={1920}
        height={1088}
        className="fixed inset-0 h-full w-full object-cover"
      />
      <Link
        to="/"
        aria-label="Volver al inicio"
        className="candy-button fixed left-5 top-20 z-30 grid h-14 w-14 place-items-center sm:left-8"
      >
        <Home className="h-6 w-6" strokeWidth={3} />
      </Link>
      <div className="page-enter relative mx-auto grid max-w-6xl grid-cols-3 gap-x-3 gap-y-6 px-4 pb-16 pt-40 sm:grid-cols-4 sm:gap-x-6 lg:grid-cols-6 lg:gap-y-8">
        {DAYS.map((day, i) => (
          <Door key={day.day} day={day} index={i} />
        ))}
      </div>
    </main>
  );
}
