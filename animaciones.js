// Animaciones de Chiik News. El contenido ya está completo en el HTML:
// si este archivo no carga o falla, la página se lee igual.
// Es un script normal, no un módulo, para que funcione también con doble clic.
(function () {
  'use strict';

  const suavizar = (t) => 1 - (1 - t) ** 3;
  const limitar = (v, min, max) => Math.min(Math.max(v, min), max);

  const formatoQuetzal = (valor) => `Q${valor.toFixed(2)}`;
  const formatoAnio = (valor) => String(Math.round(valor));

  function interpolar(desde, hasta, t) {
    if (t >= 1) return hasta;
    return desde + (hasta - desde) * suavizar(Math.max(t, 0));
  }

  // 0 mientras la sección está bajo la pantalla; 1 cuando ya subió a su lugar.
  function progresoAnio(topeSeccion, altoPantalla) {
    return limitar((altoPantalla - topeSeccion) / (altoPantalla * 0.75), 0, 1);
  }

  function animarNumero(el, { desde, hasta, formato, duracion, retraso = 0 }) {
    let inicio = null;
    const paso = (ahora) => {
      if (inicio === null) inicio = ahora + retraso;
      const t = (ahora - inicio) / duracion;
      el.textContent = formato(interpolar(desde, hasta, t));
      if (t < 1) requestAnimationFrame(paso);
    };
    el.textContent = formato(desde);
    requestAnimationFrame(paso);
    // Protección: si el navegador pausa los cuadros, la cifra real queda igual.
    setTimeout(() => { el.textContent = formato(hasta); }, retraso + duracion + 150);
  }

  // Sin márgenes negativos: un elemento al final de la página debe poder
  // activarse aunque el monitor sea muy alto.
  function alEntrar(elementos, accion) {
    const observador = new IntersectionObserver((entradas) => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue;
        observador.unobserve(entrada.target);
        accion(entrada.target);
      }
    });
    elementos.forEach((el) => observador.observe(el));
  }

  function animarPrecios() {
    alEntrar(document.querySelectorAll('[data-precio]'), (el) => {
      const hasta = Number(el.dataset.precio);
      const hermanos = [...el.closest('ul').children];
      const retraso = hermanos.indexOf(el.closest('li')) * 90;
      animarNumero(el, { desde: 0, hasta, formato: formatoQuetzal, duracion: 1300, retraso });
      el.closest('li').querySelector('.movimiento')?.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }],
        { duration: 600, delay: 1300 + retraso, easing: 'ease-out' },
      );
    });
  }

  // Solo se ocultan elementos que aún están bajo la primera pantalla,
  // para que nadie vea desaparecer contenido que ya estaba leyendo.
  function revelarSecciones() {
    const selector = '.comparacion, .precio, .que-ver, .tendencias-titulo, .tendencia, .tablero > .nota, .contador-claro, .pieza-cuerpo, .banda-texto, .historia-columnas > div, .historia-fuentes, .tarjeta-chiik, .chiik-contenido > .contador';
    const pendientes = [...document.querySelectorAll(selector)].filter(
      (el) => el.getBoundingClientRect().top > window.innerHeight,
    );
    pendientes.forEach((el) => {
      const hermanos = [...el.parentElement.children];
      el.style.transitionDelay = `${Math.min(hermanos.indexOf(el), 5) * 70}ms`;
      el.classList.add('revelar');
    });
    alEntrar(pendientes, (el) => el.classList.add('visible'));
  }

  function revelarFotos() {
    const fotos = [...document.querySelectorAll('.foto-revelar')].filter(
      (el) => el.getBoundingClientRect().top > window.innerHeight * 0.9,
    );
    fotos.forEach((el) => el.classList.add('esperando'));
    alEntrar(fotos, (el) => el.classList.remove('esperando'));
  }

  function animarTendencias() {
    const graficas = [...document.querySelectorAll('.columnas')];
    graficas.forEach((g) => g.classList.add('esperando'));
    alEntrar(graficas, (g) => g.classList.remove('esperando'));
  }

  function animarTitulo() {
    document.querySelectorAll('[data-palabras]').forEach((h) => {
      const palabras = h.textContent.trim().split(/\s+/);
      h.setAttribute('aria-label', h.textContent.trim());
      h.textContent = '';
      palabras.forEach((palabra, i) => {
        const marco = document.createElement('span');
        marco.className = 'palabra';
        marco.setAttribute('aria-hidden', 'true');
        const interior = document.createElement('span');
        interior.textContent = palabra;
        marco.append(interior);
        h.append(marco, ' ');
        interior.animate(
          [{ transform: 'translateY(110%)' }, { transform: 'none' }],
          { duration: 900, delay: 150 + i * 170, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' },
        );
      });
    });
  }

  function saltoDelPollo(img, retraso = 0) {
    img.animate(
      [
        { transform: 'translateY(0)' },
        { transform: 'translateY(-14px)' },
        { transform: 'translateY(0)' },
        { transform: 'translateY(-6px)' },
        { transform: 'translateY(0)' },
      ],
      { duration: 800, delay: retraso, easing: 'ease-in-out' },
    );
  }

  function animarPollo() {
    const encabezado = document.querySelector('.marca img');
    if (encabezado) saltoDelPollo(encabezado, 900);
    alEntrar(document.querySelectorAll('.pollo-chiik'), (img) => saltoDelPollo(img, 400));
  }

  // Todo lo que depende del desplazamiento se calcula en un solo cuadro.
  function animarConDesplazamiento() {
    const capas = [...document.querySelectorAll('[data-parallax]')].map((el) => ({
      el,
      fuerza: Number(el.dataset.parallax),
    }));
    const anios = [...document.querySelectorAll('[data-anio]')];
    const inicioAnio = anios.map((a) => a.closest('.historia-cabeza') ?? a);

    const carril = document.createElement('div');
    carril.className = 'progreso';
    carril.setAttribute('aria-hidden', 'true');
    const barra = document.createElement('div');
    barra.className = 'progreso-barra';
    const pollo = document.createElement('img');
    pollo.className = 'progreso-pollo';
    pollo.src = document.body.dataset.pollo;
    pollo.alt = '';
    carril.append(barra, pollo);
    document.body.prepend(carril);

    let pendiente = false;
    let quieto = null;
    const actualizar = () => {
      pendiente = false;
      const alto = window.innerHeight;
      const total = document.documentElement.scrollHeight - alto;
      const avance = total > 0 ? limitar(window.scrollY / total, 0, 1) : 0;
      barra.style.transform = `scaleX(${avance})`;
      pollo.style.left = `calc(${avance * 100}% - ${avance * 34}px)`;
      pollo.classList.toggle('activo', window.scrollY > 60);

      for (const { el, fuerza } of capas) {
        const caja = el.parentElement.getBoundingClientRect();
        if (caja.bottom < -100 || caja.top > alto + 100) continue;
        const centro = caja.top + caja.height / 2 - alto / 2;
        el.style.transform = `translate3d(0, ${(-centro * fuerza).toFixed(1)}px, 0)`;
      }

      anios.forEach((a, i) => {
        const p = progresoAnio(inicioAnio[i].getBoundingClientRect().top, alto);
        a.textContent = formatoAnio(interpolar(Number(a.dataset.desde), Number(a.dataset.anio), p));
      });
    };
    const solicitar = () => {
      pollo.classList.add('corriendo');
      clearTimeout(quieto);
      quieto = setTimeout(() => pollo.classList.remove('corriendo'), 180);
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(actualizar);
    };
    window.addEventListener('scroll', solicitar, { passive: true });
    window.addEventListener('resize', solicitar, { passive: true });
    window.addEventListener('load', actualizar);
    window.addEventListener('beforeprint', () => {
      anios.forEach((a) => { a.textContent = a.dataset.anio; });
    });
    actualizar();
  }

  function iniciar() {
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducido || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
    document.documentElement.classList.add('con-movimiento');
    animarTitulo();
    animarPollo();
    revelarFotos();
    revelarSecciones();
    animarTendencias();
    animarPrecios();
    animarConDesplazamiento();
  }

  if (typeof document !== 'undefined') {
    iniciar();
  } else if (typeof module !== 'undefined') {
    module.exports = { formatoQuetzal, formatoAnio, interpolar, progresoAnio };
  }
})();
