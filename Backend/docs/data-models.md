# Data Models

This document describes the core data models used in the DACN Backend.

## User
Represents a registered user in the system.

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | String | Yes | Full name of the user. |
| `username` | String | Yes | Unique username. |
| `email` | String | Yes | Unique email address. |
| `password_hash` | String | No | Hashed password (optional for Firebase users). |
| `role` | String | Yes | User role (default: 'user'). |
| `package_id` | ObjectId | No | Reference to subscribed `Package`. |
| `isOnline` | Boolean | No | Online status. |
| `lastSeen` | Date | No | Timestamp of last activity. |
| `status` | String | No | Account status (e.g., 'active', 'inactive'). |
| `firebaseUid` | String | No | UID from Firebase Authentication. |
| `subscriptionType` | Enum | No | Type of subscription (if any). |

## Quiz
Represents a quiz created by a user.

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | String | Yes | Title of the quiz. |
| `description` | String | No | Description of the quiz. |
| `image` | String | No | URL to cover image. |
| `time_limit` | Number | No | Time limit in minutes/seconds. |
| `user_id` | ObjectId | Yes | Reference to the `User` who created the quiz. |
| `is_premium` | Boolean | No | Whether the quiz requires a premium subscription. |
| `is_hidden` | Boolean | No | Visibility status. |

## Question
Represents a question within a quiz.

| Field | Type | Required | Description |
|---|---|---|---|
| `quiz_id` | ObjectId | Yes | Reference to the parent `Quiz`. |
| `content` | String | Yes | The question text. |
| `type` | Enum | Yes | 'mcq' (Multiple Choice) or 'true_false'. |
| `explanation` | String | No | Explanation for the answer. |
| `image` | String | No | URL to question image. |
| `question_number` | Number | No | Ordering number. |
