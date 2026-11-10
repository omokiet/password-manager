# Google Drive Encrypted Cloud Backup Implementation Plan

> **For Agent:** Follow Spec-Driven Development workflow. Implement task-by-task with TDD, atomic commits, and zero local imports.

**Goal:** Add manual 1-click encrypted backup and restore to the user's hidden Google Drive `appDataFolder` using OAuth 2.0 PKCE, preserving 100% Zero-Knowledge with zero proprietary backend servers.

**Architecture:** Rust backend handles the OAuth 2.0 PKCE flow, loopback redirect listener, token persistence, and Google Drive REST API calls (upload, list, download). React frontend in `SettingsPanel` displays connection status, in-app consent bypass guide, 1-click upload, and a cloud backup picker modal for atomic restore.

**Tech Stack:** Tauri v2, Rust (`reqwest` with rustls/native-tls, `sha2`, `base64`, `tiny_http` or raw `TcpListener`), React 19, TypeScript, Tailwind CSS.

---

### Task 1: Rust Backend OAuth 2.0 PKCE & Loopback Listener

**Files:**
- Create: `src-tauri/src/oauth.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/Cargo.toml`
- Test: `src-tauri/tests/oauth_test.rs`

**Step 1: Write the failing tests**
- Test PKCE code_verifier generation (43-128 chars, unreserved chars).
- Test SHA-256 code_challenge derivation matches RFC 7636 test vectors.
- Test token refresh request builder.

**Step 2: Run test to verify it fails**
- Run: `cargo test --manifest-path src-tauri/Cargo.toml --test oauth_test`
- Expected: FAIL (module/functions not found).

**Step 3: Implement minimal code**
- Add required crates to `src-tauri/Cargo.toml`: `reqwest` (with json, rustls-tls or default), `sha2`, `base64`.
- Implement `generate_pkce_pair()` in `src-tauri/src/oauth.rs`.
- Implement ephemeral loopback `TcpListener` on `127.0.0.1:0` to wait for authorization code.
- Implement token exchange with `https://oauth2.googleapis.com/token`.
- Save/load refresh token to `app_data_dir/gdrive_token.json`.

**Step 4: Run test to verify it passes**
- Run: `cargo test --manifest-path src-tauri/Cargo.toml --test oauth_test`
- Expected: PASS.

**Step 5: Commit**
- `git add src-tauri/src/oauth.rs src-tauri/tests/oauth_test.rs src-tauri/Cargo.toml src-tauri/src/lib.rs`
- `git commit -m "feat(oauth): implement PKCE code verifier and token exchange for Google OAuth"`

---

### Task 2: Google Drive REST API Client & Tauri IPC Commands

**Files:**
- Create: `src-tauri/src/gdrive.rs`
- Modify: `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/lib.rs`
- Test: `src-tauri/tests/gdrive_test.rs`

**Step 1: Write the failing tests**
- Test serializing upload multipart payload for `appDataFolder`.
- Test parsing Google Drive `files.list` JSON response into `Vec<CloudBackupItem>`.
- Test safe atomic restore validation of downloaded backup bytes.

**Step 2: Run test to verify it fails**
- Run: `cargo test --manifest-path src-tauri/Cargo.toml --test gdrive_test`
- Expected: FAIL.

**Step 3: Implement minimal code**
- In `src-tauri/src/gdrive.rs`:
  - `upload_to_appdata(access_token, file_name, file_content) -> Result<String>`
  - `list_appdata_backups(access_token) -> Result<Vec<CloudBackupItem>>`
  - `download_file(access_token, file_id) -> Result<String>`
- In `src-tauri/src/commands.rs`:
  - Expose Tauri IPC commands: `gdrive_start_auth`, `gdrive_get_status`, `gdrive_disconnect`, `gdrive_upload_backup`, `gdrive_list_backups`, `gdrive_restore_backup`.
  - Gate all backup operations behind `get_connection(&state)` so they require an unlocked vault.

**Step 4: Run test to verify it passes**
- Run: `cargo test --manifest-path src-tauri/Cargo.toml`
- Expected: All 11+ tests PASS.

**Step 5: Commit**
- `git add src-tauri/src/gdrive.rs src-tauri/src/commands.rs src-tauri/src/lib.rs src-tauri/tests/gdrive_test.rs`
- `git commit -m "feat(gdrive): add Google Drive appdata upload, list, and atomic restore commands"`

---

### Task 3: In-App Consent Guide & Settings UI

**Files:**
- Create: `src/components/GoogleDriveGuideModal.tsx`
- Modify: `src/components/SettingsPanel.tsx`
- Modify: `src/shared/types/index.ts`
- Test: `src/components/__tests__/SettingsPanel.test.tsx`

**Step 1: Write the failing test**
- Test that clicking "Kết nối Google Drive" opens the in-app guidance modal explaining the "Ứng dụng chưa xác minh" screen.
- Test that cloud backup list displays files with formatted timestamps and triggers restore on click.

**Step 2: Run test to verify it fails**
- Run: `npm test`
- Expected: FAIL.

**Step 3: Implement minimal code**
- Create `GoogleDriveGuideModal.tsx`:
  - Visual step-by-step instructions: *1. Đăng nhập Google $\rightarrow$ 2. Bấm Nâng cao (Advanced) $\rightarrow$ 3. Bấm Đi tới ứng dụng (Tiếp tục)*.
  - "Đã hiểu, mở trình duyệt đăng nhập" button triggering `gdrive_start_auth`.
- Update `SettingsPanel.tsx`:
  - New card section: "Sao lưu Google Drive (Đám mây cá nhân)".
  - Show connection badge (Connected: email or Disconnected).
  - Button "Sao lưu ngay lên Google Drive" with spinner.
  - List of backups with "Khôi phục" button opening confirmation dialog.
  - "Ngắt kết nối" button.

**Step 4: Run test to verify it passes**
- Run: `npm test`
- Expected: All 27+ tests PASS.

**Step 5: Commit**
- `git add src/components/GoogleDriveGuideModal.tsx src/components/SettingsPanel.tsx src/shared/types/index.ts src/components/__tests__/SettingsPanel.test.tsx`
- `git commit -m "feat(ui): add Google Drive cloud backup section with in-app bypass guide"`

---

### Task 4: End-to-End Verification & Documentation Update

**Files:**
- Modify: `docs/PROBLEMS.md`
- Modify: `README.md`

**Step 1: Run full automated verification suite**
- Run `npm test` (All frontend suites).
- Run `cargo test --manifest-path src-tauri/Cargo.toml` (All backend suites).
- Run `npm run build` (`tsc && vite build`).

**Step 2: Verify offline fallback & edge cases**
- Test behavior when network disconnected (informative error toast, local backups remain intact).
- Test token refresh logic.

**Step 3: Update documentation & commit**
- `git add docs/ README.md`
- `git commit -m "docs: document Google Drive cloud backup feature and verification results"`
