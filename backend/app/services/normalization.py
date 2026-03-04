from datetime import datetime
from typing import TypedDict, Optional

class NormalizedOrder(TypedDict):
    order_id: str
    platform: str
    product_name: str
    sku: str
    quantity: int
    gross_revenue: float
    platform_fee: float
    shipping_cost: float
    cost_of_goods: float
    net_profit: float
    return_status: bool
    return_reason: Optional[str]
    order_date: datetime
    currency: str
    currency_converted_inr: float

def get_exchange_rate(currency_code: str) -> float:
    """Mock exchange rate API for INR conversion"""
    rates = {
        'USD': 83.20,
        'EUR': 89.50,
        'GBP': 105.10,
        'AED': 22.65,
        'AUD': 54.30,
        'INR': 1.0,
    }
    return rates.get(currency_code.upper(), 1.0)

def normalize_order_data(raw_order: dict, source_platform: str) -> NormalizedOrder:
    """Converts platform-specific order payloads into our unified schema"""
    order = NormalizedOrder(
        order_id="",
        platform=source_platform,
        product_name="",
        sku="",
        quantity=1,
        gross_revenue=0.0,
        platform_fee=0.0,
        shipping_cost=0.0,
        cost_of_goods=0.0,
        net_profit=0.0,
        return_status=False,
        return_reason=None,
        order_date=datetime.utcnow(),
        currency="INR",
        currency_converted_inr=0.0
    )
    
    if source_platform.lower() == "amazon":
        order['order_id'] = raw_order.get('AmazonOrderId', '')
        order['gross_revenue'] = float(raw_order.get('OrderTotal', {}).get('Amount', 0.0))
        order['currency'] = raw_order.get('OrderTotal', {}).get('CurrencyCode', 'INR')
        order['return_status'] = raw_order.get('OrderStatus') == 'Returned'
    
    elif source_platform.lower() == "shopify":
        order['order_id'] = str(raw_order.get('id', ''))
        order['gross_revenue'] = float(raw_order.get('current_total_price', 0.0))
        order['currency'] = raw_order.get('currency', 'INR')
        order['return_status'] = bool(raw_order.get('financial_status') == 'refunded')
        
    elif source_platform.lower() == "flipkart":
        order['order_id'] = raw_order.get('orderItemId', '')
        order['gross_revenue'] = float(raw_order.get('sellingPrice', 0.0))
        order['currency'] = 'INR'
    
    # Calculate INR value and Net Profit assumptions
    exchange_rate = get_exchange_rate(order['currency'])
    order['currency_converted_inr'] = order['gross_revenue'] * exchange_rate
    order['net_profit'] = order['currency_converted_inr'] - order['platform_fee'] - order['shipping_cost'] - order['cost_of_goods']
    
    return order
