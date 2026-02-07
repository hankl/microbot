---
name: code-reviewer
description: Perform comprehensive code reviews focusing on code quality, security, performance, and adherence to best practices and project conventions.
---

# Code Reviewer Skill

## Instructions

When conducting code reviews, analyze the following aspects:

### 1. Code Quality
- Check for code duplication and suggest refactoring
- Ensure proper naming conventions (camelCase for variables, PascalCase for classes)
- Verify appropriate function/method length
- Check for magic numbers and strings that should be constants

### 2. Security
- Identify potential injection vulnerabilities (SQL, XSS, command injection)
- Check for hardcoded secrets, API keys, or passwords
- Verify proper input validation and sanitization
- Ensure secure handling of user data and authentication

### 3. Performance
- Identify inefficient algorithms or O(n²+) complexity issues
- Check for unnecessary API calls or database queries
- Verify proper use of caching where appropriate
- Check for memory leaks (unclosed resources, event listeners)

### 4. Testing
- Ensure critical business logic has unit test coverage
- Verify edge cases are handled
- Check that tests are meaningful and not just covering lines

### 5. Documentation
- Verify complex logic has inline comments
- Ensure public APIs have documentation
- Check that README is updated for new features

## Examples

Review feedback example:
```
## Code Review: feature/user-auth.ts

### ✅ Strengths
- Clean separation of concerns
- Good use of TypeScript types
- Comprehensive error handling

### ⚠️ Improvements Needed
- Line 45: Consider using bcrypt instead of SHA-256 for password hashing
- Line 78: Database query could benefit from indexing
- Line 112: Missing rate limiting on login endpoint

### 🔒 Security Concerns
- High: Line 89 - Potential SQL injection vulnerability
- Medium: Line 156 - JWT token expires in 30 days, consider shorter expiry
```

## Guidelines

- Be constructive and respectful in feedback
- Distinguish between style preferences and critical issues
- Provide actionable suggestions with code examples
- Highlight positive aspects of the code
- Never make personal comments about the author
