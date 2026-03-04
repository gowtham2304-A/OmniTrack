import sqlite3

def check_db():
    try:
        conn = sqlite3.connect('sellerverse.db')
        cur = conn.cursor()
        
        # Check users
        cur.execute("SELECT id, email FROM users")
        users = cur.fetchall()
        print(f"Users in DB: {users}")
        
        if not users:
            print("No users found. Are you testing on the correct environment?")
            return

        user_id = users[0][0]
        
        # Check orders
        cur.execute("SELECT COUNT(*) FROM orders WHERE user_id = ?", (user_id,))
        orders_count = cur.fetchone()[0]
        print(f"Total Orders for User {user_id}: {orders_count}")

        if orders_count > 0:
            cur.execute("SELECT order_id, order_date, amount, platform_id FROM orders WHERE user_id = ? LIMIT 5", (user_id,))
            print(f"Sample Orders: {cur.fetchall()}")

        # Check metrics
        cur.execute("SELECT COUNT(*) FROM daily_platform_metrics WHERE user_id = ?", (user_id,))
        metrics_count = cur.fetchone()[0]
        print(f"Total Daily Platform Metrics for User {user_id}: {metrics_count}")

        if metrics_count > 0:
            cur.execute("SELECT date, platform_id, revenue, profit FROM daily_platform_metrics WHERE user_id = ? LIMIT 5", (user_id,))
            print(f"Sample Metrics: {cur.fetchall()}")

        # Check uploads
        cur.execute("SELECT filename, status, rows_processed FROM csv_uploads WHERE user_id = ?", (user_id,))
        print(f"CSV Uploads: {cur.fetchall()}")

        conn.close()
    except Exception as e:
        print(f"Error checking DB: {e}")

if __name__ == '__main__':
    check_db()
