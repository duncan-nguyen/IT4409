# Contributing to IT4409 Video Conference Platform

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Development Setup

1. **Prerequisites**
   - Node.js 18+ and npm
   - Docker and Docker Compose
   - Python 3.9+ (for AI service)
   - PostgreSQL 14+

2. **Clone and Install**
   ```bash
   git clone https://github.com/duncan-nguyen/IT4409.git
   cd IT4409
   ./setup.sh  # or setup.ps1 on Windows
   ```

3. **Start Development Environment**
   ```bash
   docker-compose up -d
   ```

## Code Style

### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Prefer `const` over `let`
- Use async/await over promises
- Add JSDoc comments for public APIs

### Python
- Follow PEP 8 style guide
- Use type hints
- Add docstrings for functions and classes
- Use Black for formatting

### SQL
- Use lowercase for keywords
- Use snake_case for table and column names
- Add comments for complex queries
- Always use parameterized queries

## Commit Message Guidelines

Follow conventional commits format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(frontend): add participant list component

Add collapsible participant list with mute/kick controls
Includes user avatars and status indicators

Closes #123
```

```
fix(webrtc): resolve connection timeout issue

Handle ICE connection timeout by implementing reconnection logic
Add exponential backoff for retry attempts
```

## Pull Request Process

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write tests for new features
   - Update documentation
   - Ensure all tests pass
   - Follow code style guidelines

3. **Test Your Changes**
   ```bash
   # Backend tests
   cd room-api && npm test
   
   # Frontend tests
   cd frontend && npm test
   
   # Run linting
   npm run lint
   ```

4. **Submit PR**
   - Fill out the PR template
   - Link related issues
   - Request review from maintainers
   - Address review comments

## Testing Guidelines

### Unit Tests
- Test individual functions/components
- Mock external dependencies
- Aim for >80% code coverage
- Use descriptive test names

### Integration Tests
- Test API endpoints
- Test component interactions
- Use test database

### E2E Tests
- Test critical user flows
- Test WebRTC connections
- Test real-time features

## Documentation

- Update README.md for user-facing changes
- Add API documentation for new endpoints
- Include code examples
- Update architecture diagrams if needed

## Bug Reports

Include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots/logs if applicable

## Feature Requests

Include:
- Use case description
- Proposed solution
- Alternative approaches
- Impact on existing features

## Questions?

- Check existing issues and discussions
- Join our Discord server
- Email: support@cnweb.example.com

Thank you for contributing! 🎉
