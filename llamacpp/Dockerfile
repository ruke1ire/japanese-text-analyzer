FROM ghcr.io/ggml-org/llama.cpp:server

# Create model directory
RUN mkdir -p /models

WORKDIR /app

# Expose server port
EXPOSE 8080

# The model will be mounted as a volume
# Start server with the model
CMD ["--host", "0.0.0.0", "--port", "8080", "-m", "/models/LFM2-350M-ENJP-MT-Q4_K_M.gguf", "-c", "2048", "--log-disable"]
