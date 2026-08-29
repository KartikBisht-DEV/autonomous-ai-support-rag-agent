"""
Sample Enterprise Policy Documents for RAG Knowledge Base
"""

SAMPLE_DOCUMENTS = [
    {
        "filename": "Global_Return_and_Refund_Policy_2026.pdf",
        "category": "Refund & Returns",
        "content": """# GLOBAL RETURN AND REFUND POLICY (V4.2 - 2026)

## 1. Overview and Standard Return Window
Customers are eligible to initiate a return within thirty (30) calendar days from the date of package delivery. All items returned must be in their original packaging, unused, and with all protective seals, tags, and accessories intact.

## 2. Refund Processing and Timeline
- Once our fulfillment center receives and inspects the returned merchandise (typically 2-3 business days), refunds are credited back to the original method of payment within 5 to 7 business days.
- Expedited shipping fees incurred during the original order are non-refundable unless the return was necessitated by an internal shipping error or defective merchandise.

## 3. Non-Returnable and Final Sale Items
The following categories are strictly non-refundable and cannot be returned:
- Downloadable software licenses, SaaS activation keys, and digital gift cards.
- Customized, engraved, or tailor-made hardware products.
- Consumable items with broken hygienic seals (e.g., in-ear monitors, ear tips).

## 4. Restocking Fees
- Standard returns do not incur any restocking fees if initiated within 14 days.
- Heavy enterprise server hardware and oversized freight items returned between day 15 and 30 are subject to a standard 10% restocking and recalibration fee.

## 5. Instant Refund for VIP Tier Members
Customers holding Diamond and Enterprise Tier accounts qualify for Instant Refund Authorization upon carrier pickup scan, waiving the warehouse transit inspection waiting period."""
    },
    {
        "filename": "Shipping_Fulfillment_and_Tracking_Guidelines.md",
        "category": "Shipping & Logistics",
        "content": """# SHIPPING, DELIVERY & LOGISTICS GUIDELINES

## 1. Shipping Methods & Estimated Transit Times
- **Standard Ground Shipping**: 3 to 5 business days across North America and Europe. Free for orders exceeding $75.
- **Priority Express Air**: 1 to 2 business days. Flat rate of $18.99 for domestic deliveries.
- **Same-Day Courier**: Available exclusively in metropolitan areas for orders placed before 1:00 PM local time.
- **International Expedited**: 4 to 8 business days depending on customs clearance procedures.

## 2. Lost, Stolen, or Damaged in Transit
- If tracking shows 'Delivered' but the package is missing, customers must report within 7 business days. Our automated resolution system will immediately launch an investigation with carrier GPS scans.
- If verified lost or stolen, a free replacement order is dispatched within 24 hours via Priority Air, or a 100% store credit is issued.

## 3. Customs, Duties, and International Taxes
- All European Union, UK, and APAC shipments are dispatched DDP (Delivered Duty Paid). All import VAT and clearance taxes are calculated and collected at checkout so no additional fees are charged upon delivery.
- Customs clearance delays are not factored into standard shipping SLA estimates."""
    },
    {
        "filename": "Hardware_Warranty_and_Accidental_Damage_SLA.txt",
        "category": "Warranty & Repairs",
        "content": """# HARDWARE LIMITED WARRANTY & REPAIR SLA

## 1. Standard 1-Year Limited Hardware Warranty
Every new hardware device comes with a 12-month limited warranty covering defects in materials and manufacturing workmanship under normal usage.

## 2. Warranty Exclusions
- Cosmetic blemishes, scratches, dents, and normal wear and tear over time.
- Damage caused by unauthorized repair attempts, liquid submersion exceeding IPX6 ratings, or power surge damage.
- Unapproved firmware rooting or BIOS tampering.

## 3. Care+ Extended Protection Plan
- Extends manufacturer warranty to 3 full years from date of purchase.
- Includes accidental damage protection: Up to 2 incidents of drops, cracked displays, or liquid spills per 12-month period subject to a $49 replacement deductible.
- Priority replacement device shipped with overnight delivery before returning the damaged unit (Advanced Device Exchange).

## 4. Repair Turnaround Time (SLA)
- Standard Depot Repair: 5 to 7 business days from receipt.
- Care+ Tier Priority Repair: 48-hour depot turnaround or immediate express unit swap."""
    },
    {
        "filename": "SaaS_Subscription_Billing_and_Cancellation_Terms.md",
        "category": "Billing & Subscription",
        "content": """# SAAS SUBSCRIPTION, BILLING & CANCELLATION TERMS

## 1. Billing Frequency and Automatic Renewal
- Subscriptions are billed on a recurring basis (Monthly or Annually) starting from the date of the initial subscription activation.
- Subscriptions automatically renew at the end of each billing cycle unless cancelled at least 24 hours prior to the renewal timestamp.

## 2. Cancellation and Grace Periods
- Users may cancel their active plan at any time through the Billing Portal or by requesting the AI Support Agent.
- Following cancellation, service remains fully operational until the end of the current pre-paid billing cycle.
- Annual plan cancellations requested within the first 14 days of purchase receive a 100% full refund with no penalties.

## 3. Pro-Rated Upgrades & Downgrades
- When upgrading to a higher tier plan (e.g., Starter to Enterprise Pro), charges are pro-rated instantly based on remaining days.
- When downgrading, the new tier pricing will take effect at the beginning of the subsequent billing cycle.

## 4. Failed Payments & Account Suspension
- If payment fails, our billing gateway attempts automatic retries at 3, 7, and 14-day intervals.
- Data retention is guaranteed for 60 days following account suspension before permanent deletion."""
    },
    {
        "filename": "Enterprise_Support_Tier_SLA_Matrix.md",
        "category": "Enterprise SLA",
        "content": """# ENTERPRISE SUPPORT SLA MATRIX & ESCALATION LEVELS

## 1. Response Time Commitments by Tier
- **Standard Tier (Community)**: 24 to 48 hours email response time.
- **Professional Tier ($99/mo)**: 4 hours first response time (Business Hours: 9 AM - 8 PM EST).
- **Enterprise Gold Tier ($499/mo)**: 1 hour first response time (24/7/365 coverage, dedicated Slack channel).
- **Mission Critical Platinum Tier**: 15-minute guaranteed response time for Severity-1 outages with dedicated technical account manager (TAM).

## 2. Ticket Severity Levels
- **Severity 1 (Critical)**: Total system downtime, core API unavailable, widespread customer disruption.
- **Severity 2 (High)**: Major feature degradation with no immediate operational workaround.
- **Severity 3 (Medium)**: Moderate issue or non-critical bug with functional workaround available.
- **Severity 4 (Low)**: General questions, documentation inquiries, feature requests.

## 3. Autonomous Escalation Triggers
The Autonomous AI Agent automatically creates high-priority Zendesk/Jira tickets and pages on-call engineering if:
1. Grounding confidence score is lower than 40% on enterprise client queries.
2. User sentiment indicates critical outage or legal/compliance disputes.
3. User explicitly requests human escalation."""
    }
]
