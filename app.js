class JobViewerApp {
  constructor() {
    // --- STATE ---
    this.allJobs = []; // All jobs from the loaded JSON
    this.addedJobs = []; // Full job objects the user has added
    this.displayedAddedJobs = []; // Jobs visible in the sidebar (after filtering)
    this.currentJobId = null; // Use job ID to track the current job
    this.fontSize = 16; // Adjusted default font size for better readability

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
      titleText: document.getElementById('titleText'),
      addedIcon: document.getElementById('addedIcon'),
      lblCompany: document.getElementById('lblCompany'),
      lblSalary: document.getElementById('lblSalary'),
      txtSummary: document.getElementById('txtSummary'),
      keySkillsList: document.getElementById('keySkillsList'),
      essentialQualificationsList: document.getElementById('essentialQualificationsList'),
      essentialTechSkillsList: document.getElementById('essentialTechSkillsList'),
      otherTechSkillsList: document.getElementById('otherTechSkillsList'),
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
        if (!Array.isArray(data) || (data.length > 0 && typeof data[0].Id === 'undefined')) {
          throw new Error("JSON must be an array of objects, and each object must have a unique 'Id' property.");
        }

        this.allJobs = data;
        this.currentJobId = data.length > 0 ? data[0].Id : null;

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
      li.textContent = `${index + 1}. ${job['Job Offer Title'] || 'Untitled'} - ${job['Company Name'] || 'Unknown'}`;
      li.dataset.Id = job.Id; // Store job ID for quick lookup
      li.addEventListener('click', () => this.jumpToJob(job.Id));
      ul.appendChild(li);
    });
  }

  filterAddedJobs() {
    const searchTerm = this.elements.txtSearch.value.toLowerCase();
    this.displayedAddedJobs = this.addedJobs.filter(job =>
      (job['Job Offer Title'] || '').toLowerCase().includes(searchTerm) ||
      (job['Company Name'] || '').toLowerCase().includes(searchTerm)
    );
    this.updateAddedJobList();
  }

  jumpToJob(jobId) {
    const jobIndex = this.allJobs.findIndex(job => job.Id === jobId);
    if (jobIndex !== -1) {
      this.currentJobId = jobId;
      this.updateDisplay();
    }
  }

  showButtons(isAdded) {
    this.elements.addedIcon.classList.toggle('hidden', !isAdded);
    this.elements.btnDeleteJob.classList.toggle('hidden', !isAdded);
    this.elements.btnAddJob.classList.toggle('hidden', isAdded);
  }

  populateList(element, items, tagClass) {
    element.innerHTML = '';
    if (items && items.length > 0) {
      items.forEach(itemText => {
        const li = document.createElement('li');
        if (tagClass) {
          li.className = tagClass;
        }
        li.textContent = itemText;
        element.appendChild(li);
      });
    }
  }

  updateDisplay() {
    if (!this.currentJobId || this.allJobs.length === 0) {
      this.elements.progressText.textContent = `0 / 0`;
      this.elements.progressBar.value = 0;
      this.toggleNavigation(false, -1);
      return;
    }

    const currentIndex = this.allJobs.findIndex(j => j.Id === this.currentJobId);
    if (currentIndex === -1) {
      console.error("Could not find job with ID:", this.currentJobId);
      this.currentJobId = this.allJobs.length > 0 ? this.allJobs[0].Id : null;
      this.updateDisplay();
      return;
    }
    const job = this.allJobs[currentIndex];

    this.elements.titleText.textContent = job['Job Offer Title'] || 'No title';
    this.elements.lblCompany.textContent = job['Company Name'] || 'Not specified';
    this.elements.lblSalary.textContent = job['Salary or Budget Offered'] || 'Not specified';
    this.elements.txtSummary.textContent = job['Job Offer Summarize'] || 'No summary available.';
    
    this.populateList(this.elements.keySkillsList, job['Key Skills Required'], 'skill-tag');
    this.populateList(this.elements.essentialQualificationsList, job['Essential Qualifications']);
    this.populateList(this.elements.essentialTechSkillsList, job['Essential Technical Skill Qualifications']);
    this.populateList(this.elements.otherTechSkillsList, job['Other Technical Skill Qualifications']);

    const isAdded = this.addedJobs.some(j => j.Id === this.currentJobId);
    const hasLink = job.Url && job.Url.trim() !== '';
    this.elements.btnApply.classList.toggle('hidden', !hasLink);
    if (hasLink) this.elements.btnApply.href = job.Url;

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

    const currentIndex = this.allJobs.findIndex(j => j.Id === this.currentJobId);
    const newIndex = currentIndex + direction;

    if (newIndex >= 0 && newIndex < this.allJobs.length) {
      this.currentJobId = this.allJobs[newIndex].Id;
      this.updateDisplay();
    }
  }

  changeFontSize(delta) {
    const newSize = this.fontSize + delta;
    if (newSize >= 12 && newSize <= 28) {
      this.fontSize = newSize;
      this.updateFonts();
    }
  }

  updateFonts() {
    document.documentElement.style.fontSize = `${this.fontSize}px`;
    this.elements.lblFontSize.textContent = `Font: ${this.fontSize}px`;
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

    const currentJob = this.allJobs.find(j => j.Id === this.currentJobId);
    if (!currentJob) return;

    const isAlreadyAdded = this.addedJobs.some(job => job.Id === this.currentJobId);
    if (!isAlreadyAdded) {
      this.addedJobs.push(currentJob);
      this.filterAddedJobs();
      this.updateDisplay();
    }
  }

  deleteCurrentJob() {
    if (!this.currentJobId) return;

    this.addedJobs = this.addedJobs.filter(job => job.Id !== this.currentJobId);
    this.filterAddedJobs();
    this.updateDisplay();
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
    a.download = "selected_jobs.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

document.addEventListener('DOMContentLoaded', () => { new JobViewerApp(); });