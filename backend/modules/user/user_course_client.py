from google.protobuf.json_format import MessageToDict
from .protos import course_grpc, course_pb2
from grpclib.client import Channel


async def get_all_courses(user_id):
    
    channel = Channel('localhost', 50052)
    stub = course_grpc.CourseStub(channel)
    course_db_request = course_pb2.AllCoursesDBRequest(user_id = user_id)

    courses = await stub.GetAllCourses(course_db_request)
    courses = MessageToDict(courses, preserving_proto_field_name=True) #convert to dictionary
    channel.close()

    return courses