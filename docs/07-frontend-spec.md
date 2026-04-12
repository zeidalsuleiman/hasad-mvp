# HASAD Frontend Specification

## Main pages
1. Authentication page
2. Dashboard page
3. Farms page
4. Create Farm page
5. Weather view
6. Irrigation view/card
7. Disease risk view/card
8. Assistant chat area (dashboard-integrated)
9. Admin page (future/partial)

## Current important UI sections

### Authentication
- login/signup toggle
- password visibility controls
- password requirements checklist
- clear validation feedback
- OTP/verification flow support

### Dashboard
- weather strip
- crop strip / warning
- irrigation card
- disease card
- assistant chat panel
- first-farm empty state

### Farm management
- farm CRUD
- crop configuration UI
- create first farm flow
- create additional farm flow

### Assistant
- sidebar session history
- new chat button
- rename/delete session actions
- scrollable message area
- per-farm chat isolation

## UI principles
- simple layout
- readable cards
- minimal clicks
- clear loading and error states
- consistent spacing and color system
- practical empty-state guidance
- explainability where scientific outputs are shown

## Current frontend behaviors
- new users land on dashboard empty state if no farms exist
- first farm creation redirects back to dashboard
- crop warnings appear when crop config is missing
- irrigation/disease cards show action-first state before first calculation
- dashboard surfaces crop type, stage, and Kc when configured

## Future frontend improvements
- richer disease explanations after ML phase
- stronger assistant grounding visuals after RAG phase
- admin monitoring views
- optional map/location-enhanced farm setup