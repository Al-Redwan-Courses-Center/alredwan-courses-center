#!/usr/bin/env python3
''' ASGI config for Redwan_courses_center project. '''
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
import attendance.urls

application = ProtocolTypeRouter({
    "websocket": AuthMiddlewareStack(
        URLRouter(attendance.urls.websocket_urlpatterns)
    ),
})
