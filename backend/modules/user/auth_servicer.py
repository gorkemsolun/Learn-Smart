import asyncio
import grpclib.server
from .protos import auth_pb2, auth_grpc

from grpclib.server import Server
from .authentication import get_current_user
from google.protobuf.timestamp_pb2 import Timestamp


class AuthServicer(auth_grpc.AuthenticationBase):
    
    async def GetCurrentUser(self, stream: 'grpclib.server.Stream[auth_pb2.UserRequest, auth_pb2.User]'):

        """
        Retrieves the current user from auth.get_current_user by redirecting the token to it 

        Args:
        - request.token : The JWT token used for authentication.

        Returns:
        - The user associated with the provided token as a protobuf object.
        - Empty user if the token is invalid, client side raises an exception in this case.
       
        """
        request = await stream.recv_message()
        token = request.token
        user = await get_current_user(token)
        reply_user = auth_pb2.User()
        
        if user: #The user is found, populate the protobuf object
            reply_user.user_id = user["user_id"]
            #reply_user.role = user["role"]
            reply_user.nickname = user["nickname"]
            reply_user.email = user["email"]

            created_at_timestamp = Timestamp() # created_at has Timestamp type, do a conversion from datetime to timestamp
            created_at_timestamp.FromDatetime(user["created_at"])
            reply_user.created_at.CopyFrom(created_at_timestamp)

            reply_user.hashed_password = user["hashed_password"]
        
        #else; Invalid token, do nothing, client side will check email and see that it is an empty string and raise an exception

        await stream.send_message(reply_user)

async def serve():
    server = Server([AuthServicer()])
    await server.start('localhost', 50051)
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(serve())