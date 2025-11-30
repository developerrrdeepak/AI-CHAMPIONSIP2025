# Vultr Integration Setup Guide

## Required Vultr Services for Hackathon

### 1. API Access
1. Login to https://my.vultr.com/
2. Go to Account → API
3. Enable API and copy your API key
4. Add to `.env`: `VULTR_API_KEY=your_api_key_here`

### 2. Object Storage (Required)
1. Go to Products → Object Storage
2. Deploy New Instance
3. Choose region (e.g., New Jersey)
4. Create cluster
5. Get credentials:
   - Access Key
   - Secret Key  
   - Endpoint (e.g., https://ewr1.vultrobjects.com)

### 3. Managed Database (Optional)
1. Go to Products → Managed Databases
2. Deploy PostgreSQL instance
3. Get connection string
4. Add to `.env`: `VULTR_POSTGRES_CONNECTION_STRING=postgresql://...`

### 4. Update .env File
```bash
# Vultr Configuration
VULTR_API_KEY=your_vultr_api_key
VULTR_S3_ENDPOINT=https://your-cluster.vultrobjects.com
VULTR_S3_ACCESS_KEY=your_access_key
VULTR_S3_SECRET_KEY=your_secret_key
VULTR_POSTGRES_CONNECTION_STRING=postgresql://user:pass@host:port/db
```

### 5. Test Integration
- Visit `/vultr` page in your app
- Test `/api/vultr/storage` endpoint
- Verify object storage upload/download

## Hackathon Compliance
✅ Vultr Object Storage - File storage for resumes
✅ Vultr API Integration - Instance management  
✅ Optional: Vultr Database - Structured data storage