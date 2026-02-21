import time
import requests
import psutil
import json

# Upstash Configuration
UPSTASH_URL = "https://good-cattle-9550.upstash.io/set/pi_metrics"
UPSTASH_TOKEN = "ASVOAAImcDE0YTBlOTI5ZDQ0MDQ0NGFkOTYxYjlhMzdmODAyMmI1ZnAxOTU1MA"

def get_cpu_temp():
    try:
        with open("/sys/class/thermal/thermal_zone0/temp", "r") as f:
            return round(float(f.read()) / 1000, 1)
    except:
        return 0.0

def get_metrics():
    metrics = {
        "timestamp": int(time.time() * 1000),
        "cpu_temp": get_cpu_temp(),
        "cpu_usage": psutil.cpu_percent(interval=1),
        "memory_usage": psutil.virtual_memory().percent,
        "disk_usage": psutil.disk_usage('/').percent
    }
    return metrics

def push_metrics(metrics):
    try:
        headers = {"Authorization": f"Bearer {UPSTASH_TOKEN}"}
        # Upstash REST requires body as raw string if content-type isn't set, or JSON if key/value structure matches
        # Correct format for SET command via REST: POST /set/key value
        response = requests.post(UPSTASH_URL, headers=headers, data=json.dumps(metrics))
        if response.status_code == 200:
            print(f"✅ Data pushed: {metrics}")
        else:
            print(f"❌ Failed to push: {response.text}")
    except Exception as e:
        print(f"⚠️ Error: {e}")

if __name__ == "__main__":
    print("🚀 Starting Pi Monitor...")
    while True:
        metrics = get_metrics()
        push_metrics(metrics)
        time.sleep(5)
