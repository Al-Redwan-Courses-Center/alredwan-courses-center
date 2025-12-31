#!/usr/bin/env python3
'''
Module for importing all the User models to make them accessible from the users.models package
'''
from .user import CustomUser
from .student import StudentUser
from .parent import Parent
from .instructor import Instructor
