/* ==========================================================================
   ADVANTIA · app.js v7.11
   Sistema de movimiento de pagina (CSS + JS vanilla, sin librerias):
   reveal en scroll con stagger, marquee de marketplaces, tabs de servicios
   con crossfade, count-up de KPIs y respeto total a prefers-reduced-motion.
   ========================================================================== */
(function () {
  'use strict';

  /* ---- HubSpot Forms API ---- */
  var HUBSPOT_URL = 'https://api.hsforms.com/submissions/v3/integration/submit/' +
    '51945405/dae4e966-b9aa-4fa3-b3bd-34ab743d6f10';
  // Estos valores deben coincidir con los valores internos de la propiedad
  // linea_de_interes_inicial en HubSpot. Si cambian allá, se cambian aquí.
  const LINEA_HUBSPOT = {
    "vitrina":    "Vitrina · Marketplaces",
    "trastienda": "Trastienda · Distribuidoras"
  };
  var CONSENT_TEXT = 'Acepto la Política de Tratamiento de Datos Personales de ADVANTIA';

  /* ---- GA4: eventos de conversión. Si gtag no cargó (bloqueadores, sin red), no pasa nada.
     Nombre propio: dentro de onReady ya existe una variable `track` (la cinta de marketplaces). ---- */
  function gaEvent(name, params) {
    if (typeof gtag !== 'function') return false;
    try { gtag('event', name, params); return true; } catch (e) { return false; }
  }
  // Clave de línea a partir de la etiqueta del select ("Vitrina · Marketplaces" -> vitrina)
  function lineaKey(value) { return (value || '').split(' ')[0].toLowerCase(); }

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = motionQuery.matches;

  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  onReady(function () {

    /* ---------------------------------------------------------------- Año */
    var yr = document.getElementById('yr');
    if (yr) yr.textContent = new Date().getFullYear();

    /* -------------------------------------------------------- Menú móvil */
    var burger = document.getElementById('burger');
    var menu = document.getElementById('navMenu');
    if (burger && menu) {
      burger.addEventListener('click', function () {
        var open = menu.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }

    /* ============================================================
       1. Reveal en scroll: fade + translateY(16px), 0.45s ease-out,
          stagger de 80ms entre hermanos, threshold 0.15, una sola vez.
       ============================================================ */

    // Los grupos se preparan aquí para no repetir marcado en las 5 páginas
    var GROUPS = ['.section-head', '.stats', '.ladder', '.grid-2', '.grid-3',
      '.dark-grid', '.team', '.hero-copy', '.contact-grid', '.faq', '.panel-copy'];

    GROUPS.forEach(function (sel) {
      [].slice.call(document.querySelectorAll(sel)).forEach(function (group) {
        // Si el grupo entero venía marcado, el reveal pasa a sus hijos
        group.classList.remove('rise', 'is-in');
        group.setAttribute('data-stagger', '');
        [].slice.call(group.children).forEach(function (child) {
          child.classList.add('rise');
        });
      });
    });

    var risers = [].slice.call(document.querySelectorAll('.rise'));

    if (reduce || !('IntersectionObserver' in window)) {
      risers.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      [].slice.call(document.querySelectorAll('[data-stagger]')).forEach(function (group) {
        [].slice.call(group.querySelectorAll(':scope > .rise')).forEach(function (el, i) {
          el.style.transitionDelay = (i * 80) + 'ms';
        });
      });
      var revealIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-in');
          revealIO.unobserve(e.target);
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -32px 0px' });
      risers.forEach(function (el) { revealIO.observe(el); });
    }

    /* ============================================================
       2. Banda de marketplaces en marquee: 40s, pausa en hover,
          contenido duplicado para que el loop sea continuo.
       ============================================================ */
    var marquee = document.querySelector('.marquee');
    if (marquee) {
      var track = marquee.querySelector('.marquee-track');
      var group = track && track.querySelector('.marquee-group');
      if (track && group) {
        if (reduce) {
          track.style.animation = 'none';
        } else {
          var clone = group.cloneNode(true);
          clone.setAttribute('aria-hidden', 'true');
          track.appendChild(clone);

          // Regla del sistema: una sola animación continua visible por viewport.
          // La cinta solo corre si está en pantalla y el CTA del hero no lo está.
          var heroCta = document.querySelector('.btn-conic');
          var state = { marquee: false, hero: false };
          function sync() {
            track.classList.toggle('is-paused', !state.marquee || state.hero);
          }
          new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { state.marquee = e.isIntersecting; });
            sync();
          }, { threshold: 0 }).observe(marquee);
          if (heroCta) {
            new IntersectionObserver(function (entries) {
              entries.forEach(function (e) { state.hero = e.isIntersecting; });
              sync();
            }, { threshold: 0 }).observe(heroCta);
          }
          sync();
        }
      }
    }

    /* ============================================================
       3. Tabs de servicios: crossfade de 0.3s entre paneles
       ============================================================ */
    var tablist = document.querySelector('.tabs');
    var panels = document.getElementById('tabpanels');
    if (tablist && panels) {
      var tabs = [].slice.call(tablist.querySelectorAll('.tab'));
      var panes = [].slice.call(panels.querySelectorAll('.tabpanel'));

      function fitHeight() {
        var active = panels.querySelector('.tabpanel.is-active');
        if (active) panels.style.height = active.offsetHeight + 'px';
      }

      function activate(index, focus) {
        tabs.forEach(function (t, i) {
          var on = i === index;
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          t.setAttribute('tabindex', on ? '0' : '-1');
        });
        panes.forEach(function (p, i) { p.classList.toggle('is-active', i === index); });
        fitHeight();
        if (focus) tabs[index].focus();
      }

      tabs.forEach(function (t, i) {
        t.addEventListener('click', function () { activate(i); });
        t.addEventListener('keydown', function (ev) {
          if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
          ev.preventDefault();
          activate((i + (ev.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length, true);
        });
      });

      fitHeight();
      window.addEventListener('resize', fitHeight);
      window.addEventListener('load', fitHeight);
      if ('ResizeObserver' in window) {
        panes.forEach(function (p) { new ResizeObserver(fitHeight).observe(p); });
      }
    }

    /* ============================================================
       4. Mapa de keywords: documento de 1100x560 escalado al contenedor.
          Se mantiene como iframe para no perder arrastre ni hover.
       ============================================================ */
    [].slice.call(document.querySelectorAll('.embed')).forEach(function (box) {
      var frame = box.querySelector('iframe');
      if (!frame) return;
      if (reduce) { frame.removeAttribute('src'); frame.remove(); return; }
      var baseW = parseFloat(box.dataset.baseWidth || '1100');
      var baseH = parseFloat(box.dataset.baseHeight || '560');
      var cover = box.dataset.fit === 'cover';
      function fit() {
        var sw = box.clientWidth / baseW;
        var sh = box.clientHeight / baseH;
        // "cover" evita banda muerta cuando el alto minimo supera la proporcion nativa
        var s = cover ? Math.max(sw, sh) : sw;
        var x = (box.clientWidth - baseW * s) / 2;
        var y = (box.clientHeight - baseH * s) / 2;
        frame.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + s + ')';
      }
      fit();
      window.addEventListener('resize', fit);
      if ('ResizeObserver' in window) new ResizeObserver(fit).observe(box);
    });

    /* ============================================================
       5. Videos reales: autoplay silencioso, o poster estático
          cuando el sistema pide movimiento reducido.
       ============================================================ */
    var demos = [].slice.call(document.querySelectorAll('video[data-demo]'));
    if (reduce) {
      // Con movimiento reducido no se descarga nada: se queda el poster
      demos.forEach(function (v) {
        v.removeAttribute('autoplay');
        v.removeAttribute('loop');
        try { v.pause(); } catch (e) { }
        while (v.firstChild) v.removeChild(v.firstChild);
        v.removeAttribute('src');
        v.load();
      });
    } else if (!('IntersectionObserver' in window)) {
      demos.forEach(function (v) { v.muted = true; var q = v.play(); if (q && q.catch) q.catch(function () { }); });
    } else {
      // preload="none": el archivo se pide al entrar en pantalla, no antes.
      // Fuera de pantalla se pausa para no gastar red ni bateria.
      var videoIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var v = e.target;
          if (e.isIntersecting) {
            v.muted = true;
            var q = v.play();
            if (q && typeof q.catch === 'function') q.catch(function () { });
          } else if (!v.paused) {
            v.pause();
          }
        });
      }, { threshold: 0.25 });
      demos.forEach(function (v) { videoIO.observe(v); });
    }

    /* ============================================================
       6. Count-up de las cifras de KPI: 1.2s, una sola vez
       ============================================================ */
    function format(value, dec) {
      return dec > 0 ? value.toFixed(dec).replace('.', ',') : String(Math.round(value));
    }
    function countUp(el) {
      var target = parseFloat(el.dataset.count);
      var dec = parseInt(el.dataset.dec || '0', 10);
      if (isNaN(target)) return;
      if (reduce) { el.textContent = format(target, dec); return; }
      var duration = 1200, start = null;
      function frame(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        el.textContent = format(target * (1 - Math.pow(1 - p, 3)), dec);
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    var counters = [].slice.call(document.querySelectorAll('[data-count]'));
    if (counters.length) {
      if (reduce || !('IntersectionObserver' in window)) {
        counters.forEach(countUp);
      } else {
        var countIO = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            countUp(e.target);
            countIO.unobserve(e.target);
          });
        }, { threshold: 0.5 });
        counters.forEach(function (el) { countIO.observe(el); });
      }
    }

    /* ============================================================
       8. Marcadores de desplazamiento vertical (solo escritorio)
       ============================================================ */
    var secs = [].slice.call(document.querySelectorAll('[data-nav]'));
    if (secs.length >= 3 && window.matchMedia('(min-width:1024px)').matches) {
      var rail = document.createElement('nav');
      rail.className = 'sdots';
      rail.setAttribute('aria-label', 'Secciones de la página');
      var links = secs.map(function (sec, i) {
        if (!sec.id) sec.id = 'sec-' + i;
        var a = document.createElement('a');
        a.href = '#' + sec.id;
        a.setAttribute('aria-label', sec.dataset.nav);
        var tip = document.createElement('span');
        tip.className = 'tip';
        tip.textContent = sec.dataset.nav;
        a.appendChild(tip);
        a.addEventListener('click', function (ev) {
          ev.preventDefault();
          sec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        });
        rail.appendChild(a);
        return a;
      });
      document.body.appendChild(rail);
      if ('IntersectionObserver' in window) {
        var dotIO = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            var i = secs.indexOf(e.target);
            links.forEach(function (l, j) { l.classList.toggle('is-on', j === i); });
          });
        }, { rootMargin: '-45% 0px -45% 0px' });
        secs.forEach(function (sec) { dotIO.observe(sec); });
      }
    }

    /* ---- CTA que lleva al formulario de la misma página ---- */
    [].slice.call(document.querySelectorAll('a[data-scroll]')).forEach(function (a) {
      a.addEventListener('click', function (ev) {
        var target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        ev.preventDefault();
        target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        var first = target.querySelector('input:not([type=hidden]):not([type=checkbox])');
        if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, reduce ? 0 : 600);
      });
    });

    /* ============================================================
       6b. Parametros de campana: se leen de la URL, se guardan en la
           sesion y se inyectan en el formulario para que viajen al lead.
       ============================================================ */
    var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    (function captureUtm() {
      var params;
      try { params = new URLSearchParams(window.location.search); } catch (e) { return; }
      UTM_KEYS.forEach(function (k) {
        var v = params.get(k);
        if (v) { try { sessionStorage.setItem(k, v); } catch (e) { } }
      });
    })();
    function readUtm(k) {
      try { return sessionStorage.getItem(k) || ''; } catch (e) { return ''; }
    }
    [].slice.call(document.querySelectorAll('form')).forEach(function (form) {
      UTM_KEYS.forEach(function (k) {
        var field = form.querySelector('[name="' + k + '"]');
        if (field) field.value = readUtm(k);
      });
      var origen = form.querySelector('[name="pagina_origen"]');
      if (origen) origen.value = window.location.href;
    });

    /* ============================================================
       7. Formulario de contacto: Web3Forms + HubSpot en paralelo.
          Web3Forms decide el éxito; HubSpot es complementario.
       ============================================================ */
    function readCookie(name) {
      var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
      return m ? decodeURIComponent(m[1]) : '';
    }

    // El select envía la etiqueta visible; se normaliza a la clave del mapa
    function lineaHubspot(value) {
      var key = (value || '').split(' ')[0].toLowerCase();
      return LINEA_HUBSPOT[key] || value || '';
    }

    async function sendHubspot(data) {
      var fields = [
        ['firstname', data.name],
        ['email', data.email],
        ['phone', data.phone],
        ['company', data.empresa],
        ['linea_de_interes_inicial', lineaHubspot(data.linea)],
        ['utm_source', data.utm_source],
        ['utm_medium', data.utm_medium],
        ['utm_campaign', data.utm_campaign],
        ['utm_term', data.utm_term]
      ].filter(function (f) { return f[1] && String(f[1]).trim() !== ''; })
        .map(function (f) { return { name: f[0], value: String(f[1]).trim() }; });

      var context = { pageUri: window.location.href, pageName: document.title };
      var hutk = readCookie('hubspotutk');
      if (hutk) context.hutk = hutk;

      function post(withConsent) {
        var body = { fields: fields, context: context };
        if (withConsent) {
          body.legalConsentOptions = { consent: { consentToProcess: true, text: CONSENT_TEXT } };
        }
        return fetch(HUBSPOT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      }

      var res = await post(true);
      if (res.status === 400) {
        var detail = await res.clone().text();
        if (/legalConsentOptions|consent/i.test(detail)) res = await post(false);
      }
      if (!res.ok) throw new Error('HubSpot ' + res.status + ': ' + (await res.text()));
      return res;
    }

    // Doble envío común a todos los formularios de lead. Web3Forms decide el éxito.
    async function sendLead(data) {
      var web3 = fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) { return r.json(); });
      // Un bot que marca el honeypot no llega a HubSpot
      var hub = data.botcheck ? Promise.resolve() : sendHubspot(data);

      var results = await Promise.allSettled([web3, hub]);
      if (results[1].status === 'rejected') {
        console.warn('No se pudo registrar el lead en HubSpot:', results[1].reason);
      }
      if (results[0].status === 'rejected') throw results[0].reason;
      return results[0].value;
    }

    var form = document.getElementById('contactForm');
    if (form) {
      // El boton se libera solo cuando se autoriza el tratamiento de datos
      var consent = form.querySelector('#consent');
      var submit = form.querySelector('button[type=submit]');
      if (consent && submit) {
        var syncConsent = function () { submit.disabled = !consent.checked; };
        consent.addEventListener('change', syncConsent);
        syncConsent();
      }

      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (consent && !consent.checked) return;
        var msg = document.getElementById('formMsg');
        var btn = submit || form.querySelector('button[type=submit]');
        var label = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Enviando…';
        msg.className = 'form-msg';
        msg.textContent = '';
        try {
          var data = Object.fromEntries(new FormData(form).entries());
          var out = await sendLead(data);
          if (out && out.success) {
            msg.classList.add('ok');
            msg.textContent = '¡Listo! Te llevamos a elegir horario.';
            var linea = (form.querySelector('[name="linea"]') || {}).value || '';
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({ event: 'lead_form_submitted', linea: linea });
            // La redirección espera a que GA4 confirme el evento, con tope de 1 s
            var redirected = false;
            var go = function () { if (!redirected) { redirected = true; window.location.href = '/gracias'; } };
            var sent = gaEvent('generate_lead', { linea: lineaKey(linea), pagina_origen: window.location.pathname,
              event_callback: go, event_timeout: 1000 });
            if (sent) setTimeout(go, 1000); else go();
            return;
          }
          msg.classList.add('err');
          msg.textContent = 'No se pudo enviar. Inténtalo de nuevo en un momento.';
        } catch (err) {
          msg.classList.add('err');
          msg.textContent = 'No se pudo enviar. Revisa tu conexión.';
        }
        btn.disabled = consent ? !consent.checked : false;
        btn.textContent = label;
      });
    }

    /* ---- Clic en el pago del Diagnóstico con Wompi (index y contacto) ---- */
    [].slice.call(document.querySelectorAll('a[href^="https://checkout.wompi.co/"]')).forEach(function (a) {
      a.addEventListener('click', function () {
        gaEvent('begin_checkout', { value: 1200000, currency: 'COP', item: 'Diagnostico' });
      });
    });

    /* ============================================================
       9. Blog: filtro por línea sin recargar
       ============================================================ */
    var filter = document.querySelector('.blog-filter');
    var postGrid = document.getElementById('postGrid');
    if (filter && postGrid) {
      var filterBtns = [].slice.call(filter.querySelectorAll('[data-filter]'));
      var postCards = [].slice.call(postGrid.querySelectorAll('.post-card'));
      var countMsg = document.getElementById('blogCount');
      filterBtns.forEach(function (b) {
        b.addEventListener('click', function () {
          var cat = b.getAttribute('data-filter');
          filterBtns.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
          var shown = 0;
          postCards.forEach(function (c) {
            var on = cat === 'todos' || c.getAttribute('data-cat') === cat;
            c.hidden = !on;
            if (on) { shown++; c.classList.add('is-in'); }
          });
          if (countMsg) countMsg.textContent = shown === 1 ? 'Mostrando 1 artículo' : 'Mostrando ' + shown + ' artículos';
        });
      });
    }

    /* ============================================================
       10. Calculadora de ahorro de horas (artículo 2)
           horas × personas × costo por hora × 52, por fila y en total
       ============================================================ */
    var calcSummary = null;
    var fmtCop = function (n) { return '$' + new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n); };
    var calc = document.getElementById('calculadora');
    if (calc) {
      var MAX_ROWS = 5;
      var rowsBox = document.getElementById('calcRows');
      var addBtn = document.getElementById('calcAdd');
      var totalOut = document.getElementById('calcTotal');
      var calcCta = document.getElementById('calcCta');
      var loadBtn = document.getElementById('calcLoadExample');
      var uid = 0;
      var money = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
      var fmt = function (n) { return '$' + money.format(n); };

      var num = {
        hours: function (v) { var n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.')); return n > 0 ? n : 0; },
        int: function (v) { var n = parseInt(String(v).replace(/\D/g, ''), 10); return n > 0 ? n : 0; }
      };

      function rowMarkup(id) {
        var help = 'calc-cost-help-' + id;
        return '<legend class="calc-legend"></legend>' +
          '<div class="calc-fields">' +
          '<div class="calc-field calc-field-name"><label for="calc-name-' + id + '">Nombre de la tarea</label>' +
          '<input id="calc-name-' + id + '" type="text" autocomplete="off" data-k="name"></div>' +
          '<div class="calc-field calc-field-num"><label for="calc-hours-' + id + '">Horas por semana por persona</label>' +
          '<input id="calc-hours-' + id + '" type="text" inputmode="decimal" autocomplete="off" data-k="hours"></div>' +
          '<div class="calc-field calc-field-num"><label for="calc-people-' + id + '">Personas</label>' +
          '<input id="calc-people-' + id + '" type="text" inputmode="numeric" autocomplete="off" data-k="people"></div>' +
          '<div class="calc-field calc-field-cost"><label for="calc-cost-' + id + '">Costo por hora en COP</label>' +
          '<input id="calc-cost-' + id + '" type="text" inputmode="numeric" autocomplete="off" data-k="cost" aria-describedby="' + help + '">' +
          '<p class="calc-help" id="' + help + '">Salario mensual con prestaciones, dividido por las horas laborales del mes. Tu contador tiene la cifra exacta.</p></div>' +
          '</div>' +
          '<div class="calc-row-foot"><span>Costo anual de esta tarea: <b data-sub>$0</b></span>' +
          '<button type="button" class="calc-remove" data-remove>Quitar</button></div>';
      }

      function rows() { return [].slice.call(rowsBox.querySelectorAll('.calc-row')); }

      function field(row, k) { return row.querySelector('[data-k="' + k + '"]'); }

      function relabel() {
        var list = rows();
        list.forEach(function (r, i) {
          r.querySelector('.calc-legend').textContent = 'Tarea ' + (i + 1);
          var rm = r.querySelector('[data-remove]');
          rm.hidden = list.length === 1;
          rm.setAttribute('aria-label', 'Quitar tarea ' + (i + 1));
        });
        addBtn.disabled = list.length >= MAX_ROWS;
        addBtn.textContent = list.length >= MAX_ROWS ? 'Máximo cinco tareas' : '+ Agregar tarea';
      }

      function compute() {
        var total = 0;
        rows().forEach(function (r) {
          var sub = Math.round(num.hours(field(r, 'hours').value) * num.int(field(r, 'people').value) *
            num.int(field(r, 'cost').value) * 52);
          r.querySelector('[data-sub]').textContent = fmt(sub);
          total += sub;
        });
        totalOut.textContent = fmt(total);
        calcCta.hidden = total <= 0;
        calcCta.textContent = 'Ver cómo recuperar ' + fmt(total) + ' al año';
      }

      function addRow(focus) {
        if (rows().length >= MAX_ROWS) return null;
        var row = document.createElement('fieldset');
        row.className = 'calc-row';
        row.innerHTML = rowMarkup(++uid);
        rowsBox.appendChild(row);
        var cost = field(row, 'cost');
        // Separador de miles al salir del campo; al entrar se deja solo el número
        cost.addEventListener('blur', function () { var n = num.int(cost.value); cost.value = n ? money.format(n) : ''; });
        row.querySelector('[data-remove]').addEventListener('click', function () {
          var list = rows();
          var i = list.indexOf(row);
          row.remove();
          relabel();
          compute();
          var next = rows()[Math.max(0, i - 1)];
          if (next) field(next, 'name').focus();
        });
        relabel();
        if (focus) field(row, 'name').focus();
        return row;
      }

      rowsBox.addEventListener('input', compute);
      addBtn.addEventListener('click', function () { addRow(true); compute(); });

      if (loadBtn) {
        loadBtn.hidden = false;
        loadBtn.addEventListener('click', function () {
          var example = [
            ['Recordatorios de pago y seguimiento de cartera', '6', '2', 25000],
            ['Digitación de pedidos recibidos por WhatsApp', '8', '1', 25000],
            ['Solicitud y comparación de cotizaciones', '5', '1', 35000]
          ];
          rows().forEach(function (r) { r.remove(); });
          example.forEach(function (e) {
            var r = addRow(false);
            field(r, 'name').value = e[0];
            field(r, 'hours').value = e[1];
            field(r, 'people').value = e[2];
            field(r, 'cost').value = money.format(e[3]);
          });
          relabel();
          compute();
          calc.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
          document.getElementById('calc-title').focus({ preventScroll: true });
        });
      }

      // Texto plano con lo que el usuario ingresó, para el mensaje del lead
      calcSummary = function () {
        var tasks = [], total = 0;
        rows().forEach(function (r, i) {
          var name = field(r, 'name').value.trim();
          var h = num.hours(field(r, 'hours').value), p = num.int(field(r, 'people').value), c = num.int(field(r, 'cost').value);
          if (!name && !h && !p && !c) return;
          var sub = Math.round(h * p * c * 52);
          total += sub;
          tasks.push((i + 1) + '. ' + (name || 'Tarea sin nombre') + ': ' + String(h).replace('.', ',') + ' h/semana por persona × ' +
            p + (p === 1 ? ' persona' : ' personas') + ' × ' + fmt(c) + ' por hora × 52 = ' + fmt(sub) + ' al año');
        });
        return { total: total, tasks: tasks };
      };

      calc.hidden = false;
      addRow(false);
      compute();
    }

    /* ============================================================
       12. Lead magnet: plantilla de Excel del artículo 2.
           Mismo doble envío que el formulario principal; al terminar,
           el bloque se convierte en descarga directa (sin /gracias).
       ============================================================ */
    var lm = document.getElementById('plantilla');
    var lmForm = document.getElementById('leadMagnetForm');
    if (lm && lmForm) {
      var lmConsent = lmForm.querySelector('#lm-consent');
      var lmSubmit = lmForm.querySelector('button[type=submit]');
      var lmMsg = document.getElementById('lmMsg');
      var syncLm = function () { lmSubmit.disabled = !lmConsent.checked; };
      lmConsent.addEventListener('change', syncLm);
      syncLm();

      lmForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!lmConsent.checked) return;
        var label = lmSubmit.textContent;
        lmSubmit.disabled = true;
        lmSubmit.textContent = 'Enviando…';
        lmMsg.className = 'form-msg';
        lmMsg.textContent = '';
        try {
          var data = Object.fromEntries(new FormData(lmForm).entries());
          var sum = calcSummary ? calcSummary() : { total: 0, tasks: [] };
          data.message = 'Descarga de la plantilla de ahorro de horas (artículo del blog).\n\n' +
            (sum.tasks.length
              ? 'Total calculado en la calculadora: ' + fmtCop(sum.total) + ' al año.\n\nTareas ingresadas:\n' + sum.tasks.join('\n')
              : 'No ingresó tareas en la calculadora.');
          var out = await sendLead(data);
          if (out && out.success) {
            lm.querySelector('.lm-body').hidden = true;
            var done = document.getElementById('lmDone');
            done.hidden = false;
            done.querySelector('.lm-done-title').focus();
            return;
          }
          lmMsg.classList.add('err');
          lmMsg.textContent = 'No se pudo enviar. Inténtalo de nuevo en un momento.';
        } catch (err) {
          lmMsg.classList.add('err');
          lmMsg.textContent = 'No se pudo enviar. Revisa tu conexión.';
        }
        lmSubmit.textContent = label;
        syncLm();
      });

      document.getElementById('lmDownload').addEventListener('click', function () {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'lead_magnet_downloaded', recurso: 'plantilla_ahorro_horas' });
        gaEvent('generate_lead', { linea: 'trastienda', recurso: 'plantilla_ahorro_horas' });
      });
      lm.hidden = false;
    }

    /* ============================================================
       11. Índice de pasos: resalta el paso que se está leyendo
       ============================================================ */
    var tocLinks = [].slice.call(document.querySelectorAll('.toc a[href^="#"]'));
    if (tocLinks.length) {
      var stepIds = [];
      tocLinks.forEach(function (a) {
        var id = a.getAttribute('href').slice(1);
        if (stepIds.indexOf(id) < 0) stepIds.push(id);
      });
      var stepEls = stepIds.map(function (id) { return document.getElementById(id); }).filter(Boolean);
      var setCurrent = function (id) {
        tocLinks.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + id;
          a.classList.toggle('is-current', on);
          if (on) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
        });
      };
      // El paso vigente es el último cuyo título ya pasó la franja superior de lectura
      var lastStep;
      var pickStep = function () {
        var current = null;
        stepEls.forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight * 0.35) current = el.id; });
        if (current !== lastStep) { lastStep = current; setCurrent(current); }
      };
      // Seis lecturas de posición por evento: no hace falta más control de frecuencia
      window.addEventListener('scroll', pickStep, { passive: true });
      window.addEventListener('resize', pickStep);
      pickStep();
    }
  });
})();
