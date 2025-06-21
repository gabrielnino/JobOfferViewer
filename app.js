class JobViewerApp {
  constructor() {
    this.allJobs = []; // All jobs from the loaded JSON
    this.addedJobs = []; // Jobs the user has added
    this.displayedAddedJobs = []; // Jobs visible in the sidebar (after filtering)
    this.currentIndex = -1;
    this.fontSize = 20;
    this.filterTimer = null;
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
    
    this.updateFonts();
  }

  handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const data = JSON.parse(event.target.result);
        if (!Array.isArray(data)) {
          throw new Error("JSON file must be an array.");
        }
        this.allJobs = data;
        this.currentIndex = data.length > 0 ? 0 : -1;
        
        if (this.currentIndex !== -1) {
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
      li.dataset.id = job.Id; // Store job ID for quick lookup
      li.addEventListener('click', () => this.jumpToJob(job.Id));
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
    const jobIndex = this.allJobs.findIndex(job => job.Id === jobId);
    if (jobIndex !== -1) {
      this.currentIndex = jobIndex;
      this.updateDisplay();
    }
  }

  updateDisplay() {
    if (this.allJobs.length === 0 || this.currentIndex === -1) {
      this.elements.progressText.textContent = `0 / 0`;
      this.elements.progressBar.value = 0;
      this.toggleNavigation(false);
      return;
    }
    
    const job = this.allJobs[this.currentIndex];
    this.elements.titleText.textContent = job.JobOfferTitle || 'No title';
    this.elements.lblCompany.textContent = `Company: ${job.CompanyName || 'Not specified'}`;
    this.elements.txtDescription.textContent = job.Description || 'No description available';
    
    const isAdded = this.addedJobs.some(j => j.Id === job.Id);
    this.elements.addedIcon.classList.toggle('hidden', !isAdded);
    this.elements.btnDeleteJob.classList.toggle('hidden', !isAdded);
    this.elements.btnAddJob.classList.toggle('hidden', isAdded);

    const hasLink = job.Link && job.Link.trim() !== '';
    this.elements.btnApply.classList.toggle('hidden', !hasLink);
    if(hasLink) this.elements.btnApply.href = job.Link;
    
    this.elements.progressBar.max = this.allJobs.length;
    this.elements.progressBar.value = this.currentIndex + 1;
    this.elements.progressText.textContent = `${this.currentIndex + 1} / ${this.allJobs.length}`;
    document.title = `Job Viewer (${this.currentIndex + 1}/${this.allJobs.length})`;
    this.toggleNavigation(true);
  }

  toggleNavigation(enabled) {
    this.elements.btnPrev.disabled = !enabled || this.currentIndex <= 0;
    this.elements.btnNext.disabled = !enabled || this.currentIndex >= this.allJobs.length - 1;
    this.elements.btnAddJob.disabled = !enabled;
    this.elements.btnDeleteJob.disabled = !enabled;
  }

  navigateJobs(direction) {
    const newIndex = this.currentIndex + direction;
    if (newIndex >= 0 && newIndex < this.allJobs.length) {
      this.currentIndex = newIndex;
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
    // Could also load added jobs from local storage in the future
  }

  saveSettings() {
    localStorage.setItem('jobViewerFontSize', this.fontSize.toString());
  }

  addCurrentJob() {
    if (this.currentIndex < 0) return;
    const currentJob = this.allJobs[this.currentIndex];
    const isAlreadyAdded = this.addedJobs.some(job => job.Id === currentJob.Id);
    if (!isAlreadyAdded) {
      this.addedJobs.push(currentJob);
      this.filterAddedJobs(); // Refresh the displayed list
      this.updateDisplay(); // Update buttons and star icon
    }
  }

  deleteCurrentJob() {
    if (this.currentIndex < 0) return;
    const currentJobId = this.allJobs[this.currentIndex].Id;
    this.addedJobs = this.addedJobs.filter(job => job.Id !== currentJobId);
    this.filterAddedJobs(); // Refresh the displayed list
    this.updateDisplay(); // Update buttons and star icon
  }

  exportJson() {
    if(this.addedJobs.length === 0) {
      alert("No added jobs to export.");
      return;
    }
    const dataStr = JSON.stringify(this.addedJobs, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "my_selected_jobs.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

document.addEventListener('DOMContentLoaded', () => { new JobViewerApp(); });