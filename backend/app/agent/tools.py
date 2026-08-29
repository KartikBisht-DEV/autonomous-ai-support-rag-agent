import time
import random
from typing import Dict, Any, Optional

# Mock Customer & Order Database for Autonomous Tool Execution
MOCK_ORDERS = {
    "ORD-9821": {
        "order_id": "ORD-9821",
        "customer_name": "Kartik Bisht",
        "customer_email": "bishtkartik2005@gmail.com",
        "tier": "Enterprise Gold",
        "product": "QuantumEdge Pro Server Node X1",
        "purchase_date": "2026-08-15",
        "delivered_date": "2026-08-18",
        "amount_usd": 2499.00,
        "status": "Delivered",
        "carrier": "FedEx Priority Air",
        "tracking_code": "FX-884920194",
        "warranty_type": "Care+ Extended (3 Year)"
    },
    "ORD-4412": {
        "order_id": "ORD-4412",
        "customer_name": "Aditya Verma",
        "customer_email": "aditya.v@example.com",
        "tier": "Standard",
        "product": "Titan Studio Headphones (Wireless)",
        "purchase_date": "2026-07-10",
        "delivered_date": "2026-07-14",
        "amount_usd": 349.00,
        "status": "Delivered",
        "carrier": "DHL Express",
        "tracking_code": "DHL-10928374",
        "warranty_type": "Standard 1-Year"
    },
    "ORD-7731": {
        "order_id": "ORD-7731",
        "customer_name": "Sarah Connor",
        "customer_email": "sarah.c@techcorp.io",
        "tier": "Diamond VIP",
        "product": "SaaS Cloud Sync Enterprise (Annual)",
        "purchase_date": "2026-08-25",
        "delivered_date": "2026-08-25",
        "amount_usd": 1200.00,
        "status": "Active Subscription",
        "carrier": "Digital Delivery",
        "tracking_code": "N/A",
        "warranty_type": "24/7 SLA"
    }
}


class AgentTools:
    """
    Tools available to the Autonomous Agent Brain.
    """
    @staticmethod
    def lookup_order(order_id: str) -> Dict[str, Any]:
        """Fetch real-time order and shipment tracking details."""
        clean_id = order_id.upper().strip()
        order = MOCK_ORDERS.get(clean_id)
        if order:
            return {
                "success": True,
                "order": order,
                "message": f"Order {clean_id} found in live database."
            }
        return {
            "success": False,
            "error": f"Order '{order_id}' not found in billing database. Valid demo IDs: ORD-9821, ORD-4412, ORD-7731."
        }

    @staticmethod
    def calculate_refund_eligibility(
        order_id: str,
        reason: str,
        days_since_delivery: Optional[int] = None,
        is_opened: bool = False
    ) -> Dict[str, Any]:
        """Calculates policy compliance and refund payout amount according to return policy."""
        clean_id = order_id.upper().strip()
        order = MOCK_ORDERS.get(clean_id)
        
        days = days_since_delivery if days_since_delivery is not None else 11
        if order and order.get("delivered_date"):
            # Mock estimation
            days = 11

        if days > 30:
            return {
                "eligible": False,
                "refund_percentage": 0,
                "refund_amount": 0.0,
                "reason": f"Delivery was {days} days ago, exceeding the strict 30-day return policy window.",
                "policy_ref": "Global Return Policy Sec 1"
            }

        # Check VIP status
        is_vip = order and ("Gold" in order.get("tier", "") or "Diamond" in order.get("tier", ""))
        amount = order["amount_usd"] if order else 100.0

        restocking_fee = 0.0
        if days > 14 and not is_vip:
            restocking_fee = amount * 0.10

        payout = amount - restocking_fee

        return {
            "eligible": True,
            "days_elapsed": days,
            "vip_instant_payout": is_vip,
            "original_amount": amount,
            "restocking_fee": restocking_fee,
            "estimated_refund": payout,
            "currency": "USD",
            "payout_timeline": "Instant (VIP Carrier Scan)" if is_vip else "5-7 business days",
            "reason_recorded": reason
        }

    @staticmethod
    def check_warranty(serial_number: str) -> Dict[str, Any]:
        """Validates hardware warranty coverage, Care+ status, and replacement entitlement."""
        clean_sn = serial_number.upper().strip()
        return {
            "serial_number": clean_sn,
            "status": "Active Protection",
            "warranty_tier": "Care+ Extended (3-Year Coverage)",
            "expires_on": "2029-08-15",
            "accidental_damage_incidents_remaining": 2,
            "deductible_usd": 49.00,
            "eligible_for_advance_swap": True
        }

    @staticmethod
    def escalate_ticket(
        customer_email: str,
        issue_summary: str,
        severity: str = "Medium",
        category: str = "Technical"
    ) -> Dict[str, Any]:
        """Autonomous Agent Action: Dispatches high-priority ticket to Tier-2 Engineering/Support."""
        ticket_id = f"TCK-{random.randint(10000, 99999)}"
        return {
            "ticket_id": ticket_id,
            "status": "Escalated to Human On-Call",
            "assigned_team": "Enterprise VIP Support Desk",
            "sla_target_response": "15 Minutes" if severity.lower() == "critical" else "1 Hour",
            "customer_email": customer_email,
            "severity": severity,
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S UTC")
        }
