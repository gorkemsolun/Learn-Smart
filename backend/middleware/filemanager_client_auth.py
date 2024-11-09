from fastapi import Depends, HTTPException, status
from . import auth_grpc, auth_pb2, oauth2_scheme
from grpclib.client import Channel

# File Manager service's function for getting the current user. Implements the client stub for auth service
# File Manager service Depends on this for authentication
async def fm_get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        detail="Could not validate credentials",
        status_code=status.HTTP_401_UNAUTHORIZED,
        headers={"WWW-Authenticate": "Bearer"},
    ) # create an exception for invalid credentials

    channel = Channel('localhost', 50051)
    stub = auth_grpc.AuthenticationStub(channel)
    user_request = auth_pb2.UserRequest(token = token)
    user = await stub.GetCurrentUser(user_request)

    if user.email == "": # Server has not populated the object, that means invalid credentials
        raise credentials_exception
        
    user_dict = {
        "user_id": user.user_id,
        "nickname": user.nickname,
        "email": user.email,
        "created_at": user.created_at,
        "hashed_password": user.hashed_password,
    } 

    channel.close()

    return user_dict