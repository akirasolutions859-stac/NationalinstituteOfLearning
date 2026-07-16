// ==========================================
// NIOL Google Forms App Controller
// ==========================================

const COURSES = [
  'Kids Skills Development',
  'Career Development',
  'Business Communication',
  'Personal Productivity',
  'Spoken English',
  'French Language',
  'German Language',
  'IELTS Preparation',
  'Digital Marketing',
  'E-Commerce',
  'Web Development',
  'Full Stack Development',
  'Python',
  'Data Analytics',
  'Generative AI',
  'Laptop Reparing Training',
  'Hardware and Networking',
  'Professional Accounting',
  'Tally with Advance Excel',
  'Graphic Designing',
  'Video Editing',
  'Motion Graphics',
  'Digital Marketing 90 Days',
  'Interview Preparation',
  'Personality Development',
  'Cyber Security' // The requested addition!
];

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('google-style-form');
  const courseFilterInput = document.getElementById('course-filter-input');
  const coursesRadioList = document.getElementById('courses-radio-list');
  
  const sameAsPhoneCheckbox = document.getElementById('same-as-phone');
  const phoneInput = document.getElementById('phone');
  const whatsappInput = document.getElementById('whatsapp');
  
  const cvFileInput = document.getElementById('cv-file');
  const btnFileTrigger = document.getElementById('btn-file-trigger');
  const fileNameLabel = document.getElementById('file-name-label');
  
  const successScreen = document.getElementById('success-screen');
  const successName = document.getElementById('success-name');
  const successPhone = document.getElementById('success-phone');
  const successWhatsapp = document.getElementById('success-whatsapp');
  const successCourse = document.getElementById('success-course');
  const successCv = document.getElementById('success-cv');
  
  const submitAnotherLink = document.getElementById('submit-another-link');
  const clearFormBtn = document.getElementById('clear-form-btn');

  let activeSearch = '';
  let cvFileData = null;
  let cvFileName = '';

  // Render course radio selections
  renderCourses();
  setupSyncPhoneToWhatsapp();
  setupCvUpload();

  // Setup CV upload listeners
  function setupCvUpload() {
    btnFileTrigger.addEventListener('click', () => {
      cvFileInput.click();
    });

    cvFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) {
        cvFileData = null;
        cvFileName = '';
        fileNameLabel.textContent = 'No file selected';
        return;
      }

      // Validate type
      const fileType = file.type;
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      const fileExt = file.name.split('.').pop().toLowerCase();
      const validExts = ['pdf', 'jpg', 'jpeg'];
      
      if (!validTypes.includes(fileType) && !validExts.includes(fileExt)) {
        showError('cv', 'q-card-cv');
        cvFileInput.value = '';
        cvFileData = null;
        cvFileName = '';
        fileNameLabel.textContent = 'No file selected';
        return;
      }

      // Validate size: 2MB max
      if (file.size > 2 * 1024 * 1024) {
        showError('cv', 'q-card-cv');
        const err = document.getElementById('cv-error');
        if (err) err.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> File size exceeds 2MB limit.';
        cvFileInput.value = '';
        cvFileData = null;
        cvFileName = '';
        fileNameLabel.textContent = 'No file selected';
        return;
      }

      hideError('cv');
      const err = document.getElementById('cv-error');
      if (err) err.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Please upload your CV in PDF or JPEG format';
      
      cvFileName = file.name;
      fileNameLabel.textContent = file.name;

      // Read file as base64 data URL
      const reader = new FileReader();
      reader.onload = function(evt) {
        cvFileData = evt.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Populate course list dynamically
  function renderCourses() {
    coursesRadioList.innerHTML = '';
    
    COURSES.forEach((courseName, idx) => {
      const row = document.createElement('div');
      row.className = 'radio-row';
      row.dataset.name = courseName.toLowerCase();
      
      const id = `course-opt-${idx}`;
      row.innerHTML = `
        <input type="radio" id="${id}" name="course" value="${courseName}">
        <label for="${id}" class="radio-label">${courseName}</label>
      `;
      
      // Clicking the row triggers selection
      row.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT') {
          const radio = row.querySelector('input[type="radio"]');
          radio.checked = true;
          hideError('course');
        }
      });

      // Add direct change handler to radio button
      row.querySelector('input[type="radio"]').addEventListener('change', () => {
        hideError('course');
      });

      coursesRadioList.appendChild(row);
    });
  }

  // Filter courses based on search
  courseFilterInput.addEventListener('input', (e) => {
    activeSearch = e.target.value.toLowerCase().trim();
    const rows = coursesRadioList.querySelectorAll('.radio-row');
    
    rows.forEach(row => {
      const name = row.dataset.name;
      if (name.includes(activeSearch)) {
        row.style.display = 'flex';
      } else {
        row.style.display = 'none';
      }
    });
  });

  // Sync Phone to WhatsApp number logic
  function setupSyncPhoneToWhatsapp() {
    const handleSync = () => {
      if (sameAsPhoneCheckbox.checked) {
        whatsappInput.value = phoneInput.value;
        whatsappInput.disabled = true;
        hideError('whatsapp');
      } else {
        whatsappInput.disabled = false;
      }
    };

    sameAsPhoneCheckbox.addEventListener('change', handleSync);
    phoneInput.addEventListener('input', () => {
      if (sameAsPhoneCheckbox.checked) {
        whatsappInput.value = phoneInput.value;
      }
    });

    handleSync();
  }

  // Form Validation & Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const isValid = validateForm();
    if (!isValid) {
      // Scroll to the first invalid card
      const firstInvalidCard = document.querySelector('.question-card.invalid');
      if (firstInvalidCard) {
        firstInvalidCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    // Get selected course value
    const selectedCourseRadio = form.querySelector('input[name="course"]:checked');
    const selectedCourseVal = selectedCourseRadio ? selectedCourseRadio.value : '';

    const payload = {
      name: document.getElementById('full-name').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: phoneInput.value.trim(),
      whatsapp: whatsappInput.value.trim(),
      course: selectedCourseVal,
      location: document.getElementById('location').value.trim(),
      summary: document.getElementById('summary').value.trim(),
      details: document.getElementById('details').value.trim(),
      cvFile: cvFileData,
      cvFileName: cvFileName
    };

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        // Enable Title Card View Website button
        const titleViewSiteBtn = document.getElementById('title-view-site-btn');
        if (titleViewSiteBtn) {
          titleViewSiteBtn.classList.remove('disabled-btn');
          titleViewSiteBtn.removeAttribute('tabindex');
        }

        // Pop success data
        successName.textContent = payload.name;
        successPhone.textContent = payload.phone;
        successWhatsapp.textContent = payload.whatsapp;
        successCourse.textContent = payload.course;
        successCv.textContent = payload.cvFileName || 'cv_file.pdf';
        
        // Toggle view
        form.style.display = 'none';
        successScreen.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(result.error || 'Server error. Failed to save application.');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      alert('Network error. Failed to connect to server.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit';
    }
  });

  // Validation Utilities
  function showError(fieldId, cardId) {
    const card = document.getElementById(cardId);
    if (card) card.classList.add('invalid');
    const errSpan = document.getElementById(`${fieldId}-error`);
    if (errSpan) errSpan.style.display = 'block';
  }

  function hideError(fieldId) {
    // Find matching card id
    let cardId = '';
    if (fieldId === 'full-name') cardId = 'q-card-name';
    else if (fieldId === 'email') cardId = 'q-card-email';
    else if (fieldId === 'phone') cardId = 'q-card-phone';
    else if (fieldId === 'whatsapp') cardId = 'q-card-whatsapp';
    else if (fieldId === 'summary') cardId = 'q-card-summary';
    else if (fieldId === 'location') cardId = 'q-card-location';
    else if (fieldId === 'course') cardId = 'q-card-course';
    else if (fieldId === 'cv') cardId = 'q-card-cv';

    const card = document.getElementById(cardId);
    if (card) card.classList.remove('invalid');
    const errSpan = document.getElementById(`${fieldId}-error`);
    if (errSpan) errSpan.style.display = 'none';
  }

  // Real-time error clearance on typing
  const fields = ['full-name', 'email', 'phone', 'whatsapp', 'summary', 'location', 'cv'];
  fields.forEach(fieldId => {
    const input = document.getElementById(fieldId);
    if (input) {
      input.addEventListener('input', () => {
        hideError(fieldId);
      });
    }
  });

  function validateForm() {
    let isValid = true;

    // Name check
    const name = document.getElementById('full-name').value.trim();
    if (name.length < 2) {
      showError('full-name', 'q-card-name');
      isValid = false;
    } else {
      hideError('full-name');
    }

    // Email check
    const email = document.getElementById('email').value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('email', 'q-card-email');
      isValid = false;
    } else {
      hideError('email');
    }

    // Phone check
    const phone = phoneInput.value.trim();
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      showError('phone', 'q-card-phone');
      isValid = false;
    } else {
      hideError('phone');
    }

    // WhatsApp check
    const whatsapp = whatsappInput.value.trim();
    if (!sameAsPhoneCheckbox.checked && !phoneRegex.test(whatsapp)) {
      showError('whatsapp', 'q-card-whatsapp');
      isValid = false;
    } else {
      hideError('whatsapp');
    }

    // Summary check
    const summary = document.getElementById('summary').value.trim();
    if (summary.length < 2) {
      showError('summary', 'q-card-summary');
      isValid = false;
    } else {
      hideError('summary');
    }

    // Location check
    const location = document.getElementById('location').value.trim();
    if (location.length < 2) {
      showError('location', 'q-card-location');
      isValid = false;
    } else {
      hideError('location');
    }

    // Course selected check
    const selectedCourseRadio = form.querySelector('input[name="course"]:checked');
    if (!selectedCourseRadio) {
      showError('course', 'q-card-course');
      isValid = false;
    } else {
      hideError('course');
    }

    // CV uploaded check
    if (!cvFileData) {
      showError('cv', 'q-card-cv');
      isValid = false;
    } else {
      hideError('cv');
    }

    return isValid;
  }

  // Clear Form handler
  clearFormBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the form? All inputs will be reset.')) {
      form.reset();
      
      // Clear errors
      fields.forEach(fieldId => hideError(fieldId));
      hideError('course');
      
      // Re-enable whatsapp input if checkbox sync is off (form reset resets checked)
      setupSyncPhoneToWhatsapp();
      
      // Reset radio select styling
      const selectedRadio = form.querySelector('input[name="course"]:checked');
      if (selectedRadio) selectedRadio.checked = false;
      
      // Reset CV file data
      cvFileData = null;
      cvFileName = '';
      fileNameLabel.textContent = 'No file selected';
      cvFileInput.value = '';
      
      // Disable Title Card View Website button again
      const titleViewSiteBtn = document.getElementById('title-view-site-btn');
      if (titleViewSiteBtn) {
        titleViewSiteBtn.classList.add('disabled-btn');
        titleViewSiteBtn.setAttribute('tabindex', '-1');
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // Submit another response handler
  submitAnotherLink.addEventListener('click', (e) => {
    e.preventDefault();
    form.reset();
    
    // Clear errors
    fields.forEach(fieldId => hideError(fieldId));
    hideError('course');
    
    // Setup initial whatsapp sync
    setupSyncPhoneToWhatsapp();

    // Reset CV file data
    cvFileData = null;
    cvFileName = '';
    fileNameLabel.textContent = 'No file selected';
    cvFileInput.value = '';
    
    // Disable Title Card View Website button again
    const titleViewSiteBtn = document.getElementById('title-view-site-btn');
    if (titleViewSiteBtn) {
      titleViewSiteBtn.classList.add('disabled-btn');
      titleViewSiteBtn.setAttribute('tabindex', '-1');
    }
    
    // Show form, hide success
    successScreen.style.display = 'none';
    form.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
