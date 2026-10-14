/* eslint-disable react-hooks/refs */
// Leer y escribir un ref durante el render rompe la pureza del componente, y el linter lo marca.
// Aquí lo hacemos A PROPÓSITO y solo con fines didácticos: contar cuántas veces se renderiza
// un componente. No uses este patrón en código de producción.
import { useRef } from 'react';

export function useRenderCount() {
  const renders = useRef(0);
  renders.current += 1;
  return renders.current;
}
