# Content Guide

## Product

Required fields:

- Name and unique slug.
- Short description for cards and metadata.
- Full description.
- Category.
- Price in VND.
- Media with meaningful alt text.
- Features and usage steps.
- Purchase URL or contact fallback.

Do not publish products that imply account/cart/payment automation in phase 1.

## Blog

Use clear Vietnamese titles, a short excerpt, category, author, and SEO description. Keep article content specific to AI workflows, creator operations, voice, transcription, reup safety, and product usage.

## Review Moderation

Reviews should default to `pending`. Only approved reviews are visible publicly. Do not edit rating/comment after approval except for moderation requirements.

## CMS Permissions

The Public/API role should only read published content for products, categories, blog posts, policies, site settings, and health. Do not allow public create/update/delete on reviews or products. Review and contact submissions must pass through the frontend API routes.

## Images

Use owned or licensed images. Avoid SVG upload unless sanitization is enabled. Target WebP/AVIF for production media and keep thumbnails under the performance budget.
