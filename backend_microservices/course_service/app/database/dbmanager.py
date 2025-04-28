from sqlalchemy.orm import Session
from sqlalchemy import and_

from course_service.app.database.model import Course

class CourseDB:
    """
    Database interface for the Course model.
    """

    @staticmethod
    def create(
        db: Session, user_id: int, course_name: str, 
        course_code: str, course_description: str = None,
        course_syllabus_fid: int = None, 
        course_study_plan_fid: int = None,
        course_icon_fid: int = None
    ):
        """
        Create a new course in the database.

        Args:
            db (Session): The database session.
            course_name (str): The name of the course.
            course_code (str): The code of the course.
            course_description (str): The description of the course.
            user_id (int): The ID of the user who owns the course.

        Returns:
            dict: A dictionary representing the created course.

        Raises:
            ValueError: If a course with the provided name already exists for the user.
        """
        course = CourseDB.fetch(db, course_code=course_code, user_id=user_id)
        if course:
            raise ValueError(f"Course {course_code} already exists for user {user_id}")

        course = Course(
            course_name=course_name,
            course_code=course_code,
            course_description=course_description,
            user_id=user_id,
            course_syllabus_fid=course_syllabus_fid,
            course_study_plan_fid=course_study_plan_fid,
            course_icon_fid=course_icon_fid
        )  # create a new course object

        # save the user object in the database
        db.add(course)
        db.commit()
        db.refresh(course)

        return course.to_dict()


    @staticmethod
    def fetch(db: Session, **kwargs):
        """
        Fetches course information from the database based on the provided query parameters.

        Args:
            db (Session): The database session.
            course_id (int): The ID of the course.
            course_name (str): The name of the course.
            user_id (int): The ID of the user.
            course_code (str): The code of the course.
            all (bool, optional): If True, fetches all matching courses. If False (default), fetches only the first matching course.

        Returns:
            dict or list: A dictionary representing the fetched course information if `all` is False, or a list of dictionaries representing multiple courses if `all` is True. Returns None if no matching course is found.

        Raises:
            ValueError: If no query parameters are provided.
        """
        course_id = kwargs.get("course_id", None)
        course_name = kwargs.get("course_name", None)
        user_id = kwargs.get("user_id", None)
        course_code = kwargs.get("course_code", None)
        all = kwargs.get("all", False)

        if not any(
            [course_id, course_name, user_id, course_code]
        ):  # check if any query parameters are provided
            raise ValueError("No query parameters provided")

        # Create a list of filters based on the provided query parameters
        filters = []
        if course_id:
            filters.append(Course.course_id == course_id)
        if course_name:
            filters.append(Course.course_name == course_name)
        if user_id:
            filters.append(Course.user_id == user_id)
        if course_code:
            filters.append(Course.course_code == course_code)

        query = db.query(Course).filter(and_(*filters))  # apply filters to the query
        result = query.all() if all else query.first()  # fetch all courses or just the first one

        if all:
            return (
                [course.to_dict() for course in result] if result else []
            )  # return a list of course dicts

        return (
            result.to_dict() if result else None
        )  # return a single course dict or None


    @staticmethod
    def update(db: Session, course_id: int, **kwargs):
        """
        Update the course details in the database.

        Args:
            db (Session): The database session.
            course_id (int): The ID of the course to update.
            **kwargs: Keyword arguments for the fields to update. Possible keyword arguments include:
                - course_name (str): The new name for the course.
                - course_code (str): The new code for the course.
                - course_description (str): The new course_description for the course.
                - course_syllabus_fid (int): The new syllabus FID (file ID) for the course.
                - course_icon_fid (int): The new image FID for the course.
                - course_study_plan_fid (int): The new study plan FID for the course.

        Returns:
            dict: A dictionary representing the updated course details.

        Raises:
            ValueError: If the course with the specified ID is not found in the database.
        """
        course_name: str = kwargs.get("course_name", None)
        course_code: str = kwargs.get("course_code", None)
        course_description: str = kwargs.get("course_description", None)
        course_syllabus_fid: str = kwargs.get("course_syllabus_fid", None)
        course_icon_fid: str = kwargs.get("course_icon_fid", None)
        course_study_plan_fid: str = kwargs.get("course_study_plan_fid", None)

        course: Course = db.query(Course).filter(Course.course_id == course_id).first()
        if not course:
            raise ValueError(f"Course with ID {course_id} not found")

        if course_name:
            course.course_name = course_name

        if course_code:  # must be unique per user, i.e. a user can't have CS 101 twice, for example
            query_result = (
                db.query(Course)
                .filter(
                    Course.course_code == course_code,
                    Course.user_id == course.user_id,
                    Course.course_id != course.course_id,
                )
                .first()
            )
            if query_result:
                raise ValueError(f"Course with code {course_code} already exists")
            course.course_code = course_code

        if course_description is not None:
            course.course_description = course_description

        if course_syllabus_fid is not None:
            course.course_syllabus_fid = course_syllabus_fid

        if course_icon_fid is not None:
            course.course_icon_fid = course_icon_fid

        if course_study_plan_fid is not None:
            course.course_study_plan_fid = course_study_plan_fid

        db.commit()
        db.refresh(course)

        return course.to_dict()


    @staticmethod
    def delete(db: Session, **kwargs):
        """
        Deletes a course from the database.

        Args:
        - db (Session): The database session.
        - **kwargs: Additional keyword arguments for specifying query parameters.
            - course_id (int): The ID of the course to be deleted.
            - course_name (str): The name of the course to be deleted.
            - user_id (int): The ID of the user who owns the course to be deleted.
            - course_code (str): The code of the course to be deleted.
            - all (bool): Flag indicating whether to delete all matching courses or just the first one. Default is False.

        Returns:
        - list: A list of dictionaries representing the deleted courses.
        """
        course_id = kwargs.get("course_id", None)
        course_name = kwargs.get("course_name", None)
        user_id = kwargs.get("user_id", None)
        course_code = kwargs.get("course_code", None)
        all = kwargs.get("all", False)

        if not any(
            [course_id, course_name, user_id, course_code]
        ):  # check if any query parameters are provided
            raise ValueError("No query parameters provided")

        # Create a list of filters based on the provided query parameters
        filters = []
        if course_id:
            filters.append(Course.course_id == course_id)
        if course_name:
            filters.append(Course.course_name == course_name)
        if user_id:
            filters.append(Course.user_id == user_id)
        if course_code:
            filters.append(Course.course_code == course_code)

        query = db.query(Course).filter(and_(*filters))
        result = query.all() if all else [query.first()]
        if not result:
            return []

        ret = [] # list to store the deleted courses
        for course in result:
            ret.append(course.to_dict())
            db.delete(course)
        db.commit()

        return ret
