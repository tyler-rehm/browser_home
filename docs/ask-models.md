# Ask models

Ask models sends one prompt to the providers you check and copies their replies into one dossier. Keys stay on this Mac. The page never sees them.

Providers: Claude, ChatGPT, Gemini, Grok, and Perplexity.

## Where secrets live

On macOS, the server prefers the Keychain item:

- Service: `local.browser-home.model-secrets`
- Account: `model-secrets`

Turn on iCloud Keychain in System Settings if you want that item to sync. The app does not configure iCloud for you.

If Keychain is empty, the server reads:

```text
~/Library/Application Support/browser-home/model-secrets.json
```

When the JSON file has keys and Keychain does not, the first load migrates the JSON into Keychain and leaves the file in place. `CODE_HOME_SECRETS_FILE` overrides the file path. Do not commit real keys. The checked-in shape is `examples/model-secrets.example.json`.

Create or refresh the file:

```sh
mkdir -p "$HOME/Library/Application Support/browser-home"
cp /Users/code/Code/miscellaneous-tools/browser_home/examples/model-secrets.example.json \
  "$HOME/Library/Application Support/browser-home/model-secrets.json"
chmod 600 "$HOME/Library/Application Support/browser-home/model-secrets.json"
open -e "$HOME/Library/Application Support/browser-home/model-secrets.json"
```

Optional fields per provider:

- `expiresAt` — `YYYY-MM-DD`. Within 7 days, Ask models shows a warning and a refresh link.
- `workspaceId` — Anthropic only. Use when the key needs `anthropic-workspace-id`. Prefer a Default workspace key when you can.
- `model` — leave `""` for the built-in default.

Do not paste a key into chat. A chat subscription is not an API key. Prepaid API credits are separate from Claude.ai / ChatGPT Plus / Gemini / Grok chat plans.

## Model accounts

Settings → **Model accounts** tab lists each provider’s connection status (configured or not), default model, and expiry warning.

Per provider:

- **Balance** — opens the vendor billing/credits page (check remaining credit there; ordinary API keys cannot read it).
- **Console** — opens the vendor billing/console page (same URL as Balance today).
- **Refresh** — opens the homepage refresh-steps doc for rotating that provider’s API key.
- **Model dropdown** — chooses the stored default `model` in Keychain/secrets (curated list). Does not show API keys.

In Ask models, each checked provider also has a model dropdown for that run. Choosing a different model overrides the stored default for that ask only; the secret store is unchanged. The gear control opens this Settings tab.

Keys are never shown in the browser. Edit Keychain or the secrets file on this Mac to change API keys.

## Balance status

<a id="balance-status"></a>

Vendors do not expose remaining prepaid credit to ordinary inference API keys. Use **Balance** / **Console** on Model accounts (or the vendor site) to check credits. Homepage load does not call billing endpoints. Ask models may still show a numeric low/ok credit label only when a rare live probe succeeds (for example an OpenAI credit-grants response).

## Claude

Default model: `claude-sonnet-5-5`.

1. Open [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) (or platform.claude.com API keys).
2. Continue with an API key, not identity federation.
3. Create a key named `code-home` scoped to **Default workspace** when possible.
4. If the console only offers an organization key, put the workspace id in `workspaceId`.
5. Set `expiresAt` to the key’s expiry day.
6. Save. Reload Ask models. Claude should be checked.

### Refresh Claude

<a id="refresh-claude"></a>

1. Open the Anthropic API keys page.
2. Create a new `code-home` key (Default workspace).
3. Replace `anthropic.apiKey` and update `expiresAt`.
4. Revoke the old key after a successful Ask.

## ChatGPT

Default model: `gpt-4.1`.

1. Open [platform.openai.com/api-keys](https://platform.openai.com/api-keys).
2. Create a user-owned secret key named `code-home`, permissions All, expiration Never or a date you record in `expiresAt`.
3. Add prepaid credits under Billing before Ask. An empty balance fails immediately.
4. Save. Reload Ask models.

### Refresh ChatGPT

<a id="refresh-chatgpt"></a>

1. Create a new OpenAI secret key.
2. Replace `openai.apiKey` and `expiresAt`.
3. Confirm Billing still has credits.
4. Revoke the old key after a successful Ask.

## Gemini

Default model: `gemini-3.8-flash` (AI Studio retires older ids such as `gemini-2.5-pro` and `gemini-2.0-flash`).

1. Open [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Create a key on a personal project (not a client project).
3. Save into `google.apiKey`. Override `model` only if you need a different Gemini id.

### Refresh Gemini

<a id="refresh-gemini"></a>

1. Create a new AI Studio key on the same personal project.
2. Replace `google.apiKey` and `expiresAt`.
3. Revoke the old key after a successful Ask.

## Grok

Default model: `grok-3`.

1. Open [console.x.ai](https://console.x.ai/).
2. Create an API key named `code-home`.
3. Keep prepaid credits in the console.
4. Save into `xai.apiKey`.

### Refresh Grok

<a id="refresh-grok"></a>

1. Create a new xAI API key.
2. Replace `xai.apiKey` and `expiresAt`.
3. Revoke the old key after a successful Ask.

## Perplexity

Default Agent API preset: `fast` (Sonar chat completions and the Router API are not used here). Ask posts to `https://api.perplexity.ai/v1/responses` with your Perplexity key from Keychain or the secrets file. Free credits work for Agent; Router returned a paid-credits gate on this Mac.

1. Open [console.perplexity.ai](https://console.perplexity.ai) (or [perplexity.ai/account/api/keys](https://www.perplexity.ai/account/api/keys)).
2. Create an API key named `code-home`.
3. Confirm the project has credits (free trial credits are enough for Agent `fast`).
4. Save into `perplexity.apiKey`. Leave `model` empty for `fast`, or set another Agent preset (`low`, `medium`, `high`, `xhigh`).

### Refresh Perplexity

<a id="refresh-perplexity"></a>

1. Create a new Perplexity API key.
2. Replace `perplexity.apiKey` and `expiresAt`.
3. Revoke the old key after a successful Ask.

## Check

Reload `http://home.localhost:4173`. Click **ASK MODELS**.

- Configured providers are checked.
- Expiry warnings appear within 7 days of `expiresAt`.
- Billing labels show remaining, low, or unknown.
- Ask with `Reply with the single word pong.` Copy builds the dossier.
