---
name: api-designer
description: Design RESTful APIs following best practices, including proper URL structure, HTTP methods, status codes, and documentation.
---

# API Designer Skill

## Instructions

When designing or reviewing APIs, follow these principles:

### 1. URL Structure
- Use nouns for resources, not verbs: `/users` not `/getUsers`
- Use plural names for collections: `/users`, `/products`
- Use hyphens for readability: `/order-items` not `/orderItems`
- Limit nesting depth to 2-3 levels max: `/users/{id}/orders/{orderId}`

### 2. HTTP Methods
- GET: Retrieve resources
- POST: Create new resources
- PUT: Replace entire resource
- PATCH: Partial resource update
- DELETE: Remove resources

### 3. Response Status Codes
- 200: Success
- 201: Created (POST)
- 204: No Content (DELETE)
- 400: Bad Request (validation error)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Unprocessable Entity (business logic error)
- 500: Internal Server Error

### 4. Error Response Format
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested user was not found",
    "details": {...}
  }
}
```

### 5. Versioning
- Include version in URL: `/api/v1/users`
- Or use Accept header: `Accept: application/vnd.api.v1+json`

## Examples

Good API design:
```
GET    /api/v1/users              # List users
GET    /api/v1/users/{id}         # Get single user
POST   /api/v1/users              # Create user
PUT    /api/v1/users/{id}         # Update user
DELETE /api/v1/users/{id}         # Delete user
GET    /api/v1/users/{id}/orders  # Get user's orders
```

Pagination:
```
GET /api/v1/users?page=1&limit=20&sort=name&order=asc
```

## Guidelines

- Keep APIs simple and intuitive
- Use proper HTTP semantics consistently
- Design for idempotency where possible
- Include rate limiting headers
- Document all endpoints with examples
- Consider backward compatibility
