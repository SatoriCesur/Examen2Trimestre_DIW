let map;
let marcadores = []; 
let monumentos = [];

// CREO EL MAPA CON LEAFLET
function initMapa() {
  map = L.map('mapa').setView([36.7213, -4.4217], 16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
}

// CARGAMOS LOS DATOS DE LOS MONUMENTOS DESDE LA API
async function cargarMonumentos() {
  try {
    const res = await fetch('/api/monumentos');
    if (!res.ok) throw new Error('Error al obtener los monumentos: ' + res.status);
    const geojson = await res.json();
    monumentos = geojson.features;
    renderLista();
    renderMarcadores();
  } catch (err) {
    console.error('Error cargando monumentos:', err);
    Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los monumentos.', scrollbarPadding: false, heightAuto: false });
  }
}

// LISTA LATERAL 
function renderLista() {
  let contenedor = document.getElementById('lista-monumentos');
  contenedor.innerHTML = '';

  let logueado = estaLogueado();
  let favoritos = getFavoritos();

  monumentos.forEach(function(feature) {
    let p = feature.properties;
    let esFavorito = favoritos.includes(p.ID);

    let item = document.createElement('div');
    item.className = 'lista-item p-3 border-bottom d-flex align-items-center justify-content-between';
    item.id = 'item-' + p.ID;
    item.innerHTML =
      '<div class="info-monumento me-2" style="cursor:pointer" onclick="seleccionarMonumento(' + p.ID + ')">' +
        '<div class="fw-semibold" style="font-size:1rem">' + p.NOMBRE + '</div>' +
        '<div class="text-muted" style="font-size:0.85rem">' + p.DIRECCION + '</div>' +
      '</div>' +
      (logueado
        ? '<button class="btn btn-sm btn-fav ' + (esFavorito ? 'activo' : '') + '" onclick="toggleFavorito(' + p.ID + ', event)" title="Favorito">' +
            '<i class="bi ' + (esFavorito ? 'bi-heart-fill text-danger' : 'bi-heart') + '"></i>' +
          '</button>'
        : '');

    contenedor.appendChild(item);
  });
}

// MARCADORES LEAFLET
function renderMarcadores() {
  marcadores.forEach(function(m) { map.removeLayer(m.marker); });
  marcadores = [];

  monumentos.forEach(function(feature) {
    let coords = feature.geometry.coordinates;
    let p = feature.properties;
    let marker = L.marker([coords[1], coords[0]])
      .addTo(map)
      .on('click', function() { seleccionarMonumento(p.ID); });

    marcadores.push({ id: p.ID, marker: marker, feature: feature });
  });
}

function seleccionarMonumento(id) {
  let feature = monumentos.find(function(f) { return f.properties.ID === id; });
  if (!feature) return;

  let coords = feature.geometry.coordinates;
  let p = feature.properties;

  // Centrar mapa con zoom
  map.flyTo([coords[1], coords[0]], 17, { duration: 1 });

  document.querySelectorAll('.lista-item').forEach(function(el) {
    el.classList.remove('activo');
  });
  let itemEl = document.getElementById('item-' + id);
  if (itemEl) {
    itemEl.classList.add('activo');
    itemEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Modal SweetAlert2
  Swal.fire({
    icon: 'info',
    title: p.NOMBRE,
    html: '<strong>Dirección:</strong> ' + p.DIRECCION + '<br><br>' + p.DESCRIPCION,
    confirmButtonText: 'OK',
    confirmButtonColor: '#0d6efd',
    scrollbarPadding: false,
    heightAuto: false
  });
}

// FAVORITOS
function getFavoritos() {
  return JSON.parse(localStorage.getItem('favoritos') || '[]');
}

function setFavoritos(favs) {
  localStorage.setItem('favoritos', JSON.stringify(favs));
}

function toggleFavorito(id, event) {
  event.stopPropagation();
  let idNum = Number(id);
  let favs = getFavoritos();
  let idx = favs.indexOf(idNum);
  if (idx === -1) {
    favs.push(idNum);
  } else {
    favs.splice(idx, 1);
  }
  setFavoritos(favs);
  renderLista();
}

function estaLogueado() {
  return sessionStorage.getItem('usuario') !== null;
}

function actualizarBotonesLogin() {
  let logueado = estaLogueado();
  document.getElementById('btnLogin').classList.toggle('d-none', logueado);
  document.getElementById('btnLogout').classList.toggle('d-none', !logueado);
}

async function iniciarSesion() {
  const usuario = document.getElementById('inputUsuario').value.trim();
  const password = document.getElementById('inputPassword').value;
  const errorEl = document.getElementById('loginError');

  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password })
    });
    const data = await res.json();
    if (data.success) {
      sessionStorage.setItem('usuario', data.usuario);
      const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
      modal.hide();
      errorEl.classList.add('d-none');
      actualizarBotonesLogin();
      renderLista();
      Swal.fire({
        icon: 'success',
        title: `¡Bienvenido, ${data.usuario}!`,
        timer: 1500,
        showConfirmButton: false,
        scrollbarPadding: false,
        heightAuto: false
      });
    } else {
      errorEl.classList.remove('d-none');
    }
  } catch (err) {
    console.error('Error en login:', err);
    errorEl.classList.remove('d-none');
  }
}

function cerrarSesion() {
  Swal.fire({
    title: '¿Cerrar sesión?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, salir',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc3545',
    scrollbarPadding: false,
    heightAuto: false
  }).then(function(result) {
    if (result.isConfirmed) {
      sessionStorage.removeItem('usuario');
      actualizarBotonesLogin();
      renderLista();
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  initMapa();
  cargarMonumentos();
  actualizarBotonesLogin();

  document.getElementById('loginModal').addEventListener('show.bs.modal', function() {
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').classList.add('d-none');
  });
});
