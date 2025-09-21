let data = {};
let orangDipilih = "";
let tanggalDipilih = "";
let statusDipilih = "";

// URL Sheet Monkey untuk INSERT data baru
const SHEET_MONKEY_URL = "https://api.sheetmonkey.io/form/hXtDfk1bDSa95AE4MwAuXL";

// URL Google Apps Script untuk READ, UPDATE & DELETE data
const API_URL = "https://script.google.com/macros/s/AKfycbwd_VfQmVx2Nz7qKeH61VGEhFlCEnCctjXApznoHHRHMDN0jZHfO8FcWc_jYa05blcg8A/exec";

// Tombol kembali
document.getElementById('btn-kembali').addEventListener('click', resetForm);
const loader = document.getElementById('loader');

// ===== FUNGSI UNTUK KONTROL LOADER =====
function tampilkanLoader() {
  loader.style.display = 'flex';
}
function sembunyikanLoader() {
  loader.style.display = 'none';
}
// =====================================

// === FORMAT TANGGAL ===
function formatTanggalTeks(input) {
  const date = new Date(input);
  const hari = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  const bulan = ["Januari","Februari","Maret","April","Mei","Juni",
                 "Juli","Agustus","September","Oktober","November","Desember"];
  return `${hari[date.getDay()]}, ${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
}

function parseTanggalKeISO(teks) {
  const parts = teks.replace(",", "").split(" "); 
  const day = parts[1];
  const month = ["Januari","Februari","Maret","April","Mei","Juni",
                 "Juli","Agustus","September","Oktober","November","Desember"].indexOf(parts[2]) + 1;
  const year = parts[3];
  return `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}

// === LOAD DATA ===
async function muatDataDariGoogleSheets() {
  tampilkanLoader();
  try {
    const response = await fetch(API_URL);
    const result = await response.json();
    
    const temp_data = {};
    result.forEach(row => {
      if (!temp_data[row.Nama]) {
        temp_data[row.Nama] = {};
      }
      temp_data[row.Nama][row.Tanggal] = {
        status: row.Status,
        alasan: row.Alasan || '',
        logbook: row.Logbook || ''
      };
    });
    data = temp_data;
    
    tampilkanDataTersimpan();
  } catch (error) {
    console.error("Error loading data from Google Sheets:", error);
    sembunyikanLoader(); // Sembunyikan juga jika error
    await tampilkanModal("Gagal memuat data dari server.");
  }
  sembunyikanLoader();
  document.getElementById("hasil-section").style.display = "grid"; 
  document.getElementById("data-tersimpan-header").style.display = "block";
}

document.addEventListener("DOMContentLoaded", () => {
  muatDataDariGoogleSheets();
});

// === FORM HANDLER ===
function pilihOrang(orang) {
  orangDipilih = orang;
  document.getElementById("orang-terpilih").textContent = orang;
  document.getElementById("pilih-orang-section").style.display = "none";
  document.getElementById("form-content-container").style.display = "block";
  document.getElementById("form-content-container").style.animation = "fadeIn 0.6s ease";
  
  document.getElementById("hasil-section").style.display = "none";
  document.getElementById("data-tersimpan-header").style.display = "none";
  document.getElementById("btn-kembali").style.display = "block";

  const btn = document.getElementById("btn-aksi");
  btn.textContent = "Simpan";
  btn.onclick = simpanData;
}

function resetForm() {
  orangDipilih = "";
  tanggalDipilih = "";
  statusDipilih = "";

  document.getElementById("tanggal").value = "";
  document.getElementById("tanggal-terpilih").textContent = "";
  document.getElementById("logbook").value = "";
  document.getElementById("alasan").value = "";

  document.getElementById("form-logbook").style.display = "none";
  document.getElementById("form-alasan").style.display = "none";
  document.querySelectorAll(".pilihan button").forEach(b => b.classList.remove("active"));
  
  document.getElementById("pilih-orang-section").style.display = "block";
  document.getElementById("form-content-container").style.display = "none";
  document.getElementById("hasil-section").style.display = "grid";
  document.getElementById("data-tersimpan-header").style.display = "block";

  tampilkanDataTersimpan();
  document.getElementById("btn-kembali").style.display = "none";

  const btn = document.getElementById("btn-aksi");
  btn.textContent = "Simpan";
  btn.onclick = simpanData;
}

function tampilkanTanggal() {
  let inputTanggal = document.getElementById("tanggal").value;
  if (!inputTanggal) return;

  let tgl = new Date(inputTanggal);
  tanggalDipilih = inputTanggal;
  document.getElementById("tanggal-terpilih").textContent = "Tanggal dipilih: " + formatTanggalTeks(tgl);
}

function pilihStatus(status) {
  statusDipilih = status;
  document.querySelectorAll(".pilihan button").forEach(b => b.classList.remove("active"));

  if (status === "Masuk") {
    document.querySelector(".btn-masuk").classList.add("active");
    document.getElementById("form-logbook").style.display = "block";
    document.getElementById("form-alasan").style.display = "none";
  } else {
    document.getElementById("form-logbook").style.display = "none";
    document.getElementById("form-alasan").style.display = "block";

    if (status === "Tidak Masuk") {
      document.querySelector(".btn-tidak").classList.add("active");
    } else if (status === "Izin") {
      document.querySelector(".btn-izin").classList.add("active");
    }
  }
}

// === FUNGSI MODAL UNIVERSAL ===
function tampilkanModal(pesan, tipe = 'alert') {
  return new Promise((resolve) => {
    const modal = document.getElementById('konfirmasi-hapus-modal');
    const modalText = document.getElementById('modal-text');
    const btnKonfirmasi = document.getElementById('modal-btn-konfirmasi');
    const btnBatal = document.getElementById('modal-btn-batal');
    
    modalText.textContent = pesan;
    modal.style.display = 'flex';

    const newBtnKonfirmasi = btnKonfirmasi.cloneNode(true);
    btnKonfirmasi.parentNode.replaceChild(newBtnKonfirmasi, btnKonfirmasi);

    const newBtnBatal = btnBatal.cloneNode(true);
    btnBatal.parentNode.replaceChild(newBtnBatal, btnBatal);
    
    const closeModal = () => {
      modal.style.display = 'none';
    };

    if (tipe === 'konfirmasi') {
      newBtnKonfirmasi.textContent = 'Ya, Hapus';
      newBtnBatal.style.display = 'inline-block';
      newBtnKonfirmasi.onclick = () => { closeModal(); resolve(true); };
      newBtnBatal.onclick = () => { closeModal(); resolve(false); };
    } else {
      newBtnKonfirmasi.textContent = 'OK';
      newBtnBatal.style.display = 'none';
      newBtnKonfirmasi.onclick = () => { closeModal(); resolve(true); };
    }
  });
}

// === SIMPAN BARU ===
async function simpanData() {
  if (!orangDipilih || !tanggalDipilih || !statusDipilih) {
    await tampilkanModal("Lengkapi semua data!");
    return;
  }
  let alasan = document.getElementById("alasan").value.trim();
  let logbook = document.getElementById("logbook").value.trim();
  if (statusDipilih === "Masuk" && logbook === "") {
    await tampilkanModal("Logbook tidak boleh kosong saat status 'Masuk'.");
    return;
  }
  if ((statusDipilih === "Tidak Masuk" || statusDipilih === "Izin") && alasan === "") {
    await tampilkanModal("Alasan tidak boleh kosong.");
    return;
  }

  tampilkanLoader();
  const formData = new FormData();
  formData.append('Nama', orangDipilih);
  formData.append('Tanggal', formatTanggalTeks(tanggalDipilih));
  formData.append('Status', statusDipilih);
  formData.append('Alasan', alasan);
  formData.append('Logbook', logbook);
  
  try {
    const response = await fetch(SHEET_MONKEY_URL, {
      method: 'POST',
      body: formData,
    });

    sembunyikanLoader();
    if (response.ok) {
      await tampilkanModal("Data berhasil disimpan!");
      muatDataDariGoogleSheets();
      resetForm();
    } else {
      await tampilkanModal("Gagal menyimpan data.");
    }
  } catch (error) {
    sembunyikanLoader();
    console.error("Error saving data:", error);
    await tampilkanModal("Gagal menyimpan data. Silakan coba lagi.");
  }
}

// === UPDATE DATA ===
function editData(nama, tanggal) {
  orangDipilih = nama;
  tanggalDipilih = parseTanggalKeISO(tanggal);
  const entry = data[nama][tanggal];

  document.getElementById("orang-terpilih").textContent = nama;
  document.getElementById("tanggal").value = parseTanggalKeISO(tanggal); 
  document.getElementById("tanggal-terpilih").textContent = "Tanggal dipilih: " + tanggal;

  pilihStatus(entry.status);
  document.getElementById("alasan").value = entry.alasan || "";
  document.getElementById("logbook").value = entry.logbook || "";

  const btn = document.getElementById("btn-aksi");
  btn.textContent = "Update";
  btn.onclick = updateData;

  document.getElementById("pilih-orang-section").style.display = "none";
  document.getElementById("form-content-container").style.display = "block";
  document.getElementById("btn-kembali").style.display = "block";
  
  document.getElementById("hasil-section").style.display = "none";
  document.getElementById("data-tersimpan-header").style.display = "none";
}

async function updateData() {
  let alasan = document.getElementById("alasan").value.trim();
  let logbook = document.getElementById("logbook").value.trim();

  if (statusDipilih === "Masuk") {
    alasan = "";
  } else if (statusDipilih === "Tidak Masuk" || statusDipilih === "Izin") {
    logbook = "";
  }
  
  tampilkanLoader();
  const formData = new FormData();
  formData.append("action", "update");
  formData.append("nama", orangDipilih);
  formData.append("tanggal", formatTanggalTeks(tanggalDipilih));
  formData.append("status", statusDipilih);
  formData.append("alasan", alasan);
  formData.append("logbook", logbook);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: formData
    });
    const result = await response.json();

    sembunyikanLoader();
    if (result.result === "updated") {
      await tampilkanModal("Data berhasil diupdate!");
      muatDataDariGoogleSheets();
      resetForm();
    } else {
      await tampilkanModal("Gagal update: " + result.error);
    }
  } catch (err) {
    sembunyikanLoader();
    await tampilkanModal("Terjadi error saat update: " + err.message);
  }
}

// === HAPUS DATA ===
async function hapusData(nama, tanggal) {
  const pesan = `Apakah Anda yakin ingin menghapus data untuk ${nama} pada tanggal ${tanggal}?`;
  const konfirmasi = await tampilkanModal(pesan, 'konfirmasi');
  
  if (!konfirmasi) {
    return;
  }
  
  tampilkanLoader();
  const formData = new FormData();
  formData.append("action", "delete");
  formData.append("nama", nama);
  formData.append("tanggal", tanggal);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: formData
    });
    const result = await response.json();

    sembunyikanLoader();
    if (result.result === "deleted") {
      await tampilkanModal("Data berhasil dihapus!");
      muatDataDariGoogleSheets();
    } else {
      await tampilkanModal("Gagal menghapus data: " + result.error);
    }
  } catch (err) {
    sembunyikanLoader();
    await tampilkanModal("Terjadi error saat menghapus data: " + err.message);
  }
}

// === TAMPILKAN DATA ===
function tampilkanDataTersimpan() {
  const container = document.getElementById("data-list-container");
  container.innerHTML = "";

  if (Object.keys(data).length === 0) {
    const card = document.createElement("div");
    card.className = "data-card";
    card.innerHTML = `<p style='text-align: center; color: #aaa;'>Belum ada data tersimpan.</p>`;
    container.appendChild(card);
    return;
  }

  for (const orang in data) {
    const orangData = data[orang];
    
    const card = document.createElement("div");
    card.className = "data-card";

    const namaOrang = document.createElement("h4");
    namaOrang.textContent = orang;
    card.appendChild(namaOrang);

    const sortedDates = Object.keys(orangData).sort((a, b) => new Date(parseTanggalKeISO(a)) - new Date(parseTanggalKeISO(b)));
    
    sortedDates.forEach(tanggal => {
      const entry = orangData[tanggal];
      
      const itemDiv = document.createElement("div");
      itemDiv.className = "data-item";

      let statusClass = '', statusIcon = '';

      if (entry.status === "Masuk") {
        statusClass = 'status-masuk'; statusIcon = '✅';
      } else if (entry.status === "Tidak Masuk") {
        statusClass = 'status-tidak'; statusIcon = '❌';
      } else if (entry.status === "Izin") {
        statusClass = 'status-izin'; statusIcon = '📝';
      }

      itemDiv.innerHTML = `
        <div>
          <strong class="${statusClass}">${statusIcon} ${tanggal}</strong>: Status - ${entry.status}
        </div>
        <div class="data-item-controls">
          <button class="btn-edit" onclick="editData('${orang}','${tanggal}')">✏️ Edit</button>
          <button class="btn-hapus" onclick="hapusData('${orang}','${tanggal}')">🗑️ Hapus</button>
        </div>
      `;
      card.appendChild(itemDiv);
    });
    container.appendChild(card);
  }
}

// === Fokus textarea di mobile ===
document.getElementById('logbook').addEventListener('focusin', (event) => {
  setTimeout(() => {
    event.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 300);
});

document.getElementById('alasan').addEventListener('focusin', (event) => {
  setTimeout(() => {
    event.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 300);
});