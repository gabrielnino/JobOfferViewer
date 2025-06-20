import json
import re

# Load JSON
with open('jobs_data.json', 'r', encoding='utf-8') as f:
    jobs = json.load(f)

# Function to extract ID from Link
def extract_id(link):
    match = re.search(r'/view/(\d+)', link)
    return match.group(1) if match else None

# Add ID at beginning of each job dict
updated_jobs = []
for job in jobs:
    job_id = extract_id(job.get('Link', ''))
    new_job = {'Id': job_id}
    new_job.update(job)
    updated_jobs.append(new_job)

# Save updated JSON
with open('jobs_data_with_id.json', 'w', encoding='utf-8') as f:
    json.dump(updated_jobs, f, indent=2, ensure_ascii=False)

print("✅ File saved as jobs_data_with_id.json")
