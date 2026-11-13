import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Snowflake, Star } from "lucide-react";
import { loadCompletedDays } from "@/lib/completed-days";
import type { Day } from "@/lib/days";

export function Door({ day, index }: { day: Day; index: number }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDone(loadCompletedDays(window.localStorage).includes(day.day));
  }, [day.day]);
  const delay = `${-((index * 0.37) % 4)}s`;

  const handleOpen = () => {
    if (open) return;
    setOpen(true);
    window.setTimeout(() => {
      navigate({ to: "/dia/$dia", params: { dia: String(day.day) } });
    }, 1000);
  };

  return (
    <button
      type="button"
      onClick={handleOpen}
      data-open={open}
      aria-label={done ? `Abrir puerta ${day.day} (completada)` : `Abrir puerta ${day.day}`}
      className="door-cell relative block w-full cursor-pointer pt-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring rounded-2xl"
      style={{ "--delay": delay } as React.CSSProperties}
    >
      <div className="relative ml-[2%] aspect-[3/4] w-[64%]">
        <div className="doorway absolute inset-0 grid place-items-center overflow-hidden">
          {open && (
            <img
              src={day.sticker}
              alt=""
              className="door-inner-sticker w-[78%]"
              draggable={false}
            />
          )}
        </div>

        <div className="door-leaf absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <Snowflake className="relative h-[16%] w-[16%] text-snow drop-shadow" strokeWidth={2.5} />
          <span className="door-number relative text-[clamp(1.5rem,4.2vw,2.6rem)] leading-none">
            {day.day}
          </span>
          <span className="door-knob absolute right-[9%] top-[56%] h-[7%] w-[11%] rounded-full" />
        </div>

        {done && (
          <span className="door-done absolute -left-[10%] -top-[4%] z-10 grid h-[24%] w-[32%] place-items-center rounded-full" aria-hidden>
            <Star className="h-[60%] w-[60%]" strokeWidth={2.5} />
          </span>
        )}

        <div className="door-snow absolute -left-[8%] -right-[8%] -top-[5%] h-[12%]" />
      </div>

      <img
        src={day.sticker}
        alt=""
        draggable={false}
        loading="lazy"
        className="door-sticker pointer-events-none absolute -right-[6%] bottom-0 w-[46%] select-none"
        style={{ "--delay": delay } as React.CSSProperties}
      />
    </button>
  );
}
