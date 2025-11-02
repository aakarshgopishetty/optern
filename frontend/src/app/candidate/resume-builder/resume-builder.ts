import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

interface ResumeEducation {
  id?: number;
  institution: string;
  degree: string;
  graduationYear: string;
  gpa: string;
}

interface ResumeExperience {
  id?: number;
  company: string;
  position: string;
  duration: string;
  description: string;
}

interface ResumeSkill {
  id?: number;
  skillName: string;
  skillType: string;
}

interface ResumeProject {
  id?: number;
  projectTitle: string;
  technologies: string;
  projectLink: string;
  description: string;
}

interface ResumeCertification {
  id?: number;
  certificationName: string;
  issuingOrganization: string;
  issueDate: Date;
  expiryDate?: Date;
}

interface Resume {
  id?: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  linkedInProfile: string;
  address: string;
  professionalObjective: string;
  educations: ResumeEducation[];
  experiences: ResumeExperience[];
  skills: ResumeSkill[];
  projects: ResumeProject[];
  certifications: ResumeCertification[];
}

@Component({
  selector: 'app-resume-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resume-builder.html',
  styleUrl: './resume-builder.css'
})
export class ResumeBuilder implements OnInit {
  activeTab: string = 'personal';
  isLoading: boolean = false;
  isSaving: boolean = false;
  saveMessage: string = '';
  saveMessageType: 'success' | 'error' = 'success';

  // Form data
  resume: Resume = {
    fullName: '',
    email: '',
    phoneNumber: '',
    linkedInProfile: '',
    address: '',
    professionalObjective: '',
    educations: [],
    experiences: [],
    skills: [],
    projects: [],
    certifications: []
  };

  // Skills input strings
  technicalSkillsInput: string = '';
  softSkillsInput: string = '';

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit() {
    this.loadResume();
  }

  selectTab(tab: string) {
    this.activeTab = tab;
  }

  loadResume() {
    this.isLoading = true;
    const token = this.authService.getToken();
    if (!token) {
      this.isLoading = false;
      return;
    }

    this.http.get<Resume>('/api/Resume', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: (data) => {
        this.resume = data ? this.mergeResumeData(data) : this.getDefaultResume();
        this.populateSkillsInputs();
        this.isLoading = false;
      },
      error: (error) => {
        console.log('No existing resume found, starting fresh:', error);
        this.resume = this.getDefaultResume();
        this.isLoading = false;
      }
    });
  }

  private mergeResumeData(data: Resume): Resume {
    return {
      id: data.id,
      fullName: data.fullName || '',
      email: data.email || '',
      phoneNumber: data.phoneNumber || '',
      linkedInProfile: data.linkedInProfile || '',
      address: data.address || '',
      professionalObjective: data.professionalObjective || '',
      educations: Array.isArray(data.educations) ? data.educations : [],
      experiences: Array.isArray(data.experiences) ? data.experiences : [],
      skills: Array.isArray(data.skills) ? data.skills : [],
      projects: Array.isArray(data.projects) ? data.projects : [],
      certifications: Array.isArray(data.certifications) ? data.certifications : []
    };
  }

  private getDefaultResume(): Resume {
    return {
      fullName: '',
      email: '',
      phoneNumber: '',
      linkedInProfile: '',
      address: '',
      professionalObjective: '',
      educations: [],
      experiences: [],
      skills: [],
      projects: [],
      certifications: []
    };
  }

  populateSkillsInputs() {
    if (!this.resume.skills || !Array.isArray(this.resume.skills)) {
      this.technicalSkillsInput = '';
      this.softSkillsInput = '';
      return;
    }

    const technicalSkills = this.resume.skills
      .filter(skill => skill && skill.skillType === 'Technical')
      .map(skill => skill.skillName || '');
    const softSkills = this.resume.skills
      .filter(skill => skill && skill.skillType === 'Soft')
      .map(skill => skill.skillName || '');

    this.technicalSkillsInput = technicalSkills.join(', ');
    this.softSkillsInput = softSkills.join(', ');
  }

  // Education methods
  addEducation() {
    if (!this.resume.educations) {
      this.resume.educations = [];
    }
    this.resume.educations.push({
      institution: '',
      degree: '',
      graduationYear: '',
      gpa: ''
    });
  }

  removeEducation(index: number) {
    if (this.resume.educations && this.resume.educations.length > index) {
      this.resume.educations.splice(index, 1);
    }
  }

  // Experience methods
  addExperience() {
    if (!this.resume.experiences) {
      this.resume.experiences = [];
    }
    this.resume.experiences.push({
      company: '',
      position: '',
      duration: '',
      description: ''
    });
  }

  removeExperience(index: number) {
    if (this.resume.experiences && this.resume.experiences.length > index) {
      this.resume.experiences.splice(index, 1);
    }
  }

  // Project methods
  addProject() {
    if (!this.resume.projects) {
      this.resume.projects = [];
    }
    this.resume.projects.push({
      projectTitle: '',
      technologies: '',
      projectLink: '',
      description: ''
    });
  }

  removeProject(index: number) {
    if (this.resume.projects && this.resume.projects.length > index) {
      this.resume.projects.splice(index, 1);
    }
  }

  // Certification methods
  addCertification() {
    if (!this.resume.certifications) {
      this.resume.certifications = [];
    }
    this.resume.certifications.push({
      certificationName: '',
      issuingOrganization: '',
      issueDate: new Date(),
      expiryDate: undefined
    });
  }

  removeCertification(index: number) {
    if (this.resume.certifications && this.resume.certifications.length > index) {
      this.resume.certifications.splice(index, 1);
    }
  }

  // Validation
  validateForm(): boolean {
    if (!this.resume.fullName || !this.resume.email) {
      this.showMessage('Please fill in all required fields (Full Name and Email)', 'error');
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.resume.email)) {
      this.showMessage('Please enter a valid email address', 'error');
      return false;
    }

    return true;
  }

  // Save resume
  saveResume() {
    if (!this.validateForm()) {
      return;
    }

    this.isSaving = true;

    // Process skills
    const technicalSkills = this.technicalSkillsInput
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);

    const softSkills = this.softSkillsInput
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);

    // Ensure all required fields are properly formatted
    const resumeData = {
      fullName: this.resume.fullName?.trim(),
      email: this.resume.email?.trim(),
      phoneNumber: this.resume.phoneNumber?.trim() || '',
      linkedInProfile: this.resume.linkedInProfile?.trim() || '',
      address: this.resume.address?.trim() || '',
      professionalObjective: this.resume.professionalObjective?.trim() || '',
      technicalSkills: technicalSkills,
      softSkills: softSkills,
      educations: this.resume.educations || [],
      experiences: this.resume.experiences || [],
      projects: this.resume.projects || [],
      certifications: (this.resume.certifications || []).map(cert => ({
        certificationName: cert.certificationName || '',
        issuingOrganization: cert.issuingOrganization || '',
        issueDate: cert.issueDate ? new Date(cert.issueDate).toISOString() : new Date().toISOString(),
        expiryDate: cert.expiryDate ? new Date(cert.expiryDate).toISOString() : null
      }))
    };

    const token = this.authService.getToken();
    if (!token) {
      this.showMessage('Authentication required', 'error');
      this.isSaving = false;
      return;
    }

    const httpOptions = {
      headers: { 'Authorization': `Bearer ${token}` }
    };

    console.log('Sending resume data:', JSON.stringify(resumeData, null, 2));

    // Always try PUT first, if 404 (resume doesn't exist), then POST
    let request = this.http.put<Resume>('/api/Resume', resumeData, httpOptions);

    request.subscribe({
      next: (response) => {
        this.resume = response;
        this.populateSkillsInputs();
        this.showMessage('Resume saved successfully!', 'success');
        this.isSaving = false;
      },
      error: (error) => {
        if (error.status === 404) {
          // Resume doesn't exist, try POST
          this.http.post<Resume>('/api/Resume', resumeData, httpOptions).subscribe({
            next: (response) => {
              this.resume = response;
              this.populateSkillsInputs();
              this.showMessage('Resume saved successfully!', 'success');
              this.isSaving = false;
            },
            error: (postError) => {
              console.error('Error creating resume:', postError);
              this.handleSaveError(postError);
              this.isSaving = false;
            }
          });
        } else {
          console.error('Error updating resume:', error);
          this.handleSaveError(error);
          this.isSaving = false;
        }
      }
    });
  }

  handleSaveError(error: any) {
    console.error('Error saving resume:', error);

    // More detailed error handling
    if (error.status === 400) {
      this.showMessage('Invalid resume data. Please check all required fields.', 'error');
    } else if (error.status === 500) {
      this.showMessage('Server error. Please try again later.', 'error');
    } else {
      this.showMessage(`Error saving resume: ${error.message || 'Please try again.'}`, 'error');
    }
  }

  showMessage(message: string, type: 'success' | 'error') {
    this.saveMessage = message;
    this.saveMessageType = type;

    // Auto-hide message after 5 seconds
    setTimeout(() => {
      this.saveMessage = '';
    }, 5000);
  }

  // Helper methods for preview
  hasResumeData(): boolean {
    return !!(this.resume.fullName && this.resume.email);
  }

  getAllSkills(): ResumeSkill[] {
    const technicalSkills = this.technicalSkillsInput
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0)
      .map(skill => ({ skillName: skill, skillType: 'Technical' }));

    const softSkills = this.softSkillsInput
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0)
      .map(skill => ({ skillName: skill, skillType: 'Soft' }));

    return [...technicalSkills, ...softSkills];
  }

  formatDate(date: Date | string): string {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Build resume (placeholder for future functionality)
  buildResume() {
    if (!this.validateForm()) {
      return;
    }

    this.selectTab('preview');
  }

  // Download resume as PDF
  downloadResume() {
    if (!this.hasResumeData()) {
      this.showMessage('Please fill in resume data before downloading', 'error');
      return;
    }

    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        this.showMessage('Please allow popups for this site to download PDF', 'error');
        return;
      }

      // Generate HTML content for the resume
      const resumeHTML = this.generateResumeHTML();

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${this.resume.fullName} - Resume</title>
          <meta charset="UTF-8">
          <style>
            ${this.getPrintStyles()}
          </style>
        </head>
        <body>
          ${resumeHTML}
        </body>
        </html>
      `);

      printWindow.document.close();

      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();

        // Close the window after printing (optional)
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      };

      this.showMessage('Opening print dialog for PDF download...', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.showMessage('Error generating PDF. Please try again.', 'error');
    }
  }

  private generateResumeHTML(): string {
    return `
      <div class="resume-container">
        <div class="resume-header">
          <h1>${this.resume.fullName}</h1>
          <div class="contact-info">
            ${this.resume.email ? `<div>${this.resume.email}</div>` : ''}
            ${this.resume.phoneNumber ? `<div>${this.resume.phoneNumber}</div>` : ''}
            ${this.resume.linkedInProfile ? `<div>${this.resume.linkedInProfile}</div>` : ''}
            ${this.resume.address ? `<div>${this.resume.address}</div>` : ''}
          </div>
        </div>

        ${this.resume.professionalObjective ? `
          <div class="resume-section">
            <h2>Professional Objective</h2>
            <p>${this.resume.professionalObjective}</p>
          </div>
        ` : ''}

        ${this.resume.experiences.length > 0 ? `
          <div class="resume-section">
            <h2>Experience</h2>
            ${this.resume.experiences.map(exp => `
              <div class="experience-item">
                <div class="experience-header">
                  <strong>${exp.position}</strong> at ${exp.company}
                  <span class="duration">${exp.duration}</span>
                </div>
                <p>${exp.description}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${this.resume.educations.length > 0 ? `
          <div class="resume-section">
            <h2>Education</h2>
            ${this.resume.educations.map(edu => `
              <div class="education-item">
                <div class="education-header">
                  <strong>${edu.degree}</strong>
                  <span class="graduation-year">${edu.graduationYear}</span>
                </div>
                <div class="institution">${edu.institution}</div>
                ${edu.gpa ? `<div class="gpa">GPA: ${edu.gpa}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${this.getAllSkills().length > 0 ? `
          <div class="resume-section">
            <h2>Skills</h2>
            <div class="skills-container">
              ${this.getAllSkills().map(skill => `<span class="skill-tag">${skill.skillName}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        ${this.resume.projects.length > 0 ? `
          <div class="resume-section">
            <h2>Projects</h2>
            ${this.resume.projects.map(proj => `
              <div class="project-item">
                <div class="project-header">
                  <strong>${proj.projectTitle}</strong>
                  ${proj.technologies ? `<span class="technologies">${proj.technologies}</span>` : ''}
                </div>
                <p>${proj.description}</p>
                ${proj.projectLink ? `<a href="${proj.projectLink}" class="project-link">${proj.projectLink}</a>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${this.resume.certifications.length > 0 ? `
          <div class="resume-section">
            <h2>Certifications</h2>
            ${this.resume.certifications.map(cert => `
              <div class="certification-item">
                <div class="certification-header">
                  <strong>${cert.certificationName}</strong>
                  <span class="certification-date">${this.formatDate(cert.issueDate)}</span>
                </div>
                <div class="issuer">${cert.issuingOrganization}</div>
                ${cert.expiryDate ? `<div class="expiry">Expires: ${this.formatDate(cert.expiryDate)}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  private getPrintStyles(): string {
    return `
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }

      .resume-container {
        background: white;
        padding: 40px;
        border: 1px solid #ddd;
      }

      .resume-header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 2px solid #1976D2;
        padding-bottom: 20px;
      }

      .resume-header h1 {
        margin: 0 0 10px 0;
        color: #1976D2;
        font-size: 28px;
      }

      .contact-info {
        display: flex;
        justify-content: center;
        gap: 20px;
        flex-wrap: wrap;
        font-size: 14px;
      }

      .resume-section {
        margin-bottom: 25px;
      }

      .resume-section h2 {
        color: #1976D2;
        border-bottom: 1px solid #ddd;
        padding-bottom: 5px;
        margin-bottom: 15px;
        font-size: 18px;
      }

      .experience-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .education-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
      }

      .project-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .certification-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
      }

      .skills-container {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .skill-tag {
        background: #e3f2fd;
        border: 1px solid #1976D2;
        color: #1976D2;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
      }

      .project-link {
        color: #1976D2;
        text-decoration: none;
        font-size: 14px;
      }

      .project-link:hover {
        text-decoration: underline;
      }

      @media print {
        body { margin: 0; padding: 15px; }
        .resume-container { border: none; padding: 0; }
      }
    `;
  }
}
