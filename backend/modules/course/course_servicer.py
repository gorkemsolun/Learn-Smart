import asyncio
import grpclib.server
from .protos import course_grpc, course_pb2
from google.protobuf.json_format import ParseDict
from database.dbmanager import CourseDB

from grpclib.server import Server


class CourseServicer(course_grpc.CourseBase):
    
    async def GetAllCourses(self, stream: 'grpclib.server.Stream[course_pb2.AllCoursesDBRequest, course_pb2.AllCourses]'):

        """
        Retrieves all of the courses associated with the user id from the request 

        Args:
        - request.user_id : user_id from UserDB

        Returns:
        - all of the courses associated with the user id from the request
       
        """

        #TODO: add necessary error messages
        request = await stream.recv_message()
        user_id = request.user_id
        courses = CourseDB.fetch(user_id=user_id, all=True)
        all_courses = course_pb2.AllCourses()
        
        for course in courses:
            course_instance = ParseDict(course, course_pb2.CourseInstance())
            all_courses.courses.add().CopyFrom(course_instance)
      
        
        await stream.send_message(all_courses)

async def serve():
    server = Server([CourseServicer()])
    await server.start('localhost', 50052)
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(serve())