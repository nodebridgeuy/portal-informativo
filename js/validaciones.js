document.addEventListener('DOMContentLoaded', () => {
  const formulario = document.querySelector('.form')
  const radiosClasificacion = formulario.querySelectorAll(
    'input[name="clasificacion"]',
  )
  const selectLugar = document.getElementById('place')
  const selectProfesional = document.getElementById('profesional')
  const textareaComentario = document.getElementById('comentario')

  const errorClasificacion = document.getElementById('error-clasificacion')
  const errorLugar = document.getElementById('error-place')
  const errorProfesional = document.getElementById('error-profesional')
  const errorComentario = document.getElementById('error-comentario')

  const limite = 200

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault()

    limpiarErrores()

    let formularioValido = true
    let primerCampoConError = null

    const hayClasificacion = Array.from(radiosClasificacion).some(
      (radio) => radio.checked,
    )
    if (!hayClasificacion) {
      errorClasificacion.textContent =
        'Debe seleccionar una calificación del 1 al 5.'
      formularioValido = false
      primerCampoConError = primerCampoConError || radiosClasificacion[0]
    }

    if (selectLugar.value === '') {
      errorLugar.textContent = 'Debe indicar dónde recibió la atención.'
      selectLugar.classList.add('input__error')
      formularioValido = false
      primerCampoConError = primerCampoConError || selectLugar
    }

    if (selectProfesional.value === '') {
      errorProfesional.textContent = 'Debe indicar quién lo atendió.'
      selectProfesional.classList.add('input__error')
      formularioValido = false
      primerCampoConError = primerCampoConError || selectProfesional
    }

    const comentario = textareaComentario.value.trim()
    if (comentario.length > limite) {
      errorComentario.textContent = `El comentario no puede superar los ${limite} caracteres (tiene ${comentario.length}).`
      textareaComentario.classList.add('input__error')
      formularioValido = false
      primerCampoConError = primerCampoConError || textareaComentario
    }

    if (!formularioValido) {
      primerCampoConError.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      return
    }

    const datosEncuesta = {
      clasificacion: formulario.querySelector(
        'input[name="clasificacion"]:checked',
      ).value,
      lugar: selectLugar.value,
      profesional: selectProfesional.value,
      comentario: textareaComentario.value.trim(),
      sitio_web: formulario.querySelector('input[name="sitio_web"]').value,
    }

    fetch(`${window.PORTAL_CONFIG.BACKEND_URL}/guardar_encuesta.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datosEncuesta),
    })
      .then((respuesta) =>
        respuesta.json().then((datos) => ({ ok: respuesta.ok, datos })),
      )
      .then(({ ok, datos }) => {
        if (ok && datos.estado === 'exito') {
          alert('¡Gracias! Su encuesta fue guardada con éxito.')
          formulario.reset()
        } else {
          alert(datos.mensaje || 'No se pudo guardar la encuesta.')
        }
      })
      .catch((error) => {
        console.error('Error de conexión:', error)
        alert('Hubo un problema al enviar la encuesta.')
      })
  })

  selectLugar.addEventListener('change', () =>
    limpiarErrorDe(selectLugar, errorLugar),
  )
  selectProfesional.addEventListener('change', () =>
    limpiarErrorDe(selectProfesional, errorProfesional),
  )
  radiosClasificacion.forEach((radio) =>
    radio.addEventListener('change', () =>
      limpiarErrorDe(null, errorClasificacion),
    ),
  )

  function limpiarErrorDe(campo, contenedorError) {
    contenedorError.textContent = ''
    if (campo) {
      campo.classList.remove('input__error')
    }
  }

  function limpiarErrores() {
    ;[
      errorClasificacion,
      errorLugar,
      errorProfesional,
      errorComentario,
    ].forEach((el) => {
      el.textContent = ''
    })
    ;[selectLugar, selectProfesional, textareaComentario].forEach((el) =>
      el.classList.remove('input__error'),
    )
  }
})
