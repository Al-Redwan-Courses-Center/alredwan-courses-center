#!/usr/bin/env python3
"""Custom pagination classes for API endpoints"""
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class CustomPageNumberPagination(PageNumberPagination):
    """
    Custom pagination class that allows clients to control page size.
    
    Query parameters:
    - page: Page number (default: 1)
    - page_size: Number of items per page (default: 10, max: 100)
    
    Example:
    - /api/courses/?page=1&page_size=20
    - /api/users/instructors/?page=2&page_size=50
    
    Response format:
    {
        "count": 100,
        "next": "http://api.example.com/resource/?page=3&page_size=20",
        "previous": "http://api.example.com/resource/?page=1&page_size=20",
        "results": [...]
    }
    """
    # Default page size
    page_size = 10
    
    # Allow client to override page size using this query parameter
    page_size_query_param = 'page_size'
    
    # Maximum page size allowed
    max_page_size = 100
    
    # Query parameter for page number
    page_query_param = 'page'
    
    def get_paginated_response(self, data):
        """
        Customize the response format to include additional metadata
        """
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'page_size': self.get_page_size(self.request),
            'results': data
        })
