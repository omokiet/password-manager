use serde::{Deserialize, Serialize};
use zeroize::{Zeroize, ZeroizeOnDrop};

#[derive(Debug, Serialize, Deserialize, Clone, Zeroize, ZeroizeOnDrop)]
pub struct PasswordEntry {
    #[zeroize(skip)]
    pub id: String,
    #[zeroize(skip)]
    pub title: String,
    #[zeroize(skip)]
    pub username: String,
    pub password: String,
    #[zeroize(skip)]
    pub url: String,
    pub notes: String,
    #[zeroize(skip)]
    pub category: String,
    #[zeroize(skip)]
    pub created_at: i64,
    #[zeroize(skip)]
    pub updated_at: i64,
    #[zeroize(skip)]
    #[serde(default)]
    pub is_favorite: bool,
    #[serde(default)]
    pub password_history: Vec<PasswordHistoryEntry>,
    #[serde(default)]
    pub custom_fields: Vec<CustomField>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Zeroize, ZeroizeOnDrop)]
pub struct PasswordHistoryEntry {
    pub old_password: String,
    #[zeroize(skip)]
    pub changed_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq, Zeroize)]
pub enum CustomFieldType {
    Text,
    Password,
    Multiline,
}

#[derive(Debug, Serialize, Deserialize, Clone, Zeroize, ZeroizeOnDrop)]
pub struct CustomField {
    #[zeroize(skip)]
    pub id: String,
    #[zeroize(skip)]
    pub label: String,
    pub value: String,
    #[zeroize(skip)]
    pub field_type: CustomFieldType,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_zeroize_password_entry() {
        let mut entry = PasswordEntry {
            id: "1".into(),
            title: "Test".into(),
            username: "user".into(),
            password: "super_secret_password".into(),
            url: "https://example.com".into(),
            notes: "secret notes".into(),
            category: "General".into(),
            created_at: 1000,
            updated_at: 1000,
            is_favorite: false,
            password_history: vec![],
            custom_fields: vec![],
        };

        entry.zeroize();
        assert!(entry.password.is_empty() || entry.password.chars().all(|c| c == '\0'));
        assert!(entry.notes.is_empty() || entry.notes.chars().all(|c| c == '\0'));
    }
}
