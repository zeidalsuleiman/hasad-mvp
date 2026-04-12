# HASAD Acceptance Tests

## Authentication
- user can register
- duplicate email is rejected
- user receives verification code (OTP)
- user can verify email with valid OTP
- invalid/expired OTP is rejected

- user can log in
- invalid password is rejected
- authenticated user can fetch /auth/me

- user can request password reset
- reset OTP is sent
- user can reset password with valid OTP
- invalid OTP is rejected

- 2FA enabled user requires second verification step
- frontend can call backend without CORS errors

## Farm management
- authenticated user can create a farm
- user can list their farms
- user can update their own farm
- user cannot access another user's farm
- first farm flow redirects user correctly
- active farm is persisted correctly

## Crop configuration
- user can create a crop config for a farm
- only one crop config is active per farm
- crop response returns effective Kc and Kc source
- Kc override works
- missing crop is surfaced clearly in UI

## Weather
- current weather can be fetched for a stored farm
- normalized weather response is returned
- weather log is stored
- extended weather fields are persisted when available

## Irrigation
- recommendation is generated for valid farm + crop + weather
- recommendation is stored
- ET0 method is returned
- assumptions include calculation trace
- crop stage affects Kc
- fallback path remains safe when required PM inputs missing

## Disease risk
- risk score, level, and explanation are returned
- result is stored
- API contract remains stable across future engine upgrades

## Assistant
- user can create a chat session
- user can send a message
- assistant reply is stored
- sessions are farm-aware in the UI
- previous chats can be reopened

## Dashboard
- authenticated user can access dashboard
- dashboard loads without errors
- weather data is displayed
- irrigation recommendation is displayed if available
- disease risk is displayed if available
- crop strip or crop warning is displayed appropriately
- loading states appear during API calls
- errors are handled gracefully