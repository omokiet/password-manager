use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PasswordEntry {
    pub id: String,
    pub title: String,
    pub username: String,
    pub password: String,
    pub url: String,
    pub notes: String,
    pub category: String,
    pub created_at: i64,
    pub updated_at: i64,
    #[serde(default)]
    pub is_favorite: bool,
    #[serde(default)]
    pub password_history: Vec<PasswordHistoryEntry>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PasswordHistoryEntry {
    pub old_password: String,
    pub changed_at: i64,
}
