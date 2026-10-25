const BASE_URL_BACKEND = window.PORTAL_CONFIG.BACKEND_URL

const ICONO_VER = `
  <svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 16 16" fill="currentColor">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M0 8L3.07945 4.30466C4.29638 2.84434 6.09909 2 8 2C9.90091 2 11.7036 2.84434 12.9206 4.30466L16 8L12.9206 11.6953C11.7036 13.1557 9.90091 14 8 14C6.09909 14 4.29638 13.1557 3.07945 11.6953L0 8ZM8 11C9.65685 11 11 9.65685 11 8C11 6.34315 9.65685 5 8 5C6.34315 5 5 6.34315 5 8C5 9.65685 6.34315 11 8 11Z"/>
  </svg>
`

const ICONO_DESCARGAR = `
  <svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 24 24" fill="none">
    <path d="M12 3V16M12 16L16 11.625M12 16L8 11.625" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M15 21H9C6.17157 21 4.75736 21 3.87868 20.1213C3 19.2426 3 17.8284 3 15M21 15C21 17.8284 21 19.2426 20.1213 20.1213C19.8215 20.4211 19.4594 20.6186 19 20.7487" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`

document.addEventListener('DOMContentLoaded', () => {
  const tituloCategoria = document.querySelector('.main__title')
  const contenedor = document.getElementById('lista-documentos')

  if (!tituloCategoria || !contenedor) {
    console.error(
      'Falta el <h3 class="main__title"> o el <div id="lista-documentos"> en esta página.',
    )
    return
  }

  const categoria = tituloCategoria.textContent.trim()

  // Lista completa que llegó del backend; la búsqueda filtra sobre esta copia.
  let todosLosDocumentos = []

  const formularioBusqueda = document.querySelector('.search')
  const campoBusqueda = document.querySelector('.search__input')

  contenedor.innerHTML = '<p class="file__mensaje">Cargando documentos...</p>'

  fetch(
    `${BASE_URL_BACKEND}/obtener_documentos.php?categoria=${encodeURIComponent(categoria)}`,
  )
    .then((respuesta) => respuesta.json())
    .then((datos) => {
      if (datos.estado !== 'exito') {
        contenedor.innerHTML =
          '<p class="file__mensaje">Hubo un problema al cargar los documentos.</p>'
        return
      }

      if (datos.documentos.length === 0) {
        contenedor.innerHTML =
          '<p class="file__mensaje">Todavía no hay documentos en esta categoría.</p>'
        return
      }

      todosLosDocumentos = datos.documentos
      mostrarDocumentos(todosLosDocumentos)
    })
    .catch((error) => {
      console.error('Error al cargar documentos:', error)
      contenedor.innerHTML =
        '<p class="file__mensaje">Hubo un problema al cargar los documentos.</p>'
    })

  // Quita tildes y mayúsculas para que "guia" encuentre "Guía general...".
  function normalizar(texto) {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  }

  function mostrarDocumentos(lista) {
    contenedor.innerHTML = ''
    lista.forEach((documento) => {
      contenedor.appendChild(crearFilaDocumento(documento))
    })
  }

  function filtrarDocumentos() {
    const termino = normalizar(campoBusqueda.value.trim())
    const coincidencias = todosLosDocumentos.filter((doc) =>
      normalizar(doc.titulo).includes(termino),
    )
    if (coincidencias.length === 0) {
      contenedor.innerHTML =
        '<p class="file__mensaje">No se encontraron documentos con esa búsqueda.</p>'
      return
    }
    mostrarDocumentos(coincidencias)
  }

  if (formularioBusqueda && campoBusqueda) {
    // Filtra mientras se escribe; el submit (Enter o lupa) no recarga la página.
    campoBusqueda.addEventListener('input', filtrarDocumentos)
    formularioBusqueda.addEventListener('submit', (evento) => {
      evento.preventDefault()
      filtrarDocumentos()
    })
  }

  function crearFilaDocumento(documento) {
    const urlVer = `${BASE_URL_BACKEND}/descargar_documento.php?id=${documento.id_documento}`
    const urlDescarga = `${urlVer}&descargar=1`

    const section = document.createElement('section')
    section.className = 'file__section'

    const nombre = document.createElement('p')
    nombre.className = 'file__name'
    nombre.textContent = documento.titulo
    section.appendChild(nombre)

    const botones = document.createElement('div')
    botones.className = 'file__btn-container'

    const linkVer = document.createElement('a')
    linkVer.href = urlVer
    linkVer.target = '_blank'
    linkVer.rel = 'noopener'
    linkVer.className = 'file__btn'
    linkVer.title = 'Ver'
    linkVer.innerHTML = ICONO_VER
    botones.appendChild(linkVer)

    const linkDescargar = document.createElement('a')
    linkDescargar.href = urlDescarga
    linkDescargar.setAttribute('download', '')
    linkDescargar.className = 'file__btn'
    linkDescargar.title = 'Descargar'
    linkDescargar.innerHTML = ICONO_DESCARGAR
    botones.appendChild(linkDescargar)

    section.appendChild(botones)
    return section
  }
})
