# 5. API Specification

## REST API Specification (OpenAPI 3.0)

Key endpoints following RESTful nesting principles:

### Games & Goals
- `GET /games` - List all games
- `POST /games` - Create new game
- `GET /games/{id}` - Get game details
- `PATCH /games/{id}` - Update game (live tracking)
- `GET /games/{id}/goals` - Get goals for a game
- `POST /games/{id}/goals` - Log goal with assists
- `PATCH /games/{game_id}/goals/{goal_id}` - Update goal
- `DELETE /games/{game_id}/goals/{goal_id}` - Delete goal (undo)
- `POST /games/{id}/opponent-goals` - Log opponent goal

### Players
- `GET /players` - List all players
- `POST /players` - Create new player
- `PATCH /players/{id}` - Update player

### Training & Attendance
- `GET /training_sessions` - List training sessions
- `POST /training_sessions` - Create training session
- `GET /training_sessions/{id}/attendances` - Get attendance
- `POST /training_sessions/{id}/attendances` - Bulk mark attendance

### Statistics (RPC Functions)
- `POST /rpc/get_player_stats` - Get aggregated player statistics
- `POST /rpc/get_team_stats` - Get aggregated team statistics

## Authentication Headers
```http
Authorization: Bearer {supabase-jwt-token}
apikey: {supabase-anon-key}
Content-Type: application/json
```

## Offline Sync Strategy
1. Queue all POST/PATCH/DELETE operations in IndexedDB
2. Return optimistic responses to UI immediately
3. On reconnection, replay queue in order
4. Handle conflicts via "last write wins"
5. Retry failed operations with exponential backoff

---
