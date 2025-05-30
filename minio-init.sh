#!/bin/sh
set -e

echo "Configuring MinIO..."

# Wait for MinIO to be ready
until mc alias set minio http://minio:9000 "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}"; do
  echo "Waiting for MinIO to be ready..."
  sleep 2
done

echo "MinIO is ready"

# Create bucket if it doesn't exist
if ! mc ls "minio/${MINIO_BUCKET_NAME}" > /dev/null 2>&1; then
  echo "Creating bucket: ${MINIO_BUCKET_NAME}"
  mc mb "minio/${MINIO_BUCKET_NAME}"
else
  echo "Bucket ${MINIO_BUCKET_NAME} already exists"
fi

# Set public read policy for the bucket
echo "Setting public read policy for bucket: ${MINIO_BUCKET_NAME}"
mc anonymous set public "minio/${MINIO_BUCKET_NAME}"

echo "MinIO configuration completed!"
