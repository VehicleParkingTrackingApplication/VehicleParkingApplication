import time
import random
import string
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Directory where log files will be stored, from SAMPLE_DATA_PATH in .env
LOG_DIR = os.getenv("SAMPLE_DATA_PATH")
if not LOG_DIR:
    raise EnvironmentError("SAMPLE_DATA_PATH is not set in the environment.")

# Ensure the log directory exists
os.makedirs(LOG_DIR, exist_ok=True)

def random_plate(length=6):
    """Generate a random licence plate string of uppercase letters & digits."""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=length))


def generate_entry():
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H-%M-%S-%f")[:-3]  # HH-MM-SS-milliseconds
    plate = random_plate()
    confidence = random.randint(80, 95)
    speed = random.randint(5, 35)
    # Name file by date
    file_name = f"{date_str}.txt"
    # Full path in the chosen directory
    file_path = os.path.join(LOG_DIR, file_name)
    entry = f"{date_str};{time_str};{plate};AUS;{confidence};{speed};{date_str}_{time_str}_{plate}.jpg;APPROACHING"
    return file_path, entry


if __name__ == "__main__":
    try:
        while True:
            file_path, log_line = generate_entry()
            # Append the log line to daily file
            with open(file_path, "a") as f:
                f.write(log_line + "\n")
            # Wait for 1 second before next entry
            time.sleep(1)
    except KeyboardInterrupt:
        print("Logging stopped by user.")
