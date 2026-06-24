// ===== KIRTI PHARMA — prescription.js =====
// Drag-drop upload, camera capture, WhatsApp redirect

document.addEventListener('DOMContentLoaded', () => {
  initDropzone();
  initCamera();
});

// ===== DROPZONE =====
function initDropzone() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('prescription-file');
  const previewSection = document.getElementById('upload-preview-section');
  const previewName = document.getElementById('preview-file-name');
  const previewThumb = document.getElementById('preview-thumb');
  const successMsg = document.getElementById('upload-success-msg');

  if (!dropzone || !fileInput) return;

  // Click to open
  dropzone.addEventListener('click', () => fileInput.click());
  document.getElementById('browse-link')?.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  // Keyboard accessibility
  dropzone.setAttribute('tabindex', '0');
  dropzone.setAttribute('role', 'button');
  dropzone.setAttribute('aria-label', 'Upload prescription — click or drag & drop');
  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') fileInput.click();
  });

  // Drag events
  ['dragenter', 'dragover'].forEach(ev => {
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });
  });

  ['dragleave', 'dragend'].forEach(ev => {
    dropzone.addEventListener(ev, () => dropzone.classList.remove('drag-over'));
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  // File input change
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
  });

  function handleFile(file) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      showToast('Please upload a JPG, PNG, or PDF file', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('File too large. Maximum size is 10MB', 'error');
      return;
    }

    // Show preview
    if (previewSection) previewSection.style.display = 'flex';
    if (previewName) previewName.textContent = file.name;

    if (previewThumb && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewThumb.src = e.target.result;
        previewThumb.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else if (previewThumb) {
      previewThumb.style.display = 'none';
    }

    // Update dropzone
    dropzone.querySelector('.dropzone-icon').textContent = '✅';
    dropzone.querySelector('.dropzone-title').textContent = 'Prescription uploaded!';

    // Show success message
    if (successMsg) {
      successMsg.style.display = 'flex';
      successMsg.style.opacity = '0';
      setTimeout(() => {
        successMsg.style.transition = 'opacity 0.5s ease';
        successMsg.style.opacity = '1';
      }, 50);
    }

    showToast('Prescription uploaded successfully!', 'success');

    // Track upload
    logUploadEvent(file.name);
  }
}

// ===== CAMERA CAPTURE =====
function initCamera() {
  const cameraBtn = document.getElementById('camera-btn');
  const cameraInput = document.getElementById('camera-input');
  if (!cameraBtn || !cameraInput) return;

  cameraBtn.addEventListener('click', () => {
    if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
      cameraInput.click();
    } else {
      showToast('Camera not supported in this browser', 'error');
    }
  });

  cameraInput.addEventListener('change', () => {
    if (cameraInput.files[0]) {
      // Trigger same handler as dropzone
      const event = new Event('change');
      const fileInput = document.getElementById('prescription-file');
      if (fileInput) {
        // Create a DataTransfer to set files
        const dt = new DataTransfer();
        dt.items.add(cameraInput.files[0]);
        fileInput.files = dt.files;
        fileInput.dispatchEvent(event);
      }
    }
  });
}

// ===== WHATSAPP REDIRECT =====
function sendOnWhatsApp() {
  const msg = encodeURIComponent(
    'Hi Kirti Pharma,\n\nI would like to place a medicine order. Please assist me.\n\nThank you.'
  );
  window.open(`https://wa.me/${KP.WA_NUMBER}?text=${msg}`, '_blank');
}

// ===== ANALYTICS =====
function logUploadEvent(fileName) {
  // Placeholder for analytics integration
  console.log('[KP] Prescription uploaded:', fileName, new Date().toISOString());
}

// ===== REUPLOAD =====
function reuploadPrescription() {
  document.getElementById('prescription-file').click();
}
