// Encuestas del portal: el paciente elige sector y encuesta, y las preguntas se dibujan solas
// según lo que armó el administrador en el gestor. Todo el texto se inserta con textContent
// (nunca como HTML), así que nada de lo que venga del servidor puede ejecutar código.
document.addEventListener('DOMContentLoaded', () => {
  const BACKEND = window.PORTAL_CONFIG.BACKEND_URL
  const LIMITE_TEXTO = 500
  const ETIQUETAS_ESCALA = ['Muy insatisfecho', 'Muy satisfecho']

  const estado = document.getElementById('estado-encuestas')
  const formulario = document.getElementById('form-encuesta')
  const selectSector = document.getElementById('sector')
  const selectEncuesta = document.getElementById('encuesta')
  const campoEncuesta = document.getElementById('campo-encuesta')
  const intro = document.getElementById('intro-encuesta')
  const tituloEncuesta = document.getElementById('titulo-encuesta')
  const descripcionEncuesta = document.getElementById('descripcion-encuesta')
  const contenedorPreguntas = document.getElementById('preguntas')
  const pie = document.getElementById('pie-formulario')
  const errorSector = document.getElementById('error-sector')
  const errorEncuesta = document.getElementById('error-encuesta')

  let sectores = []
  let encuestaActual = null

  cargarEncuestas()

  function cargarEncuestas() {
    fetch(`${BACKEND}/obtener_encuestas.php`)
      .then((r) => r.json().then((datos) => ({ ok: r.ok, datos })))
      .then(({ ok, datos }) => {
        if (!ok || datos.estado !== 'exito') {
          throw new Error('Respuesta inválida')
        }
        sectores = datos.sectores || []
        if (sectores.length === 0) {
          estado.textContent =
            'Por el momento no hay encuestas disponibles. Vuelva a intentarlo más adelante.'
          return
        }
        estado.hidden = true
        llenarSectores()
        formulario.hidden = false
      })
      .catch((error) => {
        console.error('No se pudieron cargar las encuestas:', error)
        estado.textContent =
          'No se pudieron cargar las encuestas. Intente nuevamente en unos minutos.'
      })
  }

  function agregarOpcion(select, valor, texto) {
    const opcion = document.createElement('option')
    opcion.value = valor
    opcion.textContent = texto
    select.appendChild(opcion)
  }

  function llenarSectores() {
    sectores.forEach((s, i) => agregarOpcion(selectSector, String(i), s.nombre))
    if (sectores.length === 1) {
      selectSector.value = '0'
      alElegirSector()
    }
  }

  function limpiarPreguntas() {
    encuestaActual = null
    intro.hidden = true
    pie.hidden = true
    contenedorPreguntas.replaceChildren()
  }

  function alElegirSector() {
    errorSector.textContent = ''
    errorEncuesta.textContent = ''
    limpiarPreguntas()
    selectEncuesta.replaceChildren()
    agregarOpcion(selectEncuesta, '', 'Seleccione una encuesta...')
    selectEncuesta.options[0].disabled = true

    const sector = sectores[Number(selectSector.value)]
    if (!sector) {
      campoEncuesta.hidden = true
      return
    }
    sector.encuestas.forEach((e, i) => agregarOpcion(selectEncuesta, String(i), e.titulo))

    if (sector.encuestas.length === 1) {
      campoEncuesta.hidden = true
      selectEncuesta.value = '0'
      mostrarEncuesta(sector.encuestas[0])
    } else {
      campoEncuesta.hidden = false
      selectEncuesta.selectedIndex = 0
    }
  }

  function alElegirEncuesta() {
    errorEncuesta.textContent = ''
    const sector = sectores[Number(selectSector.value)]
    const encuesta = sector && sector.encuestas[Number(selectEncuesta.value)]
    if (encuesta) {
      mostrarEncuesta(encuesta)
    }
  }

  selectSector.addEventListener('change', alElegirSector)
  selectEncuesta.addEventListener('change', alElegirEncuesta)

  function mostrarEncuesta(encuesta) {
    encuestaActual = encuesta
    tituloEncuesta.textContent = encuesta.titulo
    descripcionEncuesta.textContent = encuesta.descripcion || ''
    descripcionEncuesta.hidden = !encuesta.descripcion
    intro.hidden = false

    contenedorPreguntas.replaceChildren()
    encuesta.preguntas.forEach((p) => contenedorPreguntas.appendChild(crearPregunta(p)))
    pie.hidden = false
  }

  /* ---------- Dibujo de cada tipo de pregunta ---------- */

  function crearPregunta(p) {
    const campo = document.createElement('div')
    campo.className = 'form__field column'
    campo.dataset.pregunta = String(p.id)

    const idCampo = `p_${p.id}`
    const idError = `error-${idCampo}`

    const enunciado = document.createElement(p.tipo === 'texto' ? 'label' : 'h5')
    enunciado.className = 'form__qn'
    enunciado.textContent = p.texto
    if (p.tipo === 'texto') {
      enunciado.htmlFor = idCampo
    }
    campo.appendChild(enunciado)

    const ayuda = document.createElement('p')
    ayuda.className = 'form__help'
    if (p.tipo === 'escala') {
      ayuda.textContent = '1 es muy insatisfecho y 5 muy satisfecho'
    } else if (!p.obligatoria) {
      ayuda.textContent = 'Opcional'
    }
    if (ayuda.textContent) {
      campo.appendChild(ayuda)
    }

    if (p.tipo === 'escala') {
      campo.appendChild(crearEscala(p, idCampo, idError))
    } else if (p.tipo === 'opcion') {
      campo.appendChild(crearOpciones(p, idCampo, idError))
    } else {
      const area = document.createElement('textarea')
      area.name = idCampo
      area.id = idCampo
      area.placeholder = 'Escriba aquí su respuesta...'
      area.setAttribute('aria-describedby', idError)
      campo.appendChild(area)
    }

    const error = document.createElement('p')
    error.className = 'form__error-msg'
    error.id = idError
    error.setAttribute('aria-live', 'polite')
    campo.appendChild(error)
    return campo
  }

  function crearRadio(nombre, valor, idError) {
    const radio = document.createElement('input')
    radio.type = 'radio'
    radio.name = nombre
    radio.value = valor
    radio.setAttribute('aria-describedby', idError)
    radio.addEventListener('change', () => {
      document.getElementById(idError).textContent = ''
    })
    return radio
  }

  function crearEscala(p, idCampo, idError) {
    const contenedor = document.createElement('section')
    contenedor.className = 'form__options-container'

    const opciones = document.createElement('div')
    opciones.className = 'form__options'
    for (let n = 1; n <= 5; n++) {
      const etiqueta = document.createElement('label')
      etiqueta.className = 'form__option'
      etiqueta.appendChild(crearRadio(idCampo, String(n), idError))
      etiqueta.appendChild(document.createTextNode(String(n)))
      opciones.appendChild(etiqueta)
    }
    contenedor.appendChild(opciones)

    const ayuda = document.createElement('section')
    ayuda.className = 'form__options-help'
    ETIQUETAS_ESCALA.forEach((texto) => {
      const t = document.createElement('p')
      t.textContent = texto
      ayuda.appendChild(t)
    })
    contenedor.appendChild(ayuda)
    return contenedor
  }

  function crearOpciones(p, idCampo, idError) {
    const lista = document.createElement('div')
    lista.className = 'form__choices'
    ;(p.opciones || []).forEach((texto) => {
      const etiqueta = document.createElement('label')
      etiqueta.className = 'form__choice'
      etiqueta.appendChild(crearRadio(idCampo, texto, idError))
      etiqueta.appendChild(document.createTextNode(texto))
      lista.appendChild(etiqueta)
    })
    return lista
  }

  /* ---------- Validación y envío ---------- */

  function valorDe(p) {
    const nombre = `p_${p.id}`
    if (p.tipo === 'texto') {
      return document.getElementById(nombre).value.trim()
    }
    const marcado = formulario.querySelector(`input[name="${nombre}"]:checked`)
    return marcado ? marcado.value : ''
  }

  function ponerError(idError, mensaje) {
    document.getElementById(idError).textContent = mensaje
  }

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault()
    errorSector.textContent = ''
    errorEncuesta.textContent = ''
    formulario
      .querySelectorAll('[id^="error-p_"]')
      .forEach((e) => (e.textContent = ''))

    let primerError = null
    const marcar = (idError, mensaje) => {
      ponerError(idError, mensaje)
      primerError = primerError || document.getElementById(idError)
    }

    if (selectSector.value === '') {
      marcar('error-sector', 'Debe elegir un sector.')
    } else if (!encuestaActual) {
      marcar('error-encuesta', 'Debe elegir la encuesta que desea responder.')
    }

    const respuestas = {}
    if (encuestaActual) {
      encuestaActual.preguntas.forEach((p) => {
        const valor = valorDe(p)
        const idError = `error-p_${p.id}`
        if (valor === '') {
          if (p.obligatoria) {
            marcar(idError, p.tipo === 'texto' ? 'Esta respuesta es obligatoria.' : 'Debe elegir una opción.')
          }
          return
        }
        if (p.tipo === 'texto' && valor.length > LIMITE_TEXTO) {
          marcar(idError, `El texto no puede superar los ${LIMITE_TEXTO} caracteres (tiene ${valor.length}).`)
          return
        }
        respuestas[String(p.id)] = valor
      })
      if (!primerError && Object.keys(respuestas).length === 0) {
        marcar('error-encuesta', 'Responda al menos una pregunta.')
      }
    }

    if (primerError) {
      if (primerError.scrollIntoView) {
        primerError.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    const boton = formulario.querySelector('button[type="submit"]')
    boton.disabled = true

    fetch(`${BACKEND}/guardar_encuesta.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        encuesta: encuestaActual.id,
        respuestas,
        sitio_web: formulario.querySelector('input[name="sitio_web"]').value,
      }),
    })
      .then((r) => r.json().then((datos) => ({ ok: r.ok, status: r.status, datos })))
      .then(({ ok, status, datos }) => {
        if (ok && datos.estado === 'exito') {
          alert('¡Gracias! Su respuesta fue enviada con éxito.')
          mostrarEncuesta(encuestaActual)   // vuelve a dejar la encuesta en blanco
          return
        }
        alert(datos.mensaje || 'No se pudo enviar la respuesta.')
        if (status === 404) {
          window.location.reload()   // la encuesta ya no está disponible: se actualiza la lista
        }
      })
      .catch((error) => {
        console.error('Error de conexión:', error)
        alert('Hubo un problema al enviar la respuesta.')
      })
      .finally(() => {
        boton.disabled = false
      })
  })
})
