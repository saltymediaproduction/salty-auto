/**
 * Automation Rule Configuration & Schema Utilities
 * 
 * Supports OpenReply-grade feature set:
 * - Button templates (up to 3 clickable buttons: web_url or postback)
 * - Follow-gating ("Require Follow" before revealing link)
 * - Scheduled follow-up DMs
 * - "Attach to Next Reel" triggers
 * - Multi-script whole-word matching
 */

export interface AutomationButton {
  title: string;
  url: string;
}

export interface ParsedRuleConfig {
  dm_message: string;
  buttons: AutomationButton[];
  require_follow: boolean;
  follow_prompt_message: string;
  follow_prompt_button_label: string;
  follow_up_enabled: boolean;
  follow_up_message: string;
  follow_up_delay_minutes: number;
  pending_next_reel: boolean;
  whole_word_match: boolean;
}

const DEFAULT_FOLLOW_PROMPT = "Tap below once you are following us to unlock your link! 🎁";
const DEFAULT_FOLLOW_BUTTON = "I'm Following! Unlock Link";

/**
 * Parses the rule's dm_message and returns normalized configuration.
 * Handles both legacy plain-text strings and modern JSON-encoded campaign settings.
 */
export function parseRuleConfig(rawDmMessage: string, ruleRecord?: any): ParsedRuleConfig {
  let parsedJson: any = null;

  if (rawDmMessage && rawDmMessage.trim().startsWith("{") && rawDmMessage.trim().endsWith("}")) {
    try {
      parsedJson = JSON.parse(rawDmMessage.trim());
    } catch {
      parsedJson = null;
    }
  }

  // Check columns from ruleRecord first (if migration applied), then fallback to JSON, then defaults
  const dm_message =
    parsedJson?.dm_message ||
    (parsedJson ? "" : rawDmMessage) ||
    "Here is your link! 🚀";

  const buttons: AutomationButton[] =
    ruleRecord?.buttons ||
    parsedJson?.buttons ||
    [];

  const require_follow: boolean =
    ruleRecord?.require_follow ??
    parsedJson?.require_follow ??
    false;

  const follow_prompt_message: string =
    ruleRecord?.follow_prompt_message ||
    parsedJson?.follow_prompt_message ||
    DEFAULT_FOLLOW_PROMPT;

  const follow_prompt_button_label: string =
    ruleRecord?.follow_prompt_button_label ||
    parsedJson?.follow_prompt_button_label ||
    DEFAULT_FOLLOW_BUTTON;

  const follow_up_enabled: boolean =
    ruleRecord?.follow_up_enabled ??
    parsedJson?.follow_up_enabled ??
    false;

  const follow_up_message: string =
    ruleRecord?.follow_up_message ||
    parsedJson?.follow_up_message ||
    "";

  const follow_up_delay_minutes: number =
    ruleRecord?.follow_up_delay_minutes ??
    parsedJson?.follow_up_delay_minutes ??
    15;

  const pending_next_reel: boolean =
    ruleRecord?.pending_next_reel ??
    parsedJson?.pending_next_reel ??
    false;

  const whole_word_match: boolean =
    ruleRecord?.whole_word_match ??
    parsedJson?.whole_word_match ??
    true;

  return {
    dm_message,
    buttons,
    require_follow,
    follow_prompt_message,
    follow_prompt_button_label,
    follow_up_enabled,
    follow_up_message,
    follow_up_delay_minutes,
    pending_next_reel,
    whole_word_match,
  };
}

/**
 * Serializes rich rule configuration into string for storage in auto_automation_rules.dm_message.
 */
export function serializeRuleConfig(config: Partial<ParsedRuleConfig>): string {
  // If no buttons, no follow-gate, and simple config, store plain string
  if (
    (!config.buttons || config.buttons.length === 0) &&
    !config.require_follow &&
    !config.follow_up_enabled &&
    !config.pending_next_reel
  ) {
    return config.dm_message || "";
  }

  return JSON.stringify({
    dm_message: config.dm_message || "",
    buttons: config.buttons || [],
    require_follow: !!config.require_follow,
    follow_prompt_message: config.follow_prompt_message || DEFAULT_FOLLOW_PROMPT,
    follow_prompt_button_label: config.follow_prompt_button_label || DEFAULT_FOLLOW_BUTTON,
    follow_up_enabled: !!config.follow_up_enabled,
    follow_up_message: config.follow_up_message || "",
    follow_up_delay_minutes: config.follow_up_delay_minutes || 15,
    pending_next_reel: !!config.pending_next_reel,
    whole_word_match: config.whole_word_match ?? true,
  });
}
