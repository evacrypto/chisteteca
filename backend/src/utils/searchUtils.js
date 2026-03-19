/**
 * Convierte un término de búsqueda en regex que ignora acentos.
 * Ej: "medico" encuentra "médico", "Médico", etc.
 */
export const toAccentInsensitiveRegex = (str) => {
  const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const accentMap = {
    a: '[aáàâäãAÁÀÂÄÃ]', e: '[eéèêëEÉÈÊË]', i: '[iíìîïIÍÌÎÏ]',
    o: '[oóòôöõOÓÒÔÖÕ]', u: '[uúùûüUÚÙÛÜ]', n: '[nñNÑ]', c: '[cçCÇ]'
  };
  return str
    .split('')
    .map((c) => {
      const lower = c.toLowerCase();
      return accentMap[lower] || escapeRegex(c);
    })
    .join('');
};
