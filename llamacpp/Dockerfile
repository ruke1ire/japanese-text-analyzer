FROM ghcr.io/ggml-org/llama.cpp:server

# Create model directory
RUN mkdir -p /models

WORKDIR /app

# Expose server port
EXPOSE 8080

# Default model file (can be overridden in docker-compose.yml)
ENV MODEL_FILE=LFM2-350M-ENJP-MT-Q4_K_M.gguf

# The model will be mounted as a volume
# Start server with the model
CMD sh -c "/app/llama-server --host 0.0.0.0 --port 8080 -m /models/${MODEL_FILE} -c 2048 --log-disable"
