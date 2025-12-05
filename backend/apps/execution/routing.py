"""
WebSocket URL routing for the execution app.
"""

from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path("ws/execute/", consumers.CodeExecutionConsumer.as_asgi()),
]
