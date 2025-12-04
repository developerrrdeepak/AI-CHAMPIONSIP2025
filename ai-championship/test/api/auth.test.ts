import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/auth/set-custom-claims/route'

describe('/api/auth/set-custom-claims', () => {
  it('should set custom claims for user', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        uid: 'test-uid-123',
        claims: {
          role: 'Employer',
          organizationId: 'org-test-123'
        }
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(true)
  })

  it('should reject invalid uid', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        uid: '',
        claims: { role: 'Employer' }
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
  })

  it('should reject invalid method', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(405)
  })
})
