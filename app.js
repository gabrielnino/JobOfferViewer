class JobViewerApp {
  constructor() {
    this.jobData = [];
    this.filteredData = [];
    this.currentIndex = -1;
    this.fontSize = 20;
    this.filterTimer = null;
    this.loadSettings();
    this.initUI();
  }

  initUI() {
    this.elements = {
      btnLoad: document.getElementById('btnLoad'),
      fileInput: document.getElementById('fileInput'),
      btnDecreaseFont: document.getElementById('btnDecreaseFont'),
      btnIncreaseFont: document.getElementById('btnIncreaseFont'),
      lblFontSize: document.getElementById('lblFontSize'),
      placeholder: document.getElementById('placeholder'),
      jobContent: document.getElementById('jobContent'),
      lblTitle: document.getElementById('lblTitle'),
      lblCompany: document.getElementById('lblCompany'),
      lblSalary: document.getElementById('lblSalary'),
      txtDescription: document.getElementById('txtDescription'),
      btnApply: document.getElementById('btnApply'),
      btnPrev: document.getElementById('btnPrev'),
      btnNext: document.getElementById('btnNext'),
      progressBar: document.getElementById('progressBar'),
      logViewer: document.getElementById('logViewer'),
      btnAddJob: document.getElementById('btnAddJob'),
      btnDeleteJob: document.getElementById('btnDeleteJob'),
      btnExportJson: document.getElementById('btnExportJson'),
      addedJobList: document.getElementById('addedJobList'),
      addedIcon: document.getElementById('addedIcon')
    };

    this.elements.btnLoad.addEventListener('click', () => this.elements.fileInput.click());
    this.elements.fileInput.addEventListener('change', (e) => this.handleFileChange(e));
    this.elements.btnDecreaseFont.addEventListener('click', () => this.decreaseFontSize());
    this.elements.btnIncreaseFont.addEventListener('click', () => this.increaseFontSize());
    this.elements.btnPrev.addEventListener('click', () => this.prevJob());
    this.elements.btnNext.addEventListener('click', () => this.nextJob());
    this.elements.btnApply.addEventListener('click', () => this.openJobLink());
    this.elements.btnAddJob.addEventListener('click', () => this.addCurrentJob());
    this.elements.btnDeleteJob.addEventListener('click', () => this.deleteCurrentJob());
    this.elements.btnExportJson.addEventListener('click', () => this.exportJson());
    this.elements.titleText = document.getElementById('titleText');
    this.updateFonts();
  }

  handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const data = JSON.parse(event.target.result);
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("JSON file must contain a non-empty array of job objects");
        }
        this.jobData = data;
        this.currentIndex = 0;
        this.elements.placeholder.classList.add('hidden');
        this.elements.jobContent.classList.remove('hidden');
        this.elements.btnApply.classList.add('hidden');
        this.updateDisplay();
        this.log(`✅ Loaded ${data.length} jobs from ${file.name}`);
      } catch (error) {
        this.log(`❌ Failed to load JSON: ${error.message}`);
        alert(`Failed to load file: ${error.message}`);
      }
    };
    reader.onerror = () => {
      this.log(`❌ Error reading file: ${reader.error}`);
      alert(`Error reading file: ${reader.error}`);
    };
    reader.readAsText(file);
  }

  updateAddedJobList() {
    const ul = this.elements.addedJobList;
    ul.innerHTML = "";
    this.filteredData.forEach((job, index) => {
      const li = document.createElement("li");
      li.textContent = `${index + 1}. ${job.JobOfferTitle || 'Untitled'} - ${job.CompanyName || 'Unknown company'}`;
      ul.appendChild(li);
    });
  }

  updateDisplay() {
    if (this.jobData.length === 0 || this.currentIndex < 0) return;
    const job = this.jobData[this.currentIndex];
    this.elements.titleText.textContent = job.JobOfferTitle || 'No title';
    const existsInFiltered = this.filteredData.some(j => j.Id === job.Id);
    this.elements.addedIcon.classList.toggle('hidden', !existsInFiltered);
    this.elements.btnDeleteJob.classList.toggle('hidden', !existsInFiltered);
    this.elements.lblCompany.textContent = `Company: ${job.CompanyName || 'Not specified'}`;
    const salary = job.SalaryOrBudgetOffered;
    if (salary) {
      this.elements.lblSalary.textContent = `Salary/Budget: ${salary}`;
      this.elements.lblSalary.style.display = 'block';
    } else {
      this.elements.lblSalary.style.display = 'none';
    }
    this.elements.txtDescription.textContent = job.Description || 'No description available';
    const hasLink = job.Link && job.Link.trim() !== '';
    this.elements.btnApply.classList.toggle('hidden', !hasLink);
    this.elements.progressBar.max = this.jobData.length;
    this.elements.progressBar.value = this.currentIndex + 1;
    document.title = `Job Offer Viewer (${this.currentIndex + 1}/${this.jobData.length})`;
    this.toggleNavigation(true);
  }

  toggleNavigation(enabled) {
    this.elements.btnPrev.disabled = !enabled || this.currentIndex <= 0;
    this.elements.btnNext.disabled = !enabled || this.currentIndex >= this.jobData.length - 1;
  }

  nextJob() {
    if (this.currentIndex < this.jobData.length - 1) {
      this.currentIndex++;
      this.updateDisplay();
      this.log(`➡ Job ${this.currentIndex + 1}/${this.jobData.length}`);
    }
  }

  prevJob() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateDisplay();
      this.log(`⬅ Job ${this.currentIndex + 1}/${this.jobData.length}`);
    }
  }

  openJobLink() {
    if (this.jobData.length > 0 && this.currentIndex >= 0) {
      const job = this.jobData[this.currentIndex];
      if (job.Link && job.Link.trim() !== '') {
        window.open(job.Link, '_blank');
        this.log(`🌐 Opened: ${job.Link}`);
      }
    }
  }

  updateFonts() {
    document.body.style.fontSize = `${this.fontSize}px`;
    this.elements.lblFontSize.textContent = `Font: ${this.fontSize}pt`;
    this.saveSettings();
  }

  increaseFontSize() {
    if (this.fontSize < 24) {
      this.fontSize++;
      this.updateFonts();
      this.log(`🔍 Increased font size to ${this.fontSize}pt`);
    }
  }

  decreaseFontSize() {
    if (this.fontSize > 8) {
      this.fontSize--;
      this.updateFonts();
      this.log(`🔍 Decreased font size to ${this.fontSize}pt`);
    }
  }

  loadSettings() {
    const savedSize = localStorage.getItem('jobViewerFontSize');
    if (savedSize) this.fontSize = parseInt(savedSize, 10);
  }

  saveSettings() {
    localStorage.setItem('jobViewerFontSize', this.fontSize.toString());
  }

  log(message) {
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.textContent = message;
    this.elements.logViewer.appendChild(logEntry);
    this.elements.logViewer.scrollTop = this.elements.logViewer.scrollHeight;
  }

  addCurrentJob() {
    if (this.currentIndex < 0 || this.currentIndex >= this.jobData.length) {
      alert("No job to add.");
      return;
    }
    const job = { ...this.jobData[this.currentIndex] };
    this.filteredData.push(job);
    this.updateAddedJobList();
    this.updateDisplay();
    this.log("✅ Added current job to data.");
  }

  deleteCurrentJob() {
    if (this.currentIndex < 0 || this.currentIndex >= this.jobData.length) {
      alert("No job to delete.");
      return;
    }
    const jobToDelete = this.jobData[this.currentIndex];
    const jobId = jobToDelete.Id;
    // Remove from filteredData
    this.filteredData = this.filteredData.filter(job => job.Id !== jobId);
    this.updateAddedJobList();
    this.log(`🗑️ Deleted job with Id: ${jobId}`);
    if (this.currentIndex >= this.jobData.length) {
      this.currentIndex = this.jobData.length - 1;
    }
    this.updateDisplay();
  }

  exportJson() {
    const dataStr = JSON.stringify(this.filteredData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "job_offers.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.log("📤 Exported job data as JSON.");
  }
}

document.addEventListener('DOMContentLoaded', () => { new JobViewerApp(); });
