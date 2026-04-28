"""MinIO Storage Client"""
from minio import Minio
from minio.error import S3Error
from app.core.config import settings
import io
from typing import BinaryIO


class MinioStorage:
    def __init__(self):
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        self.bucket = settings.MINIO_BUCKET
        self._ensure_bucket()

    def _ensure_bucket(self):
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
        except S3Error as e:
            raise RuntimeError(f"Failed to ensure bucket: {e}")

    def upload_file(
        self,
        object_name: str,
        data: BinaryIO,
        length: int,
        content_type: str = "application/octet-stream",
    ) -> str:
        try:
            self.client.put_object(
                self.bucket,
                object_name,
                data,
                length,
                content_type=content_type,
            )
            return f"{self.bucket}/{object_name}"
        except S3Error as e:
            raise RuntimeError(f"Failed to upload file: {e}")

    def download_file(self, object_name: str) -> bytes:
        try:
            response = self.client.get_object(self.bucket, object_name)
            return response.read()
        except S3Error as e:
            raise RuntimeError(f"Failed to download file: {e}")

    def delete_file(self, object_name: str) -> None:
        try:
            self.client.remove_object(self.bucket, object_name)
        except S3Error as e:
            raise RuntimeError(f"Failed to delete file: {e}")

    def file_exists(self, object_name: str) -> bool:
        try:
            self.client.stat_object(self.bucket, object_name)
            return True
        except S3Error:
            return False

    def get_presigned_url(self, object_name: str, expires: int = 3600) -> str:
        try:
            return self.client.presigned_get_object(self.bucket, object_name, expires)
        except S3Error as e:
            raise RuntimeError(f"Failed to generate presigned URL: {e}")


minio_storage = MinioStorage()
