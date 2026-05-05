# Organizador Marco 2.6

Proyecto web simple para abrir en Visual Studio Code o Visual Studio.

## Cómo ejecutar

Opción rápida:
1. Abre la carpeta `organizador_marco_v2_6` en Visual Studio Code.
2. Instala la extensión **Live Server**.
3. Clic derecho sobre `index.html` → **Open with Live Server**.

También puedes abrir `index.html` directo en el navegador.

## Qué incluye

- Login libre en fase de construcción.
- Modo Administrador / Alumno.
- Carreras y secciones.
- Grupos por sección.
- Panel principal con Scrum, Calendario, Apuntes, Lista, Lista Negra, Sorteo y Encuestas.
- Scrum tipo Kanban con:
  - agregar tarea
  - modificar tarea
  - eliminar tarea
  - mover tarea
  - agregar columna
  - renombrar columna
  - eliminar columna
- Datos guardados en `localStorage` del navegador.

## Estructura

```txt
organizador_marco_v2_6/
├── index.html
├── pages/
│   ├── carreras.html
│   ├── grupos.html
│   └── panel.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── data.js
│   ├── carreras.js
│   ├── grupos.js
│   └── panel.js
└── README.md
```
