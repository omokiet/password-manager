use tauri_app_lib::oauth::{derive_code_challenge, generate_pkce_pair, parse_oauth_callback, build_auth_url};

#[test]
fn test_rfc7636_test_vector_challenge() {
    // Official test vector from RFC 7636 Appendix B
    let verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    let expected_challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
    
    let challenge = derive_code_challenge(verifier);
    assert_eq!(challenge, expected_challenge);
}

#[test]
fn test_generate_pkce_pair() {
    let (verifier, challenge) = generate_pkce_pair();
    
    // RFC 7636 specifies verifier length must be between 43 and 128 characters
    assert!(verifier.len() >= 43 && verifier.len() <= 128);
    // Verifier should only contain unreserved URL characters
    assert!(verifier.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '.' || c == '_' || c == '~'));
    
    let expected_challenge = derive_code_challenge(&verifier);
    assert_eq!(challenge, expected_challenge);
}

#[test]
fn test_build_auth_url() {
    let client_id = "test-client-id.apps.googleusercontent.com";
    let redirect_uri = "http://127.0.0.1:8080/oauth/callback";
    let challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";

    let url = build_auth_url(client_id, redirect_uri, challenge);

    assert!(url.starts_with("https://accounts.google.com/o/oauth2/v2/auth"));
    assert!(url.contains("client_id=test-client-id.apps.googleusercontent.com"));
    assert!(url.contains("code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"));
    assert!(url.contains("code_challenge_method=S256"));
    assert!(url.contains("scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.appdata"));
    assert!(url.contains("response_type=code"));
    assert!(url.contains("access_type=offline"));
}

#[test]
fn test_parse_oauth_callback_success() {
    let request_line = "GET /oauth/callback?code=4/0AY0e-g...&state=xyz HTTP/1.1";
    let code = parse_oauth_callback(request_line).unwrap();
    assert_eq!(code, "4/0AY0e-g...");
}

#[test]
fn test_parse_oauth_callback_error() {
    let request_line = "GET /oauth/callback?error=access_denied HTTP/1.1";
    let err = parse_oauth_callback(request_line).unwrap_err();
    assert!(err.to_string().contains("access_denied"));
}

