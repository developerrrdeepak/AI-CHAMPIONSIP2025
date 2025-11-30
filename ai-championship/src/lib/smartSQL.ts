import { executeSmartSQL } from './raindropSmartComponents';

export async function getCandidatesByOrganization(organizationId: string) {
  try {
    const query = `
      SELECT id, name, email, skills, experience_years, current_role
      FROM candidates
      WHERE organization_id = $1
      ORDER BY created_at DESC
    `;
    const result = await executeSmartSQL(query);
    return result;
  } catch (error) {
    console.error('Error fetching candidates:', error);
    throw error;
  }
}

export async function getJobsByOrganization(organizationId: string) {
  try {
    const query = `
      SELECT id, title, description, required_skills, seniority_level, department
      FROM jobs
      WHERE organization_id = $1 AND status = 'active'
      ORDER BY created_at DESC
    `;
    const result = await executeSmartSQL(query);
    return result;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
}

export async function createCandidateRecord(candidateData: {
  organizationId: string;
  name: string;
  email: string;
  skills: string[];
  experienceYears: number;
  currentRole: string;
}) {
  try {
    const query = `
      INSERT INTO candidates (organization_id, name, email, skills, experience_years, current_role, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;
    const params = [
      candidateData.organizationId,
      candidateData.name,
      candidateData.email,
      JSON.stringify(candidateData.skills),
      candidateData.experienceYears,
      candidateData.currentRole,
    ];
    const result = await executeSmartSQL(query);
    return result;
  } catch (error) {
    console.error('Error creating candidate:', error);
    throw error;
  }
}

export async function getApplicationsByCandidate(candidateId: string) {
  try {
    const query = `
      SELECT id, job_id, candidate_id, status, applied_at, interview_date
      FROM applications
      WHERE candidate_id = $1
      ORDER BY applied_at DESC
    `;
    const result = await executeSmartSQL(query);
    return result;
  } catch (error) {
    console.error('Error fetching applications:', error);
    throw error;
  }
}

export async function updateCandidateProfile(candidateId: string, updates: any) {
  try {
    const updateFields = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    const query = `
      UPDATE candidates
      SET ${updateFields}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const params = [candidateId, ...Object.values(updates)];
    const result = await executeSmartSQL(query);
    return result;
  } catch (error) {
    console.error('Error updating candidate:', error);
    throw error;
  }
}

export async function getJobWithApplications(jobId: string) {
  try {
    const query = `
      SELECT j.id, j.title, j.description, j.required_skills,
             COUNT(a.id) as total_applications,
             SUM(CASE WHEN a.status = 'accepted' THEN 1 ELSE 0 END) as accepted_count
      FROM jobs j
      LEFT JOIN applications a ON j.id = a.job_id
      WHERE j.id = $1
      GROUP BY j.id
    `;
    const result = await executeSmartSQL(query);
    return result;
  } catch (error) {
    console.error('Error fetching job with applications:', error);
    throw error;
  }
}

export async function searchCandidatesBySkills(organizationId: string, skills: string[]) {
  try {
    const skillsStr = skills.map(s => `'${s}'`).join(',');
    const query = `
      SELECT id, name, email, skills, experience_years, current_role
      FROM candidates
      WHERE organization_id = $1 AND skills && ARRAY[${skillsStr}]
      ORDER BY experience_years DESC
    `;
    const result = await executeSmartSQL(query);
    return result;
  } catch (error) {
    console.error('Error searching candidates:', error);
    throw error;
  }
}

export async function getMatchedCandidatesForJob(jobId: string, limit: number = 10) {
  try {
    const query = `
      SELECT c.id, c.name, c.email, c.skills, c.experience_years,
             COUNT(a.id) as application_count,
             MAX(a.created_at) as last_applied
      FROM candidates c
      LEFT JOIN applications a ON c.id = a.candidate_id
      WHERE c.skills && (SELECT required_skills FROM jobs WHERE id = $1)
      GROUP BY c.id
      ORDER BY experience_years DESC, application_count DESC
      LIMIT $2
    `;
    const result = await executeSmartSQL(query);
    return result;
  } catch (error) {
    console.error('Error fetching matched candidates:', error);
    throw error;
  }
}
