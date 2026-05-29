FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/nginx.conf

# Health check via gateway's own /health endpoint
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost:80/health || exit 1

EXPOSE 80
