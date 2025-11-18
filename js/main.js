import { ui, personIcon } from "./ui.js";
import { getNoteIcon, formDate, getStatus, statusObj } from "./helpers.js";

// global değişkenler
const STATE = {
  map: null,
  layer: null,
  clickedCoords: null,
  notes: JSON.parse(localStorage.getItem("notes") || "[]"),
};

// kullanıcının konumuna göre haritayı yükle
window.navigator.geolocation.getCurrentPosition(
  // kullanıcı izin verirse onun olduğu konumda yükle
  (e) => loadMap([e.coords.latitude, e.coords.longitude]),
  // izin vermezse varsayılan olarak istanbul yükle
  () => loadMap([41.104187, 29.051014])
);

// leaflet haritasının kurulumunu yapar
function loadMap(position) {
  // haritanın kurulumu
  STATE.map = L.map("map", { zoomControl: false }).setView(position, 11);

  // haritaya arayüz ekle

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
  }).addTo(STATE.map);

  // kontrolcüyü sağ alta taşı
  L.control.zoom({ position: "bottomright" }).addTo(STATE.map);

  // harita üzerinde bir yer oluştur
  STATE.layer = L.layerGroup().addTo(STATE.map);

  // ekrana marker bas
  const marker = L.marker(position, { icon: personIcon }).addTo(STATE.map);

  // marker a popup ekle
  marker.bindPopup("<b>Buradasın</b>");

  // haritaya tıklama olayı için izleyici ekle
  STATE.map.on("click", onMapClick);

  // notları ekrana bas
  renderNoteCards(STATE.notes);
  renderMarker(STATE.notes);
}

// haritaya tıklanınca çalışır
function onMapClick(e) {
  // son tıklanan konumu kaydet
  STATE.clickedCoords = [e.latlng.lat, e.latlng.lng];

  // aside alanındaki formu aktif hale getir
  ui.aside.classList.add("add");

  // aside alanındaki başlığı güncelle
  ui.asideTitle.textContent = "Yeni Not";
}

// iptal butonuna tıklanınca
ui.cancelButton.addEventListener("click", () => {
  // aside alanını ekleme modundan çıkar
  ui.aside.classList.remove("add");

  // title ı eski haline çevir
  ui.asideTitle.textContent = "Notlar";
});

// ok a tıklanınca aside alanını aç/kapa
ui.arrow.addEventListener("click", () => {
  ui.aside.classList.toggle("hide");
});

// form gönderilince
ui.form.addEventListener("submit", (e) => {
  // sayfa yenilemeyi engelle
  e.preventDefault();

  // formdaki verilere eriş
  const title = e.target[0].value;
  const date = e.target[1].value;
  const status = e.target[2].value;

  // eğer form doldurulmadıysa kullanıcıya uyarı ver
  if (!title || !date || !status) {
    return alert("Lütfen formu doldurunuz");
  }

  // kaydedilecek nesneyi oluştur
  const newNote = {
    id: new Date().getTime(),
    title,
    date,
    status,
    coords: STATE.clickedCoords,
  };

  // notes dizisine yeni not ekle
  STATE.notes.push(newNote);
  // localstrage güncelle
  localStorage.setItem("notes", JSON.stringify(STATE.notes));

  // ekleme modunu kapat
  ui.aside.classList.remove("add");
  ui.asideTitle.textContent = "Notlar";

  // notları ekrana bas
  renderNoteCards(STATE.notes);
  renderMarker(STATE.notes);
});

// note marker larını ekrana bas
function renderMarker(notes) {
  // haritadaki katmana daha önceden eklenmiş markerları temizle
  STATE.layer.clearLayers();

  // notes dizisindeki her bir not için ekrana bir marker bas
  notes.forEach((note) => {
    // note iconını belirle
    const icon = getNoteIcon(note.status);

    // marker oluştur
    const marker = L.marker(note.coords, { icon }).addTo(STATE.layer);
    // note ların başlığını popup olarak markera ekle
    marker.bindPopup(`<p class="popup">${note.title}</p>`);
  });
}

// note cardlarını ekrana bas
function renderNoteCards(notes) {
  // note dizisindeki her nesneyi dönerek bir li elemanı oluştur
  const notesHtml = notes
    .map(
      (note) => `
        <li>
          <div>
            <h3>${note.title}</h3>
            <p>${formatDate(note.date)}</p>
            <p class="status">${getStatus(note.status)}</p>
          </div>
          <div class="icons">
            <i data-id="${
              note.id
            }" id="fly-btn" class="bi bi-airplane-fill"></i>
            <i data-id="${note.id}" id="trash-btn" class="bi bi-trash"></i>
          </div>
        </li> `
    )
    .join(" ");

  // oluşturulan note elemanlarını ekrana bas
  ui.noteList.innerHTML = notesHtml;

  // delete btn eriş
  document.querySelectorAll("#trash-btn").forEach((btn) => {
    // butonun bağlı olduğu note id sine eriş
    const id = +btn.dataset.id;

    // butona tıklanma olayını izle
    btn.addEventListener("click", () => deleteNote(id));
  });

  // fly btn eriş
  document.querySelectorAll("#fly-btn").forEach((btn) => {
    // butonun bağlı olduğu note id sine eriş
    const id = +btn.dataset.id;

    // butona tıklanma olayını izle
    btn.addEventListener("click", () => flyToNote(id));
  });
}

// notu silen fonksiyon
const deleteNote = (id) => {
  // kullanıcı onay vermezse dur
  if (!confirm("Notu silmek istediğinizden emin misiniz?")) return;

  // id si bilinen note diziden kaldır
  STATE.notes = STATE.notes.filter((note) => note.id !== id);

  // localstroge güncelle
  localStorage.setItem("notes", JSON.stringify(STATE.notes));

  // arayüzü güncelle
  renderMarker(STATE.notes);
  renderNoteCards(STATE.notes);
};

// note haritada gösteren fonksiyon
const flyToNote = (id) => {
  // tıklanan notenin verilerine eriş
  const note = STATE.notes.find((note) => note.id === id);

  // haritada göster
  STATE.map.flyTo(note.coords, 15);
};
