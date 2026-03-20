# Antaeus UTM Cheat Sheet

This file is an operating reference. It is not consumed by the app directly.

Use these links whenever you share Antaeus externally.

## Where UTM data goes

UTM parameters are added to the URL you share. Example:

```text
https://antaeus.app/methodology/founder-led-sales-process.html?utm_source=twitter&utm_medium=social&utm_campaign=phase10_seeding&utm_content=thread_01
```

When someone clicks that link:
1. The site captures the UTM parameters.
2. GA4 stores them as attribution data.
3. You see them later in `Reports > Acquisition > Traffic acquisition`.

## When to use UTMs

Use a UTM-tagged URL any time you share Antaeus outside the product:
- X / Twitter posts and replies
- newsletters
- Product Hunt
- Indie Hackers
- Reddit
- Slack communities
- cold email
- founder DMs
- guest posts / podcast mentions

Do not bother with UTMs for normal internal site navigation.

## Standard naming rules

Always use lowercase.
Always set these three:
- `utm_source`
- `utm_medium`
- `utm_campaign`

Use `utm_content` whenever you want to distinguish the exact asset or placement.

## Canonical values

### Sources
- `twitter`
- `newsletter`
- `producthunt`
- `indiehackers`
- `coldemail`
- `reddit`
- `slack`
- `linkedin`
- `directoutreach`

### Mediums
- `social`
- `email`
- `launch`
- `community`
- `outbound`
- `partnership`

### Campaigns
- `phase09_seo`
- `phase10_seeding`
- `phase11_cold_email`
- `launch_week`
- `newsletter_march`
- `founder_outreach_q2`
- `advisor_outreach_q2`
- `vc_platform_outreach`

### Content patterns
- `thread_01`
- `thread_02`
- `reply_01`
- `comment_01`
- `resource_drop_01`
- `cta_primary`
- `cta_footer`
- `email_01`
- `followup_01`
- `profile_link`

## Ready-to-use URLs

### Phase 09 SEO

#### Methodology index from X thread
```text
https://antaeus.app/methodology/?utm_source=twitter&utm_medium=social&utm_campaign=phase09_seo&utm_content=thread_01
```

#### Founder-led sales process from X reply
```text
https://antaeus.app/methodology/founder-led-sales-process.html?utm_source=twitter&utm_medium=social&utm_campaign=phase09_seo&utm_content=reply_01
```

#### When to hire first salesperson from newsletter
```text
https://antaeus.app/methodology/when-to-hire-first-sales-person-startup.html?utm_source=newsletter&utm_medium=email&utm_campaign=phase09_seo&utm_content=cta_primary
```

#### Enterprise discovery page from LinkedIn post
```text
https://antaeus.app/methodology/enterprise-discovery-call-framework.html?utm_source=linkedin&utm_medium=social&utm_campaign=phase09_seo&utm_content=post_01
```

### Phase 10 Community Seeding

#### Indie Hackers comment to methodology index
```text
https://antaeus.app/methodology/?utm_source=indiehackers&utm_medium=community&utm_campaign=phase10_seeding&utm_content=comment_01
```

#### Reddit r/sales answer to cold-call page
```text
https://antaeus.app/methodology/cold-call-script-b2b-saas.html?utm_source=reddit&utm_medium=community&utm_campaign=phase10_seeding&utm_content=rsales_comment_01
```

#### Reddit r/startups answer to founder-led sales page
```text
https://antaeus.app/methodology/founder-led-sales-process.html?utm_source=reddit&utm_medium=community&utm_campaign=phase10_seeding&utm_content=rstartups_comment_01
```

#### Slack resource share to sales handoff kit
```text
https://antaeus.app/methodology/sales-handoff-kit.html?utm_source=slack&utm_medium=community&utm_campaign=phase10_seeding&utm_content=resource_drop_01
```

#### X reply to sales kill switch page
```text
https://antaeus.app/methodology/sales-kill-switch-framework.html?utm_source=twitter&utm_medium=social&utm_campaign=phase10_seeding&utm_content=reply_02
```

#### X thread to champion framework
```text
https://antaeus.app/methodology/sales-champion-framework.html?utm_source=twitter&utm_medium=social&utm_campaign=phase10_seeding&utm_content=thread_02
```

#### Community post to portfolio GTM assessment
```text
https://antaeus.app/methodology/portfolio-gtm-assessment.html?utm_source=slack&utm_medium=community&utm_campaign=phase10_seeding&utm_content=vc_resource_01
```

### Phase 11 Cold Email

#### Cold email to homepage
```text
https://antaeus.app/?utm_source=coldemail&utm_medium=outbound&utm_campaign=phase11_cold_email&utm_content=email_01
```

#### Cold email to demo seed
```text
https://antaeus.app/demo-seed.html?utm_source=coldemail&utm_medium=outbound&utm_campaign=phase11_cold_email&utm_content=email_01
```

#### Cold email follow-up to founder-led sales process
```text
https://antaeus.app/methodology/founder-led-sales-process.html?utm_source=coldemail&utm_medium=outbound&utm_campaign=phase11_cold_email&utm_content=followup_01
```

#### Cold email to first AE playbook
```text
https://antaeus.app/methodology/first-ae-playbook.html?utm_source=coldemail&utm_medium=outbound&utm_campaign=phase11_cold_email&utm_content=email_02
```

### Newsletter

#### Newsletter primary CTA to homepage
```text
https://antaeus.app/?utm_source=newsletter&utm_medium=email&utm_campaign=newsletter_march&utm_content=cta_primary
```

#### Newsletter secondary CTA to methodology index
```text
https://antaeus.app/methodology/?utm_source=newsletter&utm_medium=email&utm_campaign=newsletter_march&utm_content=cta_secondary
```

#### Newsletter product CTA to demo
```text
https://antaeus.app/demo-seed.html?utm_source=newsletter&utm_medium=email&utm_campaign=newsletter_march&utm_content=demo_cta
```

### Product Hunt

#### Product Hunt launch page to homepage
```text
https://antaeus.app/?utm_source=producthunt&utm_medium=launch&utm_campaign=launch_week&utm_content=listing
```

#### Product Hunt comment to demo seed
```text
https://antaeus.app/demo-seed.html?utm_source=producthunt&utm_medium=launch&utm_campaign=launch_week&utm_content=comment_01
```

### Founder / Advisor / VC outreach

#### Founder DM to homepage
```text
https://antaeus.app/?utm_source=directoutreach&utm_medium=outbound&utm_campaign=founder_outreach_q2&utm_content=dm_01
```

#### Advisor intro to methodology index
```text
https://antaeus.app/methodology/?utm_source=directoutreach&utm_medium=partnership&utm_campaign=advisor_outreach_q2&utm_content=intro_01
```

#### VC platform outreach to portfolio GTM assessment
```text
https://antaeus.app/methodology/portfolio-gtm-assessment.html?utm_source=directoutreach&utm_medium=partnership&utm_campaign=vc_platform_outreach&utm_content=email_01
```

## How to use this in practice

### Before you post or send something
1. Choose the destination page.
2. Choose the correct `utm_source`.
3. Choose the correct `utm_medium`.
4. Choose the initiative name for `utm_campaign`.
5. Set `utm_content` to the exact asset or placement.
6. Paste the final tagged link into your post, email, DM, or comment.

### Good example
- X thread about founder-led sales
- Destination: founder-led sales methodology page
- Result:
```text
https://antaeus.app/methodology/founder-led-sales-process.html?utm_source=twitter&utm_medium=social&utm_campaign=phase10_seeding&utm_content=thread_01
```

### Bad example
- Random values like `utm_source=Twitter`, `utm_medium=social-media`, `utm_campaign=march`

That creates messy reporting. Keep values standardized.

## Where to read the results

In GA4:
1. Open `Reports`
2. Open `Acquisition`
3. Open `Traffic acquisition`
4. Review:
   - Session source / medium
   - Session campaign

## Optional helper already on the site

You can also generate URLs in the browser console:

```js
window.gtmAttribution.buildUrl(
  'https://antaeus.app/methodology/founder-led-sales-process.html',
  {
    source: 'twitter',
    medium: 'social',
    campaign: 'phase10_seeding',
    content: 'thread_01'
  }
);
```
