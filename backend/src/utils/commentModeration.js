/**
 * Moderación de comentarios: detecta palabrotas, insultos y mensajes de odio.
 * Usa bad-words (inglés) + lista adicional en español.
 */
import { Filter } from 'bad-words';

const filter = new Filter();

// Palabras adicionales en español (insultos, palabrotas, términos ofensivos)
const SPANISH_BAD_WORDS = [
  'cabron', 'cabrón', 'cabrones', 'mierda', 'puta', 'puto', 'putas', 'putos',
  'coño', 'joder', 'gilipollas', 'imbecil', 'imbécil', 'idiota',
  'estupido', 'estúpido', 'tonto', 'maricon', 'maricón', 'maricones',
  'follate', 'follarte', 'follar', 'polla', 'pene', 'verga', 'pija',
  'zorra', 'zorro', 'perra', 'perro', 'asno', 'mamón', 'mamon',
  'hijoputa', 'hijo de puta', 'hija de puta', 'concha', 'concho',
  'carajo', 'chingar', 'chingada', 'chingado', 'pinche',
  'pendejo', 'pendeja', 'culero', 'culera'
];

filter.addWords(...SPANISH_BAD_WORDS);

/**
 * Comprueba si el texto contiene lenguaje inapropiado.
 * @param {string} text - Texto a revisar
 * @returns {boolean} - true si contiene palabrotas o contenido ofensivo
 */
export function containsProfanity(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (!trimmed) return false;
  return filter.isProfane(trimmed);
}
