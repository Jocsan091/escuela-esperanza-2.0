import { imagenNoticiaPredeterminada, noticiasSeed } from "../data/noticias";

export function sortByDateDesc<T extends { fecha: string }>(items: T[]) {
  return [...items].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );
}

export function listarNoticiasPublicas() {
  return sortByDateDesc(noticiasSeed.filter((noticia) => noticia.publicada));
}

export function listarNoticiasAdmin() {
  return sortByDateDesc(noticiasSeed);
}

export function listarUltimasNoticias(limit = 3) {
  return listarNoticiasPublicas().slice(0, limit);
}

export function getNewsImage(image: string) {
  return image || imagenNoticiaPredeterminada;
}

export function formatNewsDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

export function truncateNewsText(text: string, maxLength = 150) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}
