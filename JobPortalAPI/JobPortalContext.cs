using Microsoft.EntityFrameworkCore;
using JobPortalAPI.Models;

namespace JobPortalAPI.Data
{
    public class JobPortalContext : DbContext
    {
        public JobPortalContext(DbContextOptions<JobPortalContext> options)
            : base(options)
        { }

        // Lookup Tables
        public DbSet<StatusLookup> StatusLookups { get; set; }
        public DbSet<IndustryLookup> IndustryLookups { get; set; }
        public DbSet<JobTypeLookup> JobTypeLookups { get; set; }
        public DbSet<LocationTypeLookup> LocationTypeLookups { get; set; }
        public DbSet<InterviewStatusLookup> InterviewStatusLookups { get; set; }

        // Core Tables
        public DbSet<User> Users { get; set; }
        public DbSet<UserLoginAttempt> UserLoginAttempts { get; set; }
        public DbSet<UserSession> UserSessions { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
        public DbSet<CandidateProfile> CandidateProfiles { get; set; }
        public DbSet<Company> Companies { get; set; }
        public DbSet<Recruiter> Recruiters { get; set; }
        public DbSet<Job> Jobs { get; set; }
        public DbSet<Application> Applications { get; set; }
        public DbSet<CandidateEducation> CandidateEducations { get; set; }
        public DbSet<CandidateExperience> CandidateExperiences { get; set; }
        public DbSet<CandidateSkill> CandidateSkills { get; set; }
        public DbSet<CandidateProject> CandidateProjects { get; set; }
        public DbSet<CandidateCertification> CandidateCertifications { get; set; }
        public DbSet<Announcement> Announcements { get; set; }
        public DbSet<Grievance> Grievances { get; set; }
        public DbSet<ActivityLog> ActivityLogs { get; set; }

        // Resume Tables
        public DbSet<Resume> Resumes { get; set; }
        public DbSet<ResumeEducation> ResumeEducations { get; set; }
        public DbSet<ResumeExperience> ResumeExperiences { get; set; }
        public DbSet<ResumeSkill> ResumeSkills { get; set; }
        public DbSet<ResumeProject> ResumeProjects { get; set; }
        public DbSet<ResumeCertification> ResumeCertifications { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Company>()
                .HasOne(c => c.Industry)
                .WithMany()
                .HasForeignKey(c => c.IndustryID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Job>()
                .HasOne(j => j.Recruiter)
                .WithMany(r => r.Jobs)
                .HasForeignKey(j => j.RecruiterID)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Job>()
                .HasOne(j => j.Company)
                .WithMany(c => c.Jobs)
                .HasForeignKey(j => j.CompanyID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Application>()
                .HasOne(a => a.Job)
                .WithMany(j => j.Applications)
                .HasForeignKey(a => a.JobID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Application>()
                .HasOne(a => a.Candidate)
                .WithMany(c => c.Applications)
                .HasForeignKey(a => a.CandidateID)
                .OnDelete(DeleteBehavior.Cascade);

            // Resume relationships
            modelBuilder.Entity<Resume>()
                .HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ResumeEducation>()
                .HasOne(re => re.Resume)
                .WithMany(r => r.Educations)
                .HasForeignKey(re => re.ResumeId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ResumeExperience>()
                .HasOne(re => re.Resume)
                .WithMany(r => r.Experiences)
                .HasForeignKey(re => re.ResumeId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ResumeSkill>()
                .HasOne(rs => rs.Resume)
                .WithMany(r => r.Skills)
                .HasForeignKey(rs => rs.ResumeId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ResumeProject>()
                .HasOne(rp => rp.Resume)
                .WithMany(r => r.Projects)
                .HasForeignKey(rp => rp.ResumeId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ResumeCertification>()
                .HasOne(rc => rc.Resume)
                .WithMany(r => r.Certifications)
                .HasForeignKey(rc => rc.ResumeId)
                .OnDelete(DeleteBehavior.Cascade);


        }
    }
}
