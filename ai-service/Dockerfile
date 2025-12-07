FROM python:3.9-slim

WORKDIR /app

# Install build dependencies and runtime dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    pkg-config \
    python3-dev \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    libavdevice-dev \
    libavfilter-dev \
    libavformat-dev \
    libavcodec-dev \
    libswresample-dev \
    libswscale-dev \
    libavutil-dev \
    libopus-dev \
    libvpx-dev \
    libsrtp2-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --upgrade pip setuptools wheel

# Try installing av separately with verbose output
RUN pip install --no-cache-dir av --verbose || \
    (echo "Failed to install av, trying with pre-built wheel" && \
     pip install --no-cache-dir av --only-binary=av)

# Install remaining packages
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]