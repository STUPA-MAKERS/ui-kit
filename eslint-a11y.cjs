/**
 * The template rules of `@angular-eslint/template/accessibility`, each as an error
 * (§ui-kit:NF/accessibility/conformance/000492). The kit and every app spread them into the
 * rules of their `*.html` block: `rules: { ...a11yTemplateRules }`. angular-eslint 22 no
 * longer ships the config inside the plugin, so the rules are listed here.
 */
const a11yTemplateRules = {
  '@angular-eslint/template/alt-text': 'error',
  '@angular-eslint/template/click-events-have-key-events': 'error',
  '@angular-eslint/template/elements-content': 'error',
  '@angular-eslint/template/interactive-supports-focus': 'error',
  '@angular-eslint/template/label-has-associated-control': 'error',
  '@angular-eslint/template/mouse-events-have-key-events': 'error',
  '@angular-eslint/template/no-autofocus': 'error',
  '@angular-eslint/template/no-distracting-elements': 'error',
  '@angular-eslint/template/role-has-required-aria': 'error',
  '@angular-eslint/template/table-scope': 'error',
  '@angular-eslint/template/valid-aria': 'error',
};

module.exports = { a11yTemplateRules };
