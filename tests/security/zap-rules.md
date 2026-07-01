# CloudBuilder — OWASP ZAP Alert Rules Reference

## ADR-036 Layer 11: Penetration/Security Testing

### Active Scan Rules (Enabled)

| Rule ID | Rule Name | Risk | Category |
|---------|-----------|------|----------|
| 40012 | Cross Site Scripting (Reflected) | High | XSS |
| 40014 | Cross Site Scripting (Persistent) | High | XSS |
| 40016 | Cross Site Scripting (DOM Based) | Medium | XSS |
| 40018 | SQL Injection | High | Injection |
| 40019 | SQL Injection (MySQL) | High | Injection |
| 40020 | SQL Injection (Hypersonic) | High | Injection |
| 40021 | SQL Injection (Oracle) | High | Injection |
| 40022 | SQL Injection (PostgreSQL) | High | Injection |
| 40024 | SQL Injection (SQLite) | High | Injection |
| 40026 | Cross Site Request Forgery | Medium | CSRF |
| 40028 | ELMAH Information Leak | Low | Info Leak |
| 40032 | .htaccess Information Leak | Low | Info Leak |
| 40034 | Advanced SQL Injection | High | Injection |
| 40035 | Remote OS Command Injection | High | Injection |
| 40036 | Server Side Code Injection | High | Injection |
| 40038 | Server Side Template Injection | Medium | Injection |
| 40039 | Server Side Template Injection (Blind) | Medium | Injection |
| 10010 | Cookie No HttpOnly Flag | Low | Cookie |
| 10011 | Cookie Without SameSite Attribute | Low | Cookie |
| 10015 | Re-examine Cache-control | Low | Misc |
| 10017 | Cross-Domain JavaScript Source | Medium | Misc |
| 10020 | X-Frame-Options Header | Medium | Misc |
| 10021 | X-Content-Type-Options Header | Low | Misc |
| 10023 | Information Disclosure | Low | Info Leak |
| 10024 | Information Disclosure - Debug Errors | Low | Info Leak |
| 10025 | Information Disclosure - Sensitive Information in URL | Medium | Info Leak |
| 10027 | Information Disclosure - Sensitive Information in HTTP Referrer | Low | Info Leak |
| 10035 | Strict Transport Security Header | Medium | Misc |
| 10036 | Server Leaks Version via X-Powered-By | Low | Info Leak |
| 10037 | Server Leaks via X-Powered-By | Low | Info Leak |
| 10038 | Content Security Policy Header | Medium | Misc |
| 10040 | Secure Pages Include Mixed Content | Medium | Misc |
| 10045 | Source Code Disclosure - /WEB-INF | High | Info Leak |
| 10048 | Server Side Code Injection - Remote OS Execution | High | Injection |
| 10050 | Detected Vulnerable JavaScript Library | Medium | Misc |
| 10053 | Absence of Anti-CSRF Tokens | Medium | CSRF |
| 10054 | Cookie Without SameSite Attribute | Low | Cookie |
| 10055 | CSP | Medium | Misc |
| 10057 | Username Hash Found | Low | Info Leak |
| 10096 | Timestamp Disclosure | Low | Info Leak |
| 10098 | Cross-Domain Misconfiguration | Medium | Misc |

### Passive Scan Rules (Enabled)

| Rule ID | Rule Name | Risk | Category |
|---------|-----------|------|----------|
| 10010 | Cookie No HttpOnly Flag | Low | Cookie |
| 10011 | Cookie Without SameSite | Low | Cookie |
| 10015 | Re-examine Cache-control | Low | Misc |
| 10017 | Cross-Domain JavaScript | Medium | Misc |
| 10020 | X-Frame-Options | Medium | Misc |
| 10021 | X-Content-Type-Options | Low | Misc |
| 10023 | Information Disclosure | Low | Info Leak |
| 10024 | Debug Errors | Low | Info Leak |
| 10025 | Sensitive Info in URL | Medium | Info Leak |
| 10035 | HSTS Header | Medium | Misc |
| 10036 | X-Powered-By | Low | Info Leak |
| 10037 | Server Header | Low | Info Leak |
| 10038 | CSP Header | Medium | Misc |

### Excluded Rules (CI Speed)

| Rule ID | Rule Name | Reason |
|---------|-----------|--------|
| 40012 | XSS (Reflected) - Full | Too slow for CI |
| 40014 | XSS (Persistent) - Full | Too slow for CI |
| 90033 | Slow HTTP DoS | DoS testing |
| 10105 | Weak Authentication | Functional, not security |
