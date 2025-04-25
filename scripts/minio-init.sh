#!/bin/sh

# Wait for MinIO to be ready
until mc alias set local http://minio:9000 minioadmin minioadmin; do
  echo "Waiting for MinIO..."
  sleep 3
done

# Create the bucket if it doesn't exist
if ! mc ls local | grep -q 'iom-itb'; then
  mc mb local/iom-itb
fi

# Set the bucket policy to public
mc anonymous set public local/iom-itb