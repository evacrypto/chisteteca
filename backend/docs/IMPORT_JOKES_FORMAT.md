# Formato JSON para importar chistes a Chisteteca

## Formato recomendado (simple)

Cada chiste es un objeto con estos campos:

```json
[
  {
    "text": "¿Por qué los programadores confunden Halloween con Navidad? Porque 31 OCT = 25 DEC",
    "categoryName": "Chistes de programadores"
  },
  {
    "text": "Jaimito llega a clase y la profesora le pregunta: ¿Qué es un polígono? Jaimito responde: Un loro que habla mucho.",
    "categoryName": "Chistes de Jaimito"
  },
  {
    "text": "Otro chiste aquí...",
    "categoryName": "Humor absurdo"
  }
]
```

### Campos

| Campo        | Tipo   | Requerido | Descripción                                                                 |
|-------------|--------|-----------|-----------------------------------------------------------------------------|
| `text`      | string | **Sí**    | El texto del chiste. Es el contenido principal.                             |
| `categoryName` | string | No     | Nombre de la categoría. Si existe en Chisteteca, se asocia. Si no, se crea. |
| `categoryNames` | array  | No     | Varias categorías: `["Chistes de Jaimito", "Humor absurdo"]`                 |

- Si usas `categoryName` y la categoría no existe, se crea con emoji por defecto.
- Si usas `categoryNames`, el chiste se asocia a varias categorías.
- Si no indicas categoría, el chiste se importa sin categorías.

---

## Formato alternativo (avanzado)

Si ya tienes IDs de MongoDB de usuarios y categorías:

```json
[
  {
    "text": "Texto del chiste",
    "title": "Título (opcional, si no se usa el inicio del texto)",
    "authorId": "507f1f77bcf86cd799439011",
    "categoryIds": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
    "isApproved": true
  }
]
```

| Campo        | Tipo   | Descripción                                              |
|-------------|--------|----------------------------------------------------------|
| `text`      | string | Texto del chiste (requerido)                             |
| `title`     | string | Opcional. Si no se indica, se usa el inicio del texto.   |
| `authorId`  | string | ObjectId de un usuario existente en Chisteteca           |
| `categoryIds` | array | ObjectIds de categorías existentes                       |
| `isApproved` | boolean | Si el chiste debe aparecer publicado (default: false)   |

---

## Ejemplo completo (formato simple)

Guarda tu archivo como `jokes-import.json`:

```json
[
  {
    "text": "- ¿Por qué los programadores prefieren el modo oscuro? - Porque la luz atrae los bugs.",
    "categoryName": "Chistes de programadores"
  },
  {
    "text": "La profesora: Jaimito, ¿cuánto es 2+2? Jaimito: 4. La profesora: ¡Muy bien! Jaimito: ¿Y cuánto es 2+2+2? La profesora: 6. Jaimito: Entonces 2+2 no es 4, es 2+2.",
    "categoryName": "Chistes de Jaimito"
  },
  {
    "text": "Un hombre entra a una librería y pregunta: ¿Tienen libros sobre paranoia? El vendedor: Sí, pero están detrás de usted.",
    "categoryNames": ["Chistes malos", "Humor absurdo"]
  }
]
```

---

## Cómo importar

1. Prepara tu archivo JSON con el formato anterior.
2. Colócalo en `backend/data/jokes-import.json` (o la ruta que uses).
3. Ejecuta: `node backend/src/utils/import-jokes.js`

El script usará el primer usuario admin como autor de los chistes importados (o creará un usuario "importador" si hace falta).
