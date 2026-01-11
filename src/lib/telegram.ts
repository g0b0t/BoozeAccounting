export function getTelegramInitData(): string | null {
  const tg = (window as Window & { Telegram?: { WebApp?: { initData?: string } } }).Telegram;
  const directInitData = tg?.WebApp?.initData;
  if (directInitData) {
    return directInitData;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const initDataFromUrl = searchParams.get('tgWebAppData') ?? hashParams.get('tgWebAppData');
  return initDataFromUrl ? decodeURIComponent(initDataFromUrl) : null;
}

export function applyTelegramTheme() {
  const tg = (window as Window & { Telegram?: { WebApp?: { themeParams?: Record<string, string> } } }).Telegram;
  const theme = tg?.WebApp?.themeParams;
  if (!theme) {
    return;
  }
  const root = document.documentElement;
  if (theme.bg_color) root.style.setProperty('--bg', theme.bg_color);
  if (theme.text_color) root.style.setProperty('--text', theme.text_color);
  if (theme.hint_color) root.style.setProperty('--muted', theme.hint_color);
  if (theme.button_color) root.style.setProperty('--accent', theme.button_color);
  if (theme.button_text_color) root.style.setProperty('--accent-contrast', theme.button_text_color);
}
