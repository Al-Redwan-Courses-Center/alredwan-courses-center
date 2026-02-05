from django_filters import FilterSet
from courses.models import Course

"""

    filterset_fields = ['is_active', 'season',
                        'instructor', 'for_adults', 'tags']
"""


class CoursePriceFilter(FilterSet):
    """FilterSet for filtering courses by price range"""
    class Meta:
        model = Course
        fields = {
            'price': ['gte', 'lte'],
            'is_active': ['exact'],
            'season': ['exact'],
            'instructor': ['exact'],
            'for_adults': ['exact'],
            'tags': ['exact'],
            'name': ['icontains'],
            'description': ['icontains'],

        }
