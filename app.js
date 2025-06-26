class JobViewerApp {
  constructor() {
    // --- STATE ---
    this.allJobs = []; // All jobs from the loaded JSON
    this.addedJobs = []; // Full job objects the user has added
    this.displayedAddedJobs = []; // Jobs visible in the sidebar (after filtering)
    this.currentJobId = null; // Use job ID to track the current job instead of index
    this.fontSize = 20;

    // --- HELPERS ---
    this.filterTimer = null;

    // --- INITIALIZATION ---
    this.loadSettings();
    this.bindUI();
  }

  bindUI() {
    // A single place to query all DOM elements
    this.elements = {
      btnLoad: document.getElementById('btnLoad'),
      fileInput: document.getElementById('fileInput'),
      btnDecreaseFont: document.getElementById('btnDecreaseFont'),
      btnIncreaseFont: document.getElementById('btnIncreaseFont'),
      lblFontSize: document.getElementById('lblFontSize'),
      placeholder: document.getElementById('placeholder'),
      jobContent: document.getElementById('jobContent'),
      lblTitle: document.getElementById('lblTitle'),
      titleText: document.getElementById('titleText'),
      addedIcon: document.getElementById('addedIcon'),
      lblCompany: document.getElementById('lblCompany'),
      lblSalary: document.getElementById('lblSalary'),
      txtDescription: document.getElementById('txtDescription'),
      btnApply: document.getElementById('btnApply'),
      btnPrev: document.getElementById('btnPrev'),
      btnNext: document.getElementById('btnNext'),
      progressBar: document.getElementById('progressBar'),
      progressText: document.getElementById('progressText'),
      btnAddJob: document.getElementById('btnAddJob'),
      btnDeleteJob: document.getElementById('btnDeleteJob'),
      btnExportJson: document.getElementById('btnExportJson'),
      addedJobList: document.getElementById('addedJobList'),
      txtSearch: document.getElementById('txtSearch'),
    };

    // Bind all event listeners
    this.elements.btnLoad.addEventListener('click', () => this.elements.fileInput.click());
    this.elements.fileInput.addEventListener('change', (e) => this.handleFileChange(e));
    this.elements.btnDecreaseFont.addEventListener('click', () => this.changeFontSize(-1));
    this.elements.btnIncreaseFont.addEventListener('click', () => this.changeFontSize(1));
    this.elements.btnPrev.addEventListener('click', () => this.navigateJobs(-1));
    this.elements.btnNext.addEventListener('click', () => this.navigateJobs(1));
    this.elements.btnAddJob.addEventListener('click', () => this.addCurrentJob());
    this.elements.btnDeleteJob.addEventListener('click', () => this.deleteCurrentJob());
    this.elements.btnExportJson.addEventListener('click', () => this.exportJson());
    this.elements.txtSearch.addEventListener('input', () => this.filterAddedJobs());

    // Initial UI state
    this.elements.btnAddJob.classList.add('hidden');
    this.elements.btnDeleteJob.classList.add('hidden');
    this.elements.addedIcon.classList.add('hidden');
    this.updateFonts();
  }

  handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const data = JSON.parse(event.target.result);
        if (!Array.isArray(data) || (data.length > 0 && typeof data[0].ID === 'undefined')) {
          throw new Error("JSON must be an array of objects, and each object must have a unique 'ID' property.");
        }

        this.allJobs = data;
        // Set the current job to the ID of the first job, or null if empty
        this.currentJobId = data.length > 0 ? data[0].ID : null;

        if (this.currentJobId !== null) {
          this.elements.placeholder.classList.add('hidden');
          this.elements.jobContent.classList.remove('hidden');
        } else {
          this.elements.placeholder.classList.remove('hidden');
          this.elements.jobContent.classList.add('hidden');
        }

        this.updateDisplay();
        console.log(`Loaded ${data.length} jobs from ${file.name}`);
      } catch (error) {
        alert(`Failed to load file: ${error.message}`);
      }
    };
    reader.onerror = () => alert(`Error reading file: ${reader.error}`);
    reader.readAsText(file);
  }

  updateAddedJobList() {
    const ul = this.elements.addedJobList;
    ul.innerHTML = ""; // Clear existing list
    this.displayedAddedJobs.forEach((job, index) => {
      const li = document.createElement("li");
      li.textContent = `${index + 1}. ${job.JobOfferTitle || 'Untitled'} - ${job.CompanyName || 'Unknown'}`;
      li.dataset.ID = job.ID; // Store job ID for quick lookup
      li.addEventListener('click', () => this.jumpToJob(job.ID));
      ul.appendChild(li);
    });
  }

  filterAddedJobs() {
    const searchTerm = this.elements.txtSearch.value.toLowerCase();
    this.displayedAddedJobs = this.addedJobs.filter(job =>
      (job.JobOfferTitle || '').toLowerCase().includes(searchTerm) ||
      (job.CompanyName || '').toLowerCase().includes(searchTerm)
    );
    this.updateAddedJobList();
  }

  jumpToJob(jobId) {
    // Ensure the job ID exists in the main list before jumping
    const jobIndex = this.allJobs.findIndex(job => job.ID === jobId);
    if (jobIndex !== -1) {
      this.currentJobId = jobId; // Set the current ID
      this.updateDisplay();
    }
  }

  showButtons(isAdded) {
    this.elements.addedIcon.classList.toggle('hidden', !isAdded);
    this.elements.btnDeleteJob.classList.toggle('hidden', !isAdded);
    this.elements.btnAddJob.classList.toggle('hidden', isAdded);
  }

  updateDisplay() {
    // If there's no current ID or no jobs loaded, show empty state
    if (!this.currentJobId || this.allJobs.length === 0) {
      this.elements.progressText.textContent = `0 / 0`;
      this.elements.progressBar.value = 0;
      this.toggleNavigation(false, -1);
      return;
    }

    // Find the current job and its index using the currentJobId
    const currentIndex = this.allJobs.findIndex(j => j.ID === this.currentJobId);
    if (currentIndex === -1) {
        console.error("Could not find job with ID:", this.currentJobId);
        // Optionally reset to the first job or show an error
        this.currentJobId = this.allJobs.length > 0 ? this.allJobs[0].ID : null;
        this.updateDisplay();
        return;
    }
    const job = this.allJobs[currentIndex];

    // Update UI elements
    this.elements.titleText.textContent = job.JobOfferTitle || 'No title';
    this.elements.lblCompany.textContent = `Company: ${job.CompanyName || 'Not specified'}`;
    this.elements.txtDescription.textContent = job.Description || 'No description available';
    
    // Check if the current job has been added
    const isAdded = this.addedJobs.some(j => j.ID === this.currentJobId);

    const hasLink = job.Link && job.Link.trim() !== '';
    this.elements.btnApply.classList.toggle('hidden', !hasLink);
    if (hasLink) this.elements.btnApply.href = job.Link;

    // Update progress bar and navigation using the found index
    this.elements.progressBar.max = this.allJobs.length;
    this.elements.progressBar.value = currentIndex + 1;
    this.elements.progressText.textContent = `${currentIndex + 1} / ${this.allJobs.length}`;
    document.title = `Job Viewer (${currentIndex + 1}/${this.allJobs.length})`;

    this.toggleNavigation(true, currentIndex);
    this.showButtons(isAdded);
  }

  toggleNavigation(enabled, currentIndex) {
    this.elements.btnPrev.disabled = !enabled || currentIndex <= 0;
    this.elements.btnNext.disabled = !enabled || currentIndex >= this.allJobs.length - 1;
    this.elements.btnAddJob.disabled = !enabled;
    this.elements.btnDeleteJob.disabled = !enabled;
  }

  navigateJobs(direction) {
    if (!this.currentJobId) return;

    // Find the index of the current job
    const currentIndex = this.allJobs.findIndex(j => j.ID === this.currentJobId);
    const newIndex = currentIndex + direction;

    // Check if the new index is within the bounds of the jobs array
    if (newIndex >= 0 && newIndex < this.allJobs.length) {
      // Update the currentJobId to the ID of the next/previous job
      this.currentJobId = this.allJobs[newIndex].ID;
      this.updateDisplay();
    }
  }

  changeFontSize(delta) {
    const newSize = this.fontSize + delta;
    if (newSize >= 10 && newSize <= 28) {
      this.fontSize = newSize;
      this.updateFonts();
    }
  }

  updateFonts() {
    document.body.style.fontSize = `${this.fontSize}px`;
    this.elements.lblFontSize.textContent = `Font: ${this.fontSize}pt`;
    this.saveSettings();
  }

  loadSettings() {
    const savedSize = localStorage.getItem('jobViewerFontSize');
    if (savedSize) this.fontSize = parseInt(savedSize, 10);
  }

  saveSettings() {
    localStorage.setItem('jobViewerFontSize', this.fontSize.toString());
  }

  addCurrentJob() {
    if (!this.currentJobId) return;

    // Find the full job object from the master list
    const currentJob = this.allJobs.find(j => j.ID === this.currentJobId);
    if (!currentJob) return;

    const isAlreadyAdded = this.addedJobs.some(job => job.ID === this.currentJobId);
    if (!isAlreadyAdded) {
      this.addedJobs.push(currentJob);
      this.filterAddedJobs(); // Refresh the displayed list
      this.updateDisplay(); // Update buttons and star icon
    }
  }

  deleteCurrentJob() {
    if (!this.currentJobId) return;

    this.addedJobs = this.addedJobs.filter(job => job.ID !== this.currentJobId);
    this.filterAddedJobs(); // Refresh the displayed list
    this.updateDisplay(); // Update buttons and star icon
  }

  exportJson() {
    if (this.addedJobs.length === 0) {
      alert("No added jobs to export.");
      return;
    }
    const dataStr = JSON.stringify(this.addedJobs, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "completed_selecte_jobs.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

document.addEventListener('DOMContentLoaded', () => { new JobViewerApp(); });