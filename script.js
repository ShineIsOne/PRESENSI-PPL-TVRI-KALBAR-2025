let data = {};
let orangDipilih = "";
let tanggalDipilih = "";
let statusDipilih = "";

// Ganti dengan URL API yang Anda dapatkan dari Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbwYQli8J-Ef8MG8x3jFG9Gg6Dyi9AmMmtcq3J7i7xDmFYmn9s9oNAP4XGZmGkBb4z6q/exec";

// Fungsi untuk memuat data dari Google Sheets saat halaman dimuat
async function muatDataDariGoogleSheets() {
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
    document.getElementById("hasil-section").style.display = "block";
  } catch (error) {
    console.error("Error loading data from Google Sheets:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  muatDataDariGoogleSheets();
});

function pilihOrang(orang) {
  orangDipilih = orang;
  document.getElementById("orang-terpilih").textContent = orang;
  document.getElementById("pilih-orang-section").style.display = "none";
  document.getElementById("form-content").style.display = "block";
  document.getElementById("form-content").style.animation = "fadeIn 0.6s ease";
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
  document.getElementById("form-content").style.display = "none";
  document.getElementById("hasil-section").style.display = "block";

  tampilkanDataTersimpan();
}

function formatTanggalLengkap(date) {
  const hari = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  const bulan = ["Januari","Februari","Maret","April","Mei","Juni",
                 "Juli","Agustus","September","Oktober","November","Desember"];
  return `${hari[date.getDay()]}, ${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
}

function tampilkanTanggal() {
  let inputTanggal = document.getElementById("tanggal").value;
  if (!inputTanggal) return;

  let tgl = new Date(inputTanggal);
  tanggalDipilih = inputTanggal;
  document.getElementById("tanggal-terpilih").textContent = "Tanggal dipilih: " + formatTanggalLengkap(tgl);
}

function pilihStatus(status) {
  statusDipilih = status;

  document.querySelectorAll(".pilihan button").forEach(b => b.classList.remove("active"));

  if (status === "Masuk") {
    document.querySelector(".btn-masuk").classList.add("active");
    document.getElementById("form-logbook").style.display = "block";
    document.getElementById("form-alasan").style.display = "none";
  } 
  else if (status === "Tidak Masuk") {
    document.querySelector(".btn-tidak").classList.add("active");
    document.getElementById("form-alasan").style.display = "block";
    document.getElementById("form-logbook").style.display = "none";
  } 
  else if (status === "Izin") {
    document.querySelector(".btn-izin").classList.add("active");
    document.getElementById("form-alasan").style.display = "block";
    document.getElementById("form-logbook").style.display = "none";
  }
}

async function simpanData() {
  if (!orangDipilih || !tanggalDipilih || !statusDipilih) {
    alert("Lengkapi semua data!");
    return;
  }

  let alasan = document.getElementById("alasan").value.trim();
  let logbook = document.getElementById("logbook").value.trim();

  if (statusDipilih === "Masuk" && logbook === "") {
    alert("Logbook tidak boleh kosong saat status 'Masuk'.");
    return;
  }
  if ((statusDipilih === "Tidak Masuk" || statusDipilih === "Izin") && alasan === "") {
    alert("Alasan tidak boleh kosong.");
    return;
  }

  const dataToSave = {
    nama: orangDipilih,
    tanggal: tanggalDipilih,
    status: statusDipilih,
    alasan: statusDipilih !== "Masuk" ? alasan : "",
    logbook: statusDipilih === "Masuk" ? logbook : ""
  };
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(dataToSave),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    if (result.result === "success") {
      alert("Data berhasil disimpan!");
      muatDataDariGoogleSheets();
    } else {
      alert("Gagal menyimpan data.");
    }
  } catch (error) {
    console.error("Error saving data:", error);
    alert("Gagal menyimpan data. Silakan coba lagi. Lihat konsol browser untuk detail.");
  }
  
  resetForm();
}

function tampilkanDataTersimpan() {
  const container = document.getElementById("data-list-container");
  container.innerHTML = "";

  if (Object.keys(data).length === 0) {
    container.innerHTML = "<p style='text-align: center; color: #aaa;'>Belum ada data tersimpan.</p>";
    return;
  }

  for (const orang in data) {
    const orangData = data[orang];
    const orangDiv = document.createElement("div");
    orangDiv.className = "data-item";
    
    const iconDiv = document.createElement("div");
    iconDiv.className = "item-icon";
    iconDiv.textContent = orang.charAt(0);
    orangDiv.appendChild(iconDiv);

    const contentDiv = document.createElement("div");
    contentDiv.className = "item-content";

    const namaOrang = document.createElement("h4");
    namaOrang.textContent = `Absensi ${orang}`;
    contentDiv.appendChild(namaOrang);

    const sortedDates = Object.keys(orangData).sort((a, b) => new Date(a) - new Date(b));

    sortedDates.forEach(tanggal => {
      const entry = orangData[tanggal];
      const tanggalFormat = formatTanggalLengkap(new Date(tanggal));
      
      const p = document.createElement("p");
      let statusClass = '';
      let statusIcon = '';

      if (entry.status === "Masuk") {
        statusClass = 'status-masuk';
        statusIcon = '✅';
      } else if (entry.status === "Tidak Masuk") {
        statusClass = 'status-tidak';
        statusIcon = '❌';
      } else if (entry.status === "Izin") {
        statusClass = 'status-izin';
        statusIcon = '📝';
      }

      p.innerHTML = `<strong class="${statusClass}">${statusIcon} ${tanggalFormat}</strong>: Status - ${entry.status}`;

      if (entry.status === "Masuk") {
        p.innerHTML += `<br>Logbook: ${entry.logbook}`;
      } else {
        p.innerHTML += `<br>Alasan: ${entry.alasan}`;
      }
      contentDiv.appendChild(p);
    });
    orangDiv.appendChild(contentDiv);
    container.appendChild(orangDiv);
  }
}