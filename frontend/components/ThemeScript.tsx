// Inline script to prevent flash of wrong theme on load.
// This is a static string with no user input — safe from XSS.
export default function ThemeScript() {
  const themeScript = `(function(){var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")})()`;

  return (
    <script
      // Safe: static string literal, no user input
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: themeScript }}
    />
  );
}
