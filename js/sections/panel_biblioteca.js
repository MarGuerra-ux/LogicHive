// ======================================
// BIBLIOTECA
// ======================================

function initBiblioteca() {
  renderBiblioteca();
}

// ======================================
// RENDER
// ======================================

function renderBiblioteca() {
  const wrap = document.getElementById("bibliotecaWrap");
  if (!wrap) return;

  wrap.innerHTML = `
    <div class="card biblioteca-empty">

      <h2>📚 Biblioteca</h2>

      <p class="muted-text">
        Aquí aparecerán todos tus archivos:
        documentos, PDFs, imágenes, Excel,
        presentaciones y recursos generados
        por el Maquetador.
      </p>

      <div style="
        margin-top:20px;
        display:flex;
        gap:12px;
        flex-wrap:wrap;
      ">

        <button class="btn primary"
                onclick="alert('Próximamente')">
          Subir archivo
        </button>

        <button class="btn secondary"
                onclick="alert('Próximamente')">
          Nueva carpeta
        </button>

      </div>

    </div>
  `;
}