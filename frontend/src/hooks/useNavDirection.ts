import { useLocation } from "react-router-dom";
import { useRef, useEffect, useState } from "react";

/*
  Orden canónico de las tabs.
  El hook compara el índice de la ruta anterior vs la nueva
  para determinar si el usuario navega "hacia adelante" o "hacia atrás".
*/
const TAB_ORDER = ["/inicio", "/servicios", "/detalles", "/perfil"];

export type NavDirection = "forward" | "backward" | "none";

export function useNavDirection(): NavDirection {
  const location  = useLocation();
  const prevPath  = useRef<string>(location.pathname);
  const [dir, setDir] = useState<NavDirection>("none");

  useEffect(() => {
    const prev = prevPath.current;
    const next = location.pathname;

    if (prev === next) return;

    const prevIdx = TAB_ORDER.findIndex((p) => next !== p && prev.startsWith(p));
    const nextIdx = TAB_ORDER.findIndex((p) => next.startsWith(p));

    if (prevIdx === -1 || nextIdx === -1) {
      setDir("none");
    } else {
      setDir(nextIdx > prevIdx ? "forward" : "backward");
    }

    prevPath.current = next;
  }, [location.pathname]);

  return dir;
}