# Hub Feature Documentation

## Overview
The Hub page is a new protected page that displays all available features (ace and joni) and shows which ones the user has access to.

## What's New

### Frontend Changes
1. **Hub Page** (`/webapp/src/pages/Hub.tsx`)
   - Protected page that requires authentication
   - Shows all features as cards
   - Displays access status for each feature
   - Shows enabled sub-features when user has access

2. **FeatureCard Component** (`/webapp/src/components/FeatureCard.tsx`)
   - Visual card component for each feature
   - Shows Active/Locked status ribbon
   - Request Access button for locked features
   - Open button for accessible features

3. **useUserAccess Hook** (`/webapp/src/hooks/useUserAccess.ts`)
   - Fetches user's feature access data
   - Provides helper functions to check access
   - Handles loading and error states

4. **UI Components**
   - Badge component for sub-features display
   - Alert component for error messages

5. **Routing Updates**
   - Added `/hub` route
   - Login now redirects to `/hub` instead of `/protected`
   - Added Hub link in navigation

### Backend Changes
1. **User Access Service Reorganization**
   - Moved to `/server/src/services/user-access/` folder
   - Split features config into separate files:
     - `ace.config.ts` - Ace feature configuration
     - `joni.config.ts` - Joni feature configuration (now has single `joni-management` sub-feature)

2. **API Endpoints** (via tRPC)
   - `userAccess.getMyFeatures` - Get user's accessible features
   - `userAccess.getFeaturesConfig` - Get all features configuration

## Testing Locally

### 1. Start the Backend Server
```bash
cd server
npm run dev
```

### 2. Start the Frontend
```bash
cd webapp
npm run dev
```

### 3. Test the Hub Feature
1. Navigate to http://localhost:13003
2. Register a new account or login
3. You'll be redirected to `/hub`
4. You'll see two feature cards:
   - **Ace Feature Suite** - Advanced capabilities
   - **Johnny English Feature Suite** - Management features

### 4. Current State
- By default, new users won't have access to any features
- Features will show as "Locked" with a gray ribbon
- Users can click "Request Access" (currently shows an alert)

### 5. Granting Access (Admin)
To grant access to features, use the admin API endpoints:

```typescript
// Example: Grant ace-analytics access to a user
await trpc.userAccessAdmin.grantAccess.mutate({
  userId: "user-id",
  featureId: "ace",
  subFeatureId: "ace-analytics",
  metadata: { maxReports: 20 }
});

// Example: Grant joni-management access
await trpc.userAccessAdmin.grantAccess.mutate({
  userId: "user-id",
  featureId: "joni",
  subFeatureId: "joni-management"
});
```

## Deployment Note
The deployed server at https://aviaite-server-s31o.onrender.com needs to be redeployed with the latest code to support the userAccess endpoints. Until then, the Hub page will show the demo/error state when accessed in production.

## Feature Structure

### Ace Feature
- **ID**: `ace`
- **Sub-features**:
  - `ace-analytics` - Advanced analytics with metadata (maxReports, dataRetentionDays, exportFormats)
  - `ace-api-access` - API access with metadata (rateLimit, allowedEndpoints, apiKey)

### Joni Feature
- **ID**: `joni`
- **Sub-features**:
  - `joni-management` - Management access (no metadata, simple boolean access)

## Future Enhancements
1. Admin panel for granting/revoking access
2. Actual navigation to feature-specific pages
3. Access request workflow
4. Feature usage tracking
5. Subscription-based access management