# React Native Conversion Plan

## Overview
Converting the Civic Connect web application to React Native while preserving all functionality and business logic.

## Project Structure
```
mobile/
├── App.js (Main app with navigation)
├── package.json
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── Welcome.js
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── AdminLogin.js
│   │   │   └── EmployeeLogin.js
│   │   ├── citizen/
│   │   │   ├── CitizenDashboard.js
│   │   │   ├── ReportIssue.js
│   │   │   ├── MyReports.js
│   │   │   ├── NearbyIssues.js
│   │   │   ├── Profile.js
│   │   │   └── Leaderboard.js
│   │   ├── admin/
│   │   │   └── AdminDashboard.js
│   │   ├── employee/
│   │   │   ├── EmployeeDashboard.js
│   │   │   ├── EmployeeProfile.js
│   │   │   └── ResolveIssue.js
│   │   ├── shared/
│   │   │   ├── IssueDetail.js
│   │   │   ├── IssueMap.js
│   │   │   └── analytics/
│   │   │       └── ResolutionCharts.js
│   ├── navigation/
│   │   ├── AppNavigator.js
│   │   ├── AuthStack.js
│   │   ├── CitizenTabNavigator.js
│   │   ├── AdminStack.js
│   │   └── EmployeeStack.js
│   ├── services/
│   │   ├── api.js (Adapted for React Native)
│   │   └── storage.js (AsyncStorage wrapper)
│   ├── contexts/
│   │   └── LanguageContext.js
│   ├── utils/
│   │   └── styles.js (Shared styles)
│   └── constants/
│       ├── colors.js
│       └── config.js
```

## Key Dependencies
- @react-navigation/native
- @react-navigation/stack
- @react-navigation/bottom-tabs
- react-native-safe-area-context
- react-native-screens
- @react-native-async-storage/async-storage
- react-native-geolocation-service
- react-native-maps
- react-native-image-picker
- react-native-vector-icons (or @expo/vector-icons)

## Conversion Checklist

### Phase 1: Foundation
- [x] Create project structure
- [ ] Set up package.json with dependencies
- [ ] Configure navigation structure
- [ ] Set up context providers (Language)
- [ ] Adapt API service for React Native
- [ ] Create storage service (AsyncStorage)

### Phase 2: Authentication
- [ ] Convert Welcome screen
- [ ] Convert Login screen
- [ ] Convert Register screen
- [ ] Convert AdminLogin screen
- [ ] Convert EmployeeLogin screen

### Phase 3: Citizen Features
- [ ] Convert CitizenDashboard
- [ ] Convert ReportIssue
- [ ] Convert MyReports
- [ ] Convert NearbyIssues
- [ ] Convert Profile
- [ ] Convert Leaderboard

### Phase 4: Admin & Employee
- [ ] Convert AdminDashboard
- [ ] Convert EmployeeDashboard
- [ ] Convert EmployeeProfile
- [ ] Convert ResolveIssue

### Phase 5: Shared Components
- [ ] Convert IssueDetail
- [ ] Convert IssueMap (react-native-maps)
- [ ] Convert analytics charts

### Phase 6: Styling & Polish
- [ ] Create shared StyleSheet utilities
- [ ] Ensure responsive design
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test on both platforms

## Key Differences from Web

### Components
- `div` → `View`
- `span`, `p`, `h1-h6` → `Text`
- `button` → `TouchableOpacity` or `Pressable`
- `input` → `TextInput`
- `img` → `Image`
- `a` → Navigation actions

### Styling
- Tailwind classes → StyleSheet.create()
- CSS → JavaScript objects
- Flexbox (mostly same, but some differences)

### Navigation
- react-router-dom → React Navigation
- `navigate('/path')` → `navigation.navigate('RouteName')`

### Storage
- localStorage → AsyncStorage
- Synchronous → Asynchronous

### Location
- navigator.geolocation → react-native-geolocation-service

### Maps
- react-leaflet → react-native-maps

### Images
- File input → react-native-image-picker

### Icons
- lucide-react → react-native-vector-icons or similar

