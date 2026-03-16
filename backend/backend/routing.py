from django.urls import re_path
from django.urls import re_path

def websocket_urlpatterns():
    from api.consumers import ChatConsumer  # 👈 Đặt ở đây

    return [
        re_path(r'ws/chat/(?P<room_name>\w+)/$', ChatConsumer.as_asgi()),
    ]
