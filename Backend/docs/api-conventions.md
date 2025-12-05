# API Conventions

## Base URL
`http://<host>:<port>/`

## Response Format
All API responses should follow a consistent format.

### Success
```json
{
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

## Versioning
*   Currently, APIs are not strictly versioned in the URI (e.g., `/api/users`).
*   **Future Convention**: Use URI versioning for breaking changes: `/api/v1/users`.

## HTTP Methods
*   `GET`: Retrieve resources.
*   `POST`: Create new resources.
*   `PUT`: Full update of a resource.
*   `PATCH`: Partial update of a resource.
*   `DELETE`: Remove a resource.

## Authentication
*   Most endpoints require a Bearer Token.
*   Header: `Authorization: Bearer <token>`
