// Ganti dengan URL Web App Google Apps Script Anda
const WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbzAUCUJNQMQqun5wX_8HJozB9RDL2IfPNukoctjS2MpOFVTvL7iJlRCGsRxMNJVzniD-A/exec";

// Konstanta
const KAS_PER_ORANG = 10000; // Rp 10.000 per orang

// Data anggota (akan dimuat dari Google Sheets)
let membersData = [];
let filteredMembers = [];

// Elements
const mingguSelect = document.getElementById("minggu");
const tanggalInput = document.getElementById("tanggal");
const memberListDiv = document.getElementById("memberList");
const loadingList = document.getElementById("loadingList");
const submitBtn = document.getElementById("submitBtn");
const selectAllCheckbox = document.getElementById("selectAll");
const searchInput = document.getElementById("searchInput");
const loadingOverlay = document.getElementById("loadingOverlay");
const successModal = document.getElementById("successModal");
const errorModal = document.getElementById("errorModal");
const errorMessage = document.getElementById("errorMessage");
const totalCountElement = document.getElementById("totalCount");
const totalAmountElement = document.getElementById("totalAmount");

// Set tanggal hari ini sebagai default
const today = new Date();
const formattedDate = today.toISOString().split("T")[0];
tanggalInput.value = formattedDate;

// Load data anggota saat halaman dimuat
window.addEventListener("DOMContentLoaded", () => {
  loadMembers();
  updateTotal(); // Initialize total
});

// Fungsi untuk memuat daftar anggota dari Google Sheets
async function loadMembers() {
  try {
    console.log("Loading members from:", WEBAPP_URL);

    const response = await fetch(`${WEBAPP_URL}?action=getMembers`, {
      method: "GET",
      redirect: "follow",
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    console.log("Response text:", text);

    const result = JSON.parse(text);
    console.log("Parsed result:", result);

    if (result.success) {
      membersData = result.data;
      filteredMembers = [...membersData];
      console.log("Members loaded:", membersData.length);
      renderMemberList();
      loadingList.style.display = "none";
      memberListDiv.style.display = "block";
    } else {
      throw new Error(result.message || "Gagal memuat data");
    }
  } catch (error) {
    console.error("Error loading members:", error);
    loadingList.innerHTML = `
      <div class="modal-icon">⚠️</div>
      <p>Gagal memuat data anggota</p>
      <p style="font-size: 14px; margin-top: 8px; color: #ef4444;">${error.message}</p>
      <p style="font-size: 12px; margin-top: 8px;">Pastikan:</p>
      <ul style="font-size: 12px; text-align: left; max-width: 400px; margin: 8px auto;">
        <li>URL Web App sudah benar</li>
        <li>Web App sudah di-deploy sebagai "Anyone"</li>
        <li>Sheet ID dan nama sheet sudah sesuai</li>
      </ul>
      <button onclick="loadMembers()" style="margin-top: 16px; padding: 8px 16px; background: #195079; color: white; border: none; border-radius: 8px; cursor: pointer;">Coba Lagi</button>
    `;
  }
}

// Fungsi untuk render daftar anggota
function renderMemberList() {
  memberListDiv.innerHTML = "";

  if (filteredMembers.length === 0) {
    memberListDiv.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #64748b;">
        <p>Tidak ada data yang sesuai</p>
      </div>
    `;
    return;
  }

  filteredMembers.forEach((member, index) => {
    const memberItem = document.createElement("div");
    memberItem.className = "member-item";
    memberItem.style.animationDelay = `${index * 0.05}s`;

    memberItem.innerHTML = `
      <div class="member-info">
        <div class="member-name">${member.nama}</div>
        <div class="member-nim">${member.nim}</div>
      </div>
      <label class="checkbox-label">
        <input type="checkbox" class="member-checkbox" data-nim="${member.nim}" data-nama="${member.nama}">
        <span class="checkmark"></span>
      </label>
    `;

    memberListDiv.appendChild(memberItem);
  });

  // Add event listeners untuk checkboxes
  updateCheckboxListeners();
}

// Update event listeners untuk checkboxes
function updateCheckboxListeners() {
  const checkboxes = document.querySelectorAll(".member-checkbox");
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", updateSubmitButton);
  });
}

// Fungsi pencarian
searchInput.addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();
  filteredMembers = membersData.filter(
    (member) =>
      member.nama.toLowerCase().includes(searchTerm) ||
      member.nim.toLowerCase().includes(searchTerm)
  );
  renderMemberList();
  selectAllCheckbox.checked = false;
  updateTotal();
});

// Select all functionality
selectAllCheckbox.addEventListener("change", (e) => {
  const checkboxes = document.querySelectorAll(".member-checkbox");
  checkboxes.forEach((checkbox) => {
    checkbox.checked = e.target.checked;
  });
  updateSubmitButton();
});

// Update submit button state
function updateSubmitButton() {
  const minggu = mingguSelect.value;
  const tanggal = tanggalInput.value;
  const checkedBoxes = document.querySelectorAll(".member-checkbox:checked");

  submitBtn.disabled = !(minggu && tanggal && checkedBoxes.length > 0);

  // Update total pembayaran
  updateTotal();
}

// Update total pembayaran
function updateTotal() {
  const checkedBoxes = document.querySelectorAll(".member-checkbox:checked");
  const count = checkedBoxes.length;
  const totalAmount = count * KAS_PER_ORANG;

  // Update tampilan total dengan animasi
  if (totalCountElement && totalAmountElement) {
    // Animasi counter
    animateValue(
      totalCountElement,
      parseInt(totalCountElement.textContent) || 0,
      count,
      300
    );

    // Format dan update total amount
    totalAmountElement.textContent = formatRupiah(totalAmount);

    // Tambah animasi pulse jika ada perubahan
    if (count > 0) {
      totalAmountElement.style.animation = "none";
      setTimeout(() => {
        totalAmountElement.style.animation = "pulse 2s ease-in-out infinite";
      }, 10);
    }
  }
}

// Animasi counter
function animateValue(element, start, end, duration) {
  const range = end - start;
  const increment = range / (duration / 16); // 60fps
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if (
      (increment > 0 && current >= end) ||
      (increment < 0 && current <= end)
    ) {
      current = end;
      clearInterval(timer);
    }
    element.textContent = Math.round(current);
  }, 16);
}

// Format angka ke Rupiah
function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

// Event listeners untuk form inputs
mingguSelect.addEventListener("change", updateSubmitButton);
tanggalInput.addEventListener("change", updateSubmitButton);

// Submit form
submitBtn.addEventListener("click", async () => {
  const minggu = mingguSelect.value;
  const tanggal = tanggalInput.value;
  const checkedBoxes = document.querySelectorAll(".member-checkbox:checked");

  if (!minggu || !tanggal || checkedBoxes.length === 0) {
    showError("Mohon lengkapi semua data");
    return;
  }

  // Kumpulkan data yang akan dikirim
  const paidMembers = Array.from(checkedBoxes).map((checkbox) => ({
    nim: checkbox.dataset.nim,
    nama: checkbox.dataset.nama,
  }));

  const totalAmount = paidMembers.length * KAS_PER_ORANG;

  const payload = {
    action: "submitPayment",
    minggu: parseInt(minggu),
    tanggal: tanggal,
    members: paidMembers,
  };

  console.log("Sending payload:", payload);

  // Show loading overlay
  loadingOverlay.classList.add("active");

  try {
    const response = await fetch(WEBAPP_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    console.log("Response status:", response.status);

    loadingOverlay.classList.remove("active");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Tampilkan success message dengan detail
    const successMessage = `
      ✅ Data berhasil disimpan!
      
      📋 Minggu ke-${minggu}
      📅 Tanggal: ${formatTanggal(tanggal)}
      👥 Jumlah: ${paidMembers.length} anggota
      💰 Total: ${formatRupiah(totalAmount)}
    `;

    showSuccess(successMessage);
    resetForm();
  } catch (error) {
    console.error("Error submitting payment:", error);
    loadingOverlay.classList.remove("active");
    showError(
      "Request terkirim, tapi tidak dapat mengonfirmasi status.\nSilakan cek Google Sheet untuk memastikan."
    );
  }
});

// Format tanggal Indonesia
function formatTanggal(dateString) {
  const date = new Date(dateString);
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("id-ID", options);
}

// Reset form setelah sukses
function resetForm() {
  mingguSelect.value = "";
  tanggalInput.value = formattedDate;
  selectAllCheckbox.checked = false;
  const checkboxes = document.querySelectorAll(".member-checkbox");
  checkboxes.forEach((checkbox) => (checkbox.checked = false));
  updateSubmitButton();
  updateTotal();
}

// Show success modal
function showSuccess(message = "Data pembayaran berhasil disimpan") {
  const modalText = successModal.querySelector("p");
  modalText.style.whiteSpace = "pre-line";
  modalText.textContent = message;
  successModal.classList.add("active");
}

// Close success modal
function closeModal() {
  successModal.classList.remove("active");
}

// Show error modal
function showError(message) {
  errorMessage.style.whiteSpace = "pre-line";
  errorMessage.textContent = message;
  errorModal.classList.add("active");
}

// Close error modal
function closeErrorModal() {
  errorModal.classList.remove("active");
}

// Close modal when clicking outside
window.addEventListener("click", (e) => {
  if (e.target === successModal) {
    closeModal();
  }
  if (e.target === errorModal) {
    closeErrorModal();
  }
});

// Test connection function
window.testConnection = async function () {
  console.log("Testing connection to:", WEBAPP_URL);
  try {
    const response = await fetch(`${WEBAPP_URL}?action=getMembers`);
    const text = await response.text();
    console.log("Test response:", text);
    alert("Connection successful! Check console for details.");
  } catch (error) {
    console.error("Test failed:", error);
    alert("Connection failed: " + error.message);
  }
};
