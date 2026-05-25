# KeralaConnect Feature Unlock Architecture

## System Overview

The KeralaConnect reward system centers around "Utility Unlocks". Users spend their earned KCP (KeralaConnect Points) to permanently unlock or temporarily activate advanced navigation intelligence features.

This avoids the pitfalls of social media gamification (badges, followers) and instead provides tangible, real-world utility for the user's daily commute.

## Rewards Catalog Document structure

```typescript
interface RewardCatalogItem {
  id: string;             // 'premium_ai_route', 'weather_heatmap'
  title: string;
  description: string;
  cost: number;           // KCP required
  category: 'core' | 'map' | 'personalization' | 'boost';
  type: 'permanent' | 'consumable';
  required_level: number; // Optional level restriction
}

interface UserUnlocks {
  uid: string;
  active_unlocks: string[]; // ['night_mode', 'weather_heatmap']
  consumables: {
    'priority_reroute': number; // count
  }
}
```

## Reward Tiers

### A) Navigation Upgrades
- **Advanced Scenic Route Engine** (1500 KCP): Prioritizes paths with greenery, coastal views, and minimal stopping using Mapbox vision tagging.
- **AI Priority Routing v2** (3000 KCP): Highly aggressive traffic-avoidance algorithms that recalculate every 15 seconds instead of 60.

### B) Map Features
- **Traffic Heatmaps** (1000 KCP): Unlocks a global heatmap layer in the Map screen showing historical congestion patterns, not just live data.
- **Accident Prediction Layer** (2500 KCP): Highlights roads with historically high accident rates during specific weather or times.

### C) Personalization
- **Neon Night Mode** (800 KCP): Custom Mapbox dark style tailored for reduced glare and aesthetic nighttime driving.
- **Minimal Route Mode** (500 KCP): Strips the map of POIs, showing only the immediate road line and the destination for ultimate focus.

### D) Performance Boosts
- **Offline Route Packets** (1200 KCP): Ability to download large regional route data for areas with poor connectivity (e.g., Idukki, Wayanad).

## Transaction Flow
1. User requests unlock via Frontend.
2. Cloud Function `processRedemption(uid, item_id)` executes.
3. Fetch user's current valid `total_kcp` from `user_rewards`.
4. Validate item exists and user has funds.
5. Deduct KCP transaction in `points_ledger` (Action: `spend_reward`).
6. Update `user_rewards.unlocked_features`.
7. Client Real-time listener immediately reflects unlocked state.
8. Navigation Engine checks `unlocked_features` before offering advanced routes.
