from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from users.models import CustomUser, Instructor
from parents.models import Parent, Child
from memories.models import Memory


class MemoriesAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.supervisor_user = CustomUser.objects.create_user(
            phone_number1='+201111111101',
            password='Password123!',
            first_name='Super',
            last_name='Visor',
            role='supervisor',
            is_staff=True,
            dob='1985-01-01',
            gender='male'
        )
        self.supervisor = Instructor.objects.create(
            user=self.supervisor_user,
            type=Instructor.InstructorType.SUPERVISOR,
            monthly_salary=1500
        )

        self.student_user = CustomUser.objects.create_user(
            phone_number1='+201111111102',
            password='Password123!',
            first_name='Ali',
            last_name='Student',
            role='student',
            dob='2005-05-05',
            gender='male'
        )

        self.parent_user = CustomUser.objects.create_user(
            phone_number1='+201111111103',
            password='Password123!',
            first_name='Omar',
            last_name='Parent',
            role='parent',
            dob='1975-05-05',
            gender='male'
        )
        self.parent = self.parent_user.parent_profile

        self.child = Child.objects.create(
            first_name='Youssef',
            last_name='Omar',
            primary_parent=self.parent,
            dob='2015-01-01',
            gender='male'
        )

        # Create sample memories
        self.memory1 = Memory.objects.create(
            uploaded_by=self.supervisor,
            media_type='image',
            file='https://example.com/mem1.jpg',
            caption='Sports Day Memory',
            is_active=True
        )
        self.memory1.children.add(self.child)

        self.memory2 = Memory.objects.create(
            uploaded_by=self.supervisor,
            media_type='image',
            file='https://example.com/mem2.jpg',
            caption='Art Class Memory',
            is_active=True
        )
        self.memory2.students.add(self.student_user.student_profile)

        self.inactive_memory = Memory.objects.create(
            uploaded_by=self.supervisor,
            media_type='image',
            file='https://example.com/mem3.jpg',
            caption='Deleted Memory',
            is_active=False
        )

    def test_general_feed_deterministic_ordering_and_pagination(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get('/api/memories/feed/general/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Check paginated envelope
        self.assertIn('results', data)
        self.assertEqual(data['count'], 2)
        results = data['results']
        self.assertEqual(len(results), 2)
        
        # Verify ordering is newest first (-created_at)
        self.assertEqual(results[0]['id'], str(self.memory2.id))
        self.assertEqual(results[1]['id'], str(self.memory1.id))

    def test_private_feed_for_parent(self):
        self.client.force_authenticate(user=self.parent_user)
        response = self.client.get('/api/memories/feed/private/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('results', data)
        self.assertEqual(data['count'], 1)
        self.assertEqual(data['results'][0]['id'], str(self.memory1.id))

    def test_private_feed_for_student(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get('/api/memories/feed/private/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('results', data)
        self.assertEqual(data['count'], 1)
        self.assertEqual(data['results'][0]['id'], str(self.memory2.id))
