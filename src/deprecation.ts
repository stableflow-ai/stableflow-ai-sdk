const MIGRATION_GUIDE =
  'https://github.com/stableflow-ai/stableflow-sdk/blob/main/DEVELOPER_GUIDE.md#12-migration-guide';

let warned = false;

/** Warn once per process when the package is imported. */
export function warnDeprecated(): void {
  if (warned || process.env.STABLEFLOW_AI_SDK_SILENCE_DEPRECATION === '1') {
    return;
  }
  warned = true;
  console.warn(
    '[stableflow-ai-sdk] This package is deprecated and no longer maintained. ' +
      `Migrate to @stableflow/*. Migration guide: ${MIGRATION_GUIDE}`
  );
}
