import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile
from io import BytesIO

BUCKET_NAME = "" # this will be loaded from .env, once you add it delete this line
s3_client = boto3.client("s3")

def check_object_exists(bucket_name, object_key):
    try:
        s3_client.head_object(Bucket=bucket_name, Key=object_key)
        return True  # Object exists
    
    except ClientError as e:
        return False  # Object does not exist


def upload_to_s3(fid: int, file: UploadFile | BytesIO, bucket_name=BUCKET_NAME):
    """
    Uploads an UploadFile or BytesIO to an S3 bucket.

    Args:
        path (str): S3 Object key 
        file (UploadFile): The uploaded file object. It can be a BytesIO or UploadFile object.
        bucket_name (str): The S3 bucket name.

    Returns:
        dict: A success message with the file's key in S3.
    """
    try:
        # Ensure file is in the correct format
        if isinstance(file, UploadFile):
            file_obj = file.file  # Extract the actual file object
        elif isinstance(file, BytesIO):
            file_obj = file  # Already a file-like object
        else:
            raise TypeError(f"Unsupported type. Must be UploadFile or BytesIO but it is {type(file)}.")

        # Reset stream position
        file_obj.seek(0)

        # Upload the file to S3
        s3_client.upload_fileobj(file_obj, bucket_name, str(fid))
        return True
    
    except:
        return False


def delete_object(fid: int, bucket_name=BUCKET_NAME):
    try:
        return s3_client.delete_object(Bucket=bucket_name, Key=str(fid))
    
    except Exception as e:
        return False


def download_from_s3(fid: int, bucket_name=BUCKET_NAME):
    try:
        response = s3_client.get_object(Bucket=bucket_name, Key=str(fid))
        return BytesIO(response['Body'].read())
    
    except Exception as e:
        raise RuntimeError(f"Failed to download from S3: {e}")
