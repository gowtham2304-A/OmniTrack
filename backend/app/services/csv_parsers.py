import pandas as pd
from typing import List, Dict, Any

class CSVParserError(Exception):
    pass

def _parse_csv_file(file_path: str, required_columns: List[str]) -> pd.DataFrame:
    """Helper method to load CSV and validate columns"""
    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        raise CSVParserError(f"Failed to read CSV file: {e}")
        
    missing_cols = [col for col in required_columns if col not in df.columns]
    if missing_cols:
        raise CSVParserError(f"Missing required columns in CSV: {missing_cols}")
        
    return df

def parse_meesho_orders(file_path: str) -> List[Dict[str, Any]]:
    """Supplier Panel > My Orders > Download Report"""
    columns = ['Sub Order No', 'Product Name', 'Quantity', 'Final Selling Price', 'Order Date', 'Status', 'Return Status']
    df = _parse_csv_file(file_path, columns)
    
    parsed_orders = []
    for _, row in df.iterrows():
        parsed_orders.append({
            'order_id': str(row['Sub Order No']),
            'product_name': str(row['Product Name']),
            'quantity': int(row.get('Quantity', 1)),
            'gross_revenue': float(row.get('Final Selling Price', 0.0)),
            'order_date': row['Order Date'],
            'return_status': str(row.get('Return Status', '')).lower() in ['returned', 'rto', 'rts'],
            'status': str(row['Status'])
        })
    return parsed_orders

def parse_amazon_orders(file_path: str) -> List[Dict[str, Any]]:
    """Seller Central > Reports > Orders"""
    columns = ['amazon-order-id', 'sku', 'product-name', 'quantity-purchased', 'item-price', 'purchase-date']
    df = _parse_csv_file(file_path, columns)
    
    parsed_orders = []
    for _, row in df.iterrows():
        parsed_orders.append({
            'order_id': str(row['amazon-order-id']),
            'sku': str(row['sku']),
            'product_name': str(row['product-name']),
            'quantity': int(row.get('quantity-purchased', 1)),
            'gross_revenue': float(row.get('item-price', 0.0)),
            'order_date': row['purchase-date'],
        })
    return parsed_orders

def parse_myntra_orders(file_path: str) -> List[Dict[str, Any]]:
    """Myntra Partner Portal > Reports"""
    columns = ['Style ID', 'Order ID', 'Selling Price', 'Order Date', 'Return Status']
    df = _parse_csv_file(file_path, columns)
    
    parsed_orders = []
    for _, row in df.iterrows():
        parsed_orders.append({
            'order_id': str(row['Order ID']),
            'sku': str(row['Style ID']),
            'gross_revenue': float(row.get('Selling Price', 0.0)),
            'order_date': row['Order Date'],
            'return_status': str(row.get('Return Status', '')).lower() == 'returned',
        })
    return parsed_orders

def parse_nykaa_orders(file_path: str) -> List[Dict[str, Any]]:
    """Nykaa Seller Portal > Reports > Order Report"""
    columns = ['SKU Code', 'Order ID', 'Sale Price', 'Order Date', 'Status']
    df = _parse_csv_file(file_path, columns)
    
    parsed_orders = []
    for _, row in df.iterrows():
        parsed_orders.append({
            'order_id': str(row['Order ID']),
            'sku': str(row['SKU Code']),
            'gross_revenue': float(row.get('Sale Price', 0.0)),
            'order_date': row['Order Date'],
            'status': str(row['Status']),
        })
    return parsed_orders
