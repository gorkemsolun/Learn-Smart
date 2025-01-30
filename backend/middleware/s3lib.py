import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile
from io import BytesIO

BUCKET_NAME = "" #this will be loaded from .env, once you add it delete this line
s3_client = boto3.client("s3")

def check_object_exists(bucket_name, object_key):
    try:
        s3_client.head_object(Bucket=bucket_name, Key=object_key)
        return True  # Object exists
    except ClientError as e:
        if e.response['Error']['Code'] == '404':
            return False  # Object does not exist

def upload_to_s3(path: str, file, bucket_name=BUCKET_NAME):
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
        s3_key = path
        
        # Ensure file is in the correct format
        if str(type(file)) == "<class 'starlette.datastructures.UploadFile'>":
            file_obj = file.file  # Extract the actual file object
        elif isinstance(file, BytesIO):
            file_obj = file  # Already a file-like object
        else:
            raise TypeError(f"Unsupported type. Must be UploadFile or BytesIO but it is {type(file)}.")

        # Reset stream position
        file_obj.seek(0)

        # Upload the file to S3
        s3_client = boto3.client('s3')
        s3_client.upload_fileobj(file_obj, bucket_name, s3_key)

    except:
        raise

def delete_object(path, bucket_name=BUCKET_NAME):
    try:
        response = s3_client.delete_object(Bucket=bucket_name, Key=path)
    except Exception as e:
        raise


def download_from_s3(path, bucket_name=BUCKET_NAME):
    try:
        response = s3_client.get_object(Bucket=bucket_name, Key=path)
        return BytesIO(response['Body'].read())
    except Exception as e:
        raise RuntimeError(f"Failed to download from S3: {e}")