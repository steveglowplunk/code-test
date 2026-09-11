# User Identity API

## Prerequisites

### Docker setup

Tested with Docker Desktop on Windows

The API is available at:

```text
http://localhost:3000
```

Documentation is available at:

```text
http://localhost:3000/docs
```

The generated OpenAPI JSON document is available at:

```text
http://localhost:3000/docs/openapi.json
```

### Local application setup

To run the NestJS application outside Docker, install:

- Node.js 24
- npm

Start MySQL 8 and latest Redis through Docker.  
Add environment variables and ports for MySQL.  
Example:  
```
docker run --name mysql-standalone -e MYSQL_ROOT_PASSWORD=change_root_password -p 3306:3306 -d mysql:latest
```

## Installation

Clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd user-identity-api
npm ci
```

Generate the Prisma client:

```bash
npx prisma generate --config prisma7.config.ts
```

## Environment configuration

Copy the environment example:

```bash
cp .env.example .env
```

## Starting with Docker Compose

Build and start the API, MySQL, Redis, and database initialization services:

```bash
docker compose up --build
```

## Running the API locally

Start the NestJS application in watch mode:

```bash
npm run start:dev
```

## API endpoint

### Get or create a user identity

```http
POST /user
Content-Type: application/json
```

Request body:

```json
{
  "id1": "ABC123",
  "id2": "XYZ456"
}
```

Successful response:

```http
HTTP/1.1 201 Created
Content-Type: application/json
```

```json
{
  "userID": "550e8400-e29b-41d4-a716-446655440000"
}
```

Submitting the same `id1` and `id2` again returns the same `userID`.

Example using cURL:

```bash
curl -X POST http://localhost:3000/user \
  -H "Content-Type: application/json" \
  -d "{\"id1\":\"ABC123\",\"id2\":\"XYZ456\"}"
```

The Swagger UI can be used to inspect and execute `POST /user`.

## Redis caching

Redis is used as cache for user identity lookups.

The application follows the cache-aside pattern:

1. Generate a SHA-256 cache key from the `(id1, id2)` combination.
2. Check Redis for an existing `userID`.
3. On a cache hit, return the cached value.
4. On a cache miss, query MySQL.
5. Cache the MySQL result with a configurable TTL.
6. For a new combination, write the identity to MySQL before caching it.

MySQL remains the source of truth. Redis is never treated as permanent storage.

## Concurrency handling

MySQL enforces a composite unique constraint on `(id1, id2)`.

If two requests for the same new combination arrive concurrently:

1. One request creates the record successfully.
3. The other request receives a Prisma `P2002` unique constraint error.
4. The application detects that error and reads the record created by the successful request.
5. Both requests return the same `userID`.

## Testing

### Unit tests

```bash
npm test
```

### End-to-end tests

End-to-end tests require MySQL and Redis:

```bash
docker compose up -d mysql redis
npm run test:e2e
```

## Important technical decisions

For ORM, Prisma was selected to provide:
- Type-safe database queries in TypeScript
- A centralized and readable database schema
- Parameterized queries rather than manually constructed SQL

Prisma 7 is specified since the latest version 8 doesn't support MySQL yet.

Overall, it reduces query boilerplate and improves type safety.

## Sequence diagram
<img width="600" alt="image" src="https://github.com/user-attachments/assets/2e226c18-8671-45f4-b90b-15187911b6a5" />
