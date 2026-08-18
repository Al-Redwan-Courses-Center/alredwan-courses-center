from django.shortcuts import render
from django.http import JsonResponse

# Create your views here.

def health_check(request):
    """
    Simple health check endpoint. 
    Returns 200 OK with a JSON response to confirm the server is running.
    """
    return JsonResponse({"status": "ok"})