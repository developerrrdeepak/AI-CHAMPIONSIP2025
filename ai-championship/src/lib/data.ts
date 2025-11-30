import type { User, Job, Candidate, Application, Interview, Challenge, FounderDashboardData } from './definitions';
import schema from '../../docs/backend.json';

// This file now serves as a bridge to the backend schema definition.
// The mock data has been removed and the application will rely on the
// structured data model from backend.json for its definitions.

const findEntity = (name: string) => {
    const entity = schema.entities[name as keyof typeof schema.entities];
    if (!entity) {
        throw new Error(`Entity ${name} not found in backend.json`);
    }
    return entity;
}

// You can export schemas for validation or other purposes
export const UserSchema = findEntity('User');
export const JobSchema = findEntity('Job');
export const CandidateSchema = findEntity('Candidate');
export const ApplicationSchema = findEntity('Application');
export const InterviewSchema = findEntity('Interview');
export const ChallengeSchema = findEntity('Challenge');
export const EmailSchema = findEntity('Email');
export const OrganizationSchema = findEntity('Organization');
