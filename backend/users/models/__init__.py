#!/usr/bin/env python3
'''
Module for importing all the User models to make them accessible from the users.models package
'''
from .user import CustomUser
from .student import StudentUser
from .instructor import Instructor
from .student_instructor_rating import StudentInstructorRating, ParentInstructorRating
