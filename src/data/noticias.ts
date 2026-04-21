export type Noticia = {
  id: number;
  fecha: string;
  imagen: string;
  contenido: string;
  publicada: boolean;
};

export const imagenNoticiaPredeterminada = "/images/slide3.png";

export const noticiasSeed: Noticia[] = [];
