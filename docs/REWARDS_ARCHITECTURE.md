# KeralaConnect Reward Engine Architecture

## 1. System Overview & Architecture
The KeralaConnect Reward Engine is a utility-based gamification system. It relies heavily on user contributions (traffic data, real-time routing adherence) to improve the mobility intelligence layer.

**Core Principles:**
- Non-Social: No leaderboards, friend lists, or feeds.
- Utility-First: Rewards unlock app functionality, not cosmetic profiles.
- Automated Validation: Cloud Functions validate all user reports against multiple data points before awarding points to prevent abuse.

**Data Flow:**
1. User Event -> Firebase SDK (App)
2. Firestore (`pending_reports` or `telemetry_logs`)
3. Cloud Function (Event Processor & Fraud Detector)
4. Update `points_ledger` -> Update `user_rewards` stats
5. Realtime DB triggers UI updates in App (Level Up / Badge Unlock)

---

## 2. Firebase Database Schema (Firestore)

```typescript
// collection: user_rewards
interface UserRewardProfile {
  uid: string;
  total_kcp: number;
  current_level: string; // e.g., "Traffic Observer"
  trust_score: number; // 0-100 scale, starts at 50
  streaks: {
    contribution_days: number;
    safe_routes: number;
  };
  unlocked_features: string[]; // e.g., ["advanced_weather_routing"]
  last_updated: Timestamp;
}

// collection: points_ledger (Immutable point transactions)
interface PointsLedgerEntry {
  id: string; // Auto-id
  uid: string;
  points_awarded: number;
  action_type: 'report_traffic' | 'use_scenic_route' | 'validate_alert';
  reference_id: string; // ID of the report or trip
  timestamp: Timestamp;
}

// collection: missions
interface Mission {
  mission_id: string;
  description: string; // "Report one traffic update"
  target_count: number;
  reward_kcp: number;
  reward_xp: number;
  type: 'daily' | 'weekly';
}

// collection: user_missions
interface UserMissionProgress {
  uid: string;
  mission_id: string;
  current_count: number;
  is_completed: boolean;
  expires_at: Timestamp;
}

// collection: user_badges
interface UserBadge {
  uid: string;
  badge_id: string; // e.g., "rain_rider_3"
  earned_at: Timestamp;
}
```

---

## 3. Points Calculation Formula Design (KCP)

KeralaConnect Points (KCP) are calculated based on the equation:
`Final KCP = (Base Action Value * Accuracy Multiplier) * Trust Score Modifier`

**Base Values:**
- Submit verified traffic jam: +50 KCP
- Confirm an existing alert: +15 KCP
- Complete trip using "Safe Route": +20 KCP

**Trust Score Modifier (`user.trust_score` / 100):**
- Trust Score 100: 1.0x multiplier.
- Trust Score 50 (New user): 0.5x multiplier.
- Trust Score < 20 (Spammer): 0.0x multiplier.

**Example:**
User reports accident (Base 50) * Validated (1.0) * Trust Score 80 (0.8) = +40 KCP.

---

## 4. Level Progression Logic
Levels do not grant social status but act as access tiers for mobility tools.

| Level Tier | Title | Required KCP | Utility Reward Unlocked |
|---|---|---|---|
| Level 1 | Rookie Navigator | 0 | Basic Routing |
| Level 5 | Route Explorer | 500 | Ad-free routing, Scenic paths |
| Level 10 | Traffic Observer | 2000 | Early accident reroute alerts |
| Level 25 | Advanced Pathfinder | 10,000 | AI-assisted offline route packets |
| Level 50 | Master Navigator | 50,000 | Priority cloud-routing queues |

---

## 5. Badge Trigger Conditions
Badges are single-time or tiered achievements reflecting user trends.

- **🌧 Monsoon Navigator:** Earned by completing 10 trips while using the "Rain-Aware Routing" mode under active precipitation conditions.
- **🚦 Traffic Reporter:** Earned after 5 separate traffic congestion reports are validated by at least 2 other passing vehicles.
- **🛣 Route Optimizer:** Earned by deviating from a standard route and saving >10 minutes on the ETA using a dynamic reroute.
- **🔥 Efficiency Saver:** Earned when cumulative saved time hits 5 hours.

---

## 6. Mission Generation Logic
Missions are generated daily via a Scheduled Cloud Function (Cron job).

1. `fetch_user_trends(uid)`: Check what features the user ignores.
2. `assign_mission()`: If user never uses scenic routes, generate *"Take a scenic route today. +100 KCP"*.
3. Limits: Max 3 Daily Missions, 1 Weekly Mega-Mission.
4. Validation: Client sends telemetry -> Function verifies GPS trail -> `user_missions` updated.

---

## 7. Anti-Abuse System Design
To prevent users from farming points by standing still and reporting fake jams:

1. **Velocity Validation:** Accidents/Traffic can only be reported if `user.speed < 10 km/h`.
2. **Geo-Spoofing Detection:** Compare device GPS refresh rate and altitude jumps against Google Maps Road Snapping API.
3. **Report Deduplication:** If `distance(report A, report B) < 50 meters` within 10 minutes, merge them. Second reporter gets "Confirm" points (+15) instead of "New Report" points (+50).
4. **Punishment System:**
   - Report invalidated by next 5 drivers -> Trust Score -10.
   - Trust Score hits 0 -> Shadowbanned (reports are hidden, no points awarded).

---

## 8. UX Integration Strategy
The UI must remain minimal, clean, and map-centric. No screaming pop-ups.

**Key Principles:**
- **Inline Routing Feedback:** When an optimized trip ends, a subtle bottom-sheet slides up: *"Good call. That route saved 14 mins. +20 KCP verified."*
- **Aesthetic UI:** Minimalist progress rings, Deep Charcoal backgrounds, Vibrant Neon accents (Neon Blue / Neon Green) for points.
- **Rewards Hub:** Hosted seamlessly inside the Profile section, containing a Glassmorphic summary of Trust, Points, and Badges.
