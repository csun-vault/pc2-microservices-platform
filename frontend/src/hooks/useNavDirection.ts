import { useLocation } from "react-router-dom";
import { useRef } from "react";

const TAB_ORDER = ["/inicio", "/servicios", "/detalles", "/perfil"];

export type NavDirection = "forward" | "backward" | "none";

function getIndex(path: string): number {
  return TAB_ORDER.findIndex((p) => path === p || path.startsWith(p + "/"));
}

/**
 * useNavDirection — cálculo síncrono puro.
 *
 * No usa useState ni useEffect.
 * Calcula la dirección durante el render comparando
 * el pathname actual con el anterior guardado en un ref.
 *
 * Esto garantiza que PageTransition recibe la dirección
 * correcta en el mismo render en que cambia la ruta,
 * sin condiciones de carrera ni resets asincrónicos.
 */
export function useNavDirection(): NavDirection {
  const location    = useLocation();
  const prevPathRef = useRef<string | null>(null);

  const prev = prevPathRef.current;
  const next = location.pathname;

  // Actualizamos el ref ANTES de retornar
  // para que la próxima llamada tenga el valor correcto
  prevPathRef.current = next;

  if (prev === null || prev === next) return "none";

  const prevIdx = getIndex(prev);
  const nextIdx = getIndex(next);

  if (prevIdx === -1 || nextIdx === -1) return "none";

  return nextIdx > prevIdx ? "forward" : "backward";
}