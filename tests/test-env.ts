/**
 * Test Environment Setup
 * Injects valid testing secrets so that modules requiring fail-closed environment variables
 * can boot cleanly during automated test execution.
 */
;(process.env as any).NODE_ENV = 'test'

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  process.env.SESSION_SECRET = 'test_dna360_secure_session_secret_key_powai_2026_min_48_chars'
}

if (!process.env.WHATSAPP_APP_SECRET || process.env.WHATSAPP_APP_SECRET.length < 32) {
  process.env.WHATSAPP_APP_SECRET = 'test_whatsapp_app_secret_min_32_characters_long_powai'
}

if (!process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN.length < 32) {
  process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'test_whatsapp_webhook_verify_token_min_32_chars'
}

if (!process.env.RAZORPAY_KEY_ID) {
  process.env.RAZORPAY_KEY_ID = 'rzp_test_mock_key_id'
}

if (!process.env.RAZORPAY_KEY_SECRET) {
  process.env.RAZORPAY_KEY_SECRET = 'rzp_test_mock_secret_key_dna360_secure'
}

