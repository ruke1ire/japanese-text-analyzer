# Multi-stage build for cross-platform support (ARM64/AMD64)
FROM ubuntu:22.04 AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    cmake \
    curl \
    libcurl4-openssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Clone and build llama.cpp for host architecture
WORKDIR /build
RUN git clone https://github.com/ggerganov/llama.cpp.git && \
    cd llama.cpp && \
    cmake -B build -DLLAMA_CURL=ON && \
    cmake --build build --config Release -j$(nproc)

# Runtime stage
FROM ubuntu:22.04

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    libcurl4 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy llama-server binary and shared libraries from builder
COPY --from=builder /build/llama.cpp/build/bin/llama-server /app/llama-server
COPY --from=builder /build/llama.cpp/build/bin/*.so* /usr/local/lib/
RUN ldconfig

# Create model directory
RUN mkdir -p /models

WORKDIR /app

# Expose server port
EXPOSE 8080

# Default model file (can be overridden in docker-compose.yml)
ENV MODEL_FILE=LFM2-350M-ENJP-MT-Q4_K_M.gguf

# The model will be mounted as a volume
# Start server with the model
CMD ["/bin/sh", "-c", "/app/llama-server --host 0.0.0.0 --port 8080 -m /models/${MODEL_FILE} -c 2048 --log-disable"]
