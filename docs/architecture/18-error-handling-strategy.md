# 18. Error Handling Strategy

## Error Flow
- Frontend normalizes all errors to AppError
- Service layer handles retry logic
- UI shows user-friendly messages
- Offline errors queue for sync

## Error Response Format
```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
  };
}
```

## Recovery Strategies
- Circuit breaker for service failures
- Exponential backoff for retries
- Fallback to cached data
- Graceful degradation

---
