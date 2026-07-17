$ErrorActionPreference = "Stop"
Set-Location 'D:\WORKING\shoponline\SOURCE\apps\web'
[Environment]::SetEnvironmentVariable('SMTP_PASSWORD', '', 'Process')
[Environment]::SetEnvironmentVariable('NEXT_PUBLIC_GA_ID', '', 'Process')
[Environment]::SetEnvironmentVariable('STRAPI_INTERNAL_URL', 'http://localhost:1337', 'Process')
[Environment]::SetEnvironmentVariable('STRAPI_API_TOKEN', '<required>', 'Process')
[Environment]::SetEnvironmentVariable('SMTP_HOST', '', 'Process')
[Environment]::SetEnvironmentVariable('CONTACT_TO_EMAIL', '', 'Process')
[Environment]::SetEnvironmentVariable('RESEND_API_KEY', '', 'Process')
[Environment]::SetEnvironmentVariable('REVALIDATE_SECRET', '', 'Process')
[Environment]::SetEnvironmentVariable('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000', 'Process')
[Environment]::SetEnvironmentVariable('CONTACT_FROM_EMAIL', '', 'Process')
[Environment]::SetEnvironmentVariable('NODE_ENV', 'development', 'Process')
[Environment]::SetEnvironmentVariable('SMTP_USER', '', 'Process')
[Environment]::SetEnvironmentVariable('SMTP_PORT', '', 'Process')
[Environment]::SetEnvironmentVariable('NEXT_PUBLIC_STRAPI_URL', 'http://localhost:1337', 'Process')
[Environment]::SetEnvironmentVariable('RATE_LIMIT_SALT', '<required>', 'Process')
pnpm dev --hostname 0.0.0.0 --port 3000
