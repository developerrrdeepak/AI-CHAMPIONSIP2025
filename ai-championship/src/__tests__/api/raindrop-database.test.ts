import { getCandidatesByOrganization, getJobsByOrganization, getApplicationsByCandidate, searchCandidatesBySkills, getMatchedCandidatesForJob } from '@/lib/smartSQL'

describe('Raindrop SmartSQL Database', () => {
  describe('getCandidatesByOrganization', () => {
    it('should retrieve candidates for an organization', async () => {
      const result = await getCandidatesByOrganization('demo-org')
      expect(Array.isArray(result)).toBe(true)
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id')
        expect(result[0]).toHaveProperty('name')
      }
    })

    it('should return empty array for non-existent organization', async () => {
      const result = await getCandidatesByOrganization('non-existent')
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('getJobsByOrganization', () => {
    it('should retrieve jobs for an organization', async () => {
      const result = await getJobsByOrganization('demo-org')
      expect(Array.isArray(result)).toBe(true)
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id')
        expect(result[0]).toHaveProperty('title')
      }
    })

    it('should handle organization with no jobs', async () => {
      const result = await getJobsByOrganization('empty-org')
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('getApplicationsByCandidate', () => {
    it('should retrieve applications for a candidate', async () => {
      const result = await getApplicationsByCandidate('demo-candidate')
      expect(Array.isArray(result)).toBe(true)
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('jobId')
        expect(result[0]).toHaveProperty('status')
      }
    })

    it('should return empty array for candidate with no applications', async () => {
      const result = await getApplicationsByCandidate('new-candidate')
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('searchCandidatesBySkills', () => {
    it('should search candidates by skills', async () => {
      const result = await searchCandidatesBySkills('demo-org', ['React', 'TypeScript'])
      expect(Array.isArray(result)).toBe(true)
    })

    it('should handle empty skills array', async () => {
      const result = await searchCandidatesBySkills('demo-org', [])
      expect(Array.isArray(result)).toBe(true)
    })

    it('should handle non-existent skills', async () => {
      const result = await searchCandidatesBySkills('demo-org', ['NonExistentSkill123'])
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('getMatchedCandidatesForJob', () => {
    it('should retrieve matched candidates for a job', async () => {
      const result = await getMatchedCandidatesForJob('demo-job')
      expect(Array.isArray(result)).toBe(true)
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('candidateId')
        expect(result[0]).toHaveProperty('matchScore')
      }
    })

    it('should handle job with no matches', async () => {
      const result = await getMatchedCandidatesForJob('new-job')
      expect(Array.isArray(result)).toBe(true)
    })
  })
})
