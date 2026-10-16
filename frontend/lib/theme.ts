export const THEME_STORAGE_KEY = "council-theme";
export const THEME_CHANGE_EVENT = "council-theme-change";

export type ThemePreference = "system" | "light" | "dark";

export function themeInitScript(): string {
  return `(function(){var d=document.documentElement,m=window.matchMedia("(prefers-color-scheme: dark)");function apply(){var p=null;try{p=localStorage.getItem("${THEME_STORAGE_KEY}");}catch(e){}var dark=p==="dark"||(p!=="light"&&m.matches);d.classList.toggle("dark",dark);d.style.colorScheme=dark?"dark":"light";}apply();m.addEventListener("change",apply);window.addEventListener("storage",apply);window.addEventListener("${THEME_CHANGE_EVENT}",apply);})();`;
}
