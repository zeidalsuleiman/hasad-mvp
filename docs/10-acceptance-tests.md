# HASAD Acceptance Tests

## Authentication
- user can register
- duplicate email is rejected
- user can log in
- invalid password is rejected
- authenticated user can fetch /auth/me

## Farm management
- authenticated user can create a farm
- user can list their farms
- user can update their own farm
- user cannot access another user's farm

## Weather
- current weather can be fetched for a stored farm
- normalized weather response is returned
- weather log is stored

## Irrigation
- recommendation is generated for valid farm + crop + weather
- recommendation is stored

## Disease risk
- risk score, level, and explanation are returned
- result is stored

## Assistant
- user can create a chat session
- user can send a message
- assistant reply is stored