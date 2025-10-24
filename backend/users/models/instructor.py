from django.db import models

# Create your models here.
'''
Table instructors { 
  id uuid [pk] 
  user_id uuid [ref: - users.id] 
  bio text 
  monthly_salary decimal(10,2)
  // instructor_type enum('supervisor','external') [default: 'external']
  hire_date date
  avg_rating decimal(3,2) [null] // Cached average from student ratings
}

'''
