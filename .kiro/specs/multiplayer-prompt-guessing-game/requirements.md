# Requirements Document

## Introduction

This document outlines the requirements for a multiplayer AI prompt guessing game inspired by Skribbl.io. Players take turns creating text prompts that are converted to images using AI, while other players attempt to guess the original prompt. The game emphasizes creativity, quick thinking, and the unpredictable nature of AI image generation.

## Requirements

### Requirement 1

**User Story:** As a player, I want to create or join game rooms so that I can play with friends or other players online.

#### Acceptance Criteria

1. WHEN a player clicks "Create Room" THEN the system SHALL generate a unique 6-character room code
2. WHEN a room is created THEN the system SHALL allow up to 8 players to join
3. WHEN a player enters a valid room code THEN the system SHALL add them to that room
4. IF a room code is invalid THEN the system SHALL display an error message
5. WHEN a player joins a room THEN all other players in the room SHALL be notified

### Requirement 2

**User Story:** As a player, I want to submit text prompts that get converted to AI-generated images so that other players can guess what I was thinking.

#### Acceptance Criteria

1. WHEN it's a player's turn THEN the system SHALL prompt them to enter a text description
2. WHEN a prompt is submitted THEN the system SHALL limit it to 5 words maximum
3. WHEN a valid prompt is received THEN the system SHALL generate an image using AI
4. IF image generation fails THEN the system SHALL allow the player to retry with a different prompt
5. WHEN an image is generated THEN the system SHALL display it to all other players

### Requirement 3

**User Story:** As a guesser, I want to submit guesses for the displayed image so that I can earn points by correctly identifying the original prompt.

#### Acceptance Criteria

1. WHEN an image is displayed THEN non-prompt players SHALL have 60 seconds to submit guesses
2. WHEN a player submits a guess THEN the system SHALL evaluate similarity to the original prompt
3. WHEN the guessing time expires THEN the system SHALL reveal the original prompt
4. IF a guess is very similar THEN the system SHALL award points based on accuracy (20-100 points)
5. WHEN a round ends THEN the system SHALL display all guesses and scores

### Requirement 4

**User Story:** As a player, I want to see real-time game state and scores so that I can track my performance and the game progress.

#### Acceptance Criteria

1. WHEN players are in a room THEN the system SHALL display current player list and scores
2. WHEN it's someone's turn THEN the system SHALL clearly indicate whose turn it is
3. WHEN guessing is active THEN the system SHALL show a countdown timer
4. WHEN a round completes THEN the system SHALL update and display current standings
5. WHEN a game ends THEN the system SHALL show final results and winner

### Requirement 5

**User Story:** As a player, I want the game to handle network issues gracefully so that temporary disconnections don't ruin the game experience.

#### Acceptance Criteria

1. WHEN a player disconnects temporarily THEN the system SHALL pause their turn timer
2. WHEN a player reconnects THEN the system SHALL restore their game state
3. IF a player is disconnected for more than 2 minutes THEN the system SHALL skip their turn
4. WHEN the room creator leaves THEN the system SHALL transfer host privileges to another player
5. IF all players disconnect THEN the system SHALL clean up the room after 5 minutes

### Requirement 6

**User Story:** As a player, I want cost-effective AI image generation so that the game remains sustainable and responsive.

#### Acceptance Criteria

1. WHEN generating images THEN the system SHALL use Together.ai as the primary provider
2. IF Together.ai fails THEN the system SHALL fallback to alternative providers (Fal.ai, Replicate)
3. WHEN an image is generated THEN the system SHALL cache it to avoid regeneration costs
4. WHEN API costs are tracked THEN the system SHALL log usage for monitoring
5. IF generation takes too long THEN the system SHALL timeout after 30 seconds and allow retry