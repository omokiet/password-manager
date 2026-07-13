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
    #[serde(default)]
    pub custom_fields: Vec<CustomField>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PasswordHistoryEntry {
    pub old_password: String,
    pub changed_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub enum CustomFieldType {
    Text,
    Password,
    Multiline,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CustomField {
    pub id: String,
    pub label: String,
    pub value: String,
    pub field_type: CustomFieldType,
}
